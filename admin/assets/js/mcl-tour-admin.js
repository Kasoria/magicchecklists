/**
 * Tour Admin JavaScript
 * Handles tour management in the admin interface
 */

(function() {
    'use strict';

    const TourAdmin = {
        
        currentTourId: 0,
        tourSteps: [],
        tourSettings: {},
        checklists: [],

        init() {
            // Check if required data is available
            if (typeof mclTourAdmin === 'undefined') {
                console.log('MCL Tour Admin: Required data not available on this page');
                return;
            }
            
            this.bindEvents();
            this.loadChecklists();
        },

        bindEvents() {
            // No specific events needed for list page
            // Most functionality is in the inline scripts in the PHP file
        },

        loadChecklists() {
            if (typeof mclTourAdmin === 'undefined' || !mclTourAdmin.ajax_url) {
                return;
            }
            
            const formData = new FormData();
            formData.append('action', 'mcl_get_checklists_for_tour');
            formData.append('nonce', mclTourAdmin.nonce);

            fetch(mclTourAdmin.ajax_url, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.checklists = data.data;
                }
            })
            .catch(error => {
                console.error('Failed to load checklists:', error);
            });
        },

        createTour() {
            if (typeof mclTourAdmin === 'undefined' || !mclTourAdmin.dashboard_url) {
                return;
            }
            // Redirect to dashboard with tour creation mode
            window.location.href = mclTourAdmin.dashboard_url + '?mcl_tour_mode=1';
        },

        editTour(tourId) {
            if (typeof mclTourAdmin === 'undefined' || !mclTourAdmin.dashboard_url) {
                return;
            }
            // Redirect to dashboard with tour editing mode
            window.location.href = mclTourAdmin.dashboard_url + '?mcl_tour_mode=1&tour_id=' + tourId;
        },

        deleteTour(tourId) {
            if (typeof mclTourAdmin === 'undefined' || !mclTourAdmin.ajax_url) {
                return;
            }
            
            if (!confirm(mclTourAdmin.i18n.confirmDelete)) {
                return;
            }

            const formData = new FormData();
            formData.append('action', 'mcl_delete_tour');
            formData.append('tour_id', tourId);
            formData.append('nonce', mclTourAdmin.nonce);

            fetch(mclTourAdmin.ajax_url, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                } else {
                    alert(mclTourAdmin.i18n.error);
                }
            })
            .catch(error => {
                console.error('Failed to delete tour:', error);
                alert(mclTourAdmin.i18n.error);
            });
        },

        toggleTourStatus(tourId, newStatus) {
            if (typeof mclTourAdmin === 'undefined' || !mclTourAdmin.ajax_url) {
                return false;
            }
            
            const formData = new FormData();
            formData.append('action', 'mcl_toggle_tour_status');
            formData.append('tour_id', tourId);
            formData.append('nonce', mclTourAdmin.nonce);

            fetch(mclTourAdmin.ajax_url, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Status updated successfully
                    return true;
                } else {
                    alert(mclTourAdmin.i18n.error);
                    return false;
                }
            })
            .catch(error => {
                console.error('Failed to toggle tour status:', error);
                alert(mclTourAdmin.i18n.error);
                return false;
            });
        }
    };

    // Initialize when document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            TourAdmin.init();
        });
    } else {
        TourAdmin.init();
    }

    // Expose to global scope for inline script access
    window.mclTourAdmin = TourAdmin;

})();