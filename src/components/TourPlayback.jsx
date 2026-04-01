import { useState, useEffect, useRef } from 'react'

// Global flag to prevent multiple TourPlayback instances
let tourPlaybackInstance = null
// Global flag to track which tours have been started to prevent duplicates
let startedTours = new Set()

const TourPlayback = ({ adminData, activeTours = [], continueTourId = 0, continueStep = 0 }) => {
  const [currentDriverInstance, setCurrentDriverInstance] = useState(null)
  const [completedTours, setCompletedTours] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)
  const [exitConfirmMessage, setExitConfirmMessage] = useState('')
  const [exitConfirmResolve, setExitConfirmResolve] = useState(null)
  
  const playbackRef = useRef(null)

  // Helper function to normalize URLs consistently across the component
  const normalizeUrl = (url, fallbackUrl = null) => {
    if (!url) return fallbackUrl || getCurrentPageUrl()
    if (url === '/wp-admin/index.php' || url === '/wp-admin/') {
      return '/wp-admin/'
    }
    return url
  }

  useEffect(() => {
    // Prevent multiple instances
    if (tourPlaybackInstance && tourPlaybackInstance !== playbackRef.current) {
      return
    }
    
    if (!isInitialized) {
      tourPlaybackInstance = playbackRef.current
      initTourPlayback()
      setIsInitialized(true)
    }
    
    return () => {
      if (currentDriverInstance) {
        try {
          currentDriverInstance.destroy()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      // Clear global instance if this was the active one
      if (tourPlaybackInstance === playbackRef.current) {
        tourPlaybackInstance = null
        // Clear the started tours set when the component unmounts
        startedTours.clear()
      }
    }
  }, [isInitialized])

  // Initialize when tour data becomes available
  useEffect(() => {
    if (isInitialized && (activeTours.length > 0 || continueTourId > 0)) {
      checkForTours()
    }
  }, [activeTours, continueTourId, continueStep, isInitialized])

  const initTourPlayback = () => {
    // Store reference for global access - only if not already set
    if (!window.magicclTourPlayback) {
      playbackRef.current = {
        startTour,
        continueTour,
        shouldTriggerTour,
        getCurrentPageUrl,
        markTourCompleted
      }
      window.magicclTourPlayback = playbackRef.current
    } else {
      playbackRef.current = window.magicclTourPlayback
    }

    // Check for tours from PHP data if available
    // Try both new format (magicclTourPlaybackData) and legacy format (mclTour)
    let tourData = null
    let dataSource = 'none'
    
    if (window.magicclTourPlaybackData?.tours) {
      tourData = window.magicclTourPlaybackData.tours
      dataSource = 'magicclTourPlaybackData'
    } else if (window.magicclTour?.tours) {
      tourData = window.magicclTour.tours
      dataSource = 'mclTour (legacy)'
    }
    
    if (tourData && tourData.length > 0) {
      // Don't process here - let checkForTours handle it for consistency
    }
  }

  const checkForTours = () => {
    // Handle tour continuation first
    if (continueTourId > 0) {
      setTimeout(() => {
        continueTour(continueTourId, continueStep)
      }, 500)
      return
    }

    // Collect all available tour data from multiple sources
    let allTours = []
    
    // Add tours from React props
    if (activeTours.length > 0) {
      allTours = [...activeTours]
    }
    
    // Add tours from PHP data (if not already included)
    if (window.magicclTourPlaybackData?.tours) {
      window.magicclTourPlaybackData.tours.forEach(phpTour => {
        // Check if this tour is already in our list (avoid duplicates)
        const existingTour = allTours.find(tour => tour.id === phpTour.id)
        if (!existingTour) {
          allTours.push(phpTour)
        }
      })
    }

    if (allTours.length === 0) {
      return
    }

    // Process all tours
    allTours.forEach((tour, index) => {
      // Skip if already started
      if (startedTours.has(tour.id)) {
        return
      }
      
      const shouldTrigger = shouldTriggerTour(tour)
      const hasAutostart = Boolean(tour.autostart)
      const hasContinuation = tour.continue_from_step !== undefined
      
      if (shouldTrigger && (hasAutostart || hasContinuation)) {
        // Add delay for autostart tours to ensure page is loaded, but not for continuation
        const delay = hasContinuation ? 100 : 1000
        setTimeout(() => {
          startTour(tour)
        }, delay)
      }
    })
  }

  const shouldTriggerTour = (tour) => {
    // Special handling for continuation tours (always allow)
    if (tour.continue_from_step !== undefined) {
      return true
    }

    // Special handling for preview tours (always allow)
    if (tour.title && tour.title.includes('Preview')) {
      return true
    }

    // Check if tour is active (but allow preview/continuation tours)
    if (tour.active === false) {
      return false
    }

    // Check if tour has been completed (only if show_once is enabled)
    if (tour.show_once && completedTours.includes(tour.id)) {
      return false
    }

    // Check user conditions (if provided)
    if (tour.user_condition && !checkUserCondition(tour)) {
      return false
    }

    // If no trigger type is set, default to allowing the tour (for preview/creator mode)
    if (!tour.trigger_type) {
      return true
    }

    // Check trigger conditions
    const currentUrl = getCurrentPageUrl()
    let triggerMatches = false
    
    switch (tour.trigger_type) {
      case 'page':
        if (!tour.trigger_value) {
          return false
        }
        
        triggerMatches = checkPageTrigger(currentUrl, tour.trigger_value)
        break
        
      case 'selector':
        if (tour.trigger_value) {
          const element = document.querySelector(tour.trigger_value)
          triggerMatches = !!element
        } else {
          triggerMatches = false
        }
        break
        
      case 'first_login':
        triggerMatches = true // Let PHP handle the first login logic
        break
        
      case 'any_page':
        triggerMatches = true
        break
        
      default:
        console.warn('MCL Tour Playback: Unknown trigger type:', tour.trigger_type)
        triggerMatches = false
    }
    
    return triggerMatches
  }

  const checkPageTrigger = (currentUrl, triggerValue) => {
    // Normalize URLs for proper matching (same logic as PHP)
    const normalizedCurrentUrl = currentUrl.endsWith('/') ? currentUrl : currentUrl + '/'
    const normalizedTriggerUrl = triggerValue.endsWith('/') ? triggerValue : triggerValue + '/'
    
    // Check for exact match or wildcard match
    if (triggerValue.includes('*')) {
      // Handle wildcards
      const pattern = triggerValue.replace(/\*/g, '.*')
      return new RegExp('^' + pattern + '$').test(currentUrl)
    } else {
      // Exact match
      return normalizedCurrentUrl === normalizedTriggerUrl
    }
  }

  const checkUserCondition = (tour) => {
    // This is a simplified check - the PHP side should handle most user condition logic
    // We just do basic checks here for logged in status
    
    if (!tour.user_condition) return true

    // Note: User conditions are primarily handled server-side during tour loading
    // If a tour reaches the frontend, it generally means the user condition was met
    // But we can do some basic client-side validation
    
    switch (tour.user_condition) {
      case 'all_users':
        return true
      case 'all_logged_in':
        // We don't have reliable logged-in status on frontend, assume PHP filtered correctly
        return true
      case 'all_logged_out':
        // We don't have reliable logged-in status on frontend, assume PHP filtered correctly
        return true
      case 'specific_users':
      case 'specific_roles':
        // These are handled server-side, if tour reached frontend it should be valid
        return true
      default:
        return true
    }
  }

  const getCurrentPageUrl = () => {
    if (window.location.pathname.includes('/wp-admin/')) {
      // Admin area - normalize similar to PHP logic
      let path = '/wp-admin/'
      
      // Special handling for dashboard - both index.php and empty should match /wp-admin/
      if (window.location.pathname !== '/wp-admin/' && window.location.pathname !== '/wp-admin/index.php') {
        // Add the specific admin page
        const adminPage = window.location.pathname.replace('/wp-admin/', '')
        if (adminPage && adminPage !== 'index.php') {
          path += adminPage
        }
      }
      
      // Add query parameters (excluding tour-specific ones)
      const params = new URLSearchParams(window.location.search)
      params.delete('magiccl_tour_mode')
      params.delete('tour_id') 
      params.delete('magiccl_continue_tour')
      params.delete('magiccl_tour_step')
      params.delete('magiccl_preview_step')
      
      if (params.toString()) {
        path += '?' + params.toString()
      }
      
      return path
    }
    
    // Frontend URL - remove tour parameters but keep the rest
    const url = new URL(window.location.href)
    url.searchParams.delete('magiccl_tour_mode')
    url.searchParams.delete('tour_id')
    url.searchParams.delete('magiccl_continue_tour')
    url.searchParams.delete('magiccl_tour_step')
    url.searchParams.delete('magiccl_preview_step')
    
    let cleanUrl = url.pathname
    if (url.searchParams.toString()) {
      cleanUrl += '?' + url.searchParams.toString()
    }
    return cleanUrl
  }

  const startTour = async (tourData) => {
    if (!tourData) {
      console.error(adminData?.i18n?.tourPlayback?.noTourData || 'MCL Tour Playback: No tour data provided')
      return
    }

    if (!tourData.steps || tourData.steps.length === 0) {
      console.error(adminData?.i18n?.tourPlayback?.noTourSteps || 'MCL Tour Playback: Tour has no steps')
      return
    }

    // Mark tour as started to prevent duplicates
    startedTours.add(tourData.id)
    
    const driverFunction = getDriverFunction()
    
    if (!driverFunction) {
      console.warn(adminData?.i18n?.tourPlayback?.driverNotAvailable || 'MCL Tour Playback: Driver function not available, retrying...')
      // Retry after a short delay to allow scripts to load
      setTimeout(() => {
        const retryDriverFunction = getDriverFunction()
        if (!retryDriverFunction) {
          console.error(adminData?.i18n?.tourPlayback?.driverStillNotAvailable || 'MCL Tour Playback: Driver function still not available after retry')
          // Remove from started tours so it can be retried
          startedTours.delete(tourData.id)
          return
        }
        startTourWithDriver(tourData, retryDriverFunction)
      }, 500)
      return
    }

    startTourWithDriver(tourData, driverFunction)
  }

  const startTourWithDriver = async (tourData, driverFunction) => {
    try {
      // **IMPORTANT**: Tours started from drawer items via continuation may have steps without page_url set.
      // We must ensure page_url is consistently set on all steps to prevent unnecessary page reloads
      // when navigating backward, especially when the previous step is on the same page.
      
      // Destroy any existing driver instance first to prevent duplicates
      if (currentDriverInstance) {
        currentDriverInstance.destroy()
        setCurrentDriverInstance(null)
      }
      
      // Also destroy any orphaned driver instances in the DOM
      const existingPopovers = document.querySelectorAll('.driver-popover, .driver-overlay, [data-driver-popover]')
      if (existingPopovers.length > 0) {
        existingPopovers.forEach(element => {
          element.remove()
        })
      }
      
      const tourSteps = tourData.steps || []
      const tourSettings = tourData.settings || {}
      const currentPageUrl = getCurrentPageUrl()
      const startStepIndex = tourData.continue_from_step || 0
      
      // Find steps for current page, including their original indexes
      let currentPageSteps = []
      let nextPageStep = null
      let prevPageStep = null
      
      for (let i = 0; i < tourSteps.length; i++) {
        const step = { ...tourSteps[i], originalIndex: i }
        
        // Ensure page_url is set - if missing, use currentPageUrl as default
        // This is especially important for tours started via continuation from drawer
        if (!step.page_url) {
          step.page_url = currentPageUrl
        }
        
        const stepPageUrl = step.page_url
        
        const normalizedStepUrl = normalizeUrl(stepPageUrl, currentPageUrl)
        const normalizedCurrentUrl = normalizeUrl(currentPageUrl)
        const isCurrentPage = normalizedStepUrl === normalizedCurrentUrl
        
        // Only log step comparisons if there's a continuation or if debugging is explicitly enabled
        if (tourData.continue_from_step !== undefined || window.magicclTourDebug) {
          console.log(`MCL Tour: Step ${i} page comparison:`, {
            stepPageUrl,
            currentPageUrl,
            normalizedStepUrl,
            normalizedCurrentUrl,
            isCurrentPage,
            startStepIndex,
            isContinuation: tourData.continue_from_step !== undefined
          })
        }
        
        if (isCurrentPage) {
          currentPageSteps.push(step)
        } else if (i > startStepIndex && !nextPageStep) {
          nextPageStep = step
        } else if (i < startStepIndex) {
          prevPageStep = step
        }
      }
      
      if (tourData.continue_from_step !== undefined) {
        currentPageSteps = currentPageSteps.filter(step => step.originalIndex >= startStepIndex)
      }

      if (currentPageSteps.length === 0) {
        if (nextPageStep) {
          navigateToTourStep(tourData.id, nextPageStep)
          return
        } else if (tourData.continue_from_step !== undefined) {
          markTourCompleted(tourData.id)
          return
        }
        return
      }

      // Convert to driver.js format
      const driverSteps = currentPageSteps.map((step, index) => {
        const isLastStepOnPage = index === currentPageSteps.length - 1
        let description = step.content || ''
        const stepButtons = step.show_buttons !== false ? (tourSettings.default_buttons || ['next', 'previous', 'close']) : ['close']
        
        if (isLastStepOnPage && nextPageStep) {
          description += `<br><br><em>${adminData?.i18n?.tourPlayback?.clickContinueNextPage || 'Click "Continue" to go to the next page...'}</em>`
          if (!stepButtons.includes('next')) stepButtons.push('next')
        }
        
        return {
          element: step.element || 'body',
          popover: {
            title: step.title || adminData?.i18n?.tourPlayback?.tourStep || 'Tour Step',
            description: description,
            side: step.position || 'bottom',
            showButtons: stepButtons
          }
        }
      })

      const initialGlobalPosition = startStepIndex + 1
      
      // Create driver instance
      const driverOptions = {
        animate: tourSettings.animate !== false,
        showProgress: tourSettings.show_progress !== false,
        progressText: (tourSettings.progress_text || '{{current}} of {{total}}').replace('{{current}}', initialGlobalPosition).replace('{{total}}', tourSteps.length),
        allowClose: tourSettings.allow_close !== false,
        doneBtnText: nextPageStep ? (adminData?.i18n?.tourPlayback?.continue || 'Continue') : (tourSettings.done_btn_text || adminData?.i18n?.tourPlayback?.done || 'Done'),
        nextBtnText: tourSettings.next_btn_text || adminData?.i18n?.tourPlayback?.next || 'Next',
        prevBtnText: tourSettings.prev_btn_text || adminData?.i18n?.tourPlayback?.previous || 'Previous',
        overlayColor: tourSettings.overlay_color || 'rgba(0, 0, 0, 0.75)',
        popoverClass: tourSettings.popover_class || '',
        stagePadding: tourSettings.padding || 4,
        smoothScroll: tourSettings.smooth_scroll !== false,
        onNextClick: (element, step, options) => {
          const currentDriverStep = driverInstance.getActiveIndex()
          const isLastDriverStep = currentDriverStep === driverSteps.length - 1
          const currentGlobalIndex = getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourSteps)
          
          handleStepChecklistIntegration(currentGlobalIndex, tourSteps, 'forward')
          
          if (isLastDriverStep && nextPageStep) {
            driverInstance.destroy()
            navigateToTourStep(tourData.id, nextPageStep)
            return false // Prevent default driver navigation
          }
          
          // Advance to next step
          try {
            driverInstance.moveNext()
          } catch (e) {
            console.error(adminData?.i18n?.tourPlayback?.errorNextStep || 'MCL Tour: Error moving to next step', e)
          }
          return false // Prevent default driver navigation
        },
        onPrevClick: (element, step, options) => {
          const currentDriverStep = driverInstance.getActiveIndex()
          const isFirstDriverStep = currentDriverStep === 0
          const currentGlobalIndex = getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourSteps)
          
          handleStepChecklistIntegration(currentGlobalIndex, tourSteps, 'backward')

          // If we're at the first driver step but there is a previous global step
          if (isFirstDriverStep && currentGlobalIndex > 0) {
            const prevIndex = currentGlobalIndex - 1
            const actualPrevGlobalStep = { ...tourSteps[prevIndex], originalIndex: prevIndex }

            // Ensure previous step has page_url set (same logic as in step finding)
            if (!actualPrevGlobalStep.page_url) {
              actualPrevGlobalStep.page_url = currentPageUrl
            }
            const prevUrl = normalizeUrl(actualPrevGlobalStep.page_url, currentPageUrl)
            const currUrl = normalizeUrl(currentPageUrl)

            // If the previous step is on another page, do a full navigation
            if (prevUrl !== currUrl) {
              driverInstance.destroy()
              navigateToTourStep(tourData.id, actualPrevGlobalStep)

            // If the previous step is on the same page but is before our start index, reinitialize just that portion
            } else if (prevIndex < startStepIndex) {
              driverInstance.destroy()
              startTour({ ...tourData, continue_from_step: prevIndex })

            } else {
              // Navigate within the same page in the current driver instance
              try {
                driverInstance.movePrevious()
              } catch (e) {
                console.error(adminData?.i18n?.tourPlayback?.errorPrevStepSamePage || 'MCL Tour: Error moving to previous step within page', e)
              }
            }
            return false // Prevent default driver navigation
          }

          // Move back to previous step for all other cases
          try {
            driverInstance.movePrevious()
          } catch (e) {
            console.error(adminData?.i18n?.tourPlayback?.errorPrevStep || 'MCL Tour: Error moving to previous step', e)
          }
          return false // Prevent default navigation
        },
        onCloseClick: async (element, step, options) => {
          // Prevent multiple simultaneous calls
          if (driverInstance._magicclCloseInProgress) {
            return false
          }
          driverInstance._magicclCloseInProgress = true
          
          // Handle confirmation for the close button specifically
          // For preview mode, always show confirmation unless explicitly disabled
          const isPreviewMode = tourData.title && tourData.title.includes('Preview')
          const shouldConfirm = isPreviewMode || (tourSettings.confirm_exit && tourSettings.allow_close !== false)
          
          if (shouldConfirm) {
            const currentDriverStep = driverInstance.getActiveIndex()
            const currentGlobalIndex = getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourSteps)
            const isLastGlobalStepOverall = currentGlobalIndex === tourSteps.length - 1
            
            // If it's the last step, allow exit without confirmation
            if (isLastGlobalStepOverall) {
              driverInstance.destroy()
              setCurrentDriverInstance(null)
              return true
            }
            
            // Show confirmation modal for the close button
            try {
              const shouldExit = await handleTourExitConfirmation(
                tourSettings.exit_message || adminData?.i18n?.tourPlayback?.exitConfirmation || 'Are you sure you want to exit the tour?'
              )
              
              if (shouldExit) {
                driverInstance.destroy()
                setCurrentDriverInstance(null)
                return true
              } else {
                driverInstance._magicclCloseInProgress = false
                return false // Prevent closing
              }
            } catch (error) {
              console.error(adminData?.i18n?.tourPlayback?.errorCloseConfirmation || 'MCL Tour: Error in close confirmation:', error)
              driverInstance._magicclCloseInProgress = false
              return false
            }
          }
          
          // If no confirmation is needed, allow exit
          driverInstance.destroy()
          setCurrentDriverInstance(null)
          return true
        },
        onDestroyStarted: () => {
          // Prevent multiple simultaneous calls
          if (driverInstance._magicclDestroyInProgress) {
            return false
          }
          driverInstance._magicclDestroyInProgress = true
          
          // Handle exit confirmation for ESC key, overlay click, etc. (but not close button)
          // Note: onCloseClick handles the close button specifically
          // For preview mode, always show confirmation unless explicitly disabled
          const isPreviewMode = tourData.title && tourData.title.includes('Preview')
          const shouldConfirm = isPreviewMode || (tourSettings.confirm_exit && tourSettings.allow_close !== false)
          
          if (shouldConfirm) {
            const currentDriverStep = driverInstance.getActiveIndex()
            const currentGlobalIndex = getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourSteps)
            const isLastGlobalStepOverall = currentGlobalIndex === tourSteps.length - 1
            
            // If it's the last step, allow exit without confirmation
            if (isLastGlobalStepOverall) {
              driverInstance.destroy()
              setCurrentDriverInstance(null)
              return true
            }
            
            // Show confirmation modal - don't wait for response, just show it
            handleTourExitConfirmation(
              tourSettings.exit_message || adminData?.i18n?.tourPlayback?.exitConfirmation || 'Are you sure you want to exit the tour?'
            ).then((shouldExit) => {
              if (shouldExit) {
                driverInstance.destroy()
                setCurrentDriverInstance(null)
              } else {
                // Reset the flag so user can try to exit again
                driverInstance._magicclDestroyInProgress = false
              }
              // If user cancels, the modal closes but driver stays open
            }).catch(() => {
              // Reset the flag on error
              driverInstance._magicclDestroyInProgress = false
            })
            
            return false // Always prevent automatic closing - we'll handle it manually
          }
          
          // If no confirmation is needed, allow exit
          driverInstance.destroy()
          setCurrentDriverInstance(null)
          return true
        },
        onHighlighted: (element, step, options) => {
          const currentDriverStep = driverInstance.getActiveIndex()
          const currentGlobalIndex = getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourSteps)
          
          // Handle checklist integration when step is highlighted (important for initial step and navigation)
          handleStepChecklistIntegration(currentGlobalIndex, tourSteps, 'forward')
          
          updateTourProgress(currentGlobalIndex + 1, tourSteps.length, tourSettings)
          updateTourButtons(currentGlobalIndex, tourSteps.length, startStepIndex, tourSettings, !!nextPageStep, !!prevPageStep)
          
          // Customize driver close button
          customizeDriverCloseButton(tourSettings)
        },
        onDestroyed: () => {
          setCurrentDriverInstance(null)
          if (!nextPageStep) {
            markTourCompleted(tourData.id)
          }
        }
      }

      // Apply overlay settings
      if (tourSettings.overlay_color && tourSettings.overlay_opacity !== undefined) {
        const color = tourSettings.overlay_color
        const opacity = tourSettings.overlay_opacity
        if (color.startsWith('#')) {
          const r = parseInt(color.slice(1,3), 16)
          const g = parseInt(color.slice(3,5), 16)
          const b = parseInt(color.slice(5,7), 16)
          driverOptions.overlayColor = `rgba(${r}, ${g}, ${b}, ${opacity})`
        } else {
          driverOptions.overlayColor = color
        }
      }

      const driverInstance = driverFunction(driverOptions)
      
      driverInstance.setSteps(driverSteps)
      
      driverInstance.drive()
      
      setCurrentDriverInstance(driverInstance)

      // Update progress and buttons after a short delay
      setTimeout(() => {
        const initialGlobalIndex = startStepIndex
        updateTourProgress(initialGlobalIndex + 1, tourSteps.length, tourSettings)
        updateTourButtons(initialGlobalIndex, tourSteps.length, startStepIndex, tourSettings, !!nextPageStep, !!prevPageStep)
        customizeDriverCloseButton(tourSettings)
      }, 100)

    } catch (error) {
      console.error(adminData?.i18n?.tourPlayback?.errorStartingTour || 'MCL Tour Playback: Error starting tour:', error)
    }
  }

  const continueTour = async (tourId, stepIndex = 0) => {
    try {
      const formData = new FormData()
      formData.append('action', 'magiccl_get_tour_data')
      formData.append('tour_id', tourId)
      formData.append('nonce', adminData.nonces?.magiccl_tour_public || window.magicclTourPlaybackData?.nonce)

      const response = await fetch(adminData.ajaxurl || window.magicclTourPlaybackData?.ajax_url, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        const tourData = data.data
        // Start tour from specific step
        await startTour({
          ...tourData,
          continue_from_step: stepIndex
        })
      }
    } catch (error) {
      console.error(adminData?.i18n?.tourPlayback?.errorContinuingTour || 'MCL Tour Playback: Error continuing tour:', error)
    }
  }

  const navigateToTourStep = (tourId, step) => {
    if (!step.page_url) {
      return
    }

    // Validate tourId and step.originalIndex before proceeding
    if (!tourId || tourId === 'undefined' || isNaN(tourId)) {
      return
    }

    if (step.originalIndex === undefined || step.originalIndex === null || isNaN(step.originalIndex)) {
      return
    }

    showNavigationLoading()

    try {
      const url = new URL(step.page_url, window.location.href)
      url.searchParams.set('magiccl_continue_tour', String(tourId))
      url.searchParams.set('magiccl_tour_step', String(step.originalIndex))
      
      setTimeout(() => {
        window.location.href = url.toString()
      }, 100)
    } catch (error) {
      hideNavigationLoading()
    }
  }

  const showNavigationLoading = () => {
    const existing = document.querySelector('.magiccl-tour-navigation-loading')
    if (existing) existing.remove()

    const loadingHtml = `
      <div class="magiccl-tour-navigation-loading" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); z-index: 1000200; display: flex; align-items: center; justify-content: center;">
        <div class="magiccl-tour-loading-content" style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
          <div class="magiccl-tour-spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #2271b1; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
          <div class="magiccl-tour-loading-text">${adminData?.i18n?.tourPlayback?.loadingNextPage || 'Loading next page...'}</div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>`
    
    document.body.insertAdjacentHTML('beforeend', loadingHtml)
  }

  const hideNavigationLoading = () => {
    const loading = document.querySelector('.magiccl-tour-navigation-loading')
    if (loading) loading.remove()
  }

  const markTourCompleted = async (tourId) => {
    // Remove from started tours set so it can be started again if needed
    startedTours.delete(tourId)
    
    const formData = new FormData()
    formData.append('action', 'magiccl_mark_tour_complete')
    formData.append('tour_id', tourId)
    formData.append('nonce', adminData.nonces?.magiccl_tour_public || window.magicclTourPlaybackData?.nonce)

    await fetch(adminData.ajaxurl || window.magicclTourPlaybackData?.ajax_url, {
      method: 'POST',
      body: formData
    })

    // Update local state
    setCompletedTours(prev => [...prev, tourId])
  }

  const getDriverFunction = () => {
    if (typeof window.driver?.js?.driver === 'function') return window.driver.js.driver
    if (typeof window.driver?.driver === 'function') return window.driver.driver
    if (typeof window.driver === 'function') return window.driver
    return null
  }

  const getCurrentGlobalStepIndex = (driverStepIndex, currentPageUrl, fromStepIndex, tourSteps) => {
    let currentPageStepCount = 0
    for (let i = fromStepIndex; i < tourSteps.length; i++) {
      const stepPageUrl = tourSteps[i].page_url || currentPageUrl
      
      // Use the same URL normalization as the rest of the component
      const normalizedStepUrl = normalizeUrl(stepPageUrl, currentPageUrl)
      const normalizedCurrentUrl = normalizeUrl(currentPageUrl)
      
      if (normalizedStepUrl === normalizedCurrentUrl) {
        if (currentPageStepCount === driverStepIndex) return i
        currentPageStepCount++
      }
    }
    return fromStepIndex + driverStepIndex // Fallback
  }

  const updateTourProgress = (currentStep, totalSteps, settings = {}) => {
    const progressTemplate = settings.progress_text || '{{current}} of {{total}}'
    const correctText = progressTemplate.replace('{{current}}', currentStep).replace('{{total}}', totalSteps)
    
    const updateElement = () => {
      const progressElement = document.querySelector('.driver-popover-progress-text')
      if (progressElement && progressElement.textContent !== correctText) {
        progressElement.textContent = correctText
        return true
      }
      return false
    }

    updateElement()
    setTimeout(updateElement, 10)
    setTimeout(updateElement, 100)
  }

  const updateTourButtons = (currentGlobalIndex, totalSteps, fromStepIndexOnPage, settings = {}, hasNextPage, hasPrevPage) => {
    const prevButton = document.querySelector('.driver-popover-prev-btn')
    const nextButton = document.querySelector('.driver-popover-next-btn')

    // Previous Button Logic
    if (prevButton) {
      const isEffectivelyFirstStep = currentGlobalIndex === 0
      prevButton.disabled = isEffectivelyFirstStep
      prevButton.style.opacity = isEffectivelyFirstStep ? '0.5' : '1'
      prevButton.style.pointerEvents = isEffectivelyFirstStep ? 'none' : 'auto'
      prevButton.textContent = settings.prev_btn_text || adminData?.i18n?.tourPlayback?.previous || 'Previous'
    }

    // Next/Done Button Logic
    if (nextButton) {
      const isLastGlobalStep = currentGlobalIndex === totalSteps - 1
      const driverInstance = currentDriverInstance
      const isLastStepOnCurrentDriverInstance = driverInstance ? driverInstance.getActiveIndex() === driverInstance.getConfig().steps.length - 1 : false

      if (isLastGlobalStep) {
        nextButton.textContent = settings.done_btn_text || adminData?.i18n?.tourPlayback?.done || 'Done'
      } else if (isLastStepOnCurrentDriverInstance && hasNextPage) {
        nextButton.textContent = adminData?.i18n?.tourPlayback?.continue || 'Continue'
      } else {
        nextButton.textContent = settings.next_btn_text || adminData?.i18n?.tourPlayback?.next || 'Next'
      }
      
      nextButton.disabled = false
      nextButton.style.opacity = '1'
      nextButton.style.pointerEvents = 'auto'
    }
  }

  const handleStepChecklistIntegration = (currentStepIndex, tourSteps, direction = 'forward') => {
    if (!tourSteps || currentStepIndex < 0 || currentStepIndex >= tourSteps.length) {
      return
    }

    const currentStep = tourSteps[currentStepIndex]
    
    if (currentStep && currentStep.checklist_id && currentStep.checklist_item_id) {
      if (direction === 'forward') {
        checkChecklistItem(currentStep.checklist_id, currentStep.checklist_item_id)
      } else {
        uncheckChecklistItem(currentStep.checklist_id, currentStep.checklist_item_id)
      }
    }
  }

  const checkChecklistItem = async (checklistId, itemId) => {
    if (!checklistId || !itemId) {
      console.warn(adminData?.i18n?.tourPlayback?.checkItemMissingParams || 'MCL Tour: checkChecklistItem - Missing parameters', { checklistId, itemId })
      return
    }

    try {
      const formData = new FormData()
      formData.append('action', 'magiccl_tour_step_check_item')
      formData.append('checklist_id', checklistId)
      formData.append('item_id', itemId)
      formData.append('checked', true)
      formData.append('nonce', adminData.nonces?.magiccl_tour_public || window.magicclTourPlaybackData?.nonce)

      const response = await fetch(adminData.ajaxurl || window.magicclTourPlaybackData?.ajax_url, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        // Trigger a custom event to notify any listening checklist components
        window.dispatchEvent(new CustomEvent('magicclChecklistItemChanged', {
          detail: { checklistId, itemId, checked: true, source: 'tour' }
        }))
      } else {
        console.error(adminData?.i18n?.tourPlayback?.failedCheckItem || 'MCL Tour: Failed to check checklist item', result.data)
      }
    } catch (error) {
      console.error(adminData?.i18n?.tourPlayback?.errorCheckingItem || 'MCL Tour Playback: Error checking checklist item:', error)
    }
  }

  const uncheckChecklistItem = async (checklistId, itemId) => {
    if (!checklistId || !itemId) {
      console.warn(adminData?.i18n?.tourPlayback?.uncheckItemMissingParams || 'MCL Tour: uncheckChecklistItem - Missing parameters', { checklistId, itemId })
      return
    }

    try {
      const formData = new FormData()
      formData.append('action', 'magiccl_tour_step_check_item')
      formData.append('checklist_id', checklistId)
      formData.append('item_id', itemId)
      formData.append('checked', false)
      formData.append('nonce', adminData.nonces?.magiccl_tour_public || window.magicclTourPlaybackData?.nonce)

      const response = await fetch(adminData.ajaxurl || window.magicclTourPlaybackData?.ajax_url, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        // Trigger a custom event to notify any listening checklist components
        window.dispatchEvent(new CustomEvent('magicclChecklistItemChanged', {
          detail: { checklistId, itemId, checked: false, source: 'tour' }
        }))
      } else {
        console.error(adminData?.i18n?.tourPlayback?.failedUncheckItem || 'MCL Tour: Failed to uncheck checklist item', result.data)
      }
    } catch (error) {
      console.error(adminData?.i18n?.tourPlayback?.errorUncheckingItem || 'MCL Tour Playback: Error unchecking checklist item:', error)
    }
  }

  const handleTourExitConfirmation = async (confirmMessage) => {
    return new Promise((resolve) => {
      setExitConfirmMessage(confirmMessage)
      setExitConfirmResolve(() => resolve)
      setShowExitConfirmation(true)
    })
  }

  const handleExitConfirm = () => {
    setShowExitConfirmation(false)
    setExitConfirmMessage('')
    if (exitConfirmResolve) {
      const resolve = exitConfirmResolve
      setExitConfirmResolve(null)
      resolve(true)
    }
  }

  const handleExitCancel = () => {
    setShowExitConfirmation(false)
    setExitConfirmMessage('')
    if (exitConfirmResolve) {
      const resolve = exitConfirmResolve
      setExitConfirmResolve(null)
      resolve(false)
    }
  }

  const customizeDriverCloseButton = (settings) => {
    const closeButton = document.querySelector('.driver-popover-close-btn')
    if (closeButton) {
      const accessibilityText = settings.close_btn_text || adminData?.i18n?.tourPlayback?.closeTour || 'Close tour'
      closeButton.setAttribute('title', accessibilityText)
      closeButton.setAttribute('aria-label', accessibilityText)
    }
  }

  // This component doesn't render anything visible except the confirmation modal
  return (
    <>
      {showExitConfirmation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center w-full h-full magiccl-tour-exit-modal"
          style={{ 
            zIndex: 99999999, // Higher than all other elements including tour creator
            pointerEvents: 'auto', // Ensure pointer events work
            position: 'fixed', // Ensure it's positioned correctly
            display: 'flex !important', // Force display
            visibility: 'visible !important', // Force visibility
            opacity: 1 // Force opacity
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault()
              e.stopPropagation()
              handleExitCancel()
            }
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault()
              e.stopPropagation()
              handleExitCancel()
            }
          }}
        >
          <div 
            className="relative p-4 w-full max-w-md" 
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal content */}
            <div 
              className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5"
              style={{ pointerEvents: 'auto' }}
            >
              {/* Close button */}
              <button 
                type="button" 
                className="text-gray-400 absolute top-2.5 right-2.5 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white transition-colors duration-200"
                style={{ pointerEvents: 'auto' }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleExitCancel()
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
                <span className="sr-only">{adminData?.i18n?.tourPlayback?.closeModal || 'Close modal'}</span>
              </button>

              {/* Modal header */}
              <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                {adminData?.i18n?.tourPlayback?.exitTourTitle || 'Exit Tour?'}
              </h3>

              {/* Modal message */}
              <p className="mb-4 font-light text-gray-500 dark:text-gray-400">
                {exitConfirmMessage}
              </p>

                              {/* Action buttons */}
                <div className="flex items-center space-x-4" style={{ pointerEvents: 'auto' }}>
                  <button 
                    type="button" 
                    className="py-2 px-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600 transition-colors duration-200"
                    style={{ pointerEvents: 'auto' }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleExitCancel()
                    }}
                  >
                    {adminData?.i18n?.tourPlayback?.noContinueTour || 'No, continue tour'}
                  </button>
                  <button 
                    type="button" 
                    className="inline-flex items-center py-2 px-3 text-sm font-medium text-center text-white rounded-lg focus:ring-4 focus:outline-none transition-colors duration-200 bg-orange-600 hover:bg-orange-700 focus:ring-orange-300 dark:bg-orange-500 dark:hover:bg-orange-600 dark:focus:ring-orange-900"
                    style={{ pointerEvents: 'auto' }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleExitConfirm()
                    }}
                    autoFocus
                  >
                  <svg className="flex-shrink-0 w-4 h-4 mr-1.5 -ml-1 text-orange-200" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                  </svg>
                  {adminData?.i18n?.tourPlayback?.yesExitTour || 'Yes, exit tour'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TourPlayback 