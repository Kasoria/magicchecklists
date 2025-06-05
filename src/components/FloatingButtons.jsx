import { useState, useEffect, useRef } from 'react'
import { Button } from 'flowbite-react'

const FloatingButtons = ({ activeChecklists = [], settings = {} }) => {
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false)
  const [containerClasses, setContainerClasses] = useState(['mcl-speed-dial-container'])
  const containerRef = useRef(null)

  useEffect(() => {
    const multi = activeChecklists.length > 1
    const classes = ['mcl-speed-dial-container']

    if (multi) {
      classes.push('mcl-multi-fab')
      
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
      classes.push('mcl-single-fab')
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

  const renderSpeedDial = () => {
    const hasAnyDraggable = activeChecklists.some(checklist => 
      checklist.buttonPosition === 'draggable'
    )

    return (
      <div 
        className="mcl-speed-dial-wrapper"
        data-draggable={hasAnyDraggable ? 'true' : 'false'}
      >
        {/* Speed Dial Items */}
        <div 
          className={`mcl-speed-dial-menu ${isSpeedDialOpen ? 'open' : ''}`}
          role="list"
        >
          {activeChecklists.map((checklist) => renderChecklistSpeedDialItem(checklist))}
        </div>

        {/* Speed Dial Trigger Button */}
        <Button
          className="mcl-speed-dial-trigger"
          size="lg"
          pill
          color="blue"
          onClick={toggleSpeedDial}
          aria-expanded={isSpeedDialOpen}
          aria-controls="speed-dial-menu"
          title="Toggle Checklists Menu"
        >
          <svg 
            className={`mcl-speed-dial-icon ${isSpeedDialOpen ? 'open' : ''}`}
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 5V19M5 12H19" 
              stroke="currentColor" 
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
      <div key={checklist.id} className="mcl-speed-dial-item">
        <Button
          className="mcl-speed-dial-button"
          data-checklist-id={checklist.id}
          size="sm"
          pill
          color={theme === 'dark' ? 'gray' : 'light'}
          title={checklist.title}
        >
          <div className="mcl-button-content">
            <svg 
              className="mcl-checklist-icon" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M15.9701 12.8006H12.8901C12.4701 12.8006 12.1401 12.4706 12.1401 12.0506C12.1401 11.6406 12.4701 11.3006 12.8901 11.3006H15.9701C16.3901 11.3006 16.7201 11.6406 16.7201 12.0506C16.7201 12.4706 16.3901 12.8006 15.9701 12.8006ZM15.9701 17.6506H12.8901C12.4701 17.6506 12.1401 17.3106 12.1401 16.9006C12.1401 16.4906 12.4701 16.1506 12.8901 16.1506H15.9701C16.3901 16.1506 16.7201 16.4906 16.7201 16.9006C16.7201 17.3106 16.3901 17.6506 15.9701 17.6506ZM10.8101 11.2106L9.33007 12.6906C9.18007 12.8406 8.99007 12.9106 8.80007 12.9106C8.60007 12.9106 8.41007 12.8406 8.27007 12.6906L7.50007 11.9306C7.21007 11.6306 7.21007 11.1606 7.50007 10.8706C7.80007 10.5706 8.27007 10.5706 8.57007 10.8706L8.80007 11.1006L9.75007 10.1506C10.0401 9.85056 10.5201 9.85056 10.8101 10.1506C11.1001 10.4406 11.1001 10.9106 10.8101 11.2106ZM10.8101 16.0506L9.33007 17.5406C9.19007 17.6806 9.00007 17.7606 8.80007 17.7606C8.60007 17.7606 8.41007 17.6806 8.27007 17.5406L7.50007 16.7806C7.21007 16.4806 7.21007 16.0106 7.51007 15.7106C7.80007 15.4206 8.27007 15.4206 8.57007 15.7106L8.80007 15.9506L9.75007 14.9906C10.0401 14.7006 10.5201 14.7006 10.8101 14.9906C11.1001 15.2906 11.1001 15.7606 10.8101 16.0506ZM16.8928 4.38212C16.7728 4.34667 16.6552 4.43627 16.6374 4.56011C16.4646 5.75625 15.4285 6.68056 14.1901 6.68056H9.81007C8.57169 6.68056 7.52694 5.75639 7.35293 4.56039C7.3349 4.43647 7.21714 4.34685 7.09711 4.38253C5.34579 4.90305 4.07007 6.53496 4.07007 8.46056V17.3606C4.07007 19.7006 5.97007 21.6106 8.32007 21.6106H15.6801C18.0301 21.6106 19.9301 19.7006 19.9301 17.3606V8.46056C19.9301 6.53445 18.6537 4.90219 16.8928 4.38212Z" 
                fill="currentColor"
              />
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M9.81357 5.48062H14.1936C14.8736 5.48062 15.4336 4.94062 15.4536 4.26063C15.4636 4.24063 15.4636 4.22062 15.4636 4.20062V3.66062C15.4636 2.96062 14.8936 2.39062 14.1936 2.39062H9.81357C9.11357 2.39062 8.53357 2.96062 8.53357 3.66062V4.20062C8.53357 4.22062 8.53357 4.23063 8.54357 4.25063C8.56357 4.94062 9.13357 5.48062 9.81357 5.48062Z" 
                fill="currentColor"
              />
            </svg>
            {priority !== 'none' && (
              <span 
                className="mcl-priority-indicator" 
                style={{ backgroundColor: priorityColor }}
                aria-label={`Priority: ${priority}`}
              />
            )}
          </div>
        </Button>
        
        {/* Tooltip */}
        <div className="mcl-tooltip" role="tooltip">
          {checklist.shortTitle || checklist.title}
          <div className="mcl-tooltip-arrow"></div>
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
        className="mcl-single-button-wrapper"
        data-draggable={isDraggable ? 'true' : 'false'}
      >
        <Button
          className="mcl-single-floating-button"
          data-checklist-id={checklist.id}
          data-position={position}
          size="lg"
          pill
          color={theme === 'dark' ? 'gray' : 'light'}
          title={checklist.title}
        >
          <div className="mcl-button-content">
            <svg 
              className="mcl-checklist-icon" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M15.9701 12.8006H12.8901C12.4701 12.8006 12.1401 12.4706 12.1401 12.0506C12.1401 11.6406 12.4701 11.3006 12.8901 11.3006H15.9701C16.3901 11.3006 16.7201 11.6406 16.7201 12.0506C16.7201 12.4706 16.3901 12.8006 15.9701 12.8006ZM15.9701 17.6506H12.8901C12.4701 17.6506 12.1401 17.3106 12.1401 16.9006C12.1401 16.4906 12.4701 16.1506 12.8901 16.1506H15.9701C16.3901 16.1506 16.7201 16.4906 16.7201 16.9006C16.7201 17.3106 16.3901 17.6506 15.9701 17.6506ZM10.8101 11.2106L9.33007 12.6906C9.18007 12.8406 8.99007 12.9106 8.80007 12.9106C8.60007 12.9106 8.41007 12.8406 8.27007 12.6906L7.50007 11.9306C7.21007 11.6306 7.21007 11.1606 7.50007 10.8706C7.80007 10.5706 8.27007 10.5706 8.57007 10.8706L8.80007 11.1006L9.75007 10.1506C10.0401 9.85056 10.5201 9.85056 10.8101 10.1506C11.1001 10.4406 11.1001 10.9106 10.8101 11.2106ZM10.8101 16.0506L9.33007 17.5406C9.19007 17.6806 9.00007 17.7606 8.80007 17.7606C8.60007 17.7606 8.41007 17.6806 8.27007 17.5406L7.50007 16.7806C7.21007 16.4806 7.21007 16.0106 7.51007 15.7106C7.80007 15.4206 8.27007 15.4206 8.57007 15.7106L8.80007 15.9506L9.75007 14.9906C10.0401 14.7006 10.5201 14.7006 10.8101 14.9906C11.1001 15.2906 11.1001 15.7606 10.8101 16.0506ZM16.8928 4.38212C16.7728 4.34667 16.6552 4.43627 16.6374 4.56011C16.4646 5.75625 15.4285 6.68056 14.1901 6.68056H9.81007C8.57169 6.68056 7.52694 5.75639 7.35293 4.56039C7.3349 4.43647 7.21714 4.34685 7.09711 4.38253C5.34579 4.90305 4.07007 6.53496 4.07007 8.46056V17.3606C4.07007 19.7006 5.97007 21.6106 8.32007 21.6106H15.6801C18.0301 21.6106 19.9301 19.7006 19.9301 17.3606V8.46056C19.9301 6.53445 18.6537 4.90219 16.8928 4.38212Z" 
                fill="currentColor"
              />
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M9.81357 5.48062H14.1936C14.8736 5.48062 15.4336 4.94062 15.4536 4.26063C15.4636 4.24063 15.4636 4.22062 15.4636 4.20062V3.66062C15.4636 2.96062 14.8936 2.39062 14.1936 2.39062H9.81357C9.11357 2.39062 8.53357 2.96062 8.53357 3.66062V4.20062C8.53357 4.22062 8.53357 4.23063 8.54357 4.25063C8.56357 4.94062 9.13357 5.48062 9.81357 5.48062Z" 
                fill="currentColor"
              />
            </svg>
            {priority !== 'none' && (
              <span 
                className="mcl-priority-indicator" 
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