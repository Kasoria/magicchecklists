/**
 * Magic Checklists - Shortcode Editor
 * Handles editing functionality for checklist shortcodes
 */

class MCLShortcodeEditor {
    constructor(container) {
        this.container = container;
        this.checklistId = container.dataset.checklistId;
        this.instanceId = container.dataset.instanceId;
        this.modal = container.querySelector('.mcl-shortcode-editor-modal');
        this.overlay = this.modal.querySelector('.mcl-shortcode-editor-overlay');
        this.editorItems = this.modal.querySelector('.mcl-shortcode-editor-items');
        this.addButton = this.modal.querySelector('.mcl-shortcode-add-item');
        this.cancelButton = this.modal.querySelector('.mcl-shortcode-editor-cancel');
        this.saveButton = this.modal.querySelector('.mcl-shortcode-editor-save');
        this.closeButton = this.modal.querySelector('.mcl-shortcode-editor-close');
        this.editButton = container.querySelector('.mcl-shortcode-edit-btn');
        this.priorityEnabled = container.dataset.priorityEnabled === '1';
        this.priorityDisplayType = container.dataset.priorityDisplayType || 'color';
        this.canEdit = container.dataset.canEdit === '1';
        this.canCheck = container.dataset.canInteract === '1';
        this.saving = false;
        this.sortable = null;
        this.notification = null;
        this.notificationTimer = null;
        
        this.originalItems = container.querySelector('.mcl-shortcode-items');
        
        this.originalItemsData = [];
        this.editingItemsData = [];
        
        // Image manager properties
        this.imageModal = null;
        this.currentItem = null;
        this.isLoggedIn = mclShortcode.user_logged_in === '1';
        
        // Link manager properties
        this.linkToolbar = null;
        this.isToolbarVisible = false;
        this.currentSelection = null;
        this.selectionTimeout = null;
        this.currentIndicator = null;
        this.currentRemoveIndicator = null;
        this.currentLinkElement = null;
        
        // Priority-related constants
        this.priorityCycle = ['none', 'low', 'medium', 'high', 'critical'];
        this.priorityColors = {
            'none': '#94a3b8',
            'low': '#22c55e',
            'medium': '#f59e0b',
            'high': '#ef4444',
            'critical': '#7c3aed'
        };
        
        // Initialize if the user has edit permissions
        if (this.canEdit) {
            this.init();
        }
    }

    init() {
        // Bind event listeners
        this.editButton.addEventListener('click', this.openEditor.bind(this));
        this.closeButton.addEventListener('click', this.closeEditor.bind(this));
        this.saveButton.addEventListener('click', this.saveChanges.bind(this));
        this.cancelButton.addEventListener('click', this.closeEditor.bind(this));
        this.addButton.addEventListener('click', this.addNewItem.bind(this));
        
        // Also close when clicking on the overlay
        this.overlay.addEventListener('click', this.closeEditor.bind(this));
        
        // Add event delegation for editor items
        this.editorItems.addEventListener('click', (e) => {
            // Handle priority button clicks
            if (e.target.closest('.mcl-editor-item-priority')) {
                this.cyclePriority(e.target.closest('.mcl-editor-item-priority'));
            }
            
            // Handle delete button clicks
            if (e.target.closest('.mcl-editor-item-delete')) {
                const item = e.target.closest('.mcl-shortcode-editor-item');
                if (item) {
                    this.deleteItem(item);
                }
            }
            
            // Handle image button clicks
            if (e.target.closest('.mcl-editor-item-image')) {
                const item = e.target.closest('.mcl-shortcode-editor-item');
                if (item) {
                    this.handleImageButtonClick(item);
                }
            }
            
            // Handle clicks on links within content
            if (e.target.matches('.mcl-editor-item-content a') || e.target.closest('.mcl-editor-item-content a')) {
                e.preventDefault();
                e.stopPropagation();
                
                const link = e.target.matches('a') ? e.target : e.target.closest('a');
                if (link.href) {
                    window.open(link.href, '_blank', 'noopener,noreferrer');
                }
            }
        });
        
        // Handle keydown events for Enter and Shift+Enter behavior
        this.editorItems.addEventListener('keydown', this.handleItemKeydown.bind(this));
        
        // Handle selection changes for link functionality
        this.editorItems.addEventListener('mouseup', this.handleSelectionChange.bind(this));
        
        // Handle keyboard selection and shortcuts
        this.editorItems.addEventListener('keyup', (e) => {
            // For selection detection
            const selectionKeys = [
                'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'Home', 'End', 'PageUp', 'PageDown'
            ];
            
            if (((e.ctrlKey || e.metaKey) && e.key === 'a') ||
                (e.shiftKey && selectionKeys.includes(e.key)) ||
                selectionKeys.includes(e.key)) {
                this.handleSelectionChange(e);
            }
        });
        
        // Handle paste events for content items
        this.editorItems.addEventListener('paste', this.handlePaste.bind(this));
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K for link creation
            if ((e.ctrlKey || e.metaKey) && e.key === 'k' && this.isModalOpen()) {
                e.preventDefault();
                this.checkSelection(true);
            }
            
            // Escape to close link toolbar
            if (e.key === 'Escape' && this.isModalOpen()) {
                if (this.isToolbarVisible) {
                    e.preventDefault();
                    this.hideToolbar();
                } else {
                    this.removeSelectionIndicator();
                }
            }
        });
        
        // Handle outside clicks
        document.addEventListener('mousedown', (e) => {
            if (this.isModalOpen()) {
                // Close link toolbar when clicking outside
                if (this.isToolbarVisible && 
                    !e.target.closest('.mcl-link-toolbar') && 
                    !e.target.closest('.mcl-selection-indicator') &&
                    !e.target.closest('.mcl-remove-link-indicator')) {
                    this.hideToolbar();
                }
                
                // Remove indicators if clicking outside
                if (!e.target.closest('.mcl-selection-indicator') && 
                    !e.target.closest('.mcl-remove-link-indicator') &&
                    !e.target.closest('.mcl-editor-item-content')) {
                    this.removeSelectionIndicator();
                    this.removeRemoveLinkIndicator();
                }
            }
        });
        
        // Create link toolbar when initialized
        this.createLinkToolbar();
    }

    isModalOpen() {
        return this.modal.style.display !== 'none';
    }

    openEditor() {
        // Capture the current items data
        this.captureItemsData();
        
        // Populate editor with items
        this.populateEditor();
        
        // Initialize sortable
        this.initSortable();
        
        // Show the modal
        this.modal.style.display = 'flex';
        
        // Add active class for animations (if used)
        setTimeout(() => {
            this.modal.classList.add('active');
        }, 10);
    }

    closeEditor() {
        // Remove active class for animations
        this.modal.classList.remove('active');
        
        // Reset save button state
        this.resetSaveButton();
        
        // Hide after animation
        setTimeout(() => {
            this.modal.style.display = 'none';
            
            // Clear editor items
            this.editorItems.innerHTML = '';
            
            // Destroy sortable instance
            if (this.sortable) {
                this.sortable.destroy();
                this.sortable = null;
            }
        }, 300);
    }
    
    captureItemsData() {
        // Store the original items data
        this.originalItemsData = [];
        const items = this.originalItems.querySelectorAll('li');
        
        items.forEach(item => {
            const itemId = item.dataset.itemId;
            const contentElement = item.querySelector('.mcl-item-content');
            
            // Clean up content to avoid extra whitespace
            const content = this.sanitizeItemContent(contentElement.innerHTML);
            
            let priority = 'none';
            const priorityEl = item.querySelector('.mcl-item-priority');
            if (priorityEl) {
                const priorityClass = Array.from(priorityEl.classList)
                    .find(cls => cls.startsWith('mcl-priority-'));
                
                if (priorityClass) {
                    priority = priorityClass.replace('mcl-priority-', '');
                }
            }
            
            this.originalItemsData.push({
                id: itemId,
                content: content,
                priority: priority
            });
        });
        
        // Make a deep copy for editing
        this.editingItemsData = JSON.parse(JSON.stringify(this.originalItemsData));
    }
    
    sanitizeItemContent(content) {
        if (!content) return '';
        
        // Remove leading/trailing whitespace 
        return content.trim()
            // Remove extra line breaks (more than 2 consecutive)
            .replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>')
            // Remove empty paragraphs
            .replace(/<p>(?:(?:\s|&nbsp;|<br\s*\/?>))*<\/p>/gi, '')
            // Remove any zero-width spaces
            .replace(/\u200B/g, '');
    }
    
    populateEditor() {
        this.editorItems.innerHTML = '';
        
        this.editingItemsData.forEach(item => {
            const li = this.createEditorItem(item);
            this.editorItems.appendChild(li);
        });
    }
    
    createEditorItem(item) {
        const template = document.createElement('template');
        const priorityValue = item.priority || 'none';
        
        // Create priority indicator based on display type
        let priorityIndicator;
        if (this.priorityDisplayType === 'number') {
            const priorityNumbers = {
                'none': '',
                'low': '1',
                'medium': '2',
                'high': '3',
                'critical': '4'
            };
            priorityIndicator = `<span class="mcl-priority-indicator mcl-priority-${priorityValue} mcl-priority-number">${priorityNumbers[priorityValue] || ''}</span>`;
        } else {
            priorityIndicator = `<span class="mcl-priority-indicator mcl-priority-${priorityValue}"></span>`;
        }
        
        template.innerHTML = `
            <li class="mcl-shortcode-editor-item" data-id="${item.id}">
                <div class="mcl-editor-item-handle">≡</div>
                <div class="mcl-editor-item-content" contenteditable="true">${item.content || ''}</div>
                <div class="mcl-editor-item-actions">
                    <button type="button" class="mcl-editor-item-priority" data-priority="${priorityValue}">
                        ${priorityIndicator}
                        <span class="mcl-priority-text">${this.getPriorityText(priorityValue)}</span>
                    </button>
                    <button type="button" class="mcl-editor-item-image" title="${mclShortcode.i18n.addImage || 'Add Image'}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="2">
                            <path fill="currentColor" d="M416 64H96a64.07 64.07 0 0 0-64 64v256a64.07 64.07 0 0 0 64 64h320a64.07 64.07 0 0 0 64-64V128a64.07 64.07 0 0 0-64-64Zm-80 64a48 48 0 1 1-48 48a48.05 48.05 0 0 1 48-48ZM96 416a32 32 0 0 1-32-32v-67.63l94.84-84.3a48.06 48.06 0 0 1 65.8 1.9l64.95 64.81L172.37 416Zm352-32a32 32 0 0 1-32 32H217.63l121.42-121.42a47.72 47.72 0 0 1 61.64-.16L448 333.84Z"/>
                        </svg>
                    </button>
                    <button type="button" class="mcl-editor-item-delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </li>
        `;
        return template.content.firstElementChild;
    }
    
    getPriorityText(priority) {
        const translations = {
            'none': mclShortcode.i18n.priorityNone || 'No Priority',
            'low': mclShortcode.i18n.priorityLow || 'Low Priority',
            'medium': mclShortcode.i18n.priorityMedium || 'Medium Priority',
            'high': mclShortcode.i18n.priorityHigh || 'High Priority',
            'critical': mclShortcode.i18n.priorityCritical || 'Critical Priority'
        };
        
        return translations[priority] || translations.none;
    }
    
    cyclePriority(button) {
        const priorities = ['none', 'low', 'medium', 'high', 'critical'];
        
        // Get current priority
        const currentPriority = button.dataset.priority || 'none';
        const currentIndex = priorities.indexOf(currentPriority);
        
        // Get next priority in the cycle
        const nextIndex = (currentIndex + 1) % priorities.length;
        const nextPriority = priorities[nextIndex];
        
        // Update the button's data attribute
        button.dataset.priority = nextPriority;
        
        // Update indicator based on display type
        const indicator = button.querySelector('.mcl-priority-indicator');
        indicator.className = `mcl-priority-indicator mcl-priority-${nextPriority}`;
        
        if (this.priorityDisplayType === 'number') {
            indicator.classList.add('mcl-priority-number');
            
            // Map priority to number
            const priorityNumbers = {
                'none': '',
                'low': '1',
                'medium': '2',
                'high': '3',
                'critical': '4'
            };
            
            indicator.textContent = priorityNumbers[nextPriority] || '';
        } else {
            // For color display type, clear any text content
            indicator.textContent = '';
        }
        
        // Update label text
        button.querySelector('.mcl-priority-text').textContent = this.getPriorityText(nextPriority);
    }
    
    deleteItem(item) {
        if (confirm(mclShortcode.i18n.confirmDelete || 'Are you sure you want to delete this item?')) {
            item.remove();
        }
    }
    
    addNewItem() {
        const itemId = 'item_' + Date.now();
        const newItem = {
            id: itemId,
            content: '',
            priority: 'none'
        };
        
        const li = this.createEditorItem(newItem);
        this.editorItems.appendChild(li);
        
        // Focus the new item
        setTimeout(() => {
            const contentEl = li.querySelector('[contenteditable]');
            contentEl.focus();
        }, 10);
    }
    
    initSortable() {
        if (typeof Sortable === 'undefined') {
            console.warn('Sortable.js is required for drag and drop functionality');
            return;
        }
        
        this.sortable = new Sortable(this.editorItems, {
            handle: '.mcl-editor-item-handle',
            animation: 150,
            ghostClass: 'mcl-sortable-ghost',
            dragClass: 'mcl-sortable-drag'
        });
    }
    
    async saveChanges() {
        // Prevent multiple save attempts
        if (this.saving) {
            return;
        }
        
        try {
            // Set saving state
            this.saving = true;
            
            // Show a loading state on the save button
            this.saveButton.classList.add('mcl-loading');
            this.saveButton.disabled = true;
            this.saveButton.innerHTML = '<span class="mcl-spinner"></span> ' + (mclShortcode.i18n.saving || 'Saving...');
            
            // Collect data from the editor
            const items = [];
            
            this.editorItems.querySelectorAll('li').forEach(item => {
                const itemId = item.dataset.id;
                const contentElement = item.querySelector('.mcl-editor-item-content');
                
                // First sanitize for security, then clean up formatting
                let content = this.sanitizeHtml(contentElement.innerHTML);
                content = this.sanitizeItemContent(content);
                
                // Get priority if enabled, otherwise default to 'none'
                let priority = 'none';
                if (this.priorityEnabled) {
                    const priorityBtn = item.querySelector('.mcl-editor-item-priority');
                    if (priorityBtn) {
                        priority = priorityBtn.dataset.priority;
                    }
                }
                
                items.push({
                    id: itemId,
                    content: content,
                    priority: priority
                });
            });
            
            // Validate - make sure we have at least one non-empty item
            const hasContent = items.some(item => item.content.trim() !== '');
            if (!hasContent) {
                alert(mclShortcode.i18n.emptyItems || 'Please add content to at least one item before saving.');
                this.resetSaveButton();
                return;
            }
            
            // Send data to server
            const formData = new FormData();
            formData.append('action', 'mcl_update_checklist');
            formData.append('checklist_id', this.checklistId);
            formData.append('items', JSON.stringify(items));
            formData.append('nonce', mclShortcode.nonce);
            formData.append('context', 'shortcode');
            
            try {
                const response = await fetch(mclShortcode.ajaxurl, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Show success message
                    this.showNotification('success', mclShortcode.i18n.saveSuccess || 'Changes saved successfully!');
                    
                    // Update the displayed checklist
                    this.updateDisplayedChecklist(items);
                    
                    // Close the editor after a small delay to show the success message
                    setTimeout(() => {
                        this.closeEditor();
                    }, 1000);
                } else {
                    this.showNotification('error', mclShortcode.i18n.errorSaving || 'Error saving changes.');
                    this.resetSaveButton();
                }
            } catch (error) {
                console.error('Network error when saving:', error);
                this.showNotification('error', mclShortcode.i18n.networkError || 'Network error. Please try again.');
                this.resetSaveButton();
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            this.showNotification('error', mclShortcode.i18n.errorSaving || 'Error saving changes.');
            this.resetSaveButton();
        }
    }
    
    resetSaveButton() {
        this.saveButton.classList.remove('mcl-loading');
        this.saveButton.disabled = false;
        this.saveButton.innerHTML = mclShortcode.i18n.saveChanges || 'Save Changes';
        this.saving = false;
    }
    
    showNotification(type, message) {
        // Remove any existing notification
        const existingNotification = document.querySelector('.mcl-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `mcl-notification mcl-notification-${type}`;
        notification.innerHTML = `
            <div class="mcl-notification-content">
                <span class="mcl-notification-message">${message}</span>
                <button type="button" class="mcl-notification-close">&times;</button>
            </div>
        `;
        
        // Add to the body
        document.body.appendChild(notification);
        
        // Add close button functionality
        notification.querySelector('.mcl-notification-close').addEventListener('click', () => {
            notification.classList.add('mcl-notification-hiding');
            setTimeout(() => notification.remove(), 300);
        });
        
        // Show with animation and auto-hide after a delay
        requestAnimationFrame(() => {
            notification.classList.add('mcl-notification-visible');
            
            // Auto-hide after 5 seconds for success, 8 seconds for error
            const hideDelay = type === 'success' ? 5000 : 8000;
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.classList.add('mcl-notification-hiding');
                    setTimeout(() => notification.remove(), 300);
                }
            }, hideDelay);
        });
    }
    
    updateDisplayedChecklist(items) {
        // Get current checked state
        const checkedItems = Array.from(this.originalItems.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.closest('li').dataset.itemId);
        
        // Clear the list
        this.originalItems.innerHTML = '';
        
        // Rebuild with new items
        items.forEach((item, index) => {
            const isChecked = checkedItems.includes(item.id);
            
            const li = document.createElement('li');
            li.className = 'mcl-shortcode-item';
            if (isChecked) {
                li.classList.add('mcl-shortcode-checked');
            }
            li.dataset.itemId = item.id;
            
            // Build the HTML with clean content
            let html = `
                <label class="mcl-item-label">
                    <input type="checkbox" class="mcl-item-checkbox" ${isChecked ? 'checked' : ''}>`;
            
            // Add item number if enabled
            if (this.container.querySelector('.mcl-item-number')) {
                html += `<span class="mcl-item-number">${index + 1}.</span>`;
            }
            
            // Add priority indicator if enabled and priority is set
            if (this.priorityEnabled && item.priority && item.priority !== 'none') {
                // Get priority display type
                const priorityDisplayType = this.priorityDisplayType;
                
                if (priorityDisplayType === 'number') {
                    // Number-based priority display
                    const priorityNumbers = {
                        'low': '1',
                        'medium': '2',
                        'high': '3',
                        'critical': '4'
                    };
                    const number = priorityNumbers[item.priority] || '';
                    html += `<span class="mcl-item-priority mcl-priority-${item.priority} mcl-priority-number">${number}</span>`;
                } else {
                    // Color-based priority display
                    html += `<span class="mcl-item-priority mcl-priority-${item.priority}"></span>`;
                }
            }
            
            // Add content and close the label
            html += `
                    <span class="mcl-item-content">${item.content}</span>
                </label>`;
            
            // Add drag handle if interaction is allowed
            if (this.canCheck) {
                html += `<span class="mcl-item-drag-handle">☰</span>`;
            }
            
            li.innerHTML = html;
            this.originalItems.appendChild(li);
        });
        
        // Re-initialize the shortcode handler if it exists
        if (window.MCLShortcodeHandler) {
            new MCLShortcodeHandler(this.container);
        }
    }

    handleImageButtonClick(item) {
        if (!item) return;
        
        this.currentItem = item;
        
        // Show different UI based on login state
        if (this.isLoggedIn && typeof wp !== 'undefined' && wp.media) {
            this.openMediaLibrary();
        } else {
            this.showImageUploadModal();
        }
    }
    
    openMediaLibrary() {
        // If there's an existing frame, remove it
        if (this.mediaFrame) {
            this.mediaFrame.remove();
        }
        
        // Create new media frame
        this.mediaFrame = wp.media({
            title: mclShortcode.i18n.selectImage || 'Select Image',
            library: { type: 'image' },
            multiple: false,
            button: { text: mclShortcode.i18n.insertImage || 'Insert Image' }
        });
        
        // Handle selection
        this.mediaFrame.on('select', () => {
            const attachment = this.mediaFrame.state().get('selection').first().toJSON();
            this.insertImage(attachment);
        });
        
        this.mediaFrame.open();
    }
    
    showImageUploadModal() {
        // Remove any existing modal first
        this.closeImageModal();
        
        // Create upload area modal with tabs
        this.imageModal = document.createElement('div');
        this.imageModal.className = 'mcl-modal-overlay';
        this.imageModal.innerHTML = `
            <div class="mcl-modal mcl-upload-modal">
                <div class="mcl-modal-header">
                    <h3 class="mcl-modal-title">${mclShortcode.i18n.selectImage || 'Upload or Select Image'}</h3>
                    <button type="button" class="mcl-modal-close">&times;</button>
                </div>
                <div class="mcl-modal-tabs">
                    <button type="button" class="mcl-tab-button active" data-tab="upload">${mclShortcode.i18n.uploadNew || 'Upload New'}</button>
                    <button type="button" class="mcl-tab-button" data-tab="select">${mclShortcode.i18n.selectExisting || 'Select Existing'}</button>
                </div>
                <div class="mcl-modal-content">
                    <div class="mcl-tab-content mcl-tab-upload active">
                        <div class="mcl-upload-area" id="mcl-upload-area">
                            <div class="mcl-upload-message">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                <p>${mclShortcode.i18n.dragDropImage || 'Drag and drop image here or click to select'}</p>
                                <span class="mcl-upload-requirements">${mclShortcode.i18n.imageRequirements || 'Maximum file size: 10MB. Supported formats: JPG, PNG, GIF'}</span>
                            </div>
                            <input type="file" accept="image/*" class="mcl-file-input" />
                        </div>
                        <div class="mcl-upload-preview" style="display: none;">
                            <img src="" alt="Preview" />
                            <button type="button" class="mcl-remove-preview">×</button>
                        </div>
                        <div class="mcl-upload-error" style="display: none;"></div>
                        <div class="mcl-upload-progress" style="display: none;">
                            <div class="mcl-progress-bar">
                                <div class="mcl-progress-fill"></div>
                            </div>
                            <span class="mcl-progress-text">0%</span>
                        </div>
                    </div>
                    <div class="mcl-tab-content mcl-tab-select">
                        <div class="mcl-images-grid"></div>
                        <div class="mcl-images-loading">${mclShortcode.i18n.loadingImages || 'Loading images...'}</div>
                        <div class="mcl-images-error" style="display: none;"></div>
                    </div>
                </div>
                <div class="mcl-modal-actions">
                    <button type="button" class="mcl-modal-button mcl-modal-button-primary" data-action="upload" disabled>
                        ${mclShortcode.i18n.uploadImage || 'Upload Image'}
                    </button>
                    <button type="button" class="mcl-modal-button mcl-modal-secondary" data-action="cancel">
                        ${mclShortcode.i18n.cancel || 'Cancel'}
                    </button>
                </div>
            </div>
        `;
        
        // Initialize upload area
        this.initializeImageUploadArea();
        
        // Initialize tabs
        this.initializeImageTabs();
        
        // Load existing images
        this.loadExistingImages();
        
        document.body.appendChild(this.imageModal);
        requestAnimationFrame(() => this.imageModal.classList.add('active'));
    }
    
    initializeImageTabs() {
        const tabButtons = this.imageModal.querySelectorAll('.mcl-tab-button');
        const contents = this.imageModal.querySelectorAll('.mcl-tab-content');
        const uploadButton = this.imageModal.querySelector('[data-action="upload"]');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update content visibility
                contents.forEach(content => {
                    content.classList.remove('active');
                    if (content.classList.contains(`mcl-tab-${button.dataset.tab}`)) {
                        content.classList.add('active');
                    }
                });
                
                // Update button text and state
                if (button.dataset.tab === 'select') {
                    uploadButton.textContent = mclShortcode.i18n.selectImage || 'Select Image';
                    uploadButton.disabled = true; // Enable when image is selected
                } else {
                    uploadButton.textContent = mclShortcode.i18n.uploadImage || 'Upload Image';
                    uploadButton.disabled = !this.imageModal.querySelector('.mcl-file-input').files.length;
                }
            });
        });
    }
    
    async loadExistingImages() {
        const grid = this.imageModal.querySelector('.mcl-images-grid');
        const loading = this.imageModal.querySelector('.mcl-images-loading');
        const uploadButton = this.imageModal.querySelector('[data-action="upload"]');
        
        try {
            const formData = new FormData();
            formData.append('action', 'mcl_get_uploaded_images');
            formData.append('checklist_id', this.checklistId);
            
            const response = await fetch(mclShortcode.ajaxurl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.data?.message || 'Failed to load images');
            }
            
            // Create grid of images
            grid.innerHTML = data.data.length ? data.data.map(image => `
                <div class="mcl-image-item" data-url="${image.url}">
                    <img src="${image.url}" alt="" />
                    <div class="mcl-image-info">
                        <span class="mcl-image-name">${image.filename}</span>
                        <span class="mcl-image-dimensions">${image.width}×${image.height}</span>
                    </div>
                </div>
            `).join('') : `<p class="mcl-no-images">${mclShortcode.i18n.noImagesFound || 'No images found'}</p>`;
            
            // Add click handlers
            grid.querySelectorAll('.mcl-image-item').forEach(item => {
                item.addEventListener('click', () => {
                    grid.querySelectorAll('.mcl-image-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    uploadButton.disabled = false;
                });
            });
            
        } catch (error) {
            console.error('Error loading images:', error);
            const errorElement = this.imageModal.querySelector('.mcl-images-error');
            errorElement.style.display = 'block';
            errorElement.textContent = error.message;
        } finally {
            loading.style.display = 'none';
        }
    }
    
    initializeImageUploadArea() {
        const uploadArea = this.imageModal.querySelector('.mcl-upload-area');
        const fileInput = this.imageModal.querySelector('.mcl-file-input');
        const preview = this.imageModal.querySelector('.mcl-upload-preview');
        const uploadButton = this.imageModal.querySelector('[data-action="upload"]');
        const errorDisplay = this.imageModal.querySelector('.mcl-upload-error');
        
        // Handle dragover and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('mcl-drop-active');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('mcl-drop-active');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files[0]);
            }
            
            uploadArea.classList.remove('mcl-drop-active');
        });
        
        // Handle manual file selection
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                this.handleFileSelection(e.target.files[0]);
            }
        });
        
        // Handle preview removal
        this.imageModal.querySelector('.mcl-remove-preview').addEventListener('click', () => {
            preview.style.display = 'none';
            uploadArea.style.display = 'flex';
            uploadButton.disabled = true;
            fileInput.value = '';
        });
        
        // Handle upload/selection button
        const actionButton = this.imageModal.querySelector('[data-action="upload"]');
        actionButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const activeTab = this.imageModal.querySelector('.mcl-tab-button.active');
            if (activeTab.dataset.tab === 'select') {
                // Handle image selection
                const selectedImage = this.imageModal.querySelector('.mcl-image-item.selected');
                if (selectedImage) {
                    const imageUrl = selectedImage.dataset.url;
                    const img = selectedImage.querySelector('img');
                    // Create attachment data structure
                    const attachment = {
                        url: imageUrl,
                        alt: '',
                        width: img.naturalWidth,
                        height: img.naturalHeight
                    };
                    this.insertImage(attachment);
                    this.closeImageModal();
                }
            } else {
                // Handle file upload
                const file = this.imageModal.querySelector('.mcl-file-input').files[0];
                if (file) {
                    await this.uploadFile(file);
                }
            }
        });
        
        // Handle modal close
        this.imageModal.querySelector('.mcl-modal-close').addEventListener('click', () => {
            this.closeImageModal();
        });
        
        this.imageModal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            this.closeImageModal();
        });
    }
    
    handleFileSelection(file) {
        const uploadArea = this.imageModal.querySelector('.mcl-upload-area');
        const preview = this.imageModal.querySelector('.mcl-upload-preview');
        const previewImg = preview.querySelector('img');
        const uploadButton = this.imageModal.querySelector('[data-action="upload"]');
        const errorDisplay = this.imageModal.querySelector('.mcl-upload-error');
        const fileInput = this.imageModal.querySelector('.mcl-file-input');
        
        // Validate file
        if (!this.validateFile(file)) {
            return;
        }
        
        // Clear any previous errors
        errorDisplay.style.display = 'none';
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            uploadArea.style.display = 'none';
            preview.style.display = 'block';
            uploadButton.disabled = false;
        };
        reader.readAsDataURL(file);
        
        // Update file input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
    }
    
    validateFile(file) {
        const errorDisplay = this.imageModal.querySelector('.mcl-upload-error');
        const maxSize = 10 * 1024 * 1024;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        
        if (!allowedTypes.includes(file.type)) {
            this.showImageError(mclShortcode.i18n.invalidFileType || 'Invalid file type. Please upload a JPG, PNG, or GIF image.');
            return false;
        }
        
        if (file.size > maxSize) {
            this.showImageError(mclShortcode.i18n.fileTooLarge || 'File is too large. Maximum size is 10MB.');
            return false;
        }
        
        return true;
    }
    
    showImageError(message) {
        const errorDisplay = this.imageModal.querySelector('.mcl-upload-error');
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
    }
    
    async uploadFile(file) {
        const progressBar = this.imageModal.querySelector('.mcl-upload-progress');
        const progressFill = progressBar.querySelector('.mcl-progress-fill');
        const progressText = progressBar.querySelector('.mcl-progress-text');
        const uploadButton = this.imageModal.querySelector('[data-action="upload"]');
        
        // Show progress bar
        progressBar.style.display = 'flex';
        uploadButton.disabled = true;
        
        try {
            const formData = new FormData();
            formData.append('action', 'mcl_upload_image');
            formData.append('file', file);
            formData.append('checklist_id', this.checklistId);
            formData.append('nonce', mclShortcode.nonce);
            
            // Use XMLHttpRequest for upload progress
            const xhr = new XMLHttpRequest();
            
            // Setup progress tracking
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    progressFill.style.width = percentComplete + '%';
                    progressText.textContent = percentComplete + '%';
                }
            });
            
            // Handle completion
            return new Promise((resolve, reject) => {
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            
                            if (response.success) {
                                this.insertImage(response.data);
                                this.closeImageModal();
                                resolve();
                            } else {
                                this.showImageError(response.data?.message || mclShortcode.i18n.errorUploadingImage || 'Upload failed. Please try again.');
                                reject(new Error(response.data?.message || 'Upload failed'));
                            }
                        } catch (error) {
                            console.error('JSON parse error:', error);
                            this.showImageError(mclShortcode.i18n.errorUploadingImage || 'Upload failed. Invalid server response.');
                            reject(error);
                        }
                    } else {
                        this.showImageError(mclShortcode.i18n.errorUploadingImage || 'Upload failed. Server error.');
                        reject(new Error('Server error: ' + xhr.status));
                    }
                    
                    // Hide progress
                    progressBar.style.display = 'none';
                    uploadButton.disabled = false;
                });
                
                xhr.addEventListener('error', () => {
                    this.showImageError(mclShortcode.i18n.errorUploadingImage || 'Upload failed. Network error.');
                    progressBar.style.display = 'none';
                    uploadButton.disabled = false;
                    reject(new Error('Network error'));
                });
                
                xhr.open('POST', mclShortcode.ajaxurl, true);
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                xhr.send(formData);
            });
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showImageError(mclShortcode.i18n.errorUploadingImage || 'Upload failed. Please try again.');
            progressBar.style.display = 'none';
            uploadButton.disabled = false;
        }
    }
    
    closeImageModal() {
        if (this.imageModal) {
            this.imageModal.classList.remove('active');
            setTimeout(() => {
                if (this.imageModal && this.imageModal.parentNode) {
                    this.imageModal.parentNode.removeChild(this.imageModal);
                }
                this.imageModal = null;
            }, 300);
        }
    }
    
    insertImage(imageData) {
        if (!this.currentItem) return;
        
        const contentDiv = this.currentItem.querySelector('.mcl-editor-item-content');
        if (!contentDiv) return;
        
        // Create image element
        const img = document.createElement('img');
        img.src = imageData.url;
        img.alt = imageData.alt || '';
        img.className = 'mcl-item-image';
        img.setAttribute('data-mcl-image', 'true');
        
        // Calculate dimensions maintaining aspect ratio
        const maxWidth = 400;
        const aspectRatio = imageData.height / imageData.width;
        let newWidth, newHeight;
        
        if (imageData.width > maxWidth) {
            newWidth = maxWidth;
            newHeight = Math.round(maxWidth * aspectRatio);
        } else {
            newWidth = imageData.width;
            newHeight = imageData.height;
        }
        
        // Set constrained dimensions
        img.width = newWidth;
        img.height = newHeight;
        img.style.width = `${newWidth}px`;
        img.style.height = `${newHeight}px`;
        
        // Insert image and add line break after
        contentDiv.appendChild(img);
        
        // Clear the current item reference
        this.currentItem = null;
    }

    handleSelectionChange(e = null) {
        // We don't want to show indicators when the toolbar is visible
        if (this.isToolbarVisible) return;
        
        // Clear any existing timeout
        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
        }
        
        // Small delay to ensure selection is stable
        this.selectionTimeout = setTimeout(() => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (selectedText && this.isValidSelection(selection)) {
                const range = selection.getRangeAt(0);
                const containsLink = this.selectionContainsLink(range);
                
                // Only show indicator if we have a valid selection without toolbar
                if (!this.isToolbarVisible) {
                    this.showSelectionIndicator(selection);
                }
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
        while (container && !container.classList?.contains('mcl-editor-item-content')) {
            container = container.parentNode;
        }

        // Make sure we're within an editable content area and not in the toolbar
        return container && 
               container.matches('[contenteditable="true"]') && 
               !container.closest('.mcl-link-toolbar') &&
               selection.toString().trim().length > 0; // Ensure there's actual text selected
    }
    
    handlePaste(e) {
        // Prevent default paste behavior
        e.preventDefault();
        e.stopPropagation();
        
        // Only handle paste in editable content areas
        if (!e.target.matches('.mcl-editor-item-content[contenteditable="true"]')) {
            return;
        }
        
        // Get clipboard content
        const plainText = (e.originalEvent || e).clipboardData.getData('text/plain');
        const htmlText = (e.originalEvent || e).clipboardData.getData('text/html');
        
        let processedContent;
        
        if (htmlText) {
            // For HTML content, first security sanitize, then format
            const sanitizedHtml = this.sanitizeHtml(htmlText);
            processedContent = this.sanitizeItemContent(sanitizedHtml);
        } else {
            // For plain text, check if it's a URL, then clean
            const linkedText = this.convertUrlsToLinks(plainText);
            processedContent = this.sanitizeItemContent(linkedText);
        }
        
        // Insert at current selection
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            // Create temporary container for the sanitized content
            const temp = document.createElement('div');
            temp.innerHTML = processedContent;
            
            // Create a document fragment
            const fragment = document.createDocumentFragment();
            while (temp.firstChild) {
                fragment.appendChild(temp.firstChild);
            }
            
            range.insertNode(fragment);
            
            // Move cursor to end
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    
    convertUrlsToLinks(text) {
        // URL regex pattern
        const urlRegex = /(https?:\/\/(?:www\.|(?!www))[^\s.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi;
        
        // First escape HTML special characters
        const escapedText = text.replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
        
        // Then convert URLs to anchor tags
        return escapedText.replace(urlRegex, (url) => {
            try {
                // Ensure URL has protocol
                const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                const parsedUrl = new URL(fullUrl);
                
                // Only allow http and https protocols
                if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
                    return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
                }
                return url;
            } catch {
                return url;
            }
        });
    }
    
    sanitizeHtml(content) {
        // Create a safe div in memory
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        try {
            // Use the same strict whitelist approach as the drawer
            const allowedTags = ['a', 'b', 'strong', 'i', 'em', 'u', 'span', 'br', 'img'];
            const allowedAttrs = {
                'all': ['class', 'style', 'id'],
                'a': ['href', 'target', 'rel'],
                'img': ['src', 'alt', 'width', 'height', 'data-mcl-image']
            };
            
            // Recursive function to clean nodes
            const cleanNode = (node) => {
                // Handle text nodes (always safe)
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.cloneNode(true);
                }
                
                // For element nodes
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const tagName = node.tagName.toLowerCase();
                    
                    // Check if this tag is allowed
                    if (!allowedTags.includes(tagName)) {
                        // Convert disallowed tags to text
                        return document.createTextNode(node.textContent);
                    }
                    
                    // Create a clean element
                    const cleanEl = document.createElement(tagName);
                    
                    // Handle specific attributes based on tag
                    Array.from(node.attributes).forEach(attr => {
                        const attrName = attr.name.toLowerCase();
                        
                        // Check if attribute is allowed for this tag or all tags
                        if (
                            (allowedAttrs['all'] && allowedAttrs['all'].includes(attrName)) ||
                            (allowedAttrs[tagName] && allowedAttrs[tagName].includes(attrName))
                        ) {
                            // Special handling for href attributes
                            if (attrName === 'href') {
                                // Only allow http/https URLs
                                const url = attr.value;
                                if (this.isValidUrl(url)) {
                                    // Normalize URL with protocol if needed
                                    if (!/^https?:\/\//i.test(url)) {
                                        cleanEl.setAttribute(attrName, 'https://' + url);
                                    } else {
                                        cleanEl.setAttribute(attrName, url);
                                    }
                                }
                            }
                            // Special handling for src attributes
                            else if (attrName === 'src') {
                                const url = attr.value;
                                // Only allow http/https URLs
                                if (/^https?:\/\//i.test(url)) {
                                    cleanEl.setAttribute(attrName, url);
                                }
                            } 
                            // For other allowed attributes
                            else {
                                cleanEl.setAttribute(attrName, attr.value);
                            }
                        }
                    });
                    
                    // Special handling for links
                    if (tagName === 'a') {
                        // Always set these security attributes
                        cleanEl.setAttribute('target', '_blank');
                        cleanEl.setAttribute('rel', 'noopener noreferrer');
                    }
                    
                    // Recursively clean children
                    Array.from(node.childNodes).forEach(child => {
                        const cleanChild = cleanNode(child);
                        if (cleanChild) {
                            cleanEl.appendChild(cleanChild);
                        }
                    });
                    
                    return cleanEl;
                }
                
                // If not a text or element node, don't include it
                return null;
            };
            
            // Clean all nodes in the document fragment
            const fragment = document.createDocumentFragment();
            Array.from(tempDiv.childNodes).forEach(node => {
                const cleanedNode = cleanNode(node);
                if (cleanedNode) {
                    fragment.appendChild(cleanedNode);
                }
            });
            
            // Create output with clean HTML
            const output = document.createElement('div');
            output.appendChild(fragment);
            return output.innerHTML;
            
        } catch (e) {
            console.error('Error sanitizing content:', e);
            // If there's an error, strip all HTML as a fallback
            return tempDiv.textContent;
        }
    }
    
    cleanPastedHTML(html) {
        // Use DOMParser to parse the HTML safely
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Just delegate to the main sanitization function
        return this.sanitizeHtml(doc.body.innerHTML);
    }
    
    isValidUrl(url) {
        if (!url) return false;
        
        // Remove whitespace
        url = url.trim();
        
        // Check for malicious URL schemes
        const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
        const lowerUrl = url.toLowerCase();
        for (const scheme of dangerousSchemes) {
            if (lowerUrl.startsWith(scheme)) {
                return false;
            }
        }
        
        // If no protocol specified, consider if we should add https://
        if (!/^https?:\/\//i.test(url)) {
            // Check if it looks like a valid domain
            if (/^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*/i.test(url)) {
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
                <button type="button" class="mcl-add-link-btn" title="${mclShortcode.i18n.insertLink || 'Add link (Ctrl/Cmd + K)'}" 
                        style="${containsLink ? 'display: none;' : ''}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                </button>
                <button type="button" class="mcl-remove-link-btn" title="${mclShortcode.i18n.removeLink || 'Remove link'}" 
                        style="${!containsLink ? 'display: none;' : ''}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        
        // Get container dimensions
        const modalRect = this.modal.getBoundingClientRect();
        const containerRect = this.editorItems.getBoundingClientRect();
        const scrollTop = this.editorItems.scrollTop || 0;
        
        // Calculate position relative to the modal
        const relativeTop = rect.top - containerRect.top + scrollTop;
        const relativeLeft = rect.left - containerRect.left;
        
        // Position indicator with offset
        const verticalOffset = 24;
        
        indicator.style.position = 'absolute';
        indicator.style.top = `${relativeTop - verticalOffset}px`;
        indicator.style.left = `${relativeLeft + (rect.width / 2)}px`;
        indicator.style.transform = 'translateX(-50%)';
        
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
        
        // Add to editor container
        this.editorItems.appendChild(indicator);
        this.currentIndicator = indicator;
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
    
    removeRemoveLinkIndicator() {
        if (this.currentRemoveIndicator && this.currentRemoveIndicator.parentNode) {
            this.currentRemoveIndicator.parentNode.removeChild(this.currentRemoveIndicator);
        }
        this.currentRemoveIndicator = null;
        this.currentLinkElement = null;
    }
    
    removeLink(range) {
        // Clone the range to avoid modifying the original selection
        let clonedRange;
        
        if (range instanceof Range) {
            clonedRange = range.cloneRange();
        } else {
            // If we're given an element (e.g., a link), create a range from it
            const linkElement = range;
            clonedRange = document.createRange();
            clonedRange.selectNodeContents(linkElement);
        }
        
        const selection = window.getSelection();
        
        try {
            // Check if selection is entirely within a link
            let linkElement;
            
            if (range instanceof Range) {
                linkElement = range.commonAncestorContainer;
                while (linkElement && !linkElement.matches?.('a')) {
                    linkElement = linkElement.parentNode;
                }
            } else {
                linkElement = range; // The element passed directly
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
            } else if (range instanceof Range) {
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
            this.removeRemoveLinkIndicator();
            
        } catch (error) {
            console.error('Error removing link:', error);
            
            // Restore original selection in case of error
            if (range instanceof Range) {
                selection.removeAllRanges();
                selection.addRange(clonedRange);
            }
        }
    }
    
    createLinkToolbar() {
        // Remove any existing toolbar first
        if (this.linkToolbar) {
            if (this.linkToolbar.parentNode) {
                this.linkToolbar.parentNode.removeChild(this.linkToolbar);
            }
            this.linkToolbar = null;
        }
        
        // Create the toolbar
        this.linkToolbar = document.createElement('div');
        this.linkToolbar.className = 'mcl-link-toolbar';
        this.linkToolbar.style.position = 'absolute';
        this.linkToolbar.style.display = 'none'; // Start hidden
        this.linkToolbar.innerHTML = `
            <div class="mcl-link-toolbar-inner">
                <input type="text" 
                       placeholder="${mclShortcode.i18n.enterUrl || 'Enter URL (https:// or http://)'}" 
                       class="mcl-link-input">
                <button type="button" class="mcl-link-submit">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            <div class="mcl-link-error"></div>
        `;
        
        // Append to document body for proper z-index and positioning
        document.body.appendChild(this.linkToolbar);
        
        const input = this.linkToolbar.querySelector('.mcl-link-input');
        const submit = this.linkToolbar.querySelector('.mcl-link-submit');
        const errorDiv = this.linkToolbar.querySelector('.mcl-link-error');
        
        // Handle input validation
        input.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            submit.disabled = !this.isValidUrl(value) && value !== '';
            
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
                    this.showLinkError(mclShortcode.i18n.pleaseEnterUrl || 'Please enter a URL');
                    return;
                }
                
                if (!this.isValidUrl(value)) {
                    this.showLinkError(mclShortcode.i18n.invalidUrl || 'Please enter a valid URL starting with http:// or https://');
                    return;
                }
                
                this.createLink(value);
            }
        });
        
        // Handle submit button click
        submit.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const value = input.value.trim();
            if (!value) {
                this.showLinkError(mclShortcode.i18n.pleaseEnterUrl || 'Please enter a URL');
                input.focus();
                return;
            }
            
            if (!this.isValidUrl(value)) {
                this.showLinkError(mclShortcode.i18n.invalidUrl || 'Please enter a valid URL starting with http:// or https://');
                input.focus();
                return;
            }
            
            this.createLink(value);
        });
        
        // Prevent toolbar interactions from affecting selection
        this.linkToolbar.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    }
    
    showLinkError(message) {
        const errorDiv = this.linkToolbar.querySelector('.mcl-link-error');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Clear error after 3 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }, 3000);
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
        while (container && !container.classList?.contains('mcl-editor-item-content')) {
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
            
            // Create and position toolbar
            this.showToolbar(range);
            
            // Remove the indicator since we're showing the toolbar
            this.removeSelectionIndicator();
        }
    }
    
    showToolbar(range) {
        if (!this.linkToolbar || !range) return;
        
        // Get selection rectangle
        const rect = range.getBoundingClientRect();
        
        // Position relative to window (not container) for better positioning
        const top = rect.top + window.scrollY - this.linkToolbar.offsetHeight - 10; // 10px offset
        const left = rect.left + window.scrollX + (rect.width / 2);
        
        // Keep toolbar within viewport
        const minLeft = 10;
        const maxLeft = window.innerWidth - this.linkToolbar.offsetWidth - 10;
        const boundedLeft = Math.max(minLeft, Math.min(left - (this.linkToolbar.offsetWidth / 2), maxLeft));
        
        // Reset toolbar state
        const input = this.linkToolbar.querySelector('.mcl-link-input');
        const submit = this.linkToolbar.querySelector('.mcl-link-submit');
        const errorDiv = this.linkToolbar.querySelector('.mcl-link-error');
        
        input.value = '';
        submit.disabled = true;
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
        
        // Position and show toolbar
        this.linkToolbar.style.top = `${top}px`;
        this.linkToolbar.style.left = `${boundedLeft}px`;
        this.linkToolbar.style.display = 'block';
        
        // Focus input after displaying
        setTimeout(() => {
            input.focus();
        }, 10);
        
        this.isToolbarVisible = true;
    }
    
    hideToolbar() {
        if (!this.linkToolbar) return;
        
        this.linkToolbar.style.display = 'none';
        this.isToolbarVisible = false;
        this.currentSelection = null;
    }
    
    createLink(url) {
        if (!this.currentSelection || !url) return;
        
        try {
            // Sanitize URL (extra protection)
            if (!this.isValidUrl(url)) {
                console.warn('Invalid URL rejected:', url);
                return;
            }
            
            // Normalize URL
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }
            
            // Get selection from stored range
            const selection = window.getSelection();
            const range = this.currentSelection.range;
            
            // Select the previously selected text
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Create a new anchor element with safe attributes
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            
            // Extract the selected content
            const fragment = range.extractContents();
            
            // First sanitize for security, then clean up formatting
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(fragment);
            tempDiv.innerHTML = this.sanitizeHtml(tempDiv.innerHTML);
            const cleanContent = this.sanitizeItemContent(tempDiv.innerHTML);
            tempDiv.innerHTML = cleanContent;
            
            // Get the sanitized content
            while (tempDiv.firstChild) {
                link.appendChild(tempDiv.firstChild);
            }
            
            // Insert the link
            range.insertNode(link);
            
            // Clean up
            this.hideToolbar();
            
            // Move cursor after link
            const newRange = document.createRange();
            newRange.setStartAfter(link);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            
        } catch (error) {
            console.error('Error creating link:', error);
        }
    }

    handleItemKeydown(e) {
        // Only handle events in contenteditable
        if (!e.target.matches('.mcl-editor-item-content')) {
            return;
        }
        
        // Handle Enter key
        if (e.key === 'Enter') {
            // If shift is pressed, allow default behavior (line break)
            if (e.shiftKey) {
                return;
            }
            
            // Prevent default behavior (which would create a div or p)
            e.preventDefault();
            
            // Get the current item
            const currentItem = e.target.closest('.mcl-shortcode-editor-item');
            if (!currentItem) {
                return;
            }
            
            // Create a new item after the current one
            this.addNewItemAfterCurrent(currentItem);
        }
    }
    
    addNewItemAfterCurrent(currentItem) {
        if (!currentItem) return;
        
        // Generate new item ID
        const itemId = 'item_' + Date.now();
        
        // Create new item
        const newItem = this.createEditorItem({
            id: itemId,
            content: '',
            priority: 'none'
        });
        
        // Insert after current item
        currentItem.insertAdjacentElement('afterend', newItem);
        
        // Focus the new item's content
        setTimeout(() => {
            const contentEl = newItem.querySelector('.mcl-editor-item-content');
            if (contentEl) {
                contentEl.focus();
            }
        }, 10);
        
        return newItem;
    }
}

// Initialize editors when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.mcl-shortcode-container[data-can-edit="1"]');
    containers.forEach(container => {
        new MCLShortcodeEditor(container);
    });
}); 