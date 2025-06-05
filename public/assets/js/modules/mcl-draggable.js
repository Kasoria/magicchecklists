class MCLDraggable {
  constructor(drawer) {
    this.drawer = drawer;
    this.initialized = false;
    
    // Add initializing class to prevent flicker
    document.querySelectorAll('.mcl-single-button-wrapper[data-draggable="true"], .mcl-speed-dial-wrapper[data-draggable="true"]')
      .forEach(el => el.classList.add('initializing'));
  }

  init() {
    if (this.initialized) return;
    
    // Ensure interact is available
    if (typeof interact === 'undefined') {
      console.error('interact.js is not loaded');
      return;
    }

    // Initialize all draggable elements with their saved positions
    this.restoreAllPositions();
    this.initDraggableElements();
    
    // Handle window resize
    window.addEventListener('resize', this.adjustDraggableElementPositions.bind(this));
    
    this.initialized = true;
  }

  dragMoveListener(event) {
    const target = event.target;
    
    // Determine which element to move based on the target
    const elementToMove = target.closest('.mcl-speed-dial-container') || target;
    
    // Update position data
    const x = (parseFloat(elementToMove.getAttribute('data-x')) || 0) + event.dx;
    const y = (parseFloat(elementToMove.getAttribute('data-y')) || 0) + event.dy;

    // Apply transform
    elementToMove.style.transform = `translate(${x}px, ${y}px)`;
    elementToMove.setAttribute('data-x', x);
    elementToMove.setAttribute('data-y', y);
  }

  initDraggableElements() {
    // Shared draggable options
    const sharedOptions = {
      inertia: true,
      listeners: {
        move: this.dragMoveListener.bind(this)
      }
    };
    
    // Configure individual draggable single buttons
    interact('.mcl-single-button-wrapper[data-draggable="true"]')
      .draggable({
        ...sharedOptions,
        autoScroll: true,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: 'body',
            endOnly: true
          })
        ],
        listeners: {
          start: event => {
            const container = event.target.closest('.mcl-speed-dial-container');
            if (container) container.classList.add('mcl-dragging');
            event.target.classList.add('mcl-dragging');
          },
          move: this.dragMoveListener.bind(this),
          end: event => {
            const container = event.target.closest('.mcl-speed-dial-container');
            const wrapper = event.target;
            
            // Remove dragging classes
            if (container) container.classList.remove('mcl-dragging');
            wrapper.classList.remove('mcl-dragging');
            
            // Mark button as just dragged to prevent accidental clicks
            const button = wrapper.querySelector('.mcl-single-floating-button');
            if (button) {
              button.setAttribute('data-just-dragged', 'true');
              setTimeout(() => button.removeAttribute('data-just-dragged'), 100);
            }
            
            // Save position
            const checklistId = button?.dataset.checklistId;
            if (checklistId && container) {
              const x = parseFloat(container.getAttribute('data-x')) || 0;
              const y = parseFloat(container.getAttribute('data-y')) || 0;
              this.savePosition('single_' + checklistId, { x, y });
            }
          }
        }
      });

    // Configure draggable speed dial groups
    interact('.mcl-speed-dial-wrapper[data-draggable="true"]')
      .draggable({
        ...sharedOptions,
        autoScroll: false,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: 'body',
            endOnly: true
          })
        ],
        listeners: {
          start: event => {
            const container = event.target.closest('.mcl-speed-dial-container');
            if (container) container.classList.add('mcl-dragging');
            event.target.classList.add('mcl-dragging');
          },
          move: this.dragMoveListener.bind(this),
          end: event => {
            const container = event.target.closest('.mcl-speed-dial-container');
            const wrapper = event.target;
            
            // Remove dragging classes
            if (container) container.classList.remove('mcl-dragging');
            wrapper.classList.remove('mcl-dragging');
            
            // Mark trigger as just dragged to prevent accidental clicks
            const trigger = wrapper.querySelector('.mcl-speed-dial-trigger');
            if (trigger) {
              trigger.setAttribute('data-just-dragged', 'true');
              setTimeout(() => trigger.removeAttribute('data-just-dragged'), 100);
            }
            
            // Ensure the group stays within viewport after drag
            this.adjustGroupPosition(container, 5);
            
            // Save position for speed dial group
            const speedDialButtons = wrapper.querySelectorAll('.mcl-speed-dial-button[data-checklist-id]');
            if (speedDialButtons.length > 0 && container) {
              const firstId = speedDialButtons[0].dataset.checklistId;
              const x = parseFloat(container.getAttribute('data-x')) || 0;
              const y = parseFloat(container.getAttribute('data-y')) || 0;
              this.savePosition('group_' + firstId, { x, y });
            }
          }
        }
      });
  }

  adjustDraggableElementPositions() {
    // Adjust individual buttons
    document.querySelectorAll('.mcl-single-button-wrapper[data-draggable="true"]')
      .forEach(wrapper => {
        const container = wrapper.closest('.mcl-speed-dial-container');
        if (container) this.adjustElementPosition(container);
      });

    // Adjust speed dial groups
    document.querySelectorAll('.mcl-speed-dial-wrapper[data-draggable="true"]')
      .forEach(wrapper => {
        const container = wrapper.closest('.mcl-speed-dial-container');
        if (container) this.adjustGroupPosition(container, 5);
      });
  }
  
  adjustElementPosition(container) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const rect = container.getBoundingClientRect();
    
    let x = parseFloat(container.getAttribute('data-x')) || 0;
    let y = parseFloat(container.getAttribute('data-y')) || 0;

    // Calculate current visual position
    const currentLeft = rect.left - x;
    const currentTop = rect.top - y;
    
    // Check if element needs adjustment
    let newX = x;
    let newY = y;
    const minVisible = 5;

    if (rect.left < -rect.width + minVisible) {
      newX = x - (rect.left + rect.width - minVisible);
    } else if (rect.right > viewportWidth - minVisible) {
      newX = x - (rect.right - viewportWidth + minVisible);
    }

    if (rect.top < -rect.height + minVisible) {
      newY = y - (rect.top + rect.height - minVisible);
    } else if (rect.bottom > viewportHeight - minVisible) {
      newY = y - (rect.bottom - viewportHeight + minVisible);
    }
    
    // Apply position change if needed
    if (newX !== x || newY !== y) {
      container.style.transform = `translate(${newX}px, ${newY}px)`;
      container.setAttribute('data-x', newX);
      container.setAttribute('data-y', newY);
    }
  }
  
  adjustGroupPosition(container, minVisiblePx = 5) {
    if (!container) return;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get the container dimensions
    const rect = container.getBoundingClientRect();
    
    // Get current transform values
    let x = parseFloat(container.getAttribute('data-x')) || 0;
    let y = parseFloat(container.getAttribute('data-y')) || 0;
    
    // Calculate adjustments needed
    let newX = x;
    let newY = y;
    
    // Only adjust if element is actually outside the viewport boundary minus threshold
    if (rect.left < -rect.width + minVisiblePx) {
      newX = x - (rect.left + rect.width - minVisiblePx);
    } else if (rect.right > viewportWidth - minVisiblePx) {
      newX = x - (rect.right - viewportWidth + minVisiblePx);
    }
    
    if (rect.top < -rect.height + minVisiblePx) {
      newY = y - (rect.top + rect.height - minVisiblePx);
    } else if (rect.bottom > viewportHeight - minVisiblePx) {
      newY = y - (rect.bottom - viewportHeight + minVisiblePx);
    }
    
    // Apply position change if needed
    if (newX !== x || newY !== y) {
      container.style.transform = `translate(${newX}px, ${newY}px)`;
      container.setAttribute('data-x', newX);
      container.setAttribute('data-y', newY);
      
      // Update positioning class for menu direction if this is a speed dial
      const yPos = rect.top + (newY - y);
      if (yPos < viewportHeight / 2) {
        container.classList.add('mcl-positioned-top');
      } else {
        container.classList.remove('mcl-positioned-top');
      }
    }
  }

  getStoredPosition(elementId) {
    try {
      const stored = localStorage.getItem(`mcl_element_position_${elementId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading stored position:', error);
      return null;
    }
  }

  savePosition(elementId, position) {
    try {
      localStorage.setItem(
        `mcl_element_position_${elementId}`,
        JSON.stringify(position)
      );
    } catch (error) {
      console.error('Error saving position:', error);
    }
  }

  restoreAllPositions() {
    // Restore individual draggable single buttons
    document.querySelectorAll('.mcl-single-button-wrapper[data-draggable="true"]')
      .forEach(wrapper => {
        const button = wrapper.querySelector('.mcl-single-floating-button[data-checklist-id]');
        const container = wrapper.closest('.mcl-speed-dial-container');
        
        if (!button || !container) return;
        
        const checklistId = button.dataset.checklistId;
        if (!checklistId) return;
        
        const position = this.getStoredPosition('single_' + checklistId);
        this.applyPosition(container, position);
      });

    // Restore speed dial groups
    document.querySelectorAll('.mcl-speed-dial-wrapper[data-draggable="true"]')
      .forEach(wrapper => {
        const container = wrapper.closest('.mcl-speed-dial-container');
        if (!container) return;
        
        // Check if we have a stored position for the speed dial group
        const speedDialButtons = wrapper.querySelectorAll('.mcl-speed-dial-button[data-checklist-id]');
        let position = null;
        
        if (speedDialButtons.length > 0) {
          const firstId = speedDialButtons[0].dataset.checklistId;
          if (firstId) {
            position = this.getStoredPosition('group_' + firstId);
          }
        }
        
        this.applyPosition(container, position);
      });
  }

  applyPosition(container, position) {
    if (!container) return;
    
    if (position) {
      // Apply saved position
      container.style.transform = `translate(${position.x}px, ${position.y}px)`;
      container.setAttribute('data-x', position.x);
      container.setAttribute('data-y', position.y);
    } else {
      // Use default position (0,0 relative to CSS positioning)
      container.style.transform = 'translate(0px, 0px)';
      container.setAttribute('data-x', 0);
      container.setAttribute('data-y', 0);
    }
    
    // Ensure it's within viewport bounds and remove initializing class
    requestAnimationFrame(() => {
      this.adjustElementPosition(container);
      container.classList.remove('initializing');
      
      // Remove initializing class from children
      const wrapper = container.querySelector('.mcl-single-button-wrapper, .mcl-speed-dial-wrapper');
      if (wrapper) wrapper.classList.remove('initializing');
    });
  }

  resetElementPosition(elementId) {
    localStorage.removeItem(`mcl_element_position_${elementId}`);
    
    // Find and reset the element
    const button = document.querySelector(`.mcl-single-floating-button[data-checklist-id="${elementId}"], .mcl-speed-dial-button[data-checklist-id="${elementId}"]`);
    if (button) {
      const container = button.closest('.mcl-speed-dial-container');
      if (container) {
        container.style.transform = 'translate(0px, 0px)';
        container.removeAttribute('data-x');
        container.removeAttribute('data-y');
      }
    }
  }

  resetAllDraggablePositions() {
    // Clear all stored positions
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mcl_element_position_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Reset all containers
    document.querySelectorAll('.mcl-speed-dial-container').forEach(container => {
      container.style.transform = 'translate(0px, 0px)';
      container.setAttribute('data-x', 0);
      container.setAttribute('data-y', 0);
      container.classList.remove('mcl-positioned-top');
    });
  }

  destroy() {
    if (!this.initialized) return;
    
    try {
      // Remove all interact instances
      interact('.mcl-single-button-wrapper[data-draggable="true"]').unset();
      interact('.mcl-speed-dial-wrapper[data-draggable="true"]').unset();
      
      this.initialized = false;
    } catch (error) {
      console.error('Error destroying draggable:', error);
    }
  }
}

export default MCLDraggable;