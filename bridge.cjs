#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function createBridgeStructure() {
    console.log('🔧 Creating bridge structure for Managed Runtime...');
    
    const distDir = path.join(process.cwd(), 'dist');
    const buildDir = path.join(process.cwd(), 'build');
    
    // Clean and create build directory
    await fs.remove(buildDir);
    await fs.ensureDir(buildDir);
    
    // Copy package.json (required by upload.js)
    const packageJson = await fs.readJson('package.json');
    // IMPORTANT: Remove "type": "module" to ensure CommonJS compatibility
    delete packageJson.type;
    await fs.writeJson(path.join(buildDir, 'package.json'), packageJson, { spaces: 2 });
    
    // Copy the main SSR bundle (dist/server/ssr.cjs -> build/ssr.js)
    console.log('📦 Copying SSR bundle...');
    await fs.copy(
        path.join(distDir, 'server', 'ssr.js'),
        path.join(buildDir, 'ssr.js')
    );
    
    // Copy server assets
    console.log('📦 Copying server assets...');
    const serverAssetsDir = path.join(distDir, 'server', 'assets');
    if (await fs.pathExists(serverAssetsDir)) {
        await fs.copy(serverAssetsDir, path.join(buildDir, 'assets'));
    }
    
    // Create loader.js (required entry point for Managed Runtime)
    console.log('📝 Creating loader.js...');
    const loaderContent = '';
    
    await fs.writeFile(path.join(buildDir, 'loader.js'), loaderContent);
    
    // Copy static assets to static directory
    console.log('📦 Copying static assets...');
    const staticDir = path.join(buildDir, 'static');
    await fs.ensureDir(staticDir);
    
    // Copy client assets to static directory (for CDN)
    const clientAssetsDir = path.join(distDir, 'client', 'assets');
    if (await fs.pathExists(clientAssetsDir)) {
        await fs.copy(clientAssetsDir, path.join(staticDir, 'assets'));
    }
    
    // Copy favicon
    const faviconPath = path.join(distDir, 'client', 'favicon.ico');
    if (await fs.pathExists(faviconPath)) {
        await fs.copy(faviconPath, path.join(staticDir, 'ico', 'favicon.ico'));
    }
    
    // Copy RSC assets if needed
    const rscAssetsDir = path.join(distDir, 'rsc', 'assets');
    if (await fs.pathExists(rscAssetsDir)) {
        await fs.copy(rscAssetsDir, path.join(staticDir, 'rsc-assets'));
    }
    
    // Create config directory with deployment configuration
    console.log('⚙️ Creating configuration...');
    const configDir = path.join(buildDir, 'config');
    await fs.ensureDir(configDir);
    
    // Create default.js config file with ssrOnly and ssrShared patterns
    const defaultConfig = {
        ssrParameters: {
            ssrFunctionNodeVersion: '22.x',
            proxyConfigs: [
                {
                    host: 'kv7kzm78.api.commercecloud.salesforce.com',
                    path: 'api'
                },
                {
                    host: 'zzrf-001.dx.commercecloud.salesforce.com',
                    path: 'ocapi'
                }
            ]
        },
        ssrOnly: [
            "**/*.js",
            "**/*.cjs",
            "**/*.json",
            "loader.js",
            "ssr.js",
            "assets/**/*",
            "!static/**/*"
        ],
        ssrShared: [
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
        ]
    };
    
    await fs.writeFile(
        path.join(configDir, 'default.cjs'),
        `module.exports = ${JSON.stringify(defaultConfig, null, 2)};`
    );
    
    // Create a manifest file for debugging
    const manifest = {
        createdAt: new Date().toISOString(),
        sourceStructure: {
            distServer: await fs.pathExists(path.join(distDir, 'server')),
            distClient: await fs.pathExists(path.join(distDir, 'client')),
            distRsc: await fs.pathExists(path.join(distDir, 'rsc')),
            distSsr: await fs.pathExists(path.join(distDir, 'ssr'))
        },
        files: {
            loader: 'loader.js',
            ssr: 'ssr.js',
            static: await fs.readdir(staticDir).catch(() => []),
            assets: await fs.readdir(path.join(buildDir, 'assets')).catch(() => [])
        }
    };
    
    await fs.writeJson(path.join(buildDir, 'bridge-manifest.json'), manifest, { spaces: 2 });
    
    console.log('✅ Bridge structure created successfully in ./build directory');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run push -- -s my-react-router-app -t production -m "deployment message"');
    console.log('2. Or with explicit credentials: npm run push -- -u email@example.com -k YOUR_API_KEY -s my-react-router-app -t production');
    
    return buildDir;
}

// Run if called directly
if (require.main === module) {
    createBridgeStructure().catch(error => {
        console.error('❌ Error creating bridge structure:', error);
        process.exit(1);
    });
}

module.exports = { createBridgeStructure };