import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { formatDate, formatDeadlineCountdown } from '../utils/dateUtils'

// Custom hooks for different concerns
const useRateLimit = (checklistData) => {
  const isRateLimitEnabled = useCallback(() => {
    // Check if rate limiting is enabled for the current checklist
    return checklistData?.enable_rate_limit === true
  }, [checklistData])

  const checkRateLimit = useCallback((storageKey, maxOperations = 5) => {
    if (!isRateLimitEnabled()) return { allowed: true }

    const now = Date.now()
    const windowMs = 60000 // 1 minute
    
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const recentOperations = data.filter(timestamp => now - timestamp < windowMs)
      
      if (recentOperations.length >= maxOperations) {
        const oldestOperation = Math.min(...recentOperations)
        const resetTime = oldestOperation + windowMs
        return { 
          allowed: false, 
          resetTime,
          remaining: Math.ceil((resetTime - now) / 1000)
        }
      }
      
      // Add current operation
      recentOperations.push(now)
      localStorage.setItem(storageKey, JSON.stringify(recentOperations))
      
      return { allowed: true }
    } catch (error) {
      console.warn('Rate limit check failed:', error)
      return { allowed: true }
    }
  }, [isRateLimitEnabled])

  return { checkRateLimit, isRateLimitEnabled }
}

const useAPI = () => {
  const makeRequest = useCallback(async (endpoint, data = {}) => {
    const formData = new FormData()
    
    // Use the correct WordPress AJAX URL and nonce
    const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
    const nonce = window.magiccl_checklists?.nonce || ''
    
    // Append action and nonce
    formData.append('action', endpoint)
    if (nonce) {
      formData.append('nonce', nonce)
    }

    // Add stored token for invite users if available
    const storedToken = window.magiccl_checklists?.invite_token?.token
    if (storedToken) {
      formData.append('stored_token', storedToken)
    }

    // Append data fields, handling arrays as JSON strings
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          // Send arrays as JSON strings since the backend expects JSON
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, value)
        }
      }
    })

    const response = await fetch(ajaxUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }, [])

  return { makeRequest }
}

const useChecklistData = () => {
  const { makeRequest } = useAPI()
  
  const fetchChecklistData = useCallback(async (checklistId) => {
    try {
      const response = await makeRequest('magiccl_get_checklist', { checklist_id: checklistId })
      
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.data?.message || 'Failed to load checklist')
      }
    } catch (error) {
      console.error('Error fetching checklist:', error)
      throw error
    }
  }, [makeRequest])

  const saveChecklistData = useCallback(async (checklistId, title, items) => {
    try {
      const response = await makeRequest('magiccl_update_checklist', {
        checklist_id: checklistId,
        title,
        items: JSON.stringify(items)
      })

      if (!response.success) {
        throw new Error(response.data?.message || 'Failed to save checklist')
      }

      return response.data
    } catch (error) {
      console.error('Error saving checklist:', error)
      throw error
    }
  }, [makeRequest])

  return { fetchChecklistData, saveChecklistData }
}

const useCheckedState = () => {
  const { makeRequest } = useAPI()

  const getCheckedState = useCallback((checklistId) => {
    if (!checklistId) return []
    
    try {
      // Fall back to local storage only
      const localKey = `magiccl_checked_${checklistId}`
      const localState = localStorage.getItem(localKey)
      return localState ? JSON.parse(localState) : []
    } catch (error) {
      console.warn('Error getting checked state:', error)
      return []
    }
  }, [])

  const saveCheckedState = useCallback(async (checklistId, checkedItems, context = 'drawer', checklistData = null) => {
    if (!checklistId) return

    // Determine storage mode based on checklist configuration
    const storageMode = getStorageMode(checklistData)

    try {
      if (storageMode === 'localStorage') {
        // For per-user checklists with logged-out users: use localStorage only
        const localKey = `magiccl_checked_${checklistId}`
        localStorage.setItem(localKey, JSON.stringify(checkedItems))
      } else {
        // For global checklists or per-user with logged-in users: save to server only
        const response = await makeRequest('magiccl_save_checked_state', {
          checklist_id: checklistId,
          checked_items: checkedItems,
          context: context
        })

        if (response.success) {
        } else {
          console.error('MCL Drawer: Failed to save checked state to server:', response.data)
          throw new Error('Server save failed')
        }
      }
    } catch (error) {
      console.warn('Error saving checked state:', error)
      
      // Only fallback to localStorage for logged-out users or if explicitly using localStorage mode
      if (storageMode === 'localStorage') {
        const localKey = `magiccl_checked_${checklistId}`
        localStorage.setItem(localKey, JSON.stringify(checkedItems))
      } else {
        // For logged-in users, don't fallback to localStorage - let the error bubble up
        throw error
      }
    }
  }, [makeRequest])

  // Helper function to determine storage mode
  const getStorageMode = useCallback((checklistData) => {
    if (!checklistData) return 'server' // Default fallback

    const isLoggedIn = window.magiccl_checklists?.user_access?.is_logged_in || false
    const isPublic = checklistData.is_public
    
    // Determine handling mode (mirrors PHP logic)
    let handlingMode
    if (isPublic) {
      // For public checklists, get the public handling mode (defaults to 'per_user')
      handlingMode = checklistData.checked_state_handling || 'per_user'
    } else {
      // For non-public checklists, get the regular handling mode (defaults to 'global')  
      handlingMode = checklistData.checked_state_handling || 'global'
    }

    // Determine storage mode based on handling and login status
    if (handlingMode === 'global') {
      // Global checklists: always use server storage (post meta)
      return 'server'
    } else if (handlingMode === 'per_user') {
      if (isLoggedIn) {
        // Logged-in users: use server storage (user meta)
        return 'server'
      } else {
        // Logged-out users: use localStorage only
        return 'localStorage'
      }
    }

    return 'server' // Default fallback
  }, [])

  return { getCheckedState, saveCheckedState }
}

// Theme colors configuration
const getThemeColors = (theme) => {
  switch (theme) {
    case 'dark':
      return {
        bg: 'bg-brand-dark',
        surface: 'bg-slate-700',
        border: 'border-slate-600',
        text: 'text-white',
        textSecondary: 'text-slate-300',
        accent: 'bg-brand-accent text-slate-800',
        accentHover: 'hover:bg-yellow-300',
        buttonSecondary: 'bg-slate-600 hover:bg-red-600 text-white',
        checkbox: 'bg-brand-accent',
        itemHover: 'hover:bg-slate-600'
      }
    case 'custom':
      return {
        // For custom themes, use minimal classes to let CSS take over
        bg: '',
        surface: '',
        border: '',
        text: '',
        textSecondary: '',
        accent: '',
        accentHover: '',
        buttonSecondary: '',
        checkbox: '',
        itemHover: ''
      }
    case 'light':
    default:
      return {
        bg: 'bg-white',
        surface: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        accent: 'bg-brand-accent text-blue-900',
        accentHover: 'hover:bg-yellow-300',
        buttonSecondary: 'bg-gray-100 hover:bg-red-500 hover:text-white border border-gray-200',
        checkbox: 'bg-brand-accent',
        itemHover: 'hover:bg-yellow-400/20'
      }
  }
}

// Image management hook
const useImageManager = (canEdit, currentChecklistId, items, title, setItems) => {
  const [modal, setModal] = useState(null)
  const [currentItem, setCurrentItem] = useState(null)
  const [existingImages, setExistingImages] = useState([])
  const [loadingImages, setLoadingImages] = useState(false)
  // Add image resizing state
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const [resizingImage, setResizingImage] = useState(null)
  
  const { makeRequest } = useAPI()
  const { saveChecklistData } = useChecklistData()
  const insertImageRef = useRef(null)

  const handleImageButtonClick = useCallback((listItem) => {
    setCurrentItem(listItem)
    
    // Check if user is logged in and can use media library
    const isLoggedIn = window.magiccl_checklists?.user_access?.is_logged_in || false
    
    if (isLoggedIn && typeof wp !== 'undefined' && wp.media) {
      // Show choice modal for logged in users
      setModal('choice')
    } else {
      // Show upload area directly for non-logged in users
      setModal('upload')
    }
  }, [])

  const closeModal = useCallback(() => {
    setModal(null)
    setCurrentItem(null)
    setExistingImages([])
  }, [])

  const openQuickUpload = useCallback(() => {
    setModal('upload')
  }, [])

  const openMediaLibrary = useCallback(() => {
    if (typeof wp === 'undefined' || !wp.media) {
      console.error('WordPress media library not available')
      return
    }

    // Close the React modal immediately but keep the item context
    setModal(null)

    const mediaFrame = wp.media({
      title: 'Select Image',
      library: { type: 'image' },
      multiple: false,
      button: { text: 'Insert Image' }
    })

    mediaFrame.on('select', () => {
      const attachment = mediaFrame.state().get('selection').first().toJSON()
      insertImageRef.current?.(attachment)
      // Clear the current item after successful insertion
      setCurrentItem(null)
      setExistingImages([])
    })

    mediaFrame.on('open', () => {
      const drawer = document.getElementById('magiccl-drawer')
      if (drawer) { drawer.style.zIndex = '99999' }
    })

    mediaFrame.on('close', () => {
      const drawer = document.getElementById('magiccl-drawer')
      if (drawer) { drawer.style.zIndex = '999999' }
      // Clean up if user cancels
      if (currentItem) {
        setCurrentItem(null)
        setExistingImages([])
      }
    })

    mediaFrame.open()
  }, [])

  const loadExistingImages = useCallback(async (checklistId) => {
    if (!checklistId) return;
    setLoadingImages(true)
    try {
      const response = await makeRequest('magiccl_get_uploaded_images', {
        checklist_id: checklistId
      })
      
      if (response.success) {
        setExistingImages(response.data)
      } else {
        console.error('Failed to load existing images:', response.data?.message)
        setExistingImages([])
      }
    } catch (error) {
      console.error('Error loading existing images:', error)
      setExistingImages([])
    } finally {
      setLoadingImages(false)
    }
  }, [makeRequest])

  const uploadImage = useCallback(async (file, checklistId) => {
    const formData = new FormData()
    formData.append('action', 'magiccl_upload_image')
    formData.append('file', file)
    formData.append('checklist_id', checklistId || 0)

    // Add nonce if available
    const nonce = window.magiccl_checklists?.nonce
    if (nonce) {
      formData.append('nonce', nonce)
    }

    // Add stored token for invite users if available
    const storedToken = window.magiccl_checklists?.invite_token?.token
    if (storedToken) {
      formData.append('stored_token', storedToken)
    }

    const response = await fetch(window.magiccl_checklists.ajax_url, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }, [])

  const insertImage = useCallback((imageData) => {
    if (!currentItem) return

    const contentDiv = currentItem.querySelector('.magiccl-item-content')
    if (!contentDiv) return

    // Create image element
    const img = document.createElement('img')
    img.src = imageData.url
    img.alt = imageData.alt || ''
    img.className = 'max-w-full h-auto rounded-md my-2 cursor-ew-resize magiccl-item-image'
    img.setAttribute('data-magiccl-image', 'true')

    // Calculate dimensions maintaining aspect ratio
    const maxWidth = 400
    const aspectRatio = imageData.height / imageData.width
    let newWidth, newHeight

    if (imageData.width > maxWidth) {
      newWidth = maxWidth
      newHeight = Math.round(maxWidth * aspectRatio)
    } else {
      newWidth = imageData.width
      newHeight = imageData.height
    }

    // Set constrained dimensions
    img.width = newWidth
    img.height = newHeight
    img.style.width = `${newWidth}px`
    img.style.height = `${newHeight}px`

    // Insert image
    contentDiv.appendChild(img)
    
    // Save the checklist after inserting image
    if (canEdit && currentChecklistId) {
      const listItem = currentItem.closest('[data-item-id]')
      if (listItem) {
        const itemId = listItem.getAttribute('data-item-id')
        if (itemId) {
          // Update the item content in state with the new image
          const updatedItems = items.map(item => 
            item.id === itemId ? { ...item, content: contentDiv.innerHTML } : item
          )
          setItems(updatedItems)
          
          // Save to server
          saveChecklistData(currentChecklistId, title, updatedItems)
            .catch(err => console.warn('Error saving after image insertion:', err))
        }
      }
    }
    
    setCurrentItem(null)
  }, [currentItem, canEdit, currentChecklistId, items, title, saveChecklistData, setItems])

  // Image resizing functions
  const startImageResize = useCallback((e, img) => {
    e.preventDefault()
    setIsResizing(true)
    setResizeStartX(e.clientX)
    setResizeStartWidth(img.offsetWidth)
    setResizingImage(img)
    img.classList.add('magiccl-resizing')
  }, [])

  const handleImageResize = useCallback((e) => {
    if (!isResizing || !resizingImage) return

    const currentX = e.clientX
    const diff = currentX - resizeStartX

    // Calculate new width maintaining aspect ratio
    const newWidth = Math.max(50, Math.min(400, resizeStartWidth + diff))
    const aspectRatio = resizingImage.naturalHeight / resizingImage.naturalWidth

    resizingImage.style.width = `${newWidth}px`
    resizingImage.style.height = `${Math.round(newWidth * aspectRatio)}px`
  }, [isResizing, resizingImage, resizeStartX, resizeStartWidth])

  const stopImageResize = useCallback(() => {
    if (resizingImage) {
      resizingImage.classList.remove('magiccl-resizing')
      setResizingImage(null)
      
      // Save the checklist after resizing
      if (canEdit && currentChecklistId) {
        // Get the updated content from the item
        const listItem = resizingImage.closest('[data-item-id]')
        if (listItem) {
          const itemId = listItem.getAttribute('data-item-id')
          const contentDiv = listItem.querySelector('.magiccl-item-content')
          if (contentDiv && itemId) {
            // Update the item content in state
            const updatedItems = items.map(item => 
              item.id === itemId ? { ...item, content: contentDiv.innerHTML } : item
            )
            setItems(updatedItems)
            
            // Save to server
            saveChecklistData(currentChecklistId, title, updatedItems)
              .catch(err => console.warn('Error saving after image resize:', err))
          }
        }
      }
    }

    setIsResizing(false)
    setResizeStartX(0)
    setResizeStartWidth(0)
  }, [resizingImage, canEdit, currentChecklistId, items, title, saveChecklistData, setItems])

  // Set up global mouse event listeners for image resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        handleImageResize(e)
      }
    }

    const handleMouseUp = () => {
      if (isResizing) {
        stopImageResize()
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, handleImageResize, stopImageResize])

  useEffect(() => {
    insertImageRef.current = insertImage
  }, [insertImage])

  return {
    modal,
    currentItem,
    existingImages,
    loadingImages,
    handleImageButtonClick,
    closeModal,
    openQuickUpload,
    openMediaLibrary,
    loadExistingImages,
    uploadImage,
    insertImage,
    startImageResize,
    isResizing
  }
}

// Link management hook
const useLinkManager = () => {
  const [isToolbarVisible, setIsToolbarVisible] = useState(false)
  const [selectedText, setSelectedText] = useState(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [currentSelection, setCurrentSelection] = useState(null)

  const showLinkToolbar = useCallback((selection) => {
    setCurrentSelection(selection)
    setSelectedText(selection.toString())
    setIsToolbarVisible(true)
  }, [])

  const hideLinkToolbar = useCallback(() => {
    setIsToolbarVisible(false)
    setSelectedText(null)
    setLinkUrl('')
    setCurrentSelection(null)
  }, [])

  const createLink = useCallback((url) => {
    if (!currentSelection || !url) return

    try {
      // Normalize URL
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url
      }

      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.className = 'text-blue-600 hover:text-blue-800 underline'
      link.textContent = currentSelection.toString()

      // Replace selected text with link
      const range = currentSelection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(link)

      hideLinkToolbar()
    } catch (error) {
      console.error('Error creating link:', error)
    }
  }, [currentSelection, hideLinkToolbar])

  const isValidUrl = useCallback((url) => {
    if (!url) return false
    
    url = url.trim()
    if (!url) return false
    
    // If it doesn't start with a protocol, check if it's a valid domain
    if (!/^https?:\/\//i.test(url)) {
      // Basic domain validation (allows domains like example.com, sub.example.com)
      return /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/i.test(url)
    }
    
    // If it has a protocol, validate it as a full URL
    try {
      const urlObject = new URL(url)
      return ['http:', 'https:'].includes(urlObject.protocol)
    } catch {
      return false
    }
  }, [])

  return {
    isToolbarVisible,
    selectedText,
    linkUrl,
    setLinkUrl,
    showLinkToolbar,
    hideLinkToolbar,
    createLink,
    isValidUrl
  }
}

// Tour integration hook
const useTourIntegration = () => {
  const { makeRequest } = useAPI()

  // Check if any active tours exist (optimized with server-side caching)
  const hasActiveTours = useCallback(async () => {
    try {
      const response = await makeRequest('magiccl_has_active_tours', {})
      if (response.success) {
        return response.data.has_tours
      }
    } catch (error) {
      console.error('Error checking for active tours:', error)
    }
    return false
  }, [makeRequest])

  // Batch check tour connections for multiple items (optimized)
  const checkBatchTourConnections = useCallback(async (checklistId, itemIds) => {
    try {
      const response = await makeRequest('magiccl_get_batch_tour_connections', {
        checklist_id: checklistId,
        item_ids: JSON.stringify(itemIds)
      })

      if (response.success) {
        return response.data.connections || {}
      }
    } catch (error) {
      console.error('Error batch checking tour connections:', error)
    }
    return {}
  }, [makeRequest])

  const checkTourConnections = useCallback(async (checklistId, itemId) => {
    try {
      const response = await makeRequest('magiccl_get_item_tour_connections', {
        checklist_id: checklistId,
        item_id: itemId
      })

      if (response.success && response.data.connections.length > 0) {
        return response.data.connections
      }
    } catch (error) {
      console.error('Error checking tour connections:', error)
    }
    return []
  }, [makeRequest])

  const startTourFromConnection = useCallback(async (connections) => {
    const connection = connections[0]
    
    // Use the step_index returned by the server directly (already 0-based)
    const stepIndex = parseInt(connection.step_index, 10) || 0
    
    try {
      // First, fetch the tour data to check if the target step is on the current page
      const response = await makeRequest('magiccl_get_tour_data', { tour_id: connection.tour_id })
      
      if (response.success && response.data.steps) {
        const tourData = response.data
        const targetStep = tourData.steps[stepIndex]
        
        if (targetStep) {
          // Normalize URLs for comparison (same logic as TourPlayback)
          const normalizeUrl = (url) => {
            if (!url) return getCurrentPageUrl()
            if (url === '/wp-admin/index.php' || url === '/wp-admin/') {
              return '/wp-admin/'
            }
            return url
          }
          
          const getCurrentPageUrl = () => {
            if (window.location.pathname.includes('/wp-admin/')) {
              let path = '/wp-admin/'
              if (window.location.pathname !== '/wp-admin/' && window.location.pathname !== '/wp-admin/index.php') {
                const adminPage = window.location.pathname.replace('/wp-admin/', '')
                if (adminPage && adminPage !== 'index.php') {
                  path += adminPage
                }
              }
              
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
          
          const currentPageUrl = getCurrentPageUrl()
          const targetPageUrl = targetStep.page_url || currentPageUrl
          
          const normalizedCurrentUrl = normalizeUrl(currentPageUrl)
          const normalizedTargetUrl = normalizeUrl(targetPageUrl)
          
          console.log('MCL Tour: Checking if step is on current page:', {
            currentPageUrl,
            targetPageUrl,
            normalizedCurrentUrl,
            normalizedTargetUrl,
            areEqual: normalizedCurrentUrl === normalizedTargetUrl,
            stepIndex
          })
          
          // If the target step is on the current page, start the tour directly
          if (normalizedCurrentUrl === normalizedTargetUrl) {
            console.log('MCL Tour: Starting tour directly on current page from step', stepIndex)
            
            // Start the tour directly using the global tour playback instance
            if (window.magicclTourPlayback?.startTour) {
              window.magicclTourPlayback.startTour({
                ...tourData,
                continue_from_step: stepIndex
              })
              return
            }
          }
        }
      }
    } catch (error) {
      console.error('MCL Tour: Error checking step page, falling back to URL navigation:', error)
    }
    
    // Fallback: Navigate with URL parameters (for different pages or if direct start fails)
    console.log('MCL Tour: Navigating to different page or falling back to URL method for step', stepIndex)
    
    const params = new URLSearchParams()
    params.set('magiccl_continue_tour', connection.tour_id)
    params.set('magiccl_tour_step', stepIndex.toString())
    
    let tourUrl = window.location.pathname
    if (window.location.search) {
      const existingParams = new URLSearchParams(window.location.search)
      for (const [key, value] of params) {
        existingParams.set(key, value)
      }
      tourUrl += '?' + existingParams.toString()
    } else {
      tourUrl += '?' + params.toString()
    }
    
    window.location.href = tourUrl
  }, [makeRequest])

  return useMemo(() => ({
    checkTourConnections,
    checkBatchTourConnections,
    hasActiveTours,
    startTourFromConnection
  }), [checkTourConnections, checkBatchTourConnections, hasActiveTours, startTourFromConnection])
}

// Content editing utilities
const useContentEditing = () => {
  const convertUrlsToLinks = useCallback((text) => {
    const urlRegex = /(https?:\/\/(?:www\.|(?!www))[^\s.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi
    
    // First escape HTML special characters
    const escapedText = text.replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char])
    
    // Then convert URLs to anchor tags
    return escapedText.replace(urlRegex, (url) => {
      try {
        const fullUrl = url.startsWith('http') ? url : `https://${url}`
        const parsedUrl = new URL(fullUrl)
        
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
          return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${url}</a>`
        }
        return url
      } catch {
        return url
      }
    })
  }, [])

  const cleanPastedHTML = useCallback((html) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const allowedTags = ['a', 'b', 'strong', 'i', 'em', 'u', 'span', 'br']
    
    function cleanNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.cloneNode(true)
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase()
        
        if (!allowedTags.includes(tagName)) {
          return document.createTextNode(node.textContent)
        }
        
        const cleanEl = document.createElement(tagName)
        
        if (tagName === 'a') {
          const href = node.getAttribute('href')
          if (href && isValidUrl(href)) {
            cleanEl.setAttribute('href', href)
            cleanEl.setAttribute('target', '_blank')
            cleanEl.setAttribute('rel', 'noopener noreferrer')
            cleanEl.className = 'text-blue-600 hover:text-blue-800 underline'
          } else {
            return document.createTextNode(node.textContent)
          }
        }
        
        Array.from(node.childNodes).forEach(child => {
          const cleanChild = cleanNode(child)
          if (cleanChild) {
            cleanEl.appendChild(cleanChild)
          }
        })
        
        return cleanEl
      }
      
      return null
    }
    
    const cleanFragment = document.createDocumentFragment()
    Array.from(doc.body.childNodes).forEach(node => {
      const cleanedNode = cleanNode(node)
      if (cleanedNode) {
        cleanFragment.appendChild(cleanedNode)
      }
    })
    
    const output = document.createElement('div')
    output.appendChild(cleanFragment)
    return output.innerHTML
  }, [])

  const isValidUrl = useCallback((url) => {
    if (!url) return false
    
    url = url.trim()
    
    if (!/^https?:\/\//i.test(url)) {
      return /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(url)
    }
    
    try {
      const urlObject = new URL(url)
      return ['http:', 'https:'].includes(urlObject.protocol)
    } catch {
      return false
    }
  }, [])

  const handlePaste = useCallback((e, convertUrls = true) => {
    e.preventDefault()
    
    const plainText = (e.originalEvent || e).clipboardData.getData('text/plain')
    const htmlText = (e.originalEvent || e).clipboardData.getData('text/html')
    
    let processedContent
    
    if (htmlText) {
      processedContent = cleanPastedHTML(htmlText)
    } else if (convertUrls) {
      processedContent = convertUrlsToLinks(plainText)
    } else {
      processedContent = plainText.replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char])
    }
    
    // Insert at current selection
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      
      const temp = document.createElement('div')
      temp.innerHTML = processedContent
      
      const fragment = document.createDocumentFragment()
      while (temp.firstChild) {
        fragment.appendChild(temp.firstChild)
      }
      
      range.insertNode(fragment)
      
      // Move cursor to end
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }, [convertUrlsToLinks, cleanPastedHTML])

  return {
    convertUrlsToLinks,
    cleanPastedHTML,
    isValidUrl,
    handlePaste
  }
}

// Global keyboard shortcuts handler
const useGlobalKeyboardShortcuts = (toggleChecklist, isClosing) => {
  useEffect(() => {
    const handleKeyboardShortcut = (event) => {
      const activeChecklists = window.magiccl_checklists?.shortcuts || {}
      
      if (isClosing) {
        return
      }
      
      // Don't process shortcuts if shortcut input field is active
      if (window.magicclShortcutInputActive) {
        return
      }
      
      for (const [checklistId, checklistData] of Object.entries(activeChecklists)) {
        if (matchesShortcut(event, checklistData.shortcut)) {
          event.preventDefault()
          event.stopPropagation()
          toggleChecklist(checklistId)
          break
        }
      }
    }

    const matchesShortcut = (event, shortcut) => {
      // Add null check
      if (!shortcut) {
        return false
      }
  
      const keys = shortcut.toLowerCase().split('+')
      let keyMatch = true
  
      keys.forEach(key => {
        switch(key.trim()) {
          case 'ctrl':
            keyMatch = keyMatch && event.ctrlKey
            break
          case 'alt':
          case 'option':
            keyMatch = keyMatch && event.altKey
            break
          case 'shift':
            keyMatch = keyMatch && event.shiftKey
            break
          case 'meta':
          case 'cmd':
          case 'command':
            keyMatch = keyMatch && event.metaKey
            break
          default:
            keyMatch = keyMatch && (event.key.toLowerCase() === key.trim())
        }
      })
  
      // Ensure no extra modifier keys are pressed
      const totalModifiers = event.ctrlKey + event.altKey + event.shiftKey + event.metaKey
      const requiredModifiers = keys.filter(k => 
        ['ctrl', 'alt', 'option', 'shift', 'meta', 'cmd', 'command'].includes(k.trim())
      ).length
  
      return keyMatch && totalModifiers === requiredModifiers
    }

    // Add as capture to get it before other handlers
    document.addEventListener('keydown', handleKeyboardShortcut, true)
    
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut, true)
    }
  }, [toggleChecklist, isClosing])
}

// Modal component
const Modal = ({ isOpen, onClose, title, children, actions, className = '' }) => {
  if (!isOpen) return null

  return (
    <div className="magiccl-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999] p-4" onClick={onClose}>
      <div className={`magiccl-modal bg-white rounded-lg shadow-xl w-full max-w-md relative transform transition-all ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button 
            type="button" 
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
        {actions && (
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

// Image Choice Modal - for logged in users
const ImageChoiceModal = ({ isOpen, onClose, onMediaLibrary, onQuickUpload }) => {
  if (!isOpen) return null

  // Get i18n data
  const i18n = (typeof window !== 'undefined' && (window.magicclAdminData?.i18n || window.magicclPublicData?.i18n)) || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={i18n.checklistDrawer?.imageModal?.insertImageTitle || 'Insert Image'}>
      <p className="text-gray-600 mb-4">{i18n.checklistDrawer?.imageModal?.chooseHowToAdd || 'Choose how you would like to add an image:'}</p>
      <div className="flex flex-col gap-3">
        <button 
          type="button" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          onClick={onMediaLibrary}
        >
          {i18n.checklistDrawer?.imageModal?.wordPressMediaLibrary || 'WordPress Media Library'}
        </button>
        <button 
          type="button" 
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          onClick={onQuickUpload}
        >
          {i18n.checklistDrawer?.imageModal?.quickUpload || 'Quick Upload'}
        </button>
        <button 
          type="button" 
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          onClick={onClose}
        >
          {i18n.checklistDrawer?.buttons?.cancel || 'Cancel'}
        </button>
      </div>
    </Modal>
  )
}

// Enhanced Image Upload Modal with tabs
const ImageUploadModal = ({ isOpen, onClose, onUpload, onSelectExisting, checklistId, existingImages, loadingImages, onLoadExistingImages }) => {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('upload')
  const [selectedExisting, setSelectedExisting] = useState(null)

  // Load existing images when select tab is opened
  useEffect(() => {
    if (isOpen && activeTab === 'select' && existingImages.length === 0 && !loadingImages) {
      onLoadExistingImages(checklistId)
    }
  }, [isOpen, activeTab, checklistId, existingImages.length, loadingImages, onLoadExistingImages])

  const handleFileSelect = useCallback((selectedFile) => {
    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']

    if (!allowedTypes.includes(selectedFile.type)) {
      setError(i18n.checklistDrawer?.messages?.invalidFileType || 'Invalid file type. Please upload a JPG, PNG, or GIF image.')
      return
    }

    if (selectedFile.size > maxSize) {
      setError('File is too large. Maximum size is 10MB.')
      return
    }

    setFile(selectedFile)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(selectedFile)
  }, [])

  const handleUpload = useCallback(async () => {
    if (activeTab === 'upload' && file) {
      setUploading(true)
      try {
        const result = await onUpload(file, checklistId)
        if (result.success) {
          onSelectExisting(result.data)
          onClose()
        } else {
          setError(result.data?.message || 'Upload failed')
        }
      } catch (err) {
        setError('Upload failed. Please try again.')
      } finally {
        setUploading(false)
      }
    } else if (activeTab === 'select' && selectedExisting) {
      // Handle existing image selection
      onSelectExisting(selectedExisting)
      onClose()
    }
  }, [activeTab, file, selectedExisting, onUpload, onSelectExisting, checklistId, onClose])

  const handleTabSwitch = useCallback((tab) => {
    setActiveTab(tab)
    setError(null)
    setSelectedExisting(null)
  }, [])

  const getButtonText = () => {
    const i18n = (typeof window !== 'undefined' && (window.magicclAdminData?.i18n || window.magicclPublicData?.i18n)) || {};
    if (activeTab === 'upload') {
      return uploading ? (i18n.checklistDrawer?.imageModal?.uploading || 'Uploading...') : (i18n.checklistDrawer?.imageModal?.uploadImage || 'Upload Image')
    }
    return i18n.checklistDrawer?.imageModal?.selectImage || 'Select Image'
  }

  const isButtonDisabled = () => {
    if (activeTab === 'upload') {
      return !file || uploading
    }
    return !selectedExisting
  }

  const i18n = (typeof window !== 'undefined' && (window.magicclAdminData?.i18n || window.magicclPublicData?.i18n)) || {};

  const actions = (
    <>
      <button 
        type="button" 
        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors" 
        onClick={onClose}
      >
        {i18n.checklistDrawer?.buttons?.cancel || 'Cancel'}
      </button>
      <button 
        type="button" 
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleUpload}
        disabled={isButtonDisabled()}
      >
        {getButtonText()}
      </button>
    </>
  )

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={i18n.checklistDrawer?.imageModal?.uploadOrSelectTitle || 'Upload or Select Image'} actions={actions} className="max-w-2xl">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button 
          type="button" 
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'upload'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabSwitch('upload')}
        >
          {i18n.checklistDrawer?.imageModal?.uploadNew || 'Upload New'}
        </button>
        <button 
          type="button" 
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'select'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabSwitch('select')}
        >
          {i18n.checklistDrawer?.imageModal?.selectExisting || 'Select Existing'}
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onDragOver={e => { e.preventDefault() }}
            onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFileSelect(e.dataTransfer.files[0]) }}
            onClick={() => document.getElementById('image-upload-input').click()}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
              id="image-upload-input"
            />

            {!preview ? (
              <div className="space-y-3">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-gray-600">{i18n.checklistDrawer?.imageModal?.dragAndDrop || 'Drag and drop image here or click to select'}</p>
                <p className="text-sm text-gray-500">{i18n.checklistDrawer?.imageModal?.fileRestrictions || 'Maximum file size: 10MB. Supported formats: JPG, PNG, GIF'}</p>
              </div>
            ) : (
              <div className="relative">
                <img src={preview} alt="Preview" className="max-w-full h-auto rounded-md" />
                <button 
                  type="button" 
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-70 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    setPreview(null)
                    setError(null)
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Select Tab */}
      {activeTab === 'select' && (
        <div>
          {loadingImages ? (
            <div className="text-center py-8 text-gray-500">{i18n.checklistDrawer?.imageModal?.loadingImages || 'Loading images...'}</div>
          ) : existingImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {existingImages.map((image) => (
                <div
                  key={image.url}
                  className={`border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedExisting === image 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedExisting(image)}
                >
                  <img src={image.url} alt={image.filename} className="w-full h-24 object-cover rounded-t-md" />
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-800 truncate">{image.filename}</p>
                    <p className="text-xs text-gray-500">{image.width}×{image.height}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">{i18n.checklistDrawer?.imageModal?.noImagesFound || 'No images found'}</p>
          )}
        </div>
      )}
    </Modal>
  )
}

// Link Toolbar Component
const LinkToolbar = ({
  isVisible,
  position,
  linkUrl,
  setLinkUrl,
  onCreateLink,
  onClose,
  isValidUrl
}) => {
  const i18n = (typeof window !== 'undefined' && (window.magicclAdminData?.i18n || window.magicclPublicData?.i18n)) || {};
  
  if (!isVisible) return null

  const handleCreateLink = (url) => {
    if (url && url.trim() && isValidUrl(url.trim())) {
      onCreateLink(url.trim())
    }
  }

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-2"
      data-link-toolbar="true"
      style={{
        top: position?.y || 0,
        left: position?.x || 0,
        transform: 'translateX(-50%)',
        zIndex: 100001
      }}
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="px-3 py-1 border border-gray-300 rounded text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={i18n.checklistDrawer?.imageModal?.enterUrl || "Enter URL..."}
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              handleCreateLink(linkUrl)
            } else if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }
          }}
          autoFocus
        />
        <button
          type="button"
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleCreateLink(linkUrl)
          }}
          disabled={!linkUrl || !linkUrl.trim() || !isValidUrl(linkUrl.trim())}
        >
          ✓
        </button>
      </div>
    </div>
  )
}

// Comment component for threaded display
const Comment = ({ comment, onReply, onLike, onDelete, level = 0, isAdmin = false, i18n = {} }) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const replyFormRef = useRef(null)
  const replyInputRef = useRef(null)

  const handleReply = async () => {
    if (replyText.trim()) {
      await onReply(comment.id, replyText)
      setReplyText('')
      setShowReplyForm(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleReply()
    }
  }

  const handleShowReplyForm = () => {
    setShowReplyForm(true)
    setTimeout(() => {
      if (replyFormRef.current) {
        replyFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      if (replyInputRef.current) {
        replyInputRef.current.focus()
      }
    }, 100)
  }

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''} mb-4`}>
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {comment.user_name ? comment.user_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <span className="font-medium text-gray-900 text-sm">
                {comment.user_name || 'Anonymous'}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
              title={i18n.checklistDrawer?.comments?.deleteTitle || "Delete comment"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        <div className="text-gray-800 text-sm mb-3"
             dangerouslySetInnerHTML={{ __html: comment.comment_content?.replace(/\\'/g, "'").replace(/\\"/g, '"') || '' }} />

        <div className="flex items-center space-x-4 text-xs">
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center space-x-1 hover:bg-gray-200 rounded px-2 py-1 ${
              comment.user_liked ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            <span>{comment.user_liked ? '❤️' : '🤍'}</span>
            <span>{comment.like_count || 0}</span>
          </button>

          {level === 0 && (
            <button
              onClick={handleShowReplyForm}
              className="text-gray-500 hover:text-gray-700"
            >
              {i18n.checklistDrawer?.comments?.replyButton || 'Reply'}
            </button>
          )}
        </div>

        {showReplyForm && (
          <div ref={replyFormRef} className="mt-3 pt-3 border-t border-gray-200">
            <textarea
              ref={replyInputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={i18n.checklistDrawer?.comments?.replyPlaceholder || "Write a reply..."}
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900"
              rows={2}
            />
            <div className="flex items-center justify-end space-x-2 mt-2">
              <button
                onClick={() => setShowReplyForm(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {i18n.checklistDrawer?.buttons?.cancel || 'Cancel'}
              </button>
              <button
                onClick={handleReply}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                {i18n.checklistDrawer?.comments?.replySubmitButton || 'Reply'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onDelete={onDelete}
              isAdmin={isAdmin}
              level={level + 1}
              i18n={i18n}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Item Comments Modal component
const ItemCommentsModal = ({
  isOpen,
  onClose,
  itemId,
  itemContent,
  comments,
  loadingComments,
  onAddComment,
  onAddReply,
  onLikeComment,
  onDeleteComment,
  isAdmin,
  i18n
}) => {
  const [newCommentText, setNewCommentText] = useState('')

  const handleAddComment = async () => {
    if (newCommentText.trim()) {
      await onAddComment(newCommentText)
      setNewCommentText('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAddComment()
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={i18n.checklistDrawer?.comments?.modalTitle || "Comments"}
      className="max-w-2xl"
    >
      {/* Item preview */}
      {itemContent && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">{i18n.checklistDrawer?.comments?.itemLabel || 'Item:'}</div>
          <div className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: itemContent }} />
        </div>
      )}

      {/* Add New Comment */}
      <div className="mb-4">
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder={i18n.checklistDrawer?.comments?.addPlaceholder || "Add a comment..."}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 resize-none"
          onKeyPress={handleKeyPress}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            {i18n.checklistDrawer?.comments?.ctrlEnterToPost || 'Ctrl+Enter to post'}
          </span>
          <button
            onClick={handleAddComment}
            disabled={!newCommentText.trim()}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {i18n.checklistDrawer?.comments?.commentButton || 'Comment'}
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="max-h-80 overflow-y-auto space-y-3">
        {loadingComments ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">{i18n.checklistDrawer?.comments?.loadingComments || 'Loading comments...'}</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">{i18n.checklistDrawer?.comments?.noComments || 'No comments yet. Be the first to comment!'}</p>
          </div>
        ) : (
          comments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              onReply={onAddReply}
              onLike={onLikeComment}
              onDelete={onDeleteComment}
              isAdmin={isAdmin}
              level={0}
              i18n={i18n}
            />
          ))
        )}
      </div>
    </Modal>
  )
}

// Add deadline modal component
const DeadlineModal = ({ isOpen, onClose, onSave, itemId, currentDeadline }) => {
  const [dateTime, setDateTime] = useState('')
  const i18n = (typeof window !== 'undefined' && (window.magicclAdminData?.i18n || window.magicclPublicData?.i18n)) || {};
  
  useEffect(() => {
    if (isOpen && currentDeadline) {
      // Convert UTC timestamp to local browser time for datetime-local input
      // Since backend now properly handles timezone conversion, we can use browser local time
      const date = new Date(currentDeadline * 1000)
      
      // Format for datetime-local input (uses local timezone)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
    } else if (isOpen) {
      setDateTime('')
    }
  }, [isOpen, currentDeadline])

  const handleSave = () => {
    if (dateTime) {
      // Convert datetime-local input to timestamp
      // The backend will handle proper timezone conversion
      const date = new Date(dateTime)
      const timestamp = Math.floor(date.getTime() / 1000)
      
      onSave(timestamp)
    } else {
      onSave(null) // Remove deadline
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={i18n.checklistDrawer?.deadlineModal?.setDeadlineTitle || 'Set Item Deadline'}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {i18n.checklistDrawer?.deadlineModal?.deadlineDateTimeLabel || 'Deadline Date & Time'}
          </label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            {i18n.checklistDrawer?.deadlineModal?.leaveEmptyHint || 'Leave empty to remove deadline'}
          </p>
        </div>
      </div>
      <div className="flex justify-between items-center mt-6">
        <button
          type="button"
          className="px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
          onClick={() => {
            onSave(null) // Clear the deadline
            onClose()
          }}
          disabled={!currentDeadline}
        >
          {i18n.checklistDrawer?.deadlineModal?.clearDeadline || 'Clear Deadline'}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            onClick={onClose}
          >
            {i18n.checklistDrawer?.buttons?.cancel || 'Cancel'}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={handleSave}
          >
            {i18n.checklistDrawer?.deadlineModal?.saveDeadline || 'Save Deadline'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Add reset info component
const ResetInfoDisplay = ({ resetInfo, themeColors }) => {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!resetInfo?.next_reset) return

    const updateCountdown = () => {
      const now = Date.now() / 1000
      const nextReset = resetInfo.next_reset
      const remaining = nextReset - now

      if (remaining <= 0) {
        setTimeLeft('Resetting soon...')
        return
      }

      const days = Math.floor(remaining / 86400)
      const hours = Math.floor((remaining % 86400) / 3600)
      const minutes = Math.floor((remaining % 3600) / 60)

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else {
        setTimeLeft(`${minutes}m`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [resetInfo?.next_reset])

  if (!resetInfo?.enabled || !resetInfo?.next_reset) return null

  return (
    <div className={`${themeColors.surface} rounded-lg p-2 text-sm flex-shrink-0`}>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className={themeColors.textSecondary}>
          Auto-reset in: <span className="font-medium">{timeLeft}</span>
        </span>
      </div>
    </div>
  )
}

// Add checklist deadline display component
const ChecklistDeadlineDisplay = ({ deadline, themeColors }) => {
  const [timeLeft, setTimeLeft] = useState('')
  const [status, setStatus] = useState('normal')
  const i18n = (typeof window !== 'undefined' && (window.magicclAdminData?.i18n || window.magicclPublicData?.i18n)) || {};

  useEffect(() => {
    if (!deadline) return

    const updateCountdown = () => {
      try {
        const countdownData = formatDeadlineCountdown(deadline)
        setTimeLeft(countdownData.text)
        setStatus(countdownData.status)
      } catch (error) {
        console.error('ChecklistDeadlineDisplay countdown error:', error, 'for deadline:', deadline)
        setTimeLeft(i18n.deadlineDisplay?.invalidDeadline || 'Invalid deadline')
        setStatus('error')
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)

    return () => clearInterval(interval)
  }, [deadline])

  if (!deadline) return null

  const getStatusClasses = () => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'passed':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'error':
        return 'bg-gray-100 border-gray-300 text-gray-800'
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800'
    }
  }

  return (
    <div className={`rounded-lg p-2 border flex-shrink-0 ${getStatusClasses()}`}>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">
{i18n.deadlineDisplay?.due || 'Due'}: {deadline ? (() => {
              try {
                return formatDate(deadline, 'datetime')
              } catch (error) {
                console.error('ChecklistDeadlineDisplay formatDate error:', error, 'for deadline:', deadline)
                return i18n.checklistDrawer?.messages?.invalidDate || 'Invalid date'
              }
            })() : (i18n.deadlineDisplay?.noDeadline || 'No deadline')}
          </div>
          <div className="text-xs opacity-75">{timeLeft}</div>
        </div>
      </div>
    </div>
  )
}

// Drawer component – theme is determined per-checklist but falls back to provided default
const ChecklistDrawer = ({ theme = 'light' }) => {
  
  // Track the active theme of the *currently open* checklist
  const [drawerTheme, setDrawerTheme] = useState(theme)

  // Core state
  const [isVisible, setIsVisible] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [currentChecklistId, setCurrentChecklistId] = useState(null)
  const [checklistData, setChecklistData] = useState(null)
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isClosing, setIsClosing] = useState(false)

  // Refs to track latest state values for reliable saving
  const itemsRef = useRef([])
  const titleRef = useRef('')
  const currentChecklistIdRef = useRef(null)
  const canEditRef = useRef(false)
  
  // Tour integration - check if tours are enabled globally and track item connections
  const toursEnabled = useMemo(() => {
    // Check multiple possible ways tours could be enabled
    const settingEnabled = window.magiccl_checklists?.settings?.enable_tours === '1' || 
                          window.magiccl_checklists?.settings?.enable_tours === true
    const hasTourData = !!(window.magicclTourPlaybackData?.tours?.length > 0)
    const hasActiveTours = !!(window.magiccl_checklists?.tours?.length > 0)
    
    return settingEnabled || hasTourData || hasActiveTours
  }, [])
  
  // Track which items have tour connections
  const [itemsWithTourConnections, setItemsWithTourConnections] = useState(new Set())
  
  // Get i18n data
  const i18n = (typeof window !== 'undefined' && (window.magicclAdminData?.i18n || window.magicclPublicData?.i18n)) || {};
  
  // Permission states
  const [canEdit, setCanEdit] = useState(false)
  const [canCheck, setCanCheck] = useState(false)
  const [locked, setLocked] = useState(false)
  
  // Feature states
  const [checkedItems, setCheckedItems] = useState([])
  const [inProgressItems, setInProgressItems] = useState([])
  const [showCongrats, setShowCongrats] = useState(false)
  const [congratsExiting, setCongratsExiting] = useState(false)
  const [progressStats, setProgressStats] = useState({ total: 0, completed: 0, percentage: 0 })
  
  // UI states
  const [selectedText, setSelectedText] = useState(null)
  const [linkToolbarVisible, setLinkToolbarVisible] = useState(false)
  const [tooltip, setTooltip] = useState(null)
  const [tooltipTimer, setTooltipTimer] = useState(null)
  const [linkToolbarPosition, setLinkToolbarPosition] = useState({ x: 0, y: 0 })
  
  // Deadlines and timers
  const [itemDeadlines, setItemDeadlines] = useState({})
  const [countdownTimers, setCountdownTimers] = useState(new Map())

  // Comments state
  const [showCommentsModal, setShowCommentsModal] = useState(false)
  const [commentsModalItem, setCommentsModalItem] = useState(null)
  const [itemComments, setItemComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [itemCommentCounts, setItemCommentCounts] = useState({})
  
  // Modal and reset state
  const [showDeadlineModal, setShowDeadlineModal] = useState(false)
  const [deadlineModalItem, setDeadlineModalItem] = useState(null)
  const [deadlineInput, setDeadlineInput] = useState('')
  const [resetInfo, setResetInfo] = useState(null)
  const [checklistDeadline, setChecklistDeadline] = useState(null)

  // Refs
  const drawerRef = useRef(null)
  const itemsListRef = useRef(null)
  const bindingRef = useRef(false) // Prevent duplicate bindings

  // Custom hooks
  const { checkRateLimit } = useRateLimit(checklistData)
  const { fetchChecklistData, saveChecklistData } = useChecklistData()
  const { getCheckedState, saveCheckedState } = useCheckedState()
  const { makeRequest } = useAPI()
  const imageManager = useImageManager(canEdit, currentChecklistId, items, title, setItems)
  const linkManager = useLinkManager()
  const contentEditing = useContentEditing()
  const { checkTourConnections, checkBatchTourConnections, hasActiveTours, startTourFromConnection } = useTourIntegration()

  // Check tour connections for all items once when checklist loads (optimized batch fetching)
  const checkAllItemTourConnections = useCallback(async (checklistId, itemList) => {
    if (!toursEnabled || !checklistId || !itemList.length) {
      setItemsWithTourConnections(new Set())
      return
    }

    try {
      // First, check if any tours exist (early exit optimization)
      const toursExist = await hasActiveTours()

      if (!toursExist) {
        // No tours exist - early exit
        setItemsWithTourConnections(new Set())
        return
      }

      // Tours exist, now batch fetch connections for all items
      const itemIds = itemList.map(item => item.id)
      const connectionsMap = await checkBatchTourConnections(checklistId, itemIds)

      // Build set of item IDs that have connections
      const connectedItems = new Set()
      Object.entries(connectionsMap).forEach(([itemId, connections]) => {
        if (connections && connections.length > 0) {
          connectedItems.add(parseInt(itemId, 10))
        }
      })

      setItemsWithTourConnections(connectedItems)
    } catch (error) {
      console.error('Error checking tour connections:', error)
      setItemsWithTourConnections(new Set())
    }
  }, [toursEnabled, hasActiveTours, checkBatchTourConnections])

  // Simple tour button handler
  const handleTourButtonClick = useCallback(async (itemId) => {
    try {
      const connections = await checkTourConnections(currentChecklistId, itemId)
      if (connections.length > 0) {
        await startTourFromConnection(connections)
      }
    } catch (error) {
      console.error('Error starting tour:', error)
    }
  }, [currentChecklistId, checkTourConnections, startTourFromConnection])

  // Colours depend on the live theme (light / dark / custom)
  const themeColors = useMemo(() => getThemeColors(drawerTheme), [drawerTheme])

  // Drag-and-drop handler using hello-pangea/dnd
  const handleDragEnd = useCallback((result) => {
    const { source, destination, combine } = result

    // If no destination, item was dropped outside - no change
    if (!destination && !combine) {
      return
    }

    // Combine: set as child of another item
    if (combine) {
      const newItems = Array.from(items)
      const [draggedItem] = newItems.splice(source.index, 1)
      
      // Don't allow items with children to become children themselves
      const hasChildren = items.some(item => item.parent_id === draggedItem.id)
      if (hasChildren) {
        // Just reorder without changing hierarchy if this item has children
        newItems.splice(destination ? destination.index : source.index, 0, draggedItem)
        setItems(newItems)
        return
      }
      
      // Assign new parent
      const parentId = combine.draggableId
      draggedItem.parent_id = parentId
      
      // Determine insertion index: after parent and its existing children
      const parentIndex = newItems.findIndex(item => item.id === parentId)
      const siblingIndices = newItems
        .map((item, idx) => (item.parent_id === parentId ? idx : -1))
        .filter(idx => idx >= 0)
      const insertIndex = siblingIndices.length
        ? Math.max(...siblingIndices) + 1
        : parentIndex + 1
      newItems.splice(insertIndex, 0, draggedItem)
      setItems(newItems)
      
      if (canEdit && currentChecklistId) {
        saveChecklistData(currentChecklistId, title, newItems).catch(() => {})
      }
    } else if (destination) {
      // Smart reordering: preserve parent relationships when appropriate
      const newItems = Array.from(items)
      const [reorderedItem] = newItems.splice(source.index, 1)
      
      // Check if this item has children - if so, we need to move them with the parent
      const children = items.filter(item => item.parent_id === reorderedItem.id)
      const hasChildren = children.length > 0
      
      // Remove children from their current positions (in reverse order to maintain indices)
      if (hasChildren) {
        // Sort children by their current index in descending order
        const childrenWithIndices = children.map(child => ({
          ...child,
          currentIndex: newItems.findIndex(item => item.id === child.id)
        })).sort((a, b) => b.currentIndex - a.currentIndex)
        
        // Remove children from newItems
        childrenWithIndices.forEach(child => {
          const childIndex = newItems.findIndex(item => item.id === child.id)
          if (childIndex !== -1) {
            newItems.splice(childIndex, 1)
            // Adjust destination index if child was removed before destination
            if (childIndex < destination.index) {
              destination.index--
            }
          }
        })
      }
      
      // Get the source and destination context
      const sourceItem = items[source.index]
      
      if (hasChildren) {
        // Items with children must remain top-level (cannot become children)
        reorderedItem.parent_id = null
      } else if (sourceItem.parent_id) {
        // Source item is a child - check if destination is within same parent group
        const destinationItemAbove = destination.index > 0 ? newItems[destination.index - 1] : null
        const destinationItemBelow = destination.index < newItems.length ? newItems[destination.index] : null
        
        // Check if we're dropping within the same parent group
        const sameParentGroup = 
          (destinationItemAbove && destinationItemAbove.parent_id === sourceItem.parent_id) ||
          (destinationItemBelow && destinationItemBelow.parent_id === sourceItem.parent_id)
        
        // Check if we're dropping right after the parent
        const parentItem = items.find(item => item.id === sourceItem.parent_id)
        const parentIndex = parentItem ? newItems.findIndex(item => item.id === sourceItem.parent_id) : -1
        const droppingAfterParent = parentIndex !== -1 && destination.index === parentIndex + 1
        
        if (sameParentGroup || droppingAfterParent) {
          // Keep the same parent - just reordering within the group
          reorderedItem.parent_id = sourceItem.parent_id
        } else {
          // Moving outside parent group - become top-level
          reorderedItem.parent_id = null
        }
      } else {
        // Source item is top-level - be very conservative about auto-nesting
        const destinationItemAbove = destination.index > 0 ? newItems[destination.index - 1] : null
        const destinationItemBelow = destination.index < newItems.length ? newItems[destination.index] : null
        
        // Only nest in very specific circumstances
        if (destinationItemAbove && !destinationItemAbove.parent_id) {
          // Dropping after a potential parent - only nest if we're inserting BETWEEN its existing children
          const potentialParentId = destinationItemAbove.id
          const parentChildren = newItems.filter(item => item.parent_id === potentialParentId)
          if (parentChildren.length > 0) {
            const childIndices = parentChildren.map(child => 
              newItems.findIndex(item => item.id === child.id)
            ).sort((a, b) => a - b)
            const lastChildIndex = Math.max(...childIndices)
            // Only nest if we're dropping BEFORE the last child
            if (destination.index <= lastChildIndex) {
              reorderedItem.parent_id = potentialParentId
            }
          }
        } else if (destinationItemAbove && destinationItemAbove.parent_id) {
          // Dropping after a child item - only nest when placing among existing children
          const parentId = destinationItemAbove.parent_id
          const parentChildren = newItems.filter(item => item.parent_id === parentId)
          
          if (parentChildren.length > 0) {
            const childIndices = parentChildren.map(child => 
              newItems.findIndex(item => item.id === child.id)
            ).sort((a, b) => a - b)
            
            const lastChildIndex = Math.max(...childIndices)
            
            // Only inherit parent if dropping before the last child (i.e., inside child area)
            if (destination.index <= lastChildIndex) {
              reorderedItem.parent_id = parentId
            } else {
              // Dropping beyond child area - remain top-level
              reorderedItem.parent_id = null
            }
          } else {
            // Fallback: remain top-level
            reorderedItem.parent_id = null
          }
        } else {
          // Default: keep as top-level
          reorderedItem.parent_id = null
        }
      }
      
      // Insert the parent at the destination
      newItems.splice(destination.index, 0, reorderedItem)
      
      // Insert children right after the parent (if any)
      if (hasChildren) {
        let insertIndex = destination.index + 1
        children.forEach(child => {
          newItems.splice(insertIndex, 0, child)
          insertIndex++
        })
      }
      
      setItems(newItems)
      
      if (canEdit && currentChecklistId) {
        saveChecklistData(currentChecklistId, title, newItems).catch(() => {})
      }
    }
  }, [items, canEdit, currentChecklistId, saveChecklistData, title])

  // Admin/permissions
  const isAdministrator = useCallback(() => {
    return window.magiccl_checklists?.user_access?.is_admin === true
  }, [])

  // Token management
  const getStoredToken = useCallback(() => {
    try {
      const stored = localStorage.getItem('magiccl_invite_token')
      if (!stored) return null

      const data = JSON.parse(stored)
      const now = Math.floor(Date.now() / 1000)

      // Check if token has expired
      if (now > data.expiry) {
        localStorage.removeItem('magiccl_invite_token')
        return null
      }

      return data.token
    } catch (error) {
      console.error('Error reading invite token:', error)
      return null
    }
  }, [])

  // Navigation state
  const [activeChecklists, setActiveChecklists] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  // Initialize active checklists once on mount
  useEffect(() => {
    try {
      const shortcuts = window.magiccl_checklists?.shortcuts || {}
      const checklists = Object.entries(shortcuts)
        .filter(([id, data]) => data && id)
        .map(([id]) => id)
        .sort((a, b) => parseInt(a) - parseInt(b))
      
      setActiveChecklists(checklists)
    } catch (error) {
      console.error('Error getting active checklists:', error)
    }
  }, [])

  // Use activeChecklists directly - it's already stable
  const memoizedActiveChecklists = activeChecklists

  // Keep refs in sync with state for reliable saving
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    titleRef.current = title
  }, [title])

  useEffect(() => {
    currentChecklistIdRef.current = currentChecklistId
  }, [currentChecklistId])

  useEffect(() => {
    canEditRef.current = canEdit
  }, [canEdit])

  // Core checklist operations
  const closeDrawer = useCallback(async () => {
    // Get the latest values from refs (most current state)
    let finalItems = itemsRef.current
    let finalTitle = titleRef.current
    const checklistId = currentChecklistIdRef.current
    const hasEditPermission = canEditRef.current

    // Capture content from any focused elements before closing
    const activeElement = document.activeElement

    if (activeElement && activeElement.classList.contains('magiccl-item-content') && activeElement.isContentEditable) {
      const itemId = activeElement.closest('[data-item-id]')?.getAttribute('data-item-id')
      if (itemId) {
        const content = activeElement.innerHTML
        // Update the items array with the current content
        finalItems = finalItems.map(item =>
          item.id === itemId ? { ...item, content } : item
        )

        // Update state and refs immediately
        setItems(finalItems)
        itemsRef.current = finalItems

        // Blur the element
        activeElement.blur()
      }
    }

    // Also capture title changes if title is focused
    if (activeElement && activeElement.classList.contains('magiccl-drawer-title') && activeElement.isContentEditable) {
      finalTitle = activeElement.textContent
      setTitle(finalTitle)
      titleRef.current = finalTitle
      activeElement.blur()
    }

    // CRITICAL: Save to server and AWAIT completion before closing
    if (hasEditPermission && checklistId) {
      try {
        await saveChecklistData(checklistId, finalTitle, finalItems)
      } catch (err) {
        console.error('Error saving checklist on close:', err)
      }
    }

    // Release server side lock after save completes
    if (checklistId) {
      makeRequest('magiccl_release_lock', { checklist_id: checklistId }).catch(() => {})
    }
    
    // Start closing animation
    setIsVisible(false)
    
    // Delay content clearing until animation finishes
    setTimeout(() => {
      setShowContent(false)
      setCurrentChecklistId(null)
      setChecklistData(null)
      setItems([])
      setCheckedItems([])
      setTitle('')
      setError(null)
      setShowCongrats(false)
      setLinkToolbarVisible(false)
      setInProgressItems([])
      setItemDeadlines({})
      setItemsWithTourConnections(new Set())
      // Clear countdown timers
      countdownTimers.forEach(timer => clearInterval(timer))
      setCountdownTimers(new Map())
    }, 400) // Match the animation duration
  }, [canEdit, currentChecklistId, title, items, saveChecklistData, countdownTimers])

  const loadChecklist = useCallback(async (checklistId) => {
    if (!checklistId || currentChecklistId === checklistId) return

    setLoading(true)
    setError(null)

    try {
      const data = await fetchChecklistData(checklistId)
      
      setChecklistData(data)
      setCurrentChecklistId(checklistId)
      setTitle(data.title || '')
      setItems(data.items || [])
      setCanEdit(data.can_edit || false)
      setCanCheck(data.can_check || false)
      setLocked(data.locked || false)
      setInProgressItems(data.items_in_progress || [])
      
      // Set reset info
      setResetInfo(data.reset_info || null)
      
      // Set checklist deadline - use time_date field from API response
      setChecklistDeadline(data.time_date || null)
      
      // Handle checked state based on storage mode
      let finalCheckedState = data.checked_state || []

      // For per-user checklists with logged-out users, check localStorage since server won't have state
      const isLoggedIn = window.magiccl_checklists?.user_access?.is_logged_in || false
      const isPublic = data.is_public
      const handlingMode = isPublic ? (data.checked_state_handling || 'per_user') : (data.checked_state_handling || 'global')

      // Check if a reset just happened - if so, clear localStorage and skip reading from it
      const wasJustReset = data.reset_info?.enabled && data.reset_info?.was_reset

      if (handlingMode === 'per_user' && !isLoggedIn) {
        const localKey = `magiccl_checked_${checklistId}`

        if (wasJustReset) {
          // Reset happened - clear localStorage immediately and use empty state
          try {
            localStorage.removeItem(localKey)
            console.log('MCL: Cleared localStorage during load due to reset for checklist', checklistId)
          } catch (error) {
            console.warn('MCL: Error clearing localStorage on reset:', error)
          }
          finalCheckedState = []
        } else {
          // No reset - use localStorage as the primary source
          try {
            const localState = localStorage.getItem(localKey)
            if (localState) {
              finalCheckedState = JSON.parse(localState)
            }
          } catch (error) {
            console.warn('MCL Drawer: Error reading localStorage for per-user checklist:', error)
          }
        }
      }

      setCheckedItems(finalCheckedState)

      // Initialize deadlines if present
      if (data.items) {
        const deadlines = {}
        data.items.forEach(item => {
          if (item.deadline) {
            deadlines[item.id] = item.deadline
          }
        })
        setItemDeadlines(deadlines)
      }

      // Check for tour connections once for all items
      if (toursEnabled && data.items) {
        checkAllItemTourConnections(checklistId, data.items)
      }

      if (!isVisible) {
        setIsVisible(true)
      }
      
      // Always show content since it's now always rendered
      setShowContent(true)

      // Update theme for this checklist (default to light if absent)
      if (data?.theme) {
        setDrawerTheme(data.theme)
      } else {
        setDrawerTheme('light')
      }
    } catch (err) {
      console.error('Failed to load checklist:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [currentChecklistId, fetchChecklistData, isVisible, toursEnabled, checkAllItemTourConnections])

  const toggleChecklist = useCallback(async (checklistId) => {
    // Rate limit check
    const drawerCheck = checkRateLimit(`magiccl_drawer_${checklistId}`)
    if (!drawerCheck.allowed) {
      setError(`Rate limit reached. Try again in ${drawerCheck.remaining} seconds.`)
      return
    }
    
    // If drawer is open and it's the same checklist, close it
    if (isVisible && currentChecklistId === checklistId) {
      setIsClosing(true)
      closeDrawer()
      
      // Reset state after animation completes
      setTimeout(() => {
        setIsClosing(false)
        setCurrentChecklistId(null)
      }, 300)
      
      return
    }

    // If not closing, load the checklist
    if (!isClosing) {
      await loadChecklist(checklistId)
    }
  }, [isVisible, currentChecklistId, isClosing, checkRateLimit, closeDrawer, loadChecklist])

  // Navigation functions
  const navigateChecklists = useCallback(async (direction) => {
    const drawerCheck = checkRateLimit(`magiccl_drawer_nav`)
    if (!drawerCheck.allowed) {
      setError(`Rate limit reached. Try again in ${drawerCheck.remaining} seconds.`)
      return
    }

    const checklists = memoizedActiveChecklists
    
    if (checklists.length <= 1) {
      return
    }

    // Find current index if not set
    let newIndex = currentIndex
    if (newIndex === -1) {
      newIndex = checklists.indexOf(currentChecklistId)
    }

    // Calculate new index
    if (direction === 'next') {
      newIndex = (newIndex + 1) % checklists.length
    } else {
      newIndex = (newIndex - 1 + checklists.length) % checklists.length
    }

    const nextChecklistId = checklists[newIndex]
    setCurrentIndex(newIndex)
    await loadChecklist(nextChecklistId)
  }, [currentIndex, memoizedActiveChecklists, currentChecklistId, checkRateLimit, loadChecklist])

  // Listen for tour-initiated checklist item changes
  useEffect(() => {
    const handleTourChecklistChange = (event) => {
      const { checklistId, itemId, checked, source } = event.detail
      
      // If the affected checklist is currently open in the drawer, update immediately
      if (source === 'tour' && checklistId == currentChecklistId && isVisible) {
        
        setCheckedItems(prev => {
          let newChecked
          if (checked) {
            newChecked = prev.includes(itemId) ? prev : [...prev, itemId]
          } else {
            newChecked = prev.filter(id => id !== itemId)
          }
          
          // Save tour-updated state according to storage mode
          if (checklistData) {
            const isLoggedIn = window.magiccl_checklists?.user_access?.is_logged_in || false
            const isPublic = checklistData.is_public
            const handlingMode = isPublic ? (checklistData.checked_state_handling || 'per_user') : (checklistData.checked_state_handling || 'global')
            
            if (handlingMode === 'per_user' && !isLoggedIn) {
              // Logged-out users: save to localStorage only
              try {
                const localKey = `magiccl_checked_${checklistId}`
                localStorage.setItem(localKey, JSON.stringify(newChecked))
              } catch (error) {
                console.warn('MCL Drawer: Error saving tour state to localStorage:', error)
              }
            }
          }
          
          return newChecked
        })
      }
    }

    window.addEventListener('magicclChecklistItemChanged', handleTourChecklistChange)
    
    return () => {
      window.removeEventListener('magicclChecklistItemChanged', handleTourChecklistChange)
    }
  }, [currentChecklistId, isVisible])

  // Helper function to get deadline status and classes
  const getDeadlineStatus = useCallback((deadline) => {
    if (!deadline) return { classes: '', status: 'none' }
    
    const now = Date.now()
    const deadlineTime = new Date(deadline * 1000).getTime()
    const timeLeft = deadlineTime - now
    
    if (timeLeft < 0) {
      return { classes: 'bg-red-100 text-red-800', status: 'overdue' }
    } else if (timeLeft < 86400000) { // 24 hours
      return { classes: 'bg-red-100 text-red-800', status: 'urgent' }
    } else if (timeLeft < 259200000) { // 3 days
      return { classes: 'bg-yellow-100 text-yellow-800', status: 'warning' }
    } else {
      return { classes: '', status: 'normal' }
    }
  }, [])

  // Deadline countdown management
  useEffect(() => {
    // Clear existing timers
    countdownTimers.forEach(timer => clearInterval(timer))
    const newTimers = new Map()

    // Set up new timers for current deadlines
    Object.entries(itemDeadlines).forEach(([itemId, deadline]) => {
      if (deadline) {
        const timer = setInterval(() => {
          const listItem = document.querySelector(`li[data-item-id="${itemId}"]`)
          if (listItem) {
            updateItemDeadlineStatus(listItem, deadline)
          }
        }, 60000) // Update every minute
        
        newTimers.set(itemId, timer)
      }
    })

    setCountdownTimers(newTimers)

    return () => {
      newTimers.forEach(timer => clearInterval(timer))
    }
  }, [itemDeadlines])

  // Update deadline status function
  const updateItemDeadlineStatus = useCallback((listItem, deadline) => {
    const now = Date.now()
    const deadlineTime = new Date(deadline).getTime()
    const timeLeft = deadlineTime - now
    
    // Remove existing status classes
    listItem.classList.remove('deadline-24h', 'deadline-2h', 'deadline-passed')

    // Add appropriate status class
    if (timeLeft < 0) {
      listItem.classList.add('deadline-passed')
    } else if (timeLeft < 7200000) { // 2 hours
      listItem.classList.add('deadline-2h')
    } else if (timeLeft < 86400000) { // 24 hours
      listItem.classList.add('deadline-24h')
    }

    // Update countdown text
    const countdownElement = listItem.querySelector('.item-deadline-countdown')
    if (countdownElement) {
      countdownElement.textContent = formatItemDeadlineCountdown(timeLeft)
    }
  }, [])

  const formatItemDeadlineCountdown = useCallback((timeLeft) => {
    if (timeLeft < 0) {
      return i18n.checklistDrawer?.checklistStates?.deadlinePassed || 'Deadline passed'
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `${days}d ${hours}h remaining`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  }, [])

  // Reset handling
  useEffect(() => {
    if (checklistData?.reset_info) {
      const { reset_info } = checklistData
      
      if (reset_info.enabled && reset_info.was_reset) {
        // Get the checklist ID from the data (more reliable than state variable)
        const resetChecklistId = checklistData.id || checklistData.checklist_id || currentChecklistId

        // Clear localStorage for logged-out users (per-user mode stores state in localStorage)
        try {
          // Drawer localStorage key
          const drawerKey = `magiccl_checked_${resetChecklistId}`
          localStorage.removeItem(drawerKey)

          // Also clear any shortcode localStorage keys for this checklist
          // Shortcode keys follow pattern: magiccl_shortcode_${checklistId}_${instanceId}_checked
          const shortcodePrefix = `magiccl_shortcode_${resetChecklistId}_`
          const keysToRemove = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(shortcodePrefix)) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key))

          console.log('MCL: Cleared localStorage for checklist', resetChecklistId, '(removed', keysToRemove.length, 'shortcode keys)')
        } catch (error) {
          console.warn('MCL: Error clearing localStorage on reset:', error)
        }

        // Also clear the in-memory checked state
        setCheckedItems([])
        setInProgressItems([])

        // Show reset notification
        const notification = document.createElement('div')
        notification.className = 'fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded shadow-lg z-50'
        notification.innerHTML = `
          <div class="flex items-center gap-3">
            <span>{i18n.checklistDrawer?.checklistStates?.checklistReset || 'This checklist has been automatically reset.'}</span>
            <button type="button" class="text-yellow-600 hover:text-yellow-800 font-bold">×</button>
          </div>
        `
        
        document.body.appendChild(notification)
        
        // Add close functionality
        notification.querySelector('button').addEventListener('click', () => {
          notification.remove()
        })
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          if (document.body.contains(notification)) {
            notification.remove()
          }
        }, 5000)
      }
    }
  }, [checklistData])

  // Enhanced in-progress management
  const saveInProgressState = useCallback(async (newInProgressItems) => {
    try {
      const response = await makeRequest('magiccl_save_in_progress', {
        checklist_id: currentChecklistId,
        items_in_progress: newInProgressItems
      })
      
      if (!response.success) {
        console.error('Error saving in-progress state:', response.data)
      }
    } catch (error) {
      console.error('Error saving in-progress state:', error)
    }
  }, [currentChecklistId, makeRequest])

  const toggleInProgress = useCallback((itemId) => {
    // Allow interact users to mark unlocked items as in-progress when item locking is enabled
    const itemIsLocked = items.find(i => i.id === itemId)?.locked
    if (locked || !canEdit) return

    setInProgressItems(prev => {
      const newItems = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]

      saveInProgressState(newItems).then(() => {
        // Dispatch event to notify other views that in-progress state changed
        window.dispatchEvent(new CustomEvent('magicclChecklistDataChanged', {
          detail: {
            checklistId: currentChecklistId,
            action: 'in_progress_changed',
            source: 'drawer'
          }
        }))
      })
      return newItems
    })
  }, [canEdit, locked, saveInProgressState, checklistData, items, currentChecklistId])

  // Confetti animation for congratulations
  const createConfetti = useCallback(() => {
    const congratsContainer = document.querySelector('.congrats-overlay')
    if (!congratsContainer) return

    const colors = ['#6c63ff', '#ff6b6b', '#ffd93d', '#6bff95', '#ff6bcd']
    
    // Clear existing confetti
    congratsContainer.querySelectorAll('.confetti-piece').forEach(el => el.remove())

    // Create new confetti pieces
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div')
      confetti.className = 'confetti-piece absolute w-2 h-2 opacity-0'
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.left = Math.random() * 100 + '%'
      confetti.style.animation = `confetti-fall ${3 + Math.random() * 2}s linear forwards`
      confetti.style.animationDelay = (Math.random() * 0.5) + 's'
      congratsContainer.appendChild(confetti)
    }

    // Add CSS animation if not exists
    if (!document.querySelector('#confetti-styles')) {
      const style = document.createElement('style')
      style.id = 'confetti-styles'
      style.textContent = `
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 1;
          }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  // Enhanced congratulations with confetti
  useEffect(() => {
    if (showCongrats) {
      createConfetti()
    }
  }, [showCongrats, createConfetti])

  // Item operations
  const handleCheckboxChange = useCallback(async (itemId, isChecked) => {
    // Rate limit check for checkbox changes
    const checkRateCheck = checkRateLimit(`magiccl_checkbox_${currentChecklistId}_${itemId}`, 10) // Allow 10 operations per minute
    if (!checkRateCheck.allowed) {
      setError(`Rate limit reached. Try again in ${checkRateCheck.remaining} seconds.`)
      return
    }
    
    const newCheckedItems = isChecked 
      ? [...checkedItems, itemId]
      : checkedItems.filter(id => id !== itemId)

    setCheckedItems(newCheckedItems)
    
    // Automatically reorder item along with its children based on checked state
    const reorderedItems = [...items]
    const startIndex = reorderedItems.findIndex(item => item.id === itemId)
    if (startIndex !== -1) {
      const movedItem = reorderedItems[startIndex]
      
      // Check if this is a child item
      if (movedItem.parent_id) {
        // Child item: move within parent's child group
        const parentId = movedItem.parent_id
        const siblings = reorderedItems.filter(item => item.parent_id === parentId)
        const parentIndex = reorderedItems.findIndex(item => item.id === parentId)
        
        if (parentIndex !== -1 && siblings.length > 1) {
          // Remove the moved child from its current position
          reorderedItems.splice(startIndex, 1)
          
          // Find the new parent index after removal
          const newParentIndex = reorderedItems.findIndex(item => item.id === parentId)
          
          if (isChecked) {
            // Move to end of child group (before next parent or end of list)
            const remainingSiblings = reorderedItems.filter(item => item.parent_id === parentId)
            if (remainingSiblings.length > 0) {
              // Find the last sibling's position
              const lastSiblingIndex = reorderedItems.findLastIndex(item => item.parent_id === parentId)
              reorderedItems.splice(lastSiblingIndex + 1, 0, movedItem)
            } else {
              // No other siblings, place right after parent
              reorderedItems.splice(newParentIndex + 1, 0, movedItem)
            }
          } else {
            // Move to beginning of child group (right after parent)
            reorderedItems.splice(newParentIndex + 1, 0, movedItem)
          }
        }
      } else {
        // Parent item: move with all children as before
        const [extractedItem] = reorderedItems.splice(startIndex, 1)
        const children = items.filter(item => item.parent_id === itemId)
        
        if (children.length > 0) {
          // Remove children from reorderedItems
          const childrenWithIndices = children.map(child => ({
            ...child,
            currentIndex: reorderedItems.findIndex(i => i.id === child.id)
          })).sort((a, b) => b.currentIndex - a.currentIndex)
          
          childrenWithIndices.forEach(child => {
            const idx = reorderedItems.findIndex(i => i.id === child.id)
            if (idx !== -1) {
              reorderedItems.splice(idx, 1)
            }
          })
        }
        
        // Insert parent and its children at top or bottom
        if (isChecked) {
          reorderedItems.push(extractedItem)
          children.forEach(child => reorderedItems.push(child))
        } else {
          reorderedItems.unshift(extractedItem)
          children.forEach((child, idx) => reorderedItems.splice(idx + 1, 0, child))
        }
      }
      
      setItems(reorderedItems)
      // Save the reordered items if user can edit
      if (canEdit && currentChecklistId) {
        try {
          await saveChecklistData(currentChecklistId, title, reorderedItems)
        } catch (error) {
          console.warn('Error saving reordered items:', error)
        }
      }
    }
    
    if (currentChecklistId) {
      await saveCheckedState(currentChecklistId, newCheckedItems, 'drawer', checklistData)

      // Dispatch event to notify other views that checked state changed
      window.dispatchEvent(new CustomEvent('magicclChecklistDataChanged', {
        detail: {
          checklistId: currentChecklistId,
          action: 'checked_state_changed',
          source: 'drawer'
        }
      }))
    }

    // Check if all items are completed
    const allItemsChecked = reorderedItems.length > 0 && reorderedItems.every(item => 
      newCheckedItems.includes(item.id)
    )

    if (allItemsChecked && !showCongrats) {
      setShowCongrats(true)
      setTimeout(() => {
        setCongratsExiting(true)
        setTimeout(() => {
          setShowCongrats(false)
          setCongratsExiting(false)
        }, 300) // Wait for fade-out animation
      }, 2000)
    }
  }, [checkedItems, currentChecklistId, items, saveCheckedState, showCongrats, canEdit, title, saveChecklistData, checkRateLimit, setError])

  const addNewItem = useCallback(() => {
    // Allow adding if the checklist supports per-item locking
    // Users without full edit permission (canEdit === false) should still be able
    // to add their own items as long as global locking is not engaged.
    if (!canEdit || locked) return

    // Rate limit check for adding items
    const addItemCheck = checkRateLimit(`magiccl_add_item_${currentChecklistId}`, 5) // Allow 5 operations per minute
    if (!addItemCheck.allowed) {
      setError(`Rate limit reached. Try again in ${addItemCheck.remaining} seconds.`)
      return
    }

    // First capture any in-flight edits (contentEditable changes that haven't blurred yet)
    const syncedItems = items.map(it => {
      const el = document.querySelector(`[data-item-id="${it.id}"] .magiccl-item-content`)
      if (el) {
        return { ...it, content: el.innerHTML }
      }
      return it
    })

    const newItem = {
      id: canEdit ? Date.now().toString() : `user_${Date.now()}`,
      content: '',
      order: items.length,
      priority: 'none',
      user_generated: !canEdit // mark item so non-editors may still modify their own entries
    }

    const updated = [...syncedItems, newItem]
    setItems(updated)

    // Call the dedicated add endpoint with notification
    // Note: We don't dispatch magicclChecklistDataChanged here because the item has no content yet.
    // The event will be dispatched when content is actually saved in updateItemContent.
    if (currentChecklistId) {
      makeRequest('magiccl_add_item', {
        checklist_id: currentChecklistId,
        item: JSON.stringify(newItem)
      }).catch(() => {
        // On error, remove the item from local state
        setItems(prev => prev.filter(item => item.id !== newItem.id))
      })
    }

    // Focus the new item after render
    setTimeout(() => {
      const newItemElement = document.querySelector(`[data-item-id="${newItem.id}"] .magiccl-item-content`)
      if (newItemElement) {
        newItemElement.focus()
      }
    }, 0)
  }, [canEdit, locked, items, currentChecklistId, checklistData, makeRequest, checkRateLimit, setError])

  const removeItem = useCallback((itemId) => {
    const target = items.find(i => i.id === itemId)
    const itemIsLocked = target?.locked
    if (locked) return
    if (!canEdit && !(checklistData?.enable_item_locking && !itemIsLocked)) return

    // Rate limit check for removing items
    const removeItemCheck = checkRateLimit(`magiccl_remove_item_${currentChecklistId}`, 5) // Allow 5 operations per minute
    if (!removeItemCheck.allowed) {
      setError(`Rate limit reached. Try again in ${removeItemCheck.remaining} seconds.`)
      return
    }

    setItems(prev => prev.filter(item => item.id !== itemId))
    setCheckedItems(prev => prev.filter(id => id !== itemId))
    setInProgressItems(prev => prev.filter(id => id !== itemId))

    // Remove deadline if exists
    setItemDeadlines(prev => {
      const newDeadlines = { ...prev }
      delete newDeadlines[itemId]
      return newDeadlines
    })

    // Call the dedicated delete endpoint with notification
    if (currentChecklistId) {
      makeRequest('magiccl_delete_item', {
        checklist_id: currentChecklistId,
        item_id: itemId
      }).then(() => {
        // Dispatch event to notify other views that checklist data changed
        window.dispatchEvent(new CustomEvent('magicclChecklistDataChanged', {
          detail: {
            checklistId: currentChecklistId,
            action: 'item_deleted',
            itemId: itemId,
            source: 'drawer'
          }
        }))
      }).catch(() => {
        // On error, restore the item
        const target = items.find(i => i.id === itemId)
        if (target) {
          setItems(prev => [...prev, target])
        }
      })
    }
  }, [canEdit, locked, checklistData, items, currentChecklistId, makeRequest, checkRateLimit, setError])

  // Update item content
  const updateItemContent = useCallback((itemId, content) => {
    const targetItem = items.find(i => i.id === itemId)
    const allowEdit = canEdit || (checklistData?.enable_item_locking && !targetItem?.locked)
    if (!allowEdit || locked) return

    // Rate limit check for content updates (more lenient limit since users edit content frequently)
    const updateContentCheck = checkRateLimit(`magiccl_update_content_${currentChecklistId}`, 20) // Allow 20 operations per minute
    if (!updateContentCheck.allowed) {
      setError(`Rate limit reached. Try again in ${updateContentCheck.remaining} seconds.`)
      return
    }

    const newItems = items.map(item =>
      item.id === itemId ? { ...item, content } : item
    )

    setItems(newItems)

    if (currentChecklistId) {
      saveChecklistData(currentChecklistId, title, newItems)
        .then(() => {
          // Dispatch event to notify other views that checklist data changed
          window.dispatchEvent(new CustomEvent('magicclChecklistDataChanged', {
            detail: {
              checklistId: currentChecklistId,
              action: 'item_updated',
              itemId: itemId,
              source: 'drawer'
            }
          }))
        })
        .catch(() => {})
    }
  }, [canEdit, locked, items, checklistData, currentChecklistId, title, saveChecklistData, checkRateLimit, setError])

  // Priority helper functions
  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 'high': return '#ef4444'    // red-500
      case 'medium': return '#f59e0b'  // amber-500
      case 'low': return '#10b981'     // emerald-500
      default: return '#6b7280'        // gray-500
    }
  }, [])

  const getPriorityNumber = useCallback((priority) => {
    switch (priority) {
      case 'high': return '1'
      case 'medium': return '2'
      case 'low': return '3'
      default: return ''
    }
  }, [])

  const cyclePriority = useCallback((itemId) => {
    if (!canEdit || locked) return

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const priorities = ['none', 'low', 'medium', 'high']
        const currentIndex = priorities.indexOf(item.priority || 'none')
        const nextIndex = (currentIndex + 1) % priorities.length
        return { ...item, priority: priorities[nextIndex] }
      }
      return item
    }))
  }, [canEdit, locked])

  const uncheckAllItems = useCallback(async () => {
    if ((!canEdit && !canCheck) || locked) return

    setCheckedItems([])
    if (currentChecklistId) {
      await saveCheckedState(currentChecklistId, [], 'drawer', checklistData)

      // Dispatch event to notify other views that checked state changed
      window.dispatchEvent(new CustomEvent('magicclChecklistDataChanged', {
        detail: {
          checklistId: currentChecklistId,
          action: 'checked_state_changed',
          source: 'drawer'
        }
      }))
    }
  }, [canEdit, canCheck, locked, currentChecklistId, saveCheckedState, checklistData])

  // Progress tracking
  const updateProgressCounter = useCallback(() => {
    const total = items.length
    const completed = checkedItems.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    
    setProgressStats({ total, completed, percentage })
  }, [items.length, checkedItems.length])

  // Global keyboard shortcuts
  useGlobalKeyboardShortcuts(toggleChecklist, isClosing)

  // Floating button management - prevent duplicate bindings
  const bindFloatingButtons = useCallback(() => {
    if (bindingRef.current) {
      return // Prevent duplicate bindings
    }
    
    bindingRef.current = true
    
    // Bind only to floating buttons (not the drawer content)
    const buttons = document.querySelectorAll('.magiccl-speed-dial-button, .magiccl-single-floating-button')

    const handleFloatingButtonClick = async (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      const checklistId = e.currentTarget.getAttribute('data-checklist-id')
      if (checklistId) {
        // Use the current toggleChecklist function from the bridge instead of the dependency
        if (window.magicclDrawer && window.magicclDrawer.toggleChecklist) {
          await window.magicclDrawer.toggleChecklist(checklistId)
        }
      }
    }
    
    buttons.forEach(button => {
      button.removeEventListener('click', handleFloatingButtonClick)
      button.addEventListener('click', handleFloatingButtonClick)
    })
    
    setTimeout(() => {
      bindingRef.current = false
    }, 1000)
  }, []) // Remove toggleChecklist dependency to prevent infinite loop

  // Click outside handler - fixed to prevent interference
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isVisible && drawerRef.current) {
        const isOutsideDrawer = !drawerRef.current.contains(e.target)
        const isNotFloatingButton = !e.target.closest('.magiccl-speed-dial-button, .magiccl-single-floating-button')
        const isNotModal = !e.target.closest('.modal, [data-modal]')
        const isNotMediaModal = !e.target.closest('.media-modal')
        const isNotMediaFrame = !e.target.closest('.media-frame')
        // Add exclusions for our image modals and link toolbar
        const isNotImageModal = !e.target.closest('.magiccl-modal-overlay, .magiccl-modal')
        const isNotLinkToolbar = !e.target.closest('[data-link-toolbar="true"]')
        
        if (isOutsideDrawer && isNotFloatingButton && isNotModal && isNotMediaModal && isNotMediaFrame && isNotImageModal && isNotLinkToolbar) {
          closeDrawer()
        }
      }
    }

    if (isVisible) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, closeDrawer])

  // Handle item clicks - allow link clicks to work properly
  const handleItemClick = useCallback((e, itemId) => {
    // Allow link clicks to work properly
    if (e.target.tagName === 'A' || e.target.closest('a')) {
      // Don't prevent default for link clicks
      return
    }
    // No-op for other clicks - all functionality moved to direct button handlers
  }, [])

  // Handle deadline click
  const handleDeadlineClick = useCallback((itemId) => {
    const currentItem = items.find(item => item.id === itemId)
    const existingDeadline = currentItem?.deadline || itemDeadlines[itemId]
    
    setDeadlineModalItem(itemId)
    setShowDeadlineModal(true)
  }, [items, itemDeadlines])

  // Add new item after current item
  const addNewItemAfter = useCallback((currentItemId) => {
    const currentIndex = items.findIndex(item => item.id === currentItemId)
    if (currentIndex === -1) return

    if (!canEdit || locked) return

    const newItem = {
      id: canEdit ? Date.now().toString() : `user_${Date.now()}`,
      content: '',
      order: items.length,
      priority: 'none',
      user_generated: !canEdit
    }

    const newItems = [...items]
    newItems.splice(currentIndex + 1, 0, newItem)
    setItems(newItems)

    if (currentChecklistId) {
      saveChecklistData(currentChecklistId, title, newItems).catch(() => {})
    }

    setTimeout(() => {
      const newItemElement = document.querySelector(`[data-item-id="${newItem.id}"] .magiccl-item-content`)
      if (newItemElement) {
        newItemElement.focus()
      }
    }, 0)
  }, [items, canEdit, locked, currentChecklistId, title, saveChecklistData, checklistData])

  // Note: Removed debounced auto-save effect - we now save reliably on drawer close
  // using refs to capture the latest state. This prevents race conditions and ensures
  // all changes are saved before the drawer closes.

  // Save before page unload to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const checklistId = currentChecklistIdRef.current
      const hasEditPermission = canEditRef.current
      const finalItems = itemsRef.current
      const finalTitle = titleRef.current

      if (hasEditPermission && checklistId && finalItems.length > 0) {
        // Use sendBeacon for reliable async save on page unload
        const data = new FormData()
        data.append('action', 'magiccl_update_checklist')
        data.append('checklist_id', checklistId)
        data.append('title', finalTitle)
        data.append('items', JSON.stringify(finalItems))

        const nonce = window.magiccl_checklists?.nonce
        if (nonce) {
          data.append('nonce', nonce)
        }

        const ajaxUrl = window.magiccl_checklists?.ajax_url
        if (ajaxUrl) {
          // sendBeacon is designed for this exact use case
          navigator.sendBeacon(ajaxUrl, data)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, []) // Empty deps - we use refs which are always current

  // Update progress counter when items or checked items change
  useEffect(() => {
    updateProgressCounter()
  }, [updateProgressCounter])

  // Tooltip management
  const showTooltip = useCallback((element, text) => {
    // Clear any existing timer
    if (tooltipTimer) {
      clearTimeout(tooltipTimer)
    }

    // Set a new timer for 0.5 seconds
    const timer = setTimeout(() => {
      const rect = element.getBoundingClientRect()
      const tooltipData = {
        text,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      }
      setTooltip(tooltipData)
      setTooltipTimer(null)
    }, 500)

    setTooltipTimer(timer)
  }, [tooltipTimer])

  const hideTooltip = useCallback(() => {
    // Clear any pending timer
    if (tooltipTimer) {
      clearTimeout(tooltipTimer)
      setTooltipTimer(null)
    }
    // Hide tooltip immediately
    setTooltip(null)
  }, [tooltipTimer])

  // Handle image resizing
  const handleItemMouseDown = useCallback((e) => {
    // Check if the clicked element is an image with data-magiccl-image attribute
    if (e.target.matches('img[data-magiccl-image]')) {
      imageManager.startImageResize(e, e.target)
    }
  }, [imageManager])

  // Content editing handlers
  const handleContentBlur = useCallback((e, itemId) => {
    const content = e.target.innerHTML
    updateItemContent(itemId, content)
  }, [updateItemContent])

  // Handle text selection for link creation/removal
  const [selectionLinkButton, setSelectionLinkButton] = useState(null)
  const [currentTextSelection, setCurrentTextSelection] = useState(null)

  const handleTextSelection = useCallback((e) => {
    // Small delay to let selection settle
    setTimeout(() => {
      const selection = window.getSelection()
      
      if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const selectedText = selection.toString().trim()
        
        if (selectedText.length > 0) {
          // Get the range and its position
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          
          // Check if the selected text contains a link
          const containsLink = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? range.commonAncestorContainer.parentElement?.tagName === 'A' ||
              range.commonAncestorContainer.parentElement?.closest('a') !== null
            : range.commonAncestorContainer.querySelector?.('a') !== null ||
              range.commonAncestorContainer.closest?.('a') !== null
          
          // Store the current selection for later use
          setCurrentTextSelection({
            selection,
            range,
            text: selectedText,
            containsLink
          })
          
          // Show small link/unlink button above selected text
          setSelectionLinkButton({
            x: rect.left + rect.width / 2,
            y: rect.top - 35,
            isUnlink: containsLink
          })
        } else {
          setSelectionLinkButton(null)
          setCurrentTextSelection(null)
        }
      } else {
        // Hide button when no text is selected
        setSelectionLinkButton(null)
        setCurrentTextSelection(null)
      }
    }, 10)
  }, [])

  // Handle selection changes globally to hide link button when selection is lost
  useEffect(() => {
    const handleSelectionChange = () => {
      // Don't clear selection if link toolbar is visible - we need it for link creation
      if (linkToolbarVisible) return
      
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || selection.toString().trim().length === 0) {
        setSelectionLinkButton(null)
        setCurrentTextSelection(null)
      }
    }

    const handleClickAnywhere = (e) => {
      // Don't clear selection if clicking on link toolbar elements
      if (e.target.closest('[data-link-toolbar="true"]')) {
        return
      }

      // Don't clear selection if link toolbar is visible - we need it for link creation
      if (linkToolbarVisible) return
      
      // Small delay to allow selection to complete first
      setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed || selection.toString().trim().length === 0) {
          setSelectionLinkButton(null)
          setCurrentTextSelection(null)
        }
      }, 50)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mousedown', handleClickAnywhere)
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mousedown', handleClickAnywhere)
    }
  }, [linkToolbarVisible])

  // Remove link from selected text
  const removeLinkFromSelection = useCallback(() => {
    if (!currentTextSelection || !currentTextSelection.containsLink) return

    try {
      const range = currentTextSelection.range
      
      // Find the link element(s) within the selection
      let linkElement = null
      
      // Check if the selection is entirely within a single link
      if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
        linkElement = range.commonAncestorContainer.parentElement?.closest('a')
      } else {
        linkElement = range.commonAncestorContainer.querySelector?.('a') || 
                      range.commonAncestorContainer.closest?.('a')
      }
      
      if (linkElement) {
        // Get the text content of the link
        const linkText = linkElement.textContent
        
        // Create a text node to replace the link
        const textNode = document.createTextNode(linkText)
        
        // Replace the link with the text node
        linkElement.parentNode.replaceChild(textNode, linkElement)
        
        // Clear the selection and hide any toolbars
        setSelectionLinkButton(null)
        setCurrentTextSelection(null)
        window.getSelection().removeAllRanges()
        
        // Update the item content after removing the link
        const itemElement = textNode.parentElement?.closest('[data-item-id]')
        if (itemElement) {
          const itemId = itemElement.getAttribute('data-item-id')
          const contentElement = itemElement.querySelector('.magiccl-item-content')
          if (contentElement && itemId) {
            // Update local state immediately
            const newContent = contentElement.innerHTML
            const updatedItems = items.map(item => 
              item.id === itemId ? { ...item, content: newContent } : item
            )
            setItems(updatedItems)
            
            // Save to backend immediately
            if (canEdit && currentChecklistId) {
              saveChecklistData(currentChecklistId, title, updatedItems)
                .catch(err => console.warn('Error saving after link removal:', err))
            }
          }
        }
      }
    } catch (error) {
      console.error('Error removing link:', error)
    }
  }, [currentTextSelection, items, setItems, canEdit, currentChecklistId, title, saveChecklistData])

  const handleSelectionLinkButtonClick = useCallback(() => {
    if (currentTextSelection) {
      if (currentTextSelection.containsLink) {
        // If selection contains a link, remove it
        removeLinkFromSelection()
      } else {
        // If selection doesn't contain a link, show link creation toolbar
        // Position the link toolbar near the button
        setLinkToolbarPosition({
          x: selectionLinkButton.x,
          y: selectionLinkButton.y - 50
        })
        
        // Show the link toolbar
        linkManager.showLinkToolbar(currentTextSelection.selection)
        setSelectedText(currentTextSelection.text)
        setLinkToolbarVisible(true)
        
        // DON'T clear currentTextSelection here - we need it for link creation
        // Hide the selection button since we're showing the toolbar
        setSelectionLinkButton(null)
      }
    }
  }, [linkManager, currentTextSelection, selectionLinkButton, removeLinkFromSelection])

  // Custom link creation function that works with our selection state
  const createLinkFromSelection = useCallback((url) => {
    if (!currentTextSelection || !url) {
      return
    }

    try {
      // Normalize URL - trim whitespace first
      url = url.trim()
      if (!url) {
        return
      }

      // Add https:// if no protocol is present
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url
      }

      // Validate the URL is properly formed
      try {
        new URL(url)
      } catch (e) {
        console.error('Invalid URL:', url)
        return
      }

      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.className = 'text-blue-600 hover:text-blue-800 underline'
      link.textContent = currentTextSelection.text

      // Replace selected text with link
      const range = currentTextSelection.range
      range.deleteContents()
      range.insertNode(link)

      // Clear selection
      window.getSelection().removeAllRanges()
      
      // Clear the selection and hide toolbar AFTER successfully creating the link
      linkManager.hideLinkToolbar()
      setLinkToolbarVisible(false)
      setCurrentTextSelection(null)

      // Update the item content after creating the link
      const itemElement = link.closest('[data-item-id]')
      if (itemElement) {
        const itemId = itemElement.getAttribute('data-item-id')
        const contentElement = itemElement.querySelector('.magiccl-item-content')
        if (contentElement && itemId) {
          // Update local state immediately
          const newContent = contentElement.innerHTML
          const updatedItems = items.map(item => 
            item.id === itemId ? { ...item, content: newContent } : item
          )
          setItems(updatedItems)

          // Save to backend immediately
          if (canEdit && currentChecklistId) {
            saveChecklistData(currentChecklistId, title, updatedItems)
              .catch(err => console.warn('Error saving after link creation:', err))
          }
        }
      }
    } catch (error) {
      console.error('Error creating link:', error)
    }
  }, [currentTextSelection, linkManager, items, setItems, canEdit, currentChecklistId, title, saveChecklistData])

  const handleContentKeyDown = useCallback((e, itemId) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (e.shiftKey) {
        // Shift+Enter: insert line break
        const selection = window.getSelection()
        const range = selection.getRangeAt(0)
        const br = document.createElement('br')
        range.deleteContents()
        range.insertNode(br)
        range.setStartAfter(br)
        range.setEndAfter(br)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        // Regular Enter: create new item
        addNewItemAfter(itemId)
      }
    }
  }, [addNewItemAfter])

  // Track if bridge is already set up to prevent multiple setups
  const bridgeSetupRef = useRef(false)
  
  // Expose methods globally for compatibility - only set up once
  useEffect(() => {
    if (window.magicclDrawer || bridgeSetupRef.current) {
      return // Already set up
    }
    
    bridgeSetupRef.current = true
    
    const drawerBridge = {
      // Toggle checklist (main method used by floating buttons)
      toggleChecklist: toggleChecklist,
      
      // Load specific checklist
      loadChecklist: loadChecklist,
      
      // Close the drawer
      closeDrawer: closeDrawer,
      
      // Get current state
      getCurrentChecklistId: () => currentChecklistId,
      isVisible: () => isVisible,
      isLocked: () => locked,
      canEdit: () => canEdit,
      isAdministrator: isAdministrator,
      
      // Item operations
      addItem: addNewItem,
      uncheckAll: uncheckAllItems,
      
      // State getters
      getItems: () => items,
      getCheckedItems: () => checkedItems,
      getTitle: () => title,
      getProgressStats: () => progressStats,

      // Bind floating button events (required by App.jsx)
      bindFloatingButtons: bindFloatingButtons,

      // Debug method to check DOM elements
      checkDOM: () => {
        const drawer = document.querySelector('#magiccl-drawer')
        const items = document.querySelector('#magiccl-items')
        return { drawer: !!drawer, items: !!items }
      },

      // Rate limiting methods
      checkRateLimit: checkRateLimit,
      
      // Element references for compatibility
      drawer: drawerRef.current,
      drawerContent: drawerRef.current?.querySelector('.drawer-content'),
      itemsList: itemsListRef.current
    }

    // Set up global tour event listener (works even when drawer is closed)
    const globalTourEventHandler = (event) => {
      const { checklistId, itemId, checked, source } = event.detail
      
    }
    
    window.addEventListener('magicclChecklistItemChanged', globalTourEventHandler)

    // Expose to global scope
    window.magicclDrawerBridge = drawerBridge
    window.magicclDrawer = drawerBridge

    // Auto-bind floating buttons when this component mounts
    // Use a delayed binding to allow FloatingButtons to render first
    const bindingTimeout = setTimeout(() => {
      bindFloatingButtons()
      drawerBridge.checkDOM()
    }, 100)
    
    // Clean up the timeout if component unmounts before it fires
    const cleanup = () => {
      clearTimeout(bindingTimeout)
      window.removeEventListener('magicclChecklistItemChanged', globalTourEventHandler)
      delete window.magicclDrawerBridge
      delete window.magicclDrawer
      bridgeSetupRef.current = false
    }

    // Clean up on unmount
    return cleanup
  }, []) // Empty dependency array - only run once

  // Add save deadline function
  const saveItemDeadline = useCallback(async (itemId, timestamp) => {
    try {
      await makeRequest('magiccl_save_item_deadline', {
        checklist_id: currentChecklistId,
        item_id: itemId,
        deadline: timestamp || ''
      })

      if (timestamp) {
        setItemDeadlines(prev => ({
          ...prev,
          [itemId]: timestamp
        }))
      } else {
        setItemDeadlines(prev => {
          const newDeadlines = { ...prev }
          delete newDeadlines[itemId]
          return newDeadlines
        })
      }
    } catch (error) {
      console.warn('Error saving deadline:', error)
    }
  }, [makeRequest, currentChecklistId])

  // -----------------------------------------------------------
  // Comment functions for item comments
  // -----------------------------------------------------------
  // Helper to extract numeric ID from item ID string (e.g., "item_1732809382910" -> 1732809382910)
  const getNumericItemId = useCallback((itemId) => {
    if (!itemId) return 0
    const numericId = itemId.toString().replace(/\D/g, '')
    return parseInt(numericId, 10) || 0
  }, [])

  const loadItemComments = useCallback(async (itemId) => {
    const numericItemId = getNumericItemId(itemId)
    const checklistIdInt = parseInt(currentChecklistId, 10)

    if (!numericItemId || !checklistIdInt || isNaN(numericItemId) || isNaN(checklistIdInt)) {
      setItemComments([])
      return
    }

    setLoadingComments(true)
    try {
      const response = await makeRequest('magiccl_get_threaded_comments', {
        checklist_id: checklistIdInt,
        item_id: numericItemId
      })

      if (response.success) {
        setItemComments(response.data.comments || [])
      }
    } catch (error) {
      console.warn('Error loading item comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }, [makeRequest, currentChecklistId, getNumericItemId])

  const addItemComment = useCallback(async (commentText) => {
    const numericItemId = getNumericItemId(commentsModalItem)
    const checklistIdInt = parseInt(currentChecklistId, 10)

    if (!numericItemId || !checklistIdInt || !commentText.trim()) return

    try {
      const response = await makeRequest('magiccl_add_threaded_comment', {
        checklist_id: checklistIdInt,
        item_id: numericItemId,
        comment: commentText.trim()
      })

      if (response.success) {
        // Reload comments to get the updated list
        await loadItemComments(commentsModalItem)
        // Update comment count
        setItemCommentCounts(prev => ({
          ...prev,
          [commentsModalItem]: (prev[commentsModalItem] || 0) + 1
        }))
      }
    } catch (error) {
      console.warn('Error adding item comment:', error)
    }
  }, [makeRequest, currentChecklistId, commentsModalItem, loadItemComments, getNumericItemId])

  const addItemReply = useCallback(async (parentId, replyText) => {
    const numericItemId = getNumericItemId(commentsModalItem)
    const checklistIdInt = parseInt(currentChecklistId, 10)

    if (!numericItemId || !checklistIdInt || !replyText.trim()) return

    try {
      const response = await makeRequest('magiccl_add_threaded_comment', {
        checklist_id: checklistIdInt,
        item_id: numericItemId,
        comment: replyText.trim(),
        parent_id: parentId
      })

      if (response.success) {
        // Reload comments to get the updated list with the new reply
        await loadItemComments(commentsModalItem)
      }
    } catch (error) {
      console.warn('Error adding item reply:', error)
    }
  }, [makeRequest, currentChecklistId, commentsModalItem, loadItemComments, getNumericItemId])

  const toggleItemCommentLike = useCallback(async (commentId) => {
    if (!currentChecklistId) return

    try {
      const response = await makeRequest('magiccl_toggle_comment_like', {
        checklist_id: currentChecklistId,
        comment_id: commentId
      })

      if (response.success) {
        // Update the like status locally
        setItemComments(prevComments => {
          const updateLikes = (comments) => {
            return comments.map(comment => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  user_liked: response.data.liked,
                  like_count: response.data.like_count
                }
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateLikes(comment.replies)
                }
              }
              return comment
            })
          }
          return updateLikes(prevComments)
        })
      }
    } catch (error) {
      console.warn('Error toggling comment like:', error)
    }
  }, [makeRequest, currentChecklistId])

  const deleteItemComment = useCallback(async (commentId) => {
    if (!currentChecklistId) return

    try {
      const response = await makeRequest('magiccl_delete_threaded_comment', {
        checklist_id: currentChecklistId,
        comment_id: commentId
      })

      if (response.success) {
        // Reload comments to get the updated list
        await loadItemComments(commentsModalItem)
        // Decrement comment count
        setItemCommentCounts(prev => ({
          ...prev,
          [commentsModalItem]: Math.max(0, (prev[commentsModalItem] || 1) - 1)
        }))
      }
    } catch (error) {
      console.warn('Error deleting item comment:', error)
    }
  }, [makeRequest, currentChecklistId, commentsModalItem, loadItemComments])

  const handleCommentsClick = useCallback(async (itemId) => {
    setCommentsModalItem(itemId)
    setShowCommentsModal(true)
    await loadItemComments(itemId)
  }, [loadItemComments])

  // -----------------------------------------------------------
  // Refresh current checklist data (for syncing with other views)
  // -----------------------------------------------------------
  const refreshCurrentChecklist = useCallback(async () => {
    if (!currentChecklistId) return

    try {
      const data = await fetchChecklistData(currentChecklistId)

      setChecklistData(data)
      setTitle(data.title || '')
      setItems(data.items || [])
      setCanEdit(data.can_edit || false)
      setCanCheck(data.can_check || false)
      setLocked(data.locked || false)
      setInProgressItems(data.items_in_progress || [])

      // Handle checked state based on storage mode
      let finalCheckedState = data.checked_state || []
      const isLoggedIn = window.magiccl_checklists?.user_access?.is_logged_in || false
      const isPublic = data.is_public
      const handlingMode = isPublic ? (data.checked_state_handling || 'per_user') : (data.checked_state_handling || 'global')

      if (handlingMode === 'per_user' && !isLoggedIn) {
        try {
          const localKey = `magiccl_checked_${currentChecklistId}`
          const localState = localStorage.getItem(localKey)
          if (localState) {
            finalCheckedState = JSON.parse(localState)
          }
        } catch (error) {
          console.warn('MCL Drawer: Error reading localStorage for per-user checklist:', error)
        }
      }

      setCheckedItems(finalCheckedState)

      // Refresh deadlines if present
      if (data.items) {
        const deadlines = {}
        data.items.forEach(item => {
          if (item.deadline) {
            deadlines[item.id] = item.deadline
          }
        })
        setItemDeadlines(deadlines)
      }
    } catch (error) {
      console.warn('Error refreshing checklist:', error)
    }
  }, [currentChecklistId, fetchChecklistData])

  // Listen for checklist data changes from other views (kanban, shortcode, etc.)
  useEffect(() => {
    const handleChecklistDataChanged = (event) => {
      const { checklistId, action, source } = event.detail || {}

      // Only refresh if this is the currently open checklist and the change came from another source
      if (checklistId && String(checklistId) === String(currentChecklistId) && source !== 'drawer' && isVisible) {
        refreshCurrentChecklist()
      }
    }

    window.addEventListener('magicclChecklistDataChanged', handleChecklistDataChanged)

    return () => {
      window.removeEventListener('magicclChecklistDataChanged', handleChecklistDataChanged)
    }
  }, [currentChecklistId, isVisible, refreshCurrentChecklist])

  // -----------------------------------------------------------
  // Poll lock state so the UI reflects changes in real-time
  // -----------------------------------------------------------
  const lockPollRef = useRef(null)

  useEffect(() => {
    // Start polling when a checklist is open
    if (currentChecklistId) {
      if (lockPollRef.current) clearInterval(lockPollRef.current)

      lockPollRef.current = setInterval(async () => {
        try {
          const resp = await makeRequest('magiccl_get_checklist', { checklist_id: currentChecklistId })
          if (resp.success && resp.data) {
            setLocked(resp.data.locked || false)
          }
        } catch (err) {
          console.warn('MCL Drawer: lock polling failed', err)
        }
      }, 10000) // 10 s
    }

    // Cleanup on checklist close/unmount
    return () => {
      if (lockPollRef.current) {
        clearInterval(lockPollRef.current)
        lockPollRef.current = null
      }
    }
  }, [currentChecklistId, makeRequest])

  // Also try to release lock if user refreshes or closes the tab
  useEffect(() => {
    const handleUnload = () => {
      if (currentChecklistId) {
        navigator.sendBeacon?.(window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php',
          new URLSearchParams({ action: 'magiccl_release_lock', checklist_id: currentChecklistId }))
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [currentChecklistId])

  return (
    <>
      <style>
        {`
          /* Disable WP-generated checkmark pseudo-element on our custom checkbox */
          #magiccl-admin-root input.magiccl-item-checkbox::before,
          #magiccl-public-root input.magiccl-item-checkbox::before {
            content: none !important;
          }
        `}
      </style>
      {/* Tooltip */}
      {tooltip && (
        <div 
          className="fixed z-[100001] bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none transform -translate-x-1/2"
          style={{
            left: tooltip.x,
            top: tooltip.y - 15
          }}
        >
          {tooltip.text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
        </div>
      )}

      {/* Selection Link Button */}
      {selectionLinkButton && (
        <div 
          className="fixed z-[100002] transform -translate-x-1/2"
          data-link-toolbar="true"
          style={{
            left: selectionLinkButton.x,
            top: selectionLinkButton.y
          }}
        >
          <button
            className={`text-white p-1 rounded-full shadow-lg transition-colors ${
              selectionLinkButton.isUnlink 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={handleSelectionLinkButtonClick}
            onMouseDown={(e) => e.preventDefault()} // Prevent losing text selection
            title={selectionLinkButton.isUnlink ? (i18n.checklistDrawer?.tooltips?.removeLink || 'Remove link') : (i18n.checklistDrawer?.tooltips?.addLink || 'Add link')}
          >
            {selectionLinkButton.isUnlink ? (
              // Unlink icon
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 17H7A5 5 0 0 1 7 7h2" />
                <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
                <line x1="8" y1="8" x2="16" y2="16" />
              </svg>
            ) : (
              // Link icon
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 17H7A5 5 0 0 1 7 7h2" />
                <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
                <line x1="11" y1="13" x2="13" y2="11" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Link Toolbar */}
      <LinkToolbar
        isVisible={linkToolbarVisible}
        position={linkToolbarPosition}
        linkUrl={linkManager.linkUrl}
        setLinkUrl={linkManager.setLinkUrl}
        onCreateLink={createLinkFromSelection}
        onClose={() => {
          linkManager.hideLinkToolbar()
          setLinkToolbarVisible(false)
          setCurrentTextSelection(null) // Clear selection when closing
        }}
        isValidUrl={linkManager.isValidUrl}
      />

      {/* Image Choice Modal */}
      <ImageChoiceModal
        isOpen={imageManager.modal === 'choice'}
        onClose={imageManager.closeModal}
        onMediaLibrary={() => {
          imageManager.openMediaLibrary()
        }}
        onQuickUpload={() => {
          imageManager.openQuickUpload()
        }}
      />

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={imageManager.modal === 'upload'}
        onClose={imageManager.closeModal}
        onUpload={imageManager.uploadImage}
        onSelectExisting={imageManager.insertImage}
        checklistId={currentChecklistId}
        existingImages={imageManager.existingImages}
        loadingImages={imageManager.loadingImages}
        onLoadExistingImages={imageManager.loadExistingImages}
      />

      {/* Error display */}
      {error && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md shadow-lg z-50 max-w-md">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="flex-1">{error}</span>
            <button 
              className="text-red-600 hover:text-red-800 font-bold text-lg leading-none" 
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main drawer */}
              <div 
          id="magiccl-drawer" 
          className={`
            fixed inset-x-0 mx-auto w-full max-w-[700px] min-w-0 z-[99999]
            ${themeColors.bg} ${themeColors.border}
            rounded-t-2xl border-t border-l border-r shadow-2xl
            font-sans
            sm:min-w-96 sm:max-w-[700px]
            ${drawerTheme === 'custom' ? 'magiccl-theme-custom' : drawerTheme === 'dark' ? 'magiccl-theme-dark' : 'magiccl-theme-light'}
          `}
          ref={drawerRef}
          onClick={(e) => e.stopPropagation()}
          data-checklist-id={currentChecklistId || ""}
        style={{
          // Slide in/out by adjusting bottom position instead of using transforms
          bottom: isVisible ? '0' : '-100%',
          transition: 'bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: '60vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div 
          className={`flex flex-col h-full min-h-0 p-4 gap-3 ${themeColors.text} drawer-content magiccl-drawer-content`}
          data-checklist-id={currentChecklistId || ""} 
          data-checked-items={JSON.stringify(checkedItems)}
          style={{
            visibility: showContent ? 'visible' : 'hidden',
            opacity: showContent ? 1 : 0,
            transition: 'opacity 0.2s ease-out'
          }}
        >
          
          {/* Subtle locked notice */}
          {locked && (
            <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-200 rounded p-2 text-xs text-yellow-800 mb-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>{i18n.checklistDrawer?.checklistStates?.checklistLocked || 'This checklist is locked by another user. You can still interact but cannot edit structure.'}</span>
            </div>
          )}

          {/* Drawer header */}
          <div className="flex-shrink-0">
            {memoizedActiveChecklists.length > 1 && window.magiccl_checklists?.settings?.enable_navigation ? (
              <div className="flex items-center gap-2">
                <button 
                  className={`p-2 rounded-lg ${themeColors.textSecondary} hover:${themeColors.surface} transition-colors disabled:opacity-50 flex-shrink-0 ${themeColors.surface}`}
                  onClick={() => navigateChecklists('prev')}
                  disabled={!currentChecklistId}
                  aria-label="Previous checklist"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <h2 
                  ref={titleRef}
                  contentEditable={canEdit && !locked}
                  suppressContentEditableWarning={true}
                  className={`
                    flex-1 text-xl font-bold leading-tight px-2 py-1 rounded min-w-0
                    ${themeColors.text}
                    ${canEdit && !locked ? 'hover:' + themeColors.surface + ' focus:' + themeColors.surface + ' focus:outline-none' : ''}
                    magiccl-drawer-title
                  `}
                  onBlur={(e) => setTitle(e.target.textContent)}
                  onInput={(e) => setTitle(e.target.textContent)}
                  dangerouslySetInnerHTML={{ __html: title }}
                />
                
                <button 
                  className={`p-2 rounded-lg ${themeColors.textSecondary} hover:${themeColors.surface} transition-colors disabled:opacity-50 flex-shrink-0 ${themeColors.surface}`}
                  onClick={() => navigateChecklists('next')}
                  disabled={!currentChecklistId}
                  aria-label="Next checklist"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button 
                  className={`p-2 rounded-lg ${themeColors.textSecondary} hover:${themeColors.surface} transition-colors flex-shrink-0 ${themeColors.surface}`}
                  aria-label="Close checklist"
                  onClick={closeDrawer}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h2 
                  ref={titleRef}
                  contentEditable={canEdit && !locked}
                  suppressContentEditableWarning={true}
                  className={`
                    text-xl font-bold leading-tight px-2 py-1 rounded flex-1
                    ${themeColors.text}
                    ${canEdit && !locked ? 'hover:' + themeColors.surface + ' focus:' + themeColors.surface + ' focus:outline-none' : ''}
                    magiccl-drawer-title
                  `}
                  onBlur={(e) => setTitle(e.target.textContent)}
                  onInput={(e) => setTitle(e.target.textContent)}
                  dangerouslySetInnerHTML={{ __html: title }}
                />
                <button 
                  className={`p-2 rounded-lg ${themeColors.textSecondary} hover:${themeColors.surface} transition-colors ${themeColors.surface}`}
                  aria-label="Close checklist"
                  onClick={closeDrawer}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

                      {/* Description handling - prioritize public description */}
          {checklistData?.is_public && checklistData?.public_description && (
            <div className="flex-shrink-0">
              <div className={`${themeColors.textSecondary} text-sm leading-relaxed max-h-16 overflow-y-auto magiccl-public-description`}>
                {checklistData.public_description}
              </div>
            </div>
          )}
          
          {/* Show regular description only if no public description */}
          {(!checklistData?.is_public || !checklistData?.public_description) && 
           checklistData?.show_description === "1" && checklistData?.description && (
            <div className="flex-shrink-0">
              <div className={`${themeColors.textSecondary} text-sm leading-relaxed max-h-16 overflow-y-auto magiccl-public-description`}>
                {checklistData.description}
              </div>
            </div>
          )}
          </div>

          {/* Congratulations overlay within drawer */}
          {showCongrats && (
            <div className={`congrats-overlay absolute inset-0 flex items-center justify-center pointer-events-none z-20 transition-opacity duration-300 ${congratsExiting ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}>
              <div className="bg-brand-dark text-yellow-400 px-4 py-3 rounded-xl text-xl font-bold shadow-2xl transform animate-bounce">
                {i18n.checklistDrawer?.checklistStates?.congratsMessage || 'Great job! 🎉'}
              </div>
            </div>
          )}

          {/* Checklist deadline display */}
          <ChecklistDeadlineDisplay deadline={checklistDeadline} themeColors={themeColors} />

          {/* Progress counter - only show when enabled and has items - reduced size */}
          {items.length > 0 && window.magiccl_checklists?.settings?.enable_progress_counter && (
            <div className={`${themeColors.surface} rounded-lg p-2 flex-shrink-0`}>
              <div className="flex justify-between text-xs mb-1">
                <span className={themeColors.textSecondary}>{progressStats.total} {i18n.checklistDrawer?.progressCounter?.items || 'items'}</span>
                <span className={themeColors.textSecondary}>{progressStats.completed} {i18n.checklistDrawer?.progressCounter?.completed || 'completed'}</span>
                <span className={`${progressStats.percentage === 100 ? 'text-yellow-600 font-semibold' : themeColors.textSecondary}`}>
                  {progressStats.percentage}% {i18n.checklistDrawer?.progressCounter?.complete || 'complete'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressStats.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                <span className={themeColors.textSecondary}>{i18n.checklistDrawer?.checklistStates?.loadingChecklist || 'Loading checklist...'}</span>
              </div>
            </div>
          )}

          {/* Items wrapper */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <DragDropContext onDragEnd={handleDragEnd} portalContainer={document.body}>
              <Droppable droppableId="magiccl-items-droppable" isCombineEnabled>
                {(provided, snapshot) => (
                  <ul
                    id="magiccl-items"
                    className={`
                      magiccl-items-list
                      space-y-2
                      ${snapshot.isDraggingOver ? 'bg-blue-50/50 rounded-lg p-2' : ''}
                    `}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {items.map((item, index) => {
                      const isChecked = checkedItems.includes(item.id)
                      const isInProgress = inProgressItems.includes(item.id)
                      const isChild = item.parent_id && item.parent_id !== ''
                      const isLocked = item.locked || false
                      const deadline = itemDeadlines[item.id]
                      
                      // Get deadline status using helper function
                      const deadlineStatus = getDeadlineStatus(deadline)
                      const deadlineClasses = deadlineStatus.classes

                      return (
                        <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!canCheck && !canEdit}>
                          {(providedDraggable, snapshotDraggable) => (
                                                          <li
                              ref={providedDraggable.innerRef}
                              {...providedDraggable.draggableProps}
                              className={`
                                flex items-center gap-2 p-1 rounded-lg relative
                                ${deadlineClasses || (isInProgress ? 'bg-emerald-100' : themeColors.surface)} ${themeColors.itemHover}
                                ${snapshotDraggable.isDragging ? 'shadow-lg scale-105 rotate-1' : 'shadow-sm'}
                                ${snapshotDraggable.combineWith ? 'ring-2 ring-blue-400 bg-blue-50' : ''}
                                ${isChild ? 'magiccl-child-item' : ''}
                                ${isChecked ? 'opacity-70' : ''}
                                group relative transition-all duration-200
                              `}
                              data-item-id={item.id}
                              data-parent-id={item.parent_id || ""}
                              data-in-progress={isInProgress}
                              onClick={(e) => handleItemClick(e, item.id)}
                              onMouseDown={handleItemMouseDown}
                            >
                              {/* In-progress indicator */}
                              <div className={`magiccl-progress-indicator ${isInProgress ? 'active' : ''}`} />

                              {/* Drag handle - only show if can edit and not locked, hidden by default, shown on hover */}
                              {(canCheck || canEdit) && (
                                <div 
                                  {...providedDraggable.dragHandleProps}
                                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 flex-shrink-0 text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100"
                                  onMouseEnter={(e) => showTooltip(e.target, i18n.checklistDrawer?.tooltips?.dragToReorder || 'Drag to reorder')}
                                  onMouseLeave={hideTooltip}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                  </svg>
                                </div>
                              )}

                              {/* Checkbox - show if can check or edit */}
                              {(canCheck || canEdit) && (
                                <div className="relative flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    className="magiccl-item-checkbox"
                                    style={{
                                      appearance: 'none',
                                      WebkitAppearance: 'none',
                                      MozAppearance: 'none',
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '4px',
                                      border: `2px solid ${drawerTheme === 'dark' ? '#94a3b8' : '#d1d5db'}`,
                                      // Use shorthand background to remove any external background-image
                                      background: isChecked
                                        ? '#f2da21'
                                        : (drawerTheme === 'dark' ? '#334155' : '#ffffff'),
                                      cursor: locked ? 'not-allowed' : 'pointer',
                                      opacity: locked ? '0.5' : '1',
                                      transition: 'all 0.2s ease',
                                      boxSizing: 'border-box',
                                      outline: 'none',
                                      margin: '0',
                                      padding: '0'
                                    }}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      e.stopPropagation()
                                      handleCheckboxChange(item.id, e.target.checked)
                                    }}
                                    disabled={locked}
                                    onFocus={(e) => {
                                      e.target.style.boxShadow = '0 0 0 2px rgba(242, 218, 33, 0.5)'
                                    }}
                                    onBlur={(e) => {
                                      e.target.style.boxShadow = 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!locked) {
                                        e.target.style.borderColor = '#f2da21'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!locked && !isChecked) {
                                        e.target.style.borderColor = drawerTheme === 'dark' ? '#94a3b8' : '#d1d5db'
                                      }
                                    }}
                                  />
                                  {/* Custom checkmark */}
                                  {isChecked && (
                                    <div 
                                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                      style={{ top: '0', left: '0'}}
                                    >
                                      <svg 
                                        width="12" 
                                        height="12" 
                                        viewBox="0 0 20 20" 
                                        fill={drawerTheme === 'custom' ? 'currentColor' : '#1e40af'}
                                        className={drawerTheme === 'custom' ? 'magiccl-custom-checkmark' : ''}
                                        style={{ flexShrink: 0 }}
                                      >
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Priority indicator if enabled */}
                              {checklistData?.enable_item_priority && (
                                <div 
                                  className={`flex-shrink-0 w-3 h-3 rounded-full cursor-pointer transition-transform duration-200 hover:scale-110 ${
                                    checklistData.priority_display_type === 'number' 
                                      ? 'flex items-center justify-center text-xs font-bold text-white'
                                      : ''
                                  }`}
                                  style={{
                                    backgroundColor: checklistData.priority_display_type === 'color' 
                                      ? getPriorityColor(item.priority || 'none') 
                                      : getPriorityColor(item.priority || 'none')
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (canEdit && !locked && !isLocked) cyclePriority(item.id)
                                  }}
                                >
                                  {checklistData.priority_display_type === 'number' 
                                    ? getPriorityNumber(item.priority || 'none') 
                                    : ''}
                                </div>
                              )}
                              
                              {/* Content area with absolutely positioned action buttons */}
                              <div className="flex-1 min-w-0 relative">
                                {/* Item content */}
                                <div
                                  className={`
                                    w-full p-2 rounded border-2 border-transparent
                                    ${((canEdit) && !locked && !isLocked) ? `text-[16px] cursor-text ${themeColors.itemHover} focus:border-yellow-400 focus:${themeColors.surface} focus:outline-none` : 'cursor-default select-none'}
                                    ${isChecked ? 'line-through opacity-70' : ''}
                                    break-words magiccl-item-content ${isLocked ? 'pointer-events-none' : ''}
                                  `}
                                  contentEditable={canEdit && !locked && !isLocked}
                                  tabIndex={isLocked ? -1 : 0}
                                  suppressContentEditableWarning={true}
                                  onBlur={(e) => handleContentBlur(e, item.id)}
                                  onKeyDown={(e) => handleContentKeyDown(e, item.id)}
                                  onKeyUp={handleTextSelection}
                                  onPaste={(e) => contentEditing.handlePaste(e)}
                                  onMouseUp={handleTextSelection}
                                  onClick={(e) => {
                                    // Allow links to be clicked
                                    if (e.target.tagName === 'A') {
                                      e.stopPropagation() // Prevent item click handler
                                      // Manually open the link to ensure it works
                                      const url = e.target.href
                                      if (url) {
                                        window.open(url, '_blank', 'noopener,noreferrer')
                                        e.preventDefault() // Prevent default since we're handling it manually
                                      }
                                      return
                                    }
                                  }}
                                  dangerouslySetInnerHTML={{ __html: item.content }}
                                />

                                {/* Deadline Badge - absolutely positioned in top-right */}
                                {deadline && (
                                                                                                          <div 
                                     className={`absolute bottom-0 right-1 z-10 flex items-center gap-1 text-xs font-medium rounded-full shadow-sm ${
                                       (canEdit) && !locked && !isLocked ? 'cursor-pointer transition-colors' : ''
                                     }`}
                                     title={`${canEdit && !locked && !isLocked ? 'Click to edit - ' : ''}Due: ${formatDate(deadline, 'datetime')}`}
                                     onClick={canEdit && !locked && !isLocked ? (e) => {
                                       e.preventDefault()
                                       e.stopPropagation()
                                       handleDeadlineClick(item.id)
                                     } : undefined}
                                   >
                                     <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                     </svg>
                                     <span className="font-medium whitespace-nowrap">
                                       {formatDate(deadline, 'short')}
                                     </span>
                                   </div>
                                )}
                                
                                {/* Action buttons - absolutely positioned on top of content */}
                                {!isLocked && canEdit && !locked && (
                                  <div className="absolute top-[50%] translate-y-[-50%] right-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 flex items-center gap-1 bg-white rounded-md shadow-sm border p-1 z-10">
                                    {/* In Progress Button */}
                                    <button
                                      type="button"
                                      className={`w-7 h-7 flex items-center justify-center rounded transition-colors duration-200 ${
                                        isInProgress 
                                          ? 'text-emerald-600 hover:bg-emerald-100' 
                                          : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-100'
                                      }`}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        toggleInProgress(item.id)
                                      }}
                                      onMouseEnter={(e) => showTooltip(e.target, isInProgress ? (i18n.checklistDrawer?.tooltips?.removeFromInProgress || 'Remove from in progress') : (i18n.checklistDrawer?.tooltips?.markAsInProgress || 'Mark as in progress'))}
                                      onMouseLeave={hideTooltip}
                                    >
                                      {isInProgress ? (
                                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1025 1024">
                                          <path fill="currentColor" d="M896.428 1024h-128q-53 0-90.5-37.5t-37.5-90.5V128q0-53 37.5-90.5t90.5-37.5h128q53 0 90.5 37.5t37.5 90.5v768q0 53-37.5 90.5t-90.5 37.5zm-640 0h-128q-53 0-90.5-37.5T.428 896V128q0-53 37.5-90.5t90.5-37.5h128q53 0 90.5 37.5t37.5 90.5v768q0 53-37.5 90.5t-90.5 37.5z"/>
                                        </svg>
                                      ) : (
                                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                          <path fill="currentColor" d="M133 440a35.37 35.37 0 0 1-17.5-4.67c-12-6.8-19.46-20-19.46-34.33V111c0-14.37 7.46-27.53 19.46-34.33a35.13 35.13 0 0 1 35.77.45l247.85 148.36a36 36 0 0 1 0 61l-247.89 148.4A35.5 35.5 0 0 1 133 440Z"/>
                                        </svg>
                                      )}
                                    </button>

                                    {/* Deadline Button */}
                                    <button
                                      type="button"
                                      className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors duration-200"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleDeadlineClick(item.id)
                                      }}
                                      onMouseEnter={(e) => showTooltip(e.target, i18n.checklistDrawer?.tooltips?.setDeadline || 'Set deadline')}
                                      onMouseLeave={hideTooltip}
                                    >
                                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                        <mask id="ipSTimer0">
                                          <g fill="none" strokeWidth="4">
                                            <circle cx="24" cy="28" r="16" fill="#fff" stroke="#fff"/>
                                            <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" d="M28 4h-8m4 0v8m11 4l3-3"/>
                                            <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" d="M24 28v-6m0 6h-6"/>
                                          </g>
                                        </mask>
                                        <path fill="currentColor" d="M0 0h48v48H0z" mask="url(#ipSTimer0)"/>
                                      </svg>
                                    </button>

                                    {/* Add Image Button */}
                                    <button
                                      type="button"
                                      className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded transition-colors duration-200"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        imageManager.handleImageButtonClick(e.target.closest('li'))
                                      }}
                                      onMouseEnter={(e) => showTooltip(e.target, i18n.checklistDrawer?.tooltips?.addImage || 'Add image')}
                                      onMouseLeave={hideTooltip}
                                    >
                                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                        <path fill="currentColor" d="M416 64H96a64.07 64.07 0 0 0-64 64v256a64.07 64.07 0 0 0 64 64h320a64.07 64.07 0 0 0 64-64V128a64.07 64.07 0 0 0-64-64Zm-80 64a48 48 0 1 1-48 48a48.05 48.05 0 0 1 48-48ZM96 416a32 32 0 0 1-32-32v-67.63l94.84-84.3a48.06 48.06 0 0 1 65.8 1.9l64.95 64.81L172.37 416Zm352-32a32 32 0 0 1-32 32H217.63l121.42-121.42a47.72 47.72 0 0 1 61.64-.16L448 333.84Z"/>
                                      </svg>
                                    </button>

                                    {/* Comments Button */}
                                    <button
                                      type="button"
                                      className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors duration-200"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleCommentsClick(item.id)
                                      }}
                                      onMouseEnter={(e) => showTooltip(e.target, i18n.checklistDrawer?.tooltips?.comments || 'Comments')}
                                      onMouseLeave={hideTooltip}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                      </svg>
                                    </button>

                                    {/* Tour Button - only show if this item has tour connections */}
                                    {toursEnabled && itemsWithTourConnections.has(item.id) && (
                                      <button
                                        type="button"
                                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          handleTourButtonClick(item.id)
                                        }}
                                        onMouseEnter={(e) => showTooltip(e.target, i18n.checklistDrawer?.buttons?.startTour || 'Start tour from this step')}
                                        onMouseLeave={hideTooltip}
                                        title={i18n.checklistDrawer?.buttons?.startTour || "Start tour from this step"}
                                      >
                                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M6.5 13.5V21q0 .213-.144.356q-.144.144-.357.144t-.356-.144Q5.5 21.213 5.5 21V3q0-.213.144-.356q.144-.144.357-.144t.356.144Q6.5 2.787 6.5 3v1.5h12.583q.429 0 .661.351q.233.35.071.755L18.462 9l1.353 3.394q.162.404-.07.755q-.233.351-.662.351H6.5Zm6-3q.633 0 1.066-.434Q14 9.633 14 9t-.434-1.066Q13.133 7.5 12.5 7.5t-1.066.434Q11 8.367 11 9t.434 1.066q.433.434 1.066.434Z"/>
                                        </svg>
                                      </button>
                                    )}

                                    {/* Remove Button */}
                                    {items.length > 1 && (!isLocked && canEdit) && (
                                      <button
                                        type="button"
                                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-100 rounded transition-colors duration-200 font-bold text-lg"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          removeItem(item.id)
                                        }}
                                        onMouseEnter={(e) => showTooltip(e.target, i18n.checklistDrawer?.tooltips?.removeItem || 'Remove item')}
                                        onMouseLeave={hideTooltip}
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </li>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Drawer actions */}
          {(canEdit || canCheck) && !locked && (
            <div className={`flex justify-between items-center gap-2 pt-3 border-t ${themeColors.border} flex-shrink-0`}>
              <div className="flex gap-2">
                {/* Add item button - allow when checklist supports item locking even for interact users */}
                {canEdit && (
                  <button 
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-brand-accent text-brand-dark
                      ${themeColors.accent} ${themeColors.accentHover}
                      hover:shadow-md active:scale-95
                      magiccl-drawer-button-primary
                    `}
                    onClick={addNewItem}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {i18n.checklistDrawer?.buttons?.addItem || 'Add Item'}
                  </button>
                )}
                
                {/* Uncheck all button - for both edit and check permissions */}
                {checkedItems.length > 0 && (canEdit || canCheck) && (
                  <button 
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                      ${themeColors.buttonSecondary}
                      hover:shadow-md active:scale-95
                      magiccl-drawer-button-secondary
                    `}
                    onClick={uncheckAllItems}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {i18n.checklistDrawer?.buttons?.uncheckAll || 'Uncheck All'}
                  </button>
                )}
              </div>
              
              {/* Reset info display - moved to bottom right */}
              <ResetInfoDisplay resetInfo={resetInfo} themeColors={themeColors} />
            </div>
          )}
        </div>
      </div>

      {/* Deadline Modal */}
      <DeadlineModal
        isOpen={showDeadlineModal}
        onClose={() => {
          setShowDeadlineModal(false)
          setDeadlineModalItem(null)
        }}
        onSave={(timestamp) => {
          if (deadlineModalItem) {
            saveItemDeadline(deadlineModalItem, timestamp)
          }
        }}
        itemId={deadlineModalItem}
        currentDeadline={deadlineModalItem ? itemDeadlines[deadlineModalItem] : null}
      />

      {/* Item Comments Modal */}
      <ItemCommentsModal
        isOpen={showCommentsModal}
        onClose={() => {
          setShowCommentsModal(false)
          setCommentsModalItem(null)
          setItemComments([])
        }}
        itemId={commentsModalItem}
        itemContent={commentsModalItem ? items.find(i => i.id === commentsModalItem)?.content : null}
        comments={itemComments}
        loadingComments={loadingComments}
        onAddComment={addItemComment}
        onAddReply={addItemReply}
        onLikeComment={toggleItemCommentLike}
        onDeleteComment={deleteItemComment}
        isAdmin={isAdministrator}
        i18n={i18n}
      />
    </>
  )
}

export default ChecklistDrawer 