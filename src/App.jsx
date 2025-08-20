import { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import ChecklistDrawer from './components/ChecklistDrawer'
import FloatingButtons from './components/FloatingButtons'
import TourWrapper from './components/TourWrapper'
import TourPlayback from './components/TourPlayback'
import ShortcodeRenderer from './components/ShortcodeRenderer'
import { ToastProvider } from './components/Toast.jsx'

const App = () => {
  
  const [activeChecklists, setActiveChecklists] = useState([])
  const [drawerTheme, setDrawerTheme] = useState('light')
  const [loading, setLoading] = useState(true)
  const [componentsReady, setComponentsReady] = useState(false)
  const [tourData, setTourData] = useState(null)
  const [isTourMode, setIsTourMode] = useState(false)
  const [generalSettings, setGeneralSettings] = useState({
    speed_dial_bg_color: '#374151',
    speed_dial_icon_color: '#ffffff'
  })
  const [i18n, setI18n] = useState({})

  // Helper function to get translated text
  const __ = (key, fallback) => {
    return i18n?.app?.[key] || fallback
  }

  // Utility function to wait for DOM elements (moved from mcl-boot.js)
  const waitForElement = useCallback((selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      // Check if element already exists
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      // Set up observer to watch for the element
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Set timeout
      const timeoutId = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }, [])

  // Initialize MagicChecklist bridge functionality (moved from mcl-boot.js)
  const initializeMagicChecklist = useCallback(async () => {
    // Clean up old initialization if needed
    if (window.mcl_cleanup) {
      window.mcl_cleanup();
    }

    try {
      // Wait for the essential DOM elements that React provides
      await waitForElement('#mcl-drawer');
      await waitForElement('#mcl-items');
      
      // Wait for React component to set up the global bridge
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds with 100ms intervals
      
      while (!window.mclDrawer && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        if (attempts % 10 === 0) {
          console.log(__('waitingForReactBridge', 'MCL: Waiting for React bridge...'));
        }
      }
      
      if (window.mclDrawer) {
        // Set up global reference for compatibility
        window.MagicChecklist = window.mclDrawer;
        
        // Trigger floating button binding
        if (window.mclDrawer.bindFloatingButtons) {
          window.mclDrawer.bindFloatingButtons();
        }
        
        return window.mclDrawer;
      } else {
        throw new Error(__('reactBridgeNotFound', 'React component bridge not found after waiting'));
      }

    } catch (error) {
      console.error(__('initializationFailed', 'MCL: Failed to initialize Magic Checklist:'), error);
      return null;
    }
  }, [waitForElement])

  // Check for tour mode from URL params or cookies
  const checkTourMode = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const tourModeParam = urlParams.get('mcl_tour_mode')
    const continueTourParam = urlParams.get('mcl_continue_tour')
    const tourIdParam = urlParams.get('tour_id')
    const tourModeCookie = document.cookie.split(';').find(cookie => 
      cookie.trim().startsWith('mcl_tour_mode=')
    )?.split('=')[1]

    return (tourModeParam === '1' || continueTourParam || tourIdParam || tourModeCookie === '1')
  }

  useEffect(() => {
    // Set up i18n data
    if (window.mclPublicData?.i18n || window.mclAdminData?.i18n) {
      setI18n(window.mclPublicData?.i18n || window.mclAdminData?.i18n)
    }

    // Check tour mode first
    const tourModeDetected = checkTourMode()
    setIsTourMode(tourModeDetected)

    // Load initial data and set up the existing JavaScript functionality
    const initializeApp = async () => {
      try {
        // Get the active checklists data that would normally be passed to the PHP templates
        const ajaxUrl = window.mclPublicData?.ajaxurl || window.mcl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
        const nonce = window.mclPublicData?.nonces?.mcl_admin || window.mcl_checklists?.nonce || ''
        
        const checklistResponse = await fetch(ajaxUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'mcl_get_active_checklists_data',
            nonce: nonce
          })
        })

        if (checklistResponse.ok) {
          const data = await checklistResponse.json()
          if (data.success) {
            setActiveChecklists(data.data.checklists || [])
            setDrawerTheme(data.data.theme || 'light')
          } else {
            console.warn(__('failedToLoadChecklistData', 'MCL: Failed to load checklist data:'), data)
          }
        } else {
          console.error(__('failedToFetchChecklistData', 'MCL: Failed to fetch checklist data'))
        }

        // Get general settings for floating button styling
        try {
          const settingsResponse = await fetch(ajaxUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              action: 'mcl_get_general_settings'
            })
          })

          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json()
            if (settingsData.success && settingsData.data) {
              setGeneralSettings(prevSettings => ({
                ...prevSettings,
                ...settingsData.data
              }))
            }
          }
        } catch (settingsError) {
          console.warn(__('failedToLoadGeneralSettings', 'MCL: Failed to load general settings:'), settingsError)
        }
        
        if (window.mclTourPlaybackData) {
          setTourData(window.mclTourPlaybackData)
        } else if (window.mclTourData) {
          setTourData(window.mclTourData)
        }
      } catch (error) {
        console.error(__('errorLoadingChecklistData', 'Error loading checklist data:'), error)
        // If we can't load data, try to use any existing data from the global object
        if (window.mcl_checklists?.active_checklists) {
          setActiveChecklists(window.mcl_checklists.active_checklists)
        }
        
        // Make mcl_checklists data available globally for backward compatibility
        if (window.mcl_checklists) {
          console.log(__('legacyDataAvailable', 'MCL: Legacy mcl_checklists data available:'), Object.keys(window.mcl_checklists))
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

  // Initialize the bridge functionality after React components are ready
  useEffect(() => {
    // Only initialize checklist bridge when there is at least one active checklist.
    // Otherwise the legacy mclDrawer bootstrapping churns, causing React 301 errors
    // on pages that only contain tours.
    if (!componentsReady || loading || activeChecklists.length === 0) {
      return
    }

    // Make the initialization function globally available (replacing mcl-boot.js functionality)
    window.initializeMagicChecklist = initializeMagicChecklist

    // Set up shortcode renderer function
    window.mclRenderShortcode = (container, props) => {
      const root = ReactDOM.createRoot(container)
      root.render(<ShortcodeRenderer {...props} />)
    }

    // Initialize any existing shortcodes on the page
    const initializeShortcodes = () => {
      const shortcodeContainers = document.querySelectorAll('[data-mcl-shortcode="true"]')
      shortcodeContainers.forEach(container => {
        try {
          const props = JSON.parse(container.dataset.shortcodeProps)
          window.mclRenderShortcode(container, props)
        } catch (error) {
          console.error(__('errorInitializingShortcode', 'MCL: Error initializing shortcode:'), error)
        }
      })
    }

    // Initialize shortcodes immediately and observe for new ones
    initializeShortcodes()

    // Set up observer for dynamically added shortcodes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a shortcode container
            if (node.matches && node.matches('[data-mcl-shortcode="true"]')) {
              try {
                const props = JSON.parse(node.dataset.shortcodeProps)
                window.mclRenderShortcode(node, props)
              } catch (error) {
                console.error(__('errorInitializingDynamicShortcode', 'MCL: Error initializing dynamic shortcode:'), error)
              }
            }
            // Check for shortcode containers within the added node
            const shortcodes = node.querySelectorAll && node.querySelectorAll('[data-mcl-shortcode="true"]')
            if (shortcodes) {
              shortcodes.forEach(container => {
                try {
                  const props = JSON.parse(container.dataset.shortcodeProps)
                  window.mclRenderShortcode(container, props)
                } catch (error) {
                  console.error(__('errorInitializingNestedShortcode', 'MCL: Error initializing nested shortcode:'), error)
                }
              })
            }
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Auto-initialize immediately
    const performInitialization = async () => {
      try {
        await initializeMagicChecklist()
      } catch (error) {
        console.warn(__('autoInitializationFailed', 'MCL: Auto-initialization failed:'), error)
      }
    }

    // Use requestAnimationFrame to ensure DOM is fully painted before initialization
    const initializeAfterRender = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          performInitialization()
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
  }, [componentsReady, loading, initializeMagicChecklist, activeChecklists.length])

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
            console.warn(__('failedToReinitializeButtons', 'MCL: Failed to reinitialize buttons:'), error)
          }
        } else {
          console.warn(__('mclDrawerNotAvailable', 'MCL: mclDrawer not available for button reinitialization'))
        }
      }, 100)
    }

    reinitializeButtons()
  }, [activeChecklists, componentsReady, loading])

  if (loading) {
    return null // Don't render anything while loading to avoid flicker
  }

  // Prepare tour wrapper data if in tour mode
  let tourWrapperComponent = null
  if (isTourMode) {
    const urlParams = new URLSearchParams(window.location.search)
    const tourModeParam = urlParams.get('mcl_tour_mode')
    const continueTourParam = urlParams.get('mcl_continue_tour')
    const tourIdParam = urlParams.get('tour_id')
    
    const tourWrapperData = {
      isCreatorMode: tourModeParam === '1',
      currentTourId: parseInt(tourIdParam) || 0,
      activeTours: tourData?.activeTours || [],
      continueTourId: parseInt(continueTourParam) || 0
    }

    tourWrapperComponent = (
      <ToastProvider position="top-right" maxToasts={3}>
        <TourWrapper
          adminData={window.mclPublicData || window.mclAdminData || {}}
          tourData={tourWrapperData}
        />
      </ToastProvider>
    )
  }

  return (
    <div className={`mcl-react-app ${isTourMode ? 'mcl-tour-mode' : ''}`}>
      {/* Render checklist UI only when at least one checklist is active */}
      {activeChecklists.length > 0 && (
        <>
          <ChecklistDrawer theme={drawerTheme} />
          <FloatingButtons activeChecklists={activeChecklists} settings={generalSettings} />
        </>
      )}

      {/* Tour components when in tour mode */}
      {tourWrapperComponent}

      {/* Tour playback component for regular tour playback (always mounted) */}
      {!isTourMode && (() => {
        const urlParams = new URLSearchParams(window.location.search)
        const continueTourId = parseInt(urlParams.get('mcl_continue_tour')) || 0
        const continueStep = parseInt(urlParams.get('mcl_tour_step')) || 0
        const tours = tourData?.tours || []
        
        return (
          <TourPlayback
            adminData={window.mclPublicData || window.mclAdminData || {}}
            activeTours={tours}
            continueTourId={continueTourId}
            continueStep={continueStep}
          />
        )
      })()}
    </div>
  )
}

// Ensure component has a display name for debugging
App.displayName = 'App'

export default App 