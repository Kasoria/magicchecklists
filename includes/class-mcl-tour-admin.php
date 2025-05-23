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
            array('jquery', 'wp-util', 'sortable-js'),
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
        $step_order = $_POST['step_order']; // Array of step indices in new order
        
        if (!$tour_id || !is_array($step_order)) {
            wp_send_json_error('Invalid tour ID or step order format');
        }

        // Get current steps
        $current_steps = get_post_meta($tour_id, '_mcl_tour_steps', true) ?: array();
        
        if (empty($current_steps)) {
            wp_send_json_error('No steps found for this tour');
        }

        // Validate that all indices exist and are unique
        $expected_count = count($current_steps);
        $provided_count = count($step_order);
        
        if ($provided_count !== $expected_count) {
            wp_send_json_error("Step count mismatch. Expected {$expected_count}, got {$provided_count}");
        }

        // Reorder steps based on the new order
        $reordered_steps = array();
        foreach ($step_order as $old_index) {
            $old_index = intval($old_index);
            if (isset($current_steps[$old_index])) {
                $reordered_steps[] = $current_steps[$old_index];
            } else {
                wp_send_json_error("Invalid step index: {$old_index}");
            }
        }

        // Double-check we have the right number of steps
        if (count($reordered_steps) !== $expected_count) {
            wp_send_json_error('Step reordering failed: count mismatch after reordering');
        }

        // Save the reordered steps
        update_post_meta($tour_id, '_mcl_tour_steps', $reordered_steps);
        
        wp_send_json_success(array(
            'message' => 'Tour steps reordered successfully',
            'step_count' => count($reordered_steps)
        ));
    }
}
