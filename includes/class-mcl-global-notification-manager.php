<?php

if (!defined('ABSPATH')) {
    exit;
}

class MAGICCL_Global_Notification_Manager {
    private static $instance = null;
    private $default_batch_interval = 'fifteen_minutes';
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Core initialization
        add_action('init', array($this, 'init'));
        
        // Register global notification processing hook
        add_action('magiccl_process_global_notifications', array($this, 'process_global_notification_queue'));
        
        // Hook into comment events
        add_action('magiccl_comment_added', array($this, 'queue_comment_notification'), 10, 3);
        add_action('magiccl_comment_liked', array($this, 'queue_comment_like_notification'), 10, 3);
        add_action('magiccl_comment_replied', array($this, 'queue_comment_reply_notification'), 10, 4);

        // Cleanup global notifications
        if (!wp_next_scheduled('magiccl_cleanup_global_notification_queue')) {
            wp_schedule_event(time(), 'daily', 'magiccl_cleanup_global_notification_queue');
        }
        add_action('magiccl_cleanup_global_notification_queue', array($this, 'cleanup_global_notification_queue'));
    }
    
    public function init() {
        // Schedule global notification processing
        if (!wp_next_scheduled('magiccl_process_global_notifications')) {
            wp_schedule_event(time(), 'fifteen_minutes', 'magiccl_process_global_notifications');
        }
    }

    public function cleanup_global_notification_queue() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'magiccl_global_notifications';
    
        // Delete all processed notifications older than 30 days
        $result = $wpdb->query($wpdb->prepare(
            "DELETE FROM $table_name WHERE processed = 1 AND processed_at < %s",
            wp_date('Y-m-d H:i:s', strtotime('-30 days'))
        ));
    
        if ($result === false) {
            error_log("Failed to cleanup global notification queue. Error: " . $wpdb->last_error);
        } else {
            error_log("Global notification queue cleanup successful. $result rows deleted.");
        }
    }

    /**
     * Queue comment added notification
     */
    public function queue_comment_notification($checklist_id, $item_id, $comment_data) {
        // Get the item content from the checklist
        $item_content = $this->get_item_content($checklist_id, $item_id);
        
        // Use regular notification manager to queue comment notifications
        $notification_manager = MAGICCL_Notification_Manager::get_instance();
        $notification_manager->queue_notification($checklist_id, 'comment', 'comments', array(
            'item_id' => $item_id,
            'item_content' => $item_content,
            'comment_id' => $comment_data['id'] ?? null,
            'comment_content' => $comment_data['content'] ?? '',
            'user' => wp_get_current_user()->display_name
        ));
    }

    /**
     * Queue comment liked notification
     */
    public function queue_comment_like_notification($comment_id, $checklist_id, $item_id) {
        $current_user = wp_get_current_user();
        
        $this->queue_global_notification(
            'checklist',
            $checklist_id,
            'comment',
            'comment-liked',
            array(
                'checklist_id' => $checklist_id,
                'item_id' => $item_id,
                'comment_id' => $comment_id,
                'user_id' => $current_user->ID,
                'user_name' => $current_user->display_name,
                'user_email' => $current_user->user_email
            )
        );
    }

    /**
     * Queue comment reply notification
     */
    public function queue_comment_reply_notification($parent_comment_id, $reply_comment_id, $checklist_id, $item_id) {
        // Get the item content from the checklist
        $item_content = $this->get_item_content($checklist_id, $item_id);
        
        // Use regular notification manager to queue reply notifications  
        $notification_manager = MAGICCL_Notification_Manager::get_instance();
        $notification_manager->queue_notification($checklist_id, 'comment', 'comments', array(
            'item_id' => $item_id,
            'item_content' => $item_content,
            'parent_comment_id' => $parent_comment_id,
            'reply_comment_id' => $reply_comment_id,
            'comment_content' => 'replied to a comment',
            'user' => wp_get_current_user()->display_name
        ));
    }

    /**
     * Queue a global notification
     */
    public function queue_global_notification($context, $context_id, $type, $event, $data = array()) {
        $current_user = wp_get_current_user();
        
        global $wpdb;
        $result = $wpdb->insert(
            $wpdb->prefix . 'magiccl_global_notifications',
            array(
                'context' => $context,
                'context_id' => $context_id,
                'type' => $type,
                'event' => $event,
                'data' => maybe_serialize($data),
                'user_id' => $current_user->ID ?: null,
                'user_name' => $current_user->display_name ?: null,
                'user_email' => $current_user->user_email ?: null,
                'created_at' => current_time('mysql'),
                'process_after' => $this->calculate_process_after($this->default_batch_interval),
                'processed' => 0
            ),
            array('%s', '%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%d')
        );
    
        if ($result === false) {
            error_log("Failed to insert global notification into queue. Error: " . $wpdb->last_error);
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
    
    public function process_global_notification_queue() {
        global $wpdb;
        
        // Get unprocessed notifications that are ready to be sent
        $notifications = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}magiccl_global_notifications 
            WHERE processed = 0 
            AND process_after <= %s 
            ORDER BY context, context_id, created_at ASC",
            current_time('mysql')
        ));
        
        if (empty($notifications)) {
            return;
        }
        
        // Group notifications by context and context_id for batching
        $grouped = array();
        foreach ($notifications as $notification) {
            $key = $notification->context . '_' . $notification->context_id;
            if (!isset($grouped[$key])) {
                $grouped[$key] = array();
            }
            $grouped[$key][] = $notification;
        }
        
        // Process each group
        foreach ($grouped as $group_key => $group_notifications) {
            $first_notification = $group_notifications[0];
            
            // For checklist context, integrate with existing notification system
            if ($first_notification->context === 'checklist') {
                $this->process_checklist_notifications($group_notifications);
            }
            
            // Mark notifications as processed
            $notification_ids = wp_list_pluck($group_notifications, 'id');
            $placeholders = array_fill(0, count($notification_ids), '%d');
            
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Placeholders are generated safely via array_fill with %d
            $wpdb->query($wpdb->prepare(
                "UPDATE {$wpdb->prefix}magiccl_global_notifications
                SET processed = 1,
                    processed_at = %s
                WHERE id IN (" . implode(',', $placeholders) . ")", // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Placeholders generated via array_fill
                array_merge([current_time('mysql')], $notification_ids)
            ));
        }
    }

    /**
     * Process checklist-related notifications using existing notification settings
     */
    private function process_checklist_notifications($notifications) {
        if (empty($notifications)) {
            return;
        }

        $checklist_id = $notifications[0]->context_id;
        
        // Get notification settings using the existing manager
        $notification_manager = MAGICCL_Notification_Manager::get_instance();
        $settings = $notification_manager->get_notification_settings($checklist_id);
        
        if (!$settings || !$settings->notifications_enabled) {
            return;
        }

        // Check if comment notifications are enabled (we'll add this setting)
        $notify_on_comments = $this->should_notify_on_comments($settings);
        if (!$notify_on_comments) {
            return;
        }
        
        // Process email notifications
        if ($settings->email_enabled) {
            $this->send_email_notifications($settings, $notifications);
        }
        
        // Process Slack notifications
        if ($settings->integration_enabled && !empty($settings->slack_webhook_url)) {
            $this->send_slack_notifications($settings, $notifications);
        }
        
        // Process Discord notifications
        if ($settings->integration_enabled && !empty($settings->discord_webhook_url)) {
            $this->send_discord_notifications($settings, $notifications);
        }
    }

    /**
     * Check if comment notifications should be sent
     */
    private function should_notify_on_comments($settings) {
        return isset($settings->notify_on_comments) && $settings->notify_on_comments;
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
            __('[%s] Checklist Comment Notifications', 'magicchecklists'),
            get_bloginfo('name')
        );
        
        $message = sprintf(
            __("Comment updates for checklist: %s\n\n", 'magicchecklists'),
            $checklist->post_title
        );
        
        foreach ($notifications as $notification) {
            $data = maybe_unserialize($notification->data);
            $message .= $this->format_comment_notification_message($notification->event, $data) . "\n";
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
                    'text' => sprintf('Comment Updates for Checklist: %s', $checklist->post_title)
                )
            )
        );
        
        foreach ($notifications as $notification) {
            $data = maybe_unserialize($notification->data);
            $blocks[] = array(
                'type' => 'section',
                'text' => array(
                    'type' => 'mrkdwn',
                    'text' => $this->format_comment_notification_message($notification->event, $data)
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
        
        $message = sprintf('**Comment Updates for Checklist: %s**', $checklist->post_title) . "\n\n";
        
        foreach ($notifications as $notification) {
            $data = maybe_unserialize($notification->data);
            $message .= $this->format_comment_notification_message($notification->event, $data) . "\n";
        }
        
        wp_remote_post($settings->discord_webhook_url, array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => wp_json_encode(array('content' => $message)),
            'timeout' => 15
        ));
    }

    private function format_comment_notification_message($event, $data) {
        $user = isset($data['user_name']) ? $data['user_name'] : __('Someone', 'magicchecklists');
        $item_context = isset($data['item_content']) ? ' on "' . wp_strip_all_tags($data['item_content']) . '"' : '';
        
        switch ($event) {
            case 'comment-added':
                $content = isset($data['comment_content']) ? wp_strip_all_tags($data['comment_content']) : '';
                $preview = strlen($content) > 100 ? substr($content, 0, 100) . '...' : $content;
                return sprintf(
                    __('💬 %s added a comment%s: "%s"', 'magicchecklists'),
                    $user,
                    $item_context,
                    $preview
                );
                
            case 'comment-liked':
                return sprintf(
                    __('👍 %s liked a comment%s', 'magicchecklists'),
                    $user,
                    $item_context
                );
                
            case 'comment-replied':
                return sprintf(
                    __('↩️ %s replied to a comment%s', 'magicchecklists'),
                    $user,
                    $item_context
                );
                
            default:
                return sprintf(
                    __('Comment event: %s by %s%s', 'magicchecklists'),
                    $event,
                    $user,
                    $item_context
                );
        }
    }

    /**
     * Get item content from checklist
     */
    private function get_item_content($checklist_id, $item_id) {
        $items = get_post_meta($checklist_id, '_magiccl_items', true);
        if (!is_array($items)) {
            return 'Unknown item';
        }
        
        // Handle various item ID formats
        $search_patterns = [];
        
        if (is_numeric($item_id)) {
            $search_patterns[] = (int) $item_id;
            $search_patterns[] = (string) $item_id;
            $search_patterns[] = "item_" . $item_id;
        } else {
            $search_patterns[] = $item_id;
            // If it's something like "item_1234", also try just "1234"
            if (preg_match('/^item_(\d+)/', $item_id, $matches)) {
                $search_patterns[] = (int) $matches[1];
                $search_patterns[] = $matches[1];
            }
        }
        
        foreach ($items as $index => $item) {
            $current_id = $item['id'] ?? null;
            
            foreach ($search_patterns as $pattern) {
                // Direct match
                if ($current_id == $pattern || $current_id === $pattern) {
                    return wp_strip_all_tags($item['content'] ?? 'Untitled item');
                }
                
                // Check if current_id starts with the pattern (for cases like "item_1234_1" matching "1234")
                if (is_string($current_id) && is_string($pattern)) {
                    if (strpos($current_id, $pattern) !== false) {
                        return wp_strip_all_tags($item['content'] ?? 'Untitled item');
                    }
                }
                
                // Also check if pattern starts with current_id (for reverse matches)
                if (is_string($current_id) && is_string($pattern)) {
                    if (strpos($pattern, $current_id) !== false) {
                        return wp_strip_all_tags($item['content'] ?? 'Untitled item');
                    }
                }
            }
        }
        
        return 'Unknown item';
    }
}

// Initialize the global notification manager
MAGICCL_Global_Notification_Manager::get_instance();