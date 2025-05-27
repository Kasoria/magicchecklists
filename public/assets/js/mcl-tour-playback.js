/**
 * Tour Playback JavaScript
 * Handles tour playback for end-users using driver.js
 */

(function($) {
    'use strict';

    const TourPlayback = {
        currentDriverInstance: null,

        init() {
            // This script is only loaded when not in creator mode.
            this.initTourPlayback();
        },

        initTourPlayback() {
            if (mclTour.tours && mclTour.tours.length > 0) {
                mclTour.tours.forEach(tour => {
                    if (this.shouldTriggerTour(tour)) {
                        if (tour.autostart || tour.continue_from_step !== undefined) {
                            setTimeout(() => {
                                this.startTour(tour);
                            }, 500);
                        }
                    }
                });
            }
        },

        shouldTriggerTour(tour) {
            if (tour.trigger_type === 'selector' && tour.trigger_value) {
                const element = document.querySelector(tour.trigger_value);
                if (!element) {
                    return false;
                }
            }
            return true; // Other trigger types (page, first_login, any_page) are handled by server-side logic before enqueueing.
        },
        
        getCurrentPageUrl() { // Utility function also needed for playback
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

        startTour(tourData) {
            if (!tourData.steps || tourData.steps.length === 0) {
                return;
            }

            const driverFunction = this.getDriverFunction();
            if (!driverFunction) {
                console.error('Driver.js is not available for tour playback.');
                return;
            }

            const currentPageUrl = this.getCurrentPageUrl();
            let currentPageSteps = [];
            let nextPageStep = null;
            let prevPageStep = null; // To store the actual previous step object if on a different page
            let startStepIndex = tourData.continue_from_step || 0;

            if (tourData.continue_from_step !== undefined && startStepIndex < tourData.steps.length) {
                const targetStep = tourData.steps[startStepIndex];
                const targetStepPageUrl = targetStep.page_url || currentPageUrl;
                if (targetStepPageUrl !== currentPageUrl) {
                    this.navigateToTourStep(tourData.id, { ...targetStep, originalIndex: startStepIndex });
                    return;
                }
            }

            for (let i = 0; i < tourData.steps.length; i++) {
                const step = tourData.steps[i];
                const stepPageUrl = step.page_url || currentPageUrl;
                if (stepPageUrl === currentPageUrl) {
                    currentPageSteps.push({ ...step, originalIndex: i });
                }
                if (i > startStepIndex && !nextPageStep && stepPageUrl !== currentPageUrl) {
                    nextPageStep = { ...step, originalIndex: i };
                }
                // Find the *last* step on a *different, previous* page
                if (i < startStepIndex && stepPageUrl !== currentPageUrl) {
                    prevPageStep = { ...step, originalIndex: i }; 
                }
            }
            
            if (tourData.continue_from_step !== undefined) {
                currentPageSteps = currentPageSteps.filter(step => step.originalIndex >= startStepIndex);
            }

            if (currentPageSteps.length === 0) {
                if (nextPageStep) {
                    this.navigateToTourStep(tourData.id, nextPageStep);
                    return;
                } else if (tourData.continue_from_step !== undefined){
                     // No steps on this page to continue from, and no next page step found.
                    // This can happen if the tour structure is illogical or user ended up on an unexpected page.
                    // We should probably mark the tour as seen or clear continuation params to avoid loops.
                    this.markTourCompleted(tourData.id); // Mark as complete to prevent loops
                    console.log('Tour continuation stopped: No valid steps found on current page and no next page.');
                    return;
                }
                // If not continuing and no steps on this page, it means this tour shouldn't have started here.
                // This case should ideally be caught by server-side logic or shouldTriggerTour.
                return; 
            }

            const settings = tourData.settings || {};
            const steps = currentPageSteps.map((step, index) => {
                const isLastStepOnPage = index === currentPageSteps.length - 1;
                let description = step.content;
                const stepButtons = step.show_buttons !== false ? (settings.default_buttons || ['next', 'previous', 'close']) : ['close'];
                if (isLastStepOnPage && nextPageStep) {
                    description += '<br><br><em>Click "Continue" to go to the next page...</em>';
                    if (!stepButtons.includes('next')) stepButtons.push('next');
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

            const initialGlobalPosition = startStepIndex + 1;
            const driverConfig = {
                animate: settings.animate === true,
                showProgress: settings.show_progress === true,
                progressText: (settings.progress_text || '{{current}} of {{total}}').replace('{{current}}', initialGlobalPosition).replace('{{total}}', tourData.steps.length),
                allowClose: settings.allow_close !== false,
                doneBtnText: nextPageStep ? 'Continue' : (settings.done_btn_text || mclTour.i18n.done || 'Done'),
                nextBtnText: settings.next_btn_text || mclTour.i18n.next || 'Next',
                prevBtnText: settings.prev_btn_text || mclTour.i18n.prev || 'Previous',
                overlayColor: settings.overlay_color || 'rgba(0, 0, 0, 0.75)',
                popoverClass: settings.popover_class || '',
                stagePadding: settings.padding || 4,
                smoothScroll: settings.smooth_scroll !== false,
                steps: steps,
                onNextClick: (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex();
                    const isLastDriverStep = currentDriverStep === steps.length - 1;
                    if (isLastDriverStep && nextPageStep) {
                        driver.destroy();
                        this.navigateToTourStep(tourData.id, nextPageStep);
                        return;
                    }
                    driver.moveNext();
                },
                onPrevClick: (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex();
                    const isFirstDriverStep = currentDriverStep === 0;
                    const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourData.steps);
                    this.handleStepChecklistIntegration(currentGlobalIndex, tourData.steps, 'backward');

                    if (isFirstDriverStep && startStepIndex > 0) {
                        // Find the *actual* previous global step. It might be on a different page.
                        let actualPrevGlobalStep = null;
                        for (let i = startStepIndex - 1; i >= 0; i--) {
                            if (tourData.steps[i]) {
                                actualPrevGlobalStep = { ...tourData.steps[i], originalIndex: i };
                                break;
                            }
                        }

                        if (actualPrevGlobalStep) {
                            const prevStepPageUrl = actualPrevGlobalStep.page_url || currentPageUrl;
                            driver.destroy();
                            if (prevStepPageUrl !== currentPageUrl) {
                                this.navigateToTourStep(tourData.id, actualPrevGlobalStep);
                            } else {
                                // Previous step is on the same page, restart tour from there
                                const newTourData = { ...tourData, continue_from_step: actualPrevGlobalStep.originalIndex };
                                this.startTour(newTourData);
                            }
                            return;
                        }
                    }
                    if (!isFirstDriverStep) driver.movePrevious();
                },
                onHighlighted: (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex();
                    const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourData.steps);
                    this.updateTourProgress(currentGlobalIndex + 1, tourData.steps.length, settings);
                    this.updateTourButtons(currentGlobalIndex, tourData.steps.length, startStepIndex, settings, nextPageStep !== null, prevPageStep !== null, currentPageUrl, tourData.steps );
                    this.handleStepChecklistIntegration(currentGlobalIndex, tourData.steps, 'forward');
                    setTimeout(() => this.updateTourButtons(currentGlobalIndex, tourData.steps.length, startStepIndex, settings, nextPageStep !== null, prevPageStep !== null, currentPageUrl, tourData.steps), 50);
                },
                onDestroyed: () => {
                    this.currentDriverInstance = null;
                    if (!nextPageStep) { // Only mark complete if this is truly the end of the tour globally
                        this.markTourCompleted(tourData.id);
                    }
                }
            };

            if (settings.confirm_exit === true && settings.allow_close !== false) {
                driverConfig.onDestroyStarted = (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex();
                    const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourData.steps);
                    const isLastGlobalStepOverall = currentGlobalIndex === tourData.steps.length - 1;
                    if (isLastGlobalStepOverall) {
                        setTimeout(() => { if (driver && typeof driver.destroy === 'function') driver.destroy(); }, 0);
                        return true;
                    }
                    this.handleTourExitConfirmation(settings.exit_message || 'Are you sure you want to exit the tour?');
                    return false;
                };
            } else if (settings.allow_close === false) {
                driverConfig.allowClose = false;
                driverConfig.onDestroyStarted = (element, step, options) => {
                    const currentDriverStep = driver.getActiveIndex();
                    const currentGlobalIndex = this.getCurrentGlobalStepIndex(currentDriverStep, currentPageUrl, startStepIndex, tourData.steps);
                    const isLastGlobalStepOverall = currentGlobalIndex === tourData.steps.length - 1;
                    if (isLastGlobalStepOverall) {
                        setTimeout(() => { if (driver && typeof driver.destroy === 'function') driver.destroy(); }, 0);
                        return true;
                    }
                    this.handleTourExitMessage(settings.exit_message || 'You must complete the tour before you can exit.');
                    return false;
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
            driver.drive();
            setTimeout(() => this.customizeDriverCloseButton(settings), 100);
            setTimeout(() => {
                const initialGlobalIndex = tourData.continue_from_step || 0;
                this.updateTourProgress(initialGlobalIndex + 1, tourData.steps.length, settings);
                this.updateTourButtons(initialGlobalIndex, tourData.steps.length, startStepIndex, settings, nextPageStep !== null, prevPageStep !== null, currentPageUrl, tourData.steps);
            }, 50);
        },

        navigateToTourStep(tourId, step) {
            if (!step.page_url) return;
            this.showNavigationLoading(); 
            const url = new URL(step.page_url, window.location.href);
            url.searchParams.set('mcl_continue_tour', tourId);
            url.searchParams.set('mcl_tour_step', step.originalIndex);
            window.location.href = url.toString();
        },
        
        showNavigationLoading() { // Utility function needed for playback navigation
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

        markTourCompleted(tourId) {
            const tour = mclTour.tours.find(t => t.id == tourId);
            const isFirstLoginTour = tour && tour.trigger_type === 'first_login';
            $.post(mclTour.ajax_url, {
                action: 'mcl_mark_tour_complete',
                tour_id: tourId,
                is_first_login: isFirstLoginTour,
                nonce: mclTour.nonce 
            });
        },

        getDriverFunction() {
            if (typeof window.driver?.js?.driver === 'function') return window.driver.js.driver;
            if (typeof window.driver?.driver === 'function') return window.driver.driver;
            if (typeof window.driver === 'function') return window.driver;
            return null;
        },

        getCurrentGlobalStepIndex(driverStepIndex, currentPageUrl, fromStepIndex, tourSteps) {
            let currentPageStepCount = 0;
            for (let i = fromStepIndex; i < tourSteps.length; i++) {
                const stepPageUrl = tourSteps[i].page_url || currentPageUrl;
                if (stepPageUrl === currentPageUrl) {
                    if (currentPageStepCount === driverStepIndex) return i;
                    currentPageStepCount++;
                }
            }
            return fromStepIndex + driverStepIndex; // Fallback
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

        updateTourButtons(currentGlobalIndex, totalSteps, fromStepIndexOnPage, settings = {}, hasNextPage, hasPrevPage, currentPageUrl, allTourSteps) {
            const prevButton = document.querySelector('.driver-popover-prev-btn');
            const nextButton = document.querySelector('.driver-popover-next-btn');
            const closeButton = document.querySelector('.driver-popover-close-btn');

            // Previous Button Logic
            if (prevButton) {
                const isEffectivelyFirstStep = currentGlobalIndex === 0; // Is it the first step of the entire tour?
                if (!isEffectivelyFirstStep) {
                    prevButton.disabled = false; prevButton.style.opacity = '1'; prevButton.style.pointerEvents = 'auto'; prevButton.removeAttribute('disabled'); prevButton.classList.remove('driver-popover-prev-btn--disabled');
                } else {
                    prevButton.disabled = true; prevButton.style.opacity = '0.5'; prevButton.style.pointerEvents = 'none'; prevButton.setAttribute('disabled', 'disabled'); prevButton.classList.add('driver-popover-prev-btn--disabled');
                }
                prevButton.textContent = settings.prev_btn_text || mclTour.i18n.prev || 'Previous';
            }

            // Next/Done Button Logic
            if (nextButton) {
                const isLastGlobalStep = currentGlobalIndex === totalSteps - 1;
                 // Is this the last step on the current page of a multi-page tour?
                const driverInstance = this.currentDriverInstance;
                const isLastStepOnCurrentDriverInstance = driverInstance ? driverInstance.getActiveIndex() === driverInstance.getConfig().steps.length - 1 : false;

                if (isLastGlobalStep) { // Very last step of the entire tour
                    nextButton.textContent = settings.done_btn_text || mclTour.i18n.done || 'Done';
                    nextButton.disabled = false; nextButton.style.opacity = '1'; nextButton.style.pointerEvents = 'auto'; nextButton.removeAttribute('disabled');
                } else if (isLastStepOnCurrentDriverInstance && hasNextPage) { // Last step on this page, but more pages exist
                    nextButton.textContent = 'Continue'; // Or a specific setting if added
                    nextButton.disabled = false; nextButton.style.opacity = '1'; nextButton.style.pointerEvents = 'auto'; nextButton.removeAttribute('disabled');
                } else { // Regular next step within the current page/instance
                    nextButton.textContent = settings.next_btn_text || mclTour.i18n.next || 'Next';
                    nextButton.disabled = false; nextButton.style.opacity = '1'; nextButton.style.pointerEvents = 'auto'; nextButton.removeAttribute('disabled');
                }
            }
            
            if (closeButton) { // Close button text handled by customizeDriverCloseButton
                closeButton.disabled = settings.allow_close === false && currentGlobalIndex < totalSteps -1; // Only disable if allow_close is false AND it's not the last step
                closeButton.style.opacity = closeButton.disabled ? '0.5' : '1';
                closeButton.style.pointerEvents = closeButton.disabled ? 'none' : 'auto';
                if(closeButton.disabled) closeButton.setAttribute('disabled', 'disabled');
                else closeButton.removeAttribute('disabled');
            }
        },

        // Checklist integration methods (can be common or moved if only for playback)
        checkChecklistItem(checklistId, itemId) {
            if (!checklistId || !itemId) return;
            $.post(mclTour.ajax_url, {
                action: 'mcl_tour_step_check_item', checklist_id: checklistId, item_id: itemId, checked: true, nonce: mclTour.nonce
            });
        },

        uncheckChecklistItem(checklistId, itemId) {
            if (!checklistId || !itemId) return;
            $.post(mclTour.ajax_url, {
                action: 'mcl_tour_step_check_item', checklist_id: checklistId, item_id: itemId, checked: false, nonce: mclTour.nonce
            });
        },

        handleStepChecklistIntegration(currentStepIndex, tourSteps, direction = 'forward') {
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
        
        // Confirmation Modal System using Global Modal Component
        showConfirmationModal(title, confirmText = 'Yes, I\'m sure', cancelText = 'No, cancel', confirmClass = 'mcl-button-danger') {
            return new Promise((resolve) => {
                // Check if global modal is available
                if (typeof window.MCLModal !== 'undefined') {
                    // Determine modal type based on button class
                    let modalType = 'warning';
                    if (confirmClass.includes('danger')) {
                        modalType = 'danger';
                    } else if (confirmClass.includes('primary')) {
                        modalType = 'info';
                    }
                    
                    // Use global modal
                    if (cancelText && cancelText.trim()) {
                        // Show confirmation modal with cancel option
                        window.MCLModal.show({
                            title: title,
                            message: '',
                            type: modalType,
                            confirmText: confirmText,
                            cancelText: cancelText,
                            onConfirm: function() {
                                resolve(true);
                            },
                            onCancel: function() {
                                resolve(false);
                            }
                        });
                    } else {
                        // Show alert-style modal (no cancel)
                        window.MCLModal.alert({
                            title: title,
                            message: '',
                            type: modalType,
                            confirmText: confirmText,
                            onConfirm: function() {
                                resolve(true);
                            }
                        });
                    }
                } else {
                    // Fallback to native confirm if global modal is not available
                    console.warn('MCL Tour: Global modal not available, falling back to browser alert');
                    const result = confirm(title);
                    resolve(result);
                }
            });
        },

        hideConfirmationModal() {
            // Global modal handles its own hiding, but we can provide this method for compatibility
            if (typeof window.MCLModal !== 'undefined') {
                window.MCLModal.hide();
            }
        },

        async handleTourExitConfirmation(confirmMessage) {
            const confirmed = await this.showConfirmationModal(confirmMessage, 'Yes, exit tour', 'No, continue tour', 'mcl-button-danger');
            if (confirmed && this.currentDriverInstance) {
                try { this.currentDriverInstance.destroy(); this.currentDriverInstance = null; } catch (error) { this.currentDriverInstance = null; }
            }
        },

        async handleTourExitMessage(message) {
            await this.showConfirmationModal(message, 'OK', '', 'mcl-button-primary');
        },

        customizeDriverCloseButton(settings) {
            const closeButton = document.querySelector('.driver-popover-close-btn');
            if (closeButton) {
                closeButton.innerHTML = '×';
                closeButton.style.fontSize = '20px'; closeButton.style.fontWeight = 'bold'; closeButton.style.width = '24px';
                closeButton.style.height = '24px'; closeButton.style.display = 'flex'; closeButton.style.alignItems = 'center';
                closeButton.style.justifyContent = 'center'; closeButton.style.cursor = 'pointer'; closeButton.style.lineHeight = '1';
                const accessibilityText = settings.close_btn_text || 'Close tour';
                closeButton.setAttribute('title', accessibilityText); closeButton.setAttribute('aria-label', accessibilityText);
            }
        }
    };

    // Initialize when document is ready and NOT in creator mode
    if (typeof mclTour !== 'undefined' && !mclTour.is_tour_mode) {
        $(document).ready(() => {
            // Prevent duplicate initialization across iframes and contexts
            if (window.mclTourPlaybackInitialized || window.top.mclTourPlaybackInitialized) {
                console.log('MCL Tour Playback: Already initialized (local or parent), skipping.');
                return;
            }
            
            // Also check if driver.js is already loaded multiple times
            const driverScripts = document.querySelectorAll('script[src*="driver.js"]');
            if (driverScripts.length > 1) {
                console.log('MCL Tour Playback: Multiple driver.js scripts detected, potential duplicate loading.');
            }

            // Check iframe context for playback
            const isInIframe = window.self !== window.top;
            
            if (isInIframe) {
                console.log('MCL Tour Playback: Running in iframe context');
                // For playback, we usually want each iframe to handle its own tours
                // since they might have different content/steps
            }

            // Mark as initialized across contexts
            window.mclTourPlaybackInitialized = true;
            if (window.top !== window.self) {
                try {
                    window.top.mclTourPlaybackInitialized = true;
                } catch (e) {
                    // Cross-origin iframe, can't access parent
                }
            }
            
            TourPlayback.init();
        });
        // Expose to global scope if needed, though less likely for pure playback
        window.mclTourPlayback = TourPlayback; 
    }

})(jQuery); 