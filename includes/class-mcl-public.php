<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
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

    /**
     * @var MCL_Permissions
     */
    private $permissions;
    
    /**
     * @var MCL_Theme_Renderer
     */
    private $theme_renderer;

    public function __construct() {
        $this->permissions = new MCL_Permissions();
        $this->theme_renderer = new MCL_Theme_Renderer();
        
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
        add_action('wp_ajax_mcl_get_active_checklists_data', array($this, 'get_active_checklists_data'));
        add_action('wp_ajax_nopriv_mcl_get_active_checklists_data', array($this, 'get_active_checklists_data'));
    }

    /**
     * Determine if assets should be loaded for the current page
     */
    public function should_load_assets() {
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
            if (!$this->permissions->has_permission($checklist_id, 'view')) {
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
            
            // For frontend pages, also check if this is a common frontend page that should load assets
            if (!is_admin()) {
                // If no specific restrictions are set (no allowed_pages and no allowed_urls), 
                // load assets on all frontend pages by default
                if (empty($allowed_pages) && empty($allowed_urls)) {
                    return true;
                }
            }
        }

        // If the loop completes without returning true, no checklist met the criteria for loading assets.
        return false;
    }

    private function should_show_checklist($checklist_id) {
        if (!$this->permissions->has_permission($checklist_id, 'view')) {
            return false;
        }
    
        $load_everywhere = get_post_meta($checklist_id, '_mcl_load_everywhere', true);
        
        if ($load_everywhere) {
            return true;
        }
    
        // Check allowed pages (admin pages)
        $allowed_pages = get_post_meta($checklist_id, '_mcl_allowed_pages', true) ?: array();
        if (!empty($allowed_pages) && $this->is_allowed_admin_page($allowed_pages)) {
            return true;
        }
        
        // Check allowed URLs (both admin and frontend)
        $allowed_urls = get_post_meta($checklist_id, '_mcl_allowed_urls', true) ?: array();
        if (!empty($allowed_urls) && $this->matches_url_pattern($allowed_urls)) {
            return true;
        }
        
        // For frontend pages, also check if this is a common frontend page that should show floating buttons
        if (!is_admin()) {
            // If no specific restrictions are set (no allowed_pages and no allowed_urls), 
            // show on all frontend pages by default
            if (empty($allowed_pages) && empty($allowed_urls)) {
                return true;
            }
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
     * Wrapper for permission check method - delegates to MCL_Permissions
     */
    public function has_permission($checklist_id, $required_permission = 'view') {
        return $this->permissions->has_permission($checklist_id, $required_permission);
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

    /**
     * Get checklist data via AJAX
     */
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

            // Check view permission first
            if (!$this->permissions->has_permission($checklist_id, 'view')) {
                wp_send_json_error(array(
                    'message' => 'Access denied',
                    'code' => 403
                ));
                return;
            }

            // Abort if drawer is disabled for this checklist via shortcode settings
            $shortcode_settings = MCL_Admin::get_shortcode_settings($checklist_id);
            if (!empty($shortcode_settings['disable_drawer'])) {
                wp_send_json_error(array(
                    'message' => 'Drawer disabled for this checklist',
                    'code' => 403
                ));
                return;
            }
            
            $user_identifier = $this->get_current_user_identifier();
            $locked          = false;
            $locked_message  = '';

            // Determine permission levels in one pass
            $user_can_edit = $this->permissions->has_permission($checklist_id, 'edit');
            $user_can_interact = $user_can_edit || $this->permissions->has_permission($checklist_id, 'interact');
            
            // Skip global checklist lock when per-item locking is enabled
            $item_locking_enabled = get_post_meta($checklist_id, '_mcl_enable_item_locking', true);

            if ($user_can_edit && !$item_locking_enabled) {
                $lock = $this->get_lock($checklist_id);
                if ($lock && $lock['user'] !== $user_identifier) {
                    $locked = true;
                    $locked_message = 'This checklist is currently being edited by another user.';
                } else {
                    $this->set_lock($checklist_id, $user_identifier);
                }
            }
            
            // Handle auto-reset if needed
            $was_reset = false;
            try {
                $was_reset = $this->check_and_handle_reset($checklist_id);
            } catch (Exception $e) {
                error_log('Error handling reset check: ' . $e->getMessage());
            }
            
            // Get the checklist data
            $data = $this->get_checklist_data_for_display($checklist_id, $user_can_edit, $user_can_interact, $locked, $locked_message, $was_reset);
            
            if (!$data) {
                wp_send_json_error(array(
                    'message' => 'Checklist not found or no view permission after data fetch',
                    'code' => 404
                ));
                return;
            }

            // Track checklist view for analytics
            do_action('mcl_checklist_rendered', $checklist_id);

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
     * Get checklist data for display
     * 
     * @param int $checklist_id The checklist ID
     * @param bool $user_can_edit Whether the user can edit
     * @param bool $user_can_interact Whether the user can interact
     * @param bool $locked Whether the checklist is locked
     * @param string $locked_message The lock message if locked
     * @param bool $was_reset Whether the checklist was reset
     * @return array|false The checklist data or false if not found/no permission
     */
    private function get_checklist_data_for_display($checklist_id, $user_can_edit, $user_can_interact, $locked = false, $locked_message = '', $was_reset = false) {
        $checklist_data = $this->get_checklist_with_meta($checklist_id);
        if (!$checklist_data) {
            return false;
        }

        $checklist = $checklist_data['post'];
        $meta = $checklist_data['meta'];
        
        // If item locking enabled, always merge current user's modifications with global items
        if (get_post_meta($checklist_id, '_mcl_enable_item_locking', true) && is_user_logged_in()) {
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
        $checked_state = $this->get_checked_state($checklist_id);
        $tags = get_post_meta($checklist_id, '_mcl_tags', true) ?: array();
        $reset_enabled = get_post_meta($checklist_id, '_mcl_auto_reset', true) == '1';

        $return_data = array(
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
            'enable_item_locking' => (bool)get_post_meta($checklist_id, '_mcl_enable_item_locking', true),
            'can_edit' => $user_can_edit,
            'can_check' => $user_can_interact,
            'can_view' => true, // We already checked this
            'public_permission' => $is_public ? $this->permissions->get_public_permission_level($checklist_id) : null,
            'checked_state_handling' => $checked_state_handling,
            'enable_rate_limit' => !empty($enable_rate_limit),
            'checklist_id' => $checklist_id,
            'tags' => $tags,
            'access_info' => array(
                'is_admin' => $this->permissions->is_administrator()
            ),
            'locked' => $locked,
            'locked_message' => $locked_message,
            'reset_info' => array(
                'enabled' => $reset_enabled,
                'was_reset' => $was_reset,
                'reset_counter' => get_post_meta($checklist_id, '_mcl_reset_counter', true) ?: 1,
                'next_reset' => get_post_meta($checklist_id, '_mcl_reset_next', true)
            ),
            // Custom theme settings - include when theme is 'custom' or any custom settings exist
            'drawer_bg_color' => get_post_meta($checklist_id, '_mcl_drawer_bg_color', true),
            'list_item_bg_color' => get_post_meta($checklist_id, '_mcl_list_item_bg_color', true),
            'text_color' => get_post_meta($checklist_id, '_mcl_text_color', true),
            'description_text_color' => get_post_meta($checklist_id, '_mcl_description_text_color', true),
            'heading_font_size' => get_post_meta($checklist_id, '_mcl_heading_font_size', true),
            'description_font_size' => get_post_meta($checklist_id, '_mcl_description_font_size', true),
            'list_item_font_size' => get_post_meta($checklist_id, '_mcl_list_item_font_size', true),
            'primary_button_bg' => get_post_meta($checklist_id, '_mcl_primary_button_bg', true),
            'primary_button_text_color' => get_post_meta($checklist_id, '_mcl_primary_button_text_color', true),
            'secondary_button_bg' => get_post_meta($checklist_id, '_mcl_secondary_button_bg', true),
            'secondary_button_text_color' => get_post_meta($checklist_id, '_mcl_secondary_button_text_color', true),
            'checkbox_bg_color' => get_post_meta($checklist_id, '_mcl_checkbox_bg_color', true),
            'checkbox_border_radius' => get_post_meta($checklist_id, '_mcl_checkbox_border_radius', true),
            'checkbox_style' => get_post_meta($checklist_id, '_mcl_checkbox_style', true),
            'checkbox_custom_icon' => get_post_meta($checklist_id, '_mcl_checkbox_custom_icon', true),
            'checkbox_checkmark_color' => get_post_meta($checklist_id, '_mcl_checkbox_checkmark_color', true),
            'drawer_border_radius' => get_post_meta($checklist_id, '_mcl_drawer_border_radius', true),
            'drawer_width' => get_post_meta($checklist_id, '_mcl_drawer_width', true),
            'drawer_height' => get_post_meta($checklist_id, '_mcl_drawer_height', true),
            'float_button_bg' => get_post_meta($checklist_id, '_mcl_float_button_bg', true),
            'float_button_text_color' => get_post_meta($checklist_id, '_mcl_float_button_text_color', true),
            'float_button_font_size' => get_post_meta($checklist_id, '_mcl_float_button_font_size', true),
            'show_float_button_icon' => get_post_meta($checklist_id, '_mcl_show_float_button_icon', true)
        );
        

        
        return $return_data;
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

            // Step 1.5: Check if the drawer is disabled for this checklist via shortcode settings
            $shortcode_settings = MCL_Admin::get_shortcode_settings($checklist_id);
            if (!empty($shortcode_settings['disable_drawer'])) {
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
                    } else {
                        // For frontend pages, show floating buttons if no specific restrictions are set
                        if (!is_admin() && empty($allowed_pages) && empty($allowed_urls)) {
                            $is_visible_based_on_conditions = true;
                        }
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
        return $this->permissions->get_public_permission_level($checklist_id);
    }

    private function get_invite_token_data() {
        return $this->permissions->get_invite_token_data();
    }

    private function is_administrator() {
        return $this->permissions->is_administrator();
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
    
        wp_enqueue_style(
            'mcl-fonts',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-fonts.css',
            array(),
            MAGIC_CHECKLISTS_VERSION
        );
        
        wp_enqueue_style(
            'mcl-drawer',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-drawer-minimal.css',
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
                $custom_css = $this->theme_renderer->generate_custom_theme_css($checklist_data['id']);
                wp_add_inline_style('mcl-drawer', $custom_css);
            }
        }
    
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
                'enable_navigation' => MCL_Settings::get_setting('enable_checklist_navigation', false),
                'enable_progress_counter' => MCL_Settings::get_setting('enable_progress_counter', false)
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
        
        // Register a lightweight handle purely for inline data
        wp_register_script('mcl-inline-data', '', [], MAGIC_CHECKLISTS_VERSION, true);
        wp_enqueue_script('mcl-inline-data');

        wp_add_inline_script(
            'mcl-inline-data',
            'window.mcl_checklists = ' . wp_json_encode($localized_data) . ';',
            'before'
        );
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

            // Step 1.5: Respect 'disable_drawer' shortcode setting – completely skip if enabled
            $shortcode_settings = MCL_Admin::get_shortcode_settings($id);
            if (!empty($shortcode_settings['disable_drawer'])) {
                continue; // Drawer disabled for this checklist
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
        return;
    }

    public function render_floating_buttons() {
        return;
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
        $has_edit_permission = $this->has_permission($checklist_id, 'edit');
        
        if ($enable_locking) {
            // Only users with edit permission may add/modify their personal items
            if (!$has_edit_permission) {
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
        if (!$has_edit_permission) {
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
        
        if ($handling === 'per_user') {
            if (is_user_logged_in()) {
                $user_id = get_current_user_id();
                return get_user_meta($user_id, "_mcl_{$context}_checked_state_" . $checklist_id, true) ?: array();
            } else {
                // Per-user checklists with logged-out users should use localStorage on client side
                // Return empty array as server has no state for anonymous users in per-user mode
                return array();
            }
        }
        
        // Global handling mode
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
    
        // Handle checked_items as JSON string (consistent with other endpoints)
        $checked_items = isset($_POST['checked_items']) ? 
            json_decode(stripslashes($_POST['checked_items']), true) : array();
        
        if (!is_array($checked_items)) {
            $checked_items = array();
        }
        
        // Sanitize the items
        $checked_items = array_map('sanitize_text_field', $checked_items);
        
        $old_checked_items = $this->get_checked_state($checklist_id, $context);
        $checked_state_handling = $this->get_checked_state_handling($checklist_id, $context);
    
        if ($checked_state_handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            update_user_meta($user_id, "_mcl_{$context}_checked_state_" . $checklist_id, $checked_items);
        } else if ($checked_state_handling === 'global') {
            $meta_key = $context === 'shortcode' ? '_mcl_shortcode_checked_state' : '_mcl_checked_state';
            update_post_meta($checklist_id, $meta_key, $checked_items);
        } else if ($checked_state_handling === 'per_user' && !is_user_logged_in()) {
            // Per-user checklists with logged-out users should use localStorage on client side
            // We don't save to database in this case, just return success
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('MCL: Per-user checklist state from logged-out user - not saving to database');
            }
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
        return $this->permissions->validate_token_string($token, $increment_usage);
    }

    public function handle_invite_token() { 
        if (is_user_logged_in()) {
             check_ajax_referer('mcl_ajax_nonce', 'nonce');
        } 
        
        $token_str = isset($_POST['token']) ? sanitize_text_field($_POST['token']) : '';
        $link = $this->permissions->validate_token_string($token_str);
        
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
            if ($this->permissions->validate_token_string($token, false)) { 
                setcookie('mcl_invite_token', $token, time() + (7 * DAY_IN_SECONDS), COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
                error_log('MCL: Valid invite token found in URL. Cookie set.');
            } else {
                error_log('MCL: Invalid or expired invite token in URL when trying to set cookie.');
            }
        }
    }

    // Token handling methods now handled by MCL_Permissions class

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
    
            // Use WordPress timezone consistently
            $timezone = wp_timezone();
            $now = new DateTime('now', $timezone);
            $today = new DateTime($now->format('Y-m-d') . ' ' . sprintf('%02d:%02d:00', $hours, $minutes), $timezone);
    
            switch ($reset_interval) {
                case 'daily':
                    $next = clone $today;
                    $next->add(new DateInterval('P1D'));
                    break;
    
                case 'weekly':
                    $week_day = get_post_meta($checklist_id, '_mcl_week_day', true) ?: '1';
                    // Calculate days until next occurrence of the target day
                    $current_week_day = (int)$now->format('N'); // 1 = Monday, 7 = Sunday
                    $days_until_target = ($week_day - $current_week_day + 7) % 7;
                    if ($days_until_target === 0) {
                        $days_until_target = 7; // Next week if today is the target day
                    }
                    $next = clone $today;
                    $next->add(new DateInterval('P' . $days_until_target . 'D'));
                    break;
    
                case 'monthly':
                    $month_day = get_post_meta($checklist_id, '_mcl_month_day', true) ?: '1';
                    $next = new DateTime($now->format('Y-m-') . sprintf('%02d', $month_day) . ' ' . sprintf('%02d:%02d:00', $hours, $minutes), $timezone);
                    // If we're past this month's target date, move to next month
                    if ($now >= $next) {
                        $next->add(new DateInterval('P1M'));
                    }
                    break;
    
                case 'custom':
                    $custom_months = intval(get_post_meta($checklist_id, '_mcl_custom_months', true)) ?: 0;
                    $custom_weeks = intval(get_post_meta($checklist_id, '_mcl_custom_weeks', true)) ?: 0;
                    $custom_days = intval(get_post_meta($checklist_id, '_mcl_custom_days', true)) ?: 0;
                    
                    // Convert all to days
                    $total_days = ($custom_months * 30) + ($custom_weeks * 7) + $custom_days;
                    
                    // If no interval was set, default to 1 day
                    if ($total_days === 0) {
                        $total_days = 1;
                    }
                    
                    $next = clone $today;
                    $next->add(new DateInterval('P' . $total_days . 'D'));
                    break;
            }
    
            update_post_meta($checklist_id, '_mcl_reset_next', $next->getTimestamp());
    
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

    public function get_active_checklists_data() {
        try {
            // Optional nonce verification for logged-in users
            if (is_user_logged_in() && isset($_POST['nonce'])) {
                if (!wp_verify_nonce($_POST['nonce'], 'mcl_admin_nonce')) {
                    wp_send_json_error(array(
                        'message' => 'Invalid nonce',
                        'code' => 403
                    ));
                    return;
                }
            }
            
            // Get active checklists with trigger button enabled
            $active_checklists = $this->get_visible_checklists_with_theme();
            
            // Format the checklists for React
            $formatted_checklists = array();
            foreach ($active_checklists as $checklist_data) {
                $checklist_id = $checklist_data['id'];
                
                // Get the full post object
                $checklist = get_post($checklist_id);
                if (!$checklist) {
                    continue; // Skip if post doesn't exist
                }
                
                // Get meta values
                $priority = get_post_meta($checklist_id, '_mcl_priority', true) ?: 'none';
                $short_title = get_post_meta($checklist_id, '_mcl_short_title', true) ?: '';
                $button_position = get_post_meta($checklist_id, '_mcl_button_position', true) ?: 'bottom-right';
                $theme = get_post_meta($checklist_id, '_mcl_theme', true) ?: 'light';
                
                $priority_colors = MCL_Priority_Utils::get_priority_colors();
                $priority_levels = MCL_Priority_Utils::get_priority_levels();
                
                $formatted_checklists[] = array(
                    'id' => $checklist->ID,
                    'title' => $checklist->post_title,
                    'shortTitle' => $short_title,
                    'buttonPosition' => $button_position,
                    'priority' => $priority,
                    'priorityColor' => $priority_colors[$priority] ?? '#cccccc',
                    'priorityLabel' => $priority_levels[$priority] ?? 'None',
                    'theme' => $theme,
                    'checklist_icon_type' => get_post_meta($checklist_id, '_mcl_checklist_icon_type', true) ?: 'preset',
                    'checklist_icon_preset' => get_post_meta($checklist_id, '_mcl_checklist_icon_preset', true) ?: 'checklist-1',
                    'checklist_icon_custom' => get_post_meta($checklist_id, '_mcl_checklist_icon_custom', true) ?: '',
                    'float_button_bg' => get_post_meta($checklist_id, '_mcl_float_button_bg', true) ?: '#ffffff',
                    'float_button_text_color' => get_post_meta($checklist_id, '_mcl_float_button_text_color', true) ?: '#1a1a1a'
                );
            }
            
            wp_send_json_success(array(
                'checklists' => $formatted_checklists,
                'theme' => 'light' // Default theme - individual checklists will use their own themes
            ));
        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => 'Error loading checklist data',
                'code' => 500
            ));
        }
    }
}
