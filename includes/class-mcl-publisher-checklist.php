<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MCL_Publisher_Checklist {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_gutenberg_assets'));
        add_action('wp_ajax_mcl_check_publisher_requirements', array($this, 'ajax_check_requirements'));
        add_action('wp_ajax_mcl_save_publisher_checklist_state', array($this, 'ajax_save_checklist_state'));
        add_action('wp_ajax_mcl_get_publisher_checklist_data', array($this, 'ajax_get_publisher_checklist_data'));
        add_action('wp_ajax_mcl_get_meta_fields', array($this, 'ajax_get_meta_fields'));
        add_action('wp_ajax_mcl_get_requirement_definitions', array($this, 'ajax_get_requirement_definitions'));
        add_action('wp_ajax_mcl_get_post_types', array($this, 'ajax_get_post_types'));
        add_action('wp_ajax_save_publisher_checklist', array($this, 'ajax_save_publisher_checklist'));
        add_action('transition_post_status', array($this, 'check_publish_requirements'), 10, 3);
    }
    
    public function init() {
        // Register the Gutenberg sidebar
        add_action('wp_loaded', array($this, 'register_gutenberg_sidebar'));
    }
    
    public function enqueue_gutenberg_assets() {
        $screen = get_current_screen();
        
        // Only load on post edit screens
        if (!$screen || !in_array($screen->base, array('post'))) {
            return;
        }
        
        // Only load for public post types that support editor
        $post_type_obj = get_post_type_object($screen->post_type);
        if (!$post_type_obj || !$post_type_obj->public || !post_type_supports($screen->post_type, 'editor')) {
            return;
        }
        
        wp_enqueue_script(
            'mcl-publisher-gutenberg',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/mcl-publisher-gutenberg.js',
            array('wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components', 'wp-data', 'wp-editor'),
            MAGIC_CHECKLISTS_VERSION,
            true
        );
        
        wp_enqueue_style(
            'mcl-publisher-gutenberg',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/mcl-publisher-gutenberg.css',
            array(),
            MAGIC_CHECKLISTS_VERSION
        );
        
        wp_localize_script('mcl-publisher-gutenberg', 'mclPublisher', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mcl_publisher_nonce'),
            'debug' => defined('WP_DEBUG') && WP_DEBUG,
            'i18n' => array(
                'publisherChecklist' => __('Publisher Checklist', 'magic-checklists'),
                'allRequirementsMet' => __('All requirements met!', 'magic-checklists'),
                'requirementsNotMet' => __('Some requirements are not met', 'magic-checklists'),
                'checking' => __('Checking...', 'magic-checklists'),
                'error' => __('Error checking requirements', 'magic-checklists'),
                'publishBlocked' => __('Publishing is blocked until all required items are completed.', 'magic-checklists')
            )
        ));
    }
    
    public function get_active_publisher_checklists_for_post($post) {
        $checklists = get_posts(array(
            'post_type' => 'mcl_checklist',
            'post_status' => 'publish',
            'meta_query' => array(
                'relation' => 'AND',
                array(
                    'key' => '_mcl_checklist_type',
                    'value' => 'publisher'
                ),
                array(
                    'key' => '_mcl_active',
                    'value' => '1'
                ),
                array(
                    'relation' => 'OR',
                    array(
                        'key' => '_mcl_publisher_post_types',
                        'value' => $post->post_type,
                        'compare' => 'LIKE'
                    ),
                    array(
                        'key' => '_mcl_publisher_post_types',
                        'value' => 'all',
                        'compare' => '='
                    )
                )
            ),
            'posts_per_page' => -1
        ));
        
        return $checklists;
    }
    
    public function should_load_for_post($post) {
        if (!$post) {
            return false;
        }
        
        // Check if post type supports editor and is public
        $post_type_obj = get_post_type_object($post->post_type);
        if (!$post_type_obj || !$post_type_obj->public || !post_type_supports($post->post_type, 'editor')) {
            return false;
        }
        
        // Check if there are any active publisher checklists for this post type
        $checklists = $this->get_active_publisher_checklists_for_post($post);
        return !empty($checklists);
    }
    
    public function prepare_checklists_for_js($checklists) {
        $prepared = array();
        
        foreach ($checklists as $checklist) {
            $requirements = MCL_DB_Manager::get_publisher_requirements($checklist->ID);
            $default_requirements = MCL_DB_Manager::get_default_publisher_requirements();
            
            $checklist_data = array(
                'id' => $checklist->ID,
                'title' => $checklist->post_title,
                'description' => $checklist->post_content,
                'show_tips' => get_post_meta($checklist->ID, '_mcl_show_tips', true) == '1',
                'requirements' => array()
            );
            
            foreach ($requirements as $req) {
                if (isset($default_requirements[$req['type']])) {
                    $requirement_def = $default_requirements[$req['type']];
                    
                    // Create display label based on requirement type and config
                    $display_label = $requirement_def['label'];
                    if ($req['type'] === 'custom_field' && !empty($req['config']['field_label'])) {
                        $display_label = $req['config']['field_label'];
                    } elseif ($req['type'] === 'custom_item' && !empty($req['config']['item_title'])) {
                        $display_label = $req['config']['item_title'];
                    }
                    
                    $checklist_data['requirements'][] = array(
                        'type' => $req['type'],
                        'instance_id' => $req['instance_id'],
                        'label' => $display_label,
                        'config' => $req['config'], // This will include use_custom_tip and custom_tip
                        'required' => $req['required'],
                        'auto_check' => $requirement_def['auto_check'],
                        'status' => 'pending' // Will be updated by JS
                    );
                }
            }
            
            $prepared[] = $checklist_data;
        }
        
        return $prepared;
    }
    
    public function format_requirement_description($description, $config) {
        // Replace placeholders in description with actual config values
        $formatted = $description;
        
        foreach ($config as $key => $value) {
            $placeholder_patterns = array(
                '[X]' => $value,
                '[Y]' => isset($config['max_' . str_replace('min_', '', $key)]) ? $config['max_' . str_replace('min_', '', $key)] : $value,
                '[' . strtoupper($key) . ']' => $value
            );
            
            foreach ($placeholder_patterns as $pattern => $replacement) {
                $formatted = str_replace($pattern, $replacement, $formatted);
            }
        }
        
        return $formatted;
    }
    
    public function ajax_check_requirements() {
        check_ajax_referer('mcl_publisher_nonce', 'nonce');
        
        $post_id = intval($_POST['post_id']);
        $post_content = wp_kses_post($_POST['post_content']);
        $post_title = sanitize_text_field($_POST['post_title']);
        $post_excerpt = wp_kses_post($_POST['post_excerpt']);
        $featured_media_id = intval($_POST['featured_media_id'] ?? 0);
        $categories = json_decode(stripslashes($_POST['categories'] ?? '[]'), true);
        $tags = json_decode(stripslashes($_POST['tags'] ?? '[]'), true);
        $post_meta = json_decode(stripslashes($_POST['post_meta'] ?? '{}'), true);
        
        if (!$post_id) {
            wp_send_json_error('Invalid post ID');
            return;
        }
        
        $post = get_post($post_id);
        if (!$post) {
            wp_send_json_error('Post not found');
            return;
        }
        
        // Prepare editor data
        $editor_data = array(
            'content' => $post_content,
            'title' => $post_title,
            'excerpt' => $post_excerpt,
            'featured_media_id' => $featured_media_id,
            'categories' => $categories,
            'tags' => $tags,
            'meta' => $post_meta
        );
        
        $checklists = $this->get_active_publisher_checklists_for_post($post);
        $results = array();
        
        foreach ($checklists as $checklist) {
            $requirements = MCL_DB_Manager::get_publisher_requirements($checklist->ID);
            $checklist_results = array();
            
            foreach ($requirements as $req) {
                $status = $this->check_requirement($req, $post, $editor_data);
                $checklist_results[] = array(
                    'type' => $req['type'],
                    'instance_id' => $req['instance_id'],
                    'status' => $status['status'],
                    'message' => $status['message'],
                    'required' => $req['required']
                );
            }
            
            $results[$checklist->ID] = $checklist_results;
        }
        
        wp_send_json_success($results);
    }
    
    public function check_requirement($requirement, $post, $editor_data = null) {
        $type = $requirement['type'];
        $config = $requirement['config'];
        
        // Use editor data if provided, otherwise use saved post data
        if ($editor_data === null) {
            $editor_data = array(
                'content' => $post->post_content,
                'title' => $post->post_title,
                'excerpt' => $post->post_excerpt,
                'featured_media_id' => get_post_thumbnail_id($post->ID),
                'categories' => wp_get_post_categories($post->ID),
                'tags' => wp_get_post_tags($post->ID, array('fields' => 'ids')),
                'meta' => get_post_meta($post->ID)
            );
        }
        
        switch ($type) {
            case 'word_count':
                return $this->check_word_count($editor_data['content'], $config);
                
            case 'featured_image':
                return $this->check_featured_image_data($editor_data['featured_media_id']);
                
            case 'excerpt':
                return $this->check_excerpt($editor_data['excerpt'], $config);
                
            case 'categories':
                return $this->check_categories_data($editor_data['categories'], $config);
                
            case 'tags':
                return $this->check_tags_data($editor_data['tags'], $config);
                
            case 'external_links':
                return $this->check_external_links($editor_data['content'], $config);
                
            case 'internal_links':
                return $this->check_internal_links($editor_data['content'], $config);
                
            case 'title_length':
                return $this->check_title_length($editor_data['title'], $config);
                
            case 'meta_description':
                return $this->check_meta_description($post, $config);
                
            case 'meta_title':
                return $this->check_meta_title($post, $config);
                
            case 'image_alt_text':
                return $this->check_image_alt_text($editor_data['content'], $config);
                
            case 'heading_count':
                return $this->check_heading_count($editor_data['content'], $config);
                
            case 'image_count':
                return $this->check_image_count($editor_data['content'], $config);
                
            case 'custom_field':
                return $this->check_custom_field($post, $config);
                
            case 'custom_item':
                return $this->check_custom_item($post, $requirement);
                
            default:
                return array(
                    'status' => 'error',
                    'message' => 'Unknown requirement type: ' . $type
                );
        }
    }
    
    private function check_word_count($content, $config) {
        $min_words = intval($config['min_words'] ?? 300);
        $word_count = str_word_count(strip_tags($content));
        
        if ($word_count >= $min_words) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('Word count: %d (required: %d+)', 'magic-checklists'), $word_count, $min_words)
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('Word count: %d (required: %d+)', 'magic-checklists'), $word_count, $min_words)
            );
        }
    }
    
    private function check_featured_image_data($featured_media_id) {
        if ($featured_media_id && $featured_media_id > 0) {
            return array(
                'status' => 'passed',
                'message' => __('Featured image is set', 'magic-checklists')
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => __('Featured image is missing', 'magic-checklists')
            );
        }
    }
    
    private function check_excerpt($excerpt, $config) {
        $min_length = intval($config['min_excerpt_length'] ?? 50);
        $max_length = intval($config['max_excerpt_length'] ?? 300);
        $excerpt_text = trim($excerpt);
        $length = strlen($excerpt_text);
        
        if (empty($excerpt_text)) {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('Excerpt is missing (required: %d-%d characters)', 'magic-checklists'), $min_length, $max_length)
            );
        }
        
        if ($length >= $min_length && $length <= $max_length) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('Excerpt length: %d characters (required: %d-%d)', 'magic-checklists'), $length, $min_length, $max_length)
            );
        } else {
            if ($length < $min_length) {
                return array(
                    'status' => 'failed',
                    'message' => sprintf(__('Excerpt too short: %d characters (required: %d-%d)', 'magic-checklists'), $length, $min_length, $max_length)
                );
            } else {
                return array(
                    'status' => 'failed',
                    'message' => sprintf(__('Excerpt too long: %d characters (required: %d-%d)', 'magic-checklists'), $length, $min_length, $max_length)
                );
            }
        }
    }
    
    private function check_categories_data($categories, $config) {
        $min_categories = intval($config['min_categories'] ?? 1);
        $count = is_array($categories) ? count($categories) : 0;
        
        if ($count >= $min_categories) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('Categories: %d (required: %d+)', 'magic-checklists'), $count, $min_categories)
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('Categories: %d (required: %d+)', 'magic-checklists'), $count, $min_categories)
            );
        }
    }
    
    private function check_tags_data($tags, $config) {
        $min_tags = intval($config['min_tags'] ?? 1);
        $count = is_array($tags) ? count($tags) : 0;
        
        if ($count >= $min_tags) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('Tags: %d (required: %d+)', 'magic-checklists'), $count, $min_tags)
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('Tags: %d (required: %d+)', 'magic-checklists'), $count, $min_tags)
            );
        }
    }
    
    private function check_external_links($content, $config) {
        $min_links = intval($config['min_external_links'] ?? 1);
        $site_url = get_site_url();
        
        // Convert Gutenberg blocks to HTML if needed
        $html_content = $this->convert_blocks_to_html($content);
        
        // Find all links in content
        preg_match_all('/<a[^>]+href=["\']([^"\']+)["\'][^>]*>/i', $html_content, $matches);
        
        $external_links = 0;
        if (!empty($matches[1])) {
            foreach ($matches[1] as $link) {
                // Skip internal links and relative links
                if (strpos($link, $site_url) === false && strpos($link, 'http') === 0) {
                    $external_links++;
                }
            }
        }
        
        if ($external_links >= $min_links) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('External links: %d (required: %d+)', 'magic-checklists'), $external_links, $min_links)
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('External links: %d (required: %d+)', 'magic-checklists'), $external_links, $min_links)
            );
        }
    }
    
    private function check_internal_links($content, $config) {
        $min_links = intval($config['min_internal_links'] ?? 1);
        $site_url = get_site_url();
        
        // Convert Gutenberg blocks to HTML if needed
        $html_content = $this->convert_blocks_to_html($content);
        
        // Find all links in content
        preg_match_all('/<a[^>]+href=["\']([^"\']+)["\'][^>]*>/i', $html_content, $matches);
        
        $internal_links = 0;
        if (!empty($matches[1])) {
            foreach ($matches[1] as $link) {
                // Count internal links and relative links
                if (strpos($link, $site_url) !== false || (strpos($link, 'http') !== 0 && strpos($link, '/') === 0)) {
                    $internal_links++;
                }
            }
        }
        
        if ($internal_links >= $min_links) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('Internal links: %d (required: %d+)', 'magic-checklists'), $internal_links, $min_links)
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('Internal links: %d (required: %d+)', 'magic-checklists'), $internal_links, $min_links)
            );
        }
    }
    
    /**
     * Convert Gutenberg blocks to HTML for link analysis
     */
    private function convert_blocks_to_html($content) {
        // If content contains block delimiters, try to render blocks
        if (has_blocks($content)) {
            // Use WordPress block parser to render blocks to HTML
            $blocks = parse_blocks($content);
            $html_content = '';
            
            foreach ($blocks as $block) {
                $html_content .= render_block($block);
            }
            
            return $html_content;
        }
        
        // Return content as-is if it's already HTML or plain text
        return $content;
    }
    
    private function check_title_length($title, $config) {
        $min_length = intval($config['min_title_length'] ?? 10);
        $max_length = intval($config['max_title_length'] ?? 60);
        $length = strlen($title);
        
        if ($length >= $min_length && $length <= $max_length) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('Title length: %d characters (required: %d-%d)', 'magic-checklists'), $length, $min_length, $max_length)
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('Title length: %d characters (required: %d-%d)', 'magic-checklists'), $length, $min_length, $max_length)
            );
        }
    }
    
    private function check_custom_item($post, $requirement) {
        $instance_id = $requirement['instance_id'] ?? '';
        $requirement_key = 'custom_item_' . $instance_id;
        
        $manual_state = get_post_meta($post->ID, '_mcl_manual_check_' . $requirement_key, true);
        
        $item_title = $requirement['config']['item_title'] ?? __('Custom Item', 'magic-checklists');
        
        if ($manual_state === '1') {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('%s - Complete', 'magic-checklists'), $item_title)
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('%s - Manual verification required', 'magic-checklists'), $item_title)
            );
        }
    }
    
    public function ajax_save_checklist_state() {
        check_ajax_referer('mcl_publisher_nonce', 'nonce');
        
        $post_id = intval($_POST['post_id']);
        $checklist_id = intval($_POST['checklist_id']);
        $requirement_type = sanitize_text_field($_POST['requirement_type'] ?? '');
        $instance_id = sanitize_text_field($_POST['instance_id'] ?? '');
        $checked = isset($_POST['checked']) && $_POST['checked'];
        
        if (!$post_id || !$checklist_id || !$requirement_type) {
            wp_send_json_error('Invalid data');
            return;
        }
        
        // Create unique key for this requirement instance
        $check_key = $requirement_type . '_' . $instance_id;
        
        // Save manual check state
        update_post_meta($post_id, '_mcl_manual_check_' . $check_key, $checked ? '1' : '0');
        
        wp_send_json_success();
    }
    
    public function ajax_get_checklist_data() {
        check_ajax_referer('mcl_publisher_nonce', 'nonce');
        
        $post_id = intval($_POST['post_id']);
        
        if (!$post_id) {
            wp_send_json_error('Invalid post ID');
            return;
        }
        
        $post = get_post($post_id);
        if (!$post) {
            wp_send_json_error('Post not found');
            return;
        }
        
        $checklists = $this->get_active_publisher_checklists_for_post($post);
        $data = $this->prepare_checklists_for_js($checklists);
        
        wp_send_json_success($data);
    }
    
    public function ajax_get_publisher_checklist_data() {
        check_ajax_referer('mcl_publisher_nonce', 'nonce');
        
        $post_id = intval($_POST['post_id']);
        
        if (!$post_id) {
            wp_send_json_error('Invalid post ID');
            return;
        }
        
        $post = get_post($post_id);
        if (!$post) {
            wp_send_json_error('Post not found');
            return;
        }
        
        $checklists = $this->get_active_publisher_checklists_for_post($post);
        $data = $this->prepare_checklists_for_js($checklists);
        
        wp_send_json_success($data);
    }
    
    public function check_publish_requirements($new_status, $old_status, $post) {
        // Only check when transitioning to publish
        if ($new_status !== 'publish' || $old_status === 'publish') {
            return;
        }
        
        // Only check for public post types that support editor
        $post_type_obj = get_post_type_object($post->post_type);
        if (!$post_type_obj || !$post_type_obj->public || !post_type_supports($post->post_type, 'editor')) {
            return;
        }
        
        $checklists = $this->get_active_publisher_checklists_for_post($post);
        if (empty($checklists)) {
            return;
        }
        
        $blocking_issues = array();
        
        foreach ($checklists as $checklist) {
            $requirements = MCL_DB_Manager::get_publisher_requirements($checklist->ID);
            
            foreach ($requirements as $req) {
                if (!$req['required']) {
                    continue; // Skip non-required items
                }
                
                $status = $this->check_requirement($req, $post);
                
                if ($status['status'] === 'failed') {
                    $blocking_issues[] = sprintf(
                        __('Checklist "%s": %s', 'magic-checklists'),
                        $checklist->post_title,
                        $status['message']
                    );
                }
            }
        }
        
        if (!empty($blocking_issues)) {
            // Prevent publishing by setting status back to draft
            remove_action('transition_post_status', array($this, 'check_publish_requirements'), 10);
            wp_update_post(array(
                'ID' => $post->ID,
                'post_status' => 'draft'
            ));
            add_action('transition_post_status', array($this, 'check_publish_requirements'), 10, 3);
            
            // Set error message for admin notice
            set_transient('mcl_publish_blocked_' . $post->ID, $blocking_issues, 300);
            
            // Redirect with error message
            wp_redirect(add_query_arg(array(
                'post' => $post->ID,
                'action' => 'edit',
                'mcl_publish_blocked' => '1'
            ), admin_url('post.php')));
            exit;
        }
    }
    
    private function check_featured_image($post) {
        $featured_image = get_post_thumbnail_id($post->ID);
        
        if ($featured_image) {
            return array(
                'status' => 'passed',
                'message' => __('Featured image is set', 'magic-checklists')
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => __('Featured image is missing', 'magic-checklists')
            );
        }
    }
    
    private function check_categories($post, $config) {
        $min_categories = intval($config['min_categories'] ?? 1);
        $categories = wp_get_post_categories($post->ID);
        $count = count($categories);
        
        if ($count >= $min_categories) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('Categories: %d (required: %d+)', 'magic-checklists'), $count, $min_categories)
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('Categories: %d (required: %d+)', 'magic-checklists'), $count, $min_categories)
            );
        }
    }
    
    private function check_tags($post, $config) {
        $min_tags = intval($config['min_tags'] ?? 1);
        $tags = wp_get_post_tags($post->ID);
        $count = count($tags);
        
        if ($count >= $min_tags) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('Tags: %d (required: %d+)', 'magic-checklists'), $count, $min_tags)
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('Tags: %d (required: %d+)', 'magic-checklists'), $count, $min_tags)
            );
        }
    }
    
    private function check_meta_description($post, $config) {
        $min_length = intval($config['min_meta_length'] ?? 120);
        $max_length = intval($config['max_meta_length'] ?? 160);
        
        // Check various SEO plugins first
        $meta_description = '';
        $plugin_detected = '';
        
        // Yoast SEO
        $yoast_meta = get_post_meta($post->ID, '_yoast_wpseo_metadesc', true);
        if ($yoast_meta) {
            $meta_description = $yoast_meta;
            $plugin_detected = 'Yoast SEO';
        }
        
        // Rank Math SEO
        if (!$meta_description) {
            $rankmath_meta = get_post_meta($post->ID, 'rank_math_description', true);
            if ($rankmath_meta) {
                $meta_description = $rankmath_meta;
                $plugin_detected = 'RankMath';
            }
        }
        
        // All in One SEO
        if (!$meta_description) {
            $aioseo_meta = get_post_meta($post->ID, '_aioseo_description', true);
            if ($aioseo_meta) {
                $meta_description = $aioseo_meta;
                $plugin_detected = 'All in One SEO';
            }
        }
        
        // SEOPress
        if (!$meta_description) {
            $seopress_meta = get_post_meta($post->ID, '_seopress_titles_desc', true);
            if ($seopress_meta) {
                $meta_description = $seopress_meta;
                $plugin_detected = 'SEOPress';
            }
        }
        
        // SlimSEO
        if (!$meta_description) {
            $slimseo_meta = get_post_meta($post->ID, 'slim_seo_meta_description', true);
            if ($slimseo_meta) {
                $meta_description = $slimseo_meta;
                $plugin_detected = 'SlimSEO';
            }
        }
        
        // If no meta description found and post is not saved, show helpful message
        if (!$meta_description && $post->post_status === 'auto-draft') {
            return array(
                'status' => 'pending',
                'message' => __('💡 Save post as draft first to check meta description. SEO plugins save descriptions to database when post is saved.', 'magic-checklists')
            );
        }
        
        $length = strlen($meta_description);
        
        if ($length >= $min_length && $length <= $max_length) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('Meta description: %d characters (required: %d-%d) - %s detected', 'magic-checklists'), $length, $min_length, $max_length, $plugin_detected)
            );
        } else {
            if ($length === 0) {
                $message = sprintf(__('No meta description found (required: %d-%d characters). Please add one using your SEO plugin.', 'magic-checklists'), $min_length, $max_length);
            } elseif ($length < $min_length) {
                $message = sprintf(__('Meta description too short: %d characters (required: %d-%d) - %s detected', 'magic-checklists'), $length, $min_length, $max_length, $plugin_detected);
            } else {
                $message = sprintf(__('Meta description too long: %d characters (required: %d-%d) - %s detected', 'magic-checklists'), $length, $min_length, $max_length, $plugin_detected);
            }
                
            return array(
                'status' => 'failed',
                'message' => $message
            );
        }
    }
    
    private function check_meta_title($post, $config) {
        $min_length = intval($config['min_meta_title_length'] ?? 30);
        $max_length = intval($config['max_meta_title_length'] ?? 60);
        
        // Check various SEO plugins first
        $meta_title = '';
        $plugin_detected = '';
        
        // Yoast SEO
        $yoast_meta = get_post_meta($post->ID, '_yoast_wpseo_title', true);
        if ($yoast_meta) {
            $meta_title = $yoast_meta;
            $plugin_detected = 'Yoast SEO';
        }
        
        // Rank Math SEO
        if (!$meta_title) {
            $rankmath_meta = get_post_meta($post->ID, 'rank_math_title', true);
            if ($rankmath_meta) {
                $meta_title = $rankmath_meta;
                $plugin_detected = 'RankMath';
            }
        }
        
        // All in One SEO
        if (!$meta_title) {
            $aioseo_meta = get_post_meta($post->ID, '_aioseo_title', true);
            if ($aioseo_meta) {
                $meta_title = $aioseo_meta;
                $plugin_detected = 'All in One SEO';
            }
        }
        
        // SEOPress
        if (!$meta_title) {
            $seopress_meta = get_post_meta($post->ID, '_seopress_titles_title', true);
            if ($seopress_meta) {
                $meta_title = $seopress_meta;
                $plugin_detected = 'SEOPress';
            }
        }
        
        // SlimSEO
        if (!$meta_title) {
            $slimseo_meta = get_post_meta($post->ID, 'slim_seo_meta_title', true);
            if ($slimseo_meta) {
                $meta_title = $slimseo_meta;
                $plugin_detected = 'SlimSEO';
            }
        }
        
        // If no meta title found and post is not saved, show helpful message
        if (!$meta_title && $post->post_status === 'auto-draft') {
            return array(
                'status' => 'pending',
                'message' => __('💡 Save post as draft first to check meta title. SEO plugins save titles to database when post is saved.', 'magic-checklists')
            );
        }
        
        // If no custom meta title is set, fall back to post title
        if (!$meta_title) {
            $meta_title = $post->post_title;
            $plugin_detected = 'Post Title (fallback)';
        }
        
        $length = strlen($meta_title);
        
        if ($length >= $min_length && $length <= $max_length) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('Meta title: %d characters (required: %d-%d) - %s', 'magic-checklists'), $length, $min_length, $max_length, $plugin_detected)
            );
        } else {
            if ($length < $min_length) {
                $message = sprintf(__('Meta title too short: %d characters (required: %d-%d) - %s', 'magic-checklists'), $length, $min_length, $max_length, $plugin_detected);
            } else {
                $message = sprintf(__('Meta title too long: %d characters (required: %d-%d) - %s', 'magic-checklists'), $length, $min_length, $max_length, $plugin_detected);
            }
            
            return array(
                'status' => 'failed',
                'message' => $message
            );
        }
    }
    
    private function check_image_alt_text($content, $config) {
        // Convert Gutenberg blocks to HTML if needed
        $html_content = $this->convert_blocks_to_html($content);
        
        // Find all img tags in content
        preg_match_all('/<img[^>]*>/i', $html_content, $matches);
        
        if (empty($matches[0])) {
            return array(
                'status' => 'passed',
                'message' => __('No images found in content', 'magic-checklists')
            );
        }
        
        $total_images = count($matches[0]);
        $images_without_alt = 0;
        $images_with_empty_alt = 0;
        
        foreach ($matches[0] as $img_tag) {
            // Check if alt attribute exists
            if (!preg_match('/alt\s*=\s*["\'][^"\']*["\']/', $img_tag)) {
                $images_without_alt++;
            } else {
                // Check if alt is empty
                preg_match('/alt\s*=\s*["\']([^"\']*)["\']/', $img_tag, $alt_matches);
                if (empty(trim($alt_matches[1]))) {
                    $images_with_empty_alt++;
                }
            }
        }
        
        $problematic_images = $images_without_alt + $images_with_empty_alt;
        
        if ($problematic_images === 0) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('All %d images have alt text', 'magic-checklists'), $total_images)
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('%d of %d images missing alt text (accessibility issue)', 'magic-checklists'), $problematic_images, $total_images)
            );
        }
    }
    
    private function check_heading_count($content, $config) {
        $min_h2_headings = intval($config['min_h2_headings'] ?? 2);
        $min_h3_headings = intval($config['min_h3_headings'] ?? 1);
        $min_h4_headings = intval($config['min_h4_headings'] ?? 0);
        
        // Convert Gutenberg blocks to HTML if needed
        $html_content = $this->convert_blocks_to_html($content);
        
        // Count each heading type separately
        $h2_count = preg_match_all('/<h2[^>]*>.*?<\/h2>/is', $html_content);
        $h3_count = preg_match_all('/<h3[^>]*>.*?<\/h3>/is', $html_content);
        $h4_count = preg_match_all('/<h4[^>]*>.*?<\/h4>/is', $html_content);
        
        $issues = array();
        
        // Check each heading type requirement
        if ($h2_count < $min_h2_headings) {
            $issues[] = sprintf(__('H2: %d/%d', 'magic-checklists'), $h2_count, $min_h2_headings);
        }
        if ($h3_count < $min_h3_headings) {
            $issues[] = sprintf(__('H3: %d/%d', 'magic-checklists'), $h3_count, $min_h3_headings);
        }
        if ($h4_count < $min_h4_headings) {
            $issues[] = sprintf(__('H4: %d/%d', 'magic-checklists'), $h4_count, $min_h4_headings);
        }
        
        if (empty($issues)) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('Headings found - H2: %d, H3: %d, H4: %d', 'magic-checklists'), $h2_count, $h3_count, $h4_count)
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('Heading requirements not met: %s', 'magic-checklists'), implode(', ', $issues))
            );
        }
    }
    
    private function check_image_count($content, $config) {
        $min_images = intval($config['min_images'] ?? 1);
        
        // Convert Gutenberg blocks to HTML if needed
        $html_content = $this->convert_blocks_to_html($content);
        
        // Count img tags in content
        $image_count = preg_match_all('/<img[^>]*>/i', $html_content);
        
        if ($image_count >= $min_images) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('Images found: %d (required: %d+)', 'magic-checklists'), $image_count, $min_images)
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('Images found: %d (required: %d+)', 'magic-checklists'), $image_count, $min_images)
            );
        }
    }
    
    private function check_custom_field($post, $config) {
        $field_name = $config['field_name'] ?? '';
        $field_label = $config['field_label'] ?? $field_name;
        
        if (empty($field_name)) {
            return array(
                'status' => 'error',
                'message' => __('Custom field not selected. Please select a field in the checklist settings.', 'magic-checklists')
            );
        }
        
        // Check if post is saved - only auto-drafts haven't been saved yet
        if ($post->post_status === 'auto-draft') {
            $display_name = !empty($field_label) ? $field_label : $field_name;
            return array(
                'status' => 'pending',
                'message' => sprintf(__('💡 Save post as draft first to check "%s" field. Custom fields are saved to database when post is saved.', 'magic-checklists'), $display_name)
            );
        }
        
        $field_value = get_post_meta($post->ID, $field_name, true);
        $display_name = !empty($field_label) ? $field_label : $field_name;
        
        if (!empty($field_value)) {
            return array(
                'status' => 'passed',
                'message' => sprintf(__('%s is filled.', 'magic-checklists'), $display_name)
            );
        } else {
            return array(
                'status' => 'failed',
                'message' => sprintf(__('%s is empty.', 'magic-checklists'), $display_name)
            );
        }
    }
    
    /**
     * AJAX handler to get meta fields for selected post types
     */
    public function ajax_get_meta_fields() {
        check_ajax_referer('mcl_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        // Handle post_types - they might come as an array or JSON string
        $post_types = array();
        if (isset($_POST['post_types'])) {
            if (is_array($_POST['post_types'])) {
                $post_types = array_map('sanitize_text_field', $_POST['post_types']);
            } else {
                // Try to decode as JSON if it's a string
                $decoded = json_decode(stripslashes($_POST['post_types']), true);
                if (is_array($decoded)) {
                    $post_types = array_map('sanitize_text_field', $decoded);
                }
            }
        }
        
        if (empty($post_types)) {
            wp_send_json_success(array());
            return;
        }
        
        global $wpdb;
        
        $all_fields = array();
        
        // 1. Get meta keys from the database for the selected post types
        $post_types_placeholders = implode(',', array_fill(0, count($post_types), '%s'));
        
        $meta_keys = $wpdb->get_col($wpdb->prepare("
            SELECT DISTINCT pm.meta_key 
            FROM {$wpdb->postmeta} pm 
            INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID 
            WHERE p.post_type IN ($post_types_placeholders)
            AND pm.meta_key NOT LIKE '\_%'
            AND pm.meta_key NOT LIKE 'field_%'
            AND pm.meta_key != ''
            AND pm.meta_key NOT IN ('footnotes')
            ORDER BY pm.meta_key ASC
            LIMIT 200
        ", $post_types));
        
        // Add database fields
        foreach ($meta_keys as $key) {
            $all_fields[$key] = ucwords(str_replace(array('_', '-'), ' ', $key));
        }
        
        // 2. Get ACF fields directly from database (more reliable)
        // Exclude ACF reference fields (field_xxxxx) and only get actual content fields
        $acf_fields = $wpdb->get_results("
            SELECT p.post_title as field_label, p.post_name as field_name, p.post_parent as field_group_id
            FROM {$wpdb->posts} p
            WHERE p.post_type = 'acf-field' 
            AND p.post_status = 'publish'
            AND p.post_name NOT LIKE 'field_%'
            AND p.post_name != ''
            ORDER BY p.post_title ASC
        ");
        
        if (!empty($acf_fields)) {
            // Get field group location rules to filter by post type
            $field_group_ids = array_unique(array_column($acf_fields, 'field_group_id'));
            if (!empty($field_group_ids)) {
                $placeholders = implode(',', array_fill(0, count($field_group_ids), '%d'));
                $field_groups = $wpdb->get_results($wpdb->prepare("
                    SELECT p.ID, p.post_content
                    FROM {$wpdb->posts} p
                    WHERE p.post_type = 'acf-field-group' 
                    AND p.post_status = 'publish'
                    AND p.ID IN ($placeholders)
                ", $field_group_ids));
                
                $applicable_groups = array();
                foreach ($field_groups as $group) {
                    $group_config = maybe_unserialize($group->post_content);
                    if (is_array($group_config) && isset($group_config['location'])) {
                        $location_rules = $group_config['location'];
                        $applies_to_post_type = false;
                        
                        // Check if group applies to any of our post types
                        foreach ($location_rules as $rule_group) {
                            if (is_array($rule_group)) {
                                foreach ($rule_group as $rule) {
                                    if (is_array($rule) && 
                                        isset($rule['param']) && $rule['param'] === 'post_type' &&
                                        isset($rule['value']) && in_array($rule['value'], $post_types)) {
                                        $applies_to_post_type = true;
                                        break 2;
                                    }
                                }
                            }
                        }
                        
                        if ($applies_to_post_type) {
                            $applicable_groups[] = $group->ID;
                        }
                    } else {
                        // If no location rules or can't parse, include it
                        $applicable_groups[] = $group->ID;
                    }
                }
                
                // Add fields from applicable groups
                foreach ($acf_fields as $field) {
                    if (in_array($field->field_group_id, $applicable_groups) || empty($applicable_groups)) {
                        $field_name = sanitize_text_field($field->field_name);
                        $field_label = sanitize_text_field($field->field_label);
                        if (!empty($field_name) && !empty($field_label)) {
                            $all_fields[$field_name] = $field_label . ' [ACF]';
                        }
                    }
                }
            }
        }
        
        // 3. Get Meta Box fields if Meta Box is active
        if (function_exists('rwmb_get_registry')) {
            try {
                $meta_boxes = rwmb_get_registry('meta_box')->get_by_object_type('post');
                if (is_array($meta_boxes)) {
                    foreach ($meta_boxes as $meta_box) {
                        if (isset($meta_box->post_types) && is_array($meta_box->post_types) && 
                            array_intersect($meta_box->post_types, $post_types)) {
                            if (isset($meta_box->fields) && is_array($meta_box->fields)) {
                                foreach ($meta_box->fields as $field) {
                                    if (isset($field['id']) && isset($field['name'])) {
                                        $all_fields[$field['id']] = $field['name'] . ' [Meta Box]';
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception $e) {
                // Skip Meta Box if there's an error
            }
        }
        
        // 4. Get Toolset Types fields if Toolset is active
        if (function_exists('wpcf_admin_fields_get_fields')) {
            try {
                $toolset_fields = wpcf_admin_fields_get_fields();
                if (is_array($toolset_fields)) {
                    foreach ($toolset_fields as $field_slug => $field_data) {
                        if (is_array($field_data)) {
                            $field_name = 'wpcf-' . $field_slug;
                            $field_label = isset($field_data['name']) ? $field_data['name'] : ucwords(str_replace('_', ' ', $field_slug));
                            $all_fields[$field_name] = $field_label . ' [Toolset]';
                        }
                    }
                }
            } catch (Exception $e) {
                // Skip Toolset if there's an error
            }
        }
        
        // 5. Get CMB2 fields if CMB2 is active
        if (function_exists('cmb2_get_metaboxes')) {
            try {
                $cmb2_boxes = cmb2_get_metaboxes();
                if (is_array($cmb2_boxes)) {
                    foreach ($cmb2_boxes as $box) {
                        if (isset($box->meta_box['object_types']) && is_array($box->meta_box['object_types']) && 
                            array_intersect($box->meta_box['object_types'], $post_types)) {
                            if (isset($box->meta_box['fields']) && is_array($box->meta_box['fields'])) {
                                foreach ($box->meta_box['fields'] as $field) {
                                    if (isset($field['id']) && isset($field['name'])) {
                                        $all_fields[$field['id']] = $field['name'] . ' [CMB2]';
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception $e) {
                // Skip CMB2 if there's an error
            }
        }
        
        // Remove duplicates and sort by label
        $all_fields = array_unique($all_fields);
        asort($all_fields);
        
        // Format for select options - simplified approach
        $options = array();
        $options[''] = '-- Select a custom field --';
        
        // Add all fields directly without complex grouping
        foreach ($all_fields as $key => $label) {
            // Ensure we have valid string values
            if (is_string($key) && is_string($label)) {
                if (strpos($label, '[ACF]') !== false || 
                    strpos($label, '[Meta Box]') !== false || 
                    strpos($label, '[Toolset]') !== false || 
                    strpos($label, '[CMB2]') !== false) {
                    $options[$key] = $label;
                } else {
                    $options[$key] = $label . ' (' . $key . ')';
                }
            }
        }
        
        wp_send_json_success($options);
    }

    /**
     * AJAX handler to get requirement definitions
     */
    public function ajax_get_requirement_definitions() {
        check_ajax_referer('mcl_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $definitions = MCL_DB_Manager::get_default_publisher_requirements();
        wp_send_json_success($definitions);
    }
    
    /**
     * AJAX handler to save publisher checklist
     */
    public function ajax_save_publisher_checklist() {
        check_ajax_referer('mcl_admin_nonce', 'mcl_nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $title = sanitize_text_field($_POST['title'] ?? '');
        $description = wp_kses_post($_POST['description'] ?? '');
        $post_types = isset($_POST['post_types']) ? array_map('sanitize_text_field', $_POST['post_types']) : array();
        $active = isset($_POST['active']) && $_POST['active'] === '1';
        $show_tips = isset($_POST['show_tips']) && $_POST['show_tips'] === '1';
        $requirements = isset($_POST['requirements']) ? $_POST['requirements'] : array();
        
        // Validation
        if (empty($title)) {
            wp_send_json_error('Checklist name is required');
            return;
        }
        
        if (empty($post_types)) {
            wp_send_json_error('At least one post type must be selected');
            return;
        }
        
        // Create or update the checklist post
        $post_data = array(
            'post_title' => $title,
            'post_content' => $description,
            'post_type' => 'mcl_checklist',
            'post_status' => 'publish',
            'meta_input' => array(
                '_mcl_checklist_type' => 'publisher',
                '_mcl_publisher_post_types' => $post_types,
                '_mcl_active' => $active ? '1' : '0',
                '_mcl_show_tips' => $show_tips ? '1' : '0'
            )
        );
        
        if ($checklist_id) {
            $post_data['ID'] = $checklist_id;
            $result = wp_update_post($post_data);
        } else {
            $result = wp_insert_post($post_data);
            $checklist_id = $result;
        }
        
        if (is_wp_error($result)) {
            wp_send_json_error('Failed to save checklist: ' . $result->get_error_message());
            return;
        }
        
        // Clear existing requirements
        MCL_DB_Manager::clear_publisher_requirements($checklist_id);
        
        // Save new requirements
        $processed_requirements = array();
        foreach ($requirements as $type => $instances) {
            foreach ($instances as $instance_id => $instance_data) {
                if (isset($instance_data['enabled']) && $instance_data['enabled'] === '1') {
                    $processed_requirements[] = array(
                        'type' => $type,
                        'instance_id' => sanitize_text_field($instance_data['instance_id'] ?? $instance_id),
                        'required' => isset($instance_data['required']) && $instance_data['required'] === '1',
                        'config' => isset($instance_data['config']) ? array_map('sanitize_text_field', $instance_data['config']) : array()
                    );
                }
            }
        }
        
        if (!empty($processed_requirements)) {
            MCL_DB_Manager::save_publisher_requirements($checklist_id, $processed_requirements);
        }
        
        wp_send_json_success(array(
            'checklist_id' => $checklist_id,
            'message' => 'Publisher checklist saved successfully'
        ));
    }

    /**
     * AJAX handler to get available post types for the publisher checklist configuration
     */
    public function ajax_get_post_types() {
        check_ajax_referer('mcl_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        // Get all public post types that support editor
        $all_post_types = get_post_types(array('public' => true), 'objects');
        $formatted_post_types = array();
        
        // Exclude certain post types that shouldn't be used with publisher checklists
        $excluded_types = array('attachment', 'revision', 'nav_menu_item', 'custom_css', 'customize_changeset', 'oembed_cache', 'user_request', 'wp_block');
        
        foreach ($all_post_types as $post_type_key => $post_type_obj) {
            // Skip excluded types
            if (in_array($post_type_key, $excluded_types)) {
                continue;
            }
            
            // Only include post types that support editor (content editing)
            if (!post_type_supports($post_type_key, 'editor')) {
                continue;
            }
            
            $formatted_post_types[] = array(
                'key' => $post_type_key,
                'label' => $post_type_obj->labels->name,
                'singular' => $post_type_obj->labels->singular_name
            );
        }
        
        // Sort by label
        usort($formatted_post_types, function($a, $b) {
            return strcmp($a['label'], $b['label']);
        });
        
        wp_send_json_success($formatted_post_types);
    }
} 