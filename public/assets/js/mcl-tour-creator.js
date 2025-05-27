/**
 * Tour Creator JavaScript
 * Handles tour creation interface and previewing using driver.js
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
        currentDriverInstance: null, // Used for preview

        init() {
            this.isCreatorMode = mclTourCreatorData.is_tour_mode;
            this.currentTourId = mclTourCreatorData.tour_id;
            
            // Set a cookie to help pagebuilder iframes detect tour mode
            if (this.isCreatorMode) {
                document.cookie = 'mcl_tour_mode=1; path=/; SameSite=Lax';
                
                // Temporarily disabled to prevent duplicate loading
                // this.propagateTourModeToIframes();
            }
            
            // This script is only loaded in creator mode, so we directly initialize creator mode.
            this.initCreatorMode();
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

        checkForPreviewStart() {
            // Check for preview-related URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const previewStep = urlParams.get('mcl_preview_step');
            
            if (previewStep) {
                // If there's a preview step parameter, start the preview
                const stepIndex = parseInt(previewStep);
                if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < this.tourSteps.length) {
                    console.log('Auto-starting preview from step:', stepIndex);
                    // Small delay to ensure everything is initialized
                    setTimeout(() => {
                        this.startPreviewFromStep(stepIndex);
                    }, 100);
                }
                
                // Clean up the URL parameter
                urlParams.delete('mcl_preview_step');
                const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
                window.history.replaceState({}, '', newUrl);
            }
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
                     if ($(e.target).closest('#mcl-confirmation-modal').length > 0) {
                        return;
                    }
                    self.highlightElement(e.target);
                }
            });

            $(document).on('mouseleave', '*', function(e) {
                if ((self.currentMode === 'select' || self.isReselectingElement) && !self.isModalOpen()) {
                    if ($(e.target).closest('#mcl-confirmation-modal').length > 0) {
                        return;
                    }
                    self.removeHighlight();
                }
            });

            // Element reselection in modal
            $(document).on('click', '*', function(e) {
                if (self.isReselectingElement) {
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

            // Real-time selector validation
            let validationTimeout;
            $('#mcl-step-element').on('input', (e) => {
                clearTimeout(validationTimeout);
                validationTimeout = setTimeout(() => {
                    this.validateSelectorInEditor($(e.target).val());
                }, 300); // Debounce validation
            });

            // Add optimize selector button functionality
            this.addOptimizeSelectorButton();
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
                indicator.find('.mcl-icon-navigate').hide();
                indicator.find('.mcl-icon-selector').show();
                modeText.text(mclTourCreatorData.i18n.selectElement || 'Select Mode');
                toggleBtn.find('.mcl-icon-selector').hide();
                toggleBtn.find('.mcl-icon-navigate').show();
                toggleBtn.find('span:last-child').text(mclTourCreatorData.i18n.navigate || 'Navigate');
            } else {
                indicator.find('.mcl-icon-selector').hide();
                indicator.find('.mcl-icon-navigate').show();
                modeText.text(mclTourCreatorData.i18n.navigate || 'Navigate Mode');
                toggleBtn.find('.mcl-icon-navigate').hide();
                toggleBtn.find('.mcl-icon-selector').show();
                toggleBtn.find('span:last-child').text(mclTourCreatorData.i18n.selectElement || 'Select');
            }
        },

        toggleMode() {
            this.setMode(this.currentMode === 'select' ? 'navigate' : 'select');
        },

        selectElement(element) {
            if ($(element).closest('#mcl-tour-creator, .mcl-tour-step-modal, #mcl-confirmation-modal').length > 0) {
                return;
            }
            const selectorResult = this.generateSelectorWithStrategy(element);
            const currentPageUrl = this.getCurrentPageUrl();
            
            // Show toast with strategy info
            this.showSelectorGenerationFeedback(selectorResult);
            
            this.openStepEditor(selectorResult.selector, currentPageUrl);
        },

        getCurrentPageUrl() {
            const url = new URL(window.location.href);
            url.searchParams.delete('mcl_tour_mode');
            url.searchParams.delete('tour_id');
            url.searchParams.delete('mcl_continue_tour');
            url.searchParams.delete('mcl_tour_step');
            url.searchParams.delete('mcl_preview_step');
            let cleanUrl = url.pathname;
            if (url.searchParams.toString()) {
                cleanUrl += '?' + url.searchParams.toString();
            }
            return cleanUrl;
        },

        startElementReselection() {
            this.isReselectingElement = true;
            // Hide the modal completely while reselecting (but preserve form data)
            $('#mcl-step-editor-modal').removeClass('active').addClass('reselecting');
            $('body').css('cursor', 'crosshair');
            if (!$('.mcl-reselect-overlay').length) {
                $('body').append('<div class="mcl-reselect-overlay">Click on an element to select it...<br><small style="opacity: 0.8;">Press Escape to cancel</small></div>');
            }
            
            // Add escape key listener to cancel reselection
            $(document).on('keydown.mcl-reselect', (e) => {
                if (e.key === 'Escape' && this.isReselectingElement) {
                    this.cancelElementReselection();
                }
            });
        },

        reselectElement(element) {
            if ($(element).closest('#mcl-tour-creator, .mcl-tour-step-modal, .mcl-reselect-overlay, #mcl-confirmation-modal').length > 0) {
                return;
            }
            const selectorResult = this.generateSelectorWithStrategy(element);
            $('#mcl-step-element').val(selectorResult.selector);
            this.validateSelectorInEditor(selectorResult.selector);
            this.showSelectorGenerationFeedback(selectorResult);
            this.stopElementReselection();
            // Show the modal again after element selection
            $('#mcl-step-editor-modal').addClass('active');
        },

        stopElementReselection() {
            this.isReselectingElement = false;
            $('#mcl-step-editor-modal').removeClass('reselecting');
            $('body').css('cursor', '');
            $('.mcl-reselect-overlay').remove();
            this.removeHighlight();
            
            // Remove escape key listener
            $(document).off('keydown.mcl-reselect');
        },

        cancelElementReselection() {
            this.stopElementReselection();
            // Show the modal again without changing anything
            $('#mcl-step-editor-modal').addClass('active');
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
                const panelWidth = panel.outerWidth();
                const panelHeight = panel.outerHeight();
                const viewportWidth = $(window).width();
                const viewportHeight = $(window).height();
                newX = Math.max(10, Math.min(newX, viewportWidth - panelWidth - 10));
                newY = Math.max(10, Math.min(newY, viewportHeight - panelHeight - 10));
                panel.css({ position: 'fixed', left: newX + 'px', top: newY + 'px', right: 'auto' });
            }

            function stopDrag() {
                isDragging = false;
                panel.removeClass('dragging');
                $(document).off('mousemove', handleDrag);
                $(document).off('mouseup', stopDrag);
            }
        },

        generateSelector(element) {
            return this.generateSelectorWithStrategy(element).selector;
        },

        generateSelectorWithStrategy(element) {
            // Strategy 1: Use ID if available and unique
            if (element.id) {
                const selector = '#' + CSS.escape(element.id);
                if (this.isUniqueSelector(selector, element)) {
                    return {
                        selector: selector,
                        strategy: 'id',
                        quality: 'excellent',
                        message: 'Perfect! Using unique ID selector.'
                    };
                }
            }
            
            // Strategy 2: Try unique class combinations
            if (element.className && element.className.trim()) {
                const classes = element.className.trim().split(/\s+/)
                    .filter(cls => cls.length > 0 && !this.isCommonClass(cls))
                    .map(cls => CSS.escape(cls));
                
                // Try single classes first (skip common ones)
                for (const className of classes) {
                    const selector = '.' + className;
                    if (this.isUniqueSelector(selector, element)) {
                        return {
                            selector: selector,
                            strategy: 'single-class',
                            quality: 'excellent',
                            message: 'Great! Using unique class selector.'
                        };
                    }
                }
                
                // Try combinations of classes
                const classSelector = this.generateUniqueClassSelector(element, classes);
                if (classSelector) {
                    return {
                        selector: classSelector,
                        strategy: 'multi-class',
                        quality: 'good',
                        message: 'Good! Using combined class selector.'
                    };
                }
            }
            
            // Strategy 3: Try tag with unique attributes
            const attrSelector = this.generateAttributeSelector(element);
            if (attrSelector && this.isUniqueSelector(attrSelector, element)) {
                return {
                    selector: attrSelector,
                    strategy: 'attribute',
                    quality: 'good',
                    message: 'Good! Using attribute-based selector.'
                };
            }
            
            // Strategy 4: Use tag with nth-child/nth-of-type
            const nthSelector = this.generateNthChildSelector(element);
            if (this.isUniqueSelector(nthSelector, element)) {
                return {
                    selector: nthSelector,
                    strategy: 'nth-child',
                    quality: 'fair',
                    message: 'OK. Using position-based selector (may break if layout changes).'
                };
            }
            
            // Strategy 5: Generate path-based selector as last resort
            const pathSelector = this.generatePathBasedSelector(element);
            return {
                selector: pathSelector,
                strategy: 'path',
                quality: 'poor',
                message: 'Warning: Using complex path-based selector. Consider adding an ID or unique class to this element.'
            };
        },

        /**
         * Check if a selector uniquely identifies the target element
         */
        isUniqueSelector(selector, targetElement) {
            try {
                const elements = document.querySelectorAll(selector);
                return elements.length === 1 && elements[0] === targetElement;
            } catch (e) {
                console.warn('Invalid selector:', selector, e);
                return false;
            }
        },

        /**
         * Check if a class name is commonly used (and likely not unique)
         */
        isCommonClass(className) {
            const commonClasses = [
                'active', 'inactive', 'selected', 'disabled', 'hidden', 'visible',
                'open', 'closed', 'expanded', 'collapsed', 'current', 'first', 'last',
                'odd', 'even', 'primary', 'secondary', 'success', 'error', 'warning',
                'info', 'left', 'right', 'center', 'top', 'bottom', 'small', 'large',
                'big', 'tiny', 'medium', 'bold', 'italic', 'red', 'green', 'blue',
                'white', 'black', 'gray', 'grey', 'container', 'wrapper', 'content',
                'main', 'sidebar', 'header', 'footer', 'nav', 'menu', 'item', 'list',
                'row', 'col', 'column', 'grid', 'flex', 'inline', 'block', 'fixed',
                'absolute', 'relative', 'static', 'sticky', 'clearfix', 'clear',
                'float-left', 'float-right', 'text-left', 'text-right', 'text-center'
            ];
            return commonClasses.includes(className.toLowerCase()) || 
                   className.length < 3 || 
                   /^(wp-|jquery-|js-|css-)/.test(className);
        },

        /**
         * Generate unique class selector using combinations
         */
        generateUniqueClassSelector(element, classes) {
            if (classes.length === 0) return null;
            
            // Try combinations of 2 classes
            for (let i = 0; i < classes.length; i++) {
                for (let j = i + 1; j < classes.length; j++) {
                    const selector = '.' + classes[i] + '.' + classes[j];
                    if (this.isUniqueSelector(selector, element)) {
                        return selector;
                    }
                }
            }
            
            // Try combinations of 3 classes
            for (let i = 0; i < classes.length; i++) {
                for (let j = i + 1; j < classes.length; j++) {
                    for (let k = j + 1; k < classes.length; k++) {
                        const selector = '.' + classes[i] + '.' + classes[j] + '.' + classes[k];
                        if (this.isUniqueSelector(selector, element)) {
                            return selector;
                        }
                    }
                }
            }
            
            // Try all classes combined
            if (classes.length > 1) {
                const allClassesSelector = '.' + classes.join('.');
                if (this.isUniqueSelector(allClassesSelector, element)) {
                    return allClassesSelector;
                }
            }
            
            return null;
        },

        /**
         * Generate selector using element attributes
         */
        generateAttributeSelector(element) {
            const tagName = element.tagName.toLowerCase();
            const uniqueAttributes = ['name', 'data-id', 'data-testid', 'data-test', 'role', 'aria-label'];
            
            for (const attr of uniqueAttributes) {
                const value = element.getAttribute(attr);
                if (value) {
                    const selector = `${tagName}[${attr}="${CSS.escape(value)}"]`;
                    if (this.isUniqueSelector(selector, element)) {
                        return selector;
                    }
                }
            }
            
            // Try type attribute for inputs
            if (tagName === 'input' && element.type) {
                const selector = `input[type="${element.type}"]`;
                if (this.isUniqueSelector(selector, element)) {
                    return selector;
                }
            }
            
            // Try href for links
            if (tagName === 'a' && element.href) {
                try {
                    const url = new URL(element.href);
                    const pathname = url.pathname;
                    if (pathname && pathname !== '/') {
                        const selector = `a[href*="${CSS.escape(pathname)}"]`;
                        if (this.isUniqueSelector(selector, element)) {
                            return selector;
                        }
                    }
                } catch (e) {
                    // Invalid URL, skip
                }
            }
            
            return null;
        },

        /**
         * Generate nth-child or nth-of-type selector
         */
        generateNthChildSelector(element) {
            const tagName = element.tagName.toLowerCase();
            const parent = element.parentElement;
            
            if (!parent) {
                return tagName;
            }
            
            // Try nth-of-type first (more specific)
            const sameTagSiblings = Array.from(parent.children).filter(child => 
                child.tagName.toLowerCase() === tagName
            );
            
            if (sameTagSiblings.length === 1) {
                return tagName;
            }
            
            const nthOfTypeIndex = sameTagSiblings.indexOf(element) + 1;
            const nthOfTypeSelector = `${tagName}:nth-of-type(${nthOfTypeIndex})`;
            
            // If nth-of-type is unique, use it
            if (this.isUniqueSelector(nthOfTypeSelector, element)) {
                return nthOfTypeSelector;
            }
            
            // Fall back to nth-child
            const allSiblings = Array.from(parent.children);
            const nthChildIndex = allSiblings.indexOf(element) + 1;
            return `${tagName}:nth-child(${nthChildIndex})`;
        },

        /**
         * Generate path-based selector as last resort
         */
        generatePathBasedSelector(element) {
            const path = [];
            let current = element;
            let maxDepth = 5; // Prevent overly long selectors
            
            while (current && current.nodeType === Node.ELEMENT_NODE && 
                   current !== document.body && maxDepth > 0) {
                
                let selector = current.tagName.toLowerCase();
                
                // If we find an ID, use it and stop
                if (current.id) {
                    selector = '#' + CSS.escape(current.id);
                    path.unshift(selector);
                    break;
                }
                
                // Add the most specific class if available
                if (current.className && current.className.trim()) {
                    const classes = current.className.trim().split(/\s+/)
                        .filter(cls => cls.length > 0 && !this.isCommonClass(cls))
                        .map(cls => CSS.escape(cls));
                    
                    if (classes.length > 0) {
                        selector += '.' + classes[0];
                    }
                }
                
                // Add nth-child if needed for uniqueness at this level
                const parent = current.parentElement;
                if (parent) {
                    const sameTagSiblings = Array.from(parent.children).filter(child => 
                        child.tagName.toLowerCase() === current.tagName.toLowerCase()
                    );
                    
                    if (sameTagSiblings.length > 1) {
                        const index = sameTagSiblings.indexOf(current) + 1;
                        selector += `:nth-of-type(${index})`;
                    }
                }
                
                path.unshift(selector);
                current = current.parentElement;
                maxDepth--;
            }
            
            // Build the final selector, trying different combinations
            let finalSelector = path.join(' > ');
            
            // If the full path is unique, return it
            if (this.isUniqueSelector(finalSelector, element)) {
                return finalSelector;
            }
            
            // Try with descendant selectors instead of child selectors
            finalSelector = path.join(' ');
            if (this.isUniqueSelector(finalSelector, element)) {
                return finalSelector;
            }
            
            // If still not unique, add more specificity
            const lastElement = path[path.length - 1];
            const parent = element.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children);
                const index = siblings.indexOf(element) + 1;
                finalSelector = path.slice(0, -1).join(' ') + ' > ' + lastElement + `:nth-child(${index})`;
            }
            
            return finalSelector;
        },

        /**
         * Validate a selector and provide visual feedback in the step editor
         */
        validateSelectorInEditor(selector) {
            const elementInput = $('#mcl-step-element');
            const inputGroup = elementInput.closest('.mcl-selector-group');
            const formGroup = inputGroup.closest('.mcl-form-group');
            const description = formGroup.find('.description');
            
            // Remove existing validation classes and messages
            inputGroup.removeClass('mcl-selector-valid mcl-selector-invalid mcl-selector-warning');
            inputGroup.find('.mcl-selector-feedback').remove();
            
            if (!selector || !selector.trim()) {
                // Show original description when no selector
                description.show();
                return;
            }
            
            try {
                const elements = document.querySelectorAll(selector);
                let feedback = '';
                let cssClass = '';
                
                if (elements.length === 0) {
                    feedback = 'No elements found with this selector';
                    cssClass = 'mcl-selector-invalid';
                } else if (elements.length === 1) {
                    feedback = 'Perfect! This selector uniquely identifies 1 element';
                    cssClass = 'mcl-selector-valid';
                } else {
                    feedback = `Warning: This selector matches ${elements.length} elements. Consider making it more specific.`;
                    cssClass = 'mcl-selector-warning';
                }
                
                inputGroup.addClass(cssClass);
                inputGroup.append(`<div class="mcl-selector-feedback">${feedback}</div>`);
                
                // Hide the original description when showing validation feedback
                description.hide();
                
                // If multiple elements, briefly highlight them
                if (elements.length > 1 && elements.length <= 10) {
                    this.highlightMultipleElements(elements, 2000);
                }
                
            } catch (e) {
                inputGroup.addClass('mcl-selector-invalid');
                inputGroup.append('<div class="mcl-selector-feedback">Invalid CSS selector syntax</div>');
                
                // Hide the original description when showing validation feedback
                description.hide();
            }
        },

        /**
         * Highlight multiple elements temporarily
         */
        highlightMultipleElements(elements, duration = 2000) {
            const highlights = [];
            
            elements.forEach((element, index) => {
                if (index >= 10) return; // Limit to 10 highlights
                
                const rect = element.getBoundingClientRect();
                const highlight = $('<div class="mcl-element-highlight mcl-multiple-highlight"></div>');
                highlight.css({
                    position: 'fixed',
                    top: rect.top + 'px',
                    left: rect.left + 'px',
                    width: rect.width + 'px',
                    height: rect.height + 'px',
                    pointerEvents: 'none',
                    zIndex: 1000001,
                    border: '2px solid #ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)'
                });
                
                // Add number indicator
                if (elements.length > 1) {
                    highlight.append(`<div style="position: absolute; top: -8px; left: -8px; background: #ff6b6b; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${index + 1}</div>`);
                }
                
                $('body').append(highlight);
                highlights.push(highlight[0]);
            });
            
            // Remove highlights after duration
            setTimeout(() => {
                highlights.forEach(highlight => $(highlight).remove());
            }, duration);
        },

        /**
         * Add optimize selector button to the step editor
         */
        addOptimizeSelectorButton() {
            const selectorGroup = $('.mcl-selector-group');
            if (selectorGroup.find('.mcl-optimize-selector').length === 0) {
                const optimizeBtn = $(`
                    <button type="button" class="mcl-button mcl-button-secondary mcl-optimize-selector" title="Optimize this selector">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 16px; height: 16px;">
                            <path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clip-rule="evenodd" />
                        </svg>
                    </button>
                `);
                
                selectorGroup.append(optimizeBtn);
                
                optimizeBtn.on('click', () => {
                    this.optimizeCurrentSelector();
                });
            }
        },

        /**
         * Optimize the current selector in the editor
         */
        optimizeCurrentSelector() {
            const currentSelector = $('#mcl-step-element').val().trim();
            if (!currentSelector) {
                this.showWarningToast('Please enter a selector first.');
                return;
            }

            try {
                const elements = document.querySelectorAll(currentSelector);
                if (elements.length === 0) {
                    this.showErrorToast('No elements found with the current selector.');
                    return;
                } else if (elements.length > 1) {
                    this.showWarningToast('Current selector matches multiple elements. Please select the target element first.');
                    // Highlight the multiple elements briefly
                    this.highlightMultipleElements(elements, 3000);
                    return;
                } else {
                    // Single element found - optimize it
                    const element = elements[0];
                    const optimizedResult = this.generateSelectorWithStrategy(element);
                    
                    $('#mcl-step-element').val(optimizedResult.selector);
                    this.validateSelectorInEditor(optimizedResult.selector);
                    
                    // Show feedback about the optimization
                    this.showToast(`Selector optimized! ${optimizedResult.message}`, 
                        optimizedResult.quality === 'excellent' || optimizedResult.quality === 'good' ? 'success' : 'warning', 4000);
                }
            } catch (e) {
                this.showErrorToast('Invalid selector syntax.');
            }
        },

        /**
         * Show feedback about the selector generation strategy
         */
        showSelectorGenerationFeedback(selectorResult) {
            const { strategy, quality, message } = selectorResult;
            
            // Map quality to toast type
            const toastTypeMap = {
                'excellent': 'success',
                'good': 'success', 
                'fair': 'warning',
                'poor': 'warning'
            };
            
            const toastType = toastTypeMap[quality] || 'info';
            
            // Show toast with strategy info
            this.showToast(message, toastType, 3000);
            
            // Optional: Log detailed info for debugging
            if (typeof console !== 'undefined' && console.log) {
                console.log('MCL Selector Generated:', {
                    selector: selectorResult.selector,
                    strategy: strategy,
                    quality: quality,
                    element: selectorResult.element || 'unknown'
                });
            }
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
            this.highlightElementRef = highlight[0];
        },

        removeHighlight() {
            if (this.highlightElementRef) {
                $(this.highlightElementRef).remove();
                this.highlightElementRef = null;
            }
        },

        openStepEditor(selector = '', pageUrl = '') {
            this.removeHighlight();
            const modal = $('#mcl-step-editor-modal');
            $('#mcl-step-editor-form')[0].reset();
            $('#mcl-step-element').val(selector);
            $('#mcl-step-page-url').val(pageUrl);
            $('#mcl-step-index').val(this.currentStepIndex);
            this.populateChecklistDropdown();
            
            // Reset description visibility and validate the selector
            const formGroup = $('#mcl-step-element').closest('.mcl-form-group');
            const description = formGroup.find('.description');
            description.show(); // Always show description first
            
            if (selector) {
                this.validateSelectorInEditor(selector);
            }
            
            modal.addClass('active');
        },

        closeStepEditor() {
            // If currently reselecting an element, stop the reselection first
            if (this.isReselectingElement) {
                this.stopElementReselection();
                // Don't close the modal yet, just show it again so user can continue editing
                $('#mcl-step-editor-modal').addClass('active');
                return;
            }
            
            $('#mcl-step-editor-modal').removeClass('active');
            this.currentStepIndex = -1;
            
            // Reset validation state and description visibility
            const inputGroup = $('#mcl-step-element').closest('.mcl-selector-group');
            const formGroup = inputGroup.closest('.mcl-form-group');
            const description = formGroup.find('.description');
            
            inputGroup.removeClass('mcl-selector-valid mcl-selector-invalid mcl-selector-warning');
            inputGroup.find('.mcl-selector-feedback').remove();
            description.show();
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
                this.tourSteps[stepIndex] = stepData;
            } else {
                this.tourSteps.push(stepData);
            }
            this.updateStepsCounter();
            this.closeStepEditor();
        },

        editStep(stepIndex) {
            if (stepIndex < 0 || stepIndex >= this.tourSteps.length) return;
            const step = this.tourSteps[stepIndex];
            this.currentStepIndex = stepIndex;
            $('#mcl-step-title').val(step.title || '');
            $('#mcl-step-element').val(step.element || '');
            $('#mcl-step-page-url').val(step.page_url || '');
            $('#mcl-step-position').val(step.position || 'bottom');
            $('#mcl-step-checklist').val(step.checklist_id || '');
            $('#mcl-step-checklist-item').val(step.checklist_item_id || '');
            $('#mcl-step-show-buttons').prop('checked', step.show_buttons !== false);
            $('#mcl-step-index').val(stepIndex);
            $('#mcl-step-content').val(step.content || '');
            if (step.checklist_id) {
                this.loadChecklistItems(step.checklist_id);
            }
            $('#mcl-step-editor-modal').addClass('active');
        },

        async deleteStep(stepIndex) {
            if (stepIndex < 0 || stepIndex >= this.tourSteps.length) return;
            const stepTitle = this.tourSteps[stepIndex]?.title || 'Untitled Step';
            const confirmed = await this.showConfirmationModal(
                `Are you sure you want to delete "${stepTitle}"?`,
                'Delete Step',
                'Cancel'
            );
            if (confirmed) {
                this.tourSteps.splice(stepIndex, 1);
                this.updateStepsCounter();
                if ($('#mcl-steps-info').hasClass('expanded')) {
                    this.renderStepsList();
                }
                this.showSuccessToast('Step deleted successfully.');
            }
        },

        previewTour(fromStepIndex = 0) {
            if (this.tourSteps.length === 0) {
                this.showWarningToast('Please add some steps before previewing the tour.');
                return;
            }
            const driverFunction = this.getDriverFunction();
            if (!driverFunction) {
                console.error('Driver.js is not available.');
                this.showErrorToast('Driver.js library is not loaded. Please refresh the page and try again.');
                return;
            }
            this.startPreviewFromStep(fromStepIndex);
        },

        startPreviewFromStep(stepIndex = 0) {
            if (this.tourSteps.length === 0) {
                this.showWarningToast('No steps available to preview.');
                return;
            }

            if (stepIndex < 0 || stepIndex >= this.tourSteps.length) {
                this.showWarningToast('Invalid step index for preview.');
                return;
            }

            const driverFunction = this.getDriverFunction();
            if (!driverFunction) {
                this.showErrorToast('Driver.js library is not loaded. Please refresh the page and try again.');
                return;
            }

            // Get the current page URL for filtering steps
            const currentPageUrl = this.getCurrentPageUrl();
            
            // Filter steps for the current page and preserve original indices
            const currentPageSteps = [];
            let globalStartIndex = stepIndex;
            
            for (let i = 0; i < this.tourSteps.length; i++) {
                const step = this.tourSteps[i];
                const stepPageUrl = step.page_url || currentPageUrl;
                if (stepPageUrl === currentPageUrl) {
                    currentPageSteps.push({
                        ...step,
                        originalIndex: i
                    });
                }
            }

            if (currentPageSteps.length === 0) {
                // Navigate to the first step's page if no steps on current page
                const targetStep = this.tourSteps[stepIndex];
                if (targetStep && targetStep.page_url && targetStep.page_url !== currentPageUrl) {
                    this.navigateToTourPreview({
                        ...targetStep,
                        originalIndex: stepIndex
                    });
                    return;
                } else {
                    this.showWarningToast('No steps found for the current page.');
                    return;
                }
            }

            // Find the starting step index within current page steps
            let startIndex = 0;
            for (let i = 0; i < currentPageSteps.length; i++) {
                if (currentPageSteps[i].originalIndex >= stepIndex) {
                    startIndex = i;
                    break;
                }
            }

            // Map steps to driver.js format
            const driverSteps = currentPageSteps.map(step => {
                const driverStep = {
                    element: step.element || 'body',
                    popover: {
                        title: step.title || 'Tour Step',
                        description: step.content || '',
                        side: step.position || 'bottom',
                        showButtons: step.show_buttons !== false ? ['next', 'previous', 'close'] : []
                    }
                };

                return driverStep;
            });

            // Create driver instance with settings
            const settings = this.tourSettings || {};
            const driverOptions = {
                showProgress: settings.show_progress !== false,
                progressText: settings.progress_text || '{{current}} of {{total}}',
                animate: settings.animate !== false,
                allowClose: settings.allow_close !== false,
                onNextClick: (element, step, options) => {
                    const currentDriverStep = options.state.activeIndex;
                    const currentGlobalIndex = currentPageSteps[currentDriverStep].originalIndex;
                    
                    // Handle checklist integration
                    this.handleStepChecklistIntegration(currentGlobalIndex, this.tourSteps, 'forward');
                    
                    // Check if this is the last step on current page
                    if (this.isLastStepOnCurrentPage(currentGlobalIndex, currentPageUrl)) {
                        // Find next page step
                        const nextStep = this.tourSteps[currentGlobalIndex + 1];
                        if (nextStep && nextStep.page_url && nextStep.page_url !== currentPageUrl) {
                            // Navigate to next page
                            this.navigateToTourPreview({
                                ...nextStep,
                                originalIndex: currentGlobalIndex + 1
                            });
                            return;
                        }
                    }
                    
                    driverInstance.moveNext();
                },
                onPrevClick: (element, step, options) => {
                    const currentDriverStep = driverInstance.getActiveIndex();
                    const isFirstDriverStep = currentDriverStep === 0;
                    
                    // Get the current global index using the current page steps with original indices
                    const currentGlobalIndex = currentPageSteps[currentDriverStep].originalIndex;
                    
                    // Handle checklist integration - uncheck current step's item when going backward (preview mode)
                    this.handleStepChecklistIntegration(currentGlobalIndex, this.tourSteps, 'backward');
                    
                    if (isFirstDriverStep) {
                        // Check if there are previous steps globally
                        const prevGlobalIndex = currentGlobalIndex - 1;
                        
                        console.log('First driver step reached:', {
                            currentGlobalIndex,
                            prevGlobalIndex,
                            isFirstDriverStep,
                            currentDriverStep
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
                                driverInstance.destroy();
                                this.navigateToTourPreview({
                                    page_url: prevStepPageUrl,
                                    originalIndex: prevGlobalIndex
                                });
                                return;
                            } else {
                                // Previous step is on same page but was filtered out - need to restart tour from that step
                                console.log('Previous step is on same page, restarting tour from step:', prevGlobalIndex);
                                driverInstance.destroy();
                                this.startPreviewFromStep(prevGlobalIndex);
                                return;
                            }
                        }
                    }
                    
                    // Only call movePrevious if we can move within current driver instance
                    if (!isFirstDriverStep) {
                        driverInstance.movePrevious();
                    }
                },
                onCloseClick: async (element, step, options) => {
                    if (settings.confirm_exit) {
                        const shouldExit = await this.handleTourExitConfirmation(
                            settings.exit_message || 'Are you sure you want to exit the tour?'
                        );
                        if (!shouldExit) return;
                    }
                    driverInstance.destroy();
                },
                onHighlighted: (element, step, options) => {
                    // Update progress and buttons
                    const currentDriverStep = driverInstance.getActiveIndex();
                    const currentGlobalIndex = currentPageSteps[currentDriverStep].originalIndex;
                    
                    this.updateTourProgress(currentGlobalIndex + 1, this.tourSteps.length, settings);
                    this.updateTourButtons(currentGlobalIndex, this.tourSteps.length, stepIndex, settings);
                    
                    // Force enable Previous button if there are previous steps globally (even on different pages)
                    setTimeout(() => {
                        const prevButton = document.querySelector('.driver-popover-prev-btn');
                        if (prevButton && currentGlobalIndex > 0) {
                            prevButton.disabled = false;
                            prevButton.style.opacity = '1';
                            prevButton.style.pointerEvents = 'auto';
                            prevButton.removeAttribute('disabled');
                            prevButton.classList.remove('driver-popover-prev-btn--disabled');
                        }
                    }, 10);
                    
                    // Customize driver close button if needed
                    this.customizeDriverCloseButton(settings);
                }
            };

            // Apply custom popover class if set
            if (settings.popover_class) {
                driverOptions.popoverClass = settings.popover_class;
            }

            // Apply overlay settings
            if (settings.overlay_color || settings.overlay_opacity) {
                driverOptions.overlayColor = settings.overlay_color || '#000000';
                driverOptions.overlayOpacity = parseFloat(settings.overlay_opacity) || 0.75;
            }

            const driverInstance = driverFunction(driverOptions);
            driverInstance.setSteps(driverSteps);
            driverInstance.drive(startIndex);

            // Show success message
            this.showSuccessToast('Preview started! Use the navigation buttons to move through the tour.');
        },

        navigateToTourPreview(step) {
            if (!step.page_url) {
                console.log('No page URL for step, skipping navigation');
                return;
            }
            this.showNavigationLoading();
            try {
                const url = new URL(step.page_url, window.location.href);
                url.searchParams.set('mcl_tour_mode', '1');
                if (this.currentTourId) {
                    url.searchParams.set('tour_id', this.currentTourId);
                }
                url.searchParams.set('mcl_preview_step', step.originalIndex);
                const finalUrl = url.toString();
                setTimeout(() => { window.location.href = finalUrl; }, 100);
            } catch (error) {
                console.error('Error constructing navigation URL:', error);
                $('.mcl-tour-navigation-loading').remove();
            }
        },

        showNavigationLoading() {
            $('.mcl-tour-navigation-loading').remove();
            const loadingHtml = `
                <div class="mcl-tour-navigation-loading">
                    <div class="mcl-tour-loading-content">
                        <div class="mcl-tour-spinner"></div>
                        <div class="mcl-tour-loading-text">Loading next page...</div>
                    </div>
                </div>`;
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
            const originalCount = this.tourSteps.length;
            this.tourSteps = this.tourSteps.filter(step => step && typeof step === 'object');
            if (this.tourSteps.length !== originalCount) {
                console.warn('Filtered out invalid steps.');
            }
            if (this.tourSteps.length === 0) {
                noSteps.show();
                stepsList.find('.mcl-step-item').remove();
                return;
            }
            noSteps.hide();
            stepsList.find('.mcl-step-item').remove();
            this.tourSteps.forEach((step, index) => {
                if (!step || typeof step !== 'object') {
                    console.warn('Invalid step found at index', index, step);
                    return;
                }
                const stepItem = $(`
                    <div class="mcl-step-item" data-step-index="${index}">
                        <div class="mcl-step-drag-handle"><span class="dashicons dashicons-move"></span></div>
                        <div class="mcl-step-number">${index + 1}</div>
                        <div class="mcl-step-content">
                            <div class="mcl-step-title">${step.title || 'Untitled Step'}</div>
                            <div class="mcl-step-element">${step.element || 'No element'}</div>
                            ${step.page_url ? `<div class="mcl-step-page">${step.page_url}</div>` : ''}
                        </div>
                        <div class="mcl-step-actions">
                            <button type="button" class="mcl-step-action edit" title="Edit step" data-step-index="${index}"><span class="dashicons dashicons-edit"></span></button>
                            <button type="button" class="mcl-step-action preview" title="Preview step" data-step-index="${index}"><span class="dashicons dashicons-visibility"></span></button>
                            <button type="button" class="mcl-step-action delete" title="Delete step" data-step-index="${index}"><span class="dashicons dashicons-trash"></span></button>
                        </div>
                    </div>`);
                stepsList.append(stepItem);
            });
            this.initializeStepsSortable();
            stepsList.find('.mcl-step-action.edit').off('click').on('click', (e) => {
                e.stopPropagation();
                this.editStep(parseInt($(e.currentTarget).data('step-index')));
            });
            stepsList.find('.mcl-step-action.preview').off('click').on('click', (e) => {
                e.stopPropagation();
                // Preview should start from the specific step clicked, not always from 0
                const stepIndex = parseInt($(e.currentTarget).data('step-index'));
                this.startPreviewFromStep(stepIndex); 
            });
            stepsList.find('.mcl-step-action.delete').off('click').on('click', (e) => {
                e.stopPropagation();
                this.deleteStep(parseInt($(e.currentTarget).data('step-index')));
            });
        },

        initializeStepsSortable() {
            if (!this.isCreatorMode || typeof Sortable === 'undefined') return;
            const stepsListEl = document.getElementById('mcl-steps-list');
            if (!stepsListEl) return;
            if (this.stepsSortableInstance) this.stepsSortableInstance.destroy();
            this.stepsSortableInstance = new Sortable(stepsListEl, {
                handle: '.mcl-step-drag-handle',
                animation: 150,
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                onEnd: (evt) => this.handleStepsReorder()
            });
        },

        handleStepsReorder() {
            $('#mcl-steps-list .mcl-step-number').each((index, element) => $(element).text(index + 1));
            const stepItems = $('#mcl-steps-list .mcl-step-item');
            const newOrder = [];
            stepItems.each(function() {
                newOrder.push(parseInt($(this).data('step-index')));
            });
            if (newOrder.length !== this.tourSteps.length) {
                this.renderStepsList(); return;
            }
            for (let i = 0; i < newOrder.length; i++) {
                if (newOrder[i] < 0 || newOrder[i] >= this.tourSteps.length) {
                    this.renderStepsList(); return;
                }
            }
            stepItems.each((index, element) => {
                $(element).data('step-index', index).attr('data-step-index', index);
                $(element).find('.mcl-step-action').data('step-index', index).attr('data-step-index', index);
            });
            this.applyStepsReorder(newOrder);
            this.saveStepsOrderToServer(newOrder);
        },

        applyStepsReorder(newOrder) {
            const reorderedSteps = [];
            for (let i = 0; i < newOrder.length; i++) {
                reorderedSteps.push(this.tourSteps[newOrder[i]]);
            }
            this.tourSteps = reorderedSteps;
        },

        saveStepsOrderToServer(newOrder) {
            if (this.currentTourId <= 0) return;
            $.post(mclTourCreatorData.ajax_url, {
                action: 'mcl_reorder_tour_steps',
                tour_id: this.currentTourId,
                step_order: newOrder,
                nonce: mclTourCreatorData.nonce
            }, (response) => {
                if (!response.success) {
                    this.showErrorToast('Failed to save step order. Please try again.');
                    this.loadTourData(this.currentTourId);
                }
            }).fail(() => {
                this.showErrorToast('Failed to save step order. Please try again.');
                this.loadTourData(this.currentTourId);
            });
        },
        
        reorderSteps(oldIndex, newIndex) { // Deprecated, kept for safety but should not be called
            console.warn('reorderSteps called, use handleStepsReorder instead');
            this.handleStepsReorder();
        },

        loadChecklists() {
            $.post(mclTourCreatorData.ajax_url, {
                action: 'mcl_get_checklists_for_tour',
                nonce: mclTourCreatorData.nonce
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
            const self = this; // Explicitly capture TourCreator's 'this'
            console.log('Loading tour data for tour ID:', tourId);
            $.ajax({
                url: mclTourCreatorData.ajax_url,
                method: 'POST',
                data: {
                    action: 'mcl_get_tour_data',
                    tour_id: tourId,
                    nonce: mclTourCreatorData.nonce
                },
                success: (response) => {
                    if (response.success) {
                        console.log('Tour data loaded:', response.data);
                        self.tourSteps = response.data.steps || [];
                        self.tourSettings = response.data.settings || {};
                        // Set tour title for saving if it exists in response data
                        if (response.data.title) {
                            $('#mcl-tour-title').val(response.data.title);
                        }
                        self.updateStepsCounter();
                        self.renderStepsList();
                        if (typeof callback === 'function') {
                            callback.call(self); // Use the captured 'self' context
                        }
                    } else {
                        console.error('Failed to load tour data:', response.data);
                        self.showErrorToast(mclTourCreatorData.i18n.error || 'Error loading tour data.');
                        if (typeof callback === 'function') {
                            callback.call(self); // Use the captured 'self' context
                        }
                    }
                },
                error: (xhr, status, error) => {
                    console.error('AJAX error loading tour data:', status, error);
                    self.showErrorToast(mclTourCreatorData.i18n.error || 'AJAX error loading tour data.');
                    if (typeof callback === 'function') {
                        callback.call(self); // Use the captured 'self' context
                    }
                }
            });
        },

        saveTour() {
            const tourTitle = $('#mcl-tour-title').val().trim();
            if (!tourTitle && this.tourSteps.length > 0) { // Only require title if there are steps
                this.showErrorToast(mclTourCreatorData.i18n.titleRequired || 'Tour title is required to save.');
                // Optionally, prompt user for title or open settings here
                return;
            }

            console.log('Saving tour...', { id: this.currentTourId, title: tourTitle, steps: this.tourSteps, settings: this.tourSettings });
            
            $.ajax({
                url: mclTourCreatorData.ajax_url,
                method: 'POST',
                data: {
                    action: 'mcl_save_tour',
                    tour_id: this.currentTourId,
                    title: tourTitle, // Send the title from the hidden input
                    steps: JSON.stringify(this.tourSteps),
                    settings: JSON.stringify(this.tourSettings),
                    nonce: mclTourCreatorData.nonce
                },
                success: (response) => {
                    if (response.success) {
                        this.currentTourId = response.data.tour_id; // Update tour ID if new
                        console.log('Tour saved successfully. New Tour ID:', this.currentTourId);
                        this.showSuccessToast(mclTourCreatorData.i18n.tourSaved || 'Tour saved!');
                        // Update URL if it was a new tour
                        if (!window.location.search.includes('tour_id=') && this.currentTourId) {
                            const newUrl = new URL(window.location.href);
                            newUrl.searchParams.set('tour_id', this.currentTourId);
                            window.history.replaceState({}, '', newUrl.href);
                        }
                    } else {
                        console.error('Failed to save tour:', response.data);
                        this.showErrorToast(mclTourCreatorData.i18n.error || 'Error saving tour.');
                    }
                },
                error: (xhr, status, error) => {
                    console.error('AJAX error saving tour:', status, error);
                    this.showErrorToast(mclTourCreatorData.i18n.error || 'AJAX error saving tour.');
                }
            });
        },

        async exitCreator() {
            const confirmed = await this.showConfirmationModal(
                'Are you sure you want to exit? Any unsaved changes will be lost.',
                'Exit Creator',
                'Cancel'
            );
            if (confirmed) {
                // Clean up tour mode cookie
                document.cookie = 'mcl_tour_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                
                // Redirect to the main tours list page
                // Ensure to get the admin URL correctly for redirection
                const adminToursUrl = mclTourCreatorData.dashboard_url ? 
                                      new URL('admin.php?page=mcl_tours', mclTourCreatorData.dashboard_url.replace('/index.php', '') + '/').href :
                                      '/wp-admin/admin.php?page=mcl_tours'; // Fallback
                window.location.href = adminToursUrl;
            }
            if (this.currentDriverInstance) {
                try { this.currentDriverInstance.destroy(); } catch(e) { /* ignore */ }
                this.currentDriverInstance = null;
            }
            const settings = this.tourSettings || {};
            const steps = this.tourSteps.map((step, index) => ({
                element: step.element,
                popover: {
                    title: step.title,
                    description: step.content,
                    side: step.position || 'bottom',
                    showButtons: step.show_buttons !== false ? (settings.default_buttons || ['next', 'previous', 'close']) : ['close']
                }
            }));

            const driverFunction = this.getDriverFunction();
            if (!driverFunction) {
                console.error('Driver.js is not available for tour preview.');
                this.showErrorToast('Driver.js not found. Preview unavailable.');
                return;
            }

            const driverConfig = {
                animate: settings.animate === true,
                showProgress: settings.show_progress === true,
                progressText: (settings.progress_text || '{{current}} of {{total}}').replace('{{current}}', 1).replace('{{total}}', steps.length),
                allowClose: settings.allow_close !== false,
                doneBtnText: settings.done_btn_text || mclTourCreatorData.i18n.done || 'Done',
                nextBtnText: settings.next_btn_text || mclTourCreatorData.i18n.next || 'Next',
                prevBtnText: settings.prev_btn_text || mclTourCreatorData.i18n.prev || 'Previous',
                overlayColor: settings.overlay_color || 'rgba(0, 0, 0, 0.75)',
                popoverClass: settings.popover_class || '',
                stagePadding: settings.padding || 4,
                smoothScroll: settings.smooth_scroll !== false,
                steps: steps,
                onHighlighted: (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex(); // driver.js is 0-indexed
                    const currentGlobalIndex = currentDriverStep; // For preview, driver steps are global steps
                    this.updateTourProgress(currentGlobalIndex + 1, steps.length, settings);
                    this.updateTourButtons(currentGlobalIndex, steps.length, 0, settings); // fromStepIndex is 0 for preview
                    this.handleStepChecklistIntegration(currentGlobalIndex, this.tourSteps, 'forward'); // Use original tourSteps for checklist data
                },
                onNextClick: (element, step, options) => {
                    driver.moveNext();
                },
                onPrevClick: (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex();
                    const currentGlobalIndex = currentDriverStep; // For preview
                    this.handleStepChecklistIntegration(currentGlobalIndex, this.tourSteps, 'backward');
                    driver.movePrevious();
                },
                onDestroyed: () => {
                    this.currentDriverInstance = null;
                    // Optionally remove preview query params
                    const url = new URL(window.location.href);
                    url.searchParams.delete('mcl_preview_step');
                    window.history.replaceState({}, '', url.toString());
                }
            };

            if (settings.confirm_exit === true && settings.allow_close !== false) {
                driverConfig.onDestroyStarted = (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex();
                    const currentGlobalIndex = currentDriverStep;
                    const isLastGlobalStepOverall = currentGlobalIndex === steps.length - 1;
                    if (isLastGlobalStepOverall) { return true; }
                    this.handleTourExitConfirmation(settings.exit_message || 'Are you sure you want to exit the tour?');
                    return false; // Prevent immediate destroy
                };
            } else if (settings.allow_close === false) {
                driverConfig.allowClose = false;
                driverConfig.onDestroyStarted = (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex();
                    const currentGlobalIndex = currentDriverStep;
                    const isLastGlobalStepOverall = currentGlobalIndex === steps.length - 1;
                    if (isLastGlobalStepOverall) { return true; }
                    this.handleTourExitMessage(settings.exit_message || 'You must complete the tour before you can exit.');
                    return false; // Prevent immediate destroy
                };
            }

            if (settings.overlay_color && settings.overlay_opacity !== undefined) {
                const color = settings.overlay_color; const opacity = settings.overlay_opacity;
                if (color.startsWith('#')) {
                    const r = parseInt(color.slice(1,3),16); const g = parseInt(color.slice(3,5),16); const b = parseInt(color.slice(5,7),16);
                    driverConfig.overlayColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                } else driverConfig.overlayColor = color;
            }

            const driver = driverFunction(driverConfig);
            this.currentDriverInstance = driver;

            if (fromStepIndex >= 0 && fromStepIndex < steps.length) {
                driver.drive(fromStepIndex);
            } else {
                driver.drive();
            }
            setTimeout(() => this.customizeDriverCloseButton(settings), 100);
            setTimeout(() => {
                this.updateTourProgress( (fromStepIndex || 0) + 1, steps.length, settings);
                this.updateTourButtons(fromStepIndex || 0, steps.length, 0, settings);
            }, 50);
        },

        getCurrentGlobalStepIndex(driverStepIndex, currentPageUrl, fromStepIndex, tourSteps = null) {
            const steps = tourSteps || this.tourSteps;
            let currentPageStepCount = 0;
            for (let i = fromStepIndex; i < steps.length; i++) {
                const stepPageUrl = steps[i].page_url || currentPageUrl;
                if (stepPageUrl === currentPageUrl) {
                    if (currentPageStepCount === driverStepIndex) return i;
                    currentPageStepCount++;
                }
            }
            return fromStepIndex + driverStepIndex;
        },

        isLastStepOnCurrentPage(stepIndex, currentPageUrl) {
            for (let i = stepIndex + 1; i < this.tourSteps.length; i++) {
                if ((this.tourSteps[i].page_url || currentPageUrl) === currentPageUrl) return false;
            }
            return true;
        },

        getDriverFunction() {
            if (typeof window.driver?.js?.driver === 'function') return window.driver.js.driver;
            if (typeof window.driver?.driver === 'function') return window.driver.driver;
            if (typeof window.driver === 'function') return window.driver;
            return null;
        },

        updateTourProgress(currentStep, totalSteps, settings = {}) {
            const progressTemplate = settings.progress_text || '{{current}} of {{total}}';
            const correctText = progressTemplate.replace('{{current}}', currentStep).replace('{{total}}', totalSteps);
            const updateElement = () => {
                const progressElement = document.querySelector('.driver-popover-progress-text');
                if (progressElement) {
                    progressElement.textContent = correctText;
                    if (!progressElement._mclObserver) {
                        const observer = new MutationObserver(() => { if (progressElement.textContent !== correctText) progressElement.textContent = correctText; });
                        observer.observe(progressElement, { childList: true, subtree: true, characterData: true });
                        progressElement._mclObserver = observer;
                        setTimeout(() => { if (progressElement._mclObserver) { progressElement._mclObserver.disconnect(); delete progressElement._mclObserver; }}, 1000);
                    }
                    return true;
                } return false;
            };
            updateElement(); setTimeout(updateElement, 10); setTimeout(updateElement, 25); setTimeout(updateElement, 100);
        },

        updateTourButtons(currentGlobalIndex, totalSteps, fromStepIndex, settings = {}) {
            const prevButton = document.querySelector('.driver-popover-prev-btn');
            const nextButton = document.querySelector('.driver-popover-next-btn');
            const closeButton = document.querySelector('.driver-popover-close-btn');

            if (prevButton) {
                const isFirstGlobalStep = currentGlobalIndex === 0;
                if (!isFirstGlobalStep) {
                    prevButton.disabled = false; 
                    prevButton.style.opacity = '1'; 
                    prevButton.style.pointerEvents = 'auto'; 
                    prevButton.removeAttribute('disabled'); 
                    prevButton.classList.remove('driver-popover-prev-btn--disabled');
                    
                    // Check if previous step is on a different page and update button text accordingly
                    const prevStepIndex = currentGlobalIndex - 1;
                    if (prevStepIndex >= 0) {
                        const currentPageUrl = this.getCurrentPageUrl();
                        const prevStep = this.tourSteps[prevStepIndex];
                        const prevStepPageUrl = prevStep.page_url || currentPageUrl;
                        
                        if (prevStepPageUrl !== currentPageUrl) {
                            prevButton.textContent = 'Go Back';
                        } else {
                            prevButton.textContent = settings.prev_btn_text || 'Previous';
                        }
                    } else {
                        prevButton.textContent = settings.prev_btn_text || 'Previous';
                    }
                } else {
                    prevButton.disabled = true; 
                    prevButton.style.opacity = '0.5'; 
                    prevButton.style.pointerEvents = 'none'; 
                    prevButton.setAttribute('disabled', 'disabled'); 
                    prevButton.classList.add('driver-popover-prev-btn--disabled');
                    prevButton.textContent = settings.prev_btn_text || 'Previous';
                }
            }
            if (nextButton) {
                const isLastGlobalStep = currentGlobalIndex === totalSteps - 1;
                if (!isLastGlobalStep) {
                    nextButton.disabled = false; nextButton.style.opacity = '1'; nextButton.style.pointerEvents = 'auto'; nextButton.removeAttribute('disabled');
                    const nextStepIndex = currentGlobalIndex + 1;
                    if (nextStepIndex < this.tourSteps.length) {
                        const currentPageUrl = this.getCurrentPageUrl();
                        const nextStep = this.tourSteps[nextStepIndex];
                        const nextStepPageUrl = nextStep.page_url || currentPageUrl;
                        nextButton.textContent = nextStepPageUrl !== currentPageUrl ? 'Continue' : (settings.next_btn_text || 'Next');
                    } else nextButton.textContent = settings.next_btn_text || 'Next';
                } else {
                    nextButton.textContent = settings.done_btn_text || 'Done';
                    nextButton.disabled = false; nextButton.style.opacity = '1'; nextButton.style.pointerEvents = 'auto'; nextButton.removeAttribute('disabled');
                }
            }
            if (closeButton) { // Close button text handled by customizeDriverCloseButton
                closeButton.disabled = false; closeButton.style.opacity = '1'; closeButton.style.pointerEvents = 'auto'; closeButton.removeAttribute('disabled');
            }
        },

        isModalOpen() {
            return $('#mcl-step-editor-modal').hasClass('active') || $('#mcl-confirmation-modal').hasClass('active');
        },

        showToast(message, type = 'info', duration = 5000) {
            const container = document.getElementById('mcl-toast-container');
            if (!container) return;
            const toast = document.createElement('div');
            toast.className = `mcl-toast mcl-toast-${type}`;
            const icons = {
                success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`,
                error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`,
                warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" /></svg>`,
                info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
            };
            toast.innerHTML = `<div class="mcl-toast-icon">${icons[type]||icons.info}</div><div class="mcl-toast-message">${message}</div><button class="mcl-toast-close" aria-label="Close"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>`;
            toast.querySelector('.mcl-toast-close').addEventListener('click', () => this.hideToast(toast));
            container.appendChild(toast);
            if (duration > 0) setTimeout(() => this.hideToast(toast), duration);
            return toast;
        },

        hideToast(toast) {
            if (!toast || !toast.parentNode) return;
            toast.classList.add('mcl-toast-hiding');
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        },

        showSuccessToast(message, duration = 4000) { return this.showToast(message, 'success', duration); },
        showErrorToast(message, duration = 6000) { return this.showToast(message, 'error', duration); },
        showWarningToast(message, duration = 5000) { return this.showToast(message, 'warning', duration); },
        showInfoToast(message, duration = 4000) { return this.showToast(message, 'info', duration); },

        showConfirmationModal(title, confirmText = 'Yes, I\'m sure', cancelText = 'No, cancel', confirmClass = 'mcl-button-danger') {
            return new Promise((resolve) => {
                const modal = document.getElementById('mcl-confirmation-modal');
                const titleEl = document.getElementById('mcl-confirmation-modal-title');
                const confirmBtn = document.getElementById('mcl-confirmation-modal-confirm');
                const cancelBtn = document.getElementById('mcl-confirmation-modal-cancel');
                const closeBtn = document.getElementById('mcl-confirmation-modal-close');
                if (!modal || !titleEl || !confirmBtn || !cancelBtn) {
                    resolve(confirm(title)); return;
                }
                titleEl.textContent = title; confirmBtn.textContent = confirmText;
                if (cancelText && cancelText.trim()) {
                    cancelBtn.textContent = cancelText; cancelBtn.style.display = ''; closeBtn.style.display = '';
                } else {
                    cancelBtn.style.display = 'none'; closeBtn.style.display = 'none';
                }
                confirmBtn.className = `mcl-button ${confirmClass}`;
                modal.classList.add('active');
                setTimeout(() => confirmBtn.focus(), 100);
                const handleConfirm = () => { this.hideConfirmationModal(); cleanup(); resolve(true); };
                const handleCancel = () => { this.hideConfirmationModal(); cleanup(); resolve(false); };
                const handleEscape = (e) => { if (e.key === 'Escape' && cancelText && cancelText.trim()) handleCancel(); };
                const cleanup = () => {
                    confirmBtn.removeEventListener('click', handleConfirm);
                    cancelBtn.removeEventListener('click', handleCancel);
                    closeBtn.removeEventListener('click', handleCancel);
                    document.removeEventListener('keydown', handleEscape);
                    modal.removeEventListener('click', handleBackdropClick);
                };
                const handleBackdropClick = (e) => { if (e.target === modal && cancelText && cancelText.trim()) handleCancel(); };
                confirmBtn.addEventListener('click', handleConfirm);
                if (cancelText && cancelText.trim()) {
                    cancelBtn.addEventListener('click', handleCancel);
                    closeBtn.addEventListener('click', handleCancel);
                    modal.addEventListener('click', handleBackdropClick);
                }
                document.addEventListener('keydown', handleEscape);
            });
        },

        hideConfirmationModal() {
            const modal = document.getElementById('mcl-confirmation-modal');
            if (!modal) return;
            modal.classList.add('mcl-modal-hiding');
            setTimeout(() => modal.classList.remove('active', 'mcl-modal-hiding'), 200);
        },

        checkChecklistItem(checklistId, itemId) { // Used by preview
            if (!checklistId || !itemId) return;
            $.post(mclTourCreatorData.ajax_url, {
                action: 'mcl_tour_step_check_item', 
                checklist_id: checklistId, 
                item_id: itemId, 
                checked: true, 
                nonce: mclTourCreatorData.nonce
            });
        },

        uncheckChecklistItem(checklistId, itemId) { // Used by preview
            if (!checklistId || !itemId) return;
            $.post(mclTourCreatorData.ajax_url, {
                action: 'mcl_tour_step_check_item', 
                checklist_id: checklistId, 
                item_id: itemId, 
                checked: false, 
                nonce: mclTourCreatorData.nonce
            });
        },

        handleStepChecklistIntegration(currentStepIndex, tourSteps, direction = 'forward') { // Used by preview
            if (!tourSteps || currentStepIndex < 0 || currentStepIndex >= tourSteps.length) return;
            const currentStep = tourSteps[currentStepIndex];
            if (currentStep && currentStep.checklist_id && currentStep.checklist_item_id) {
                if (direction === 'forward') this.checkChecklistItem(currentStep.checklist_id, currentStep.checklist_item_id);
                else this.uncheckChecklistItem(currentStep.checklist_id, currentStep.checklist_item_id);
            }
            if (direction === 'backward' && currentStepIndex + 1 < tourSteps.length) {
                const nextStep = tourSteps[currentStepIndex + 1];
                if (nextStep && nextStep.checklist_id && nextStep.checklist_item_id) {
                    this.uncheckChecklistItem(nextStep.checklist_id, nextStep.checklist_item_id);
                }
            }
        },
        
        async handleTourExitConfirmation(confirmMessage) { // Used by preview
            const confirmed = await this.showConfirmationModal(confirmMessage, 'Yes, exit tour', 'No, continue tour', 'mcl-button-danger');
            if (confirmed && this.currentDriverInstance) {
                try { this.currentDriverInstance.destroy(); this.currentDriverInstance = null; } catch (error) { this.currentDriverInstance = null; }
            }
        },

        async handleTourExitMessage(message) { // Used by preview
            await this.showConfirmationModal(message, 'OK', '', 'mcl-button-primary');
        },

        customizeDriverCloseButton(settings) { // Used by preview
            const closeButton = document.querySelector('.driver-popover-close-btn');
            if (closeButton) {
                closeButton.innerHTML = '×';
                closeButton.style.fontSize = '20px'; closeButton.style.fontWeight = 'bold'; closeButton.style.width = '24px';
                closeButton.style.height = '24px'; closeButton.style.display = 'flex'; closeButton.style.alignItems = 'center';
                closeButton.style.justifyContent = 'center'; closeButton.style.cursor = 'pointer'; closeButton.style.lineHeight = '1';
                const accessibilityText = settings.close_btn_text || 'Close tour';
                closeButton.setAttribute('title', accessibilityText); closeButton.setAttribute('aria-label', accessibilityText);
            }
        },

        async loadCreatorUIFallback() {
            // Fallback method to load creator UI via AJAX if not rendered by PHP
            if (document.getElementById('mcl-tour-creator')) {
                return Promise.resolve(); // UI already exists
            }

            try {
                const response = await fetch(mclTourCreatorData.ajax_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'mcl_get_tour_creator_ui',
                        nonce: mclTourCreatorData.nonce,
                        mcl_tour_mode: '1',
                        tour_id: mclTourCreatorData.tour_id || ''
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const html = await response.text();
                
                if (html && html.trim() && !document.getElementById('mcl-tour-creator')) {
                    document.body.insertAdjacentHTML('beforeend', html);
                    console.log('MCL Tour Creator: UI loaded successfully via AJAX fallback.');
                    return Promise.resolve();
                } else {
                    throw new Error('Empty or invalid response from server');
                }
            } catch (error) {
                console.error('MCL Tour Creator: AJAX fallback failed:', error);
                return Promise.reject(error);
            }
        },

        propagateTourModeToIframes() {
            // Try to inject tour mode parameters into pagebuilder iframes when they load
            const self = this;
            
            // Monitor for new iframes being added to the page
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'IFRAME' && !node.hasAttribute('data-mcl-processed')) {
                            self.injectTourModeIntoIframe(node);
                        }
                        // Also check for iframes within added elements
                        if (node.nodeType === Node.ELEMENT_NODE && node.querySelectorAll) {
                            const iframes = node.querySelectorAll('iframe:not([data-mcl-processed])');
                            iframes.forEach((iframe) => self.injectTourModeIntoIframe(iframe));
                        }
                    });
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Also process existing iframes that haven't been processed yet
            const existingIframes = document.querySelectorAll('iframe:not([data-mcl-processed])');
            existingIframes.forEach((iframe) => this.injectTourModeIntoIframe(iframe));
            
            // Stop observing after 30 seconds to prevent memory leaks
            setTimeout(() => observer.disconnect(), 30000);
        },

        injectTourModeIntoIframe(iframe) {
            if (!iframe.src || iframe.src === 'about:blank') {
                return;
            }
            
            try {
                const url = new URL(iframe.src);
                
                // Check if this looks like a pagebuilder iframe
                const isPagebuilderIframe = 
                    url.searchParams.has('elementor-preview') ||
                    url.searchParams.has('bricks') ||
                    url.searchParams.has('et_fb') ||
                    url.searchParams.has('fl_builder') ||
                    url.pathname.includes('preview') ||
                    iframe.id.includes('preview') ||
                    iframe.className.includes('preview');
                
                // Don't inject if already has tour parameters or force assets parameter
                if (isPagebuilderIframe && 
                    !url.searchParams.has('mcl_force_tour_assets') && 
                    !url.searchParams.has('mcl_tour_mode') &&
                    !url.searchParams.has('tour_id')) {
                    
                    console.log('MCL Tour Creator: Injecting tour mode into pagebuilder iframe:', iframe.src);
                    
                    // Only add minimal parameters needed for detection
                    url.searchParams.set('mcl_force_tour_assets', '1');
                    if (this.currentTourId) {
                        url.searchParams.set('tour_id', this.currentTourId);
                    }
                    
                    // Mark iframe as processed to avoid re-processing
                    iframe.setAttribute('data-mcl-processed', 'true');
                    
                    // Update iframe src
                    iframe.src = url.toString();
                } else if (iframe.hasAttribute('data-mcl-processed')) {
                    // Already processed, skip
                    return;
                }
            } catch (error) {
                // URL parsing failed, skip this iframe
                console.log('MCL Tour Creator: Could not parse iframe URL:', iframe.src, error);
            }
        }
    };

    // Initialize when document is ready and in creator mode
    $(document).ready(() => {
        if (typeof mclTourCreatorData !== 'undefined' && mclTourCreatorData.is_tour_mode) {
            // Prevent duplicate initialization across iframes and contexts
            if (window.mclTourCreatorInitialized || window.top.mclTourCreatorInitialized) {
                console.log('MCL Tour Creator: Already initialized (local or parent), skipping.');
                return;
            }
            
            // Also check if driver.js is already loaded multiple times
            const driverScripts = document.querySelectorAll('script[src*="driver.js"]');
            if (driverScripts.length > 1) {
                console.log('MCL Tour Creator: Multiple driver.js scripts detected, potential duplicate loading.');
            }

            // Check iframe context using both client-side and server-side detection
            const isInIframe = window.self !== window.top;
            const serverDetectedIframe = mclTourCreatorData.is_likely_iframe || false;
            const hasCreatorUI = document.getElementById('mcl-tour-creator') !== null;
            
            console.log('MCL Tour Creator: Iframe detection:', {
                clientSide: isInIframe,
                serverSide: serverDetectedIframe,
                hasUI: hasCreatorUI
            });
            
            if ((isInIframe || serverDetectedIframe) && !hasCreatorUI) {
                // We're in iframe but no creator UI - check if parent has it
                try {
                    if (window.top.document && window.top.document.getElementById('mcl-tour-creator')) {
                        console.log('MCL Tour Creator: Creator UI exists in parent window, using that.');
                        // Set reference to parent's tour creator if available
                        if (window.top.mclTourCreator) {
                            window.mclTourCreator = window.top.mclTourCreator;
                        }
                        return;
                    }
                } catch (e) {
                    // Cross-origin iframe, can't access parent
                    console.log('MCL Tour Creator: Cross-origin iframe detected, initializing local instance.');
                }
                
                // If we're definitely in an iframe and no UI exists anywhere,
                // try to initialize anyway (pagebuilder preview might need local functionality)
                console.log('MCL Tour Creator: In iframe without parent UI, proceeding with initialization.');
            }
            
            if (!hasCreatorUI && !isInIframe) {
                // We're in top window but no UI - try to load it
                console.log('MCL Tour Creator: No creator UI found in top window, attempting to load via AJAX.');
                TourCreator.loadCreatorUIFallback().then(() => {
                    // Mark as initialized to prevent duplicate init
                    window.mclTourCreatorInitialized = true;
                    TourCreator.init();
                }).catch((error) => {
                    console.error('MCL Tour Creator: Failed to load UI fallback:', error);
                    // Try to initialize anyway in case some functionality can work without UI
                    window.mclTourCreatorInitialized = true;
                    TourCreator.init();
                });
                return;
            }

            // Mark as initialized to prevent duplicate init across contexts
            window.mclTourCreatorInitialized = true;
            if (window.top !== window.self) {
                try {
                    window.top.mclTourCreatorInitialized = true;
                } catch (e) {
                    // Cross-origin iframe, can't access parent
                }
            }
            
            TourCreator.init();
            window.mclTourCreator = TourCreator; // Expose to global scope for easier debugging
        } else {
            console.log('MCL Tour Creator: Not in creator mode or mclTourCreatorData is missing.');
        }
    });

})(jQuery); 