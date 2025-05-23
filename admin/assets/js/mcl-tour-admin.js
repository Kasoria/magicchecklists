/**
 * Tour Admin JavaScript
 * Handles tour management in the admin interface
 */

(function($) {
    'use strict';

    const TourAdmin = {
        
        currentTourId: 0,
        tourSteps: [],
        tourSettings: {},
        checklists: [],

        init() {
            this.bindEvents();
            this.loadChecklists();
        },

        bindEvents() {
            // No specific events needed for list page
            // Most functionality is in the inline scripts in the PHP file
        },

        loadChecklists() {
            $.post(mclTourAdmin.ajax_url, {
                action: 'mcl_get_checklists_for_tour',
                nonce: mclTourAdmin.nonce
            }, (response) => {
                if (response.success) {
                    this.checklists = response.data;
                }
            }).fail((xhr, status, error) => {
                console.error('Failed to load checklists:', error);
                console.error('Response:', xhr.responseText);
            });
        },

        createTour() {
            // Redirect to dashboard with tour creation mode
            window.location.href = mclTourAdmin.dashboard_url + '?mcl_tour_mode=1';
        },

        editTour(tourId) {
            // Redirect to dashboard with tour editing mode
            window.location.href = mclTourAdmin.dashboard_url + '?mcl_tour_mode=1&tour_id=' + tourId;
        },

        deleteTour(tourId) {
            if (!confirm(mclTourAdmin.i18n.confirmDelete)) {
                return;
            }

            $.post(mclTourAdmin.ajax_url, {
                action: 'mcl_delete_tour',
                tour_id: tourId,
                nonce: mclTourAdmin.nonce
            }, (response) => {
                if (response.success) {
                    location.reload();
                } else {
                    alert(mclTourAdmin.i18n.error);
                }
            }).fail((xhr, status, error) => {
                console.error('Failed to delete tour:', error);
                console.error('Response:', xhr.responseText);
                alert(mclTourAdmin.i18n.error);
            });
        },

        toggleTourStatus(tourId, newStatus) {
            $.post(mclTourAdmin.ajax_url, {
                action: 'mcl_toggle_tour_status',
                tour_id: tourId,
                nonce: mclTourAdmin.nonce
            }, (response) => {
                if (response.success) {
                    // Status updated successfully
                    return true;
                } else {
                    alert(mclTourAdmin.i18n.error);
                    return false;
                }
            }).fail((xhr, status, error) => {
                console.error('Failed to toggle tour status:', error);
                console.error('Response:', xhr.responseText);
                alert(mclTourAdmin.i18n.error);
                return false;
            });
        }
    };

    // Initialize when document is ready
    $(document).ready(() => {
        TourAdmin.init();
    });

    // Expose to global scope for inline script access
    window.mclTourAdmin = TourAdmin;

})(jQuery);