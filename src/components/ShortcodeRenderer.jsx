import { useState, useEffect, useRef, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { formatDate } from '../utils/dateUtils'
import ShortcodeKanbanView from './ShortcodeKanbanView'

// Link Manager Hook
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
      link.style.color = '#2563eb'
      link.style.textDecoration = 'underline'
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

// Link Toolbar Component with inline styles
const LinkToolbar = ({
  isVisible,
  position,
  linkUrl,
  setLinkUrl,
  onCreateLink,
  onClose,
  isValidUrl
}) => {
  const i18n = (typeof window !== 'undefined' && (window.magicclShortcode?.i18n)) || {}

  if (!isVisible) return null

  const handleCreateLink = (url) => {
    if (url && url.trim() && isValidUrl(url.trim())) {
      onCreateLink(url.trim())
    }
  }

  return (
    <div
      data-link-toolbar="true"
      style={{
        position: 'fixed',
        top: position?.y || 0,
        left: position?.x || 0,
        transform: 'translateX(-50%)',
        zIndex: 100001,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        padding: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="text"
          placeholder={i18n.imageModal?.enterUrl || "Enter URL..."}
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
          style={{
            padding: '4px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
            width: '192px',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6'
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d1d5db'
            e.target.style.boxShadow = 'none'
          }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleCreateLink(linkUrl)
          }}
          disabled={!linkUrl || !linkUrl.trim() || !isValidUrl(linkUrl.trim())}
          style={{
            backgroundColor: (!linkUrl || !linkUrl.trim() || !isValidUrl(linkUrl.trim())) ? '#d1d5db' : '#3b82f6',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            border: 'none',
            cursor: (!linkUrl || !linkUrl.trim() || !isValidUrl(linkUrl.trim())) ? 'not-allowed' : 'pointer',
            opacity: (!linkUrl || !linkUrl.trim() || !isValidUrl(linkUrl.trim())) ? 0.5 : 1,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!e.target.disabled) e.target.style.backgroundColor = '#2563eb'
          }}
          onMouseLeave={(e) => {
            if (!e.target.disabled) e.target.style.backgroundColor = '#3b82f6'
          }}
        >
          ✓
        </button>
      </div>
    </div>
  )
}

// Base Modal Component with inline styles for frontend compatibility
const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null

  const sizeMap = {
    sm: '28rem',
    md: '28rem',
    lg: '42rem',
    xl: '56rem'
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: sizeMap[size],
          marginTop: '32px',
          marginBottom: '32px',
          maxHeight: 'calc(100vh - 4rem)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 10,
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.target.style.color = '#6b7280'}
            onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '16px',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 12rem)',
          flex: 1
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '16px',
            borderTop: '1px solid #e5e7eb',
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'white',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px'
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Deadline Modal Component
const DeadlineModal = ({ isOpen, onClose, onSave, itemId, currentDeadline }) => {
  const [dateTime, setDateTime] = useState('')
  const i18n = (typeof window !== 'undefined' && (window.magicclShortcode?.i18n)) || {}

  useEffect(() => {
    if (isOpen && currentDeadline) {
      // Convert UTC timestamp to local browser time for datetime-local input
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={i18n.shortcodeRenderer?.deadlineModal?.setDeadlineTitle || 'Set Item Deadline'}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <button
            type="button"
            onClick={() => {
              onSave(null) // Clear the deadline
              onClose()
            }}
            disabled={!currentDeadline}
            style={{
              padding: '8px 16px',
              backgroundColor: !currentDeadline ? '#fef2f2' : '#fef2f2',
              color: !currentDeadline ? '#d1d5db' : '#dc2626',
              border: '1px solid',
              borderColor: !currentDeadline ? '#e5e7eb' : '#fecaca',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: !currentDeadline ? 'not-allowed' : 'pointer',
              opacity: !currentDeadline ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (currentDeadline) {
                e.target.style.backgroundColor = '#fee2e2'
              }
            }}
            onMouseLeave={(e) => {
              if (currentDeadline) {
                e.target.style.backgroundColor = '#fef2f2'
              }
            }}
          >
            {i18n.shortcodeRenderer?.deadlineModal?.clearDeadline || 'Clear Deadline'}
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            >
              {i18n.buttons?.cancel || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              {i18n.shortcodeRenderer?.deadlineModal?.saveDeadline || 'Save Deadline'}
            </button>
          </div>
        </div>
      }
    >
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px'
        }}>
          {i18n.shortcodeRenderer?.deadlineModal?.deadlineDateTimeLabel || 'Deadline Date & Time'}
        </label>
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6'
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d1d5db'
            e.target.style.boxShadow = 'none'
          }}
        />
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '8px',
          margin: '8px 0 0 0'
        }}>
          {i18n.shortcodeRenderer?.deadlineModal?.leaveEmptyHint || 'Leave empty to remove deadline'}
        </p>
      </div>
    </Modal>
  )
}

const ShortcodeRenderer = ({
  checklistId,
  instanceId,
  settings = {},
  items = [],
  permissions = {},
  priorityEnabled = false,
  priorityDisplayType = 'color',
  checklist = {},
  reset_info = {}
}) => {
  const [i18n, setI18n] = useState({})
  const [checkedItems, setCheckedItems] = useState(new Set())
  const [shortcodeItems, setShortcodeItems] = useState([])
  const [countdownInterval, setCountdownInterval] = useState(null)
  const [inProgressItems, setInProgressItems] = useState(new Set())
  const [itemDeadlines, setItemDeadlines] = useState({})
  const [tooltip, setTooltip] = useState(null)
  const [tooltipTimer, setTooltipTimer] = useState(null)
  const [showDeadlineModal, setShowDeadlineModal] = useState(false)
  const [deadlineModalItem, setDeadlineModalItem] = useState(null)

  // Image management state
  const [showImageModal, setShowImageModal] = useState(null) // 'choice', 'upload', or null
  const [currentImageItemId, setCurrentImageItemId] = useState(null)
  const [existingImages, setExistingImages] = useState([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState(null)
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedExistingImage, setSelectedExistingImage] = useState(null)
  const [activeImageTab, setActiveImageTab] = useState('upload') // 'upload' or 'existing'

  const containerRef = useRef(null)
  const itemRefs = useRef({})

  // Link management state
  const linkManager = useLinkManager()
  const [selectionLinkButton, setSelectionLinkButton] = useState(null)
  const [currentTextSelection, setCurrentTextSelection] = useState(null)
  const [linkToolbarVisible, setLinkToolbarVisible] = useState(false)
  const [linkToolbarPosition, setLinkToolbarPosition] = useState({ x: 0, y: 0 })

  // Track hovered/focused item to show actions
  const [hoveredItemId, setHoveredItemId] = useState(null)

  // Initialize i18n
  useEffect(() => {
    if (window.magicclShortcode && window.magicclShortcode.i18n && window.magicclShortcode.i18n.shortcodeRenderer) {
      setI18n(window.magicclShortcode.i18n.shortcodeRenderer)
    }
  }, [])

  // Handle auto-reset - clear localStorage when reset happened
  useEffect(() => {
    if (reset_info?.enabled && reset_info?.was_reset) {
      // Clear localStorage for ALL shortcode instances AND the drawer (user might use both)
      try {
        // Drawer localStorage key
        const drawerKey = `magiccl_checked_${checklistId}`
        localStorage.removeItem(drawerKey)

        // Clear ALL shortcode localStorage keys for this checklist (any instance)
        const shortcodePrefix = `magiccl_shortcode_${checklistId}_`
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(shortcodePrefix)) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))

        console.log('MCL Shortcode: Cleared localStorage due to reset for checklist', checklistId, '(removed', keysToRemove.length, 'shortcode keys)')
      } catch (error) {
        console.warn('MCL Shortcode: Error clearing localStorage on reset:', error)
      }

      // Clear checked items state
      setCheckedItems(new Set())
      setInProgressItems(new Set())

      // Show reset notification
      const notification = document.createElement('div')
      notification.className = 'fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded shadow-lg z-50'
      notification.style.cssText = 'position: fixed; bottom: 1rem; right: 1rem; background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 0.75rem 1rem; border-radius: 0.375rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); z-index: 9999;'
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span>${i18n.checklistReset || 'This checklist has been automatically reset.'}</span>
          <button type="button" style="color: #b45309; font-weight: bold; background: none; border: none; cursor: pointer; font-size: 1.25rem; line-height: 1;">×</button>
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
  }, [reset_info, checklistId, instanceId, i18n])

  // Initialize state
  useEffect(() => {
    initializeItems()
    // Only load checked state if not just reset
    if (!(reset_info?.enabled && reset_info?.was_reset)) {
      loadCheckedState()
    }
    initCountdown()

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
      if (tooltipTimer) {
        clearTimeout(tooltipTimer)
      }
    }
  }, [items])

  // Listen for checked state changes from other views (kanban, etc.)
  useEffect(() => {
    const handleChecklistDataChanged = (event) => {
      const { checklistId: eventChecklistId, source, action } = event.detail || {}
      const stateHandling = settings.check_state || 'session'

      // Only refresh if this is the same checklist and change came from another source
      if (eventChecklistId && String(eventChecklistId) === String(checklistId) && source !== 'shortcode_list') {
        // Reload checked state from server for global and per_user modes
        // Session/local modes use localStorage which is local-only
        if (stateHandling === 'global' || stateHandling === 'per_user') {
          refreshCheckedStateFromServer()
          refreshInProgressStateFromServer()
        }
      }
    }

    window.addEventListener('magicclChecklistDataChanged', handleChecklistDataChanged)

    return () => {
      window.removeEventListener('magicclChecklistDataChanged', handleChecklistDataChanged)
    }
  }, [checklistId, settings.check_state])

  // Initialize items with proper structure
  const initializeItems = () => {
    const initializedItems = items.map(item => ({
      ...item,
      id: item.id || `item_${Date.now()}_${Math.random()}`,
      content: item.content || '',
      priority: item.priority || 'none',
      checked: false, // Will be set by loadCheckedState
      deadline: item.deadline || null,
      inProgress: item.inProgress || false,
      locked: item.locked || false,
      parent_id: item.parent_id || null
    }))
    setShortcodeItems(initializedItems)
    
    // Initialize in-progress and deadline state
    const inProgress = new Set()
    const deadlines = {}
    
    initializedItems.forEach(item => {
      if (item.inProgress) {
        inProgress.add(item.id)
      }
      if (item.deadline) {
        deadlines[item.id] = item.deadline
      }
    })
    
    setInProgressItems(inProgress)
    setItemDeadlines(deadlines)
  }

  // Load checked state based on storage type
  const loadCheckedState = () => {
    const stateHandling = settings.check_state || 'session'
    
    switch (stateHandling) {
      case 'session':
      case 'local':
        loadFromLocalStorage()
        break
      case 'global':
        // Global state is loaded from server-rendered data
        const initialChecked = items
          .filter(item => item.checked)
          .map(item => item.id)
        setCheckedItems(new Set(initialChecked))
        break
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(getStorageKey('checked'))
      if (stored) {
        setCheckedItems(new Set(JSON.parse(stored)))
      }
    } catch (error) {
      console.warn('Error loading from local storage:', error)
    }
  }

  const refreshCheckedStateFromServer = async () => {
    try {
      const ajaxUrl = window.magicclShortcode?.ajaxurl || '/wp-admin/admin-ajax.php'
      const nonce = window.magicclShortcode?.nonce || ''

      const formData = new FormData()
      formData.append('action', 'magiccl_get_checked_state')
      formData.append('nonce', nonce)
      formData.append('checklist_id', checklistId)
      formData.append('context', 'shortcode')

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })

      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setCheckedItems(new Set(data.data))
      }
    } catch (error) {
      console.warn('Error refreshing checked state from server:', error)
    }
  }

  const refreshInProgressStateFromServer = async () => {
    try {
      const ajaxUrl = window.magicclShortcode?.ajaxurl || '/wp-admin/admin-ajax.php'
      const nonce = window.magicclShortcode?.nonce || ''

      const formData = new FormData()
      formData.append('action', 'magiccl_get_in_progress_state')
      formData.append('nonce', nonce)
      formData.append('checklist_id', checklistId)
      formData.append('context', 'shortcode')

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })

      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setInProgressItems(new Set(data.data))
      }
    } catch (error) {
      console.warn('Error refreshing in-progress state from server:', error)
    }
  }

  const getStorageKey = (type = 'checked') => {
    return `magiccl_shortcode_${checklistId}_${instanceId}_${type}`
  }

  // Tooltip management
  const showTooltip = (element, text) => {
    if (tooltipTimer) {
      clearTimeout(tooltipTimer)
    }

    const timer = setTimeout(() => {
      const rect = element.getBoundingClientRect()
      setTooltip({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })
      setTooltipTimer(null)
    }, 500)

    setTooltipTimer(timer)
  }

  const hideTooltip = () => {
    if (tooltipTimer) {
      clearTimeout(tooltipTimer)
      setTooltipTimer(null)
    }
    setTooltip(null)
  }

  // Handle checkbox changes
  const handleCheckboxChange = useCallback(async (itemId, isChecked) => {
    const newCheckedItems = new Set(checkedItems)
    
    if (isChecked) {
      newCheckedItems.add(itemId)
    } else {
      newCheckedItems.delete(itemId)
    }
    
    setCheckedItems(newCheckedItems)
    await saveCheckedState(newCheckedItems)
  }, [checkedItems])

  // Handle content editing
  const handleContentBlur = useCallback((e, itemId) => {
    if (!permissions.can_edit) return

    const newContent = e.target.innerHTML
    const newItems = shortcodeItems.map(item =>
      item.id === itemId ? { ...item, content: newContent } : item
    )
    setShortcodeItems(newItems)
    saveItemsToServer(newItems)
  }, [shortcodeItems, permissions.can_edit])

  const handlePaste = useCallback((e, itemId) => {
    if (!permissions.can_edit) return

    // Get pasted text
    const pastedText = e.clipboardData.getData('text/plain')

    // Check if it's a URL
    const urlRegex = /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)([\w\-\.,@?^=%&:/~\+#]*[\w\-@?^=%&/~\+#])?$/i

    if (urlRegex.test(pastedText.trim())) {
      e.preventDefault()

      // Normalize URL
      let url = pastedText.trim()
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url
      }

      // Create link element
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.style.color = '#2563eb'
      link.style.textDecoration = 'underline'
      link.textContent = pastedText.trim()

      // Insert the link at cursor position
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(link)

        // Move cursor after the link
        range.setStartAfter(link)
        range.setEndAfter(link)
        selection.removeAllRanges()
        selection.addRange(range)

        // Update the item content
        const contentElement = e.target
        if (contentElement) {
          const newContent = contentElement.innerHTML
          const newItems = shortcodeItems.map(item =>
            item.id === itemId ? { ...item, content: newContent } : item
          )
          setShortcodeItems(newItems)
          saveItemsToServer(newItems)
        }
      }
    }
  }, [permissions.can_edit, shortcodeItems])

  const handleContentKeyDown = useCallback((e, itemId) => {
    if (!permissions.can_edit) return

    // Handle Enter key to add new item
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()

      const currentIndex = shortcodeItems.findIndex(item => item.id === itemId)
      const newItem = {
        id: `item_${Date.now()}_${Math.random()}`,
        content: '',
        priority: 'none',
        checked: false,
        deadline: null,
        inProgress: false,
        locked: false,
        parent_id: null
      }

      const newItems = [...shortcodeItems]
      newItems.splice(currentIndex + 1, 0, newItem)
      setShortcodeItems(newItems)
      saveItemsToServer(newItems)

      // Focus the new item using refs
      setTimeout(() => {
        const newItemElement = itemRefs.current[newItem.id]
        if (newItemElement) {
          newItemElement.focus()
          // Place cursor at the start
          const selection = window.getSelection()
          const range = document.createRange()
          range.selectNodeContents(newItemElement)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }, 100)
    }
  }, [permissions.can_edit, shortcodeItems])

  // Add new item after current item
  const addNewItemAfter = (afterItemId) => {
    if (!permissions.can_edit) return

    const currentIndex = shortcodeItems.findIndex(item => item.id === afterItemId)
    const newItem = {
      id: `item_${Date.now()}_${Math.random()}`,
      content: '',
      priority: 'none',
      checked: false,
      deadline: null,
      inProgress: false,
      locked: false,
      parent_id: null
    }

    const newItems = [...shortcodeItems]
    newItems.splice(currentIndex + 1, 0, newItem)
    setShortcodeItems(newItems)
    saveItemsToServer(newItems)

    // Focus the new item using refs
    setTimeout(() => {
      const newItemElement = itemRefs.current[newItem.id]
      if (newItemElement) {
        newItemElement.focus()
        // Place cursor at the start
        const selection = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(newItemElement)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }, 100)
  }

  // Remove item
  const removeItem = (itemId) => {
    if (!permissions.can_edit || shortcodeItems.length <= 1) return
    
    const newItems = shortcodeItems.filter(item => item.id !== itemId)
    setShortcodeItems(newItems)
    saveItemsToServer(newItems)
    
    // Clean up state
    setInProgressItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(itemId)
      return newSet
    })
    
    setItemDeadlines(prev => {
      const newDeadlines = { ...prev }
      delete newDeadlines[itemId]
      return newDeadlines
    })
  }

  // Toggle in-progress state
  const toggleInProgress = async (itemId) => {
    if (!permissions.can_edit) return

    const newSet = new Set(inProgressItems)
    if (newSet.has(itemId)) {
      newSet.delete(itemId)
    } else {
      newSet.add(itemId)
    }

    setInProgressItems(newSet)

    // Update item
    const newItems = shortcodeItems.map(item =>
      item.id === itemId ? { ...item, inProgress: newSet.has(itemId) } : item
    )
    setShortcodeItems(newItems)
    await saveItemsToServer(newItems)

    // Dispatch event to notify other views that in-progress state changed
    window.dispatchEvent(new CustomEvent('magicclChecklistDataChanged', {
      detail: {
        checklistId: checklistId,
        action: 'in_progress_changed',
        source: 'shortcode_list'
      }
    }))
  }

  // Handle deadline click - open modal
  const handleDeadlineClick = (itemId) => {
    if (!permissions.can_edit) return

    const currentItem = shortcodeItems.find(item => item.id === itemId)
    setDeadlineModalItem(currentItem)
    setShowDeadlineModal(true)
  }

  // Handle deadline save from modal
  const handleDeadlineSave = (timestamp) => {
    if (!deadlineModalItem) return

    const itemId = deadlineModalItem.id

    if (timestamp === null) {
      // Remove deadline
      setItemDeadlines(prev => {
        const newDeadlines = { ...prev }
        delete newDeadlines[itemId]
        return newDeadlines
      })

      const newItems = shortcodeItems.map(item =>
        item.id === itemId ? { ...item, deadline: null } : item
      )
      setShortcodeItems(newItems)
      saveItemsToServer(newItems)
    } else {
      // Set new deadline
      setItemDeadlines(prev => ({
        ...prev,
        [itemId]: timestamp
      }))

      const newItems = shortcodeItems.map(item =>
        item.id === itemId ? { ...item, deadline: timestamp } : item
      )
      setShortcodeItems(newItems)
      saveItemsToServer(newItems)
    }
  }

  // Cycle priority
  const cyclePriority = (itemId) => {
    if (!permissions.can_edit || !priorityEnabled) return
    
    const priorities = ['none', 'low', 'medium', 'high', 'critical']
    const currentItem = shortcodeItems.find(item => item.id === itemId)
    const currentPriorityIndex = priorities.indexOf(currentItem?.priority || 'none')
    const nextPriority = priorities[(currentPriorityIndex + 1) % priorities.length]
    
    const newItems = shortcodeItems.map(item => 
      item.id === itemId ? { ...item, priority: nextPriority } : item
    )
    setShortcodeItems(newItems)
    saveItemsToServer(newItems)
  }

  // Image management functions
  const handleImageClick = (itemId) => {
    if (!permissions.can_edit) return

    setCurrentImageItemId(itemId)
    setImageError(null)

    // Show choice modal first
    setShowImageModal('choice')
  }

  const closeImageModal = () => {
    setShowImageModal(null)
    setCurrentImageItemId(null)
    setExistingImages([])
    setSelectedImageFile(null)
    setImagePreview(null)
    setSelectedExistingImage(null)
    setImageError(null)
    setActiveImageTab('upload')
  }

  const openMediaLibrary = () => {
    if (typeof wp === 'undefined' || !wp.media) {
      console.error('WordPress media library not available')
      return
    }

    const mediaFrame = wp.media({
      title: i18n.imageModal?.selectImage || 'Select Image',
      library: { type: 'image' },
      multiple: false,
      button: { text: i18n.imageModal?.insertImage || 'Insert Image' }
    })

    let imageSelected = false

    mediaFrame.on('select', () => {
      const attachment = mediaFrame.state().get('selection').first().toJSON()
      insertImageIntoItem(attachment)
      imageSelected = true
      closeImageModal()
    })

    mediaFrame.on('close', () => {
      // Clean up if user closes without selecting
      if (!imageSelected && currentImageItemId) {
        closeImageModal()
      }
    })

    mediaFrame.open()
  }

  const loadExistingImages = async () => {
    if (!checklistId) return
    setLoadingImages(true)
    try {
      const ajaxUrl = window.magicclShortcode?.ajaxurl || '/wp-admin/admin-ajax.php'
      const nonce = window.magicclShortcode?.nonce || ''

      const formData = new FormData()
      formData.append('action', 'magiccl_get_uploaded_images')
      formData.append('checklist_id', checklistId)
      if (nonce) {
        formData.append('nonce', nonce)
      }

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setExistingImages(result.data)
      } else {
        console.error('Failed to load existing images:', result.data?.message)
        setExistingImages([])
      }
    } catch (error) {
      console.error('Error loading existing images:', error)
      setExistingImages([])
    } finally {
      setLoadingImages(false)
    }
  }

  const uploadImage = async (file) => {
    setUploadingImage(true)
    setImageError(null)

    try {
      const ajaxUrl = window.magicclShortcode?.ajaxurl || '/wp-admin/admin-ajax.php'
      const nonce = window.magicclShortcode?.nonce || ''

      const formData = new FormData()
      formData.append('action', 'magiccl_upload_image')
      formData.append('file', file)
      formData.append('checklist_id', checklistId || 0)
      if (nonce) {
        formData.append('nonce', nonce)
      }

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        insertImageIntoItem(result.data)
        closeImageModal()
      } else {
        setImageError(result.data?.message || i18n.errors?.uploadFailed || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setImageError(i18n.errors?.uploadFailed || 'Upload failed. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const insertImageIntoItem = (imageData) => {
    if (!currentImageItemId) return

    const currentItem = shortcodeItems.find(item => item.id === currentImageItemId)
    const imageHtml = `<br><img src="${imageData.url}" alt="${imageData.alt || 'Uploaded image'}" style="max-width: 200px; height: auto; margin: 8px 0;" />`
    const newContent = (currentItem?.content || '') + imageHtml

    const newItems = shortcodeItems.map(item =>
      item.id === currentImageItemId ? { ...item, content: newContent } : item
    )
    setShortcodeItems(newItems)
    saveItemsToServer(newItems)
  }

  const handleFileSelect = (selectedFile) => {
    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']

    if (!allowedTypes.includes(selectedFile.type)) {
      setImageError(i18n.errors?.invalidFileType || 'Invalid file type. Please upload a JPG, PNG, or GIF image.')
      return
    }

    if (selectedFile.size > maxSize) {
      setImageError(i18n.errors?.fileTooLarge || 'File is too large. Maximum size is 10MB.')
      return
    }

    setSelectedImageFile(selectedFile)
    setImageError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(selectedFile)
  }

  // Link management functions
  const handleTextSelection = useCallback((e) => {
    if (!permissions.can_edit) return

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
            y: rect.top - 35, // Don't add scrollY - rect.top is already viewport relative for fixed positioning
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
  }, [permissions.can_edit])

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
          const contentElement = itemElement.querySelector('[contenteditable="true"]')
          if (contentElement && itemId) {
            // Update local state immediately
            const newContent = contentElement.innerHTML
            const newItems = shortcodeItems.map(item =>
              item.id === itemId ? { ...item, content: newContent } : item
            )
            setShortcodeItems(newItems)
            saveItemsToServer(newItems)
          }
        }
      }
    } catch (error) {
      console.error('Error removing link:', error)
    }
  }, [currentTextSelection, shortcodeItems])

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
        setLinkToolbarVisible(true)

        // Hide the selection button since we're showing the toolbar
        setSelectionLinkButton(null)
      }
    }
  }, [linkManager, currentTextSelection, selectionLinkButton, removeLinkFromSelection])

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
      link.style.color = '#2563eb'
      link.style.textDecoration = 'underline'
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
        const contentElement = itemElement.querySelector('[contenteditable="true"]')
        if (contentElement && itemId) {
          // Update local state immediately
          const newContent = contentElement.innerHTML
          const newItems = shortcodeItems.map(item =>
            item.id === itemId ? { ...item, content: newContent } : item
          )
          setShortcodeItems(newItems)
          saveItemsToServer(newItems)
        }
      }
    } catch (error) {
      console.error('Error creating link:', error)
    }
  }, [currentTextSelection, linkManager, shortcodeItems])

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
      // Check if clicking on link toolbar elements
      if (e.target.closest('[data-link-toolbar="true"]')) {
        return
      }

      // If link toolbar is visible and clicking outside, close it
      if (linkToolbarVisible) {
        linkManager.hideLinkToolbar()
        setLinkToolbarVisible(false)
        setCurrentTextSelection(null)
        return
      }

      // Small delay to allow selection to complete first
      setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed || selection.toString().trim().length === 0) {
          setSelectionLinkButton(null)
          setCurrentTextSelection(null)
        }
      }, 50)
    }

    const handleKeyDown = (e) => {
      // Close link toolbar on Tab or Escape
      if (linkToolbarVisible && (e.key === 'Tab' || e.key === 'Escape')) {
        linkManager.hideLinkToolbar()
        setLinkToolbarVisible(false)
        setCurrentTextSelection(null)
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mousedown', handleClickAnywhere)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mousedown', handleClickAnywhere)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [linkToolbarVisible, linkManager])

  const saveCheckedState = async (checkedSet) => {
    const checkedArray = Array.from(checkedSet)
    const stateHandling = settings.check_state || 'session'

    switch (stateHandling) {
      case 'session':
      case 'local':
        try {
          localStorage.setItem(
            getStorageKey('checked'),
            JSON.stringify(checkedArray)
          )
        } catch (error) {
          console.warn('Error saving to local storage:', error)
        }
        break

      case 'global':
        await saveToServer(checkedArray)
        break
    }
  }

  const saveToServer = async (checkedItems) => {
    try {
      const ajaxUrl = window.magicclShortcode?.ajaxurl || '/wp-admin/admin-ajax.php'
      const nonce = window.magicclShortcode?.nonce || ''

      const formData = new FormData()
      formData.append('action', 'magiccl_save_checked_state')
      formData.append('nonce', nonce)
      formData.append('checklist_id', checklistId)
      formData.append('context', 'shortcode')
      formData.append('item_order', JSON.stringify(shortcodeItems.map(item => item.id)))
      checkedItems.forEach(id => formData.append('checked_items[]', id))

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })

      const data = await response.json()
      if (!data.success) {
        console.warn('Error saving state to server:', data)
      } else {
        // Dispatch event to notify other views (kanban, etc.)
        window.dispatchEvent(new CustomEvent('magicclChecklistDataChanged', {
          detail: {
            checklistId: checklistId,
            action: 'checked_state_changed',
            source: 'shortcode_list'
          }
        }))
      }
    } catch (error) {
      console.error('Failed to save state:', error)
    }
  }

  const saveItemsToServer = async (items) => {
    if (!permissions.can_edit) return
    
    try {
      const ajaxUrl = window.magicclShortcode?.ajaxurl || '/wp-admin/admin-ajax.php'
      const nonce = window.magicclShortcode?.nonce || ''

      const formData = new FormData()
      formData.append('action', 'magiccl_update_checklist')
      formData.append('checklist_id', checklistId)
      formData.append('items', JSON.stringify(items))
      formData.append('nonce', nonce)
      formData.append('context', 'shortcode')

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })

      const result = await response.json()
      if (!result.success) {
        console.warn('Error saving items to server:', result)
      }
    } catch (error) {
      console.error('Failed to save items:', error)
    }
  }

  // Handle drag and drop reordering
  const handleDragEnd = useCallback((result) => {
    const { source, destination } = result

    // If no destination, item was dropped outside
    if (!destination) {
      return
    }

    // If dropped in same position, no change needed
    if (source.index === destination.index) {
      return
    }

    const newItems = Array.from(shortcodeItems)
    const [reorderedItem] = newItems.splice(source.index, 1)
    newItems.splice(destination.index, 0, reorderedItem)

    setShortcodeItems(newItems)
    
    // Save to server if editing is allowed
    if (permissions.can_edit) {
      saveItemsToServer(newItems)
    } else {
      // Save order to localStorage for reordering without edit permissions
      try {
        localStorage.setItem(
          getStorageKey('order'),
          JSON.stringify(newItems.map(item => item.id))
        )
      } catch (error) {
        console.warn('Error saving order to local storage:', error)
      }
    }
  }, [shortcodeItems, permissions.can_edit])

  const initCountdown = () => {
    const deadline = checklist.deadline
    if (!deadline) return

    const deadlineTime = parseInt(deadline) * 1000

    const updateCountdown = () => {
      const countdownElement = containerRef.current?.querySelector('.magiccl-countdown')
      if (!countdownElement) return

      const now = Date.now()
      const remaining = deadlineTime - now

      if (remaining <= 0) {
        countdownElement.textContent = i18n.countdown?.expired || 'Expired'
        countdownElement.classList.add('magiccl-expired')
        if (countdownInterval) {
          clearInterval(countdownInterval)
          setCountdownInterval(null)
        }
        return
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

      let text = ''
      if (days > 0) text += `${days}d `
      if (hours > 0 || days > 0) text += `${hours}h `
      text += `${minutes}m`

      countdownElement.textContent = text

      countdownElement.classList.remove('magiccl-warning', 'magiccl-urgent')
      if (remaining <= 2 * 60 * 60 * 1000) {
        countdownElement.classList.add('magiccl-urgent')
      } else if (remaining <= 24 * 60 * 60 * 1000) {
        countdownElement.classList.add('magiccl-warning')
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)
    setCountdownInterval(interval)
  }

  // Priority helper functions
  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 'critical': return '#7c3aed'  // purple-600
      case 'high': return '#ef4444'     // red-500
      case 'medium': return '#f59e0b'   // amber-500
      case 'low': return '#22c55e'      // green-500
      default: return '#94a3b8'         // slate-400
    }
  }, [])

  const getPriorityNumber = useCallback((priority) => {
    switch (priority) {
      case 'critical': return '4'
      case 'high': return '3'
      case 'medium': return '2'
      case 'low': return '1'
      default: return ''
    }
  }, [])

  const renderPriorityIndicator = (priority, clickable = false, onClick = null) => {
    // Don't render anything if priority is disabled or priority is none/empty
    if (!priorityEnabled || !priority || priority === 'none' || priority === '') {
      return null
    }

    if (priorityDisplayType === 'number') {
      const number = getPriorityNumber(priority)
      if (!number) {
        return null
      }

      return (
        <span
          className={`magiccl-priority-indicator magiccl-priority-number ${clickable ? 'cursor-pointer' : ''}`}
          style={{
            backgroundColor: getPriorityColor(priority),
            color: '#ffffff',
            fontSize: '10px',
            lineHeight: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '0 4px',
            minWidth: '14px',
            height: '14px',
            borderRadius: '3px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '8px'
          }}
          onClick={clickable ? onClick : undefined}
        >
          {number}
        </span>
      )
    } else {
      return (
        <span
          className={`magiccl-priority-indicator ${clickable ? 'cursor-pointer' : ''}`}
          style={{
            backgroundColor: getPriorityColor(priority),
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            display: 'inline-block',
            marginRight: '8px'
          }}
          onClick={clickable ? onClick : undefined}
        />
      )
    }
  }

  // Format deadline for display
  const formatDeadline = (deadline) => {
    if (!deadline) return ''
    return formatDate(deadline * 1000, 'date')
  }

  // If display mode is kanban, render the kanban view instead
  if (settings.display_mode === 'kanban') {
    return (
      <ShortcodeKanbanView
        checklistId={checklistId}
        items={shortcodeItems}
        permissions={permissions}
        settings={settings}
        checklist={checklist}
      />
    )
  }

  // Build CSS variables for styling
  const cssVariables = {
    '--magiccl-shortcode-custom-width': `${settings.custom_width || 800}px`,
    '--magiccl-shortcode-title-text-color': settings.title_text_color || '#000000',
    '--magiccl-shortcode-description-text-color': settings.description_text_color || '#333333',
    '--magiccl-shortcode-deadline-text-color': settings.deadline_text_color || '#ff0000',
    '--magiccl-shortcode-list-item-text-color': settings.list_item_text_color || '#1a1a1a',
    '--magiccl-shortcode-border-color': settings.border_color || '#e2e8f0',
    '--magiccl-shortcode-checkbox-border-color': settings.checkbox_border_color || '#cccccc',
    '--magiccl-shortcode-checkbox-color-filled': settings.checkbox_color_filled || '#0ea5e9',
    '--magiccl-shortcode-checkbox-color-unfilled': settings.checkbox_color_unfilled || '#ffffff',
    '--magiccl-shortcode-checkmark-color': settings.checkmark_color || '#ffffff',
    '--magiccl-shortcode-bg': settings.bg_color || '#ffffff',
    '--magiccl-shortcode-title-font-size': `${settings.title_font_size || 18}px`,
    '--magiccl-shortcode-description-font-size': `${settings.description_font_size || 14}px`,
    '--magiccl-shortcode-list-item-font-size': `${settings.list_item_font_size || 16}px`,
    '--magiccl-shortcode-deadline-font-size': `${settings.deadline_font_size || 14}px`,
    '--magiccl-shortcode-padding-block': `${settings.padding_block || 32}px`,
    '--magiccl-shortcode-padding-inline': `${settings.padding_inline || 32}px`,
    '--magiccl-shortcode-container-gap': `${settings.container_gap || 10}px`,
    '--magiccl-shortcode-padding-block-mobile': `${Math.min(parseInt(settings.padding_block || 32), 24)}px`,
    '--magiccl-shortcode-padding-inline-mobile': `${Math.min(parseInt(settings.padding_inline || 32), 24)}px`,
    '--magiccl-shortcode-checkbox-dimensions': `${settings.checkbox_dimensions || 20}px`,
    '--magiccl-shortcode-checkbox-border-radius': `${settings.checkbox_border_radius || 4}px`,
    '--magiccl-shortcode-checkbox-border-thickness': `${settings.checkbox_border_thickness || 2}px`,
    '--magiccl-shortcode-border-radius': `${settings.border_radius || 6}px`,
    '--magiccl-shortcode-border-thickness': `${settings.border_thickness || 1}px`
  }

  // Build container classes
  const containerClasses = [
    'magiccl-shortcode-container',
    `magiccl-spacing-${settings.item_spacing || 'comfortable'}`,
    `magiccl-border-${settings.border_type || 'none'}`
  ]

  if (settings.width === 'custom') {
    containerClasses.push('magiccl-width-custom')
  } else if (settings.width === 'narrow') {
    containerClasses.push('magiccl-width-narrow')
  }

  return (
    <div
      ref={containerRef}
      className={containerClasses.join(' ')}
      style={cssVariables}
      data-checklist-id={checklistId}
      data-instance-id={instanceId}
      data-check-state={settings.check_state || 'session'}
      data-can-edit={permissions.can_edit ? '1' : '0'}
      data-can-interact={permissions.can_interact ? '1' : '0'}
      data-priority-enabled={priorityEnabled ? '1' : '0'}
      data-priority-display-type={priorityDisplayType}
      data-show-numbers={settings.show_numbers ? 'true' : 'false'}
      data-enable-reorder={settings.enable_reorder && permissions.can_interact ? 'true' : 'false'}
    >
      {/* Tooltip */}
      {tooltip && (
        <div 
          style={{
            position: 'fixed',
            top: `${tooltip.y - 15}px`,
            left: `${tooltip.x}px`,
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: '#374151',
            color: 'white',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {tooltip.text}
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #374151'
            }}
          />
        </div>
      )}

      {!!settings.show_title && (
        <h3 className="magiccl-shortcode-title">
          {checklist.title}
        </h3>
      )}

      {!!settings.show_description && !!checklist.content && (
        <div
          className="magiccl-shortcode-description"
          dangerouslySetInnerHTML={{ __html: checklist.content }}
        />
      )}

      {!!settings.show_deadline && !!checklist.deadline && (
        <div className="magiccl-shortcode-deadline magiccl-countdown" data-deadline={checklist.deadline}>
          {formatDate(parseInt(checklist.deadline) * 1000, 'date')}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="shortcode-items" isDropDisabled={!settings.enable_reorder || !permissions.can_interact}>
          {(provided, snapshot) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`magiccl-shortcode-items ${snapshot.isDraggingOver ? 'magiccl-dragging-over' : ''}`}
            >
              {shortcodeItems.map((item, index) => {
                const isChecked = checkedItems.has(item.id)
                const isInProgress = inProgressItems.has(item.id)
                const deadline = itemDeadlines[item.id]
                
                return (
                  <Draggable 
                    key={item.id} 
                    draggableId={item.id} 
                    index={index}
                    isDragDisabled={!settings.enable_reorder || !permissions.can_interact}
                  >
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`magiccl-shortcode-item group ${isChecked ? 'magiccl-shortcode-checked' : ''} ${snapshot.isDragging ? 'magiccl-dragging' : ''} ${isInProgress ? 'magiccl-in-progress' : ''}`}
                        data-item-id={item.id}
                        onMouseEnter={() => setHoveredItemId(item.id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                        style={{
                          ...provided.draggableProps.style,
                          // Ensure dragging item follows mouse correctly
                          ...(snapshot.isDragging ? {
                            transform: provided.draggableProps.style?.transform,
                            zIndex: 1000
                          } : {})
                        }}
                      >
                        {/* Drag Handle - only show if reordering is enabled */}
                        {!!settings.enable_reorder && !!permissions.can_interact && (
                          <span
                            {...provided.dragHandleProps}
                            className="magiccl-item-drag-handle"
                            style={{
                              display: 'inline-block',
                              cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                              padding: '4px',
                              marginRight: '8px',
                              opacity: '0.6',
                              transition: 'opacity 0.2s ease',
                              userSelect: 'none'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '1'}
                            onMouseLeave={(e) => e.target.style.opacity = '0.6'}
                          >
                            ☰
                          </span>
                        )}
                        
                        <div className="magiccl-item-main" style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                          {/* Checkbox - standalone, not in label */}
                          <div style={{
                            position: 'relative',
                            flexShrink: 0,
                            width: 'var(--magiccl-shortcode-checkbox-dimensions)',
                            height: 'var(--magiccl-shortcode-checkbox-dimensions)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <input
                              type="checkbox"
                              className="magiccl-item-checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                e.stopPropagation() // Prevent event bubbling
                                handleCheckboxChange(item.id, e.target.checked)
                              }}
                              disabled={!permissions.can_interact}
                              style={{
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                width: 'var(--magiccl-shortcode-checkbox-dimensions)',
                                height: 'var(--magiccl-shortcode-checkbox-dimensions)',
                                minWidth: 'var(--magiccl-shortcode-checkbox-dimensions)',
                                minHeight: 'var(--magiccl-shortcode-checkbox-dimensions)',
                                maxWidth: 'var(--magiccl-shortcode-checkbox-dimensions)',
                                maxHeight: 'var(--magiccl-shortcode-checkbox-dimensions)',
                                border: 'var(--magiccl-shortcode-checkbox-border-thickness) solid var(--magiccl-shortcode-checkbox-border-color)',
                                borderRadius: 'var(--magiccl-shortcode-checkbox-border-radius)',
                                backgroundColor: isChecked ? 'var(--magiccl-shortcode-checkbox-color-filled)' : 'var(--magiccl-shortcode-checkbox-color-unfilled)',
                                position: 'relative',
                                cursor: permissions.can_interact ? 'pointer' : 'not-allowed',
                                margin: '0',
                                padding: '0',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s ease',
                                flexShrink: 0
                              }}
                            />

                            {/* Custom checkmark - SVG with proper centering */}
                            {isChecked && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  pointerEvents: 'none',
                                  width: '100%',
                                  height: '100%'
                                }}
                              >
                                <svg
                                  width="60%"
                                  height="60%"
                                  viewBox="0 0 20 20"
                                  fill="var(--magiccl-shortcode-checkmark-color)"
                                  style={{ flexShrink: 0, display: 'block' }}
                                >
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Item number */}
                          {settings.show_numbers === true && (
                            <span className="magiccl-item-number" style={{ flexShrink: 0, opacity: '0.7' }}>
                              {index + 1}.
                            </span>
                          )}

                          {/* Priority indicator */}
                          <div style={{ flexShrink: 0 }}>
                            {renderPriorityIndicator(item.priority, permissions.can_edit, () => cyclePriority(item.id))}
                          </div>

                          {/* Content area - completely separate from checkbox */}
                          <div className="magiccl-content-container" style={{ flex: '1', minWidth: '0' }}>
                            <div
                              ref={(el) => {
                                if (el) {
                                  itemRefs.current[item.id] = el
                                }
                              }}
                              className="magiccl-shortcode-item-content"
                              data-item-id={item.id}
                              contentEditable={permissions.can_edit && !item.locked}
                              suppressContentEditableWarning={true}
                              onFocus={() => setHoveredItemId(item.id)}
                              onBlur={(e) => {
                                handleContentBlur(e, item.id)
                                // Don't clear hover if we're clicking on action buttons
                                setTimeout(() => {
                                  if (!e.relatedTarget?.closest('.magiccl-item-actions')) {
                                    setHoveredItemId(null)
                                  }
                                }, 100)
                              }}
                              onKeyDown={(e) => handleContentKeyDown(e, item.id)}
                              onPaste={(e) => handlePaste(e, item.id)}
                              onMouseUp={handleTextSelection}
                              onKeyUp={handleTextSelection}
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
                              style={{
                                width: '100%',
                                color: 'var(--magiccl-shortcode-list-item-text-color)',
                                fontSize: 'var(--magiccl-shortcode-list-item-font-size)',
                                lineHeight: '1.5',
                                transition: 'opacity 0.2s ease',
                                opacity: isChecked ? '0.8' : '1',
                                textDecoration: isChecked ? 'line-through' : 'none',
                                cursor: permissions.can_edit && !item.locked ? 'text' : 'default',
                                padding: '4px',
                                borderRadius: '4px',
                                outline: 'none',
                                border: permissions.can_edit && !item.locked ? '1px solid transparent' : 'none'
                              }}
                            />

                            {/* Deadline Badge */}
                            {!!deadline && (
                              <div
                                className="magiccl-deadline-badge"
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  backgroundColor: '#fee2e2',
                                  color: '#991b1b',
                                  borderRadius: '12px',
                                  marginTop: '4px',
                                  cursor: permissions.can_edit ? 'pointer' : 'default',
                                  display: 'inline-block'
                                }}
                                onClick={permissions.can_edit ? () => handleDeadlineClick(item.id) : undefined}
                              >
                                {i18n.deadline?.dueLabel || 'Due'}: {formatDeadline(deadline)}
                              </div>
                            )}
                          </div>

                          {/* Action buttons - show on hover/focus when can edit */}
                          {!!permissions.can_edit && !item.locked && (
                            <div
                              className="magiccl-item-actions"
                              style={{
                                position: 'absolute',
                                top: '50%',
                                right: '8px',
                                transform: 'translateY(-50%)',
                                opacity: hoveredItemId === item.id ? 1 : 0,
                                pointerEvents: hoveredItemId === item.id ? 'auto' : 'none',
                                display: 'flex',
                                gap: '4px',
                                backgroundColor: 'white',
                                padding: '4px',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                transition: 'opacity 0.2s ease',
                                zIndex: 10
                              }}
                            >
                              {/* In Progress Button */}
                              <button
                                type="button"
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  color: isInProgress ? '#059669' : '#6b7280',
                                  backgroundColor: isInProgress ? '#ecfdf5' : 'transparent'
                                }}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  toggleInProgress(item.id)
                                }}
                                onFocus={() => setHoveredItemId(item.id)}
                                onBlur={() => setHoveredItemId(null)}
                                onMouseEnter={(e) => showTooltip(e.target, isInProgress ? (i18n.tooltips?.removeFromProgress || 'Remove from in progress') : (i18n.tooltips?.markAsProgress || 'Mark as in progress'))}
                                onMouseLeave={hideTooltip}
                              >
                                {isInProgress ? '⏸' : '▶️'}
                              </button>

                              {/* Deadline Button */}
                              <button
                                type="button"
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  color: '#6b7280',
                                  backgroundColor: 'transparent'
                                }}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleDeadlineClick(item.id)
                                }}
                                onFocus={() => setHoveredItemId(item.id)}
                                onBlur={() => setHoveredItemId(null)}
                                onMouseEnter={(e) => showTooltip(e.target, i18n.tooltips?.setDeadline || 'Set deadline')}
                                onMouseLeave={hideTooltip}
                              >
                                ⏰
                              </button>

                              {/* Image Button */}
                              <button
                                type="button"
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  color: '#6b7280',
                                  backgroundColor: 'transparent'
                                }}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleImageClick(item.id)
                                }}
                                onFocus={() => setHoveredItemId(item.id)}
                                onBlur={() => setHoveredItemId(null)}
                                onMouseEnter={(e) => showTooltip(e.target, i18n.tooltips?.addImage || 'Add image')}
                                onMouseLeave={hideTooltip}
                              >
                                🖼️
                              </button>

                              {/* Remove Button */}
                              {shortcodeItems.length > 1 && (
                                <button
                                  type="button"
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    color: '#ef4444',
                                    backgroundColor: 'transparent'
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    removeItem(item.id)
                                  }}
                                  onFocus={() => setHoveredItemId(item.id)}
                                  onBlur={() => setHoveredItemId(null)}
                                  onMouseEnter={(e) => showTooltip(e.target, i18n.tooltips?.removeItem || 'Remove item')}
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

      {/* Add item button and Uncheck All button */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {/* Add item button - only show when can edit */}
        {!!permissions.can_edit && (
          <button
            type="button"
            onClick={() => addNewItemAfter(shortcodeItems[shortcodeItems.length - 1]?.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--magiccl-shortcode-checkbox-color-filled)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--magiccl-shortcode-border-radius)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#0284c7'
              e.target.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--magiccl-shortcode-checkbox-color-filled)'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            {i18n.buttons?.addItem || 'Add Item'}
          </button>
        )}

        {/* Uncheck All button - only show when at least one item is checked */}
        {checkedItems.size > 0 && permissions.can_interact && (
          <button
            type="button"
            onClick={() => {
              setCheckedItems(new Set())
              saveCheckedState(new Set())
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 'var(--magiccl-shortcode-border-radius)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e5e7eb'
              e.target.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f3f4f6'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {i18n.buttons?.uncheckAll || 'Uncheck All'}
          </button>
        )}
      </div>

      {/* Deadline Modal */}
      {showDeadlineModal && (
        <DeadlineModal
          isOpen={showDeadlineModal}
          onClose={() => {
            setShowDeadlineModal(false)
            setDeadlineModalItem(null)
          }}
          onSave={handleDeadlineSave}
          itemId={deadlineModalItem?.id}
          currentDeadline={deadlineModalItem?.deadline}
        />
      )}

      {/* Image Choice Modal */}
      {showImageModal === 'choice' && (
        <Modal isOpen={true} onClose={closeImageModal} title={i18n.imageModal?.insertImage || 'Insert Image'}>
          <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px' }}>
            {i18n.imageModal?.chooseImageMethod || 'Choose how you would like to add an image:'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              onClick={() => {
                // Close the choice modal and open WP Media Library
                setShowImageModal(null)
                openMediaLibrary()
              }}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              {i18n.imageModal?.mediaLibrary || 'WordPress Media Library'}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveImageTab('upload')
                setShowImageModal('upload')
              }}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
            >
              {i18n.imageModal?.quickUpload || 'Quick Upload'}
            </button>
            <button
              type="button"
              onClick={closeImageModal}
              style={{
                backgroundColor: '#e5e7eb',
                color: '#374151',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d1d5db'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            >
              {i18n.buttons?.cancel || 'Cancel'}
            </button>
          </div>
        </Modal>
      )}

      {/* Image Upload Modal */}
      {showImageModal === 'upload' && (
        <Modal
          isOpen={true}
          onClose={closeImageModal}
          title={i18n.imageModal?.uploadOrSelectImage || 'Upload or Select Image'}
          size="xl"
          footer={
            <>
              <button
                type="button"
                onClick={closeImageModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              >
                {i18n.buttons?.cancel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedImageFile) {
                    uploadImage(selectedImageFile)
                  } else if (selectedExistingImage) {
                    insertImageIntoItem(selectedExistingImage)
                    closeImageModal()
                  }
                }}
                disabled={(!selectedImageFile && !selectedExistingImage) || uploadingImage}
                style={{
                  padding: '8px 16px',
                  backgroundColor: (!selectedImageFile && !selectedExistingImage) || uploadingImage ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!selectedImageFile && !selectedExistingImage) || uploadingImage ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) e.target.style.backgroundColor = '#2563eb'
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) e.target.style.backgroundColor = '#3b82f6'
                }}
              >
                {uploadingImage ? (i18n.imageModal?.uploading || 'Uploading...') : selectedImageFile ? (i18n.imageModal?.uploadImage || 'Upload Image') : (i18n.imageModal?.selectImage || 'Select Image')}
              </button>
            </>
          }
        >
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setActiveImageTab('upload')}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeImageTab === 'upload' ? '#3b82f6' : '#6b7280',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeImageTab === 'upload' ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#374151'}
                onMouseLeave={(e) => {
                  if (activeImageTab !== 'upload') e.target.style.color = '#6b7280'
                }}
              >
                {i18n.imageModal?.uploadNew || 'Upload New'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveImageTab('existing')
                  loadExistingImages()
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeImageTab === 'existing' ? '#3b82f6' : '#6b7280',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeImageTab === 'existing' ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#374151'}
                onMouseLeave={(e) => {
                  if (activeImageTab !== 'existing') e.target.style.color = '#6b7280'
                }}
              >
                {i18n.imageModal?.selectExisting || 'Select Existing'}
              </button>
            </div>

            {/* Upload Tab */}
            {activeImageTab === 'upload' && (
              <div>
                <div
                  style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    padding: '32px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onDragOver={(e) => { e.preventDefault() }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0])
                    }
                  }}
                  onClick={() => document.getElementById('shortcode-renderer-image-upload-input').click()}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#9ca3af'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="shortcode-renderer-image-upload-input"
                  />

                  {!imagePreview ? (
                    <div>
                      <svg style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: '#9ca3af' }} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p style={{ color: '#6b7280', marginBottom: '8px', fontSize: '14px' }}>
                        {i18n.imageModal?.dragDropImage || 'Drag and drop image here or click to select'}
                      </p>
                      <p style={{ color: '#9ca3af', fontSize: '12px' }}>
                        {i18n.imageModal?.imageRestrictions || 'Maximum file size: 10MB. Supported formats: JPG, PNG, GIF'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px' }} />
                      <button
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedImageFile(null)
                          setImagePreview(null)
                          setImageError(null)
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {imageError && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    color: '#dc2626',
                    fontSize: '14px'
                  }}>
                    {imageError}
                  </div>
                )}
              </div>
            )}

            {/* Select Tab */}
            {activeImageTab === 'existing' && (
              <div>
                {loadingImages ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '14px' }}>
                    {i18n.imageModal?.loadingImages || 'Loading images...'}
                  </div>
                ) : existingImages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px' }}>
                    {i18n.imageModal?.noImages || 'No images found'}
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '12px',
                    maxHeight: '24rem',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    width: '100%'
                  }}>
                    {existingImages.map((image) => (
                      <div
                        key={image.url}
                        onClick={() => setSelectedExistingImage(image)}
                        style={{
                          border: selectedExistingImage === image ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                          backgroundColor: selectedExistingImage === image ? '#eff6ff' : 'white',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          overflow: 'hidden',
                          minWidth: 0
                        }}
                        onMouseEnter={(e) => {
                          if (selectedExistingImage !== image) e.currentTarget.style.borderColor = '#d1d5db'
                        }}
                        onMouseLeave={(e) => {
                          if (selectedExistingImage !== image) e.currentTarget.style.borderColor = '#e5e7eb'
                        }}
                      >
                        <img
                          src={image.url}
                          alt={image.filename}
                          style={{
                            width: '100%',
                            height: '120px',
                            objectFit: 'cover',
                            borderTopLeftRadius: '6px',
                            borderTopRightRadius: '6px',
                            display: 'block'
                          }}
                        />
                        <div style={{ padding: '8px', minWidth: 0 }}>
                          <p style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#1f2937',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            margin: '0 0 4px 0'
                          }}>
                            {image.filename}
                          </p>
                          <p style={{
                            fontSize: '11px',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            {image.width}×{image.height}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Selection Link Button */}
      {!!selectionLinkButton && (
        <div
          data-link-toolbar="true"
          style={{
            position: 'fixed',
            left: `${selectionLinkButton.x}px`,
            top: `${selectionLinkButton.y}px`,
            transform: 'translateX(-50%)',
            zIndex: 100002
          }}
        >
          <button
            onClick={handleSelectionLinkButtonClick}
            onMouseDown={(e) => e.preventDefault()} // Prevent losing text selection
            title={selectionLinkButton.isUnlink ? (i18n.tooltips?.removeLink || 'Remove link') : (i18n.tooltips?.addLink || 'Add link')}
            style={{
              backgroundColor: selectionLinkButton.isUnlink ? '#dc2626' : '#3b82f6',
              color: 'white',
              padding: '4px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              transition: 'background-color 0.2s, color 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = selectionLinkButton.isUnlink ? '#b91c1c' : '#2563eb'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = selectionLinkButton.isUnlink ? '#dc2626' : '#3b82f6'
            }}
          >
            {selectionLinkButton.isUnlink ? (
              // Unlink icon
              <svg style={{ width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 17H7A5 5 0 0 1 7 7h2" />
                <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
                <line x1="8" y1="8" x2="16" y2="16" />
              </svg>
            ) : (
              // Link icon
              <svg style={{ width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          setCurrentTextSelection(null)
        }}
        isValidUrl={linkManager.isValidUrl}
      />
    </div>
  )
}

export default ShortcodeRenderer 