<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class MCL_Admin {
    private $nonce_key = 'mcl_invite_links_nonce';

    public function __construct() {
        add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
        add_action( 'admin_post_save_checklist', array( $this, 'save_checklist' ) );
        add_action( 'admin_post_delete_checklist', array( $this, 'delete_checklist' ) );
        add_action( 'admin_post_clone_checklist', array( $this, 'clone_checklist' ) );
        add_action( 'wp_ajax_mcl_check_shortcut', array( $this, 'check_shortcut' ) );
        add_action( 'wp_ajax_mcl_toggle_active', array( $this, 'toggle_active' ) );
        add_action( 'admin_post_import_checklist', array( $this, 'import_checklist' ) );
        add_action( 'wp_ajax_mcl_generate_invite', array($this, 'generate_invite_link'));
        add_action( 'wp_ajax_mcl_get_invite_links', array($this, 'get_invite_links'));
        add_action( 'wp_ajax_mcl_delete_invite_link', array($this, 'delete_invite_link'));
        add_action( 'wp_ajax_mcl_update_invite_permission', array($this, 'update_invite_permission'));
        add_action('wp_ajax_mcl_force_delete_lock', array($this, 'force_delete_lock'));
        add_action('admin_post_import_json_checklist', array($this, 'import_json_checklist'));
    }

    public function add_admin_menu() {
        $settings = get_option('mcl_settings', array());
        $position_type = isset($settings['menu_position_type']) ? $settings['menu_position_type'] : 'default';
        
        // Default position is 26
        $menu_position = 26;
        
        if ($position_type === 'custom') {
            // Use custom position if set
            $menu_position = isset($settings['custom_position']) ? 
                intval($settings['custom_position']) : $menu_position;
                
            // Ensure it's within valid range
            $menu_position = max(1, min(99, $menu_position));
            
            // If position is taken, find next available
            global $menu;
            $original_position = $menu_position;
            while (isset($menu[$menu_position])) {
                $menu_position++;
                if ($menu_position > 99) {
                    $menu_position = $original_position;
                    break;
                }
            }
        } elseif ($position_type === 'relative') {
            $relative_to = isset($settings['menu_position_relative_to']) ? $settings['menu_position_relative_to'] : '';
            $position = isset($settings['menu_position']) ? $settings['menu_position'] : 'after';
            
            if (!empty($relative_to)) {
                global $menu;
                
                // Make sure menu is populated
                if (!$menu) {
                    require_once(ABSPATH . 'wp-admin/includes/admin.php');
                    // Some plugins might need this action
                    do_action('_admin_menu');
                }
                
                // Find the reference menu item position
                foreach ($menu as $priority => $item) {
                    if (!empty($item[2]) && $item[2] === $relative_to) {
                        $requested_position = $position === 'after' ? $priority + 1 : $priority - 1;
                        
                        if ($requested_position < 2) {
                            $menu_position = $priority + 1;
                            
                            update_option('mcl_menu_position_notice', array(
                                'type' => 'adjustment',
                                'relative_to' => $relative_to,
                                'position' => $position,
                                'timestamp' => time()
                            ));
                        } else {
                            $menu_position = $requested_position;
                        }

                        $menu_position = max(2, min(99, $menu_position));

                        $iteration_count = 0;
                        $max_iterations = 98;
                        
                        // Find next available position
                        while (isset($menu[$menu_position])) {
                            $menu_position = $position === 'after' ? $menu_position + 1 : $menu_position - 1;
                            $menu_position = max(2, min(99, $menu_position));
                            
                            $iteration_count++;
                            if ($iteration_count >= $max_iterations) {
                                // If no position found, fall back to default
                                $menu_position = 26;
                                update_option('mcl_menu_position_notice', array(
                                    'type' => 'fallback',
                                    'timestamp' => time()
                                ));
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }

        add_menu_page(
            __('MagicChecklists', 'magic-checklists'),
            __('MagicChecklists', 'magic-checklists'),
            'manage_options',
            'mcl_checklists',
            array($this, 'checklists_page'),
            'data:image/svg+xml;base64,' . base64_encode(file_get_contents(MAGIC_CHECKLISTS_PLUGIN_PATH . 'assets/images/menu-icon.svg')),
            $menu_position
        );
    
        // Keep existing submenu items
        add_submenu_page(
            'mcl_checklists',
            __('Add New Checklist', 'magic-checklists'),
            __('Add New', 'magic-checklists'),
            'manage_options',
            'mcl_add_new',
            array($this, 'add_new_checklist_page')
        );
        
        add_submenu_page(
            'mcl_checklists',
            __('Import / Export Checklists', 'magic-checklists'),
            __('Import / Export', 'magic-checklists'),
            'manage_options',
            'mcl_import',
            array($this, 'import_checklist_page')
        );
        
        add_submenu_page(
            'mcl_checklists',
            __('Analytics', 'magic-checklists'),
            __('Analytics', 'magic-checklists'),
            'manage_options',
            'mcl_analytics',
            array($this, 'render_analytics_page')
        );
    }
    
    public function import_checklist_page() {
        include MAGIC_CHECKLISTS_PLUGIN_PATH . 'admin/views/import-checklist.php';
    }

    public function enqueue_admin_scripts($hook) {
        // Only load on plugin pages
        if (strpos($hook, 'mcl_') === false) {
            return;
        }

        wp_enqueue_media();
    
        // Common admin assets for all plugin pages
        wp_enqueue_script(
            'sortablejs',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/vendor/sortable.min.js',
            array(),
            MAGIC_CHECKLISTS_VERSION,
            true
        );
        
        // Enqueue Nunito Sans font
        wp_enqueue_style(
            'mcl-fonts',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-fonts.css',
            array(),
            MAGIC_CHECKLISTS_VERSION
        );
        
        // Common CSS first
        wp_enqueue_style(
            'mcl-admin-base', 
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/common/mcl-base.css',
            array('mcl-fonts'),
            MAGIC_CHECKLISTS_VERSION
        );
    
        wp_enqueue_style(
            'mcl-admin-forms',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/common/mcl-forms.css',
            array('mcl-admin-base'),
            MAGIC_CHECKLISTS_VERSION
        );
    
        wp_enqueue_style(
            'mcl-admin-tables',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/common/mcl-tables.css',
            array('mcl-admin-base'),
            MAGIC_CHECKLISTS_VERSION
        );
    
        // Register utils.js as a module
        wp_register_script(
            'mcl-admin-utils',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/common/mcl-utils.js',
            array(),
            MAGIC_CHECKLISTS_VERSION,
            true
        );

        // Page-specific assets
        switch ($hook) {
            case 'toplevel_page_mcl_checklists':
                // Analytics CSS for dashboard analytics widget
                wp_enqueue_style(
                    'mcl-analytics', 
                    MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/mcl-analytics.css',
                    array('mcl-admin-base'),
                    MAGIC_CHECKLISTS_VERSION
                );
                wp_enqueue_style(
                    'mcl-admin-main',
                    MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/pages/mcl-main.css',
                    array('mcl-admin-base', 'mcl-admin-tables'),
                    MAGIC_CHECKLISTS_VERSION
                );
                
                // Enqueue the search functionality
                wp_enqueue_script(
                    'mcl-search',
                    MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/mcl-search.js',
                    array(),
                    MAGIC_CHECKLISTS_VERSION,
                    true
                );
                
                wp_enqueue_script(
                    'mcl-admin-main',
                    MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/pages/mcl-main.js',
                    array('sortablejs'),
                    MAGIC_CHECKLISTS_VERSION,
                    true
                );

                wp_enqueue_style(
                    'choicescss',
                    MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/vendor/choices.min.css',
                    array(),
                    '11.0.2'
                );

                wp_enqueue_script(
                    'choicesjs',
                    MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/vendor/choices.min.js',
                    array('sortablejs'),
                    '11.0.2',
                    true
                );
                
                $current_handle = 'mcl-admin-main';
                break;
    
            case 'magicchecklists_page_mcl_add_new':
                wp_enqueue_style(
                    'mcl-admin-edit',
                    MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/pages/mcl-edit.css',
                    array('mcl-admin-base', 'mcl-admin-forms'),
                    MAGIC_CHECKLISTS_VERSION
                );

                wp_enqueue_style(
                    'choicescss',
                    MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/vendor/choices.min.css',
                    array(),
                    '11.0.2'
                );

                wp_enqueue_script(
                    'choicesjs',
                    MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/vendor/choices.min.js',
                    array('sortablejs'),
                    '11.0.2',
                    true
                );

                wp_enqueue_script(
                    'interactjs',
                    MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/vendor/interact.min.js',
                    array(),
                    '1.15.3',
                    true
                );
                
                wp_enqueue_script(
                    'mcl-admin-edit',
                    MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/pages/mcl-edit.js',
                    array('sortablejs', 'choicesjs'),
                    MAGIC_CHECKLISTS_VERSION,
                    true
                );
                $current_handle = 'mcl-admin-edit';
                break;
    
            case 'magicchecklists_page_mcl_import':
                wp_enqueue_style(
                    'mcl-admin-import',
                    MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/pages/mcl-import.css',
                    array('mcl-admin-base', 'mcl-admin-forms'),
                    MAGIC_CHECKLISTS_VERSION
                );
                
                wp_enqueue_script(
                    'mcl-admin-import',
                    MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/pages/mcl-import.js',
                    array(),
                    MAGIC_CHECKLISTS_VERSION,
                    true
                );
                $current_handle = 'mcl-admin-import';
                break;
                
            case 'magicchecklists_page_mcl_analytics':
                // Analytics CSS for analytics page
                wp_enqueue_style(
                    'mcl-analytics', 
                    MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/mcl-analytics.css',
                    array('mcl-admin-base'),
                    MAGIC_CHECKLISTS_VERSION
                );
                break;
        }
    
        // Mark scripts as modules
        add_filter('script_loader_tag', function($tag, $handle) {
            if (in_array($handle, ['mcl-admin-utils', 'mcl-admin-main', 'mcl-admin-edit', 'mcl-admin-import'])) {
                return str_replace(' src=', ' type="module" src=', $tag);
            }
            return $tag;
        }, 10, 2);
    
        // Localize script data
        if (isset($current_handle)) {
            wp_localize_script($current_handle, 'mclAdmin', array(
                'ajaxurl' => admin_url('admin-ajax.php'),
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonces' => array(
                    'mcl_toggle_active' => wp_create_nonce('mcl_toggle_active'),
                    'checkShortcut' => wp_create_nonce('mcl_check_shortcut_nonce'),
                    'inviteLinks' => wp_create_nonce($this->nonce_key),
                    'forceDeleteLock' => wp_create_nonce('mcl_force_delete_lock_nonce'),
                    'testWebhook' => wp_create_nonce('mcl_test_webhook'),
                    'pdfExport' => wp_create_nonce('mcl_save_pdf_settings')
                ),
                'currentChecklistId' => isset($_GET['checklist_id']) ? intval($_GET['checklist_id']) : 0,
                'priorityColors' => MCL_Priority_Utils::get_priority_colors(),
                'priorityNumbers' => MCL_Priority_Utils::get_priority_numbers(),
                'i18n' => array(
                    'deleteAllConfirm' => __('Are you sure you want to delete all items? This cannot be undone.', 'magic-checklists'),
                    'errorUpdatingStatus' => __('An error occurred while updating the status. Please try again.', 'magic-checklists'),
                    'noInviteLinks' => __('No invite links created yet.', 'magic-checklists'),
                    'linkGenerated' => __('Invite link generated successfully.', 'magic-checklists'),
                    'linkCopied' => __('Link copied to clipboard.', 'magic-checklists'),
                    'linkDeleted' => __('Invite link deleted successfully.', 'magic-checklists'),
                    'confirmDeleteLink' => __('Are you sure you want to delete this invite link? Any users with this link will no longer be able to access the checklist.', 'magic-checklists'),
                    'errorGeneratingLink' => __('Error generating invite link. Please try again.', 'magic-checklists'),
                    'errorDeletingLink' => __('Error deleting invite link. Please try again.', 'magic-checklists'),
                    'errorCopyingLink' => __('Error copying link to clipboard.', 'magic-checklists'),
                    'copyLink' => __('Copy Link', 'magic-checklists'),
                    'deleteLink' => __('Delete Link', 'magic-checklists'),
                    'canView' => __('View Only', 'magic-checklists'),
                    'canInteract' => __('Can Interact', 'magic-checklists'),
                    'canEdit' => __('Can Edit', 'magic-checklists'),
                    'created' => __('Created', 'magic-checklists'),
                    'expires' => __('Expires', 'magic-checklists'),
                    'expired' => __('Expired', 'magic-checklists'),
                    'uses' => __('Uses', 'magic-checklists'),
                    'permissionUpdated' => __('Permission level updated successfully.', 'magic-checklists'),
                    'errorUpdatingPermission' => __('Error updating permission level. Please try again.', 'magic-checklists'),
                    'webhookUrlRequired' => __('Webhook URL is required', 'magic-checklists'),
                    'webhookTestSuccess' => __('Webhook test successful', 'magic-checklists'),
                    'webhookTestFailed' => __('Webhook test failed', 'magic-checklists'),
                    'invalidWebhookUrl' => __('Invalid webhook URL format', 'magic-checklists'),
                    'invalidSlackUrl' => __('Invalid Slack webhook URL', 'magic-checklists'),
                    'invalidDiscordUrl' => __('Invalid Discord webhook URL', 'magic-checklists'),
                    'emailRecipientsRequired' => __('Email recipients are required', 'magic-checklists'),
                    'emailTestSuccess' => __('Test email(s) sent successfully', 'magic-checklists'),
                    'emailTestFailed' => __('Failed to send test email', 'magic-checklists'),
                    'invalidEmailFormat' => __('Invalid email format', 'magic-checklists'),
                    'testingEmail' => __('Testing email...', 'magic-checklists'),
                    'maxUploadSize' => wp_max_upload_size(),
                    'allowedMimeTypes' => array('image/jpeg', 'image/png', 'image/gif'),
                    'errorSavingPdfSettings' => __('Error saving PDF settings. Please try again.', 'magic-checklists'),
                )
            ));
        }
        
        // Add our AJAX actions with proper priority
        add_action('wp_ajax_mcl_toggle_active', array($this, 'toggle_active'), 10);
    }

    function get_registered_admin_pages() {
        global $menu, $submenu;
        
        // Initialize arrays
        $pages = array();
        $seen = array();
    
        // Get current screen to check active plugins
        if (!function_exists('get_current_screen')) {
            require_once(ABSPATH . 'wp-admin/includes/screen.php');
        }
    
        // Make sure the admin menu is built
        if (!$menu) {
            require_once(ABSPATH . 'wp-admin/includes/admin.php');
            do_action('_admin_menu');
        }
    
        // Process main menu
        foreach ($menu as $menu_item) {
            if (empty($menu_item[0])) continue;
            
            $menu_slug = $menu_item[2];
            // Skip separators and core WordPress pages we handle separately
            if (empty($menu_slug) || $menu_slug === 'separator' || in_array($menu_slug, array('index.php', 'edit.php'))) {
                continue;
            }
    
            // Clean the slug
            $clean_slug = $this->clean_page_slug($menu_slug);
            if (!isset($seen[$clean_slug])) {
                $pages[$clean_slug] = strip_tags($menu_item[0]); // Clean menu title
                $seen[$clean_slug] = true;
            }
    
            // Process submenu items if they exist
            if (isset($submenu[$menu_slug])) {
                foreach ($submenu[$menu_slug] as $sub_item) {
                    if (empty($sub_item[0])) continue;
                    
                    $sub_slug = $sub_item[2];
                    $clean_sub_slug = $this->clean_page_slug($sub_slug);
                    
                    if (!isset($seen[$clean_sub_slug])) {
                        $pages[$clean_sub_slug] = strip_tags($sub_item[0]) . ' (' . strip_tags($menu_item[0]) . ')';
                        $seen[$clean_sub_slug] = true;
                    }
                }
            }
        }
    
        // Add common plugin-specific pages that might not be in the menu
        $common_plugins = array(
            'woocommerce/woocommerce.php' => array(
                'wc-admin' => 'WooCommerce Dashboard',
                'wc-orders' => 'Orders',
                'wc-products' => 'Products',
                'wc-settings' => 'WooCommerce Settings',
                'wc-status' => 'Status',
                'wc-reports' => 'Reports'
            ),
            'elementor/elementor.php' => array(
                'elementor' => 'Elementor Dashboard',
                'elementor-templates' => 'Templates',
                'elementor-settings' => 'Settings'
            ),
            // Add more common plugins as needed
        );
    
        // Check and add pages for active plugins
        foreach ($common_plugins as $plugin_path => $plugin_pages) {
            if (is_plugin_active($plugin_path)) {
                foreach ($plugin_pages as $slug => $title) {
                    if (!isset($seen[$slug])) {
                        $pages[$slug] = $title;
                        $seen[$slug] = true;
                    }
                }
            }
        }
    
        // Sort pages by title
        asort($pages);
    
        return $pages;
    }

    function clean_page_slug($slug) {
        // Remove .php extension if present
        $slug = str_replace('.php', '', $slug);
        
        // Handle query string style slugs
        if (strpos($slug, '?') !== false) {
            parse_str(parse_url($slug, PHP_URL_QUERY), $params);
            if (isset($params['page'])) {
                return $params['page'];
            }
        }
        
        // Handle anchors
        $slug = preg_replace('/#.*$/', '', $slug);
        
        return $slug;
    }
    
    // Function to group pages by plugin/section
    function group_admin_pages($pages) {
        $groups = array(
            'Core' => array(),
            'Plugins' => array(),
            'Settings' => array(),
            'Other' => array()
        );
    
        foreach ($pages as $slug => $title) {
            // Determine group based on slug prefix or patterns
            if (strpos($slug, 'options-') === 0 || strpos($title, 'Settings') !== false) {
                $groups['Settings'][$slug] = $title;
            } elseif (strpos($slug, 'plugin') !== false) {
                $groups['Plugins'][$slug] = $title;
            } elseif (in_array($slug, array('index', 'edit', 'upload', 'media', 'users', 'tools'))) {
                $groups['Core'][$slug] = $title;
            } else {
                // Check for known plugin prefixes
                $plugin_prefixes = array('wc-', 'elementor-', 'wpforms-', 'wps-');
                $assigned = false;
                foreach ($plugin_prefixes as $prefix) {
                    if (strpos($slug, $prefix) === 0) {
                        $groups['Plugins'][$slug] = $title;
                        $assigned = true;
                        break;
                    }
                }
                if (!$assigned) {
                    $groups['Other'][$slug] = $title;
                }
            }
        }
    
        // Sort each group
        foreach ($groups as &$group) {
            asort($group);
        }
    
        return $groups;
    }
    
    private function get_current_page($hook) {
        if ($hook === 'toplevel_page_mcl_checklists') {
            return 'main';
        } elseif ($hook === 'magic-checklists_page_mcl_add_new') {
            return 'edit';
        } elseif ($hook === 'magic-checklists_page_mcl_import') {
            return 'import';
        }
        return 'main';
    }

    public function get_priority_levels() {
        return MCL_Priority_Utils::get_priority_levels();
    }

    public function get_priority_colors() {
        return MCL_Priority_Utils::get_priority_colors();
    }

    public function checklists_page() {
        // Fire action before loading the main admin page
        do_action('mcl_admin_init');
        
        include MAGIC_CHECKLISTS_PLUGIN_PATH . 'admin/views/admin-page.php';
    }

    public function add_new_checklist_page() {
        include MAGIC_CHECKLISTS_PLUGIN_PATH . 'admin/views/edit-checklist.php';
    }

    public function save_checklist() {
        if (!isset($_POST['mcl_nonce']) || !wp_verify_nonce($_POST['mcl_nonce'], 'mcl_save_checklist')) {
            wp_die(__('Nonce verification failed', 'magic-checklists'));
        }

        if (!current_user_can('manage_options')) {
            wp_die(__('You are not allowed to perform this action', 'magic-checklists'));
        }
    
        $checklist_id = isset( $_POST['checklist_id'] ) ? intval( $_POST['checklist_id'] ) : 0;
        $title = sanitize_text_field( $_POST['title'] );
        $description = sanitize_textarea_field( $_POST['description'] );
        $show_description = isset($_POST['show_description']) ? 1 : 0;
        $time_date = !empty($_POST['time_date']) ? strtotime($_POST['time_date']) : '';
        $keyboard_shortcut = sanitize_text_field( $_POST['keyboard_shortcut'] );
        $active = isset( $_POST['active'] ) ? 1 : 0;
        $checked_state_handling = sanitize_text_field( $_POST['checked_state'] );
        $theme = sanitize_text_field( $_POST['theme'] );
        $priority = sanitize_text_field( $_POST['priority'] );
        $enable_item_priority = isset( $_POST['enable_item_priority'] ) ? 1 : 0;
        $trigger_shortcut = isset($_POST['trigger_shortcut']) ? 1 : 0;
        $trigger_button = isset($_POST['trigger_button']) ? 1 : 0;
        if ($trigger_shortcut === 0 && $trigger_button === 0) {
            $trigger_shortcut = 1;
        }
        
        $short_title = isset($_POST['short_title']) ? sanitize_text_field($_POST['short_title']) : '';
        $button_position = isset($_POST['button_position']) ? sanitize_text_field($_POST['button_position']) : 'bottom-right';
        $disable_in_builders = isset($_POST['disable_in_builders']) ? 1 : 0;

        $priority_display_type = isset( $_POST['priority_display_type'] ) ? 
            sanitize_text_field( $_POST['priority_display_type'] ) : 'color';

        $public_access = isset($_POST['public_access']) ? 1 : 0;
        $public_permission = isset($_POST['public_permission']) ? sanitize_text_field($_POST['public_permission']) : 'interact';
        $public_checked_state_handling = sanitize_text_field($_POST['public_checked_state']);
        $public_description = isset($_POST['public_description']) ? sanitize_textarea_field($_POST['public_description']) : '';

        if ($trigger_shortcut === 0 && $trigger_button === 0) {
            $trigger_shortcut = 1;
        }
        $enable_rate_limit = isset($_POST['enable_rate_limit']) ? 1 : 0;

        $enable_item_locking = isset($_POST['enable_item_locking']) ? 1 : 0;

        // Process items with priorities and parent relationships
        $items = isset($_POST['items']) ? $_POST['items'] : array();
        $processed_items = array();
        foreach ($items as $item) {
            if (isset($item['id'], $item['content'])) {
                $processed_items[] = array(
                    'id' => sanitize_text_field($item['id']),
                    'content' => MCL_Sanitization::sanitize_item_content($item['content']),
                    'priority' => isset($item['priority']) ? sanitize_text_field($item['priority']) : 'none',
                    'parent_id' => isset($item['parent_id']) ? sanitize_text_field($item['parent_id']) : '',
                    'locked' => !empty($item['locked']) ? 1 : 0,
                );
            }
        }

        // Allowed User Roles
        $access_roles = isset($_POST['access_roles']) ? array_map('sanitize_text_field', $_POST['access_roles']) : array();
        $access_roles_permission = isset($_POST['access_roles_permission']) ? sanitize_text_field($_POST['access_roles_permission']) : 'interact';

        // Allowed Users
        $access_users = isset($_POST['access_users']) ? array_map('intval', $_POST['access_users']) : array();
        $access_users_permission = isset($_POST['access_users_permission']) ? sanitize_text_field($_POST['access_users_permission']) : 'interact';

        $load_everywhere = isset($_POST['load_everywhere']) ? 1 : 0;
        $allowed_pages = isset($_POST['allowed_pages']) ? array_map('sanitize_text_field', $_POST['allowed_pages']) : array();
        $allowed_urls = isset($_POST['allowed_urls']) ? array_map('sanitize_text_field', $_POST['allowed_urls']) : array();
    
        $checklist_data = array(
            'post_title'   => $title,
            'post_content' => $description,
            'post_type'    => 'mcl_checklist',
            'post_status'  => 'publish',
        );
    
        if ( $checklist_id ) {
            $checklist_data['ID'] = $checklist_id;
            $checklist_id = wp_update_post( $checklist_data );
        } else {
            $checklist_id = wp_insert_post( $checklist_data );
        }

        $notification_settings = array(
            'notifications_enabled' => isset($_POST['notifications_enabled']),
            'email_enabled' => isset($_POST['email_enabled']),
            'integration_enabled' => isset($_POST['integration_enabled']),
            'email_recipients' => sanitize_text_field($_POST['email_recipients'] ?? ''),
            'slack_webhook_url' => esc_url_raw($_POST['slack_webhook_url'] ?? ''),
            'discord_webhook_url' => esc_url_raw($_POST['discord_webhook_url'] ?? ''),
            'notify_on_new_item' => isset($_POST['notify_on_new_item']),
            'notify_on_delete_item' => isset($_POST['notify_on_delete_item']),
            'notify_on_check_item' => isset($_POST['notify_on_check_item']),
            'notify_on_uncheck_item' => isset($_POST['notify_on_uncheck_item']),
            'notify_on_deadline' => isset($_POST['notify_on_deadline']),
            'deadline_threshold_hours' => absint($_POST['deadline_threshold_hours'] ?? 24),
            'batch_interval' => sanitize_text_field($_POST['batch_interval'] ?? 'fifteen_minutes')
        );
        $notification_manager = MCL_Notification_Manager::get_instance();
        $notification_manager->save_notification_settings($checklist_id, $notification_settings);

        $enable_shortcode = isset($_POST['enable_shortcode']) ? 1 : 0;
        update_post_meta($checklist_id, '_mcl_enable_shortcode', $enable_shortcode);

        if ($enable_shortcode) {
            $shortcode_settings = array(
                // Display Options
                'show_title'       => isset($_POST['shortcode_show_title']) ? 1 : 0,
                'show_description' => isset($_POST['shortcode_show_description']) ? 1 : 0,
                'show_deadline'    => isset($_POST['shortcode_show_deadline']) ? 1 : 0,
                'show_priority'    => isset($_POST['shortcode_show_priority']) ? 1 : 0,
                'show_numbers'     => isset($_POST['shortcode_show_numbers']) ? 1 : 0,
            
                // Style Options Part 1: Colors
                'title_text_color'           => sanitize_hex_color($_POST['shortcode_title_text_color'] ?? '#000000'),
                'description_text_color'     => sanitize_hex_color($_POST['shortcode_description_text_color'] ?? '#333333'),
                'deadline_text_color'        => sanitize_hex_color($_POST['shortcode_deadline_text_color'] ?? '#ff0000'),
                'list_item_text_color'       => sanitize_hex_color($_POST['shortcode_list_item_text_color'] ?? '#1a1a1a'),
                'bg_color'                   => sanitize_hex_color($_POST['shortcode_bg_color'] ?? '#ffffff'),
                'border_color'               => sanitize_hex_color($_POST['shortcode_border_color'] ?? '#e2e8f0'),
                'checkbox_border_color'      => sanitize_hex_color($_POST['shortcode_checkbox_border_color'] ?? '#cccccc'),
                'checkbox_color_filled'      => sanitize_hex_color($_POST['shortcode_checkbox_color_filled'] ?? '#0ea5e9'),
                'checkbox_color_unfilled'    => sanitize_hex_color($_POST['shortcode_checkbox_color_unfilled'] ?? '#ffffff'),
                'checkmark_color'            => sanitize_hex_color($_POST['shortcode_checkmark_color'] ?? '#ffffff'),
    
                // Style Options Part 2: Spacing and Dimensions
                'checkbox_dimensions'            => absint($_POST['shortcode_checkbox_dimensions'] ?? 20),
                'checkbox_border_radius'         => absint($_POST['shortcode_checkbox_border_radius'] ?? 4),
                'checkbox_border_thickness'      => absint($_POST['shortcode_checkbox_border_thickness'] ?? 2),
                'border_type'                    => sanitize_text_field($_POST['shortcode_border_type'] ?? 'none'),
                'border_radius'                  => absint($_POST['shortcode_border_radius'] ?? 6),
                'border_thickness'               => absint($_POST['shortcode_border_thickness'] ?? 1),
                'item_spacing'                   => sanitize_text_field($_POST['shortcode_item_spacing'] ?? 'comfortable'),
                'padding_block'                  => absint($_POST['shortcode_padding_block'] ?? 32),
                'padding_inline'                 => absint($_POST['shortcode_padding_inline'] ?? 32),
                'container_gap'                 => absint($_POST['shortcode_container_gap'] ?? 10),
    
                // Style Options Part 3: Typography
                'title_font_size'          => absint($_POST['shortcode_title_font_size'] ?? 18),
                'description_font_size'    => absint($_POST['shortcode_description_font_size'] ?? 14),
                'list_item_font_size'      => absint($_POST['shortcode_list_item_font_size'] ?? 16),
                'deadline_font_size'       => absint($_POST['shortcode_deadline_font_size'] ?? 14),
    
                // Behavior Options
                'disable_drawer' => isset($_POST['shortcode_disable_drawer']) ? 1 : 0,
                'enable_reorder' => isset($_POST['shortcode_enable_reorder']) ? 1 : 0,
                'check_state'    => sanitize_text_field($_POST['shortcode_check_state'] ?? 'session')
            );
    
            // Custom width validation
            if ($shortcode_settings['width'] === 'custom') {
                $shortcode_settings['custom_width'] = max(200, min(2000, $shortcode_settings['custom_width']));
            }
    
            update_post_meta($checklist_id, '_mcl_shortcode_settings', $shortcode_settings);
        } else {
            delete_post_meta($checklist_id, '_mcl_shortcode_settings');
        }
    
        if ( ! is_wp_error( $checklist_id ) ) {
            if (isset($_POST['mcl_tags']) && isset($_POST['mcl_tag_colors'])) {
                $tags = array_map('sanitize_text_field', $_POST['mcl_tags']);
                $colors = array_map('sanitize_hex_color', $_POST['mcl_tag_colors']);
                
                $saved_tags = array();
                foreach ($tags as $index => $tag) {
                    if (isset($colors[$index])) {
                        $saved_tags[] = array(
                            'name' => $tag,
                            'color' => $colors[$index]
                        );
                    }
                }
                
                update_post_meta($checklist_id, '_mcl_tags', $saved_tags);
            } else {
                delete_post_meta($checklist_id, '_mcl_tags');
            }
            update_post_meta($checklist_id, '_mcl_enable_item_locking', $enable_item_locking);
            update_post_meta( $checklist_id, '_mcl_time_date', $time_date);
            update_post_meta( $checklist_id, '_mcl_items', $processed_items );
            update_post_meta( $checklist_id, '_mcl_keyboard_shortcut', $keyboard_shortcut );
            update_post_meta( $checklist_id, '_mcl_active', $active );
            update_post_meta( $checklist_id, '_mcl_checked_state_handling', $checked_state_handling );
            update_post_meta( $checklist_id, '_mcl_theme', $theme );
            update_post_meta( $checklist_id, '_mcl_priority', $priority );
            update_post_meta( $checklist_id, '_mcl_enable_item_priority', $enable_item_priority );
            update_post_meta( $checklist_id, '_mcl_trigger_shortcut', $trigger_shortcut);
            update_post_meta( $checklist_id, '_mcl_trigger_button', $trigger_button);
            update_post_meta( $checklist_id, '_mcl_short_title', $short_title);
            update_post_meta( $checklist_id, '_mcl_button_position', $button_position);
            update_post_meta( $checklist_id, '_mcl_public_access', $public_access);
            update_post_meta( $checklist_id, '_mcl_public_checked_state_handling', $public_checked_state_handling);
            update_post_meta( $checklist_id, '_mcl_public_description', $public_description);
            update_post_meta( $checklist_id, '_mcl_priority_display_type', $priority_display_type );
            update_post_meta( $checklist_id, '_mcl_enable_rate_limit', $enable_rate_limit);
            update_post_meta( $checklist_id, '_mcl_access_roles', $access_roles );
            update_post_meta( $checklist_id, '_mcl_access_roles_permission', $access_roles_permission );
            update_post_meta( $checklist_id, '_mcl_access_users', $access_users );
            update_post_meta( $checklist_id, '_mcl_access_users_permission', $access_users_permission );
            update_post_meta( $checklist_id, '_mcl_public_access', $public_access);
            update_post_meta( $checklist_id, '_mcl_public_permission', $public_permission);
            update_post_meta( $checklist_id, '_mcl_load_everywhere', $load_everywhere);
            update_post_meta( $checklist_id, '_mcl_allowed_pages', $allowed_pages);
            update_post_meta( $checklist_id, '_mcl_allowed_urls', $allowed_urls);
            $this->save_reset_schedule($checklist_id);
            update_post_meta($checklist_id, '_mcl_disable_in_builders', $disable_in_builders);
            if ($_POST['theme'] === 'custom') {
                $this->save_custom_theme_settings($checklist_id);
            }
            update_post_meta($checklist_id, '_mcl_show_description', $show_description);
        }
    
        wp_redirect( admin_url( 'admin.php?page=mcl_checklists' ) );
        exit;
    }

    private function save_reset_schedule($checklist_id) {
        // Save auto reset settings
        $auto_reset = isset($_POST['auto_reset']) ? 1 : 0;
        update_post_meta($checklist_id, '_mcl_auto_reset', $auto_reset);
    
        if ($auto_reset) {
            $reset_interval = sanitize_text_field($_POST['reset_interval']);
            $reset_time = sanitize_text_field($_POST['reset_time']);
            
            update_post_meta($checklist_id, '_mcl_reset_interval', $reset_interval);
            update_post_meta($checklist_id, '_mcl_reset_time', $reset_time);
    
            // Save interval-specific settings
            switch ($reset_interval) {
                case 'weekly':
                    $week_day = intval($_POST['week_day']);
                    if ($week_day >= 1 && $week_day <= 7) {
                        update_post_meta($checklist_id, '_mcl_week_day', $week_day);
                    }
                    break;
    
                case 'monthly':
                    $month_day = intval($_POST['month_day']);
                    if ($month_day >= 1 && $month_day <= 31) {
                        update_post_meta($checklist_id, '_mcl_month_day', $month_day);
                    }
                    break;
    
                case 'custom':
                    $custom_months = max(0, min(12, intval($_POST['custom_months'])));
                    $custom_weeks = max(0, min(52, intval($_POST['custom_weeks'])));
                    $custom_days = max(0, min(31, intval($_POST['custom_days'])));
                    
                    update_post_meta($checklist_id, '_mcl_custom_months', $custom_months);
                    update_post_meta($checklist_id, '_mcl_custom_weeks', $custom_weeks);
                    update_post_meta($checklist_id, '_mcl_custom_days', $custom_days);
                    break;
            }
    
            // Calculate and set next reset time
            $next_reset = $this->calculate_next_reset_time($checklist_id, $reset_interval, $reset_time);
            update_post_meta($checklist_id, '_mcl_reset_next', $next_reset);
            
            // Initialize reset counter if not set
            $reset_counter = get_post_meta($checklist_id, '_mcl_reset_counter', true);
            if (!$reset_counter) {
                update_post_meta($checklist_id, '_mcl_reset_counter', 1);
            }
        }
    }

    private function calculate_next_reset_time($checklist_id, $interval, $time) {
        $time_parts = explode(':', $time);
        $hours = intval($time_parts[0]);
        $minutes = intval($time_parts[1]);
    
        $now = current_time('timestamp');
        $today = strtotime(date('Y-m-d', $now) . " {$hours}:{$minutes}:00");
    
        switch ($interval) {
            case 'daily':
                $next = $today;
                if ($now >= $today) {
                    $next = strtotime('+1 day', $today);
                }
                break;
    
            case 'weekly':
                $week_day = get_post_meta($checklist_id, '_mcl_week_day', true) ?: '1';
                $current_week_day = date('N', $now);
                $days_until_target = ($week_day - $current_week_day + 7) % 7;
                
                if ($days_until_target === 0 && $now >= $today) {
                    $days_until_target = 7;
                }
                
                $next = strtotime("+{$days_until_target} days", $today);
                break;
    
            case 'monthly':
                $month_day = get_post_meta($checklist_id, '_mcl_month_day', true) ?: '1';
                $current_month_day = date('j', $now);
                
                $next = strtotime(date('Y-m-' . $month_day, $now) . " {$hours}:{$minutes}:00");
                if ($now >= $next || $current_month_day > $month_day) {
                    $next = strtotime('+1 month', $next);
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
                
                $next = $today;
                if ($now >= $today) {
                    $next = strtotime("+{$total_days} days", $today);
                }
                break;
            
            default:
                $next = strtotime('+1 day', $today);
                break;
            }
            
        return $next;
    }

    private function validate_reset_schedule($checklist_id) {
        $reset_interval = sanitize_text_field($_POST['reset_interval']);
        $is_valid = true;
        $errors = array();
    
        switch ($reset_interval) {
            case 'weekly':
                $week_day = intval($_POST['week_day']);
                if ($week_day < 1 || $week_day > 7) {
                    $is_valid = false;
                    $errors[] = __('Invalid day of week selected.', 'magic-checklists');
                }
                break;
    
            case 'monthly':
                $month_day = intval($_POST['month_day']);
                if ($month_day < 1 || $month_day > 31) {
                    $is_valid = false;
                    $errors[] = __('Invalid day of month selected.', 'magic-checklists');
                }
                break;
    
            case 'custom':
                $custom_months = intval($_POST['custom_months']);
                $custom_weeks = intval($_POST['custom_weeks']);
                $custom_days = intval($_POST['custom_days']);
    
                if ($custom_months < 0 || $custom_months > 12) {
                    $is_valid = false;
                    $errors[] = __('Months must be between 0 and 12.', 'magic-checklists');
                }
    
                if ($custom_weeks < 0 || $custom_weeks > 52) {
                    $is_valid = false;
                    $errors[] = __('Weeks must be between 0 and 52.', 'magic-checklists');
                }
    
                if ($custom_days < 0 || $custom_days > 31) {
                    $is_valid = false;
                    $errors[] = __('Days must be between 0 and 31.', 'magic-checklists');
                }
    
                if ($custom_months === 0 && $custom_weeks === 0 && $custom_days === 0) {
                    $is_valid = false;
                    $errors[] = __('At least one time period must be specified for custom intervals.', 'magic-checklists');
                }
                break;
        }
    
        // Validate time format
        $reset_time = sanitize_text_field($_POST['reset_time']);
        if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $reset_time)) {
            $is_valid = false;
            $errors[] = __('Invalid time format.', 'magic-checklists');
        }
    
        return array(
            'is_valid' => $is_valid,
            'errors' => $errors
        );
    }

    public function force_delete_lock() {
        check_ajax_referer('mcl_force_delete_lock_nonce', 'nonce');
    
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array(
                'message' => __('You do not have permission to perform this action.', 'magic-checklists')
            ), 403);
        }
    
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
    
        if (!$checklist_id) {
            wp_send_json_error(array(
                'message' => __('Invalid checklist ID.', 'magic-checklists')
            ), 400);
        }
    
        // Delete the lock meta
        $deleted = delete_post_meta($checklist_id, '_mcl_lock');
    
        if ($deleted) {
            wp_send_json_success(array(
                'message' => __('Lock has been successfully deleted.', 'magic-checklists')
            ));
        } else {
            wp_send_json_error(array(
                'message' => __('No lock found or failed to delete lock.', 'magic-checklists')
            ), 500);
        }
    }    

    public function delete_checklist() {
        if ( ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( $_GET['_wpnonce'], 'mcl_delete_checklist' ) ) {
            wp_die( __( 'Nonce verification failed', 'magic-checklists' ) );
        }

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( __( 'You are not allowed to perform this action', 'magic-checklists' ) );
        }

        $checklist_id = isset( $_GET['checklist_id'] ) ? intval( $_GET['checklist_id'] ) : 0;

        if ( $checklist_id ) {
            wp_delete_post( $checklist_id, true );
        }

        wp_redirect( admin_url( 'admin.php?page=mcl_checklists' ) );
        exit;
    }

    public function clone_checklist() {
        if ( ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( $_GET['_wpnonce'], 'mcl_clone_checklist' ) ) {
            wp_die( __( 'Nonce verification failed', 'magic-checklists' ) );
        }

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( __( 'You are not allowed to perform this action', 'magic-checklists' ) );
        }

        $checklist_id = isset( $_GET['checklist_id'] ) ? intval( $_GET['checklist_id'] ) : 0;

        if ( $checklist_id ) {
            $checklist = get_post( $checklist_id );

            $new_checklist = array(
                'post_title'   => $checklist->post_title . ' (Copy)',
                'post_content' => $checklist->post_content,
                'post_type'    => 'mcl_checklist',
                'post_status'  => 'publish',
            );

            $new_checklist_id = wp_insert_post( $new_checklist );

            if ( ! is_wp_error( $new_checklist_id ) ) {
                $time_date = get_post_meta( $checklist_id, '_mcl_time_date', true );
                $items = get_post_meta( $checklist_id, '_mcl_items', true );

                update_post_meta( $new_checklist_id, '_mcl_time_date', $time_date );
                update_post_meta( $new_checklist_id, '_mcl_items', $items );
            }
        }

        wp_redirect( admin_url( 'admin.php?page=mcl_checklists' ) );
        exit;
    }
    
    public function check_shortcut() {
        check_ajax_referer( 'mcl_check_shortcut_nonce', '_ajax_nonce' );

        $shortcut = sanitize_text_field( $_POST['shortcut'] );
        $checklist_id = intval( $_POST['checklist_id'] );

        $args = array(
            'post_type'      => 'mcl_checklist',
            'meta_key'       => '_mcl_keyboard_shortcut',
            'meta_value'     => $shortcut,
            'post__not_in'   => array( $checklist_id ),
            'posts_per_page' => 1,
            'post_status'    => 'any',
        );

        $existing_checklist = get_posts( $args );

        wp_send_json_success( array( 'exists' => ! empty( $existing_checklist ) ) );
    }
    
    public function toggle_active() {
        // Verify nonce first
        check_ajax_referer('mcl_toggle_active', '_ajax_nonce');
    
        // Verify user capabilities
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array(
                'message' => __('You do not have permission to perform this action', 'magic-checklists')
            ));
            return;
        }
    
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $active = isset($_POST['active']) ? intval($_POST['active']) : 0;
    
        if (!$checklist_id) {
            wp_send_json_error(array(
                'message' => __('Invalid checklist ID', 'magic-checklists')
            ));
            return;
        }
    
        // Update the active status
        $result = update_post_meta($checklist_id, '_mcl_active', $active);
    
        if ($result !== false) {
            wp_send_json_success(array(
                'message' => $active ? 
                    __('Checklist activated successfully', 'magic-checklists') : 
                    __('Checklist deactivated successfully', 'magic-checklists')
            ));
        } else {
            wp_send_json_error(array(
                'message' => __('Failed to update checklist status', 'magic-checklists')
            ));
        }
    }
    
    public function import_checklist() {
        if ( ! isset( $_POST['mcl_nonce'] ) || ! wp_verify_nonce( $_POST['mcl_nonce'], 'mcl_import_checklist' ) ) {
            wp_die( __( 'Nonce verification failed', 'magic-checklists' ) );
        }
    
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( __( 'You are not allowed to perform this action', 'magic-checklists' ) );
        }
    
        $checklist_items = isset( $_POST['checklist_items'] ) ? $_POST['checklist_items'] : '';
        $checklist_items = sanitize_textarea_field( $checklist_items );
    
        // Split the items by line
        $items_array = explode( "\n", $checklist_items );
        $items_array = array_map( 'trim', $items_array );
        $items_array = array_filter( $items_array );
    
        // Prepare items for pre-filling
        $prefilled_items = array();
        $index = 0;
        foreach ( $items_array as $item_content ) {
            $prefilled_items[] = array(
                'id'      => 'item_' . time() . '_' . $index,
                'content' => sanitize_text_field( $item_content ),
            );
            $index++;
        }
    
        // Store the prefilled items in a transient
        $user_id = get_current_user_id();
        $transient_key = 'mcl_prefilled_items_' . $user_id;
    
        set_transient( $transient_key, $prefilled_items, 60 * 15 ); // Store for 15 minutes
    
        // Redirect to the add new checklist page
        wp_redirect( admin_url( 'admin.php?page=mcl_add_new&prefill_items=1' ) );
        exit;
    }

    private function generate_invite_token() {
        $bytes = random_bytes(32);
        return bin2hex($bytes);
    }

    public function generate_invite_link() {
        check_ajax_referer('mcl_invite_links_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Unauthorized access', 'magic-checklists'), 403);
            return;
        }
        
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $permissions = isset($_POST['permissions']) ? sanitize_text_field($_POST['permissions']) : 'view';
        $expiry_days = isset($_POST['expiry_days']) ? intval($_POST['expiry_days']) : 7;
        $usage_limit = isset($_POST['usage_limit']) ? intval($_POST['usage_limit']) : 0;
        
        if (!$checklist_id) {
            wp_send_json_error(__('Invalid checklist ID', 'magic-checklists'));
            return;
        }
        
        // Validate permissions
        if (!in_array($permissions, array('view', 'interact', 'edit'))) {
            wp_send_json_error(__('Invalid permission level', 'magic-checklists'));
            return;
        }
        
        // Generate token
        $token = $this->generate_invite_token();
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'mcl_invite_links';
        
        // Calculate expiry date
        $expiry_date = date('Y-m-d H:i:s', strtotime("+$expiry_days days"));
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'token' => $token,
                'checklist_id' => $checklist_id,
                'permissions' => $permissions,
                'expiry_date' => $expiry_date,
                'usage_limit' => $usage_limit,
                'usage_count' => 0,
                'created_at' => current_time('mysql')
            ),
            array('%s', '%d', '%s', '%s', '%d', '%d', '%s')
        );
        
        if ($result === false) {
            wp_send_json_error(__('Failed to create invite link', 'magic-checklists'));
            return;
        }
        
        $invite_url = add_query_arg(array(
            'mcl_invite' => $token
        ), home_url());
        
        wp_send_json_success(array(
            'invite_url' => $invite_url,
            'expiry_date' => $expiry_date,
            'permissions' => $permissions,
            'usage_limit' => $usage_limit
        ));
    }

    public function get_invite_links() {
        // Prevent any output buffering
        ob_clean();
        
        try {
            // Check nonce with detailed error
            if (!check_ajax_referer('mcl_invite_links_nonce', 'nonce', false)) {
                wp_send_json_error(array(
                    'message' => 'Invalid nonce',
                    'debug' => array(
                        'provided_nonce' => $_POST['nonce'] ?? 'not set',
                        'action' => 'mcl_invite_links_nonce'
                    )
                ));
                return;
            }
            
            // Verify permissions
            if (!current_user_can('manage_options')) {
                wp_send_json_error(array(
                    'message' => __('Unauthorized access', 'magic-checklists'),
                    'code' => 403
                ));
                return;
            }
            
            // Validate checklist ID
            $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
            if (!$checklist_id) {
                wp_send_json_error(array(
                    'message' => __('Invalid checklist ID', 'magic-checklists'),
                    'debug' => array(
                        'provided_id' => $_POST['checklist_id'] ?? 'not set'
                    )
                ));
                return;
            }
            
            global $wpdb;
            $table_name = $wpdb->prefix . 'mcl_invite_links';
            
            // Check if table exists
            if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
                wp_send_json_error(array(
                    'message' => __('Invite links table does not exist', 'magic-checklists'),
                    'code' => 'table_missing'
                ));
                return;
            }
            
            // Get links with error checking
            $links = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $table_name 
                WHERE checklist_id = %d 
                ORDER BY created_at DESC",
                $checklist_id
            ));
            
            if ($wpdb->last_error) {
                wp_send_json_error(array(
                    'message' => __('Database error', 'magic-checklists'),
                    'debug' => array(
                        'sql_error' => $wpdb->last_error,
                        'query' => $wpdb->last_query
                    )
                ));
                return;
            }
            
            // Format dates and ensure valid JSON data
            $formatted_links = array_map(function($link) {
                return array(
                    'id' => intval($link->id),
                    'checklist_id' => intval($link->checklist_id),
                    'permissions' => sanitize_text_field($link->permissions),
                    'expiry_date' => mysql2date('c', $link->expiry_date),
                    'usage_limit' => intval($link->usage_limit),
                    'usage_count' => intval($link->usage_count),
                    'created_at' => mysql2date('c', $link->created_at),
                    'invite_url' => add_query_arg(array(
                        'mcl_invite' => $link->token
                    ), home_url())
                );
            }, $links);
            
            // Send success response
            wp_send_json_success($formatted_links);
            
        } catch (Exception $e) {
            // Log error and send generic response
            error_log('Magic Checklists invite links error: ' . $e->getMessage());
            wp_send_json_error(array(
                'message' => __('An unexpected error occurred', 'magic-checklists'),
                'code' => 500
            ));
        }
    }

    public function delete_invite_link() {
        check_ajax_referer('mcl_invite_links_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Unauthorized access', 'magic-checklists'), 403);
            return;
        }
        
        $link_id = isset($_POST['link_id']) ? intval($_POST['link_id']) : 0;
        
        if (!$link_id) {
            wp_send_json_error(__('Invalid link ID', 'magic-checklists'));
            return;
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'mcl_invite_links';
        
        $result = $wpdb->delete(
            $table_name,
            array('id' => $link_id),
            array('%d')
        );
        
        if ($result === false) {
            wp_send_json_error(__('Failed to delete invite link', 'magic-checklists'));
            return;
        }
        
        wp_send_json_success();
    }

    public function update_invite_permission() {
        check_ajax_referer('mcl_invite_links_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Unauthorized access', 'magic-checklists'), 403);
            return;
        }
        
        $link_id = isset($_POST['link_id']) ? intval($_POST['link_id']) : 0;
        $new_permission = isset($_POST['permission']) ? sanitize_text_field($_POST['permission']) : '';
        
        if (!$link_id || !in_array($new_permission, array('view', 'interact', 'edit'))) {
            wp_send_json_error(__('Invalid parameters', 'magic-checklists'));
            return;
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'mcl_invite_links';
        
        $result = $wpdb->update(
            $table_name,
            array('permissions' => $new_permission),
            array('id' => $link_id),
            array('%s'),
            array('%d')
        );
        
        if ($result === false) {
            wp_send_json_error(__('Failed to update permission', 'magic-checklists'));
            return;
        }
        
        wp_send_json_success();
    }

    /**
     * Helper method to get shortcode settings
     * 
     * @param int    $checklist_id The checklist ID
     * @param string $key          The setting key to retrieve
     * @param mixed  $default      Default value if setting doesn't exist
     * @return mixed
     */
    public static function get_shortcode_setting($checklist_id, $key, $default = '') {
        $settings = get_post_meta($checklist_id, '_mcl_shortcode_settings', true) ?: array();
        return isset($settings[$key]) ? $settings[$key] : $default;
    }

    /**
     * Get all shortcode settings for a checklist
     * 
     * @param int $checklist_id The checklist ID
     * @return array
     */
    public static function get_shortcode_settings($checklist_id) {
        $defaults = array(
            'show_title' => 1,
            'show_description' => 1,
            'show_deadline' => 0,
            'show_priority' => 0,
            'show_numbers' => 1,
            'width' => 'full',
            'custom_width' => 800,
            'bg_color' => '#ffffff',
            'border' => 'none',
            'spacing' => 'comfortable',
            'disable_drawer' => 0,
            'enable_reorder' => 0,
            'check_state' => 'session'
        );

        $settings = get_post_meta($checklist_id, '_mcl_shortcode_settings', true) ?: array();
        return wp_parse_args($settings, $defaults);
    }

    public static function is_shortcode_enabled($checklist_id) {
        return (bool) get_post_meta($checklist_id, '_mcl_enable_shortcode', true);
    }

    public function import_json_checklist() {
        if (!isset($_POST['mcl_json_nonce']) || !wp_verify_nonce($_POST['mcl_json_nonce'], 'mcl_import_json_checklist')) {
            wp_die(__('Security check failed', 'magic-checklists'));
        }
    
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have permission to perform this action', 'magic-checklists'));
        }
    
        // Check if file was uploaded
        if (!isset($_FILES['json_file']) || $_FILES['json_file']['error'] !== UPLOAD_ERR_OK) {
            wp_die(__('No file uploaded or upload failed', 'magic-checklists'));
        }
    
        // Verify file type
        $file_type = wp_check_filetype($_FILES['json_file']['name'], array('json' => 'application/json'));
        if ($file_type['ext'] !== 'json') {
            wp_die(__('Invalid file type. Please upload a JSON file.', 'magic-checklists'));
        }
    
        // Read and decode JSON
        $json_content = file_get_contents($_FILES['json_file']['tmp_name']);
        $checklist_data = json_decode($json_content, true);
    
        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_die(__('Invalid JSON format', 'magic-checklists'));
        }
    
        // Create new checklist
        $checklist_post = array(
            'post_title'   => sanitize_text_field($checklist_data['title']),
            'post_content' => wp_kses_post($checklist_data['description']),
            'post_type'    => 'mcl_checklist',
            'post_status'  => 'publish'
        );
    
        $checklist_id = wp_insert_post($checklist_post);
    
        if (is_wp_error($checklist_id)) {
            wp_die(__('Failed to create checklist', 'magic-checklists'));
        }
    
        // Import meta data
        if (isset($checklist_data['meta']) && is_array($checklist_data['meta'])) {
            foreach ($checklist_data['meta'] as $meta_key => $meta_value) {
                if ($meta_key === '_mcl_items') {
                    // Sanitize items
                    $sanitized_items = array();
                    foreach ($meta_value as $item) {
                        $sanitized_items[] = array(
                            'id'       => sanitize_text_field($item['id']),
                            'content'  => wp_kses_post($item['content']),
                            'priority' => sanitize_text_field($item['priority'] ?? 'none')
                        );
                    }
                    $meta_value = $sanitized_items;
                }
                
                update_post_meta($checklist_id, $meta_key, $meta_value);
            }
        }
    
        wp_redirect(add_query_arg(
            array(
                'page' => 'mcl_add_new',
                'checklist_id' => $checklist_id,
                'imported' => '1'
            ),
            admin_url('admin.php')
        ));
        exit;
    }

    private function save_custom_theme_settings($checklist_id) {
        // Theme-related settings to save
        $theme_settings = array(
            // Existing settings
            'drawer_bg_color',
            'list_item_bg_color',
            'text_color',
            'heading_font_size',
            'description_text_color',
            'description_font_size',
            'list_item_font_size',
            'primary_button_bg',
            'primary_button_text_color',
            'secondary_button_bg',
            'secondary_button_text_color',
            'drawer_width',
            'drawer_height',
            'float_button_bg',
            'float_button_text_color',
            'float_button_font_size',
            'show_float_button_icon',
            'drawer_border_radius',
            'checkbox_bg_color',
            'checkbox_border_radius',
            'checkbox_style',
            'checkbox_custom_icon',
            'checkbox_checkmark_color'
        );
    
        // Validate and sanitize each setting
        foreach ($theme_settings as $setting) {
            if (isset($_POST[$setting])) {
                $value = $_POST[$setting];
                
                // Sanitize based on setting type
                if (strpos($setting, 'color') !== false) {
                    // Sanitize color values
                    $value = sanitize_hex_color($_POST[$setting]);
                } elseif (strpos($setting, 'font_size') !== false || 
                          strpos($setting, 'width') !== false || 
                          strpos($setting, 'height') !== false) {
                    // Sanitize numeric values
                    $value = absint($_POST[$setting]);
                    
                    // Apply min/max constraints
                    switch ($setting) {
                        case 'heading_font_size':
                            $value = min(max($value, 12), 48);
                            break;
                        case 'description_font_size':
                        case 'list_item_font_size':
                        case 'float_button_font_size':
                            $value = min(max($value, 10), 24);
                            break;
                        case 'drawer_width':
                            $value = min(max($value, 400), 1200);
                            break;
                        case 'drawer_height':
                            $value = min(max($value, 300), 1000);
                            break;
                    }
                } elseif (strpos($setting, 'border_radius') !== false) {
                    $value = intval($_POST[$setting]);
                    
                    // Apply min/max constraints
                    switch ($setting) {
                        case 'drawer_border_radius':
                            $value = min(max($value, 0), 50);
                            break;
                        case 'checkbox_border_radius':
                            $value = min(max($value, 0), 12);
                            break;
                    }

                } elseif ($setting === 'show_float_button_icon') {
                    $value = $_POST[$setting] === '1' ? '1' : '0';
                } elseif ($setting === 'checkbox_style') {
                    $value = in_array($_POST[$setting], array('standard', 'custom')) ? 
                        $_POST[$setting] : 'standard';
                } elseif ($setting === 'checkbox_custom_icon') {
                    $value = esc_url_raw($_POST[$setting]);
                    
                    if ($value && !$this->is_valid_media_url($value)) {
                        $value = '';
                    }
                }
                
                // Save the setting
                update_post_meta($checklist_id, '_mcl_' . $setting, $value);
            }
        }
    }
    
    /**
     * Helper function to verify if a URL is from the WordPress media library
     */
    private function is_valid_media_url($url) {
        $upload_dir = wp_upload_dir();
        $upload_base_url = $upload_dir['baseurl'];
        
        // Check if the URL starts with the uploads directory URL
        if (strpos($url, $upload_base_url) === 0) {
            // Get the file path from URL
            $file_path = str_replace($upload_base_url, $upload_dir['basedir'], $url);
            
            // Check if file exists and is an image
            if (file_exists($file_path)) {
                $mime_type = wp_check_filetype($file_path);
                return in_array($mime_type['type'], array('image/jpeg', 'image/png', 'image/svg+xml'));
            }
        }
        
        return false;
    }

    /**
     * Render analytics page
     */
    public function render_analytics_page() {
        $analytics = MCL_Analytics::get_instance();
        $analytics->render_analytics_page();
    }
}
