import { useState, useEffect, useRef } from 'react'
import { Button } from 'flowbite-react'

const FloatingButtons = ({ activeChecklists = [], settings = {} }) => {
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false)
  const [containerClasses, setContainerClasses] = useState(['magiccl-speed-dial-container'])
  const containerRef = useRef(null)
  
  // Define preset icon collection
  const presetIcons = {
    'checklist-1': '<path fillRule="evenodd" clipRule="evenodd" d="M15.9701 12.8006H12.8901C12.4701 12.8006 12.1401 12.4706 12.1401 12.0506C12.1401 11.6406 12.4701 11.3006 12.8901 11.3006H15.9701C16.3901 11.3006 16.7201 11.6406 16.7201 12.0506C16.7201 12.4706 16.3901 12.8006 15.9701 12.8006ZM15.9701 17.6506H12.8901C12.4701 17.6506 12.1401 17.3106 12.1401 16.9006C12.1401 16.4906 12.4701 16.1506 12.8901 16.1506H15.9701C16.3901 16.1506 16.7201 16.4906 16.7201 16.9006C16.7201 17.3106 16.3901 17.6506 15.9701 17.6506ZM10.8101 11.2106L9.33007 12.6906C9.18007 12.8406 8.99007 12.9106 8.80007 12.9106C8.60007 12.9106 8.41007 12.8406 8.27007 12.6906L7.50007 11.9306C7.21007 11.6306 7.21007 11.1606 7.50007 10.8706C7.80007 10.5706 8.27007 10.5706 8.57007 10.8706L8.80007 11.1006L9.75007 10.1506C10.0401 9.85056 10.5201 9.85056 10.8101 10.1506C11.1001 10.4406 11.1001 10.9106 10.8101 11.2106ZM10.8101 16.0506L9.33007 17.5406C9.19007 17.6806 9.00007 17.7606 8.80007 17.7606C8.60007 17.7606 8.41007 17.6806 8.27007 17.5406L7.50007 16.7806C7.21007 16.4806 7.21007 16.0106 7.51007 15.7106C7.80007 15.4206 8.27007 15.4206 8.57007 15.7106L8.80007 15.9506L9.75007 14.9906C10.0401 14.7006 10.5201 14.7006 10.8101 14.9906C11.1001 15.2906 11.1001 15.7606 10.8101 16.0506ZM16.8928 4.38212C16.7728 4.34667 16.6552 4.43627 16.6374 4.56011C16.4646 5.75625 15.4285 6.68056 14.1901 6.68056H9.81007C8.57169 6.68056 7.52694 5.75639 7.35293 4.56039C7.3349 4.43647 7.21714 4.34685 7.09711 4.38253C5.34579 4.90305 4.07007 6.53496 4.07007 8.46056V17.3606C4.07007 19.7006 5.97007 21.6106 8.32007 21.6106H15.6801C18.0301 21.6106 19.9301 19.7006 19.9301 17.3606V8.46056C19.9301 6.53445 18.6537 4.90219 16.8928 4.38212Z" fill="currentColor"/><path fillRule="evenodd" clipRule="evenodd" d="M9.81357 5.48062H14.1936C14.8736 5.48062 15.4336 4.94062 15.4536 4.26063C15.4636 4.24063 15.4636 4.22062 15.4636 4.20062V3.66062C15.4636 2.96062 14.8936 2.39062 14.1936 2.39062H9.81357C9.11357 2.39062 8.53357 2.96062 8.53357 3.66062V4.20062C8.53357 4.22062 8.53357 4.23063 8.54357 4.25063C8.56357 4.94062 9.13357 5.48062 9.81357 5.48062Z" fill="currentColor"/>',
    'tasks-1': '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.692 7.889h4.52M11.692 12h4.52m-4.52 4.111h4.52M8.066 8.506a.617.617 0 1 0 0-1.234a.617.617 0 0 0 0 1.234m0 4.111a.617.617 0 1 0 0-1.234a.617.617 0 0 0 0 1.234m0 4.111a.617.617 0 1 0 0-1.234a.617.617 0 0 0 0 1.234"/><rect width="18.5" height="18.5" x="2.75" y="2.75" rx="6"/></g>',
    'task-2': '<path fill="currentColor" d="M15.25 2h-6.5A6.76 6.76 0 0 0 2 8.75v6.5A6.75 6.75 0 0 0 8.75 22h6.5A6.75 6.75 0 0 0 22 15.25v-6.5A6.76 6.76 0 0 0 15.25 2M8.04 17.48a1.37 1.37 0 1 1 1.37-1.37a1.36 1.36 0 0 1-1.37 1.37m0-4.11A1.37 1.37 0 1 1 9.41 12a1.36 1.36 0 0 1-1.37 1.42zm0-4.11a1.37 1.37 0 1 1 1.37-1.37a1.36 1.36 0 0 1-1.37 1.37m8.15 7.6h-4.52a.75.75 0 1 1 0-1.5h4.52a.75.75 0 1 1 0 1.5m0-4.11h-4.52a.75.75 0 1 1 0-1.5h4.52a.75.75 0 1 1 0 1.5m0-4.11h-4.52a.75.75 0 0 1 0-1.5h4.52a.75.75 0 1 1 0 1.5"/>',
    'list-1': '<path fill="currentColor" d="M9 8.5a.5.5 0 0 1 .5-.5H13a.5.5 0 0 1 0 1H9.5a.5.5 0 0 1-.5-.5Zm0 3a.5.5 0 0 1 .5-.5H13a.5.5 0 0 1 0 1H9.5a.5.5 0 0 1-.5-.5Zm0 3a.5.5 0 0 1 .5-.5H13a.5.5 0 0 1 0 1H9.5a.5.5 0 0 1-.5-.5Zm-1-6a.75.75 0 1 1-1.5 0a.75.75 0 0 1 1.5 0Zm0 3a.75.75 0 1 1-1.5 0a.75.75 0 0 1 1.5 0Zm-.75 3.75a.75.75 0 1 0 0-1.5a.75.75 0 0 0 0 1.5ZM7.085 3A1.5 1.5 0 0 1 8.5 2h3a1.5 1.5 0 0 1 1.415 1H14.5A1.5 1.5 0 0 1 16 4.5v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 16.5v-12A1.5 1.5 0 0 1 5.5 3h1.585ZM8.5 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3ZM7.085 4H5.5a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-12a.5.5 0 0 0-.5-.5h-1.585A1.5 1.5 0 0 1 11.5 5h-3a1.5 1.5 0 0 1-1.415-1Z"/>',
    'checklist-2': '<text x="12" y="18" text-anchor="middle" font-size="20" fill="currentColor">✅</text>',
    'document-1': '<text x="12" y="18" text-anchor="middle" font-size="20" fill="currentColor">📄</text>',
    'check-square': '<text x="12" y="18" text-anchor="middle" font-size="20" fill="currentColor">☑️</text>',
    'file-text': '<text x="12" y="18" text-anchor="middle" font-size="20" fill="currentColor">📝</text>',
    'folder': '<text x="12" y="18" text-anchor="middle" font-size="20" fill="currentColor">📁</text>'
  }

  useEffect(() => {
    const multi = activeChecklists.length > 1
    const classes = ['magiccl-speed-dial-container']

    if (multi) {
      classes.push('magiccl-multi-fab')
      
      // Check if any checklist within the FAB group is set to be draggable
      const hasAnyDraggable = activeChecklists.some(checklist => 
        checklist.buttonPosition === 'draggable'
      )
      
      if (hasAnyDraggable) {
        classes.push('has-draggable-fab')
      } else {
        classes.push('position-bottom-right')
      }
    } else if (activeChecklists.length === 1) {
      classes.push('magiccl-single-fab')
      const firstChecklist = activeChecklists[0]
      const positionSetting = firstChecklist.buttonPosition || 'bottom-right'

      if (positionSetting === 'draggable') {
        classes.push('has-draggable')
      } else {
        classes.push(`position-${positionSetting}`)
      }
    }

    setContainerClasses(classes)
  }, [activeChecklists])

  // Close speed-dial when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsSpeedDialOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [containerRef])

  // Make speed-dial draggable at all times
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let isDragging = false
    let startX = 0
    let startY = 0
    let origLeft = 0
    let origTop = 0
    let moved = false

    const handleMouseDown = (e) => {
      // Only start dragging when clicking on the wrapper element
      const wrapperEl = container.querySelector('.magiccl-speed-dial-wrapper') || container.querySelector('.magiccl-single-button-wrapper')
      if (!wrapperEl || !wrapperEl.contains(e.target)) return

      isDragging = true
      container.classList.add('magiccl-dragging')
      startX = e.clientX
      startY = e.clientY
      const rect = container.getBoundingClientRect()
      origLeft = rect.left
      origTop = rect.top
      e.preventDefault()
    }

    const handleMouseMove = (e) => {
      if (!isDragging) return
      moved = true
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      let newLeft = origLeft + dx
      let newTop = origTop + dy
      const { width, height } = container.getBoundingClientRect()
      const maxLeft = window.innerWidth - width
      const maxTop = window.innerHeight - height
      if (newLeft < 0) newLeft = 0
      else if (newLeft > maxLeft) newLeft = maxLeft
      if (newTop < 0) newTop = 0
      else if (newTop > maxTop) newTop = maxTop
      container.style.left = `${newLeft}px`
      container.style.top = `${newTop}px`
      container.style.right = 'auto'
      container.style.bottom = 'auto'
    }

    const handleMouseUp = () => {
      if (!isDragging) return
      isDragging = false
      container.classList.remove('magiccl-dragging')
      if (moved) {
        const swallowClick = (evt) => {
          evt.preventDefault()
          evt.stopPropagation()
          container.removeEventListener('click', swallowClick, true)
        }
        container.addEventListener('click', swallowClick, true)
      }
      moved = false
    }

    const handleTouchStart = (e) => {
      const touch = e.touches[0]
      const target = touch.target
      
      // Only start dragging when clicking on the wrapper element
      const wrapperEl = container.querySelector('.magiccl-speed-dial-wrapper') || container.querySelector('.magiccl-single-button-wrapper')
      if (!wrapperEl || !wrapperEl.contains(target)) return

      // Store initial touch info without preventing defaults yet
      isDragging = false
      startX = touch.clientX
      startY = touch.clientY
      const rect = container.getBoundingClientRect()
      origLeft = rect.left
      origTop = rect.top
      moved = false

      // Set up temporary listeners for this touch session
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
    }

    const handleTouchMove = (e) => {
      const touch = e.touches[0]
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Only start dragging if user moves more than threshold (10px)
      if (!isDragging && distance > 10) {
        isDragging = true
        container.classList.add('magiccl-dragging')
        e.preventDefault() // Now prevent scrolling since we're dragging
      }

      if (isDragging) {
        moved = true
        const newLeft = origLeft + dx
        const newTop = origTop + dy
        const { width, height } = container.getBoundingClientRect()
        const maxLeft = window.innerWidth - width
        const maxTop = window.innerHeight - height
        
        let constrainedLeft = newLeft
        let constrainedTop = newTop
        
        if (constrainedLeft < 0) constrainedLeft = 0
        else if (constrainedLeft > maxLeft) constrainedLeft = maxLeft
        if (constrainedTop < 0) constrainedTop = 0
        else if (constrainedTop > maxTop) constrainedTop = maxTop
        
        container.style.left = `${constrainedLeft}px`
        container.style.top = `${constrainedTop}px`
        container.style.right = 'auto'
        container.style.bottom = 'auto'
      }
    }

    const handleTouchEnd = () => {
      if (isDragging) {
        container.classList.remove('magiccl-dragging')
        if (moved) {
          const swallowClick = (evt) => {
            evt.preventDefault()
            evt.stopPropagation()
            container.removeEventListener('click', swallowClick, true)
          }
          container.addEventListener('click', swallowClick, true)
        }
      }
      
      isDragging = false
      moved = false
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  const toggleSpeedDial = () => {
    setIsSpeedDialOpen(!isSpeedDialOpen)
  }

  const getThemeForButton = (theme) => {
    switch (theme) {
      case 'dark':
        return 'dark'
      case 'light':
      default:
        return 'light'
    }
  }

  // Get button styles based on theme
  const getButtonStyles = (checklist) => {
    const theme = checklist.theme
    let styles = {}

    if (theme === 'custom') {
      // Use custom theme colors
      styles.backgroundColor = checklist.float_button_bg || '#ffffff'
      styles.color = checklist.float_button_text_color || '#1a1a1a'
      styles.borderColor = checklist.float_button_bg || '#ffffff'
    }

    return styles
  }

  // Render icon based on type
  const renderIcon = (checklist, size = 20) => {
    const iconType = checklist.checklist_icon_type || 'preset'
    
    if (iconType === 'custom' && checklist.checklist_icon_custom) {
      return (
        <img 
          src={checklist.checklist_icon_custom} 
          alt="Checklist icon" 
          className="magiccl-checklist-icon"
          style={{ width: size, height: size }}
        />
      )
    } else {
      // Use preset icon
      const presetId = checklist.checklist_icon_preset || 'checklist-1'
      const iconSvg = presetIcons[presetId] || presetIcons['checklist-1']
      
      return (
        <svg 
          className="magiccl-checklist-icon" 
          width={size} 
          height={size} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          dangerouslySetInnerHTML={{ __html: iconSvg }}
        />
      )
    }
  }

  const renderSpeedDial = () => {
    const hasAnyDraggable = activeChecklists.some(checklist => 
      checklist.buttonPosition === 'draggable'
    )

    return (
      <div 
        className="magiccl-speed-dial-wrapper"
        data-draggable="true"
      >
        {/* Speed Dial Items */}
        <div 
          className={`magiccl-speed-dial-menu ${isSpeedDialOpen ? 'open' : ''}`}
          role="list"
        >
          {activeChecklists.map((checklist) => renderChecklistSpeedDialItem(checklist))}
        </div>

        {/* Speed Dial Trigger Button */}
        <Button
          className="magiccl-speed-dial-trigger rounded-full w-[50px] h-[50px] border-2 border-gray-700"
          size="lg"
          color="brand-dark"
          onClick={toggleSpeedDial}
          aria-expanded={isSpeedDialOpen}
          aria-controls="speed-dial-menu"
          title="Toggle Checklists Menu"
          style={{
            backgroundColor: settings.speed_dial_bg_color || '#374151',
            borderColor: settings.speed_dial_bg_color || '#374151'
          }}
        >
          <svg 
            className={`magiccl-speed-dial-icon shrink-0 ${isSpeedDialOpen ? 'open' : ''}`}
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 5V19M5 12H19" 
              stroke={settings.speed_dial_icon_color || '#ffffff'}
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span className="sr-only">Toggle Checklists Menu</span>
        </Button>
      </div>
    )
  }

  const renderChecklistSpeedDialItem = (checklist) => {
    const theme = getThemeForButton(checklist.theme)
    const priority = checklist.priority || 'none'
    const priorityColor = checklist.priorityColor || '#cccccc'

    return (
      <div key={checklist.id} className="magiccl-speed-dial-item">
        <Button
          className="magiccl-speed-dial-button"
          data-checklist-id={checklist.id}
          size="sm"
          pill
          color={checklist.theme === 'custom' ? undefined : (theme === 'dark' ? 'gray' : 'light')}
          style={checklist.theme === 'custom' ? getButtonStyles(checklist) : {}}
          title={checklist.title}
        >
          <div className="magiccl-button-content">
            {renderIcon(checklist, 16)}
            {priority !== 'none' && (
              <span 
                className="magiccl-priority-indicator" 
                style={{ backgroundColor: priorityColor }}
                aria-label={`Priority: ${priority}`}
              />
            )}
          </div>
        </Button>
        
        {/* Tooltip */}
        <div className="magiccl-tooltip" role="tooltip">
          {checklist.shortTitle || checklist.title}
          <div className="magiccl-tooltip-arrow"></div>
        </div>
      </div>
    )
  }

  const renderSingleButton = (checklist) => {
    const theme = getThemeForButton(checklist.theme)
    const priority = checklist.priority || 'none'
    const priorityColor = checklist.priorityColor || '#cccccc'
    const position = checklist.buttonPosition || 'bottom-right'
    const isDraggable = position === 'draggable'

    return (
      <div 
        key={checklist.id}
        className="magiccl-single-button-wrapper"
        data-draggable="true"
      >
        <Button
          className="magiccl-single-floating-button"
          data-checklist-id={checklist.id}
          data-position={position}
          size="lg"
          pill
          color={checklist.theme === 'custom' ? undefined : (theme === 'dark' ? 'gray' : 'light')}
          style={checklist.theme === 'custom' ? getButtonStyles(checklist) : {}}
          title={checklist.title}
        >
          <div className="magiccl-button-content">
            {renderIcon(checklist, 20)}
            {priority !== 'none' && (
              <span 
                className="magiccl-priority-indicator" 
                style={{ backgroundColor: priorityColor }}
                aria-label={`Priority: ${priority}`}
              />
            )}
          </div>
        </Button>
      </div>
    )
  }

  if (activeChecklists.length === 0) {
    return null
  }

  const isMulti = activeChecklists.length > 1

  return (
    <div className={containerClasses.join(' ')} ref={containerRef}>
      {isMulti ? renderSpeedDial() : activeChecklists.map(checklist => renderSingleButton(checklist))}
    </div>
  )
}

export default FloatingButtons 