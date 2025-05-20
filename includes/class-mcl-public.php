<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class MCL_Public {

    private $meta_keys = [
        '_mcl_time_date',
        '_mcl_items',
        '_mcl_items_in_progress',
        '_mcl_item_deadlines',
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
        '_mcl_allowed_urls',
        '_mcl_disable_in_builders',
        '_mcl_show_description',
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
        add_action('wp_ajax_mcl_save_in_progress', array($this, 'save_in_progress_state'));
        add_action('wp_ajax_nopriv_mcl_save_in_progress', array($this, 'save_in_progress_state'));
        add_action('wp_ajax_mcl_save_item_deadline', array($this, 'save_item_deadline'));
        add_action('wp_ajax_nopriv_mcl_save_item_deadline', array($this, 'save_item_deadline'));
        add_action('wp_ajax_mcl_clear_item_deadline', array($this, 'clear_item_deadline'));
        add_action('wp_ajax_nopriv_mcl_clear_item_deadline', array($this, 'clear_item_deadline'));
    }

    private function should_load_assets() {
        // for these posts (either directly here or within has_permission) should be efficient.
        $active_checklists = get_posts(array(
            'post_type' => 'mcl_checklist',
            'meta_key' => '_mcl_active',
            'meta_value' => '1',
            'posts_per_page' => -1
        ));

        if (empty($active_checklists)) {
            return false; // No active checklists, so no assets to load.
        }

        foreach ($active_checklists as $checklist_post_obj) {
            $checklist_id = $checklist_post_obj->ID;

            // First, check if the user has permission to view this specific checklist.
            if (!$this->has_permission($checklist_id, 'view')) {
                continue;
            }

            // Check if the drawer is disabled for this checklist via shortcode settings.
            // This is an external call; assuming MCL_Admin class handles any caching for its settings if needed.
            $shortcode_settings = MCL_Admin::get_shortcode_settings($checklist_id);
            if (!empty($shortcode_settings['disable_drawer'])) {
                continue;
            }

            // Now check the specific loading conditions for this checklist.
            // These get_post_meta calls should hit the WP object cache.
            $load_everywhere = get_post_meta($checklist_id, '_mcl_load_everywhere', true);
            if ($load_everywhere) {
                return true; // Found a reason to load assets, no need to check further.
            }

            $allowed_pages = get_post_meta($checklist_id, '_mcl_allowed_pages', true) ?: array();
            if (!empty($allowed_pages) && $this->is_allowed_admin_page($allowed_pages)) {
                return true; // Found a reason to load assets.
            }

            $allowed_urls = get_post_meta($checklist_id, '_mcl_allowed_urls', true) ?: array();
            if (!empty($allowed_urls) && $this->matches_url_pattern($allowed_urls)) {
                return true; // Found a reason to load assets.
            }
        }

        // If the loop completes without returning true, no checklist met the criteria for loading assets.
        return false;
    }

    private function should_show_checklist($checklist_id) {
        if (!$this->has_permission($checklist_id, 'view')) {
            return false;
        }
    
        $load_everywhere = get_post_meta($checklist_id, '_mcl_load_everywhere', true);
        
        if ($load_everywhere) {
            return true;
        }
    
        $allowed_pages = get_post_meta($checklist_id, '_mcl_allowed_pages', true) ?: array();
        if (!empty($allowed_pages) && $this->is_allowed_admin_page($allowed_pages)) {
            return true;
        }
    
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
        
        $current_page = '';
        
        if (!empty($plugin_page)) {
            $current_page = $plugin_page;
        } else {
            $current_page = str_replace('.php', '', $pagenow);
            
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
    public function has_permission($checklist_id, $required_permission = 'view') {
        if ($this->is_administrator()) {
            return true;
        }

        $token_data = $this->get_invite_token_data();
        if ($token_data && $token_data->checklist_id == $checklist_id) {
            if ($this->token_grants_permission($token_data, $required_permission)) {
                return true;
            }
        }

        $public_access = get_post_meta($checklist_id, '_mcl_public_access', true) == '1';
        if ($public_access) {
            $public_permission = get_post_meta($checklist_id, '_mcl_public_permission', true) ?: 'interact';
            if ($this->permission_sufficient($public_permission, $required_permission)) {
                return true;
            }
        }

        if (is_user_logged_in()) {
            if ($this->has_role_access($checklist_id, $required_permission)) {
                return true;
            }
            if ($this->has_user_access($checklist_id, $required_permission)) {
                return true;
            }
        }
        return false;
    }

    private function token_grants_permission($token_data, $required_permission) {
        $permissions_hierarchy = ['view' => 0, 'interact' => 1, 'edit' => 2];
        $token_permission_level = isset($token_data->permissions) ? ($permissions_hierarchy[$token_data->permissions] ?? -1) : -1;
        $required_permission_level = $permissions_hierarchy[$required_permission] ?? -1;
        return $token_permission_level >= $required_permission_level;
    }

    private function permission_sufficient($current_permission, $required_permission) {
        $permissions_hierarchy = ['view' => 0, 'interact' => 1, 'edit' => 2];
        $current_permission_level = $permissions_hierarchy[$current_permission] ?? -1;
        $required_permission_level = $permissions_hierarchy[$required_permission] ?? -1;
        return $current_permission_level >= $required_permission_level;
    }

    private function has_role_access($checklist_id, $required_permission = 'view') {
        if (!is_user_logged_in()) return false;

        $user = wp_get_current_user();
        $allowed_roles = get_post_meta($checklist_id, '_mcl_access_roles', true) ?: array();
        $roles_permission_setting = get_post_meta($checklist_id, '_mcl_access_roles_permission', true) ?: 'interact';

        $user_roles = (array) $user->roles;
        $has_allowed_role = !empty(array_intersect($allowed_roles, $user_roles));

        if (!$has_allowed_role) return false;

        return $this->permission_sufficient($roles_permission_setting, $required_permission);
    }

    private function has_user_access($checklist_id, $required_permission = 'view') {
        if (!is_user_logged_in()) return false;

        $user_id = get_current_user_id();
        $allowed_users = get_post_meta($checklist_id, '_mcl_access_users', true) ?: array();
        $users_permission_setting = get_post_meta($checklist_id, '_mcl_access_users_permission', true) ?: 'interact';

        if (!in_array($user_id, $allowed_users)) return false;

        return $this->permission_sufficient($users_permission_setting, $required_permission);
    }

    private function has_any_checklist_access() {
        if ($this->is_administrator()) {
            return true;
        }

        if ($this->get_invite_token_data()) {
            return true;
        }

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

    private function get_checklist_with_meta($checklist_id) {
        global $wpdb;

        $checklist = get_post($checklist_id);
        if (!$checklist) {
            return null;
        }

        if (!$this->has_permission($checklist_id, 'view')) {
            return null;
        }

        $meta_list = $wpdb->get_results($wpdb->prepare("
            SELECT meta_key, meta_value 
            FROM $wpdb->postmeta 
            WHERE post_id = %d 
            AND meta_key IN ('" . implode("','", $this->meta_keys) . "')",
            $checklist_id
        ), OBJECT_K);

        $metadata = array_fill_keys($this->meta_keys, '');

        foreach ($meta_list as $meta) {
            $metadata[$meta->meta_key] = maybe_unserialize($meta->meta_value);
        }

        $deadlines = $metadata['_mcl_item_deadlines'] ?: array();

        if (!empty($metadata['_mcl_items'])) {
            foreach ($metadata['_mcl_items'] as &$item) {
                $item['deadline'] = isset($deadlines[$item['id']]) ? $deadlines[$item['id']] : null;
                // Add locked flag to indicate items that cannot be edited or deleted
                $item['locked'] = isset($item['locked']) && $item['locked'] ? true : false;
            }
        }

        if ($metadata['_mcl_theme'] === 'custom') {
            $theme_class = 'mcl-theme-custom';
        } else {
            $theme_class = $metadata['_mcl_theme'] === 'dark' ? 'mcl-theme-dark' : 'mcl-theme-light';
        }

        return [
            'post' => $checklist,
            'meta' => $metadata,
            'theme_class' => $theme_class
        ];
    }

    public function get_checklist() {
        try {
            if (is_user_logged_in() && (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'mcl_ajax_nonce'))) {
                wp_send_json_error(array(
                    'message' => 'Invalid nonce',
                    'code' => 403
                ));
                return;
            }
            
            $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
            if (!$checklist_id) {
                wp_send_json_error(array(
                    'message' => 'Invalid checklist ID',
                    'code' => 400
                ));
                return;
            }

            // Optimized permission checking
            $user_can_edit = false;
            $user_can_interact = false;
            $user_can_view = false;

            if ($this->has_permission($checklist_id, 'edit')) {
                $user_can_edit = true;
                $user_can_interact = true;
                $user_can_view = true;
            } elseif ($this->has_permission($checklist_id, 'interact')) {
                $user_can_interact = true;
                $user_can_view = true;
            } elseif ($this->has_permission($checklist_id, 'view')) {
                $user_can_view = true;
            }

            // If user cannot even view, deny access
            if (!$user_can_view) {
                wp_send_json_error(array(
                    'message' => 'Access denied',
                    'code' => 403
                ));
                return;
            }

            $user_identifier = $this->get_current_user_identifier();
            $locked = false;
            $locked_message = '';

            // Lock checking logic using $user_can_edit
            if ($user_can_edit) {
                $lock = $this->get_lock($checklist_id);
                if ($lock && $lock['user'] !== $user_identifier) {
                    $locked = true;
                    $locked_message = 'This checklist is currently being edited by another user.';
                } else {
                    $this->set_lock($checklist_id, $user_identifier);
                }
            }
            
            // The $user_can_view check is already done above.
            // The get_checklist_with_meta method has its own internal view permission check for data integrity.

            $was_reset = false;
            try {
                $was_reset = $this->check_and_handle_reset($checklist_id);
            } catch (Exception $e) {
                error_log('Error handling reset check: ' . $e->getMessage());
            }
            $reset_enabled = get_post_meta($checklist_id, '_mcl_auto_reset', true) == '1';

            $checklist_data = $this->get_checklist_with_meta($checklist_id);
            // This check also implicitly relies on the permission check within get_checklist_with_meta
            if (!$checklist_data) {
                wp_send_json_error(array(
                    'message' => 'Checklist not found or no view permission after meta fetch',
                    'code' => 404
                ));
                return;
            }

            $checklist = $checklist_data['post'];
            $meta = $checklist_data['meta'];
            // If item locking enabled, merge per-user modifications with global items
            if (get_post_meta($checklist_id, '_mcl_enable_item_locking', true) && is_user_logged_in() && ! $user_can_edit) {
                $user_id = get_current_user_id();
                $user_items = get_user_meta($user_id, "_mcl_user_items_{$checklist_id}", true);
                if (is_array($user_items)) {
                    $global_items = isset($meta['_mcl_items']) && is_array($meta['_mcl_items']) ? $meta['_mcl_items'] : array();
                    // Index user items by ID for quick lookup
                    $user_map = array();
                    foreach ($user_items as $ui) {
                        if (isset($ui['id'])) {
                            $user_map[$ui['id']] = $ui;
                        }
                    }
                    $merged_items = array();
                    // Merge: override global items with user modifications, preserve locked flag
                    foreach ($global_items as $gi) {
                        $id = $gi['id'];
                        if (isset($user_map[$id])) {
                            $ui = $user_map[$id];
                            $merged_items[] = array(
                                'id'        => $id,
                                'content'   => isset($ui['content']) ? $ui['content'] : $gi['content'],
                                'parent_id' => isset($ui['parent_id']) ? $ui['parent_id'] : (isset($gi['parent_id']) ? $gi['parent_id'] : ''),
                                'priority'  => isset($ui['priority']) ? $ui['priority'] : (isset($gi['priority']) ? $gi['priority'] : 'none'),
                                'locked'    => !empty($gi['locked']),
                            );
                            unset($user_map[$id]);
                        } else {
                            $merged_items[] = $gi;
                        }
                    }
                    // Append new items added by user
                    foreach ($user_map as $ui) {
                        $merged_items[] = array(
                            'id'        => $ui['id'],
                            'content'   => $ui['content'],
                            'parent_id' => isset($ui['parent_id']) ? $ui['parent_id'] : '',
                            'priority'  => isset($ui['priority']) ? $ui['priority'] : 'none',
                            'locked'    => false,
                        );
                    }
                    $meta['_mcl_items'] = $merged_items;
                }
            }

            $is_public = $meta['_mcl_public_access'] == '1';
            $checked_state_handling = $this->get_checked_state_handling($checklist_id);
            $enable_rate_limit = $meta['_mcl_enable_rate_limit'];

            // Use the already determined permission flags
            // $can_edit is $user_can_edit
            // $can_interact is $user_can_interact

            $checked_state = $this->get_checked_state($checklist_id);
            $tags = get_post_meta($checklist_id, '_mcl_tags', true) ?: array();

            $data = array(
                'id' => $checklist_id,
                'title' => get_the_title($checklist_id),
                'description' => get_post_field('post_content', $checklist_id),
                'show_description' => get_post_meta($checklist_id, '_mcl_show_description', true),
                'is_public' => $is_public,
                'public_description' => get_post_meta($checklist_id, '_mcl_public_description', true),
                'time_date' => $meta['_mcl_time_date'],
                'items' => $meta['_mcl_items'],
                'items_in_progress' => $meta['_mcl_items_in_progress'] ?: array(),
                'checked_state' => $checked_state,
                'theme' => $meta['_mcl_theme'] ?: 'light',
                'priority' => $meta['_mcl_priority'] ?: 'none',
                'enable_item_priority' => (bool)$meta['_mcl_enable_item_priority'],
                'priority_display_type' => $meta['_mcl_priority_display_type'] ?: 'color',
                'can_edit' => $user_can_edit, // Use optimized flag
                'can_check' => $user_can_interact, // Use optimized flag
                'can_view' => $user_can_view, // Use optimized flag (always true if we reach here)
                'public_permission' => $is_public ? $this->get_public_permission_level($checklist_id) : null,
                'checked_state_handling' => $checked_state_handling,
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
     * Get active checklists that should show floating buttons, along with their theme.
     * Returns an array of [ 'id' => checklist_id, 'theme' => theme_value ]
     */
    private function get_visible_checklists_with_theme() {
        $query_args_base = array(
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
            ),
            'posts_per_page' => -1, // Get all matching

        );
    
        if ($this->is_inside_pagebuilder()) {
            $query_args_base['meta_query'][] = array(
                'relation' => 'OR',
                array(
                    'key' => '_mcl_disable_in_builders',
                    'compare' => 'NOT EXISTS'
                ),
                array(
                    'key' => '_mcl_disable_in_builders',
                    'value' => '0'
                )
            );
        }
    
        // Fetch full post objects. WP populates post meta cache by default.
        $active_checklists_posts = get_posts($query_args_base);
        $visible_checklists_data = [];
    
        foreach ($active_checklists_posts as $checklist_post) {
            $checklist_id = $checklist_post->ID;

            // Step 1: Check view permission first (this is crucial and involves its own meta checks)
            if (!$this->has_permission($checklist_id, 'view')) {
                continue; 
            }

            // Step 2: Inline loading condition checks (previously in should_show_checklist)
            // These get_post_meta calls should now hit the primed WP object cache.
            $is_visible_based_on_conditions = false;
            $load_everywhere = get_post_meta($checklist_id, '_mcl_load_everywhere', true);

            if ($load_everywhere) {
                $is_visible_based_on_conditions = true;
            } else {
                $allowed_pages = get_post_meta($checklist_id, '_mcl_allowed_pages', true) ?: array();
                if (!empty($allowed_pages) && $this->is_allowed_admin_page($allowed_pages)) {
                    $is_visible_based_on_conditions = true;
                } else {
                    $allowed_urls = get_post_meta($checklist_id, '_mcl_allowed_urls', true) ?: array();
                    if (!empty($allowed_urls) && $this->matches_url_pattern($allowed_urls)) {
                        $is_visible_based_on_conditions = true;
                    }
                }
            }

            if ($is_visible_based_on_conditions) {
                // If all checks pass (permission + loading conditions), get the theme.
                $theme = get_post_meta($checklist_id, '_mcl_theme', true);
                $visible_checklists_data[] = [
                    'id' => $checklist_id,
                    'theme' => $theme ?: 'light' // Default to light if not set
                ];
            }
        }
        return $visible_checklists_data;
    }

    private function get_public_permission_level($checklist_id) {
        $public_access = get_post_meta($checklist_id, '_mcl_public_access', true);
        if ($public_access != '1') {
            return false;
        }
        return get_post_meta($checklist_id, '_mcl_public_permission', true) ?: 'interact';
    }

    private function get_invite_token_data() {
        if (isset($_GET['mcl_invite'])) {
            $token = sanitize_text_field($_GET['mcl_invite']);
            return $this->validate_invite_token($token);
        }

        if (wp_doing_ajax()) {
            $stored_token = isset($_POST['stored_token']) ? sanitize_text_field($_POST['stored_token']) : '';
            if ($stored_token) {
                return $this->validate_invite_token($stored_token);
            }
        }

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
            if (isset($_COOKIE['mcl_user_id'])) {
                return 'guest_' . sanitize_text_field($_COOKIE['mcl_user_id']);
            } else {
                $unique_id = uniqid('guest_', true);
                setcookie('mcl_user_id', $unique_id, time() + (365 * DAY_IN_SECONDS), COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
                return 'guest_' . $unique_id;
            }
        }
    }
    
    private function get_lock($checklist_id) {
        $lock = get_post_meta($checklist_id, '_mcl_lock', true);
        if (!empty($lock)) {
            $lock_duration = 5 * MINUTE_IN_SECONDS; 
            if (time() - $lock['timestamp'] > $lock_duration) {
                delete_post_meta($checklist_id, '_mcl_lock');
                return false;
            }
            return $lock;
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

        if ($hook === 'magicchecklists_page_mcl_add_new') {
            return;
        }

        if (current_user_can('upload_files')) {
            wp_enqueue_media();
        }

        $is_bricks = false;
        $is_bricks_iframe = false;
        if (isset($_GET['bricks']) || 
            (function_exists('bricks_is_builder') && bricks_is_builder())) {
            $is_bricks = true;
            if (function_exists('bricks_is_builder_iframe') && bricks_is_builder_iframe()) {
                $is_bricks_iframe = true;
            }
        }

        if ($is_bricks) {
            wp_enqueue_script(
                'mcl-window-checker',
                MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/modules/mcl-bricks-iframe-checker.js',
                array(),
                MAGIC_CHECKLISTS_VERSION,
                true
            );
            if ($is_bricks_iframe) {
                return;
            }
        }
    
        // Use the new method to get visible checklists with their themes
        $visible_checklists_for_theme = $this->get_visible_checklists_with_theme();
        $has_floating_buttons = !empty($visible_checklists_for_theme); // Determine if any buttons should show based on this
    
        wp_enqueue_script(
            'interactjs', 
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/vendor/interact.min.js',
            array(), 
            '1.15.3', 
            true
        );
        
        wp_enqueue_script(
            'sortablejs', 
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/vendor/sortable.min.js',
            array(), 
            '1.15.3', 
            true
        );
    
        wp_register_script(
            'mcl-drawer',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/mcl-drawer.js',
            array('interactjs'),
            MAGIC_CHECKLISTS_VERSION,
            true
        );
    
        wp_enqueue_style(
            'mcl-fonts',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-fonts.css',
            array(),
            MAGIC_CHECKLISTS_VERSION
        );
        
        wp_enqueue_style(
            'mcl-drawer',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-drawer.css',
            array('mcl-fonts'),
            MAGIC_CHECKLISTS_VERSION
        );
    
        wp_enqueue_style(
            'mcl-animations',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-animations.css',
            array('mcl-drawer'),
            MAGIC_CHECKLISTS_VERSION
        );
    
        if ($has_floating_buttons) {
            wp_enqueue_style(
                'mcl-floating-button',
                MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-floating-button.css',
                array('mcl-drawer'),
                MAGIC_CHECKLISTS_VERSION
            );
        }

        // Iterate over the data which now includes the theme
        foreach ($visible_checklists_for_theme as $checklist_data) {
            if ($checklist_data['theme'] === 'custom') {
                $custom_css = $this->generate_custom_theme_css($checklist_data['id']);
                wp_add_inline_style('mcl-drawer', $custom_css);
            }
        }
    
        wp_enqueue_script(
            'mcl-boot',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/mcl-boot.js',
            array('mcl-drawer', 'sortablejs'),
            MAGIC_CHECKLISTS_VERSION,
            true
        );
    
        add_filter('script_loader_tag', function($tag, $handle) {
            if (in_array($handle, ['mcl-drawer', 'mcl-boot'])) {
                return str_replace(' src=', ' type="module" src=', $tag);
            }
            return $tag;
        }, 10, 2);
    
        $localized_data = array(
            'ajax_url' => admin_url('admin-ajax.php'),
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
            $token_from_url = sanitize_text_field($_GET['mcl_invite']);
            $token_data_obj = $this->get_invite_token_data(); 
            if ($token_data_obj && $token_data_obj->token === $token_from_url) {
                $localized_data['invite_token'] = array(
                    'token' => $token_from_url,
                    'checklist_id' => $token_data_obj->checklist_id,
                    'permissions' => $token_data_obj->permissions,
                    'expiry_date' => $token_data_obj->expiry_date
                );
            }
        }

        if (is_user_logged_in()) {
            $localized_data['nonce'] = wp_create_nonce('mcl_ajax_nonce');
            $localized_data['user_id'] = get_current_user_id();
        } else {
            $localized_data['nonce'] = wp_create_nonce('mcl_ajax_nopriv_nonce');
        }

        $localized_data = apply_filters('mcl_localized_data', $localized_data);
        wp_localize_script('mcl-boot', 'mcl_checklists', $localized_data);
    }

    /**
     * Get shortcuts only for accessible checklists
     */
    private function get_accessible_shortcuts() {
        global $wpdb;

        // Expanded list of meta keys to fetch
        $meta_keys_to_fetch = [
            '_mcl_keyboard_shortcut', 
            '_mcl_public_access', 
            '_mcl_checked_state_handling', 
            '_mcl_load_everywhere', 
            '_mcl_allowed_pages', 
            '_mcl_allowed_urls',
            '_mcl_public_checked_state_handling' // For get_checked_state_handling
        ];

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
            AND pm.meta_key IN ('" . implode("','", array_map('esc_sql', $meta_keys_to_fetch)) . "')",
            'mcl_checklist'
        );

        $results = $wpdb->get_results($query);

        $shortcuts = [];
        $checklist_meta_organized = [];

        // Organize metadata by checklist ID
        foreach ($results as $row) {
            if (!isset($checklist_meta_organized[$row->ID])) {
                $checklist_meta_organized[$row->ID] = [];
            }
            // Unserialize if needed, though get_post_meta usually handles this.
            // For direct DB results, ensure it's handled if some values are serialized.
            // However, for these specific keys, they are likely simple values or arrays handled by maybe_unserialize later if needed.
            $checklist_meta_organized[$row->ID][$row->meta_key] = $row->meta_value;
        }

        // Build shortcuts array
        foreach ($checklist_meta_organized as $id => $meta) {
            // Default all meta values to avoid notices, and maybe_unserialize them
            // This ensures that if a meta key wasn't fetched for a particular post (e.g. not set), 
            // it will have a default value (null or empty string from maybe_unserialize).
            $current_meta = [];
            foreach($meta_keys_to_fetch as $key) {
                $current_meta[$key] = isset($meta[$key]) ? maybe_unserialize($meta[$key]) : null;
            }

            // --- Start Inlined/Optimized visibility check (derived from should_show_checklist) ---
            $is_visible = false;
            if (!$this->has_permission($id, 'view')) { // Step 1: Check view permission
                continue; // Not permitted to view, skip this checklist
            }

            if ($current_meta['_mcl_load_everywhere']) { // Step 2: Check load_everywhere from pre-fetched meta
                $is_visible = true;
            } else {
                $allowed_pages = $current_meta['_mcl_allowed_pages'] ?: array(); // Use pre-fetched meta
                if (!empty($allowed_pages) && $this->is_allowed_admin_page($allowed_pages)) {
                    $is_visible = true;
                } else {
                    $allowed_urls = $current_meta['_mcl_allowed_urls'] ?: array(); // Use pre-fetched meta
                    if (!empty($allowed_urls) && $this->matches_url_pattern($allowed_urls)) {
                        $is_visible = true;
                    }
                }
            }

            if (!$is_visible) {
                continue; // Not visible based on loading conditions, skip this checklist
            }
            // --- End Inlined/Optimized visibility check ---
    
            $shortcut_key = $current_meta['_mcl_keyboard_shortcut'] ?? '';
            if ($shortcut_key) {
                // --- Start Inlined/Optimized get_checked_state_handling logic ---
                $checked_state_handling_value = '';
                // Assuming context is 'drawer' as this is for global shortcuts usually tied to drawer behavior.
                // If shortcode context needed differentiation here, it would be more complex.
                $is_public_for_state = ($current_meta['_mcl_public_access'] ?? '') == '1';
                if ($is_public_for_state) {
                    $checked_state_handling_value = $current_meta['_mcl_public_checked_state_handling'] ?: 'per_user';
                } else {
                    $checked_state_handling_value = $current_meta['_mcl_checked_state_handling'] ?: 'global';
                }
                // --- End Inlined/Optimized get_checked_state_handling logic ---

                $shortcuts[$id] = array(
                    'shortcut' => $shortcut_key,
                    'can_edit' => $this->has_permission($id, 'edit'), // This call is still needed for specific edit permission
                    'public_access' => $is_public_for_state,
                    'checked_state_handling' => $checked_state_handling_value
                );
            }
        }
    
        return $shortcuts;
    }

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

    private function has_active_floating_buttons() {
        // This method might need adjustment or can be determined directly 
        // from the result of get_visible_checklists_with_theme() in enqueue_scripts.
        // For now, let's make it consistent.
        $visible_checklists = $this->get_visible_checklists_with_theme();
        return !empty($visible_checklists);
    }

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

    public function render_checklist_drawer() {
        // Get the current screen
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        
        // Don't render on edit page
        if ($screen && $screen->id === 'magicchecklists_page_mcl_add_new') {
            return;
        }

        $is_bricks_iframe = false;
        if (isset($_GET['bricks']) || (function_exists('bricks_is_builder') && bricks_is_builder())) {
            if (function_exists('bricks_is_builder_iframe') && bricks_is_builder_iframe()) {
                $is_bricks_iframe = true;
            }
        }

        // Don't render if we're in Bricks iframe
        if ($is_bricks_iframe) {
            return;
        }

        if ($this->should_load_assets()) {
            // Determine base theme for the drawer container (light/dark)
            $theme = 'light'; // Default theme

            // This is a fallback and for general styling, not for specific custom themes.
            $first_active_checklist_args = array(
                'post_type' => 'mcl_checklist',
                'meta_key' => '_mcl_active',
                'meta_value' => '1',
                'posts_per_page' => 1,
                'fields' => 'ids' // We only need the ID to get meta
            );
            $first_active_checklists = get_posts($first_active_checklist_args);
    
            if (!empty($first_active_checklists)) {
                $checklist_id_for_theme = $first_active_checklists[0];
                $checklist_theme_meta = get_post_meta($checklist_id_for_theme, '_mcl_theme', true);
                // Use the theme if it's explicitly 'light' or 'dark'. Ignore 'custom' for the base container class.
                if ($checklist_theme_meta && ($checklist_theme_meta === 'light' || $checklist_theme_meta === 'dark')) {
                    $theme = $checklist_theme_meta;
                }
            }
    
            include MAGIC_CHECKLISTS_PLUGIN_PATH . 'public/views/mcl-drawer-container.php';
        }
    }

    public function render_floating_buttons() {
        // Get the current screen
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        
        if ($screen && $screen->id === 'magicchecklists_page_mcl_add_new') {
            return;
        }

        $is_bricks_iframe = false;
        if (isset($_GET['bricks']) || (function_exists('bricks_is_builder') && bricks_is_builder())) {
            if (function_exists('bricks_is_builder_iframe') && bricks_is_builder_iframe()) {
                $is_bricks_iframe = true;
            }
        }

        if ($is_bricks_iframe) {
            return;
        }

        // Use the new method here as well to determine if buttons should render.
        // The original logic in has_active_floating_buttons also checked get_visible_checklists.
        // The view mcl-floating-button.php uses $active_checklists which are post objects.
        // So, get_visible_checklists_with_theme needs to return enough info for this, or we requery.
        // For simplicity, let's requery here using the old get_visible_checklists if the view absolutely needs post objects.
        // Or, adjust mcl-floating-button.php to work with IDs and titles fetched differently.
        // Reverting to fetching full post objects for this specific rendering function if needed.
        // However, let's try to adapt. The view seems to use ->ID and get_the_title(ID) and get_post_meta for _mcl_short_title.

        // Create a structure that the view can use from $active_checklists_with_theme
        // This avoids calling get_visible_checklists() again if possible.
        $active_checklists_for_view = [];
        foreach ($this->get_visible_checklists_with_theme() as $data) {
            $post_obj = get_post($data['id']); // Fetch post object
            if ($post_obj) {
                 // The view expects an array of post objects.
                $active_checklists_for_view[] = $post_obj; 
            }
        }
        
        // For mcl-floating-button.php, it iterates $active_checklists and uses $checklist->ID, 
        // get_the_title($checklist->ID), get_post_meta($checklist->ID, '_mcl_short_title', true), etc.
        // So we need to pass it $active_checklists_for_view which contains post objects.
        $active_checklists = $active_checklists_for_view; // This is what the view expects

        if(empty($active_checklists)) { // Double check if after fetching posts, any are left.
            return;
        }
        
        include MAGIC_CHECKLISTS_PLUGIN_PATH . 'public/views/mcl-floating-button.php';
        
    }

    private function should_render_on_current_page() {
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        
        if ($screen && $screen->id === 'magicchecklists_page_mcl_add_new') {
            return false;
        }

        return true;
    }

    public function update_checklist() {
        if (!isset($_POST['checklist_id'], $_POST['items'])) {
            wp_send_json_error('Missing required data');
            return;
        }

        $checklist_id = intval($_POST['checklist_id']);
        // Check if item locking is enabled for this checklist
        $enable_locking = get_post_meta($checklist_id, '_mcl_enable_item_locking', true);
        if ($enable_locking) {
            // Allow interact-level users to manage their own items
            if (! $this->has_permission($checklist_id, 'interact')) {
                wp_send_json_error('Permission denied');
                return;
            }
            $items = json_decode(stripslashes($_POST['items']), true);
            if (!is_array($items)) {
                wp_send_json_error('Invalid items data');
                return;
            }
            // Preserve locked global items
            $existing = get_post_meta($checklist_id, '_mcl_items', true) ?: array();
            $locked_existing = array_filter($existing, function($i) {
                return !empty($i['locked']);
            });
            // Process incoming items (new and unlocked existing)
            $processed = array();
            foreach ($items as $item) {
                if (!isset($item['id'])) {
                    continue;
                }
                $id = sanitize_text_field($item['id']);
                // If this is a locked global item, preserve it
                $found = null;
                foreach ($locked_existing as $le) {
                    if ($le['id'] === $id) {
                        $found = $le;
                        break;
                    }
                }
                if ($found) {
                    $processed[] = $found;
                } else {
                    // New or unlocked: sanitize
                    $processed[] = array(
                        'id' => $id,
                        'content' => wp_kses_post($item['content']),
                        'parent_id' => isset($item['parent_id']) ? sanitize_text_field($item['parent_id']) : '',
                        'priority' => isset($item['priority']) ? sanitize_text_field($item['priority']) : 'none',
                        'locked' => false,
                    );
                }
            }
            // Append any locked items removed by the user
            foreach ($locked_existing as $le) {
                if (!in_array($le['id'], array_column($processed, 'id'))) {
                    $processed[] = $le;
                }
            }
            // Save per-user items
            $user_id = get_current_user_id();
            update_user_meta($user_id, "_mcl_user_items_{$checklist_id}", $processed);
            wp_send_json_success();
            return;
        }
        // Default behavior: require edit permission for global items
        if (! $this->has_permission($checklist_id, 'edit')) {
            wp_send_json_error('Permission denied');
            return;
        }

        $items = json_decode(stripslashes($_POST['items']), true);
        if (!is_array($items)) {
            wp_send_json_error('Invalid items data');
            return;
        }

        // Preserve locked items, prevent deletion or editing of locked items
        $existing_items = get_post_meta($checklist_id, '_mcl_items', true) ?: array();
        $locked_existing = array_filter($existing_items, function($i) {
            return !empty($i['locked']);
        });

        // Process incoming items: allow updates to unlocked and new items
        $processed_items = array();
        foreach ($items as $item) {
            if (!isset($item['id'])) {
                continue;
            }
            $item_id = sanitize_text_field($item['id']);
            // Check if this is an existing locked item
            $found_locked = null;
            foreach ($locked_existing as $locked_item) {
                if ($locked_item['id'] === $item_id) {
                    $found_locked = $locked_item;
                    break;
                }
            }
            if ($found_locked) {
                // Preserve locked item as-is
                $processed_items[] = $found_locked;
            } else {
                // New or unlocked existing item: sanitize input and set locked to false
                $processed_items[] = array(
                    'id' => $item_id,
                    'content' => wp_kses_post($item['content']),
                    'parent_id' => isset($item['parent_id']) ? sanitize_text_field($item['parent_id']) : '',
                    'priority' => isset($item['priority']) ? sanitize_text_field($item['priority']) : 'none',
                    'locked' => false
                );
            }
        }
        // Append any locked items that were removed in the incoming items
        foreach ($locked_existing as $locked_item) {
            if (!in_array($locked_item['id'], array_column($processed_items, 'id'))) {
                // Add locked item back to the end to maintain order
                $processed_items[] = $locked_item;
            }
        }

        update_post_meta($checklist_id, '_mcl_items', $processed_items);

        wp_send_json_success();
    }

    private function get_checked_state($checklist_id, $context = 'drawer') {
        $handling = $this->get_checked_state_handling($checklist_id, $context);
        
        if ($handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            return get_user_meta($user_id, "_mcl_{$context}_checked_state_" . $checklist_id, true) ?: array();
        }
        
        $meta_key = $context === 'shortcode' ? '_mcl_shortcode_checked_state' : '_mcl_checked_state';
        return get_post_meta($checklist_id, $meta_key, true) ?: array();
    }

    public function save_checked_state() {
        $checklist_id = intval($_POST['checklist_id']);
        $context = sanitize_text_field($_POST['context'] ?? 'drawer');
        
        if (is_user_logged_in()) {
            if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'mcl_ajax_nonce')) {
                wp_send_json_error('Invalid nonce', 403);
                return;
            }
        }
        
        if (!$this->has_permission($checklist_id, 'interact')) {
            wp_send_json_error('You do not have permission to interact with this checklist', 403);
            return;
        }
    
        $checked_items = isset($_POST['checked_items']) ? 
            array_map('sanitize_text_field', $_POST['checked_items']) : array();
        
        $old_checked_items = $this->get_checked_state($checklist_id, $context);
        $checked_state_handling = $this->get_checked_state_handling($checklist_id, $context);
    
        if ($checked_state_handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            update_user_meta($user_id, "_mcl_{$context}_checked_state_" . $checklist_id, $checked_items);
        } else if ($checked_state_handling === 'global') {
            $meta_key = $context === 'shortcode' ? '_mcl_shortcode_checked_state' : '_mcl_checked_state';
            update_post_meta($checklist_id, $meta_key, $checked_items);
        }
    
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
        
        if (isset($validated_tokens[$token])) {
            return $validated_tokens[$token];
        }
    
        if (empty($token)) {
            error_log('MCL: Empty token provided for validation.');
            return false;
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'mcl_invite_links';
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
            return false;
        }
    
        if ($increment_usage && !$this->has_user_used_token($token)) {
            $wpdb->update(
                $table_name,
                array('usage_count' => $link->usage_count + 1),
                array('id' => $link->id),
                array('%d'),
                array('%d')
            );
            $link->usage_count++;
            $this->mark_token_as_used($token);
        }
        
        $validated_tokens[$token] = $link;
        return $link;
    }

    public function handle_invite_token() { 
        if (is_user_logged_in()) {
             check_ajax_referer('mcl_ajax_nonce', 'nonce');
        } 
        
        $token_str = isset($_POST['token']) ? sanitize_text_field($_POST['token']) : '';
        $link = $this->validate_invite_token($token_str);
        
        if (!$link) {
            wp_send_json_error('Invalid or expired invite link');
            return;
        }
        
        $token_data_response = array(
            'checklist_id' => $link->checklist_id,
            'permissions' => $link->permissions,
            'expiry' => strtotime($link->expiry_date)
        );
        
        wp_send_json_success($token_data_response);
    }

    public function maybe_set_invite_token_cookie() {
        if (isset($_GET['mcl_invite'])) {
            $token = sanitize_text_field($_GET['mcl_invite']);
            if ($this->validate_invite_token($token, false)) { 
                setcookie('mcl_invite_token', $token, time() + (7 * DAY_IN_SECONDS), COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
                error_log('MCL: Valid invite token found in URL. Cookie set.');
            } else {
                error_log('MCL: Invalid or expired invite token in URL when trying to set cookie.');
            }
        }
    }

    private function has_user_used_token($token) {
        if (isset($_COOKIE['mcl_used_tokens'])) {
            $used_tokens = json_decode(stripslashes($_COOKIE['mcl_used_tokens']), true);
            if (is_array($used_tokens) && in_array($token, $used_tokens)) {
                return true;
            }
        }
        return false;
    }
    
    private function mark_token_as_used($token) {
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
            $reset_interval = get_post_meta($checklist_id, '_mcl_reset_interval', true) ?: 'daily';
            $reset_time = get_post_meta($checklist_id, '_mcl_reset_time', true) ?: '00:00';
    
            $time_parts = explode(':', $reset_time);
            $hours = intval($time_parts[0]);
            $minutes = intval($time_parts[1]);
    
            $now = current_time('timestamp');
            $today = strtotime(date('Y-m-d', $now) . " {$hours}:{$minutes}:00");
            $next = $today;
    
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
    
            update_post_meta($checklist_id, '_mcl_reset_next', $next);
    
            $reset_counter = intval(get_post_meta($checklist_id, '_mcl_reset_counter', true)) ?: 1;
            update_post_meta($checklist_id, '_mcl_reset_counter', $reset_counter + 1);
    
            $checked_state_handling = get_post_meta($checklist_id, '_mcl_checked_state_handling', true);
            if ($checked_state_handling === 'global') {
                update_post_meta($checklist_id, '_mcl_checked_state', array());
            } else {
                global $wpdb;
                $meta_key_pattern = $wpdb->esc_like('_mcl_checked_state_' . $checklist_id) . '%';
                $wpdb->delete(
                    $wpdb->usermeta,
                    array('meta_key' => $meta_key_pattern)
                );
            }
    
            return true;
        } catch (Exception $e) {
            error_log('Error in perform_checklist_reset: ' . $e->getMessage());
            return false;
        }
    }

    private function is_inside_pagebuilder() {
        if (
            isset($_GET['elementor-preview']) || 
            (defined('ELEMENTOR_VERSION') && \Elementor\Plugin::$instance->preview->is_preview_mode())
        ) {
            return true;
        }
    
        if (
            isset($_GET['bricks']) || 
            (function_exists('bricks_is_builder') && bricks_is_builder())
        ) {
            return true;
        }
    
        if (
            isset($_GET['et_fb']) || 
            (function_exists('et_core_is_fb_enabled') && et_core_is_fb_enabled())
        ) {
            return true;
        }
    
        return false;
    }

    public function save_in_progress_state() {
        try {
            if (!isset($_POST['checklist_id'])) {
                wp_send_json_error('Missing checklist ID');
                return;
            }
    
            $checklist_id = intval($_POST['checklist_id']);
    
            if (!$this->has_permission($checklist_id, 'interact')) {
                wp_send_json_error('Permission denied');
                return;
            }
    
            $items_in_progress = isset($_POST['items_in_progress']) ? 
                json_decode(stripslashes($_POST['items_in_progress']), true) : array();
    
            if (!is_array($items_in_progress)) {
                $items_in_progress = array();
            }
    
            $items_in_progress = array_map('sanitize_text_field', $items_in_progress);
            update_post_meta($checklist_id, '_mcl_items_in_progress', $items_in_progress);
    
            wp_send_json_success();
    
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }

    public function save_item_deadline() {
        if (!isset($_POST['checklist_id'], $_POST['item_id'], $_POST['deadline'])) {
            wp_send_json_error('Missing required data');
            return;
        }

        $checklist_id = intval($_POST['checklist_id']);
        $item_id = sanitize_text_field($_POST['item_id']);
        $deadline = intval($_POST['deadline']);

        if (!$this->has_permission($checklist_id, 'edit')) {
            wp_send_json_error('Permission denied');
            return;
        }

        $deadlines = get_post_meta($checklist_id, '_mcl_item_deadlines', true) ?: array();
        $deadlines[$item_id] = $deadline;
        update_post_meta($checklist_id, '_mcl_item_deadlines', $deadlines);

        wp_send_json_success();
    }

    public function clear_item_deadline() {
        if (!isset($_POST['checklist_id'], $_POST['item_id'])) {
            wp_send_json_error('Missing required data');
            return;
        }

        $checklist_id = intval($_POST['checklist_id']);
        $item_id = sanitize_text_field($_POST['item_id']);

        if (!$this->has_permission($checklist_id, 'edit')) {
            wp_send_json_error('Permission denied');
            return;
        }

        $deadlines = get_post_meta($checklist_id, '_mcl_item_deadlines', true) ?: array();
    
        if (isset($deadlines[$item_id])) {
            unset($deadlines[$item_id]);
            update_post_meta($checklist_id, '_mcl_item_deadlines', $deadlines);
        }

        wp_send_json_success();
    }

    private function generate_custom_theme_css($checklist_id) {
        $settings = array(
            'drawer_bg_color' => get_post_meta($checklist_id, '_mcl_drawer_bg_color', true) ?: '#ffffff',
            'list_item_bg_color' => get_post_meta($checklist_id, '_mcl_list_item_bg_color', true) ?: '#f8f9fa',
            'text_color' => get_post_meta($checklist_id, '_mcl_text_color', true) ?: '#1a1a1a',
            'heading_font_size' => get_post_meta($checklist_id, '_mcl_heading_font_size', true) ?: '24',
            'description_text_color' => get_post_meta($checklist_id, '_mcl_description_text_color', true) ?: '#1a1a1a',
            'description_font_size' => get_post_meta($checklist_id, '_mcl_description_font_size', true) ?: '16',
            'list_item_font_size' => get_post_meta($checklist_id, '_mcl_list_item_font_size', true) ?: '16',
            'primary_button_bg' => get_post_meta($checklist_id, '_mcl_primary_button_bg', true) ?: '#f2da22',
            'primary_button_text_color' => get_post_meta($checklist_id, '_mcl_primary_button_text_color', true) ?: '#1a1a1a',
            'secondary_button_bg' => get_post_meta($checklist_id, '_mcl_secondary_button_bg', true) ?: '#f8f9fa',
            'secondary_button_text_color' => get_post_meta($checklist_id, '_mcl_secondary_button_text_color', true) ?: '#1a1a1a',
            'drawer_width' => get_post_meta($checklist_id, '_mcl_drawer_width', true) ?: '600',
            'drawer_height' => get_post_meta($checklist_id, '_mcl_drawer_height', true) ?: '600',
            'float_button_bg' => get_post_meta($checklist_id, '_mcl_float_button_bg', true) ?: '#ffffff',
            'float_button_text_color' => get_post_meta($checklist_id, '_mcl_float_button_text_color', true) ?: '#1a1a1a',
            'float_button_font_size' => get_post_meta($checklist_id, '_mcl_float_button_font_size', true) ?: '16',
            'show_float_button_icon' => get_post_meta($checklist_id, '_mcl_show_float_button_icon', true) === '1',
            'drawer_border_radius' => ($value = get_post_meta($checklist_id, '_mcl_drawer_border_radius', true)) !== '' ? $value : '20',
            'checkbox_bg_color' => get_post_meta($checklist_id, '_mcl_checkbox_bg_color', true) ?: '#ffffff',
            'checkbox_border_radius' => get_post_meta($checklist_id, '_mcl_checkbox_border_radius', true) ?: '4',
            'checkbox_style' => get_post_meta($checklist_id, '_mcl_checkbox_style', true) ?: 'standard',
            'checkbox_custom_icon' => get_post_meta($checklist_id, '_mcl_checkbox_custom_icon', true),
            'checkbox_checkmark_color' => get_post_meta($checklist_id, '_mcl_checkbox_checkmark_color', true) ?: '#ffffff',
        );
    
        ob_start();
        ?>
        /* Custom theme styles for checklist <?php echo esc_html($checklist_id); ?> */
        #mcl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom {
            max-width: <?php echo esc_html($settings['drawer_width']); ?>px;
        }
    
        #mcl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom .mcl-drawer-content {
            background-color: <?php echo esc_html($settings['drawer_bg_color']); ?>;
            color: <?php echo esc_html($settings['text_color']); ?>;
            max-height: <?php echo esc_html($settings['drawer_height']); ?>px;
        }
    
        #mcl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom .mcl-drawer-title {
            font-size: <?php echo esc_html($settings['heading_font_size']); ?>px;
            color: <?php echo esc_html($settings['text_color']); ?> !important;
        }
    
        #mcl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom .mcl-items-list li {
            background-color: <?php echo esc_html($settings['list_item_bg_color']); ?>;
            font-size: <?php echo esc_html($settings['list_item_font_size']); ?>px;
        }
    
        #mcl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom .mcl-drawer-button-primary {
            background-color: <?php echo esc_html($settings['primary_button_bg']); ?>;
            color: <?php echo esc_html($settings['primary_button_text_color']); ?>;
        }

        #mcl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom .mcl-drawer-button-primary svg path {
            stroke: <?php echo esc_html($settings['primary_button_text_color']); ?>;
        }
    
        #mcl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom .mcl-drawer-button-secondary {
            background-color: <?php echo esc_html($settings['secondary_button_bg']); ?>;
            color: <?php echo esc_html($settings['secondary_button_text_color']); ?>;
        }

        #mcl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom .mcl-drawer-button-secondary svg path {
            fill: <?php echo esc_html($settings['secondary_button_text_color']); ?>;
        }
    
        .mcl-floating-button[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom {
            background-color: <?php echo esc_html($settings['float_button_bg']); ?>;
            color: <?php echo esc_html($settings['float_button_text_color']); ?>;
        }

        <?php if (!$settings['show_float_button_icon']) : ?>
        .mcl-floating-button[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom .mcl-floating-button-head {
            display: none;
        }
        <?php else: ?>
        .mcl-floating-button[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom .mcl-floating-button-svg path {
            fill: <?php echo esc_html($settings['float_button_text_color']); ?>;
        }
        <?php endif; ?>
    
        .mcl-floating-button[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom .mcl-floating-button-text {
            font-size: <?php echo esc_html($settings['float_button_font_size']); ?>px;
        }

        #mcl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom {
            border-radius: <?php echo esc_html($settings['drawer_border_radius']); ?>px <?php echo esc_html($settings['drawer_border_radius']); ?>px 0 0;
        }

        #mcl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom input[type="checkbox"].mcl-item-checkbox {
            background-color: <?php echo esc_html($settings['checkbox_bg_color']); ?> !important;
            border-radius: <?php echo esc_html($settings['checkbox_border_radius']); ?>px !important;
        }

        <?php if ($settings['checkbox_style'] === 'custom' && $settings['checkbox_custom_icon']) : ?>
            #mcl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom input[type="checkbox"].mcl-item-checkbox:checked::before {
                content: url("<?php echo esc_url($settings['checkbox_custom_icon']); ?>") !important;
            }
        <?php else : ?>
            #mcl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom input[type="checkbox"].mcl-item-checkbox:checked::before {
                content: url("data:image/svg+xml;utf8,<svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path fill-rule='evenodd' clip-rule='evenodd' d='M8.72123 18.1441C8.36923 18.1441 8.04323 17.9591 7.86223 17.6561C6.94423 16.1161 5.76323 14.7311 4.35423 13.5401C3.93223 13.1831 3.88023 12.5521 4.23623 12.1301C4.59323 11.7071 5.22323 11.6551 5.64523 12.0121C6.78923 12.9791 7.80023 14.0621 8.66223 15.2441C10.2992 12.5971 13.5172 8.40012 18.5642 5.95512C19.0612 5.71612 19.6592 5.92112 19.9002 6.41912C20.1402 6.91612 19.9332 7.51412 19.4362 7.75512C13.8602 10.4561 10.7022 15.5491 9.60423 17.6141C9.43423 17.9321 9.10623 18.1351 8.74523 18.1441H8.72123Z' fill='<?php echo str_replace('#', '%23', $settings['checkbox_checkmark_color']); ?>'/></svg>") !important;
            }
        <?php endif; ?>

        #mcl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].mcl-theme-custom .mcl-public-description {
            font-size: <?php echo esc_html($settings['description_font_size']); ?>px;
            color: <?php echo esc_html($settings['description_text_color']); ?>;
        }
    
        <?php
        return ob_get_clean();
    }
}
