<?php
if (!defined('ABSPATH')) {
    exit;
}

class MCL_DB_Manager {
    private static $instance = null;
    private $db_version = '1.5'; // Increment version for new tables
    
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function install() {
        $this->create_tables();
        $this->maybe_upgrade();
        $this->update_checklist_schema();
        update_option('mcl_db_version', $this->db_version);
    }
    
    /**
     * Force database upgrade - useful for development/troubleshooting
     */
    public function force_upgrade() {
        $current_version = get_option('mcl_db_version', '1.0.0');
        $this->upgrade($current_version);
        update_option('mcl_db_version', $this->db_version);
    }

    private function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
    
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    
        // Create invite links table
        $invite_links_table = $wpdb->prefix . 'mcl_invite_links';
        $sql = "CREATE TABLE IF NOT EXISTS $invite_links_table (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            checklist_id bigint(20) UNSIGNED NOT NULL,
            token varchar(64) NOT NULL,
            permissions varchar(20) NOT NULL DEFAULT 'view',
            expiry_date datetime NOT NULL,
            usage_limit int UNSIGNED NOT NULL DEFAULT 0,
            usage_count int UNSIGNED NOT NULL DEFAULT 0,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY checklist_id (checklist_id),
            KEY token (token),
            KEY expiry_date (expiry_date)
        ) $charset_collate;";
        dbDelta($sql);
    
        // Create notification settings table
        $notification_settings_table = $wpdb->prefix . 'mcl_notification_settings';
        $sql = "CREATE TABLE IF NOT EXISTS $notification_settings_table (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            checklist_id bigint(20) UNSIGNED NOT NULL,
            notifications_enabled tinyint(1) NOT NULL DEFAULT 0,
            email_enabled tinyint(1) NOT NULL DEFAULT 0,
            integration_enabled tinyint(1) NOT NULL DEFAULT 0,
            email_recipients text,
            slack_webhook_url varchar(255),
            discord_webhook_url varchar(255),
            notify_on_new_item tinyint(1) NOT NULL DEFAULT 0,
            notify_on_delete_item tinyint(1) NOT NULL DEFAULT 0,
            notify_on_check_item tinyint(1) NOT NULL DEFAULT 0,
            notify_on_uncheck_item tinyint(1) NOT NULL DEFAULT 0,
            notify_on_deadline tinyint(1) NOT NULL DEFAULT 0,
            deadline_threshold_hours int UNSIGNED DEFAULT 24,
            batch_interval varchar(20) DEFAULT 'fifteen_minutes',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY checklist_id (checklist_id),
            KEY notifications_enabled (notifications_enabled)
        ) $charset_collate;";
        dbDelta($sql);
    
        // Create notification queue table
        $notification_queue_table = $wpdb->prefix . 'mcl_notification_queue';
        $sql = "CREATE TABLE IF NOT EXISTS $notification_queue_table (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            checklist_id bigint(20) UNSIGNED NOT NULL,
            type varchar(50) NOT NULL,
            event varchar(50) NOT NULL,
            data text NOT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            processed tinyint(1) NOT NULL DEFAULT 0,
            process_after datetime NOT NULL,
            processed_at datetime NULL,
            error_message text,
            retry_count int UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (id),
            KEY checklist_id (checklist_id),
            KEY process_after_processed (process_after, processed),
            KEY type_event (type, event)
        ) $charset_collate;";
        dbDelta($sql);

        // Create publisher requirements table
        $publisher_requirements_table = $wpdb->prefix . 'mcl_publisher_requirements';
        $sql = "CREATE TABLE IF NOT EXISTS $publisher_requirements_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            checklist_id bigint(20) NOT NULL,
            requirement_type varchar(50) NOT NULL,
            instance_id varchar(100) NOT NULL DEFAULT '',
            requirement_config text,
            is_required tinyint(1) NOT NULL DEFAULT 1,
            display_order int(11) NOT NULL DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY checklist_id (checklist_id),
            KEY requirement_type (requirement_type),
            KEY instance_id (instance_id)
        ) $charset_collate;";
        dbDelta($sql);
    
        // Log any errors silently instead of outputting them
        if ($wpdb->last_error) {
            error_log('MCL DB Creation Error: ' . $wpdb->last_error);
        }
    }

    private function update_checklist_schema() {
        // Add default checklist_type meta to existing checklists
        $existing_checklists = get_posts([
            'post_type' => 'mcl_checklist',
            'posts_per_page' => -1,
            'meta_query' => [
                [
                    'key' => '_mcl_checklist_type',
                    'compare' => 'NOT EXISTS'
                ]
            ]
        ]);
        
        foreach ($existing_checklists as $checklist) {
            update_post_meta($checklist->ID, '_mcl_checklist_type', 'classic');
        }
    }

    private function maybe_upgrade() {
        $current_version = get_option('mcl_db_version', '1.0.0');
        
        if (version_compare($current_version, $this->db_version, '<')) {
            $this->upgrade($current_version);
        }
    }

    private function upgrade($from_version) {
        global $wpdb;
        
        // Handle upgrades from older versions
        if (version_compare($from_version, '1.2', '<=')) {
            // Add notification tables in upgrade process
            $this->create_tables();
        }

        if (version_compare($from_version, '1.3', '<')) {
            // Add any 1.3-specific upgrades here
            $notification_queue_table = $wpdb->prefix . 'mcl_notification_queue';
            
            // Example: Add new columns to notification queue if needed
            $wpdb->query("ALTER TABLE $notification_queue_table 
                ADD COLUMN IF NOT EXISTS processed_at datetime NULL AFTER process_after,
                ADD COLUMN IF NOT EXISTS error_message text AFTER processed_at,
                ADD COLUMN IF NOT EXISTS retry_count int UNSIGNED NOT NULL DEFAULT 0 AFTER error_message"
            );
        }

        if (version_compare($from_version, '1.4', '<')) {
            // Add publisher requirements table
            $this->create_tables();
            $this->update_checklist_schema();
        }

        if (version_compare($from_version, '1.5', '<')) {
            // Add instance_id column for repeatable requirements
            $publisher_requirements_table = $wpdb->prefix . 'mcl_publisher_requirements';
            
            // Check if table exists first
            $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$publisher_requirements_table'") == $publisher_requirements_table;
            
            if ($table_exists) {
                $column_exists = $wpdb->get_results("SHOW COLUMNS FROM $publisher_requirements_table LIKE 'instance_id'");
                if (empty($column_exists)) {
                    $wpdb->query("ALTER TABLE $publisher_requirements_table ADD COLUMN instance_id varchar(100) NOT NULL DEFAULT '' AFTER requirement_type");
                    
                    // Add index if it doesn't exist
                    $index_exists = $wpdb->get_results("SHOW INDEX FROM $publisher_requirements_table WHERE Key_name = 'instance_id'");
                    if (empty($index_exists)) {
                        $wpdb->query("ALTER TABLE $publisher_requirements_table ADD KEY instance_id (instance_id)");
                    }
                }
            }
        }
    }

    public function uninstall() {
        global $wpdb;
        
        // Drop all plugin tables
        $tables = array(
            'mcl_invite_links',
            'mcl_notification_settings',
            'mcl_notification_queue',
            'mcl_publisher_requirements'
        );

        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}{$table}");
        }
        
        // Clean up options
        delete_option('mcl_db_version');
    }
    
    public function verify_tables() {
        global $wpdb;
        
        $tables = array(
            'mcl_invite_links' => 'Invite links table',
            'mcl_notification_settings' => 'Notification settings table',
            'mcl_notification_queue' => 'Notification queue table',
            'mcl_publisher_requirements' => 'Publisher requirements table'
        );
        
        $result = array(
            'status' => true,
            'messages' => array()
        );
        
        foreach ($tables as $table => $description) {
            $table_name = $wpdb->prefix . $table;
            
            if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
                $result['status'] = false;
                $result['messages'][] = "$description is missing";
                
                // Attempt to recreate the tables
                $this->create_tables();
                
                // Verify again
                if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
                    $result['messages'][] = "Failed to create $description";
                } else {
                    $result['messages'][] = "Successfully recreated $description";
                }
            }
        }
        
        return $result;
    }

    /**
     * Get default publisher requirements configuration
     */
    public static function get_default_publisher_requirements() {
        return [
            'word_count' => [
                'label' => 'Minimum Word Count',
                'description' => 'Content must have at least [X] words',
                'config_fields' => [
                    'min_words' => [
                        'type' => 'number',
                        'label' => 'Minimum words',
                        'default' => 300,
                        'min' => 1,
                        'max' => 10000
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'featured_image' => [
                'label' => 'Featured Image',
                'description' => 'Post must have a featured image',
                'config_fields' => [],
                'auto_check' => true,
                'repeatable' => false
            ],
            'excerpt' => [
                'label' => 'Excerpt',
                'description' => 'Excerpt must be between [X] and [Y] characters',
                'config_fields' => [
                    'min_excerpt_length' => [
                        'type' => 'number',
                        'label' => 'Minimum excerpt length',
                        'default' => 50,
                        'min' => 1,
                        'max' => 1000
                    ],
                    'max_excerpt_length' => [
                        'type' => 'number',
                        'label' => 'Maximum excerpt length',
                        'default' => 300,
                        'min' => 1,
                        'max' => 1000
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'categories' => [
                'label' => 'Minimum Categories',
                'description' => 'Post must have at least [X] categories',
                'config_fields' => [
                    'min_categories' => [
                        'type' => 'number',
                        'label' => 'Minimum categories',
                        'default' => 1,
                        'min' => 1,
                        'max' => 50
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'tags' => [
                'label' => 'Minimum Tags',
                'description' => 'Post must have at least [X] tags',
                'config_fields' => [
                    'min_tags' => [
                        'type' => 'number',
                        'label' => 'Minimum tags',
                        'default' => 3,
                        'min' => 1,
                        'max' => 50
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'external_links' => [
                'label' => 'External Links',
                'description' => 'Content must have at least [X] external links',
                'config_fields' => [
                    'min_external_links' => [
                        'type' => 'number',
                        'label' => 'Minimum external links',
                        'default' => 1,
                        'min' => 0,
                        'max' => 50
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'internal_links' => [
                'label' => 'Internal Links',
                'description' => 'Content must have at least [X] internal links',
                'config_fields' => [
                    'min_internal_links' => [
                        'type' => 'number',
                        'label' => 'Minimum internal links',
                        'default' => 2,
                        'min' => 0,
                        'max' => 50
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'title_length' => [
                'label' => 'Title Length',
                'description' => 'Title must be between [X] and [Y] characters',
                'config_fields' => [
                    'min_title_length' => [
                        'type' => 'number',
                        'label' => 'Minimum title length',
                        'default' => 10,
                        'min' => 1,
                        'max' => 200
                    ],
                    'max_title_length' => [
                        'type' => 'number',
                        'label' => 'Maximum title length',
                        'default' => 60,
                        'min' => 1,
                        'max' => 200
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'meta_description' => [
                'label' => 'Meta Description',
                'description' => 'Meta description must be between [X] and [Y] characters',
                'config_fields' => [
                    'min_meta_length' => [
                        'type' => 'number',
                        'label' => 'Minimum meta description length',
                        'default' => 120,
                        'min' => 1,
                        'max' => 500
                    ],
                    'max_meta_length' => [
                        'type' => 'number',
                        'label' => 'Maximum meta description length',
                        'default' => 160,
                        'min' => 1,
                        'max' => 500
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'meta_title' => [
                'label' => 'Meta Title',
                'description' => 'Meta title must be between [X] and [Y] characters',
                'config_fields' => [
                    'min_meta_title_length' => [
                        'type' => 'number',
                        'label' => 'Minimum meta title length',
                        'default' => 30,
                        'min' => 1,
                        'max' => 200
                    ],
                    'max_meta_title_length' => [
                        'type' => 'number',
                        'label' => 'Maximum meta title length',
                        'default' => 60,
                        'min' => 1,
                        'max' => 200
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'image_alt_text' => [
                'label' => 'Image Alt Text',
                'description' => 'All images must have alt text for accessibility',
                'config_fields' => [],
                'auto_check' => true,
                'repeatable' => false
            ],
            'heading_count' => [
                'label' => 'Heading Count',
                'description' => 'Content must have specific heading counts (H2, H3, H4)',
                'config_fields' => [
                    'min_h2_headings' => [
                        'type' => 'number',
                        'label' => 'Minimum H2 headings',
                        'default' => 2,
                        'min' => 0,
                        'max' => 50
                    ],
                    'min_h3_headings' => [
                        'type' => 'number',
                        'label' => 'Minimum H3 headings',
                        'default' => 1,
                        'min' => 0,
                        'max' => 50
                    ],
                    'min_h4_headings' => [
                        'type' => 'number',
                        'label' => 'Minimum H4 headings',
                        'default' => 0,
                        'min' => 0,
                        'max' => 50
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'image_count' => [
                'label' => 'Image Count',
                'description' => 'Content must have at least [X] images',
                'config_fields' => [
                    'min_images' => [
                        'type' => 'number',
                        'label' => 'Minimum images',
                        'default' => 1,
                        'min' => 0,
                        'max' => 50
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'custom_field' => [
                'label' => 'Custom Field',
                'description' => 'Custom field must be filled',
                'config_fields' => [
                    'field_name' => [
                        'type' => 'select',
                        'label' => 'Custom field',
                        'default' => '',
                        'placeholder' => 'Select a custom field',
                        'options' => [] // Will be populated dynamically
                    ],
                    'field_label' => [
                        'type' => 'text',
                        'label' => 'Display name',
                        'default' => '',
                        'placeholder' => 'e.g., Author Bio'
                    ]
                ],
                'auto_check' => true,
                'repeatable' => true
            ],
            'custom_item' => [
                'label' => 'Custom Item',
                'description' => 'Manual verification required',
                'config_fields' => [
                    'item_title' => [
                        'type' => 'text',
                        'label' => 'Item title',
                        'default' => '',
                        'placeholder' => 'e.g., Fact-check all statistics'
                    ],
                    'item_description' => [
                        'type' => 'text',
                        'label' => 'Description (optional)',
                        'default' => '',
                        'placeholder' => 'Additional instructions...'
                    ]
                ],
                'auto_check' => false,
                'repeatable' => true
            ]
        ];
    }
    
    /**
     * Save publisher requirements for a checklist
     */
    public static function save_publisher_requirements($checklist_id, $requirements) {
        global $wpdb;
        
        $table = $wpdb->prefix . 'mcl_publisher_requirements';
        
        // Delete existing requirements
        $wpdb->delete($table, ['checklist_id' => $checklist_id], ['%d']);
        
        // Insert new requirements
        foreach ($requirements as $index => $requirement) {
            $instance_id = isset($requirement['instance_id']) ? $requirement['instance_id'] : '';
            
            $wpdb->insert(
                $table,
                [
                    'checklist_id' => $checklist_id,
                    'requirement_type' => $requirement['type'],
                    'instance_id' => $instance_id,
                    'requirement_config' => maybe_serialize($requirement['config']),
                    'is_required' => $requirement['required'] ? 1 : 0,
                    'display_order' => $index
                ],
                ['%d', '%s', '%s', '%s', '%d', '%d']
            );
        }
    }
    
    /**
     * Get publisher requirements for a checklist
     */
    public static function get_publisher_requirements($checklist_id) {
        global $wpdb;
        
        $table = $wpdb->prefix . 'mcl_publisher_requirements';
        
        $requirements = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE checklist_id = %d ORDER BY display_order ASC",
            $checklist_id
        ));
        
        $result = [];
        foreach ($requirements as $req) {
            $result[] = [
                'type' => $req->requirement_type,
                'instance_id' => property_exists($req, 'instance_id') ? $req->instance_id : '',
                'config' => maybe_unserialize($req->requirement_config),
                'required' => (bool) $req->is_required,
                'order' => $req->display_order
            ];
        }
        
        return $result;
    }
}