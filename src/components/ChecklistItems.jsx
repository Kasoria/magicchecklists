import React, { useState, useRef, useEffect } from 'react'
import { Card, Button, Label, Alert, Modal, ModalHeader, ModalBody, ModalFooter, TextInput } from 'flowbite-react'
import ReactSelect from 'react-select'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const ChecklistItems = ({ items = [], onChange, enablePriority = false, enableLocking = false, errors = {}, onPriorityToggle, checklistId = null, adminData = null }) => {
  const [draggedItem, setDraggedItem] = useState(null)
  const itemRefs = useRef({})
  const [resizing, setResizing] = useState({ active: false, startX: 0, startWidth: 0, element: null })
  
  // Link functionality state
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [currentItemIndex, setCurrentItemIndex] = useState(null)
  const [selectionRange, setSelectionRange] = useState(null)
  const [showLinkOptions, setShowLinkOptions] = useState(false)
  const [linkOptionsPosition, setLinkOptionsPosition] = useState({ top: 0, left: 0 })
  const [hasExistingLink, setHasExistingLink] = useState(false)
  const linkOptionsRef = useRef(null)
  
  // New state for drawer-like functionality
  const [inProgressItems, setInProgressItems] = useState([])
  const [itemDeadlines, setItemDeadlines] = useState({})
  const [countdownTimers, setCountdownTimers] = useState(new Map())
  const [tooltip, setTooltip] = useState(null)
  const [tooltipTimer, setTooltipTimer] = useState(null)
  
  // Image management state
  const [showImageModal, setShowImageModal] = useState(null) // 'choice', 'upload', or null
  const [currentImageItem, setCurrentImageItem] = useState(null)
  const [existingImages, setExistingImages] = useState([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState(null)
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedExistingImage, setSelectedExistingImage] = useState(null)
  
  // CSS for styling links in the content editable areas
  const linkStyles = `
    .react-select__option a, 
    [contenteditable] a {
      color: #0066cc;
      text-decoration: underline;
      font-weight: 500;
      background-color: rgba(0, 102, 204, 0.05);
      padding: 0 4px;
      border-radius: 3px;
      transition: all 0.2s ease;
    }
    
    .react-select__option a:hover, 
    [contenteditable] a:hover {
      background-color: rgba(0, 102, 204, 0.1);
      color: #004c99;
    }
    
    /* Add a small icon to make links even more recognizable */
    [contenteditable] a::after {
      content: "↗";
      font-size: 0.8em;
      margin-left: 2px;
      display: inline-block;
      opacity: 0.7;
    }

    /* Deadline status styles */
    .deadline-24h {
      background-color: #fef3c7 !important;
      border-color: #f59e0b !important;
    }
    
    .deadline-2h {
      background-color: #fee2e2 !important;
      border-color: #ef4444 !important;
    }
    
    .deadline-passed {
      background-color: #ef4444 !important;
      color: white !important;
    }

    /* In progress indicator */
    .mcl-progress-indicator {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: transparent;
      transition: background-color 0.2s ease;
    }
    
    .mcl-progress-indicator.active {
      background-color: #10b981;
    }
  `;

  const priorityLevels = {
    'none': { label: 'None', color: '#6b7280' },
    'low': { label: 'Low', color: '#10b981' },
    'medium': { label: 'Medium', color: '#f59e0b' },
    'high': { label: 'High', color: '#ef4444' },
    'critical': { label: 'Critical', color: '#991b1b' }
  }

  // Initialize with at least one empty item
  useEffect(() => {
    if (items.length === 0) {
      onChange([createNewItem()])
    }
  }, [])

  // Load initial deadlines and in-progress state from items
  useEffect(() => {
    const deadlines = {}
    const inProgress = []
    
    items.forEach(item => {
      if (item.deadline) {
        deadlines[item.id] = item.deadline
      }
      if (item.in_progress) {
        inProgress.push(item.id)
      }
    })
    
    setItemDeadlines(deadlines)
    setInProgressItems(inProgress)
  }, [items])

  // Deadline countdown management
  useEffect(() => {
    // Clear existing timers
    countdownTimers.forEach(timer => clearInterval(timer))
    const newTimers = new Map()

    // Set up new timers for current deadlines
    Object.entries(itemDeadlines).forEach(([itemId, deadline]) => {
      if (deadline) {
        const timer = setInterval(() => {
          const listItem = document.querySelector(`[data-item-id="${itemId}"]`)
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

  // Tooltip management
  const showTooltip = (element, text) => {
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
  }

  const hideTooltip = () => {
    // Clear any pending timer
    if (tooltipTimer) {
      clearTimeout(tooltipTimer)
      setTooltipTimer(null)
    }
    // Hide tooltip immediately
    setTooltip(null)
  }

  // Update deadline status function
  const updateItemDeadlineStatus = (listItem, deadline) => {
    const now = Date.now()
    const deadlineTime = new Date(deadline * 1000).getTime()
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
  }

  const formatItemDeadlineCountdown = (timeLeft) => {
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
  }

  // Handle deadline click
  const handleDeadlineClick = (itemId) => {
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
        // Update item
        updateItemField(itemId, 'deadline', null)
        // Save to server immediately
        if (checklistId && (adminData?.ajaxurl || window.mcl_checklists?.ajax_url)) {
          saveDeadlineToServer(itemId, '')
        }
      } else {
        // Set new deadline
        const timestamp = Math.floor(new Date(newDeadline).getTime() / 1000)
        setItemDeadlines(prev => ({
          ...prev,
          [itemId]: timestamp
        }))
        // Update item
        updateItemField(itemId, 'deadline', timestamp)
        // Save to server immediately
        if (checklistId && (adminData?.ajaxurl || window.mcl_checklists?.ajax_url)) {
          saveDeadlineToServer(itemId, timestamp)
        }
      }
    }
  }

  // Save deadline to server
  const saveDeadlineToServer = async (itemId, deadline) => {
    try {
      const formData = new FormData()
      formData.append('action', 'mcl_save_item_deadline')
      formData.append('checklist_id', checklistId)
      formData.append('item_id', itemId)
      formData.append('deadline', deadline)
      
      // Use admin nonce if available, fallback to frontend nonce
      const nonce = adminData?.nonces?.mcl_admin || window.mcl_checklists?.nonce
      if (nonce) {
        formData.append('nonce', nonce)
      }

      // Use admin AJAX URL if available, fallback to frontend URL
      const ajaxUrl = adminData?.ajaxurl || window.mcl_checklists?.ajax_url
      await fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })
    } catch (error) {
      console.warn('Error saving deadline to server:', error)
    }
  }

  // Toggle in-progress state
  const toggleInProgress = (itemId) => {
    setInProgressItems(prev => {
      const newItems = prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
      
      // Update the item
      updateItemField(itemId, 'in_progress', !prev.includes(itemId))
      
      // Also save to server immediately if checklistId is available
      if (checklistId && (adminData?.ajaxurl || window.mcl_checklists?.ajax_url)) {
        saveInProgressToServer(newItems)
      }
      
      return newItems
    })
  }

  // Save in-progress state to server
  const saveInProgressToServer = async (inProgressItemIds) => {
    try {
      const formData = new FormData()
      formData.append('action', 'mcl_save_in_progress')
      formData.append('checklist_id', checklistId)
      formData.append('items_in_progress', JSON.stringify(inProgressItemIds))
      
      // Use admin nonce if available, fallback to frontend nonce
      const nonce = adminData?.nonces?.mcl_admin || window.mcl_checklists?.nonce
      if (nonce) {
        formData.append('nonce', nonce)
      }

      // Use admin AJAX URL if available, fallback to frontend URL
      const ajaxUrl = adminData?.ajaxurl || window.mcl_checklists?.ajax_url
      await fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })
    } catch (error) {
      console.warn('Error saving in-progress state to server:', error)
    }
  }

  // Helper function to update item field by ID
  const updateItemField = (itemId, field, value) => {
    const newItems = items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    )
    onChange(newItems)
  }

  // Tour integration
  const checkTourConnections = async (itemId) => {
    if (!checklistId || !window.mcl_checklists?.ajax_url) return []
    
    try {
      const formData = new FormData()
      formData.append('action', 'mcl_get_item_tour_connections')
      formData.append('checklist_id', checklistId)
      formData.append('item_id', itemId)
      
      const nonce = window.mcl_checklists?.nonce
      if (nonce) {
        formData.append('nonce', nonce)
      }

      const response = await fetch(window.mcl_checklists.ajax_url, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.data.connections.length > 0) {
        return result.data.connections
      }
    } catch (error) {
      console.error('Error checking tour connections:', error)
    }
    return []
  }

  const startTourFromConnection = (connections) => {
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
  }

  // Tour Button Component
  const TourButton = ({ itemId }) => {
    const [hasConnections, setHasConnections] = useState(false)
    const [connections, setConnections] = useState([])

    useEffect(() => {
      if (itemId && checklistId) {
        checkTourConnections(itemId).then(conns => {
          if (conns.length > 0) {
            setHasConnections(true)
            setConnections(conns)
          }
        })
      }
    }, [itemId])

    if (!hasConnections) return null

    return (
      <button
        type="button"
        className="p-2 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          startTourFromConnection(connections)
        }}
        onMouseEnter={(e) => showTooltip(e.target, 'Start tour from this step')}
        onMouseLeave={hideTooltip}
        title="Start tour from this step"
      >
        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.5 13.5V21q0 .213-.144.356q-.144.144-.357.144t-.356-.144Q5.5 21.213 5.5 21V3q0-.213.144-.356q.144-.144.357-.144t.356.144Q6.5 2.787 6.5 3v1.5h12.583q.429 0 .661.351q.233.35.071.755L18.462 9l1.353 3.394q.162.404-.07.755q-.233.351-.662.351H6.5Zm6-3q.633 0 1.066-.434Q14 9.633 14 9t-.434-1.066Q13.133 7.5 12.5 7.5t-1.066.434Q11 8.367 11 9t.434 1.066q.433.434 1.066.434Z"/>
        </svg>
      </button>
    )
  }

  const createNewItem = (index = 0) => ({
    id: `item_${Date.now()}_${index}`,
    content: '',
    priority: 'none',
    locked: false,
    parent_id: null,
    in_progress: false,
    deadline: null
  })

  const addItem = () => {
    const newItem = createNewItem(items.length)
    onChange([...items, newItem])
    
    // Focus the new item after a short delay
    setTimeout(() => {
      const newItemElement = itemRefs.current[newItem.id]
      if (newItemElement) {
        newItemElement.focus()
      }
    }, 100)
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      const removedItem = items[index]
      const newItems = items.filter((_, i) => i !== index)
      onChange(newItems)
      
      // Clean up state
      setInProgressItems(prev => prev.filter(id => id !== removedItem.id))
      setItemDeadlines(prev => {
        const newDeadlines = { ...prev }
        delete newDeadlines[removedItem.id]
        return newDeadlines
      })
    }
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange(newItems)
  }

  const handleContentEdit = (index, content) => {
    // Auto-convert URLs to links
    const contentWithLinks = autoConvertLinks(content);
    updateItem(index, 'content', contentWithLinks);
    
    // When content is updated, make sure any images have resize handles
    setTimeout(() => {
      const contentDiv = itemRefs.current[items[index].id];
      if (contentDiv) {
        addResizeListeners(contentDiv);
      }
    }, 100);
  }

  const handlePaste = (e, index) => {
    // If the item is locked, don't allow pasting
    if (items[index].locked) return;
    
    // Get pasted content as plain text
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    
    // Check if the pasted content is a URL
    if (isValidUrl(text)) {
      // Create a link element
      const linkHtml = `<a href="${text}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      
      // Insert at cursor position
      document.execCommand('insertHTML', false, linkHtml);
    } else {
      // Insert as plain text
      document.execCommand('insertText', false, text);
    }
    
    // Update the item content
    const contentDiv = itemRefs.current[items[index].id];
    if (contentDiv) {
      handleContentEdit(index, contentDiv.innerHTML);
    }
  }

  const handleKeyDown = (e, index) => {
    // Handle Enter key to add new items
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      // Add new item after current one
      const newItem = createNewItem(items.length)
      const newItems = [...items]
      newItems.splice(index + 1, 0, newItem)
      onChange(newItems)
      
      // Focus the new item
      setTimeout(() => {
        const newItemElement = itemRefs.current[newItem.id]
        if (newItemElement) {
          newItemElement.focus()
        }
      }, 100)
    }
    
    if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'A')) {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection.toString().trim().length > 0) {
          handleTextSelection(index, 'keyboard-select-all');
        }
      }, 50);
    }
  }

  const handleDragEnd = (result) => {
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
        onChange(newItems)
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
      onChange(newItems)
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
          // Dropping after a potential parent - only nest if we're inserting BETWEEN its children
          // Not if we're dropping after ALL its children
          
          // Get all children of this potential parent
          const potentialParentId = destinationItemAbove.id
          const parentChildren = newItems.filter(item => item.parent_id === potentialParentId)
          
          if (parentChildren.length > 0) {
            // Find the indices of all children
            const childIndices = parentChildren.map(child => 
              newItems.findIndex(item => item.id === child.id)
            ).sort((a, b) => a - b)
            
            const lastChildIndex = Math.max(...childIndices)
            
            // Only nest if we're dropping BEFORE the last child (i.e., among children)
            // NOT if we're dropping after the last child
            if (destination.index <= lastChildIndex) {
              reorderedItem.parent_id = potentialParentId
            } else {
              // Dropping after all children - remain top-level
              reorderedItem.parent_id = null
            }
          } else {
            // Parent has no children - dropping right after parent makes us a child
            reorderedItem.parent_id = potentialParentId
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
      
      onChange(newItems)
    }
  }

  const deleteAllItems = () => {
    if (confirm('Are you sure you want to delete all items?')) {
      onChange([createNewItem()])
    }
  }

  const getParentOptions = (currentItemId) => {
    return items.filter(item => 
      item.id !== currentItemId && 
      !item.parent_id // Only allow top-level items as parents
    )
  }

  const handleAddImage = (index) => {
    setCurrentImageItem(index)
    setImageError(null)
    
    // Check if user is logged in and can use media library
    const isLoggedIn = window.mcl_checklists?.user_access?.is_logged_in || false
    
    if (isLoggedIn && typeof wp !== 'undefined' && wp.media) {
      // Show choice modal for logged in users
      setShowImageModal('choice')
    } else {
      // Show upload area directly for non-logged in users
      setShowImageModal('upload')
    }
  }

  const closeImageModal = () => {
    setShowImageModal(null)
    setCurrentImageItem(null)
    setExistingImages([])
    setSelectedImageFile(null)
    setImagePreview(null)
    setSelectedExistingImage(null)
    setImageError(null)
  }

  const openMediaLibrary = () => {
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
      insertImageIntoItem(attachment)
      closeImageModal()
    })

    mediaFrame.open()
  }

  const loadExistingImages = async () => {
    if (!checklistId) return
    setLoadingImages(true)
    try {
      const formData = new FormData()
      formData.append('action', 'mcl_get_uploaded_images')
      formData.append('checklist_id', checklistId)
      
      const nonce = adminData?.nonces?.mcl_admin || window.mcl_checklists?.nonce
      if (nonce) {
        formData.append('nonce', nonce)
      }

      const ajaxUrl = adminData?.ajaxurl || window.mcl_checklists?.ajax_url
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
      const formData = new FormData()
      formData.append('action', 'mcl_upload_image')
      formData.append('file', file)
      formData.append('checklist_id', checklistId || 0)

      const nonce = adminData?.nonces?.mcl_admin || window.mcl_checklists?.nonce
      if (nonce) {
        formData.append('nonce', nonce)
      }

      const ajaxUrl = adminData?.ajaxurl || window.mcl_checklists?.ajax_url
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
        setImageError(result.data?.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setImageError('Upload failed. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const insertImageIntoItem = (imageData) => {
    if (currentImageItem === null) return

    const currentItem = items[currentImageItem]
    
    // Calculate initial dimensions
    const maxWidth = 200
    const aspectRatio = imageData.height / imageData.width
    let width = Math.min(imageData.width, maxWidth)
    let height = Math.round(width * aspectRatio)
    
    const imageHtml = `
      <div class="mcl-item-image-container" style="width: ${width}px;">
        <img src="${imageData.url}" alt="${imageData.alt || 'Uploaded image'}" style="width: ${width}px; height: ${height}px;" data-mcl-image="true" />
        <div class="mcl-resize-handle" data-resize-handle="true"></div>
      </div>
    `
    const newContent = currentItem.content + imageHtml
    updateItem(currentImageItem, 'content', newContent)
    
    // Add event listeners for resize handles after a brief delay
    setTimeout(() => {
      const contentDiv = itemRefs.current[items[currentImageItem].id]
      if (contentDiv) {
        addResizeListeners(contentDiv)
      }
    }, 100)
  }

  const handleFileSelect = (selectedFile) => {
    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']

    if (!allowedTypes.includes(selectedFile.type)) {
      setImageError('Invalid file type. Please upload a JPG, PNG, or GIF image.')
      return
    }

    if (selectedFile.size > maxSize) {
      setImageError('File is too large. Maximum size is 10MB.')
      return
    }

    setSelectedImageFile(selectedFile)
    setImageError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(selectedFile)
  }

  const addResizeListeners = (contentDiv) => {
    const resizeHandles = contentDiv.querySelectorAll('.mcl-resize-handle')
    resizeHandles.forEach(handle => {
      if (!handle.hasAttribute('data-listener-added')) {
        handle.addEventListener('mousedown', (e) => {
          e.preventDefault()
          const container = handle.closest('.mcl-item-image-container')
          const img = container.querySelector('img')
          if (img) {
            setResizing({
              active: true,
              startX: e.clientX,
              startWidth: img.offsetWidth,
              element: container
            })
          }
        })
        handle.setAttribute('data-listener-added', 'true')
      }
    })
    
    // Also add resize handles to any existing images that don't have them
    const images = contentDiv.querySelectorAll('img[data-mcl-image="true"]')
    images.forEach(img => {
      if (!img.closest('.mcl-item-image-container')) {
        // Wrap standalone images in containers
        const container = document.createElement('div')
        container.className = 'mcl-item-image-container'
        container.style.width = `${img.offsetWidth}px`
        
        const resizeHandle = document.createElement('div')
        resizeHandle.className = 'mcl-resize-handle'
        resizeHandle.setAttribute('data-resize-handle', 'true')
        
        img.parentNode.insertBefore(container, img)
        container.appendChild(img)
        container.appendChild(resizeHandle)
        
        // Add event listener to the new handle
        resizeHandle.addEventListener('mousedown', (e) => {
          e.preventDefault()
          setResizing({
            active: true,
            startX: e.clientX,
            startWidth: img.offsetWidth,
            element: container
          })
        })
      }
    })
  }

  // Add resize event listeners
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (resizing.active && resizing.element) {
        const diff = e.clientX - resizing.startX
        const newWidth = Math.max(50, Math.min(400, resizing.startWidth + diff))
        const img = resizing.element.querySelector('img')
        if (img) {
          img.style.width = `${newWidth}px`
          img.style.height = 'auto'
          // Update container width to match image
          resizing.element.style.width = `${newWidth}px`
        }
      }
    }

    const handleMouseUp = () => {
      if (resizing.active) {
        setResizing({ active: false, startX: 0, startWidth: 0, element: null })
      }
    }

    if (resizing.active) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizing])

  // Add resize listeners when content changes and on initial load
  useEffect(() => {
    items.forEach((item, index) => {
      const contentDiv = itemRefs.current[item.id]
      if (contentDiv) {
        addResizeListeners(contentDiv)
      }
    })
  }, [items])

  // Add resize listeners when refs are set (for initial load)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      items.forEach((item) => {
        const contentDiv = itemRefs.current[item.id]
        if (contentDiv) {
          addResizeListeners(contentDiv)
        }
      })
    })

    // Observe all content divs for changes
    Object.values(itemRefs.current).forEach(ref => {
      if (ref) {
        observer.observe(ref, { childList: true, subtree: true })
      }
    })

    return () => observer.disconnect()
  }, [items])

  // Helper function to check if text is a valid URL
  const isValidUrl = (text) => {
    // Check if already wrapped in a link tag
    if (text.match(/<a\s+href=/i)) {
      return false;
    }
    
    // More comprehensive URL regex
    const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i;
    return urlRegex.test(text.trim());
  }

  // Helper function to convert plain text URLs to clickable links
  const autoConvertLinks = (content) => {
    // Use DOM parsing for more reliable link detection
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Function to walk through text nodes and convert URLs to links
    const processTextNodes = (node) => {
      if (node.nodeType === 3) { // Text node
        // URL regex
        const urlRegex = /(https?:\/\/[^\s<]+)/g;
        const text = node.nodeValue;
        let match;
        let lastIndex = 0;
        let result = document.createDocumentFragment();
        
        // Process each URL in the text
        while ((match = urlRegex.exec(text)) !== null) {
          // Add text before the URL
          if (match.index > lastIndex) {
            result.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
          }
          
          // Create link element with enhanced styling
          const link = document.createElement('a');
          link.href = match[0];
          link.textContent = match[0];
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.className = 'mcl-link';
          link.style.color = '#0066cc';
          link.style.textDecoration = 'underline';
          link.style.fontWeight = '500';
          link.style.backgroundColor = 'rgba(0, 102, 204, 0.05)';
          link.style.padding = '0 4px';
          link.style.borderRadius = '3px';
          link.style.transition = 'all 0.2s ease';
          result.appendChild(link);
          
          lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text after the last URL
        if (lastIndex < text.length) {
          result.appendChild(document.createTextNode(text.substring(lastIndex)));
        }
        
        // Replace the text node with processed content if we found URLs
        if (lastIndex > 0) {
          node.parentNode.replaceChild(result, node);
        }
      } else if (node.nodeType === 1 && node.nodeName !== 'A') { // Element node (not an anchor)
        // Process child nodes recursively
        Array.from(node.childNodes).forEach(processTextNodes);
      }
    };
    
    // Process all nodes
    Array.from(tempDiv.childNodes).forEach(processTextNodes);
    
    return tempDiv.innerHTML;
  }

  // Helper function to check if selection contains a link
  const getExistingLink = (selection) => {
    if (!selection) return null;
    
    let node;
    
    if (selection instanceof Range) {
      // If a Range object was passed
      node = selection.commonAncestorContainer;
    } else {
      // If a Selection object was passed
      if (selection.rangeCount === 0) return null;
      const range = selection.getRangeAt(0);
      node = range.commonAncestorContainer;
    }
    
    // Check if node itself is a link
    if (node.nodeType === 1 && node.tagName === 'A') {
      return node;
    }
    
    // Check if parent is a link
    if (node.nodeType === 3 && node.parentElement && node.parentElement.tagName === 'A') {
      return node.parentElement;
    }
    
    // Walk up the tree looking for a link
    while (node && node.nodeType !== 9) {
      if (node.nodeType === 1 && node.tagName === 'A') {
        return node;
      }
      node = node.parentNode;
    }
    
    return null;
  }

  // Helper function to create a link from selected text
  const createLink = () => {
    
    if (!selectionRange) {
      console.error('No selection range available');
      return;
    }
    
    if (!linkUrl) {
      console.error('No URL provided');
      return;
    }
    
    try {
      // Get the content editable element
      if (currentItemIndex === null || !itemRefs.current[items[currentItemIndex].id]) {
        console.error('Content editable element not found');
        return;
      }
      
      const contentDiv = itemRefs.current[items[currentItemIndex].id];
      
      // Create a document fragment to hold our link
      const tempDiv = document.createElement('div');
      
      // Create the link element with enhanced styling
      const linkElement = document.createElement('a');
      linkElement.href = linkUrl;
      linkElement.target = '_blank';
      linkElement.rel = 'noopener noreferrer';
      linkElement.className = 'mcl-link';
      linkElement.style.color = '#0066cc';
      linkElement.style.textDecoration = 'underline';
      linkElement.style.fontWeight = '500';
      linkElement.style.backgroundColor = 'rgba(0, 102, 204, 0.05)';
      linkElement.style.padding = '0 4px';
      linkElement.style.borderRadius = '3px';
      linkElement.style.transition = 'all 0.2s ease';
      
      // Get the text to use for the link
      const selectedText = selectionRange.toString();
      
      // If link text is provided, use it
      if (linkText && linkText.trim() !== '') {
        linkElement.textContent = linkText;
      }
      // If no text is selected, use the URL
      else if (selectedText.trim() === '') {
        linkElement.textContent = linkUrl;
      }
      // Otherwise use the selected text
      else {
        linkElement.textContent = selectedText;
      }
      
      // Create a new range to insert our link
      // We'll use the stored selection points
      const editableRange = document.createRange();
      editableRange.setStart(selectionRange.startContainer, selectionRange.startOffset);
      editableRange.setEnd(selectionRange.endContainer, selectionRange.endOffset);
      
      // Delete the contents and insert the link
      editableRange.deleteContents();
      editableRange.insertNode(linkElement);
      
      // Update the item content
      handleContentEdit(currentItemIndex, contentDiv.innerHTML);
      
      // Reset link modal state
      setShowLinkModal(false);
      setLinkUrl('');
      setLinkText('');
      setSelectionRange(null);
    } catch (error) {
      console.error('Error creating link:', error);
    }
  }

  // Helper function to remove a link
  const removeLink = () => {
    if (!selectionRange) return;
    
    try {
      // Get the content editable element
      if (currentItemIndex === null || !itemRefs.current[items[currentItemIndex].id]) {
        console.error('Content editable element not found');
        return;
      }
      
      const contentDiv = itemRefs.current[items[currentItemIndex].id];
      
      // Find the link element
      const existingLink = getExistingLink(selectionRange);
      
      if (existingLink) {
        // Replace the link with its text content
        const textNode = document.createTextNode(existingLink.textContent);
        existingLink.parentNode.replaceChild(textNode, existingLink);
        
        // Update the item content
        handleContentEdit(currentItemIndex, contentDiv.innerHTML);
      } else {
        console.log('No link found to remove');
      }
      
      setSelectionRange(null);
    } catch (error) {
      console.error('Error removing link:', error);
    }
  }

  // Function to handle text selection in content editable divs
  const handleTextSelection = (index, source = 'mouse') => {
    const selection = window.getSelection();
    
    // Use a slightly longer delay for select-all to ensure the selection is fully processed
    const checkSelectionAndShow = () => {
      if (selection.toString().trim().length > 0) {
        setCurrentItemIndex(index);
        
        // Save range for later use (not the selection)
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0).cloneRange();
          setSelectionRange(range);
          
          // Check if selection contains a link
          const existingLink = getExistingLink(range);
          setHasExistingLink(!!existingLink);
          
          // Position the link options popup
          const rect = range.getBoundingClientRect();
          
          setLinkOptionsPosition({
            top: rect.top - 40, // Position above the selection
            left: rect.left + (rect.width / 2) - 50 // Center horizontally
          });
          
          setShowLinkOptions(true);
        } else {
          console.log('Selection has no ranges');
          setShowLinkOptions(false);
        }
      } else {
        setShowLinkOptions(false);
      }
    };
    
    // For Cmd/Ctrl+A, use a slightly longer delay to ensure selection is complete
    if (source === 'keyboard-select-all') {
      setTimeout(checkSelectionAndShow, 50);
    } else {
      checkSelectionAndShow();
    }
  }

  // Handle keyboard selection
  const handleKeyUp = (e, index) => {
    // Detect keyboard selection (common shortcut keys like Shift+Arrows)
    if (e.shiftKey || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
      handleTextSelection(index, 'keyboard');
    }
    
    // Detect Cmd+A (Mac) or Ctrl+A (Windows/Linux) for "Select All"
    if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'A')) {
      console.log('Select all detected with Cmd/Ctrl+A');
      // Short delay to let the selection complete before checking
      setTimeout(() => handleTextSelection(index, 'keyboard-select-all'), 10);
    }
  }

  // Handle click outside link options popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (linkOptionsRef.current && !linkOptionsRef.current.contains(event.target)) {
        setShowLinkOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const renderItem = (item, index) => {
    const isInProgress = inProgressItems.includes(item.id)
    const deadline = itemDeadlines[item.id]
    
    // Determine deadline status classes
    let deadlineClasses = ''
    if (deadline) {
      const now = Date.now()
      const deadlineTime = new Date(deadline * 1000).getTime()
      const timeLeft = deadlineTime - now
      
      if (timeLeft < 0) {
        deadlineClasses = 'deadline-passed'
      } else if (timeLeft < 7200000) { // 2 hours
        deadlineClasses = 'deadline-2h'
      } else if (timeLeft < 86400000) { // 24 hours
        deadlineClasses = 'deadline-24h'
      }
    }

    return (
      <Draggable key={item.id} draggableId={item.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            data-item-id={item.id}
            className={`group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-none ${
              snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'
            } ${item.parent_id ? 'ml-8 border-l-4 border-l-blue-500' : ''} ${
              item.locked ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/10' : ''
            } ${deadlineClasses} ${
              isInProgress ? 'bg-emerald-100' : ''
            }`}
          >
            {/* In-progress indicator */}
            <div className={`mcl-progress-indicator ${isInProgress ? 'active' : ''}`} />

            {/* Drag Handle */}
            <div
              {...provided.dragHandleProps}
              className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>

          {/* Content */}
          <div className="pl-6 pr-8">
            <div className="mb-4">
              <div
                ref={(el) => (itemRefs.current[item.id] = el)}
                contentEditable={!item.locked}
                suppressContentEditableWarning
                className={`min-h-[40px] p-2 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  item.locked ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-800 dark:text-white'
                }`}
                onBlur={(e) => !item.locked && handleContentEdit(index, e.target.innerHTML)}
                onKeyDown={(e) => !item.locked && handleKeyDown(e, index)}
                onKeyUp={(e) => !item.locked && handleKeyUp(e, index)}
                onPaste={(e) => !item.locked && handlePaste(e, index)}
                onMouseUp={() => !item.locked && handleTextSelection(index)}
                dangerouslySetInnerHTML={{ __html: item.content || '' }}
              />
            </div>

            {/* Item Controls - Only show parent selection and priority */}
            <div className="flex items-center space-x-2 mt-2">
              {/* Parent Selection */}
              <div className="flex-1">
                <ReactSelect
                  value={item.parent_id ? { value: item.parent_id, label: getParentOptions(item.id).find(p => p.id === item.parent_id)?.content?.length > 30 ? getParentOptions(item.id).find(p => p.id === item.parent_id)?.content.substring(0, 30) + '...' : getParentOptions(item.id).find(p => p.id === item.parent_id)?.content || 'Untitled Item' } : null}
                  onChange={(selectedOption) => updateItem(index, 'parent_id', selectedOption?.value || null)}
                  options={[
                    { value: null, label: 'No Parent' },
                    ...getParentOptions(item.id).map(parentItem => ({
                      value: parentItem.id,
                      label: parentItem.content ? 
                        (parentItem.content.length > 30 ? 
                          parentItem.content.substring(0, 30) + '...' : 
                          parentItem.content
                        ) : 
                        'Untitled Item'
                    }))
                  ]}
                  isDisabled={item.locked}
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Select parent..."
                />
              </div>

              {/* Priority Selection */}
              {enablePriority && (
                <div className="flex items-center space-x-1">
                  <ReactSelect
                    value={{ value: item.priority || 'none', label: priorityLevels[item.priority || 'none']?.label }}
                    onChange={(selectedOption) => updateItem(index, 'priority', selectedOption.value)}
                    options={Object.entries(priorityLevels).map(([value, { label }]) => ({
                      value: value,
                      label: label
                    }))}
                    isDisabled={item.locked}
                    className="react-select-container w-32"
                    classNamePrefix="react-select"
                    placeholder="Priority..."
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: priorityLevels[item.priority || 'none']?.color }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Show on hover */}
          <div className="absolute right-2 top-2 flex flex-col items-center space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* In Progress Button */}
            <button
              type="button"
              onClick={() => toggleInProgress(item.id)}
              className={`p-2 rounded transition-colors ${
                isInProgress 
                  ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200' 
                  : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              onMouseEnter={(e) => showTooltip(e.target, isInProgress ? 'Remove from in progress' : 'Mark as in progress')}
              onMouseLeave={hideTooltip}
              title={isInProgress ? 'Remove from in progress' : 'Mark as in progress'}
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
              onClick={() => handleDeadlineClick(item.id)}
              className="p-2 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              onMouseEnter={(e) => showTooltip(e.target, 'Set deadline')}
              onMouseLeave={hideTooltip}
              title="Set deadline"
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
              onClick={() => handleAddImage(index)}
              className="p-2 rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              onMouseEnter={(e) => showTooltip(e.target, 'Add image')}
              onMouseLeave={hideTooltip}
              title="Add image"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path fill="currentColor" d="M416 64H96a64.07 64.07 0 0 0-64 64v256a64.07 64.07 0 0 0 64 64h320a64.07 64.07 0 0 0 64-64V128a64.07 64.07 0 0 0-64-64Zm-80 64a48 48 0 1 1-48 48a48.05 48.05 0 0 1 48-48ZM96 416a32 32 0 0 1-32-32v-67.63l94.84-84.3a48.06 48.06 0 0 1 65.8 1.9l64.95 64.81L172.37 416Zm352-32a32 32 0 0 1-32 32H217.63l121.42-121.42a47.72 47.72 0 0 1 61.64-.16L448 333.84Z"/>
              </svg>
            </button>

            {/* Tour Button - conditionally rendered */}
            <TourButton itemId={item.id} />

            {/* Lock Toggle Button */}
            {enableLocking && (
              <button
                type="button"
                onClick={() => updateItem(index, 'locked', !item.locked)}
                className={`p-2 rounded transition-colors ${
                  item.locked 
                    ? 'text-orange-600 bg-orange-100 hover:bg-orange-200' 
                    : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                }`}
                onMouseEnter={(e) => showTooltip(e.target, item.locked ? 'Unlock item' : 'Lock item')}
                onMouseLeave={hideTooltip}
                title={item.locked ? 'Unlock item' : 'Lock item'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.locked ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  )}
                </svg>
              </button>
            )}

            {/* Remove Button */}
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-2 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                onMouseEnter={(e) => showTooltip(e.target, 'Remove item')}
                onMouseLeave={hideTooltip}
                title="Remove item"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Deadline Display */}
          {deadline && (
            <div className="mt-3 flex-shrink-0 text-xs bg-gray-200 px-2 py-1 rounded">
              <div className="flex items-center gap-1">
                <span>
                  Due: {new Date(deadline * 1000).toLocaleDateString()}
                </span>
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
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )}

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

      {/* Image Choice Modal */}
      {showImageModal === 'choice' && (
        <Modal show={true} onClose={closeImageModal}>
          <ModalHeader>Insert Image</ModalHeader>
          <ModalBody>
            <p className="text-gray-600 mb-4">Choose how you would like to add an image:</p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={openMediaLibrary}
                color="blue"
              >
                WordPress Media Library
              </Button>
              <Button 
                onClick={() => setShowImageModal('upload')}
                color="gray"
              >
                Quick Upload
              </Button>
            </div>
          </ModalBody>
        </Modal>
      )}

      {/* Image Upload Modal */}
      {showImageModal === 'upload' && (
        <Modal show={true} onClose={closeImageModal} size="2xl">
          <ModalHeader>Upload or Select Image</ModalHeader>
          <ModalBody>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button 
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  !existingImages.length || existingImages.length === 0
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setExistingImages([])}
              >
                Upload New
              </button>
              <button 
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  existingImages.length > 0
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={loadExistingImages}
              >
                Select Existing
              </button>
            </div>

            {/* Upload Tab */}
            {(!existingImages.length || existingImages.length === 0) && (
              <div>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onDragOver={e => { e.preventDefault() }}
                  onDrop={e => { 
                    e.preventDefault()
                    if (e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0])
                    }
                  }}
                  onClick={() => document.getElementById('image-upload-input').click()}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="image-upload-input"
                  />

                  {!imagePreview ? (
                    <div className="space-y-3">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-gray-600">Drag and drop image here or click to select</p>
                      <p className="text-sm text-gray-500">Maximum file size: 10MB. Supported formats: JPG, PNG, GIF</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="max-w-full h-auto rounded-md" />
                      <button 
                        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-70 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedImageFile(null)
                          setImagePreview(null)
                          setImageError(null)
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {imageError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {imageError}
                  </div>
                )}
              </div>
            )}

            {/* Select Tab */}
            {existingImages.length > 0 && (
              <div>
                {loadingImages ? (
                  <div className="text-center py-8 text-gray-500">Loading images...</div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {existingImages.map((image) => (
                      <div
                        key={image.url}
                        className={`border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedExistingImage === image 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedExistingImage(image)}
                      >
                        <img src={image.url} alt={image.filename} className="w-full h-24 object-cover rounded-t-md" />
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-800 truncate">{image.filename}</p>
                          <p className="text-xs text-gray-500">{image.width}×{image.height}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-between w-full">
              <Button color="gray" onClick={closeImageModal}>
                Cancel
              </Button>
              <Button 
                color="blue" 
                onClick={() => {
                  if (selectedImageFile) {
                    uploadImage(selectedImageFile)
                  } else if (selectedExistingImage) {
                    insertImageIntoItem(selectedExistingImage)
                    closeImageModal()
                  }
                }}
                disabled={(!selectedImageFile && !selectedExistingImage) || uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : selectedImageFile ? 'Upload Image' : 'Select Image'}
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      )}

    <Card>
      <div className="space-y-4">
        {/* Inject link styles */}
        <style>{linkStyles}</style>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-brand-dark dark:text-white">
              Checklist Items
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Add and organize your checklist items
            </p>
          </div>
        </div>

        {/* Item Settings */}
        <div className="flex justify-end p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-right">
            <label className="text-sm font-medium text-brand-dark dark:text-white">Enable Item Priorities</label>
            <div className="flex items-center justify-end mt-1">
              <div className="flex items-center">
                <input 
                  id="enable_priority" 
                  type="checkbox" 
                  checked={enablePriority}
                  onChange={(e) => onPriorityToggle(e.target.checked)}
                  className="w-4 h-4 bg-gray-100 border-gray-300 rounded-sm focus:ring-brand-accent dark:focus:ring-brand-accent dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  style={{ accentColor: '#f2da21' }}
                />
                <label htmlFor="enable_priority" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Enable</label>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errors.items && (
          <Alert color="failure">
            {errors.items}
          </Alert>
        )}

        {/* Items List */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="checklist-items" isCombineEnabled>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-3 min-h-[200px] p-4 border-2 border-dashed rounded-lg transition-colors ${
                  snapshot.isDraggingOver 
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {items.map((item, index) => renderItem(item, index))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Link Options Popup */}
        {showLinkOptions && (
          <div
            ref={linkOptionsRef}
            style={{
              position: 'fixed',
              top: `${linkOptionsPosition.top}px`,
              left: `${linkOptionsPosition.left}px`,
              zIndex: 1000,
            }}
            className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-2 flex space-x-2"
          >
            {!hasExistingLink ? (
              <button
                onClick={() => {
                  setLinkText(selectionRange?.toString() || '');
                  setShowLinkModal(true);
                  setShowLinkOptions(false);
                }}
                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100"
                title="Add link"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => {
                  removeLink();
                  setShowLinkOptions(false);
                }}
                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100"
                title="Remove link"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Link Modal */}
        <Modal show={showLinkModal} onClose={() => setShowLinkModal(false)}>
          <ModalHeader>
            Add Link
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <Label htmlFor="link-url" value="URL" />
                <TextInput
                  id="link-url"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="link-text" value="Text (optional)" />
                <TextInput
                  id="link-text"
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                  className="mt-1"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-between w-full">
              <Button color="gray" onClick={() => setShowLinkModal(false)}>
                Cancel
              </Button>
              <Button 
                color="blue" 
                onClick={createLink}
                disabled={!linkUrl}
              >
                Add Link
              </Button>
            </div>
          </ModalFooter>
        </Modal>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={addItem}
            color="blue"
            size="sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Item
          </Button>

          {items.length > 1 && (
            <Button
              onClick={deleteAllItems}
              color="failure"
              outline
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete All
            </Button>
          )}
        </div>
      </div>
    </Card>
    </>
  )
}

export default ChecklistItems 