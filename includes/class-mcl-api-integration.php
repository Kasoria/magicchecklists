<?php

if (!defined('ABSPATH')) {
    exit;
}

class MAGICCL_API_Integration {
    /**
     * @var MAGICCL_REST_Controller
     */
    private $rest_controller;

    /**
     * Initialize the integration
     */
    public function __construct() {
        add_action('init', array($this, 'init'), 0);
        add_action('magiccl_webhook_checklist_created', array($this, 'dispatch_webhook_created'));
        add_action('magiccl_webhook_checklist_updated', array($this, 'dispatch_webhook_updated'));
        add_action('magiccl_webhook_checklist_deleted', array($this, 'dispatch_webhook_deleted'));
        add_action('magiccl_webhook_checklist_items_updated', array($this, 'dispatch_webhook_items_updated'));
        add_action('magiccl_webhook_checklist_state_updated', array($this, 'dispatch_webhook_state_updated'));
        add_action('wp_ajax_magiccl_test_webhook', array($this, 'handle_test_webhook'));
        add_action('wp_ajax_magiccl_clear_webhook_logs', array($this, 'handle_clear_webhook_logs'));
    }

    /**
     * Initialize components
     */
    public function init() {
        $this->rest_controller = new MAGICCL_REST_Controller();
    }

    /**
     * Dispatch webhook for checklist creation
     */
    public function dispatch_webhook_created($checklist_id) {
        $this->dispatch_webhook('checklist.created', $checklist_id);
    }

    /**
     * Dispatch webhook for checklist update
     */
    public function dispatch_webhook_updated($checklist_id) {
        $this->dispatch_webhook('checklist.updated', $checklist_id);
    }

    /**
     * Dispatch webhook for checklist deletion
     */
    public function dispatch_webhook_deleted($checklist_id) {
        $this->dispatch_webhook('checklist.deleted', $checklist_id);
    }

    /**
     * Dispatch webhook for items update
     */
    public function dispatch_webhook_items_updated($checklist_id, $items = array()) {
        $this->dispatch_webhook('checklist.items_updated', $checklist_id, array(
            'items' => $items
        ));
    }

    /**
     * Dispatch webhook for state update
     */
    public function dispatch_webhook_state_updated($checklist_id, $checked_items = array()) {
        $this->dispatch_webhook('checklist.state_updated', $checklist_id, array(
            'checked_items' => $checked_items
        ));
    }

    /**
     * Generic webhook dispatcher
     */
    private function dispatch_webhook($event, $checklist_id, $additional_data = array()) {
        // Get checklist data
        $post = get_post($checklist_id);
        if (!$post) {
            return;
        }

        $payload = array_merge(array(
            'event' => $event,
            'checklist_id' => $checklist_id,
            'title' => $post->post_title,
            'timestamp' => current_time('timestamp'),
        ), $additional_data);

        // Get webhook endpoints from settings
        $endpoints = $this->get_webhook_endpoints();

        foreach ($endpoints as $endpoint) {
            $this->send_webhook($endpoint, $payload);
        }
    }

    private function validate_webhook_url($url) {
        $parsed = wp_parse_url($url);
        
        // Prevent internal network access
        $internal_patterns = array(
            '/^127\./',
            '/^10\./',
            '/^172\.(1[6-9]|2[0-9]|3[0-1])\./',
            '/^192\.168\./',
            '/^localhost/',
            '/\.local$/'
        );
        
        $host = $parsed['host'] ?? '';
        foreach ($internal_patterns as $pattern) {
            if (preg_match($pattern, $host)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Generate signature for webhook payload
     */
    private function generate_signature($payload, $timestamp, $nonce) {
        $secret = get_option('magiccl_webhook_secret', '');
        if (empty($secret)) {
            return '';
        }
    
        $data = $timestamp . '.' . $nonce . '.' . wp_json_encode($payload);
        return hash_hmac('sha256', $data, $secret);
    }

    /**
     * Get configured webhook endpoints
     */
    private function get_webhook_endpoints() {
        return get_option('magiccl_webhook_endpoints', array());
    }

    /**
     * Handle webhook test requests
     */
    public function handle_test_webhook() {
      // Verify nonce
      if (!check_ajax_referer('magiccl_integration_nonce', 'nonce', false)) {
          wp_send_json_error(array(
              'message' => 'Invalid security token'
          ));
          return;
      }

      // Verify permissions
      if (!current_user_can('manage_options')) {
          wp_send_json_error(array(
              'message' => 'Insufficient permissions'
          ));
          return;
      }

      // Get and validate endpoint
      $endpoint = isset($_POST['endpoint']) ? esc_url_raw(wp_unslash($_POST['endpoint'])) : '';
      if (empty($endpoint)) {
          wp_send_json_error(array(
              'message' => 'Invalid endpoint URL'
          ));
          return;
      }

      // Prepare test payload
      $payload = array(
          'event' => 'webhook.test',
          'timestamp' => current_time('timestamp'),
          'plugin_version' => MAGIC_CHECKLISTS_VERSION
      );

      // Send test request
      $response = wp_remote_post($endpoint, array(
          'body' => wp_json_encode($payload),
          'headers' => array(
              'Content-Type' => 'application/json',
              'X-MCL-Webhook' => 'true',
              'X-MCL-Event' => 'webhook.test',
              'X-MCL-Signature' => $this->generate_signature($payload)
          ),
          'timeout' => 15,
          'sslverify' => true
      ));

      // Handle response
      if (is_wp_error($response)) {
          wp_send_json_error(array(
              'message' => $response->get_error_message()
          ));
          return;
      }

      $response_code = wp_remote_retrieve_response_code($response);
      if ($response_code < 200 || $response_code >= 300) {
          wp_send_json_error(array(
              'message' => sprintf('Endpoint returned error code: %d', $response_code)
          ));
          return;
      }

      // Log successful test
      $this->log_webhook_event('webhook.test', $endpoint, 'success');

      wp_send_json_success(array(
          'message' => 'Webhook test successful'
      ));
    }

    /**
    * Log webhook events
    */
    private function log_webhook_event($event, $endpoint, $status, $error = '') {
      $logs = get_option('magiccl_webhook_logs', array());
      
      // Add new log entry
      array_unshift($logs, array(
          'time' => current_time('mysql'),
          'event' => $event,
          'endpoint' => $endpoint,
          'status' => $status,
          'error' => $error
      ));
      
      // Keep only last 100 logs
      $logs = array_slice($logs, 0, 100);
      
      update_option('magiccl_webhook_logs', $logs);
    }

    /**
    * Improved webhook dispatcher with error handling and logging
    */
    private function send_webhook($endpoint, $payload) {
        // Validate URL
        if (!$this->validate_webhook_url($endpoint)) {
            $this->log_webhook_event($payload['event'], $endpoint, 'error', 'Invalid endpoint URL');
            return false;
        }
    
        // Add timestamp and nonce
        $timestamp = time();
        $nonce = wp_generate_password(16, false);
    
        $args = array(
            'body' => wp_json_encode($payload),
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-MCL-Webhook' => 'true',
                'X-MCL-Event' => $payload['event'],
                'X-MCL-Timestamp' => $timestamp,
                'X-MCL-Nonce' => $nonce,
                'X-MCL-Signature' => $this->generate_signature($payload, $timestamp, $nonce)
            ),
            'timeout' => 15,
            'sslverify' => true,
            'data_format' => 'body'
        );
    
        // Implement exponential backoff for retries
        $max_retries = 3;
        $retry_count = 0;
        
        do {
            if ($retry_count > 0) {
                sleep(pow(2, $retry_count));
            }
    
            $response = wp_remote_post($endpoint, $args);
            
            if (!is_wp_error($response)) {
                $response_code = wp_remote_retrieve_response_code($response);
                if ($response_code >= 200 && $response_code < 300) {
                    $this->log_webhook_event($payload['event'], $endpoint, 'success');
                    return true;
                }
            }
            
            $retry_count++;
        } while ($retry_count < $max_retries);
    
        // Log final failure
        $this->log_webhook_event(
            $payload['event'],
            $endpoint,
            'error',
            is_wp_error($response) ? $response->get_error_message() : sprintf('HTTP %d response', $response_code)
        );
        
        return false;
    }

    /**
     * Handle clearing webhook logs
     */
    public function handle_clear_webhook_logs() {
      // Verify nonce
      if (!check_ajax_referer('magiccl_integration_nonce', 'nonce', false)) {
          wp_send_json_error(array(
              'message' => __('Invalid security token', 'magicchecklists')
          ));
          return;
      }

      // Verify permissions
      if (!current_user_can('manage_options')) {
          wp_send_json_error(array(
              'message' => __('Insufficient permissions', 'magicchecklists')
          ));
          return;
      }

      // Clear the logs by updating the option to an empty array
      update_option('magiccl_webhook_logs', array());

      wp_send_json_success(array(
          'message' => __('Webhook logs cleared successfully', 'magicchecklists')
      ));
    }

    private function verify_mainwp_api_key($request) {
        $auth_header = $request->get_header('Authorization');
        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return false;
        }

        $api_key = str_replace('Bearer ', '', $auth_header);
        $stored_key = get_option('magiccl_integration_settings');
        $stored_key = isset($stored_key['mainwp_api_key']) ? $stored_key['mainwp_api_key'] : '';

        return $api_key === $stored_key;
    }
}