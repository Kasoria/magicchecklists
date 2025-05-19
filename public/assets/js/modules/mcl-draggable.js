class MCLDraggable {
  constructor(drawer) {
      this.drawer = drawer;
      this.initialized = false;
      document.querySelectorAll('.mcl-floating-button.draggable, .mcl-floating-buttons.mcl-fab-group-draggable').forEach(el => {
        el.classList.add('initializing');
      });         
  }

  init() {
      if (this.initialized) return;
      
      // Ensure interact is available
      if (typeof interact === 'undefined') {
          console.error('interact.js is not loaded');
          return;
      }

      window.addEventListener('resize', () => {
        this.adjustDraggableElementPositions();
      });

      this.restoreAllPositions();
      this.initDraggableElements();
      this.initialized = true;
  }

  dragMoveListener(event) {
      const target = event.target;
      let elementToMove = target;

      // If the dragged element has data-drag-target-container, move its closest .mcl-floating-buttons container
      if (target.dataset.dragTargetContainer === 'true') {
          const container = target.closest('.mcl-floating-buttons');
          if (container) {
              elementToMove = container;
          } else {
              console.warn('Draggable target container .mcl-floating-buttons not found for', target);
              return;
          }
      }
      
      const x = (parseFloat(elementToMove.getAttribute('data-x')) || 0) + event.dx;
      const y = (parseFloat(elementToMove.getAttribute('data-y')) || 0) + event.dy;

      elementToMove.style.transform = `translate(${x}px, ${y}px)`;
      elementToMove.setAttribute('data-x', x);
      elementToMove.setAttribute('data-y', y);
  }

  initDraggableElements() {
      // Draggable individual buttons
      interact('.mcl-floating-button.draggable:not([data-drag-target-container="true"])')
          .draggable({
              inertia: true,
              autoScroll: true,
              modifiers: [
                  interact.modifiers.restrictRect({
                      restriction: 'parent',
                      endOnly: true
                  })
              ],
              listeners: {
                  start: (event) => {
                      event.target.classList.add('mcl-dragging');
                  },
                  move: this.dragMoveListener,
                  end: (event) => {
                    const target = event.target;
                    target.classList.remove('mcl-dragging');
                    target.setAttribute('data-just-dragged', 'true');
                
                    const checklistId = target.dataset.checklistId;
                    if (checklistId) {
                        const x = parseFloat(target.getAttribute('data-x')) || 0;
                        const y = parseFloat(target.getAttribute('data-y')) || 0;
                        this.savePosition(checklistId, { x, y });
                    }
                }                
              }
          });

      // Draggable FAB Trigger (moves the parent .mcl-floating-buttons container)
      interact('.draggable[data-drag-target-container="true"]')
          .draggable({
              inertia: true, 
              autoScroll: false,
              modifiers: [
                  interact.modifiers.restrictRect({
                      restriction: (interaction, element /* trigger - but might not be the DOM node directly */, rect) => {
                        // Use interaction.element to reliably get the DOM element
                        const triggerElement = interaction.element;
                        if (!triggerElement || typeof triggerElement.closest !== 'function') {
                            console.warn('MCL Draggable: interaction.element is not a valid DOM element in restriction.', triggerElement);
                            return document.body.getBoundingClientRect(); // Fallback
                        }

                        const fabContainer = triggerElement.closest('.mcl-floating-buttons.has-draggable-fab');
                        if (fabContainer && fabContainer.parentElement) {
                            // Restrict within the coordinate system of the fabContainer's parent
                            return fabContainer.parentElement.getBoundingClientRect();
                        }
                        // Fallback to viewport
                        return document.body.getBoundingClientRect();
                      },
                      endOnly: true
                  })
              ],
              listeners: {
                  start: (event) => {
                      const fabContainer = event.target.closest('.mcl-floating-buttons');
                      if (fabContainer) {
                          fabContainer.classList.add('mcl-dragging');
                      }
                      event.target.classList.add('mcl-fab-trigger-dragging');
                  },
                  move: this.dragMoveListener, // dragMoveListener now handles moving the correct element
                  end: (event) => {
                      const fabContainer = event.target.closest('.mcl-floating-buttons');
                      if (fabContainer) {
                          fabContainer.classList.remove('mcl-dragging');
                          fabContainer.setAttribute('data-just-dragged', 'true'); 
                          // No position saving for the FAB group per requirements
                      }
                      event.target.classList.remove('mcl-fab-trigger-dragging');
                  }
              }
          });
  }

  adjustDraggableElementPositions() {
    // Adjust individual buttons
    document.querySelectorAll('.mcl-floating-button.draggable:not([data-drag-target-container="true"])').forEach(element => {
      const parentElement = element.parentElement;
      if (!parentElement) return;

      const rect = element.getBoundingClientRect();
      const parentRect = parentElement.getBoundingClientRect();
      
      let x = parseFloat(element.getAttribute('data-x')) || 0;
      let y = parseFloat(element.getAttribute('data-y')) || 0;

      // Calculate visual position relative to parent's content box
      // Assumes parent is the offset parent or transform is relative to initial pos in parent.
      const currentVisualLeft = element.offsetLeft + x;
      const currentVisualTop = element.offsetTop + y;
      
      let newX = x;
      let newY = y;

      if (currentVisualLeft < 0) newX = -element.offsetLeft;
      if (currentVisualTop < 0) newY = -element.offsetTop;
      if (currentVisualLeft + rect.width > parentRect.width) newX = parentRect.width - rect.width - element.offsetLeft;
      if (currentVisualTop + rect.height > parentRect.height) newY = parentRect.height - rect.height - element.offsetTop;
      
      if (newX !== x || newY !== y) {
        element.style.transform = `translate(${newX}px, ${newY}px)`;
        element.setAttribute('data-x', newX);
        element.setAttribute('data-y', newY);

        const checklistId = element.dataset.checklistId;
        if (checklistId) {
          this.savePosition(checklistId, { x: newX, y: newY });
        }
      }
    });

    // Adjust FAB groups (which are .mcl-floating-buttons elements with .has-draggable-fab)
    document.querySelectorAll('.mcl-floating-buttons.has-draggable-fab').forEach(fabGroup => {
      const restrictingParent = fabGroup.parentElement;
      if (!restrictingParent) return;

      const groupRect = fabGroup.getBoundingClientRect(); // Current visual size of FAB group
      const parentRect = restrictingParent.getBoundingClientRect(); // Visual size of restricting parent

      let x = parseFloat(fabGroup.getAttribute('data-x')) || 0; // Current transform X
      let y = parseFloat(fabGroup.getAttribute('data-y')) || 0; // Current transform Y

      // fabGroup.offsetLeft/Top is its initial CSS position relative to its offsetParent.
      // The transform (x,y) is applied on top of that.
      // We want the final visual position of fabGroup to be within restrictingParent.

      // Calculate current visual position of fabGroup *relative to the restrictingParent's top-left corner*
      const currentVisualLeftInParent = (fabGroup.getBoundingClientRect().left - parentRect.left);
      const currentVisualTopInParent = (fabGroup.getBoundingClientRect().top - parentRect.top);
      
      let finalX = x;
      let finalY = y;

      // If fabGroup is visually outside restrictingParent's left boundary
      if (currentVisualLeftInParent < 0) {
          finalX = x - currentVisualLeftInParent; // Add the difference to pull it back in
      }
      // If fabGroup is visually outside restrictingParent's top boundary
      if (currentVisualTopInParent < 0) {
          finalY = y - currentVisualTopInParent;
      }
      // If fabGroup is visually outside restrictingParent's right boundary
      if (currentVisualLeftInParent + groupRect.width > parentRect.width) {
          finalX = x - ((currentVisualLeftInParent + groupRect.width) - parentRect.width);
      }
      // If fabGroup is visually outside restrictingParent's bottom boundary
      if (currentVisualTopInParent + groupRect.height > parentRect.height) {
          finalY = y - ((currentVisualTopInParent + groupRect.height) - parentRect.height);
      }

      if (finalX !== x || finalY !== y) {
        fabGroup.style.transform = `translate(${finalX}px, ${finalY}px)`;
        fabGroup.setAttribute('data-x', finalX);
        fabGroup.setAttribute('data-y', finalY);
        // Not saving FAB group position, per requirements
      }
    });
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
    document.querySelectorAll('.mcl-floating-button.draggable:not([data-drag-target-container="true"])').forEach(button => {
      const checklistId = button.dataset.checklistId;
      let position = null;
      if (checklistId) {
        position = this.getStoredPosition(checklistId);
      }
      // Pass the button itself for default positioning if needed
      this.applyPosition(button, position, true, button); 
    });

    // Initialize draggable FAB groups (the .mcl-floating-buttons container)
    document.querySelectorAll('.mcl-floating-buttons.has-draggable-fab').forEach(fabGroupContainer => {
      fabGroupContainer.style.transform = 'translate(0px, 0px)';
      fabGroupContainer.setAttribute('data-x', 0);
      fabGroupContainer.setAttribute('data-y', 0);
      requestAnimationFrame(() => {
        fabGroupContainer.classList.remove('initializing');
        // Ensure visibility if it was hidden during init
        fabGroupContainer.style.visibility = 'visible'; 
      });
    });
  }

  applyPosition(element, position, isIndividualButton = false, individualButtonElementForDefault = null) {
    if (!position && isIndividualButton && individualButtonElementForDefault) {
      element.style.visibility = 'hidden'; 
      element.style.transform = 'none'; 
      requestAnimationFrame(() => {
        const btnForDefault = individualButtonElementForDefault;
        const parentRect = btnForDefault.parentElement.getBoundingClientRect();
        const btnRect = btnForDefault.getBoundingClientRect(); // Get rect after it's in DOM, but before transform
        
        // Default to bottom-right for individual buttons
        // These are offsets from the parent's top-left, to be used in translate()
        // This calculation assumes the button's initial CSS (pre-transform) has it at top-left (0,0) of parent or similar
        // Or rather, transform is relative to its flow position.
        // For absolute/fixed, offsetLeft/Top might be more reliable if parent is offsetParent
        // Let's assume a common fixed/absolute setup:
        let x = parentRect.width - btnRect.width - 20; // 20px from right edge
        let y = parentRect.height - btnRect.height - 20; // 20px from bottom edge

        // If the button has initial left/top CSS properties, translate is relative to that.
        // The current approach of data-x/data-y as direct translate values is simpler.
        // The original had 40px, maybe 20px padding + 20px offset. Let's stick to 20px from edge.

        btnForDefault.style.transform = `translate(${x}px, ${y}px)`;
        btnForDefault.setAttribute('data-x', x);
        btnForDefault.setAttribute('data-y', y);
        btnForDefault.style.visibility = 'visible';
        btnForDefault.classList.remove('initializing');
      });
    } else if (position) {
      element.style.transform = `translate(${position.x}px, ${position.y}px)`;
      element.setAttribute('data-x', position.x);
      element.setAttribute('data-y', position.y);
      requestAnimationFrame(() => {
        element.style.visibility = 'visible';
        element.classList.remove('initializing');
      });
    } else {
      // For elements that don't restore (like FAB group) or have no position, set to 0,0 transform
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
    let element = document.querySelector(`.mcl-floating-button[data-checklist-id="${elementId}"]`);
    if (!element && elementId === 'mcl_fab_group') { // Example if we were to save FAB group pos
      element = document.querySelector('.mcl-floating-buttons.mcl-fab-group-draggable');
    }

    if (element) {
      element.style.transform = 'translate(0px, 0px)';
      element.removeAttribute('data-x');
      element.removeAttribute('data-y');
      // Re-apply default for individual buttons if needed, or reset FAB to initial CSS.
      if (element.classList.contains('mcl-floating-button')) {
        this.applyPosition(element, null, true);
      } else {
        this.applyPosition(element, null, false);
      }
    }
  }

  resetAllDraggablePositions() {
    document.querySelectorAll('.mcl-floating-button.draggable').forEach(button => {
      const checklistId = button.dataset.checklistId;
      if (checklistId) {
        this.resetElementPosition(checklistId);
      }
    });
    document.querySelectorAll('.mcl-floating-buttons.mcl-fab-group-draggable').forEach(fabGroup => {
      // Reset FAB group to initial CSS position (translate 0,0)
      fabGroup.style.transform = 'translate(0px, 0px)';
      fabGroup.setAttribute('data-x', 0);
      fabGroup.setAttribute('data-y', 0);
    });
  }

  destroy() {
      if (!this.initialized) return;
      
      try {
          // Unset for individual buttons
          interact('.mcl-floating-button.draggable:not([data-drag-target-container="true"])').unset();
          // Unset for FAB triggers
          interact('.draggable[data-drag-target-container="true"]').unset();
          
          this.initialized = false;
      } catch (error) {
          console.error('Error destroying draggable:', error);
      }
  }
}

export { MCLDraggable };