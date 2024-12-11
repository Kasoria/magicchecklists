<?php

if (!defined('ABSPATH')) {
    exit;
}

class MCL_REST_Controller extends WP_REST_Controller {
    /**
     * Namespace for the API
     */
    protected $namespace = 'magicchecklists/v1';

    /**
     * Route base
     */
    protected $rest_base = 'checklists';

    /**
     * Rate limit settings
     */
    private $rate_limit_key = 'mcl_rate_limit_';
    private $default_rate_limit = 120; // requests per minute
    private $rate_limit_period = 60; // 1 minute in seconds

    /**
     * Constructor
     */
    public function __construct() {
      add_action('rest_api_init', [$this, 'register_routes']);
    }

    /**
     * Register routes
     */
    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => $this->wrap_permission_callback([$this, 'get_items_permissions_check']),
                'args' => $this->get_collection_params(),
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => $this->wrap_permission_callback([$this, 'create_item_permissions_check']),
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
            ]
        ]);

        // Single checklist operations
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => $this->wrap_permission_callback([$this, 'get_item_permissions_check']),
                'args' => [
                    'id' => [
                        'validate_callback' => function($param) {
                            return is_numeric($param);
                        }
                    ],
                ],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => $this->wrap_permission_callback([$this, 'update_item_permissions_check']),
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => $this->wrap_permission_callback([$this, 'delete_item_permissions_check']),
            ],
        ]);

        // Update checklist items
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)/items', [
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_checklist_items'],
                'permission_callback' => $this->wrap_permission_callback([$this, 'update_item_permissions_check']),
                'args' => [
                    'items' => [
                        'required' => true,
                        'type' => 'array',
                    ],
                ],
            ],
        ]);

        // Update checked state
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)/checked-state', [
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_checked_state'],
                'permission_callback' => $this->wrap_permission_callback([$this, 'update_item_permissions_check']),
                'args' => [
                    'checked_items' => [
                        'required' => true,
                        'type' => 'array',
                    ],
                ],
            ],
        ]);
    }

    private function check_api_enabled() {
        $integration_settings = get_option('mcl_integration_settings', array());
        $api_enabled = isset($integration_settings['enable_api']) ? $integration_settings['enable_api'] : true;
    
        if (!$api_enabled) {
            return new WP_Error(
                'rest_api_disabled',
                __('The MagicChecklists API is currently disabled.', 'magic-checklists'),
                array('status' => 403)
            );
        }
    
        return true;
    }

    /**
     * Check rate limit for a user
     *
     * @param int $user_id The user ID to check
     * @return bool|WP_Error True if within limit, WP_Error if limit exceeded
     */
    private function check_rate_limit($user_id) {
        $transient_key = $this->rate_limit_key . $user_id;
        $current_count = get_transient($transient_key);

        if (false === $current_count) {
            // First request from this user
            set_transient($transient_key, 1, $this->rate_limit_period);
            return true;
        }

        if ($current_count >= $this->default_rate_limit) {
            $retry_after = get_option('_transient_timeout_' . $transient_key) - time();
            return new WP_Error(
                'rest_rate_limit_exceeded',
                sprintf(
                    __('Rate limit exceeded. Please try again in %d minutes.', 'magic-checklists'),
                    ceil($retry_after / 60)
                ),
                array(
                    'status' => 429,
                    'retry_after' => $retry_after
                )
            );
        }

        // Increment the counter
        set_transient($transient_key, $current_count + 1, $this->rate_limit_period);
        return true;
    }

    /**
     * Add rate limit headers to response
     *
     * @param WP_REST_Response $response The response object
     * @param int $user_id The user ID
     * @return WP_REST_Response
     */
    private function add_rate_limit_headers($response, $user_id) {
        $transient_key = $this->rate_limit_key . $user_id;
        $current_count = get_transient($transient_key) ?: 0;
        $reset_time = get_option('_transient_timeout_' . $transient_key) ?: (time() + $this->rate_limit_period);

        $response->header('X-RateLimit-Limit', $this->default_rate_limit);
        $response->header('X-RateLimit-Remaining', max(0, $this->default_rate_limit - $current_count));
        $response->header('X-RateLimit-Reset', $reset_time);

        return $response;
    }

    /**
     * Get client IP address
     *
     * @return string
     */
    private function get_client_ip() {
        $ip = '';
        
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            $ip = $_SERVER['REMOTE_ADDR'];
        }

        return sanitize_text_field($ip);
    }

    /**
     * Wrap permission callback with rate limiting
     *
     * @param callable $callback Original permission callback
     * @return callable
     */
    private function wrap_permission_callback($callback) {
        return function($request) use ($callback) {
            // First check if API is enabled
            $api_check = $this->check_api_enabled();
            if (is_wp_error($api_check)) {
                return $api_check;
            }
    
            // Then check if user is logged in
            if (!is_user_logged_in()) {
                return new WP_Error(
                    'rest_not_logged_in',
                    __('You must be logged in to access this endpoint.', 'magic-checklists'),
                    array('status' => 401)
                );
            }
    
            // Then check the original permission callback
            $permission_check = $callback($request);
            if (is_wp_error($permission_check) || !$permission_check) {
                return $permission_check;
            }
    
            // Then check rate limit
            $user_id = get_current_user_id();
            return $this->check_rate_limit($user_id);
        };
    }

    /**
     * Wrap response with rate limit headers
     *
     * @param mixed $response The response data
     * @return WP_REST_Response
     */
    private function wrap_response($response) {
        if (!is_user_logged_in()) {
            return $response;
        }
    
        $response = rest_ensure_response($response);
        $response = $this->add_rate_limit_headers($response, get_current_user_id());
        $response = $this->add_security_headers($response);
        
        return $response;
    }

    private function add_security_headers($response) {
        // Add security headers
        $response->header('X-Content-Type-Options', 'nosniff');
        $response->header('X-Frame-Options', 'DENY');
        $response->header('X-XSS-Protection', '1; mode=block');
        $response->header('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
        
        // Add API versioning headers
        $response->header('X-API-Version', '1.0');
        
        // Add proper CORS headers if needed
        $allowed_origins = get_option('mcl_allowed_origins', array());
        if (!empty($allowed_origins)) {
            $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
            if (in_array($origin, $allowed_origins)) {
                $response->header('Access-Control-Allow-Origin', $origin);
                $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
                $response->header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
                $response->header('Access-Control-Max-Age', '3600');
            }
        }
        
        return $response;
    }

    /**
     * Get all checklists
     */
    public function get_items($request) {
      $args = [
          'post_type' => 'mcl_checklist',
          'posts_per_page' => $request['per_page'],
          'paged' => $request['page'],
          'post_status' => 'publish',
      ];

      if (!empty($request['search'])) {
          $args['s'] = $request['search'];
      }

      $query = new WP_Query($args);
      $checklists = [];

      foreach ($query->posts as $post) {
          $data = $this->prepare_item_for_response($post, $request);
          if (is_wp_error($data)) {
              continue;
          }
          $checklists[] = $this->prepare_response_for_collection($data);
      }

      $response = rest_ensure_response($checklists);

      // Add pagination information
      $total_posts = $query->found_posts;
      $max_pages = ceil($total_posts / $request['per_page']);

      $response->header('X-WP-Total', (int) $total_posts);
      $response->header('X-WP-TotalPages', (int) $max_pages);
      
      $this->log_api_access($request, $result);
      return $this->wrap_response($response);
  }

  /**
   * Get a single checklist
   */
  public function get_item($request) {
      $id = (int) $request['id'];
      $post = get_post($id);

      if (empty($post) || $post->post_type !== 'mcl_checklist') {
          return new WP_Error(
              'mcl_rest_not_found',
              __('Checklist not found', 'magic-checklists'),
              ['status' => 404]
          );
      }

      $data = $this->prepare_item_for_response($post, $request);
      if (is_wp_error($data)) {
          return $data;
      }

      $response = rest_ensure_response($data);
      $this->log_api_access($request, $result);
      return $this->wrap_response($response);
  }

  /**
   * Create a checklist
   */
  public function create_item($request) {
      if (!empty($request['id'])) {
          return new WP_Error(
              'mcl_rest_checklist_exists',
              __('Cannot create existing checklist.', 'magic-checklists'),
              ['status' => 400]
          );
      }

      $payload_size = strlen(wp_json_encode($request->get_params()));
        if ($payload_size > 1024 * 1024) { // 1MB limit
            return new WP_Error(
                'rest_payload_too_large',
                __('Request payload too large', 'magic-checklists'),
                array('status' => 413)
            );
        }

      $prepared_post = $this->prepare_item_for_database($request);
      if (is_wp_error($prepared_post)) {
          return $prepared_post;
      }

      $post_id = wp_insert_post($prepared_post, true);
      if (is_wp_error($post_id)) {
          return $post_id;
      }

      // Save checklist meta
      $this->save_checklist_meta($post_id, $request);

      // Dispatch webhook for checklist creation
      do_action('mcl_webhook_checklist_created', $post_id);

      $post = get_post($post_id);
        $response = $this->prepare_item_for_response($post, $request);

        $response->set_status(201);
        $response->header('Location', rest_url(sprintf('%s/%s/%d', $this->namespace, $this->rest_base, $post_id)));

        $this->log_api_access($request, $result);
        return $this->wrap_response($response);
  }

  /**
   * Update a checklist
   */
  public function update_item($request) {
      $id = (int) $request['id'];
      $post = get_post($id);

      if (empty($post) || $post->post_type !== 'mcl_checklist') {
          return new WP_Error(
              'mcl_rest_not_found',
              __('Checklist not found', 'magic-checklists'),
              ['status' => 404]
          );
      }

      $prepared_post = $this->prepare_item_for_database($request);
      if (is_wp_error($prepared_post)) {
          return $prepared_post;
      }

      $prepared_post['ID'] = $id;
      $post_id = wp_update_post($prepared_post, true);
      if (is_wp_error($post_id)) {
          return $post_id;
      }

      // Save checklist meta
      $this->save_checklist_meta($post_id, $request);

      // Dispatch webhook for checklist update
      do_action('mcl_webhook_checklist_updated', $post_id);

      $post = get_post($post_id);
      $response = rest_ensure_response($this->prepare_item_for_response($post, $request));

      $this->log_api_access($request, $result);
      return $this->wrap_response($response);
  }

  /**
   * Delete a checklist
   */
  public function delete_item($request) {
      $id = (int) $request['id'];
      $post = get_post($id);

      if (empty($post) || $post->post_type !== 'mcl_checklist') {
          return new WP_Error(
              'mcl_rest_not_found',
              __('Checklist not found', 'magic-checklists'),
              ['status' => 404]
          );
      }

      $previous = $this->prepare_item_for_response($post, $request);
      $result = wp_delete_post($id, true);

      if (!$result) {
          return new WP_Error(
              'mcl_rest_cannot_delete',
              __('The checklist cannot be deleted.', 'magic-checklists'),
              ['status' => 500]
          );
      }

      // Dispatch webhook for checklist deletion
      do_action('mcl_webhook_checklist_deleted', $id);

      $response = new WP_REST_Response();
      $response->set_data([
          'deleted' => true,
          'previous' => $previous,
      ]);
      
      $this->log_api_access($request, $result);
      return $this->wrap_response($response);
    }

    /**
     * Update checklist items
     */
    public function update_checklist_items($request) {
        $id = (int) $request['id'];
        $new_items = $request['items'];
        $existing_items = get_post_meta($id, '_mcl_items', true) ?: array();
        
        // Create map of existing items
        $existing_map = array();
        foreach ($existing_items as $item) {
            if (isset($item['id'])) {
                $existing_map[$item['id']] = $item;
            }
        }
        
        // Process new/updated items
        $processed_items = array();
        foreach ($new_items as $item) {
            if (!isset($item['id'], $item['content'])) {
                continue;
            }
            
            $item_id = sanitize_text_field($item['id']);
            $item_content = MCL_Sanitization::sanitize_item_content($item['content']);
            
            // If item exists, update it while preserving any additional fields
            if (isset($existing_map[$item_id])) {
                $updated_item = $existing_map[$item_id];
                $updated_item['content'] = $item_content;
                // Update priority if provided, otherwise keep existing
                if (isset($item['priority'])) {
                    $updated_item['priority'] = sanitize_text_field($item['priority']);
                }
                $processed_items[] = $updated_item;
                
                // Remove from existing map to track what's left
                unset($existing_map[$item_id]);
            } else {
                // This is a new item
                $new_item = array(
                    'id' => $item_id,
                    'content' => $item_content,
                    'priority' => isset($item['priority']) ? sanitize_text_field($item['priority']) : 'none'
                );
                $processed_items[] = $new_item;
                
                do_action('mcl_item_added', $id, $new_item);
            }
        }
        
        // Keep any existing items not included in the update request
        foreach ($existing_map as $remaining_item) {
            $processed_items[] = $remaining_item;
        }
        
        update_post_meta($id, '_mcl_items', $processed_items);
        
        $response = rest_ensure_response(array(
            'success' => true,
            'items' => $processed_items
        ));
        
        $this->log_api_access($request, $result);
        return $this->wrap_response($response);
    }

    /**
    * Update checked state
    */
    public function update_checked_state($request) {
        $id = (int) $request['id'];
        $checked_items = array_map('sanitize_text_field', $request['checked_items']);
        
        if (empty($post = get_post($id)) || $post->post_type !== 'mcl_checklist') {
            return new WP_Error(
                'mcl_rest_not_found',
                __('Checklist not found', 'magic-checklists'),
                ['status' => 404]
            );
        }
        
        // Get previous state
        $checked_state_handling = get_post_meta($id, '_mcl_checked_state_handling', true);
        $is_public = get_post_meta($id, '_mcl_public_access', true) == '1';
        
        $previous_state = array();
        if ($checked_state_handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            $previous_state = get_user_meta($user_id, '_mcl_checked_state_' . $id, true) ?: array();
        } else {
            $meta_key = $is_public ? '_mcl_public_global_checked_state' : '_mcl_checked_state';
            $previous_state = get_post_meta($id, $meta_key, true) ?: array();
        }
        
        // Compare states and trigger appropriate actions
        foreach ($checked_items as $item_id) {
            if (!in_array($item_id, $previous_state)) {
                do_action('mcl_item_checked', $id, $item_id, true);
            }
        }
        
        foreach ($previous_state as $item_id) {
            if (!in_array($item_id, $checked_items)) {
                do_action('mcl_item_unchecked', $id, $item_id, false);
            }
        }
        
        // Save new state
        if ($checked_state_handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            update_user_meta($user_id, '_mcl_checked_state_' . $id, $checked_items);
        } else {
            $meta_key = $is_public ? '_mcl_public_global_checked_state' : '_mcl_checked_state';
            update_post_meta($id, $meta_key, $checked_items);
        }
        
        $response = rest_ensure_response([
            'id' => $id,
            'checked_items' => $checked_items,
            'updated' => true
        ]);
        
        $this->log_api_access($request, $result);
        return $this->wrap_response($response);
    }

    /**
    * Prepare item for database
    */
    protected function prepare_item_for_database($request) {
      $prepared_post = [
          'post_type' => 'mcl_checklist',
          'post_status' => 'publish',
      ];

      if (isset($request['title'])) {
          $prepared_post['post_title'] = sanitize_text_field($request['title']);
      }

      if (isset($request['description'])) {
          $prepared_post['post_content'] = sanitize_textarea_field($request['description']);
      }

      return $prepared_post;
    }

  /**
   * Save checklist meta data
   */
  protected function save_checklist_meta($post_id, $request) {
      $meta_keys = [
          'time_date' => '_mcl_time_date',
          'keyboard_shortcut' => '_mcl_keyboard_shortcut',
          'active' => '_mcl_active',
          'checked_state_handling' => '_mcl_checked_state_handling',
          'theme' => '_mcl_theme',
          'priority' => '_mcl_priority',
          'enable_item_priority' => '_mcl_enable_item_priority',
          'trigger_shortcut' => '_mcl_trigger_shortcut',
          'trigger_button' => '_mcl_trigger_button',
          'short_title' => '_mcl_short_title',
          'public_access' => '_mcl_public_access',
          'public_permission' => '_mcl_public_permission',
          'public_checked_state_handling' => '_mcl_public_checked_state_handling',
          'public_description' => '_mcl_public_description',
          'priority_display_type' => '_mcl_priority_display_type',
          'enable_rate_limit' => '_mcl_enable_rate_limit',
      ];

      foreach ($meta_keys as $request_key => $meta_key) {
          if (isset($request[$request_key])) {
              update_post_meta($post_id, $meta_key, $request[$request_key]);
          }
      }

      // Handle items separately as they need special processing
      if (isset($request['items'])) {
          $processed_items = array();
          foreach ($request['items'] as $item) {
              if (isset($item['id'], $item['content'])) {
                  $processed_items[] = array(
                      'id' => sanitize_text_field($item['id']),
                      'content' => MCL_Sanitization::sanitize_item_content($item['content']),
                      'priority' => isset($item['priority']) ? sanitize_text_field($item['priority']) : 'none'
                  );
              }
          }
          update_post_meta($post_id, '_mcl_items', $processed_items);
      }

      // Handle tags
      if (isset($request['tags'])) {
          $processed_tags = array();
          foreach ($request['tags'] as $tag) {
              if (isset($tag['name'], $tag['color'])) {
                  $processed_tags[] = array(
                      'name' => sanitize_text_field($tag['name']),
                      'color' => sanitize_hex_color($tag['color'])
                  );
              }
          }
          update_post_meta($post_id, '_mcl_tags', $processed_tags);
      }
  }

  /**
   * Prepare item for response
   */
  public function prepare_item_for_response($post, $request) {
      $data = [
          'id' => $post->ID,
          'title' => $post->post_title,
          'description' => $post->post_content,
          'date_created' => mysql_to_rfc3339($post->post_date_gmt),
          'date_modified' => mysql_to_rfc3339($post->post_modified_gmt),
      ];

      // Add meta data
      $meta_keys = [
          '_mcl_time_date' => 'time_date',
          '_mcl_items' => 'items',
          '_mcl_keyboard_shortcut' => 'keyboard_shortcut',
          '_mcl_active' => 'active',
          '_mcl_checked_state_handling' => 'checked_state_handling',
          '_mcl_theme' => 'theme',
          '_mcl_priority' => 'priority',
          '_mcl_enable_item_priority' => 'enable_item_priority',
          '_mcl_trigger_shortcut' => 'trigger_shortcut',
          '_mcl_trigger_button' => 'trigger_button',
          '_mcl_short_title' => 'short_title',
          '_mcl_public_access' => 'public_access',
          '_mcl_public_permission' => 'public_permission',
          '_mcl_public_checked_state_handling' => 'public_checked_state_handling',
          '_mcl_public_description' => 'public_description',
          '_mcl_priority_display_type' => 'priority_display_type',
          '_mcl_enable_rate_limit' => 'enable_rate_limit',
          '_mcl_tags' => 'tags',
      ];

      foreach ($meta_keys as $meta_key => $response_key) {
          $meta_value = get_post_meta($post->ID, $meta_key, true);
          if ($meta_value !== '') {
              $data[$response_key] = $meta_value;
          }
      }

      // Add checked state based on handling method
      $checked_state_handling = get_post_meta($post->ID, '_mcl_checked_state_handling', true);
      $is_public = get_post_meta($post->ID, '_mcl_public_access', true) == '1';

      if ($checked_state_handling === 'per_user' && is_user_logged_in()) {
          $user_id = get_current_user_id();
          $data['checked_state'] = get_user_meta($user_id, '_mcl_checked_state_' . $post->ID, true) ?: [];
        } else {
            $meta_key = $is_public ? '_mcl_public_global_checked_state' : '_mcl_checked_state';
            $data['checked_state'] = get_post_meta($post->ID, $meta_key, true) ?: [];
        }

        // Add links
        $data['_links'] = array(
            'self' => array(
                array(
                    'href' => rest_url(sprintf('%s/%s/%d', $this->namespace, $this->rest_base, $post->ID))
                )
            ),
            'items' => array(
                array(
                    'href' => rest_url(sprintf('%s/%s/%d/items', $this->namespace, $this->rest_base, $post->ID))
                )
            ),
            'checked-state' => array(
                array(
                    'href' => rest_url(sprintf('%s/%s/%d/checked-state', $this->namespace, $this->rest_base, $post->ID))
                )
            )
        );

        return rest_ensure_response($data);
    }

    /**
     * Prepare a response for collection
     */
    public function prepare_response_for_collection($response) {
        if (!($response instanceof WP_REST_Response)) {
            return $response;
        }

        $data = (array) $response->get_data();
        $links = rest_get_server()->get_compact_response_links($response);

        if (!empty($links)) {
            $data['_links'] = $links;
        }

        return $data;
    }

    /**
     * Get the item schema
     */
    public function get_item_schema() {
        if ($this->schema) {
            return $this->schema;
        }

        $this->schema = array(
            '$schema' => 'http://json-schema.org/draft-04/schema#',
            'title' => 'checklist',
            'type' => 'object',
            'properties' => array(
                'id' => array(
                    'description' => __('Unique identifier for the checklist.', 'magic-checklists'),
                    'type' => 'integer',
                    'context' => array('view', 'edit', 'embed'),
                    'readonly' => true,
                ),
                'title' => array(
                    'description' => __('The title of the checklist.', 'magic-checklists'),
                    'type' => 'string',
                    'required' => true,
                    'context' => array('view', 'edit', 'embed'),
                ),
                'description' => array(
                    'description' => __('The description of the checklist.', 'magic-checklists'),
                    'type' => 'string',
                    'context' => array('view', 'edit'),
                ),
                'items' => array(
                    'description' => __('The checklist items.', 'magic-checklists'),
                    'type' => 'array',
                    'context' => array('view', 'edit'),
                    'items' => array(
                        'type' => 'object',
                        'properties' => array(
                            'id' => array(
                                'type' => 'string',
                                'required' => true,
                            ),
                            'content' => array(
                                'type' => 'string',
                                'required' => true,
                            ),
                            'priority' => array(
                                'type' => 'string',
                                'enum' => array('none', 'low', 'medium', 'high'),
                                'default' => 'none',
                            ),
                        ),
                    ),
                ),
                'checked_state' => array(
                    'description' => __('The checked state of items.', 'magic-checklists'),
                    'type' => 'array',
                    'context' => array('view', 'edit'),
                    'items' => array(
                        'type' => 'string',
                    ),
                ),
                // Add more properties based on your meta fields...
            ),
        );

        return $this->schema;
    }

    /**
     * Get the query params for collections
     */
    public function get_collection_params() {
        $params = parent::get_collection_params();
        
        $params['context']['default'] = 'view';

        $params['active'] = array(
            'description' => __('Limit result set to active or inactive checklists.', 'magic-checklists'),
            'type' => 'boolean',
        );

        $params['priority'] = array(
            'description' => __('Limit result set to checklists with specific priority.', 'magic-checklists'),
            'type' => 'string',
            'enum' => array('none', 'low', 'medium', 'high'),
        );

        return $params;
    }

    /**
     * Check if user can access checklist list
     */
    public function get_items_permissions_check($request) {
      // For public checklists
      if (get_option('mcl_public_access', false)) {
          return true;
      }
      
      // Otherwise require login
      return is_user_logged_in();
    }

    /**
     * Check if user can view a specific checklist
     */
    public function get_item_permissions_check($request) {
        $post = get_post($request['id']);
        if (!$post) {
            return new WP_Error(
                'rest_not_found',
                __('Checklist not found', 'magic-checklists'),
                array('status' => 404)
            );
        }

        // Check if checklist is public
        $is_public = get_post_meta($post->ID, '_mcl_public_access', true) == '1';
        if ($is_public) {
            return true;
        }

        // Otherwise require login
        return is_user_logged_in();
    }

    /**
     * Check if user can create checklists
     */
    public function create_item_permissions_check($request) {
        return current_user_can('edit_posts');
    }

    /**
     * Check if user can update checklists
     */
    public function update_item_permissions_check($request) {
        $post = get_post($request['id']);
        if (!$post) {
            return new WP_Error(
                'rest_not_found',
                __('Checklist not found', 'magic-checklists'),
                array('status' => 404)
            );
        }

        return current_user_can('edit_post', $post->ID);
    }

    /**
     * Check if user can delete checklists
     */
    public function delete_item_permissions_check($request) {
        $post = get_post($request['id']);
        if (!$post) {
            return new WP_Error(
                'rest_not_found',
                __('Checklist not found', 'magic-checklists'),
                array('status' => 404)
            );
        }

        return current_user_can('delete_post', $post->ID);
    }

    private function log_api_access($request, $result) {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }

        $user_id = get_current_user_id();
        $endpoint = $request->get_route();
        $method = $request->get_method();
        $status = is_wp_error($result) ? $result->get_error_code() : '200';
        
        error_log(sprintf(
            'MagicChecklists API Access - User: %d, Endpoint: %s, Method: %s, Status: %s',
            $user_id,
            $endpoint,
            $method,
            $status
        ));
    }
}