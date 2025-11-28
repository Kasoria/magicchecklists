<?php
/**
 * Tutorial Checklist Handler
 *
 * Creates and manages the tutorial checklist for new users.
 *
 * @package MagicChecklists
 */

if (!defined('ABSPATH')) {
    exit;
}

class MCL_Tutorial {

    private static $instance = null;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct() {
        add_action('wp_ajax_mcl_create_tutorial_checklist', array($this, 'ajax_create_tutorial_checklist'));
    }

    /**
     * Check and create tutorial checklist on fresh installs only
     */
    public function maybe_create_on_activation() {
        // Check if tutorial was already created
        if (get_option('mcl_tutorial_checklist_created')) {
            return;
        }

        // Check if any checklists already exist (not a fresh install)
        $existing_checklists = get_posts(array(
            'post_type' => 'mcl_checklist',
            'posts_per_page' => 1,
            'post_status' => 'any',
            'fields' => 'ids'
        ));

        if (!empty($existing_checklists)) {
            // Mark as "created" to prevent future attempts
            update_option('mcl_tutorial_checklist_created', '1');
            return;
        }

        // Create the tutorial checklist
        $this->create_tutorial_checklist();
    }

    /**
     * AJAX handler for on-demand tutorial creation
     */
    public function ajax_create_tutorial_checklist() {
        check_ajax_referer('mcl_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('You do not have permission to perform this action.', 'magic-checklists')));
            return;
        }

        // Check if tutorial already exists
        $existing_tutorial = get_posts(array(
            'post_type' => 'mcl_checklist',
            'meta_key' => '_mcl_is_tutorial',
            'meta_value' => '1',
            'posts_per_page' => 1,
            'post_status' => 'any',
            'fields' => 'ids'
        ));

        if (!empty($existing_tutorial)) {
            wp_send_json_error(array('message' => __('Tutorial checklist already exists.', 'magic-checklists')));
            return;
        }

        $checklist_id = $this->create_tutorial_checklist();

        if ($checklist_id) {
            wp_send_json_success(array(
                'message' => __('Tutorial checklist created successfully!', 'magic-checklists'),
                'checklist_id' => $checklist_id
            ));
        } else {
            wp_send_json_error(array('message' => __('Failed to create tutorial checklist.', 'magic-checklists')));
        }
    }

    /**
     * Check if tutorial checklist exists
     *
     * @return bool
     */
    public function tutorial_exists() {
        $existing_tutorial = get_posts(array(
            'post_type' => 'mcl_checklist',
            'meta_key' => '_mcl_is_tutorial',
            'meta_value' => '1',
            'posts_per_page' => 1,
            'post_status' => 'any',
            'fields' => 'ids'
        ));

        return !empty($existing_tutorial);
    }

    /**
     * Create the tutorial checklist with helpful onboarding items
     *
     * @return int|false Checklist ID on success, false on failure
     */
    public function create_tutorial_checklist() {
        $checklist_data = array(
            'post_title'   => __('Getting Started with MagicChecklists', 'magic-checklists'),
            'post_content' => __('Welcome! This tutorial checklist will help you learn how to use MagicChecklists. Feel free to check off items as you explore, or delete this checklist once you\'re familiar with the plugin.', 'magic-checklists'),
            'post_type'    => 'mcl_checklist',
            'post_status'  => 'publish',
        );

        $checklist_id = wp_insert_post($checklist_data);

        if (is_wp_error($checklist_id)) {
            return false;
        }

        // Create tutorial items
        $tutorial_items = array(
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Click on any item to edit its text', 'magic-checklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Check items off by clicking the checkbox', 'magic-checklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Go to Settings to configure your preferred language', 'magic-checklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Create a new checklist by clicking "Add New" on the plugin page', 'magic-checklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Use keyboard shortcuts: press Enter to add new items', 'magic-checklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Drag and drop items to reorder them', 'magic-checklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Enable the floating button or keyboard shortcut to access checklists from any page', 'magic-checklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Explore the different checklist types: Classic, Publisher, and Tours', 'magic-checklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Delete this tutorial checklist when you\'re ready!', 'magic-checklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
        );

        // Save checklist meta
        update_post_meta($checklist_id, '_mcl_items', $tutorial_items);
        update_post_meta($checklist_id, '_mcl_active', '1');
        update_post_meta($checklist_id, '_mcl_checklist_type', 'classic');
        update_post_meta($checklist_id, '_mcl_is_tutorial', '1');

        // Enable floating button
        update_post_meta($checklist_id, '_mcl_trigger_button', '1');
        update_post_meta($checklist_id, '_mcl_button_position', 'bottom-right');
        update_post_meta($checklist_id, '_mcl_short_title', __('Tutorial', 'magic-checklists'));

        // Restrict to administrators only
        update_post_meta($checklist_id, '_mcl_access_roles', array('administrator'));
        update_post_meta($checklist_id, '_mcl_access_roles_permission', 'edit');

        // Do not allow public access
        update_post_meta($checklist_id, '_mcl_public_access', '0');

        // Load on all admin pages for admins
        update_post_meta($checklist_id, '_mcl_load_everywhere', '1');
        update_post_meta($checklist_id, '_mcl_allowed_pages', array());
        update_post_meta($checklist_id, '_mcl_allowed_urls', array());

        // Set default theme and other settings
        update_post_meta($checklist_id, '_mcl_theme', 'default');
        update_post_meta($checklist_id, '_mcl_checked_state_handling', 'database');
        update_post_meta($checklist_id, '_mcl_keyboard_shortcut', '');
        update_post_meta($checklist_id, '_mcl_trigger_shortcut', '0');
        update_post_meta($checklist_id, '_mcl_priority', 'none');
        update_post_meta($checklist_id, '_mcl_enable_item_priority', '0');
        update_post_meta($checklist_id, '_mcl_show_description', '1');

        // Mark tutorial as created
        update_option('mcl_tutorial_checklist_created', '1');

        return $checklist_id;
    }
}
