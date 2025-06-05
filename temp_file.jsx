import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

// Custom hooks for different concerns
const useRateLimit = () => {
  const isRateLimitEnabled = useCallback(() => {
    return window.mcl_checklists?.settings?.rateLimitEnabled === '1'
  }, [])

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
    const ajaxUrl = window.mcl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
    const nonce = window.mcl_checklists?.nonce || ''
    
    // Append action and nonce
    formData.append('action', endpoint)
    if (nonce) {
      formData.append('nonce', nonce)
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
      const response = await makeRequest('mcl_get_checklist', { checklist_id: checklistId })
      
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
      const response = await makeRequest('mcl_update_checklist', {
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
      // Try server state first if user can save
      const serverState = window.mcl_checklists?.checkedState?.[checklistId]
      if (serverState) return serverState

      // Fall back to local storage
      const localKey = `mcl_checked_${checklistId}`
      const localState = localStorage.getItem(localKey)
      return localState ? JSON.parse(localState) : []
    } catch (error) {
      console.warn('Error getting checked state:', error)
      return []
    }
  }, [])

  const saveCheckedState = useCallback(async (checklistId, checkedItems) => {
    if (!checklistId) return

    try {
      // Save to local storage immediately
      const localKey = `mcl_checked_${checklistId}`
      localStorage.setItem(localKey, JSON.stringify(checkedItems))

      // Save to server if user can save
      if (window.mcl_checklists?.user_access?.is_logged_in) {
        await makeRequest('mcl_save_checked_state', {
          checklist_id: checklistId,
          checked_items: checkedItems
        })
      }
    } catch (error) {
      console.warn('Error saving checked state:', error)
    }
  }, [makeRequest])

  return { getCheckedState, saveCheckedState }
}

// Theme colors configuration
const getThemeColors = (theme) => {
  switch (theme) {
    case 'dark':
      return {
        bg: 'bg-slate-800',
        surface: 'bg-slate-700',
        border: 'border-slate-600',
        text: 'text-white',
        textSecondary: 'text-slate-300',
        accent: 'bg-yellow-400 text-slate-800',
        accentHover: 'hover:bg-yellow-300',
        buttonSecondary: 'bg-slate-600 hover:bg-red-600 text-white',
        checkbox: 'accent-yellow-400',
        itemHover: 'hover:bg-yellow-400/20'
      }
    case 'custom':
      return {
        bg: 'bg-gray-200',
        surface: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        accent: 'bg-yellow-400 text-gray-900',
        accentHover: 'hover:bg-yellow-300',
        buttonSecondary: 'bg-gray-300 hover:bg-red-500 hover:text-white text-gray-700',
        checkbox: 'accent-yellow-400',
        itemHover: 'hover:bg-yellow-400/20'
      }
    case 'light':
    default:
      return {
        bg: 'bg-white',
        surface: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        accent: 'bg-yellow-400 text-blue-900',
        accentHover: 'hover:bg-yellow-300',
        buttonSecondary: 'bg-gray-100 hover:bg-red-500 hover:text-white border border-gray-200',
        checkbox: 'accent-yellow-400',
        itemHover: 'hover:bg-yellow-400/20'
      }
  }
}

// Image management hook
const useImageManager = () => {
  const [modal, setModal] = useState(null)
  const [currentItem, setCurrentItem] = useState(null)
  const [existingImages, setExistingImages] = useState([])
  const [loadingImages, setLoadingImages] = useState(false)
  const { makeRequest } = useAPI()
  const insertImageRef = useRef(null)

  const handleImageButtonClick = useCallback((listItem) => {
    setCurrentItem(listItem)
    
    // Check if user is logged in and can use media library
    const isLoggedIn = window.mcl_checklists?.user_access?.is_logged_in || false
    
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

    const mediaFrame = wp.media({
      title: 'Select Image',
      library: { type: 'image' },
      multiple: false,
      button: { text: 'Insert Image' }
    })

    mediaFrame.on('select', () => {
      const attachment = mediaFrame.state().get('selection').first().toJSON()
      insertImageRef.current?.(attachment)
      closeModal()
    })

    mediaFrame.on('open', () => {
      const drawer = document.getElementById('mcl-drawer')
      if (drawer) { drawer.style.zIndex = '99999' }
    })

    mediaFrame.on('close', () => {
      const drawer = document.getElementById('mcl-drawer')
      if (drawer) { drawer.style.zIndex = '999999' }
    })

    mediaFrame.open()
  }, [closeModal])

  const loadExistingImages = useCallback(async (checklistId) => {
    if (!checklistId) return;
    setLoadingImages(true)
    try {
      // Build AJAX URL
      const ajaxUrl = (window.mclAdmin && window.mclAdmin.ajax_url)
        || (window.mcl_checklists && window.mcl_checklists.ajax_url)
        || '/wp-admin/admin-ajax.php'
      const formData = new FormData()
      formData.append('action', 'mcl_get_uploaded_images')
      formData.append('checklist_id', checklistId)
      // Include invite token if present
      const storedToken = window.mcl_checklists?.invite_token?.token
      if (storedToken) {
        formData.append('stored_token', storedToken)
      }
      const res = await fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })
      const data = await res.json()
      if (data.success) {
        setExistingImages(data.data)
      } else {
        console.error('Failed to load existing images:', data.data?.message)
        setExistingImages([])
      }
    } catch (error) {
      console.error('Error loading existing images:', error)
      setExistingImages([])
    } finally {
      setLoadingImages(false)
    }
  }, [])

  const uploadImage = useCallback(async (file, checklistId) => {
    const formData = new FormData()
    formData.append('action', 'mcl_upload_image')
    formData.append('file', file)
    formData.append('checklist_id', checklistId || 0)

    // Add nonce if available
    const nonce = window.mcl_checklists?.nonce
    if (nonce) {
      formData.append('nonce', nonce)
    }

    const response = await fetch(window.mcl_checklists.ajax_url, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    })

    return response.json()
  }, [])

  const insertImage = useCallback((imageData) => {
    if (!currentItem) return

    const contentDiv = currentItem.querySelector('.mcl-item-content')
    if (!contentDiv) return

    // Create image element
    const img = document.createElement('img')
    img.src = imageData.url
    img.alt = imageData.alt || ''
    img.className = 'max-w-full h-auto rounded-md my-2 cursor-ew-resize'
    img.setAttribute('data-mcl-image', 'true')

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
    
    setCurrentItem(null)
  }, [currentItem])

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
    insertImage
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

  const checkTourConnections = useCallback(async (checklistId, itemId) => {
    try {
      const response = await makeRequest('mcl_get_item_tour_connections', {
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

  const startTourFromConnection = useCallback((connections) => {
    const connection = connections[0]
    const params = new URLSearchParams()
    params.set('mcl_continue_tour', connection.tour_id)
    params.set('mcl_tour_step', connection.step_index)
    
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
  }, [])

  return { checkTourConnections, startTourFromConnection }
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
      const activeChecklists = window.mcl_checklists?.shortcuts || {}
      
      if (isClosing) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-md relative transform transition-all ${className}`} onClick={(e) => e.stopPropagation()}>
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Insert Image">
      <p className="text-gray-600 mb-4">Choose how you would like to add an image:</p>
      <div className="flex flex-col gap-3">
        <button 
          type="button" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          onClick={onMediaLibrary}
        >
          WordPress Media Library
        </button>
        <button 
          type="button" 
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          onClick={onQuickUpload}
        >
          Quick Upload
        </button>
        <button 
          type="button" 
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          onClick={onClose}
        >
          Cancel
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
      setError('Invalid file type. Please upload a JPG, PNG, or GIF image.')
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
    if (activeTab === 'upload') {
      return uploading ? 'Uploading...' : 'Upload Image'
    }
    return 'Select Image'
  }

  const isButtonDisabled = () => {
    if (activeTab === 'upload') {
      return !file || uploading
    }
    return !selectedExisting
  }

  const actions = (
    <>
      <button 
        type="button" 
        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors" 
        onClick={onClose}
      >
        Cancel
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
    <Modal isOpen={isOpen} onClose={onClose} title="Upload or Select Image" actions={actions} className="max-w-2xl">
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
          Upload New
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
          Select Existing
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
                <p className="text-gray-600">Drag and drop image here or click to select</p>
                <p className="text-sm text-gray-500">Maximum file size: 10MB. Supported formats: JPG, PNG, GIF</p>
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
            <div className="text-center py-8 text-gray-500">Loading images...</div>
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
            <p className="text-center py-8 text-gray-500">No images found</p>
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
  if (!isVisible) return null

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
      style={{
        top: position?.y || 0,
        left: position?.x || 0,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="px-3 py-1 border border-gray-300 rounded text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter URL..."
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (isValidUrl(linkUrl)) {
                onCreateLink(linkUrl)
              }
            } else if (e.key === 'Escape') {
              onClose()
            }
          }}
          autoFocus
        />
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onCreateLink(linkUrl)}
          disabled={!isValidUrl(linkUrl)}
        >
          ✓
        </button>
      </div>
    </div>
  )
}

const ChecklistDrawer = ({ theme = 'light' }) => {
  // Core state
  const [isVisible, setIsVisible] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [dragEnabled, setDragEnabled] = useState(false) // Control when drag functionality is enabled
  const [currentChecklistId, setCurrentChecklistId] = useState(null)
  const [checklistData, setChecklistData] = useState(null)
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  
  // Permission states
  const [canEdit, setCanEdit] = useState(false)
  const [canCheck, setCanCheck] = useState(false)
  const [locked, setLocked] = useState(false)
  
  // Feature states
  const [checkedItems, setCheckedItems] = useState([])
  const [inProgressItems, setInProgressItems] = useState([])
  const [showCongrats, setShowCongrats] = useState(false)
  const [progressStats, setProgressStats] = useState({ total: 0, completed: 0, percentage: 0 })
  
  // UI states
  const [selectedText, setSelectedText] = useState(null)
  const [linkToolbarVisible, setLinkToolbarVisible] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [tooltip, setTooltip] = useState(null)
  const [tooltipTimer, setTooltipTimer] = useState(null)
  const [linkToolbarPosition, setLinkToolbarPosition] = useState({ x: 0, y: 0 })
  
  // Deadlines and timers
  const [itemDeadlines, setItemDeadlines] = useState({})
  const [countdownTimers, setCountdownTimers] = useState(new Map())
  
  // Refs
  const drawerRef = useRef(null)
  const itemsListRef = useRef(null)
  const titleRef = useRef(null)
  const bindingRef = useRef(false) // Prevent duplicate bindings

  // Custom hooks
  const { checkRateLimit } = useRateLimit()
  const { fetchChecklistData, saveChecklistData } = useChecklistData()
  const { getCheckedState, saveCheckedState } = useCheckedState()
  const { makeRequest } = useAPI()
  const imageManager = useImageManager()
  const linkManager = useLinkManager()
  const contentEditing = useContentEditing()
  const tourIntegration = useTourIntegration()

  // Get theme colors
  const themeColors = useMemo(() => getThemeColors(theme), [theme])

  // Drag-and-drop handler using hello-pangea/dnd
  const handleDragEnd = useCallback((result) => {
    const { source, destination, combine } = result

    // Combine: set as child of another item
    if (combine) {
      const newItems = Array.from(items)
      const [draggedItem] = newItems.splice(source.index, 1)
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
      // Normal reorder: clear parent to remove hierarchy
      const newItems = Array.from(items)
      const [reorderedItem] = newItems.splice(source.index, 1)
      reorderedItem.parent_id = null
      newItems.splice(destination.index, 0, reorderedItem)
      setItems(newItems)
      
      if (canEdit && currentChecklistId) {
        saveChecklistData(currentChecklistId, title, newItems).catch(() => {})
      }
    }
  }, [items, canEdit, currentChecklistId, saveChecklistData, title])

  // Admin/permissions
  const isAdministrator = useCallback(() => {
    return window.mcl_checklists?.user_access?.is_admin === true
  }, [])

  // Token management
  const getStoredToken = useCallback(() => {
    try {
      const stored = localStorage.getItem('mcl_invite_token')
      if (!stored) return null

      const data = JSON.parse(stored)
      const now = Math.floor(Date.now() / 1000)

      // Check if token has expired
      if (now > data.expiry) {
        localStorage.removeItem('mcl_invite_token')
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

  // Get active checklists for navigation
  const getActiveChecklists = useCallback(() => {
    try {
      if (!activeChecklists.length) {
        const shortcuts = window.mcl_checklists?.shortcuts || {}
        const checklists = Object.entries(shortcuts)
          .filter(([id, data]) => data && id)
          .map(([id]) => id)
          .sort((a, b) => parseInt(a) - parseInt(b))
        
        setActiveChecklists(checklists)
        return checklists
      }
      return activeChecklists
    } catch (error) {
      console.error('Error getting active checklists:', error)
      return []
    }
  }, [activeChecklists])

  // Core checklist operations
  const closeDrawer = useCallback(() => {
    // Capture content from any focused elements before closing
    const activeElement = document.activeElement
    let updatedItems = items
    let updatedTitle = title
    
    if (activeElement && activeElement.classList.contains('mcl-item-content') && activeElement.isContentEditable) {
      const itemId = activeElement.closest('[data-item-id]')?.getAttribute('data-item-id')
      if (itemId) {
        const content = activeElement.innerHTML
        // Update the items array with the current content
        updatedItems = items.map(item => 
          item.id === itemId ? { ...item, content } : item
        )
        
        // Update state for consistency
        setItems(updatedItems)
        
        // Also blur the element to ensure consistency
        activeElement.blur()
      }
    }

    // Also capture title changes if title is focused
    if (activeElement && activeElement.classList.contains('mcl-drawer-title') && activeElement.isContentEditable) {
      updatedTitle = activeElement.textContent
      setTitle(updatedTitle)
      activeElement.blur()
    }

    // Trigger save of checklist data before closing using the captured values
    if (canEdit && currentChecklistId) {
      saveChecklistData(currentChecklistId, updatedTitle, updatedItems)
        .catch(err => console.warn('Error saving checklist on close:', err))
    }
    
    // Start closing animation
    setIsVisible(false)
    setDragEnabled(false) // Disable drag during closing
    
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
      
      // Load checked state
      const checkedState = getCheckedState(checklistId)
      setCheckedItems(checkedState)

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

      if (!isVisible) {
        setIsVisible(true)
        // Small delay to ensure smooth opening animation
        setTimeout(() => {
          setShowContent(true)
          // Enable drag after animation is complete
          setTimeout(() => setDragEnabled(true), 350) // Slightly before animation ends
        }, 50)
      } else {
        setShowContent(true)
        // Enable drag immediately if already visible
        setTimeout(() => setDragEnabled(true), 100)
      }
    } catch (err) {
      console.error('Failed to load checklist:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [currentChecklistId, fetchChecklistData, getCheckedState, isVisible])

  const toggleChecklist = useCallback(async (checklistId) => {
    // Rate limit check
    const drawerCheck = checkRateLimit(`mcl_drawer_${checklistId}`)
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
    const drawerCheck = checkRateLimit(`mcl_drawer_nav`)
    if (!drawerCheck.allowed) {
      setError(`Rate limit reached. Try again in ${drawerCheck.remaining} seconds.`)
      return
    }

    const checklists = getActiveChecklists()
    
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
  }, [currentIndex, getActiveChecklists, currentChecklistId, checkRateLimit, loadChecklist])

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
      return 'Deadline passed'
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
        // Show reset notification
        const notification = document.createElement('div')
        notification.className = 'fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded shadow-lg z-50'
        notification.innerHTML = `
          <div class="flex items-center gap-3">
            <span>This checklist has been automatically reset.</span>
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
      const response = await makeRequest('mcl_save_in_progress', {
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
    if (!canEdit || locked) return

    setInProgressItems(prev => {
      const newItems = prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
      
      saveInProgressState(newItems)
      return newItems
    })
  }, [canEdit, locked, saveInProgressState])

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
    const newCheckedItems = isChecked 
      ? [...checkedItems, itemId]
      : checkedItems.filter(id => id !== itemId)

    setCheckedItems(newCheckedItems)
    
    // Automatically reorder items based on checked state
    const reorderedItems = [...items]
    const itemIndex = reorderedItems.findIndex(item => item.id === itemId)
    
    if (itemIndex !== -1) {
      // Remove the item from its current position
      const [movedItem] = reorderedItems.splice(itemIndex, 1)
      
      if (isChecked) {
        // Move checked item to bottom
        reorderedItems.push(movedItem)
      } else {
        // Move unchecked item to top
        reorderedItems.unshift(movedItem)
      }
      
      // Update the items state
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
      await saveCheckedState(currentChecklistId, newCheckedItems)
    }

    // Check if all items are completed
    const allItemsChecked = reorderedItems.length > 0 && reorderedItems.every(item => 
      newCheckedItems.includes(item.id)
    )

    if (allItemsChecked && !showCongrats) {
      setShowCongrats(true)
      setTimeout(() => setShowCongrats(false), 3000)
    }
  }, [checkedItems, currentChecklistId, items, saveCheckedState, showCongrats, canEdit, title, saveChecklistData])

  const addNewItem = useCallback(() => {
    if (!canEdit || locked) return

    const newItem = {
      id: Date.now().toString(),
      content: '',
      order: items.length
    }

    setItems(prev => [...prev, newItem])
    
    // Focus the new item after render
    setTimeout(() => {
      const newItemElement = document.querySelector(`[data-item-id="${newItem.id}"] .mcl-item-content`)
      if (newItemElement) {
        newItemElement.focus()
      }
    }, 0)
  }, [canEdit, locked, items.length])

  const removeItem = useCallback((itemId) => {
    if (!canEdit || locked) return

    setItems(prev => prev.filter(item => item.id !== itemId))
    setCheckedItems(prev => prev.filter(id => id !== itemId))
    setInProgressItems(prev => prev.filter(id => id !== itemId))
    
    // Remove deadline if exists
    setItemDeadlines(prev => {
      const newDeadlines = { ...prev }
      delete newDeadlines[itemId]
      return newDeadlines
    })
  }, [canEdit, locked])

  // Update item content
  const updateItemContent = useCallback((itemId, content) => {
    if (!canEdit || locked) return

    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, content } : item
    ))
  }, [canEdit, locked])

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

  const uncheckAllItems = useCallback(() => {
    if ((!canEdit && !canCheck) || locked) return

    setCheckedItems([])
    if (currentChecklistId) {
      saveCheckedState(currentChecklistId, [])
    }
  }, [canEdit, canCheck, locked, currentChecklistId, saveCheckedState])

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
    if (bindingRef.current) return // Prevent duplicate bindings
    
    bindingRef.current = true
    
    // Bind only to floating buttons (not the drawer content)
    const buttons = document.querySelectorAll('.mcl-speed-dial-button, .mcl-single-floating-button')

    const handleFloatingButtonClick = async (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      const checklistId = e.currentTarget.getAttribute('data-checklist-id')
      if (checklistId) {
        await toggleChecklist(checklistId)
      }
    }
    
    buttons.forEach(button => {
      button.removeEventListener('click', handleFloatingButtonClick)
      button.addEventListener('click', handleFloatingButtonClick)
    })
    
    setTimeout(() => {
      bindingRef.current = false
    }, 1000)
  }, [toggleChecklist])

  // Click outside handler - fixed to prevent interference
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isVisible && drawerRef.current) {
        const isOutsideDrawer = !drawerRef.current.contains(e.target)
        const isNotFloatingButton = !e.target.closest('.mcl-speed-dial-button, .mcl-single-floating-button')
        const isNotModal = !e.target.closest('.modal, [data-modal]')
        const isNotMediaModal = !e.target.closest('.media-modal')
        const isNotMediaFrame = !e.target.closest('.media-frame')
        
        if (isOutsideDrawer && isNotFloatingButton && isNotModal && isNotMediaModal && isNotMediaFrame) {
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

  // Placeholder function to prevent onClick errors - can be removed once onClick is removed
  const handleItemClick = useCallback((e, itemId) => {
    // No-op - all functionality moved to direct button handlers
  }, [])

  // Handle deadline click
  const handleDeadlineClick = useCallback((itemId) => {
    // Find current deadline
    const currentItem = items.find(item => item.id === itemId)
    const existingDeadline = currentItem?.deadline

    // Create simple prompt for now (can be enhanced with modal later)
    const newDeadline = prompt(
      'Enter deadline (YYYY-MM-DD HH:MM):', 
      existingDeadline ? new Date(existingDeadline * 1000).toISOString().slice(0, 16) : ''
    )
    
    if (newDeadline !== null) {
      if (newDeadline === '') {
        // Remove deadline
        setItemDeadlines(prev => {
          const newDeadlines = { ...prev }
          delete newDeadlines[itemId]
          return newDeadlines
        })
        // Clear deadline on server
        makeRequest('mcl_save_item_deadline', { checklist_id: currentChecklistId, item_id: itemId, deadline: '' })
          .catch(err => console.warn('Error clearing deadline:', err))
      } else {
        // Set new deadline
        const timestamp = Math.floor(new Date(newDeadline).getTime() / 1000)
        setItemDeadlines(prev => ({
          ...prev,
          [itemId]: timestamp
        }))
        // Save deadline on server
        makeRequest('mcl_save_item_deadline', { checklist_id: currentChecklistId, item_id: itemId, deadline: timestamp })
          .catch(err => console.warn('Error saving deadline:', err))
      }
    }
  }, [items, makeRequest, currentChecklistId])

  // Add new item after current item
  const addNewItemAfter = useCallback((currentItemId) => {
    const currentIndex = items.findIndex(item => item.id === currentItemId)
    if (currentIndex !== -1) {
      const newItem = {
        id: Date.now().toString(),
        content: '',
        order: items.length,
        priority: 'none'
      }

      const newItems = [...items]
      newItems.splice(currentIndex + 1, 0, newItem)
      setItems(newItems)
      
      // Focus the new item after render
      setTimeout(() => {
        const newItemElement = document.querySelector(`[data-item-id="${newItem.id}"] .mcl-item-content`)
        if (newItemElement) {
          newItemElement.focus()
        }
      }, 0)
    }
  }, [items])

  // Auto-save effect
  useEffect(() => {
    if (!currentChecklistId || !canEdit) return

    const saveTimer = setTimeout(() => {
      if (items.length > 0) {
        saveChecklistData(currentChecklistId, title, items)
      }
    }, 1000) // Debounce saves by 1 second

    return () => clearTimeout(saveTimer)
  }, [title, items, currentChecklistId, canEdit, saveChecklistData])

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

  // Content editing handlers
  const handleContentBlur = useCallback((e, itemId) => {
    const content = e.target.innerHTML
    updateItemContent(itemId, content)
  }, [updateItemContent])

  // Handle text selection for link creation
  const handleTextSelection = useCallback((e) => {
    const selection = window.getSelection()
    
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const selectedText = selection.toString().trim()
      
      if (selectedText.length > 0) {
        // Get the range and its position
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        
        // Position the link toolbar
        setLinkToolbarPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        })
        
        // Show the link toolbar
        linkManager.showLinkToolbar(selection)
        setSelectedText(selectedText)
        setLinkToolbarVisible(true)
      }
    } else {
      // Hide toolbar when no text is selected
      linkManager.hideLinkToolbar()
      setLinkToolbarVisible(false)
    }
  }, [linkManager])

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

  // Expose methods globally for compatibility - only set up once
  useEffect(() => {
    if (window.mclDrawer) return // Already set up
    
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

      // Test method to manually open a checklist (for debugging)
      testOpen: (checklistId = '1') => {
        console.log('MCL: Test opening checklist', checklistId)
        loadChecklist(checklistId)
      },

      // Debug method to check DOM elements
      checkDOM: () => {
        const drawer = document.querySelector('#mcl-drawer')
        const items = document.querySelector('#mcl-items')
        console.log('MCL DOM Check:', {
          drawer: !!drawer,
          items: !!items,
          drawerClasses: drawer?.className,
          itemsChildren: items?.children.length
        })
        return { drawer: !!drawer, items: !!items }
      },

      // Rate limiting methods
      checkRateLimit: checkRateLimit,
      
      // Element references for compatibility
      drawer: drawerRef.current,
      drawerContent: drawerRef.current?.querySelector('.drawer-content'),
      itemsList: itemsListRef.current
    }

    // Expose to global scope
    window.mclDrawerBridge = drawerBridge
    window.mclDrawer = drawerBridge
    console.log('MCL: Bridge setup complete, window.mclDrawer now available')

    // Auto-bind floating buttons when this component mounts
    setTimeout(() => {
      bindFloatingButtons()
      console.log('MCL: Drawer component ready')
      drawerBridge.checkDOM()
    }, 100)

    // Clean up on unmount
    return () => {
      delete window.mclDrawerBridge
      delete window.mclDrawer
    }
  }, []) // Empty dependency array - only run once

  // Tour Button Component
  const TourButton = ({ itemId, checklistId }) => {
    const [hasConnections, setHasConnections] = useState(false)
    const [connections, setConnections] = useState([])

    useEffect(() => {
      if (itemId && checklistId) {
        tourIntegration.checkTourConnections(checklistId, itemId).then(conns => {
          if (conns.length > 0) {
            setHasConnections(true)
            setConnections(conns)
          }
        })
      }
    }, [itemId, checklistId])

    if (!hasConnections) return null

    return (
      <button
        type="button"
        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          tourIntegration.startTourFromConnection(connections)
        }}
        onMouseEnter={(e) => showTooltip(e.target, 'Start tour from this step')}
        onMouseLeave={hideTooltip}
        title="Start tour from this step"
      >
        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.5 13.5V21q0 .213-.144.356q-.144.144-.357.144t-.356-.144Q5.5 21.213 5.5 21V3q0-.213.144-.356q.144-.144.357-.144t.356.144Q6.5 2.787 6.5 3v1.5h12.583q.429 0 .661.351q.233.35.071.755L18.462 9l1.353 3.394q.162.404-.07.755q-.233.351-.662.351H6.5Zm6-3q.633 0 1.066-.434Q14 9.633 14 9t-.434-1.066Q13.133 7.5 12.5 7.5t-1.066.434Q11 8.367 11 9t.434 1.066q.433.434 1.066.434Z"/>
        </svg>
      </button>
    )
  }

  return (
    <>
      {/* Tooltip */}
      {tooltip && (
        <div 
          className="fixed z-[9999] bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none transform -translate-x-1/2"
          style={{
            left: tooltip.x,
            top: tooltip.y - 15
          }}
        >
          {tooltip.text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
        </div>
      )}

      {/* Link Toolbar */}
      <LinkToolbar
        isVisible={linkManager.isToolbarVisible}
        position={linkToolbarPosition}
        linkUrl={linkManager.linkUrl || linkUrl}
        setLinkUrl={linkManager.setLinkUrl || setLinkUrl}
        onCreateLink={linkManager.createLink}
        onClose={linkManager.hideLinkToolbar}
        isValidUrl={linkManager.isValidUrl || contentEditing.isValidUrl}
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

      {/* Main drawer - Always rendered, visibility controlled by JS styles */}
      <div 
        id="mcl-drawer" 
        className={`
          fixed bottom-0 inset-x-0 mx-auto w-full max-w-2xl min-w-0 z-50
          ${themeColors.bg} ${themeColors.border}
          rounded-t-2xl border-t border-l border-r shadow-2xl
          font-sans
          sm:min-w-96 sm:max-w-2xl
        `}
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxHeight: isVisible ? '60vh' : '0',
          visibility: isVisible ? 'visible' : 'hidden',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
      >
        <div 
          className={`flex flex-col h-full max-h-full p-4 gap-3 ${themeColors.text} ${locked ? 'opacity-60' : ''} drawer-content`}
          data-checklist-id={currentChecklistId || ""} 
          data-checked-items={JSON.stringify(checkedItems)}
        >
          
          {/* Show content only when showContent is true */}
          {showContent && (
            <>
              {/* Locked overlay */}
              {locked && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-t-2xl">
                  <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm">
                    <div className="text-yellow-600 mb-3">
                      <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-medium">This checklist is currently locked for editing by another user.</p>
                  </div>
                </div>
              )}

              {/* Drawer header */}
              <div className="flex-shrink-0">
                {getActiveChecklists().length > 1 && window.mcl_checklists?.settings?.enable_navigation ? (
                  <div className="flex items-center gap-2">
                    <button 
                      className={`p-2 rounded-lg ${themeColors.textSecondary} hover:${themeColors.surface} transition-colors disabled:opacity-50`}
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
                        flex-1 text-xl font-bold leading-tight px-2 py-1 rounded
                        ${canEdit && !locked ? 'hover:' + themeColors.surface + ' focus:' + themeColors.surface + ' focus:outline-none' : ''}
                        mcl-drawer-title
                      `}
                      onBlur={(e) => setTitle(e.target.textContent)}
                      onInput={(e) => setTitle(e.target.textContent)}
                      dangerouslySetInnerHTML={{ __html: title }}
                    />
                    
                    <button 
                      className={`p-2 rounded-lg ${themeColors.textSecondary} hover:${themeColors.surface} transition-colors disabled:opacity-50`}
                      onClick={() => navigateChecklists('next')}
                      disabled={!currentChecklistId}
                      aria-label="Next checklist"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
                        ${canEdit && !locked ? 'hover:' + themeColors.surface + ' focus:' + themeColors.surface + ' focus:outline-none' : ''}
                        mcl-drawer-title
                      `}
                      onBlur={(e) => setTitle(e.target.textContent)}
                      onInput={(e) => setTitle(e.target.textContent)}
                      dangerouslySetInnerHTML={{ __html: title }}
                    />
                    <button 
                      className={`p-2 rounded-lg ${themeColors.textSecondary} hover:${themeColors.surface} transition-colors`}
                      aria-label="Close checklist"
                      onClick={closeDrawer}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Congratulations overlay */}
              {showCongrats && (
                <div className="congrats-overlay fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                  <div className="bg-blue-900 text-yellow-400 px-8 py-6 rounded-xl text-3xl font-bold shadow-2xl transform animate-bounce">
                    Great job! 🎉
                  </div>
                </div>
              )}

              {/* Progress counter - only show when enabled and has items */}
              {items.length > 0 && window.mcl_checklists?.settings?.enable_progress_counter && (
                <div className={`${themeColors.surface} rounded-lg p-3 flex-shrink-0`}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className={themeColors.textSecondary}>{progressStats.total} items</span>
                    <span className={themeColors.textSecondary}>{progressStats.completed} completed</span>
                    <span className={`${progressStats.percentage === 100 ? 'text-yellow-600 font-semibold' : themeColors.textSecondary}`}>
                      {progressStats.percentage}% complete
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full"
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
                    <span className={themeColors.textSecondary}>Loading checklist...</span>
                  </div>
                </div>
              )}

              {/* Description handling - prioritize public description */}
              {checklistData?.is_public && checklistData?.public_description && (
                <div className="flex-shrink-0">
                  <div className={`${themeColors.textSecondary} text-sm leading-relaxed max-h-16 overflow-y-auto`}>
                    {checklistData.public_description}
                  </div>
                </div>
              )}
              
              {/* Show regular description only if no public description */}
              {(!checklistData?.is_public || !checklistData?.public_description) && 
               checklistData?.show_description === "1" && checklistData?.description && (
                <div className="flex-shrink-0">
                  <div className={`${themeColors.textSecondary} text-sm leading-relaxed max-h-16 overflow-y-auto`}>
                    {checklistData.description}
                  </div>
                </div>
              )}

              {/* Items wrapper */}
              <div className="flex-1 min-h-12 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {dragEnabled ? (
                  <DragDropContext onDragEnd={handleDragEnd} portalContainer={document.body}>
                    <Droppable droppableId="mcl-items-droppable" isCombineEnabled>
                      {(provided, snapshot) => (
                        <ul
                          id="mcl-items"
                          className={`
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
                            
                            // Determine deadline status classes
                            let deadlineClasses = ''
                            if (deadline) {
                              const now = Date.now()
                              const deadlineTime = new Date(deadline).getTime()
                              const timeLeft = deadlineTime - now
                              
                              if (timeLeft < 0) {
                                deadlineClasses = 'bg-red-500 text-white' // Passed deadline
                              } else if (timeLeft < 7200000) { // 2 hours
                                deadlineClasses = 'bg-red-500 text-white' // Critical
                              } else if (timeLeft < 86400000) { // 24 hours
                                deadlineClasses = 'bg-yellow-400 text-gray-900' // Warning
                              }
                            }

                            return (
                              <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(providedDraggable, snapshotDraggable) => (
                                  <li
                                    ref={providedDraggable.innerRef}
                                    {...providedDraggable.draggableProps}
                                    className={`
                                      flex items-center gap-2 p-2 rounded-lg relative
                                      ${themeColors.surface} ${themeColors.itemHover}
                                      ${snapshotDraggable.isDragging ? 'shadow-lg scale-105 rotate-1' : 'shadow-sm'}
                                      ${snapshotDraggable.combineWith ? 'ring-2 ring-blue-400 bg-blue-50' : ''}
                                      ${isChild ? 'ml-8 relative before:absolute before:-left-6 before:top-1/2 before:w-4 before:h-0.5 before:bg-gray-300 before:content-[""]' : ''}
                                      ${isInProgress ? 'bg-emerald-100 border-l-4 border-emerald-500' : ''}
                                      ${deadlineClasses}
                                      ${isChecked ? 'opacity-70' : ''}
                                      group relative
                                    `}
                                    data-item-id={item.id}
                                    data-parent-id={item.parent_id || ""}
                                    onClick={(e) => handleItemClick(e, item.id)}
                                  >
                                    {/* Drag handle - only show if can edit and not locked, hidden by default, shown on hover */}
                                    {canEdit && !locked && !isLocked && (
                                      <div 
                                        {...providedDraggable.dragHandleProps}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100"
                                        onMouseEnter={(e) => showTooltip(e.target, 'Drag to reorder')}
                                        onMouseLeave={hideTooltip}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                      </div>
                                    )}

                                    {/* Checkbox - show if can check or edit */}
                                    {(canCheck || canEdit) && (
                                      <input
                                        type="checkbox"
                                        className={`flex-shrink-0 w-5 h-5 rounded border-2 ${themeColors.checkbox} transition-colors duration-200 ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                        checked={isChecked}
                                        onChange={(e) => {
                                          e.stopPropagation()
                                          handleCheckboxChange(item.id, e.target.checked)
                                        }}
                                        disabled={locked}
                                      />
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
                                          ${canEdit && !locked && !isLocked ? 'cursor-text hover:bg-gray-50 focus:border-yellow-400 focus:bg-white focus:outline-none' : 'cursor-default'}
                                          ${isChecked ? 'line-through opacity-70' : ''}
                                          break-words mcl-item-content
                                        `}
                                        contentEditable={canEdit && !locked && !isLocked}
                                        suppressContentEditableWarning={true}
                                        onBlur={(e) => handleContentBlur(e, item.id)}
                                        onKeyDown={(e) => handleContentKeyDown(e, item.id)}
                                        onPaste={(e) => contentEditing.handlePaste(e)}
                                        onMouseUp={handleTextSelection}
                                        dangerouslySetInnerHTML={{ __html: item.content }}
                                      />
                                      
                                      {/* Action buttons - absolutely positioned on top of content */}
                                      {canEdit && !locked && !isLocked && (
                                        <div className="absolute top-[50%] translate-y-[-50%] right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 bg-white rounded-md shadow-sm border p-1 z-10">
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
                                            onMouseEnter={(e) => showTooltip(e.target, isInProgress ? 'Remove from in progress' : 'Mark as in progress')}
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
                                            onMouseEnter={(e) => showTooltip(e.target, 'Set deadline')}
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
                                            onMouseEnter={(e) => showTooltip(e.target, 'Add image')}
                                            onMouseLeave={hideTooltip}
                                          >
                                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                              <path fill="currentColor" d="M416 64H96a64.07 64.07 0 0 0-64 64v256a64.07 64.07 0 0 0 64 64h320a64.07 64.07 0 0 0 64-64V128a64.07 64.07 0 0 0-64-64Zm-80 64a48 48 0 1 1-48 48a48.05 48.05 0 0 1 48-48ZM96 416a32 32 0 0 1-32-32v-67.63l94.84-84.3a48.06 48.06 0 0 1 65.8 1.9l64.95 64.81L172.37 416Zm352-32a32 32 0 0 1-32 32H217.63l121.42-121.42a47.72 47.72 0 0 1 61.64-.16L448 333.84Z"/>
                                            </svg>
                                          </button>

                                          {/* Tour Button - conditionally rendered */}
                                          <TourButton itemId={item.id} checklistId={currentChecklistId} />

                                          {/* Remove Button */}
                                          <button
                                            type="button"
                                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-100 rounded transition-colors duration-200 font-bold text-lg"
                                            onClick={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                              removeItem(item.id)
                                            }}
                                            onMouseEnter={(e) => showTooltip(e.target, 'Remove item')}
                                            onMouseLeave={hideTooltip}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Deadline Display */}
                                    {deadline && (
                                      <div className="flex-shrink-0 text-xs bg-gray-200 px-2 py-1 rounded">
                                        <div className="flex items-center gap-1">
                                          <span>
                                            Due: {new Date(deadline * 1000).toLocaleDateString()}
                                          </span>
                                          {canEdit && !locked && !isLocked && (
                                            <button
                                              className="text-gray-600 hover:text-red-600 ml-1"
                                              onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleDeadlineClick(item.id)
                                              }}
                                            >
                                              ×
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
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
                ) : (
                  <ul
                    id="mcl-items"
                    className="space-y-2"
                  >
                    {items.map((item, index) => {
                      const isChecked = checkedItems.includes(item.id)
                      const isInProgress = inProgressItems.includes(item.id)
                      const isChild = item.parent_id && item.parent_id !== ''
                      const isLocked = item.locked || false
                      const deadline = itemDeadlines[item.id]
                      
                      // Determine deadline status classes
                      let deadlineClasses = ''
                      if (deadline) {
                        const now = Date.now()
                        const deadlineTime = new Date(deadline).getTime()
                        const timeLeft = deadlineTime - now
                        
                        if (timeLeft < 0) {
                          deadlineClasses = 'bg-red-500 text-white' // Passed deadline
                        } else if (timeLeft < 7200000) { // 2 hours
                          deadlineClasses = 'bg-red-500 text-white' // Critical
                        } else if (timeLeft < 86400000) { // 24 hours
                          deadlineClasses = 'bg-yellow-400 text-gray-900' // Warning
                        }
                      }

                      return (
                        <li
                          key={item.id}
                          className={`
                            flex items-center gap-2 p-2 rounded-lg relative shadow-sm
                            ${themeColors.surface} ${themeColors.itemHover}
                            ${isChild ? 'ml-8 relative before:absolute before:-left-6 before:top-1/2 before:w-4 before:h-0.5 before:bg-gray-300 before:content-[""]' : ''}
                            ${isInProgress ? 'bg-emerald-100 border-l-4 border-emerald-500' : ''}
                            ${deadlineClasses}
                            ${isChecked ? 'opacity-70' : ''}
                            group relative
                          `}
                          data-item-id={item.id}
                          data-parent-id={item.parent_id || ""}
                          onClick={(e) => handleItemClick(e, item.id)}
                        >
                          {/* Checkbox - show if can check or edit */}
                          {(canCheck || canEdit) && (
                            <input
                              type="checkbox"
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 ${themeColors.checkbox} transition-colors duration-200 ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              checked={isChecked}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleCheckboxChange(item.id, e.target.checked)
                              }}
                              disabled={locked}
                            />
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
                                ${canEdit && !locked && !isLocked ? 'cursor-text hover:bg-gray-50 focus:border-yellow-400 focus:bg-white focus:outline-none' : 'cursor-default'}
                                ${isChecked ? 'line-through opacity-70' : ''}
                                break-words mcl-item-content
                              `}
                              contentEditable={canEdit && !locked && !isLocked}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => handleContentBlur(e, item.id)}
                              onKeyDown={(e) => handleContentKeyDown(e, item.id)}
                              onPaste={(e) => contentEditing.handlePaste(e)}
                              onMouseUp={handleTextSelection}
                              dangerouslySetInnerHTML={{ __html: item.content }}
                            />
                            
                            {/* Action buttons - absolutely positioned on top of content */}
                            {canEdit && !locked && !isLocked && (
                              <div className="absolute top-[50%] translate-y-[-50%] right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 bg-white rounded-md shadow-sm border p-1 z-10">
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
                                  onMouseEnter={(e) => showTooltip(e.target, isInProgress ? 'Remove from in progress' : 'Mark as in progress')}
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
                                  onMouseEnter={(e) => showTooltip(e.target, 'Set deadline')}
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
                                  onMouseEnter={(e) => showTooltip(e.target, 'Add image')}
                                  onMouseLeave={hideTooltip}
                                >
                                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                    <path fill="currentColor" d="M416 64H96a64.07 64.07 0 0 0-64 64v256a64.07 64.07 0 0 0 64 64h320a64.07 64.07 0 0 0 64-64V128a64.07 64.07 0 0 0-64-64Zm-80 64a48 48 0 1 1-48 48a48.05 48.05 0 0 1 48-48ZM96 416a32 32 0 0 1-32-32v-67.63l94.84-84.3a48.06 48.06 0 0 1 65.8 1.9l64.95 64.81L172.37 416Zm352-32a32 32 0 0 1-32 32H217.63l121.42-121.42a47.72 47.72 0 0 1 61.64-.16L448 333.84Z"/>
                                  </svg>
                                </button>

                                {/* Tour Button - conditionally rendered */}
                                <TourButton itemId={item.id} checklistId={currentChecklistId} />

                                {/* Remove Button */}
                                <button
                                  type="button"
                                  className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-100 rounded transition-colors duration-200 font-bold text-lg"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    removeItem(item.id)
                                  }}
                                  onMouseEnter={(e) => showTooltip(e.target, 'Remove item')}
                                  onMouseLeave={hideTooltip}
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Deadline Display */}
                          {deadline && (
                            <div className="flex-shrink-0 text-xs bg-gray-200 px-2 py-1 rounded">
                              <div className="flex items-center gap-1">
                                <span>
                                  Due: {new Date(deadline * 1000).toLocaleDateString()}
                                </span>
                                {canEdit && !locked && !isLocked && (
                                  <button
                                    className="text-gray-600 hover:text-red-600 ml-1"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleDeadlineClick(item.id)
                                    }}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </li>
                      )
