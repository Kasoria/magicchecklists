# MagicChecklists Build Process

This document explains how the React build process works for the MagicChecklists WordPress plugin.

## Development vs Production

The plugin automatically detects whether it should run in development or production mode:

- **Development Mode**: When `npm run dev` is running on localhost:3000
- **Production Mode**: When using built files from the `dist/` directory

## Development Mode

```bash
npm run dev
```

Features:
- Hot Module Replacement (HMR)
- React Fast Refresh
- Real-time code updates
- Source maps for debugging
- Loads scripts directly from Vite dev server

## Production Mode

```bash
npm run build
```

Features:
- Optimized bundles with chunking
- Minified CSS and JavaScript
- Tree-shaking for smaller bundle sizes
- Vendor chunk separation
- ES modules with proper loading order

## Plugin Distribution Build

For creating a production-ready plugin zip file:

```bash
npm run build-plugin
```

This script will:
1. ✅ Check version consistency between `package.json` and `magicchecklists.php`
2. 🔧 Automatically sync versions if they don't match
3. 🔨 Run `npm run build` to create optimized assets
4. 📋 Copy all necessary plugin files to a build directory
5. 📦 Create a zip file ready for distribution
6. 🧹 Clean up temporary files

**Output**: `magicchecklists-[version].zip` in the project root

### Manual Version Sync

If you need to sync versions manually:

```bash
npm run version-sync
```

This ensures the version in `package.json` matches the version in `magicchecklists.php`.

## File Structure

### Development Files (Not Included in Distribution)
- `src/` - React source files
- `node_modules/` - Dependencies
- `vite.config.js` - Build configuration
- `package.json` - Node.js dependencies
- Development configuration files

### Production Files (Included in Distribution)
- `dist/` - Built React assets
- `includes/` - PHP classes and functionality
- `admin/` - WordPress admin assets
- `public/` - Public-facing assets
- `assets/` - Root-level assets (fonts, images, etc.)
- `magicchecklists.php` - Main plugin file
- `licensing/` - License management

## Chunking Strategy

The build process creates optimized chunks:

- **vendor.js**: React, ReactDOM core libraries
- **flowbite.js**: Flowbite UI components
- **utils.js**: Utility libraries (drag & drop, tooltips, etc.)
- **admin.js**: Main admin application
- **main.js**: Public-facing application

## Browser Support

The build targets ES2015+ browsers with:
- Modern JavaScript modules
- CSS Grid and Flexbox
- WebP images (with fallbacks)

## Troubleshooting

### Build Issues
1. Ensure all dependencies are installed: `npm install`
2. Clear dist directory: `rm -rf dist`
3. Rebuild: `npm run build`

### Development Issues
1. Make sure dev server is running: `npm run dev`
2. Check for port conflicts (default: 3000)
3. Verify WordPress debugging is enabled

### Version Mismatch
Run `npm run version-sync` to automatically update plugin file version to match package.json.

## Environment Detection

The plugin automatically detects the environment:

```php
$this->is_dev_mode = $this->is_vite_dev_server_running();
```

This checks if the Vite dev server is accessible and switches between dev and production asset loading accordingly.

## Build Output

The build process generates:

### JavaScript Files
- `admin.js` - Main admin React application
- `main.js` - Public React application  
- `vendor-[hash].js` - React & ReactDOM
- `flowbite-[hash].js` - Flowbite components
- `utils-[hash].js` - Utility libraries (DnD, react-select, etc.)

### CSS Files
- `assets/index-[hash].css` - Combined styles including Tailwind

### Font Files
- Various `.woff2` font files for Nunito Sans

## How WordPress Loads the Scripts

The `MCL_React_Dev` class in `includes/class-mcl-react-dev.php` handles script loading:

1. **Development**: Loads from `http://localhost:3000` with ES modules
2. **Production**: Loads chunked files from `dist/` with proper dependencies

## Testing the Build

1. Run `npm run build` to create production files
2. Visit `/wp-content/plugins/magicchecklists/test-build.php` to test standalone
3. Use WordPress admin to test integrated functionality

## Troubleshooting

### "Cannot use import statement outside a module"
- This was fixed by adding `type="module"` to all script tags
- Both development and production modes now properly load ES modules

### CSS Warnings During Build
- Some complex CSS selectors may trigger warnings
- These are non-breaking and don't affect functionality
- Font files and assets are still copied correctly

### Large Bundle Sizes
- Chunking strategy splits large dependencies into separate files
- WordPress loads dependencies in correct order
- Cache-friendly with hashed filenames

## Architecture

```
Development:
Vite Dev Server → React HMR → WordPress Admin

Production:
Vite Build → Chunked Assets → WordPress Enqueue → Browser
```

The system maintains full HMR functionality in development while providing optimized, production-ready builds for deployment. 