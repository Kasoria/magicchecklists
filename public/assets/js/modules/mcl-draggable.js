class MCLDraggable {
  constructor(drawer) {
      this.drawer = drawer;
      this.initialized = false;
      document.querySelectorAll('.mcl-floating-button.draggable').forEach(btn => {
        btn.classList.add('initializing');
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
        this.adjustButtonPositions();
      });

      this.restorePositions();
      this.initDraggable();
      this.initialized = true;
  }

  dragMoveListener(event) {
      const target = event.target;
      
      // Get current position from data attributes or default to 0
      const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
      const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

      // Update element transform
      target.style.transform = `translate(${x}px, ${y}px)`;

      // Store the position
      target.setAttribute('data-x', x);
      target.setAttribute('data-y', y);
  }

  initDraggable() {
      interact('.mcl-floating-button.draggable')
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
  }

  adjustButtonPositions() {
    const buttons = document.querySelectorAll('.mcl-floating-button.draggable');
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      // Assuming the parent is the viewport; adjust if you have a different container
      const parentRect = button.parentElement.getBoundingClientRect();
      
      let x = parseFloat(button.getAttribute('data-x')) || 0;
      let y = parseFloat(button.getAttribute('data-y')) || 0;

      // Check right boundary
      if (rect.right > parentRect.width) {
        x -= (rect.right - parentRect.width);
      }

      // Check bottom boundary
      if (rect.bottom > parentRect.height) {
        y -= (rect.bottom - parentRect.height);
      }

      // Check left boundary
      if (rect.left < 0) {
        x += Math.abs(rect.left);
      }

      // Check top boundary
      if (rect.top < 0) {
        y += Math.abs(rect.top);
      }

      // Update transform and attributes
      button.style.transform = `translate(${x}px, ${y}px)`;
      button.setAttribute('data-x', x);
      button.setAttribute('data-y', y);

      // Save the updated position if associated with a checklist
      const checklistId = button.dataset.checklistId;
      if (checklistId) {
        this.savePosition(checklistId, { x, y });
      }
    });
  }

  getStoredPosition(checklistId) {
      try {
          const stored = localStorage.getItem(`mcl_button_position_${checklistId}`);
          return stored ? JSON.parse(stored) : null;
      } catch (error) {
          console.error('Error reading stored position:', error);
          return null;
      }
  }

  savePosition(checklistId, position) {
      try {
          localStorage.setItem(
              `mcl_button_position_${checklistId}`,
              JSON.stringify(position)
          );
      } catch (error) {
          console.error('Error saving position:', error);
      }
  }

  restorePositions() {
    const buttons = document.querySelectorAll('.mcl-floating-button.draggable');
    buttons.forEach(button => {
      const checklistId = button.dataset.checklistId;
      let position = null;
      if (checklistId) {
        position = this.getStoredPosition(checklistId);
      }
  
      // If no stored position, default to bottom-right corner
      if (!position) {
        // Make the button temporarily visible to measure its size
        button.style.visibility = 'hidden';
        button.style.transform = 'none';
        requestAnimationFrame(() => {
          // After rendering, we can measure the button and parent dimensions
          const parentRect = button.parentElement.getBoundingClientRect();
          const btnRect = button.getBoundingClientRect();
  
          // Calculate a suitable bottom-right position.
          // Adjust the '20' or any offset as you wish.
          const x = parentRect.width - btnRect.width - 40;
          const y = parentRect.height - btnRect.height - 40;
  
          button.style.transform = `translate(${x}px, ${y}px)`;
          button.setAttribute('data-x', x);
          button.setAttribute('data-y', y);
          button.style.visibility = 'visible';
        });
      } else {
        // If a stored position exists, just restore it
        button.style.transform = `translate(${position.x}px, ${position.y}px)`;
        button.setAttribute('data-x', position.x);
        button.setAttribute('data-y', position.y);
  
        requestAnimationFrame(() => {
          button.style.visibility = 'visible';
        });
      }
  
      requestAnimationFrame(() => {
        button.classList.remove('initializing');
      });
    });
  }  

  resetPosition(checklistId) {
      localStorage.removeItem(`mcl_button_position_${checklistId}`);
      
      const button = document.querySelector(`.mcl-floating-button[data-checklist-id="${checklistId}"]`);
      if (button) {
          button.style.transform = 'translate(0px, 0px)';
          button.removeAttribute('data-x');
          button.removeAttribute('data-y');
      }
  }

  resetAllPositions() {
      document.querySelectorAll('.mcl-floating-button.draggable').forEach(button => {
          const checklistId = button.dataset.checklistId;
          if (checklistId) {
              this.resetPosition(checklistId);
          }
      });
  }

  destroy() {
      if (!this.initialized) return;
      
      try {
          interact('.mcl-floating-button.draggable').unset();
          this.initialized = false;
      } catch (error) {
          console.error('Error destroying draggable:', error);
      }
  }
}

export { MCLDraggable };