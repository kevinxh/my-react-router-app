#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function createBridgeStructure() {
    console.log('🔧 Creating bridge structure for Managed Runtime...');
    
    const distDir = path.join(process.cwd(), 'dist');
    
    // Ensure dist directory exists
    await fs.ensureDir(distDir);
    
    // Copy package.json (required by upload.js)
    const packageJson = await fs.readJson('package.json');
    // IMPORTANT: Remove "type": "module" to ensure CommonJS compatibility
    delete packageJson.type;
    await fs.writeJson(path.join(distDir, 'package.json'), packageJson, { spaces: 2 });
    
    // Create loader.js (required entry point for Managed Runtime)
    console.log('📝 Creating loader.js...');
    const loaderContent = '';
    await fs.writeFile(path.join(distDir, 'loader.js'), loaderContent);

    // Create ssr.js (required SSR entry point)
    console.log('📝 Creating ssr.js...');
    const ssrContent = `console.log('hello world');
module.exports = require('./rsc/index.js');`;
    await fs.writeFile(path.join(distDir, 'ssr.js'), ssrContent);
    
    // Fix assets manifest files to use CommonJS format
    console.log('🔧 Converting assets manifest files to CommonJS...');
    const manifestFiles = [
        path.join(distDir, 'rsc', '__vite_rsc_assets_manifest.js'),
        path.join(distDir, 'ssr', '__vite_rsc_assets_manifest.js')
    ];
    
    for (const manifestPath of manifestFiles) {
        if (await fs.pathExists(manifestPath)) {
            let content = await fs.readFile(manifestPath, 'utf-8');
            // Convert ESM export to CommonJS
            content = content.replace(/^export default /, 'module.exports = ');
            await fs.writeFile(manifestPath, content);
            console.log(`   ✓ Fixed ${path.relative(distDir, manifestPath)}`);
        }
    }
    
    // Create a manifest file for debugging
    const manifest = {
        createdAt: new Date().toISOString(),
        sourceStructure: {
            distClient: await fs.pathExists(path.join(distDir, 'client')),
            distRsc: await fs.pathExists(path.join(distDir, 'rsc'))
        },
        files: {
            loader: 'loader.js'
        }
    };
    
    await fs.writeJson(path.join(distDir, 'bridge-manifest.json'), manifest, { spaces: 2 });
    
    console.log('✅ Bridge structure created successfully in ./dist directory');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run push -- -s my-react-router-app -t production -m "deployment message"');
    console.log('2. Or with explicit credentials: npm run push -- -u email@example.com -k YOUR_API_KEY -s my-react-router-app -t production');
    
    return distDir;
}

// Run if called directly
if (require.main === module) {
    createBridgeStructure().catch(error => {
        console.error('❌ Error creating bridge structure:', error);
        process.exit(1);
    });
}

module.exports = { createBridgeStructure };