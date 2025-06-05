#!/usr/bin/env node

import fs from 'fs';

// Get version from package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const packageVersion = packageJson.version;

// Read plugin file
const pluginFile = './magicchecklists.php';
let pluginContent = fs.readFileSync(pluginFile, 'utf8');

// Check current version in plugin file
const versionMatch = pluginContent.match(/Version:\s*(.+)/);
if (!versionMatch) {
  console.error('❌ Could not find version in plugin file');
  process.exit(1);
}

const currentPluginVersion = versionMatch[1].trim();

if (currentPluginVersion === packageVersion) {
  console.log(`✅ Versions are already in sync: ${packageVersion}`);
  process.exit(0);
}

console.log(`🔄 Syncing versions...`);
console.log(`   package.json: ${packageVersion}`);
console.log(`   plugin file:  ${currentPluginVersion}`);

// Update plugin file version
pluginContent = pluginContent.replace(
  /Version:\s*(.+)/,
  `Version:           ${packageVersion}`
);

// Also update the constant definition
pluginContent = pluginContent.replace(
  /define\('MAGIC_CHECKLISTS_VERSION',\s*'[^']+'\);/,
  `define('MAGIC_CHECKLISTS_VERSION', '${packageVersion}');`
);

// Write updated plugin file
fs.writeFileSync(pluginFile, pluginContent);

console.log(`✅ Updated plugin version to ${packageVersion}`);
console.log('🎉 Version sync completed!'); 