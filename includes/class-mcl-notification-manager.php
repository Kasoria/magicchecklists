<?php

if (!defined('ABSPATH')) {
    exit;
}

class MAGICCL_Notification_Manager {
    private static $instance = null;
    private $default_batch_interval = 'fifteen_minutes';
    private $processing_notification = false;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {

        // Core initialization
        add_action('init', array($this, 'init'));
        
        // IMMEDIATE deadline checking - don't wait for init
        add_action('plugins_loaded', array($this, 'setup_deadline_checking'), 999);
        
        // Register notification processing hook
        add_action('magiccl_process_notifications', array($this, 'process_notification_queue'));
        
        // Register all notification triggers
        add_action('magiccl_item_added', array($this, 'queue_item_added_notification'), 10, 2);
        add_action('magiccl_item_deleted', array($this, 'queue_item_deleted_notification'), 10, 2);
        add_action('magiccl_item_checked', array($this, 'queue_item_checked_notification'), 10, 3);
        add_action('magiccl_item_unchecked', array($this, 'queue_item_unchecked_notification'), 10, 3);
        
        if (!wp_next_scheduled('magiccl_cleanup_notification_queue')) {
            wp_schedule_event(time(), 'daily', 'magiccl_cleanup_notification_queue');
        }
        add_action('magiccl_cleanup_notification_queue', array($this, 'cleanup_notification_queue'));
        
        // FORCE immediate check if we can
        if (did_action('init')) {
            $this->run_deadline_check_safely();
        } else {
            error_log("MAGICCL: init not fired yet, waiting for hooks");
        }
    }
    
    /**
     * Run deadline check safely (checks if database is ready)
     */
    public function run_deadline_check_safely() {
        global $wpdb;
        
        // Check if database tables exist
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$wpdb->prefix}magiccl_notification_settings'");
        if (!$table_exists) {
            error_log("MAGICCL: Database tables not ready yet");
            return;
        }
        
        $this->check_deadlines();
    }
    
    /**
     * Setup deadline checking hooks early
     */
    public function setup_deadline_checking() {
        
        // Run check immediately when this is called
        $this->run_deadline_check_safely();
        
        // Hook into various WordPress actions for checking
        add_action('admin_head', array($this, 'force_deadline_check'));
        add_action('wp_head', array($this, 'force_deadline_check'));
        add_action('admin_footer', array($this, 'force_deadline_check'));
        add_action('wp_footer', array($this, 'force_deadline_check'));
    }
    
    public function init() {
        error_log("MAGICCL: init() called");
        
        // Add custom cron schedule
        add_filter('cron_schedules', array($this, 'add_cron_schedule'));

        // Schedule deadline check - more frequent for immediate notifications
        if (!wp_next_scheduled('magiccl_check_deadlines')) {
            wp_schedule_event(time(), 'fifteen_minutes', 'magiccl_check_deadlines');
        }
        add_action('magiccl_check_deadlines', array($this, 'check_deadlines'));
        
        // Add manual trigger for testing
        add_action('admin_init', function() {
            if (isset($_GET['magiccl_test_deadlines']) && current_user_can('manage_options')) {
                check_admin_referer('magiccl_test_deadlines');
                error_log("MAGICCL: Manual deadline check triggered");
                $this->check_deadlines();
                wp_die('Deadline check completed. Check logs.');
            }

            // Also run check on every admin_init
            $this->force_deadline_check();
        });

        // Add AJAX endpoint for testing
        add_action('wp_ajax_magiccl_test_deadlines', array($this, 'ajax_test_deadlines'));
        
        // Schedule notification processing
        if (!wp_next_scheduled('magiccl_process_notifications')) {
            wp_schedule_event(time(), 'fifteen_minutes', 'magiccl_process_notifications');
        }
        
        // Check deadlines on every page load if we have immediate notifications and triggers are due
        add_action('wp_loaded', array($this, 'check_immediate_deadlines'));
        
        // Also check on WordPress heartbeat for more frequent checking
        add_filter('heartbeat_received', array($this, 'heartbeat_check_deadlines'), 10, 2);
        add_filter('heartbeat_nopriv_received', array($this, 'heartbeat_check_deadlines'), 10, 2);
    }

    public function cleanup_notification_queue() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'magiccl_notification_queue';
    
        // Delete all processed notifications that have a processed_at date
        $result = $wpdb->query("DELETE FROM $table_name WHERE processed = 1 AND processed_at IS NOT NULL");
    
        if ($result === false) {
            error_log("Failed to cleanup notification queue. Error: " . $wpdb->last_error);
        } else {
            error_log("Notification queue cleanup successful. $result rows deleted.");
        }
    }
    
    public function add_cron_schedule($schedules) {
        $schedules['fifteen_minutes'] = array(
            'interval' => 15 * 60,
            'display' => __('Every 15 minutes', 'magicchecklists')
        );
        return $schedules;
    }

    public function queue_item_added_notification($checklist_id, $item) {
        $this->queue_notification($checklist_id, 'item', 'new-item', array(
            'item' => $item,
            'user' => wp_get_current_user()->display_name
        ));
    }

    public function queue_item_deleted_notification($checklist_id, $item) {
        $this->queue_notification($checklist_id, 'item', 'delete-item', array(
            'item' => $item,
            'user' => wp_get_current_user()->display_name
        ));
    }

    /**
     * Queue item checked/unchecked notification
     */
    public function queue_item_checked_notification($checklist_id, $item_id, $checked) {
        try {
            // Since this method is hooked into magiccl_item_checked, we know $checked is always true here.
            $event = 'check-item';
            $items = get_post_meta($checklist_id, '_magiccl_items', true);
            $item_content = '';
    
            foreach ($items as $item) {
                if ($item['id'] === $item_id) {
                    $item_content = $item['content'];
                    break;
                }
            }
    
            $this->queue_notification($checklist_id, 'item', $event, array(
                'item_id' => $item_id,
                'item_content' => $item_content,
                'user' => wp_get_current_user()->display_name
            ));
        } catch (Exception $e) {
            error_log('Error in queue_item_checked_notification: ' . $e->getMessage());
        }
    }    

    public function queue_item_unchecked_notification($checklist_id, $item_id, $checked) {
        $event = 'uncheck-item';
        $items = get_post_meta($checklist_id, '_magiccl_items', true);
        $item_content = '';
    
        foreach ($items as $item) {
            if ($item['id'] === $item_id) {
                $item_content = $item['content'];
                break;
            }
        }
    
        $this->queue_notification($checklist_id, 'item', $event, array(
            'item_id' => $item_id,
            'item_content' => $item_content,
            'user' => wp_get_current_user()->display_name
        ));
    }       

    public function check_deadlines() {
        
        // Get ALL checklists with deadlines - much simpler query
        global $wpdb;
        // Use UTC timestamp since deadlines are now stored in UTC
        $current_timestamp = time();
        
        $query = "
            SELECT p.ID, p.post_title, 
                   pm1.meta_value as deadline,
                   pm2.meta_value as notification_sent
            FROM {$wpdb->posts} p
            INNER JOIN {$wpdb->postmeta} pm1 ON p.ID = pm1.post_id AND pm1.meta_key = '_magiccl_time_date'
            LEFT JOIN {$wpdb->postmeta} pm2 ON p.ID = pm2.post_id AND pm2.meta_key = '_magiccl_deadline_notification_sent'
            WHERE p.post_type = 'magiccl_checklist' 
            AND p.post_status = 'publish'
            AND pm1.meta_value != ''
        ";
        
        $checklists = $wpdb->get_results($query); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Static query with no user input
        
        foreach ($checklists as $checklist) {
            
            $settings = $this->get_notification_settings($checklist->ID);
            
            // Log settings
            if (!$settings) {
                continue;
            }
            
            // Skip if notifications not enabled
            if (!$settings->notifications_enabled || !$settings->notify_on_deadline) {
                continue;
            }
            
            // Deadline is now stored as UTC timestamp
            $deadline_timestamp = is_numeric($checklist->deadline) ? (int) $checklist->deadline : strtotime($checklist->deadline);
            
            // Skip if deadline has passed
            if ($deadline_timestamp <= $current_timestamp) {
                continue;
            }
            
            // Calculate when notification should trigger
            $threshold_hours = (int) $settings->deadline_threshold_hours;
            
            if ($threshold_hours <= 0) {
                continue;
            }
            
            $should_trigger_at = $deadline_timestamp - ($threshold_hours * 3600);
            
            // Check if we should send notification NOW
            if ($current_timestamp >= $should_trigger_at) {
                
                // Check if we already sent this notification
                $notification_sent = $checklist->notification_sent;
                
                if ($notification_sent != $deadline_timestamp) {
                    $hours_remaining = round(($deadline_timestamp - $current_timestamp) / 3600, 1);

                    $this->queue_notification($checklist->ID, 'deadline', 'deadline', array(
                        'deadline' => $deadline_timestamp,
                        'hours_remaining' => $hours_remaining
                    ));
                    
                    // Mark as sent for THIS specific deadline
                    update_post_meta($checklist->ID, '_magiccl_deadline_notification_sent', $deadline_timestamp);
                }
            }
        }
    }   

    /**
     * Update the deadline trigger time based on deadline and threshold
     * SIMPLIFIED: We don't actually need to store trigger times anymore
     */
    public function update_deadline_trigger_time($checklist_id, $deadline = null, $threshold_hours = null) {
        // Clear any old notification sent markers when deadline changes
        if ($deadline !== null) {
            delete_post_meta($checklist_id, '_magiccl_deadline_notification_sent');
        }
        
        // We don't need to calculate or store trigger times anymore
        // The check_deadlines function will calculate them on the fly
        delete_post_meta($checklist_id, '_magiccl_deadline_trigger_time');
    }
    
    /**
     * Schedule next deadline check based on urgency and settings
     */
    public function schedule_next_deadline_check() {
        // Check if any checklist has immediate notification settings
        global $wpdb;
        $immediate_settings = $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->prefix}magiccl_notification_settings 
             WHERE notifications_enabled = 1 
             AND notify_on_deadline = 1 
             AND batch_interval = 'immediate'"
        );
        
        if ($immediate_settings > 0) {
            // If there are immediate notifications, check every 5 minutes
            $next_check = time() + (5 * 60);
            if (!wp_next_scheduled('magiccl_check_deadlines') || wp_next_scheduled('magiccl_check_deadlines') > $next_check) {
                wp_clear_scheduled_hook('magiccl_check_deadlines');
                wp_schedule_single_event($next_check, 'magiccl_check_deadlines');
                error_log("MAGICCL: Scheduled next deadline check in 5 minutes due to immediate notifications");
            }
        }
    }
    
    /**
     * Force deadline check on every page load (aggressive mode)
     */
    public function force_deadline_check() {
        // Only run for logged in users
        if (!is_user_logged_in()) {
            return;
        }
        
        // Use a very short cache - 10 seconds
        $last_check = get_transient('magiccl_force_deadline_check');
        $now = time();
        
        if ($last_check && ($now - $last_check) < 10) {
            return;
        }
        
        // Run the check immediately
        $this->check_deadlines();
        
        // Update the last check time
        set_transient('magiccl_force_deadline_check', $now, 10);
    }
    
    /**
     * Check for immediate deadline notifications on page loads
     * This ensures deadlines are checked even if WordPress cron isn't running
     */
    public function check_immediate_deadlines() {
        // Check more frequently - every 30 seconds
        $last_check = get_transient('magiccl_last_immediate_deadline_check');
        $now = time();
        
        // Check at most every 30 seconds
        if ($last_check && ($now - $last_check) < 30) {
            return;
        }
        
        // Just run the check - simpler is better
        $this->check_deadlines();
        
        // Update the last check time
        set_transient('magiccl_last_immediate_deadline_check', $now, 60); // 1 minute expiry
    }

    /**
     * Hook into WordPress heartbeat API to check deadlines.
     *
     * @param array $response Heartbeat response data.
     * @param array $data     Heartbeat request data.
     * @return array
     */
    public function heartbeat_check_deadlines($response, $data) {
        $this->check_immediate_deadlines();
        return $response;
    }

    public function ajax_test_deadlines() {
        check_ajax_referer('magiccl_admin_nonce', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_die('Permission denied');
        }
        
        error_log("MAGICCL: AJAX deadline check triggered");
        $this->check_deadlines();
        
        echo "Deadline check completed. Check debug.log for results.";
        wp_die();
    }

    public function queue_notification($checklist_id, $type, $event, $data = array()) {
        $settings = $this->get_notification_settings($checklist_id);
        if (!$settings) {
            return;
        }
    
        // Special handling for deadline events
        if ($event === 'deadline') {
            $is_event_enabled = $settings->notify_on_deadline;
        } else {
            $event_setting = "notify_on_" . str_replace('-', '_', $event);
            $is_event_enabled = isset($settings->$event_setting) && $settings->$event_setting;
        }
        
        if (!$is_event_enabled) {
            return;
        }
    
        global $wpdb;
        $result = $wpdb->insert(
            $wpdb->prefix . 'magiccl_notification_queue',
            array(
                'checklist_id' => $checklist_id,
                'type'         => $type,
                'event'        => $event,
                'data'         => maybe_serialize($data),
                'created_at'   => current_time('mysql'),
                'process_after'=> $this->calculate_process_after($settings->batch_interval ?: $this->default_batch_interval),
                'processed'    => 0
            ),
            array('%d', '%s', '%s', '%s', '%s', '%s', '%d')
        );
    
        if ($result === false) {
            error_log("Failed to insert notification into queue for checklist_id=$checklist_id. Error: " . $wpdb->last_error);
        }
    
        // ALWAYS process immediately for deadline notifications OR immediate batch interval
        if ($event === 'deadline' || $settings->batch_interval === 'immediate') {
            $this->process_notification_queue();
        }
    }
    
    private function calculate_process_after($batch_interval) {
        $now = current_time('mysql');
        
        switch ($batch_interval) {
            case 'hourly':
                return wp_date('Y-m-d H:00:00', strtotime('+1 hour', strtotime($now)));
            case 'daily':
                return wp_date('Y-m-d 00:00:00', strtotime('+1 day', strtotime($now)));
            case 'immediate':
                return $now;
            default:
                return wp_date('Y-m-d H:i:00', strtotime('+15 minutes', strtotime($now)));
        }
    }
    
    public function process_notification_queue() {
        global $wpdb;
        
        // Get unprocessed notifications that are ready to be sent
        $notifications = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}magiccl_notification_queue 
            WHERE processed = 0 
            AND process_after <= %s 
            ORDER BY checklist_id, created_at ASC",
            current_time('mysql')
        ));
        
        if (empty($notifications)) {
            return;
        }
        
        // Group notifications by checklist
        $grouped = array();
        foreach ($notifications as $notification) {
            $checklist_id = $notification->checklist_id;
            if (!isset($grouped[$checklist_id])) {
                $grouped[$checklist_id] = array();
            }
            $grouped[$checklist_id][] = $notification;
        }
        
        // Process each group
        foreach ($grouped as $checklist_id => $checklist_notifications) {
            $settings = $this->get_notification_settings($checklist_id);
            if (!$settings || !$settings->notifications_enabled) {
                continue;
            }
            
            // Process email notifications
            if ($settings->email_enabled) {
                $this->send_email_notifications($settings, $checklist_notifications);
            }
            
            // Process Slack notifications
            if ($settings->integration_enabled && !empty($settings->slack_webhook_url)) {
                $this->send_slack_notifications($settings, $checklist_notifications);
            }
            
            // Process Discord notifications
            if ($settings->integration_enabled && !empty($settings->discord_webhook_url)) {
                $this->send_discord_notifications($settings, $checklist_notifications);
            }
            
            // Mark notifications as processed
            $notification_ids = wp_list_pluck($checklist_notifications, 'id');
            $placeholders = array_fill(0, count($notification_ids), '%d');
            
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Placeholders are generated safely via array_fill with %d
            $wpdb->query($wpdb->prepare(
                "UPDATE {$wpdb->prefix}magiccl_notification_queue
                SET processed = 1,
                    processed_at = %s
                WHERE id IN (" . implode(',', $placeholders) . ")", // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Placeholders generated via array_fill
                array_merge([current_time('mysql')], $notification_ids)
            ));
        }
    }
    
    private function send_email_notifications($settings, $notifications) {
        if (empty($settings->email_recipients)) {
            return;
        }
        
        $checklist = get_post($settings->checklist_id);
        if (!$checklist) {
            return;
        }
        
        $subject = sprintf(
            /* translators: %s: site name */
            __('[%s] Checklist Update Notification', 'magicchecklists'),
            get_bloginfo('name')
        );

        $message = sprintf(
            /* translators: %s: checklist title */
            __("Updates for checklist: %s\n\n", 'magicchecklists'),
            $checklist->post_title
        );

        foreach ($notifications as $notification) {
            $data = maybe_unserialize($notification->data);
            $message .= $this->format_notification_message($notification->event, $data) . "\n";
        }
        
        $recipients = array_map('trim', explode(',', $settings->email_recipients));
        foreach ($recipients as $recipient) {
            wp_mail($recipient, $subject, $message);
        }
    }
    
    private function send_slack_notifications($settings, $notifications) {
        if (empty($settings->slack_webhook_url)) {
            error_log("MAGICCL: Slack webhook URL is empty");
            return;
        }
        
        $checklist = get_post($settings->checklist_id);
        if (!$checklist) {
            error_log("MAGICCL: Could not find checklist post for ID: " . $settings->checklist_id);
            return;
        }
        
        $blocks = array(
            array(
                'type' => 'header',
                'text' => array(
                    'type' => 'plain_text',
                    'text' => sprintf('Updates for Checklist: %s', $checklist->post_title)
                )
            )
        );
        
        foreach ($notifications as $notification) {
            $data = maybe_unserialize($notification->data);
            $blocks[] = array(
                'type' => 'section',
                'text' => array(
                    'type' => 'mrkdwn',
                    'text' => $this->format_notification_message($notification->event, $data)
                )
            );
        }
        
        $response = wp_remote_post($settings->slack_webhook_url, array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => wp_json_encode(array('blocks' => $blocks)),
            'timeout' => 15
        ));
        
        if (is_wp_error($response)) {
            error_log("MAGICCL: Slack webhook failed: " . $response->get_error_message());
        } else {
            $response_code = wp_remote_retrieve_response_code($response);
            if ($response_code !== 200) {
                $body = wp_remote_retrieve_body($response);
                error_log("MAGICCL: Slack webhook error response: " . $body);
            }
        }
    }
    
    private function send_discord_notifications($settings, $notifications) {
        if (empty($settings->discord_webhook_url)) {
            error_log("MAGICCL: Discord webhook URL is empty");
            return;
        }
        
        $checklist = get_post($settings->checklist_id);
        if (!$checklist) {
            error_log("MAGICCL: Could not find checklist post for ID: " . $settings->checklist_id);
            return;
        }
        
        $message = sprintf('**Updates for Checklist: %s**', $checklist->post_title) . "\n\n";
        
        foreach ($notifications as $notification) {
            $data = maybe_unserialize($notification->data);
            $message .= $this->format_notification_message($notification->event, $data) . "\n";
        }
        
        $response = wp_remote_post($settings->discord_webhook_url, array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => wp_json_encode(array('content' => $message)),
            'timeout' => 15
        ));
        
        if (is_wp_error($response)) {
            error_log("MAGICCL: Discord webhook failed: " . $response->get_error_message());
        } else {
            $response_code = wp_remote_retrieve_response_code($response);
            if ($response_code !== 204) {
                $body = wp_remote_retrieve_body($response);
                error_log("MAGICCL: Discord webhook error response: " . $body);
            }
        }
    }

    private function format_email_content($notifications, $checklist) {
        $content = sprintf(
            /* translators: %s: checklist title */
            __("Updates for checklist: %s\n\n", 'magicchecklists'),
            $checklist->post_title
        );

        foreach ($notifications as $notification) {
            $data = maybe_unserialize($notification->data);
            $content .= $this->format_notification_message($notification->event, $data) . "\n\n";
        }

        $content .= sprintf(
            /* translators: %s: checklist URL */
            __("\nView checklist: %s", 'magicchecklists'),
            admin_url('admin.php?page=magiccl_checklists&checklist_id=' . $checklist->ID)
        );
        
        return $content;
    }
    
    private function format_slack_payload($notifications, $checklist) {
        $blocks = array(
            array(
                'type' => 'header',
                'text' => array(
                    'type' => 'plain_text',
                    /* translators: %s: checklist title */
                    'text' => sprintf(__('Updates for Checklist: %s', 'magicchecklists'), $checklist->post_title)
                )
            )
        );

        foreach ($notifications as $notification) {
            $data = maybe_unserialize($notification->data);
            $blocks[] = array(
                'type' => 'section',
                'text' => array(
                    'type' => 'mrkdwn',
                    'text' => $this->format_notification_message($notification->event, $data, 'slack')
                )
            );
        }

        $blocks[] = array(
            'type' => 'section',
            'text' => array(
                'type' => 'mrkdwn',
                'text' => sprintf(
                    /* translators: %s: checklist URL */
                    __('*<<%s|View Checklist>>*', 'magicchecklists'),
                    admin_url('admin.php?page=magiccl_checklists&checklist_id=' . $checklist->ID)
                )
            )
        );
        
        return array('blocks' => $blocks);
    }
    
    private function format_discord_payload($notifications, $checklist) {
        $content = sprintf(
            "**%s**\n\n",
            /* translators: %s: checklist title */
            sprintf(__('Updates for Checklist: %s', 'magicchecklists'), $checklist->post_title)
        );

        foreach ($notifications as $notification) {
            $data = maybe_unserialize($notification->data);
            $content .= $this->format_notification_message($notification->event, $data, 'discord') . "\n";
        }

        $content .= sprintf(
            "\n[%s](%s)",
            __('View Checklist', 'magicchecklists'),
            admin_url('admin.php?page=magiccl_checklists&checklist_id=' . $checklist->ID)
        );
        
        return array('content' => $content);
    }
    
    private function format_notification_message($event, $data, $platform = 'email') {
        $user = isset($data['user']) ? $data['user'] : __('Someone', 'magicchecklists');
        
        switch ($event) {
            case 'new-item':
                return sprintf(
                    /* translators: 1: user name, 2: item content */
                    __('✨ %1$s added new item: %2$s', 'magicchecklists'),
                    $user,
                    $data['item']['content']
                );

            case 'delete-item':
                return sprintf(
                    /* translators: 1: user name, 2: item content */
                    __('🗑️ %1$s deleted item: %2$s', 'magicchecklists'),
                    $user,
                    $data['item']['content']
                );

            case 'check-item':
                return sprintf(
                    /* translators: 1: user name, 2: item content */
                    __('✅ %1$s checked off: %2$s', 'magicchecklists'),
                    $user,
                    $data['item_content']
                );

            case 'uncheck-item':
                return sprintf(
                    /* translators: 1: user name, 2: item content */
                    __('↩️ %1$s unchecked: %2$s', 'magicchecklists'),
                    $user,
                    $data['item_content']
                );

            case 'deadline':
                $hours = ceil($data['hours_remaining']);
                return sprintf(
                    /* translators: %d: number of hours remaining */
                    __('⏰ Deadline approaching! %d hours remaining', 'magicchecklists'),
                    $hours
                );

            case 'comments':
                $item_context = isset($data['item_content']) ? ' on "' . wp_strip_all_tags($data['item_content']) . '"' : '';
                if (isset($data['reply_comment_id'])) {
                    return sprintf(
                        /* translators: 1: user name, 2: item context */
                        __('💬 %1$s replied to a comment%2$s', 'magicchecklists'),
                        $user,
                        $item_context
                    );
                } else {
                    $content = isset($data['comment_content']) ? wp_strip_all_tags($data['comment_content']) : 'a comment';
                    $preview = strlen($content) > 50 ? substr($content, 0, 50) . '...' : $content;
                    return sprintf(
                        /* translators: 1: user name, 2: item context, 3: comment preview */
                        __('💬 %1$s added a comment%2$s: "%3$s"', 'magicchecklists'),
                        $user,
                        $item_context,
                        $preview
                    );
                }

            default:
                return sprintf(
                    /* translators: %s: event name */
                    __('Update event: %s', 'magicchecklists'),
                    $event
                );
        }
    }
    
    public function get_notification_settings($checklist_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'magiccl_notification_settings';
        
        // Check if table exists first
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") == $table_name;
        if (!$table_exists) {
            error_log("MAGICCL: Notification settings table does not exist! Attempting to create tables...");
            // Force table creation
            $db_manager = MAGICCL_DB_Manager::get_instance();
            $db_manager->install();
            error_log("MAGICCL: Tables creation attempted. Checking again...");
            $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") == $table_name;
            error_log("MAGICCL: Table exists after creation attempt: " . ($table_exists ? 'YES' : 'NO'));
        }
        
        // Check if notify_on_comments column exists
        if ($table_exists) {
            $column_exists = $wpdb->get_results("SHOW COLUMNS FROM $table_name LIKE 'notify_on_comments'");
            if (empty($column_exists)) {
                error_log("MAGICCL: notify_on_comments column missing! Forcing database upgrade...");
                $db_manager = MAGICCL_DB_Manager::get_instance();
                $db_manager->force_upgrade();
                error_log("MAGICCL: Database upgrade completed.");
            }
        }
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}magiccl_notification_settings WHERE checklist_id = %d",
            $checklist_id
        ));
    }
    
    public function save_notification_settings($checklist_id, $settings) {
        global $wpdb;
        
        $existing = $this->get_notification_settings($checklist_id);
        
        $data = array(
            'checklist_id' => $checklist_id,
            'notifications_enabled' => !empty($settings['notifications_enabled']),
            'email_enabled' => !empty($settings['email_enabled']),
            'integration_enabled' => !empty($settings['integration_enabled']),
            'email_recipients' => sanitize_text_field($settings['email_recipients']),
            'slack_webhook_url' => esc_url_raw($settings['slack_webhook_url']),
            'discord_webhook_url' => esc_url_raw($settings['discord_webhook_url']),
            'notify_on_new_item' => !empty($settings['notify_on_new_item']),
            'notify_on_delete_item' => !empty($settings['notify_on_delete_item']),
            'notify_on_check_item' => !empty($settings['notify_on_check_item']),
            'notify_on_uncheck_item' => !empty($settings['notify_on_uncheck_item']),
            'notify_on_deadline' => !empty($settings['notify_on_deadline']),
            'notify_on_comments' => !empty($settings['notify_on_comments']),
            'deadline_threshold_hours' => absint($settings['deadline_threshold_hours']),
            'batch_interval' => in_array($settings['batch_interval'], array('immediate', 'fifteen_minutes', 'hourly', 'daily')) 
                ? $settings['batch_interval'] 
                : 'fifteen_minutes'
        );
        
        if ($existing) {
            $result = $wpdb->update(
                $wpdb->prefix . 'magiccl_notification_settings',
                $data,
                array('checklist_id' => $checklist_id)
            );
            if ($result === false) {
                error_log("MAGICCL: Update failed. Error: " . $wpdb->last_error);
            }
        } else {
            $result = $wpdb->insert(
                $wpdb->prefix . 'magiccl_notification_settings',
                $data
            );
            if ($result === false) {
                error_log("MAGICCL: Insert failed. Error: " . $wpdb->last_error);
            }
        }
        
        // Clear any old notification sent markers when settings change
        if (!empty($settings['notify_on_deadline'])) {
            // Clear the sent marker so notification can be re-sent with new settings
            delete_post_meta($checklist_id, '_magiccl_deadline_notification_sent');
        }
    }

    public function queue_checklist_updated_notification($checklist_id, $data = array()) {
        if (!$this->should_notify($checklist_id, 'items-updated')) {
            return;
        }
    
        $this->queue_notification(
            $checklist_id,
            'update',
            'items-updated',
            array(
                'items' => $data['items'] ?? array(),
                'user' => wp_get_current_user()->display_name
            )
        );
    }
    
    private function should_notify($checklist_id, $event) {
        $settings = $this->get_notification_settings($checklist_id);
        if (!$settings || !$settings->notifications_enabled) {
            return false;
        }
    
        $event_setting = 'notify_on_' . str_replace('-', '_', $event);
        return isset($settings->$event_setting) && $settings->$event_setting;
    }
}

MAGICCL_Notification_Manager::get_instance();