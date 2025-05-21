class MCLDraggable {
  constructor(drawer) {
    this.drawer = drawer;
    this.initialized = false;
    
    // Add initializing class to prevent flicker
    document.querySelectorAll('.mcl-floating-button.draggable, .mcl-floating-buttons.has-draggable-fab')
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
    
    // Determine which element to move (either the dragged element or its container)
    const elementToMove = target.dataset.dragTargetContainer === 'true' 
      ? target.closest('.mcl-floating-buttons') || target 
      : target;
    
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
        move: this.dragMoveListener
      }
    };
    
    // Configure individual draggable buttons
    interact('.mcl-floating-button.draggable:not([data-drag-target-container="true"])')
      .draggable({
        ...sharedOptions,
        autoScroll: true,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: 'parent',
            endOnly: true
          })
        ],
        listeners: {
          start: event => event.target.classList.add('mcl-dragging'),
          move: this.dragMoveListener,
          end: event => {
            const target = event.target;
            
            // Remove dragging class
            target.classList.remove('mcl-dragging');
            
            // Mark as just dragged to prevent accidental clicks
            target.setAttribute('data-just-dragged', 'true');
            
            // Save position
            const checklistId = target.dataset.checklistId;
            if (checklistId) {
              const x = parseFloat(target.getAttribute('data-x')) || 0;
              const y = parseFloat(target.getAttribute('data-y')) || 0;
              this.savePosition(checklistId, { x, y });
            }
          }
        }
      });

    // Configure draggable FAB triggers (group container)
    interact('.draggable[data-drag-target-container="true"]')
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
            const fabContainer = event.target.closest('.mcl-floating-buttons');
            if (fabContainer) fabContainer.classList.add('mcl-dragging');
            event.target.classList.add('mcl-fab-trigger-dragging');
          },
          move: this.dragMoveListener,
          end: event => {
            const fabContainer = event.target.closest('.mcl-floating-buttons');
            if (fabContainer) {
              fabContainer.classList.remove('mcl-dragging');
              fabContainer.setAttribute('data-just-dragged', 'true');
              
              // Ensure the FAB stays within viewport after drag
              // Use a smaller threshold for manual drag operations
              this.adjustGroupPosition(fabContainer, 5);
            }
            event.target.classList.remove('mcl-fab-trigger-dragging');
          }
        }
      });
  }

  adjustDraggableElementPositions() {
    // Adjust individual buttons
    document.querySelectorAll('.mcl-floating-button.draggable:not([data-drag-target-container="true"])')
      .forEach(this.adjustElementPosition.bind(this));

    // Adjust FAB groups
    document.querySelectorAll('.mcl-floating-buttons.has-draggable-fab')
      .forEach(container => this.adjustGroupPosition(container, 5));
  }
  
  adjustElementPosition(element) {
    const parentElement = element.parentElement;
    if (!parentElement) return;

    const rect = element.getBoundingClientRect();
    const parentRect = parentElement.getBoundingClientRect();
    
    let x = parseFloat(element.getAttribute('data-x')) || 0;
    let y = parseFloat(element.getAttribute('data-y')) || 0;

    // Calculate current visual position relative to parent
    const currentVisualLeft = element.offsetLeft + x;
    const currentVisualTop = element.offsetTop + y;
    
    // Check if element is outside the parent boundaries
    let newX = x;
    let newY = y;

    if (currentVisualLeft < 0) newX = -element.offsetLeft;
    if (currentVisualTop < 0) newY = -element.offsetTop;
    if (currentVisualLeft + rect.width > parentRect.width) 
      newX = parentRect.width - rect.width - element.offsetLeft;
    if (currentVisualTop + rect.height > parentRect.height) 
      newY = parentRect.height - rect.height - element.offsetTop;
    
    // Apply position change if needed
    if (newX !== x || newY !== y) {
      element.style.transform = `translate(${newX}px, ${newY}px)`;
      element.setAttribute('data-x', newX);
      element.setAttribute('data-y', newY);

      // Save the updated position
      const checklistId = element.dataset.checklistId;
      if (checklistId) {
        this.savePosition(checklistId, { x: newX, y: newY });
      }
    }
  }
  
  adjustGroupPosition(fabGroup, minVisiblePx = 5) {
    if (!fabGroup) return;
    
    // Get viewport dimensions
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    
    // Get the FAB group dimensions
    const groupRect = fabGroup.getBoundingClientRect();
    
    // Get current transform values
    let x = parseFloat(fabGroup.getAttribute('data-x')) || 0;
    let y = parseFloat(fabGroup.getAttribute('data-y')) || 0;
    
    // Current position in the viewport
    const fabLeft = groupRect.left;
    const fabTop = groupRect.top;
    const fabRight = groupRect.right;
    const fabBottom = groupRect.bottom;
    
    // Calculate adjustments needed
    let newX = x;
    let newY = y;
    
    // Only adjust if element is actually outside the viewport boundary minus threshold
    if (fabLeft < -groupRect.width + minVisiblePx) {
      newX = x - (fabLeft + groupRect.width - minVisiblePx);
    } else if (fabRight > viewportWidth - minVisiblePx) {
      newX = x - (fabRight - viewportWidth + minVisiblePx);
    }
    
    if (fabTop < -groupRect.height + minVisiblePx) {
      newY = y - (fabTop + groupRect.height - minVisiblePx);
    } else if (fabBottom > viewportHeight - minVisiblePx) {
      newY = y - (fabBottom - viewportHeight + minVisiblePx);
    }
    
    // Apply position change if needed
    if (newX !== x || newY !== y) {
      fabGroup.style.transform = `translate(${newX}px, ${newY}px)`;
      fabGroup.setAttribute('data-x', newX);
      fabGroup.setAttribute('data-y', newY);
      
      // If there's a FAB list open, update its position as well
      const fabList = fabGroup.querySelector('.mcl-fab-list');
      if (fabList && fabList.offsetParent !== null) {
        this.adjustFabListPosition(fabList, fabGroup);
      }
    }
  }
  
  adjustFabListPosition(fabList, fabGroup) {
    // This method adjusts the FAB list position if needed
    // It's called when the FAB group position is adjusted while the list is open
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
    // Restore individual draggable buttons
    document.querySelectorAll('.mcl-floating-button.draggable:not([data-drag-target-container="true"])')
      .forEach(button => {
        const checklistId = button.dataset.checklistId;
        if (!checklistId) return;
        
        const position = this.getStoredPosition(checklistId);
        this.applyPosition(button, position, true);
      });

    // Initialize FAB groups
    document.querySelectorAll('.mcl-floating-buttons.has-draggable-fab')
      .forEach(container => {
        // Check if we have a stored position for the FAB group
        const firstFabTrigger = container.querySelector('.mcl-multi-fab-trigger.draggable');
        let position = null;
        
        if (firstFabTrigger) {
          // Try to get position from a stored checklist ID if available
          const checklistElements = container.querySelectorAll('.mcl-fab-list .mcl-floating-button[data-checklist-id]');
          if (checklistElements.length > 0) {
            const firstId = checklistElements[0].dataset.checklistId;
            if (firstId) {
              position = this.getStoredPosition('fab_group_' + firstId);
            }
          }
        }
        
        if (position) {
          // Apply saved position
          container.style.transform = `translate(${position.x}px, ${position.y}px)`;
          container.setAttribute('data-x', position.x);
          container.setAttribute('data-y', position.y);
        } else {
          // Use default position
          container.style.transform = 'translate(0px, 0px)';
          container.setAttribute('data-x', 0);
          container.setAttribute('data-y', 0);
        }
        
        // Ensure it's within viewport bounds after setting initial position
        // but use a minimal threshold to allow positioning near edges
        requestAnimationFrame(() => {
          // Use minimal threshold for initial positioning
          this.adjustGroupPosition(container, 5);
          container.classList.remove('initializing');
          container.style.visibility = 'visible';
        });
      });
  }

  applyPosition(element, position, isIndividualButton = false) {
    if (!position && isIndividualButton) {
      // Default position for new buttons (bottom-right)
      element.style.visibility = 'hidden';
      
      requestAnimationFrame(() => {
        const parentRect = element.parentElement.getBoundingClientRect();
        const buttonRect = element.getBoundingClientRect();
        
        // Position 20px from the bottom-right corner
        const x = parentRect.width - buttonRect.width - 20;
        const y = parentRect.height - buttonRect.height - 20;

        element.style.transform = `translate(${x}px, ${y}px)`;
        element.setAttribute('data-x', x);
        element.setAttribute('data-y', y);
        element.style.visibility = 'visible';
        element.classList.remove('initializing');
      });
    } else if (position) {
      // Apply saved position
      element.style.transform = `translate(${position.x}px, ${position.y}px)`;
      element.setAttribute('data-x', position.x);
      element.setAttribute('data-y', position.y);
      
      requestAnimationFrame(() => {
        element.style.visibility = 'visible';
        element.classList.remove('initializing');
      });
    } else {
      // Reset to default position (0,0)
      element.style.transform = 'translate(0px, 0px)';
      element.setAttribute('data-x', 0);
      element.setAttribute('data-y', 0);
      
      requestAnimationFrame(() => {
        element.style.visibility = 'visible';
        element.classList.remove('initializing');
      });
    }
  }

  resetElementPosition(elementId) {
    localStorage.removeItem(`mcl_element_position_${elementId}`);
    
    // Find the element
    const element = document.querySelector(`.mcl-floating-button[data-checklist-id="${elementId}"]`);
    if (!element) return;
    
    // Reset and reapply default position
    element.style.transform = 'translate(0px, 0px)';
    element.removeAttribute('data-x');
    element.removeAttribute('data-y');
    this.applyPosition(element, null, element.classList.contains('mcl-floating-button'));
  }

  resetAllDraggablePositions() {
    // Reset all individual buttons
    document.querySelectorAll('.mcl-floating-button.draggable').forEach(button => {
      const checklistId = button.dataset.checklistId;
      if (checklistId) this.resetElementPosition(checklistId);
    });
    
    // Reset all FAB groups
    document.querySelectorAll('.mcl-floating-buttons.has-draggable-fab').forEach(fabGroup => {
      fabGroup.style.transform = 'translate(0px, 0px)';
      fabGroup.setAttribute('data-x', 0);
      fabGroup.setAttribute('data-y', 0);
    });
  }

  destroy() {
    if (!this.initialized) return;
    
    try {
      // Remove all interact instances
      interact('.mcl-floating-button.draggable:not([data-drag-target-container="true"])').unset();
      interact('.draggable[data-drag-target-container="true"]').unset();
      
      this.initialized = false;
    } catch (error) {
      console.error('Error destroying draggable:', error);
    }
  }
}

export { MCLDraggable };