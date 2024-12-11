import { AjaxUtils, ValidationUtils, PriorityUtils } from '../common/mcl-utils.js';
import { LinkManager } from './mcl-link-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    const EditChecklistLayout = {
        init() {
            this.createToggleButton();
            this.initLayoutToggle();
            this.loadSavedLayout();
        },

        createToggleButton() {
            const titleWrapper = document.querySelector('.mcl-actions');
            if (!titleWrapper) return;

            const button = document.createElement('button');
            button.className = 'mcl-layout-toggle';
            button.innerHTML = `
                <span class="dashicons dashicons-editor-table"></span>
                <span class="toggle-text">Switch Form Layout</span>
            `;
            
            titleWrapper.appendChild(button);
        },

        initLayoutToggle() {
            const form = document.querySelector('.mcl-form');
            const toggleButton = document.querySelector('.mcl-layout-toggle');
            
            if (!form || !toggleButton) return;

            toggleButton.addEventListener('click', () => {
                form.classList.toggle('side-by-side');
                toggleButton.classList.toggle('side-by-side');
                
                // Save layout preference
                const isSideBySide = form.classList.contains('side-by-side');
                localStorage.setItem('mclEditLayoutPreference', isSideBySide ? 'side-by-side' : 'standard');
            });
        },

        loadSavedLayout() {
            const savedLayout = localStorage.getItem('mclEditLayoutPreference');
            if (savedLayout === 'side-by-side') {
                const form = document.querySelector('.mcl-form');
                const toggleButton = document.querySelector('.mcl-layout-toggle');
                
                if (form && toggleButton) {
                    form.classList.add('side-by-side');
                    toggleButton.classList.add('side-by-side');
                }
            }
        }
    };

    EditChecklistLayout.init();
});

document.addEventListener('DOMContentLoaded', function() {
    // URL Pattern Management
    const urlList = document.getElementById('mcl-url-list');
    const addUrlButton = document.getElementById('mcl-add-url');
    const loadEverywhereToggle = document.getElementById('mcl_load_everywhere');
    const conditionalOptions = document.querySelector('.mcl-conditional-options');

    if (addUrlButton && urlList) {
        addUrlButton.addEventListener('click', () => {
            const urlItem = document.createElement('div');
            urlItem.className = 'mcl-url-item';
            urlItem.innerHTML = `
                <input type="text" name="allowed_urls[]" class="mcl-input" 
                       placeholder="Enter URL pattern (e.g., /posts/*)">
                <button type="button" class="mcl-remove-url mcl-button mcl-button-icon">×</button>
            `;
            urlList.appendChild(urlItem);
        });

        urlList.addEventListener('click', (e) => {
            if (e.target.matches('.mcl-remove-url')) {
                e.target.closest('.mcl-url-item').remove();
            }
        });
    }

    if (loadEverywhereToggle && conditionalOptions) {
        loadEverywhereToggle.addEventListener('change', () => {
            conditionalOptions.style.display = loadEverywhereToggle.checked ? 'none' : 'flex';
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const EditChecklist = {
        itemIndex: 0,
        shortcutHandler: null,
        hasUnsavedChanges: false,
        linkManager: null,
        currentStep: 1,
        totalSteps: 4,
        validationState: [false, false, false, false],
        inviteLinkManager: null,

        init() {
            this.initMultiStepForm();
            this.initItemIndex();
            this.initItemsHandling();
            this.initShortcutHandling();
            this.initSortable();
            this.initFormValidation();
            this.initPriorityHandling();
            this.initPriorityDisplayTypeHandling();
            this.initUnsavedChangesHandler();
            this.initLinkManager();
            this.initChecklistPriorityHandling();
            this.initAccessControlHandling();
            this.initInviteLinkManager();
            this.initForceDeleteLockButton();
            this.initResetScheduleHandling();
            this.initTagManagement();
            this.hasUnsavedChanges = false;
        },

        // Multi-step form initialization
        initMultiStepForm() {
            this.form = document.querySelector('.mcl-form');
            this.steps = document.querySelectorAll('.mcl-step');
            this.progressLine = document.querySelector('.mcl-progress-line-fill');
            this.stepIndicators = document.querySelectorAll('.mcl-step-indicator');
            this.nextButton = document.querySelector('.mcl-next-step');
            this.prevButton = document.querySelector('.mcl-prev-step');
            this.submitButton = document.querySelector('.mcl-submit-form');
        
            if (!this.form) return;
        
            // Bind navigation events
            if (this.nextButton) {
                this.nextButton.addEventListener('click', () => this.handleNext());
            }
            if (this.prevButton) {
                this.prevButton.addEventListener('click', () => this.handlePrev());
            }
        
            // Step indicator clicks
            this.stepIndicators.forEach(indicator => {
                indicator.addEventListener('click', () => {
                    const stepNumber = parseInt(indicator.dataset.step);
                    this.goToStep(stepNumber);
                });
            });
        
            // Initialize first step
            this.updateProgress();
            this.updateNavigationState();
        },

        initForceDeleteLockButton() {
            const forceDeleteLockButton = document.getElementById('mcl-force-delete-lock');
            if (forceDeleteLockButton) {
                forceDeleteLockButton.addEventListener('click', () => {
                    if (confirm('Are you sure you want to force delete the lock on this checklist?')) {
                        this.forceDeleteLock();
                    }
                });
            }
        },
    
        async forceDeleteLock() {
            const checklistId = document.querySelector('input[name="checklist_id"]')?.value;
            if (!checklistId) {
                alert('Checklist ID is missing.');
                return;
            }
    
            try {
                const response = await fetch(ajaxurl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        action: 'mcl_force_delete_lock',
                        nonce: mclAdmin.nonces.forceDeleteLock,
                        checklist_id: checklistId
                    })
                });
    
                const data = await response.json();
    
                if (data.success) {
                    alert('Lock has been successfully deleted.');
                } else {
                    alert('Failed to delete the lock: ' + (data.data.message || 'Unknown error.'));
                }
            } catch (error) {
                console.error('Error deleting lock:', error);
                alert('An error occurred while deleting the lock.');
            }
        },

        initInviteLinkManager() {
            // Only initialize if we're on edit page (checklist_id exists)
            const checklistId = document.querySelector('input[name="checklist_id"]')?.value;
            if (checklistId) {
                this.inviteLinkManager = new InviteLinkManager(this);
            }
        },

        handleNext() {
            if (this.validateForm()) {
                if (this.currentStep < this.totalSteps) {
                    this.goToStep(this.currentStep + 1);
                }
            }
        },

        handlePrev() {
            if (this.currentStep > 1) {
                this.goToStep(this.currentStep - 1);
            }
        },

        goToStep(stepNumber) {
            // Hide current step
            document.querySelector(`.mcl-step[data-step="${this.currentStep}"]`)
                .classList.remove('active');
            
            // Show new step
            document.querySelector(`.mcl-step[data-step="${stepNumber}"]`)
                .classList.add('active');
            
            // Update current step
            this.currentStep = stepNumber;
            
            // Update UI
            this.updateProgress();
            this.updateNavigationState();
        },

        updateProgress() {
            if (this.progressLine) {
                const progress = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
                this.progressLine.style.width = `${progress}%`;
            }
    
            this.stepIndicators.forEach(indicator => {
                const stepNumber = parseInt(indicator.dataset.step);
                indicator.classList.toggle('active', stepNumber === this.currentStep);
                indicator.classList.toggle('completed', stepNumber < this.currentStep);
            });
        },

        updateNavigationState() {
            if (this.prevButton) {
                this.prevButton.style.display = this.currentStep === 1 ? 'none' : 'flex';
            }
        
            if (this.nextButton) {
                if (this.currentStep === this.totalSteps) {
                    this.nextButton.style.display = 'none';
                } else {
                    this.nextButton.style.display = 'flex';
                }
            }
        },

        updateStepIndicator(stepNumber, isValid) {
            const indicator = document.querySelector(`.mcl-step-indicator[data-step="${stepNumber}"]`);
            if (indicator) {
                indicator.classList.toggle('completed', isValid);
            }
        },

        initChecklistPriorityHandling() {
            const prioritySelect = document.getElementById('mcl_priority');
            if (prioritySelect) {
                // Update indicator color when priority changes
                prioritySelect.addEventListener('change', () => {
                    const selectedOption = prioritySelect.options[prioritySelect.selectedIndex];
                    const color = selectedOption.getAttribute('data-color');
                    const indicator = prioritySelect.closest('.mcl-priority-select').querySelector('.mcl-priority-indicator');
                    
                    if (indicator && color) {
                        indicator.style.backgroundColor = color;
                    }
                });
            }
        },

        initAccessControlHandling() {
            // Handle Public Access toggle display
            const publicAccessToggle = document.getElementById('mcl_public_access');
            const publicAccessOptions = document.querySelector('.mcl-public-access-options');

            if (publicAccessToggle && publicAccessOptions) {
                publicAccessToggle.addEventListener('change', function() {
                    publicAccessOptions.style.display = this.checked ? 'flex' : 'none';
                });
            }

            // Handle Floating Button Trigger display
            const triggerButtonCheckbox = document.getElementById('mcl_trigger_button');
            const floatingButtonOptions = document.querySelector('.mcl-floating-button-options');

            if (triggerButtonCheckbox && floatingButtonOptions) {
                triggerButtonCheckbox.addEventListener('change', function() {
                    floatingButtonOptions.style.display = this.checked ? 'flex' : 'none';
                });
            }

            // Handle Enable Item Priorities toggle
            const enableItemPriorityToggle = document.getElementById('mcl_enable_item_priority');
            const priorityDisplayOptions = document.querySelector('.mcl-priority-display-options');

            if (enableItemPriorityToggle && priorityDisplayOptions) {
                enableItemPriorityToggle.addEventListener('change', function() {
                    priorityDisplayOptions.style.display = this.checked ? 'flex' : 'none';
                });
            }

            // Handle Enable Rate Limiting toggle
            const enableRateLimitToggle = document.getElementById('mcl_enable_rate_limit');
            const rateLimitOptions = document.querySelector('.mcl-rate-limit-options');

            if (enableRateLimitToggle && rateLimitOptions) {
                enableRateLimitToggle.addEventListener('change', function() {
                    rateLimitOptions.style.display = this.checked ? 'flex' : 'none';
                });
            }

            // Initialize select elements with multiple attribute (for Allowed User Roles and Allowed Users)
            this.initMultiSelects();
        },

        initMultiSelects() {
            const multiSelectElements = document.querySelectorAll('#mcl_access_roles, #mcl_access_users, #mcl_allowed_pages');

            multiSelectElements.forEach((element) => {
                if (element) {
                    new Choices(element, {
                        removeItemButton: true,
                        searchResultLimit: 10,
                        shouldSort: false,
                        placeholder: true,
                        placeholderValue: 'Click here to search and select',
                        searchPlaceholderValue: 'null',
                    });
                }
            });
        },

        // Add to EditChecklist class
        initTagManagement() {
            const input = document.getElementById('mcl_tags_input');
            const tagsList = document.getElementById('mcl_tags_list');
            if (!input || !tagsList) return;

            const colors = [
                '#3498db', // blue
                '#2ecc71', // green
                '#e74c3c', // red
                '#f39c12', // orange
                '#9b59b6', // purple
                '#1abc9c', // turquoise
                '#f1c40f', // yellow
                '#95a5a6'  // gray
            ];

            let colorPickerPopup = null;

            // Handle tag input
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const tagName = input.value.trim();
                    if (tagName) {
                        addTag(tagName, colors[0]); // Default to first color
                        input.value = '';
                    }
                }
            });

            // Handle tag actions delegation
            tagsList.addEventListener('click', (e) => {
                const colorPicker = e.target.closest('.mcl-tag-color-picker');
                const removeButton = e.target.closest('.mcl-tag-remove');
                
                if (colorPicker) {
                    showColorPicker(colorPicker);
                } else if (removeButton) {
                    removeButton.closest('.mcl-tag-item').remove();
                    this.hasUnsavedChanges = true;
                }
            });

            function addTag(name, color) {
                const tagItem = document.createElement('div');
                tagItem.className = 'mcl-tag-item';
                tagItem.dataset.tag = name;
                
                tagItem.innerHTML = `
                    <input type="hidden" name="mcl_tags[]" value="${escapeHtml(name)}">
                    <input type="hidden" name="mcl_tag_colors[]" value="${color}">
                    <span class="mcl-tag-text" style="background-color: ${color}">${escapeHtml(name)}</span>
                    <div class="mcl-tag-actions">
                        <button type="button" class="mcl-tag-color-picker" title="Change color">
                            <span class="dashicons dashicons-color-picker"></span>
                        </button>
                        <button type="button" class="mcl-tag-remove" title="Remove tag">×</button>
                    </div>
                `;
                
                tagsList.appendChild(tagItem);
                this.hasUnsavedChanges = true;
            }

            function showColorPicker(button) {
                // Remove any existing color picker
                if (colorPickerPopup) {
                    colorPickerPopup.remove();
                }

                const tagItem = button.closest('.mcl-tag-item');
                const tagText = tagItem.querySelector('.mcl-tag-text');
                const colorInput = tagItem.querySelector('[name="mcl_tag_colors[]"]');
                const currentColor = colorInput.value;

                // Create color picker popup
                colorPickerPopup = document.createElement('div');
                colorPickerPopup.className = 'mcl-color-picker-popup';
                
                // Add color options
                colors.forEach(color => {
                    const option = document.createElement('div');
                    option.className = `color-option${color === currentColor ? ' selected' : ''}`;
                    option.style.backgroundColor = color;
                    option.addEventListener('click', () => {
                        tagText.style.backgroundColor = color;
                        colorInput.value = color;
                        colorPickerPopup.remove();
                        colorPickerPopup = null;
                        this.hasUnsavedChanges = true;
                    });
                    colorPickerPopup.appendChild(option);
                });

                // Position the popup
                const rect = button.getBoundingClientRect();
                colorPickerPopup.style.top = `${rect.bottom + window.scrollY + 5}px`;
                colorPickerPopup.style.left = `${rect.left + window.scrollX}px`;

                // Add to document and handle outside clicks
                document.body.appendChild(colorPickerPopup);
                setTimeout(() => {
                    document.addEventListener('click', function closePopup(e) {
                        if (!colorPickerPopup.contains(e.target) && !button.contains(e.target)) {
                            colorPickerPopup.remove();
                            colorPickerPopup = null;
                            document.removeEventListener('click', closePopup);
                        }
                    });
                }, 0);
            }

            function escapeHtml(str) {
                const div = document.createElement('div');
                div.textContent = str;
                return div.innerHTML;
            }
        },

        // Keep all existing methods below this point
        initLinkManager() {
            const formWrap = document.querySelector('.mcl-wrap');
            if (!formWrap) return;

            this.linkManager = new LinkManager({
                drawer: document,
                container: formWrap,
                itemsList: document.getElementById('mcl-items'),
                drawerContent: formWrap
            });
        },

        // Unsaved changes handling
        initUnsavedChangesHandler() {
            // Track form changes
            const form = document.querySelector('.mcl-form');
            if (!form) return;

            // Listen to all input changes
            form.addEventListener('input', () => {
                this.hasUnsavedChanges = true;
            });

            // Listen to priority toggle changes
            const priorityToggle = document.getElementById('mcl_enable_item_priority');
            if (priorityToggle) {
                priorityToggle.addEventListener('change', () => {
                    this.hasUnsavedChanges = true;
                });
            }

            // Listen to form submission
            form.addEventListener('submit', () => {
                this.hasUnsavedChanges = false;
            });

            // Add beforeunload event listener
            window.addEventListener('beforeunload', (e) => {
                if (this.hasUnsavedChanges) {
                    e.preventDefault();
                }
            });

            // Handle navigation links
            document.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => {
                });
            });

            const accessControlFields = document.querySelectorAll(
                '#mcl_access_roles, #mcl_access_roles_permission, ' +
                '#mcl_access_users, #mcl_access_users_permission '
            );

            accessControlFields.forEach(field => {
                field.addEventListener('change', () => {
                    this.hasUnsavedChanges = true;
                });
            });
        },

        // Items Management
        initItemIndex() {
            const items = document.querySelectorAll('#mcl-items li');
            this.itemIndex = items.length;
        },

        initItemsHandling() {
            const itemsContainer = document.getElementById('mcl-items');
            if (!itemsContainer) return;
        
            // Add item button
            const addItemButton = document.getElementById('mcl-add-item');
            if (addItemButton) {
                addItemButton.addEventListener('click', (e) => this.handleAddItem(e));
            }
        
            // Item events with link handling
            itemsContainer.addEventListener('click', (e) => {
                // Handle link clicks
                if (e.target.matches('.mcl-item-content a') || e.target.closest('.mcl-item-content a')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const link = e.target.matches('a') ? e.target : e.target.closest('a');
                    if (link.href) {
                        window.open(link.href, '_blank', 'noopener,noreferrer');
                    }
                    return;
                }
        
                // Existing remove item handling
                this.handleRemoveItem(e);
            });
        
            itemsContainer.addEventListener('keydown', (e) => this.handleItemKeydown(e));
            itemsContainer.addEventListener('paste', (e) => this.handlePaste(e));
        
            // Delete all items
            const deleteAllButton = document.getElementById('mcl-delete-all');
            if (deleteAllButton) {
                deleteAllButton.addEventListener('click', () => this.handleDeleteAll());
            }
        
            // Prevent form submission on enter
            const form = document.querySelector('.mcl-form');
            if (form) {
                form.addEventListener('submit', (e) => this.handleFormSubmit(e));
            }
        
            this.updateRemoveButtons();
        },

        handlePaste(e) {
            if (!e.target.matches('.mcl-item-content')) return;
            
            e.preventDefault();
            
            // Handle URL pasting
            const text = (e.clipboardData || window.clipboardData).getData('text');
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            
            // Check if the pasted content is a URL
            const urlRegex = /^(https?:\/\/[^\s<>]+)$/;
            if (urlRegex.test(text.trim())) {
                // Create link
                const link = document.createElement('a');
                link.href = text;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = text;
                
                // Insert link
                range.deleteContents();
                range.insertNode(link);
                
                // Move cursor to end
                range.setStartAfter(link);
                range.setEndAfter(link);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // For non-URLs, just insert text
                const sanitizedText = this.sanitizeContent(text);
                const textNode = document.createTextNode(sanitizedText);
                range.deleteContents();
                range.insertNode(textNode);
                
                // Move cursor to end
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            
            this.hasUnsavedChanges = true;
        },

        sanitizeContent(content) {
            const tempDiv = document.createElement('div');
            tempDiv.textContent = content;
            return tempDiv.textContent;
        },

        handleFormSubmit(e) {
            e.preventDefault();
            
            // Process items before submission
            this.processItemsBeforeSubmit();
        
            // Submit the form if validation passes
            if (this.validateForm()) {
                e.target.submit();
            }
        },

        handleAddItem(e) {
            e.preventDefault();
            const itemsContainer = document.getElementById('mcl-items');
            const newItem = this.createListItem();
            itemsContainer.appendChild(newItem);

            const content = newItem.querySelector('.mcl-item-content');
            content.focus();

            const addItemButton = document.getElementById('mcl-add-item');
            this.scrollToShowElements(newItem, addItemButton);

            this.updateRemoveButtons();
            this.updateItemIndexes();
            this.hasUnsavedChanges = true;
        },

        handleItemKeydown(e) {
            if (e.key === 'Enter' && e.target.matches('.mcl-item-content')) {
                if (e.shiftKey) {
                    return;
                }
                
                e.preventDefault();
                const currentItem = e.target.closest('li');
                const newItem = this.createListItem();
                
                currentItem.parentNode.insertBefore(newItem, currentItem.nextSibling);
                
                const content = newItem.querySelector('.mcl-item-content');
                content.focus();

                const addItemButton = document.getElementById('mcl-add-item');
                this.scrollToShowElements(newItem, addItemButton);
                
                this.itemIndex++;
                this.updateRemoveButtons();
                this.updateItemIndexes();
                this.hasUnsavedChanges = true;
            }
        },

        createListItem() {
            this.itemIndex++;
            const li = document.createElement('li');
            li.setAttribute('data-item-id', `item_${Date.now()}_${this.itemIndex}`);
            
            const enableItemPriority = document.getElementById('mcl_enable_item_priority')?.checked;
            
            // Prepare priority select HTML if enabled
            let prioritySelectHTML = '';
            if (enableItemPriority) {
                const priorityLevels = {
                    'none': 'None',
                    'low': 'Low',
                    'medium': 'Medium',
                    'high': 'High',
                    'critical': 'Critical'
                };
                
                prioritySelectHTML = `
                    <select name="items[${this.itemIndex}][priority]" class="mcl-select mcl-priority-select">
                        ${Object.entries(priorityLevels)
                            .map(([value, label]) => `<option value="${value}">${label}</option>`)
                            .join('')}
                    </select>
                `;
            }
            
            li.innerHTML = `
                <span class="drag-handle">☰</span>
                <input type="hidden" name="items[${this.itemIndex}][id]" value="item_${Date.now()}_${this.itemIndex}">
                <div class="mcl-item-content" contenteditable="true" data-name="items[${this.itemIndex}][content]"></div>
                ${prioritySelectHTML}
                <button type="button" class="mcl-remove-item mcl-remove-icon">×</button>
            `;
            
            return li;
        },

        handleRemoveItem(e) {
            if (e.target.classList.contains('mcl-remove-icon')) {
                e.preventDefault();
                e.target.closest('li').remove();
                this.updateRemoveButtons();
                this.updateItemIndexes();
                this.hasUnsavedChanges = true;
            }
        },

        handleDeleteAll() {
            if (!confirm(mclAdmin.i18n.deleteAllConfirm)) return;

            const itemsContainer = document.getElementById('mcl-items');
            itemsContainer.innerHTML = '';
            
            const newItem = this.createItemElement();
            itemsContainer.appendChild(newItem);
            this.itemIndex = 1;
            this.updateRemoveButtons();
            this.updateItemIndexes();
        },

        // Shortcuts Handling
        initShortcutHandling() {
            const shortcutInput = document.getElementById('mcl_keyboard_shortcut');
            if (!shortcutInput) return;
        
            shortcutInput.addEventListener('focus', () => this.handleShortcutFocus(shortcutInput));
            shortcutInput.addEventListener('blur', () => this.handleShortcutBlur());
        },

        handleShortcutFocus(input) {
            input.value = '';
            let isComposingShortcut = false;
            
            this.shortcutHandler = (e) => {
                if (e.key === 'Tab') return;
                if (e.key === 'Enter') {
                    e.preventDefault();
                    input.blur();
                    document.removeEventListener('keydown', this.shortcutHandler);
                    return;
                }
                
                e.preventDefault();
                
                if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
                    isComposingShortcut = true;
                }
                
                const keyParts = [];
                if (e.ctrlKey) keyParts.push('Ctrl');
                if (e.shiftKey) keyParts.push('Shift');
                if (e.altKey) keyParts.push('Alt');
                if (e.metaKey) keyParts.push('Meta');
                
                const modifierKeys = ['Control', 'Shift', 'Alt', 'Meta', 'Tab', 'Enter'];
                if (!modifierKeys.includes(e.key)) {
                    const keyChar = e.key.length === 1 
                        ? e.key.toUpperCase() 
                        : e.code.replace('Key', '').toUpperCase();
                    keyParts.push(keyChar);
                }
                
                if (keyParts.length > 0) {
                    const shortcut = keyParts.join('+');
                    input.value = shortcut;
                    
                    if (isComposingShortcut && keyParts.length > 1) {
                        this.validateShortcut(shortcut);
                    }
                }
            };

            document.addEventListener('keydown', this.shortcutHandler);
            
            this.shortcutKeyUpHandler = (e) => {
                if (!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
                    isComposingShortcut = false;
                }
            };
            
            document.addEventListener('keyup', this.shortcutKeyUpHandler);
        },

        handleShortcutBlur() {
            if (this.shortcutHandler) {
                document.removeEventListener('keydown', this.shortcutHandler);
            }
            if (this.shortcutKeyUpHandler) {
                document.removeEventListener('keyup', this.shortcutKeyUpHandler);
            }
        },

        async validateShortcut(shortcut) {
            try {
                const response = await AjaxUtils.postData('mcl_check_shortcut', {
                    shortcut: shortcut,
                    checklist_id: mclAdmin.currentChecklistId
                });

                const errorElement = document.getElementById('mcl-shortcut-error');
                const input = document.getElementById('mcl_keyboard_shortcut');

                if (response.success && response.data.exists) {
                    ValidationUtils.showError(errorElement, 'This shortcut is already in use.');
                    input.classList.add('mcl-input-error');
                } else {
                    ValidationUtils.hideError(errorElement);
                    input.classList.remove('mcl-input-error');
                }
            } catch (error) {
                console.error('Error validating shortcut:', error);
            }
        },

        // Priority Handling
        initPriorityHandling() {
            const enableItemPriorityToggle = document.getElementById('mcl_enable_item_priority');
            const priorityDisplayOptions = document.querySelector('.mcl-priority-display-options');
            
            if (enableItemPriorityToggle) {
                enableItemPriorityToggle.addEventListener('change', (e) => {
                    const isEnabled = e.target.checked;
                    
                    // Show/hide priority display options immediately
                    if (priorityDisplayOptions) {
                        priorityDisplayOptions.style.display = isEnabled ? 'flex' : 'none';
                    }
                    
                    // Update existing items immediately
                    this.updateItemPrioritySelects(isEnabled);
                    
                    this.hasUnsavedChanges = true;
                });
            }

            // Initialize priority selects for existing items
            const initialEnabled = enableItemPriorityToggle?.checked || false;
            if (initialEnabled) {
                this.updateItemPrioritySelects(true);
            }
        },

        updateItemPrioritySelects(enabled) {
            const items = document.querySelectorAll('#mcl-items li');
            const priorityLevels = {
                'none': 'None',
                'low': 'Low',
                'medium': 'Medium',
                'high': 'High',
                'critical': 'Critical'
            };

            items.forEach((item, index) => {
                const existingSelect = item.querySelector('.mcl-priority-select');
                const removeButton = item.querySelector('.mcl-remove-item');
                
                if (enabled) {
                    if (!existingSelect) {
                        // Create new select element
                        const select = document.createElement('select');
                        select.className = 'mcl-select mcl-priority-select';
                        select.name = `items[${index}][priority]`;
                        
                        // Add options
                        Object.entries(priorityLevels).forEach(([value, label]) => {
                            const option = document.createElement('option');
                            option.value = value;
                            option.textContent = label;
                            select.appendChild(option);
                        });
                        
                        // Insert before the remove button
                        item.insertBefore(select, removeButton);
                    }
                } else {
                    if (existingSelect) {
                        // Remove the select element completely when disabled
                        existingSelect.remove();
                    }
                }
            });

            // Update indexes after modifying the items
            this.updateItemIndexes();
        },

        getItemIndex(item) {
            const items = Array.from(document.querySelectorAll('.mcl-item'));
            return items.indexOf(item);
        },

        initPriorityDisplayTypeHandling() {
            const displayTypeRadios = document.getElementsByName('priority_display_type');
            if (!displayTypeRadios.length) return;
        
            displayTypeRadios.forEach(radio => {
                radio.addEventListener('change', () => {
                    // Only update priority indicators within list items
                    const indicators = document.querySelectorAll('.mcl-item .mcl-priority-indicator');
                    indicators.forEach(indicator => {
                        const priority = indicator.getAttribute('data-priority') || 'none';
                        PriorityUtils.updatePriorityDisplay(indicator, priority, radio.value);
                    });
                });
            });
        },

        handlePriorityToggle(e) {
            const itemsContainer = document.getElementById('mcl-items');
            const prioritySelects = itemsContainer.querySelectorAll('.mcl-priority-select');
            
            prioritySelects.forEach(select => {
                select.disabled = !e.target.checked;
            });
        },

        // Sortable Initialization
        initSortable() {
            const itemsContainer = document.getElementById('mcl-items');
            if (!itemsContainer) return;
        
            new Sortable(itemsContainer, {
                handle: '.drag-handle',
                animation: 150,
                easing: "cubic-bezier(0.2, 1, 0.1, 1)",
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                chosenClass: 'sortable-chosen',
                forceFallback: false,
                fallbackOnBody: true,
                scrollSensitivity: 30,
                onChoose: function(evt) {
                    document.body.style.cursor = 'grabbing';
                },
                onEnd: function(evt) {
                    document.body.style.cursor = '';
                    // Store the new order before updating indexes
                    const newIndex = evt.newIndex;
                    const oldIndex = evt.oldIndex;
                    
                    // Call updateItemIndexes with the indexes if needed
                    if (typeof this.updateItemIndexes === 'function') {
                        this.updateItemIndexes(oldIndex, newIndex);
                    }
                },
                // Add these options to help maintain bindings
                removeCloneOnHide: true,
                supportPointer: true,
                // Ensure drag handle stays bound
                filter: '.ignore-elements',
                preventOnFilter: false
            });
        },
        
        // Form Validation
        initFormValidation() {
            const form = document.querySelector('.mcl-form');
            if (!form) return;
        
            // Handle form submit
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
            // Add submit button click handler
            const submitButton = document.querySelector('.mcl-submit-form');
            if (submitButton) {
                submitButton.addEventListener('click', () => {
                    form.dispatchEvent(new Event('submit'));
                });
            }
        },

        processItemsBeforeSubmit() {
            const itemsList = document.getElementById('mcl-items');
            if (!itemsList) return;
        
            const items = itemsList.querySelectorAll('li');
            
            // Remove any existing hidden inputs first to prevent duplicates
            items.forEach(item => {
                const existingInputs = item.querySelectorAll('input[type="hidden"]');
                existingInputs.forEach(input => input.remove());
            });
            
            // Create fresh hidden inputs for each item
            items.forEach((item, index) => {
                // Get the content directly from the contenteditable div
                const content = item.querySelector('.mcl-item-content');
                const itemId = item.getAttribute('data-item-id');
                
                // Create input for content
                let contentInput = document.createElement('input');
                contentInput.type = 'hidden';
                contentInput.name = `items[${index}][content]`;
                contentInput.value = content.innerHTML;
                item.appendChild(contentInput);
                
                // Create input for ID
                let idInput = document.createElement('input');
                idInput.type = 'hidden';
                idInput.name = `items[${index}][id]`;
                idInput.value = itemId;
                item.appendChild(idInput);
                
                // Handle priority if present
                const prioritySelect = item.querySelector('.mcl-priority-select');
                if (prioritySelect) {
                    let priorityInput = document.createElement('input');
                    priorityInput.type = 'hidden';
                    priorityInput.name = `items[${index}][priority]`;
                    priorityInput.value = prioritySelect.value;
                    item.appendChild(priorityInput);
                }
            });
        },

        displayValidationErrors(errors, form) {
            // Remove any existing error messages
            const existingErrors = document.querySelector('.mcl-form-errors');
            if (existingErrors) {
                existingErrors.remove();
            }
    
            if (errors.length > 0) {
                const errorContainer = document.createElement('div');
                errorContainer.className = 'mcl-form-errors';
                errorContainer.innerHTML = `
                    <div class="mcl-error-message">
                        <p>Please correct the following errors:</p>
                        <ul>
                            ${errors.map(error => `<li>${error}</li>`).join('')}
                        </ul>
                    </div>
                `;
    
                // Insert error messages at the top of the form
                form.insertBefore(errorContainer, form.firstChild);
    
                // Scroll to errors
                errorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        },

        validateForm() {
            let isValid = true;
            const errors = [];
    
            // Validate based on current step
            switch(this.currentStep) {
                case 1:
                    // Basic Settings validation
                    const title = document.getElementById('mcl_title');
                    if (!title || !title.value.trim()) {
                        errors.push('Title is required');
                        isValid = false;
                        title?.classList.add('mcl-input-error');
                    }
                    break;
    
                case 2:
                    // Advanced Settings validation
                    const shortcutTrigger = document.getElementById('mcl_trigger_shortcut');
                    const buttonTrigger = document.getElementById('mcl_trigger_button');
                    const shortcutInput = document.getElementById('mcl_keyboard_shortcut');
    
                    if ((!shortcutTrigger?.checked) && (!buttonTrigger?.checked)) {
                        errors.push('At least one trigger method must be selected');
                        isValid = false;
                    }
    
                    if (shortcutTrigger?.checked && (!shortcutInput?.value.trim())) {
                        errors.push('Keyboard shortcut is required when shortcut trigger is enabled');
                        isValid = false;
                    }
                    break;
    
                case 3:
                    // Access Control validation
                    // Add any access control specific validation here
                    break;
    
                case 4:
                    // Notification Settings validation
                    const notificationsEnabled = document.getElementById('mcl_notifications_enabled');
                    if (notificationsEnabled?.checked) {
                        const emailEnabled = document.getElementById('mcl_email_enabled');
                        const integrationEnabled = document.getElementById('mcl_integration_enabled');
                        const emailRecipients = document.getElementById('mcl_email_recipients');
                        const slackWebhook = document.getElementById('mcl_slack_webhook');
                        const discordWebhook = document.getElementById('mcl_discord_webhook');
    
                        if (emailEnabled?.checked && (!emailRecipients?.value.trim())) {
                            errors.push('Email recipients are required when email notifications are enabled');
                            isValid = false;
                        }
    
                        if (integrationEnabled?.checked && (!slackWebhook?.value && !discordWebhook?.value)) {
                            errors.push('At least one webhook URL is required when integration notifications are enabled');
                            isValid = false;
                        }
                    }
                    break;
            }
    
            // Display errors if any
            this.displayValidationErrors(errors);
    
            // Update validation state for current step
            this.validationState[this.currentStep - 1] = isValid;
    
            return isValid;
        },

        // Helper Methods
        createItemElement() {
            this.itemIndex++;
            const div = document.createElement('div');
            div.className = 'mcl-item';
            
            const enableItemPriority = document.getElementById('mcl_enable_item_priority')?.checked;
            
            // Prepare priority select HTML if enabled
            let prioritySelectHTML = '';
            if (enableItemPriority) {
                const priorityLevels = {
                    'none': 'None',
                    'low': 'Low',
                    'medium': 'Medium',
                    'high': 'High',
                    'critical': 'Critical'
                };
                
                prioritySelectHTML = `
                    <select name="items[${this.itemIndex}][priority]" class="mcl-select mcl-priority-select">
                        ${Object.entries(priorityLevels)
                            .map(([value, label]) => `<option value="${value}">${label}</option>`)
                            .join('')}
                    </select>
                `;
            }
            
            div.innerHTML = `
                <span class="drag-handle">☰</span>
                <input type="hidden" name="items[${this.itemIndex}][id]" value="item_${Date.now()}_${this.itemIndex}">
                <input type="text" name="items[${this.itemIndex}][content]" value="" class="mcl-input mcl-item-input">
                ${prioritySelectHTML}
                <button type="button" class="mcl-remove-item mcl-remove-icon">×</button>
            `;
            
            return div;
        },

        updateRemoveButtons() {
            const items = document.querySelectorAll('#mcl-items li');
            document.querySelectorAll('#mcl-items .mcl-remove-icon')
                .forEach(button => button.style.display = items.length > 1 ? '' : 'none');
        },

        updateItemIndexes() {
            const items = document.querySelectorAll('#mcl-items li');
            items.forEach((item, index) => {
                const content = item.querySelector('.mcl-item-content');
                const idInput = item.querySelector('input[name*="[id]"]');
                const prioritySelect = item.querySelector('select[name*="[priority]"]');
                
                if (idInput) {
                    idInput.name = `items[${index}][id]`;
                }
                if (content) {
                    content.setAttribute('data-name', `items[${index}][content]`);
                }
                if (prioritySelect) {
                    prioritySelect.name = `items[${index}][priority]`;
                }
            });
            this.itemIndex = Math.max(items.length - 1, 0);
        },

        scrollToShowElements(newItem, addItemButton) {
            const newItemRect = newItem.getBoundingClientRect();
            const buttonRect = addItemButton.getBoundingClientRect();
            const containerBottom = window.innerHeight;
            
            const newItemOverflow = newItemRect.bottom - containerBottom;
            const buttonOverflow = buttonRect.bottom - containerBottom;
            
            if (newItemOverflow > 0 || buttonOverflow > 0) {
                window.scrollBy({
                    top: Math.max(newItemOverflow, buttonOverflow) + 40,
                    behavior: 'smooth'
                });
            }
        },

        updatePriorityIndicator(e) {
            const select = e.target || document.getElementById('mcl_priority');
            const selectedOption = select.options[select.selectedIndex];
            const color = selectedOption.getAttribute('data-color');
            const indicator = select.closest('.mcl-priority-select').querySelector('.mcl-priority-indicator');
            
            if (indicator) {
                indicator.style.setProperty('background-color', color);
                PriorityUtils.addPriorityChangeAnimation(indicator);
            }
        },

        showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `mcl-copy-notification mcl-notification-${type}`;
            notification.innerHTML = `
                <div class="mcl-notification-content">
                    <span class="mcl-notification-message">${message}</span>
                    <button type="button" class="mcl-notification-close">
                        <span class="dashicons dashicons-no-alt"></span>
                    </button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Add close button functionality
            notification.querySelector('.mcl-notification-close').addEventListener('click', () => {
                notification.classList.add('mcl-notification-hiding');
                setTimeout(() => notification.remove(), 300);
            });
            
            // Show notification with animation
            requestAnimationFrame(() => {
                notification.classList.add('mcl-notification-visible');
            });
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.classList.add('mcl-notification-hiding');
                    setTimeout(() => notification.remove(), 300);
                }
            }, 3000);
        },

        initResetScheduleHandling() {
            const autoResetToggle = document.getElementById('mcl_auto_reset');
            const resetOptions = document.querySelector('.mcl-reset-schedule-options');
            const resetIntervalSelect = document.getElementById('mcl_reset_interval');
            const weeklyOptions = document.getElementById('mcl-weekly-options');
            const monthlyOptions = document.getElementById('mcl-monthly-options');
            const customOptions = document.getElementById('mcl-custom-reset-options');
        
            if (autoResetToggle) {
                autoResetToggle.addEventListener('change', function() {
                    resetOptions.style.display = this.checked ? 'flex' : 'none';
                });
            }
        
            if (resetIntervalSelect) {
                resetIntervalSelect.addEventListener('change', function() {
                    // Hide all option containers first
                    weeklyOptions.style.display = 'none';
                    monthlyOptions.style.display = 'none';
                    customOptions.style.display = 'none';
        
                    // Show relevant options based on selection
                    switch (this.value) {
                        case 'weekly':
                            weeklyOptions.style.display = 'block';
                            break;
                        case 'monthly':
                            monthlyOptions.style.display = 'block';
                            break;
                        case 'custom':
                            customOptions.style.display = 'block';
                            break;
                    }
                });
            }
        
            // Add validation for custom interval inputs
            const customMonths = document.getElementById('mcl_custom_months');
            const customWeeks = document.getElementById('mcl_custom_weeks');
            const customDays = document.getElementById('mcl_custom_days');
        
            const validateCustomIntervals = () => {
                const months = parseInt(customMonths.value) || 0;
                const weeks = parseInt(customWeeks.value) || 0;
                const days = parseInt(customDays.value) || 0;
        
                // Ensure at least one field has a value greater than 0
                if (months === 0 && weeks === 0 && days === 0) {
                    customDays.value = 1;
                }
        
                // Validate ranges
                if (months < 0) customMonths.value = 0;
                if (months > 12) customMonths.value = 12;
                if (weeks < 0) customWeeks.value = 0;
                if (weeks > 52) customWeeks.value = 52;
                if (days < 0) customDays.value = 0;
                if (days > 31) customDays.value = 31;
            };
        
            [customMonths, customWeeks, customDays].forEach(input => {
                if (input) {
                    input.addEventListener('input', validateCustomIntervals);
                    input.addEventListener('blur', validateCustomIntervals);
                }
            });
        }
    };

    EditChecklist.init();
});


class InviteLinkManager {
    constructor(editChecklist) {
        this.editChecklist = editChecklist;
        this.generateButton = document.getElementById('mcl-generate-invite');
        this.linksList = document.getElementById('mcl-invite-links-list');
        this.checklistId = document.querySelector('input[name="checklist_id"]')?.value;
        
        // Translation strings
        this.i18n = {
            noInviteLinks: window.mclAdmin.i18n.noInviteLinks,
            linkGenerated: window.mclAdmin.i18n.linkGenerated,
            linkCopied: window.mclAdmin.i18n.linkCopied,
            linkDeleted: window.mclAdmin.i18n.linkDeleted,
            confirmDeleteLink: window.mclAdmin.i18n.confirmDeleteLink,
            errorGeneratingLink: window.mclAdmin.i18n.errorGeneratingLink,
            errorDeletingLink: window.mclAdmin.i18n.errorDeletingLink,
            errorCopyingLink: window.mclAdmin.i18n.errorCopyingLink,
            copyLink: window.mclAdmin.i18n.copyLink,
            deleteLink: window.mclAdmin.i18n.deleteLink,
            canView: window.mclAdmin.i18n.canView,
            canInteract: window.mclAdmin.i18n.canInteract,
            canEdit: window.mclAdmin.i18n.canEdit,
            created: window.mclAdmin.i18n.created,
            expires: window.mclAdmin.i18n.expires,
            expired: window.mclAdmin.i18n.expired,
            uses: window.mclAdmin.i18n.uses
        };
        
        if (!this.checklistId) {
            console.warn('No checklist ID found for invite link manager');
            return;
        }
        
        this.init();
    }

    formatPermission(permission) {
        const permissions = {
            'view': this.i18n.canView || 'View Only',
            'interact': this.i18n.canInteract || 'Can Interact',
            'edit': this.i18n.canEdit || 'Can Edit'
        };
        return permissions[permission] || permission;
    }
    
    init() {
        if (!this.generateButton || !this.linksList) return;
        
        // Bind event listeners
        this.generateButton.addEventListener('click', () => this.generateInviteLink());
        this.bindLinkActions();
        
        // Load existing links on initialization
        this.loadExistingLinks();
        
        // Periodically refresh links to update expiry status
        setInterval(() => this.loadExistingLinks(), 60000); // Refresh every minute
    }
    
    async generateInviteLink() {
        const permissions = document.getElementById('mcl_invite_permissions').value;
        const expiryDays = document.getElementById('mcl_invite_expiry').value;
        const usageLimit = document.getElementById('mcl_invite_usage').value;
        
        // Show loading state
        this.generateButton.classList.add('mcl-loading');
        this.generateButton.disabled = true;
        
        try {
            const response = await fetch(ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'mcl_generate_invite',
                    nonce: mclAdmin.nonces.inviteLinks,
                    checklist_id: document.querySelector('input[name="checklist_id"]').value,
                    permissions,
                    expiry_days: expiryDays,
                    usage_limit: usageLimit
                })
            });
            
            const data = await response.json();
            
            if (data.success) {        
                // If the response includes the raw invite URL, copy it
                if (data.data.invite_url) {
                    await this.copyLinkToClipboard(data.data.invite_url);
                }
                
                // Refresh the list of existing links
                await this.loadExistingLinks();
            } else {
                this.showErrorMessage(data.data || this.i18n.errorGeneratingLink);
            }
        } catch (error) {
            console.error('Failed to generate invite link:', error);
            this.showErrorMessage(this.i18n.errorGeneratingLink);
        } finally {
            // Reset button state
            this.generateButton.classList.remove('mcl-loading');
            this.generateButton.disabled = false;
        }
    }
    
    async loadExistingLinks() {
        if (!this.checklistId) return;
        
        try {
            const response = await fetch(ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'mcl_get_invite_links',
                    nonce: mclAdmin.nonces.inviteLinks,
                    checklist_id: this.checklistId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.renderLinksList(data.data);
            } else {
                console.warn('Server error:', data.data);
            }
        } catch (error) {
            console.error('Failed to load invite links:', error);
        }
    }
    
    renderLinksList(links) {
        this.linksList.innerHTML = '';
        
        if (!links || !links.length) {
            this.linksList.innerHTML = `
                <div class="mcl-no-links">
                    ${this.i18n.noInviteLinks}
                </div>
            `;
            return;
        }
        
        const ul = document.createElement('ul');
        ul.className = 'mcl-invite-links';
        
        links.forEach(link => {
            ul.appendChild(this.createLinkElement(link));
        });
        
        this.linksList.appendChild(ul);
    }
    
    createLinkElement(link) {
        const li = document.createElement('li');
        li.className = 'mcl-invite-link-item';
        
        // Format dates
        const created = new Date(link.created_at).toLocaleString();
        const expires = new Date(link.expiry_date).toLocaleString();
        
        // Check if link is expired
        const isExpired = new Date(link.expiry_date) < new Date();
        const isLimitReached = link.usage_limit > 0 && link.usage_count >= link.usage_limit;
        
        if (isExpired || isLimitReached) {
            li.classList.add('mcl-link-inactive');
        }

        // Add permission-specific class
        const permissionClass = `mcl-permission-${link.permissions}`;
        
        li.innerHTML = `
            <div class="mcl-invite-link-details">
                <div class="mcl-invite-link-main">
                    <select class="mcl-permission-select" data-link-id="${link.id}" ${(isExpired || isLimitReached) ? 'disabled' : ''}>
                        <option value="view" ${link.permissions === 'view' ? 'selected' : ''}>
                            ${this.i18n.canView}
                        </option>
                        <option value="interact" ${link.permissions === 'interact' ? 'selected' : ''}>
                            ${this.i18n.canInteract}
                        </option>
                        <option value="edit" ${link.permissions === 'edit' ? 'selected' : ''}>
                            ${this.i18n.canEdit}
                        </option>
                    </select>
                    <button type="button" 
                            class="mcl-copy-link" 
                            data-url="${link.invite_url}"
                            ${(isExpired || isLimitReached) ? 'disabled' : ''}>
                        <span class="dashicons dashicons-admin-links"></span>
                        ${this.i18n.copyLink}
                    </button>
                </div>
                <div class="mcl-invite-link-meta">
                    <span class="mcl-invite-usage ${isLimitReached ? 'limit-reached' : ''}">
                        ${this.i18n.uses}: ${link.usage_count}/${link.usage_limit || '∞'}
                    </span>
                    <span class="mcl-invite-created">
                        ${this.i18n.created}: ${created}
                    </span>
                    <span class="mcl-invite-expires ${isExpired ? 'expired' : ''}">
                        ${isExpired ? this.i18n.expired : this.i18n.expires}: ${expires}
                    </span>
                </div>
            </div>
            <div class="mcl-link-actions">
                <button type="button" class="mcl-delete-link" data-id="${link.id}" title="${this.i18n.deleteLink}">
                    <span class="dashicons dashicons-trash"></span>
                </button>
            </div>
        `;

        // Add permission change handler
        const permissionSelect = li.querySelector('.mcl-permission-select');
        if (permissionSelect) {
            permissionSelect.addEventListener('change', async (e) => {
                const linkId = e.target.dataset.linkId;
                const newPermission = e.target.value;
                
                try {
                    const response = await fetch(ajaxurl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams({
                            action: 'mcl_update_invite_permission',
                            nonce: mclAdmin.nonces.inviteLinks,
                            link_id: linkId,
                            permission: newPermission
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        // Update the UI to reflect the new permission
                        li.querySelector('.mcl-permission-select').value = newPermission;
                    } else {
                        // Revert the select to previous value
                        e.target.value = link.permissions;
                    }
                } catch (error) {
                    console.error('Failed to update permission:', error);
                    this.showErrorMessage(this.i18n.errorUpdatingPermission);
                    // Revert the select to previous value
                    e.target.value = link.permissions;
                }
            });
        }
        
        return li;
    }
    
    async copyLinkToClipboard(link) {
        try {
            await navigator.clipboard.writeText(link);
            this.showSuccessMessage(this.i18n.linkCopied);
        } catch (err) {
            console.error('Failed to copy link:', err);
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = link;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                this.showSuccessMessage(this.i18n.linkCopied);
            } catch (e) {
                console.error('Fallback copy failed:', e);
                this.showErrorMessage(this.i18n.errorCopyingLink);
            }
            document.body.removeChild(textarea);
        }
    }
    
    async deleteLink(linkId) {
        if (!confirm(this.i18n.confirmDeleteLink)) {
            return;
        }
        
        try {
            const response = await fetch(ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'mcl_delete_invite_link',
                    nonce: mclAdmin.nonces.inviteLinks,
                    link_id: linkId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccessMessage(this.i18n.linkDeleted);
                await this.loadExistingLinks();
            } else {
                this.showErrorMessage(data.data || this.i18n.errorDeletingLink);
            }
        } catch (error) {
            console.error('Failed to delete invite link:', error);
            this.showErrorMessage(this.i18n.errorDeletingLink);
        }
    }
    
    showSuccessMessage(message) {
        this.editChecklist.showNotification(message, 'success');
    }
    
    showErrorMessage(message) {
        this.editChecklist.showNotification(message, 'error');
    }

    bindLinkActions() {
        // Use event delegation for dynamically added elements
        this.linksList.addEventListener('click', async (e) => {
            const deleteButton = e.target.closest('.mcl-delete-link');
            const copyButton = e.target.closest('.mcl-copy-link');
            
            if (deleteButton) {
                e.preventDefault();
                const linkId = deleteButton.dataset.id;
                if (linkId) {
                    await this.deleteInviteLink(linkId);
                }
            } else if (copyButton) {
                e.preventDefault();
                const url = copyButton.dataset.url;
                if (url) {
                    await this.copyLinkToClipboard(url);
                }
            }
        });
    }
    
    async deleteInviteLink(linkId) {
        if (!confirm(this.i18n.confirmDeleteLink)) {
            return;
        }
    
        try {
            const response = await fetch(ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'mcl_delete_invite_link',
                    nonce: mclAdmin.nonces.inviteLinks,
                    link_id: linkId
                })
            });
    
            const data = await response.json();
            
            if (data.success) {
                this.editChecklist.showNotification(this.i18n.linkDeleted);
                await this.loadExistingLinks(); // Refresh the list
            } else {
                this.showErrorMessage(data.data || this.i18n.errorDeletingLink);
            }
        } catch (error) {
            console.error('Failed to delete invite link:', error);
            this.showErrorMessage(this.i18n.errorDeletingLink);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const NotificationSettings = {
        init() {
            this.initToggles();
            this.initWebhookTesting();
            this.initEmailTesting();
            this.initValidation();
        },

        initToggles() {
            // Main notifications toggle
            const notificationsEnabled = document.getElementById('mcl_notifications_enabled');
            const notificationSettings = document.querySelector('.mcl-notification-settings');
            
            if (notificationsEnabled && notificationSettings) {
                notificationsEnabled.addEventListener('change', () => {
                    notificationSettings.style.display = notificationsEnabled.checked ? 'flex' : 'none';
                });
                // Initial state
                notificationSettings.style.display = notificationsEnabled.checked ? 'flex' : 'none';
            }

            // Email notifications toggle
            const emailEnabled = document.getElementById('mcl_email_enabled');
            const emailSettings = document.querySelector('.mcl-email-settings');
            
            if (emailEnabled && emailSettings) {
                emailEnabled.addEventListener('change', () => {
                    emailSettings.style.display = emailEnabled.checked ? 'flex' : 'none';
                });
                // Initial state
                emailSettings.style.display = emailEnabled.checked ? 'flex' : 'none';
            }

            // Integration notifications toggle
            const integrationEnabled = document.getElementById('mcl_integration_enabled');
            const integrationSettings = document.querySelector('.mcl-integration-settings');
            
            if (integrationEnabled && integrationSettings) {
                integrationEnabled.addEventListener('change', () => {
                    integrationSettings.style.display = integrationEnabled.checked ? 'flex' : 'none';
                });
                // Initial state
                integrationSettings.style.display = integrationEnabled.checked ? 'flex' : 'none';
            }

            // Deadline notifications toggle
            const deadlineEnabled = document.getElementById('mcl_notify_on_deadline');
            const deadlineSettings = document.querySelector('.mcl-deadline-settings');
            
            if (deadlineEnabled && deadlineSettings) {
                deadlineEnabled.addEventListener('change', () => {
                    deadlineSettings.style.display = deadlineEnabled.checked ? 'flex' : 'none';
                });
                // Initial state
                deadlineSettings.style.display = deadlineEnabled.checked ? 'flex' : 'none';
            }
        },

        initWebhookTesting() {
            const testSlackButton = document.querySelector('.test-slack-webhook');
            const testDiscordButton = document.querySelector('.test-discord-webhook');

            if (testSlackButton) {
                testSlackButton.addEventListener('click', () => this.testWebhook('slack'));
            }

            if (testDiscordButton) {
                testDiscordButton.addEventListener('click', () => this.testWebhook('discord'));
            }
        },

        initEmailTesting() {
            const testEmailButton = document.querySelector('.test-email-notification');
            if (testEmailButton) {
                testEmailButton.addEventListener('click', () => this.testEmailNotification());
            }
        },

        async testWebhook(platform) {
            const webhookInput = document.getElementById(`mcl_${platform}_webhook`);
            const button = document.querySelector(`.test-${platform}-webhook`);
            
            if (!webhookInput || !webhookInput.value) {
                alert(mclAdmin.i18n.webhookUrlRequired || 'Webhook URL is required');
                return;
            }
        
            button.disabled = true;
            button.classList.add('mcl-loading');
        
            try {
                const response = await fetch(ajaxurl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        action: 'mcl_test_notification_webhook',
                        nonce: mclAdmin.nonces.testWebhook,
                        platform: platform,
                        webhook_url: webhookInput.value
                    })
                });
        
                const data = await response.json().catch(() => null);
                
                if (response.ok && data?.success) {
                    this.showNotification(
                        mclAdmin.i18n.webhookTestSuccess || 'Webhook test successful', 
                        'success'
                    );
                } else {
                    const errorMessage = data?.data?.message || 
                                       mclAdmin.i18n.webhookTestFailed || 
                                       'Webhook test failed';
                    this.showNotification(errorMessage, 'error');
                }
            } catch (error) {
                console.error('Webhook test failed:', error);
                this.showNotification(
                    mclAdmin.i18n.webhookTestFailed || 'Webhook test failed', 
                    'error'
                );
            } finally {
                button.disabled = false;
                button.classList.remove('mcl-loading');
            }
        },

        async testEmailNotification() {
            const emailInput = document.getElementById('mcl_email_recipients');
            const button = document.querySelector('.test-email-notification');
            
            if (!emailInput || !emailInput.value) {
                this.showNotification(
                    mclAdmin.i18n.emailRecipientsRequired || 'Email recipients are required',
                    'error'
                );
                return;
            }
        
            button.disabled = true;
            button.classList.add('mcl-loading');
        
            try {
                const response = await fetch(ajaxurl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        action: 'mcl_test_email_notification',
                        nonce: mclAdmin.nonces.testWebhook,
                        recipients: emailInput.value
                    })
                });
        
                const data = await response.json();
                
                if (data.success) {
                    this.showNotification(
                        mclAdmin.i18n.emailTestSuccess || 'Test email(s) sent successfully', 
                        'success'
                    );
                } else {
                    this.showNotification(
                        data.data?.message || mclAdmin.i18n.emailTestFailed || 'Failed to send test email', 
                        'error'
                    );
                }
            } catch (error) {
                console.error('Email test failed:', error);
                this.showNotification(
                    mclAdmin.i18n.emailTestFailed || 'Failed to send test email', 
                    'error'
                );
            } finally {
                button.disabled = false;
                button.classList.remove('mcl-loading');
            }
        },

        initValidation() {
            const form = document.getElementById('mcl-checklist-form');
            if (!form) return;

            // Add validation to the existing form submit handler
            form.addEventListener('submit', (e) => {
                if (!this.validateNotificationSettings()) {
                    e.preventDefault();
                }
            });

            // Email validation
            const emailInput = document.getElementById('mcl_email_recipients');
            if (emailInput) {
                emailInput.addEventListener('blur', () => {
                    this.validateEmails(emailInput.value);
                });
            }

            // Webhook URL validation
            const webhookInputs = ['mcl_slack_webhook', 'mcl_discord_webhook'].map(id => 
                document.getElementById(id)
            );

            webhookInputs.forEach(input => {
                if (input) {
                    input.addEventListener('blur', () => {
                        this.validateWebhookUrl(input);
                    });
                }
            });

            // Deadline threshold validation
            const thresholdInput = document.getElementById('mcl_deadline_threshold');
            if (thresholdInput) {
                thresholdInput.addEventListener('input', () => {
                    this.validateDeadlineThreshold(thresholdInput);
                });
            }
        },

        validateNotificationSettings() {
            let isValid = true;
            const notificationsEnabled = document.getElementById('mcl_notifications_enabled');
            
            if (!notificationsEnabled?.checked) {
                return true; // Skip validation if notifications are disabled
            }

            const emailEnabled = document.getElementById('mcl_email_enabled');
            const integrationEnabled = document.getElementById('mcl_integration_enabled');

            // Validate that at least one notification method is enabled
            if ((!emailEnabled?.checked) && (!integrationEnabled?.checked)) {
                this.showError('mcl_notifications_enabled', mclAdmin.i18n.enableOneMethod);
                isValid = false;
            }

            // Validate email settings
            if (emailEnabled?.checked) {
                const emailInput = document.getElementById('mcl_email_recipients');
                if (!this.validateEmails(emailInput.value)) {
                    isValid = false;
                }
            }

            // Validate webhook settings
            if (integrationEnabled?.checked) {
                const slackWebhook = document.getElementById('mcl_slack_webhook');
                const discordWebhook = document.getElementById('mcl_discord_webhook');
                
                if (!slackWebhook.value && !discordWebhook.value) {
                    this.showError('mcl_integration_enabled', mclAdmin.i18n.configureOneIntegration);
                    isValid = false;
                } else {
                    if (slackWebhook.value && !this.validateWebhookUrl(slackWebhook)) {
                        isValid = false;
                    }
                    if (discordWebhook.value && !this.validateWebhookUrl(discordWebhook)) {
                        isValid = false;
                    }
                }
            }

            // Validate deadline settings
            const deadlineEnabled = document.getElementById('mcl_notify_on_deadline');
            if (deadlineEnabled?.checked) {
                const thresholdInput = document.getElementById('mcl_deadline_threshold');
                if (!this.validateDeadlineThreshold(thresholdInput)) {
                    isValid = false;
                }
            }

            return isValid;
        },

        validateEmails(emails) {
            if (!emails.trim()) {
                this.showError('mcl_email_recipients', mclAdmin.i18n.emailRequired);
                return false;
            }

            const emailList = emails.split(',').map(email => email.trim());
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            const invalidEmails = emailList.filter(email => !emailRegex.test(email));
            
            if (invalidEmails.length > 0) {
                this.showError('mcl_email_recipients', 
                    mclAdmin.i18n.invalidEmails + invalidEmails.join(', '));
                return false;
            }

            this.clearError('mcl_email_recipients');
            return true;
        },

        validateWebhookUrl(input) {
            if (!input.value) {
                return true; // Empty webhook URLs are allowed if at least one is configured
            }

            const urlRegex = /^https:\/\/[^\s/$.?#].[^\s]*$/;
            if (!urlRegex.test(input.value)) {
                this.showError(input.id, mclAdmin.i18n.invalidWebhookUrl);
                return false;
            }

            // Platform-specific validation
            if (input.id === 'mcl_slack_webhook' && 
                !input.value.startsWith('https://hooks.slack.com/')) {
                this.showError(input.id, mclAdmin.i18n.invalidSlackUrl);
                return false;
            }

            if (input.id === 'mcl_discord_webhook' && 
                !input.value.startsWith('https://discord.com/api/webhooks/')) {
                this.showError(input.id, mclAdmin.i18n.invalidDiscordUrl);
                return false;
            }

            this.clearError(input.id);
            return true;
        },

        validateDeadlineThreshold(input) {
            const value = parseInt(input.value);
            if (isNaN(value) || value < 1) {
                this.showError(input.id, mclAdmin.i18n.invalidThreshold);
                return false;
            }

            this.clearError(input.id);
            return true;
        },

        showError(elementId, message) {
            const element = document.getElementById(elementId);
            if (!element) return;

            // Remove any existing error
            this.clearError(elementId);

            // Add error class to input
            element.classList.add('mcl-input-error');

            // Create and insert error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'mcl-error-message';
            errorDiv.textContent = message;
            element.parentNode.insertBefore(errorDiv, element.nextSibling);
        },

        clearError(elementId) {
            const element = document.getElementById(elementId);
            if (!element) return;

            element.classList.remove('mcl-input-error');
            const errorMessage = element.parentNode.querySelector('.mcl-error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        },

        showNotification(message, type = 'success') {
            // Use the existing notification system from your plugin
            if (typeof this.editChecklist?.showNotification === 'function') {
                this.editChecklist.showNotification(message, type);
            } else {
                alert(message);
            }
        },

        addStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .mcl-email-input-group {
                    align-items: flex-start;
                }
                
                .mcl-loading {
                    opacity: 0.7;
                    cursor: not-allowed;
                    position: relative;
                }
                
                .mcl-loading::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: mcl-spin 1s linear infinite;
                }
                
                @keyframes mcl-spin {
                    to {
                        transform: translate(-50%, -50%) rotate(360deg);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };

    NotificationSettings.init();
    NotificationSettings.addStyles();

    const ShortcodeSettings = {
        init() {
            this.initToggleHandler();
            this.initCustomWidthHandler();
            this.initColorPickers();
            this.initCopyShortcode();
            this.handleInitialState();
        },
    
        initToggleHandler() {
            const enableToggle = document.getElementById('mcl_enable_shortcode');
            const optionsContainer = document.querySelector('.mcl-shortcode-options');
            
            if (!enableToggle || !optionsContainer) return;
    
            enableToggle.addEventListener('change', () => {
                optionsContainer.style.display = enableToggle.checked ? 'block' : 'none';
                
                // If disabling, clear any unsaved changes in the form
                if (!enableToggle.checked) {
                    const form = enableToggle.closest('form');
                    const inputs = optionsContainer.querySelectorAll('input, select');
                    inputs.forEach(input => {
                        if (input.type === 'checkbox') {
                            input.checked = false;
                        } else if (input.type === 'number') {
                            input.value = input.defaultValue;
                        } else if (input.type === 'text') {
                            input.value = input.defaultValue;
                        } else if (input.tagName === 'SELECT') {
                            input.selectedIndex = 0;
                        }
                    });
                }
            });
        },
    
        initCustomWidthHandler() {
            const widthSelect = document.getElementById('mcl_shortcode_width');
            const customWidthContainer = document.querySelector('.mcl-custom-width-input');
            const customWidthInput = document.querySelector('input[name="shortcode_custom_width"]');
            
            if (!widthSelect || !customWidthContainer || !customWidthInput) return;
    
            // Handle width type changes
            widthSelect.addEventListener('change', () => {
                const isCustom = widthSelect.value === 'custom';
                customWidthContainer.style.display = isCustom ? 'block' : 'none';
                
                if (isCustom) {
                    customWidthInput.focus();
                }
            });
    
            // Validate custom width input
            customWidthInput.addEventListener('input', () => {
                let value = parseInt(customWidthInput.value);
                if (isNaN(value)) {
                    value = 800; // Default width
                }
                // Ensure width is between 200 and 2000px
                value = Math.max(200, Math.min(2000, value));
                customWidthInput.value = value;
            });
        },
    
        initColorPickers() {
            const colorInputs = document.querySelectorAll('.mcl-color-picker');
            if (!colorInputs.length) return;
        
            if (jQuery && jQuery.fn.wpColorPicker) {
                jQuery(colorInputs).wpColorPicker({
                    // You can set a defaultColor if needed
                    change: (event, ui) => {
                        // Trigger change event for unsaved changes detection
                        const changeEvent = new Event('change', { bubbles: true });
                        event.target.dispatchEvent(changeEvent);
                    }
                });
            } else {
                // Fallback to normal color input type
                colorInputs.forEach(input => {
                    input.type = 'color';
                });
            }
        },        
    
        initCopyShortcode() {
            const copyButton = document.querySelector('.mcl-copy-shortcode');
            const shortcodeText = document.querySelector('.mcl-shortcode-code code');
            
            if (!copyButton || !shortcodeText) return;
    
            copyButton.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(shortcodeText.textContent.trim());
                    
                    // Show success state
                    copyButton.classList.add('mcl-copied');
                    const originalText = copyButton.textContent;
                    copyButton.textContent = 'Copied!';
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        copyButton.classList.remove('mcl-copied');
                        copyButton.textContent = originalText;
                    }, 2000);
                    
                } catch (err) {
                    console.error('Failed to copy shortcode:', err);
                    
                    // Fallback copy method
                    const textarea = document.createElement('textarea');
                    textarea.value = shortcodeText.textContent.trim();
                    document.body.appendChild(textarea);
                    textarea.select();
                    
                    try {
                        document.execCommand('copy');
                        copyButton.textContent = 'Copied!';
                    } catch (e) {
                        copyButton.textContent = 'Failed to copy';
                    }
                    
                    document.body.removeChild(textarea);
                    
                    // Reset button after 2 seconds
                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 2000);
                }
            });
        },
    
        handleInitialState() {
            // Set initial states for all dependent fields
            const widthSelect = document.getElementById('mcl_shortcode_width');
            if (widthSelect) {
                const customWidthContainer = document.querySelector('.mcl-custom-width-input');
                if (customWidthContainer) {
                    customWidthContainer.style.display = 
                        widthSelect.value === 'custom' ? 'block' : 'none';
                }
            }
        }
    };
    ShortcodeSettings.init();    
});