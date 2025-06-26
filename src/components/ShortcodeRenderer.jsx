import { useState, useEffect, useRef, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { formatDate } from '../utils/dateUtils'

const ShortcodeRenderer = ({ 
  checklistId, 
  instanceId, 
  settings = {}, 
  items = [], 
  permissions = {},
  priorityEnabled = false,
  priorityDisplayType = 'color',
  checklist = {}
}) => {
  const [checkedItems, setCheckedItems] = useState(new Set())
  const [shortcodeItems, setShortcodeItems] = useState([])
  const [countdownInterval, setCountdownInterval] = useState(null)
  const [inProgressItems, setInProgressItems] = useState(new Set())
  const [itemDeadlines, setItemDeadlines] = useState({})
  const [tooltip, setTooltip] = useState(null)
  const [tooltipTimer, setTooltipTimer] = useState(null)
  const containerRef = useRef(null)

  // Initialize state
  useEffect(() => {
    initializeItems()
    loadCheckedState()
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

  const getStorageKey = (type = 'checked') => {
    return `mcl_shortcode_${checklistId}_${instanceId}_${type}`
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

  const handleContentKeyDown = useCallback((e, itemId) => {
    if (!permissions.can_edit) return
    
    // Handle Enter key to add new item
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addNewItemAfter(itemId)
    }
  }, [permissions.can_edit])

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
    
    // Focus the new item
    setTimeout(() => {
      const newItemElement = document.querySelector(`[data-item-id="${newItem.id}"] .mcl-shortcode-item-content`)
      if (newItemElement) {
        newItemElement.focus()
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
  const toggleInProgress = (itemId) => {
    if (!permissions.can_edit) return
    
    setInProgressItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      
      // Update item
      const newItems = shortcodeItems.map(item => 
        item.id === itemId ? { ...item, inProgress: newSet.has(itemId) } : item
      )
      setShortcodeItems(newItems)
      saveItemsToServer(newItems)
      
      return newSet
    })
  }

  // Handle deadline click
  const handleDeadlineClick = (itemId) => {
    if (!permissions.can_edit) return
    
    const currentItem = shortcodeItems.find(item => item.id === itemId)
    const existingDeadline = currentItem?.deadline

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
        
        const newItems = shortcodeItems.map(item => 
          item.id === itemId ? { ...item, deadline: null } : item
        )
        setShortcodeItems(newItems)
        saveItemsToServer(newItems)
      } else {
        // Set new deadline
        const timestamp = Math.floor(new Date(newDeadline).getTime() / 1000)
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

  // Handle image insertion
  const handleImageClick = (itemId) => {
    if (!permissions.can_edit) return
    
    // Simple image URL prompt for now
    const imageUrl = prompt('Enter image URL:')
    if (imageUrl) {
      const currentItem = shortcodeItems.find(item => item.id === itemId)
      const imageHtml = `<br><img src="${imageUrl}" alt="Image" style="max-width: 200px; height: auto;" />`
      const newContent = (currentItem?.content || '') + imageHtml
      
      const newItems = shortcodeItems.map(item => 
        item.id === itemId ? { ...item, content: newContent } : item
      )
      setShortcodeItems(newItems)
      saveItemsToServer(newItems)
    }
  }

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
      const ajaxUrl = window.mclShortcode?.ajaxurl || '/wp-admin/admin-ajax.php'
      const nonce = window.mclShortcode?.nonce || ''

      const formData = new FormData()
      formData.append('action', 'mcl_save_checked_state')
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
      }
    } catch (error) {
      console.error('Failed to save state:', error)
    }
  }

  const saveItemsToServer = async (items) => {
    if (!permissions.can_edit) return
    
    try {
      const ajaxUrl = window.mclShortcode?.ajaxurl || '/wp-admin/admin-ajax.php'
      const nonce = window.mclShortcode?.nonce || ''

      const formData = new FormData()
      formData.append('action', 'mcl_update_checklist')
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
      const countdownElement = containerRef.current?.querySelector('.mcl-countdown')
      if (!countdownElement) return

      const now = Date.now()
      const remaining = deadlineTime - now

      if (remaining <= 0) {
        countdownElement.textContent = 'Expired'
        countdownElement.classList.add('mcl-expired')
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

      countdownElement.classList.remove('mcl-warning', 'mcl-urgent')
      if (remaining <= 2 * 60 * 60 * 1000) {
        countdownElement.classList.add('mcl-urgent')
      } else if (remaining <= 24 * 60 * 60 * 1000) {
        countdownElement.classList.add('mcl-warning')
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
          className={`mcl-priority-indicator mcl-priority-number ${clickable ? 'cursor-pointer' : ''}`}
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
          className={`mcl-priority-indicator ${clickable ? 'cursor-pointer' : ''}`}
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

  // Build CSS variables for styling
  const cssVariables = {
    '--mcl-shortcode-custom-width': `${settings.custom_width || 800}px`,
    '--mcl-shortcode-title-text-color': settings.title_text_color || '#000000',
    '--mcl-shortcode-description-text-color': settings.description_text_color || '#333333',
    '--mcl-shortcode-deadline-text-color': settings.deadline_text_color || '#ff0000',
    '--mcl-shortcode-list-item-text-color': settings.list_item_text_color || '#1a1a1a',
    '--mcl-shortcode-border-color': settings.border_color || '#e2e8f0',
    '--mcl-shortcode-checkbox-border-color': settings.checkbox_border_color || '#cccccc',
    '--mcl-shortcode-checkbox-color-filled': settings.checkbox_color_filled || '#0ea5e9',
    '--mcl-shortcode-checkbox-color-unfilled': settings.checkbox_color_unfilled || '#ffffff',
    '--mcl-shortcode-checkmark-color': settings.checkmark_color || '#ffffff',
    '--mcl-shortcode-bg': settings.bg_color || '#ffffff',
    '--mcl-shortcode-title-font-size': `${settings.title_font_size || 18}px`,
    '--mcl-shortcode-description-font-size': `${settings.description_font_size || 14}px`,
    '--mcl-shortcode-list-item-font-size': `${settings.list_item_font_size || 16}px`,
    '--mcl-shortcode-deadline-font-size': `${settings.deadline_font_size || 14}px`,
    '--mcl-shortcode-padding-block': `${settings.padding_block || 32}px`,
    '--mcl-shortcode-padding-inline': `${settings.padding_inline || 32}px`,
    '--mcl-shortcode-container-gap': `${settings.container_gap || 10}px`,
    '--mcl-shortcode-padding-block-mobile': `${Math.min(parseInt(settings.padding_block || 32), 24)}px`,
    '--mcl-shortcode-padding-inline-mobile': `${Math.min(parseInt(settings.padding_inline || 32), 24)}px`,
    '--mcl-shortcode-checkbox-dimensions': `${settings.checkbox_dimensions || 20}px`,
    '--mcl-shortcode-checkbox-border-radius': `${settings.checkbox_border_radius || 4}px`,
    '--mcl-shortcode-checkbox-border-thickness': `${settings.checkbox_border_thickness || 2}px`,
    '--mcl-shortcode-border-radius': `${settings.border_radius || 6}px`,
    '--mcl-shortcode-border-thickness': `${settings.border_thickness || 1}px`
  }

  // Build container classes
  const containerClasses = [
    'mcl-shortcode-container',
    `mcl-spacing-${settings.item_spacing || 'comfortable'}`,
    `mcl-border-${settings.border_type || 'none'}`
  ]

  if (settings.width === 'custom') {
    containerClasses.push('mcl-width-custom')
  } else if (settings.width === 'narrow') {
    containerClasses.push('mcl-width-narrow')
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

      {settings.show_title && (
        <h3 className="mcl-shortcode-title">
          {checklist.title}
        </h3>
      )}

      {settings.show_description && checklist.content && (
        <div 
          className="mcl-shortcode-description"
          dangerouslySetInnerHTML={{ __html: checklist.content }}
        />
      )}

      {settings.show_deadline && checklist.deadline && (
        <div className="mcl-shortcode-deadline mcl-countdown" data-deadline={checklist.deadline}>
          {formatDate(parseInt(checklist.deadline) * 1000, 'date')}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="shortcode-items" isDropDisabled={!settings.enable_reorder || !permissions.can_interact}>
          {(provided, snapshot) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`mcl-shortcode-items ${snapshot.isDraggingOver ? 'mcl-dragging-over' : ''}`}
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
                        className={`mcl-shortcode-item group ${isChecked ? 'mcl-shortcode-checked' : ''} ${snapshot.isDragging ? 'mcl-dragging' : ''} ${isInProgress ? 'mcl-in-progress' : ''}`}
                        data-item-id={item.id}
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
                        {settings.enable_reorder && permissions.can_interact && (
                          <span 
                            {...provided.dragHandleProps} 
                            className="mcl-item-drag-handle"
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
                        
                        <div className="mcl-item-main">
                          <label className="mcl-item-label">
                            <input
                              type="checkbox"
                              className="mcl-item-checkbox"
                              checked={isChecked}
                              onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                              disabled={!permissions.can_interact}
                              style={{
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                width: 'var(--mcl-shortcode-checkbox-dimensions)',
                                height: 'var(--mcl-shortcode-checkbox-dimensions)',
                                border: 'var(--mcl-shortcode-checkbox-border-thickness) solid var(--mcl-shortcode-checkbox-border-color)',
                                borderRadius: 'var(--mcl-shortcode-checkbox-border-radius)',
                                backgroundColor: isChecked ? 'var(--mcl-shortcode-checkbox-color-filled)' : 'var(--mcl-shortcode-checkbox-color-unfilled)',
                                position: 'relative',
                                cursor: permissions.can_interact ? 'pointer' : 'not-allowed',
                                margin: '0 8px 0 0',
                                transition: 'all 0.2s ease'
                              }}
                            />
                            
                            {/* Custom checkmark */}
                            {isChecked && (
                              <span
                                style={{
                                  position: 'absolute',
                                  left: '6px',
                                  top: '50%',
                                  width: '4px',
                                  height: '8px',
                                  border: 'solid var(--mcl-shortcode-checkmark-color)',
                                  borderWidth: '0 2px 2px 0',
                                  transform: 'translateY(-60%) rotate(45deg)',
                                  pointerEvents: 'none'
                                }}
                              />
                            )}

                            {settings.show_numbers === true && (
                              <span className="mcl-item-number" style={{ marginRight: '8px', opacity: '0.7' }}>
                                {index + 1}.
                              </span>
                            )}

                            {renderPriorityIndicator(item.priority, permissions.can_edit, () => cyclePriority(item.id))}

                            <div className="mcl-content-container">
                              <div
                                className="mcl-shortcode-item-content"
                                contentEditable={permissions.can_edit && !item.locked}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => handleContentBlur(e, item.id)}
                                onKeyDown={(e) => handleContentKeyDown(e, item.id)}
                                dangerouslySetInnerHTML={{ __html: item.content }}
                                style={{
                                  flex: '1',
                                  minWidth: '0',
                                  color: 'var(--mcl-shortcode-list-item-text-color)',
                                  fontSize: 'var(--mcl-shortcode-list-item-font-size)',
                                  lineHeight: '1.5',
                                  transition: 'opacity 0.2s ease',
                                  opacity: isChecked ? '0.8' : '1',
                                  cursor: permissions.can_edit && !item.locked ? 'text' : 'default',
                                  padding: '4px',
                                  borderRadius: '4px',
                                  outline: 'none',
                                  border: permissions.can_edit && !item.locked ? '1px solid transparent' : 'none'
                                }}
                              />

                              {/* Deadline Badge */}
                              {deadline && (
                                <div 
                                  className="mcl-deadline-badge"
                                  style={{
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    backgroundColor: '#fee2e2',
                                    color: '#991b1b',
                                    borderRadius: '12px',
                                    marginTop: '4px',
                                    cursor: permissions.can_edit ? 'pointer' : 'default'
                                  }}
                                  onClick={permissions.can_edit ? () => handleDeadlineClick(item.id) : undefined}
                                >
                                  Due: {formatDeadline(deadline)}
                                </div>
                              )}
                            </div>
                          </label>

                          {/* Action buttons - show on hover when can edit */}
                          {permissions.can_edit && !item.locked && (
                            <div 
                              className="mcl-item-actions" 
                              style={{
                                position: 'absolute',
                                top: '50%',
                                right: '8px',
                                transform: 'translateY(-50%)',
                                opacity: 0,
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
                                onMouseEnter={(e) => showTooltip(e.target, isInProgress ? 'Remove from in progress' : 'Mark as in progress')}
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
                                onMouseEnter={(e) => showTooltip(e.target, 'Set deadline')}
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
                                onMouseEnter={(e) => showTooltip(e.target, 'Add image')}
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
                                  onMouseEnter={(e) => showTooltip(e.target, 'Remove item')}
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

      {/* Add item button - only show when can edit */}
      {permissions.can_edit && (
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => addNewItemAfter(shortcodeItems[shortcodeItems.length - 1]?.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--mcl-shortcode-checkbox-color-filled)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--mcl-shortcode-border-radius)',
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
              e.target.style.backgroundColor = 'var(--mcl-shortcode-checkbox-color-filled)'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            Add Item
          </button>
        </div>
      )}
    </div>
  )
}

export default ShortcodeRenderer 