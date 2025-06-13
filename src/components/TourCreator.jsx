import { useState, useEffect, useRef, useCallback } from 'react'
import { Button, Label, TextInput, Textarea, Select, Checkbox } from 'flowbite-react'
import { useToast } from './Toast.jsx'
import ConfirmationModal from './ConfirmationModal.jsx'

const TourCreator = ({ adminData, tourId = 0, onExit }) => {
  const [currentMode, setCurrentMode] = useState('select')
  const [tourSteps, setTourSteps] = useState([])
  const [tourSettings, setTourSettings] = useState({})
  const [checklists, setChecklists] = useState([])
  const [showStepEditor, setShowStepEditor] = useState(false)
  const [currentStep, setCurrentStep] = useState(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [showStepsList, setShowStepsList] = useState(false)
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [highlightElementRef, setHighlightElementRef] = useState(null)
  const [isReselectingElement, setIsReselectingElement] = useState(false)
  const [processingActions, setProcessingActions] = useState(new Set())
  const [tourTitle, setTourTitle] = useState('')
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [stepToDelete, setStepToDelete] = useState(null)
  const [stepForm, setStepForm] = useState({
    title: '',
    content: '',
    element: '',
    position: 'bottom',
    page_url: '',
    checklist_id: '',
    checklist_item_id: '',
    show_buttons: true
  })

  const panelRef = useRef(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panelStart = useRef({ x: 0, y: 0 })
  const [panelPosition, setPanelPosition] = useState({ top: 50, right: 20, left: 'auto' })
  const [isDraggingPanel, setIsDraggingPanel] = useState(false)
  
  const { showSuccess, showError, showWarning } = useToast()

  const currentModeRef = useRef(currentMode)
  useEffect(() => {
    currentModeRef.current = currentMode
  }, [currentMode])

  const isReselectingRef = useRef(isReselectingElement)
  useEffect(() => {
    isReselectingRef.current = isReselectingElement
  }, [isReselectingElement])

  const showStepEditorRef = useRef(showStepEditor)
  useEffect(() => {
    showStepEditorRef.current = showStepEditor
  }, [showStepEditor])

  // Initialize tour creator
  useEffect(() => {
    // Set body class for tour creator mode
    document.body.classList.add('mcl-tour-creator-active')
    
    // Set cookie for pagebuilder iframe detection
    document.cookie = 'mcl_tour_mode=1; path=/; SameSite=Lax'
    
    // Load existing tour data if editing
    if (tourId > 0) {
      loadTourData(tourId).then(() => {
        // Check for preview mode after loading tour data
        checkForPreviewMode()
      })
    } else {
      // Check for preview mode even for new tours
      checkForPreviewMode()
    }
    
    loadChecklists()
    bindCreatorEvents()
    initUrlPreservation()
    
    return () => {
      document.body.classList.remove('mcl-tour-creator-active')
      document.cookie = 'mcl_tour_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      unbindCreatorEvents()
    }
  }, [tourId])

  const loadTourData = async (tourIdToLoad) => {
    try {
      const formData = new FormData()
      formData.append('action', 'mcl_get_tour_data')
      formData.append('tour_id', tourIdToLoad)
      formData.append('nonce', adminData.nonces.mcl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setTourSteps(data.data.steps || [])
        setTourSettings(data.data.settings || {})
        if (data.data.title) {
          setTourTitle(data.data.title)
        }
        return data.data
      } else {
        showError('Failed to load tour data')
        throw new Error('Failed to load tour data')
      }
    } catch (error) {
      console.error('Error loading tour data:', error)
      showError('Error loading tour data')
      throw error
    }
  }

  const checkForPreviewMode = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const previewStep = urlParams.get('mcl_preview_step')
    
    if (previewStep !== null) {
      const stepIndex = parseInt(previewStep)
      if (!isNaN(stepIndex) && stepIndex >= 0) {
        // Clean up the URL parameter
        urlParams.delete('mcl_preview_step')
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '')
        window.history.replaceState({}, '', newUrl)
        
        // Start preview after a short delay to ensure everything is loaded
        // Use a longer delay and retry mechanism for robustness
        let retryCount = 0
        const maxRetries = 10
        
        const attemptPreview = () => {
          if (tourSteps && tourSteps.length > 0) {
            startPreviewFromStep(stepIndex)
          } else if (retryCount < maxRetries) {
            retryCount++
            console.log(`MCL Tour Creator: Tour steps not ready, retrying preview (attempt ${retryCount}/${maxRetries})`)
            setTimeout(attemptPreview, 300)
          } else {
            showError('Preview failed: Tour steps could not be loaded in time.')
          }
        }
        
        setTimeout(attemptPreview, 500)
      }
    }
  }

  const startPreviewFromStep = (stepIndex) => {
    console.log('MCL Tour Creator: startPreviewFromStep called with index:', stepIndex)
    console.log('MCL Tour Creator: Available tour data:', {
      tourSteps: tourSteps?.length || 0,
      tourSettings: !!tourSettings,
      tourId: tourId,
      tourTitle: tourTitle
    })

    if (!tourSteps || tourSteps.length === 0) {
      console.error('MCL Tour Creator: No tour steps available for preview')
      showError('No tour steps available for preview. Please ensure the tour is loaded.')
      return
    }

    if (stepIndex >= tourSteps.length) {
      console.error('MCL Tour Creator: Invalid step index:', stepIndex, 'vs', tourSteps.length)
      showError(`Invalid step index for preview: ${stepIndex}. Tour has ${tourSteps.length} steps.`)
      return
    }

    if (!window.mclTourPlayback) {
      console.error('MCL Tour Creator: mclTourPlayback not available')
      showError('Tour preview is not available. Please refresh the page and try again.')
      return
    }

    const tourData = {
      steps: tourSteps,
      settings: tourSettings,
      id: tourId || 0,
      title: tourTitle ? `Preview: ${tourTitle}` : 'Preview Tour',
      continue_from_step: stepIndex,
      active: true, // Ensure preview tours are considered active
      autostart: true // Auto-start preview tours
    }
    
    console.log('MCL Tour Creator: Starting preview from step', stepIndex, 'with tour data:', tourData)
    
    // Start the tour with continuation from the specified step
    window.mclTourPlayback.startTour(tourData)
  }

  const loadChecklists = async () => {
    try {
      const formData = new FormData()
      formData.append('action', 'mcl_get_checklists_for_tour')
      formData.append('nonce', adminData.nonces.mcl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setChecklists(data.data)
      }
    } catch (error) {
      console.error('Error loading checklists:', error)
    }
  }

  const bindCreatorEvents = () => {
    // Element selection and highlighting
    document.addEventListener('click', handleElementClick, true)
    document.addEventListener('mouseenter', handleElementHover, true)
    document.addEventListener('mouseleave', handleElementLeave, true)
    
    // Handle mouse leaving the viewport
    document.addEventListener('mouseleave', handleDocumentMouseLeave, false)
    
    // Link and form interception for navigation mode - use capture phase with highest priority
    document.addEventListener('click', handleLinkClick, true)
    document.addEventListener('submit', handleFormSubmit, true)
    
    // Bind to specific WordPress admin elements after a short delay to ensure they're loaded
    setTimeout(() => {
      const adminElements = ['#adminmenu', '#wpadminbar', '.wrap']
      adminElements.forEach(selector => {
        try {
          const element = document.querySelector(selector)
          if (element && !element.hasAttribute('data-mcl-tour-bound')) {
            element.addEventListener('click', handleLinkClick, true)
            element.setAttribute('data-mcl-tour-bound', 'true')
          }
        } catch (error) {
          console.warn('Failed to bind tour navigation to', selector, error)
        }
      })
    }, 100)
  }

  const unbindCreatorEvents = () => {
    document.removeEventListener('click', handleElementClick, true)
    document.removeEventListener('mouseenter', handleElementHover, true)
    document.removeEventListener('mouseleave', handleElementLeave, true)
    document.removeEventListener('mouseleave', handleDocumentMouseLeave, false)
    document.removeEventListener('click', handleLinkClick, true)
    document.removeEventListener('submit', handleFormSubmit, true)
    
    // Remove event listeners from specific admin elements
    const adminElements = ['#adminmenu', '#wpadminbar', '.wrap']
    adminElements.forEach(selector => {
      try {
        const element = document.querySelector(selector)
        if (element && element.hasAttribute('data-mcl-tour-bound')) {
          element.removeEventListener('click', handleLinkClick, true)
          element.removeAttribute('data-mcl-tour-bound')
        }
      } catch (error) {
        console.warn('Failed to unbind tour navigation from', selector, error)
      }
    })
    
    removeHighlight()
  }

  const preventForSelection = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (typeof e.stopImmediatePropagation === 'function') {
      e.stopImmediatePropagation()
    }
  }

  const handleElementClick = (e) => {
    const mode = currentModeRef.current
    const reselecting = isReselectingRef.current
    const modalOpen = showStepEditorRef.current
    if (mode === 'select' && !reselecting && !modalOpen) {
      if (e.target.closest('.mcl-tour-creator, .mcl-modal, .mcl-tour-exit-modal, #mcl-drawer')) return
      preventForSelection(e)
      selectElement(e.target)
    } else if (reselecting) {
      if (e.target.closest('.mcl-tour-creator, .mcl-modal, .mcl-tour-exit-modal, #mcl-drawer')) return
      preventForSelection(e)
      reselectElement(e.target)
    }
    // In navigation mode (mode === 'navigate'), let clicks pass through
  }

  const handleElementHover = (e) => {
    const mode = currentModeRef.current
    const reselecting = isReselectingRef.current
    const modalOpen = showStepEditorRef.current
    if (mode !== 'select' && !reselecting) return
    if (!e.target || typeof e.target.closest !== 'function') return
    if (e.target.closest('.mcl-tour-creator, .mcl-modal, .mcl-tour-exit-modal, #mcl-drawer')) return
    if (modalOpen) return
    highlightElement(e.target)
  }

  const handleElementLeave = (e) => {
    const mode = currentModeRef.current
    const reselecting = isReselectingRef.current
    const modalOpen = showStepEditorRef.current
    if (mode !== 'select' && !reselecting) return
    if (!e.target || typeof e.target.closest !== 'function') {
      removeHighlight()
      return
    }
    if (e.target.closest('.mcl-tour-creator, .mcl-modal, .mcl-tour-exit-modal, #mcl-drawer')) return
    if (modalOpen) return
    removeHighlight()
  }

  const handleLinkClick = (e) => {
    const mode = currentModeRef.current
    const reselecting = isReselectingRef.current
    
    // In selection mode or reselection mode, prevent ALL link clicks to allow element selection
    if (mode === 'select' || reselecting) {
      if (e.target.closest('.mcl-tour-creator, .mcl-modal, .mcl-tour-exit-modal, #mcl-drawer')) return
      preventForSelection(e)
      return
    }
    
    // Navigation mode logic (existing behavior)
    const link = e.target.closest('a')
    if (!link) return
    const href = link.getAttribute('href')
    if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return
    if (link.closest('.mcl-tour-creator, .mcl-modal, .mcl-tour-exit-modal')) return

    // Check if this is an external link
    if (isExternalLink(href)) return

    // Determine if this is admin or plugin navigation
    const isAdminNavigation = link.closest('#adminmenu, #wpadminbar, .wrap, #wpbody-content') !== null
    const isPluginPageNavigation = href.includes('page=mcl_') ||
                                  href.includes('page=magic-checklists') ||
                                  href.includes('page=magicchecklists') ||
                                  href.includes('admin.php?page=')

    // Intercept all admin/plugin navigation links to preserve tour mode
    if (isAdminNavigation || isPluginPageNavigation) {
      e.preventDefault()
      const newUrl = appendTourParams(href)
      window.location.href = newUrl
      return
    }

    // For other links, only intercept in navigate mode
    if (mode !== 'navigate') return
    e.preventDefault()
    const newUrl = appendTourParams(href)
    window.location.href = newUrl
  }

  const handleFormSubmit = (e) => {
    const mode = currentModeRef.current
    const reselecting = isReselectingRef.current
    
    // In selection mode or reselection mode, prevent ALL form submissions to allow element selection
    if (mode === 'select' || reselecting) {
      if (e.target.closest('.mcl-tour-creator, .mcl-modal, .mcl-tour-exit-modal, #mcl-drawer')) return
      preventForSelection(e)
      return
    }
    
    // Navigation mode logic (existing behavior)
    if (mode !== 'navigate') return
    const form = e.target
    if (form.closest('.mcl-tour-creator, .mcl-modal, .mcl-tour-exit-modal')) return
    if (form.method && form.method.toLowerCase() === 'get') {
      e.preventDefault()
      handleGetFormSubmission(form)
    } else {
      const tourParams = getTourParams()
      Object.keys(tourParams).forEach(key => {
        if (!form.querySelector(`input[name="${key}"]`)) {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = tourParams[key]
          form.appendChild(input)
        }
      })
    }
  }

  const selectElement = (element) => {
    const selectorResult = generateSelectorWithStrategy(element)
    const currentPageUrl = getCurrentPageUrl()
    
    showSelectorGenerationFeedback(selectorResult)
    openStepEditor(selectorResult.selector, currentPageUrl)
  }

  const reselectElement = (element) => {
    const selectorResult = generateSelectorWithStrategy(element)
    setStepForm(prev => ({ ...prev, element: selectorResult.selector }))
    showSelectorGenerationFeedback(selectorResult)
    stopElementReselection()
  }

  const openStepEditor = (selector = '', pageUrl = '') => {
    removeHighlight()
    setStepForm({
      title: '',
      content: '',
      element: selector,
      position: 'bottom',
      page_url: pageUrl,
      checklist_id: '',
      checklist_item_id: '',
      show_buttons: true
    })
    setCurrentStepIndex(-1)
    setShowStepEditor(true)
  }

  const editStep = (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= tourSteps.length) return
    const step = tourSteps[stepIndex]
    setCurrentStepIndex(stepIndex)
    setStepForm({
      title: step.title || '',
      content: step.content || '',
      element: step.element || '',
      position: step.position || 'bottom',
      page_url: step.page_url || '',
      checklist_id: step.checklist_id || '',
      checklist_item_id: step.checklist_item_id || '',
      show_buttons: step.show_buttons !== false
    })
    setShowStepEditor(true)
  }

  const saveStep = () => {
    const stepData = { ...stepForm }
    
    if (currentStepIndex >= 0 && currentStepIndex < tourSteps.length) {
      const newSteps = [...tourSteps]
      newSteps[currentStepIndex] = stepData
      setTourSteps(newSteps)
    } else {
      setTourSteps(prev => [...prev, stepData])
    }
    
    setShowStepEditor(false)
    setCurrentStepIndex(-1)
  }

  const deleteStep = async (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= tourSteps.length) return
    
    setStepToDelete(stepIndex)
    setShowDeleteConfirmation(true)
  }

  const handleDeleteConfirm = () => {
    if (stepToDelete !== null && stepToDelete >= 0 && stepToDelete < tourSteps.length) {
      const newSteps = tourSteps.filter((_, index) => index !== stepToDelete)
      setTourSteps(newSteps)
      showSuccess('Step deleted successfully')
      setStepToDelete(null)
    }
  }

  const saveTour = async () => {
    if (!tourTitle.trim() && tourSteps.length > 0) {
      showError('Tour title is required to save.')
      return
    }

    setProcessingActions(prev => new Set(prev).add('save'))

    try {
      const formData = new FormData()
      formData.append('action', 'mcl_save_tour')
      formData.append('tour_id', tourId)
      formData.append('title', tourTitle)
      formData.append('steps', JSON.stringify(tourSteps))
      formData.append('settings', JSON.stringify(tourSettings))
      formData.append('nonce', adminData.nonces.mcl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        showSuccess('Tour saved successfully!')
        // Update URL if it was a new tour
        if (!window.location.search.includes('tour_id=') && data.data.tour_id) {
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.set('tour_id', data.data.tour_id)
          window.history.replaceState({}, '', newUrl.href)
        }
        return data.data
      } else {
        showError('Error saving tour')
        throw new Error('Failed to save tour: ' + (data.data || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving tour:', error)
      showError('Error saving tour')
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete('save')
        return newSet
      })
    }
  }

  const previewTour = () => {
    if (tourSteps.length === 0) {
      showWarning('Please add some steps before previewing the tour.')
      return
    }
    
    // Check if first step is on a different page
    const currentPageUrl = getCurrentPageUrl()
    const firstStep = tourSteps[0]
    const firstStepPageUrl = firstStep.page_url || currentPageUrl
    
    if (firstStepPageUrl !== currentPageUrl) {
      // Always save tour data before navigation to ensure it's available on target page
      const savePromise = tourSteps.length > 0 ? saveTour() : Promise.resolve()
      
      savePromise.then((result) => {
        const effectiveTourId = result?.tour_id || tourId || 0
        
        // Navigate to the first step's page with preview parameters
        const previewUrl = new URL(firstStepPageUrl, window.location.origin)
        previewUrl.searchParams.set('mcl_tour_mode', '1')
        previewUrl.searchParams.set('tour_id', effectiveTourId)
        previewUrl.searchParams.set('mcl_preview_step', '0')
        
        console.log('MCL Tour Creator: Navigating to preview URL:', previewUrl.toString())
        window.location.href = previewUrl.toString()
      }).catch(() => {
        // If save fails, try to continue anyway but warn user
        showWarning('Failed to save tour data. Preview may not work correctly.')
        const previewUrl = new URL(firstStepPageUrl, window.location.origin)
        previewUrl.searchParams.set('mcl_tour_mode', '1')
        previewUrl.searchParams.set('tour_id', tourId || 0)
        previewUrl.searchParams.set('mcl_preview_step', '0')
        
        setTimeout(() => {
          window.location.href = previewUrl.toString()
        }, 1000)
      })
      return
    }
    
    // Start tour preview on current page
    if (window.mclTourPlayback) {
      const previewTourData = {
        steps: tourSteps,
        settings: tourSettings,
        id: tourId || 0,
        title: tourTitle ? `Preview: ${tourTitle}` : 'Preview Tour',
        active: true, // Ensure preview tours are considered active
        autostart: true // Auto-start preview tours
      }
      
      console.log('MCL Tour Creator: Starting preview on current page with data:', previewTourData)
      window.mclTourPlayback.startTour(previewTourData)
    } else {
      showError('Tour preview is not available. Please refresh the page and try again.')
    }
  }

  const exitCreator = async () => {
    setShowExitConfirmation(true)
  }

  const handleExitConfirm = () => {
    document.cookie = 'mcl_tour_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    if (onExit) {
      onExit()
    } else {
      // Redirect to tours list
      window.location.href = '/wp-admin/admin.php?page=mcl_tours'
    }
  }

  // Utility functions
  const cssEscape = (str) => {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(str)
    }
    return str.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`)
  }

  const isUnique = (selector) => document.querySelectorAll(selector).length === 1

  const generateSelectorWithStrategy = (element) => {
    // Prefer unique selectors in the following order:
    // 1) ID (if present and unique)
    // 2) Data attributes that are unique (e.g. [data-item-id="123"])
    // 3) Unique class name (e.g. .btn-primary)
    // 4) Tag + class combination (e.g. button.btn-primary) that is unique
    // 5) Tag + data attribute combination that is unique
    // 6) Hierarchical path using > and :nth-child until uniqueness is achieved
    //
    // Example: For <li class="mcl-widget-item" data-item-id="1749648057375">
    // This will try [data-item-id="1749648057375"] first (if unique),
    // then li.mcl-widget-item[data-item-id="1749648057375"],
    // then build a hierarchical path like: .mcl-widget-items > ul.mcl-widget-item-list > li.mcl-widget-item[data-item-id="1749648057375"]:nth-child(1)

    if (!element || element.nodeType !== 1) {
      return {
        selector: '',
        strategy: 'invalid',
        quality: 'poor',
        message: 'Invalid element selected.'
      }
    }

    // 1. ID strategy
    if (element.id && isUnique(`#${cssEscape(element.id)}`)) {
      return {
        selector: `#${cssEscape(element.id)}`,
        strategy: 'id',
        quality: 'excellent',
        message: 'Perfect! Using unique ID selector.'
      }
    }

    // Helper: safely get class names list
    const getClassList = (el) => {
      if (!el) return []
      if (typeof el.className === 'string') {
        return el.className.trim().split(/\s+/).filter(Boolean)
      }
      if (el.className && typeof el.className.baseVal === 'string') {
        // SVG elements
        return el.className.baseVal.trim().split(/\s+/).filter(Boolean)
      }
      return []
    }

    // Helper: get data attributes that could be unique identifiers
    const getDataAttributes = (el) => {
      const dataAttrs = []
      if (el.attributes) {
        for (let attr of el.attributes) {
          if (attr.name.startsWith('data-') && attr.value) {
            // Prioritize attributes that look like IDs
            const priority = /^data-(id|key|item-id|post-id|user-id|unique)/.test(attr.name) ? 1 : 2
            dataAttrs.push({ name: attr.name, value: attr.value, priority })
          }
        }
      }
      return dataAttrs.sort((a, b) => a.priority - b.priority)
    }

    // 2. Data attribute strategy (for unique identifiers)
    const dataAttrs = getDataAttributes(element)
    for (const attr of dataAttrs) {
      const sel = `[${attr.name}="${cssEscape(attr.value)}"]`
      if (isUnique(sel)) {
        return {
          selector: sel,
          strategy: 'data-attribute',
          quality: 'excellent',
          message: `Perfect! Using unique data attribute selector: ${attr.name}.`
        }
      }
    }

    // 3. Unique single class strategy
    const classes = getClassList(element)
    for (const cls of classes) {
      const sel = `.${cssEscape(cls)}`
      if (isUnique(sel)) {
        return {
          selector: sel,
          strategy: 'class',
          quality: 'good',
          message: 'Great! Using unique class selector.'
        }
      }
    }

    // 4. Tag + class combination
    for (const cls of classes) {
      const sel = `${element.tagName.toLowerCase()}.${cssEscape(cls)}`
      if (isUnique(sel)) {
        return {
          selector: sel,
          strategy: 'tag.class',
          quality: 'good',
          message: 'Good! Using tag & class selector.'
        }
      }
    }

    // 5. Tag + data attribute combination
    for (const attr of dataAttrs) {
      const sel = `${element.tagName.toLowerCase()}[${attr.name}="${cssEscape(attr.value)}"]`
      if (isUnique(sel)) {
        return {
          selector: sel,
          strategy: 'tag.data',
          quality: 'good',
          message: `Good! Using tag & data attribute selector: ${attr.name}.`
        }
      }
    }

    // 6. Build hierarchical path with :nth-child to guarantee uniqueness
    const buildPathSelector = (el) => {
      const parts = []
      let current = el
      let maxDepth = 8 // Prevent overly long selectors
      
      while (current && current.nodeType === 1 && current !== document.body && current !== document.documentElement && maxDepth > 0) {
        // Check if current element has a unique identifier we can use to stop traversal
        if (current.id) {
          parts.unshift(`#${cssEscape(current.id)}`)
          break
        }

        // Check for unique data attributes on current element
        const currentDataAttrs = getDataAttributes(current)
        let foundUniqueData = false
        for (const attr of currentDataAttrs) {
          const testSel = `[${attr.name}="${cssEscape(attr.value)}"]`
          if (isUnique(testSel)) {
            parts.unshift(testSel)
            foundUniqueData = true
            break
          }
        }
        if (foundUniqueData) break

        // Build the selector part for current element
        let part = current.tagName.toLowerCase()
        
        // Add the most specific class if available
        const clsList = getClassList(current)
        if (clsList.length) {
          part += `.${cssEscape(clsList[0])}`
        }

        // Add data attribute if it helps with specificity (even if not unique)
        if (currentDataAttrs.length > 0 && !foundUniqueData) {
          const primaryAttr = currentDataAttrs[0]
          part += `[${primaryAttr.name}="${cssEscape(primaryAttr.value)}"]`
        }

        // Add :nth-child if there are siblings with same tag
        if (current.parentNode) {
          const siblings = Array.from(current.parentNode.children).filter((c) => c.tagName === current.tagName)
          if (siblings.length > 1) {
            const index = siblings.indexOf(current) + 1
            part += `:nth-child(${index})`
          }
        }

        parts.unshift(part)
        current = current.parentNode
        maxDepth--
      }
      
      return parts.join(' > ')
    }

    const pathSelector = buildPathSelector(element)
    if (isUnique(pathSelector)) {
      return {
        selector: pathSelector,
        strategy: 'path',
        quality: 'okay',
        message: 'Using unique hierarchical selector.'
      }
    }

    // 7. Enhanced fallback: try to make tag selector more specific
    let fallbackSelector = element.tagName.toLowerCase()
    
    // Add first class if available
    if (classes.length > 0) {
      fallbackSelector += `.${cssEscape(classes[0])}`
    }
    
    // Add first data attribute if available
    if (dataAttrs.length > 0) {
      const attr = dataAttrs[0]
      fallbackSelector += `[${attr.name}="${cssEscape(attr.value)}"]`
    }
    
    // Add nth-child based on immediate parent
    if (element.parentNode) {
      const siblings = Array.from(element.parentNode.children).filter((c) => c.tagName === element.tagName)
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1
        fallbackSelector += `:nth-child(${index})`
      }
    }

    // Check if our enhanced fallback is unique
    if (isUnique(fallbackSelector)) {
      return {
        selector: fallbackSelector,
        strategy: 'enhanced-fallback',
        quality: 'okay',
        message: 'Using enhanced selector with position.'
      }
    }

    // Final fallback to basic tag name
    return {
      selector: element.tagName.toLowerCase(),
      strategy: 'tag',
      quality: 'poor',
      message: 'Selector may match multiple elements. Consider adding an ID or unique class.'
    }
  }

  const showSelectorGenerationFeedback = (result) => {
    const { quality, message } = result
    const successQualities = ['excellent', 'good', 'okay']
    const toastType = successQualities.includes(quality) ? 'success' : 'warning'
    showToast(message, toastType, 3000)
  }

  const highlightElement = (element) => {
    // Check if element is valid and not inside tour creator UI
    if (!element || typeof element.closest !== 'function' || element.closest('.mcl-tour-creator, .mcl-modal')) return
    
    // Remove any existing highlight first
    removeHighlight()
    
    const rect = element.getBoundingClientRect()
    
    // Only highlight if element has actual dimensions
    if (rect.width === 0 || rect.height === 0) return
    
    const highlight = document.createElement('div')
    highlight.className = 'mcl-element-highlight'
    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 1000050;
      border: 2px solid #2271b1;
      background: rgba(34, 113, 177, 0.1);
      border-radius: 2px;
    `
    
    document.body.appendChild(highlight)
    setHighlightElementRef(highlight)
  }

  const removeHighlight = () => {
    if (highlightElementRef) {
      try {
        if (highlightElementRef.parentNode) {
          highlightElementRef.parentNode.removeChild(highlightElementRef)
        }
      } catch (e) {
        // Element might already be removed
      }
      setHighlightElementRef(null)
    }
    
    // Also clean up any orphaned highlights
    const orphanedHighlights = document.querySelectorAll('.mcl-element-highlight')
    orphanedHighlights.forEach(highlight => {
      try {
        if (highlight.parentNode) {
          highlight.parentNode.removeChild(highlight)
        }
      } catch (e) {
        // Element might already be removed
      }
    })
  }

  const startElementReselection = () => {
    setIsReselectingElement(true)
    setShowStepEditor(false)
    document.body.style.cursor = 'crosshair'
    
    const overlay = document.createElement('div')
    overlay.className = 'mcl-reselect-overlay'
    overlay.textContent = 'Click on an element to select it...'
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px 25px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 1000300;
      pointer-events: none;
    `
    document.body.appendChild(overlay)
  }

  const stopElementReselection = () => {
    setIsReselectingElement(false)
    document.body.style.cursor = ''
    removeHighlight()
    
    const overlay = document.querySelector('.mcl-reselect-overlay')
    if (overlay) {
      overlay.remove()
    }
    
    setShowStepEditor(true)
  }

  const isModalOpen = () => showStepEditor

  const getCurrentPageUrl = () => {
    if (window.location.pathname.includes('/wp-admin/')) {
      // Admin area - normalize similar to TourPlayback logic
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
      params.delete('mcl_tour_mode')
      params.delete('tour_id') 
      params.delete('mcl_continue_tour')
      params.delete('mcl_tour_step')
      params.delete('mcl_preview_step')
      
      if (params.toString()) {
        path += '?' + params.toString()
      }
      
      return path
    }
    
    // Frontend URL - remove tour parameters but keep the rest
    const url = new URL(window.location.href)
    url.searchParams.delete('mcl_tour_mode')
    url.searchParams.delete('tour_id')
    url.searchParams.delete('mcl_continue_tour')
    url.searchParams.delete('mcl_tour_step')
    url.searchParams.delete('mcl_preview_step')
    
    let cleanUrl = url.pathname
    if (url.searchParams.toString()) {
      cleanUrl += '?' + url.searchParams.toString()
    }
    return cleanUrl
  }

  const getTourParams = () => {
    const params = {
      'mcl_tour_mode': '1'
    }
    
    if (tourId > 0) {
      params['tour_id'] = tourId
    }
    
    return params
  }

  const appendTourParams = (url) => {
    try {
      // Handle relative URLs by using current page URL as base
      const urlObj = new URL(url, window.location.href)
      const tourParams = getTourParams()
      
      Object.keys(tourParams).forEach(key => {
        urlObj.searchParams.set(key, tourParams[key])
      })
      
      return urlObj.toString()
    } catch (e) {
      // Fallback for edge cases where URL parsing fails
      const separator = url.includes('?') ? '&' : '?'
      const tourParams = getTourParams()
      const paramString = Object.keys(tourParams)
        .map(key => `${key}=${encodeURIComponent(tourParams[key])}`)
        .join('&')
      
      // Handle WordPress admin URLs that might be relative
      let finalUrl = url
      if (url.startsWith('admin.php') || url.startsWith('?page=') || url.startsWith('&page=')) {
        // Convert relative admin URLs to absolute
        const adminUrl = adminData?.admin_url || '/wp-admin/'
        if (url.startsWith('admin.php')) {
          finalUrl = adminUrl + url
        } else if (url.startsWith('?page=')) {
          finalUrl = adminUrl + 'admin.php' + url
        } else if (url.startsWith('&page=')) {
          finalUrl = adminUrl + 'admin.php?' + url.substring(1)
        }
      }
      
      return finalUrl + separator + paramString
    }
  }

  const isExternalLink = (href) => {
    try {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        const url = new URL(href)
        return url.origin !== window.location.origin
      }
      
      if (href.startsWith('//')) {
        const url = new URL(href, window.location.protocol)
        return url.origin !== window.location.origin
      }
      
      return false
    } catch (e) {
      return false
    }
  }

  const handleGetFormSubmission = (form) => {
    const action = form.getAttribute('action') || window.location.pathname
    const formData = new FormData(form)
    const tourParams = getTourParams()
    
    const params = new URLSearchParams()
    for (const [key, value] of formData.entries()) {
      params.append(key, value)
    }
    
    Object.keys(tourParams).forEach(key => {
      params.set(key, tourParams[key])
    })
    
    let url = action
    if (params.toString()) {
      url += (url.includes('?') ? '&' : '?') + params.toString()
    }
    
    window.location.href = url
  }

  const initUrlPreservation = () => {
    // URL preservation is handled by the event listeners in bindCreatorEvents
  }

  const showToast = (message, type = 'info', duration = 5000) => {
    // Use the toast system from useToast hook
    if (type === 'success') {
      showSuccess(message)
    } else if (type === 'error') {
      showError(message)
    } else if (type === 'warning') {
      showWarning(message)
    } else {
      showSuccess(message) // fallback
    }
  }

  const toggleMode = () => {
    const newMode = currentModeRef.current === 'select' ? 'navigate' : 'select'
    setCurrentMode(newMode)
    
    // Remove any existing highlights when switching modes
    if (newMode === 'navigate') {
      removeHighlight()
    }
  }

  const togglePanel = () => {
    setPanelCollapsed(prev => !prev)
  }

  const toggleStepsList = () => {
    setShowStepsList(prev => !prev)
  }

  const handleDocumentMouseLeave = (e) => {
    // Remove highlight when mouse leaves the document viewport
    if (e.relatedTarget === null || e.relatedTarget === document.documentElement) {
      removeHighlight()
    }
  }

  // Handle panel dragging
  const handleMouseDown = useCallback((e) => {
    // Only allow dragging from the header, but not from the toggle button
    if (e.target.closest('button')) return
    
    isDragging.current = true
    setIsDraggingPanel(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    
    const panelRect = panelRef.current.getBoundingClientRect()
    panelStart.current = { x: panelRect.left, y: panelRect.top }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return
    
    const deltaX = e.clientX - dragStart.current.x
    const deltaY = e.clientY - dragStart.current.y
    
    let newX = panelStart.current.x + deltaX
    let newY = panelStart.current.y + deltaY
    
    // Constrain to viewport
    const panelWidth = panelRef.current.offsetWidth
    const panelHeight = panelRef.current.offsetHeight
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    newX = Math.max(10, Math.min(newX, viewportWidth - panelWidth - 10))
    newY = Math.max(10, Math.min(newY, viewportHeight - panelHeight - 10))
    
    setPanelPosition({ 
      top: newY, 
      left: newX, 
      right: 'auto' 
    })
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    setIsDraggingPanel(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  return (
    <div className="mcl-tour-creator" data-mode={currentMode}>
      {/* Floating Control Panel */}
      <div 
        ref={panelRef}
        className={`mcl-tour-floating-panel ${panelCollapsed ? 'collapsed' : ''} ${isDraggingPanel ? 'dragging' : ''}`}
        style={{
          position: 'fixed',
          top: panelPosition.top,
          right: panelPosition.right,
          left: panelPosition.left,
          width: '280px',
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: isDraggingPanel ? '0 8px 30px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.15)',
          pointerEvents: 'all',
          zIndex: 1000100,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          transition: isDraggingPanel ? 'none' : 'box-shadow 0.2s ease',
          cursor: isDraggingPanel ? 'grabbing' : 'grab',
        }}
      >
        {/* Panel Header */}
        <div 
          className="mcl-panel-header"
          onMouseDown={handleMouseDown}
          style={{
            background: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            borderRadius: '8px 8px 0 0',
            padding: '10px 15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: isDraggingPanel ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span className="dashicons dashicons-move" style={{ color: '#8c8f94', fontSize: '16px' }}></span>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#1d2327' }}>Tour Creator</span>
          </div>
          <button 
            type="button" 
            onClick={togglePanel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              color: '#646970'
            }}
          >
            <span className={`dashicons ${panelCollapsed ? 'dashicons-arrow-up-alt2' : 'dashicons-arrow-down-alt2'}`}></span>
          </button>
        </div>

        {/* Panel Content */}
        {!panelCollapsed && (
          <div style={{ padding: '15px' }}>
            {/* Mode Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '15px',
              padding: '10px',
              background: currentMode === 'select' ? '#f0f6fc' : '#f0f9f0',
              border: `1px solid ${currentMode === 'select' ? '#d0d7de' : '#b8e6b8'}`,
              borderRadius: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: currentMode === 'select' ? '#1d4ed8' : '#166534' }}>
                  <span className={`dashicons ${currentMode === 'select' ? 'dashicons-welcome-view-site' : 'dashicons-navigation'}`} style={{ fontSize: '16px' }}></span>
                  <span>{currentMode === 'select' ? 'Select Mode' : 'Navigate Mode'}</span>
                </div>
                <Button
                  size="sm"
                  color="gray"
                  onClick={toggleMode}
                  className="flex items-center gap-1"
                >
                  <span className={`dashicons ${currentMode === 'select' ? 'dashicons-navigation' : 'dashicons-welcome-view-site'}`} style={{ fontSize: '14px' }}></span>
                  <span>{currentMode === 'select' ? 'Navigate' : 'Select'}</span>
                </Button>
              </div>
              <div style={{ fontSize: '11px', color: '#646970', fontStyle: 'italic' }}>
                {currentMode === 'select' 
                  ? 'Click on elements to create tour steps'
                  : 'Navigate the site normally - links and forms will work'
                }
              </div>
            </div>

            {/* Actions Section */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
              <Button
                size="sm"
                color="blue"
                onClick={saveTour}
                disabled={processingActions.has('save')}
                className="flex-1"
              >
                <span className="dashicons dashicons-yes" style={{ fontSize: '14px' }}></span>
                {processingActions.has('save') ? 'Saving...' : 'Save'}
              </Button>
              
              <Button
                size="sm"
                color="gray"
                onClick={previewTour}
                className="flex-1"
                disabled={tourSteps.length === 0}
              >
                <span className="dashicons dashicons-visibility" style={{ fontSize: '14px' }}></span>
                Preview
              </Button>
              
              <Button
                size="sm"
                color="failure"
                onClick={exitCreator}
                className="flex-1"
              >
                <span className="dashicons dashicons-no" style={{ fontSize: '14px' }}></span>
                Exit
              </Button>
            </div>

            {/* Steps Info */}
            <div style={{
              padding: '8px',
              background: '#f9f9f9',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#646970'
            }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
                onClick={toggleStepsList}
              >
                <span style={{ flex: 1, textAlign: 'center', fontWeight: '500' }}>
                  {tourSteps.length} {tourSteps.length === 1 ? 'step' : 'steps'}
                </span>
                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#646970' }}>
                  <span className={`dashicons ${showStepsList ? 'dashicons-arrow-up-alt2' : 'dashicons-arrow-down-alt2'}`} style={{ fontSize: '14px' }}></span>
                </button>
              </div>
              
              {showStepsList && (
                <div style={{ marginTop: '8px', borderTop: '1px solid #e0e0e0', paddingTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {tourSteps.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#8c8f94', fontStyle: 'italic', padding: '8px' }}>
                      No steps added yet. Click on elements to create steps.
                    </div>
                  ) : (
                    tourSteps.map((step, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '6px',
                        marginBottom: '4px',
                        background: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '3px',
                        fontSize: '11px'
                      }}>
                        <div style={{
                          background: '#2271b1',
                          color: 'white',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '500', color: '#1d2327', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {step.title || 'Untitled Step'}
                          </div>
                          <div style={{ color: '#646970', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {step.element || 'No element'}
                          </div>
                          {step.page_url && (
                            <div style={{ color: '#2271b1', fontSize: '10px', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                              {step.page_url}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          <button 
                            type="button" 
                            onClick={() => editStep(index)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#f8f9fa',
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer',
                              padding: '4px',
                              color: '#4a5568',
                              borderRadius: '4px',
                              width: '24px',
                              height: '24px'
                            }}
                          >
                            <span className="dashicons dashicons-edit" style={{ fontSize: '12px' }}></span>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => deleteStep(index)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#f8f9fa',
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer',
                              padding: '4px',
                              color: '#4a5568',
                              borderRadius: '4px',
                              width: '24px',
                              height: '24px'
                            }}
                          >
                            <span className="dashicons dashicons-trash" style={{ fontSize: '12px' }}></span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step Editor Modal */}
      <div className={`mcl-step-editor-modal ${showStepEditor ? 'open' : ''}`} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000200,
        display: showStepEditor ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1d2327' }}>Edit Tour Step</h2>
            <button 
              onClick={() => setShowStepEditor(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
                color: '#646970',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="step-title" value="Step Title" />
                <TextInput
                  id="step-title"
                  value={stepForm.title}
                  onChange={(e) => setStepForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter step title..."
                />
              </div>

              <div>
                <Label htmlFor="step-content" value="Step Content" />
                <Textarea
                  id="step-content"
                  rows={5}
                  value={stepForm.content}
                  onChange={(e) => setStepForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter the content for this step..."
                />
                <p className="text-sm text-gray-600 mt-1">You can use HTML for formatting.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="step-checklist" value="Link to Checklist" />
                  <Select
                    id="step-checklist"
                    value={stepForm.checklist_id}
                    onChange={(e) => setStepForm(prev => ({ ...prev, checklist_id: e.target.value, checklist_item_id: '' }))}
                  >
                    <option value="">Select a checklist (optional)</option>
                    {checklists.map(checklist => (
                      <option key={checklist.id} value={checklist.id}>
                        {checklist.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="step-checklist-item" value="Link to Item" />
                  <Select
                    id="step-checklist-item"
                    value={stepForm.checklist_item_id}
                    onChange={(e) => setStepForm(prev => ({ ...prev, checklist_item_id: e.target.value }))}
                    disabled={!stepForm.checklist_id}
                  >
                    <option value="">Select an item (optional)</option>
                    {stepForm.checklist_id && checklists
                      .find(c => c.id == stepForm.checklist_id)
                      ?.items?.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.content}
                        </option>
                      ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="step-position" value="Popover Position" />
                  <Select
                    id="step-position"
                    value={stepForm.position}
                    onChange={(e) => setStepForm(prev => ({ ...prev, position: e.target.value }))}
                  >
                    <option value="bottom">Bottom (Default)</option>
                    <option value="top">Top</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="step-element" value="Target Element" />
                  <div className="flex gap-2">
                    <TextInput
                      id="step-element"
                      value={stepForm.element}
                      onChange={(e) => setStepForm(prev => ({ ...prev, element: e.target.value }))}
                      placeholder="CSS selector (e.g., #my-button)"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      color="gray"
                      onClick={startElementReselection}
                      title="Click to select element visually"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 24" className="w-4 h-4">
                        <path fill="currentColor" d="M5.523 4.75a.75.75 0 0 0-.75.75v1.625a.75.75 0 0 1-1.5 0V5.5a2.25 2.25 0 0 1 2.25-2.25h1.625a.75.75 0 0 1 0 1.5z"/>
                      </svg>
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Enter a CSS selector or click the crosshairs to select an element visually.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="step-page-url" value="Page URL" />
                <TextInput
                  id="step-page-url"
                  value={stepForm.page_url}
                  onChange={(e) => setStepForm(prev => ({ ...prev, page_url: e.target.value }))}
                  placeholder="Leave empty for current page"
                />
                <p className="text-sm text-gray-600 mt-1">
                  The page where this step should appear. Leave empty to use the current page.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="step-show-buttons"
                  checked={stepForm.show_buttons}
                  onChange={(e) => setStepForm(prev => ({ ...prev, show_buttons: e.target.checked }))}
                />
                <Label htmlFor="step-show-buttons">Show navigation buttons</Label>
              </div>
            </div>
          </div>
          
          <div style={{
            padding: '20px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}>
            <Button color="gray" onClick={() => setShowStepEditor(false)}>
              Cancel
            </Button>
            <Button color="blue" onClick={saveStep}>
              Save Step
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden input for tour title - managed by parent component */}
      <input 
        type="hidden" 
        id="mcl-tour-title"
        value={tourTitle} 
        readOnly
      />

      {/* Exit Confirmation Modal */}
      <ConfirmationModal
        isOpen={showExitConfirmation}
        onClose={() => setShowExitConfirmation(false)}
        onConfirm={handleExitConfirm}
        title="Exit Tour Creator?"
        message="Are you sure you want to exit? Any unsaved changes will be lost."
        confirmText="Yes, exit"
        cancelText="No, continue editing"
        confirmButtonClass="bg-orange-600 hover:bg-orange-700 focus:ring-orange-300 dark:bg-orange-500 dark:hover:bg-orange-600 dark:focus:ring-orange-900"
        icon="warning"
      />

      {/* Delete Step Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false)
          setStepToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Tour Step?"
        message={stepToDelete !== null ? `Are you sure you want to delete "${tourSteps[stepToDelete]?.title || 'Untitled Step'}"?` : "Are you sure you want to delete this step?"}
        confirmText="Yes, delete"
        cancelText="No, keep it"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900"
        icon="delete"
      />
    </div>
  )
}

export default TourCreator 