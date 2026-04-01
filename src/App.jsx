import { useState, useEffect, useCallback, useMemo } from 'react'
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

  const contextFlags = useMemo(() => {
    if (typeof window === 'undefined') {
      return {}
    }

    return window.magicclPublicData?.context || window.magicclAdminData?.context || {}
  }, [])

  const isInIframe = useMemo(() => {
    if (typeof window === 'undefined') {
      return false
    }

    try {
      return window.self !== window.top
    } catch (error) {
      return true
    }
  }, [])

  const shouldRenderFloatingUI = useMemo(() => !isInIframe, [isInIframe])
  const isPageBuilderContext = !!contextFlags.isPageBuilder

  const floatingChecklists = useMemo(() => {
    if (!isPageBuilderContext) {
      return activeChecklists
    }

    return activeChecklists.filter((checklist) => !checklist.disableInBuilders)
  }, [activeChecklists, isPageBuilderContext])

  // Helper function to get translated text
  const __ = (key, fallback) => {
    return i18n?.app?.[key] || fallback
  }

  // Utility function to wait for DOM elements (moved from magiccl-boot.js)
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

  // Initialize MagicChecklist bridge functionality (moved from magiccl-boot.js)
  const initializeMagicChecklist = useCallback(async () => {
    // Clean up old initialization if needed
    if (window.magiccl_cleanup) {
      window.magiccl_cleanup();
    }

    try {
      // Wait for the essential DOM elements that React provides
      await waitForElement('#magiccl-drawer');
      await waitForElement('#magiccl-items');
      
      // Wait for React component to set up the global bridge
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds with 100ms intervals
      
      while (!window.magicclDrawer && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        if (attempts % 10 === 0) {
          console.log(__('waitingForReactBridge', 'MCL: Waiting for React bridge...'));
        }
      }
      
      if (window.magicclDrawer) {
        // Set up global reference for compatibility
        window.MagicChecklist = window.magicclDrawer;
        
        // Trigger floating button binding
        if (window.magicclDrawer.bindFloatingButtons) {
          window.magicclDrawer.bindFloatingButtons();
        }
        
        return window.magicclDrawer;
      } else {
        throw new Error(__('reactBridgeNotFound', 'React component bridge not found after waiting'));
      }

    } catch (error) {
      console.error(__('initializationFailed', 'MCL: Failed to initialize Magic Checklist:'), error);
      return null;
    }
  }, [waitForElement])

  // Check for tour mode from URL params or cookies
  const checkTourMode = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tourModeParam = urlParams.get('magiccl_tour_mode')
    const continueTourParam = urlParams.get('magiccl_continue_tour')
    const tourIdParam = urlParams.get('tour_id')
    const tourModeCookie = document.cookie.split(';').find(cookie => 
      cookie.trim().startsWith('magiccl_tour_mode=')
    )?.split('=')[1]

    return (tourModeParam === '1' || continueTourParam || tourIdParam || tourModeCookie === '1')
  }, [])

  useEffect(() => {
    // Set up i18n data
    if (window.magicclPublicData?.i18n || window.magicclAdminData?.i18n) {
      setI18n(window.magicclPublicData?.i18n || window.magicclAdminData?.i18n)
    }

    // Check tour mode first
    const tourModeDetected = checkTourMode()
    setIsTourMode(tourModeDetected)

    if (window.magicclTourPlaybackData) {
      setTourData(window.magicclTourPlaybackData)
    } else if (window.magicclTourData) {
      setTourData(window.magicclTourData)
    }

    if (!shouldRenderFloatingUI) {
      setLoading(false)
      return
    }

    // Load initial data and set up the existing JavaScript functionality
    const initializeApp = async () => {
      try {
        // Get the active checklists data that would normally be passed to the PHP templates
        const ajaxUrl = window.magicclPublicData?.ajaxurl || window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
        const nonce = window.magicclPublicData?.nonces?.magiccl_admin || window.magiccl_checklists?.nonce || ''
        
        const checklistResponse = await fetch(ajaxUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'magiccl_get_active_checklists_data',
            nonce: nonce
          })
        })

        if (checklistResponse.ok) {
          const data = await checklistResponse.json()
          if (data.success) {
            const normalizedChecklists = (data.data.checklists || []).map((checklist) => {
              const disableValue = checklist.disableInBuilders ?? checklist.disable_in_builders

              return {
                ...checklist,
                disableInBuilders: disableValue === true || disableValue === '1' || disableValue === 1 || disableValue === 'true'
              }
            })
            setActiveChecklists(normalizedChecklists)
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
              action: 'magiccl_get_general_settings'
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
        
        if (window.magicclTourPlaybackData) {
          setTourData(window.magicclTourPlaybackData)
        } else if (window.magicclTourData) {
          setTourData(window.magicclTourData)
        }
      } catch (error) {
        console.error(__('errorLoadingChecklistData', 'Error loading checklist data:'), error)
        // If we can't load data, try to use any existing data from the global object
        if (window.magiccl_checklists?.active_checklists) {
          const legacyChecklists = window.magiccl_checklists.active_checklists.map((checklist) => {
            const disableValue = checklist.disableInBuilders ?? checklist.disable_in_builders

            return {
              ...checklist,
              disableInBuilders: disableValue === true || disableValue === '1' || disableValue === 1 || disableValue === 'true'
            }
          })
          setActiveChecklists(legacyChecklists)
        }
        
        // Make magiccl_checklists data available globally for backward compatibility
        if (window.magiccl_checklists) {
          console.log(__('legacyDataAvailable', 'MCL: Legacy magiccl_checklists data available:'), Object.keys(window.magiccl_checklists))
        }
      } finally {
        setLoading(false)
        // Set components ready after a short delay to ensure DOM is stable
        setTimeout(() => setComponentsReady(true), 100)
      }
    }

    // Initialize the app
    initializeApp()
  }, [checkTourMode, shouldRenderFloatingUI])

  // Initialize the bridge functionality after React components are ready
  useEffect(() => {
    if (!shouldRenderFloatingUI) {
      return
    }

    // Only initialize checklist bridge when there is at least one active checklist.
    // Otherwise the legacy mclDrawer bootstrapping churns, causing React 301 errors
    // on pages that only contain tours.
    if (!componentsReady || loading || activeChecklists.length === 0) {
      return
    }

    // Make the initialization function globally available (replacing magiccl-boot.js functionality)
    window.initializeMagicChecklist = initializeMagicChecklist

    // Set up shortcode renderer function
    window.magicclRenderShortcode = (container, props) => {
      const root = ReactDOM.createRoot(container)
      root.render(<ShortcodeRenderer {...props} />)
    }

    // Initialize any existing shortcodes on the page
    const initializeShortcodes = () => {
      const shortcodeContainers = document.querySelectorAll('[data-magiccl-shortcode="true"]')
      shortcodeContainers.forEach(container => {
        try {
          const props = JSON.parse(container.dataset.shortcodeProps)
          window.magicclRenderShortcode(container, props)
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
            if (node.matches && node.matches('[data-magiccl-shortcode="true"]')) {
              try {
                const props = JSON.parse(node.dataset.shortcodeProps)
                window.magicclRenderShortcode(node, props)
              } catch (error) {
                console.error(__('errorInitializingDynamicShortcode', 'MCL: Error initializing dynamic shortcode:'), error)
              }
            }
            // Check for shortcode containers within the added node
            const shortcodes = node.querySelectorAll && node.querySelectorAll('[data-magiccl-shortcode="true"]')
            if (shortcodes) {
              shortcodes.forEach(container => {
                try {
                  const props = JSON.parse(container.dataset.shortcodeProps)
                  window.magicclRenderShortcode(container, props)
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
      if (window.magiccl_cleanup) {
        window.magiccl_cleanup()
      }
    }
  }, [shouldRenderFloatingUI, componentsReady, loading, initializeMagicChecklist, activeChecklists.length])

  // Re-initialize floating buttons when activeChecklists changes
  useEffect(() => {
    if (!shouldRenderFloatingUI) {
      return
    }

    if (!componentsReady || loading || floatingChecklists.length === 0) return

    // Re-bind floating buttons when the checklist data changes
    const reinitializeButtons = () => {
      setTimeout(() => {
        // Re-bind floating button events specifically
        if (window.magicclDrawer && window.magicclDrawer.bindFloatingButtons) {
          try {
            window.magicclDrawer.bindFloatingButtons()
            
            // Also reinitialize draggable if it exists
            if (window.magicclDrawer.draggable && window.magicclDrawer.draggable.init) {
              window.magicclDrawer.draggable.init()
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
  }, [shouldRenderFloatingUI, floatingChecklists, componentsReady, loading])

  if (loading) {
    return null // Don't render anything while loading to avoid flicker
  }

  // Prepare tour wrapper data if in tour mode
  let tourWrapperComponent = null
  if (isTourMode) {
    const urlParams = new URLSearchParams(window.location.search)
    const tourModeParam = urlParams.get('magiccl_tour_mode')
    const continueTourParam = urlParams.get('magiccl_continue_tour')
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
          adminData={window.magicclPublicData || window.magicclAdminData || {}}
          tourData={tourWrapperData}
        />
      </ToastProvider>
    )
  }

  return (
    <div className={`magiccl-react-app ${isTourMode ? 'magiccl-tour-mode' : ''}`}>
      {/* Render checklist UI only when at least one checklist is active */}
      {shouldRenderFloatingUI && activeChecklists.length > 0 && (
        <ChecklistDrawer theme={drawerTheme} />
      )}
      {shouldRenderFloatingUI && floatingChecklists.length > 0 && (
        <FloatingButtons activeChecklists={floatingChecklists} settings={generalSettings} />
      )}

      {/* Tour components when in tour mode */}
      {tourWrapperComponent}

      {/* Tour playback component for regular tour playback (always mounted) */}
      {!isTourMode && (() => {
        const urlParams = new URLSearchParams(window.location.search)
        const continueTourId = parseInt(urlParams.get('magiccl_continue_tour')) || 0
        const continueStep = parseInt(urlParams.get('magiccl_tour_step')) || 0
        const tours = tourData?.tours || []
        
        return (
          <TourPlayback
            adminData={window.magicclPublicData || window.magicclAdminData || {}}
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