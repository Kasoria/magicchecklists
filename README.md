# MagicChecklists React Development

This directory contains the React-based frontend for the MagicChecklists WordPress plugin, built with Vite, React, Flowbite, and TailwindCSS.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- WordPress development environment with the MagicChecklists plugin installed

### Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   This will start the development server at `http://localhost:3000` with Hot Module Replacement (HMR).

3. **Enable WordPress integration:**
   - Ensure `WP_DEBUG` is set to `true` in your WordPress config
   - The plugin will automatically detect the running Vite dev server and load scripts from it
   - If the dev server is not running, it will fall back to built files in the `dist/` directory

### Building for Production

```bash
npm run build
```

This creates optimized production files in the `dist/` directory that WordPress will use when the dev server is not running.

## 📁 Project Structure

```
├── src/
│   ├── main.jsx          # Public-facing React app entry point
│   ├── admin.jsx         # WordPress admin React app entry point
│   ├── App.jsx           # Main public app component
│   ├── AdminApp.jsx      # Main admin app component
│   ├── index.css         # Global styles with TailwindCSS
│   └── components/       # React components
│       ├── ChecklistsTable.jsx
│       └── ChecklistForm.jsx
├── dist/                 # Production build output
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # TailwindCSS configuration
├── postcss.config.js     # PostCSS configuration
└── index.html           # Development HTML file
```

## 🛠 Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Flowbite** - Component library built on Tailwind
- **Flowbite React** - React components for Flowbite

## 🔧 Development Features

### Hot Module Replacement (HMR)
- Changes to React components are reflected instantly without page refresh
- State is preserved during updates when possible

### WordPress Integration
- Automatic detection of development vs production mode
- WordPress data (nonces, AJAX URLs, etc.) is available via `window.mclAdmin`
- Scripts are properly enqueued only on plugin pages

### Development vs Production
- **Development**: Scripts loaded from Vite dev server with HMR
- **Production**: Optimized, built files served from `dist/` directory

## 📝 Component Development

### Creating New Components
1. Create components in `src/components/`
2. Use Flowbite React components for UI consistency
3. Follow the existing patterns for WordPress AJAX integration

### Example Component Structure
```jsx
import { useState } from 'react'
import { Button, Card } from 'flowbite-react'

function MyComponent({ adminData }) {
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    setLoading(true)
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'my_action',
          'nonce': adminData.nonces?.my_nonce || ''
        })
      })
      // Handle response
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <Button onClick={handleAction} disabled={loading}>
        {loading ? 'Loading...' : 'Action'}
      </Button>
    </Card>
  )
}

export default MyComponent
```

## 🎨 Styling Guidelines

### TailwindCSS Classes
- Use Tailwind utility classes for styling
- Custom components are defined in `src/index.css`
- Follow the existing patterns for WordPress admin integration

### Flowbite Components
- Use Flowbite React components for consistent UI
- Available components: Button, Card, Table, Modal, Form inputs, etc.
- See [Flowbite React documentation](https://flowbite-react.com/) for component usage

## 🔄 Migration from PHP to React

### Current Migration Status
- ✅ Development environment setup
- ✅ Basic admin interface structure
- ✅ Checklist table component
- ✅ Checklist form component
- 🚧 Individual checklist editing
- 🚧 Analytics dashboard
- 🚧 Settings management
- 🚧 Public checklist display

### Next Steps
1. Migrate existing admin views to React components
2. Integrate with existing WordPress REST API endpoints
3. Add state management (Context API or Redux if needed)
4. Implement public checklist functionality
5. Add comprehensive error handling and loading states

## 🐛 Troubleshooting

### Dev Server Not Detected
- Ensure `WP_DEBUG` is `true` in WordPress
- Check that Vite dev server is running on port 3000
- Verify no firewall is blocking localhost:3000

### Scripts Not Loading
- Check browser console for errors
- Verify admin page hooks contain 'mcl_' in the name
- Ensure React root elements are being added to the DOM

### CORS Issues
- Vite dev server is configured to allow CORS
- If issues persist, check WordPress site URL configuration

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Flowbite React Documentation](https://flowbite-react.com/)
- [WordPress Plugin Development](https://developer.wordpress.org/plugins/) 