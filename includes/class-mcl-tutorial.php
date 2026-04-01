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

class MAGICCL_Tutorial {

    private static $instance = null;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct() {
        add_action('wp_ajax_magiccl_create_tutorial_checklist', array($this, 'ajax_create_tutorial_checklist'));
    }

    /**
     * Check and create tutorial checklist on fresh installs only
     */
    public function maybe_create_on_activation() {
        // Check if tutorial was already created
        if (get_option('magiccl_tutorial_checklist_created')) {
            return;
        }

        // Check if any checklists already exist (not a fresh install)
        $existing_checklists = get_posts(array(
            'post_type' => 'magiccl_checklist',
            'posts_per_page' => 1,
            'post_status' => 'any',
            'fields' => 'ids'
        ));

        if (!empty($existing_checklists)) {
            // Mark as "created" to prevent future attempts
            update_option('magiccl_tutorial_checklist_created', '1');
            return;
        }

        // Create the tutorial checklist
        $this->create_tutorial_checklist();
    }

    /**
     * AJAX handler for on-demand tutorial creation
     */
    public function ajax_create_tutorial_checklist() {
        check_ajax_referer('magiccl_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('You do not have permission to perform this action.', 'magicchecklists')));
            return;
        }

        // Check if tutorial already exists
        $existing_tutorial = get_posts(array(
            'post_type' => 'magiccl_checklist',
            'meta_key' => '_magiccl_is_tutorial',
            'meta_value' => '1',
            'posts_per_page' => 1,
            'post_status' => 'any',
            'fields' => 'ids'
        ));

        if (!empty($existing_tutorial)) {
            wp_send_json_error(array('message' => __('Tutorial checklist already exists.', 'magicchecklists')));
            return;
        }

        $checklist_id = $this->create_tutorial_checklist();

        if ($checklist_id) {
            wp_send_json_success(array(
                'message' => __('Tutorial checklist created successfully!', 'magicchecklists'),
                'checklist_id' => $checklist_id
            ));
        } else {
            wp_send_json_error(array('message' => __('Failed to create tutorial checklist.', 'magicchecklists')));
        }
    }

    /**
     * Check if tutorial checklist exists
     *
     * @return bool
     */
    public function tutorial_exists() {
        $existing_tutorial = get_posts(array(
            'post_type' => 'magiccl_checklist',
            'meta_key' => '_magiccl_is_tutorial',
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
            'post_title'   => __('Getting Started with MagicChecklists', 'magicchecklists'),
            'post_content' => __('Welcome! This tutorial checklist will help you learn how to use MagicChecklists. Feel free to check off items as you explore, or delete this checklist once you\'re familiar with the plugin.', 'magicchecklists'),
            'post_type'    => 'magiccl_checklist',
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
                'content' => __('Click on any item to edit its text', 'magicchecklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Check items off by clicking the checkbox', 'magicchecklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Go to Settings to configure your preferred language', 'magicchecklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Create a new checklist by clicking "Add New" on the plugin page', 'magicchecklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Use keyboard shortcuts: press Enter to add new items', 'magicchecklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Drag and drop items to reorder them', 'magicchecklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Enable the floating button or keyboard shortcut to access checklists from any page', 'magicchecklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Explore the different checklist types: Classic, Publisher, and Tours', 'magicchecklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
            array(
                'id' => 'tutorial_' . wp_generate_uuid4(),
                'content' => __('Delete this tutorial checklist when you\'re ready!', 'magicchecklists'),
                'priority' => 'none',
                'parent_id' => '',
                'locked' => 0
            ),
        );

        // Save checklist meta
        update_post_meta($checklist_id, '_magiccl_items', $tutorial_items);
        update_post_meta($checklist_id, '_magiccl_active', '1');
        update_post_meta($checklist_id, '_magiccl_checklist_type', 'classic');
        update_post_meta($checklist_id, '_magiccl_is_tutorial', '1');

        // Enable floating button
        update_post_meta($checklist_id, '_magiccl_trigger_button', '1');
        update_post_meta($checklist_id, '_magiccl_button_position', 'bottom-right');
        update_post_meta($checklist_id, '_magiccl_short_title', __('Tutorial', 'magicchecklists'));

        // Restrict to administrators only
        update_post_meta($checklist_id, '_magiccl_access_roles', array('administrator'));
        update_post_meta($checklist_id, '_magiccl_access_roles_permission', 'edit');

        // Do not allow public access
        update_post_meta($checklist_id, '_magiccl_public_access', '0');

        // Load on all admin pages for admins
        update_post_meta($checklist_id, '_magiccl_load_everywhere', '1');
        update_post_meta($checklist_id, '_magiccl_allowed_pages', array());
        update_post_meta($checklist_id, '_magiccl_allowed_urls', array());

        // Set default theme and other settings
        update_post_meta($checklist_id, '_magiccl_theme', 'default');
        update_post_meta($checklist_id, '_magiccl_checked_state_handling', 'global');
        update_post_meta($checklist_id, '_magiccl_keyboard_shortcut', '');
        update_post_meta($checklist_id, '_magiccl_trigger_shortcut', '0');
        update_post_meta($checklist_id, '_magiccl_priority', 'none');
        update_post_meta($checklist_id, '_magiccl_enable_item_priority', '0');
        update_post_meta($checklist_id, '_magiccl_show_description', '1');

        // Mark tutorial as created
        update_option('magiccl_tutorial_checklist_created', '1');

        return $checklist_id;
    }
}
