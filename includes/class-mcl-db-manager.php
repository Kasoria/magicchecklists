<?php
if (!defined('ABSPATH')) {
    exit;
}

class MCL_DB_Manager {
    private static $instance = null;
    private $db_version = '2.0'; // Comment notifications
    
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
            notify_on_comments tinyint(1) NOT NULL DEFAULT 0,
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

        // Create Kanban board state table
        $kanban_state_table = $wpdb->prefix . 'mcl_kanban_state';
        $sql = "CREATE TABLE IF NOT EXISTS $kanban_state_table (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            checklist_id bigint(20) UNSIGNED NOT NULL,
            item_id bigint(20) UNSIGNED NOT NULL,
            column_id varchar(100) NOT NULL,
            position int(11) NOT NULL DEFAULT 0,
            assigned_user_id bigint(20) UNSIGNED DEFAULT NULL,
            due_date datetime DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY item_checklist (item_id, checklist_id),
            KEY checklist_id (checklist_id),
            KEY column_id (column_id),
            KEY assigned_user_id (assigned_user_id),
            KEY position (position)
        ) $charset_collate;";
        dbDelta($sql);

        // Create Kanban columns configuration table
        $kanban_columns_table = $wpdb->prefix . 'mcl_kanban_columns';
        $sql = "CREATE TABLE IF NOT EXISTS $kanban_columns_table (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            checklist_id bigint(20) UNSIGNED NOT NULL,
            column_id varchar(100) NOT NULL,
            title varchar(255) NOT NULL,
            color varchar(7) DEFAULT '#3B82F6',
            position int(11) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY checklist_column (checklist_id, column_id),
            KEY checklist_id (checklist_id),
            KEY position (position)
        ) $charset_collate;";
        dbDelta($sql);

        // Create task comments table with threading and likes support
        $task_comments_table = $wpdb->prefix . 'mcl_task_comments';
        $sql = "CREATE TABLE IF NOT EXISTS $task_comments_table (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            checklist_id bigint(20) UNSIGNED NOT NULL,
            item_id bigint(20) UNSIGNED NOT NULL,
            parent_id bigint(20) UNSIGNED DEFAULT NULL,
            user_id bigint(20) UNSIGNED DEFAULT NULL,
            user_name varchar(255) NOT NULL,
            user_email varchar(255) NOT NULL,
            user_avatar varchar(255) DEFAULT NULL,
            comment_content longtext NOT NULL,
            like_count int UNSIGNED NOT NULL DEFAULT 0,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY checklist_id (checklist_id),
            KEY item_id (item_id),
            KEY parent_id (parent_id),
            KEY user_id (user_id),
            KEY created_at (created_at)
        ) $charset_collate;";
        dbDelta($sql);

        // Create comment likes table
        $comment_likes_table = $wpdb->prefix . 'mcl_comment_likes';
        $sql = "CREATE TABLE IF NOT EXISTS $comment_likes_table (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            comment_id bigint(20) UNSIGNED NOT NULL,
            user_id bigint(20) UNSIGNED DEFAULT NULL,
            user_email varchar(255) NOT NULL,
            user_name varchar(255) NOT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY unique_like (comment_id, user_email),
            KEY comment_id (comment_id),
            KEY user_id (user_id)
        ) $charset_collate;";
        dbDelta($sql);

        // Create global notifications table
        $global_notifications_table = $wpdb->prefix . 'mcl_global_notifications';
        $sql = "CREATE TABLE IF NOT EXISTS $global_notifications_table (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            context varchar(50) NOT NULL DEFAULT 'checklist',
            context_id bigint(20) UNSIGNED DEFAULT NULL,
            type varchar(50) NOT NULL,
            event varchar(50) NOT NULL,
            data text NOT NULL,
            user_id bigint(20) UNSIGNED DEFAULT NULL,
            user_name varchar(255) DEFAULT NULL,
            user_email varchar(255) DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            processed tinyint(1) NOT NULL DEFAULT 0,
            process_after datetime NOT NULL,
            processed_at datetime NULL,
            error_message text,
            retry_count int UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (id),
            KEY context_id (context_id),
            KEY context (context),
            KEY type_event (type, event),
            KEY process_after_processed (process_after, processed),
            KEY created_at (created_at)
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

        if (version_compare($from_version, '1.6', '<')) {
            // Add Kanban tables
            $this->create_tables();
            
            // Log successful upgrade
            error_log('MCL DB Manager: Upgraded to version 1.6 - Kanban tables created');
        }
        if (version_compare($from_version, '1.7', '<')) {
            // Add task comments table
            $this->create_tables();
            
            // Log successful upgrade
            error_log('MCL DB Manager: Upgraded to version 1.7 - Task comments table created');
        }
        
        if (version_compare($from_version, '1.8', '<')) {
            // Update task comments table for threading and likes support
            $task_comments_table = $wpdb->prefix . 'mcl_task_comments';
            
            // Add new columns if they don't exist
            $columns_to_add = [
                'parent_id' => "ALTER TABLE $task_comments_table ADD COLUMN parent_id bigint(20) UNSIGNED DEFAULT NULL AFTER item_id",
                'user_avatar' => "ALTER TABLE $task_comments_table ADD COLUMN user_avatar varchar(255) DEFAULT NULL AFTER user_email",
                'like_count' => "ALTER TABLE $task_comments_table ADD COLUMN like_count int UNSIGNED NOT NULL DEFAULT 0 AFTER comment_content"
            ];
            
            foreach ($columns_to_add as $column => $query) {
                $column_exists = $wpdb->get_results("SHOW COLUMNS FROM $task_comments_table LIKE '$column'");
                if (empty($column_exists)) {
                    $wpdb->query($query);
                }
            }
            
            // Add indexes if they don't exist
            $index_exists = $wpdb->get_results("SHOW INDEX FROM $task_comments_table WHERE Key_name = 'parent_id'");
            if (empty($index_exists)) {
                $wpdb->query("ALTER TABLE $task_comments_table ADD KEY parent_id (parent_id)");
            }
            
            // Create comment likes table
            $this->create_tables();
            
            // Log successful upgrade
            error_log('MCL DB Manager: Upgraded to version 1.8 - Enhanced task comments with threading and likes');
        }
        
        if (version_compare($from_version, '1.9', '<')) {
            // Add global notifications table
            $this->create_tables();
            
            // Log successful upgrade
            error_log('MCL DB Manager: Upgraded to version 1.9 - Global notification system');
        }
        
        if (version_compare($from_version, '2.0', '<')) {
            // Add notify_on_comments column to notification settings table
            $notification_settings_table = $wpdb->prefix . 'mcl_notification_settings';
            
            $column_exists = $wpdb->get_results("SHOW COLUMNS FROM $notification_settings_table LIKE 'notify_on_comments'");
            if (empty($column_exists)) {
                $wpdb->query("ALTER TABLE $notification_settings_table ADD COLUMN notify_on_comments tinyint(1) NOT NULL DEFAULT 0 AFTER notify_on_deadline");
            }
            
            // Log successful upgrade
            error_log('MCL DB Manager: Upgraded to version 2.0 - Comment notifications');
        }

    }

    public function uninstall() {
        global $wpdb;
        
        // Drop all plugin tables
        $tables = array(
            'mcl_invite_links',
            'mcl_notification_settings',
            'mcl_notification_queue',
            'mcl_publisher_requirements',
            'mcl_kanban_state',
            'mcl_kanban_columns',
            'mcl_comment_likes',
            'mcl_task_comments',
            'mcl_global_notifications'
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
            'mcl_publisher_requirements' => 'Publisher requirements table',
            'mcl_kanban_state' => 'Kanban state table',
            'mcl_kanban_columns' => 'Kanban columns table',
            'mcl_comment_likes' => 'Comment likes table',
            'mcl_task_comments' => 'Task comments table',
            'mcl_global_notifications' => 'Global notifications table'
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
                'label' => __('Minimum Word Count', 'magic-checklists'),
                'description' => __('Content must have at least [X] words', 'magic-checklists'),
                'config_fields' => [
                    'min_words' => [
                        'type' => 'number',
                        'label' => __('Minimum words', 'magic-checklists'),
                        'default' => 300,
                        'min' => 1,
                        'max' => 10000
                    ],
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'featured_image' => [
                'label' => __('Featured Image', 'magic-checklists'),
                'description' => __('Post must have a featured image', 'magic-checklists'),
                'config_fields' => [
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'excerpt' => [
                'label' => __('Excerpt', 'magic-checklists'),
                'description' => __('Excerpt must be between [X] and [Y] characters', 'magic-checklists'),
                'config_fields' => [
                    'min_excerpt_length' => [
                        'type' => 'number',
                        'label' => __('Minimum excerpt length', 'magic-checklists'),
                        'default' => 50,
                        'min' => 1,
                        'max' => 1000
                    ],
                    'max_excerpt_length' => [
                        'type' => 'number',
                        'label' => __('Maximum excerpt length', 'magic-checklists'),
                        'default' => 300,
                        'min' => 1,
                        'max' => 1000
                    ],
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'categories' => [
                'label' => __('Minimum Categories', 'magic-checklists'),
                'description' => __('Post must have at least [X] categories', 'magic-checklists'),
                'config_fields' => [
                    'min_categories' => [
                        'type' => 'number',
                        'label' => __('Minimum categories', 'magic-checklists'),
                        'default' => 1,
                        'min' => 1,
                        'max' => 50
                    ],
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'tags' => [
                'label' => __('Minimum Tags', 'magic-checklists'),
                'description' => __('Post must have at least [X] tags', 'magic-checklists'),
                'config_fields' => [
                    'min_tags' => [
                        'type' => 'number',
                        'label' => __('Minimum tags', 'magic-checklists'),
                        'default' => 3,
                        'min' => 1,
                        'max' => 50
                    ],
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'external_links' => [
                'label' => __('External Links', 'magic-checklists'),
                'description' => __('Content must have at least [X] external links', 'magic-checklists'),
                'config_fields' => [
                    'min_external_links' => [
                        'type' => 'number',
                        'label' => __('Minimum external links', 'magic-checklists'),
                        'default' => 1,
                        'min' => 0,
                        'max' => 50
                    ],
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'internal_links' => [
                'label' => __('Internal Links', 'magic-checklists'),
                'description' => __('Content must have at least [X] internal links', 'magic-checklists'),
                'config_fields' => [
                    'min_internal_links' => [
                        'type' => 'number',
                        'label' => __('Minimum internal links', 'magic-checklists'),
                        'default' => 2,
                        'min' => 0,
                        'max' => 50
                    ],
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'title_length' => [
                'label' => __('Title Length', 'magic-checklists'),
                'description' => __('Title must be between [X] and [Y] characters', 'magic-checklists'),
                'config_fields' => [
                    'min_title_length' => [
                        'type' => 'number',
                        'label' => __('Minimum title length', 'magic-checklists'),
                        'default' => 10,
                        'min' => 1,
                        'max' => 200
                    ],
                    'max_title_length' => [
                        'type' => 'number',
                        'label' => __('Maximum title length', 'magic-checklists'),
                        'default' => 60,
                        'min' => 1,
                        'max' => 200
                    ],
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'meta_description' => [
                'label' => __('Meta Description', 'magic-checklists'),
                'description' => __('Meta description must be between [X] and [Y] characters', 'magic-checklists'),
                'config_fields' => [
                    'min_meta_length' => [
                        'type' => 'number',
                        'label' => __('Minimum meta description length', 'magic-checklists'),
                        'default' => 120,
                        'min' => 1,
                        'max' => 500
                    ],
                    'max_meta_length' => [
                        'type' => 'number',
                        'label' => __('Maximum meta description length', 'magic-checklists'),
                        'default' => 160,
                        'min' => 1,
                        'max' => 500
                    ],
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'meta_title' => [
                'label' => __('Meta Title', 'magic-checklists'),
                'description' => __('Meta title must be between [X] and [Y] characters', 'magic-checklists'),
                'config_fields' => [
                    'min_meta_title_length' => [
                        'type' => 'number',
                        'label' => __('Minimum meta title length', 'magic-checklists'),
                        'default' => 30,
                        'min' => 1,
                        'max' => 200
                    ],
                    'max_meta_title_length' => [
                        'type' => 'number',
                        'label' => __('Maximum meta title length', 'magic-checklists'),
                        'default' => 60,
                        'min' => 1,
                        'max' => 200
                    ],
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'image_alt_text' => [
                'label' => __('Image Alt Text', 'magic-checklists'),
                'description' => __('All images must have alt text for accessibility', 'magic-checklists'),
                'config_fields' => [
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'heading_count' => [
                'label' => __('Heading Count', 'magic-checklists'),
                'description' => __('Content must have specific heading counts (H2, H3, H4)', 'magic-checklists'),
                'config_fields' => [
                    'min_h2_headings' => [
                        'type' => 'number',
                        'label' => __('Minimum H2 headings', 'magic-checklists'),
                        'default' => 2,
                        'min' => 0,
                        'max' => 50
                    ],
                    'min_h3_headings' => [
                        'type' => 'number',
                        'label' => __('Minimum H3 headings', 'magic-checklists'),
                        'default' => 1,
                        'min' => 0,
                        'max' => 50
                    ],
                    'min_h4_headings' => [
                        'type' => 'number',
                        'label' => __('Minimum H4 headings', 'magic-checklists'),
                        'default' => 0,
                        'min' => 0,
                        'max' => 50
                    ],
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'image_count' => [
                'label' => __('Image Count', 'magic-checklists'),
                'description' => __('Content must have at least [X] images', 'magic-checklists'),
                'config_fields' => [
                    'min_images' => [
                        'type' => 'number',
                        'label' => __('Minimum images', 'magic-checklists'),
                        'default' => 1,
                        'min' => 0,
                        'max' => 50
                    ],
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => false
            ],
            'custom_field' => [
                'label' => __('Custom Field', 'magic-checklists'),
                'description' => __('Custom field must be filled', 'magic-checklists'),
                'config_fields' => [
                    'field_name' => [
                        'type' => 'select',
                        'label' => __('Custom field', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Select a custom field', 'magic-checklists'),
                        'options' => [] // Will be populated dynamically
                    ],
                    'field_label' => [
                        'type' => 'text',
                        'label' => __('Display name', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('e.g., Author Bio', 'magic-checklists')
                    ],
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => true,
                'repeatable' => true
            ],
            'custom_item' => [
                'label' => __('Custom Item', 'magic-checklists'),
                'description' => __('Manual verification required', 'magic-checklists'),
                'config_fields' => [
                    'item_title' => [
                        'type' => 'text',
                        'label' => __('Item title', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('e.g., Fact-check all statistics', 'magic-checklists')
                    ],
                    'item_description' => [
                        'type' => 'text',
                        'label' => __('Description (optional)', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Additional instructions...', 'magic-checklists')
                    ],
                    'use_custom_tip' => [
                        'type' => 'checkbox',
                        'label' => __('Use custom tip', 'magic-checklists'),
                        'default' => false
                    ],
                    'custom_tip' => [
                        'type' => 'text',
                        'label' => __('Custom helpful tip', 'magic-checklists'),
                        'default' => '',
                        'placeholder' => __('Enter your custom tip for this requirement...', 'magic-checklists')
                    ]
                ],
                'auto_check' => false,
                'repeatable' => true
            ]
        ];
    }
    
    /**
     * Clear publisher requirements for a checklist
     */
    public static function clear_publisher_requirements($checklist_id) {
        global $wpdb;
        
        $table = $wpdb->prefix . 'mcl_publisher_requirements';
        return $wpdb->delete($table, ['checklist_id' => $checklist_id], ['%d']);
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
