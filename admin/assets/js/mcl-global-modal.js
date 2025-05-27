/**
 * Magic Checklists Global Modal Component
 * Provides a reusable confirmation modal for admin pages
 * AVAILABLE TYPES: 'warning', 'danger', 'info', 'success'
 * AVAILABLE CONTEXTS: 'general', 'validation', 'tour-exit', 'delete'
 * 
 */

(function($) {
    'use strict';

    // Global modal object
    window.MCLModal = {
        /**
         * Show confirmation modal
         * @param {Object} options - Modal configuration
         * @param {string} options.title - Modal title
         * @param {string} options.message - Modal message/content
         * @param {string} options.confirmText - Confirm button text
         * @param {string} options.cancelText - Cancel button text
         * @param {string} options.type - Modal type ('warning', 'danger', 'info', 'success')
         * @param {string} options.context - Modal context ('validation', 'tour-exit', 'delete', 'general')
         * @param {Function} options.onConfirm - Callback when confirmed
         * @param {Function} options.onCancel - Callback when cancelled
         */
        show: function(options) {
            const defaults = {
                title: 'Are you sure?',
                message: 'This action cannot be undone.',
                confirmText: 'Yes, I\'m sure',
                cancelText: 'No, cancel',
                type: 'warning',
                context: 'general',
                onConfirm: function() {},
                onCancel: function() {}
            };

            const settings = Object.assign({}, defaults, options);
            
            // Create modal if it doesn't exist
            if (!document.getElementById('mcl-global-modal')) {
                this._createModal();
            }

            // Update modal content
            this._updateModal(settings);
            
            // Show modal
            this._showModal();
            
            // Store callbacks for event handlers
            this._currentCallbacks = {
                onConfirm: settings.onConfirm,
                onCancel: settings.onCancel
            };
        },

        /**
         * Hide the modal
         */
        hide: function() {
            const modal = document.getElementById('mcl-global-modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.classList.remove('mcl-modal-open');
            }
        },

        /**
         * Check if modal is currently open
         * @returns {boolean}
         */
        isOpen: function() {
            const modal = document.getElementById('mcl-global-modal');
            return modal && modal.style.display === 'flex';
        },

        /**
         * Show alert-style modal (no cancel button)
         * @param {Object} options - Modal configuration
         */
        alert: function(options) {
            const alertOptions = Object.assign({}, options, {
                cancelText: '',
                onConfirm: options.onConfirm || function() {},
                onCancel: function() {} // No cancel for alerts
            });
            this.show(alertOptions);
        },

        /**
         * Create the modal HTML structure
         * @private
         */
        _createModal: function() {
            const modalHTML = `
                <div class="mcl-global-modal" id="mcl-global-modal">
                    <div class="mcl-global-modal-backdrop"></div>
                    <div class="mcl-global-modal-content">
                        <div class="mcl-global-modal-inner">
                            <button type="button" class="mcl-global-modal-close" id="mcl-global-modal-close">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                                    <path fill="currentColor" fill-rule="evenodd" d="M4.28 3.22a.75.75 0 0 0-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06L8 9.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L9.06 8l3.72-3.72a.75.75 0 0 0-1.06-1.06L8 6.94L4.28 3.22Z" clip-rule="evenodd"/>
                                </svg>
                                <span class="sr-only">Close modal</span>
                            </button>
                            <div class="mcl-global-modal-body">
                                <div class="mcl-global-modal-icon" id="mcl-global-modal-icon">
                                    <!-- Icon will be dynamically inserted here -->
                                </div>
                                <h3 class="mcl-global-modal-title" id="mcl-global-modal-title"></h3>
                                <div class="mcl-global-modal-message" id="mcl-global-modal-message"></div>
                                <div class="mcl-global-modal-actions">
                                    <button type="button" class="mcl-button mcl-button-primary" id="mcl-global-modal-confirm"></button>
                                    <button type="button" class="mcl-button mcl-button-secondary" id="mcl-global-modal-cancel"></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Append to body
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Attach event listeners
            this._attachEventListeners();
        },

        /**
         * Update modal content
         * @private
         */
        _updateModal: function(settings) {
            const modal = document.getElementById('mcl-global-modal');
            const title = document.getElementById('mcl-global-modal-title');
            const message = document.getElementById('mcl-global-modal-message');
            const confirmBtn = document.getElementById('mcl-global-modal-confirm');
            const cancelBtn = document.getElementById('mcl-global-modal-cancel');
            const iconContainer = document.getElementById('mcl-global-modal-icon');

            // Update content
            title.textContent = settings.title;
            
            // Handle message - hide if empty
            if (settings.message && settings.message.trim()) {
                message.innerHTML = settings.message;
                message.style.display = 'block';
            } else {
                message.innerHTML = '';
                message.style.display = 'none';
            }
            
            confirmBtn.textContent = settings.confirmText;
            cancelBtn.textContent = settings.cancelText;

            // Update modal type class
            modal.className = 'mcl-global-modal mcl-modal-' + settings.type;

            // Update confirm button class based on type
            confirmBtn.className = 'mcl-button';
            if (settings.type === 'danger') {
                confirmBtn.classList.add('mcl-button-danger');
            } else {
                confirmBtn.classList.add('mcl-button-primary');
            }

            // Hide cancel button if no cancel text
            if (!settings.cancelText) {
                cancelBtn.style.display = 'none';
            } else {
                cancelBtn.style.display = 'inline-flex';
            }

            // Update icon based on type and context
            this._updateIcon(iconContainer, settings.type, settings.context);
        },

        /**
         * Update modal icon based on type and context
         * @private
         */
        _updateIcon: function(iconContainer, type, context) {
            let iconSVG = '';
            
            // Determine icon based on context first, then type
            const iconKey = context + '-' + type;
            
            switch (iconKey) {
                // Validation context
                case 'validation-danger':
                    iconSVG = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 512"><path fill="currentColor" d="M176 432c0 44.112-35.888 80-80 80s-80-35.888-80-80s35.888-80 80-80s80 35.888 80 80zM25.26 25.199l13.6 272C39.499 309.972 50.041 320 62.83 320h66.34c12.789 0 23.331-10.028 23.97-22.801l13.6-272C167.425 11.49 156.496 0 142.77 0H49.23C35.504 0 24.575 11.49 25.26 25.199z"/></svg>`;
                    break;
                    
                // Tour exit context  
                case 'tour-exit-danger':
                case 'tour-exit-warning':
                    iconSVG = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19.002 3h-14c-1.103 0-2 .897-2 2v4h2V5h14v14h-14v-4h-2v4c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.898-2-2-2z"/><path fill="currentColor" d="m11 16l5-4l-5-4v3.001H3v2h8z"/></svg>`;
                    break;
                    
                // Delete context
                case 'delete-danger':
                    iconSVG = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="currentColor" d="M14.28 2a2 2 0 0 1 1.897 1.368L16.72 5H20a1 1 0 1 1 0 2l-.003.071l-.867 12.143A3 3 0 0 1 16.138 22H7.862a3 3 0 0 1-2.992-2.786L4.003 7.07A1.01 1.01 0 0 1 4 7a1 1 0 0 1 0-2h3.28l.543-1.632A2 2 0 0 1 9.721 2h4.558ZM9 10a1 1 0 0 0-.993.883L8 11v6a1 1 0 0 0 1.993.117L10 17v-6a1 1 0 0 0-1-1Zm6 0a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0v-6a1 1 0 0 0-1-1Zm-.72-6H9.72l-.333 1h5.226l-.334-1Z"/></g></svg>`;
                    break;
                    
                // Success context
                case 'general-success':
                case 'validation-success':
                    iconSVG = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
                            <circle cx="24" cy="24" r="22" fill="#22c55e" stroke="#16a34a" stroke-width="2"/>
                            <path d="M14 24l8 8 12-16" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>`;
                    break;
                    
                // Info context
                case 'general-info':
                case 'tour-exit-info':
                    iconSVG = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
                            <circle cx="24" cy="24" r="22" fill="#3b82f6" stroke="#2563eb" stroke-width="2"/>
                            <path d="M24 16h.01M24 22v10" stroke="white" stroke-width="3" stroke-linecap="round"/>
                        </svg>`;
                    break;
                    
                // Default danger
                case 'general-danger':
                default:
                    if (type === 'danger') {
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
                                <path d="M24 4L4 42h40L24 4z" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
                                <path d="M24 16v12M24 32h.01" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
                            </svg>`;
                    } else {
                        // Default warning triangle
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
                                <path d="M24 4L4 42h40L24 4z" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
                                <path d="M24 16v12M24 32h.01" stroke="#b45309" stroke-width="3" stroke-linecap="round"/>
                            </svg>`;
                    }
            }
            
            // Insert the SVG
            iconContainer.innerHTML = iconSVG;
        },

        /**
         * Show the modal
         * @private
         */
        _showModal: function() {
            const modal = document.getElementById('mcl-global-modal');
            modal.style.display = 'flex';
            document.body.classList.add('mcl-modal-open');
            
            // Focus on confirm button for accessibility
            setTimeout(() => {
                const confirmBtn = document.getElementById('mcl-global-modal-confirm');
                if (confirmBtn) {
                    confirmBtn.focus();
                }
            }, 100);
        },

        /**
         * Attach event listeners
         * @private
         */
        _attachEventListeners: function() {
            const modal = document.getElementById('mcl-global-modal');
            const closeBtn = document.getElementById('mcl-global-modal-close');
            const confirmBtn = document.getElementById('mcl-global-modal-confirm');
            const cancelBtn = document.getElementById('mcl-global-modal-cancel');
            const backdrop = modal.querySelector('.mcl-global-modal-backdrop');

            // Close button
            closeBtn.addEventListener('click', () => {
                this.hide();
                if (this._currentCallbacks && this._currentCallbacks.onCancel) {
                    this._currentCallbacks.onCancel();
                }
            });

            // Confirm button
            confirmBtn.addEventListener('click', () => {
                this.hide();
                if (this._currentCallbacks && this._currentCallbacks.onConfirm) {
                    this._currentCallbacks.onConfirm();
                }
            });

            // Cancel button
            cancelBtn.addEventListener('click', () => {
                this.hide();
                if (this._currentCallbacks && this._currentCallbacks.onCancel) {
                    this._currentCallbacks.onCancel();
                }
            });

            // Backdrop click
            backdrop.addEventListener('click', () => {
                this.hide();
                if (this._currentCallbacks && this._currentCallbacks.onCancel) {
                    this._currentCallbacks.onCancel();
                }
            });

            // Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.style.display === 'flex') {
                    this.hide();
                    if (this._currentCallbacks && this._currentCallbacks.onCancel) {
                        this._currentCallbacks.onCancel();
                    }
                }
            });
        }
    };

    // Initialize when DOM is ready
    $(document).ready(function() {
        // Modal is ready to use
    });

})(jQuery); 