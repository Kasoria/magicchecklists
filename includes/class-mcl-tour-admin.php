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
        
        // Enqueue sortable.js for drag and drop functionality
        wp_enqueue_script(
            'sortable-js',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/vendor/sortable.min.js',
            array(),
            '1.15.0',
            true
        );
        
        // Enqueue tour admin scripts
        wp_enqueue_script(
            'mcl-tour-admin',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/mcl-tour-admin.js',
            array('wp-util', 'sortable-js'),
            MAGIC_CHECKLISTS_VERSION,
            true
        );
        
        // Make sure ajaxurl is available for inline scripts
        wp_add_inline_script('mcl-tour-admin', 'var ajaxurl = "' . admin_url('admin-ajax.php') . '";', 'before');

        // Always localize script data for tours page
        wp_localize_script('mcl-tour-admin', 'mclTourAdmin', array(
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

        wp_enqueue_style(
            'mcl-tour-admin',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/mcl-tour-admin.css',
            array(),
            MAGIC_CHECKLISTS_VERSION
        );



        // Enqueue WordPress media uploader
        wp_enqueue_media();
        
        // Enqueue TinyMCE
        wp_enqueue_editor();
    }

    public function render_tours_page() {
        // Check if we're in creation or edit mode
        $creation_mode = isset($_GET['create']) ? true : false;
        $edit_id = isset($_GET['edit']) ? intval($_GET['edit']) : 0;
        
        if ($creation_mode || $edit_id) {
            // Show the tour settings page
            include MAGIC_CHECKLISTS_ADMIN_PATH . 'views/tours/mcl-tour-settings.php';
        } else {
            // Show the tours list
            include MAGIC_CHECKLISTS_ADMIN_PATH . 'views/tours/mcl-tours-list.php';
        }
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
        $settings = $_POST['settings']; // Already an array from the frontend
        
        // Get trigger settings
        $trigger_type = sanitize_text_field($_POST['trigger_type'] ?? 'page');
        $trigger_value = sanitize_text_field($_POST['trigger_value'] ?? '');
        $user_condition = sanitize_text_field($_POST['user_condition'] ?? 'all_users');
        $specific_users = isset($_POST['specific_users']) && is_array($_POST['specific_users']) ? array_map('intval', $_POST['specific_users']) : array();
        $specific_roles = isset($_POST['specific_roles']) && is_array($_POST['specific_roles']) ? array_map('sanitize_text_field', $_POST['specific_roles']) : array();
        
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

        // Save tour meta
        update_post_meta($tour_id, '_mcl_tour_settings', $settings);
        update_post_meta($tour_id, '_mcl_tour_active', isset($settings['active']) ? 1 : 0);
        update_post_meta($tour_id, '_mcl_tour_autostart', isset($settings['autostart']) ? 1 : 0);
        update_post_meta($tour_id, '_mcl_tour_show_once', ! empty($settings['show_once']) ? 1 : 0);
        
        // Save trigger settings
        update_post_meta($tour_id, '_mcl_tour_trigger_type', $trigger_type);
        update_post_meta($tour_id, '_mcl_tour_trigger_value', $trigger_value);
        update_post_meta($tour_id, '_mcl_tour_user_condition', $user_condition);
        update_post_meta($tour_id, '_mcl_tour_specific_users', $specific_users);
        update_post_meta($tour_id, '_mcl_tour_specific_roles', $specific_roles);

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
        check_ajax_referer('mcl_tour_admin', 'nonce');

        $tour_id = intval($_POST['tour_id']);
        $tour = get_post($tour_id);
        
        if (!$tour || $tour->post_type !== 'mcl_tour') {
            wp_send_json_error('Tour not found');
        }

        $data = array(
            'id' => $tour_id,
            'title' => $tour->post_title,
            'steps' => get_post_meta($tour_id, '_mcl_tour_steps', true) ?: array(),
            'settings' => get_post_meta($tour_id, '_mcl_tour_settings', true) ?: array(),
            'active' => get_post_meta($tour_id, '_mcl_tour_active', true) ? true : false,
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
            wp_send_json_error('Invalid nonce');
        }

        $checklist_id = intval($_POST['checklist_id']);
        $item_id = sanitize_text_field($_POST['item_id']);
        $checked = filter_var($_POST['checked'], FILTER_VALIDATE_BOOLEAN);

        if (!$checklist_id || !$item_id) {
            wp_send_json_error('Invalid parameters');
        }

        // Check if user can interact with this checklist
        if (!$this->can_user_interact_with_checklist($checklist_id)) {
            wp_send_json_error('You do not have permission to interact with this checklist');
        }

        // Get current checked state
        $checked_state = $this->get_checked_state($checklist_id);

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

        // Save checked state
        $this->save_checked_state($checklist_id, $checked_state);

        wp_send_json_success(array(
            'message' => $checked ? 'Item checked' : 'Item unchecked',
            'checked' => $checked
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
        
        if ($handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            update_user_meta($user_id, "_mcl_drawer_checked_state_" . $checklist_id, $checked_state);
        } else {
            update_post_meta($checklist_id, '_mcl_checked_state', $checked_state);
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
}
