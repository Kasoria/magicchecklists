<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MCL_Tour_Admin {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        add_action('admin_init', array($this, 'handle_tour_redirects'));
        add_action('wp_ajax_mcl_save_tour', array($this, 'save_tour'));
        add_action('wp_ajax_mcl_save_tour_settings', array($this, 'save_tour_settings'));
        add_action('wp_ajax_mcl_delete_tour', array($this, 'delete_tour'));
        add_action('wp_ajax_mcl_get_tour_data', array($this, 'get_tour_data'));
        add_action('wp_ajax_mcl_toggle_tour_status', array($this, 'toggle_tour_status'));
        add_action('wp_ajax_mcl_get_checklists_for_tour', array($this, 'get_checklists_for_tour'));
        add_action('wp_ajax_mcl_reset_tour_completion', array($this, 'reset_tour_completion'));
        add_action('wp_ajax_mcl_reorder_tour_steps', array($this, 'reorder_tour_steps'));
        add_action('wp_ajax_mcl_tour_step_check_item', array($this, 'tour_step_check_item'));
        add_action('wp_ajax_nopriv_mcl_tour_step_check_item', array($this, 'tour_step_check_item'));
        add_action('wp_ajax_mcl_get_item_tour_connections', array($this, 'get_item_tour_connections'));
        add_action('wp_ajax_nopriv_mcl_get_item_tour_connections', array($this, 'get_item_tour_connections'));
        
        // React component AJAX handlers
        add_action('wp_ajax_mcl_get_tours_list', array($this, 'get_tours_list'));
        add_action('wp_ajax_mcl_duplicate_tour', array($this, 'duplicate_tour'));
        add_action('wp_ajax_mcl_get_users_for_tour', array($this, 'get_users_for_tour'));
        add_action('wp_ajax_mcl_get_roles_for_tour', array($this, 'get_roles_for_tour'));
    }

    public function add_admin_menu() {
        add_submenu_page(
            'mcl_checklists',
            __('Tours', 'magic-checklists'),
            __('Tours', 'magic-checklists'),
            'manage_options',
            'mcl_tours',
            array($this, 'render_tours_page')
        );
    }

    public function handle_tour_redirects() {
        // Only handle redirects on the tours page
        if (!isset($_GET['page']) || $_GET['page'] !== 'mcl_tours') {
            return;
        }

        // Check if we're in creation or edit mode
        $creation_mode = isset($_GET['create']) ? true : false;
        $edit_id = isset($_GET['edit']) ? intval($_GET['edit']) : 0;
        
        // No redirects needed - we'll handle routing in render_tours_page
    }

    public function enqueue_admin_assets($hook) {
        if ($hook !== 'magicchecklists_page_mcl_tours') {
            return;
        }

        // Enqueue admin common scripts first
        wp_enqueue_script('wp-util');

        // Always localize script data for tours page (using driver-js handle as fallback)
        wp_localize_script('driver-js', 'mclTourAdmin', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mcl_tour_admin'),
            'dashboard_url' => admin_url('index.php'),
            'i18n' => array(
                'save' => __('Save', 'magic-checklists'),
                'cancel' => __('Cancel', 'magic-checklists'),
                'delete' => __('Delete', 'magic-checklists'),
                'confirmDelete' => __('Are you sure you want to delete this tour?', 'magic-checklists'),
                'selectElement' => __('Select Element', 'magic-checklists'),
                'navigate' => __('Navigate', 'magic-checklists'),
                'addStep' => __('Add Step', 'magic-checklists'),
                'stepTitle' => __('Step Title', 'magic-checklists'),
                'stepContent' => __('Step Content', 'magic-checklists'),
                'selectChecklist' => __('Select Checklist', 'magic-checklists'),
                'selectItem' => __('Select Checklist Item', 'magic-checklists'),
                'tourSaved' => __('Tour saved successfully', 'magic-checklists'),
                'tourDeleted' => __('Tour deleted successfully', 'magic-checklists'),
                'error' => __('An error occurred', 'magic-checklists'),
            )
        ));
        
        // Add nonces to the main admin data for React components
        add_filter('mcl_admin_localized_data', array($this, 'add_tour_nonces_to_admin_data'));

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

        // Enqueue WordPress media uploader
        wp_enqueue_media();
        
        // Enqueue TinyMCE
        wp_enqueue_editor();
    }

    public function render_tours_page() {
        // All tour management is now handled by React components in AdminApp.jsx
        // This function serves as a placeholder for the React mounting point
        echo '<div id="mcl-admin-root"></div>';
        
        // The React AdminApp will handle routing between Tours list and TourEditor
        // based on URL parameters automatically
    }

    public function save_tour() {
        check_ajax_referer('mcl_tour_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $tour_id = isset($_POST['tour_id']) ? intval($_POST['tour_id']) : 0;
        $title = sanitize_text_field($_POST['title']);
        $steps = json_decode(stripslashes($_POST['steps']), true);
        $settings = json_decode(stripslashes($_POST['settings']), true);
        
        $tour_data = array(
            'post_title' => $title,
            'post_type' => 'mcl_tour',
            'post_status' => 'publish'
        );

        if ($tour_id) {
            $tour_data['ID'] = $tour_id;
            $tour_id = wp_update_post($tour_data);
        } else {
            $tour_id = wp_insert_post($tour_data);
        }

        if (!$tour_id || is_wp_error($tour_id)) {
            wp_send_json_error('Failed to save tour');
        }

        // Save tour meta
        update_post_meta($tour_id, '_mcl_tour_steps', $steps);
        update_post_meta($tour_id, '_mcl_tour_settings', $settings);
        update_post_meta($tour_id, '_mcl_tour_active', isset($settings['active']) ? 1 : 0);
        update_post_meta($tour_id, '_mcl_tour_autostart', isset($settings['autostart']) ? 1 : 0);
        update_post_meta($tour_id, '_mcl_tour_show_once', ! empty($settings['show_once']) ? 1 : 0);

        wp_send_json_success(array(
            'tour_id' => $tour_id,
            'message' => __('Tour saved successfully', 'magic-checklists')
        ));
    }

    public function save_tour_settings() {
        check_ajax_referer('mcl_tour_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $tour_id = isset($_POST['tour_id']) ? intval($_POST['tour_id']) : 0;
        $title = sanitize_text_field($_POST['title']);
        $description = sanitize_textarea_field($_POST['description']);
        
        // Parse JSON settings from frontend
        $settings_json = $_POST['settings'] ?? '{}';
        // Strip slashes in case of escaped quotes
        $settings_raw = $settings_json;
        $settings_unescaped = stripslashes($settings_raw);
        // Debug: log the unescaped settings JSON
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('MCL Tour Settings Debug: Unescaped settings_json: ' . $settings_unescaped);
        }
        if (is_string($settings_unescaped)) {
            $settings = json_decode($settings_unescaped, true);
            // Debug: log any JSON decode errors
            if (defined('WP_DEBUG') && WP_DEBUG && json_last_error() !== JSON_ERROR_NONE) {
                error_log('MCL Tour Settings Debug: JSON decode error: ' . json_last_error_msg());
            }
        } else {
            $settings = $settings_json; // Already an array
        }
        
        if (!$settings || !is_array($settings)) {
            $settings = array();
        }
        
        // Get trigger settings
        $trigger_type = sanitize_text_field($_POST['trigger_type'] ?? 'page');
        $trigger_value = sanitize_text_field($_POST['trigger_value'] ?? '');
        $user_condition = sanitize_text_field($_POST['user_condition'] ?? 'all_users');
        
        // Parse JSON arrays from frontend
        $specific_users_json = $_POST['specific_users'] ?? '[]';
        if (is_string($specific_users_json)) {
            $specific_users = json_decode($specific_users_json, true);
        } else {
            $specific_users = $specific_users_json;
        }
        $specific_users = is_array($specific_users) ? array_map('intval', $specific_users) : array();
        
        $specific_roles_json = $_POST['specific_roles'] ?? '[]';
        if (is_string($specific_roles_json)) {
            $specific_roles = json_decode($specific_roles_json, true);
        } else {
            $specific_roles = $specific_roles_json;
        }
        $specific_roles = is_array($specific_roles) ? array_map('sanitize_text_field', $specific_roles) : array();
        
        // Sanitize the settings array - save all settings with proper defaults only when missing
        $sanitized_settings = array();
        
        // Basic tour settings - always save with explicit values
        $sanitized_settings['active'] = isset($settings['active']) ? (bool) $settings['active'] : false;
        $sanitized_settings['autostart'] = isset($settings['autostart']) ? (bool) $settings['autostart'] : false;
        $sanitized_settings['show_once'] = isset($settings['show_once']) ? (bool) $settings['show_once'] : false;
        
        // Animation settings - always save
        $sanitized_settings['animate'] = isset($settings['animate']) ? (bool) $settings['animate'] : true;
        
        // Progress settings - always save
        $sanitized_settings['show_progress'] = isset($settings['show_progress']) ? (bool) $settings['show_progress'] : true;
        $sanitized_settings['progress_text'] = isset($settings['progress_text']) ? sanitize_text_field($settings['progress_text']) : '{{current}} of {{total}}';
        
        // Exit control settings - always save
        $sanitized_settings['allow_close'] = isset($settings['allow_close']) ? (bool) $settings['allow_close'] : true;
        $sanitized_settings['confirm_exit'] = isset($settings['confirm_exit']) ? (bool) $settings['confirm_exit'] : false;
        $sanitized_settings['exit_message'] = isset($settings['exit_message']) ? sanitize_text_field($settings['exit_message']) : 'Are you sure you want to exit the tour?';
        
        // Button text settings - always save
        $sanitized_settings['next_btn_text'] = isset($settings['next_btn_text']) ? sanitize_text_field($settings['next_btn_text']) : 'Next';
        $sanitized_settings['prev_btn_text'] = isset($settings['prev_btn_text']) ? sanitize_text_field($settings['prev_btn_text']) : 'Previous';
        $sanitized_settings['done_btn_text'] = isset($settings['done_btn_text']) ? sanitize_text_field($settings['done_btn_text']) : 'Done';
        $sanitized_settings['close_btn_text'] = isset($settings['close_btn_text']) ? sanitize_text_field($settings['close_btn_text']) : 'Close';
        
        // Default buttons (array of allowed button types) - always save
        if (isset($settings['default_buttons']) && is_array($settings['default_buttons'])) {
            $allowed_buttons = array('next', 'previous', 'close');
            $sanitized_settings['default_buttons'] = array_intersect($settings['default_buttons'], $allowed_buttons);
        } else {
            $sanitized_settings['default_buttons'] = array('next', 'previous', 'close');
        }
        
        // Overlay settings - always save
        if (isset($settings['overlay_color'])) {
            $sanitized_settings['overlay_color'] = sanitize_hex_color($settings['overlay_color']);
            if (!$sanitized_settings['overlay_color']) {
                $sanitized_settings['overlay_color'] = $settings['overlay_color']; // Keep original if sanitization fails
            }
        } else {
            $sanitized_settings['overlay_color'] = '#000000';
        }
        
        $sanitized_settings['overlay_opacity'] = isset($settings['overlay_opacity']) ? floatval($settings['overlay_opacity']) : 0.75;
        $sanitized_settings['overlay_opacity'] = max(0, min(1, $sanitized_settings['overlay_opacity'])); // Clamp between 0 and 1
        
        // Popover settings - always save
        $sanitized_settings['popover_class'] = isset($settings['popover_class']) ? sanitize_html_class($settings['popover_class']) : '';
        
        // Advanced settings - always save
        $sanitized_settings['padding'] = isset($settings['padding']) ? intval($settings['padding']) : 4;
        $sanitized_settings['padding'] = max(0, min(50, $sanitized_settings['padding'])); // Clamp between 0 and 50
        $sanitized_settings['smooth_scroll'] = isset($settings['smooth_scroll']) ? (bool) $settings['smooth_scroll'] : true;
        
        $tour_data = array(
            'post_title' => $title,
            'post_content' => $description,
            'post_type' => 'mcl_tour',
            'post_status' => 'publish'
        );

        if ($tour_id) {
            $tour_data['ID'] = $tour_id;
            $tour_id = wp_update_post($tour_data);
        } else {
            $tour_id = wp_insert_post($tour_data);
        }

        if (!$tour_id || is_wp_error($tour_id)) {
            wp_send_json_error('Failed to save tour');
        }

        // Save tour meta - always save explicit values
        update_post_meta($tour_id, '_mcl_tour_settings', $sanitized_settings);
        update_post_meta($tour_id, '_mcl_tour_active', $sanitized_settings['active'] ? 1 : 0);
        update_post_meta($tour_id, '_mcl_tour_autostart', $sanitized_settings['autostart'] ? 1 : 0);
        update_post_meta($tour_id, '_mcl_tour_show_once', $sanitized_settings['show_once'] ? 1 : 0);
        
        // Save trigger settings
        update_post_meta($tour_id, '_mcl_tour_trigger_type', $trigger_type);
        update_post_meta($tour_id, '_mcl_tour_trigger_value', $trigger_value);
        update_post_meta($tour_id, '_mcl_tour_user_condition', $user_condition);
        update_post_meta($tour_id, '_mcl_tour_specific_users', $specific_users);
        update_post_meta($tour_id, '_mcl_tour_specific_roles', $specific_roles);
        
        // Clear any caches that might prevent tour detection
        wp_cache_delete('mcl_tours_active', 'mcl_tours');
        
        // Debug logging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('MCL Tour Admin: Saved tour ' . $tour_id . ' with active=' . ($sanitized_settings['active'] ? 'true' : 'false') . ', autostart=' . ($sanitized_settings['autostart'] ? 'true' : 'false') . ', trigger_type=' . $trigger_type . ', trigger_value=' . $trigger_value);
            error_log('MCL Tour Admin: Full settings: ' . json_encode($sanitized_settings));
        }

        wp_send_json_success(array(
            'tour_id' => $tour_id,
            'message' => __('Tour settings saved successfully', 'magic-checklists')
        ));
    }

    public function delete_tour() {
        check_ajax_referer('mcl_tour_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $tour_id = intval($_POST['tour_id']);
        
        if (wp_delete_post($tour_id, true)) {
            wp_send_json_success();
        } else {
            wp_send_json_error('Failed to delete tour');
        }
    }

    public function get_tour_data() {
        // Accept both admin and public nonces for tour data retrieval (for continuation playback)
        $nonce = isset($_REQUEST['nonce']) ? $_REQUEST['nonce'] : '';
        if (! wp_verify_nonce($nonce, 'mcl_tour_admin') && ! wp_verify_nonce($nonce, 'mcl_tour_public')) {
            wp_send_json_error('Invalid nonce');
        }

        $tour_id = intval($_POST['tour_id']);
        $tour = get_post($tour_id);
        
        if (!$tour || $tour->post_type !== 'mcl_tour') {
            wp_send_json_error('Tour not found');
        }

        // Get settings first, then use them as the source of truth for active/autostart/show_once
        $settings = get_post_meta($tour_id, '_mcl_tour_settings', true) ?: array();
        
        // For backward compatibility, fall back to separate meta fields if not in settings
        $active = isset($settings['active']) ? $settings['active'] : (get_post_meta($tour_id, '_mcl_tour_active', true) ? true : false);
        $autostart = isset($settings['autostart']) ? $settings['autostart'] : (get_post_meta($tour_id, '_mcl_tour_autostart', true) ? true : false);
        $show_once = isset($settings['show_once']) ? $settings['show_once'] : (get_post_meta($tour_id, '_mcl_tour_show_once', true) ? true : false);

        $data = array(
            'id' => $tour_id,
            'title' => $tour->post_title,
            'description' => $tour->post_content,
            'steps' => get_post_meta($tour_id, '_mcl_tour_steps', true) ?: array(),
            'settings' => $settings,
            'active' => $active,
            'trigger_type' => get_post_meta($tour_id, '_mcl_tour_trigger_type', true) ?: 'page',
            'trigger_value' => get_post_meta($tour_id, '_mcl_tour_trigger_value', true) ?: '',
            'user_condition' => get_post_meta($tour_id, '_mcl_tour_user_condition', true) ?: 'all_users',
            'specific_users' => get_post_meta($tour_id, '_mcl_tour_specific_users', true) ?: array(),
            'specific_roles' => get_post_meta($tour_id, '_mcl_tour_specific_roles', true) ?: array(),
            'autostart' => $autostart,
            'show_once' => $show_once,
        );

        wp_send_json_success($data);
    }

    public function toggle_tour_status() {
        check_ajax_referer('mcl_tour_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $tour_id = intval($_POST['tour_id']);
        $current_status = get_post_meta($tour_id, '_mcl_tour_active', true);
        $new_status = $current_status ? 0 : 1;
        
        update_post_meta($tour_id, '_mcl_tour_active', $new_status);
        
        wp_send_json_success(array('active' => $new_status));
    }

    public function get_checklists_for_tour() {
        check_ajax_referer('mcl_tour_admin', 'nonce');

        $checklists = get_posts(array(
            'post_type' => 'mcl_checklist',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC'
        ));

        $result = array();
        foreach ($checklists as $checklist) {
            $items = get_post_meta($checklist->ID, '_mcl_items', true) ?: array();
            $result[] = array(
                'id' => $checklist->ID,
                'title' => $checklist->post_title,
                'items' => $items
            );
        }

        wp_send_json_success($result);
    }

    public function reset_tour_completion() {
        check_ajax_referer('mcl_tour_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $tour_id = intval($_POST['tour_id']);
        $user_id = get_current_user_id();
        
        // Remove from user's completed tours
        $completed_tours = get_user_meta($user_id, '_mcl_completed_tours', true) ?: array();
        $completed_tours = array_diff($completed_tours, array($tour_id));
        update_user_meta($user_id, '_mcl_completed_tours', $completed_tours);
        
        // Reset first login status for current user (if applicable)
        delete_user_meta($user_id, '_mcl_first_login_tours_shown');
        
        wp_send_json_success(array('message' => 'Tour completion reset successfully'));
    }

    public function reorder_tour_steps() {
        check_ajax_referer('mcl_tour_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $tour_id = intval($_POST['tour_id']);
        
        // Handle both old format (step_order as indices) and new format (steps as JSON)
        if (isset($_POST['steps'])) {
            // New format: steps as JSON string containing the reordered step objects
            $reordered_steps = json_decode(stripslashes($_POST['steps']), true);
            
            if (!$tour_id || !is_array($reordered_steps)) {
                wp_send_json_error('Invalid parameters');
            }
        } else {
            // Old format: step_order as array of indices (for backward compatibility)
            $step_order = isset($_POST['step_order']) ? array_map('intval', $_POST['step_order']) : array();
            
            if (!$tour_id || empty($step_order)) {
                wp_send_json_error('Invalid parameters');
            }

            // Get current steps
            $current_steps = get_post_meta($tour_id, '_mcl_tour_steps', true) ?: array();
            
            // Validate step order
            if (count($step_order) !== count($current_steps)) {
                wp_send_json_error('Step count mismatch');
            }

            // Reorder steps based on new order
            $reordered_steps = array();
            foreach ($step_order as $old_index) {
                if (isset($current_steps[$old_index])) {
                    $reordered_steps[] = $current_steps[$old_index];
                }
            }
        }

        // Save reordered steps
        update_post_meta($tour_id, '_mcl_tour_steps', $reordered_steps);
        
        wp_send_json_success(array(
            'message' => 'Steps reordered successfully',
            'steps' => $reordered_steps
        ));
    }

    /**
     * Handle checking/unchecking checklist items from tour steps
     */
    public function tour_step_check_item() {
        // Check for tour nonces or checklist nonces
        $nonce_verified = false;
        if (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_tour_admin')) {
            $nonce_verified = true;
        } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_tour_public')) {
            $nonce_verified = true;
        } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_ajax_nonce')) {
            $nonce_verified = true;
        } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_ajax_nopriv_nonce')) {
            $nonce_verified = true;
        }
        
        if (!$nonce_verified) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('MCL Tour Admin: tour_step_check_item - Invalid nonce');
            }
            wp_send_json_error('Invalid nonce');
        }

        $checklist_id = intval($_POST['checklist_id']);
        $item_id = sanitize_text_field($_POST['item_id']);
        $checked = filter_var($_POST['checked'], FILTER_VALIDATE_BOOLEAN);

        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('MCL Tour Admin: tour_step_check_item called with checklist_id=' . $checklist_id . ', item_id=' . $item_id . ', checked=' . ($checked ? 'true' : 'false'));
        }

        if (!$checklist_id || !$item_id) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('MCL Tour Admin: tour_step_check_item - Invalid parameters');
            }
            wp_send_json_error('Invalid parameters');
        }

        // Check if user can interact with this checklist
        if (!$this->can_user_interact_with_checklist($checklist_id)) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('MCL Tour Admin: tour_step_check_item - Permission denied for checklist ' . $checklist_id);
            }
            wp_send_json_error('You do not have permission to interact with this checklist');
        }

        // Get current checked state
        $checked_state = $this->get_checked_state($checklist_id);
        $original_state = $checked_state;

        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('MCL Tour Admin: tour_step_check_item - Original checked state: ' . json_encode($checked_state));
        }

        // Update checked state
        if ($checked) {
            if (!in_array($item_id, $checked_state)) {
                $checked_state[] = $item_id;
            }
        } else {
            $checked_state = array_diff($checked_state, array($item_id));
            // Re-index array to prevent gaps that could cause object conversion
            $checked_state = array_values($checked_state);
        }

        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('MCL Tour Admin: tour_step_check_item - New checked state: ' . json_encode($checked_state));
        }

        // Save checked state
        $this->save_checked_state($checklist_id, $checked_state);

        // Verify the save worked by getting the state again
        $saved_state = $this->get_checked_state($checklist_id);
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('MCL Tour Admin: tour_step_check_item - Verified saved state: ' . json_encode($saved_state));
        }

        wp_send_json_success(array(
            'message' => $checked ? 'Item checked' : 'Item unchecked',
            'checked' => $checked,
            'checklist_id' => $checklist_id,
            'item_id' => $item_id,
            'original_state' => $original_state,
            'new_state' => $checked_state,
            'saved_state' => $saved_state
        ));
    }

    /**
     * Get checked state for a checklist (similar to dashboard widget)
     */
    private function get_checked_state($checklist_id) {
        $is_public = get_post_meta($checklist_id, '_mcl_public_access', true) == '1';
        
        if ($is_public) {
            $handling = get_post_meta($checklist_id, '_mcl_public_checked_state_handling', true) ?: 'per_user';
        } else {
            $handling = get_post_meta($checklist_id, '_mcl_checked_state_handling', true) ?: 'global';
        }
        
        if ($handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            $checked_state = get_user_meta($user_id, "_mcl_drawer_checked_state_" . $checklist_id, true);
        } else {
            $checked_state = get_post_meta($checklist_id, '_mcl_checked_state', true);
        }
        
        // Ensure we always return a proper array, not an object
        if (!is_array($checked_state)) {
            return array();
        }
        
        // Re-index the array to ensure it's a proper indexed array, not an associative array
        return array_values($checked_state);
    }

    /**
     * Save checked state for a checklist (similar to dashboard widget)
     */
    private function save_checked_state($checklist_id, $checked_state) {
        // Ensure we're saving a proper indexed array
        $checked_state = array_values(array_filter($checked_state));
        
        $is_public = get_post_meta($checklist_id, '_mcl_public_access', true) == '1';
        
        if ($is_public) {
            $handling = get_post_meta($checklist_id, '_mcl_public_checked_state_handling', true) ?: 'per_user';
        } else {
            $handling = get_post_meta($checklist_id, '_mcl_checked_state_handling', true) ?: 'global';
        }
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('MCL Tour Admin: save_checked_state - checklist_id=' . $checklist_id . ', is_public=' . ($is_public ? 'true' : 'false') . ', handling=' . $handling . ', checked_state=' . json_encode($checked_state));
        }
        
        if ($handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            $result = update_user_meta($user_id, "_mcl_drawer_checked_state_" . $checklist_id, $checked_state);
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('MCL Tour Admin: save_checked_state - Saved to user meta for user ' . $user_id . ', result=' . ($result ? 'success' : 'failure'));
            }
        } else {
            $result = update_post_meta($checklist_id, '_mcl_checked_state', $checked_state);
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('MCL Tour Admin: save_checked_state - Saved to post meta, result=' . ($result ? 'success' : 'failure'));
            }
        }
    }

    /**
     * Check if user can interact with checklist (similar to dashboard widget)
     */
    private function can_user_interact_with_checklist($checklist_id) {
        if (!class_exists('MCL_Permissions')) {
            return false;
        }
        
        $permissions = new MCL_Permissions();
        return $permissions->has_permission($checklist_id, 'interact');
    }

    /**
     * Get tour connections for a checklist item
     */
    public function get_item_tour_connections() {
        // Check for tour nonces or checklist nonces
        $nonce_verified = false;
        if (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_tour_admin')) {
            $nonce_verified = true;
        } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_tour_public')) {
            $nonce_verified = true;
        } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_ajax_nonce')) {
            $nonce_verified = true;
        } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_ajax_nopriv_nonce')) {
            $nonce_verified = true;
        }
        
        if (!$nonce_verified) {
            wp_send_json_error('Invalid nonce');
        }

        $checklist_id = intval($_POST['checklist_id']);
        $item_id = sanitize_text_field($_POST['item_id']);

        if (!$checklist_id || !$item_id) {
            wp_send_json_error('Invalid parameters');
        }

        // Get all active tours
        $tours = get_posts(array(
            'post_type' => 'mcl_tour',
            'posts_per_page' => -1,
            'meta_query' => array(
                array(
                    'key' => '_mcl_tour_active',
                    'value' => '1',
                    'compare' => '='
                )
            )
        ));

        $connections = array();

        foreach ($tours as $tour) {
            $steps = get_post_meta($tour->ID, '_mcl_tour_steps', true) ?: array();
            
            foreach ($steps as $step_index => $step) {
                if (!empty($step['checklist_id']) && !empty($step['checklist_item_id']) &&
                    $step['checklist_id'] == $checklist_id && $step['checklist_item_id'] == $item_id) {
                    
                    $connections[] = array(
                        'tour_id' => $tour->ID,
                        'tour_title' => $tour->post_title,
                        'step_index' => $step_index,
                        'step_title' => !empty($step['title']) ? $step['title'] : sprintf(__('Step %d', 'magic-checklists'), $step_index + 1),
                        'step_content' => !empty($step['content']) ? wp_trim_words(strip_tags($step['content']), 10) : ''
                    );
                }
            }
        }

        wp_send_json_success(array(
            'connections' => $connections,
            'checklist_id' => $checklist_id,
            'item_id' => $item_id
        ));
    }

    /**
     * Get tours list for React component
     */
    public function get_tours_list() {
        check_ajax_referer('mcl_tour_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $tours = get_posts(array(
            'post_type' => 'mcl_tour',
            'posts_per_page' => -1,
            'orderby' => 'date',
            'order' => 'DESC'
        ));

        $tours_data = array();
        foreach ($tours as $tour) {
            $steps = get_post_meta($tour->ID, '_mcl_tour_steps', true) ?: array();
            $is_active = get_post_meta($tour->ID, '_mcl_tour_active', true);
            $trigger_type = get_post_meta($tour->ID, '_mcl_tour_trigger_type', true) ?: 'page';
            $trigger_value = get_post_meta($tour->ID, '_mcl_tour_trigger_value', true) ?: '';
            $user_condition = get_post_meta($tour->ID, '_mcl_tour_user_condition', true) ?: 'all_users';
            $autostart = get_post_meta($tour->ID, '_mcl_tour_autostart', true);

            $tours_data[] = array(
                'id' => $tour->ID,
                'title' => $tour->post_title,
                'step_count' => count($steps),
                'active' => (bool)$is_active,
                'trigger_type' => $trigger_type,
                'trigger_value' => $trigger_value,
                'user_condition' => $user_condition,
                'autostart' => (bool)$autostart,
                'date' => $tour->post_date
            );
        }

        wp_send_json_success($tours_data);
    }

    /**
     * Duplicate a tour
     */
    public function duplicate_tour() {
        check_ajax_referer('mcl_tour_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $tour_id = intval($_POST['tour_id']);
        $original_tour = get_post($tour_id);
        
        if (!$original_tour || $original_tour->post_type !== 'mcl_tour') {
            wp_send_json_error('Tour not found');
        }

        // Create new tour
        $new_tour_data = array(
            'post_title' => $original_tour->post_title . ' (Copy)',
            'post_content' => $original_tour->post_content,
            'post_type' => 'mcl_tour',
            'post_status' => 'publish'
        );

        $new_tour_id = wp_insert_post($new_tour_data);
        
        if (!$new_tour_id || is_wp_error($new_tour_id)) {
            wp_send_json_error('Failed to duplicate tour');
        }

        // Copy all meta data
        $meta_keys = array(
            '_mcl_tour_steps',
            '_mcl_tour_settings',
            '_mcl_tour_active',
            '_mcl_tour_trigger_type',
            '_mcl_tour_trigger_value',
            '_mcl_tour_user_condition',
            '_mcl_tour_specific_users',
            '_mcl_tour_specific_roles',
            '_mcl_tour_show_once',
            '_mcl_tour_autostart'
        );

        foreach ($meta_keys as $meta_key) {
            $meta_value = get_post_meta($tour_id, $meta_key, true);
            if ($meta_value !== '') {
                update_post_meta($new_tour_id, $meta_key, $meta_value);
            }
        }

        // Set the duplicate as inactive by default
        update_post_meta($new_tour_id, '_mcl_tour_active', 0);

        wp_send_json_success(array(
            'tour_id' => $new_tour_id,
            'message' => 'Tour duplicated successfully'
        ));
    }

    /**
     * Get users for tour user condition selection
     */
    public function get_users_for_tour() {
        check_ajax_referer('mcl_tour_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $users = get_users(array('number' => 100));
        $users_data = array();

        foreach ($users as $user) {
            $users_data[] = array(
                'id' => $user->ID,
                'display_name' => $user->display_name,
                'email' => $user->user_email
            );
        }

        wp_send_json_success($users_data);
    }

    /**
     * Get roles for tour user condition selection
     */
    public function get_roles_for_tour() {
        check_ajax_referer('mcl_tour_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $roles = wp_roles()->get_names();
        $roles_data = array();

        foreach ($roles as $role_key => $role_name) {
            $roles_data[] = array(
                'key' => $role_key,
                'name' => $role_name
            );
        }

        wp_send_json_success($roles_data);
    }

    /**
     * Add tour-related nonces to admin data for React components
     */
    public function add_tour_nonces_to_admin_data($data) {
        if (!isset($data['nonces'])) {
            $data['nonces'] = array();
        }
        
        $data['nonces']['mcl_tour_admin'] = wp_create_nonce('mcl_tour_admin');
        $data['dashboard_url'] = admin_url('index.php');
        
        return $data;
    }
}
