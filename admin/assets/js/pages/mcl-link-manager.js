export class LinkManager {
    constructor(config) {
        this.drawer = config.drawer;
        this.container = config.container || this.drawer;
        this.itemsList = config.itemsList;
        this.toolbar = null;
        this.isToolbarVisible = false;
        this.currentSelection = null;
        this.selectionTimeout = null;
        this.currentIndicator = null;
        
        // Initialize methods
        this.handleSelection = this._handleSelection.bind(this);
        this.handleKeyboard = this._handleKeyboard.bind(this);
        this.createLink = this._createLink.bind(this);
        this.clickOutsideHandler = this.handleClickOutside.bind(this);
        
        this.init();
    }

    init() {
        this.createToolbar();
        
        if (this.itemsList) {
            // Handle text selection from mouse
            this.itemsList.addEventListener('mouseup', this.handleSelectionChange.bind(this));

            // Handle keyboard selection
            this.itemsList.addEventListener('keyup', (e) => {
                // Check for selection-related keys
                const selectionKeys = [
                    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Home', 'End', 'PageUp', 'PageDown'
                ];

                if (
                    ((e.ctrlKey || e.metaKey) && e.key === 'a') ||
                    (e.shiftKey && selectionKeys.includes(e.key)) ||
                    selectionKeys.includes(e.key)
                ) {
                    this.handleSelectionChange(e);
                }
            });
        }

        // Handle global selection changes
        document.addEventListener('selectionchange', () => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (this.isSelectionWithinEditableContent(range)) {
                    this.handleSelectionChange();
                }
            }
        });

        // Add keyboard shortcut listener
        document.addEventListener('keydown', this.handleKeyboard);
        
        // Add click outside listener
        document.addEventListener('mousedown', this.clickOutsideHandler);
    }

    isSelectionWithinEditableContent(range) {
        let container = range.commonAncestorContainer;
        
        // Find closest content element
        while (container && !container.classList?.contains('mcl-item-content')) {
            container = container.parentNode;
        }

        // Check if it's within our items list
        return container && this.itemsList.contains(container);
    }

  handleSelectionChange(e = null) {
    // Clear any existing timeout
    if (this.selectionTimeout) {
        clearTimeout(this.selectionTimeout);
    }
    
    // Small delay to ensure selection is stable
    this.selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText && this.isValidSelection(selection)) {
            this.showSelectionIndicator(selection);
        } else {
            this.removeSelectionIndicator();
        }
    }, 50);
  }

  isValidSelection(selection) {
    if (!selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer;

    // Find the editable content container
    while (container && !container.classList?.contains('mcl-item-content')) {
        container = container.parentNode;
    }

    // Make sure we're within an editable content area and not in the toolbar
    return container && 
           container.matches('[contenteditable="true"]') && 
           !container.closest('.mcl-link-toolbar') &&
           selection.toString().trim().length > 0; // Ensure there's actual text selected
  }

  removeRemoveLinkIndicator() {
    if (this.currentRemoveIndicator && this.currentRemoveIndicator.parentNode) {
        this.currentRemoveIndicator.parentNode.removeChild(this.currentRemoveIndicator);
    }
    this.currentRemoveIndicator = null;
    this.currentLinkElement = null;
  }

  removeLink(linkElement) {
    if (!linkElement) return;

    // Create range and selection
    const range = document.createRange();
    const selection = window.getSelection();

    // Select the link content
    range.selectNodeContents(linkElement);
    selection.removeAllRanges();
    selection.addRange(range);

    // Extract text content
    const textContent = linkElement.textContent;

    // Replace link with text node
    const textNode = document.createTextNode(textContent);
    linkElement.parentNode.replaceChild(textNode, linkElement);

    // Clear selection
    selection.removeAllRanges();

    // Remove the indicator
    this.removeRemoveLinkIndicator();

  }

  showRemoveLinkIndicator(linkElement) {
    // Remove any existing indicators
    this.removeRemoveLinkIndicator();
    this.removeSelectionIndicator();

    const rect = linkElement.getBoundingClientRect();
    const drawerContentRect = this.drawer.drawerContent.getBoundingClientRect();
    const scrollTop = this.drawer.drawerContent.scrollTop;

    // Create remove link indicator
    const indicator = document.createElement('div');
    indicator.className = 'mcl-remove-link-indicator';
    indicator.innerHTML = `
        <button type="button" class="mcl-remove-link-btn" title="Remove link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
            </svg>
        </button>
    `;

    // Calculate position
    const relativeTop = rect.top - drawerContentRect.top + scrollTop;
    const relativeLeft = rect.right - drawerContentRect.left;

    // Position styles
    indicator.style.position = 'absolute';
    indicator.style.top = `${relativeTop}px`;
    indicator.style.left = `${relativeLeft + 8}px`; // 8px offset from link
    
    // Add to drawer content
    this.drawer.drawerContent.appendChild(indicator);
    
    // Store reference to current link
    this.currentLinkElement = linkElement;

    // Handle remove button click
    indicator.querySelector('.mcl-remove-link-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeLink(linkElement);
    });

    // Store reference for cleanup
    this.currentRemoveIndicator = indicator;
  }

  showSelectionIndicator(selection) {
    // Remove any existing indicators first
    this.removeSelectionIndicator();

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Only show if we have actual dimensions
    if (rect.width === 0 || rect.height === 0) return;

    // Check if selection contains or is within a link
    const containsLink = this.selectionContainsLink(range);

    // Create floating indicator
    const indicator = document.createElement('div');
    indicator.className = 'mcl-selection-indicator';
    
    indicator.innerHTML = `
        <div class="mcl-selection-buttons">
            <button type="button" class="mcl-add-link-btn" title="Add link (Ctrl/Cmd + K)" 
                    style="${containsLink ? 'display: none;' : ''}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
            </button>
            <button type="button" class="mcl-remove-link-btn" title="Remove link" 
                    style="${!containsLink ? 'display: none;' : ''}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18"></path>
                    <path d="M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;

    // Get container dimensions - this could be either the drawer content or the form wrapper
    const containerRect = this.container.getBoundingClientRect();
    
    // If we're in the edit page context, also consider scroll position
    const containerScroll = this.container.scrollTop || 0;
    const documentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // Calculate position relative to the container
    const relativeTop = rect.top - containerRect.top + containerScroll + (documentScroll - (this.drawer === document ? documentScroll : 0));
    const relativeLeft = rect.left - containerRect.left;

    // Position indicator with offset
    const verticalOffset = 24;
    
    indicator.style.position = 'absolute';
    indicator.style.top = `${relativeTop - verticalOffset}px`;
    indicator.style.left = `${relativeLeft + (rect.width / 2)}px`;
    indicator.style.transform = 'translateX(-50%)'; // Center horizontally

    // Bind event handlers
    indicator.querySelector('.mcl-add-link-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.checkSelection(true);
    });

    indicator.querySelector('.mcl-remove-link-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeLink(range);
    });

    // Add to container
    this.container.appendChild(indicator);
    this.currentIndicator = indicator;
  }

  removeLink(range) {
    // Clone the range to avoid modifying the original selection
    const clonedRange = range.cloneRange();
    const selection = window.getSelection();
    
    try {
        // Check if selection is entirely within a link
        let linkElement = range.commonAncestorContainer;
        while (linkElement && !linkElement.matches?.('a')) {
            linkElement = linkElement.parentNode;
        }

        if (linkElement?.matches('a')) {
            // Case 1: Selection is within a single link
            const textContent = linkElement.textContent;
            const textNode = document.createTextNode(textContent);
            linkElement.parentNode.replaceChild(textNode, linkElement);
            
            // Update selection to cover the new text node
            clonedRange.selectNodeContents(textNode);
            selection.removeAllRanges();
            selection.addRange(clonedRange);
        } else {
            // Case 2: Selection contains links or parts of links
            const fragment = range.extractContents();
            
            // Process all links in the fragment
            const links = fragment.querySelectorAll('a');
            links.forEach(link => {
                const textNode = document.createTextNode(link.textContent);
                link.parentNode.replaceChild(textNode, link);
            });
            
            // Reinsert the modified content
            range.insertNode(fragment);
            
            // Restore selection
            selection.removeAllRanges();
            selection.addRange(clonedRange);
        }
        
        // Remove the indicator
        this.removeSelectionIndicator();
        
    } catch (error) {
        console.error('Error removing link:', error);
        // Restore original selection in case of error
        selection.removeAllRanges();
        selection.addRange(clonedRange);
    }
  }

  selectionContainsLink(range) {
    // First check if selection is entirely within a link
    let container = range.commonAncestorContainer;
    while (container && !container.matches?.('a')) {
        container = container.parentNode;
    }
    if (container?.matches?.('a')) return true;

    // Then check if selection contains any links
    const fragment = range.cloneContents();
    return fragment.querySelector('a') !== null;
  }

  removeSelectionIndicator() {
    if (this.currentIndicator && this.currentIndicator.parentNode) {
        this.currentIndicator.parentNode.removeChild(this.currentIndicator);
    }
    this.currentIndicator = null;
  }

  createToolbar() {
    if (this.toolbar) return;

    this.toolbar = document.createElement('div');
    this.toolbar.className = 'mcl-link-toolbar';
    this.toolbar.innerHTML = `
            <div class="mcl-link-toolbar-inner">
                <input type="text" 
                       placeholder="Enter URL (https:// or http://)" 
                       class="mcl-link-input">
                <button type="button" class="mcl-link-submit" disabled>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            <div class="mcl-link-error"></div>
        `;

    const input = this.toolbar.querySelector('.mcl-link-input');
    const submit = this.toolbar.querySelector('.mcl-link-submit');
    const errorDiv = this.toolbar.querySelector('.mcl-link-error');

    // Handle input validation
    input.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        const isValid = this.isValidUrl(value);
        
        // Update UI state
        submit.disabled = !isValid;
        input.classList.toggle('invalid', !isValid && value !== '');
        
        // Clear error message when typing
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    });

    // Handle input keyboard events
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            
            const value = input.value.trim();
            
            if (!value) {
                this.showError('Please enter a URL');
                return;
            }
            
            if (!this.isValidUrl(value)) {
                this.showError('Please enter a valid URL starting with http:// or https://');
                return;
            }
            
            this.createLink(value);
        }
    });

    // Handle submit button click
    submit.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // If button is disabled, keep focus on input and do nothing
      if (submit.disabled) {
          input.focus();
          return;
      }
      
      const value = input.value.trim();
      if (!value) {
          this.showError('Please enter a URL');
          input.focus();
          return;
      }
      
      if (!this.isValidUrl(value)) {
          this.showError('Please enter a valid URL starting with http:// or https://');
          input.focus();
          return;
      }
      
      this.createLink(value);
    });

    // Prevent toolbar interactions from affecting selection
    this.toolbar.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.isToolbarVisible) {
          input.focus();
      }
    });

    // Add to drawer
    this.container.appendChild(this.toolbar);
  }

  showError(message) {
    const errorDiv = this.toolbar.querySelector('.mcl-link-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Clear error after 3 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }, 3000);
  }

  handleClickOutside(e) {
    // Check if click is outside all indicators and toolbar
    if (this.isToolbarVisible && 
        !e.target.closest('.mcl-link-toolbar') && 
        !e.target.closest('.mcl-selection-indicator') &&
        !e.target.closest('.mcl-remove-link-indicator')) {
        this.hideToolbar();
    }

    // Remove indicators if clicking outside
    if (!e.target.closest('.mcl-selection-indicator') && 
        !e.target.closest('.mcl-remove-link-indicator') &&
        !e.target.closest('.mcl-item-content')) {
        this.removeSelectionIndicator();
        this.removeRemoveLinkIndicator();
    }
  }

  isValidUrl(url) {
    if (!url) return false;
    
    // Remove whitespace
    url = url.trim();
    
    // If no protocol specified, consider if we should add https://
    if (!/^https?:\/\//i.test(url)) {
        // Check if it looks like a valid domain
        if (/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(url)) {
            return true; // We'll add https:// later when creating the link
        }
        return false;
    }
    
    try {
        const urlObject = new URL(url);
        return ['http:', 'https:'].includes(urlObject.protocol);
    } catch {
        return false;
    }
  }

  _handleSelection() {
      requestAnimationFrame(() => this.checkSelection());
  }

  checkSelection(userInitiated = false) {
    const selection = window.getSelection();
    
    if (!selection.rangeCount) {
        this.hideToolbar();
        return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    // Find editable content element
    let container = range.commonAncestorContainer;
    while (container && !container.classList?.contains('mcl-item-content')) {
        container = container.parentNode;
    }

    // Only proceed if we're inside an editable content area
    if (!container || !container.matches('[contenteditable="true"]') || !selectedText) {
        this.hideToolbar();
        return;
    }

    // Only show toolbar if user initiated (through keyboard or button)
    if (userInitiated) {
        // Store selection information
        this.currentSelection = {
            range: range.cloneRange(),
            text: selectedText,
            editableContent: container
        };

        this.maintainVisualSelection();
        this.showToolbar(range);
        
        // Remove the indicator since we're showing the toolbar
        this.removeSelectionIndicator();
    }
  }

  maintainVisualSelection() {
    try {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        
        // Check if selection spans multiple nodes
        if (!range.commonAncestorContainer.textContent) {
            return;
        }

        // Remove any existing selection spans first
        const existingSpans = document.querySelectorAll('.mcl-selected-text');
        existingSpans.forEach(span => {
            if (span.parentNode) {
                const text = document.createTextNode(span.textContent);
                span.parentNode.replaceChild(text, span);
            }
        });

        // Only proceed if we have a text selection
        if (selection.toString().trim()) {
            try {
                // Create temporary fragment
                const fragment = range.extractContents();
                const span = document.createElement('span');
                span.className = 'mcl-selected-text';
                span.appendChild(fragment);
                range.insertNode(span);
                
                // Store reference to remove later
                this.currentSelection.selectionSpan = span;
            } catch (e) {
                console.warn('Could not wrap selection:', e);
                // Restore original selection
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    } catch (e) {
        console.warn('Error maintaining selection:', e);
    }
  }

  showToolbar(range) {
    if (!this.toolbar || !range) return;

    // Prevent default scroll behavior on toolbar elements
    this.toolbar.querySelectorAll('input, button').forEach(element => {
        element.addEventListener('focus', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { capture: true });
    });

    const rect = range.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const containerScroll = this.container.scrollTop || 0;
    const documentScroll = window.pageYOffset || document.documentElement.scrollTop;

    // Calculate position relative to container
    const top = rect.top - containerRect.top + containerScroll + (documentScroll - (this.drawer === document ? documentScroll : 0));
    const left = rect.left - containerRect.left;

    // Keep toolbar within bounds
    const maxLeft = containerRect.width - this.toolbar.offsetWidth;
    const boundedLeft = Math.max(10, Math.min(left, maxLeft - 10));

    // Reset toolbar state
    const input = this.toolbar.querySelector('.mcl-link-input');
    const submit = this.toolbar.querySelector('.mcl-link-submit');
    const errorDiv = this.toolbar.querySelector('.mcl-link-error');
    
    input.value = '';
    input.classList.remove('invalid');
    submit.disabled = true;
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    // Position toolbar
    this.toolbar.style.transform = `translate(${boundedLeft}px, ${top - this.toolbar.offsetHeight - 10}px)`;
    
    // Store current scroll position before showing toolbar
    const currentScroll = {
        x: window.pageXOffset,
        y: window.pageYOffset
    };

    // Show toolbar
    this.toolbar.classList.add('mcl-link-toolbar-visible');
    
    // Use double requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Prevent scroll
            if (this.container === document) {
                window.scrollTo(currentScroll.x, currentScroll.y);
            } else {
                this.container.scrollTop = containerScroll;
            }
            
            // Focus input with scroll prevention
            const preventScroll = () => {
                window.scrollTo(currentScroll.x, currentScroll.y);
                input.removeEventListener('focus', preventScroll);
            };
            
            input.addEventListener('focus', preventScroll);
            input.focus({ preventScroll: true });
        });
    });

    this.isToolbarVisible = true;
  }

  hideToolbar() {
      if (!this.toolbar) return;
      
      // Remove selection highlighting
      if (this.currentSelection?.selectionSpan) {
          const span = this.currentSelection.selectionSpan;
          const parent = span.parentNode;
          if (parent) {
              parent.insertBefore(document.createTextNode(span.textContent), span);
              parent.removeChild(span);
          }
      }

      this.toolbar.classList.remove('mcl-link-toolbar-visible');
      this.isToolbarVisible = false;
      this.currentSelection = null;
  }

  _handleKeyboard(e) {
    // Handle Ctrl/Cmd + K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        
        // Get current selection
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText && this.isValidSelection(selection)) {
            // Show link toolbar immediately
            this.checkSelection(true);
        } else {
            // If no text is selected, show a hint to the user
            // You might want to add a small toast notification here
            console.log('Please select some text first');
        }
        return;
    }

    // Hide toolbar on Escape
    if (e.key === 'Escape') {
        if (this.isToolbarVisible) {
            e.preventDefault();
            this.hideToolbar();
        } else {
            this.removeSelectionIndicator();
        }
    }
  }

  _createLink(url) {
      if (!this.currentSelection || !url || !this.isValidUrl(url)) return;

      try {
          // Normalize URL
          if (!/^https?:\/\//i.test(url)) {
              url = 'https://' + url;
          }

          // Create and configure link
          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';

          // Get the selection content
          if (this.currentSelection.selectionSpan) {
              // If we have a selection span, use its content
              link.textContent = this.currentSelection.selectionSpan.textContent;
              this.currentSelection.selectionSpan.parentNode.replaceChild(link, this.currentSelection.selectionSpan);
          } else {
              // Fallback to range-based insertion
              const range = this.currentSelection.range;
              const fragment = range.extractContents();
              link.appendChild(fragment);
              range.insertNode(link);
          }

          // Clean up
          this.hideToolbar();

          // Move cursor after link
          const selection = window.getSelection();
          const newRange = document.createRange();
          newRange.setStartAfter(link);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);

      } catch (error) {
          console.error('Error creating link:', error);
      }
  }

  destroy() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyboard);
    document.removeEventListener('mousedown', this.clickOutsideHandler);

    // Remove toolbar if it exists
    if (this.toolbar && this.toolbar.parentNode) {
        this.toolbar.parentNode.removeChild(this.toolbar);
        this.toolbar = null;
    }

    // Remove any existing selection spans
    if (this.itemsList) {
        const spans = this.itemsList.querySelectorAll('.mcl-selected-text');
        spans.forEach(span => {
            if (span.parentNode) {
                span.parentNode.replaceChild(
                    document.createTextNode(span.textContent),
                    span
                );
            }
        });

        // Remove any remaining indicators
        const indicators = this.itemsList.querySelectorAll('.mcl-selection-indicator, .mcl-remove-link-indicator');
        indicators.forEach(indicator => indicator.remove());
    }
  }
}