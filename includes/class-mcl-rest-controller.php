<?php

if (!defined('ABSPATH')) {
    exit;
}

class MCL_REST_Controller extends WP_REST_Controller {
    /**
     * Namespace for the API
     */
    protected $namespace_v1 = 'magicchecklists/v1';
    protected $namespace_v2 = 'magicchecklists/v2';

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
        add_filter('rest_authentication_errors', [$this, 'handle_auth']);
    }

    /**
     * Handle API authentication
     */
    public function handle_auth($result) {
        // If another authentication handler has already handled this, return that result
        if ($result !== null) {
            return $result;
        }

        // Get the request URI and check if it's for our API
        $request_uri = $_SERVER['REQUEST_URI'] ?? '';
        if (!strpos($request_uri, '/magicchecklists/')) {
            return $result;
        }

        try {
            // Check if it's a v2 endpoint
            $is_v2 = strpos($request_uri, '/magicchecklists/v2/') !== false;

            if ($is_v2) {
                // V2: Check for API key authentication
                $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
                if (strpos($auth_header, 'Bearer ') === 0) {
                    $api_key = str_replace('Bearer ', '', $auth_header);
                    $settings = get_option('mcl_integration_settings', []);

                    // Get and decrypt API keys from integration settings
                    $mainwp_key = isset($settings['mainwp_api_key']) ? $this->decrypt_api_key($settings['mainwp_api_key']) : '';
                    $mcl_key = isset($settings['mcl_api_key']) ? $this->decrypt_api_key($settings['mcl_api_key']) : '';

                    if ((!empty($mainwp_key) && $api_key === $mainwp_key) ||
                        (!empty($mcl_key) && $api_key === $mcl_key)) {
                        return true;
                    }
                }
                return new WP_Error(
                    'rest_not_authorized',
                    __('Invalid API key.', 'magic-checklists'),
                    array('status' => 401)
                );
            } else {
                // V1 endpoints

                // All V1 endpoints: Use WordPress application passwords
                if (!is_user_logged_in()) {
                    return new WP_Error(
                        'rest_not_logged_in',
                        __('You must be logged in to access this endpoint.', 'magic-checklists'),
                        array('status' => 401)
                    );
                }
            }

            return $result;

        } catch (\Exception $e) {
            error_log('MagicChecklists Auth Error: ' . $e->getMessage());
            return new WP_Error(
                'rest_auth_error',
                __('Authentication error occurred.', 'magic-checklists'),
                array('status' => 500)
            );
        }
    }

    /**
     * Decrypt API key
     */
    private function decrypt_api_key($stored_value) {
        if (empty($stored_value)) {
            return '';
        }

        $decoded = base64_decode($stored_value);
        if ($decoded === false) {
            return '';
        }

        // Extract IV from stored data
        $iv = substr($decoded, 0, 16);
        $encrypted = substr($decoded, 16);
        
        $salt = wp_salt('auth');
        
        $decrypted = openssl_decrypt(
            $encrypted,
            'AES-256-CBC',
            $salt,
            0,
            $iv
        );

        return $decrypted !== false ? $decrypted : '';
    }

    /**
     * Register routes
     */
    public function register_routes() {
        // V2 routes first
        register_rest_route($this->namespace_v2, '/' . $this->rest_base, [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_api_key_permission'],
                'args' => $this->get_collection_params(),
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_api_key_permission'],
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
            ]
        ]);

        register_rest_route(
            $this->namespace_v2,
            '/stats',
            [
                'methods'  => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_stats'],
                'permission_callback' => [$this, 'check_api_key_permission'], 
            ]
        );

        // Single checklist operations (V2)
        register_rest_route($this->namespace_v2, '/' . $this->rest_base . '/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_api_key_permission'],
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
                'permission_callback' => [$this, 'check_api_key_permission'],
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_api_key_permission'],
            ],
        ]);

        // Update checklist items (V2)
        register_rest_route($this->namespace_v2, '/checklists/(?P<id>[\d]+)/items', [
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_checklist_items'],
                'permission_callback' => [$this, 'check_api_key_permission'],
                'args' => [
                    'items' => [
                        'required' => true,
                        'type' => 'array',
                    ],
                ],
            ],
        ]);

        // Update checked state (V2)
        register_rest_route($this->namespace_v2, '/checklists/(?P<id>[\d]+)/checked-state', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_checked_state'],
                'permission_callback' => [$this, 'check_api_key_permission'],
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
                'callback' => [$this, 'update_checked_state'],
                'permission_callback' => [$this, 'check_api_key_permission'],
                'args' => [
                    'checked_items' => [
                        'required' => true,
                        'type' => 'array',
                    ],
                ],
            ],
        ]);

        // Notification settings (V2)
        register_rest_route($this->namespace_v2, '/checklists/(?P<id>[\d]+)/notification-settings', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_notification_settings'],
                'permission_callback' => [$this, 'check_api_key_permission'],
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
                'callback' => [$this, 'update_notification_settings'],
                'permission_callback' => [$this, 'check_api_key_permission'],
                'args' => [
                    'id' => [
                        'validate_callback' => function($param) {
                            return is_numeric($param);
                        }
                    ],
                    'notifications_enabled' => ['type' => 'boolean'],
                    'email_enabled' => ['type' => 'boolean'],
                    'integration_enabled' => ['type' => 'boolean'],
                    'email_recipients' => ['type' => 'string'],
                    'slack_webhook_url' => ['type' => 'string'],
                    'discord_webhook_url' => ['type' => 'string'],
                    'notify_on_new_item' => ['type' => 'boolean'],
                    'notify_on_delete_item' => ['type' => 'boolean'],
                    'notify_on_check_item' => ['type' => 'boolean'],
                    'notify_on_uncheck_item' => ['type' => 'boolean'],
                    'notify_on_deadline' => ['type' => 'boolean'],
                    'deadline_threshold_hours' => ['type' => 'integer'],
                    'batch_interval' => ['type' => 'string']
                ],
            ],
        ]);

        // Add this route to help debug API key issues
        register_rest_route($this->namespace_v2, '/debug', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => function($request) {
                    $auth_header = $request->get_header('Authorization');
                    $api_key = str_replace('Bearer ', '', $auth_header);
                    $settings = get_option('mcl_integration_settings', []);
                    $stored_key = $settings['mainwp_api_key'] ?? '';
                    
                    return rest_ensure_response([
                        'has_auth_header' => !empty($auth_header),
                        'auth_header_starts_with_bearer' => strpos($auth_header, 'Bearer ') === 0,
                        'api_key_length' => strlen($api_key),
                        'stored_key_exists' => !empty($stored_key),
                        'keys_match' => $api_key === $stored_key,
                    ]);
                },
                'permission_callback' => '__return_true'
            ]
        ]);

        // Register V1 routes (existing routes with app password auth)
        register_rest_route($this->namespace_v1, '/' . $this->rest_base, [
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
        register_rest_route($this->namespace_v1, '/' . $this->rest_base . '/(?P<id>[\d]+)', [
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
        register_rest_route($this->namespace_v1, '/' . $this->rest_base . '/(?P<id>[\d]+)/items', [
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
        register_rest_route($this->namespace_v1, '/' . $this->rest_base . '/(?P<id>[\d]+)/checked-state', [
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

        register_rest_route($this->namespace_v1, '/' . $this->rest_base . '/(?P<id>[\d]+)/notification-settings', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_notification_settings'],
                'permission_callback' => $this->wrap_permission_callback([$this, 'update_item_permissions_check']),
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
                'callback' => [$this, 'update_notification_settings'],
                'permission_callback' => $this->wrap_permission_callback([$this, 'update_item_permissions_check']),
                'args' => [
                    'id' => [
                        'validate_callback' => function($param) {
                            return is_numeric($param);
                        }
                    ],
                    'notifications_enabled' => ['type' => 'boolean'],
                    'email_enabled' => ['type' => 'boolean'],
                    'integration_enabled' => ['type' => 'boolean'],
                    'email_recipients' => ['type' => 'string'],
                    'slack_webhook_url' => ['type' => 'string'],
                    'discord_webhook_url' => ['type' => 'string'],
                    'notify_on_new_item' => ['type' => 'boolean'],
                    'notify_on_delete_item' => ['type' => 'boolean'],
                    'notify_on_check_item' => ['type' => 'boolean'],
                    'notify_on_uncheck_item' => ['type' => 'boolean'],
                    'notify_on_deadline' => ['type' => 'boolean'],
                    'deadline_threshold_hours' => ['type' => 'integer'],
                    'batch_interval' => ['type' => 'string']
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
        // Check if API is enabled
        $api_check = $this->check_api_enabled();
        if (is_wp_error($api_check)) {
            return $api_check;
        }

        $per_page = isset($request['per_page']) ? absint($request['per_page']) : 10;
        if ($per_page < 1) {
            $per_page = 10;
        }

        $args = [
            'post_type' => 'mcl_checklist',
            'posts_per_page' => $per_page,
            'paged' => isset($request['page']) ? absint($request['page']) : 1,
            'post_status' => ['publish', 'draft'],
        ];

        if (!empty($request['search'])) {
            $args['s'] = $request['search'];
        }

        // Add meta query to get both active and inactive checklists
        $args['meta_query'] = array(
            'relation' => 'OR',
            array(
                'key' => '_mcl_active',
                'value' => '1',
                'compare' => '='
            ),
            array(
                'key' => '_mcl_active',
                'value' => '0',
                'compare' => '='
            ),
            array(
                'key' => '_mcl_active',
                'compare' => 'NOT EXISTS'
            )
        );

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
        $max_pages = $per_page > 0 ? ceil($total_posts / $per_page) : 1;

        $response->header('X-WP-Total', (int) $total_posts);
        $response->header('X-WP-TotalPages', (int) $max_pages);

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
        $this->log_api_access($request, $response);
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
        $response->header('Location', rest_url(sprintf('%s/%s/%d', $this->namespace_v1, $this->rest_base, $post_id)));

        $this->log_api_access($request, $result);
        return $this->wrap_response($response);
    }

    /**
     * Update a checklist
     */
    public function update_item($request) {
        $id = (int) $request['id'];
        $post = get_post($id);

        // DEBUG: Log incoming request data
        error_log('=== MCL REST API: update_item called ===');
        error_log('MCL DEBUG: Checklist ID: ' . $id);
        error_log('MCL DEBUG: Request params: ' . print_r($request->get_params(), true));

        if (empty($post) || $post->post_type !== 'mcl_checklist') {
            error_log('MCL DEBUG: Checklist not found');
            return new WP_Error(
                'mcl_rest_not_found',
                __('Checklist not found', 'magic-checklists'),
                ['status' => 404]
            );
        }

        $prepared_post = $this->prepare_item_for_database($request);
        if (is_wp_error($prepared_post)) {
            error_log('MCL DEBUG: Error preparing post: ' . $prepared_post->get_error_message());
            return $prepared_post;
        }

        $prepared_post['ID'] = $id;
        $post_id = wp_update_post($prepared_post, true);
        if (is_wp_error($post_id)) {
            error_log('MCL DEBUG: Error updating post: ' . $post_id->get_error_message());
            return $post_id;
        }

        error_log('MCL DEBUG: Post updated successfully, now saving meta...');

        // Save checklist meta including item deadlines
        $this->save_checklist_meta($post_id, $request);

        error_log('MCL DEBUG: Meta saved successfully');

        // Dispatch webhook for checklist update
        do_action('mcl_webhook_checklist_updated', $post_id);

        $post = get_post($post_id);
        $response = rest_ensure_response($this->prepare_item_for_response($post, $request));

        error_log('=== MCL REST API: update_item completed ===');

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
        
        // Create map of new items for comparison
        $new_items_map = array();
        foreach ($new_items as $item) {
            if (isset($item['id'])) {
                $new_items_map[$item['id']] = true;
            }
        }
        
        // Check for deleted items BEFORE processing updates
        foreach ($existing_map as $item_id => $existing_item) {
            if (!isset($new_items_map[$item_id])) {
                // Item was deleted
                error_log("MCL: Item deleted - checklist_id=$id, item_id=$item_id");
                do_action('mcl_item_deleted', $id, $existing_item);
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
                
                error_log("MCL: Item added - checklist_id=$id, item_id=$item_id");
                do_action('mcl_item_added', $id, $new_item);
            }
        }
        
        // NOTE: We don't keep remaining items anymore since they were deleted
        
        update_post_meta($id, '_mcl_items', $processed_items);
        
        $response = rest_ensure_response(array(
            'success' => true,
            'items' => $processed_items
        ));
        
        $this->log_api_access($request, $result);
        return $this->wrap_response($response);
    }

    /**
     * Get checked state
     */
    public function get_checked_state($request) {
        $id = (int) $request['id'];
        
        if (empty($post = get_post($id)) || $post->post_type !== 'mcl_checklist') {
            return new WP_Error(
                'mcl_rest_not_found',
                __('Checklist not found', 'magic-checklists'),
                ['status' => 404]
            );
        }
        
        // Get checked state handling method and public access setting
        $checked_state_handling = get_post_meta($id, '_mcl_checked_state_handling', true);
        $is_public = get_post_meta($id, '_mcl_public_access', true) == '1';
        
        // Get the appropriate checked state
        $checked_items = array();
        if ($checked_state_handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            $checked_items = get_user_meta($user_id, '_mcl_checked_state_' . $id, true) ?: array();
        } else {
            $meta_key = $is_public ? '_mcl_public_global_checked_state' : '_mcl_checked_state';
            $checked_items = get_post_meta($id, $meta_key, true) ?: array();
        }

        // Get all items for additional context
        $all_items = get_post_meta($id, '_mcl_items', true) ?: array();
        
        // Calculate completion statistics
        $total_items = count($all_items);
        $checked_count = count($checked_items);
        $completion_percentage = $total_items > 0 ? round(($checked_count / $total_items) * 100, 2) : 0;

        $response = array(
            'id' => $id,
            'checked_items' => $checked_items,
            'stats' => array(
                'total_items' => $total_items,
                'checked_count' => $checked_count,
                'completion_percentage' => $completion_percentage
            ),
            'checked_state_handling' => $checked_state_handling,
            'is_public' => $is_public
        );

        return rest_ensure_response($response);
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
        error_log('MCL DEBUG: save_checklist_meta started for post_id: ' . $post_id);

        $meta_keys = [
            // Basic settings
            'time_date' => '_mcl_time_date',
            'item_deadlines' => '_mcl_item_deadlines',
            'keyboard_shortcut' => '_mcl_keyboard_shortcut',
            'active' => '_mcl_active',
            'checked_state_handling' => '_mcl_checked_state_handling',
            'theme' => '_mcl_theme',
            'priority' => '_mcl_priority',
            'enable_item_priority' => '_mcl_enable_item_priority',
            'trigger_shortcut' => '_mcl_trigger_shortcut',
            'trigger_button' => '_mcl_trigger_button',
            'short_title' => '_mcl_short_title',
            'button_position' => '_mcl_button_position',
            'disable_in_builders' => '_mcl_disable_in_builders',

            // Icon settings
            'checklist_icon_type' => '_mcl_checklist_icon_type',
            'checklist_icon_preset' => '_mcl_checklist_icon_preset',
            'checklist_icon_custom' => '_mcl_checklist_icon_custom',

            // Shortcode settings
            'enable_shortcode' => '_mcl_enable_shortcode',

            // Access settings
            'public_access' => '_mcl_public_access',
            'public_permission' => '_mcl_public_permission',
            'public_checked_state_handling' => '_mcl_public_checked_state_handling',
            'public_description' => '_mcl_public_description',
            'access_roles' => '_mcl_access_roles',
            'access_roles_permission' => '_mcl_access_roles_permission',
            'access_users' => '_mcl_access_users',
            'access_users_permission' => '_mcl_access_users_permission',

            // Display settings
            'priority_display_type' => '_mcl_priority_display_type',
            'enable_rate_limit' => '_mcl_enable_rate_limit',
            'load_everywhere' => '_mcl_load_everywhere',
            'allowed_pages' => '_mcl_allowed_pages',
            'allowed_urls' => '_mcl_allowed_urls',

            // Auto-reset settings
            'auto_reset' => '_mcl_auto_reset',
            'reset_interval' => '_mcl_reset_interval',
            'reset_time' => '_mcl_reset_time',
            'custom_days' => '_mcl_custom_days',
            'custom_weeks' => '_mcl_custom_weeks',
            'custom_months' => '_mcl_custom_months',
            'week_day' => '_mcl_week_day',
            'month_day' => '_mcl_month_day',
            'reset_next' => '_mcl_reset_next',
            'reset_counter' => '_mcl_reset_counter',

            // Custom theme settings (individual fields)
            'drawer_bg_color' => '_mcl_drawer_bg_color',
            'list_item_bg_color' => '_mcl_list_item_bg_color',
            'text_color' => '_mcl_text_color',
            'heading_font_size' => '_mcl_heading_font_size',
            'description_text_color' => '_mcl_description_text_color',
            'description_font_size' => '_mcl_description_font_size',
            'list_item_font_size' => '_mcl_list_item_font_size',
            'primary_button_bg' => '_mcl_primary_button_bg',
            'primary_button_text_color' => '_mcl_primary_button_text_color',
            'secondary_button_bg' => '_mcl_secondary_button_bg',
            'secondary_button_text_color' => '_mcl_secondary_button_text_color',
            'drawer_width' => '_mcl_drawer_width',
            'drawer_height' => '_mcl_drawer_height',
            'float_button_bg' => '_mcl_float_button_bg',
            'float_button_text_color' => '_mcl_float_button_text_color',
            'float_button_font_size' => '_mcl_float_button_font_size',
            'show_float_button_icon' => '_mcl_show_float_button_icon',
            'drawer_border_radius' => '_mcl_drawer_border_radius',
            'checkbox_bg_color' => '_mcl_checkbox_bg_color',
            'checkbox_border_radius' => '_mcl_checkbox_border_radius',
            'checkbox_style' => '_mcl_checkbox_style',
            'checkbox_custom_icon' => '_mcl_checkbox_custom_icon',
            'checkbox_checkmark_color' => '_mcl_checkbox_checkmark_color',
        ];

        error_log('MCL DEBUG: Processing meta keys...');
        $processed_count = 0;
        $skipped_keys = [];

        foreach ($meta_keys as $request_key => $meta_key) {
            if (isset($request[$request_key])) {
                $value = $request[$request_key];
                error_log("MCL DEBUG: Processing '$request_key' => '$meta_key', value type: " . gettype($value) . ", value: " . (is_array($value) ? json_encode($value) : $value));
                $processed_count++;

                // Special handling for timestamp values (time_date is sent in milliseconds from JS)
                if ($meta_key === '_mcl_time_date' && is_numeric($value)) {
                    $timestamp = intval($value);
                    // If timestamp is > 9999999999, it's in milliseconds - convert to seconds
                    if ($timestamp > 9999999999) {
                        $value = intval($timestamp / 1000);
                        error_log("MCL DEBUG: Converted time_date from milliseconds ($timestamp) to seconds ($value)");
                    }
                }

                // Special handling for boolean values
                if (in_array($meta_key, [
                    '_mcl_active',
                    '_mcl_enable_item_priority',
                    '_mcl_trigger_shortcut',
                    '_mcl_trigger_button',
                    '_mcl_public_access',
                    '_mcl_enable_rate_limit',
                    '_mcl_load_everywhere',
                    '_mcl_auto_reset',
                    '_mcl_disable_in_builders',
                    '_mcl_enable_shortcode',
                    '_mcl_show_float_button_icon'
                ])) {
                    $value = rest_sanitize_boolean($value) ? '1' : '0';
                }
                
                // Handle arrays
                if (in_array($meta_key, [
                    '_mcl_access_roles',
                    '_mcl_access_users',
                    '_mcl_allowed_pages',
                    '_mcl_allowed_urls'
                ])) {
                    if (!is_array($value)) {
                        $value = array();
                    }
                }
                
                // Validate permission values
                if (in_array($meta_key, [
                    '_mcl_public_permission',
                    '_mcl_access_roles_permission',
                    '_mcl_access_users_permission'
                ])) {
                    if (!in_array($value, ['view', 'interact', 'edit'])) {
                        $value = 'view';
                    }
                }
                
                // Validate checked state handling
                if (in_array($meta_key, [
                    '_mcl_checked_state_handling',
                    '_mcl_public_checked_state_handling'
                ])) {
                    if (!in_array($value, ['global', 'per_user'])) {
                        $value = 'global';
                    }
                }
                
                // Validate theme
                if ($meta_key === '_mcl_theme' && !in_array($value, ['light', 'dark'])) {
                    $value = 'light';
                }
                
                // Validate priority
                if ($meta_key === '_mcl_priority' && !in_array($value, ['none', 'low', 'medium', 'high', 'critical'])) {
                    $value = 'none';
                }
                
                // Validate priority display type
                if ($meta_key === '_mcl_priority_display_type' && !in_array($value, ['color', 'number'])) {
                    $value = 'color';
                }
                
                // Validate reset interval
                if ($meta_key === '_mcl_reset_interval' && !in_array($value, ['daily', 'weekly', 'monthly', 'custom'])) {
                    $value = 'daily';
                }
                
                // Validate reset time format
                if ($meta_key === '_mcl_reset_time') {
                    if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $value)) {
                        $value = '00:00';
                    }
                }
                
                // Validate custom interval values
                if (in_array($meta_key, ['_mcl_custom_days', '_mcl_custom_weeks', '_mcl_custom_months'])) {
                    $value = absint($value);
                    if ($value < 0) $value = 0;
                }

                // Add validation for button position
                if ($meta_key === '_mcl_button_position') {
                    $valid_positions = ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'draggable'];
                    if (!in_array($value, $valid_positions)) {
                        $value = 'bottom-right';
                    }
                }

                // Add validation for week day
                if ($meta_key === '_mcl_week_day') {
                    $value = absint($value);
                    if ($value < 1) $value = 1;
                    if ($value > 7) $value = 7;
                }

                // Add validation for month day
                if ($meta_key === '_mcl_month_day') {
                    $value = absint($value);
                    if ($value < 1) $value = 1;
                    if ($value > 31) $value = 31;
                }

                // Add validation for icon type
                if ($meta_key === '_mcl_checklist_icon_type') {
                    if (!in_array($value, ['preset', 'custom'])) {
                        $value = 'preset';
                    }
                }

                $old_value = get_post_meta($post_id, $meta_key, true);
                $result = update_post_meta($post_id, $meta_key, $value);
                $status = $result ? 'UPDATED' : ($old_value === $value ? 'unchanged' : 'FAILED');
                error_log("MCL DEBUG: '$meta_key' = " . (is_array($value) ? json_encode($value) : $value) . " [$status]");
            } else {
                $skipped_keys[] = $request_key;
            }
        }

        error_log("MCL DEBUG: Processed $processed_count meta keys");
        if (!empty($skipped_keys)) {
            error_log("MCL DEBUG: Skipped keys (not in request): " . implode(', ', array_slice($skipped_keys, 0, 20)) . (count($skipped_keys) > 20 ? '...' : ''));
        }

        // Handle items separately as they need special processing
        if (isset($request['items'])) {
            error_log('MCL DEBUG: Processing items array with ' . count($request['items']) . ' items');
            $processed_items = array();
            $item_deadlines = array();

            foreach ($request['items'] as $item) {
                if (isset($item['id'], $item['content'])) {
                    $processed_item = array(
                        'id' => sanitize_text_field($item['id']),
                        'content' => MCL_Sanitization::sanitize_item_content($item['content']),
                        'priority' => isset($item['priority']) ? sanitize_text_field($item['priority']) : 'none',
                        // Always include checked state (default to false)
                        'checked' => isset($item['checked']) && rest_sanitize_boolean($item['checked']) ? true : false,
                        // Always include locked state (default to false)
                        'locked' => isset($item['locked']) && rest_sanitize_boolean($item['locked']) ? true : false,
                    );

                    // Preserve parent_id for nested items
                    if (isset($item['parent_id']) && !empty($item['parent_id'])) {
                        $processed_item['parent_id'] = sanitize_text_field($item['parent_id']);
                    }

                    // Handle item deadline - can be ISO string or timestamp
                    if (isset($item['deadline']) && !empty($item['deadline'])) {
                        $deadline = $item['deadline'];

                        // If it's a string like "2025-12-06T13:33", convert to timestamp
                        if (is_string($deadline) && !is_numeric($deadline)) {
                            $deadline_timestamp = strtotime($deadline);
                            if ($deadline_timestamp !== false) {
                                $processed_item['deadline'] = $deadline;
                                $item_deadlines[$item['id']] = $deadline_timestamp;
                            }
                        } elseif (is_numeric($deadline)) {
                            // If it's already a timestamp (milliseconds from JS), convert to seconds
                            $timestamp = intval($deadline);
                            if ($timestamp > 9999999999) {
                                // Likely milliseconds, convert to seconds
                                $timestamp = intval($timestamp / 1000);
                            }
                            $processed_item['deadline'] = date('Y-m-d\TH:i', $timestamp);
                            $item_deadlines[$item['id']] = $timestamp;
                        }
                    }

                    $processed_items[] = $processed_item;
                }
            }

            update_post_meta($post_id, '_mcl_items', $processed_items);
            error_log('MCL DEBUG: Saved ' . count($processed_items) . ' items');

            // Also update item_deadlines meta if any deadlines were found
            if (!empty($item_deadlines)) {
                update_post_meta($post_id, '_mcl_item_deadlines', $item_deadlines);
                error_log('MCL DEBUG: Saved ' . count($item_deadlines) . ' item deadlines');
            }

            // Extract checked item IDs and update the checked state meta
            $checked_item_ids = array();
            foreach ($processed_items as $item) {
                if (!empty($item['checked'])) {
                    $checked_item_ids[] = $item['id'];
                }
            }

            // Get current settings (use request values if available, otherwise get from meta)
            $checked_state_handling = isset($request['checked_state_handling'])
                ? $request['checked_state_handling']
                : get_post_meta($post_id, '_mcl_checked_state_handling', true);
            $is_public = isset($request['public_access'])
                ? rest_sanitize_boolean($request['public_access'])
                : get_post_meta($post_id, '_mcl_public_access', true) == '1';
            $public_checked_state_handling = isset($request['public_checked_state_handling'])
                ? $request['public_checked_state_handling']
                : get_post_meta($post_id, '_mcl_public_checked_state_handling', true);

            // Always update the main checked state (post meta - used as base/global state)
            update_post_meta($post_id, '_mcl_checked_state', $checked_item_ids);
            error_log('MCL DEBUG: Updated _mcl_checked_state with ' . count($checked_item_ids) . ' checked items');

            // Also update public global checked state if public access is enabled
            if ($is_public) {
                update_post_meta($post_id, '_mcl_public_global_checked_state', $checked_item_ids);
                error_log('MCL DEBUG: Updated _mcl_public_global_checked_state with ' . count($checked_item_ids) . ' checked items');
            }

            // For per_user modes, also update the current user's checked state (if logged in via API)
            // This ensures the admin/API user sees the pushed state
            if (is_user_logged_in()) {
                $user_id = get_current_user_id();
                // Update for drawer context (most common)
                update_user_meta($user_id, '_mcl_drawer_checked_state_' . $post_id, $checked_item_ids);
                error_log('MCL DEBUG: Updated user meta _mcl_drawer_checked_state_' . $post_id . ' for user ' . $user_id);
            }
        } else {
            error_log('MCL DEBUG: No items in request');
        }

        // Handle item deadlines separately (if sent as a separate object)
        if (isset($request['item_deadlines'])) {
            $processed_deadlines = array();
            foreach ($request['item_deadlines'] as $item_id => $timestamp) {
                $item_id = sanitize_text_field($item_id);
                $timestamp = intval($timestamp);
                // Convert milliseconds to seconds if needed
                if ($timestamp > 9999999999) {
                    $timestamp = intval($timestamp / 1000);
                }
                if ($timestamp > 0) {
                    $processed_deadlines[$item_id] = $timestamp;
                }
            }
            update_post_meta($post_id, '_mcl_item_deadlines', $processed_deadlines);
            error_log('MCL DEBUG: Saved ' . count($processed_deadlines) . ' item deadlines from separate object');
        }

        // Handle tags
        if (isset($request['tags'])) {
            error_log('MCL DEBUG: Processing tags array with ' . count($request['tags']) . ' tags');
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
            error_log('MCL DEBUG: Saved ' . count($processed_tags) . ' tags');
        }

        // Handle shortcode settings (JSON object)
        if (isset($request['shortcode_settings'])) {
            error_log('MCL DEBUG: Processing shortcode_settings: ' . json_encode($request['shortcode_settings']));
            $shortcode_settings = $request['shortcode_settings'];
            if (is_array($shortcode_settings)) {
                update_post_meta($post_id, '_mcl_shortcode_settings', $shortcode_settings);
                error_log('MCL DEBUG: Saved shortcode_settings');
            }
        } else {
            error_log('MCL DEBUG: No shortcode_settings in request');
        }

        // Handle role permission rules
        if (isset($request['role_permission_rules'])) {
            error_log('MCL DEBUG: Processing role_permission_rules: ' . json_encode($request['role_permission_rules']));
            $processed_rules = array();
            foreach ((array) $request['role_permission_rules'] as $rule) {
                if (isset($rule['permission'], $rule['roles']) && is_array($rule['roles'])) {
                    $permission = sanitize_text_field($rule['permission']);
                    if (in_array($permission, ['view', 'interact', 'edit'])) {
                        $processed_rules[] = array(
                            'permission' => $permission,
                            'roles' => array_map('sanitize_text_field', $rule['roles'])
                        );
                    }
                }
            }
            update_post_meta($post_id, '_mcl_role_permission_rules', $processed_rules);
            error_log('MCL DEBUG: Saved ' . count($processed_rules) . ' role permission rules');
        }

        // Handle user permission rules
        if (isset($request['user_permission_rules'])) {
            error_log('MCL DEBUG: Processing user_permission_rules: ' . json_encode($request['user_permission_rules']));
            $processed_rules = array();
            foreach ((array) $request['user_permission_rules'] as $rule) {
                if (isset($rule['permission'], $rule['users']) && is_array($rule['users'])) {
                    $permission = sanitize_text_field($rule['permission']);
                    if (in_array($permission, ['view', 'interact', 'edit'])) {
                        $processed_rules[] = array(
                            'permission' => $permission,
                            'users' => array_map('sanitize_text_field', $rule['users'])
                        );
                    }
                }
            }
            update_post_meta($post_id, '_mcl_user_permission_rules', $processed_rules);
            error_log('MCL DEBUG: Saved ' . count($processed_rules) . ' user permission rules');
        }

        error_log('MCL DEBUG: save_checklist_meta completed');

        // If auto-reset settings have changed, recalculate next reset time
        if (isset($request['reset_interval']) ||
            isset($request['reset_time']) ||
            isset($request['custom_days']) ||
            isset($request['custom_weeks']) ||
            isset($request['custom_months'])) {
            $this->calculate_next_custom_reset($post_id, $request);
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

    // Get items and their deadlines
    $items = get_post_meta($post->ID, '_mcl_items', true) ?: array();
    $item_deadlines = get_post_meta($post->ID, '_mcl_item_deadlines', true) ?: array();

    // Add deadline information to items
    foreach ($items as &$item) {
        if (isset($item_deadlines[$item['id']])) {
            $deadline_timestamp = intval($item_deadlines[$item['id']]);
            $item['deadline'] = date('Y-m-d H:i:s', $deadline_timestamp);
            $item['deadline_timestamp'] = $deadline_timestamp;
                                $item['deadline_formatted'] = MCL_Admin::format_date($deadline_timestamp, false);
        }
    }
    unset($item);

    $data['items'] = $items;
    $data['item_deadlines'] = $item_deadlines;

    // Add meta data
    $meta_keys = [
        // Basic settings
        '_mcl_time_date' => 'time_date',
        '_mcl_keyboard_shortcut' => 'keyboard_shortcut',
        '_mcl_active' => 'active',
        '_mcl_checked_state_handling' => 'checked_state_handling',
        '_mcl_theme' => 'theme',
        '_mcl_priority' => 'priority',
        '_mcl_enable_item_priority' => 'enable_item_priority',
        '_mcl_trigger_shortcut' => 'trigger_shortcut',
        '_mcl_trigger_button' => 'trigger_button',
        '_mcl_short_title' => 'short_title',
        '_mcl_button_position' => 'button_position',
        '_mcl_disable_in_builders' => 'disable_in_builders',

        // Icon settings
        '_mcl_checklist_icon_type' => 'checklist_icon_type',
        '_mcl_checklist_icon_preset' => 'checklist_icon_preset',
        '_mcl_checklist_icon_custom' => 'checklist_icon_custom',

        // Shortcode settings
        '_mcl_enable_shortcode' => 'enable_shortcode',

        // Access settings
        '_mcl_public_access' => 'public_access',
        '_mcl_public_permission' => 'public_permission',
        '_mcl_public_checked_state_handling' => 'public_checked_state_handling',
        '_mcl_public_description' => 'public_description',
        '_mcl_access_roles' => 'access_roles',
        '_mcl_access_roles_permission' => 'access_roles_permission',
        '_mcl_access_users' => 'access_users',
        '_mcl_access_users_permission' => 'access_users_permission',

        // Display settings
        '_mcl_priority_display_type' => 'priority_display_type',
        '_mcl_enable_rate_limit' => 'enable_rate_limit',
        '_mcl_tags' => 'tags',
        '_mcl_load_everywhere' => 'load_everywhere',
        '_mcl_allowed_pages' => 'allowed_pages',
        '_mcl_allowed_urls' => 'allowed_urls',

        // Auto-reset settings
        '_mcl_auto_reset' => 'auto_reset',
        '_mcl_reset_interval' => 'reset_interval',
        '_mcl_reset_time' => 'reset_time',
        '_mcl_reset_next' => 'reset_next',
        '_mcl_reset_counter' => 'reset_counter',
        '_mcl_custom_days' => 'custom_days',
        '_mcl_custom_weeks' => 'custom_weeks',
        '_mcl_custom_months' => 'custom_months',
        '_mcl_week_day' => 'week_day',
        '_mcl_month_day' => 'month_day',
    ];

    foreach ($meta_keys as $meta_key => $response_key) {
        $meta_value = get_post_meta($post->ID, $meta_key, true);
        if ($meta_value !== '') {
            $data[$response_key] = $meta_value;
        }
    }

    // Get notification settings
    global $wpdb;
    $notification_settings = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}mcl_notification_settings WHERE checklist_id = %d",
        $post->ID
    ));

    if ($notification_settings) {
        $data['notification_settings'] = [
            'notifications_enabled' => (bool)$notification_settings->notifications_enabled,
            'email_enabled' => (bool)$notification_settings->email_enabled,
            'integration_enabled' => (bool)$notification_settings->integration_enabled,
            'email_recipients' => $notification_settings->email_recipients,
            'slack_webhook_url' => $notification_settings->slack_webhook_url,
            'discord_webhook_url' => $notification_settings->discord_webhook_url,
            'notify_on_new_item' => (bool)$notification_settings->notify_on_new_item,
            'notify_on_delete_item' => (bool)$notification_settings->notify_on_delete_item,
            'notify_on_check_item' => (bool)$notification_settings->notify_on_check_item,
            'notify_on_uncheck_item' => (bool)$notification_settings->notify_on_uncheck_item,
            'notify_on_deadline' => (bool)$notification_settings->notify_on_deadline,
            'deadline_threshold_hours' => (int)$notification_settings->deadline_threshold_hours,
            'batch_interval' => $notification_settings->batch_interval
        ];
    }

    // Add shortcode settings
    $shortcode_settings = get_post_meta($post->ID, '_mcl_shortcode_settings', true);
    if (!empty($shortcode_settings)) {
        $data['shortcode_settings'] = $shortcode_settings;
    }

    // Add custom theme settings (individual meta keys)
    $custom_theme_keys = [
        'drawer_bg_color',
        'list_item_bg_color',
        'text_color',
        'heading_font_size',
        'description_text_color',
        'description_font_size',
        'list_item_font_size',
        'primary_button_bg',
        'primary_button_text_color',
        'secondary_button_bg',
        'secondary_button_text_color',
        'drawer_width',
        'drawer_height',
        'float_button_bg',
        'float_button_text_color',
        'float_button_font_size',
        'show_float_button_icon',
        'drawer_border_radius',
        'checkbox_bg_color',
        'checkbox_border_radius',
        'checkbox_style',
        'checkbox_custom_icon',
        'checkbox_checkmark_color'
    ];
    $custom_theme = [];
    foreach ($custom_theme_keys as $key) {
        $value = get_post_meta($post->ID, '_mcl_' . $key, true);
        if ($value !== '') {
            $custom_theme[$key] = $value;
        }
    }
    if (!empty($custom_theme)) {
        $data['custom_theme'] = $custom_theme;
    }

    // Add permission rules
    $role_permission_rules = get_post_meta($post->ID, '_mcl_role_permission_rules', true);
    if (!empty($role_permission_rules) && is_array($role_permission_rules)) {
        $data['role_permission_rules'] = $role_permission_rules;
    }

    $user_permission_rules = get_post_meta($post->ID, '_mcl_user_permission_rules', true);
    if (!empty($user_permission_rules) && is_array($user_permission_rules)) {
        $data['user_permission_rules'] = $user_permission_rules;
    }

    // Add checked state - for REST API, always use _mcl_checked_state as primary source
    // This ensures MagicDash sync gets the correct checked state regardless of public access settings
    $checked_state = get_post_meta($post->ID, '_mcl_checked_state', true);

    // Fall back to public global checked state if main checked state is empty
    if (empty($checked_state)) {
        $checked_state = get_post_meta($post->ID, '_mcl_public_global_checked_state', true);
    }

    $data['checked_state'] = $checked_state ?: [];

    // Add links
    $data['_links'] = array(
        'self' => array(
            array(
                'href' => rest_url(sprintf('%s/%s/%d', $this->namespace_v1, $this->rest_base, $post->ID))
            )
        ),
        'items' => array(
            array(
                'href' => rest_url(sprintf('%s/%s/%d/items', $this->namespace_v1, $this->rest_base, $post->ID))
            )
        ),
        'checked-state' => array(
            array(
                'href' => rest_url(sprintf('%s/%s/%d/checked-state', $this->namespace_v1, $this->rest_base, $post->ID))
            )
        ),
        'notification-settings' => array(
            array(
                'href' => rest_url(sprintf('%s/%s/%d/notification-settings', $this->namespace_v1, $this->rest_base, $post->ID))
            )
        )
    );

    // Get access users with details
    $access_users = get_post_meta($post->ID, '_mcl_access_users', true);
    if (!empty($access_users)) {
        if (is_string($access_users)) {
            $access_users = maybe_unserialize($access_users);
        }
        $data['access_users'] = $this->get_user_details($access_users);
    } else {
        $data['access_users'] = array();
    }

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
                'auto_reset' => array(
                'description' => __('Whether auto-reset is enabled.', 'magic-checklists'),
                'type' => 'boolean',
                'context' => array('view', 'edit'),
                ),
                'reset_interval' => array(
                    'description' => __('Reset interval type.', 'magic-checklists'),
                    'type' => 'string',
                    'enum' => array('daily', 'weekly', 'monthly', 'custom'),
                    'context' => array('view', 'edit'),
                ),
                'reset_time' => array(
                    'description' => __('Time of day for reset (HH:mm format).', 'magic-checklists'),
                    'type' => 'string',
                    'pattern' => '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
                    'context' => array('view', 'edit'),
                ),
                'custom_days' => array(
                    'description' => __('Number of days for custom reset interval.', 'magic-checklists'),
                    'type' => 'integer',
                    'minimum' => 0,
                    'context' => array('view', 'edit'),
                ),
                'custom_weeks' => array(
                    'description' => __('Number of weeks for custom reset interval.', 'magic-checklists'),
                    'type' => 'integer',
                    'minimum' => 0,
                    'context' => array('view', 'edit'),
                ),
                'custom_months' => array(
                    'description' => __('Number of months for custom reset interval.', 'magic-checklists'),
                    'type' => 'integer',
                    'minimum' => 0,
                    'context' => array('view', 'edit'),
                ),
                'reset_next' => array(
                    'description' => __('Timestamp of next reset.', 'magic-checklists'),
                    'type' => 'integer',
                    'context' => array('view'),
                    'readonly' => true,
                ),
                'reset_counter' => array(
                    'description' => __('Number of times the checklist has been reset.', 'magic-checklists'),
                    'type' => 'integer',
                    'context' => array('view'),
                    'readonly' => true,
                ),
                'reset_day' => array(
                    'description' => __('Day of the week for weekly reset (1-7, Monday-Sunday).', 'magic-checklists'),
                    'type' => 'integer',
                    'minimum' => 1,
                    'maximum' => 7,
                    'context' => array('view', 'edit'),
                ),
                'reset_date' => array(
                    'description' => __('Date of the month for monthly reset (1-31).', 'magic-checklists'),
                    'type' => 'integer',
                    'minimum' => 1,
                    'maximum' => 31,
                    'context' => array('view', 'edit'),
                ),
            ),
        );

        return $this->schema;
    }

    /**
     * Get the query params for collections
     */
    public function get_collection_params() {
        return [
            'page' => [
                'description' => __('Current page of the collection.', 'magic-checklists'),
                'type' => 'integer',
                'default' => 1,
                'minimum' => 1,
                'sanitize_callback' => 'absint',
            ],
            'per_page' => [
                'description' => __('Maximum number of items to be returned in result set.', 'magic-checklists'),
                'type' => 'integer',
                'default' => 10,
                'minimum' => 1,
                'maximum' => 100,
                'sanitize_callback' => 'absint',
            ],
            'search' => [
                'description' => __('Limit results to those matching a string.', 'magic-checklists'),
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
        ];
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

    /**
     * Get notification settings
     */
    public function get_notification_settings($request) {
        $checklist_id = (int) $request['id'];
        
        global $wpdb;
        $settings = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}mcl_notification_settings WHERE checklist_id = %d",
            $checklist_id
        ));

        if (!$settings) {
            return new WP_Error(
                'rest_notification_settings_not_found',
                __('No notification settings found for this checklist.', 'magic-checklists'),
                ['status' => 404]
            );
        }

        $data = [
            'notifications_enabled' => (bool)$settings->notifications_enabled,
            'email_enabled' => (bool)$settings->email_enabled,
            'integration_enabled' => (bool)$settings->integration_enabled,
            'email_recipients' => $settings->email_recipients,
            'slack_webhook_url' => $settings->slack_webhook_url,
            'discord_webhook_url' => $settings->discord_webhook_url,
            'notify_on_new_item' => (bool)$settings->notify_on_new_item,
            'notify_on_delete_item' => (bool)$settings->notify_on_delete_item,
            'notify_on_check_item' => (bool)$settings->notify_on_check_item,
            'notify_on_uncheck_item' => (bool)$settings->notify_on_uncheck_item,
            'notify_on_deadline' => (bool)$settings->notify_on_deadline,
            'deadline_threshold_hours' => (int)$settings->deadline_threshold_hours,
            'batch_interval' => $settings->batch_interval
        ];

        return rest_ensure_response($data);
    }

    /**
     * Update notification settings
     */
    public function update_notification_settings($request) {
        $checklist_id = (int) $request['id'];
        
        $notification_manager = MCL_Notification_Manager::get_instance();
        $settings = [
            'notifications_enabled' => $request['notifications_enabled'] ?? false,
            'email_enabled' => $request['email_enabled'] ?? false,
            'integration_enabled' => $request['integration_enabled'] ?? false,
            'email_recipients' => $request['email_recipients'] ?? '',
            'slack_webhook_url' => $request['slack_webhook_url'] ?? '',
            'discord_webhook_url' => $request['discord_webhook_url'] ?? '',
            'notify_on_new_item' => $request['notify_on_new_item'] ?? false,
            'notify_on_delete_item' => $request['notify_on_delete_item'] ?? false,
            'notify_on_check_item' => $request['notify_on_check_item'] ?? false,
            'notify_on_uncheck_item' => $request['notify_on_uncheck_item'] ?? false,
            'notify_on_deadline' => $request['notify_on_deadline'] ?? false,
            'deadline_threshold_hours' => $request['deadline_threshold_hours'] ?? 24,
            'batch_interval' => $request['batch_interval'] ?? 'fifteen_minutes'
        ];

        $notification_manager->save_notification_settings($checklist_id, $settings);

        return rest_ensure_response([
            'success' => true,
            'message' => __('Notification settings updated successfully.', 'magic-checklists'),
            'settings' => $settings
        ]);
    }

    /**
     * Calculate next reset time for custom intervals
     */
    private function calculate_next_custom_reset($post_id, $request) {
        $reset_time = get_post_meta($post_id, '_mcl_reset_time', true) ?: '00:00';
        $time_parts = explode(':', $reset_time);
        $hours = intval($time_parts[0]);
        $minutes = intval($time_parts[1]);

        $now = current_time('timestamp');
        $today = strtotime(date('Y-m-d', $now) . " {$hours}:{$minutes}:00");
        $next = $today;

        // Get custom interval values
        $custom_days = absint($request['custom_days'] ?? get_post_meta($post_id, '_mcl_custom_days', true) ?? 1);
        $custom_weeks = absint($request['custom_weeks'] ?? get_post_meta($post_id, '_mcl_custom_weeks', true) ?? 0);
        $custom_months = absint($request['custom_months'] ?? get_post_meta($post_id, '_mcl_custom_months', true) ?? 0);

        // Calculate total days
        $total_days = $custom_days + ($custom_weeks * 7) + ($custom_months * 30);
        
        // Ensure at least 1 day
        if ($total_days < 1) {
            $total_days = 1;
        }

        $next = strtotime("+{$total_days} days", $today);
        update_post_meta($post_id, '_mcl_reset_next', $next);
    }

    /**
     * Get checklist statistics
     */
    public function get_stats($request) {
        try {
            // Check if API is enabled
            $api_check = $this->check_api_enabled();
            if (is_wp_error($api_check)) {
                return $api_check;
            }

            global $wpdb;
            
            // Get total checklists
            $total_checklists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = %s AND post_status = 'publish'",
                'mcl_checklist'
            ));

            // Get all checklist IDs
            $checklist_ids = $wpdb->get_col($wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts} WHERE post_type = %s AND post_status = 'publish'",
                'mcl_checklist'
            ));

            $total_items = 0;
            $completed_items = 0;
            $deadline_timestamp = null;
            $checklist_id = null;
            $checklist_title = '';

            foreach ($checklist_ids as $id) {
                $items = get_post_meta($id, '_mcl_items', true);
                if (!empty($items) && is_array($items)) {
                    $total_items += count($items);
                    
                    $checked_state = get_post_meta($id, '_mcl_checked_state', true);
                    if (!empty($checked_state) && is_array($checked_state)) {
                        $completed_items += count($checked_state);
                    }
                }
                
                // Get deadline timestamp
                $time_date = get_post_meta($id, '_mcl_time_date', true);
                if (!empty($time_date)) {
                    if (empty($deadline_timestamp) || $time_date < $deadline_timestamp) {
                        $deadline_timestamp = $time_date;
                        $checklist_id = $id;
                        $checklist = get_post($id);
                        if ($checklist) {
                            $checklist_title = $checklist->post_title;
                        }
                    }
                }
            }

            return rest_ensure_response([
                'total_checklists' => (int)$total_checklists,
                'total_items' => (int)$total_items,
                'completed_items' => (int)$completed_items,
                'deadline_timestamp' => $deadline_timestamp,
                'checklist_id' => $checklist_id,
                'title' => $checklist_title
            ]);

        } catch (\Exception $e) {
            error_log('MagicChecklists Stats Error: ' . $e->getMessage());
            return new WP_Error(
                'stats_error',
                __('Error retrieving statistics.', 'magic-checklists'),
                ['status' => 500]
            );
        }
    }

    /**
     * Check API key permission
     */
    public function check_api_key_permission($request) {
        $auth_header = $request->get_header('Authorization');
        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return new WP_Error(
                'rest_forbidden',
                __('Missing or invalid authorization header.', 'magic-checklists'),
                ['status' => 401]
            );
        }

        $api_key = str_replace('Bearer ', '', $auth_header);
        $settings = get_option('mcl_integration_settings', []);

        // Get and decrypt API keys from integration settings
        $mainwp_key = isset($settings['mainwp_api_key']) ? $this->decrypt_api_key($settings['mainwp_api_key']) : '';
        $mcl_key = isset($settings['mcl_api_key']) ? $this->decrypt_api_key($settings['mcl_api_key']) : '';

        if ((!empty($mainwp_key) && $api_key === $mainwp_key) ||
            (!empty($mcl_key) && $api_key === $mcl_key)) {
            return true;
        }

        return new WP_Error(
            'rest_forbidden',
            __('Invalid API key.', 'magic-checklists'),
            ['status' => 401]
        );
    }

    private function get_user_details($user_ids_or_emails) {
        if (empty($user_ids_or_emails)) {
            return array();
        }

        $users = array();
        foreach ($user_ids_or_emails as $identifier) {
            // Try to get user by ID first
            if (is_numeric($identifier)) {
                $user = get_user_by('id', $identifier);
            } else {
                // Try email if not numeric
                $user = get_user_by('email', $identifier);
                if (!$user) {
                    // Try login/username if email fails
                    $user = get_user_by('login', $identifier);
                }
            }

            if ($user) {
                $users[] = array(
                    'id' => $user->ID,
                    'display_name' => $user->display_name,
                    'user_login' => $user->user_login,
                    'user_email' => $user->user_email,
                    'identifier' => $user->ID // Use ID as identifier
                );
            }
        }
        return $users;
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
        error_log("MCL: REST Controller - comparing states for checklist_id=$id");
        error_log("MCL: Previous state: " . print_r($previous_state, true));
        error_log("MCL: New checked items: " . print_r($checked_items, true));
        
        foreach ($checked_items as $item_id) {
            if (!in_array($item_id, $previous_state)) {
                error_log("MCL: REST Controller firing mcl_item_checked for checklist_id=$id, item_id=$item_id");
                do_action('mcl_item_checked', $id, $item_id, true);
            }
        }
        
        foreach ($previous_state as $item_id) {
            if (!in_array($item_id, $checked_items)) {
                error_log("MCL: REST Controller firing mcl_item_unchecked for checklist_id=$id, item_id=$item_id");
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
        
        // Get all items for additional context
        $all_items = get_post_meta($id, '_mcl_items', true) ?: array();
        
        // Calculate completion statistics
        $total_items = count($all_items);
        $checked_count = count($checked_items);
        $completion_percentage = $total_items > 0 ? round(($checked_count / $total_items) * 100, 2) : 0;

        $response = array(
            'id' => $id,
            'checked_items' => $checked_items,
            'updated' => true,
            'stats' => array(
                'total_items' => $total_items,
                'checked_count' => $checked_count,
                'completion_percentage' => $completion_percentage
            )
        );
        
        return rest_ensure_response($response);
    }
}