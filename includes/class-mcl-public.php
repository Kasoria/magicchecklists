<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class MCL_Public {

    private $meta_keys = [
        '_mcl_time_date',
        '_mcl_items',
        '_mcl_keyboard_shortcut',
        '_mcl_active',
        '_mcl_checked_state_handling',
        '_mcl_theme',
        '_mcl_priority',
        '_mcl_enable_item_priority',
        '_mcl_trigger_shortcut',
        '_mcl_trigger_button',
        '_mcl_short_title',
        '_mcl_public_access',
        '_mcl_public_permission',
        '_mcl_public_checked_state_handling',
        '_mcl_public_description',
        '_mcl_priority_display_type',
        '_mcl_checked_state',             
        '_mcl_public_global_checked_state',
        '_mcl_enable_rate_limit',
        '_mcl_access_roles',
        '_mcl_access_roles_permission',
        '_mcl_access_users',
        '_mcl_access_users_permission',
        '_mcl_load_everywhere',
        '_mcl_allowed_pages',
        '_mcl_allowed_urls'
    ];

    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_footer', array($this, 'render_checklist_drawer'));
        add_action('admin_footer', array($this, 'render_checklist_drawer'));
        add_action('wp_ajax_mcl_update_checklist', array($this, 'update_checklist'));
        add_action('wp_ajax_nopriv_mcl_update_checklist', array($this, 'update_checklist'));
        add_action('wp_ajax_mcl_get_checklist', array($this, 'get_checklist'));
        add_action('wp_ajax_mcl_save_checked_state', array($this, 'save_checked_state'));
        add_action('wp_footer', array($this, 'render_floating_buttons'));
        add_action('admin_footer', array($this, 'render_floating_buttons'));
        add_action('wp_ajax_nopriv_mcl_get_checklist', array($this, 'get_checklist'));
        add_action('wp_ajax_nopriv_mcl_save_checked_state', array($this, 'save_checked_state'));
        add_action('init', array($this, 'maybe_set_invite_token_cookie'));
        add_action('wp_ajax_mcl_release_lock', array($this, 'release_checklist_lock'));
        add_action('wp_ajax_nopriv_mcl_release_lock', array($this, 'release_checklist_lock'));
    }

    private function should_load_assets() {
        if (!$this->has_any_checklist_access()) {
            return false;
        }
    
        // Get active checklists
        $active_checklists = get_posts(array(
            'post_type' => 'mcl_checklist',
            'meta_key' => '_mcl_active',
            'meta_value' => '1',
            'posts_per_page' => -1
        ));
    
        foreach ($active_checklists as $checklist) {
            // Skip if user doesn't have access
            if (!$this->has_permission($checklist->ID, 'view')) {
                continue;
            }
    
            // Check if drawer is disabled in shortcode settings
            $shortcode_settings = MCL_Admin::get_shortcode_settings($checklist->ID);
            $drawer_disabled = !empty($shortcode_settings['disable_drawer']);
    
            // Skip this checklist if drawer is disabled
            if ($drawer_disabled) {
                continue;
            }
    
            // Get loading conditions for this checklist
            $load_everywhere = get_post_meta($checklist->ID, '_mcl_load_everywhere', true);
            
            if ($load_everywhere) {
                // If any checklist is set to load everywhere, we need the assets
                return true;
            }
    
            // Check WordPress admin pages
            $allowed_pages = get_post_meta($checklist->ID, '_mcl_allowed_pages', true) ?: array();
            if (!empty($allowed_pages) && $this->is_allowed_admin_page($allowed_pages)) {
                return true;
            }
    
            // Check custom URLs
            $allowed_urls = get_post_meta($checklist->ID, '_mcl_allowed_urls', true) ?: array();
            if (!empty($allowed_urls) && $this->matches_url_pattern($allowed_urls)) {
                // If this checklist is allowed on this URL, we need the assets
                return true;
            }
        }
    
        return false;
    }

    private function should_show_checklist($checklist_id) {
        // First check basic access permission
        if (!$this->has_permission($checklist_id, 'view')) {
            return false;
        }
    
        // Get loading conditions for this specific checklist
        $load_everywhere = get_post_meta($checklist_id, '_mcl_load_everywhere', true);
        
        if ($load_everywhere) {
            return true;
        }
    
        // Check WordPress admin pages
        $allowed_pages = get_post_meta($checklist_id, '_mcl_allowed_pages', true) ?: array();
        if (!empty($allowed_pages) && $this->is_allowed_admin_page($allowed_pages)) {
            return true;
        }
    
        // Check custom URLs
        $allowed_urls = get_post_meta($checklist_id, '_mcl_allowed_urls', true) ?: array();
        if (!empty($allowed_urls) && $this->matches_url_pattern($allowed_urls)) {
            return true;
        }
    
        return false;
    }

    private function is_allowed_admin_page($allowed_pages) {
        if (!is_admin() || empty($allowed_pages)) {
            return false;
        }
    
        global $pagenow, $plugin_page;
        
        // Get the current page identifier
        $current_page = '';
        
        // Check if we're on a plugin page
        if (!empty($plugin_page)) {
            $current_page = $plugin_page;
        } else {
            // Handle core pages
            $current_page = str_replace('.php', '', $pagenow);
            
            // Map core pages
            $page_mapping = array(
                'index' => 'dashboard',
                'edit' => 'posts',
                'upload' => 'media',
                'edit-comments' => 'comments',
                'themes' => 'themes',
                'plugins' => 'plugins',
                'users' => 'users',
                'tools' => 'tools',
                'options-general' => 'settings'
            );
            
            $current_page = isset($page_mapping[$current_page]) ? $page_mapping[$current_page] : $current_page;
        }
    
        // Add current page parameters if they exist
        if (!empty($_GET['post_type'])) {
            $current_page .= '&post_type=' . sanitize_text_field($_GET['post_type']);
        }
        if (!empty($_GET['taxonomy'])) {
            $current_page .= '&taxonomy=' . sanitize_text_field($_GET['taxonomy']);
        }
    
        return in_array($current_page, $allowed_pages);
    }
    
    private function matches_url_pattern($allowed_urls) {
        if (empty($allowed_urls)) {
            return false;
        }
    
        $current_url = $_SERVER['REQUEST_URI'];
    
        foreach ($allowed_urls as $pattern) {
            $pattern = trim($pattern);
            if (empty($pattern)) continue;
    
            // Convert wildcard pattern to regex
            $regex = str_replace(
                array('\*', '\?'),
                array('.*', '.'),
                preg_quote($pattern, '/')
            );
    
            if (preg_match('/^' . $regex . '$/', $current_url)) {
                return true;
            }
        }
    
        return false;
    }

    /**
     * Centralized permission check method
     */
    private function has_permission($checklist_id, $required_permission = 'view') {
        // If user is administrator, they have all permissions
        if ($this->is_administrator()) {
            return true;
        }

        // Check for invite token
        $token_data = $this->get_invite_token_data();
        if ($token_data && $token_data->checklist_id == $checklist_id) {
            // Check if token grants required permission
            if ($this->token_grants_permission($token_data, $required_permission)) {
                return true;
            }
        }

        // Check public access
        $public_access = get_post_meta($checklist_id, '_mcl_public_access', true) == '1';
        if ($public_access) {
            $public_permission = get_post_meta($checklist_id, '_mcl_public_permission', true) ?: 'interact';
            if ($this->permission_sufficient($public_permission, $required_permission)) {
                return true;
            }
        }

        // If user is logged in, check role and user permissions
        if (is_user_logged_in()) {
            // Check role-based permissions
            if ($this->has_role_access($checklist_id, $required_permission)) {
                return true;
            }
            // Check user-specific permissions
            if ($this->has_user_access($checklist_id, $required_permission)) {
                return true;
            }
        }

        // No permission
        return false;
    }

    private function token_grants_permission($token_data, $required_permission) {
        // Check permission hierarchy
        $permissions_hierarchy = ['view' => 0, 'interact' => 1, 'edit' => 2];
        $token_permission_level = $permissions_hierarchy[$token_data->permissions] ?? -1;
        $required_permission_level = $permissions_hierarchy[$required_permission] ?? -1;

        return $token_permission_level >= $required_permission_level;
    }

    private function permission_sufficient($current_permission, $required_permission) {
        // Check permission hierarchy
        $permissions_hierarchy = ['view' => 0, 'interact' => 1, 'edit' => 2];
        $current_permission_level = $permissions_hierarchy[$current_permission] ?? -1;
        $required_permission_level = $permissions_hierarchy[$required_permission] ?? -1;

        return $current_permission_level >= $required_permission_level;
    }

    /**
     * Check if user has access based on their role
     */
    private function has_role_access($checklist_id, $required_permission = 'view') {
        if (!is_user_logged_in()) {
            return false;
        }

        $user = wp_get_current_user();
        $allowed_roles = get_post_meta($checklist_id, '_mcl_access_roles', true) ?: array();
        $roles_permission = get_post_meta($checklist_id, '_mcl_access_roles_permission', true) ?: 'interact';

        // Check if user has any of the allowed roles
        $user_roles = (array) $user->roles;
        $has_allowed_role = array_intersect($allowed_roles, $user_roles);

        if (!$has_allowed_role) {
            return false;
        }

        // Check if roles permission is sufficient
        return $this->permission_sufficient($roles_permission, $required_permission);
    }

    /**
     * Check if user has access based on individual user permissions
     */
    private function has_user_access($checklist_id, $required_permission = 'view') {
        if (!is_user_logged_in()) {
            return false;
        }

        $user_id = get_current_user_id();
        $allowed_users = get_post_meta($checklist_id, '_mcl_access_users', true) ?: array();
        $users_permission = get_post_meta($checklist_id, '_mcl_access_users_permission', true) ?: 'interact';

        if (!in_array($user_id, $allowed_users)) {
            return false;
        }

        // Check if user's permission is sufficient
        return $this->permission_sufficient($users_permission, $required_permission);
    }

    /**
     * Check if current user has access to any checklists
     * This determines whether to load assets
     */
    private function has_any_checklist_access() {
        // If user is admin, they have access
        if ($this->is_administrator()) {
            return true;
        }

        // Check for invite token
        $token_data = $this->get_invite_token_data();
        if ($token_data) {
            return true;
        }

        // Check for public checklists
        $public_checklists = get_posts(array(
            'post_type' => 'mcl_checklist',
            'meta_query' => array(
                'relation' => 'AND',
                array(
                    'key' => '_mcl_active',
                    'value' => '1'
                ),
                array(
                    'key' => '_mcl_public_access',
                    'value' => '1'
                )
            ),
            'posts_per_page' => 1,
            'fields' => 'ids'
        ));

        if (!empty($public_checklists)) {
            return true;
        }

        // If user is logged in, check role and user access
        if (is_user_logged_in()) {

            $active_checklists = get_posts(array(
                'post_type' => 'mcl_checklist',
                'meta_key' => '_mcl_active',
                'meta_value' => '1',
                'posts_per_page' => -1,
                'fields' => 'ids'
            ));

            foreach ($active_checklists as $checklist_id) {
                if ($this->has_permission($checklist_id, 'view')) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get checklist with all metadata in a single query
     */
    private function get_checklist_with_meta($checklist_id) {
        global $wpdb;

        // Get the post first
        $checklist = get_post($checklist_id);
        if (!$checklist) {
            return null;
        }

        // Check if user can access this checklist
        if (!$this->has_permission($checklist_id, 'view')) {
            return null;
        }

        // Get all metadata in a single query
        $meta_list = $wpdb->get_results($wpdb->prepare("
            SELECT meta_key, meta_value 
            FROM $wpdb->postmeta 
            WHERE post_id = %d 
            AND meta_key IN ('" . implode("','", $this->meta_keys) . "')",
            $checklist_id
        ), OBJECT_K);

        // Create metadata array with default values
        $metadata = array_fill_keys($this->meta_keys, '');

        // Fill in actual values
        foreach ($meta_list as $meta) {
            $metadata[$meta->meta_key] = maybe_unserialize($meta->meta_value);
        }

        return [
            'post' => $checklist,
            'meta' => $metadata
        ];
    }

    /**
     * Handle retrieving a checklist
     */
    public function get_checklist() {
        try {
            // Modified nonce check to account for invite tokens
            if (is_user_logged_in() && (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'mcl_ajax_nonce'))) {
                wp_send_json_error(array(
                    'message' => 'Invalid nonce',
                    'code' => 403
                ));
                return;
            }
            
            // Get checklist ID first
            $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
            if (!$checklist_id) {
                wp_send_json_error(array(
                    'message' => 'Invalid checklist ID',
                    'code' => 400
                ));
                return;
            }

            // Get user identifier
            $user_identifier = $this->get_current_user_identifier();

            // Check for existing lock
            $can_edit = $this->has_permission($checklist_id, 'edit');

            // Initialize lock variables
            $locked = false;
            $locked_message = '';

            if ($can_edit) {
                // Get user identifier
                $user_identifier = $this->get_current_user_identifier();

                // Check for existing lock
                $lock = $this->get_lock($checklist_id);

                if ($lock && $lock['user'] !== $user_identifier) {
                    // Checklist is locked by another user
                    $locked = true;
                    $locked_message = 'This checklist is currently being edited by another user.';
                } else {
                    // Acquire or refresh the lock
                    $this->set_lock($checklist_id, $user_identifier);
                }
            }
            
            // Check if user has 'view' permission
            if (!$this->has_permission($checklist_id, 'view')) {
                wp_send_json_error(array(
                    'message' => 'Access denied',
                    'code' => 403
                ));
                return;
            }

            $was_reset = false;
            try {
                $was_reset = $this->check_and_handle_reset($checklist_id);
            } catch (Exception $e) {
                error_log('Error handling reset check: ' . $e->getMessage());
            }
            $reset_enabled = get_post_meta($checklist_id, '_mcl_auto_reset', true) == '1';

            // Get checklist data with single query
            $checklist_data = $this->get_checklist_with_meta($checklist_id);
            if (!$checklist_data) {
                wp_send_json_error(array(
                    'message' => 'Checklist not found',
                    'code' => 404
                ));
                return;
            }

            $checklist = $checklist_data['post'];
            $meta = $checklist_data['meta'];

            $is_public = $meta['_mcl_public_access'] == '1';
            $checked_state_handling = $this->get_checked_state_handling($checklist_id);
            $enable_rate_limit = $meta['_mcl_enable_rate_limit'];

            // Determine permissions
            $can_edit = $this->has_permission($checklist_id, 'edit');
            $can_interact = $this->has_permission($checklist_id, 'interact');

            // Get the appropriate checked state
            $checked_state = $this->get_checked_state($checklist_id);
            $tags = get_post_meta($checklist_id, '_mcl_tags', true) ?: array();

            $data = array(
                'title' => $checklist->post_title,
                'description' => $checklist->post_content,
                'time_date' => $meta['_mcl_time_date'],
                'items' => $meta['_mcl_items'],
                'checked_state' => $checked_state,
                'theme' => $meta['_mcl_theme'] ?: 'light',
                'priority' => $meta['_mcl_priority'] ?: 'none',
                'enable_item_priority' => (bool)$meta['_mcl_enable_item_priority'],
                'priority_display_type' => $meta['_mcl_priority_display_type'] ?: 'color',
                'can_edit' => $can_edit,
                'can_check' => $can_interact,
                'can_view' => true,
                'is_public' => $is_public,
                'public_permission' => $is_public ? $this->get_public_permission_level($checklist_id) : null,
                'checked_state_handling' => $checked_state_handling,
                'public_description' => $meta['_mcl_public_description'],
                'enable_rate_limit' => !empty($enable_rate_limit),
                'checklist_id' => $checklist_id,
                'tags' => $tags,
                'access_info' => array(
                    'is_admin' => $this->is_administrator()
                ),
                'locked' => $locked,
                'locked_message' => $locked_message,
                'reset_info' => array(
                    'enabled' => $reset_enabled,
                    'was_reset' => $was_reset,
                    'reset_counter' => get_post_meta($checklist_id, '_mcl_reset_counter', true) ?: 1,
                    'next_reset' => get_post_meta($checklist_id, '_mcl_reset_next', true)
                )
            );

            if (ob_get_length()) ob_clean();
            wp_send_json_success($data);

        } catch (Exception $e) {
            error_log('Error in get_checklist: ' . $e->getMessage());
            if (ob_get_length()) ob_clean();
            wp_send_json_error(array(
                'message' => 'Server error',
                'code' => 500,
                'debug' => $e->getMessage()
            ));
        }
    }
    
    /**
     * Get active checklists that should show floating buttons
     */
    private function get_visible_checklists() {
        $query_args = array(
            'post_type' => 'mcl_checklist',
            'meta_query' => array(
                'relation' => 'AND',
                array(
                    'key' => '_mcl_active',
                    'value' => '1'
                ),
                array(
                    'key' => '_mcl_trigger_button',
                    'value' => '1'
                )
            )
        );
    
        $checklists = get_posts($query_args);
    
        // Filter based on access AND visibility conditions
        return array_filter($checklists, function($checklist) {
            return $this->should_show_checklist($checklist->ID);
        });
    }

    private function get_public_permission_level($checklist_id) {
        $public_access = get_post_meta($checklist_id, '_mcl_public_access', true);
        if (!$public_access) {
            return false;
        }
    
        // Get specific public permission level (defaults to 'interact' for backward compatibility)
        return get_post_meta($checklist_id, '_mcl_public_permission', true) ?: 'interact';
    }

    /**
     * Get and validate invite token data from query parameters
     * @return array|null Token data if valid, null if not
     */
    private function get_invite_token_data() {
        // First check if we have a token in the URL
        if (isset($_GET['mcl_invite'])) {
            $token = sanitize_text_field($_GET['mcl_invite']);
            return $this->validate_invite_token($token);
        }

        // Check for stored token in AJAX request
        if (wp_doing_ajax()) {
            $stored_token = isset($_POST['stored_token']) ? sanitize_text_field($_POST['stored_token']) : '';
            if ($stored_token) {
                return $this->validate_invite_token($stored_token);
            }
        }

        // Check for invite token in cookie
        if (isset($_COOKIE['mcl_invite_token'])) {
            $token = sanitize_text_field($_COOKIE['mcl_invite_token']);
            return $this->validate_invite_token($token);
        }

        return null;
    } 

    private function is_administrator() {
        if (!is_user_logged_in()) {
            return false;
        }
        $user = wp_get_current_user();
        return in_array('administrator', (array) $user->roles);
    }

    private function get_current_user_identifier() {
        if (is_user_logged_in()) {
            return 'user_' . get_current_user_id();
        } else {
            // For logged-out users, use a cookie to store a unique ID
            if (isset($_COOKIE['mcl_user_id'])) {
                return 'guest_' . sanitize_text_field($_COOKIE['mcl_user_id']);
            } else {
                // Generate a unique ID and set it in a cookie
                $unique_id = uniqid('guest_', true);
                setcookie('mcl_user_id', $unique_id, time() + (365 * DAY_IN_SECONDS), COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
                return 'guest_' . $unique_id;
            }
        }
    }
    
    private function get_lock($checklist_id) {
        $lock = get_post_meta($checklist_id, '_mcl_lock', true);
        if (!empty($lock)) {
            // Check if lock has expired
            $lock_duration = 5 * MINUTE_IN_SECONDS; 
            if (time() - $lock['timestamp'] > $lock_duration) {
                // Lock has expired, release it
                delete_post_meta($checklist_id, '_mcl_lock');
                return false;
            } else {
                return $lock;
            }
        }
        return false;
    }
    
    private function set_lock($checklist_id, $user_identifier) {
        $lock = array(
            'user' => $user_identifier,
            'timestamp' => time()
        );
        update_post_meta($checklist_id, '_mcl_lock', $lock);
    }
    
    private function release_lock($checklist_id, $user_identifier) {
        $lock = $this->get_lock($checklist_id);
        if ($lock && $lock['user'] === $user_identifier) {
            delete_post_meta($checklist_id, '_mcl_lock');
        }
    }
    
    private function refresh_lock($checklist_id, $user_identifier) {
        $lock = $this->get_lock($checklist_id);
        if ($lock && $lock['user'] === $user_identifier) {
            $this->set_lock($checklist_id, $user_identifier);
        }
    }

    public function release_checklist_lock() {
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
    
        if (!$checklist_id) {
            wp_send_json_error('Invalid checklist ID', 400);
            return;
        }
    
        // Check if the user has edit permissions
        if (!$this->has_permission($checklist_id, 'edit')) {
            wp_send_json_error('You do not have permission to edit this checklist.', 403);
            return;
        }
    
        $user_identifier = $this->get_current_user_identifier();
    
        $this->release_lock($checklist_id, $user_identifier);
    
        wp_send_json_success();
    }

    public function enqueue_scripts($hook) {
        if (!$this->should_load_assets()) {
            return;
        }

        if (!$this->has_any_checklist_access()) {
            return;
        }

        // Don't load on edit page
        if ($hook === 'magicchecklists_page_mcl_add_new') {
            return;
        }
    
        // Check if any active checklist has floating buttons enabled
        $has_floating_buttons = $this->has_active_floating_buttons();
    
        wp_enqueue_script(
            'interactjs', 
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/vendor/interact.min.js',
            array(), 
            '1.15.3', 
            true
        );
        
        // Enqueue Sortable.js first
        wp_enqueue_script(
            'sortablejs', 
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/vendor/sortable.min.js',
            array(), 
            '1.15.3', 
            true
        );
    
        wp_register_script(
            'mcl-window-checker',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/modules/mcl-window-checker.js',
            array(),
            MAGIC_CHECKLISTS_VERSION,
            true
        );
    
        wp_register_script(
            'mcl-drawer',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/mcl-drawer.js',
            array('mcl-window-checker', 'interactjs'),
            MAGIC_CHECKLISTS_VERSION,
            true
        );
    
        // CSS files
        wp_enqueue_style(
            'mcl-drawer',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-drawer.css',
            array(),
            MAGIC_CHECKLISTS_VERSION
        );
    
        wp_enqueue_style(
            'mcl-animations',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-animations.css',
            array('mcl-drawer'),
            MAGIC_CHECKLISTS_VERSION
        );
    
        // Only enqueue floating button styles if needed
        if ($has_floating_buttons) {
            wp_enqueue_style(
                'mcl-floating-button',
                MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-floating-button.css',
                array('mcl-drawer'),
                MAGIC_CHECKLISTS_VERSION
            );
        }
    
        // Define the boot script as the main entry point
        wp_enqueue_script(
            'mcl-boot',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/mcl-boot.js',
            array('mcl-window-checker', 'mcl-drawer', 'sortablejs'),
            MAGIC_CHECKLISTS_VERSION,
            true
        );
    
        // Mark our boot script as a module
        add_filter('script_loader_tag', function($tag, $handle) {
            if (in_array($handle, ['mcl-window-checker', 'mcl-drawer', 'mcl-boot'])) {
                return str_replace(' src=', ' type="module" src=', $tag);
            }
            return $tag;
        }, 10, 2);
    
        // Localize script with our global settings
        $localized_data = array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mcl_ajax_nonce'),
            'shortcuts' => $this->get_accessible_shortcuts(),
            'priority_colors' => MCL_Priority_Utils::get_priority_colors(),
            'priority_numbers' => MCL_Priority_Utils::get_priority_numbers(),
            'user_access' => array(
                'is_admin' => $this->is_administrator(),
                'is_logged_in' => is_user_logged_in(),
                'public_only' => !$this->is_administrator()
            ),
            'settings' => array(
                'enable_navigation' => MCL_Settings::get_setting('enable_checklist_navigation', false)
            ),
            'i18n' => array(
                'uncheckAllConfirm' => __('Are you sure you want to uncheck all items? This cannot be undone.', 'magic-checklists')
            )
        );

        if (isset($_GET['mcl_invite'])) {
            $token = sanitize_text_field($_GET['mcl_invite']);
            $token_data = $this->validate_invite_token($token);
            if ($token_data) {
                $localized_data['invite_token'] = array(
                    'token' => $token,
                    'checklist_id' => $token_data->checklist_id,
                    'permissions' => $token_data->permissions,
                    'expiry_date' => $token_data->expiry_date
                );
            }
        }

        if (is_user_logged_in()) {
            $localized_data['nonce'] = wp_create_nonce('mcl_ajax_nonce');
            $localized_data['user_id'] = get_current_user_id();
        }

        $localized_data = apply_filters('mcl_localized_data', $localized_data);
        wp_localize_script('mcl-boot', 'mcl_checklists', $localized_data);
    }

    /**
     * Get shortcuts only for accessible checklists
     */
    private function get_accessible_shortcuts() {
        global $wpdb;

        // Get all active checklists with their metadata in a single query
        $query = $wpdb->prepare("
            SELECT p.ID, p.post_type, pm.meta_key, pm.meta_value
            FROM $wpdb->posts p
            LEFT JOIN $wpdb->postmeta pm ON p.ID = pm.post_id
            WHERE p.post_type = %s 
            AND p.post_status = 'publish'
            AND EXISTS (
                SELECT 1 FROM $wpdb->postmeta 
                WHERE post_id = p.ID 
                AND meta_key = '_mcl_active' 
                AND meta_value = '1'
            )
            AND (
                EXISTS (
                    SELECT 1 FROM $wpdb->postmeta 
                    WHERE post_id = p.ID 
                    AND meta_key = '_mcl_public_access' 
                    AND meta_value = '1'
                )
                OR EXISTS (
                    SELECT 1 FROM $wpdb->postmeta 
                    WHERE post_id = p.ID 
                    AND meta_key = '_mcl_trigger_shortcut' 
                    AND meta_value = '1'
                )
            )
            AND pm.meta_key IN ('_mcl_keyboard_shortcut', '_mcl_public_access', '_mcl_checked_state_handling')",
            'mcl_checklist'
        );

        $results = $wpdb->get_results($query);

        $shortcuts = [];
        $checklist_meta = [];

        // Organize metadata
        foreach ($results as $row) {
            if (!isset($checklist_meta[$row->ID])) {
                $checklist_meta[$row->ID] = [];
            }
            $checklist_meta[$row->ID][$row->meta_key] = $row->meta_value;
        }

        // Build shortcuts array
        foreach ($checklist_meta as $id => $meta) {
            // Check both permission and visibility conditions
            if (!$this->should_show_checklist($id)) {
                continue;
            }
    
            $shortcut = $meta['_mcl_keyboard_shortcut'] ?? '';
            if ($shortcut) {
                $shortcuts[$id] = array(
                    'shortcut' => $shortcut,
                    'can_edit' => $this->has_permission($id, 'edit'),
                    'public_access' => ($meta['_mcl_public_access'] ?? '') == '1',
                    'checked_state_handling' => $this->get_checked_state_handling($id)
                );
            }
        }
    
        return $shortcuts;
    }

    /**
     * Get appropriate checked state handling method considering permissions
     */
    private function get_checked_state_handling($checklist_id, $context = 'drawer') {
        if ($context === 'shortcode') {
            $settings = MCL_Admin::get_shortcode_settings($checklist_id);
            return $settings['check_state'] ?? 'session';
        }

        $is_public = get_post_meta($checklist_id, '_mcl_public_access', true) == '1';
        
        if ($is_public) {
            return get_post_meta($checklist_id, '_mcl_public_checked_state_handling', true) ?: 'per_user';
        }
        
        return get_post_meta($checklist_id, '_mcl_checked_state_handling', true) ?: 'global';
    }

    /**
     * Check if any active checklists have floating buttons enabled
     *
     * @return bool
     */
    private function has_active_floating_buttons() {
        $active_checklists = $this->get_visible_checklists();
        return !empty($active_checklists);
    }

    /**
     * Get active shortcuts for all active checklists
     */
    private function get_active_shortcuts() {
        $active_checklists = get_posts(array(
            'post_type' => 'mcl_checklist',
            'meta_query' => array(
                'relation' => 'AND',
                array(
                    'key' => '_mcl_active',
                    'value' => '1'
                ),
                array(
                    'key' => '_mcl_trigger_shortcut',
                    'value' => '1'
                )
            ),
            'posts_per_page' => -1,
            'post_status' => 'publish',
        ));
    
        $shortcuts = array();
        foreach ($active_checklists as $checklist) {
            $shortcut = get_post_meta($checklist->ID, '_mcl_keyboard_shortcut', true);
            if ($shortcut) {
                $shortcuts[$checklist->ID] = $shortcut;
            }
        }
    
        return $shortcuts;
    }

    /**
     * Render the checklist drawer
     */
    public function render_checklist_drawer() {
        // Get the current screen
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        
        // Don't render on edit page
        if ($screen && $screen->id === 'magicchecklists_page_mcl_add_new') {
            return;
        }

        // Only render if user has access
        if ($this->has_any_checklist_access() && $this->should_load_assets()) {
            include MAGIC_CHECKLISTS_PLUGIN_PATH . 'public/views/mcl-drawer-container.php';
        }
    }

    public function render_floating_buttons() {
        // Get the current screen
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        
        // Don't render on edit page
        if ($screen && $screen->id === 'magicchecklists_page_mcl_add_new') {
            return;
        }

        // Only render if there are checklists to show
        if (!$this->should_load_assets() || !$this->has_active_floating_buttons()) {
            return;
        }

        // Get active checklists that have button trigger enabled
        $active_checklists = $this->get_visible_checklists();
        
        // Add window check via inline script
        ?>
        <script>
            // Only proceed if this is the main window
            if (window === window.top) {
                document.currentScript.insertAdjacentHTML('afterend', `
                    <?php include MAGIC_CHECKLISTS_PLUGIN_PATH . 'public/views/mcl-floating-button.php'; ?>
                `);
            }
        </script>
        <?php
    }

    /**
     * Helper method to check if we should render on current page
     * @return bool
     */
    private function should_render_on_current_page() {
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        
        // Don't render on edit page
        if ($screen && $screen->id === 'magicchecklists_page_mcl_add_new') {
            return false;
        }

        return true;
    }

    /**
     * Handle retrieving a checklist
     */
    public function update_checklist() {
        try {
            // Get checklist ID
            $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
            if (!$checklist_id) {
                wp_send_json_error([
                    'message' => 'Invalid checklist ID',
                    'code' => 400
                ]);
                return;
            }

            // Check if user has 'edit' permission
            if (!$this->has_permission($checklist_id, 'edit')) {
                wp_send_json_error([
                    'message' => 'Unauthorized - Edit permissions required',
                    'code' => 403
                ]);
                return;
            }

            // Get user identifier
            $user_identifier = $this->get_current_user_identifier();

            // Verify lock ownership
            $lock = $this->get_lock($checklist_id);
            if (!$lock || $lock['user'] !== $user_identifier) {
                wp_send_json_error([
                    'message' => 'You do not own the lock on this checklist.',
                    'code' => 403
                ]);
                return;
            }

            // Refresh the lock
            $this->set_lock($checklist_id, $user_identifier);

            // Process items
            $items = isset($_POST['items']) ? $_POST['items'] : array();
            $title = isset($_POST['title']) ? sanitize_text_field($_POST['title']) : '';

            // Process items
            $processed_items = array();
            if (is_array($items)) {
                foreach ($items as $item) {
                    if (isset($item['id'], $item['content'])) {
                        $processed_items[] = array(
                            'id' => sanitize_text_field($item['id']),
                            'content' => MCL_Sanitization::sanitize_item_content($item['content']),
                            'priority' => isset($item['priority']) ? sanitize_text_field($item['priority']) : 'none'
                        );
                    }
                }
            }

            // Update post title if provided
            if ($title) {
                $update_result = wp_update_post(array(
                    'ID' => $checklist_id,
                    'post_title' => $title
                ));

                if (is_wp_error($update_result)) {
                    error_log('Failed to update checklist title: ' . $update_result->get_error_message());
                    wp_send_json_error([
                        'message' => 'Failed to update title',
                        'code' => 500
                    ]);
                    return;
                }
            }

            $old_items = get_post_meta($checklist_id, '_mcl_items', true);
            if (!is_array($old_items)) {
                $old_items = array();
            }

            // After processing the new $processed_items array as you currently do...
            // Compare old and new items
            $old_map = array();
            foreach ($old_items as $old_item) {
                $old_map[$old_item['id']] = $old_item;
            }

            $new_map = array();
            foreach ($processed_items as $new_item) {
                $new_map[$new_item['id']] = $new_item;
            }

            // Detect added items (in new_map but not in old_map)
            foreach ($new_map as $id => $item) {
                if (!isset($old_map[$id])) {
                    // This is a newly added item
                    do_action('mcl_item_added', $checklist_id, $item);
                }
            }

            // Detect deleted items (in old_map but not in new_map)
            foreach ($old_map as $id => $item) {
                if (!isset($new_map[$id])) {
                    // This item was deleted
                    do_action('mcl_item_deleted', $checklist_id, $item);
                }
            }


            // Update items
            $meta_result = update_post_meta($checklist_id, '_mcl_items', $processed_items);

            // Check if update failed
            if ($meta_result === false) {
                // Fetch existing value to compare
                $existing_items = get_post_meta($checklist_id, '_mcl_items', true);
                if ($existing_items !== $processed_items) {
                    // Update failed and values are different—this is an error
                    error_log('Failed to update checklist items for ID: ' . $checklist_id);
                    wp_send_json_error([
                        'message' => 'Failed to update items',
                        'code' => 500
                    ]);
                    return;
                }
                // Values are the same; consider the update successful
            }

            wp_send_json_success();

        } catch (Exception $e) {
            error_log('Error in update_checklist: ' . $e->getMessage());
            wp_send_json_error([
                'message' => 'Server error',
                'code' => 500
            ]);
        }
    }

    /**
     * Get checked state based on access type and handling method
     */
    private function get_checked_state($checklist_id, $context = 'drawer') {
        $handling = $this->get_checked_state_handling($checklist_id, $context);
        
        if ($handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            return get_user_meta($user_id, "_mcl_{$context}_checked_state_" . $checklist_id, true) ?: array();
        }
        
        $meta_key = $context === 'shortcode' ? '_mcl_shortcode_checked_state' : '_mcl_checked_state';
        return get_post_meta($checklist_id, $meta_key, true) ?: array();
    }

    /**
     * Handle saving the checked state
     */
    public function save_checked_state() {
        $checklist_id = intval($_POST['checklist_id']);
        $context = sanitize_text_field($_POST['context'] ?? 'drawer'); // 'drawer' or 'shortcode'
        
        // Verify nonce for logged-in users
        if (is_user_logged_in()) {
            if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'mcl_ajax_nonce')) {
                wp_send_json_error('Invalid nonce', 403);
                return;
            }
        }
        
        // Check interaction permission
        if (!$this->has_permission($checklist_id, 'interact')) {
            wp_send_json_error('You do not have permission to interact with this checklist', 403);
            return;
        }
    
        // Get the newly submitted checked items
        $checked_items = isset($_POST['checked_items']) ? 
            array_map('sanitize_text_field', $_POST['checked_items']) : array();
        
        // Get the old checked items state to detect changes
        $old_checked_items = $this->get_checked_state($checklist_id, $context);
    
        // Get checked state handling method based on context
        $checked_state_handling = $this->get_checked_state_handling($checklist_id, $context);
    
        // Update the checked state based on handling method
        if ($checked_state_handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            update_user_meta($user_id, "_mcl_{$context}_checked_state_" . $checklist_id, $checked_items);
        } else if ($checked_state_handling === 'global') {
            $meta_key = $context === 'shortcode' ? '_mcl_shortcode_checked_state' : '_mcl_checked_state';
            update_post_meta($checklist_id, $meta_key, $checked_items);
        }
    
        // Trigger notifications if items have been checked or unchecked
        foreach ($checked_items as $item_id) {
            if (!in_array($item_id, $old_checked_items)) {
                do_action('mcl_item_checked', $checklist_id, $item_id, true, $context);
            }
        }
    
        foreach ($old_checked_items as $item_id) {
            if (!in_array($item_id, $checked_items)) {
                do_action('mcl_item_unchecked', $checklist_id, $item_id, false, $context);
            }
        }
    
        wp_send_json_success();
    }

    private function validate_invite_token($token, $increment_usage = true) {
        static $validated_tokens = [];
        
        // Return cached validation result if available
        if (isset($validated_tokens[$token])) {
            return $validated_tokens[$token];
        }
    
        if (empty($token)) {
            error_log('MCL: Empty token provided');
            return false;
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'mcl_invite_links';
        
        // Get the current time in MySQL format
        $current_time = current_time('mysql', true);
        
        $query = $wpdb->prepare(
            "SELECT * FROM {$table_name} 
            WHERE token = %s 
            AND expiry_date > %s
            AND (usage_limit = 0 OR usage_count < usage_limit)",
            $token,
            $current_time
        );
        
        $link = $wpdb->get_row($query);
        
        if (!$link) {
            error_log('MCL: Invalid or expired token');
            return false;
        }
    
        if ($increment_usage && 
            !isset($validated_tokens[$token]) && 
            !$this->has_user_used_token($token)) {
            
            $wpdb->update(
                $table_name,
                array('usage_count' => $link->usage_count + 1),
                array('id' => $link->id),
                array('%d'),
                array('%d')
            );
            $link->usage_count++;
            
            // Mark token as used for this user
            $this->mark_token_as_used($token);
        }
        
        // Cache the result
        $validated_tokens[$token] = $link;
        
        return $link;
    }

    public function handle_invite_token() {
        check_ajax_referer('mcl_ajax_nonce', 'nonce');
        
        $token = isset($_POST['token']) ? sanitize_text_field($_POST['token']) : '';
        $link = $this->validate_invite_token($token);
        
        if (!$link) {
            wp_send_json_error('Invalid or expired invite link');
            return;
        }
        
        $token_data = array(
            'checklist_id' => $link->checklist_id,
            'permissions' => $link->permissions,
            'expiry' => strtotime($link->expiry_date)
        );
        
        wp_send_json_success($token_data);
    }

    public function maybe_set_invite_token_cookie() {
        // Check for invite token in URL
        if (isset($_GET['mcl_invite'])) {
            $token = sanitize_text_field($_GET['mcl_invite']);
    
            if ($this->validate_invite_token($token)) {
                // Valid token found, set cookie
                setcookie('mcl_invite_token', $token, time() + (7 * 24 * 60 * 60), COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
                error_log('MCL: Valid invite token found in URL. Cookie set.');
    
                // Optionally, redirect to remove the token from the URL
                // wp_redirect(remove_query_arg('mcl_invite'));
                // exit;
            } else {
                error_log('MCL: Invalid or expired invite token in URL.');
            }
        }
    }

    private function has_user_used_token($token) {
        // Check cookie first
        if (isset($_COOKIE['mcl_used_tokens'])) {
            $used_tokens = json_decode(stripslashes($_COOKIE['mcl_used_tokens']), true);
            if (is_array($used_tokens) && in_array($token, $used_tokens)) {
                return true;
            }
        }
        
        // Check localStorage through JavaScript
        return false;
    }
    
    private function mark_token_as_used($token) {
        // Store in cookie
        $used_tokens = array();
        if (isset($_COOKIE['mcl_used_tokens'])) {
            $used_tokens = json_decode(stripslashes($_COOKIE['mcl_used_tokens']), true);
        }
        if (!is_array($used_tokens)) {
            $used_tokens = array();
        }
        
        if (!in_array($token, $used_tokens)) {
            $used_tokens[] = $token;
            setcookie(
                'mcl_used_tokens',
                json_encode($used_tokens),
                time() + (365 * DAY_IN_SECONDS),
                COOKIEPATH,
                COOKIE_DOMAIN,
                is_ssl(),
                true
            );
        }
    }

    private function check_and_handle_reset($checklist_id) {
        try {
            $auto_reset = get_post_meta($checklist_id, '_mcl_auto_reset', true);
            if (!$auto_reset) {
                return false;
            }
    
            $next_reset = get_post_meta($checklist_id, '_mcl_reset_next', true);
            if (!$next_reset) {
                return false;
            }
    
            $now = current_time('timestamp');
    
            if ($now >= $next_reset) {
                // Perform reset
                return $this->perform_checklist_reset($checklist_id);
            }
    
            return false;
        } catch (Exception $e) {
            error_log('Error in check_and_handle_reset: ' . $e->getMessage());
            return false;
        }
    }
    
    private function perform_checklist_reset($checklist_id) {
        try {
            // Get current settings
            $reset_interval = get_post_meta($checklist_id, '_mcl_reset_interval', true) ?: 'daily';
            $reset_time = get_post_meta($checklist_id, '_mcl_reset_time', true) ?: '00:00';
    
            // Calculate next reset time
            $time_parts = explode(':', $reset_time);
            $hours = intval($time_parts[0]);
            $minutes = intval($time_parts[1]);
    
            $now = current_time('timestamp');
            $today = strtotime(date('Y-m-d', $now) . " {$hours}:{$minutes}:00");
            $next = $today;
    
            // Calculate next reset based on interval
            switch ($reset_interval) {
                case 'daily':
                    $next = strtotime('+1 day', $today);
                    break;
    
                case 'weekly':
                    $next = strtotime('next monday', $today);
                    break;
    
                case 'monthly':
                    $next = strtotime('first day of next month', $today);
                    break;
    
                case 'custom':
                    $custom_days = get_post_meta($checklist_id, '_mcl_custom_days', true) ?: 1;
                    $next = strtotime("+{$custom_days} days", $today);
                    break;
            }
    
            // Update next reset time
            update_post_meta($checklist_id, '_mcl_reset_next', $next);
    
            // Increment reset counter
            $reset_counter = intval(get_post_meta($checklist_id, '_mcl_reset_counter', true)) ?: 1;
            update_post_meta($checklist_id, '_mcl_reset_counter', $reset_counter + 1);
    
            // Clear checked states based on handling type
            $checked_state_handling = get_post_meta($checklist_id, '_mcl_checked_state_handling', true);
            $is_public = get_post_meta($checklist_id, '_mcl_public_access', true) == '1';

            if ($checked_state_handling === 'global') {
                // Clear global checked state
                update_post_meta($checklist_id, '_mcl_checked_state', array());
            } else {
                // Clear per-user states
                global $wpdb;
                $meta_key = '_mcl_checked_state_' . $checklist_id;
                $wpdb->delete(
                    $wpdb->usermeta,
                    array('meta_key' => $meta_key),
                    array('%s')
                );
            }
    
            return true;
        } catch (Exception $e) {
            error_log('Error in perform_checklist_reset: ' . $e->getMessage());
            return false;
        }
    }
}
