/**
 * Tour Public JavaScript
 * Handles tour creation interface and tour playback using driver.js
 */

(function($) {
    'use strict';

    const TourCreator = {
        
        isCreatorMode: false,
        currentMode: 'select', // 'select' or 'navigate'
        currentTourId: 0,
        tourSteps: [],
        tourSettings: {},
        checklists: [],
        currentStep: null,
        currentStepIndex: -1,
        highlightElementRef: null,
        editorInstance: null,
        stepsSortableInstance: null,
        currentDriverInstance: null,

        init() {
            this.isCreatorMode = mclTour.is_tour_mode;
            this.currentTourId = mclTour.tour_id;
            
            if (this.isCreatorMode) {
                this.initCreatorMode();
            } else {
                this.initTourPlayback();
            }
        },

        initCreatorMode() {
            console.log('Initializing tour creator mode');
            
            // Hide admin bar and add body class
            $('body').addClass('mcl-tour-creator-active');
            
            // Load existing tour data if editing
            if (this.currentTourId > 0) {
                this.loadTourData(this.currentTourId, () => {
                    // Check if we should auto-start preview after loading tour data
                    this.checkForPreviewStart();
                });
            } else {
                // For new tours, still need to check for preview start
                // but with empty steps array
                this.tourSteps = [];
                this.updateStepsCounter();
                this.checkForPreviewStart();
            }
            
            this.loadChecklists();
            this.bindCreatorEvents();
            this.setMode('select');
            
            // Initialize URL preservation for navigation
            this.initUrlPreservation();
        },

        initTourPlayback() {
            if (mclTour.tours && mclTour.tours.length > 0) {
                mclTour.tours.forEach(tour => {
                    // Check if this tour should be triggered based on its trigger type
                    if (this.shouldTriggerTour(tour)) {
                        if (tour.autostart || tour.continue_from_step !== undefined) {
                            // Add a small delay to ensure the page is fully loaded
                            setTimeout(() => {
                                this.startTour(tour);
                            }, 500);
                        }
                    }
                });
            }
        },

        shouldTriggerTour(tour) {
            // Check selector-based triggers
            if (tour.trigger_type === 'selector' && tour.trigger_value) {
                const element = document.querySelector(tour.trigger_value);
                if (!element) {
                    console.log('Selector trigger not found:', tour.trigger_value);
                    return false;
                }
                console.log('Selector trigger found:', tour.trigger_value);
            }
            
            return true; // Other trigger types are handled server-side
        },

        initUrlPreservation() {
            const self = this;
            
            // Intercept all link clicks when in creator mode
            $(document).on('click', 'a', function(e) {
                if (self.isCreatorMode && self.currentMode === 'navigate') {
                    const link = $(this);
                    const href = link.attr('href');
                    
                    console.log('Link clicked:', {
                        href: href,
                        currentUrl: window.location.href,
                        currentMode: self.currentMode
                    });
                    
                    // Skip if it's a special link or has no href
                    if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                        console.log('Skipping special link:', href);
                        return;
                    }
                    
                    // Skip if it's a tour creator element
                    if (link.closest('#mcl-tour-creator, .mcl-modal').length > 0) {
                        console.log('Skipping tour creator element');
                        return;
                    }
                    
                    // Skip if it's an external link
                    if (self.isExternalLink(href)) {
                        console.log('Skipping external link:', href);
                        return;
                    }
                    
                    e.preventDefault();
                    const newUrl = self.appendTourParams(href);
                    console.log('Navigating to:', {
                        original: href,
                        modified: newUrl
                    });
                    window.location.href = newUrl;
                }
            });
            
            // Intercept form submissions when in creator mode
            $(document).on('submit', 'form', function(e) {
                if (self.isCreatorMode && self.currentMode === 'navigate') {
                    const form = $(this);
                    
                    // Skip if it's a tour creator form
                    if (form.closest('#mcl-tour-creator, .mcl-modal').length > 0) {
                        return;
                    }
                    
                    // Skip if it's a GET form (we'll handle it differently)
                    if (form.attr('method') && form.attr('method').toLowerCase() === 'get') {
                        e.preventDefault();
                        self.handleGetFormSubmission(form);
                        return;
                    }
                    
                    // For POST forms, add hidden inputs for tour parameters
                    const tourParams = self.getTourParams();
                    Object.keys(tourParams).forEach(key => {
                        if (!form.find(`input[name="${key}"]`).length) {
                            form.append(`<input type="hidden" name="${key}" value="${tourParams[key]}">`);
                        }
                    });
                }
            });
        },

        handleGetFormSubmission(form) {
            const action = form.attr('action') || window.location.pathname;
            const formData = form.serialize();
            const tourParams = this.getTourParams();
            
            // Build URL with form data and tour parameters
            let url = action;
            const params = new URLSearchParams(formData);
            
            // Add tour parameters
            Object.keys(tourParams).forEach(key => {
                params.set(key, tourParams[key]);
            });
            
            if (params.toString()) {
                url += (url.includes('?') ? '&' : '?') + params.toString();
            }
            
            window.location.href = url;
        },

        isExternalLink(href) {
            try {
                // Handle absolute URLs
                if (href.startsWith('http://') || href.startsWith('https://')) {
                    const url = new URL(href);
                    const isExternal = url.origin !== window.location.origin;
                    console.log('Checking absolute URL:', { href, isExternal, urlOrigin: url.origin, currentOrigin: window.location.origin });
                    return isExternal;
                }
                
                // Handle protocol-relative URLs
                if (href.startsWith('//')) {
                    const url = new URL(href, window.location.protocol);
                    const isExternal = url.origin !== window.location.origin;
                    console.log('Checking protocol-relative URL:', { href, isExternal });
                    return isExternal;
                }
                
                // Relative URLs and absolute paths are considered internal
                console.log('Internal URL:', href);
                return false;
            } catch (e) {
                // If URL parsing fails, assume it's internal to be safe
                console.log('URL parsing failed, assuming internal:', href, e);
                return false;
            }
        },

        getTourParams() {
            const params = {
                'mcl_tour_mode': '1'
            };
            
            if (this.currentTourId > 0) {
                params['tour_id'] = this.currentTourId;
            }
            
            return params;
        },

        appendTourParams(url) {
            try {
                // Use current page URL as base to properly resolve relative URLs
                // This ensures /wp-admin/ paths are preserved when resolving relative URLs
                const urlObj = new URL(url, window.location.href);
                const tourParams = this.getTourParams();
                
                Object.keys(tourParams).forEach(key => {
                    urlObj.searchParams.set(key, tourParams[key]);
                });
                
                return urlObj.toString();
            } catch (e) {
                // Fallback for edge cases
                const separator = url.includes('?') ? '&' : '?';
                const tourParams = this.getTourParams();
                const paramString = Object.keys(tourParams)
                    .map(key => `${key}=${encodeURIComponent(tourParams[key])}`)
                    .join('&');
                return url + separator + paramString;
            }
        },

        bindCreatorEvents() {
            // Mode toggle
            $('#mcl-toggle-mode').on('click', () => {
                this.toggleMode();
            });

            // Exit creator
            $('#mcl-exit-creator').on('click', () => {
                this.exitCreator();
            });

            // Save tour
            $('#mcl-save-tour').on('click', () => {
                this.saveTour();
            });

            // Preview tour
            $('#mcl-preview-tour').on('click', () => {
                this.previewTour();
            });

            // Panel toggle
            $('#mcl-panel-toggle').on('click', () => {
                this.togglePanel();
            });

            // Make panel draggable
            this.makePanelDraggable();

            // Steps list toggle
            $('#mcl-steps-header').on('click', () => {
                this.toggleStepsList();
            });

            // Element selection in select mode
            const self = this;
            $(document).on('click', '*', function(e) {
                if (self.currentMode === 'select' && !self.isReselectingElement && !self.isModalOpen()) {
                    // Don't interfere with confirmation modal elements
                    if ($(e.target).closest('#mcl-confirmation-modal').length > 0) {
                        return;
                    }
                    
                    e.preventDefault();
                    e.stopPropagation();
                    self.selectElement(e.target);
                }
            });

            // Element hover highlighting
            $(document).on('mouseenter', '*', function(e) {
                if ((self.currentMode === 'select' || self.isReselectingElement) && !self.isModalOpen()) {
                    // Don't highlight confirmation modal elements
                    if ($(e.target).closest('#mcl-confirmation-modal').length > 0) {
                        return;
                    }
                    self.highlightElement(e.target);
                }
            });

            $(document).on('mouseleave', '*', function(e) {
                if ((self.currentMode === 'select' || self.isReselectingElement) && !self.isModalOpen()) {
                    // Don't remove highlight for confirmation modal elements
                    if ($(e.target).closest('#mcl-confirmation-modal').length > 0) {
                        return;
                    }
                    self.removeHighlight();
                }
            });

            // Element reselection in modal
            $(document).on('click', '*', function(e) {
                if (self.isReselectingElement) {
                    // Don't interfere with confirmation modal elements
                    if ($(e.target).closest('#mcl-confirmation-modal').length > 0) {
                        return;
                    }
                    
                    e.preventDefault();
                    e.stopPropagation();
                    self.reselectElement(e.target);
                }
            });

            // Step editor events
            this.bindStepEditorEvents();
        },

        bindStepEditorEvents() {
            // Close modal
            $('#mcl-step-editor-close, #mcl-step-editor-cancel').on('click', () => {
                this.closeStepEditor();
            });

            // Save step
            $('#mcl-step-editor-save').on('click', () => {
                this.saveStep();
            });

            // Checklist selection
            $('#mcl-step-checklist').on('change', (e) => {
                this.loadChecklistItems($(e.target).val());
            });

            // Reselect element
            $('#mcl-reselect-element').on('click', () => {
                this.startElementReselection();
            });
        },

        setMode(mode) {
            this.currentMode = mode;
            
            const creator = $('#mcl-tour-creator');
            const indicator = $('.mcl-mode-indicator');
            const toggleBtn = $('#mcl-toggle-mode');
            const modeText = $('.mcl-mode-text');
            
            creator.attr('data-mode', mode);
            indicator.attr('data-mode', mode);
            
            if (mode === 'select') {
                // Update mode indicator to show selector icon
                indicator.find('.mcl-icon-navigate').hide();
                indicator.find('.mcl-icon-selector').show();
                modeText.text(mclTour.i18n.selectElement || 'Select Mode');
                
                // Update toggle button to show navigate icon
                toggleBtn.find('.mcl-icon-selector').hide();
                toggleBtn.find('.mcl-icon-navigate').show();
                toggleBtn.find('span:last-child').text(mclTour.i18n.navigate || 'Navigate');
            } else {
                // Update mode indicator to show navigate icon
                indicator.find('.mcl-icon-selector').hide();
                indicator.find('.mcl-icon-navigate').show();
                modeText.text(mclTour.i18n.navigate || 'Navigate Mode');
                
                // Update toggle button to show selector icon
                toggleBtn.find('.mcl-icon-navigate').hide();
                toggleBtn.find('.mcl-icon-selector').show();
                toggleBtn.find('span:last-child').text(mclTour.i18n.selectElement || 'Select');
            }
        },

        toggleMode() {
            this.setMode(this.currentMode === 'select' ? 'navigate' : 'select');
        },

        selectElement(element) {
            // Don't select tour creator elements or modal elements
            if ($(element).closest('#mcl-tour-creator, .mcl-tour-step-modal, #mcl-confirmation-modal').length > 0) {
                return;
            }

            const selector = this.generateSelector(element);
            const currentPageUrl = this.getCurrentPageUrl();
            this.openStepEditor(selector, currentPageUrl);
        },

        getCurrentPageUrl() {
            // Get current page URL without tour creator parameters
            const url = new URL(window.location.href);
            
            // Remove tour creator and continuation parameters
            url.searchParams.delete('mcl_tour_mode');
            url.searchParams.delete('tour_id');
            url.searchParams.delete('mcl_continue_tour');
            url.searchParams.delete('mcl_tour_step');
            url.searchParams.delete('mcl_preview_step');
            
            // Return full pathname + cleaned search params
            let cleanUrl = url.pathname;
            if (url.searchParams.toString()) {
                cleanUrl += '?' + url.searchParams.toString();
            }
            
            return cleanUrl;
        },

        startElementReselection() {
            this.isReselectingElement = true;
            $('#mcl-step-editor-modal').addClass('reselecting');
            
            // Visual feedback
            $('body').css('cursor', 'crosshair');
            $('.mcl-tour-step-modal').css('pointer-events', 'none');
            
            // Show overlay message
            if (!$('.mcl-reselect-overlay').length) {
                $('body').append('<div class="mcl-reselect-overlay">Click on an element to select it...</div>');
            }
        },

        reselectElement(element) {
            // Don't select tour creator elements or modal elements
            if ($(element).closest('#mcl-tour-creator, .mcl-tour-step-modal, .mcl-reselect-overlay, #mcl-confirmation-modal').length > 0) {
                return;
            }

            const selector = this.generateSelector(element);
            $('#mcl-step-element').val(selector);
            
            this.stopElementReselection();
        },

        stopElementReselection() {
            this.isReselectingElement = false;
            $('#mcl-step-editor-modal').removeClass('reselecting');
            
            // Remove visual feedback
            $('body').css('cursor', '');
            $('.mcl-tour-step-modal').css('pointer-events', '');
            $('.mcl-reselect-overlay').remove();
            this.removeHighlight();
        },

        togglePanel() {
            const panel = $('#mcl-tour-floating-panel');
            const toggle = $('#mcl-panel-toggle');
            
            if (panel.hasClass('collapsed')) {
                panel.removeClass('collapsed');
                toggle.find('.dashicons').removeClass('dashicons-arrow-up-alt2').addClass('dashicons-arrow-down-alt2');
            } else {
                panel.addClass('collapsed');
                toggle.find('.dashicons').removeClass('dashicons-arrow-down-alt2').addClass('dashicons-arrow-up-alt2');
            }
        },

        makePanelDraggable() {
            const panel = $('#mcl-tour-floating-panel');
            const header = panel.find('.mcl-panel-header');
            let isDragging = false;
            let dragStart = { x: 0, y: 0 };
            let panelStart = { x: 0, y: 0 };

            header.on('mousedown', (e) => {
                if ($(e.target).closest('.mcl-panel-toggle').length) return;
                
                isDragging = true;
                panel.addClass('dragging');
                
                dragStart.x = e.clientX;
                dragStart.y = e.clientY;
                
                const panelOffset = panel.offset();
                panelStart.x = panelOffset.left;
                panelStart.y = panelOffset.top;
                
                $(document).on('mousemove', handleDrag);
                $(document).on('mouseup', stopDrag);
                
                e.preventDefault();
            });

            function handleDrag(e) {
                if (!isDragging) return;
                
                const deltaX = e.clientX - dragStart.x;
                const deltaY = e.clientY - dragStart.y;
                
                let newX = panelStart.x + deltaX;
                let newY = panelStart.y + deltaY;
                
                // Keep panel within viewport
                const panelWidth = panel.outerWidth();
                const panelHeight = panel.outerHeight();
                const viewportWidth = $(window).width();
                const viewportHeight = $(window).height();
                
                newX = Math.max(10, Math.min(newX, viewportWidth - panelWidth - 10));
                newY = Math.max(10, Math.min(newY, viewportHeight - panelHeight - 10));
                
                panel.css({
                    position: 'fixed',
                    left: newX + 'px',
                    top: newY + 'px',
                    right: 'auto'
                });
            }

            function stopDrag() {
                isDragging = false;
                panel.removeClass('dragging');
                $(document).off('mousemove', handleDrag);
                $(document).off('mouseup', stopDrag);
            }
        },

        generateSelector(element) {
            // Try to generate a good CSS selector for the element
            let selector = '';
            
            if (element.id) {
                selector = '#' + element.id;
            } else if (element.className && element.className.trim()) {
                const classes = element.className.trim().split(/\s+/);
                // Use the first class as selector
                selector = '.' + classes[0];
            } else {
                // Fallback to tag name
                selector = element.tagName.toLowerCase();
                
                // Add nth-child if needed for uniqueness
                const siblings = $(element).parent().children(element.tagName.toLowerCase());
                if (siblings.length > 1) {
                    const index = siblings.index(element) + 1;
                    selector += ':nth-child(' + index + ')';
                }
            }
            
            return selector;
        },

        highlightElement(element) {
            if ($(element).closest('#mcl-tour-creator, .mcl-tour-step-modal, #mcl-confirmation-modal').length > 0) {
                return;
            }

            this.removeHighlight();

            const rect = element.getBoundingClientRect();
            const highlight = $('<div class="mcl-element-highlight"></div>');
            
            highlight.css({
                position: 'fixed',
                top: rect.top + 'px',
                left: rect.left + 'px',
                width: rect.width + 'px',
                height: rect.height + 'px',
                pointerEvents: 'none',
                zIndex: 1000001
            });

            $('body').append(highlight);
            this.highlightElementRef = highlight[0]; // Store DOM element instead of jQuery object
        },

        removeHighlight() {
            if (this.highlightElementRef) {
                $(this.highlightElementRef).remove(); // Use jQuery to remove
                this.highlightElementRef = null;
            }
        },

        openStepEditor(selector = '', pageUrl = '') {
            this.removeHighlight();
            
            const modal = $('#mcl-step-editor-modal');
            
            // Reset form
            $('#mcl-step-editor-form')[0].reset();
            $('#mcl-step-element').val(selector);
            $('#mcl-step-page-url').val(pageUrl);
            $('#mcl-step-index').val(this.currentStepIndex);
            
            // Populate checklist dropdown
            this.populateChecklistDropdown();
            
            modal.addClass('active');
        },

        closeStepEditor() {
            $('#mcl-step-editor-modal').removeClass('active');
            this.currentStepIndex = -1;
            // Make sure to stop any reselection mode
            if (this.isReselectingElement) {
                this.stopElementReselection();
            }
        },

        saveStep() {
            const stepData = {
                title: $('#mcl-step-title').val(),
                content: $('#mcl-step-content').val(),
                element: $('#mcl-step-element').val(),
                position: $('#mcl-step-position').val(),
                page_url: $('#mcl-step-page-url').val(),
                checklist_id: $('#mcl-step-checklist').val(),
                checklist_item_id: $('#mcl-step-checklist-item').val(),
                show_buttons: $('#mcl-step-show-buttons').is(':checked')
            };

            const stepIndex = parseInt($('#mcl-step-index').val());
            
            if (stepIndex >= 0 && stepIndex < this.tourSteps.length) {
                // Update existing step
                this.tourSteps[stepIndex] = stepData;
            } else {
                // Add new step
                this.tourSteps.push(stepData);
            }

            this.updateStepsCounter();
            this.closeStepEditor();
        },

        editStep(stepIndex) {
            if (stepIndex < 0 || stepIndex >= this.tourSteps.length) {
                return;
            }

            const step = this.tourSteps[stepIndex];
            this.currentStepIndex = stepIndex;

            // Populate form with step data
            $('#mcl-step-title').val(step.title || '');
            $('#mcl-step-element').val(step.element || '');
            $('#mcl-step-page-url').val(step.page_url || '');
            $('#mcl-step-position').val(step.position || 'bottom');
            $('#mcl-step-checklist').val(step.checklist_id || '');
            $('#mcl-step-checklist-item').val(step.checklist_item_id || '');
            $('#mcl-step-show-buttons').prop('checked', step.show_buttons !== false);
            $('#mcl-step-index').val(stepIndex);

            // Set content
            $('#mcl-step-content').val(step.content || '');

            // Load checklist items if needed
            if (step.checklist_id) {
                this.loadChecklistItems(step.checklist_id);
            }

            $('#mcl-step-editor-modal').addClass('active');
        },

        async deleteStep(stepIndex) {
            if (stepIndex < 0 || stepIndex >= this.tourSteps.length) {
                return;
            }

            const stepTitle = this.tourSteps[stepIndex]?.title || 'Untitled Step';
            const confirmed = await this.showConfirmationModal(
                `Are you sure you want to delete "${stepTitle}"?`,
                'Delete Step',
                'Cancel'
            );

            if (confirmed) {
                this.tourSteps.splice(stepIndex, 1);
                this.updateStepsCounter();
                // If steps list is visible, re-render it
                if ($('#mcl-steps-info').hasClass('expanded')) {
                    this.renderStepsList();
                }
                this.showSuccessToast('Step deleted successfully.');
            }
        },

        previewTour() {
            if (this.tourSteps.length === 0) {
                this.showWarningToast('Please add some steps before previewing the tour.');
                return;
            }

            // Check if driver.js is available
            const driverFunction = this.getDriverFunction();
            
            if (!driverFunction) {
                console.error('Driver.js is not available. Available on window:', Object.keys(window).filter(k => k.includes('driver')));
                console.error('window.driver:', window.driver);
                this.showErrorToast('Driver.js library is not loaded. Please refresh the page and try again.');
                return;
            }

            // Start preview from the beginning (step 0)
            this.startPreviewFromStep(0);
        },

        navigateToTourPreview(step) {
            if (!step.page_url) {
                console.log('No page URL for step, skipping navigation');
                return;
            }
            
            console.log('Navigating to tour step for preview:', {
                stepIndex: step.originalIndex,
                pageUrl: step.page_url,
                currentUrl: window.location.href
            });
            
            // Show loading indicator
            this.showNavigationLoading();
            
            try {
                // For preview, navigate with tour creator mode parameters
                const url = new URL(step.page_url, window.location.href);
                url.searchParams.set('mcl_tour_mode', '1');
                if (this.currentTourId) {
                    url.searchParams.set('tour_id', this.currentTourId);
                }
                url.searchParams.set('mcl_preview_step', step.originalIndex);
                
                const finalUrl = url.toString();
                console.log('Final preview navigation URL:', finalUrl);
                
                // Add a small delay to ensure the loading indicator is visible
                setTimeout(() => {
                    window.location.href = finalUrl;
                }, 100);
            } catch (error) {
                console.error('Error constructing navigation URL:', error);
                $('.mcl-tour-navigation-loading').remove();
            }
        },

        showNavigationLoading() {
            // Remove any existing loading indicator
            $('.mcl-tour-navigation-loading').remove();
            
            // Add loading indicator
            const loadingHtml = `
                <div class="mcl-tour-navigation-loading">
                    <div class="mcl-tour-loading-content">
                        <div class="mcl-tour-spinner"></div>
                        <div class="mcl-tour-loading-text">Loading next page...</div>
                    </div>
                </div>
            `;
            
            $('body').append(loadingHtml);
        },

        updateStepsCounter() {
            const count = this.tourSteps.length;
            const countText = count === 1 ? '1 step' : `${count} steps`;
            $('#mcl-steps-count').text(countText);
            this.renderStepsList();
        },

        toggleStepsList() {
            const stepsInfo = $('#mcl-steps-info');
            const stepsList = $('#mcl-steps-list');
            const isExpanded = stepsInfo.hasClass('expanded');
            
            if (isExpanded) {
                stepsInfo.removeClass('expanded');
                stepsList.slideUp(200);
            } else {
                stepsInfo.addClass('expanded');
                stepsList.slideDown(200);
            }
        },

        renderStepsList() {
            const stepsList = $('#mcl-steps-list');
            const noSteps = $('#mcl-no-steps');
            
            // Filter out null/undefined steps and log any issues
            const originalCount = this.tourSteps.length;
            this.tourSteps = this.tourSteps.filter(step => step && typeof step === 'object');
            
            if (this.tourSteps.length !== originalCount) {
                console.warn('Filtered out invalid steps:', {
                    original: originalCount,
                    valid: this.tourSteps.length,
                    filtered: originalCount - this.tourSteps.length
                });
            }
            
            if (this.tourSteps.length === 0) {
                noSteps.show();
                stepsList.find('.mcl-step-item').remove();
                return;
            }
            
            noSteps.hide();
            stepsList.find('.mcl-step-item').remove();
            
            this.tourSteps.forEach((step, index) => {
                // Additional safety check for each step
                if (!step || typeof step !== 'object') {
                    console.warn('Invalid step found at index', index, step);
                    return;
                }
                
                const stepItem = $(`
                    <div class="mcl-step-item" data-step-index="${index}">
                        <div class="mcl-step-drag-handle">
                            <span class="dashicons dashicons-move"></span>
                        </div>
                        <div class="mcl-step-number">${index + 1}</div>
                        <div class="mcl-step-content">
                            <div class="mcl-step-title">${step.title || 'Untitled Step'}</div>
                            <div class="mcl-step-element">${step.element || 'No element'}</div>
                            ${step.page_url ? `<div class="mcl-step-page">${step.page_url}</div>` : ''}
                        </div>
                        <div class="mcl-step-actions">
                            <button type="button" class="mcl-step-action edit" title="Edit step" data-step-index="${index}">
                                <span class="dashicons dashicons-edit"></span>
                            </button>
                            <button type="button" class="mcl-step-action preview" title="Preview step" data-step-index="${index}">
                                <span class="dashicons dashicons-visibility"></span>
                            </button>
                            <button type="button" class="mcl-step-action delete" title="Delete step" data-step-index="${index}">
                                <span class="dashicons dashicons-trash"></span>
                            </button>
                        </div>
                    </div>
                `);
                
                stepsList.append(stepItem);
            });
            
            // Initialize sortable functionality after rendering
            this.initializeStepsSortable();
            
            // Bind step action events
            stepsList.find('.mcl-step-action.edit').off('click').on('click', (e) => {
                e.stopPropagation();
                const stepIndex = parseInt($(e.currentTarget).data('step-index'));
                this.editStep(stepIndex);
            });
            
            stepsList.find('.mcl-step-action.preview').off('click').on('click', (e) => {
                e.stopPropagation();
                const stepIndex = parseInt($(e.currentTarget).data('step-index'));
                this.previewTour();
            });
            
            stepsList.find('.mcl-step-action.delete').off('click').on('click', (e) => {
                e.stopPropagation();
                const stepIndex = parseInt($(e.currentTarget).data('step-index'));
                this.deleteStep(stepIndex);
            });

            console.log('Steps list rendered:', {
                stepCount: this.tourSteps.length,
                domElements: stepsList.find('.mcl-step-item').length
            });
        },

        initializeStepsSortable() {
            // Only initialize if we're in creator mode and have the Sortable library
            if (!this.isCreatorMode || typeof Sortable === 'undefined') {
                return;
            }

            const stepsList = document.getElementById('mcl-steps-list');
            if (!stepsList) {
                return;
            }

            // Clean up existing sortable instance
            if (this.stepsSortableInstance) {
                this.stepsSortableInstance.destroy();
            }

            this.stepsSortableInstance = new Sortable(stepsList, {
                handle: '.mcl-step-drag-handle',
                animation: 150,
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                onEnd: (evt) => {
                    this.handleStepsReorder();
                }
            });
        },

        handleStepsReorder() {
            // Update step numbers visually first
            $('#mcl-steps-list .mcl-step-number').each((index, element) => {
                $(element).text(index + 1);
            });

            // Collect the new order based on DOM elements
            const stepItems = $('#mcl-steps-list .mcl-step-item');
            const newOrder = [];
            
            stepItems.each(function(index) {
                const stepIndex = parseInt($(this).data('step-index'));
                if (!isNaN(stepIndex)) {
                    newOrder.push(stepIndex);
                }
            });

            // Validate that we have the right number of elements
            if (newOrder.length !== this.tourSteps.length) {
                console.error('DOM/steps mismatch:', {
                    expectedSteps: this.tourSteps.length,
                    domOrder: newOrder.length,
                    newOrder: newOrder
                });
                // Re-render the steps list to fix any inconsistencies
                this.renderStepsList();
                return;
            }

            // Validate that all indices are valid
            for (let i = 0; i < newOrder.length; i++) {
                if (newOrder[i] < 0 || newOrder[i] >= this.tourSteps.length) {
                    console.error('Invalid step index in new order:', {
                        index: newOrder[i],
                        position: i,
                        validRange: `0-${this.tourSteps.length - 1}`
                    });
                    this.renderStepsList();
                    return;
                }
            }

            // Update data-step-index attributes immediately to reflect new positions
            // This must be done BEFORE saving to server to prevent race conditions
            // Use .data() consistently instead of mixing .data() and .attr()
            stepItems.each((index, element) => {
                // Use .data() for writing to match how we read it
                $(element).data('step-index', index);
                $(element).find('.mcl-step-action').data('step-index', index);
                
                // Also update the HTML attribute for consistency
                $(element).attr('data-step-index', index);
                $(element).find('.mcl-step-action').attr('data-step-index', index);
            });

            // Apply the reordering to our local array
            this.applyStepsReorder(newOrder);

            // Save to server
            this.saveStepsOrderToServer(newOrder);
        },

        applyStepsReorder(newOrder) {
            // Create a new array with steps in the new order
            const reorderedSteps = [];
            
            for (let i = 0; i < newOrder.length; i++) {
                const originalIndex = newOrder[i];
                if (this.tourSteps[originalIndex]) {
                    reorderedSteps.push(this.tourSteps[originalIndex]);
                }
            }

            // Update our local steps array
            this.tourSteps = reorderedSteps;

            // Note: DOM indices are now updated in handleStepsReorder() before this function is called
        },

        saveStepsOrderToServer(newOrder) {
            // Only save if we have a tour ID
            if (this.currentTourId <= 0) {
                console.warn('Cannot save step order: no tour ID');
                return;
            }

            $.post(mclTour.ajax_url, {
                action: 'mcl_reorder_tour_steps',
                tour_id: this.currentTourId,
                step_order: newOrder,
                nonce: mclTour.nonce
            }, (response) => {
                if (response.success) {
                    console.log('Step order saved successfully:', response.data);
                } else {
                    console.error('Failed to save step order:', response.data);
                    this.showErrorToast('Failed to save step order. Please try again.');
                    // Reload tour data to ensure client-server synchronization
                    this.loadTourData(this.currentTourId);
                }
            }).fail((xhr, status, error) => {
                console.error('Ajax request failed when saving step order:', error);
                this.showErrorToast('Failed to save step order. Please try again.');
                // Reload tour data to ensure client-server synchronization
                this.loadTourData(this.currentTourId);
            });
        },

        reorderSteps(oldIndex, newIndex) {
            // This method is now deprecated in favor of handleStepsReorder
            // Keep it for backward compatibility but log a warning
            console.warn('reorderSteps called with deprecated parameters, use handleStepsReorder instead');
            this.handleStepsReorder();
        },

        loadChecklists() {
            $.post(mclTour.ajax_url, {
                action: 'mcl_get_checklists_for_tour',
                nonce: mclTour.nonce
            }, (response) => {
                if (response.success) {
                    this.checklists = response.data;
                    this.populateChecklistDropdown();
                }
            });
        },

        populateChecklistDropdown() {
            const select = $('#mcl-step-checklist');
            select.find('option:not(:first)').remove();

            this.checklists.forEach(checklist => {
                select.append(`<option value="${checklist.id}">${checklist.title}</option>`);
            });
        },

        loadChecklistItems(checklistId) {
            const itemSelect = $('#mcl-step-checklist-item');
            itemSelect.find('option:not(:first)').remove();
            
            if (!checklistId) {
                itemSelect.prop('disabled', true);
                return;
            }

            const checklist = this.checklists.find(c => c.id == checklistId);
            if (checklist && checklist.items) {
                checklist.items.forEach(item => {
                    itemSelect.append(`<option value="${item.id}">${item.content}</option>`);
                });
                itemSelect.prop('disabled', false);
            }
        },

        loadTourData(tourId, callback) {
            $.post(mclTour.ajax_url, {
                action: 'mcl_get_tour_data',
                tour_id: tourId,
                nonce: mclTour.nonce
            }, (response) => {
                if (response.success) {
                    const data = response.data;
                    
                    // Clean and validate steps data
                    let steps = data.steps || [];
                    steps = steps.filter(step => step && typeof step === 'object');
                    
                    this.tourSteps = steps;
                    this.tourSettings = data.settings || {};
                    
                    $('#mcl-tour-title').val(data.title || '');
                    this.updateStepsCounter();
                    this.renderStepsList();
                    
                    console.log('Tour data loaded successfully:', {
                        tourId: tourId,
                        stepCount: this.tourSteps.length,
                        steps: this.tourSteps.map((s, i) => `${i+1}. ${s?.title || 'Untitled'}`)
                    });
                } else {
                    console.error('Failed to load tour data:', response.data);
                    this.tourSteps = [];
                    this.tourSettings = {};
                }
                // Always call callback, even on error
                callback && callback();
            }).fail(() => {
                console.error('Ajax request failed when loading tour data');
                this.tourSteps = [];
                this.tourSettings = {};
                // Always call callback, even on failure
                callback && callback();
            });
        },

        saveTour() {
            $.post(mclTour.ajax_url, {
                action: 'mcl_save_tour',
                tour_id: this.currentTourId,
                title: $('#mcl-tour-title').val() || 'Tour Steps',
                steps: JSON.stringify(this.tourSteps),
                settings: JSON.stringify(this.tourSettings),
                nonce: mclTour.nonce
            }, (response) => {
                if (response.success) {
                    this.showSuccessToast('Tour steps saved successfully!');
                    this.currentTourId = response.data.tour_id;
                } else {
                    this.showErrorToast('Error saving tour: ' + (response.data || 'Unknown error'));
                }
            }).fail((xhr, status, error) => {
                this.showErrorToast('Failed to save tour. Please try again.');
                console.error('Save tour failed:', error);
            });
        },

        async exitCreator() {
            const confirmed = await this.showConfirmationModal(
                'Are you sure you want to exit? Any unsaved changes will be lost.',
                'Exit Creator',
                'Cancel'
            );

            if (confirmed) {
                // Return to tour settings page
                const tourId = this.currentTourId || '';
                window.location.href = mclTour.ajax_url.replace('admin-ajax.php', 'admin.php?page=mcl_tours' + (tourId ? '&edit=' + tourId : ''));
            }
        },

        // Tour playback methods
        startTour(tourData) {
            if (!tourData.steps || tourData.steps.length === 0) {
                return;
            }

            // Check if driver.js is available
            let driverFunction = null;
            
            // Try different possible locations for the driver function
            if (typeof window.driver?.js?.driver === 'function') {
                driverFunction = window.driver.js.driver;
            } else if (typeof window.driver?.driver === 'function') {
                driverFunction = window.driver.driver;
            } else if (typeof window.driver === 'function') {
                driverFunction = window.driver;
            }
            
            if (!driverFunction) {
                console.error('Driver.js is not available. Available on window:', Object.keys(window).filter(k => k.includes('driver')));
                console.error('window.driver:', window.driver);
                return;
            }

                    // Filter steps for current page and handle navigation
        const currentPageUrl = this.getCurrentPageUrl();
        let currentPageSteps = [];
        let nextPageStep = null;
        let prevPageStep = null;
        let startStepIndex = tourData.continue_from_step || 0;
        
        // When continuing a tour, first check if the target step is on a different page
        if (tourData.continue_from_step !== undefined && startStepIndex < tourData.steps.length) {
            const targetStep = tourData.steps[startStepIndex];
            const targetStepPageUrl = targetStep.page_url || currentPageUrl;
            
            // If the target step is on a different page, navigate there directly
            if (targetStepPageUrl !== currentPageUrl) {
                console.log('Target step is on different page, navigating to:', {
                    targetStepIndex: startStepIndex,
                    targetPageUrl: targetStepPageUrl,
                    currentPageUrl: currentPageUrl
                });
                this.navigateToTourStep(tourData.id, {
                    ...targetStep,
                    originalIndex: startStepIndex
                });
                return;
            }
        }
        
        // Find steps for current page, next page step, and previous page step
        for (let i = 0; i < tourData.steps.length; i++) {
            const step = tourData.steps[i];
            const stepPageUrl = step.page_url || currentPageUrl;
            
            if (stepPageUrl === currentPageUrl) {
                currentPageSteps.push({
                    ...step,
                    originalIndex: i
                });
            }
            
            // Find next step on different page (after startStepIndex)
            if (i > startStepIndex && !nextPageStep && stepPageUrl !== currentPageUrl) {
                nextPageStep = {
                    ...step,
                    originalIndex: i
                };
            }
            
            // Find previous step on different page (before startStepIndex)
            if (i < startStepIndex && stepPageUrl !== currentPageUrl) {
                prevPageStep = {
                    ...step,
                    originalIndex: i
                };
            }
        }
        
        // If continuing a tour, filter steps to start from the right one
        if (tourData.continue_from_step !== undefined) {
            currentPageSteps = currentPageSteps.filter(step => step.originalIndex >= startStepIndex);
        }
        
        if (currentPageSteps.length === 0) {
            if (nextPageStep) {
                // No steps on current page, navigate to next step's page
                this.navigateToTourStep(tourData.id, nextPageStep);
                return;
            } else if (tourData.continue_from_step !== undefined) {
                // Tour continuation but no valid steps found
                console.log('No valid steps found for tour continuation');
                return;
            }
        }

            // Get tour settings with defaults
            const settings = tourData.settings || {};
            
            // Debug logging for settings
            console.log('Tour Settings Debug:', {
                animate: settings.animate,
                animateType: typeof settings.animate,
                show_progress: settings.show_progress,
                progressType: typeof settings.show_progress,
                allow_close: settings.allow_close,
                closeType: typeof settings.allow_close,
                confirm_exit: settings.confirm_exit,
                confirmType: typeof settings.confirm_exit,
                allSettings: settings
            });
            
            const steps = currentPageSteps.map((step, index) => {
                const isLastStepOnPage = index === currentPageSteps.length - 1;
                let description = step.content;
                
                // Get step-specific button settings or use defaults from tour settings
                const stepButtons = step.show_buttons !== false ? 
                    (settings.default_buttons || ['next', 'previous', 'close']) : 
                    ['close'];
                
                // Modify the last step if there are more steps on other pages
                if (isLastStepOnPage && nextPageStep) {
                    description += `<br><br><em>Click "Continue" to go to the next page...</em>`;
                    // Force showing next button even on last step when there are more steps
                    if (!stepButtons.includes('next')) {
                        stepButtons.push('next');
                    }
                }
                
                return {
                    element: step.element,
                    popover: {
                        title: step.title,
                        description: description,
                        side: step.position || 'bottom',
                        showButtons: stepButtons
                    }
                };
            });

            // Calculate initial global position for progress text
            const initialGlobalPosition = startStepIndex + 1;
            
            // Build driver configuration using tour settings
            const driverConfig = {
                // Animation settings - use explicit boolean value
                animate: settings.animate === true,
                
                // Progress settings - use explicit boolean value
                showProgress: settings.show_progress === true,
                progressText: (settings.progress_text || '{{current}} of {{total}}')
                    .replace('{{current}}', initialGlobalPosition)
                    .replace('{{total}}', tourData.steps.length),
                
                // Exit control settings - use explicit boolean value (defaults to true if not set)
                allowClose: settings.allow_close !== false,
                
                // Button text settings
                doneBtnText: settings.done_btn_text || mclTour.i18n.done || 'Done',
                nextBtnText: nextPageStep ? 'Continue' : (settings.next_btn_text || mclTour.i18n.next || 'Next'),
                prevBtnText: settings.prev_btn_text || mclTour.i18n.prev || 'Previous',
                
                // Overlay settings
                overlayColor: settings.overlay_color || 'rgba(0, 0, 0, 0.75)',
                
                // Popover settings
                popoverClass: settings.popover_class || '',
                
                // Advanced settings
                stagePadding: settings.padding || 4, // driver.js uses stagePadding, not padding
                smoothScroll: settings.smooth_scroll !== false, // Default to true unless explicitly disabled
                
                steps: steps,
                onNextClick: (element, step, options) => {
                    const currentStepIndex = driver.getActiveIndex();
                    const isLastStep = currentStepIndex === steps.length - 1;
                    
                    if (isLastStep && nextPageStep) {
                        // Navigate to next page step
                        console.log('Navigating to next page via Next button');
                        driver.destroy();
                        this.navigateToTourStep(tourData.id, nextPageStep);
                        return;
                    }
                    
                    // Default next behavior
                    driver.moveNext();
                },
                onPrevClick: (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex();
                    const isFirstDriverStep = currentDriverStep === 0;
                    
                    // Handle checklist integration - uncheck current step's item when going backward
                    const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourData.steps);
                    this.handleStepChecklistIntegration(currentGlobalIndex, tourData.steps, 'backward');
                    
                    if (isFirstDriverStep && startStepIndex > 0) {
                        const prevGlobalIndex = currentGlobalIndex - 1;
                        if (prevGlobalIndex >= 0) {
                            const prevRaw = tourData.steps[prevGlobalIndex];
                            const prevUrl = prevRaw.page_url || currentPageUrl;
                            if (prevUrl === currentPageUrl) {
                                console.log('Restarting tour on same page via Previous button');
                                driver.destroy();
                                const newTourData = Object.assign({}, tourData, { continue_from_step: prevGlobalIndex });
                                this.startTour(newTourData);
                            } else {
                                console.log('Navigating to previous page via Previous button');
                                driver.destroy();
                                this.navigateToTourStep(tourData.id, {
                                    page_url: prevUrl,
                                    originalIndex: prevGlobalIndex
                                });
                            }
                            return;
                        }
                    }
                    
                    // Only call movePrevious if we can move within current driver instance
                    if (!isFirstDriverStep) {
                        driver.movePrevious();
                    }
                },
                onHighlighted: (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex();
                    const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourData.steps);
                    
                    // Update the progress text with correct global step position immediately
                    this.updateTourProgress(currentGlobalIndex + 1, tourData.steps.length, settings);
                    this.updateTourButtons(currentGlobalIndex, tourData.steps.length, startStepIndex, settings);
                    
                    // Handle checklist integration - check item when step is highlighted
                    this.handleStepChecklistIntegration(currentGlobalIndex, tourData.steps, 'forward');
                    
                    // Also update after a short delay to override any driver.js changes
                    setTimeout(() => {
                        this.updateTourButtons(currentGlobalIndex, tourData.steps.length, startStepIndex, settings);
                    }, 50);
                    
                },
                onDestroyed: () => {
                    // Clean up driver reference
                    this.currentDriverInstance = null;
                    
                    // Only mark as completed if there are no more steps on other pages
                    if (!nextPageStep) {
                        console.log('Tour completed - no more steps');
                        this.markTourCompleted(tourData.id);
                    } else {
                        console.log('Tour destroyed but more steps exist on other pages');
                    }
                    
                    console.log('Regular tour onDestroyed called - tour should be closed now');
                }
            };
            
            // Handle exit control functionality - only set onDestroyStarted if needed
            if (settings.confirm_exit === true && settings.allow_close !== false) {
                // Confirm on exit but allow exit
                driverConfig.onDestroyStarted = (element, step, options) => {
                    // Check if this is the last step - don't confirm on last step
                    const currentDriverStep = driver.getActiveIndex();
                    const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourData.steps);
                    const isLastStep = currentGlobalIndex === tourData.steps.length - 1;
                    
                    console.log('Regular tour exit check:', {
                        currentDriverStep,
                        currentGlobalIndex,
                        totalSteps: tourData.steps.length,
                        isLastStep,
                        lastStepIndex: tourData.steps.length - 1
                    });
                    
                    if (isLastStep) {
                        console.log('Last step detected - manually destroying tour');
                        // Manually destroy the tour on last step
                        setTimeout(() => {
                            if (driver && typeof driver.destroy === 'function') {
                                driver.destroy();
                            }
                        }, 0);
                        return true; // Allow closing on last step without confirmation
                    }
                    
                    console.log('Not last step - showing confirmation');
                    const confirmMessage = settings.exit_message || 'Are you sure you want to exit the tour?';
                    
                    // Always prevent immediate destruction for non-last steps
                    // We'll handle the confirmation and manual destruction separately
                    this.handleTourExitConfirmation(confirmMessage);
                    return false;
                };
            } else if (settings.allow_close === false) {
                // Prevent exit functionality - override allowClose and add onDestroyStarted
                driverConfig.allowClose = false;
                driverConfig.onDestroyStarted = (element, step, options) => {
                    // Check if this is the last step - allow closing only on last step
                    const currentDriverStep = driver.getActiveIndex();
                    const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourData.steps);
                    const isLastStep = currentGlobalIndex === tourData.steps.length - 1;
                    
                    console.log('Regular tour exit check:', {
                        currentDriverStep,
                        currentGlobalIndex,
                        totalSteps: tourData.steps.length,
                        isLastStep,
                        lastStepIndex: tourData.steps.length - 1
                    });
                    
                    if (isLastStep) {
                        console.log('Last step detected - manually destroying tour');
                        // Manually destroy the tour on last step
                        setTimeout(() => {
                            if (driver && typeof driver.destroy === 'function') {
                                driver.destroy();
                            }
                        }, 0);
                        return true; // Allow closing on last step without confirmation
                    } else {
                        // Show a message that the tour cannot be closed
                        const message = settings.exit_message || 'You must complete the tour before you can exit.';
                        this.handleTourExitMessage(message);
                        return false; // Prevent closing
                    }
                };
            }
            // If neither confirm_exit nor prevent exit is set, use default behavior (no onDestroyStarted)

            // Convert overlay color to rgba if needed
            if (settings.overlay_color && settings.overlay_opacity !== undefined) {
                const color = settings.overlay_color;
                const opacity = settings.overlay_opacity;
                
                if (color.startsWith('#')) {
                    // Convert hex to rgba
                    const r = parseInt(color.slice(1, 3), 16);
                    const g = parseInt(color.slice(3, 5), 16);
                    const b = parseInt(color.slice(5, 7), 16);
                    driverConfig.overlayColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                } else {
                    driverConfig.overlayColor = color;
                }
            }

            const driver = driverFunction(driverConfig);
            
            // Store driver reference for exit handling
            this.currentDriverInstance = driver;

            driver.drive();
            
            // Customize close button after driver is created
            setTimeout(() => {
                this.customizeDriverCloseButton(settings);
            }, 100);
            
            // Update progress and buttons after a minimal delay to ensure driver is initialized
            setTimeout(() => {
                const initialGlobalIndex = tourData.continue_from_step || 0;
                this.updateTourProgress(initialGlobalIndex + 1, tourData.steps.length, settings);
                this.updateTourButtons(initialGlobalIndex, tourData.steps.length, startStepIndex, settings);
            }, 50);
        },

        navigateToTourStep(tourId, step) {
            if (!step.page_url) {
                console.log('No page URL for step, skipping navigation');
                return;
            }
            
            console.log('Navigating to tour step:', {
                tourId: tourId,
                stepIndex: step.originalIndex,
                pageUrl: step.page_url,
                currentUrl: window.location.href
            });
            
            // Show loading indicator
            this.showNavigationLoading();
            
            // Add tour continuation parameters
            // Use current page as base to properly resolve relative URLs
            const url = new URL(step.page_url, window.location.href);
            url.searchParams.set('mcl_continue_tour', tourId);
            url.searchParams.set('mcl_tour_step', step.originalIndex);
            
            const finalUrl = url.toString();
            console.log('Final navigation URL:', finalUrl);
            
            window.location.href = finalUrl;
        },

        markTourCompleted(tourId) {
            // Check if this is a first login tour
            const tour = mclTour.tours.find(t => t.id == tourId);
            const isFirstLoginTour = tour && tour.trigger_type === 'first_login';
            
            $.post(mclTour.ajax_url, {
                action: 'mcl_mark_tour_complete',
                tour_id: tourId,
                is_first_login: isFirstLoginTour,
                nonce: mclTour.nonce
            });
        },

        checkForPreviewStart() {
            // Check if we should auto-start a preview
            const urlParams = new URLSearchParams(window.location.search);
            const previewStep = urlParams.get('mcl_preview_step');
            
            if (previewStep !== null) {
                const stepIndex = parseInt(previewStep);
                console.log('Auto-starting preview from step:', stepIndex);
                
                // Validate that we have tour steps loaded
                if (!this.tourSteps || this.tourSteps.length === 0) {
                    console.error('Cannot start preview: no tour steps loaded');
                    return;
                }
                
                // Validate step index
                if (stepIndex < 0 || stepIndex >= this.tourSteps.length) {
                    console.error('Invalid step index for preview:', stepIndex, 'Total steps:', this.tourSteps.length);
                    return;
                }
                
                // Small delay to ensure everything is loaded
                setTimeout(() => {
                    console.log('Starting preview with', this.tourSteps.length, 'total steps from step', stepIndex);
                    this.startPreviewFromStep(stepIndex);
                }, 500);
            }
        },

        startPreviewFromStep(fromStepIndex) {
            if (this.tourSteps.length === 0) {
                console.log('No tour steps available for preview');
                return;
            }

            const driverFunction = this.getDriverFunction();
            if (!driverFunction) {
                console.error('Driver.js not available for preview');
                return;
            }

            const currentPageUrl = this.getCurrentPageUrl();
            
            // When starting preview from a specific step, check if that step is on a different page
            if (fromStepIndex < this.tourSteps.length) {
                const targetStep = this.tourSteps[fromStepIndex];
                const targetStepPageUrl = targetStep.page_url || currentPageUrl;
                
                // If the target step is on a different page, navigate there directly
                if (targetStepPageUrl !== currentPageUrl) {
                    console.log('Preview target step is on different page, navigating to:', {
                        targetStepIndex: fromStepIndex,
                        targetPageUrl: targetStepPageUrl,
                        currentPageUrl: currentPageUrl
                    });
                    this.navigateToTourPreview({
                        page_url: targetStepPageUrl,
                        originalIndex: fromStepIndex
                    });
                    return;
                }
            }
            
            // Get tour settings with defaults
            const settings = this.tourSettings || {};
            
            // Debug logging for settings (Preview)
            console.log('Preview Tour Settings Debug:', {
                animate: settings.animate,
                animateType: typeof settings.animate,
                show_progress: settings.show_progress,
                progressType: typeof settings.show_progress,
                allow_close: settings.allow_close,
                closeType: typeof settings.allow_close,
                confirm_exit: settings.confirm_exit,
                confirmType: typeof settings.confirm_exit,
                allSettings: settings
            });
            
            // Convert all tour steps to driver.js format
            const allSteps = this.tourSteps.map((step, index) => {
                const stepPageUrl = step.page_url || currentPageUrl;
                const isOnCurrentPage = stepPageUrl === currentPageUrl;
                const isLastStep = index === this.tourSteps.length - 1;
                
                console.log(`Processing step ${index}:`, {
                    stepPageUrl,
                    currentPageUrl,
                    isOnCurrentPage,
                    fromStepIndex,
                    shouldInclude: isOnCurrentPage && index >= fromStepIndex
                });
                
                // For steps not on current page, we'll skip them in the driver
                if (!isOnCurrentPage) {
                    return null;
                }
                
                // Also skip steps before fromStepIndex
                if (index < fromStepIndex) {
                    return null;
                }
                
                let description = step.content;
                
                // Check if there are more steps after this one (on any page)
                const hasMoreSteps = index < this.tourSteps.length - 1;
                const isLastStepOnCurrentPage = this.isLastStepOnCurrentPage(index, currentPageUrl);
                
                if (isLastStepOnCurrentPage && hasMoreSteps) {
                    description += `<br><br><em>Click "Continue" to go to the next page...</em>`;
                }
                
                // Get step-specific button settings or use defaults from tour settings
                const stepButtons = step.show_buttons !== false ? 
                    (settings.default_buttons || ['next', 'previous', 'close']) : 
                    ['close'];
                
                return {
                    element: step.element,
                    popover: {
                        title: step.title,
                        description: description,
                        side: step.position || 'bottom',
                        showButtons: stepButtons
                    }
                };
            }).filter(step => step !== null); // Remove null steps (steps not on current page)
            
            if (allSteps.length === 0) {
                // No steps on current page, find the next page
                for (let i = fromStepIndex; i < this.tourSteps.length; i++) {
                    const stepPageUrl = this.tourSteps[i].page_url || currentPageUrl;
                    if (stepPageUrl !== currentPageUrl) {
                        this.navigateToTourPreview({
                            page_url: stepPageUrl,
                            originalIndex: i
                        });
                        return;
                    }
                }
                console.log('No steps found for preview continuation');
                return;
            }

            console.log('Driver steps to execute:', {
                allStepsCount: allSteps.length,
                fromStepIndex,
                currentPageUrl
            });

            // Calculate total step count and current position in entire tour
            const totalSteps = this.tourSteps.length;
            
            // Find the last global step index that will be shown on this page
            let lastGlobalStepOnThisPage = -1;
            for (let i = this.tourSteps.length - 1; i >= fromStepIndex; i--) {
                const stepPageUrl = this.tourSteps[i].page_url || currentPageUrl;
                if (stepPageUrl === currentPageUrl) {
                    lastGlobalStepOnThisPage = i;
                    break;
                }
            }
            
            // Determine if there are more steps after the last step on this page
            const hasMoreStepsAfterPage = lastGlobalStepOnThisPage < this.tourSteps.length - 1;
            
            console.log('Preview navigation debug:', {
                fromStepIndex,
                currentPageUrl,
                lastGlobalStepOnThisPage,
                totalSteps,
                hasMoreStepsAfterPage,
                allStepsCount: allSteps.length
            });
            
            // Calculate the initial global step position
            const initialGlobalPosition = fromStepIndex + 1;
            
            // Build driver configuration using tour settings
            const driverConfig = {
                // Animation settings - use explicit boolean value
                animate: settings.animate === true,
                
                // Progress settings - use explicit boolean value
                showProgress: settings.show_progress === true,
                progressText: (settings.progress_text || '{{current}} of {{total}}')
                    .replace('{{current}}', initialGlobalPosition)
                    .replace('{{total}}', totalSteps),
                
                // Exit control settings - use explicit boolean value (defaults to true if not set)
                allowClose: settings.allow_close !== false, // Default to true
                
                // Button text settings
                doneBtnText: hasMoreStepsAfterPage ? 'Continue' : (settings.done_btn_text || 'Close Preview'),
                nextBtnText: settings.next_btn_text || 'Next',
                prevBtnText: settings.prev_btn_text || 'Previous',
                
                // Overlay settings
                overlayColor: settings.overlay_color || 'rgba(0, 0, 0, 0.75)',
                
                // Popover settings
                popoverClass: settings.popover_class || '',
                
                // Advanced settings
                stagePadding: settings.padding || 4, // driver.js uses stagePadding, not padding
                smoothScroll: settings.smooth_scroll !== false, // Default to true
                
                steps: allSteps,
                onNextClick: (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex();
                    const isLastDriverStep = currentDriverStep === allSteps.length - 1;
                    
                    console.log('Next clicked:', {
                        currentDriverStep,
                        isLastDriverStep,
                        totalDriverSteps: allSteps.length
                    });
                    
                    if (isLastDriverStep) {
                        // Find the next step in the global tour
                        const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, fromStepIndex);
                        const nextGlobalIndex = currentGlobalIndex + 1;
                        
                        console.log('Last driver step reached:', {
                            currentGlobalIndex,
                            nextGlobalIndex,
                            totalGlobalSteps: this.tourSteps.length
                        });
                        
                        if (nextGlobalIndex < this.tourSteps.length) {
                            // Navigate to next step (possibly on different page)
                            const nextStep = this.tourSteps[nextGlobalIndex];
                            const nextStepPageUrl = nextStep.page_url || currentPageUrl;
                            
                            console.log('Next step found:', {
                                nextStepPageUrl,
                                currentPageUrl,
                                isDifferentPage: nextStepPageUrl !== currentPageUrl
                            });
                            
                            if (nextStepPageUrl !== currentPageUrl) {
                                console.log('Navigating to next page via Next button (Preview)');
                                driver.destroy();
                                this.navigateToTourPreview({
                                    page_url: nextStepPageUrl,
                                    originalIndex: nextGlobalIndex
                                });
                                return;
                            } else {
                                // This shouldn't happen if filtering is correct
                                console.warn('Next step is on same page but not in driver steps - this is unexpected');
                                return;
                            }
                        } else {
                            // No more steps in the entire tour - let it complete naturally
                            console.log('Tour completed - no more steps anywhere');
                            // Don't call moveNext(), let the tour complete naturally
                            driver.destroy();
                            return;
                        }
                    }
                    
                    // Only call moveNext if we're not on the last step
                    if (!isLastDriverStep) {
                        driver.moveNext();
                    } else {
                        // On last step of current page, check if it's also the last step globally
                        const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, fromStepIndex);
                        if (currentGlobalIndex === this.tourSteps.length - 1) {
                            // This is the very last step - close the preview
                            console.log('Closing preview from last step');
                            driver.destroy();
                        }
                    }
                },
                onPrevClick: (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex();
                    const isFirstDriverStep = currentDriverStep === 0;
                    
                    // Handle checklist integration - uncheck current step's item when going backward (preview mode)
                    const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, fromStepIndex);
                    this.handleStepChecklistIntegration(currentGlobalIndex, this.tourSteps, 'backward');
                    
                    if (isFirstDriverStep && fromStepIndex > 0) {
                        // Find the previous step in the global tour
                        const prevGlobalIndex = currentGlobalIndex - 1;
                        
                        console.log('First driver step reached:', {
                            currentGlobalIndex,
                            prevGlobalIndex
                        });
                        
                        if (prevGlobalIndex >= 0) {
                            const prevStep = this.tourSteps[prevGlobalIndex];
                            const prevStepPageUrl = prevStep.page_url || currentPageUrl;
                            
                            console.log('Previous step found:', {
                                prevStepPageUrl,
                                currentPageUrl,
                                isDifferentPage: prevStepPageUrl !== currentPageUrl
                            });
                            
                            if (prevStepPageUrl !== currentPageUrl) {
                                console.log('Navigating to previous page via Previous button (Preview)');
                                driver.destroy();
                                this.navigateToTourPreview({
                                    page_url: prevStepPageUrl,
                                    originalIndex: prevGlobalIndex
                                });
                                return;
                            } else {
                                // Previous step is on same page but was filtered out - need to restart tour from that step
                                console.log('Previous step is on same page, restarting tour from step:', prevGlobalIndex);
                                driver.destroy();
                                this.startPreviewFromStep(prevGlobalIndex);
                                return;
                            }
                        }
                    }
                    
                    // Only call movePrevious if we can move within current driver instance
                    if (!isFirstDriverStep) {
                        driver.movePrevious();
                    }
                },
                onHighlighted: (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex();
                    const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, fromStepIndex);
                    
                    // Update the progress text with correct global step position immediately
                    this.updateTourProgress(currentGlobalIndex + 1, totalSteps, settings);
                    this.updateTourButtons(currentGlobalIndex, totalSteps, fromStepIndex, settings);
                    
                    // Handle checklist integration - check item when step is highlighted (preview mode)
                    this.handleStepChecklistIntegration(currentGlobalIndex, this.tourSteps, 'forward');
                    
                    // Also update after a short delay to override any driver.js changes
                    setTimeout(() => {
                        this.updateTourButtons(currentGlobalIndex, totalSteps, fromStepIndex, settings);
                    }, 50);
                    
                    console.log('Preview step highlighted:', {
                        driverIndex: currentDriverStep,
                        globalIndex: currentGlobalIndex,
                        globalPosition: currentGlobalIndex + 1,
                        totalSteps: totalSteps
                    });
                },
                onDestroyed: () => {
                    // Clean up driver reference
                    this.currentDriverInstance = null;
                    
                    console.log('Preview destroyed');
                }
            };
            
            // Handle exit control functionality - only set onDestroyStarted if needed
            if (settings.confirm_exit === true && settings.allow_close !== false) {
                // Confirm on exit but allow exit
                driverConfig.onDestroyStarted = (element, step, options) => {
                    // Check if this is the last step - don't confirm on last step
                    const currentDriverStep = driver.getActiveIndex();
                    const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourData.steps);
                    const isLastStep = currentGlobalIndex === tourData.steps.length - 1;
                    
                    console.log('Regular tour exit check:', {
                        currentDriverStep,
                        currentGlobalIndex,
                        totalSteps: tourData.steps.length,
                        isLastStep,
                        lastStepIndex: tourData.steps.length - 1
                    });
                    
                    if (isLastStep) {
                        console.log('Last step detected - manually destroying tour');
                        // Manually destroy the tour on last step
                        setTimeout(() => {
                            if (driver && typeof driver.destroy === 'function') {
                                driver.destroy();
                            }
                        }, 0);
                        return true; // Allow closing on last step without confirmation
                    }
                    
                    console.log('Not last step - showing confirmation');
                    const confirmMessage = settings.exit_message || 'Are you sure you want to exit the tour?';
                    
                    // Always prevent immediate destruction for non-last steps
                    // We'll handle the confirmation and manual destruction separately
                    this.handleTourExitConfirmation(confirmMessage);
                    return false;
                };
            } else if (settings.allow_close === false) {
                // Prevent exit functionality - override allowClose and add onDestroyStarted
                driverConfig.allowClose = false;
                driverConfig.onDestroyStarted = (element, step, options) => {
                    // Check if this is the last step - allow closing only on last step
                    const currentDriverStep = driver.getActiveIndex();
                    const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourData.steps);
                    const isLastStep = currentGlobalIndex === tourData.steps.length - 1;
                    
                    console.log('Regular tour exit check:', {
                        currentDriverStep,
                        currentGlobalIndex,
                        totalSteps: tourData.steps.length,
                        isLastStep,
                        lastStepIndex: tourData.steps.length - 1
                    });
                    
                    if (isLastStep) {
                        console.log('Last step detected - manually destroying tour');
                        // Manually destroy the tour on last step
                        setTimeout(() => {
                            if (driver && typeof driver.destroy === 'function') {
                                driver.destroy();
                            }
                        }, 0);
                        return true; // Allow closing on last step without confirmation
                    } else {
                        // Show a message that the tour cannot be closed
                        const message = settings.exit_message || 'You must complete the tour before you can exit.';
                        this.handleTourExitMessage(message);
                        return false; // Prevent closing
                    }
                };
            }
            // If neither confirm_exit nor prevent exit is set, use default behavior (no onDestroyStarted)

            // Convert overlay color to rgba if needed
            if (settings.overlay_color && settings.overlay_opacity !== undefined) {
                const color = settings.overlay_color;
                const opacity = settings.overlay_opacity;
                
                if (color.startsWith('#')) {
                    // Convert hex to rgba
                    const r = parseInt(color.slice(1, 3), 16);
                    const g = parseInt(color.slice(3, 5), 16);
                    const b = parseInt(color.slice(5, 7), 16);
                    driverConfig.overlayColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                } else {
                    driverConfig.overlayColor = color;
                }
            }

            const driver = driverFunction(driverConfig);
            
            // Store driver reference for exit handling
            this.currentDriverInstance = driver;

            driver.drive();
            
            // Customize close button after driver is created
            setTimeout(() => {
                this.customizeDriverCloseButton(settings);
            }, 100);
            
            // Update progress and buttons after a minimal delay to ensure driver is initialized
            setTimeout(() => {
                const initialGlobalIndex = fromStepIndex;
                this.updateTourProgress(initialGlobalIndex + 1, totalSteps, settings);
                this.updateTourButtons(initialGlobalIndex, totalSteps, fromStepIndex, settings);
            }, 50);
        },

        getCurrentGlobalStepIndex(driverStepIndex, currentPageUrl, fromStepIndex, tourSteps = null) {
            // Use the provided tourSteps or fall back to this.tourSteps
            const steps = tourSteps || this.tourSteps;
            
            // Convert driver step index back to global step index
            let currentPageStepCount = 0;
            
            for (let i = fromStepIndex; i < steps.length; i++) {
                const stepPageUrl = steps[i].page_url || currentPageUrl;
                if (stepPageUrl === currentPageUrl) {
                    if (currentPageStepCount === driverStepIndex) {
                        return i;
                    }
                    currentPageStepCount++;
                }
            }
            
            // Fallback if not found (shouldn't happen in normal circumstances)
            return fromStepIndex + driverStepIndex;
        },

        isLastStepOnCurrentPage(stepIndex, currentPageUrl) {
            // Check if this is the last step on the current page
            for (let i = stepIndex + 1; i < this.tourSteps.length; i++) {
                const stepPageUrl = this.tourSteps[i].page_url || currentPageUrl;
                if (stepPageUrl === currentPageUrl) {
                    return false; // Found another step on current page
                }
            }
            return true; // No more steps on current page
        },

        getDriverFunction() {
            // Try different possible locations for the driver function
            if (typeof window.driver?.js?.driver === 'function') {
                return window.driver.js.driver;
            } else if (typeof window.driver?.driver === 'function') {
                return window.driver.driver;
            } else if (typeof window.driver === 'function') {
                return window.driver;
            }
            return null;
        },

        updateTourProgress(currentStep, totalSteps, settings = {}) {
            // Use custom progress text template from settings
            const progressTemplate = settings.progress_text || '{{current}} of {{total}}';
            const correctText = progressTemplate
                .replace('{{current}}', currentStep)
                .replace('{{total}}', totalSteps);
            
            const updateProgressText = () => {
                const progressElement = document.querySelector('.driver-popover-progress-text');
                if (progressElement) {
                    progressElement.textContent = correctText;
                    
                    // Set up a MutationObserver to watch for driver.js trying to change it back
                    if (!progressElement._mclObserver) {
                        const observer = new MutationObserver((mutations) => {
                            mutations.forEach((mutation) => {
                                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                                    if (progressElement.textContent !== correctText) {
                                        progressElement.textContent = correctText;
                                    }
                                }
                            });
                        });
                        
                        observer.observe(progressElement, {
                            childList: true,
                            subtree: true,
                            characterData: true
                        });
                        
                        progressElement._mclObserver = observer;
                        
                        // Clean up observer after 1 second (reduced from 2)
                        setTimeout(() => {
                            if (progressElement._mclObserver) {
                                progressElement._mclObserver.disconnect();
                                delete progressElement._mclObserver;
                            }
                        }, 1000);
                    }
                    
                    return true;
                }
                return false;
            };
            
            // Try immediately and more aggressively
            updateProgressText();
            
            // Try again after minimal delays
            setTimeout(updateProgressText, 10);
            setTimeout(updateProgressText, 25);
            setTimeout(updateProgressText, 100);
        },

        updateTourButtons(currentGlobalIndex, totalSteps, fromStepIndex, settings = {}) {
            // Enable/disable buttons based on global tour position
            const prevButton = document.querySelector('.driver-popover-prev-btn');
            const nextButton = document.querySelector('.driver-popover-next-btn');
            const closeButton = document.querySelector('.driver-popover-close-btn');
            
            if (prevButton) {
                // Previous button should be enabled if we're not at the very first step (global index 0)
                const isFirstGlobalStep = currentGlobalIndex === 0;
                
                // Force enable/disable regardless of driver.js state
                if (!isFirstGlobalStep) {
                    prevButton.disabled = false;
                    prevButton.style.opacity = '1';
                    prevButton.style.pointerEvents = 'auto';
                    prevButton.removeAttribute('disabled');
                    prevButton.classList.remove('driver-popover-prev-btn--disabled');
                } else {
                    prevButton.disabled = true;
                    prevButton.style.opacity = '0.5';
                    prevButton.style.pointerEvents = 'none';
                    prevButton.setAttribute('disabled', 'disabled');
                    prevButton.classList.add('driver-popover-prev-btn--disabled');
                }

                // Update button text from settings
                if (settings.prev_btn_text) {
                    prevButton.textContent = settings.prev_btn_text;
                }
            }
            
            if (nextButton) {
                // Next button should be enabled if we're not at the very last step
                const isLastGlobalStep = currentGlobalIndex === totalSteps - 1;
                
                if (!isLastGlobalStep) {
                    // Enable next button for non-last steps
                    nextButton.disabled = false;
                    nextButton.style.opacity = '1';
                    nextButton.style.pointerEvents = 'auto';
                    nextButton.removeAttribute('disabled');
                    
                    // Check if next step is on different page
                    const nextStepIndex = currentGlobalIndex + 1;
                    if (nextStepIndex < this.tourSteps.length) {
                        const currentPageUrl = this.getCurrentPageUrl();
                        const nextStep = this.tourSteps[nextStepIndex];
                        const nextStepPageUrl = nextStep.page_url || currentPageUrl;
                        const buttonText = nextStepPageUrl !== currentPageUrl ? 'Continue' : (settings.next_btn_text || 'Next');
                        nextButton.textContent = buttonText;
                    } else {
                        nextButton.textContent = settings.next_btn_text || 'Next';
                    }
                } else {
                    // On last step - convert next button to done button or hide it based on settings
                    const doneText = settings.done_btn_text || 'Done';
                    nextButton.textContent = doneText;
                    nextButton.disabled = false;
                    nextButton.style.opacity = '1';
                    nextButton.style.pointerEvents = 'auto';
                    nextButton.removeAttribute('disabled');
                }
            }
            
            // Ensure close button is always enabled and update text from settings
            if (closeButton) {
                closeButton.disabled = false;
                closeButton.style.opacity = '1';
                closeButton.style.pointerEvents = 'auto';
                closeButton.removeAttribute('disabled');
                
                // Don't set text content here - handled by customizeDriverCloseButton
            }
        },

        /**
         * Check if any modal is currently open
         */
        isModalOpen() {
            return $('#mcl-step-editor-modal').hasClass('active') || 
                   $('#mcl-confirmation-modal').hasClass('active');
        },

        /**
         * Toast notification system
         */
        showToast(message, type = 'info', duration = 5000) {
            const container = document.getElementById('mcl-toast-container');
            if (!container) {
                console.warn('Toast container not found');
                return;
            }

            // Create toast element
            const toast = document.createElement('div');
            toast.className = `mcl-toast mcl-toast-${type}`;
            
            // Get appropriate icon based on type
            const icons = {
                success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>`,
                error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>`,
                warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>`,
                info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`
            };

            toast.innerHTML = `
                <div class="mcl-toast-icon">
                    ${icons[type] || icons.info}
                </div>
                <div class="mcl-toast-message">${message}</div>
                <button class="mcl-toast-close" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            `;

            // Add close functionality
            const closeBtn = toast.querySelector('.mcl-toast-close');
            closeBtn.addEventListener('click', () => {
                this.hideToast(toast);
            });

            // Add to container
            container.appendChild(toast);

            // Auto-hide after duration
            if (duration > 0) {
                setTimeout(() => {
                    this.hideToast(toast);
                }, duration);
            }

            return toast;
        },

        hideToast(toast) {
            if (!toast || !toast.parentNode) return;
            
            toast.classList.add('mcl-toast-hiding');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        },

        showSuccessToast(message, duration = 4000) {
            return this.showToast(message, 'success', duration);
        },

        showErrorToast(message, duration = 6000) {
            return this.showToast(message, 'error', duration);
        },

        showWarningToast(message, duration = 5000) {
            return this.showToast(message, 'warning', duration);
        },

        showInfoToast(message, duration = 4000) {
            return this.showToast(message, 'info', duration);
        },

        /**
         * Confirmation Modal System
         */
        showConfirmationModal(title, confirmText = 'Yes, I\'m sure', cancelText = 'No, cancel', confirmClass = 'mcl-button-danger') {
            console.log('MCL: showConfirmationModal called', { title, confirmText, cancelText, confirmClass });
            
            return new Promise((resolve) => {
                const modal = document.getElementById('mcl-confirmation-modal');
                const titleElement = document.getElementById('mcl-confirmation-modal-title');
                const confirmButton = document.getElementById('mcl-confirmation-modal-confirm');
                const cancelButton = document.getElementById('mcl-confirmation-modal-cancel');
                const closeButton = document.getElementById('mcl-confirmation-modal-close');

                console.log('MCL: Modal elements found:', { 
                    modal: !!modal, 
                    titleElement: !!titleElement, 
                    confirmButton: !!confirmButton, 
                    cancelButton: !!cancelButton,
                    closeButton: !!closeButton
                });

                if (!modal || !titleElement || !confirmButton || !cancelButton) {
                    console.warn('Confirmation modal elements not found, falling back to native confirm');
                    // Fallback to native confirm dialog
                    if (cancelText && cancelText.trim()) {
                        // Normal confirmation with yes/no
                        const result = confirm(title);
                        resolve(result);
                    } else {
                        // Just a message with OK
                        alert(title);
                        resolve(true);
                    }
                    return;
                }

                // Set title and button text
                titleElement.textContent = title;
                confirmButton.textContent = confirmText;
                
                // Handle cancel button visibility
                if (cancelText && cancelText.trim()) {
                    cancelButton.textContent = cancelText;
                    cancelButton.style.display = '';
                    closeButton.style.display = ''; // Show close button
                } else {
                    cancelButton.style.display = 'none';
                    closeButton.style.display = 'none'; // Hide close button
                }

                // Reset button classes and apply the appropriate one
                confirmButton.className = `mcl-button ${confirmClass}`;

                // Show modal
                modal.classList.add('active');

                // Focus the confirm button after a short delay to ensure modal is visible
                setTimeout(() => {
                    confirmButton.focus();
                }, 100);

                // Handle confirm
                const handleConfirm = () => {
                    this.hideConfirmationModal();
                    cleanup();
                    resolve(true);
                };

                // Handle cancel/close
                const handleCancel = () => {
                    this.hideConfirmationModal();
                    cleanup();
                    resolve(false);
                };

                // Handle escape key - only allow escape if cancel is available
                const handleEscape = (e) => {
                    if (e.key === 'Escape' && cancelText && cancelText.trim()) {
                        handleCancel();
                    }
                };

                // Cleanup function
                const cleanup = () => {
                    confirmButton.removeEventListener('click', handleConfirm);
                    cancelButton.removeEventListener('click', handleCancel);
                    closeButton.removeEventListener('click', handleCancel);
                    document.removeEventListener('keydown', handleEscape);
                    // Remove the backdrop click listener
                    modal.removeEventListener('click', handleBackdropClick);
                };

                // Handle backdrop click - only if cancel is available
                const handleBackdropClick = (e) => {
                    if (e.target === modal && cancelText && cancelText.trim()) {
                        handleCancel();
                    }
                };

                // Add event listeners
                confirmButton.addEventListener('click', handleConfirm);
                if (cancelText && cancelText.trim()) {
                    cancelButton.addEventListener('click', handleCancel);
                    closeButton.addEventListener('click', handleCancel);
                    modal.addEventListener('click', handleBackdropClick);
                }
                document.addEventListener('keydown', handleEscape);

                console.log('MCL: Event listeners added to modal buttons', {
                    confirmButtonExists: !!confirmButton,
                    cancelButtonExists: !!cancelButton,
                    closeButtonExists: !!closeButton,
                    confirmButtonStyle: confirmButton ? window.getComputedStyle(confirmButton).cursor : null,
                    cancelButtonStyle: cancelButton ? window.getComputedStyle(cancelButton).cursor : null
                });
            });
        },

        hideConfirmationModal() {
            const modal = document.getElementById('mcl-confirmation-modal');
            if (!modal) return;
            
            modal.classList.add('mcl-modal-hiding');
            setTimeout(() => {
                modal.classList.remove('active', 'mcl-modal-hiding');
            }, 200);
        },

        // Add checklist integration methods
        checkChecklistItem(checklistId, itemId) {
            if (!checklistId || !itemId) {
                return;
            }

            $.post(mclTour.ajax_url, {
                action: 'mcl_tour_step_check_item',
                checklist_id: checklistId,
                item_id: itemId,
                checked: true,
                nonce: mclTour.nonce
            }, (response) => {
                if (response.success) {
                    console.log('Checklist item checked:', checklistId, itemId);
                } else {
                    console.error('Failed to check checklist item:', response.data);
                }
            }).fail((xhr, status, error) => {
                console.error('Ajax request failed when checking checklist item:', error);
            });
        },

        uncheckChecklistItem(checklistId, itemId) {
            if (!checklistId || !itemId) {
                return;
            }

            $.post(mclTour.ajax_url, {
                action: 'mcl_tour_step_check_item',
                checklist_id: checklistId,
                item_id: itemId,
                checked: false,
                nonce: mclTour.nonce
            }, (response) => {
                if (response.success) {
                    console.log('Checklist item unchecked:', checklistId, itemId);
                } else {
                    console.error('Failed to uncheck checklist item:', response.data);
                }
            }).fail((xhr, status, error) => {
                console.error('Ajax request failed when unchecking checklist item:', error);
            });
        },

        handleStepChecklistIntegration(currentStepIndex, tourSteps, direction = 'forward') {
            if (!tourSteps || currentStepIndex < 0 || currentStepIndex >= tourSteps.length) {
                return;
            }

            const currentStep = tourSteps[currentStepIndex];
            
            // Handle current step's checklist item
            if (currentStep && currentStep.checklist_id && currentStep.checklist_item_id) {
                if (direction === 'forward') {
                    // Check the item when moving forward to this step
                    this.checkChecklistItem(currentStep.checklist_id, currentStep.checklist_item_id);
                } else {
                    // Uncheck the item when moving backward from this step
                    this.uncheckChecklistItem(currentStep.checklist_id, currentStep.checklist_item_id);
                }
            }

            // If moving backward, also handle the next step (uncheck it)
            if (direction === 'backward' && currentStepIndex + 1 < tourSteps.length) {
                const nextStep = tourSteps[currentStepIndex + 1];
                if (nextStep && nextStep.checklist_id && nextStep.checklist_item_id) {
                    this.uncheckChecklistItem(nextStep.checklist_id, nextStep.checklist_item_id);
                }
            }
        },

        // Tour exit handling methods
        async handleTourExitConfirmation(confirmMessage) {
            const confirmed = await this.showConfirmationModal(
                confirmMessage,
                'Yes, exit tour',
                'No, continue tour',
                'mcl-button-danger'
            );
            
            if (confirmed && this.currentDriverInstance) {
                // User confirmed - manually destroy the driver
                try {
                    this.currentDriverInstance.destroy();
                    this.currentDriverInstance = null;
                } catch (error) {
                    console.error('Error destroying tour:', error);
                    this.currentDriverInstance = null;
                }
            }
        },

        async handleTourExitMessage(message) {
            await this.showConfirmationModal(
                message,
                'OK',
                '', // No cancel button
                'mcl-button-primary'
            );
        },

        customizeDriverCloseButton(settings) {
            const closeButton = document.querySelector('.driver-popover-close-btn');
            if (closeButton) {
                // Set the close button to show an X icon
                closeButton.innerHTML = '×';
                closeButton.style.fontSize = '20px';
                closeButton.style.fontWeight = 'bold';
                closeButton.style.width = '24px';
                closeButton.style.height = '24px';
                closeButton.style.display = 'flex';
                closeButton.style.alignItems = 'center';
                closeButton.style.justifyContent = 'center';
                closeButton.style.cursor = 'pointer';
                closeButton.style.lineHeight = '1';
                
                // Set accessibility attributes using the close_btn_text setting
                const accessibilityText = settings.close_btn_text || 'Close tour';
                closeButton.setAttribute('title', accessibilityText);
                closeButton.setAttribute('aria-label', accessibilityText);
                
                console.log('Close button customized with accessibility text:', accessibilityText);
            }
        }

    };

    // Initialize when document is ready
    $(document).ready(() => {
        TourCreator.init();
    });

    // Expose to global scope
    window.mclTourCreator = TourCreator;

})(jQuery);