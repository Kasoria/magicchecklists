/**
 * Magic Checklists Global Modal Component
 * Provides a reusable  modal for admin pages
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
         * @param {string} options.type - Modal type ('warning', 'danger', 'info')
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
                                <div class="mcl-global-modal-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" width="48" height="48">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                    </svg>
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
            const icon = modal.querySelector('.mcl-global-modal-icon svg');

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

            // Update icon based on type
            this._updateIcon(icon, settings.type);
        },

        /**
         * Update modal icon based on type
         * @private
         */
        _updateIcon: function(iconElement, type) {
            let iconPath = '';
            
            switch (type) {
                case 'danger':
                    iconPath = 'M10 2L3 7v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5zM10 17H8v-2h2v2zm0-4H8V9h2v4z';
                    iconElement.setAttribute('stroke', '#dc2626');
                    break;
                case 'info':
                    iconPath = 'M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
                    iconElement.setAttribute('stroke', '#3b82f6');
                    break;
                default: // warning
                    iconPath = 'M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
                    iconElement.setAttribute('stroke', '#f59e0b');
            }

            const pathElement = iconElement.querySelector('path');
            if (pathElement) {
                pathElement.setAttribute('d', iconPath);
            }
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