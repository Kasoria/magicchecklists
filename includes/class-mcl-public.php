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
        add_action('wp_ajax_mcl_get_checked_state', array($this, 'ajax_get_checked_state'));
        add_action('wp_ajax_nopriv_mcl_get_checked_state', array($this, 'ajax_get_checked_state'));
        add_action('wp_ajax_mcl_add_item', array($this, 'add_item'));
        add_action('wp_ajax_nopriv_mcl_add_item', array($this, 'add_item'));
        add_action('wp_ajax_mcl_delete_item', array($this, 'delete_item'));
        add_action('wp_ajax_nopriv_mcl_delete_item', array($this, 'delete_item'));
        add_action('init', array($this, 'maybe_set_invite_token_cookie'));
        add_action('wp_ajax_mcl_release_lock', array($this, 'release_checklist_lock'));
        add_action('wp_ajax_nopriv_mcl_release_lock', array($this, 'release_checklist_lock'));
        add_action('wp_ajax_mcl_save_in_progress', array($this, 'save_in_progress_state'));
        add_action('wp_ajax_nopriv_mcl_save_in_progress', array($this, 'save_in_progress_state'));
        add_action('wp_ajax_mcl_get_in_progress_state', array($this, 'ajax_get_in_progress_state'));
        add_action('wp_ajax_nopriv_mcl_get_in_progress_state', array($this, 'ajax_get_in_progress_state'));
        add_action('wp_ajax_mcl_save_item_deadline', array($this, 'save_item_deadline'));
        add_action('wp_ajax_nopriv_mcl_save_item_deadline', array($this, 'save_item_deadline'));
        add_action('wp_ajax_mcl_clear_item_deadline', array($this, 'clear_item_deadline'));
        add_action('wp_ajax_nopriv_mcl_clear_item_deadline', array($this, 'clear_item_deadline'));
        add_action('wp_ajax_mcl_get_active_checklists_data', array($this, 'get_active_checklists_data'));
        add_action('wp_ajax_nopriv_mcl_get_active_checklists_data', array($this, 'get_active_checklists_data'));
        add_action('wp_ajax_mcl_get_kanban_board', array($this, 'get_kanban_board'), 5);
        add_action('wp_ajax_nopriv_mcl_get_kanban_board', array($this, 'get_kanban_board'), 5);
        add_action('wp_ajax_mcl_save_kanban_board', array($this, 'save_kanban_board'), 5);
        add_action('wp_ajax_nopriv_mcl_save_kanban_board', array($this, 'save_kanban_board'), 5);

        // Threaded comments for tasks (public-facing with priority 5 to run before admin hooks)
        add_action('wp_ajax_mcl_get_threaded_comments', array($this, 'get_threaded_comments_public'), 5);
        add_action('wp_ajax_nopriv_mcl_get_threaded_comments', array($this, 'get_threaded_comments_public'), 5);
        add_action('wp_ajax_mcl_add_threaded_comment', array($this, 'add_threaded_comment_public'), 5);
        add_action('wp_ajax_nopriv_mcl_add_threaded_comment', array($this, 'add_threaded_comment_public'), 5);
        add_action('wp_ajax_mcl_delete_threaded_comment', array($this, 'delete_threaded_comment_public'), 5);
        add_action('wp_ajax_nopriv_mcl_delete_threaded_comment', array($this, 'delete_threaded_comment_public'), 5);
        add_action('wp_ajax_mcl_toggle_comment_like', array($this, 'toggle_comment_like_public'), 5);
        add_action('wp_ajax_nopriv_mcl_toggle_comment_like', array($this, 'toggle_comment_like_public'), 5);

        // Feature board AJAX handlers
        add_action('wp_ajax_mcl_toggle_item_upvote', array($this, 'toggle_item_upvote'), 5);
        add_action('wp_ajax_nopriv_mcl_toggle_item_upvote', array($this, 'toggle_item_upvote'), 5);
        add_action('wp_ajax_mcl_get_item_upvotes', array($this, 'get_item_upvotes'), 5);
        add_action('wp_ajax_nopriv_mcl_get_item_upvotes', array($this, 'get_item_upvotes'), 5);
        add_action('wp_ajax_mcl_submit_idea', array($this, 'submit_idea'), 5);
        add_action('wp_ajax_nopriv_mcl_submit_idea', array($this, 'submit_idea'), 5);
        add_action('wp_ajax_mcl_verify_email', array($this, 'verify_email'), 5);
        add_action('wp_ajax_nopriv_mcl_verify_email', array($this, 'verify_email'), 5);
        add_action('wp_ajax_mcl_get_feature_board_settings', array($this, 'get_feature_board_settings'), 5);
        add_action('wp_ajax_nopriv_mcl_get_feature_board_settings', array($this, 'get_feature_board_settings'), 5);
        add_action('wp_ajax_mcl_get_column_sync_settings', array($this, 'get_column_sync_settings_public'), 5);
        add_action('wp_ajax_nopriv_mcl_get_column_sync_settings', array($this, 'get_column_sync_settings_public'), 5);

        // Schedule daily cleanup of expired IP hashes (for GDPR compliance)
        if (!wp_next_scheduled('mcl_cleanup_expired_ip_hashes')) {
            wp_schedule_event(time(), 'daily', 'mcl_cleanup_expired_ip_hashes');
        }
        add_action('mcl_cleanup_expired_ip_hashes', array($this, 'cleanup_expired_ip_hashes'));
    }

    /**
     * Cleanup expired IP hashes from upvotes table (GDPR compliance)
     * IP hashes older than 30 days are cleared to minimize stored personal data
     */
    public function cleanup_expired_ip_hashes() {
        global $wpdb;
        $upvotes_table = $wpdb->prefix . 'mcl_item_upvotes';
        $expiry_days = 30;

        // Clear IP hashes that are older than 30 days (set to NULL instead of deleting the upvote record)
        $result = $wpdb->query($wpdb->prepare(
            "UPDATE $upvotes_table SET ip_hash = NULL WHERE ip_hash IS NOT NULL AND created_at < DATE_SUB(NOW(), INTERVAL %d DAY)",
            $expiry_days
        ));

        if ($result !== false) {
            error_log("MCL: Cleaned up IP hashes from {$result} upvote records older than {$expiry_days} days");
        }
    }

    /**
     * Check if a shortcode-enabled checklist is present on the current page content.
     * This is used to ensure assets load for shortcode checklists even if disable_drawer is set.
     *
     * @param int $checklist_id The checklist ID to check
     * @return bool True if the shortcode for this checklist is present on the current page
     */
    private function is_shortcode_present_on_page($checklist_id) {
        // Only check on frontend pages with post content
        if (is_admin()) {
            return false;
        }

        // Check if shortcode is enabled for this checklist
        if (!MCL_Admin::is_shortcode_enabled($checklist_id)) {
            return false;
        }

        global $post;
        if (!$post || empty($post->post_content)) {
            return false;
        }

        // Check if the magic_checklist shortcode is present in the content
        if (!has_shortcode($post->post_content, 'magic_checklist')) {
            return false;
        }

        // Parse shortcode attributes to check if this specific checklist ID is used
        $pattern = get_shortcode_regex(array('magic_checklist'));
        if (preg_match_all('/' . $pattern . '/s', $post->post_content, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $atts = shortcode_parse_atts($match[3]);
                if (isset($atts['id']) && intval($atts['id']) === $checklist_id) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Determine if assets should be loaded for the current page
     */
    public function should_load_assets() {
        // Check for tour mode parameters first - if present, always load assets for tours
        $is_tour_mode = isset($_GET['mcl_tour_mode']) && $_GET['mcl_tour_mode'] == '1';
        $continue_tour_id = isset($_GET['mcl_continue_tour']) ? intval($_GET['mcl_continue_tour']) : 0;
        $has_tour_id = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : 0;

        // Check for active tours that match the current context
        if (class_exists('MCL_Tour_CPT')) {
            $active_tours = MCL_Tour_CPT::get_active_tours_for_context();
            if (!empty($active_tours) || $is_tour_mode || $continue_tour_id || $has_tour_id) {
                return true;
            }
        }

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

            // Get loading settings
            $load_everywhere = get_post_meta($checklist_id, '_mcl_load_everywhere', true);

            // First, check if the user has permission to view this specific checklist.
            $has_permission = $this->permissions->has_permission($checklist_id, 'view');

            if (!$has_permission) {
                continue;
            }

            // Check if this checklist is used via shortcode on the current page.
            // If so, we need to load assets regardless of disable_drawer setting.
            $shortcode_present = $this->is_shortcode_present_on_page($checklist_id);
            if ($shortcode_present) {
                return true; // Shortcode checklist found on page, load assets.
            }

            // Check if the drawer is disabled for this checklist via shortcode settings.
            // Only skip if the checklist is NOT present as a shortcode on this page.
            $shortcode_settings = MCL_Admin::get_shortcode_settings($checklist_id);
            if (!empty($shortcode_settings['disable_drawer'])) {
                continue; // Skip for drawer/floating button purposes, but shortcode already checked above
            }

            // Now check the specific loading conditions for this checklist (drawer/floating button).
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
            // Also check for AJAX requests from frontend
            $is_frontend = !is_admin() || ($this->is_ajax_request() && $this->is_ajax_from_frontend());
            if ($is_frontend) {
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

    private function should_skip_checklist_in_builder($checklist_id) {
        if (!$this->is_inside_pagebuilder_context()) {
            return false;
        }

        $disable_flag = get_post_meta($checklist_id, '_mcl_disable_in_builders', true);

        return !empty($disable_flag) && $disable_flag !== '0';
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
        if (empty($allowed_pages)) {
            return false;
        }

        // For non-admin pages (and non-AJAX from admin), return false
        if (!is_admin() && !$this->is_ajax_request()) {
            return false;
        }

        global $pagenow, $plugin_page;

        $current_page = '';
        $current_pagenow = $pagenow;
        $current_plugin_page = $plugin_page;
        $get_params = $_GET;

        // For AJAX requests, parse the referer URL to get the actual admin page
        if ($this->is_ajax_request() && !empty($_SERVER['HTTP_REFERER'])) {
            $referer = $_SERVER['HTTP_REFERER'];
            $referer_parts = wp_parse_url($referer);

            // Only process if referer is an admin page
            if (!empty($referer_parts['path']) && strpos($referer_parts['path'], '/wp-admin/') !== false) {
                // Extract the page name from the path
                $path = $referer_parts['path'];
                $admin_page = basename($path);
                $current_pagenow = $admin_page;

                // Parse query string for plugin_page and other params
                if (!empty($referer_parts['query'])) {
                    parse_str($referer_parts['query'], $query_params);
                    if (!empty($query_params['page'])) {
                        $current_plugin_page = $query_params['page'];
                    }
                    $get_params = $query_params;
                }
            } else {
                // AJAX from non-admin page
                return false;
            }
        }

        if (!empty($current_plugin_page)) {
            $current_page = $current_plugin_page;
        } else {
            // Use the raw page slug without mapping
            // The allowed_pages array contains raw WordPress slugs like 'upload', 'options-general', etc.
            // since that's what get_registered_admin_pages() returns and what gets saved
            $current_page = str_replace('.php', '', $current_pagenow);
        }

        if (!empty($get_params['post_type'])) {
            $current_page .= '&post_type=' . sanitize_text_field($get_params['post_type']);
        }
        if (!empty($get_params['taxonomy'])) {
            $current_page .= '&taxonomy=' . sanitize_text_field($get_params['taxonomy']);
        }

        return in_array($current_page, $allowed_pages);
    }
    
    private function matches_url_pattern($allowed_urls) {
        if (empty($allowed_urls)) {
            return false;
        }

        $current_url = $_SERVER['REQUEST_URI'];

        // For AJAX requests, use the referrer URL instead of admin-ajax.php
        if ($this->is_ajax_request() && !empty($_SERVER['HTTP_REFERER'])) {
            $referer_parts = wp_parse_url($_SERVER['HTTP_REFERER']);
            if (!empty($referer_parts['path'])) {
                $current_url = $referer_parts['path'];
                // Include query string if present
                if (!empty($referer_parts['query'])) {
                    $current_url .= '?' . $referer_parts['query'];
                }
            }
        }

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
     * Check if current request is an AJAX request
     */
    private function is_ajax_request() {
        return defined('DOING_AJAX') && DOING_AJAX;
    }

    /**
     * Check if AJAX request originated from a frontend page (not wp-admin)
     */
    private function is_ajax_from_frontend() {
        if (empty($_SERVER['HTTP_REFERER'])) {
            return false;
        }

        // If referer doesn't contain wp-admin, it's from frontend
        return strpos($_SERVER['HTTP_REFERER'], '/wp-admin/') === false;
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
            'items_in_progress' => $this->get_in_progress_state($checklist_id),
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
     * Get ALL active checklists that should be loaded on the current page.
     * Returns an array of [ 'id' => checklist_id, 'theme' => theme_value ]
     */
    private function get_all_active_checklists_for_page() {
        $query_args_base = array(
            'post_type' => 'mcl_checklist',
            'meta_query' => array(
                array(
                    'key' => '_mcl_active',
                    'value' => '1'
                )
            ),
            'posts_per_page' => -1,
        );

        $active_checklists_posts = get_posts($query_args_base);
        $visible_checklists_data = [];

        foreach ($active_checklists_posts as $checklist_post) {
            $checklist_id = $checklist_post->ID;

            // Check view permission
            if (!$this->has_permission($checklist_id, 'view')) {
                continue;
            }

            // Check if this checklist is used via shortcode on the current page.
            // If so, include it regardless of disable_drawer setting.
            $shortcode_present = $this->is_shortcode_present_on_page($checklist_id);

            // Check if the drawer is disabled for this checklist via shortcode settings
            // Only skip if the checklist is NOT present as a shortcode on this page.
            $shortcode_settings = MCL_Admin::get_shortcode_settings($checklist_id);
            $disable_drawer = !empty($shortcode_settings['disable_drawer']);

            if ($disable_drawer && !$shortcode_present) {
                continue;
            }

            // Check loading conditions
            $is_visible_based_on_conditions = false;

            // If shortcode is present, mark as visible
            if ($shortcode_present) {
                $is_visible_based_on_conditions = true;
            } else {
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
                            // For frontend pages, show if no specific restrictions are set
                            // Also check for AJAX requests from frontend (referrer is not wp-admin)
                            $is_frontend = !is_admin() || ($this->is_ajax_request() && $this->is_ajax_from_frontend());
                            if ($is_frontend && empty($allowed_pages) && empty($allowed_urls)) {
                                $is_visible_based_on_conditions = true;
                            }
                        }
                    }
                }
            }

            if ($is_visible_based_on_conditions) {
                $theme = get_post_meta($checklist_id, '_mcl_theme', true);
                $visible_checklists_data[] = [
                    'id' => $checklist_id,
                    'theme' => $theme ?: 'light'
                ];
            }
        }

        return $visible_checklists_data;
    }
    
    /**
     * Get active checklists that should show floating buttons, along with their theme.
     * Returns an array of [ 'id' => checklist_id, 'theme' => theme_value ]
     */
    private function get_visible_checklists_with_theme() {
        // First check if tours are active - tours don't show floating buttons but indicate assets should be loaded
        if (class_exists('MCL_Tour_CPT')) {
            $active_tours = MCL_Tour_CPT::get_active_tours_for_context();
            $is_tour_mode = isset($_GET['mcl_tour_mode']) && $_GET['mcl_tour_mode'] == '1';
            $continue_tour_id = isset($_GET['mcl_continue_tour']) ? intval($_GET['mcl_continue_tour']) : 0;
            $has_tour_id = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : 0;
            
            if (!empty($active_tours) || $is_tour_mode || $continue_tour_id || $has_tour_id) {

            }
        }
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
    
        if ($this->is_inside_pagebuilder_context()) {
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

            if ($this->should_skip_checklist_in_builder($checklist_id)) {
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
                        // Also check for AJAX requests from frontend
                        $is_frontend = !is_admin() || ($this->is_ajax_request() && $this->is_ajax_from_frontend());
                        if ($is_frontend && empty($allowed_pages) && empty($allowed_urls)) {
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
                'enable_progress_counter' => MCL_Settings::get_setting('enable_progress_counter', false),
                'dateFormat' => MCL_Admin::get_shared_date_format(),
                'timezone_string' => get_option('timezone_string', ''),
                'gmt_offset' => get_option('gmt_offset', 0),
                'current_timestamp' => current_time('timestamp'),
                'utc_timestamp' => time()
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
        // Check if tours are active first - tours might need shortcuts too
        if (class_exists('MCL_Tour_CPT')) {
            $active_tours = MCL_Tour_CPT::get_active_tours_for_context();
            $is_tour_mode = isset($_GET['mcl_tour_mode']) && $_GET['mcl_tour_mode'] == '1';
            $continue_tour_id = isset($_GET['mcl_continue_tour']) ? intval($_GET['mcl_continue_tour']) : 0;
            $has_tour_id = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : 0;
            
            if (!empty($active_tours) || $is_tour_mode || $continue_tour_id || $has_tour_id) {

            }
        }
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
                        'content' => MCL_Sanitization::sanitize_item_content($item['content']),
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
                    'content' => MCL_Sanitization::sanitize_item_content($item['content']),
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

        // Also sync to _mcl_kanban_board for Kanban view compatibility
        $existing_board = get_post_meta($checklist_id, '_mcl_kanban_board', true);

        if ($existing_board && is_array($existing_board) && !empty($existing_board)) {
            // Update existing board structure - preserve column structure, update item titles
            $items_map = array();
            foreach ($processed_items as $item) {
                $items_map[$item['id']] = $item;
            }

            foreach ($existing_board as &$column) {
                if (isset($column['items']) && is_array($column['items'])) {
                    foreach ($column['items'] as &$board_item) {
                        // Update title from _mcl_items content if item exists
                        if (isset($items_map[$board_item['id']])) {
                            $board_item['title'] = $items_map[$board_item['id']]['content'];
                        }
                    }
                }
            }
            unset($column, $board_item);

            update_post_meta($checklist_id, '_mcl_kanban_board', $existing_board);
        } else {
            // No existing board, create a default one from items
            $board_items = array();
            foreach ($processed_items as $item) {
                $board_items[] = array(
                    'id' => $item['id'],
                    'title' => $item['content'],
                    'checked' => false,
                    'comment_count' => 0,
                    'assigned_user' => null
                );
            }

            $default_board = array(
                array(
                    'id' => 'col_todo',
                    'title' => 'To Do',
                    'color' => '#ef4444',
                    'items' => $board_items
                ),
                array(
                    'id' => 'col_inprogress',
                    'title' => 'In Progress',
                    'color' => '#f59e0b',
                    'items' => array()
                ),
                array(
                    'id' => 'col_done',
                    'title' => 'Done',
                    'color' => '#22c55e',
                    'items' => array()
                )
            );

            update_post_meta($checklist_id, '_mcl_kanban_board', $default_board);
        }

        wp_send_json_success();
    }

    private function get_checked_state($checklist_id, $context = 'drawer') {
        $handling = $this->get_checked_state_handling($checklist_id, $context);

        if ($handling === 'per_user') {
            if (is_user_logged_in()) {
                $user_id = get_current_user_id();
                $result = get_user_meta($user_id, "_mcl_{$context}_checked_state_" . $checklist_id, true) ?: array();
                error_log('[MCL DEBUG] get_checked_state: per_user mode, user_id=' . $user_id . ', checklist_id=' . $checklist_id . ', context=' . $context . ', result=' . print_r($result, true));
                return $result;
            } else {
                error_log('[MCL DEBUG] get_checked_state: per_user mode, not logged in, returning empty');
                return array();
            }
        }

        // Global handling mode - use same key for all contexts to ensure sync
        $meta_key = '_mcl_checked_state';
        $result = get_post_meta($checklist_id, $meta_key, true) ?: array();
        error_log('[MCL DEBUG] get_checked_state: global mode, checklist_id=' . $checklist_id . ', context=' . $context . ', meta_key=' . $meta_key . ', result=' . print_r($result, true));
        return $result;
    }

    private function get_in_progress_state($checklist_id, $context = 'drawer') {
        $handling = $this->get_checked_state_handling($checklist_id, $context);

        if ($handling === 'per_user') {
            if (is_user_logged_in()) {
                $user_id = get_current_user_id();
                $result = get_user_meta($user_id, "_mcl_{$context}_in_progress_" . $checklist_id, true) ?: array();
                error_log('[MCL DEBUG] get_in_progress_state: per_user mode, user_id=' . $user_id . ', checklist_id=' . $checklist_id . ', context=' . $context . ', result=' . print_r($result, true));
                return $result;
            } else {
                error_log('[MCL DEBUG] get_in_progress_state: per_user mode, not logged in, returning empty');
                return array();
            }
        }

        // Global handling mode
        $result = get_post_meta($checklist_id, '_mcl_items_in_progress', true) ?: array();
        error_log('[MCL DEBUG] get_in_progress_state: global mode, checklist_id=' . $checklist_id . ', context=' . $context . ', result=' . print_r($result, true));
        return $result;
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

        error_log('[MCL DEBUG] save_checked_state: checklist_id=' . $checklist_id . ', context=' . $context . ', handling=' . $checked_state_handling . ', items=' . print_r($checked_items, true));

        if ($checked_state_handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            error_log('[MCL DEBUG] save_checked_state: Saving to user_meta, user_id=' . $user_id . ', meta_key=_mcl_' . $context . '_checked_state_' . $checklist_id);
            update_user_meta($user_id, "_mcl_{$context}_checked_state_" . $checklist_id, $checked_items);
        } else if ($checked_state_handling === 'global') {
            // Use same key for all contexts to ensure sync across views
            $meta_key = '_mcl_checked_state';
            error_log('[MCL DEBUG] save_checked_state: Saving to post_meta, meta_key=' . $meta_key);
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

    /**
     * Get checked state via AJAX
     */
    public function ajax_get_checked_state() {
        $checklist_id = intval($_POST['checklist_id']);
        $context = sanitize_text_field($_POST['context'] ?? 'drawer');

        if (!$checklist_id) {
            wp_send_json_error('Invalid checklist ID');
            return;
        }

        if (!$this->has_permission($checklist_id, 'view')) {
            wp_send_json_error('Permission denied');
            return;
        }

        $checked_state = $this->get_checked_state($checklist_id, $context);
        wp_send_json_success($checked_state);
    }

    public function ajax_get_in_progress_state() {
        $checklist_id = intval($_POST['checklist_id']);
        $context = sanitize_text_field($_POST['context'] ?? 'drawer');

        if (!$checklist_id) {
            wp_send_json_error('Invalid checklist ID');
            return;
        }

        if (!$this->has_permission($checklist_id, 'view')) {
            wp_send_json_error('Permission denied');
            return;
        }

        $in_progress_state = $this->get_in_progress_state($checklist_id, $context);
        wp_send_json_success($in_progress_state);
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

    public function is_inside_pagebuilder_context() {
        static $cached_result = null;

        if ($cached_result !== null) {
            return $cached_result;
        }

        $cached_result = $this->detect_pagebuilder_context();
        return $cached_result;
    }

    private function detect_pagebuilder_context() {
        $param_sets = array();
        $param_sets[] = $this->normalize_param_array($_GET);

        if (isset($_SERVER['HTTP_REFERER'])) {
            $referer_query = wp_parse_url($_SERVER['HTTP_REFERER'], PHP_URL_QUERY);
            if ($referer_query) {
                parse_str($referer_query, $referer_params);
                $param_sets[] = $this->normalize_param_array($referer_params);
            }
        }

        foreach ($param_sets as $params) {
            if (empty($params)) {
                continue;
            }

            if (!empty($params['elementor-preview'])) {
                return true;
            }

            if (!empty($params['bricks']) || isset($params['bricks_iframe'])) {
                return true;
            }

            if (!empty($params['breakdance']) || !empty($params['breakdance_iframe']) || !empty($params['breakdance_browser'])) {
                return true;
            }

            if (!empty($params['et_fb']) || !empty($params['et_builder'])) {
                return true;
            }

            if (!empty($params['fl_builder'])) {
                return true;
            }

            if (!empty($params['ct_builder'])) {
                return true;
            }

            if (!empty($params['tve'])) {
                return true;
            }

            if (!empty($params['vc_editable'])) {
                return true;
            }

            if (!empty($params['fb-edit']) || !empty($params['fusion-editor'])) {
                return true;
            }

            if (!empty($params['ux_builder']) || !empty($params['ux-builder'])) {
                return true;
            }

            if (!empty($params['preview']) || !empty($params['preview_iframe']) || !empty($params['iframe'])) {
                return true;
            }
        }

        if (defined('ELEMENTOR_VERSION') &&
            class_exists('\Elementor\Plugin') &&
            isset(\Elementor\Plugin::$instance->preview) &&
            method_exists(\Elementor\Plugin::$instance->preview, 'is_preview_mode') &&
            \Elementor\Plugin::$instance->preview->is_preview_mode()) {
            return true;
        }

        if (function_exists('bricks_is_builder') && bricks_is_builder()) {
            return true;
        }

        if (function_exists('et_core_is_fb_enabled') && et_core_is_fb_enabled()) {
            return true;
        }

        if (isset($_SERVER['HTTP_SEC_FETCH_DEST']) && $_SERVER['HTTP_SEC_FETCH_DEST'] === 'iframe') {
            return true;
        }

        return false;
    }

    private function normalize_param_array($params) {
        if (empty($params) || !is_array($params)) {
            return array();
        }

        $normalized = array();
        foreach ($params as $key => $value) {
            $normalized[strtolower((string) $key)] = $value;
        }

        return $normalized;
    }

    public function save_in_progress_state() {
        try {
            if (!isset($_POST['checklist_id'])) {
                wp_send_json_error('Missing checklist ID');
                return;
            }

            $checklist_id = intval($_POST['checklist_id']);
            $context = sanitize_text_field($_POST['context'] ?? 'drawer');

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

            // Respect per-user mode like checked state handling
            $checked_state_handling = $this->get_checked_state_handling($checklist_id, $context);

            error_log('[MCL DEBUG] save_in_progress_state: checklist_id=' . $checklist_id . ', context=' . $context . ', handling=' . $checked_state_handling . ', items=' . print_r($items_in_progress, true));

            if ($checked_state_handling === 'per_user' && is_user_logged_in()) {
                $user_id = get_current_user_id();
                error_log('[MCL DEBUG] save_in_progress_state: Saving to user_meta, user_id=' . $user_id . ', meta_key=_mcl_' . $context . '_in_progress_' . $checklist_id);
                update_user_meta($user_id, "_mcl_{$context}_in_progress_" . $checklist_id, $items_in_progress);
            } else if ($checked_state_handling === 'global') {
                error_log('[MCL DEBUG] save_in_progress_state: Saving to post_meta');
                update_post_meta($checklist_id, '_mcl_items_in_progress', $items_in_progress);
            }
            // For per-user mode with logged-out users, client handles via localStorage

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

            // Get ALL active checklists that should be loaded on this page
            $active_checklists = $this->get_all_active_checklists_for_page();
            
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
                $trigger_button = get_post_meta($checklist_id, '_mcl_trigger_button', true);
            $disable_in_builders = get_post_meta($checklist_id, '_mcl_disable_in_builders', true);
                
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
                    'float_button_text_color' => get_post_meta($checklist_id, '_mcl_float_button_text_color', true) ?: '#1a1a1a',
                    'has_floating_button' => $trigger_button == '1',
                    'disableInBuilders' => !empty($disable_in_builders) && $disable_in_builders !== '0'
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
    
    /**
     * Add an item to a checklist with notifications
     */
    public function add_item() {
        $checklist_id = intval($_POST['checklist_id'] ?? 0);
        $item_data = $_POST['item'] ?? null;
        
        if (!$checklist_id || !$item_data) {
            wp_send_json_error('Missing required data');
            return;
        }
        
        // Decode JSON if it's a string
        if (is_string($item_data)) {
            $item_data = json_decode(stripslashes($item_data), true);
        }
        
        if (!is_array($item_data)) {
            wp_send_json_error('Invalid item data');
            return;
        }
        
        // Check permissions
        if (!$this->has_permission($checklist_id, 'edit')) {
            wp_send_json_error('Permission denied');
            return;
        }
        
        // Get existing items
        $existing_items = get_post_meta($checklist_id, '_mcl_items', true) ?: array();
        
        // Sanitize new item
        $new_item = array(
            'id' => sanitize_text_field($item_data['id']),
            'content' => MCL_Sanitization::sanitize_item_content($item_data['content']),
            'parent_id' => isset($item_data['parent_id']) ? sanitize_text_field($item_data['parent_id']) : '',
            'priority' => isset($item_data['priority']) ? sanitize_text_field($item_data['priority']) : 'none',
            'locked' => false
        );
        
        // Add the new item
        $existing_items[] = $new_item;
        
        // Save to database
        update_post_meta($checklist_id, '_mcl_items', $existing_items);
        
        // Trigger notification
        do_action('mcl_item_added', $checklist_id, $new_item);
        
        wp_send_json_success(array('item' => $new_item));
    }
    
    /**
     * Delete an item from a checklist with notifications
     */
    public function delete_item() {
        $checklist_id = intval($_POST['checklist_id'] ?? 0);
        $item_id = sanitize_text_field($_POST['item_id'] ?? '');
        
        if (!$checklist_id || !$item_id) {
            wp_send_json_error('Missing required data');
            return;
        }
        
        // Check permissions
        if (!$this->has_permission($checklist_id, 'edit')) {
            wp_send_json_error('Permission denied');
            return;
        }
        
        // Get existing items
        $existing_items = get_post_meta($checklist_id, '_mcl_items', true) ?: array();
        
        // Find and remove the item
        $deleted_item = null;
        $filtered_items = array();
        
        foreach ($existing_items as $item) {
            if ($item['id'] === $item_id) {
                $deleted_item = $item;
            } else {
                $filtered_items[] = $item;
            }
        }
        
        if (!$deleted_item) {
            wp_send_json_error('Item not found');
            return;
        }
        
        // Save updated items
        update_post_meta($checklist_id, '_mcl_items', $filtered_items);
        
        // Trigger notification
        do_action('mcl_item_deleted', $checklist_id, $deleted_item);

        wp_send_json_success(array('deleted_item' => $deleted_item));
    }

    /**
     * Get kanban board structure for a checklist
     */
    public function get_kanban_board() {
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $context = isset($_POST['context']) ? sanitize_text_field($_POST['context']) : 'admin';

        if (!$checklist_id) {
            wp_send_json_error('Invalid checklist ID');
            return;
        }

        // Check permissions
        if (!$this->has_permission($checklist_id, 'view')) {
            wp_send_json_error('Permission denied');
            return;
        }

        // Get the kanban board structure from post meta
        $board = get_post_meta($checklist_id, '_mcl_kanban_board', true);

        // Get checklist items for syncing
        $checklist_items = get_post_meta($checklist_id, '_mcl_items', true) ?: array();
        $checked_state = $this->get_checked_state($checklist_id, $context);
        $in_progress_state = $this->get_in_progress_state($checklist_id, $context);

        // If no board exists, create a default structure from checklist items
        if (!$board || !is_array($board) || empty($board)) {
            // Map items to board structure
            $boardItems = array();
            foreach ($checklist_items as $item) {
                $boardItems[] = array(
                    'id' => $item['id'],
                    'title' => $item['content'],
                    'checked' => in_array($item['id'], $checked_state),
                    'inProgress' => in_array($item['id'], $in_progress_state),
                    'comment_count' => 0,
                    'assigned_user' => null
                );
            }

            // Create default 3-column board
            $board = array(
                array(
                    'id' => 'col_todo',
                    'title' => 'To Do',
                    'color' => '#ef4444',
                    'items' => $boardItems
                ),
                array(
                    'id' => 'col_inprogress',
                    'title' => 'In Progress',
                    'color' => '#f59e0b',
                    'items' => array()
                ),
                array(
                    'id' => 'col_done',
                    'title' => 'Done',
                    'color' => '#22c55e',
                    'items' => array()
                )
            );
        } else {
            // Sync: Check for new checklist items not yet in the kanban board
            // Collect all item IDs currently in the board
            $board_item_ids = array();
            foreach ($board as $column) {
                if (isset($column['items']) && is_array($column['items'])) {
                    foreach ($column['items'] as $item) {
                        $board_item_ids[] = $item['id'];
                    }
                }
            }

            // Find new items that aren't in the board yet
            $new_items = array();
            foreach ($checklist_items as $item) {
                if (!in_array($item['id'], $board_item_ids)) {
                    $new_items[] = array(
                        'id' => $item['id'],
                        'title' => $item['content'],
                        'checked' => in_array($item['id'], $checked_state),
                        'inProgress' => in_array($item['id'], $in_progress_state),
                        'comment_count' => 0,
                        'assigned_user' => null
                    );
                }
            }

            // Add new items to the first column (To Do)
            if (!empty($new_items)) {
                // Find the first column (usually 'col_todo' or index 0)
                $first_column_index = 0;
                foreach ($board as $index => $column) {
                    if ($column['id'] === 'col_todo') {
                        $first_column_index = $index;
                        break;
                    }
                }

                // Append new items to the first column
                if (!isset($board[$first_column_index]['items'])) {
                    $board[$first_column_index]['items'] = array();
                }
                $board[$first_column_index]['items'] = array_merge($board[$first_column_index]['items'], $new_items);
            }

            // Sync: Remove items from kanban board that no longer exist in checklist items
            $checklist_item_ids = array_map(function($item) {
                return $item['id'];
            }, $checklist_items);

            $board_changed = false;
            foreach ($board as &$column) {
                if (isset($column['items']) && is_array($column['items'])) {
                    $original_count = count($column['items']);
                    $column['items'] = array_values(array_filter($column['items'], function($item) use ($checklist_item_ids) {
                        return in_array($item['id'], $checklist_item_ids);
                    }));
                    if (count($column['items']) !== $original_count) {
                        $board_changed = true;
                    }
                }
            }
            unset($column); // Break reference

            // Sync: Update checked and inProgress state of all existing items
            foreach ($board as &$column) {
                if (isset($column['items']) && is_array($column['items'])) {
                    foreach ($column['items'] as &$item) {
                        // Sync checked state
                        $should_be_checked = in_array($item['id'], $checked_state);
                        if ($item['checked'] !== $should_be_checked) {
                            $item['checked'] = $should_be_checked;
                            $board_changed = true;
                        }
                        // Sync inProgress state
                        $should_be_in_progress = in_array($item['id'], $in_progress_state);
                        $current_in_progress = isset($item['inProgress']) ? $item['inProgress'] : false;
                        if ($current_in_progress !== $should_be_in_progress) {
                            $item['inProgress'] = $should_be_in_progress;
                            $board_changed = true;
                        }
                    }
                }
            }
            unset($column, $item); // Break references

            // Save the updated board if there were any changes (new items added or deleted items removed)
            if (!empty($new_items) || $board_changed) {
                update_post_meta($checklist_id, '_mcl_kanban_board', $board);
            }
        }

        // Enrich board items with comment counts and user assignments
        global $wpdb;
        $comments_table = $wpdb->prefix . 'mcl_task_comments';

        // Check if comments table exists
        $comments_table_exists = $wpdb->get_var("SHOW TABLES LIKE '$comments_table'") == $comments_table;

        foreach ($board as &$column) {
            if (isset($column['items']) && is_array($column['items'])) {
                foreach ($column['items'] as &$item) {
                    // Get comment count if table exists
                    if ($comments_table_exists) {
                        // Strip ALL non-numeric characters to get unique ID (e.g., "item_123_1" -> "1231")
                        // This matches the frontend logic: /\D/g
                        $item_id_numeric = intval(preg_replace('/[^0-9]/', '', $item['id']));
                        $comment_count = $wpdb->get_var($wpdb->prepare(
                            "SELECT COUNT(*) FROM $comments_table WHERE checklist_id = %d AND item_id = %d",
                            $checklist_id,
                            $item_id_numeric
                        ));
                        $item['comment_count'] = intval($comment_count);
                    } else {
                        $item['comment_count'] = 0;
                    }

                    // Ensure assigned_user is set (may be null)
                    if (!isset($item['assigned_user'])) {
                        $item['assigned_user'] = null;
                    }
                }
            }
        }

        // Get list of users for assignment dropdown
        $users = array();
        if (function_exists('get_users')) {
            $wp_users = get_users(array('fields' => array('ID', 'display_name', 'user_email')));
            foreach ($wp_users as $user) {
                $users[] = array(
                    'id' => $user->ID,
                    'name' => $user->display_name,
                    'email' => $user->user_email,
                    'avatar' => get_avatar_url($user->ID, array('size' => 40))
                );
            }
        }

        wp_send_json_success(array(
            'board' => $board,
            'users' => $users
        ));
    }

    /**
     * Save kanban board structure for a checklist
     */
    public function save_kanban_board() {
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $board = isset($_POST['board']) ? json_decode(stripslashes($_POST['board']), true) : null;
        $context = isset($_POST['context']) ? sanitize_text_field($_POST['context']) : 'admin';

        if (!$checklist_id || !$board) {
            wp_send_json_error('Missing required data');
            return;
        }

        // Check permissions - need interact permission minimum to move items
        if (!$this->has_permission($checklist_id, 'interact')) {
            wp_send_json_error('Permission denied');
            return;
        }

        // Sanitize the board data
        $sanitized_board = array();
        foreach ($board as $column) {
            $sanitized_column = array(
                'id' => sanitize_text_field($column['id']),
                'title' => sanitize_text_field($column['title']),
                'color' => sanitize_hex_color($column['color']),
                'items' => array()
            );

            if (isset($column['items']) && is_array($column['items'])) {
                foreach ($column['items'] as $item) {
                    $sanitized_item = array(
                        'id' => sanitize_text_field($item['id']),
                        'title' => wp_kses_post($item['title']),
                        'checked' => !empty($item['checked'])
                    );

                    // Preserve assigned user if present
                    if (isset($item['assigned_user']) && is_array($item['assigned_user'])) {
                        $sanitized_item['assigned_user'] = array(
                            'id' => intval($item['assigned_user']['id']),
                            'name' => sanitize_text_field($item['assigned_user']['name']),
                            'avatar' => esc_url_raw($item['assigned_user']['avatar'])
                        );
                    } else {
                        $sanitized_item['assigned_user'] = null;
                    }

                    // Comment count is not saved, it's always calculated dynamically
                    // but we include it for consistency
                    $sanitized_item['comment_count'] = isset($item['comment_count']) ? intval($item['comment_count']) : 0;

                    $sanitized_column['items'][] = $sanitized_item;
                }
            }

            $sanitized_board[] = $sanitized_column;
        }

        // Save the board structure
        update_post_meta($checklist_id, '_mcl_kanban_board', $sanitized_board);

        // Also sync kanban board data to _mcl_items for drawer compatibility
        // Get existing items to preserve parent_id and priority fields
        $existing_items = get_post_meta($checklist_id, '_mcl_items', true) ?: array();
        $existing_items_map = array();
        foreach ($existing_items as $existing_item) {
            $existing_items_map[$existing_item['id']] = $existing_item;
        }

        // Build updated items array from kanban board
        $updated_items = array();
        foreach ($sanitized_board as $column) {
            foreach ($column['items'] as $item) {
                $item_data = array(
                    'id' => $item['id'],
                    'content' => $item['title'], // Map title to content
                    'parent_id' => '',
                    'priority' => 'none',
                    'locked' => false
                );

                // Preserve parent_id, priority, and locked status if item already exists
                if (isset($existing_items_map[$item['id']])) {
                    $existing = $existing_items_map[$item['id']];
                    $item_data['parent_id'] = isset($existing['parent_id']) ? $existing['parent_id'] : '';
                    $item_data['priority'] = isset($existing['priority']) ? $existing['priority'] : 'none';
                    $item_data['locked'] = isset($existing['locked']) ? $existing['locked'] : false;
                }

                $updated_items[] = $item_data;
            }
        }

        // Update _mcl_items to keep it in sync with kanban board
        update_post_meta($checklist_id, '_mcl_items', $updated_items);

        // Also update checked state based on kanban board
        $checked_items = array();
        foreach ($sanitized_board as $column) {
            foreach ($column['items'] as $item) {
                if ($item['checked']) {
                    $checked_items[] = $item['id'];
                }
            }
        }

        // Update checked state
        $checked_state_handling = $this->get_checked_state_handling($checklist_id, $context);

        if ($checked_state_handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            update_user_meta($user_id, "_mcl_{$context}_checked_state_" . $checklist_id, $checked_items);
        } else if ($checked_state_handling === 'global') {
            // Use same key for all contexts to ensure sync across views
            $meta_key = '_mcl_checked_state';
            update_post_meta($checklist_id, $meta_key, $checked_items);
        }

        wp_send_json_success();
    }

    /**
     * Get threaded comments for a task (public-facing)
     */
    public function get_threaded_comments_public() {
        try {
            // Verify nonce for public context
            $nonce = isset($_POST['nonce']) ? $_POST['nonce'] : '';
            $is_logged_in = is_user_logged_in();

            if ($is_logged_in) {
                if (!wp_verify_nonce($nonce, 'mcl_ajax_nonce')) {
                    // If public nonce fails, return early and let admin hook try
                    return;
                }
            } else {
                if (!wp_verify_nonce($nonce, 'mcl_ajax_nopriv_nonce')) {
                    // If public nonce fails, return early and let admin hook try
                    return;
                }
            }

            $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
            $item_id = isset($_POST['item_id']) ? intval($_POST['item_id']) : 0;

            if (!$checklist_id || !$item_id) {
                wp_send_json_error('Invalid parameters');
                return;
            }

            global $wpdb;

            // Check feature board settings for comments - allow reading if comments are enabled for anyone
            $can_read_comments = false;
            $settings_table = $wpdb->prefix . 'mcl_feature_board_settings';
            $fb_settings = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $settings_table WHERE checklist_id = %d",
                $checklist_id
            ));

            // If feature board is enabled, check comments_mode
            if ($fb_settings && $fb_settings->enabled) {
                $comments_mode = $fb_settings->comments_mode;

                if ($comments_mode === 'anyone') {
                    $can_read_comments = true;
                } elseif ($comments_mode === 'logged_in' && $is_logged_in) {
                    $can_read_comments = true;
                }
            }

            // Fall back to normal permission check if feature board doesn't allow
            if (!$can_read_comments && !$this->has_permission($checklist_id, 'view')) {
                wp_send_json_error('Permission denied');
                return;
            }

            $comments_table = $wpdb->prefix . 'mcl_task_comments';
            $likes_table = $wpdb->prefix . 'mcl_comment_likes';

            // Check if tables exist
            if ($wpdb->get_var("SHOW TABLES LIKE '$comments_table'") != $comments_table ||
                $wpdb->get_var("SHOW TABLES LIKE '$likes_table'") != $likes_table) {
                // Try to create tables
                if (class_exists('MCL_DB_Manager')) {
                    MCL_DB_Manager::get_instance()->install();
                }
            }

            $current_user_email = '';
            if ($is_logged_in) {
                $current_user = wp_get_current_user();
                $current_user_email = $current_user->user_email;
            }

            // Get all comments
            $comments = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $comments_table
                 WHERE checklist_id = %d AND item_id = %d
                 ORDER BY parent_id IS NULL DESC, created_at ASC",
                $checklist_id,
                $item_id
            ));

            // Get like information for each comment
            foreach ($comments as &$comment) {
                // Get like count
                $like_count = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM $likes_table WHERE comment_id = %d",
                    $comment->id
                ));
                $comment->like_count = intval($like_count);

                // Check if current user liked this comment
                if ($is_logged_in && $current_user_email) {
                    $user_liked = $wpdb->get_var($wpdb->prepare(
                        "SELECT COUNT(*) FROM $likes_table WHERE comment_id = %d AND user_email = %s",
                        $comment->id,
                        $current_user_email
                    ));
                    $comment->user_liked = intval($user_liked) > 0 ? 1 : 0;
                } else {
                    $comment->user_liked = 0;
                }
            }

            // Organize comments into threaded structure
            $threaded_comments = $this->organize_threaded_comments($comments);

            wp_send_json_success(array(
                'comments' => $threaded_comments
            ));
        } catch (Exception $e) {
            error_log('Error in get_threaded_comments_public: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Failed to load comments'));
        }
    }

    /**
     * Add a threaded comment (public-facing)
     */
    public function add_threaded_comment_public() {
        try {
            // Verify nonce for public context
            $nonce = isset($_POST['nonce']) ? $_POST['nonce'] : '';
            $is_logged_in = is_user_logged_in();

            if ($is_logged_in) {
                if (!wp_verify_nonce($nonce, 'mcl_ajax_nonce')) {
                    // If public nonce fails, return early and let admin hook try
                    return;
                }
            } else {
                if (!wp_verify_nonce($nonce, 'mcl_ajax_nopriv_nonce')) {
                    // If public nonce fails, return early and let admin hook try
                    return;
                }
            }

            $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
            $item_id = isset($_POST['item_id']) ? intval($_POST['item_id']) : 0;
            $parent_id = isset($_POST['parent_id']) && !empty($_POST['parent_id']) ? intval($_POST['parent_id']) : null;
            $comment_content = isset($_POST['comment_content']) ? wp_kses_post($_POST['comment_content']) : '';

            if (!$checklist_id || !$item_id || empty($comment_content)) {
                wp_send_json_error('Invalid parameters');
                return;
            }

            global $wpdb;

            // Check feature board settings for comments
            $settings_table = $wpdb->prefix . 'mcl_feature_board_settings';
            $fb_settings = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $settings_table WHERE checklist_id = %d",
                $checklist_id
            ));

            $can_comment = false;

            // If feature board is enabled, check comments_mode
            if ($fb_settings && $fb_settings->enabled) {
                $comments_mode = $fb_settings->comments_mode;

                if ($comments_mode === 'anyone') {
                    $can_comment = true;
                } elseif ($comments_mode === 'logged_in' && $is_logged_in) {
                    $can_comment = true;
                } elseif ($comments_mode === 'disabled') {
                    wp_send_json_error('Comments are disabled for this board');
                    return;
                }
            }

            // Fall back to normal permission check if feature board is not enabled or doesn't allow
            if (!$can_comment && !$this->has_permission($checklist_id, 'interact')) {
                wp_send_json_error('Permission denied');
                return;
            }
            $comments_table = $wpdb->prefix . 'mcl_task_comments';
            $likes_table = $wpdb->prefix . 'mcl_comment_likes';

            // Check if tables exist
            if ($wpdb->get_var("SHOW TABLES LIKE '$comments_table'") != $comments_table ||
                $wpdb->get_var("SHOW TABLES LIKE '$likes_table'") != $likes_table) {
                // Try to create tables
                if (class_exists('MCL_DB_Manager')) {
                    MCL_DB_Manager::get_instance()->install();
                }
            }

            // Validate parent comment exists and belongs to same item (if replying)
            if ($parent_id) {
                $parent_comment = $wpdb->get_row($wpdb->prepare(
                    "SELECT * FROM $comments_table WHERE id = %d AND checklist_id = %d AND item_id = %d",
                    $parent_id,
                    $checklist_id,
                    $item_id
                ));

                if (!$parent_comment) {
                    wp_send_json_error('Invalid parent comment');
                    return;
                }

                // Don't allow replies to replies (max 2 levels)
                if ($parent_comment->parent_id !== null) {
                    wp_send_json_error('Cannot reply to a reply');
                    return;
                }
            }

            // Get user info
            $user_id = 0;
            $user_name = 'Guest';
            $user_email = '';
            $user_avatar = '';

            if ($is_logged_in) {
                $current_user = wp_get_current_user();
                $user_id = $current_user->ID;
                $user_name = $current_user->display_name;
                $user_email = $current_user->user_email;
                $user_avatar = get_avatar_url($current_user->ID, array('size' => 40));
            } else {
                // For guests, use a default avatar
                $user_avatar = get_avatar_url('', array('size' => 40, 'default' => 'mystery'));
            }

            $result = $wpdb->insert(
                $comments_table,
                array(
                    'checklist_id' => $checklist_id,
                    'item_id' => $item_id,
                    'parent_id' => $parent_id,
                    'user_id' => $user_id,
                    'user_name' => $user_name,
                    'user_email' => $user_email,
                    'user_avatar' => $user_avatar,
                    'comment_content' => $comment_content,
                    'like_count' => 0,
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ),
                array('%d', '%d', '%d', '%d', '%s', '%s', '%s', '%s', '%d', '%s', '%s')
            );

            if ($result === false) {
                wp_send_json_error('Failed to add comment');
                return;
            }

            $comment_id = $wpdb->insert_id;
            $new_comment = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $comments_table WHERE id = %d",
                $comment_id
            ));

            // Add user_liked field for consistency
            $new_comment->user_liked = 0;

            wp_send_json_success(array(
                'message' => 'Comment added successfully',
                'comment' => $new_comment
            ));
        } catch (Exception $e) {
            error_log('Error in add_threaded_comment_public: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Failed to add comment'));
        }
    }

    /**
     * Toggle like on a comment (public-facing)
     */
    public function toggle_comment_like_public() {
        try {
            // Verify nonce for public context
            $nonce = isset($_POST['nonce']) ? $_POST['nonce'] : '';
            $is_logged_in = is_user_logged_in();

            if ($is_logged_in) {
                if (!wp_verify_nonce($nonce, 'mcl_ajax_nonce')) {
                    // If public nonce fails, return early and let admin hook try
                    return;
                }
            } else {
                if (!wp_verify_nonce($nonce, 'mcl_ajax_nopriv_nonce')) {
                    // If public nonce fails, return early and let admin hook try
                    return;
                }
            }

            // Guest users can't like comments
            if (!$is_logged_in) {
                wp_send_json_error('Must be logged in to like comments');
                return;
            }

            $comment_id = isset($_POST['comment_id']) ? intval($_POST['comment_id']) : 0;

            if (!$comment_id) {
                wp_send_json_error('Invalid parameters');
                return;
            }

            $current_user = wp_get_current_user();

            global $wpdb;
            $comments_table = $wpdb->prefix . 'mcl_task_comments';
            $likes_table = $wpdb->prefix . 'mcl_comment_likes';

            // Check if tables exist
            if ($wpdb->get_var("SHOW TABLES LIKE '$comments_table'") != $comments_table ||
                $wpdb->get_var("SHOW TABLES LIKE '$likes_table'") != $likes_table) {
                // Try to create tables
                if (class_exists('MCL_DB_Manager')) {
                    MCL_DB_Manager::get_instance()->install();
                }
            }

            // Check if comment exists and get checklist_id for permission check
            $comment = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $comments_table WHERE id = %d",
                $comment_id
            ));

            if (!$comment) {
                wp_send_json_error('Comment not found');
                return;
            }

            // Check permissions - need at least interact permission
            if (!$this->has_permission($comment->checklist_id, 'interact')) {
                wp_send_json_error('Permission denied');
                return;
            }

            // Check if user already liked this comment
            $existing_like = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $likes_table WHERE comment_id = %d AND user_email = %s",
                $comment_id,
                $current_user->user_email
            ));

            if ($existing_like) {
                // Unlike - remove the like
                $wpdb->delete(
                    $likes_table,
                    array('id' => $existing_like->id),
                    array('%d')
                );

                // Update comment like count
                $wpdb->query($wpdb->prepare(
                    "UPDATE $comments_table SET like_count = like_count - 1 WHERE id = %d",
                    $comment_id
                ));

                $action = 'unliked';
            } else {
                // Like - add the like
                $wpdb->insert(
                    $likes_table,
                    array(
                        'comment_id' => $comment_id,
                        'user_id' => $current_user->ID,
                        'user_email' => $current_user->user_email,
                        'user_name' => $current_user->display_name,
                        'created_at' => current_time('mysql')
                    ),
                    array('%d', '%d', '%s', '%s', '%s')
                );

                // Update comment like count
                $wpdb->query($wpdb->prepare(
                    "UPDATE $comments_table SET like_count = like_count + 1 WHERE id = %d",
                    $comment_id
                ));

                $action = 'liked';
            }

            // Get updated like count
            $updated_comment = $wpdb->get_row($wpdb->prepare(
                "SELECT like_count FROM $comments_table WHERE id = %d",
                $comment_id
            ));

            wp_send_json_success(array(
                'message' => "Comment $action successfully",
                'action' => $action,
                'like_count' => $updated_comment->like_count,
                'user_liked' => $action === 'liked' ? 1 : 0
            ));
        } catch (Exception $e) {
            error_log('Error in toggle_comment_like_public: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Failed to toggle like'));
        }
    }

    /**
     * Delete threaded comment (public-facing, requires edit permission)
     */
    public function delete_threaded_comment_public() {
        try {
            // Verify nonce for public context
            $nonce = isset($_POST['nonce']) ? $_POST['nonce'] : '';
            $is_logged_in = is_user_logged_in();

            if ($is_logged_in) {
                if (!wp_verify_nonce($nonce, 'mcl_ajax_nonce')) {
                    // If public nonce fails, return early and let admin hook try
                    return;
                }
            } else {
                if (!wp_verify_nonce($nonce, 'mcl_ajax_nopriv_nonce')) {
                    // If public nonce fails, return early and let admin hook try
                    return;
                }
            }

            $comment_id = isset($_POST['comment_id']) ? intval($_POST['comment_id']) : 0;

            if (!$comment_id) {
                wp_send_json_error('Invalid parameters');
                return;
            }

            global $wpdb;
            $comments_table = $wpdb->prefix . 'mcl_task_comments';
            $likes_table = $wpdb->prefix . 'mcl_comment_likes';

            // Check if tables exist
            if ($wpdb->get_var("SHOW TABLES LIKE '$comments_table'") != $comments_table ||
                $wpdb->get_var("SHOW TABLES LIKE '$likes_table'") != $likes_table) {
                wp_send_json_error('Tables not found');
                return;
            }

            // Get comment to check permissions
            $comment = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $comments_table WHERE id = %d",
                $comment_id
            ));

            if (!$comment) {
                wp_send_json_error('Comment not found');
                return;
            }

            // Check permissions - need edit permission to delete comments
            if (!$this->has_permission($comment->checklist_id, 'edit')) {
                wp_send_json_error('Permission denied');
                return;
            }

            // Delete all replies first
            $wpdb->delete(
                $comments_table,
                array('parent_id' => $comment_id),
                array('%d')
            );

            // Delete likes for all replies
            $wpdb->query($wpdb->prepare(
                "DELETE FROM $likes_table WHERE comment_id IN (SELECT id FROM $comments_table WHERE parent_id = %d)",
                $comment_id
            ));

            // Delete likes for the comment
            $wpdb->delete(
                $likes_table,
                array('comment_id' => $comment_id),
                array('%d')
            );

            // Delete the comment itself
            $wpdb->delete(
                $comments_table,
                array('id' => $comment_id),
                array('%d')
            );

            wp_send_json_success(array('message' => 'Comment deleted successfully'));
        } catch (Exception $e) {
            error_log('Error in delete_threaded_comment_public: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Failed to delete comment'));
        }
    }

    /**
     * Organize flat comments array into threaded structure
     */
    private function organize_threaded_comments($comments) {
        $threaded = array();
        $indexed = array();

        // First pass: index all comments by ID
        foreach ($comments as $comment) {
            $comment->replies = array();
            $indexed[$comment->id] = $comment;
        }

        // Second pass: build the tree structure
        foreach ($indexed as $comment) {
            if ($comment->parent_id === null) {
                // Top level comment
                $threaded[] = $comment;
            } else {
                // Reply to another comment
                if (isset($indexed[$comment->parent_id])) {
                    $indexed[$comment->parent_id]->replies[] = $comment;
                }
            }
        }

        return $threaded;
    }

    /**
     * Get feature board settings for a checklist
     */
    public function get_feature_board_settings() {
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;

        if (!$checklist_id) {
            wp_send_json_error(array('message' => 'Invalid checklist ID'));
            return;
        }

        global $wpdb;
        $table = $wpdb->prefix . 'mcl_feature_board_settings';

        $settings = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE checklist_id = %d",
            $checklist_id
        ), ARRAY_A);

        // Return default settings if none exist
        if (!$settings) {
            $settings = array(
                'enabled' => false,
                'upvote_mode' => 'logged_in', // anyone, logged_in, email_verified
                'upvote_require_email_verification' => false,
                'upvote_anon_check_localstorage' => true,
                'upvote_anon_check_ip' => false,
                'comments_mode' => 'logged_in',
                'comments_require_email_verification' => false,
                'idea_submission_enabled' => false,
                'idea_submission_mode' => 'logged_in',
                'idea_submission_require_email_verification' => false,
                'idea_default_column' => 'col_todo',
                'idea_moderation_enabled' => true,
                'show_upvote_count' => true,
                'show_comment_count' => true,
                'allow_anonymous_viewing' => true,
                'visible_columns' => null
            );
        } else {
            // Convert string values to booleans
            $settings['enabled'] = (bool) $settings['enabled'];
            $settings['upvote_require_email_verification'] = (bool) $settings['upvote_require_email_verification'];
            $settings['upvote_anon_check_localstorage'] = isset($settings['upvote_anon_check_localstorage']) ? (bool) $settings['upvote_anon_check_localstorage'] : true;
            $settings['upvote_anon_check_ip'] = isset($settings['upvote_anon_check_ip']) ? (bool) $settings['upvote_anon_check_ip'] : false;
            $settings['comments_require_email_verification'] = (bool) $settings['comments_require_email_verification'];
            $settings['idea_submission_enabled'] = (bool) $settings['idea_submission_enabled'];
            $settings['idea_submission_require_email_verification'] = (bool) $settings['idea_submission_require_email_verification'];
            $settings['idea_moderation_enabled'] = (bool) $settings['idea_moderation_enabled'];
            $settings['show_upvote_count'] = (bool) $settings['show_upvote_count'];
            $settings['show_comment_count'] = (bool) $settings['show_comment_count'];
            $settings['allow_anonymous_viewing'] = (bool) $settings['allow_anonymous_viewing'];
            $settings['visible_columns'] = $settings['visible_columns'] ? maybe_unserialize($settings['visible_columns']) : null;
        }

        wp_send_json_success(array('settings' => $settings));
    }

    /**
     * Get column sync settings for shortcode kanban (public handler)
     */
    public function get_column_sync_settings_public() {
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;

        if (!$checklist_id) {
            wp_send_json_error(array('message' => 'Invalid checklist ID'));
            return;
        }

        // Check if user has at least view permission
        if (!$this->has_permission($checklist_id, 'view')) {
            wp_send_json_error(array('message' => 'Permission denied'));
            return;
        }

        // Get column sync settings from post meta
        $settings = get_post_meta($checklist_id, '_mcl_column_sync_settings', true);

        if (!$settings || !is_array($settings)) {
            $settings = array(
                'enabled' => false,
                'done_column' => '',
                'in_progress_column' => '',
                'todo_column' => ''
            );
        }

        wp_send_json_success(array('settings' => $settings));
    }

    /**
     * Toggle upvote on a kanban item (feature board)
     */
    public function toggle_item_upvote() {
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $item_id = isset($_POST['item_id']) ? sanitize_text_field($_POST['item_id']) : '';
        $user_email = isset($_POST['user_email']) ? sanitize_email($_POST['user_email']) : '';
        $user_name = isset($_POST['user_name']) ? sanitize_text_field($_POST['user_name']) : '';

        if (!$checklist_id || !$item_id) {
            wp_send_json_error(array('message' => 'Invalid checklist or item ID'));
            return;
        }

        // Get feature board settings
        global $wpdb;
        $settings_table = $wpdb->prefix . 'mcl_feature_board_settings';
        $settings = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $settings_table WHERE checklist_id = %d",
            $checklist_id
        ));

        $upvote_mode = $settings ? $settings->upvote_mode : 'logged_in';
        $require_verification = $settings ? (bool) $settings->upvote_require_email_verification : false;
        $check_ip = $settings && isset($settings->upvote_anon_check_ip) ? (bool) $settings->upvote_anon_check_ip : false;

        // Generate IP hash for anonymous upvote tracking
        $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $ip_hash = hash('sha256', $ip_address . $checklist_id . wp_salt('auth'));

        // Determine user info
        $current_user = wp_get_current_user();
        $is_logged_in = is_user_logged_in();

        if ($is_logged_in) {
            $user_id = $current_user->ID;
            $user_email = $current_user->user_email;
            $user_name = $current_user->display_name;
        } else {
            $user_id = null;

            // Check if upvotes from non-logged-in users are allowed
            if ($upvote_mode === 'logged_in') {
                wp_send_json_error(array('message' => 'You must be logged in to upvote', 'require_login' => true));
                return;
            }

            // For 'email_verified' mode, email is required
            if ($upvote_mode === 'email_verified' && !$user_email) {
                wp_send_json_error(array('message' => 'Email is required to upvote', 'require_email' => true));
                return;
            }

            // For 'anyone' mode without email, generate anonymous identifier based on IP
            if ($upvote_mode === 'anyone' && !$user_email) {
                $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
                $user_email = 'anon_' . md5($ip_address . $checklist_id) . '@anonymous.local';
                $user_name = 'Anonymous';
            }

            if (!$user_name) {
                $user_name = 'Anonymous';
            }
        }

        $upvotes_table = $wpdb->prefix . 'mcl_item_upvotes';

        // Check if user already upvoted (by email first)
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $upvotes_table WHERE checklist_id = %d AND item_id = %s AND user_email = %s",
            $checklist_id, $item_id, $user_email
        ));

        // If IP check is enabled and no existing upvote found by email, also check by IP hash
        // IP hashes are only valid for 30 days (for GDPR compliance / data minimization)
        $existing_by_ip = null;
        $ip_hash_expiry_days = 30;
        if (!$existing && !$is_logged_in && $upvote_mode === 'anyone' && $check_ip) {
            $existing_by_ip = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $upvotes_table WHERE checklist_id = %d AND item_id = %s AND ip_hash = %s AND created_at > DATE_SUB(NOW(), INTERVAL %d DAY)",
                $checklist_id, $item_id, $ip_hash, $ip_hash_expiry_days
            ));
        }

        if ($existing || $existing_by_ip) {
            // Remove upvote
            $upvote_to_remove = $existing ? $existing : $existing_by_ip;
            $wpdb->delete(
                $upvotes_table,
                array('id' => $upvote_to_remove->id),
                array('%d')
            );
            $action = 'removed';
        } else {
            // Check if email verification is required for non-logged-in users
            $email_verified = 1; // Default to verified
            $verification_token = null;

            if (!$is_logged_in && $upvote_mode === 'email_verified' && $require_verification) {
                // Only require verification for email_verified mode
                $verification_token = wp_generate_password(32, false);
                $email_verified = 0;

                // Send verification email
                $this->send_verification_email($user_email, $user_name, $verification_token, 'upvote', $checklist_id, $item_id);
            }
            // For "anyone" mode or logged-in users, upvote is automatically verified

            // Add upvote (include IP hash for anonymous users when IP check is enabled)
            $insert_data = array(
                'checklist_id' => $checklist_id,
                'item_id' => $item_id,
                'user_id' => $user_id,
                'user_email' => $user_email,
                'user_name' => $user_name,
                'ip_hash' => (!$is_logged_in && $check_ip) ? $ip_hash : null,
                'email_verified' => $email_verified,
                'verification_token' => $verification_token
            );

            $wpdb->insert(
                $upvotes_table,
                $insert_data,
                array('%d', '%s', '%d', '%s', '%s', '%s', '%d', '%s')
            );
            $action = 'added';

            if ($verification_token) {
                wp_send_json_success(array(
                    'action' => 'pending_verification',
                    'message' => 'Please check your email to verify your upvote'
                ));
                return;
            }
        }

        // Get updated upvote count
        $upvote_count = $this->get_item_upvote_count($checklist_id, $item_id);

        wp_send_json_success(array(
            'action' => $action,
            'upvote_count' => $upvote_count,
            'user_upvoted' => ($action === 'added')
        ));
    }

    /**
     * Get upvotes for items in a checklist
     */
    public function get_item_upvotes() {
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $item_ids = isset($_POST['item_ids']) ? array_map('sanitize_text_field', (array) $_POST['item_ids']) : array();

        if (!$checklist_id) {
            wp_send_json_error(array('message' => 'Invalid checklist ID'));
            return;
        }

        global $wpdb;
        $upvotes_table = $wpdb->prefix . 'mcl_item_upvotes';

        // Get current user email
        $current_user_email = '';
        if (is_user_logged_in()) {
            $current_user = wp_get_current_user();
            $current_user_email = $current_user->user_email;
        }

        $upvotes_data = array();

        if (!empty($item_ids)) {
            // Get upvote counts for specific items
            $placeholders = implode(',', array_fill(0, count($item_ids), '%s'));
            $args = array_merge(array($checklist_id), $item_ids);

            $counts = $wpdb->get_results($wpdb->prepare(
                "SELECT item_id, COUNT(*) as count FROM $upvotes_table
                WHERE checklist_id = %d AND item_id IN ($placeholders) AND email_verified = 1
                GROUP BY item_id",
                ...$args
            ), OBJECT_K);

            // Check which items the current user has upvoted
            $user_upvotes = array();
            if ($current_user_email) {
                $user_votes = $wpdb->get_results($wpdb->prepare(
                    "SELECT item_id FROM $upvotes_table
                    WHERE checklist_id = %d AND user_email = %s AND item_id IN ($placeholders)",
                    array_merge(array($checklist_id, $current_user_email), $item_ids)
                ));
                foreach ($user_votes as $vote) {
                    $user_upvotes[$vote->item_id] = true;
                }
            }

            foreach ($item_ids as $item_id) {
                $upvotes_data[$item_id] = array(
                    'count' => isset($counts[$item_id]) ? (int) $counts[$item_id]->count : 0,
                    'user_upvoted' => isset($user_upvotes[$item_id])
                );
            }
        } else {
            // Get all upvotes for the checklist
            $all_counts = $wpdb->get_results($wpdb->prepare(
                "SELECT item_id, COUNT(*) as count FROM $upvotes_table
                WHERE checklist_id = %d AND email_verified = 1
                GROUP BY item_id",
                $checklist_id
            ), OBJECT_K);

            $user_upvotes = array();
            if ($current_user_email) {
                $user_votes = $wpdb->get_results($wpdb->prepare(
                    "SELECT item_id FROM $upvotes_table
                    WHERE checklist_id = %d AND user_email = %s",
                    $checklist_id, $current_user_email
                ));
                foreach ($user_votes as $vote) {
                    $user_upvotes[$vote->item_id] = true;
                }
            }

            foreach ($all_counts as $item_id => $data) {
                $upvotes_data[$item_id] = array(
                    'count' => (int) $data->count,
                    'user_upvoted' => isset($user_upvotes[$item_id])
                );
            }
        }

        wp_send_json_success(array('upvotes' => $upvotes_data));
    }

    /**
     * Get upvote count for a specific item
     */
    private function get_item_upvote_count($checklist_id, $item_id) {
        global $wpdb;
        $upvotes_table = $wpdb->prefix . 'mcl_item_upvotes';

        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $upvotes_table WHERE checklist_id = %d AND item_id = %s AND email_verified = 1",
            $checklist_id, $item_id
        ));
    }

    /**
     * Submit a new idea to the feature board
     */
    public function submit_idea() {
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $title = isset($_POST['title']) ? sanitize_text_field($_POST['title']) : '';
        $description = isset($_POST['description']) ? sanitize_textarea_field($_POST['description']) : '';
        $user_email = isset($_POST['user_email']) ? sanitize_email($_POST['user_email']) : '';
        $user_name = isset($_POST['user_name']) ? sanitize_text_field($_POST['user_name']) : '';

        if (!$checklist_id || !$title) {
            wp_send_json_error(array('message' => 'Checklist ID and title are required'));
            return;
        }

        // Get feature board settings
        global $wpdb;
        $settings_table = $wpdb->prefix . 'mcl_feature_board_settings';
        $settings = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $settings_table WHERE checklist_id = %d",
            $checklist_id
        ));

        if (!$settings || !$settings->idea_submission_enabled) {
            wp_send_json_error(array('message' => 'Idea submission is not enabled for this board'));
            return;
        }

        $submission_mode = $settings->idea_submission_mode;
        $require_verification = (bool) $settings->idea_submission_require_email_verification;
        $moderation_enabled = (bool) $settings->idea_moderation_enabled;
        $default_column = $settings->idea_default_column ?: 'col_todo';

        // Determine user info
        $current_user = wp_get_current_user();
        $is_logged_in = is_user_logged_in();

        if ($is_logged_in) {
            $user_id = $current_user->ID;
            $user_email = $current_user->user_email;
            $user_name = $current_user->display_name;
        } else {
            $user_id = null;

            if ($submission_mode === 'logged_in') {
                wp_send_json_error(array('message' => 'You must be logged in to submit ideas', 'require_login' => true));
                return;
            }

            // For 'email_verified' mode, email is required
            if ($submission_mode === 'email_verified' && !$user_email) {
                wp_send_json_error(array('message' => 'Email is required to submit ideas', 'require_email' => true));
                return;
            }

            // For 'anyone' mode without email, generate anonymous identifier based on IP
            if ($submission_mode === 'anyone' && !$user_email) {
                $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
                $user_email = 'anon_' . md5($ip_address . time()) . '@anonymous.local';
                $user_name = 'Anonymous';
            }

            if (!$user_name) {
                $user_name = 'Anonymous';
            }
        }

        $submissions_table = $wpdb->prefix . 'mcl_idea_submissions';

        // For 'anyone' mode or logged-in users, email is automatically verified
        // Only 'email_verified' mode for non-logged-in users needs verification
        $email_verified = ($is_logged_in || $submission_mode === 'anyone') ? 1 : 0;
        $verification_token = null;
        $status = $moderation_enabled ? 'pending' : 'approved';

        // If email verification is required for non-logged-in users in email_verified mode
        if (!$is_logged_in && $require_verification && $submission_mode === 'email_verified') {
            $verification_token = wp_generate_password(32, false);
            $email_verified = 0;
            $status = 'pending_verification';

            // Send verification email
            $this->send_verification_email($user_email, $user_name, $verification_token, 'idea', $checklist_id, null, $title);
        }

        $wpdb->insert(
            $submissions_table,
            array(
                'checklist_id' => $checklist_id,
                'title' => $title,
                'description' => $description,
                'user_id' => $user_id,
                'user_name' => $user_name,
                'user_email' => $user_email,
                'email_verified' => $email_verified,
                'verification_token' => $verification_token,
                'status' => $status,
                'target_column' => $default_column
            ),
            array('%d', '%s', '%s', '%d', '%s', '%s', '%d', '%s', '%s', '%s')
        );

        $submission_id = $wpdb->insert_id;

        // If moderation is disabled and no email verification needed, add to board directly
        if ($status === 'approved') {
            $this->add_idea_to_board($checklist_id, $submission_id);
        }

        if ($verification_token) {
            wp_send_json_success(array(
                'status' => 'pending_verification',
                'message' => 'Please check your email to verify your submission'
            ));
            return;
        }

        if ($moderation_enabled) {
            wp_send_json_success(array(
                'status' => 'pending',
                'message' => 'Your idea has been submitted and is pending review'
            ));
        } else {
            wp_send_json_success(array(
                'status' => 'approved',
                'message' => 'Your idea has been added to the board'
            ));
        }
    }

    /**
     * Add an approved idea to the kanban board
     */
    private function add_idea_to_board($checklist_id, $submission_id) {
        global $wpdb;
        $submissions_table = $wpdb->prefix . 'mcl_idea_submissions';

        $submission = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $submissions_table WHERE id = %d",
            $submission_id
        ));

        if (!$submission) {
            return false;
        }

        // Get the current kanban board
        $board = get_post_meta($checklist_id, '_mcl_kanban_board', true);
        if (!is_array($board)) {
            $board = array();
        }

        // Create new item ID
        $new_item_id = 'idea_' . $submission_id;

        // Create the new item
        $new_item = array(
            'id' => $new_item_id,
            'title' => $submission->title,
            'description' => $submission->description,
            'checked' => false,
            'submitted_by' => array(
                'name' => $submission->user_name,
                'email' => $submission->user_email
            ),
            'submitted_at' => $submission->created_at
        );

        // Find the target column and add the item
        $target_column = $submission->target_column ?: 'col_todo';
        $column_found = false;

        foreach ($board as &$column) {
            if ($column['id'] === $target_column) {
                if (!isset($column['items'])) {
                    $column['items'] = array();
                }
                $column['items'][] = $new_item;
                $column_found = true;
                break;
            }
        }

        // If target column not found, add to first column
        if (!$column_found && !empty($board)) {
            if (!isset($board[0]['items'])) {
                $board[0]['items'] = array();
            }
            $board[0]['items'][] = $new_item;
        }

        // Save the updated board
        update_post_meta($checklist_id, '_mcl_kanban_board', $board);

        return true;
    }

    /**
     * Verify email for upvote or idea submission
     */
    public function verify_email() {
        $token = isset($_GET['token']) ? sanitize_text_field($_GET['token']) : '';
        $type = isset($_GET['type']) ? sanitize_text_field($_GET['type']) : '';

        if (!$token || !$type) {
            wp_send_json_error(array('message' => 'Invalid verification link'));
            return;
        }

        global $wpdb;

        if ($type === 'upvote') {
            $upvotes_table = $wpdb->prefix . 'mcl_item_upvotes';

            $upvote = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $upvotes_table WHERE verification_token = %s",
                $token
            ));

            if (!$upvote) {
                wp_send_json_error(array('message' => 'Invalid or expired verification token'));
                return;
            }

            $wpdb->update(
                $upvotes_table,
                array('email_verified' => 1, 'verification_token' => null),
                array('id' => $upvote->id),
                array('%d', '%s'),
                array('%d')
            );

            wp_send_json_success(array('message' => 'Your upvote has been verified!'));

        } elseif ($type === 'idea') {
            $submissions_table = $wpdb->prefix . 'mcl_idea_submissions';

            $submission = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $submissions_table WHERE verification_token = %s",
                $token
            ));

            if (!$submission) {
                wp_send_json_error(array('message' => 'Invalid or expired verification token'));
                return;
            }

            // Get feature board settings
            $settings_table = $wpdb->prefix . 'mcl_feature_board_settings';
            $settings = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $settings_table WHERE checklist_id = %d",
                $submission->checklist_id
            ));

            $moderation_enabled = $settings ? (bool) $settings->idea_moderation_enabled : true;
            $new_status = $moderation_enabled ? 'pending' : 'approved';

            $wpdb->update(
                $submissions_table,
                array('email_verified' => 1, 'verification_token' => null, 'status' => $new_status),
                array('id' => $submission->id),
                array('%d', '%s', '%s'),
                array('%d')
            );

            // If moderation is disabled, add to board directly
            if ($new_status === 'approved') {
                $this->add_idea_to_board($submission->checklist_id, $submission->id);
                wp_send_json_success(array('message' => 'Your idea has been verified and added to the board!'));
            } else {
                wp_send_json_success(array('message' => 'Your email has been verified. Your idea is now pending review.'));
            }
        } else {
            wp_send_json_error(array('message' => 'Invalid verification type'));
        }
    }

    /**
     * Send email verification
     */
    private function send_verification_email($email, $name, $token, $type, $checklist_id, $item_id = null, $idea_title = null) {
        $verify_url = add_query_arg(array(
            'action' => 'mcl_verify_email',
            'token' => $token,
            'type' => $type
        ), admin_url('admin-ajax.php'));

        $checklist_title = get_the_title($checklist_id);

        if ($type === 'upvote') {
            $subject = sprintf(__('Verify your upvote - %s', 'magic-checklists'), $checklist_title);
            $message = sprintf(
                __("Hi %s,\n\nPlease click the link below to verify your upvote:\n\n%s\n\nThis link will expire in 24 hours.\n\nThank you!", 'magic-checklists'),
                $name,
                $verify_url
            );
        } else {
            $subject = sprintf(__('Verify your idea submission - %s', 'magic-checklists'), $checklist_title);
            $message = sprintf(
                __("Hi %s,\n\nPlease click the link below to verify your idea submission: \"%s\"\n\n%s\n\nThis link will expire in 24 hours.\n\nThank you!", 'magic-checklists'),
                $name,
                $idea_title,
                $verify_url
            );
        }

        wp_mail($email, $subject, $message);
    }
}
