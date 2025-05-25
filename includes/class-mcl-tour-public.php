<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MCL_Tour_Public {
    
    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_tour_assets'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_tour_assets'));
        add_action('wp_footer', array($this, 'render_tour_ui'));
        add_action('admin_footer', array($this, 'render_tour_ui'));
        add_action('wp_ajax_mcl_mark_tour_complete', array($this, 'mark_tour_complete'));
        add_action('wp_ajax_nopriv_mcl_mark_tour_complete', array($this, 'mark_tour_complete'));
    }

    public function enqueue_tour_assets($hook = '') {
        // Check if we're in tour creation mode
        $is_tour_mode = isset($_GET['mcl_tour_mode']) && $_GET['mcl_tour_mode'] == '1';
        
        // Check if we're continuing a tour
        $continue_tour_id = isset($_GET['mcl_continue_tour']) ? intval($_GET['mcl_continue_tour']) : 0;
        $continue_step = isset($_GET['mcl_tour_step']) ? intval($_GET['mcl_tour_step']) : 0;
        
        // For tour creation mode, always load assets
        if ($is_tour_mode) {
            $this->load_tour_assets($is_tour_mode, array(), $continue_tour_id, $continue_step);
            return;
        }
        
        // For continuing tours, always load assets
        if ($continue_tour_id) {
            $this->load_tour_assets($is_tour_mode, array(), $continue_tour_id, $continue_step);
            return;
        }
        
        // Check if any tours should be triggered on current page
        if (!MCL_Tour_CPT::has_tours_for_current_page()) {
            return; // No tours for this page, don't load assets
        }
        
        // Get active tours for current context
        $active_tours = MCL_Tour_CPT::get_active_tours_for_context();
        
        if (empty($active_tours)) {
            return;
        }

        $this->load_tour_assets($is_tour_mode, $active_tours, $continue_tour_id, $continue_step);
    }

    private function load_tour_assets($is_tour_mode, $active_tours, $continue_tour_id = 0, $continue_step = 0) {
        // Enqueue driver.js
        wp_enqueue_script(
            'driver-js',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/vendor/driver.js.iife.js',
            array(),
            '1.3.1',
            true
        );

        wp_enqueue_style(
            'driver-css',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/vendor/driver.css',
            array(),
            '1.3.1'
        );

        // Enqueue sortable.js if in tour creation mode
        if ($is_tour_mode) {
            wp_enqueue_script(
                'sortable-js',
                MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/vendor/sortable.min.js',
                array(),
                '1.15.0',
                true
            );
        }

        // Enqueue tour public scripts
        wp_enqueue_script(
            'mcl-tour-public',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/mcl-tour-public.js',
            $is_tour_mode ? array('jquery', 'driver-js', 'sortable-js') : array('jquery', 'driver-js'),
            MAGIC_CHECKLISTS_VERSION,
            true
        );

        wp_enqueue_style(
            'mcl-tour-public',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-tour-public.css',
            array('driver-css'),
            MAGIC_CHECKLISTS_VERSION
        );

        // Prepare tour data for JS
        $tours_data = array();
        
        // Handle tour continuation
        if ($continue_tour_id) {
            $tour = get_post($continue_tour_id);
            if ($tour && $tour->post_type === 'mcl_tour') {
                $steps = get_post_meta($continue_tour_id, '_mcl_tour_steps', true) ?: array();
                $settings = get_post_meta($continue_tour_id, '_mcl_tour_settings', true) ?: array();
                
                $tours_data[] = array(
                    'id' => $continue_tour_id,
                    'title' => $tour->post_title,
                    'steps' => $steps,
                    'settings' => $settings,
                    'autostart' => true,
                    'continue_from_step' => $continue_step
                );
            }
        } else {
            // Normal tour loading
            foreach ($active_tours as $tour) {
                $tour_id = $tour->ID;
                $steps = get_post_meta($tour_id, '_mcl_tour_steps', true) ?: array();
                $settings = get_post_meta($tour_id, '_mcl_tour_settings', true) ?: array();
                $autostart = get_post_meta($tour_id, '_mcl_tour_autostart', true);
                $trigger_type = get_post_meta($tour_id, '_mcl_tour_trigger_type', true) ?: 'page';
                $trigger_value = get_post_meta($tour_id, '_mcl_tour_trigger_value', true) ?: '';
                
                $tours_data[] = array(
                    'id' => $tour_id,
                    'title' => $tour->post_title,
                    'steps' => $steps,
                    'settings' => $settings,
                    'autostart' => $autostart,
                    'trigger_type' => $trigger_type,
                    'trigger_value' => $trigger_value
                );
            }
        }

        // Localize script
        wp_localize_script('mcl-tour-public', 'mclTour', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => $is_tour_mode ? wp_create_nonce('mcl_tour_admin') : wp_create_nonce('mcl_tour_public'),
            'tours' => $tours_data,
            'is_tour_mode' => $is_tour_mode,
            'tour_id' => isset($_GET['tour_id']) ? intval($_GET['tour_id']) : 0,
            'continue_tour_id' => $continue_tour_id,
            'continue_step' => $continue_step,
            'i18n' => array(
                'next' => __('Next', 'magic-checklists'),
                'prev' => __('Previous', 'magic-checklists'),
                'done' => __('Done', 'magic-checklists'),
                'skip' => __('Skip', 'magic-checklists'),
                'creating' => __('Creating Tour...', 'magic-checklists'),
                'selectElement' => __('Select Element', 'magic-checklists'),
                'navigate' => __('Navigate', 'magic-checklists'),
            )
        ));

        // If in tour creation mode, also enqueue TinyMCE
        if ($is_tour_mode) {
            wp_enqueue_editor();
            wp_enqueue_media();
        }
    }

    public function render_tour_ui() {
        $is_tour_mode = isset($_GET['mcl_tour_mode']) && $_GET['mcl_tour_mode'] == '1';
        $continue_tour_id = isset($_GET['mcl_continue_tour']) ? intval($_GET['mcl_continue_tour']) : 0;
        
        // Check if tours are active on this page
        $has_tours = $is_tour_mode || $continue_tour_id || MCL_Tour_CPT::has_tours_for_current_page();
        
        if ($is_tour_mode) {
            include MAGIC_CHECKLISTS_PLUGIN_PATH . 'public/views/mcl-tour-creator.php';
        } elseif ($has_tours) {
            // Render the confirmation modal for regular tours when tours are active
            $this->render_confirmation_modal();
        }
    }

    private function render_confirmation_modal() {
        ?>
        <!-- Tour Confirmation Modal -->
        <div class="mcl-confirmation-modal" id="mcl-confirmation-modal">
            <div class="mcl-confirmation-modal-content">
                <div class="mcl-confirmation-modal-inner">
                    <button type="button" class="mcl-confirmation-modal-close" id="mcl-confirmation-modal-close">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <path fill="currentColor" fill-rule="evenodd" d="M4.28 3.22a.75.75 0 0 0-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06L8 9.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L9.06 8l3.72-3.72a.75.75 0 0 0-1.06-1.06L8 6.94L4.28 3.22Z" clip-rule="evenodd"/>
                        </svg>
                        <span class="sr-only"><?php _e('Close modal', 'magic-checklists'); ?></span>
                    </button>
                    <div class="mcl-confirmation-modal-body">
                        <div class="mcl-confirmation-modal-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                            </svg>
                        </div>
                        <h3 class="mcl-confirmation-modal-title" id="mcl-confirmation-modal-title">
                            <?php _e('Are you sure?', 'magic-checklists'); ?>
                        </h3>
                        <div class="mcl-confirmation-modal-actions">
                            <button type="button" class="mcl-button mcl-button-danger" id="mcl-confirmation-modal-confirm">
                                <?php _e('Yes, I\'m sure', 'magic-checklists'); ?>
                            </button>
                            <button type="button" class="mcl-button mcl-button-secondary" id="mcl-confirmation-modal-cancel">
                                <?php _e('No, cancel', 'magic-checklists'); ?>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script>
        console.log('MCL: Tour confirmation modal rendered for regular tour mode');
        </script>
        <?php
    }

    public function mark_tour_complete() {
        // Try both nonces since tours can be completed in both admin and public contexts
        $nonce_valid = false;
        
        if (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_tour_public')) {
            $nonce_valid = true;
        } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_tour_admin')) {
            $nonce_valid = true;
        }
        
        if (!$nonce_valid) {
            wp_send_json_error('Invalid nonce');
        }
        
        $tour_id = intval($_POST['tour_id']);
        $is_first_login = isset($_POST['is_first_login']) && $_POST['is_first_login'];
        
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            $completed_tours = get_user_meta($user_id, '_mcl_completed_tours', true) ?: array();
            
            if (!in_array($tour_id, $completed_tours)) {
                $completed_tours[] = $tour_id;
                update_user_meta($user_id, '_mcl_completed_tours', $completed_tours);
            }
            
            // Mark first login tours as shown if this was a first login tour
            if ($is_first_login) {
                MCL_Tour_CPT::mark_first_login_tours_shown();
            }
        } else {
            // Use session/cookie for non-logged-in users
            if (!isset($_COOKIE['mcl_completed_tours'])) {
                $completed_tours = array();
            } else {
                $completed_tours = json_decode(stripslashes($_COOKIE['mcl_completed_tours']), true) ?: array();
            }
            
            if (!in_array($tour_id, $completed_tours)) {
                $completed_tours[] = $tour_id;
                setcookie('mcl_completed_tours', json_encode($completed_tours), time() + (30 * DAY_IN_SECONDS), COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
            }
        }
        
        wp_send_json_success();
    }
}
