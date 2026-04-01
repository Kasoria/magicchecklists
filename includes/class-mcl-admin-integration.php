<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MAGICCL_Admin_Integration {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function __construct() {
        add_action('admin_post_magiccl_save_publisher_checklist', array($this, 'handle_save_publisher_checklist'));
        add_action('admin_notices', array($this, 'show_admin_notices'));
        add_filter('manage_edit-magiccl_checklist_columns', array($this, 'add_checklist_columns'));
        add_action('manage_magiccl_checklist_posts_custom_column', array($this, 'fill_checklist_columns'), 10, 2);
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_styles'));
        add_action('admin_init', array($this, 'maybe_run_db_upgrade'));
    }
    
    public function handle_save_publisher_checklist() {
        // Verify nonce
        if (!isset($_POST['magiccl_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['magiccl_nonce'])), 'magiccl_save_publisher_checklist')) {
            wp_die(esc_html__('Security check failed', 'magicchecklists'));
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Insufficient permissions', 'magicchecklists'));
        }
        
        $checklist_id = intval($_POST['checklist_id']);
        $title = sanitize_text_field($_POST['title']);
        $description = wp_kses_post($_POST['description']);
        $post_types = isset($_POST['post_types']) ? array_map('sanitize_text_field', $_POST['post_types']) : array();
        $active = isset($_POST['active']) ? 1 : 0;
        $show_tips = isset($_POST['show_tips']) ? 1 : 0;
        $requirements_data = isset($_POST['requirements']) ? $_POST['requirements'] : array();
        
        // Validate required fields
        if (empty($title)) {
            $this->redirect_with_error(__('Title is required', 'magicchecklists'), $checklist_id);
            return;
        }
        
        if (empty($post_types)) {
            $this->redirect_with_error(__('At least one post type must be selected', 'magicchecklists'), $checklist_id);
            return;
        }
        
        // Process requirements
        $requirements = array();
        foreach ($requirements_data as $req_type => $req_data) {
            // Handle both single requirements and repeatable instances
            if (is_array($req_data) && isset($req_data['enabled'])) {
                // Single requirement (non-repeatable)
                if (!$req_data['enabled']) {
                    continue;
                }
                
                $config = isset($req_data['config']) ? $req_data['config'] : array();
                
                // Validate required fields for non-repeatable items
                if ($req_type === 'custom_field') {
                    if (empty($config['field_name'])) {
                        $this->redirect_with_error(__('Custom field name cannot be empty', 'magicchecklists'), $checklist_id);
                        return;
                    }
                } elseif ($req_type === 'custom_item') {
                    if (empty($config['item_title'])) {
                        $this->redirect_with_error(__('Custom item title cannot be empty', 'magicchecklists'), $checklist_id);
                        return;
                    }
                }
                
                $requirements[] = array(
                    'type' => $req_type,
                    'instance_id' => '',
                    'config' => $config,
                    'required' => isset($req_data['required']) && $req_data['required']
                );
            } else {
                // Multiple instances (repeatable)
                foreach ($req_data as $instance_id => $instance_data) {
                    if (!isset($instance_data['enabled']) || !$instance_data['enabled']) {
                        continue;
                    }
                    
                    $config = isset($instance_data['config']) ? $instance_data['config'] : array();
                    
                    // Validate required fields for repeatable items
                    if ($req_type === 'custom_field') {
                        if (empty($config['field_name'])) {
                            $this->redirect_with_error(__('Custom field name cannot be empty', 'magicchecklists'), $checklist_id);
                            return;
                        }
                    } elseif ($req_type === 'custom_item') {
                        if (empty($config['item_title'])) {
                            $this->redirect_with_error(__('Custom item title cannot be empty', 'magicchecklists'), $checklist_id);
                            return;
                        }
                    }
                    
                    $requirements[] = array(
                        'type' => $req_type,
                        'instance_id' => isset($instance_data['instance_id']) ? $instance_data['instance_id'] : $instance_id,
                        'config' => $config,
                        'required' => isset($instance_data['required']) && $instance_data['required']
                    );
                }
            }
        }
        
        if (empty($requirements)) {
            $this->redirect_with_error(__('At least one requirement must be enabled', 'magicchecklists'), $checklist_id);
            return;
        }
        
        // Create or update post
        $post_data = array(
            'post_title' => $title,
            'post_content' => $description,
            'post_type' => 'magiccl_checklist',
            'post_status' => 'publish'
        );
        
        if ($checklist_id) {
            $post_data['ID'] = $checklist_id;
            $result = wp_update_post($post_data);
        } else {
            $result = wp_insert_post($post_data);
            $checklist_id = $result;
        }
        
        if (is_wp_error($result)) {
            $this->redirect_with_error(__('Failed to save checklist', 'magicchecklists'), $checklist_id);
            return;
        }
        
        // Save metadata
        update_post_meta($checklist_id, '_magiccl_checklist_type', 'publisher');
        update_post_meta($checklist_id, '_magiccl_publisher_post_types', $post_types);
        update_post_meta($checklist_id, '_magiccl_active', $active);
        update_post_meta($checklist_id, '_magiccl_show_tips', $show_tips);
        
        // Save requirements
                    MAGICCL_DB_Manager::save_publisher_requirements($checklist_id, $requirements);
        
        // Redirect with success
        $redirect_url = admin_url('admin.php?page=magiccl_add_new&type=publisher&checklist_id=' . $checklist_id . '&message=saved');
        wp_safe_redirect($redirect_url);
        exit;
    }
    
    private function redirect_with_error($message, $checklist_id = 0) {
        $redirect_url = admin_url('admin.php?page=magiccl_add_new&type=publisher');
        if ($checklist_id) {
            $redirect_url = add_query_arg('checklist_id', $checklist_id, $redirect_url);
        }
        $redirect_url = add_query_arg('error', urlencode($message), $redirect_url);
        wp_safe_redirect($redirect_url);
        exit;
    }
    
    public function show_admin_notices() {
        $screen = get_current_screen();
        if (!$screen || $screen->id !== 'magicchecklists_page_magiccl_add_new') {
            return;
        }
        
        // Only show notices on publisher checklist pages
        if (!isset($_GET['type']) || $_GET['type'] !== 'publisher') {
            return;
        }
        
        if (isset($_GET['message']) && $_GET['message'] === 'saved') {
            echo '<div class="notice notice-success is-dismissible"><p>' . 
                 esc_html__('Publisher checklist saved successfully!', 'magicchecklists') . 
                 '</p></div>';
        }
        
        if (isset($_GET['error'])) {
            echo '<div class="notice notice-error is-dismissible"><p>' . 
                 esc_html(sanitize_text_field(wp_unslash($_GET['error']))) .
                 '</p></div>';
        }
    }
    
    public function add_checklist_columns($columns) {
        // Add a type column to the checklists list
        $new_columns = array();
        foreach ($columns as $key => $value) {
            $new_columns[$key] = $value;
            if ($key === 'title') {
                $new_columns['checklist_type'] = __('Type', 'magicchecklists');
                $new_columns['post_types'] = __('Post Types', 'magicchecklists');
                $new_columns['requirements'] = __('Requirements', 'magicchecklists');
            }
        }
        return $new_columns;
    }
    
    public function fill_checklist_columns($column, $post_id) {
        switch ($column) {
            case 'checklist_type':
                $type = get_post_meta($post_id, '_magiccl_checklist_type', true) ?: 'classic';
                $type_labels = array(
                    'classic' => __('Classic', 'magicchecklists'),
                    'publisher' => __('Publisher', 'magicchecklists')
                );
                echo '<span class="magiccl-type-badge magiccl-type-' . esc_attr($type) . '">' . 
                     esc_html($type_labels[$type]) . '</span>';
                break;
                
            case 'post_types':
                $type = get_post_meta($post_id, '_magiccl_checklist_type', true) ?: 'classic';
                if ($type === 'publisher') {
                    $post_types = get_post_meta($post_id, '_magiccl_publisher_post_types', true) ?: array();
                    if (!empty($post_types)) {
                        echo esc_html(implode(', ', array_map('ucfirst', $post_types)));
                    } else {
                        echo '<span class="magiccl-none">—</span>';
                    }
                } else {
                    echo '<span class="magiccl-none">—</span>';
                }
                break;
                
            case 'requirements':
                $type = get_post_meta($post_id, '_magiccl_checklist_type', true) ?: 'classic';
                if ($type === 'publisher') {
                    $requirements = MAGICCL_DB_Manager::get_publisher_requirements($post_id);
                    $count = count($requirements);
                    $required_count = count(array_filter($requirements, function($req) {
                        return $req['required'];
                    }));
                    
                    if ($count > 0) {
                        echo esc_html( sprintf(
                            /* translators: 1: total count, 2: required count */
                            __('%d total (%d required)', 'magicchecklists'),
                            $count,
                            $required_count
                        ) );
                    } else {
                        echo '<span class="magiccl-none">—</span>';
                    }
                } else {
                    $items = get_post_meta($post_id, '_magiccl_items', true) ?: array();
                    $count = count($items);
                    echo $count > 0 ? esc_html( sprintf( /* translators: %d: item count */ __('%d items', 'magicchecklists'), $count ) ) : '<span class="magiccl-none">—</span>';
                }
                break;
        }
    }

    public function maybe_run_db_upgrade() {
        // Check if we need to run database upgrade
        $current_version = get_option('magiccl_db_version', '1.0.0');
        $target_version = '1.5';
        
        if (version_compare($current_version, $target_version, '<')) {
            $db_manager = MAGICCL_DB_Manager::get_instance();
            $db_manager->force_upgrade();
        }
    }

    public function enqueue_admin_styles() {
        $screen = get_current_screen();
        if (!$screen) return;
        
        // Add styles for the checklist list page to show type badges
        if ($screen->id === 'edit-magiccl_checklist') {
            wp_add_inline_style('wp-admin', '
                .magiccl-type-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .magiccl-type-classic {
                    background: #e0f2fe;
                    color: #0369a1;
                }
                .magiccl-type-publisher {
                    background: #fef3c7;
                    color: #d97706;
                }
                .magiccl-none {
                    color: #9ca3af;
                }
            ');
        }
        
        // Add styles for the type selection and publisher edit pages
        if ($screen->id === 'magicchecklists_page_magiccl_add_new') {
            wp_enqueue_style('magiccl-admin-base', 
                MAGIC_CHECKLISTS_PLUGIN_URL . 'admin/assets/css/common/magiccl-base.css', 
                array(), 
                MAGIC_CHECKLISTS_VERSION
            );
            wp_enqueue_style('magiccl-admin-forms', 
                MAGIC_CHECKLISTS_PLUGIN_URL . 'admin/assets/css/common/magiccl-forms.css', 
                array('magiccl-admin-base'), 
                MAGIC_CHECKLISTS_VERSION
            );
        }
    }
}

