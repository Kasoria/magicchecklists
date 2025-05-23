/**
 * MagicChecklists Dashboard Widget JavaScript
 */
(function($) {
    'use strict';

    class MCLDashboardWidget {
        constructor() {
            this.init();
        }

        init() {
            this.bindEvents();
        }

        bindEvents() {
            $(document).on('click', '.mcl-widget-toggle-btn', this.handleToggleClick.bind(this));
            $(document).on('change', '.mcl-widget-checkbox', this.handleCheckboxChange.bind(this));
        }

        handleToggleClick(e) {
            e.preventDefault();
            
            const $button = $(e.currentTarget);
            const checklistId = $button.data('checklist-id');
            const currentState = parseInt($button.data('current-state'));
            const newState = currentState === 1 ? 0 : 1;

            // Prevent multiple clicks
            if ($button.hasClass('loading')) {
                return;
            }

            // Show loading state
            this.setButtonLoading($button, true);

            // Make AJAX request
            $.ajax({
                url: mclDashboardWidget.ajaxurl,
                type: 'POST',
                data: {
                    action: 'mcl_widget_toggle_checklist',
                    checklist_id: checklistId,
                    new_state: newState,
                    nonce: mclDashboardWidget.nonce
                },
                success: (response) => {
                    if (response.success) {
                        this.updateChecklistUI($button, newState);
                        this.showNotice('success', response.data.message);
                    } else {
                        this.showNotice('error', response.data.message || mclDashboardWidget.i18n.error);
                    }
                },
                error: () => {
                    this.showNotice('error', mclDashboardWidget.i18n.error);
                },
                complete: () => {
                    this.setButtonLoading($button, false);
                }
            });
        }

        handleCheckboxChange(e) {
            const $checkbox = $(e.currentTarget);
            const $item = $checkbox.closest('.mcl-widget-item');
            const checklistId = $item.data('checklist-id');
            const itemId = $item.data('item-id');
            const checked = $checkbox.is(':checked');

            // Prevent multiple requests
            if ($item.hasClass('loading')) {
                return;
            }

            // Show loading state
            $item.addClass('loading');
            $checkbox.prop('disabled', true);

            // Make AJAX request
            $.ajax({
                url: mclDashboardWidget.ajaxurl,
                type: 'POST',
                data: {
                    action: 'mcl_widget_toggle_item',
                    checklist_id: checklistId,
                    item_id: itemId,
                    checked: checked ? 1 : 0,
                    nonce: mclDashboardWidget.nonce
                },
                success: (response) => {
                    if (response.success) {
                        this.updateItemUI($item, checked);
                        // Optional: Show subtle feedback for item state change
                        // this.showNotice('success', response.data.message);
                    } else {
                        // Revert checkbox state on error
                        $checkbox.prop('checked', !checked);
                        this.showNotice('error', response.data.message || mclDashboardWidget.i18n.error);
                    }
                },
                error: () => {
                    // Revert checkbox state on error
                    $checkbox.prop('checked', !checked);
                    this.showNotice('error', mclDashboardWidget.i18n.error);
                },
                complete: () => {
                    $item.removeClass('loading');
                    $checkbox.prop('disabled', false);
                }
            });
        }

        updateItemUI($item, checked) {
            if (checked) {
                $item.addClass('mcl-widget-item-checked');
            } else {
                $item.removeClass('mcl-widget-item-checked');
            }

            // Add subtle animation
            $item.addClass('mcl-widget-item-updated');
            setTimeout(() => {
                $item.removeClass('mcl-widget-item-updated');
            }, 300);
        }

        setButtonLoading($button, loading) {
            if (loading) {
                $button.addClass('loading').prop('disabled', true);
                const currentState = parseInt($button.data('current-state'));
                $button.text(currentState === 1 ? 
                    mclDashboardWidget.i18n.deactivating : 
                    mclDashboardWidget.i18n.activating
                );
            } else {
                $button.removeClass('loading').prop('disabled', false);
            }
        }

        updateChecklistUI($button, newState) {
            const $checklist = $button.closest('.mcl-widget-checklist');
            const $status = $checklist.find('.mcl-widget-status');

            // Update button
            $button.data('current-state', newState);
            $button.removeClass('active inactive').addClass(newState === 1 ? 'active' : 'inactive');
            $button.text(newState === 1 ? 
                mclDashboardWidget.i18n.deactivate || 'Deactivate' : 
                mclDashboardWidget.i18n.activate || 'Activate'
            );

            // Update status indicator
            $status.removeClass('mcl-status-active mcl-status-inactive')
                   .addClass(newState === 1 ? 'mcl-status-active' : 'mcl-status-inactive')
                   .text(newState === 1 ? 
                        'Active' : 
                        'Inactive'
                   );

            // Add visual feedback
            $checklist.addClass('mcl-widget-updated');
            setTimeout(() => {
                $checklist.removeClass('mcl-widget-updated');
            }, 2000);
        }

        showNotice(type, message) {
            // Check if WordPress admin notices area exists
            const $noticesArea = $('.wrap h1').first();
            if ($noticesArea.length === 0) {
                // Fallback to browser alert if no notices area
                alert(message);
                return;
            }

            const noticeClass = type === 'success' ? 'notice-success' : 'notice-error';
            const $notice = $(`
                <div class="notice ${noticeClass} is-dismissible mcl-widget-notice">
                    <p>${message}</p>
                    <button type="button" class="notice-dismiss">
                        <span class="screen-reader-text">Dismiss this notice.</span>
                    </button>
                </div>
            `);

            // Remove any existing widget notices
            $('.mcl-widget-notice').remove();

            // Add new notice
            $noticesArea.after($notice);

            // Handle dismiss button
            $notice.find('.notice-dismiss').on('click', function() {
                $notice.fadeOut(300, function() {
                    $(this).remove();
                });
            });

            // Auto-remove success notices after 3 seconds
            if (type === 'success') {
                setTimeout(() => {
                    $notice.fadeOut(300, function() {
                        $(this).remove();
                    });
                }, 3000);
            }

            // Scroll to notice if it's not visible
            this.scrollToNotice($notice);
        }

        scrollToNotice($notice) {
            const noticeTop = $notice.offset().top;
            const windowTop = $(window).scrollTop();
            const windowHeight = $(window).height();

            // Only scroll if notice is not visible
            if (noticeTop < windowTop || noticeTop > windowTop + windowHeight) {
                $('html, body').animate({
                    scrollTop: noticeTop - 100
                }, 500);
            }
        }
    }

    // Initialize when document is ready
    $(document).ready(function() {
        new MCLDashboardWidget();
    });

    // Add CSS animation for updated state
    $('<style>')
        .prop('type', 'text/css')
        .html(`
            .mcl-widget-updated {
                animation: mcl-widget-pulse 0.5s ease-in-out;
            }
            
            .mcl-widget-item-updated {
                animation: mcl-widget-item-pulse 0.3s ease-in-out;
            }
            
            .mcl-widget-item.loading {
                opacity: 0.6;
                pointer-events: none;
            }
            
            @keyframes mcl-widget-pulse {
                0% { background-color: transparent; }
                50% { background-color: rgba(34, 113, 177, 0.1); }
                100% { background-color: transparent; }
            }
            
            @keyframes mcl-widget-item-pulse {
                0% { background-color: transparent; }
                50% { background-color: rgba(70, 180, 80, 0.1); }
                100% { background-color: transparent; }
            }
        `)
        .appendTo('head');

})(jQuery); 