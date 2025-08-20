<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class MCL_Admin {
    private $nonce_key = 'mcl_invite_links_nonce';
    private $created_toplevel_menu = false;

    public function __construct() {
        add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
        add_action( 'admin_menu', array( $this, 'add_landing_submenu' ), 999 );
        add_action( 'admin_menu', array( $this, 'apply_submenu_ordering' ), 9999 );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
        
        // Migrate individual settings to shared settings on first load
        add_action( 'admin_init', array( $this, 'migrate_individual_settings_to_shared' ) );
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
        add_action('wp_ajax_mcl_get_checklists', array($this, 'get_checklists_data'));
        add_action('wp_ajax_mcl_delete_checklist', array($this, 'ajax_delete_checklist'));
        add_action('wp_ajax_mcl_clone_checklist', array($this, 'ajax_clone_checklist'));
        add_action('wp_ajax_mcl_save_theme_mode', array($this, 'save_theme_mode'));
        add_action('wp_ajax_mcl_get_checklist_for_edit', array($this, 'get_checklist_for_edit'), 10);
        add_action('wp_ajax_mcl_get_users', array($this, 'get_users'), 10);
        add_action('wp_ajax_mcl_get_roles', array($this, 'get_roles'), 10);
        add_action('wp_ajax_mcl_get_admin_pages', array($this, 'get_admin_pages'), 10);
        add_action('wp_ajax_mcl_get_license_status', array($this, 'get_license_status'), 10);
        add_action('wp_ajax_mcl_activate_license', array($this, 'handle_license_activation'), 10);
        add_action('wp_ajax_mcl_deactivate_license', array($this, 'handle_license_deactivation'), 10);

        // Kanban board AJAX handlers
        add_action('wp_ajax_mcl_get_kanban_board', array($this, 'get_kanban_board'));
        add_action('wp_ajax_mcl_update_kanban_item', array($this, 'update_kanban_item'));
        add_action('wp_ajax_mcl_update_kanban_columns', array($this, 'update_kanban_columns'));
        add_action('wp_ajax_mcl_assign_kanban_user', array($this, 'assign_kanban_user'));
        add_action('wp_ajax_mcl_set_kanban_due_date', array($this, 'set_kanban_due_date'));
        
        // Task editing and comments AJAX handlers
        add_action('wp_ajax_mcl_update_task_content', array($this, 'update_task_content'));
        add_action('wp_ajax_mcl_get_task_comments', array($this, 'get_task_comments'));
        add_action('wp_ajax_mcl_add_task_comment', array($this, 'add_task_comment'));
        add_action('wp_ajax_mcl_update_task_comment', array($this, 'update_task_comment'));
        add_action('wp_ajax_mcl_delete_task_comment', array($this, 'delete_task_comment'));
        add_action('wp_ajax_mcl_save_task_comment', array($this, 'save_task_comment'));
        
        // Enhanced comments with threading and likes
        add_action('wp_ajax_mcl_get_threaded_comments', array($this, 'get_threaded_comments'));
        add_action('wp_ajax_nopriv_mcl_get_threaded_comments', array($this, 'get_threaded_comments'));
        add_action('wp_ajax_mcl_add_threaded_comment', array($this, 'add_threaded_comment'));
        add_action('wp_ajax_nopriv_mcl_add_threaded_comment', array($this, 'add_threaded_comment'));
        add_action('wp_ajax_mcl_delete_threaded_comment', array($this, 'delete_threaded_comment'));
        add_action('wp_ajax_mcl_toggle_comment_like', array($this, 'toggle_comment_like'));
        add_action('wp_ajax_nopriv_mcl_toggle_comment_like', array($this, 'toggle_comment_like'));
    }

    public function add_admin_menu() {
        // Get shared settings for menu positioning
        $shared_settings = get_option('magic_plugins_settings', array());
        
        // Use shared settings only (no more individual fallbacks)
        $position_type = !empty($shared_settings['menu_position_type']) ? 
            $shared_settings['menu_position_type'] : 'default';
        
        // Default position is 26
        $menu_position = 26;
        
        if ($position_type === 'custom') {
            // Use shared settings only
            $menu_position = !empty($shared_settings['custom_position']) ? 
                intval($shared_settings['custom_position']) : $menu_position;
                
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
            $relative_to = !empty($shared_settings['menu_position_relative_to']) ? 
                $shared_settings['menu_position_relative_to'] : '';
            $position = !empty($shared_settings['menu_position']) ? 
                $shared_settings['menu_position'] : 'after';
            
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

        // Inside add_admin_menu, replace the existing add_menu_page + duplicate removal with conditional check
        // Add main menu page with new "MagicPlugins" branding only if it hasn't been created by another Magic plugin
        global $menu;
        $magic_plugins_exists = false;
        if ( is_array( $menu ) ) {
            foreach ( $menu as $item ) {
                if ( ! empty( $item[2] ) && $item[2] === 'magic_plugins' ) {
                    $magic_plugins_exists = true;
                    break;
                }
            }
        }

        if ( ! $magic_plugins_exists ) {
        add_menu_page(
            __('MagicPlugins', 'magic-checklists'),
            __('MagicPlugins', 'magic-checklists'),
            'manage_options',
            'magic_plugins',
            array($this, 'magic_plugins_landing_page'),
            'data:image/svg+xml;base64,' . base64_encode(file_get_contents(MAGIC_CHECKLISTS_PLUGIN_PATH . 'assets/images/menu-icon.svg')),
            $menu_position
        );

            // Mark that we created the top-level menu
            $this->created_toplevel_menu = true;
        }
    
        // Add first submenu item for MagicChecklists
        add_submenu_page(
            'magic_plugins',
            __('MagicChecklists', 'magic-checklists'),
            __('MagicChecklists', 'magic-checklists'),
            'manage_options',
            'mcl_checklists',
            array($this, 'checklists_page')
        );

    }

    // Add landing submenu with high priority to ensure it appears last
    public function add_landing_submenu() {
        // If we created the top-level menu, remove the automatic duplicate first
        if ( $this->created_toplevel_menu ) {
            remove_submenu_page('magic_plugins', 'magic_plugins');
        }

        // Before adding the landing submenu, check if it already exists
        global $submenu;
        $landing_exists = false;
        if ( isset( $submenu['magic_plugins'] ) && is_array( $submenu['magic_plugins'] ) ) {
            foreach ( $submenu['magic_plugins'] as $sub ) {
                if ( isset( $sub[2] ) && $sub[2] === 'magic_plugins_landing' ) {
                    $landing_exists = true;
                    break;
                }
            }
        }

        if ( ! $landing_exists ) {
            // Add second submenu item for MagicPlugins landing page as last item
        add_submenu_page(
            'magic_plugins',
            __('MagicPlugins', 'magic-checklists'),
            __('MagicPlugins', 'magic-checklists'),
            'manage_options',
            'magic_plugins_landing',
            array($this, 'magic_plugins_landing_page')
        );
        }
    }

    public function magic_plugins_landing_page() {
        // Handle form submission
        if (isset($_POST['submit']) && check_admin_referer('magic_plugins_settings', 'magic_plugins_nonce')) {
            $this->save_shared_settings($_POST);
            echo '<div class="notice notice-success"><p>' . __('Settings saved successfully!', 'magic-checklists') . '</p></div>';
        }

        $settings = $this->get_shared_settings();
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(__('MagicPlugins Settings', 'magic-checklists')); ?></h1>
            <p><?php echo esc_html(__('Configure shared settings for all Magic plugins.', 'magic-checklists')); ?></p>
            
            <form method="post" action="">
                <?php wp_nonce_field('magic_plugins_settings', 'magic_plugins_nonce'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php esc_html_e('Menu Position', 'magic-checklists'); ?></th>
                        <td>
                            <?php $this->render_menu_position_field($settings); ?>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php esc_html_e('Date & Time Format', 'magic-checklists'); ?></th>
                        <td>
                            <?php $this->render_date_format_field($settings); ?>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php esc_html_e('Submenu Items Order', 'magic-checklists'); ?></th>
                        <td>
                            <?php $this->render_submenu_order_field($settings); ?>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    private function get_shared_settings() {
        $defaults = array(
            'menu_position_type' => 'default',
            'menu_position_relative_to' => '',
            'menu_position' => 'after',
            'custom_position' => 26,
            'date_format' => 'us',
            'submenu_order' => array()
        );
        
        $settings = get_option('magic_plugins_settings', array());
        return array_merge($defaults, $settings);
    }

    private function save_shared_settings($post_data) {
        $settings = array();
        
        // Menu position settings
        $settings['menu_position_type'] = sanitize_text_field($post_data['menu_position_type']);
        if ($settings['menu_position_type'] === 'relative') {
            $settings['menu_position_relative_to'] = sanitize_text_field($post_data['menu_position_relative_to']);
            $settings['menu_position'] = in_array($post_data['menu_position'], ['before', 'after']) ? $post_data['menu_position'] : 'after';
        } elseif ($settings['menu_position_type'] === 'custom') {
            $settings['custom_position'] = max(1, min(99, intval($post_data['custom_position'])));
        }
        
        // Date format
        $allowed_formats = array('us', 'eu', 'iso', 'compact', 'long');
        $settings['date_format'] = in_array($post_data['date_format'], $allowed_formats) ? $post_data['date_format'] : 'us';
        
        // Submenu order
        if (isset($post_data['submenu_order']) && is_array($post_data['submenu_order'])) {
            $settings['submenu_order'] = array_map('sanitize_text_field', $post_data['submenu_order']);
        }
        
        update_option('magic_plugins_settings', $settings);
    }

    private function render_menu_position_field($settings) {
        $position_type = $settings['menu_position_type'];
        $relative_to = $settings['menu_position_relative_to'];
        $position = $settings['menu_position'];
        $custom_position = $settings['custom_position'];
        
        // Get all admin menu items
        global $menu;
        $menu_items = array();
        if (is_array($menu)) {
            foreach ($menu as $item) {
                if (!empty($item[0]) && !empty($item[2])) {
                    $title = strip_tags($item[0]);
                    $menu_items[$item[2]] = $title;
                }
            }
        }
        ?>
        <select name="menu_position_type" id="menu-position-type">
            <option value="default" <?php selected($position_type, 'default'); ?>><?php esc_html_e('Default Position', 'magic-checklists'); ?></option>
            <option value="relative" <?php selected($position_type, 'relative'); ?>><?php esc_html_e('Relative to Another Menu Item', 'magic-checklists'); ?></option>
            <option value="custom" <?php selected($position_type, 'custom'); ?>><?php esc_html_e('Custom Position (1-99)', 'magic-checklists'); ?></option>
        </select>

        <div id="relative-position-wrapper" style="<?php echo $position_type === 'relative' ? '' : 'display: none;'; ?>">
            <select name="menu_position">
                <option value="after" <?php selected($position, 'after'); ?>><?php esc_html_e('After', 'magic-checklists'); ?></option>
                <option value="before" <?php selected($position, 'before'); ?>><?php esc_html_e('Before', 'magic-checklists'); ?></option>
            </select>
            <select name="menu_position_relative_to">
                <option value=""><?php esc_html_e('Select Menu Item', 'magic-checklists'); ?></option>
                <?php foreach ($menu_items as $slug => $title): ?>
                    <option value="<?php echo esc_attr($slug); ?>" <?php selected($relative_to, $slug); ?>><?php echo esc_html($title); ?></option>
                <?php endforeach; ?>
            </select>
        </div>

        <div id="custom-position-wrapper" style="<?php echo $position_type === 'custom' ? '' : 'display: none;'; ?>">
            <input type="number" name="custom_position" value="<?php echo esc_attr($custom_position); ?>" min="1" max="99" class="small-text">
        </div>

        <script>
        document.addEventListener('DOMContentLoaded', function() {
            const positionType = document.getElementById('menu-position-type');
            const relativeWrapper = document.getElementById('relative-position-wrapper');
            const customWrapper = document.getElementById('custom-position-wrapper');
            
            positionType.addEventListener('change', function() {
                relativeWrapper.style.display = this.value === 'relative' ? 'block' : 'none';
                customWrapper.style.display = this.value === 'custom' ? 'block' : 'none';
            });
        });
        </script>
        <?php
    }

    private function render_date_format_field($settings) {
        $date_format = $settings['date_format'];
        $format_options = array(
            'us' => array('label' => __('US Format (MM/DD/YYYY)', 'magic-checklists'), 'example' => '03/15/2024 2:30 PM'),
            'eu' => array('label' => __('European Format (DD/MM/YYYY)', 'magic-checklists'), 'example' => '15/03/2024 14:30'),
            'iso' => array('label' => __('ISO Format (YYYY-MM-DD)', 'magic-checklists'), 'example' => '2024-03-15 14:30'),
            'compact' => array('label' => __('Compact Format (DD MMM YYYY)', 'magic-checklists'), 'example' => '15 Mar 2024 14:30'),
            'long' => array('label' => __('Long Format (Month DD, YYYY)', 'magic-checklists'), 'example' => 'March 15, 2024 2:30 PM')
        );
        ?>
        <select name="date_format" class="regular-text">
            <?php foreach ($format_options as $key => $format): ?>
                <option value="<?php echo esc_attr($key); ?>" <?php selected($date_format, $key); ?>>
                    <?php echo esc_html($format['label']); ?> - <?php echo esc_html($format['example']); ?>
                </option>
            <?php endforeach; ?>
        </select>
        <p class="description"><?php esc_html_e('Choose how dates and times should be displayed throughout Magic plugins.', 'magic-checklists'); ?></p>
        <?php
    }

    private function render_submenu_order_field($settings) {
        $submenu_order = $settings['submenu_order'];
        
        // Get current Magic plugin submenu items
        global $submenu;
        $magic_submenus = array();
        if (isset($submenu['magic_plugins']) && is_array($submenu['magic_plugins'])) {
            foreach ($submenu['magic_plugins'] as $sub) {
                if (isset($sub[2]) && $sub[2] !== 'magic_plugins_landing') {
                    $magic_submenus[$sub[2]] = $sub[0];
                }
            }
        }
        ?>
        <div id="submenu-order-container">
            <p class="description"><?php esc_html_e('Drag and drop to reorder Magic plugin submenu items.', 'magic-checklists'); ?></p>
            <ul id="submenu-sortable" style="list-style: none; padding: 0;">
                <?php 
                // Order items based on saved order, then add any new ones
                $ordered_items = array();
                foreach ($submenu_order as $slug) {
                    if (isset($magic_submenus[$slug])) {
                        $ordered_items[$slug] = $magic_submenus[$slug];
                        unset($magic_submenus[$slug]);
                    }
                }
                // Add any remaining items
                $ordered_items = array_merge($ordered_items, $magic_submenus);
                
                foreach ($ordered_items as $slug => $title): ?>
                    <li style="background: #f1f1f1; padding: 10px; margin: 5px 0; cursor: move; border: 1px solid #ddd;">
                        <input type="hidden" name="submenu_order[]" value="<?php echo esc_attr($slug); ?>">
                        <?php echo esc_html(strip_tags($title)); ?>
                    </li>
                <?php endforeach; ?>
                </ul>
            </div>

        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Simple drag and drop implementation
            const sortable = document.getElementById('submenu-sortable');
            if (sortable) {
                let draggedElement = null;
                
                sortable.addEventListener('dragstart', function(e) {
                    draggedElement = e.target;
                    e.target.style.opacity = '0.5';
                });
                
                sortable.addEventListener('dragend', function(e) {
                    e.target.style.opacity = '';
                    draggedElement = null;
                });
                
                sortable.addEventListener('dragover', function(e) {
                    e.preventDefault();
                });
                
                sortable.addEventListener('drop', function(e) {
                    e.preventDefault();
                    if (draggedElement && e.target !== draggedElement && e.target.tagName === 'LI') {
                        const rect = e.target.getBoundingClientRect();
                        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                        sortable.insertBefore(draggedElement, next ? e.target.nextSibling : e.target);
                    }
                });
                
                // Make items draggable
                const items = sortable.querySelectorAll('li');
                items.forEach(item => {
                    item.draggable = true;
                });
            }
        });
        </script>
        <?php
    }

    public function enqueue_admin_scripts($hook) {
        // Load on our plugin pages
        $plugin_pages = array(
            'toplevel_page_magic_plugins',            // Main MagicPlugins page
            'magicplugins_page_mcl_checklists',       // MagicChecklists submenu
            'magicplugins_page_magic_plugins_landing' // MagicPlugins landing submenu
        );
        
        if ( ! in_array( $hook, $plugin_pages ) ) {
            return;
        }

        // React will handle all functionality, but we still need some basic WordPress media support
        wp_enqueue_media();
        
        // Check if React dev class exists and is handling script loading
        global $mcl_react_dev;
        
        // Don't localize script if React dev class is handling it
        // The React dev class provides more comprehensive data including proper nonces
        if (!class_exists('MCL_React_Dev')) {
            error_log('MCL_React_Dev not available, providing fallback localization');
            // Fallback localization for remaining PHP functionality (AJAX handlers) when React dev is not available
            wp_localize_script('jquery', 'mclAdminData', array(
                'ajaxurl' => admin_url('admin-ajax.php'),
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonces' => array(
                    'mcl_admin' => wp_create_nonce('mcl_admin'),
                    'mcl_ajax_nonce' => wp_create_nonce('mcl_ajax_nonce'),
                    'mcl_save_checklist' => wp_create_nonce('mcl_save_checklist'),
                    'mcl_toggle_active' => wp_create_nonce('mcl_toggle_active'),
                    'checkShortcut' => wp_create_nonce('mcl_check_shortcut_nonce'),
                    'inviteLinks' => wp_create_nonce($this->nonce_key),
                    'forceDeleteLock' => wp_create_nonce('mcl_force_delete_lock_nonce'),
                    'testWebhook' => wp_create_nonce('mcl_test_webhook'),
                    'pdfExport' => wp_create_nonce('mcl_save_pdf_settings'),
                    'mcl_save_theme_mode' => wp_create_nonce('mcl_save_theme_mode'),
                ),
                'savedTheme' => get_user_meta(get_current_user_id(), 'mcl_theme', true) ?: '',
                'currentChecklistId' => isset($_GET['checklist_id']) ? intval($_GET['checklist_id']) : 0,
                'pluginUrl' => plugin_dir_url(dirname(__FILE__)) . '../',
                'admin_url' => admin_url(),
            ));
        }
        
        // Add our AJAX actions with proper priority
        add_action('wp_ajax_mcl_toggle_active', array($this, 'toggle_active'), 10);
        add_action('wp_ajax_mcl_get_checklist_for_edit', array($this, 'get_checklist_for_edit'), 10);
        add_action('wp_ajax_mcl_get_users', array($this, 'get_users'), 10);
        add_action('wp_ajax_mcl_get_roles', array($this, 'get_roles'), 10);
        add_action('wp_ajax_mcl_get_admin_pages', array($this, 'get_admin_pages'), 10);
    }

    function get_registered_admin_pages() {
        global $menu, $submenu;
        
        // Initialize arrays
        $pages = array();
        $seen = array();
    
        // Make sure we have the plugin functions available
        if (!function_exists('is_plugin_active')) {
            require_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
    
        // Check if we're in an AJAX request
        $is_ajax = defined('DOING_AJAX') && DOING_AJAX;
        
        // If this is an AJAX request and $menu is not populated
        if ($is_ajax && (empty($menu) || !is_array($menu))) {
            // Provide a default set of common admin pages
            return array(
                'index' => 'Dashboard',
                'edit' => 'Posts',
                'upload' => 'Media',
                'edit-comments' => 'Comments',
                'edit-page' => 'Pages',
                'themes' => 'Appearance',
                'plugins' => 'Plugins',
                'users' => 'Users',
                'tools' => 'Tools',
                'options-general' => 'Settings',
                'woocommerce' => 'WooCommerce',
                'edit-wc-orders' => 'WooCommerce Orders',
                'wc-admin' => 'WooCommerce Admin',
                'elementor' => 'Elementor',
                'elementor-templates' => 'Elementor Templates',
                'mcl_checklists' => 'MagicChecklists',
                'edit-tags' => 'Categories',
                'profile' => 'Profile',
                'customize' => 'Customize'
            );
        }
    
        // Get current screen to check active plugins
        if (!function_exists('get_current_screen')) {
            require_once(ABSPATH . 'wp-admin/includes/screen.php');
        }
    
        // Make sure the admin menu is built
        if (!$menu) {
            require_once(ABSPATH . 'wp-admin/includes/admin.php');
            // Try to populate the menu
            if (!did_action('_admin_menu')) {
                do_action('_admin_menu');
            }
            
            // If menu is still empty after trying to build it
            if (empty($menu) || !is_array($menu)) {
                // Return the default list
                return array(
                    'index' => 'Dashboard',
                    'edit' => 'Posts',
                    'upload' => 'Media',
                    'edit-comments' => 'Comments',
                    'edit-page' => 'Pages',
                    'themes' => 'Appearance',
                    'plugins' => 'Plugins',
                    'users' => 'Users',
                    'tools' => 'Tools',
                    'options-general' => 'Settings'
                );
            }
        }
    
        // Process main menu - now with null check
        if (is_array($menu)) {
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
                if (isset($submenu[$menu_slug]) && is_array($submenu[$menu_slug])) {
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
            if (function_exists('is_plugin_active') && is_plugin_active($plugin_path)) {
                foreach ($plugin_pages as $slug => $title) {
                    if (!isset($seen[$slug])) {
                        $pages[$slug] = $title;
                        $seen[$slug] = true;
                    }
                }
            }
        }
        
        // Add our own plugin pages explicitly
        if (!isset($pages['mcl_checklists'])) {
            $pages['mcl_checklists'] = 'MagicChecklists';
        }
        if (!isset($pages['mcl_add_new'])) {
            $pages['mcl_add_new'] = 'Add New Checklist';
        }
        if (!isset($pages['mcl_import'])) {
            $pages['mcl_import'] = 'Import/Export';
        }
        if (!isset($pages['mcl_analytics'])) {
            $pages['mcl_analytics'] = 'Analytics';
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
        
        // Render React app container directly
        echo '<div id="mcl-admin-root"></div>';
    }



    public function save_checklist() {
        if (!isset($_POST['mcl_nonce']) || !wp_verify_nonce($_POST['mcl_nonce'], 'mcl_save_checklist')) {
            wp_die(__('Nonce verification failed', 'magic-checklists'));
        }

        if (!current_user_can('manage_options')) {
            wp_die(__('You are not allowed to perform this action', 'magic-checklists'));
        }
    
        $checklist_id = isset( $_POST['checklist_id'] ) ? intval( $_POST['checklist_id'] ) : 0;
        $checklist_type = isset( $_POST['checklist_type'] ) ? sanitize_text_field( $_POST['checklist_type'] ) : 'classic';
        $title = sanitize_text_field( $_POST['title'] );
        $description = sanitize_textarea_field( $_POST['description'] );
        
        // Handle boolean fields explicitly - if the field is '1', set to 1, otherwise set to 0
        $show_description = (isset($_POST['show_description']) && $_POST['show_description'] === '1') ? 1 : 0;
        $active = (isset($_POST['active']) && $_POST['active'] === '1') ? 1 : 0;
        $trigger_shortcut = (isset($_POST['trigger_shortcut']) && $_POST['trigger_shortcut'] === '1') ? 1 : 0;
        $trigger_button = (isset($_POST['trigger_button']) && $_POST['trigger_button'] === '1') ? 1 : 0;
        $disable_in_builders = (isset($_POST['disable_in_builders']) && $_POST['disable_in_builders'] === '1') ? 1 : 0;
        $enable_item_priority = (isset($_POST['enable_item_priority']) && $_POST['enable_item_priority'] === '1') ? 1 : 0;
        $enable_item_locking = (isset($_POST['enable_item_locking']) && $_POST['enable_item_locking'] === '1') ? 1 : 0;
        $public_access = (isset($_POST['public_access']) && $_POST['public_access'] === '1') ? 1 : 0;
        $enable_rate_limit = (isset($_POST['enable_rate_limit']) && $_POST['enable_rate_limit'] === '1') ? 1 : 0;
        $load_everywhere = (isset($_POST['load_everywhere']) && $_POST['load_everywhere'] === '1') ? 1 : 0;
        $enable_shortcode = (isset($_POST['enable_shortcode']) && $_POST['enable_shortcode'] === '1') ? 1 : 0;
        $auto_reset = (isset($_POST['auto_reset']) && $_POST['auto_reset'] === '1') ? 1 : 0;
        
        // Handle time_date with proper WordPress timezone conversion
        $time_date = '';
        if (!empty($_POST['time_date'])) {
            // Get WordPress timezone
            $wp_timezone = wp_timezone();
            
            try {
                // Create DateTime object from the input, treating it as WordPress local time
                $datetime = new DateTime($_POST['time_date'], $wp_timezone);
                // Convert to UTC timestamp for storage
                $time_date = $datetime->getTimestamp();
            } catch (Exception $e) {
                // Fallback to original behavior if DateTime creation fails
                $time_date = strtotime($_POST['time_date']);
            }
        }
        $keyboard_shortcut = sanitize_text_field( $_POST['keyboard_shortcut'] );
        $checked_state_handling = sanitize_text_field( $_POST['checked_state'] );
        $theme = sanitize_text_field( $_POST['theme'] );
        $priority = sanitize_text_field( $_POST['priority'] );
        
        $short_title = isset($_POST['short_title']) ? sanitize_text_field($_POST['short_title']) : '';
        $button_position = isset($_POST['button_position']) ? sanitize_text_field($_POST['button_position']) : 'bottom-right';

        $priority_display_type = isset( $_POST['priority_display_type'] ) ? 
            sanitize_text_field( $_POST['priority_display_type'] ) : 'color';

        $public_permission = isset($_POST['public_permission']) ? sanitize_text_field($_POST['public_permission']) : 'interact';
        $public_checked_state_handling = sanitize_text_field($_POST['public_checked_state']);
        $public_description = isset($_POST['public_description']) ? sanitize_textarea_field($_POST['public_description']) : '';

        // Allowed User Roles
        $access_roles = isset($_POST['access_roles']) && is_array($_POST['access_roles']) ? array_map('sanitize_text_field', $_POST['access_roles']) : array();
        $access_roles_permission = isset($_POST['access_roles_permission']) ? sanitize_text_field($_POST['access_roles_permission']) : 'interact';

        // Allowed Users
        $access_users = isset($_POST['access_users']) && is_array($_POST['access_users']) ? array_map('intval', $_POST['access_users']) : array();
        $access_users_permission = isset($_POST['access_users_permission']) ? sanitize_text_field($_POST['access_users_permission']) : 'interact';

        $allowed_pages = isset($_POST['allowed_pages']) && is_array($_POST['allowed_pages']) ? array_map('sanitize_text_field', $_POST['allowed_pages']) : array();
        $allowed_urls = isset($_POST['allowed_urls']) && is_array($_POST['allowed_urls']) ? array_map('sanitize_text_field', $_POST['allowed_urls']) : array();
    
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
                    'locked' => (!empty($item['locked']) && $item['locked'] === '1') ? 1 : 0,
                );
            }
        }

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

        // Fix notification settings to use proper boolean handling
        $notification_settings = array(
            'notifications_enabled' => (isset($_POST['notifications_enabled']) && $_POST['notifications_enabled'] === '1'),
            'email_enabled' => (isset($_POST['email_enabled']) && $_POST['email_enabled'] === '1'),
            'integration_enabled' => (isset($_POST['integration_enabled']) && $_POST['integration_enabled'] === '1'),
            'email_recipients' => sanitize_text_field($_POST['email_recipients'] ?? ''),
            'slack_webhook_url' => esc_url_raw($_POST['slack_webhook_url'] ?? ''),
            'discord_webhook_url' => esc_url_raw($_POST['discord_webhook_url'] ?? ''),
            'notify_on_new_item' => (isset($_POST['notify_on_new_item']) && $_POST['notify_on_new_item'] === '1'),
            'notify_on_delete_item' => (isset($_POST['notify_on_delete_item']) && $_POST['notify_on_delete_item'] === '1'),
            'notify_on_check_item' => (isset($_POST['notify_on_check_item']) && $_POST['notify_on_check_item'] === '1'),
            'notify_on_uncheck_item' => (isset($_POST['notify_on_uncheck_item']) && $_POST['notify_on_uncheck_item'] === '1'),
            'notify_on_deadline' => (isset($_POST['notify_on_deadline']) && $_POST['notify_on_deadline'] === '1'),
            'notify_on_comments' => (isset($_POST['notify_on_comments']) && $_POST['notify_on_comments'] === '1'),
            'deadline_threshold_hours' => absint($_POST['deadline_threshold_hours'] ?? 24),
            'batch_interval' => sanitize_text_field($_POST['batch_interval'] ?? 'fifteen_minutes')
        );
        // Notification settings will be saved after deadline is updated

        // Add enable_shortcode update
        update_post_meta($checklist_id, '_mcl_enable_shortcode', $enable_shortcode);

        if ($enable_shortcode) {
            $shortcode_settings = array(
                // Display Options
                'show_title'       => (isset($_POST['shortcode_show_title']) && $_POST['shortcode_show_title'] === '1') ? 1 : 0,
                'show_description' => (isset($_POST['shortcode_show_description']) && $_POST['shortcode_show_description'] === '1') ? 1 : 0,
                'show_deadline'    => (isset($_POST['shortcode_show_deadline']) && $_POST['shortcode_show_deadline'] === '1') ? 1 : 0,
                'show_priority'    => (isset($_POST['shortcode_show_priority']) && $_POST['shortcode_show_priority'] === '1') ? 1 : 0,
                'show_numbers'     => (isset($_POST['shortcode_show_numbers']) && $_POST['shortcode_show_numbers'] === '1') ? 1 : 0,
            
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
                'width'                          => sanitize_text_field($_POST['shortcode_width'] ?? 'full'),
                'custom_width'                   => absint($_POST['shortcode_custom_width'] ?? 800),
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
                'disable_drawer' => (isset($_POST['shortcode_disable_drawer']) && $_POST['shortcode_disable_drawer'] === '1') ? 1 : 0,
                'enable_reorder' => (isset($_POST['shortcode_enable_reorder']) && $_POST['shortcode_enable_reorder'] === '1') ? 1 : 0,
                'check_state'    => sanitize_text_field($_POST['shortcode_check_state'] ?? 'session')
            );
    
            // Custom width validation
            if (isset($shortcode_settings['width']) && $shortcode_settings['width'] === 'custom') {
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
            
            // Now save notification settings after deadline is updated
            // This ensures the trigger time is calculated with the correct deadline value
            $notification_manager = MCL_Notification_Manager::get_instance();
            $notification_manager->save_notification_settings($checklist_id, $notification_settings);
            
            update_post_meta( $checklist_id, '_mcl_items', $processed_items );
            update_post_meta( $checklist_id, '_mcl_checklist_type', $checklist_type);
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
            $this->save_reset_schedule($checklist_id, $auto_reset);
            update_post_meta($checklist_id, '_mcl_disable_in_builders', $disable_in_builders);
            // Always save custom theme settings regardless of selected theme
            $this->save_custom_theme_settings($checklist_id);
            update_post_meta($checklist_id, '_mcl_show_description', $show_description);
            
            // Save icon settings
            $checklist_icon_type = isset($_POST['checklist_icon_type']) ? sanitize_text_field($_POST['checklist_icon_type']) : 'preset';
            $checklist_icon_preset = isset($_POST['checklist_icon_preset']) ? sanitize_text_field($_POST['checklist_icon_preset']) : 'checklist-1';
            $checklist_icon_custom = isset($_POST['checklist_icon_custom']) ? esc_url_raw($_POST['checklist_icon_custom']) : '';
            
            update_post_meta($checklist_id, '_mcl_checklist_icon_type', $checklist_icon_type);
            update_post_meta($checklist_id, '_mcl_checklist_icon_preset', $checklist_icon_preset);
            update_post_meta($checklist_id, '_mcl_checklist_icon_custom', $checklist_icon_custom);
        }
    
        wp_redirect( admin_url( 'admin.php?page=mcl_checklists' ) );
        exit;
    }

    private function save_reset_schedule($checklist_id, $auto_reset) {
        // Save auto reset settings - use the already processed $auto_reset variable
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
    
        // Use WordPress timezone consistently
        $timezone = wp_timezone();
        $now = new DateTime('now', $timezone);
        $today = new DateTime($now->format('Y-m-d') . ' ' . sprintf('%02d:%02d:00', $hours, $minutes), $timezone);
    
        switch ($interval) {
            case 'daily':
                $next = clone $today;
                if ($now >= $today) {
                    $next->add(new DateInterval('P1D'));
                }
                break;
    
            case 'weekly':
                $week_day = get_post_meta($checklist_id, '_mcl_week_day', true) ?: '1';
                $current_week_day = (int)$now->format('N'); // 1 = Monday, 7 = Sunday
                $days_until_target = ($week_day - $current_week_day + 7) % 7;
                
                if ($days_until_target === 0 && $now >= $today) {
                    $days_until_target = 7;
                }
                
                $next = clone $today;
                $next->add(new DateInterval('P' . $days_until_target . 'D'));
                break;
    
            case 'monthly':
                $month_day = get_post_meta($checklist_id, '_mcl_month_day', true) ?: '1';
                $current_month_day = (int)$now->format('j');
                
                $next = new DateTime($now->format('Y-m-') . sprintf('%02d', $month_day) . ' ' . sprintf('%02d:%02d:00', $hours, $minutes), $timezone);
                if ($now >= $next || $current_month_day > $month_day) {
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
                if ($now >= $today) {
                    $next->add(new DateInterval('P' . $total_days . 'D'));
                }
                break;
            
            default:
                $next = clone $today;
                $next->add(new DateInterval('P1D'));
                break;
        }
            
        return $next->getTimestamp();
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
                // Get all meta data from original checklist
                $all_meta = get_post_meta( $checklist_id );
                
                // Copy all meta data to new checklist
                foreach ( $all_meta as $meta_key => $meta_values ) {
                    foreach ( $meta_values as $meta_value ) {
                        update_post_meta( $new_checklist_id, $meta_key, maybe_unserialize( $meta_value ) );
                    }
                }
                
                // For publisher checklists, also copy the requirements
                $checklist_type = get_post_meta( $checklist_id, '_mcl_checklist_type', true );
                if ( $checklist_type === 'publisher' ) {
                    $requirements = MCL_DB_Manager::get_publisher_requirements( $checklist_id );
                    if ( ! empty( $requirements ) ) {
                        MCL_DB_Manager::save_publisher_requirements( $new_checklist_id, $requirements );
                    }
                }
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
    
        // Create a new checklist directly from the imported items
        $checklist_title = 'Imported Checklist ' . date('Y-m-d H:i:s');
        
        $checklist_post = array(
            'post_title'   => $checklist_title,
            'post_content' => '',
            'post_type'    => 'mcl_checklist',
            'post_status'  => 'publish'
        );

        $checklist_id = wp_insert_post($checklist_post);

        if (!is_wp_error($checklist_id)) {
            // Save the imported items
            update_post_meta($checklist_id, '_mcl_items', $prefilled_items);
            update_post_meta($checklist_id, '_mcl_active', '1');
            
            // Redirect back to import page with success message
            wp_redirect( admin_url( 'admin.php?page=mcl_import&imported=1&checklist_id=' . $checklist_id ) );
        } else {
            // Redirect back to import page with error message
            wp_redirect( admin_url( 'admin.php?page=mcl_import&error=1' ) );
        }
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
            // Display Options
            'show_title' => 1,
            'show_description' => 1,
            'show_deadline' => 0,
            'show_priority' => 0,
            'show_numbers' => 1,
            
            // Style Options Part 1: Colors
            'title_text_color' => '#000000',
            'description_text_color' => '#333333',
            'deadline_text_color' => '#ff0000',
            'list_item_text_color' => '#1a1a1a',
            'bg_color' => '#ffffff',
            'border_color' => '#e2e8f0',
            'checkbox_border_color' => '#cccccc',
            'checkbox_color_filled' => '#0ea5e9',
            'checkbox_color_unfilled' => '#ffffff',
            'checkmark_color' => '#ffffff',

            // Style Options Part 2: Spacing and Dimensions
            'checkbox_dimensions' => 20,
            'checkbox_border_radius' => 4,
            'checkbox_border_thickness' => 2,
            'border_type' => 'none',
            'border_radius' => 6,
            'border_thickness' => 1,
            'item_spacing' => 'comfortable',
            'padding_block' => 32,
            'padding_inline' => 32,
            'container_gap' => 10,
            'custom_width' => 800,

            // Style Options Part 3: Typography
            'title_font_size' => 18,
            'description_font_size' => 14,
            'list_item_font_size' => 16,
            'deadline_font_size' => 14,

            // Behavior Options
            'width' => 'full',
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
                'page' => 'mcl_import',
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



    public function get_checklists_data() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
            return;
        }

        // Get checklists
        $checklists = get_posts(array(
            'post_type' => 'mcl_checklist',
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'orderby' => 'title',
            'order' => 'ASC'
        ));

        $formatted_checklists = array();
        
        foreach ($checklists as $checklist) {
            $priority = get_post_meta($checklist->ID, '_mcl_priority', true) ?: 'none';
            $checklist_type = get_post_meta($checklist->ID, '_mcl_checklist_type', true) ?: 'classic';
            $items = get_post_meta($checklist->ID, '_mcl_items', true) ?: array();
            $tags = get_post_meta($checklist->ID, '_mcl_tags', true) ?: array();
            $active = get_post_meta($checklist->ID, '_mcl_active', true);
            $keyboard_shortcut = get_post_meta($checklist->ID, '_mcl_keyboard_shortcut', true);

            $formatted_checklists[] = array(
                'id' => $checklist->ID,
                'title' => $checklist->post_title,
                'type' => $checklist_type,
                'priority' => $priority,
                'description' => $checklist->post_content,
                'tags' => $tags,
                'status' => $active ? 'active' : 'inactive',
                'items_count' => count($items),
                'keyboard_shortcut' => $keyboard_shortcut ?: '',
                'created_date' => get_the_date('Y-m-d', $checklist->ID),
                'last_modified' => get_the_modified_date('Y-m-d', $checklist->ID)
            );
        }

        wp_send_json_success(array('data' => $formatted_checklists));
    }

    public function ajax_delete_checklist() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
            return;
        }

        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        
        if (!$checklist_id) {
            wp_send_json_error(array('message' => 'Invalid checklist ID'));
            return;
        }

        // Delete the checklist
        $result = wp_delete_post($checklist_id, true);
        
        if ($result) {
            wp_send_json_success(array('message' => 'Checklist deleted successfully'));
        } else {
            wp_send_json_error(array('message' => 'Failed to delete checklist'));
        }
    }

    public function ajax_clone_checklist() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
            return;
        }

        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        
        if (!$checklist_id) {
            wp_send_json_error(array('message' => 'Invalid checklist ID'));
            return;
        }

        // Get original checklist
        $original = get_post($checklist_id);
        if (!$original) {
            wp_send_json_error(array('message' => 'Checklist not found'));
            return;
        }

        // Create new checklist with cloned data
        $new_post = array(
            'post_title' => $original->post_title . ' (Copy)',
            'post_content' => $original->post_content,
            'post_type' => 'mcl_checklist',
            'post_status' => 'publish'
        );

        $new_checklist_id = wp_insert_post($new_post);
        
        if (is_wp_error($new_checklist_id)) {
            wp_send_json_error(array('message' => 'Failed to create checklist clone'));
            return;
        }

        // Copy all meta data
        $meta_keys = array(
            '_mcl_items', '_mcl_priority', '_mcl_checklist_type', '_mcl_tags',
            '_mcl_keyboard_shortcut', '_mcl_active', '_mcl_theme', '_mcl_trigger_shortcut',
            '_mcl_trigger_button', '_mcl_short_title', '_mcl_public_access',
            '_mcl_public_permission', '_mcl_public_description'
        );

        foreach ($meta_keys as $meta_key) {
            $meta_value = get_post_meta($checklist_id, $meta_key, true);
            if ($meta_value !== '') {
                update_post_meta($new_checklist_id, $meta_key, $meta_value);
            }
        }

        wp_send_json_success(array(
            'message' => 'Checklist cloned successfully',
            'new_id' => $new_checklist_id
        ));
    }

    public function save_theme_mode() {
        // Verify nonce
        if (!check_ajax_referer('mcl_save_theme_mode', '_ajax_nonce', false)) {
            wp_send_json_error(array(
                'message' => 'Security check failed',
                'debug' => array(
                    'action' => 'mcl_save_theme_mode',
                    'nonce_provided' => isset($_POST['_ajax_nonce']) ? 'yes' : 'no'
                )
            ), 403);
            return;
        }

        // Check if user is logged in
        if (!is_user_logged_in()) {
            wp_send_json_error(array(
                'message' => 'User not authenticated'
            ), 401);
            return;
        }
        
        // Validate and sanitize the mode
        $mode = isset($_POST['mode']) ? sanitize_text_field($_POST['mode']) : '';
        if (!in_array($mode, array('light', 'dark'), true)) {
            wp_send_json_error(array(
                'message' => 'Invalid theme mode',
                'debug' => array(
                    'provided_mode' => $mode,
                    'valid_modes' => array('light', 'dark')
                )
            ), 400);
            return;
        }
        
        // Get current user ID
        $user_id = get_current_user_id();
        if (!$user_id) {
            wp_send_json_error(array(
                'message' => 'Unable to get current user ID'
            ), 400);
            return;
        }
        
        // Update user meta
        $result = update_user_meta($user_id, 'mcl_theme', $mode);
        
        if ($result === false) {
            // Check if the value was already the same (update_user_meta returns false if no change)
            $current_value = get_user_meta($user_id, 'mcl_theme', true);
            if ($current_value === $mode) {
                // Value was already set, this is not an error
                wp_send_json_success(array(
                    'message' => 'Theme preference already set to ' . $mode,
                    'mode' => $mode
                ));
            } else {
                wp_send_json_error(array(
                    'message' => 'Failed to save theme preference',
                    'debug' => array(
                        'user_id' => $user_id,
                        'mode' => $mode,
                        'current_value' => $current_value
                    )
                ), 500);
            }
        } else {
            wp_send_json_success(array(
                'message' => 'Theme preference saved successfully',
                'mode' => $mode,
                'user_id' => $user_id
            ));
        }
    }

    public function get_checklist_for_edit() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
            return;
        }

        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        
        if (!$checklist_id) {
            wp_send_json_error(array('message' => 'Invalid checklist ID'));
            return;
        }

        // Get checklist data
        $checklist = get_post($checklist_id);
        if (!$checklist) {
            wp_send_json_error(array('message' => 'Checklist not found'));
            return;
        }

        // Helper function to get meta value with proper boolean conversion
        $get_meta_boolean = function($key, $default = false) use ($checklist_id) {
            $value = get_post_meta($checklist_id, $key, true);
            // Handle empty values and string '0' as false, '1' as true
            if ($value === '' || $value === null || $value === false) {
                return $default;
            }
            // Only return true for explicit true values
            return $value === '1' || $value === 1 || $value === true;
        };

        // Helper function to get regular meta value
        $get_meta = function($key, $default = '') use ($checklist_id) {
            $value = get_post_meta($checklist_id, $key, true);
            return $value !== '' ? $value : $default;
        };

        // Helper function to get array meta values
        $get_meta_array = function($key, $default = array()) use ($checklist_id) {
            $value = get_post_meta($checklist_id, $key, true);
            return is_array($value) ? $value : $default;
        };

        // Format time_date properly with WordPress timezone handling
        $time_date = $get_meta('_mcl_time_date', '');
        if (!empty($time_date) && is_numeric($time_date)) {
            try {
                // Get WordPress timezone
                $wp_timezone = wp_timezone();
                
                // Create DateTime from UTC timestamp and convert to WordPress timezone
                $datetime = new DateTime('@' . intval($time_date));
                $datetime->setTimezone($wp_timezone);
                
                // Format for datetime-local input
                $time_date = $datetime->format('Y-m-d\TH:i');
            } catch (Exception $e) {
                // Fallback to original behavior
                $time_date = date('Y-m-d\TH:i', intval($time_date));
            }
        } else {
            $time_date = '';
        }

        // Prepare response
        $response = array(
            'id' => $checklist->ID,
            'title' => $checklist->post_title,
            'description' => $checklist->post_content,
            'type' => $get_meta('_mcl_checklist_type', 'classic'),
            'priority' => $get_meta('_mcl_priority', 'none'),
            'items' => $get_meta_array('_mcl_items'),
            'tags' => $get_meta_array('_mcl_tags'),
            'active' => $get_meta_boolean('_mcl_active', false),
            'keyboard_shortcut' => $get_meta('_mcl_keyboard_shortcut', ''),
            'show_description' => $get_meta_boolean('_mcl_show_description', false),
            'checked_state_handling' => $get_meta('_mcl_checked_state_handling', 'global'),
            'theme' => $get_meta('_mcl_theme', 'light'),
            'trigger_shortcut' => $get_meta_boolean('_mcl_trigger_shortcut', false),
            'trigger_button' => $get_meta_boolean('_mcl_trigger_button', false),
            'short_title' => $get_meta('_mcl_short_title', ''),
            'button_position' => $get_meta('_mcl_button_position', 'bottom-right'),
            'public_access' => $get_meta_boolean('_mcl_public_access', false),
            'public_permission' => $get_meta('_mcl_public_permission', 'interact'),
            'public_checked_state_handling' => $get_meta('_mcl_public_checked_state_handling', 'per_user'),
            'public_description' => $get_meta('_mcl_public_description', ''),
            'priority_display_type' => $get_meta('_mcl_priority_display_type', 'color'),
            'enable_rate_limit' => $get_meta_boolean('_mcl_enable_rate_limit', false),
            'access_roles' => $get_meta_array('_mcl_access_roles'),
            'access_roles_permission' => $get_meta('_mcl_access_roles_permission', 'interact'),
            'access_users' => $get_meta_array('_mcl_access_users'),
            'access_users_permission' => $get_meta('_mcl_access_users_permission', 'interact'),
            'load_everywhere' => $get_meta_boolean('_mcl_load_everywhere', false), // Changed from true to false
            'allowed_pages' => $get_meta_array('_mcl_allowed_pages'),
            'allowed_urls' => $get_meta_array('_mcl_allowed_urls'),
            'disable_in_builders' => $get_meta_boolean('_mcl_disable_in_builders', false),
            'time_date' => $time_date,
            'enable_item_priority' => $get_meta_boolean('_mcl_enable_item_priority', false),
            'enable_item_locking' => $get_meta_boolean('_mcl_enable_item_locking', false),
            'auto_reset' => $get_meta_boolean('_mcl_auto_reset', false),
            'reset_interval' => $get_meta('_mcl_reset_interval', 'daily'),
            'week_day' => $get_meta('_mcl_week_day', '1'),
            'month_day' => $get_meta('_mcl_month_day', '1'),
            'custom_months' => $get_meta('_mcl_custom_months', '0'),
            'custom_weeks' => $get_meta('_mcl_custom_weeks', '0'),
            'custom_days' => $get_meta('_mcl_custom_days', '0'),
            'reset_time' => $get_meta('_mcl_reset_time', '00:00'),
            'enable_shortcode' => $get_meta_boolean('_mcl_enable_shortcode', false),
            // Shortcode settings
            'shortcode_settings' => self::get_shortcode_settings($checklist_id),
            // Custom theme settings
            'drawer_bg_color' => $get_meta('_mcl_drawer_bg_color', '#ffffff'),
            'list_item_bg_color' => $get_meta('_mcl_list_item_bg_color', '#f8f9fa'),
            'text_color' => $get_meta('_mcl_text_color', '#1a1a1a'),
            'description_text_color' => $get_meta('_mcl_description_text_color', '#1a1a1a'),
            'heading_font_size' => $get_meta('_mcl_heading_font_size', '24'),
            'description_font_size' => $get_meta('_mcl_description_font_size', '16'),
            'list_item_font_size' => $get_meta('_mcl_list_item_font_size', '16'),
            'primary_button_bg' => $get_meta('_mcl_primary_button_bg', '#f2da22'),
            'primary_button_text_color' => $get_meta('_mcl_primary_button_text_color', '#1a1a1a'),
            'secondary_button_bg' => $get_meta('_mcl_secondary_button_bg', '#f8f9fa'),
            'secondary_button_text_color' => $get_meta('_mcl_secondary_button_text_color', '#1a1a1a'),
            'checkbox_bg_color' => $get_meta('_mcl_checkbox_bg_color', '#ffffff'),
            'checkbox_border_radius' => $get_meta('_mcl_checkbox_border_radius', '4'),
            'checkbox_style' => $get_meta('_mcl_checkbox_style', 'standard'),
            'checkbox_custom_icon' => $get_meta('_mcl_checkbox_custom_icon', ''),
            'checkbox_checkmark_color' => $get_meta('_mcl_checkbox_checkmark_color', '#ffffff'),
            'drawer_border_radius' => $get_meta('_mcl_drawer_border_radius', '20'),
            'drawer_width' => $get_meta('_mcl_drawer_width', '600'),
            'drawer_height' => $get_meta('_mcl_drawer_height', '600'),
            'float_button_bg' => $get_meta('_mcl_float_button_bg', '#ffffff'),
            'float_button_text_color' => $get_meta('_mcl_float_button_text_color', '#1a1a1a'),
            'float_button_font_size' => $get_meta('_mcl_float_button_font_size', '16'),
            'show_float_button_icon' => $get_meta_boolean('_mcl_show_float_button_icon', false), // Changed from true to false
            // Icon settings
            'checklist_icon_type' => $get_meta('_mcl_checklist_icon_type', 'preset'),
            'checklist_icon_preset' => $get_meta('_mcl_checklist_icon_preset', 'checklist-1'),
            'checklist_icon_custom' => $get_meta('_mcl_checklist_icon_custom', ''),
        );

        // Get notification settings from the notification manager
        $notification_manager = MCL_Notification_Manager::get_instance();
        $notification_settings = $notification_manager->get_notification_settings($checklist_id);
        
        if ($notification_settings) {
            $response['notifications_enabled'] = (bool) $notification_settings->notifications_enabled;
            $response['email_enabled'] = (bool) $notification_settings->email_enabled;
            $response['integration_enabled'] = (bool) $notification_settings->integration_enabled;
            $response['email_recipients'] = $notification_settings->email_recipients;
            $response['slack_webhook_url'] = $notification_settings->slack_webhook_url;
            $response['discord_webhook_url'] = $notification_settings->discord_webhook_url;
            $response['notify_on_new_item'] = (bool) $notification_settings->notify_on_new_item;
            $response['notify_on_delete_item'] = (bool) $notification_settings->notify_on_delete_item;
            $response['notify_on_check_item'] = (bool) $notification_settings->notify_on_check_item;
            $response['notify_on_uncheck_item'] = (bool) $notification_settings->notify_on_uncheck_item;
            $response['notify_on_deadline'] = (bool) $notification_settings->notify_on_deadline;
            $response['notify_on_comments'] = (bool) ($notification_settings->notify_on_comments ?? false);
            $response['deadline_threshold_hours'] = $notification_settings->deadline_threshold_hours;
            $response['batch_interval'] = $notification_settings->batch_interval;
        } else {
            // Set default notification values when no settings exist
            $response['notifications_enabled'] = false;
            $response['email_enabled'] = false;
            $response['integration_enabled'] = false;
            $response['email_recipients'] = '';
            $response['slack_webhook_url'] = '';
            $response['discord_webhook_url'] = '';
            $response['notify_on_new_item'] = false;
            $response['notify_on_delete_item'] = false;
            $response['notify_on_check_item'] = false;
            $response['notify_on_uncheck_item'] = false;
            $response['notify_on_deadline'] = false;
            $response['notify_on_comments'] = false;
            $response['deadline_threshold_hours'] = '24';
            $response['batch_interval'] = 'fifteen_minutes';
        }

        // Add publisher checklist specific data
        if ($response['type'] === 'publisher') {
            $response['post_types'] = $get_meta_array('_mcl_publisher_post_types');
            $response['show_tips'] = $get_meta_boolean('_mcl_show_tips', false);
            $response['requirements'] = MCL_DB_Manager::get_publisher_requirements($checklist_id);
        }

        wp_send_json_success($response);
    }

    public function get_users() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
            return;
        }

        // Get users
        $users = get_users(array(
            'orderby' => 'display_name',
            'order' => 'ASC'
        ));

        $formatted_users = array();
        foreach ($users as $user) {
            $formatted_users[] = array(
                'ID' => $user->ID,
                'display_name' => $user->display_name
            );
        }

        wp_send_json_success($formatted_users);
    }

    public function get_roles() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
            return;
        }

        // Get roles
        $roles = get_editable_roles();

        $formatted_roles = array();
        foreach ($roles as $role_name => $role_info) {
            $formatted_roles[] = array(
                'value' => $role_name,
                'name' => $role_info['name']
            );
        }

        wp_send_json_success($formatted_roles);
    }

    public function get_admin_pages() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
            return;
        }

        try {
            // Get admin pages
            $admin_pages = $this->get_registered_admin_pages();
            
            if (empty($admin_pages)) {
                // If we still have no pages, log this issue
                error_log('MagicChecklists: get_registered_admin_pages() returned empty array');
                // Return a minimal set as fallback
                $admin_pages = array(
                    'dashboard' => 'Dashboard',
                    'posts' => 'Posts',
                    'media' => 'Media',
                    'pages' => 'Pages',
                    'comments' => 'Comments',
                    'mcl_checklists' => 'Magic Checklists'
                );
            }
            
            $formatted_pages = array();
            foreach ($admin_pages as $slug => $title) {
                $formatted_pages[] = array(
                    'slug' => $slug,
                    'title' => $title
                );
            }

            wp_send_json_success($formatted_pages);
        } catch (Exception $e) {
            error_log('MagicChecklists admin pages error: ' . $e->getMessage());
            wp_send_json_error(array(
                'message' => 'Error retrieving admin pages',
                'debug' => WP_DEBUG ? $e->getMessage() : null
            ));
        }
    }

    public function get_license_status() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
            return;
        }

        try {
            $licensing_client = $this->get_licensing_client();
            
            if (!$licensing_client) {
                wp_send_json_error(array('message' => 'Licensing client not available'));
                return;
            }

            $activation = $licensing_client->settings()->get_activation();
            $license_key = $licensing_client->settings()->license_key;
            
            $status = array(
                'isActive' => !empty($activation->id),
                'activationId' => $activation->id ?? null,
                'licenseKey' => $this->mask_license_key($license_key),
                'siteName' => get_bloginfo('name'),
                'siteUrl' => get_site_url(),
                'productName' => $licensing_client->name
            );
            
            if (!empty($activation->id) && !empty($activation->created_at)) {
                // Use the shared date formatting system
                $timestamp = is_numeric($activation->created_at) ? $activation->created_at : strtotime($activation->created_at);
                $status['activatedAt'] = MCL_Admin::format_date($timestamp, true);
                $status['activatedAtRaw'] = $activation->created_at; // Keep raw value for debugging
            }

            wp_send_json_success($status);
        } catch (Exception $e) {
            error_log('MagicChecklists license status error: ' . $e->getMessage());
            wp_send_json_error(array(
                'message' => 'Error retrieving license status',
                'debug' => WP_DEBUG ? $e->getMessage() : null
            ));
        }
    }

    // Apply custom submenu ordering after all plugins have added their items
    public function apply_submenu_ordering() {
        global $submenu;
        
        if (!isset($submenu['magic_plugins']) || !is_array($submenu['magic_plugins'])) {
            return;
        }
        
        // Get saved submenu order
        $settings = $this->get_shared_settings();
        $submenu_order = $settings['submenu_order'];
        
        if (empty($submenu_order)) {
            return; // No custom order set
        }
        
        // Store original submenu items (excluding landing page)
        $original_items = array();
        $landing_item = null;
        
        foreach ($submenu['magic_plugins'] as $item) {
            if (isset($item[2])) {
                if ($item[2] === 'magic_plugins_landing') {
                    $landing_item = $item; // Save landing page for last
                } else {
                    $original_items[$item[2]] = $item;
                }
            }
        }
        
        // Rebuild submenu in custom order
        $new_submenu = array();
        
        // Add items in custom order
        foreach ($submenu_order as $slug) {
            if (isset($original_items[$slug])) {
                $new_submenu[] = $original_items[$slug];
                unset($original_items[$slug]);
            }
        }
        
        // Add any remaining items that weren't in the custom order
        foreach ($original_items as $item) {
            $new_submenu[] = $item;
        }
        
        // Add landing page at the end
        if ($landing_item) {
            $new_submenu[] = $landing_item;
        }
        
        // Replace the submenu
        $submenu['magic_plugins'] = $new_submenu;
    }

    // Utility method to get shared date format setting
    public static function get_shared_date_format() {
        $settings = get_option('magic_plugins_settings', array());
        
        // Use shared settings only (no more individual fallbacks)
        return isset($settings['date_format']) ? $settings['date_format'] : 'us';
    }

    // Utility method to format date according to shared setting
    public static function format_date($timestamp, $include_time = true) {
        $format = self::get_shared_date_format();
        
        $formats = array(
            'us' => $include_time ? 'm/d/Y g:i A' : 'm/d/Y',
            'eu' => $include_time ? 'd/m/Y H:i' : 'd/m/Y', 
            'iso' => $include_time ? 'Y-m-d H:i' : 'Y-m-d',
            'compact' => $include_time ? 'd M Y H:i' : 'd M Y',
            'long' => $include_time ? 'F j, Y g:i A' : 'F j, Y'
        );
        
        $date_format = isset($formats[$format]) ? $formats[$format] : $formats['us'];
        return date($date_format, $timestamp);
    }

    /**
     * Migrate individual plugin settings to shared settings (one-time migration)
     */
    public function migrate_individual_settings_to_shared() {
        // Check if migration has already been done
        $migration_done = get_option('mcl_settings_migrated_to_shared', false);
        if ($migration_done) {
            return;
        }

        // Get existing individual settings
        $individual_settings = get_option('mcl_settings', array());
        $shared_settings = get_option('magic_plugins_settings', array());
        
        $needs_update = false;

        // Migrate menu position settings if they exist in individual settings
        if (isset($individual_settings['menu_position_type']) && !isset($shared_settings['menu_position_type'])) {
            $shared_settings['menu_position_type'] = $individual_settings['menu_position_type'];
            $needs_update = true;
        }
        
        if (isset($individual_settings['menu_position_relative_to']) && !isset($shared_settings['menu_position_relative_to'])) {
            $shared_settings['menu_position_relative_to'] = $individual_settings['menu_position_relative_to'];
            $needs_update = true;
        }
        
        if (isset($individual_settings['menu_position']) && !isset($shared_settings['menu_position'])) {
            $shared_settings['menu_position'] = $individual_settings['menu_position'];
            $needs_update = true;
        }
        
        if (isset($individual_settings['custom_position']) && !isset($shared_settings['custom_position'])) {
            $shared_settings['custom_position'] = $individual_settings['custom_position'];
            $needs_update = true;
        }

        // Migrate date format settings if they exist in individual settings
        if (isset($individual_settings['date_format']) && !isset($shared_settings['date_format'])) {
            $shared_settings['date_format'] = $individual_settings['date_format'];
            $needs_update = true;
        }

        // Update shared settings if any migration was needed
        if ($needs_update) {
            update_option('magic_plugins_settings', $shared_settings);
        }

        // Remove migrated settings from individual settings
        if (isset($individual_settings['menu_position_type']) || 
            isset($individual_settings['menu_position_relative_to']) || 
            isset($individual_settings['menu_position']) || 
            isset($individual_settings['custom_position']) || 
            isset($individual_settings['date_format'])) {
            
            unset($individual_settings['menu_position_type']);
            unset($individual_settings['menu_position_relative_to']);
            unset($individual_settings['menu_position']);
            unset($individual_settings['custom_position']);
            unset($individual_settings['date_format']);
            
            update_option('mcl_settings', $individual_settings);
        }

        // Mark migration as complete
        update_option('mcl_settings_migrated_to_shared', true);
    }

    public function handle_license_activation() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
            return;
        }

        $license_key = isset($_POST['license_key']) ? sanitize_text_field($_POST['license_key']) : '';
        
        if (empty($license_key)) {
            wp_send_json_error(array('message' => 'License key is required'));
            return;
        }

        try {
            $licensing_client = $this->get_licensing_client();
            
            if (!$licensing_client) {
                wp_send_json_error(array('message' => 'Licensing client not available'));
                return;
            }

            // Activate the license
            $activation = $licensing_client->license()->activate($license_key);
            
            if ($activation === true) {
                // Get the activation details after successful activation
                $activation_data = $licensing_client->settings()->get_activation();
                
                // Format activation date using shared date formatting
                $activated_at_raw = $activation_data->created_at ?? current_time('mysql');
                $timestamp = is_numeric($activated_at_raw) ? $activated_at_raw : strtotime($activated_at_raw);
                $activated_at_formatted = MCL_Admin::format_date($timestamp, true);

                wp_send_json_success(array(
                    'message' => 'License activated successfully',
                    'data' => array(
                        'isActive' => true,
                        'activationId' => $licensing_client->settings()->activation_id,
                        'licenseKey' => $this->mask_license_key($licensing_client->settings()->license_key),
                        'activatedAt' => $activated_at_formatted,
                        'activatedAtRaw' => $activated_at_raw
                    )
                ));
            } else {
                // Handle WP_Error or other error responses
                $error_message = 'Failed to activate license';
                
                if (is_wp_error($activation)) {
                    // Extract the first error message from WP_Error
                    $error_messages = $activation->get_error_messages();
                    if (!empty($error_messages)) {
                        $error_message = $error_messages[0];
                    }
                }
                
                wp_send_json_error(array('message' => $error_message));
            }
        } catch (Exception $e) {
            error_log('MagicChecklists license activation error: ' . $e->getMessage());
            wp_send_json_error(array(
                'message' => 'Error activating license: ' . $e->getMessage()
            ));
        }
    }

    public function handle_license_deactivation() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
            return;
        }

        try {
            $licensing_client = $this->get_licensing_client();
            
            if (!$licensing_client) {
                wp_send_json_error(array('message' => 'Licensing client not available'));
                return;
            }

            // Deactivate the license
            $result = $licensing_client->license()->deactivate($licensing_client->settings()->activation_id);
            
            if ($result === true) {
                // License key and activation ID are automatically cleared by the SureCart client
                wp_send_json_success(array(
                    'message' => 'License deactivated successfully'
                ));
            } else {
                // Handle WP_Error or other error responses
                $error_message = 'Failed to deactivate license';
                
                if (is_wp_error($result)) {
                    // Extract the first error message from WP_Error
                    $error_messages = $result->get_error_messages();
                    if (!empty($error_messages)) {
                        $error_message = $error_messages[0];
                    }
                }
                
                wp_send_json_error(array('message' => $error_message));
            }
        } catch (Exception $e) {
            error_log('MagicChecklists license deactivation error: ' . $e->getMessage());
            wp_send_json_error(array(
                'message' => 'Error deactivating license: ' . $e->getMessage()
            ));
        }
    }

    /**
     * Get licensing client instance
     */
    private function get_licensing_client() {
        // First try to get from global
        global $mcl_licensing_client;
        if ($mcl_licensing_client) {
            return $mcl_licensing_client;
        }
        
        // If not available globally, try to create it
        if (class_exists('\SureCart\Licensing\Client')) {
            try {
                $mcl_licensing_client = new \SureCart\Licensing\Client('MagicChecklists', 'pt_cBheuHynZ9Ft9mhGLuoWM1LA', MAGIC_CHECKLISTS_PLUGIN_FILE);
                $mcl_licensing_client->set_textdomain(MAGIC_CHECKLISTS_TEXT_DOMAIN);
                return $mcl_licensing_client;
            } catch (Exception $e) {
                error_log('MagicChecklists: Failed to create licensing client: ' . $e->getMessage());
                return null;
            }
        }
        
        return null;
    }

    /**
     * Mask a license key for display
     */
    private function mask_license_key($license_key) {
        if (empty($license_key)) {
            return '';
        }
        
        $length = strlen($license_key);
        if ($length <= 10) {
            return str_repeat('X', $length);
        }
        
        return substr($license_key, 0, 5) . str_repeat('X', $length - 10) . substr($license_key, -5);
    }

    /**
     * Get Kanban board data for a checklist
     */
    public function get_kanban_board() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        
        if (!$checklist_id) {
            wp_send_json_error('Invalid checklist ID');
        }

        global $wpdb;
        
        // Get checklist items
        $checklist = get_post($checklist_id);
        if (!$checklist || $checklist->post_type !== 'mcl_checklist') {
            wp_send_json_error('Checklist not found');
        }

        // Get items with steps
        $items_data = get_post_meta($checklist_id, '_mcl_items', true);
        if (!is_array($items_data)) {
            $items_data = array();
        }

        // Get Kanban columns for this checklist (or create defaults)
        $columns_table = $wpdb->prefix . 'mcl_kanban_columns';
        $columns = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $columns_table WHERE checklist_id = %d ORDER BY position ASC",
            $checklist_id
        ));

        // If no columns exist, create default columns based on steps
        if (empty($columns)) {
            $steps = get_post_meta($checklist_id, '_mcl_steps', true);
            if (!is_array($steps) || empty($steps)) {
                // Create default columns if no steps defined
                $default_columns = array(
                    array('column_id' => 'backlog', 'title' => 'Backlog', 'color' => '#6B7280'),
                    array('column_id' => 'todo', 'title' => 'To Do', 'color' => '#3B82F6'),
                    array('column_id' => 'in_progress', 'title' => 'In Progress', 'color' => '#F59E0B'),
                    array('column_id' => 'review', 'title' => 'Review', 'color' => '#8B5CF6'),
                    array('column_id' => 'done', 'title' => 'Done', 'color' => '#10B981')
                );
            } else {
                // Create columns from steps
                $default_columns = array();
                $colors = array('#3B82F6', '#F59E0B', '#8B5CF6', '#10B981', '#EF4444', '#EC4899', '#6B7280');
                $color_index = 0;
                
                foreach ($steps as $step_index => $step) {
                    $default_columns[] = array(
                        'column_id' => 'step_' . $step_index,
                        'title' => $step,
                        'color' => $colors[$color_index % count($colors)]
                    );
                    $color_index++;
                }
            }

            // Insert default columns
            foreach ($default_columns as $index => $column) {
                $wpdb->insert(
                    $columns_table,
                    array(
                        'checklist_id' => $checklist_id,
                        'column_id' => $column['column_id'],
                        'title' => $column['title'],
                        'color' => $column['color'],
                        'position' => $index
                    ),
                    array('%d', '%s', '%s', '%s', '%d')
                );
            }

            // Re-fetch columns
            $columns = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $columns_table WHERE checklist_id = %d ORDER BY position ASC",
                $checklist_id
            ));
        }

        // Get Kanban state for all items
        $state_table = $wpdb->prefix . 'mcl_kanban_state';
        $kanban_state_results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $state_table WHERE checklist_id = %d",
            $checklist_id
        ));
        
        // Index by item_id for easy lookup
        $kanban_state = array();
        foreach ($kanban_state_results as $state) {
            $kanban_state[$state->item_id] = $state;
        }

        // Get all comments for this checklist in one query
        $comments_table = $wpdb->prefix . 'mcl_task_comments';
        $comments_results = $wpdb->get_results($wpdb->prepare(
            "SELECT item_id, comment_content FROM $comments_table 
             WHERE checklist_id = %d 
             ORDER BY item_id, created_at DESC",
            $checklist_id
        ));

        // Get comment counts per item
        $comment_counts = $wpdb->get_results($wpdb->prepare(
            "SELECT item_id, COUNT(*) as comment_count FROM $comments_table 
             WHERE checklist_id = %d 
             GROUP BY item_id",
            $checklist_id
        ));

        // Index comments by item_id (taking the latest comment for each item)
        $item_comments = array();
        foreach ($comments_results as $comment) {
            if (!isset($item_comments[$comment->item_id])) {
                $item_comments[$comment->item_id] = $comment->comment_content;
            }
        }

        // Index comment counts by item_id - handle both string and numeric IDs
        $item_comment_counts = array();
        foreach ($comment_counts as $count) {
            // Store count for both numeric ID and potential string ID formats
            $item_comment_counts[$count->item_id] = $count->comment_count;
            $item_comment_counts["item_{$count->item_id}_1"] = $count->comment_count;
            $item_comment_counts["item_{$count->item_id}"] = $count->comment_count;
        }
        
        // Get checked state - implement the logic directly since the method is private
        $checked_state_handling = get_post_meta($checklist_id, '_mcl_checked_state_handling', true) ?: 'global';
        
        if ($checked_state_handling === 'per_user') {
            if (is_user_logged_in()) {
                $user_id = get_current_user_id();
                $checked_state = get_user_meta($user_id, "_mcl_kanban_checked_state_" . $checklist_id, true) ?: array();
            } else {
                // Per-user checklists with logged-out users should use localStorage on client side
                $checked_state = array();
            }
        } else {
            // Global handling mode
            $checked_state = get_post_meta($checklist_id, '_mcl_checked_state', true) ?: array();
        }

        // Process items and assign to columns
        $board_data = array();
        foreach ($columns as $column) {
            $board_data[$column->column_id] = array(
                'id' => $column->column_id,
                'title' => $column->title,
                'color' => $column->color,
                'position' => $column->position,
                'items' => array()
            );
        }

        // Add items to their respective columns
        foreach ($items_data as $item_index => $item) {
            $item_id = isset($item['id']) ? $item['id'] : $item_index;
            
            // Check if item has Kanban state
            $state = isset($kanban_state[$item_id]) ? $kanban_state[$item_id] : null;
            
            if ($state) {
                $column_id = $state->column_id;
                $assigned_user = $state->assigned_user_id;
                $due_date = $state->due_date;
                $position = $state->position;
            } else {
                // Default to first column for new items (if columns exist)
                if (!empty($columns)) {
                    $column_id = $columns[0]->column_id;
                } else {
                    // Skip this item if no columns exist yet
                    continue;
                }
                $assigned_user = null;
                $due_date = null;
                $position = 999;
                
                // Insert default state (use INSERT IGNORE to avoid duplicates)
                $wpdb->query($wpdb->prepare(
                    "INSERT IGNORE INTO $state_table (checklist_id, item_id, column_id, position) VALUES (%d, %d, %s, %d)",
                    $checklist_id, $item_id, $column_id, $position
                ));
            }

            // Get user info if assigned
            $user_info = null;
            if ($assigned_user) {
                $user = get_user_by('id', $assigned_user);
                if ($user) {
                    $user_info = array(
                        'id' => $user->ID,
                        'name' => $user->display_name,
                        'avatar' => get_avatar_url($user->ID, array('size' => 32))
                    );
                }
            }

            // Add to board
            if (isset($board_data[$column_id])) {
                $board_data[$column_id]['items'][] = array(
                    'id' => $item_id,
                    'title' => isset($item['content']) ? $item['content'] : '',
                    'description' => '', // Items don't have separate descriptions
                    'comment' => isset($item_comments[$item_id]) ? $item_comments[$item_id] : '', // Add comment field
                    'comment_count' => isset($item_comment_counts[$item_id]) ? intval($item_comment_counts[$item_id]) : 0,
                    'checked' => in_array((string)$item_id, $checked_state) || in_array($item_id, $checked_state),
                    'priority' => isset($item['priority']) ? $item['priority'] : 'normal',
                    'tags' => isset($item['tags']) ? $item['tags'] : array(),
                    'assigned_user' => $user_info,
                    'due_date' => $due_date,
                    'position' => $position,
                    'step' => isset($item['step']) ? $item['step'] : null
                );
            }
        }

        // Sort items within each column by position
        foreach ($board_data as &$column) {
            usort($column['items'], function($a, $b) {
                return $a['position'] - $b['position'];
            });
        }

        // Get all users for assignment dropdown
        $users = get_users(array('fields' => array('ID', 'display_name', 'user_email')));
        $users_data = array();
        foreach ($users as $user) {
            $users_data[] = array(
                'id' => $user->ID,
                'name' => $user->display_name,
                'email' => $user->user_email,
                'avatar' => get_avatar_url($user->ID, array('size' => 32))
            );
        }

        wp_send_json_success(array(
            'board' => array_values($board_data),
            'users' => $users_data,
            'checklist' => array(
                'id' => $checklist_id,
                'title' => $checklist->post_title
            )
        ));
    }

    /**
     * Update Kanban item position and column
     */
    public function update_kanban_item() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $item_id = isset($_POST['item_id']) ? intval($_POST['item_id']) : 0;
        $column_id = isset($_POST['column_id']) ? sanitize_text_field($_POST['column_id']) : '';
        $position = isset($_POST['position']) ? intval($_POST['position']) : 0;

        if (!$checklist_id || $item_id === false || !$column_id) {
            wp_send_json_error('Invalid parameters');
        }

        global $wpdb;
        $state_table = $wpdb->prefix . 'mcl_kanban_state';

        // Update or insert the Kanban state
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $state_table WHERE checklist_id = %d AND item_id = %d",
            $checklist_id, $item_id
        ));

        if ($existing) {
            $result = $wpdb->update(
                $state_table,
                array(
                    'column_id' => $column_id,
                    'position' => $position
                ),
                array(
                    'checklist_id' => $checklist_id,
                    'item_id' => $item_id
                ),
                array('%s', '%d'),
                array('%d', '%d')
            );
        } else {
            $result = $wpdb->insert(
                $state_table,
                array(
                    'checklist_id' => $checklist_id,
                    'item_id' => $item_id,
                    'column_id' => $column_id,
                    'position' => $position
                ),
                array('%d', '%d', '%s', '%d')
            );
        }

        if ($result === false) {
            wp_send_json_error('Failed to update item position');
        }

        wp_send_json_success(array('message' => 'Item position updated'));
    }

    /**
     * Update Kanban columns configuration
     */
    public function update_kanban_columns() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $columns = isset($_POST['columns']) ? json_decode(stripslashes($_POST['columns']), true) : array();

        if (!$checklist_id || !is_array($columns)) {
            wp_send_json_error('Invalid parameters');
        }

        global $wpdb;
        $columns_table = $wpdb->prefix . 'mcl_kanban_columns';

        // Delete existing columns
        $wpdb->delete($columns_table, array('checklist_id' => $checklist_id), array('%d'));

        // Insert new columns
        foreach ($columns as $index => $column) {
            $wpdb->insert(
                $columns_table,
                array(
                    'checklist_id' => $checklist_id,
                    'column_id' => sanitize_text_field($column['id']),
                    'title' => sanitize_text_field($column['title']),
                    'color' => sanitize_hex_color($column['color']),
                    'position' => $index
                ),
                array('%d', '%s', '%s', '%s', '%d')
            );
        }

        wp_send_json_success(array('message' => 'Columns updated successfully'));
    }

    /**
     * Assign user to Kanban item
     */
    public function assign_kanban_user() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $item_id = isset($_POST['item_id']) ? intval($_POST['item_id']) : 0;
        $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : null;

        if (!$checklist_id || $item_id === false) {
            wp_send_json_error('Invalid parameters');
        }

        global $wpdb;
        $state_table = $wpdb->prefix . 'mcl_kanban_state';

        // Update assigned user
        $result = $wpdb->update(
            $state_table,
            array('assigned_user_id' => $user_id),
            array(
                'checklist_id' => $checklist_id,
                'item_id' => $item_id
            ),
            array('%d'),
            array('%d', '%d')
        );

        if ($result === false) {
            wp_send_json_error('Failed to assign user');
        }

        // Get user info
        $user_info = null;
        if ($user_id) {
            $user = get_user_by('id', $user_id);
            if ($user) {
                $user_info = array(
                    'id' => $user->ID,
                    'name' => $user->display_name,
                    'avatar' => get_avatar_url($user->ID, array('size' => 32))
                );
            }
        }

        wp_send_json_success(array(
            'message' => 'User assigned successfully',
            'user' => $user_info
        ));
    }

    /**
     * Set due date for Kanban item
     */
    public function set_kanban_due_date() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $item_id = isset($_POST['item_id']) ? intval($_POST['item_id']) : 0;
        $due_date = isset($_POST['due_date']) ? sanitize_text_field($_POST['due_date']) : null;

        if (!$checklist_id || $item_id === false) {
            wp_send_json_error('Invalid parameters');
        }

        // Validate date format if provided
        if ($due_date && !strtotime($due_date)) {
            wp_send_json_error('Invalid date format');
        }

        global $wpdb;
        $state_table = $wpdb->prefix . 'mcl_kanban_state';

        // Update due date
        $result = $wpdb->update(
            $state_table,
            array('due_date' => $due_date),
            array(
                'checklist_id' => $checklist_id,
                'item_id' => $item_id
            ),
            array('%s'),
            array('%d', '%d')
        );

        if ($result === false) {
            wp_send_json_error('Failed to set due date');
        }

        wp_send_json_success(array(
            'message' => 'Due date set successfully',
            'due_date' => $due_date
        ));
    }

    /**
     * Update task content
     */
    public function update_task_content() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $item_id = isset($_POST['item_id']) ? intval($_POST['item_id']) : 0;
        $content = isset($_POST['content']) ? wp_kses_post($_POST['content']) : '';

        if (!$checklist_id || !$item_id) {
            wp_send_json_error('Invalid parameters');
        }

        // Get the checklist items
        $items = get_post_meta($checklist_id, '_mcl_items', true);
        if (!is_array($items)) {
            $items = array();
        }

        // Update the specific item content
        $updated = false;
        foreach ($items as &$item) {
            if ($item['id'] == $item_id) {
                $item['content'] = $content;
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            wp_send_json_error('Item not found');
        }

        // Save the updated items
        $result = update_post_meta($checklist_id, '_mcl_items', $items);

        if ($result === false) {
            wp_send_json_error('Failed to update content');
        }

        wp_send_json_success(array(
            'message' => 'Content updated successfully',
            'content' => $content
        ));
    }

    /**
     * Get task comments
     */
    public function get_task_comments() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $item_id = isset($_POST['item_id']) ? intval($_POST['item_id']) : 0;

        if (!$checklist_id || !$item_id) {
            wp_send_json_error('Invalid parameters');
        }

        global $wpdb;
        $comments_table = $wpdb->prefix . 'mcl_task_comments';

        $comments = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $comments_table 
             WHERE checklist_id = %d AND item_id = %d 
             ORDER BY created_at ASC",
            $checklist_id,
            $item_id
        ));

        wp_send_json_success(array(
            'comments' => $comments
        ));
    }

    /**
     * Add task comment
     */
    public function add_task_comment() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $item_id = isset($_POST['item_id']) ? intval($_POST['item_id']) : 0;
        $comment_content = isset($_POST['comment_content']) ? wp_kses_post($_POST['comment_content']) : '';

        if (!$checklist_id || !$item_id || empty($comment_content)) {
            wp_send_json_error('Invalid parameters');
        }

        $current_user = wp_get_current_user();
        
        global $wpdb;
        $comments_table = $wpdb->prefix . 'mcl_task_comments';

        $result = $wpdb->insert(
            $comments_table,
            array(
                'checklist_id' => $checklist_id,
                'item_id' => $item_id,
                'user_id' => $current_user->ID,
                'user_name' => $current_user->display_name,
                'user_email' => $current_user->user_email,
                'comment_content' => $comment_content,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql')
            ),
            array('%d', '%d', '%d', '%s', '%s', '%s', '%s', '%s')
        );

        if ($result === false) {
            wp_send_json_error('Failed to add comment');
        }

        $comment_id = $wpdb->insert_id;
        $new_comment = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $comments_table WHERE id = %d",
            $comment_id
        ));

        wp_send_json_success(array(
            'message' => 'Comment added successfully',
            'comment' => $new_comment
        ));
    }

    /**
     * Update task comment
     */
    public function update_task_comment() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $comment_id = isset($_POST['comment_id']) ? intval($_POST['comment_id']) : 0;
        $comment_content = isset($_POST['comment_content']) ? wp_kses_post($_POST['comment_content']) : '';

        if (!$comment_id || empty($comment_content)) {
            wp_send_json_error('Invalid parameters');
        }

        global $wpdb;
        $comments_table = $wpdb->prefix . 'mcl_task_comments';

        $result = $wpdb->update(
            $comments_table,
            array(
                'comment_content' => $comment_content,
                'updated_at' => current_time('mysql')
            ),
            array('id' => $comment_id),
            array('%s', '%s'),
            array('%d')
        );

        if ($result === false) {
            wp_send_json_error('Failed to update comment');
        }

        wp_send_json_success(array(
            'message' => 'Comment updated successfully'
        ));
    }

    /**
     * Delete task comment
     */
    public function delete_task_comment() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $comment_id = isset($_POST['comment_id']) ? intval($_POST['comment_id']) : 0;

        if (!$comment_id) {
            wp_send_json_error('Invalid parameters');
        }

        global $wpdb;
        $comments_table = $wpdb->prefix . 'mcl_task_comments';

        $result = $wpdb->delete(
            $comments_table,
            array('id' => $comment_id),
            array('%d')
        );

        if ($result === false) {
            wp_send_json_error('Failed to delete comment');
        }

        wp_send_json_success(array(
            'message' => 'Comment deleted successfully'
        ));
    }

    /**
     * Save task comment - simplified version for KanbanBoard 
     * This creates or updates a comment for a task
     */
    public function save_task_comment() {
        // Verify nonce
        if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Invalid security token'));
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $item_id = isset($_POST['item_id']) ? sanitize_text_field($_POST['item_id']) : '';
        $comment_content = isset($_POST['comment_content']) ? wp_kses_post($_POST['comment_content']) : '';
        $user_name = isset($_POST['user_name']) ? sanitize_text_field($_POST['user_name']) : '';
        $user_email = isset($_POST['user_email']) ? sanitize_email($_POST['user_email']) : '';

        if (!$checklist_id || empty($item_id)) {
            wp_send_json_error('Invalid parameters');
        }

        $current_user = wp_get_current_user();
        $user_id = $current_user->ID ?: null;
        
        // Use provided user info if available, otherwise use current user
        if (empty($user_name)) {
            $user_name = $current_user->display_name;
        }
        if (empty($user_email)) {
            $user_email = $current_user->user_email;
        }

        global $wpdb;
        $comments_table = $wpdb->prefix . 'mcl_task_comments';

        // Check if a comment already exists for this item (for update)
        $existing_comment = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM $comments_table 
             WHERE checklist_id = %d AND item_id = %s",
            $checklist_id,
            $item_id
        ));

        if (empty($comment_content)) {
            // If comment is empty, delete existing comment if any
            if ($existing_comment) {
                $result = $wpdb->delete(
                    $comments_table,
                    array('id' => $existing_comment->id),
                    array('%d')
                );
            } else {
                // No existing comment and empty content - nothing to do
                $result = true;
            }
        } else {
            // Save/update comment
            if ($existing_comment) {
                // Update existing comment
                $result = $wpdb->update(
                    $comments_table,
                    array(
                        'comment_content' => $comment_content,
                        'user_name' => $user_name,
                        'user_email' => $user_email,
                        'updated_at' => current_time('mysql')
                    ),
                    array(
                        'id' => $existing_comment->id
                    ),
                    array('%s', '%s', '%s', '%s'),
                    array('%d')
                );
            } else {
                // Insert new comment
                $result = $wpdb->insert(
                    $comments_table,
                    array(
                        'checklist_id' => $checklist_id,
                        'item_id' => $item_id,
                        'user_id' => $user_id,
                        'user_name' => $user_name,
                        'user_email' => $user_email,
                        'comment_content' => $comment_content,
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql')
                    ),
                    array('%d', '%s', '%d', '%s', '%s', '%s', '%s', '%s')
                );
            }
        }

        if ($result === false) {
            wp_send_json_error('Failed to save comment');
        }

        wp_send_json_success(array(
            'message' => 'Comment saved successfully',
            'comment_id' => $existing_comment ? $existing_comment->id : $wpdb->insert_id
        ));
    }

    /**
     * Get threaded comments for a task with like information
     */
    public function get_threaded_comments() {
        try {
            // Verify nonce
            if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
                wp_send_json_error(array('message' => 'Invalid security token'));
                return;
            }

            if (!current_user_can('manage_options')) {
                wp_send_json_error('Insufficient permissions');
            }

            $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
            $item_id = isset($_POST['item_id']) ? intval($_POST['item_id']) : 0;

            if (!$checklist_id || !$item_id) {
                wp_send_json_error('Invalid parameters');
            }

            global $wpdb;
            $comments_table = $wpdb->prefix . 'mcl_task_comments';
            $likes_table = $wpdb->prefix . 'mcl_comment_likes';

            // Check if tables exist
            if ($wpdb->get_var("SHOW TABLES LIKE '$comments_table'") != $comments_table ||
                $wpdb->get_var("SHOW TABLES LIKE '$likes_table'") != $likes_table) {
                // Try to create tables
                MCL_DB_Manager::get_instance()->install();
            }
        
            $current_user = wp_get_current_user();
            $current_user_email = $current_user->user_email;

            // First get all comments
            $comments = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $comments_table 
                 WHERE checklist_id = %d AND item_id = %d 
                 ORDER BY parent_id IS NULL DESC, created_at ASC",
                $checklist_id,
                $item_id
            ));

            // Then get like information for each comment
            foreach ($comments as &$comment) {
                // Get like count
                $like_count = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM $likes_table WHERE comment_id = %d",
                    $comment->id
                ));
                $comment->like_count = intval($like_count);

                // Check if current user liked this comment
                $user_liked = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM $likes_table WHERE comment_id = %d AND user_email = %s",
                    $comment->id,
                    $current_user_email
                ));
                $comment->user_liked = intval($user_liked) > 0 ? 1 : 0;
            }

            // Organize comments into threaded structure
            $threaded_comments = $this->organize_threaded_comments($comments);

            wp_send_json_success(array(
                'comments' => $threaded_comments
            ));
        } catch (Exception $e) {
            error_log('Error in get_threaded_comments: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Failed to load comments'));
        }
    }

    /**
     * Add a threaded comment (can be a reply to another comment)
     */
    public function add_threaded_comment() {
        try {
            // Verify nonce
            if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
                wp_send_json_error(array('message' => 'Invalid security token'));
                return;
            }

            if (!current_user_can('manage_options')) {
                wp_send_json_error('Insufficient permissions');
            }

            $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
            $item_id = isset($_POST['item_id']) ? intval($_POST['item_id']) : 0;
            $parent_id = isset($_POST['parent_id']) && !empty($_POST['parent_id']) ? intval($_POST['parent_id']) : null;
            $comment_content = isset($_POST['comment_content']) ? wp_kses_post($_POST['comment_content']) : '';

            if (!$checklist_id || !$item_id || empty($comment_content)) {
                wp_send_json_error('Invalid parameters');
            }

            global $wpdb;
            $comments_table = $wpdb->prefix . 'mcl_task_comments';
            $likes_table = $wpdb->prefix . 'mcl_comment_likes';

            // Check if tables exist
            if ($wpdb->get_var("SHOW TABLES LIKE '$comments_table'") != $comments_table ||
                $wpdb->get_var("SHOW TABLES LIKE '$likes_table'") != $likes_table) {
                // Try to create tables
                MCL_DB_Manager::get_instance()->install();
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
                }

                // Don't allow replies to replies (max 2 levels)
                if ($parent_comment->parent_id !== null) {
                    wp_send_json_error('Cannot reply to a reply');
                }
            }

            $current_user = wp_get_current_user();
            $user_avatar = get_avatar_url($current_user->ID, array('size' => 40));

            $result = $wpdb->insert(
                $comments_table,
                array(
                    'checklist_id' => $checklist_id,
                    'item_id' => $item_id,
                    'parent_id' => $parent_id,
                    'user_id' => $current_user->ID,
                    'user_name' => $current_user->display_name,
                    'user_email' => $current_user->user_email,
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
            }

            $comment_id = $wpdb->insert_id;
            $new_comment = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $comments_table WHERE id = %d",
                $comment_id
            ));
        
            // Add user_liked field for consistency
            $new_comment->user_liked = 0;

            // Trigger notification for comment events
            if ($parent_id) {
                // This is a reply
                do_action('mcl_comment_replied', $parent_id, $comment_id, $checklist_id, $item_id);
            } else {
                // This is a new top-level comment
                do_action('mcl_comment_added', $checklist_id, $item_id, array(
                    'id' => $comment_id,
                    'content' => $comment_content
                ));
            }

            wp_send_json_success(array(
                'message' => 'Comment added successfully',
                'comment' => $new_comment
            ));
        } catch (Exception $e) {
            error_log('Error in add_threaded_comment: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Failed to add comment'));
        }
    }

    /**
     * Toggle like on a comment
     */
    public function toggle_comment_like() {
        try {
            // Verify nonce
            if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
                wp_send_json_error(array('message' => 'Invalid security token'));
                return;
            }

            if (!current_user_can('manage_options')) {
                wp_send_json_error('Insufficient permissions');
            }

            $comment_id = isset($_POST['comment_id']) ? intval($_POST['comment_id']) : 0;

            if (!$comment_id) {
                wp_send_json_error('Invalid parameters');
            }

            $current_user = wp_get_current_user();
            
            global $wpdb;
            $comments_table = $wpdb->prefix . 'mcl_task_comments';
            $likes_table = $wpdb->prefix . 'mcl_comment_likes';

            // Check if tables exist
            if ($wpdb->get_var("SHOW TABLES LIKE '$comments_table'") != $comments_table ||
                $wpdb->get_var("SHOW TABLES LIKE '$likes_table'") != $likes_table) {
                // Try to create tables
                MCL_DB_Manager::get_instance()->install();
            }

            // Check if comment exists
            $comment = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $comments_table WHERE id = %d",
                $comment_id
            ));

            if (!$comment) {
                wp_send_json_error('Comment not found');
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
                
                // Trigger notification for comment like
                do_action('mcl_comment_liked', $comment_id, $comment->checklist_id, $comment->item_id);
                
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
            error_log('Error in toggle_comment_like: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Failed to toggle like'));
        }
    }

    /**
     * Delete threaded comment (admin only)
     */
    public function delete_threaded_comment() {
        try {
            // Verify nonce
            if (!check_ajax_referer('mcl_admin_nonce', 'nonce', false)) {
                wp_send_json_error(array('message' => 'Invalid security token'));
                return;
            }

            // Check if user is admin
            if (!current_user_can('administrator')) {
                wp_send_json_error('Insufficient permissions - admin required');
            }

            $comment_id = isset($_POST['comment_id']) ? intval($_POST['comment_id']) : 0;

            if (!$comment_id) {
                wp_send_json_error('Invalid parameters');
            }

            global $wpdb;
            $comments_table = $wpdb->prefix . 'mcl_task_comments';
            $likes_table = $wpdb->prefix . 'mcl_comment_likes';

            // Check if tables exist
            if ($wpdb->get_var("SHOW TABLES LIKE '$comments_table'") != $comments_table) {
                wp_send_json_error('Comments table not found');
            }

            // Check if comment exists
            $comment = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $comments_table WHERE id = %d",
                $comment_id
            ));

            if (!$comment) {
                wp_send_json_error('Comment not found');
            }

            // Start transaction
            $wpdb->query('START TRANSACTION');

            try {
                // Delete all likes for this comment (if likes table exists)
                if ($wpdb->get_var("SHOW TABLES LIKE '$likes_table'") == $likes_table) {
                    $wpdb->delete(
                        $likes_table,
                        array('comment_id' => $comment_id),
                        array('%d')
                    );
                }

                // Delete replies first (if any)
                $replies = $wpdb->get_results($wpdb->prepare(
                    "SELECT id FROM $comments_table WHERE parent_id = %d",
                    $comment_id
                ));

                foreach ($replies as $reply) {
                    // Delete likes for replies
                    if ($wpdb->get_var("SHOW TABLES LIKE '$likes_table'") == $likes_table) {
                        $wpdb->delete(
                            $likes_table,
                            array('comment_id' => $reply->id),
                            array('%d')
                        );
                    }
                    
                    // Delete reply
                    $wpdb->delete(
                        $comments_table,
                        array('id' => $reply->id),
                        array('%d')
                    );
                }

                // Delete the main comment
                $result = $wpdb->delete(
                    $comments_table,
                    array('id' => $comment_id),
                    array('%d')
                );

                if ($result === false) {
                    $wpdb->query('ROLLBACK');
                    wp_send_json_error('Failed to delete comment');
                }

                $wpdb->query('COMMIT');

                wp_send_json_success(array(
                    'message' => 'Comment deleted successfully',
                    'comment_id' => $comment_id
                ));

            } catch (Exception $e) {
                $wpdb->query('ROLLBACK');
                throw $e;
            }

        } catch (Exception $e) {
            error_log('Error in delete_threaded_comment: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Failed to delete comment'));
        }
    }

    /**
     * Organize flat comments array into threaded structure
     */
    private function organize_threaded_comments($comments) {
        $threaded = array();
        $replies = array();
        
        // Separate parent comments and replies
        foreach ($comments as $comment) {
            if ($comment->parent_id === null) {
                $comment->replies = array();
                $threaded[] = $comment;
            } else {
                if (!isset($replies[$comment->parent_id])) {
                    $replies[$comment->parent_id] = array();
                }
                $replies[$comment->parent_id][] = $comment;
            }
        }
        
        // Attach replies to their parent comments
        foreach ($threaded as &$parent_comment) {
            if (isset($replies[$parent_comment->id])) {
                $parent_comment->replies = $replies[$parent_comment->id];
            }
        }
        
        return $threaded;
    }


}
