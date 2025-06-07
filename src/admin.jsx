import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminApp from './AdminApp.jsx'
import ImportExport from './components/ImportExport.jsx'
import { ToastProvider } from './components/Toast.jsx'
import './index.css'
import 'flowbite'

// Suppress emotion duplicate loading warning
if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' && 
      args[0].includes('You are loading @emotion/react when it is already loaded')
    ) {
      return // Suppress this specific warning
    }
    originalError.apply(console, args)
  }
}

// Initialize Flowbite components after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.Flowbite) {
    window.Flowbite.init();
  }
});

// Get the admin data passed from PHP
const adminData = window.mclAdminData || {}

// Determine initial tab based on URL
const getInitialTab = () => {
  // Check if there's an override in adminData (for settings page)
  if (adminData.initialTab) {
    return adminData.initialTab
  }
  
  const urlParams = new URLSearchParams(window.location.search)
  const page = urlParams.get('page')
  
  // Map WordPress admin pages to React tabs
  if (page === 'mcl_add_new' || page === 'mcl_edit_checklist') {
    return 'add-new'
  } else if (page === 'mcl_import') {
    return 'import'
  } else if (page === 'mcl_analytics') {
    return 'analytics'
  } else if (page === 'mcl_settings') {
    return 'settings'
  }
  
  return 'checklists' // default
}

// Create the root element and render the appropriate app
const root = ReactDOM.createRoot(document.getElementById('mcl-admin-root'))

root.render(
  <React.StrictMode>
    <ToastProvider position="top-right" maxToasts={3}>
      <AdminApp 
        adminData={adminData} 
        initialTab={getInitialTab()}
      />
    </ToastProvider>
  </React.StrictMode>
) 