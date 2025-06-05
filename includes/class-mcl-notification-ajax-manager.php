<?php

if (!defined('ABSPATH')) {
    exit;
}

class MCL_Notification_Ajax_Handler {
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('wp_ajax_mcl_test_notification_webhook', array($this, 'handle_test_webhook'));
        add_action('wp_ajax_mcl_test_email_notification', array($this, 'handle_test_email'));
    }
    
    public function handle_test_webhook() {
        // Verify nonce
        check_ajax_referer('mcl_test_webhook', 'nonce');
    
        if (!current_user_can('manage_options')) {
            wp_send_json_error([
                'message' => __('Permission denied', 'magic-checklists')
            ]);
            return;
        }
    
        $platform = sanitize_text_field($_POST['platform'] ?? '');
        $webhook_url = esc_url_raw($_POST['webhook_url'] ?? '');
    
        if (empty($webhook_url)) {
            wp_send_json_error([
                'message' => __('Webhook URL is required', 'magic-checklists')
            ]);
            return;
        }
    
        // Test message based on platform
        $test_payload = [
            'slack' => [
                'text' => sprintf(
                    __('🔔 Test notification from %s - Your Slack integration is working!', 'magic-checklists'),
                    get_bloginfo('name')
                )
            ],
            'discord' => [
                'content' => sprintf(
                    __('🔔 Test notification from %s - Your Discord integration is working!', 'magic-checklists'),
                    get_bloginfo('name')
                )
            ]
        ];
    
        if (!isset($test_payload[$platform])) {
            wp_send_json_error([
                'message' => __('Invalid platform specified', 'magic-checklists')
            ]);
            return;
        }
    
        $response = wp_remote_post($webhook_url, [
            'body' => wp_json_encode($test_payload[$platform]),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 15
        ]);
    
        if (is_wp_error($response)) {
            wp_send_json_error([
                'message' => $response->get_error_message()
            ]);
            return;
        }
    
        $response_code = wp_remote_retrieve_response_code($response);
        if ($platform === 'slack' && $response_code !== 200) {
            wp_send_json_error([
                'message' => sprintf(__('Webhook test failed with status code: %d', 'magic-checklists'), $response_code)
            ]);
            return;
        }
    
        if ($platform === 'discord' && $response_code !== 204) {
            wp_send_json_error([
                'message' => sprintf(__('Webhook test failed with status code: %d', 'magic-checklists'), $response_code)
            ]);
            return;
        }
    
        wp_send_json_success([
            'message' => __('Webhook test successful', 'magic-checklists')
        ]);
    }


    public function handle_test_email() {
        // Verify nonce
        check_ajax_referer('mcl_test_webhook', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error([
                'message' => __('Permission denied', 'magic-checklists')
            ]);
            return;
        }

        $recipients = sanitize_text_field($_POST['recipients'] ?? '');
        
        if (empty($recipients)) {
            wp_send_json_error([
                'message' => __('Email recipients are required', 'magic-checklists')
            ]);
            return;
        }

        $recipients = array_map('trim', explode(',', $recipients));
        $site_name = get_bloginfo('name');
        $subject = sprintf(
            '[%s] %s',
            $site_name,
            __('Test Notification', 'magic-checklists')
        );
        
        $message = sprintf(
            __("Hello!\n\nThis is a test notification from %s to verify your email notification settings are working correctly.\n\nIf you received this email, your notification settings are properly configured.\n\nBest regards,\nMagicChecklists", 'magic-checklists'),
            $site_name
        );

        // Add WordPress email headers
        $headers = array(
            'Content-Type: text/plain; charset=UTF-8',
            'From: ' . get_bloginfo('name') . ' <' . get_bloginfo('admin_email') . '>',
            'Reply-To: ' . get_bloginfo('admin_email')
        );

        // Enable debug logging
        add_action('wp_mail_failed', function($wp_error) {
            error_log('Magic Checklists Email Error: ' . print_r($wp_error, true));
        });

        $success = true;
        $failed_emails = array();
        $results = array();

        foreach ($recipients as $recipient) {
            if (!is_email($recipient)) {
                $failed_emails[] = $recipient;
                $results[] = sprintf('Invalid email format: %s', $recipient);
                continue;
            }

            $result = wp_mail($recipient, $subject, $message, $headers);
            $results[] = sprintf(
                'Attempt to send to %s: %s',
                $recipient,
                $result ? 'Success' : 'Failed'
            );
            
            if (!$result) {
                $failed_emails[] = $recipient;
                $success = false;
            }
        }

        // Log results for debugging
        error_log('Magic Checklists Email Test Results: ' . print_r($results, true));

        if ($success && empty($failed_emails)) {
            wp_send_json_success([
                'message' => __('Test email(s) sent successfully', 'magic-checklists'),
                'debug' => $results
            ]);
        } else {
            wp_send_json_error([
                'message' => sprintf(
                    __('Failed to send test email to: %s', 'magic-checklists'),
                    implode(', ', $failed_emails)
                ),
                'debug' => $results
            ]);
        }
    }

    private function test_slack_webhook($webhook_url) {
        $test_message = array(
            'blocks' => array(
                array(
                    'type' => 'section',
                    'text' => array(
                        'type' => 'mrkdwn',
                        'text' => sprintf(
                            __('🔔 *Test notification from %s*\nYour Slack integration is working correctly!', 'magic-checklists'),
                            get_bloginfo('name')
                        )
                    )
                )
            )
        );

        $response = wp_remote_post($webhook_url, array(
            'body' => wp_json_encode($test_message),
            'headers' => array('Content-Type' => 'application/json'),
            'timeout' => 15
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            return new WP_Error(
                'webhook_test_failed',
                sprintf(__('Webhook test failed with response code: %d', 'magic-checklists'), $response_code)
            );
        }

        return true;
    }

    private function test_discord_webhook($webhook_url) {
        $test_message = array(
            'content' => sprintf(
                __('🔔 **Test notification from %s**\nYour Discord integration is working correctly!', 'magic-checklists'),
                get_bloginfo('name')
            )
        );

        $response = wp_remote_post($webhook_url, array(
            'body' => wp_json_encode($test_message),
            'headers' => array('Content-Type' => 'application/json'),
            'timeout' => 15
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 204) { // Discord returns 204 for success
            return new WP_Error(
                'webhook_test_failed',
                sprintf(__('Webhook test failed with response code: %d', 'magic-checklists'), $response_code)
            );
        }

        return true;
    }
}

// Initialize the handler
MCL_Notification_Ajax_Handler::get_instance();