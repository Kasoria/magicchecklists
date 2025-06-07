import { useState, useEffect } from 'react'
import { Sidebar, Navbar, Dropdown, Avatar, Button, ThemeProvider } from 'flowbite-react'
import ChecklistsTable from './components/ChecklistsTable.jsx'
import ChecklistForm from './components/ChecklistForm.jsx'
import ChecklistEditor from './components/ChecklistEditor.jsx'
import Analytics from './components/Analytics.jsx'
import Settings from './components/Settings.jsx'
import ImportExport from './components/ImportExport.jsx'

const customTheme = {
  button: {
    color: {
      brand: {
        base: "text-brand-dark bg-brand-accent border border-transparent",
        hover: "hover:bg-brand-accent/90",
        focus: "focus:ring-4 focus:ring-brand-accent",
      }
    }
  }
}

const AdminApp = ({ adminData, initialTab = 'checklists' }) => {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showForm, setShowForm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [editingChecklist, setEditingChecklist] = useState(null)
  const [layoutMode, setLayoutMode] = useState('stacked')
  const [editFormRef, setEditFormRef] = useState(null)

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const serverTheme = adminData.savedTheme
    const clientTheme = localStorage.getItem('mcl-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (serverTheme && (serverTheme === 'dark' || serverTheme === 'light')) {
      setDarkMode(serverTheme === 'dark')
    } else if (clientTheme && (clientTheme === 'dark' || clientTheme === 'light')) {
      setDarkMode(clientTheme === 'dark')
    } else {
      setDarkMode(prefersDark)
    }
  }, [adminData])

  // Initialize editing state from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const checklistId = urlParams.get('checklist_id')
    const checklistType = urlParams.get('type') || 'classic'
    
    if (checklistId) {
      // Set up React editing state for all checklist types
      setEditingChecklist({ id: checklistId, type: checklistType })
      setActiveTab('add-new')
    }
  }, [])

  // Apply dark mode to document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Add body class management for mobile sidebar
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.classList.add('sidebar-open')
    } else {
      document.body.classList.remove('sidebar-open')
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('sidebar-open')
    }
  }, [sidebarOpen])

  // Handle window resize to close mobile sidebar on large screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarOpen])

  // Enhanced sidebar close handler
  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const navigationItems = [
    {
      id: 'checklists',
      label: 'All Checklists',
      icon: "M8.75 2.75h6.5c3.31 0 6 2.69 6 6v6.5c0 3.31-2.69 6-6 6h-6.5c-3.31 0-6-2.69-6-6v-6.5c0-3.31 2.69-6 6-6z M11.692 7.889h4.52M11.692 12h4.52m-4.52 4.111h4.52M8.066 8.506a.617.617 0 1 0 0-1.234a.617.617 0 0 0 0 1.234m0 4.111a.617.617 0 1 0 0-1.234a.617.617 0 0 0 0 1.234m0 4.111a.617.617 0 1 0 0-1.234a.617.617 0 0 0 0 1.234"
    },
    {
      id: 'add-new',
      label: 'Add New',
      icon: "M12 6v6m0 0v6m0-6h6m-6 0H6"
    },
    {
      id: 'import',
      label: 'Import / Export',
      icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    }
  ]

  const toggleDarkMode = () => {
    const newTheme = !darkMode ? 'dark' : 'light'
    setDarkMode(!darkMode)
    
    // Save to localStorage for immediate persistence
    localStorage.setItem('mcl-theme', newTheme)

    // Apply dark mode to document immediately
    if (!darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Save to server for cross-session persistence
    if (adminData.ajaxurl && adminData.nonces?.mcl_save_theme_mode) {
      const formData = new FormData()
      formData.append('action', 'mcl_save_theme_mode')
      formData.append('mode', newTheme)
      formData.append('_ajax_nonce', adminData.nonces.mcl_save_theme_mode)

      fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      }).then(response => {
        return response.json()
      }).then(data => {
        if (!data.success) {
          console.error('Failed to save theme preference to server:', data.data || 'Unknown error')
          // Still use localStorage as fallback
        }
      }).catch(error => {
        console.error('Failed to save theme preference to server:', error)
        // localStorage still provides fallback
      })
    } else {
      console.warn('Missing AJAX URL or nonce for saving theme preference')
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'add-new':
        // Use editing state instead of URL parameters
        const checklistId = editingChecklist?.id || null
        const checklistType = editingChecklist?.type || null
        
        return (
          <ChecklistEditor 
            adminData={adminData}
            checklistId={checklistId}
            checklistType={checklistType}
            onBackToChecklists={handleBackToChecklists}
            layoutMode={layoutMode}
            onSetFormRef={handleSetEditFormRef}
          />
        )
      case 'import':
        return <ImportExport adminData={adminData} />
      case 'analytics':
        return <Analytics adminData={adminData} />
      case 'settings':
        return <Settings adminData={adminData} />
      default:
        return <ChecklistsTable adminData={adminData} onEditChecklist={handleEditChecklist} />
    }
  }

  const handleEditChecklist = (checklistId, checklistType = 'classic') => {
    // Use React components for all checklist types
    setEditingChecklist({ id: checklistId, type: checklistType })
    setActiveTab('add-new')
    
    // Update URL without page reload
    const url = new URL(window.location)
    url.searchParams.set('checklist_id', checklistId)
    url.searchParams.set('type', checklistType)
    window.history.pushState({}, '', url)
  }

  const handleBackToChecklists = () => {
    setEditingChecklist(null)
    setActiveTab('checklists')
    
    // Update URL without page reload
    const url = new URL(window.location)
    url.searchParams.delete('checklist_id')
    url.searchParams.delete('type')
    window.history.pushState({}, '', url)
  }

  const handleLayoutToggle = () => {
    setLayoutMode(layoutMode === 'stacked' ? 'side-by-side' : 'stacked')
  }

  const handleSaveForm = () => {
    if (editFormRef && editFormRef.current && editFormRef.current.save) {
      // Use the ref's save method for components that expose it (like EditPublisherChecklist)
      editFormRef.current.save()
    } else if (editFormRef) {
      // Fallback to form submission for older components
      const form = document.getElementById('checklist-form')
      if (form) {
        form.requestSubmit()
      }
    }
  }

  const handleSetEditFormRef = (ref) => {
    setEditFormRef(ref)
  }

  return (
    <ThemeProvider theme={customTheme}>
      <div className={`flex min-h-[100vh] bg-brand-light dark:bg-brand-dark transition-colors duration-300 main-flex-container ${darkMode ? 'dark' : ''}`}>
        {/* Mobile Overlay */}
        <div
          className={`mobile-overlay ${sidebarOpen ? 'show' : ''}`}
          onClick={handleSidebarClose}
        />

        {/* Sidebar */}
        <div
          className={`sidebar-container ${sidebarOpen ? 'open' : ''} ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } transition-all duration-300 bg-white dark:bg-brand-dark border-r border-gray-200 dark:border-gray-600 lg:translate-x-0 lg:static lg:inset-0 relative flex-shrink-0 z-50`}
        >
          {/* Collapse Toggle Button - Absolutely Positioned */}
          <div className="sticky top-[32px]">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute top-5 -right-3 hidden lg:flex items-center justify-center w-6 h-6 bg-white dark:bg-brand-dark border border-gray-300 dark:border-gray-600 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-accent dark:focus:ring-blue-400 transition-colors duration-200"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>

          <div className="flex gap-2 items-center justify-between flex-shrink-0 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3 bg-brand-accent rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-dark" viewBox="0 0 7454 5159" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1951 891c21,0 40,14 47,35l29 91c1,3 4,4 6,4 3,0 5,-1 6,-4l30 -91c6,-21 25,-35 47,-35l96 0c3,0 5,-1 6,-4 1,-2 0,-5 -2,-7l-78 -56c-18,-13 -25,-35 -18,-56l30 -91c0,-3 0,-5 -3,-7 -2,-2 -5,-2 -7,0 -26,19 -55,39 -81,59 -16,11 -36,12 -52,0 -27,-19 -54,-39 -81,-59 -2,-1 -5,-1 -7,0 -2,2 -3,5 -2,7l30 91c6,21 -1,43 -18,56l-78 56c-2,2 -3,5 -2,7 0,3 3,4 5,4l97 0zm-1110 596c466,0 841,176 844,357 2,145 -240,208 -575,228 4,-39 8,-77 12,-115 141,-10 233,-34 232,-96 -2,-97 -229,-167 -512,-167 -283,0 -511,72 -511,175 0,65 92,85 232,91 4,38 8,76 13,114 -336,-13 -576,-63 -576,-215 0,-191 375,-372 841,-372zm-560 -801c291,-168 832,-168 1123,0 16,9 25,27 23,46l-81 805c-9,-3 -17,-6 -26,-9l14 -136c-327,-73 -657,-76 -983,0l14 138c-9,2 -17,5 -26,8l-81 -806c-2,-19 7,-37 23,-46zm697 -48c128,12 256,27 381,84 11,5 17,15 16,27l-23 266c-12,-109 -21,-199 -25,-241 -1,-9 -6,-16 -14,-20 -99,-54 -219,-83 -335,-116zm1137 -320c14,0 26,9 31,22l18 59c1,2 2,3 4,3 2,0 3,-1 4,-3l19 -59c4,-13 16,-22 30,-22l62 0c2,0 3,-1 4,-2 0,-2 0,-4 -2,-5l-50 -36c-11,-8 -16,-22 -11,-35l19 -59c0,-2 0,-3 -2,-4 -1,-1 -3,-2 -4,-1 -17,13 -36,25 -52,38 -10,8 -24,8 -34,1 -17,-13 -34,-26 -51,-38 -2,-2 -4,-2 -6,0 -1,1 -2,3 -1,5l21 66c5,15 0,31 -13,40l-57 41c-1,2 -2,4 -1,5 0,2 2,4 4,4l70 -1z"/>
                  <path d="M1749 5159c-3,-1 -7,-8 -9,-12 -35,-67 -70,-365 360,-1664 240,-724 508,-1407 511,-1414l-118 -64c-4,6 -417,581 -893,1149 -824,982 -1151,1128 -1272,1128l0 0c-7,0 -12,0 -18,-1 -22,-3 -55,-14 -85,-66 -144,-250 80,-1392 295,-2118 21,1 39,2 55,2 7,1 14,-2 19,-8 5,-5 7,-12 6,-19 -4,-38 -8,-76 -12,-114 -1,-11 -9,-19 -19,-22 25,-76 49,-144 72,-204 67,-10 137,-13 201,-13 102,0 217,8 318,35 -8,59 -17,118 -27,177l-12 1c-12,1 -22,10 -23,22 -5,38 -9,77 -13,115 -1,8 1,15 7,20 3,4 7,6 11,7 -47,258 -103,503 -147,669l122 54c4,-7 439,-670 964,-1325 674,-841 1208,-1304 1504,-1304 82,0 143,35 192,110 20,31 71,193 -114,1007 -101,445 -224,867 -225,871l114 66c5,-6 550,-571 1194,-1129 843,-729 1470,-1115 1812,-1115 109,0 256,33 288,321 67,619 -400,1507 -776,2220 -349,664 -625,1189 -476,1436 53,88 154,134 300,134 49,0 104,-5 165,-15 565,-92 1079,-365 1434,-598 -474,514 -1300,1275 -2039,1275 -197,0 -378,-55 -539,-164 -497,-336 124,-2056 406,-2690l-112 -73c-8,8 -764,843 -1565,1666 -470,483 -863,868 -1169,1143 -517,468 -655,504 -685,504 -1,0 -1,0 -2,0z"/>
                </svg>
              </div>
              {!sidebarCollapsed && (
                <span className="text-xl font-bold text-brand-dark dark:text-white">MagicChecklists</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {/* Mobile Close Button */}
              <button
                onClick={handleSidebarClose}
                className="p-1.5 rounded-md lg:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <nav className="px-4 pb-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id)
                      // Close mobile sidebar when navigating
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false)
                      }
                    }}
                    className={`flex items-center w-full ${sidebarCollapsed ? 'justify-center p-2' : 'p-3'} text-sm font-medium rounded-lg transition-colors duration-150 ${
                      activeTab === item.id
                        ? 'bg-brand-accent text-brand-dark dark:bg-brand-accent dark:text-brand-dark font-bold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <svg
                      className={`w-6 h-6 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'} ${
                        activeTab === item.id
                          ? 'text-brand-dark'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {!sidebarCollapsed && item.label}
                  </button>
                </li>
              ))}
            </ul>
            
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className={`flex items-center w-full ${sidebarCollapsed ? 'justify-center p-2' : 'p-3'} text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700`}
                    title={sidebarCollapsed ? 'Help' : undefined}
                  >
                    <svg
                      className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'} text-gray-500 dark:text-gray-400`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {!sidebarCollapsed && 'Help'}
                  </a>
                </li>
                <li>
                  <button
                    onClick={toggleDarkMode}
                    className={`flex items-center w-full ${sidebarCollapsed ? 'justify-center p-2' : 'p-3'} text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700`}
                    title={sidebarCollapsed ? (darkMode ? 'Switch to light mode' : 'Switch to dark mode') : undefined}
                  >
                    {darkMode ? (
                      <svg
                        className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'} text-gray-500 dark:text-gray-400`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg
                        className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'} text-gray-500 dark:text-gray-400`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    {!sidebarCollapsed && (darkMode ? 'Light Mode' : 'Dark Mode')}
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 main-content-area">
          {/* Sticky Header */}
          <header className="sticky top-[32px] z-40 bg-white dark:bg-brand-dark border-b border-gray-200 dark:border-gray-600 transition-colors duration-300 shadow-sm">
            {/* Desktop Header Layout */}
            <div className="hidden lg:flex items-center justify-between px-6 py-4">
              <div className="flex items-center">
                <div className="ml-0">
                  <h1 className="text-2xl font-extrabold text-brand-dark dark:text-white">
                    {activeTab === 'checklists' && 'All Checklists'}
                    {activeTab === 'add-new' && (
                      editingChecklist?.id ? 'Edit Checklist' : 'Add New Checklist'
                    )}
                    {activeTab === 'import' && 'Import / Export'}
                    {activeTab === 'analytics' && 'Analytics'}
                    {activeTab === 'settings' && 'Settings'}
                  </h1>
                  <p className="text-sm font-normal text-gray-600 dark:text-gray-300">
                    {activeTab === 'checklists' && 'Create and manage interactive checklists that can be accessed from anywhere on your site.'}
                    {activeTab === 'add-new' && (
                      editingChecklist?.id ? 'Modify and update your existing checklist.' : 'Create a new interactive checklist for your site.'
                    )}
                    {activeTab === 'import' && 'Import and export classic checklists in various formats.'}
                    {activeTab === 'analytics' && 'View performance metrics and usage statistics for your checklists.'}
                    {activeTab === 'settings' && 'Configure your MagicChecklists plugin settings.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {activeTab === 'add-new' && editingChecklist && (
                  <>
                    <button
                      onClick={handleLayoutToggle}
                      className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-600 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {layoutMode === 'stacked' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        )}
                      </svg>
                      {layoutMode === 'stacked' ? 'Side by Side' : 'Stacked'}
                    </button>
                    <button
                      onClick={handleBackToChecklists}
                      className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-600 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to List
                    </button>
                    <button
                      onClick={handleSaveForm}
                      className="flex-shrink-0 flex items-center justify-center px-4 py-2 text-sm font-medium text-brand-dark bg-brand-accent border border-transparent rounded-lg hover:bg-brand-accent/90 focus:outline-none focus:ring-4 focus:ring-brand-accent transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save Changes
                    </button>
                  </>
                )}

                {!(activeTab === 'add-new' && editingChecklist) && (
                  <button
                    onClick={() => window.open(`/wp-admin/admin.php?page=mcl_add_new`, '_self')}
                    className="flex-shrink-0 flex items-center justify-center px-4 py-2 text-sm font-medium text-brand-dark bg-brand-accent border border-transparent rounded-lg hover:bg-brand-accent/90 focus:outline-none focus:ring-4 focus:ring-brand-accent transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New
                  </button>
                )}
              </div>
            </div>

            {/* Mobile/Tablet Header Layout */}
            <div className="lg:hidden">
              {/* Top row - Hamburger + Title */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </button>
                  
                  <div className="ml-3">
                    <h1 className="text-lg sm:text-xl font-extrabold text-brand-dark dark:text-white">
                      {activeTab === 'checklists' && 'All Checklists'}
                      {activeTab === 'add-new' && (
                        editingChecklist?.id ? 'Edit Checklist' : 'Add New Checklist'
                      )}
                      {activeTab === 'import' && 'Import / Export'}
                      {activeTab === 'analytics' && 'Analytics'}
                      {activeTab === 'settings' && 'Settings'}
                    </h1>
                  </div>
                </div>

                {/* Primary action button - always visible on mobile */}
                {activeTab === 'add-new' && editingChecklist ? (
                  <button
                    onClick={handleSaveForm}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium text-brand-dark bg-brand-accent border border-transparent rounded-lg hover:bg-brand-accent/90 focus:outline-none focus:ring-4 focus:ring-brand-accent transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span className="hidden sm:inline">Save</span>
                  </button>
                ) : (
                  <button
                    onClick={() => window.open(`/wp-admin/admin.php?page=mcl_add_new`, '_self')}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium text-brand-dark bg-brand-accent border border-transparent rounded-lg hover:bg-brand-accent/90 focus:outline-none focus:ring-4 focus:ring-brand-accent transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="hidden sm:inline">Add New</span>
                  </button>
                )}
              </div>

              {/* Second row - Description (hidden on very small screens) */}
              <div className="hidden sm:block px-4 pb-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {activeTab === 'checklists' && 'Create and manage interactive checklists.'}
                  {activeTab === 'add-new' && (
                    editingChecklist?.id ? 'Modify and update your existing checklist.' : 'Create a new interactive checklist.'
                  )}
                  {activeTab === 'import' && 'Import and export classic checklists in various formats.'}
                  {activeTab === 'analytics' && 'View performance metrics and usage statistics.'}
                  {activeTab === 'settings' && 'Configure your plugin settings.'}
                </p>
              </div>

              {/* Bottom row - Secondary actions (only show when editing) */}
              {activeTab === 'add-new' && editingChecklist && (
                <div className="flex items-center justify-center gap-2 px-4 pb-3 border-t border-gray-200 dark:border-gray-600 pt-3">
                  <button
                    onClick={handleLayoutToggle}
                    className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {layoutMode === 'stacked' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      )}
                    </svg>
                    <span className="hidden sm:inline">{layoutMode === 'stacked' ? 'Side by Side' : 'Stacked'}</span>
                    <span className="sm:hidden">Layout</span>
                  </button>
                  
                  <button
                    onClick={handleBackToChecklists}
                    className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Back to List</span>
                    <span className="sm:hidden">Back</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Scrollable Content Area */}
          <main className="flex-1 bg-brand-light dark:bg-brand-dark transition-colors duration-300">
            <div className="container px-6 py-8 pb-12 w-[100%] max-w-none">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}

// Ensure component has a display name for debugging
AdminApp.displayName = 'AdminApp'

export default AdminApp 