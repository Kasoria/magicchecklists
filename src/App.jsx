import { useState, useEffect } from 'react'
import ChecklistDrawer from './components/ChecklistDrawer'
import FloatingButtons from './components/FloatingButtons'

const App = () => {
  const [activeChecklists, setActiveChecklists] = useState([])
  const [drawerTheme, setDrawerTheme] = useState('light')
  const [loading, setLoading] = useState(true)
  const [componentsReady, setComponentsReady] = useState(false)

  useEffect(() => {
    // Load initial data and set up the existing JavaScript functionality
    const initializeApp = async () => {
      try {
        // Get the active checklists data that would normally be passed to the PHP templates
        const response = await fetch(`${window.mclPublicData?.ajaxurl || '/wp-admin/admin-ajax.php'}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'mcl_get_active_checklists_data',
            nonce: window.mclPublicData?.nonces?.mcl_admin || ''
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setActiveChecklists(data.data.checklists || [])
            setDrawerTheme(data.data.theme || 'light')
          }
        }
      } catch (error) {
        console.error('Error loading checklist data:', error)
        // If we can't load data, try to use any existing data from the global object
        if (window.mcl_checklists?.active_checklists) {
          setActiveChecklists(window.mcl_checklists.active_checklists)
        }
      } finally {
        setLoading(false)
        // Set components ready after a short delay to ensure DOM is stable
        setTimeout(() => setComponentsReady(true), 100)
      }
    }

    // Initialize the app
    initializeApp()
  }, [])

  // Initialize existing JavaScript only after React components are ready
  useEffect(() => {
    if (!componentsReady || loading) return

    // Make the existing JavaScript initialization available globally
    window.initMCLReact = () => {
      // Only initialize if required DOM elements exist
      const checkRequiredElements = () => {
        // Check for elements that mcl-drawer.js expects
        const drawer = document.querySelector('#mcl-drawer')
        const items = document.querySelector('#mcl-items')
        const reactRoot = document.querySelector('#mcl-public-root')
        
        return drawer && items && reactRoot
      }

      if (checkRequiredElements()) {
        // First, check if the function is already available globally (loaded by WordPress)
        if (window.initializeMagicChecklist) {
          try {
            console.log('MCL: Found global initializeMagicChecklist, calling it...')
            window.initializeMagicChecklist()
          } catch (error) {
            console.warn('MCL JavaScript initialization failed:', error)
          }
        } else {
          console.warn('MCL: initializeMagicChecklist function not found, attempting fallback...')
          // Fallback: check if mclDrawer bridge is available and bind directly
          if (window.mclDrawer && window.mclDrawer.bindFloatingButtons) {
            console.log('MCL: Using direct bridge fallback')
            try {
              window.mclDrawer.bindFloatingButtons()
            } catch (error) {
              console.warn('MCL: Bridge fallback failed:', error)
            }
          } else {
            console.warn('MCL: No fallback available - neither initializeMagicChecklist nor mclDrawer found')
          }
        }
      } else {
        console.warn('MCL JavaScript initialization skipped - required DOM elements not found')
        console.warn('Missing elements:', {
          drawer: !!document.querySelector('#mcl-drawer'),
          items: !!document.querySelector('#mcl-items'),
          reactRoot: !!document.querySelector('#mcl-public-root')
        })
      }
    }

    // Use requestAnimationFrame to ensure DOM is fully painted before initialization
    const initializeAfterRender = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          console.log('MCL: About to call initMCLReact, checking state...')
          console.log('MCL: componentsReady:', componentsReady)
          console.log('MCL: loading:', loading)
          console.log('MCL: window.mclDrawer exists:', !!window.mclDrawer)
          console.log('MCL: window.initializeMagicChecklist exists:', !!window.initializeMagicChecklist)
          
          if (window.initMCLReact) {
            window.initMCLReact()
          }
        }, 200) // Increased timeout to ensure React rendering is complete
      })
    }

    initializeAfterRender()

    // Cleanup function to handle the existing JavaScript cleanup
    return () => {
      if (window.mcl_cleanup) {
        window.mcl_cleanup()
      }
    }
  }, [componentsReady, loading])

  // Re-initialize floating buttons when activeChecklists changes
  useEffect(() => {
    if (!componentsReady || loading || activeChecklists.length === 0) return

    // Re-bind floating buttons when the checklist data changes
    const reinitializeButtons = () => {
      setTimeout(() => {
        // Re-bind floating button events specifically
        if (window.mclDrawer && window.mclDrawer.bindFloatingButtons) {
          try {
            window.mclDrawer.bindFloatingButtons()
            
            // Also reinitialize draggable if it exists
            if (window.mclDrawer.draggable && window.mclDrawer.draggable.init) {
              window.mclDrawer.draggable.init()
            }
          } catch (error) {
            console.warn('MCL: Failed to re-bind floating buttons:', error)
          }
        } else {
          console.warn('MCL: mclDrawer or bindFloatingButtons not available')
        }
      }, 100)
    }

    reinitializeButtons()
  }, [activeChecklists, componentsReady, loading])

  if (loading) {
    return null // Don't render anything while loading to avoid flicker
  }

  return (
    <div className="mcl-react-app">
      {/* The ChecklistDrawer component provides the drawer structure that mcl-drawer.js expects */}
      <ChecklistDrawer theme={drawerTheme} />
      
      {/* The FloatingButtons component provides the floating button structure that mcl-drawer.js expects */}
      <FloatingButtons activeChecklists={activeChecklists} />
    </div>
  )
}

// Ensure component has a display name for debugging
App.displayName = 'App'

export default App 