#!/usr/bin/env node
/**
 * STANDALONE PWA-KIT PUSH SCRIPT
 * ===============================
 * This script replicates the functionality of `pwa-kit-dev push` command in a single file.
 * It creates and uploads a bundle to Salesforce Managed Runtime.
 * 
 * HOW IT WORKS:
 * 1. Reads credentials from ~/.mobify file or command line args (--user and --key)
 * 2. Looks for a build directory (default: ./build) containing the compiled application
 * 3. Reads configuration to determine file distribution (ssrOnly vs ssrShared)
 * 4. Creates a TAR archive of the build directory
 * 5. Wraps the TAR in a JSON bundle with metadata
 * 6. Uploads the bundle to Managed Runtime via REST API
 * 7. Optionally waits for deployment to complete (--wait flag)
 * 
 * REQUIRED BUILD DIRECTORY STRUCTURE:
 * build/
 * ├── package.json          (REQUIRED: must contain "name" field for project slug)
 * ├── loader.js            (REQUIRED: entry point for Managed Runtime)
 * ├── ssr.js               (REQUIRED: server-side rendering bundle)
 * ├── main.js              (client entry point bundle)
 * ├── vendor.js            (vendor dependencies bundle)
 * ├── worker.js            (service worker)
 * ├── pages-*.js           (route-specific code-split bundles)
 * ├── [number].js          (webpack chunk files)
 * ├── static/              (static assets)
 * │   ├── ico/            (favicons)
 * │   ├── img/            (images)
 * │   ├── translations/   (compiled translations)
 * │   ├── manifest.json   (PWA manifest)
 * │   └── robots.txt      (robots file)
 * └── config/              (configuration files)
 *     ├── default.js      (default config with ssrOnly/ssrShared)
 *     ├── sites.js        (site configuration)
 *     └── [target].js     (environment-specific config)
 * 
 * CONFIGURATION LOOKUP (first found wins):
 * 1. config/[DEPLOY_TARGET].json or .js (e.g., config/production.json when --target production)
 * 2. config/default.json or .js
 * 3. package.json "mobify" object
 * 
 * EXPECTED CONFIG STRUCTURE:
 * {
 *   "ssrParameters": [],           // Environment variables passed to SSR
 *   "ssrOnly": [                   // Files only on server (not CDN)
 *     "**\/*.js",                   // Example: all JS files
 *     "**\/*.json",                 // Example: all JSON files
 *     "!static/**"                  // Example: except static directory
 *   ],
 *   "ssrShared": [                 // Files on both server and CDN
 *     "static/**\/*",               // Example: all static assets
 *     "**\/*.css",                  // Example: all CSS files
 *     "**\/*.png",                  // Example: all images
 *     "**\/*.jpg"
 *   ]
 * }
 * 
 * BUNDLE STRUCTURE (JSON sent to API):
 * {
 *   "message": "main: abc123",      // Git branch and commit or custom message
 *   "encoding": "base64",           // Always base64
 *   "data": "...",                  // Base64-encoded TAR archive
 *   "ssr_parameters": [],           // From config
 *   "ssr_only": ["file1.js", ...],  // Actual files matching ssrOnly patterns
 *   "ssr_shared": ["static/..."],   // Actual files matching ssrShared patterns
 *   "bundle_metadata": {            // Additional metadata
 *     "dependencies": {...},        // From package.json + npm ls
 *     "cc_overrides": [...]         // Template extension overrides
 *   }
 * }
 * 
 * TAR ARCHIVE STRUCTURE:
 * The TAR contains all build files prefixed with: [projectSlug]/bld/
 * Example: myproject/bld/ssr.js, myproject/bld/static/logo.png
 * 
 * CREDENTIALS:
 * - Option 1: Use --user and --key flags
 * - Option 2: Read from ~/.mobify file (JSON with username and api_key)
 * - Get credentials at: https://runtime.commercecloud.com/account/settings
 * 
 * USAGE:
 * node script.js --target production
 * node script.js --target staging --wait
 * node script.js --buildDirectory ./dist --target production
 * node script.js --user email@example.com --key YOUR_API_KEY --target production
 * 
 * DEPENDENCIES (must be installed):
 * - archiver: Creates TAR archives
 * - node-fetch: Makes HTTP requests
 * - chalk: Colored console output
 * - minimatch: Glob pattern matching
 * - validator: Email validation
 * - fs-extra: Enhanced file system operations
 */

const os = require('os')
const path = require('path')
const fs = require('fs')
const archiver = require('archiver')
const fetch = require('node-fetch')
const { URL } = require('url')
const { execSync } = require('child_process')
const chalk = require('chalk')

// Configuration
const DEFAULT_CLOUD_ORIGIN = 'https://cloud.mobify.com'
const DEFAULT_BUILD_DIR = path.join(process.cwd(), 'dist')

// Utility functions for colored output
const colors = {
    warn: 'yellow',
    error: 'red',
    success: 'cyan',
    info: 'green'
}

const fancyLog = (level, msg) => {
    const color = colors[level] || 'green'
    const colorFn = chalk[color]
    console.log(`${colorFn(level)}: ${msg}`)
}

const info = (msg) => fancyLog('info', msg)
const success = (msg) => fancyLog('success', msg)
const warn = (msg) => fancyLog('warn', msg)
const error = (msg) => fancyLog('error', msg)

// Get credentials file path
const getCredentialsFile = (cloudOrigin, credentialsFile) => {
    if (credentialsFile) {
        return credentialsFile
    } else {
        const url = new URL(cloudOrigin)
        const host = url.host
        const suffix = host === 'cloud.mobify.com' ? '' : `--${host}`
        return path.join(os.homedir(), `.mobify${suffix}`)
    }
}

// Read credentials from file
const readCredentials = async (filepath) => {
    try {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'))
        return {
            username: data.username,
            api_key: data.api_key
        }
    } catch (e) {
        throw new Error(
            `Credentials file "${filepath}" not found.\n` +
            'Visit https://runtime.commercecloud.com/account/settings for ' +
            'steps on authorizing your computer to push bundles.'
        )
    }
}

// Get project package.json
const getProjectPkg = () => {
    const p = path.join(process.cwd(), 'package.json')
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'))
    } catch {
        throw new Error(`Could not read project package at "${p}"`)
    }
}

// Walk directory recursively
const walkDir = (dir, baseDir, fileSet = new Set()) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    entries.forEach(entry => {
        const entryPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walkDir(entryPath, baseDir, fileSet)
        } else {
            fileSet.add(entryPath.replace(baseDir + path.sep, ''))
        }
    })
    
    return fileSet
}

// Get project dependency tree (simplified version)
const getProjectDependencyTree = () => {
    try {
        const tmpFile = path.join(os.tmpdir(), `npm-ls-${Date.now()}.json`)
        execSync(`npm ls --all --json > ${tmpFile}`, { stdio: 'ignore' })
        const data = JSON.parse(fs.readFileSync(tmpFile, 'utf8'))
        fs.unlinkSync(tmpFile)
        return data
    } catch (_) {
        // Don't prevent bundles from being pushed if this step fails
        return null
    }
}

// Get PWA Kit dependencies
const getPwaKitDependencies = (dependencyTree) => {
    if (!dependencyTree) return {}
    
    const pwaKitDependencies = [
        '@salesforce/pwa-kit-react-sdk',
        '@salesforce/pwa-kit-runtime',
        '@salesforce/pwa-kit-dev'
    ]
    
    const result = {}
    const searchDeps = (tree) => {
        if (tree.dependencies) {
            for (const [name, dep] of Object.entries(tree.dependencies)) {
                if (pwaKitDependencies.includes(name)) {
                    result[name] = dep.version || 'unknown'
                }
                if (dep.dependencies) {
                    searchDeps(dep)
                }
            }
        }
    }
    
    searchDeps(dependencyTree)
    return result
}

// Get config from build directory
const getConfig = (buildDirectory) => {
    const targetName = process.env.DEPLOY_TARGET || ''
    const searchPlaces = [
        targetName && `config/${targetName}.json`,
        targetName && `config/${targetName}.js`,
        'config/default.json',
        'config/default.js',
        'package.json'
    ].filter(Boolean)
    
    for (const place of searchPlaces) {
        const fullPath = path.join(buildDirectory, place)
        if (fs.existsSync(fullPath)) {
            try {
                if (place.endsWith('.json')) {
                    const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
                    if (place === 'package.json') {
                        // For package.json, look for the "mobify" object
                        return content.mobify || {}
                    }
                    return content
                } else if (place.endsWith('.js')) {
                    return require(fullPath)
                }
            } catch (e) {
                console.warn(`Failed to load config from ${fullPath}:`, e.message)
            }
        }
    }
    
    return {}
}

// Create bundle
const createBundle = async ({
    message,
    ssr_parameters,
    ssr_only,
    ssr_shared,
    buildDirectory,
    projectSlug
}) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pwa-kit-push-'))
    const destination = path.join(tmpDir, 'build.tar')
    const filesInArchive = []
    
    // Validate that SSR file patterns are defined
    // These patterns determine which files go where in the deployed bundle
    if (!ssr_only || ssr_only.length === 0 || !ssr_shared || ssr_shared.length === 0) {
        throw new Error('no ssrOnly or ssrShared files are defined')
    }
    
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(destination)
        const archive = archiver('tar')
        
        archive.pipe(output)
        
        const newRoot = path.join(projectSlug, 'bld', '')
        
        archive.directory(buildDirectory, '', (entry) => {
            if (entry.stats?.isFile() && entry.name) {
                filesInArchive.push(entry.name)
            }
            entry.prefix = newRoot
            return entry
        })
        
        archive.on('error', reject)
        
        output.on('finish', async () => {
            try {
                const pkg = getProjectPkg()
                const {
                    dependencies = {},
                    devDependencies = {},
                    ccExtensibility = {}
                } = pkg
                
                let cc_overrides = []
                if (ccExtensibility.overridesDir && ccExtensibility.extends) {
                    const extendsTemplate = 'node_modules/' + ccExtensibility.extends
                    const overridesFiles = walkDir(
                        ccExtensibility.overridesDir,
                        ccExtensibility.overridesDir
                    )
                    cc_overrides = Array.from(overridesFiles).filter(item =>
                        fs.existsSync(path.join(extendsTemplate, item))
                    )
                }
                
                const dependencyTree = getProjectDependencyTree()
                const pwaKitDeps = dependencyTree ? getPwaKitDependencies(dependencyTree) : {}
                
                const bundle_metadata = {
                    dependencies: {
                        ...dependencies,
                        ...devDependencies,
                        ...pwaKitDeps
                    },
                    cc_overrides: cc_overrides
                }
                
                const data = fs.readFileSync(destination)
                const encoding = 'base64'
                
                // Clean up temp directory
                fs.rmSync(tmpDir, { recursive: true })
                
                // Create glob matching function
                const glob = (patterns) => {
                    const Minimatch = require('minimatch').Minimatch
                    const allPatterns = (patterns || [])
                        .map(pattern => new Minimatch(pattern, { nocomment: true }))
                        .filter(pattern => !pattern.empty)
                    const positivePatterns = allPatterns.filter(pattern => !pattern.negate)
                    const negativePatterns = allPatterns.filter(pattern => pattern.negate)
                    
                    return (filePath) => {
                        if (filePath) {
                            const positive = positivePatterns.some(pattern => pattern.match(filePath))
                            const negative = negativePatterns.some(pattern => !pattern.match(filePath))
                            return positive && !negative
                        }
                        return false
                    }
                }
                
                resolve({
                    message,
                    encoding,
                    data: data.toString(encoding),
                    ssr_parameters,
                    ssr_only: filesInArchive.filter(glob(ssr_only)),
                    ssr_shared: filesInArchive.filter(glob(ssr_shared)),
                    bundle_metadata
                })
            } catch (err) {
                reject(err)
            }
        })
        
        archive.finalize()
    })
}

// Cloud API Client
class CloudAPIClient {
    constructor({ credentials, origin = DEFAULT_CLOUD_ORIGIN }) {
        this.credentials = credentials
        this.origin = origin
    }
    
    getAuthHeader() {
        const { username, api_key } = this.credentials
        const encoded = Buffer.from(`${username}:${api_key}`, 'binary').toString('base64')
        return { Authorization: `Basic ${encoded}` }
    }
    
    async getHeaders() {
        return {
            'User-Agent': 'pwa-kit-push-script@1.0.0',
            ...this.getAuthHeader()
        }
    }
    
    async push(bundle, projectSlug, target) {
        const base = `api/projects/${projectSlug}/builds/`
        const pathname = target ? base + `${target}/` : base
        const url = new URL(this.origin)
        url.pathname = pathname
        
        const body = Buffer.from(JSON.stringify(bundle))
        const headers = {
            ...(await this.getHeaders()),
            'Content-Length': body.length.toString()
        }
        
        const res = await fetch(url.toString(), {
            body,
            method: 'POST',
            headers
        })
        
        if (res.status >= 400) {
            const bodyText = await res.text()
            let errorData
            try {
                errorData = JSON.parse(bodyText)
            } catch {
                errorData = { message: bodyText }
            }
            
            throw new Error(
                `HTTP ${res.status}: ${errorData.message || bodyText}\n` +
                `For more information visit https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/pushing-and-deploying-bundles.html`
            )
        }
        
        return await res.json()
    }
    
    async waitForDeploy(project, environment) {
        return new Promise((resolve, reject) => {
            const delay = 30000 // 30 seconds
            
            const check = async () => {
                const url = new URL(
                    `/api/projects/${project}/target/${environment}`,
                    this.origin
                )
                const res = await fetch(url, { headers: await this.getHeaders() })
                
                if (!res.ok) {
                    const text = await res.text()
                    let json
                    try {
                        if (text) json = JSON.parse(text)
                    } catch (_) {}
                    const message = json?.detail ?? text
                    const detail = message ? `: ${message}` : ''
                    throw new Error(`${res.status} ${res.statusText}${detail}`)
                }
                
                const data = await res.json()
                if (typeof data.state !== 'string') {
                    return reject(new Error('An unknown state occurred when polling the deployment.'))
                }
                
                switch (data.state) {
                    case 'CREATE_IN_PROGRESS':
                    case 'PUBLISH_IN_PROGRESS':
                        setTimeout(() => check().catch(reject), delay)
                        return
                    case 'CREATE_FAILED':
                    case 'PUBLISH_FAILED':
                        return reject(new Error('Deployment failed.'))
                    case 'ACTIVE':
                        return resolve()
                    default:
                        return reject(new Error(`Unknown deployment state "${data.state}".`))
                }
            }
            
            setTimeout(() => check().catch(reject), delay)
        })
    }
}

// Get default commit message
const getDefaultMessage = () => {
    try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
        const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
        return `${branch}: ${commit}`
    } catch (err) {
        console.log('Using default bundle message as no message was provided and not in a Git repo.')
        return 'PWA Kit Bundle'
    }
}

// Main function
async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2)
    const options = {
        buildDirectory: DEFAULT_BUILD_DIR,
        message: null,
        projectSlug: null,
        target: null,
        cloudOrigin: DEFAULT_CLOUD_ORIGIN,
        credentialsFile: null,
        user: null,
        key: null,
        wait: false
    }
    
    // Simple argument parsing
    for (let i = 0; i < args.length; i++) {
        const arg = args[i]
        const nextArg = args[i + 1]
        
        switch (arg) {
            case '-b':
            case '--buildDirectory':
                options.buildDirectory = nextArg
                i++
                break
            case '-m':
            case '--message':
                options.message = nextArg
                i++
                break
            case '-s':
            case '--projectSlug':
                options.projectSlug = nextArg
                i++
                break
            case '-t':
            case '--target':
                options.target = nextArg
                i++
                break
            case '--cloud-origin':
                options.cloudOrigin = nextArg
                i++
                break
            case '-c':
            case '--credentialsFile':
                options.credentialsFile = nextArg
                i++
                break
            case '-u':
            case '--user':
                options.user = nextArg
                i++
                break
            case '-k':
            case '--key':
                options.key = nextArg
                i++
                break
            case '-w':
            case '--wait':
                options.wait = true
                break
            case '-h':
            case '--help':
                console.log(`
Standalone PWA Kit Push Script

Usage: node script.js [options]

Options:
  -b, --buildDirectory <dir>    Build directory to push (default: ./build)
  -m, --message <message>        Bundle message (default: git branch:commit)
  -s, --projectSlug <slug>       Project slug (default: from package.json name)
  -t, --target <target>          Deploy target environment
  -w, --wait                     Wait for deployment to complete
  --cloud-origin <origin>        API origin (default: https://cloud.mobify.com)
  -c, --credentialsFile <file>  Credentials file location
  -u, --user <email>             User email for Managed Runtime
  -k, --key <api-key>            API key for Managed Runtime
  -h, --help                     Show this help message

Examples:
  node script.js -t production
  node script.js -t staging -w
  node script.js -u user@example.com -k YOUR_API_KEY -t production
`)
                process.exit(0)
        }
    }
    
    try {
        // Set deployment target environment variable
        if (options.target) {
            process.env.DEPLOY_TARGET = options.target
        } else if (options.wait) {
            throw new Error('You must provide a target to deploy to when using --wait')
        }
        
        // Get credentials
        let credentials
        if (options.user && options.key) {
            credentials = {
                username: options.user,
                api_key: options.key
            }
        } else if (options.user || options.key) {
            throw new Error('You must provide both --user and --key together, or neither')
        } else {
            const credentialsPath = getCredentialsFile(options.cloudOrigin, options.credentialsFile)
            credentials = await readCredentials(credentialsPath)
        }
        
        // Check build directory exists
        if (!fs.existsSync(options.buildDirectory)) {
            throw new Error(`Build directory "${options.buildDirectory}" does not exist!`)
        }
        
        // Get configuration
        const config = getConfig(options.buildDirectory) || {}
        
        // Get project slug
        if (!options.projectSlug) {
            const pkg = getProjectPkg()
            if (!pkg.name) {
                throw new Error('Missing "name" field in package.json')
            }
            options.projectSlug = pkg.name
        }
        
        // Set default message
        if (!options.message) {
            options.message = getDefaultMessage()
        }
        
        info(`Creating bundle for project: ${options.projectSlug}`)
        
        // Create bundle
        const bundle = await createBundle({
            message: options.message,
            ssr_parameters: config.ssrParameters || {
                ssrFunctionNodeVersion: '22.x'
            },
            ssr_only: config.ssrOnly || [
                "**/*.js",
                "**/*.cjs", 
                "**/*.json",
                "loader.js",
                "ssr.js",
                "!static/**/*"
            ],
            ssr_shared: config.ssrShared || [
                "static/**/*",
                "**/*.css",
                "**/*.png", 
                "**/*.jpg",
                "**/*.jpeg",
                "**/*.gif",
                "**/*.svg",
                "**/*.ico",
                "**/*.woff",
                "**/*.woff2",
                "**/*.ttf",
                "**/*.eot"
            ],
            buildDirectory: options.buildDirectory,
            projectSlug: options.projectSlug
        })
        
        // Create API client and push
        const client = new CloudAPIClient({
            credentials,
            origin: options.cloudOrigin
        })
        
        info(`Beginning upload to ${options.cloudOrigin}`)
        const data = await client.push(bundle, options.projectSlug, options.target)
        
        console.log('data', data)
        // Handle warnings
        const warnings = data.warnings || []
        warnings.forEach(warn)
        
        if (options.wait) {
            success('Bundle uploaded - waiting for deployment to complete')
            await client.waitForDeploy(options.projectSlug, options.target)
            success('Deployment complete!')
        } else {
            success('Bundle uploaded successfully!')
        }
        
        if (data.url) {
            info(`Bundle URL: ${data.url}`)
        }
        
    } catch (err) {
        error(err.message || err.toString())
        process.exit(1)
    }
}

// Run the script
if (require.main === module) {
    main()
}