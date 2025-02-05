<?php
if (!defined('ABSPATH')) {
    exit;
}

class MCL_DB_Manager {
    private static $instance = null;
    private $db_version = '1.3'; // Increment version for new tables
    
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function install() {
        $this->create_tables();
        $this->maybe_upgrade();
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
    
        // Log any errors silently instead of outputting them
        if ($wpdb->last_error) {
            error_log('MCL DB Creation Error: ' . $wpdb->last_error);
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
    }

    public function uninstall() {
        global $wpdb;
        
        // Drop all plugin tables
        $tables = array(
            'mcl_invite_links',
            'mcl_notification_settings',
            'mcl_notification_queue'
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
            'mcl_notification_queue' => 'Notification queue table'
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
}