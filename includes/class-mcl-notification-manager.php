<?php

if (!defined('ABSPATH')) {
    exit;
}

class MCL_Notification_Manager {
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
        
        // Register notification processing hook
        add_action('mcl_process_notifications', array($this, 'process_notification_queue'));
        
        // Register all notification triggers
        add_action('mcl_item_added', array($this, 'queue_item_added_notification'), 10, 2);
        add_action('mcl_item_deleted', array($this, 'queue_item_deleted_notification'), 10, 2);
        add_action('mcl_item_checked', array($this, 'queue_item_checked_notification'), 10, 3);
        add_action('mcl_item_unchecked', array($this, 'queue_item_unchecked_notification'), 10, 3);

        if (!wp_next_scheduled('mcl_cleanup_notification_queue')) {
            wp_schedule_event(time(), 'daily', 'mcl_cleanup_notification_queue');
        }
        add_action('mcl_cleanup_notification_queue', array($this, 'cleanup_notification_queue'));
    }
    
    public function init() {
        // Add custom cron schedule
        add_filter('cron_schedules', array($this, 'add_cron_schedule'));

        // Schedule deadline check
        if (!wp_next_scheduled('mcl_check_deadlines')) {
            wp_schedule_event(time(), 'hourly', 'mcl_check_deadlines');
        }
        add_action('mcl_check_deadlines', array($this, 'check_deadlines'));
        
        // Schedule notification processing
        if (!wp_next_scheduled('mcl_process_notifications')) {
            wp_schedule_event(time(), 'fifteen_minutes', 'mcl_process_notifications');
        }
    }

    public function cleanup_notification_queue() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'mcl_notification_queue';
    
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
            'display' => __('Every 15 minutes', 'magic-checklists')
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
            // Since this method is hooked into mcl_item_checked, we know $checked is always true here.
            $event = 'check-item';
            $items = get_post_meta($checklist_id, '_mcl_items', true);
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
        $items = get_post_meta($checklist_id, '_mcl_items', true);
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
        $args = array(
            'post_type' => 'mcl_checklist',
            'posts_per_page' => -1,
            'meta_query' => array(
                array(
                    'key' => '_mcl_time_date',
                    'value' => '',
                    'compare' => '!='
                )
            )
        );
    
        $checklists = get_posts($args);
    
        foreach ($checklists as $checklist) {
            $settings = $this->get_notification_settings($checklist->ID);
    
            // Log retrieved settings
            if (!$settings) {
                error_log('No notification settings found for checklist ID: ' . $checklist->ID);
            } else {
                error_log('Checklist ID: ' . $checklist->ID . 
                          ' | notifications_enabled: ' . ($settings->notifications_enabled ? 'true' : 'false') . 
                          ' | notify_on_deadline: ' . ($settings->notify_on_deadline ? 'true' : 'false') . 
                          ' | deadline_threshold_hours: ' . $settings->deadline_threshold_hours);
            }
    
            if (!$settings || !$settings->notifications_enabled || !$settings->notify_on_deadline) {
                error_log('Skipping checklist ID: ' . $checklist->ID . ' due to settings not enabling deadline notifications.');
                continue;
            }
    
            $deadline = get_post_meta($checklist->ID, '_mcl_time_date', true);
            $threshold_hours = (int) $settings->deadline_threshold_hours;
            $hours_remaining = ($deadline - current_time('timestamp')) / 3600;
    
            if ($hours_remaining > 0 && $hours_remaining <= $threshold_hours) {
                $this->queue_notification($checklist->ID, 'deadline', 'deadline', array(
                    'deadline' => $deadline,
                    'hours_remaining' => $hours_remaining
                ));
            }
        } 
    }   

    public function queue_notification($checklist_id, $type, $event, $data = array()) {
    
        $settings = $this->get_notification_settings($checklist_id);
        if (!$settings) {
            error_log("No notification settings found for checklist_id=$checklist_id in queue_notification(). Aborting.");
            return;
        }
    
        $event_setting = "notify_on_" . str_replace('-', '_', $event);
        $is_event_enabled = isset($settings->$event_setting) && $settings->$event_setting;
    
        error_log("Event setting checked: $event_setting = " . ($is_event_enabled ? 'true' : 'false'));
    
        if (!$is_event_enabled) {
            error_log("Event $event is not enabled for checklist_id=$checklist_id. No notification queued.");
            return;
        }
    
        global $wpdb;
        $result = $wpdb->insert(
            $wpdb->prefix . 'mcl_notification_queue',
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
        } else {
            error_log("Notification queued successfully for checklist_id=$checklist_id. Insert ID: " . $wpdb->insert_id);
        }
    
        if ($settings->batch_interval === 'immediate') {
            error_log("Batch interval immediate, processing queue now for checklist_id=$checklist_id.");
            $this->process_notification_queue();
        }
    }    
    
    private function calculate_process_after($batch_interval) {
        $now = current_time('mysql');
        
        switch ($batch_interval) {
            case 'hourly':
                return date('Y-m-d H:00:00', strtotime('+1 hour', strtotime($now)));
            case 'daily':
                return date('Y-m-d 00:00:00', strtotime('+1 day', strtotime($now)));
            case 'immediate':
                return $now;
            default:
                return date('Y-m-d H:i:00', strtotime('+15 minutes', strtotime($now)));
        }
    }
    
    public function process_notification_queue() {
        global $wpdb;
        
        // Get unprocessed notifications that are ready to be sent
        $notifications = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}mcl_notification_queue 
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
            
            $wpdb->query($wpdb->prepare(
                "UPDATE {$wpdb->prefix}mcl_notification_queue 
                SET processed = 1, 
                    processed_at = %s 
                WHERE id IN (" . implode(',', $placeholders) . ")",
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
            __('[%s] Checklist Update Notification', 'magic-checklists'),
            get_bloginfo('name')
        );
        
        $message = sprintf(
            __("Updates for checklist: %s\n\n", 'magic-checklists'),
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
            return;
        }
        
        $checklist = get_post($settings->checklist_id);
        if (!$checklist) {
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
        
        wp_remote_post($settings->slack_webhook_url, array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => wp_json_encode(array('blocks' => $blocks)),
            'timeout' => 15
        ));
    }
    
    private function send_discord_notifications($settings, $notifications) {
        if (empty($settings->discord_webhook_url)) {
            return;
        }
        
        $checklist = get_post($settings->checklist_id);
        if (!$checklist) {
            return;
        }
        
        $message = sprintf('**Updates for Checklist: %s**', $checklist->post_title) . "\n\n";
        
        foreach ($notifications as $notification) {
            $data = maybe_unserialize($notification->data);
            $message .= $this->format_notification_message($notification->event, $data) . "\n";
        }
        
        wp_remote_post($settings->discord_webhook_url, array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => wp_json_encode(array('content' => $message)),
            'timeout' => 15
        ));
    }

    private function format_email_content($notifications, $checklist) {
        $content = sprintf(
            __("Updates for checklist: %s\n\n", 'magic-checklists'),
            $checklist->post_title
        );
        
        foreach ($notifications as $notification) {
            $data = maybe_unserialize($notification->data);
            $content .= $this->format_notification_message($notification->event, $data) . "\n\n";
        }
        
        $content .= sprintf(
            __("\nView checklist: %s", 'magic-checklists'),
            admin_url('admin.php?page=mcl_checklists&checklist_id=' . $checklist->ID)
        );
        
        return $content;
    }
    
    private function format_slack_payload($notifications, $checklist) {
        $blocks = array(
            array(
                'type' => 'header',
                'text' => array(
                    'type' => 'plain_text',
                    'text' => sprintf(__('Updates for Checklist: %s', 'magic-checklists'), $checklist->post_title)
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
                    __('*<<%s|View Checklist>>*', 'magic-checklists'),
                    admin_url('admin.php?page=mcl_checklists&checklist_id=' . $checklist->ID)
                )
            )
        );
        
        return array('blocks' => $blocks);
    }
    
    private function format_discord_payload($notifications, $checklist) {
        $content = sprintf(
            "**%s**\n\n",
            sprintf(__('Updates for Checklist: %s', 'magic-checklists'), $checklist->post_title)
        );
        
        foreach ($notifications as $notification) {
            $data = maybe_unserialize($notification->data);
            $content .= $this->format_notification_message($notification->event, $data, 'discord') . "\n";
        }
        
        $content .= sprintf(
            "\n[%s](%s)",
            __('View Checklist', 'magic-checklists'),
            admin_url('admin.php?page=mcl_checklists&checklist_id=' . $checklist->ID)
        );
        
        return array('content' => $content);
    }
    
    private function format_notification_message($event, $data, $platform = 'email') {
        $user = isset($data['user']) ? $data['user'] : __('Someone', 'magic-checklists');
        
        switch ($event) {
            case 'new-item':
                return sprintf(
                    __('✨ %s added new item: %s', 'magic-checklists'),
                    $user,
                    $data['item']['content']
                );
                
            case 'delete-item':
                return sprintf(
                    __('🗑️ %s deleted item: %s', 'magic-checklists'),
                    $user,
                    $data['item']['content']
                );
                
            case 'check-item':
                return sprintf(
                    __('✅ %s checked off: %s', 'magic-checklists'),
                    $user,
                    $data['item_content']
                );
                
            case 'uncheck-item':
                return sprintf(
                    __('↩️ %s unchecked: %s', 'magic-checklists'),
                    $user,
                    $data['item_content']
                );
                
            case 'deadline':
                $hours = ceil($data['hours_remaining']);
                return sprintf(
                    __('⏰ Deadline approaching! %d hours remaining', 'magic-checklists'),
                    $hours
                );
                
            default:
                return sprintf(
                    __('Update event: %s', 'magic-checklists'),
                    $event
                );
        }
    }
    
    public function get_notification_settings($checklist_id) {
        global $wpdb;
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}mcl_notification_settings WHERE checklist_id = %d",
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
            'deadline_threshold_hours' => absint($settings['deadline_threshold_hours']),
            'batch_interval' => in_array($settings['batch_interval'], array('immediate', 'fifteen_minutes', 'hourly', 'daily')) 
                ? $settings['batch_interval'] 
                : 'fifteen_minutes'
        );
        
        if ($existing) {
            $wpdb->update(
                $wpdb->prefix . 'mcl_notification_settings',
                $data,
                array('checklist_id' => $checklist_id)
            );
        } else {
            $wpdb->insert(
                $wpdb->prefix . 'mcl_notification_settings',
                $data
            );
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

MCL_Notification_Manager::get_instance();