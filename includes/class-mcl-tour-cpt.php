<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MAGICCL_Tour_CPT {
    
    public function __construct() {
        add_action('init', array($this, 'register_tour_cpt'));
        add_action('init', array($this, 'register_tour_meta'));
    }

    public function register_tour_cpt() {
        $labels = array(
            'name'               => _x('Tours', 'post type general name', 'magicchecklists'),
            'singular_name'      => _x('Tour', 'post type singular name', 'magicchecklists'),
            'menu_name'          => _x('Tours', 'admin menu', 'magicchecklists'),
            'name_admin_bar'     => _x('Tour', 'add new on admin bar', 'magicchecklists'),
            'add_new'            => _x('Add New', 'tour', 'magicchecklists'),
            'add_new_item'       => __('Add New Tour', 'magicchecklists'),
            'new_item'           => __('New Tour', 'magicchecklists'),
            'edit_item'          => __('Edit Tour', 'magicchecklists'),
            'view_item'          => __('View Tour', 'magicchecklists'),
            'all_items'          => __('All Tours', 'magicchecklists'),
            'search_items'       => __('Search Tours', 'magicchecklists'),
            'not_found'          => __('No tours found.', 'magicchecklists'),
            'not_found_in_trash' => __('No tours found in Trash.', 'magicchecklists'),
        );

        $args = array(
            'labels'             => $labels,
            'public'             => false,
            'show_ui'            => false,
            'show_in_menu'       => false,
            'capability_type'    => 'post',
            'hierarchical'       => false,
            'supports'           => array('title'),
            'has_archive'        => false,
            'exclude_from_search'=> true,
            'publicly_queryable' => false,
            'show_in_nav_menus'  => false,
        );

        register_post_type('magiccl_tour', $args);
    }

    public function register_tour_meta() {
        // Register meta fields for tours
        $meta_fields = array(
            '_magiccl_tour_steps' => array(
                'type' => 'array',
                'description' => 'Tour steps configuration',
                'single' => true,
                'default' => array()
            ),
            '_magiccl_tour_settings' => array(
                'type' => 'array',
                'description' => 'Tour general settings',
                'single' => true,
                'default' => array()
            ),
            '_magiccl_tour_active' => array(
                'type' => 'boolean',
                'description' => 'Whether the tour is active',
                'single' => true,
                'default' => false
            ),
            '_magiccl_tour_trigger_type' => array(
                'type' => 'string',
                'description' => 'Tour trigger type: page, selector, first_login, any_page',
                'single' => true,
                'default' => 'page'
            ),
            '_magiccl_tour_trigger_value' => array(
                'type' => 'string',
                'description' => 'Trigger value (URL or CSS selector)',
                'single' => true,
                'default' => ''
            ),
            '_magiccl_tour_user_condition' => array(
                'type' => 'string',
                'description' => 'User condition: all_logged_in, all_logged_out, all_users, specific_users, specific_roles',
                'single' => true,
                'default' => 'all_users'
            ),
            '_magiccl_tour_specific_users' => array(
                'type' => 'array',
                'description' => 'Array of specific user IDs',
                'single' => true,
                'default' => array()
            ),
            '_magiccl_tour_specific_roles' => array(
                'type' => 'array',
                'description' => 'Array of specific user roles',
                'single' => true,
                'default' => array()
            ),
            '_magiccl_tour_show_once' => array(
                'type' => 'boolean',
                'description' => 'Show tour only once per user',
                'single' => true,
                'default' => false
            ),
            '_magiccl_tour_autostart' => array(
                'type' => 'boolean',
                'description' => 'Auto-start tour when triggered',
                'single' => true,
                'default' => false
            )
        );

        foreach ($meta_fields as $meta_key => $args) {
            register_post_meta('magiccl_tour', $meta_key, $args);
        }
    }

    /**
     * Get all active tours that should be triggered for the current context
     */
    public static function get_active_tours_for_context() {
        $tours = get_posts([
            'post_type' => 'magiccl_tour',
            'post_status' => 'publish',
            'numberposts' => -1,
            'meta_query' => [
                [
                    'key' => '_magiccl_tour_active',
                    'value' => '1',
                    'compare' => '='
                ]
            ]
        ]);

        // Get all tours to check their active status - for debugging
        $all_tours = get_posts([
            'post_type' => 'magiccl_tour',
            'post_status' => 'publish',
            'numberposts' => -1
        ]);

        if (defined('WP_DEBUG') && WP_DEBUG) {
            foreach ($all_tours as $tour) {
                $active_status = get_post_meta($tour->ID, '_magiccl_tour_active', true);
                $autostart_status = get_post_meta($tour->ID, '_magiccl_tour_autostart', true);
                $trigger_type = get_post_meta($tour->ID, '_magiccl_tour_trigger_type', true);
                $trigger_value = get_post_meta($tour->ID, '_magiccl_tour_trigger_value', true);
            }
        }

        return $tours;
    }

    /**
     * Check if any tour should be triggered on the current page (for asset loading)
     */
    public static function has_tours_for_current_page() {
        $current_url = self::get_current_page_url();
        
        // Get all active tours
        $args = array(
            'post_type' => 'magiccl_tour',
            'meta_query' => array(
                array(
                    'key' => '_magiccl_tour_active',
                    'value' => '1',
                    'compare' => '='
                )
            ),
            'posts_per_page' => -1
        );

        $tours = get_posts($args);
        
        foreach ($tours as $tour) {
            $trigger_type = get_post_meta($tour->ID, '_magiccl_tour_trigger_type', true) ?: 'page';
            $trigger_value = get_post_meta($tour->ID, '_magiccl_tour_trigger_value', true) ?: '';


            // Check if this tour could be triggered on current page
            switch ($trigger_type) {
                case 'page':
                    if (self::url_matches($current_url, $trigger_value)) {
                        return true;
                    }
                    break;
                case 'selector':
                    // For selector triggers, we need to load assets to check if selector exists
                    return true;
                case 'first_login':
                case 'any_page':
                    // These can trigger on any page
                    return true;
            }
        }

        return false;
    }

    /**
     * Determine if a specific tour should be triggered
     */
    public static function should_tour_be_triggered($tour_id) {
        
        // Check if user meets the user condition
        if (!self::user_meets_condition($tour_id)) {
            return false;
        }

        // Check if tour has already been shown (if show_once is enabled)
        if (self::has_user_seen_tour($tour_id)) {
            return false;
        }

        // Check location trigger
        if (!self::location_trigger_matches($tour_id)) {
            return false;
        }

        return true;
    }

    /**
     * Check if user meets the user condition for the tour
     */
    private static function user_meets_condition($tour_id) {
        $user_condition = get_post_meta($tour_id, '_magiccl_tour_user_condition', true) ?: 'all_users';
        $is_logged_in = is_user_logged_in();
        $current_user_id = get_current_user_id();



        switch ($user_condition) {
            case 'all_logged_in':
                return $is_logged_in;
                
            case 'all_logged_out':
                return !$is_logged_in;
                
            case 'all_users':
                return true;
                
            case 'specific_users':
                if (!$is_logged_in) return false;
                $specific_users = get_post_meta($tour_id, '_magiccl_tour_specific_users', true) ?: array();
                $result = in_array($current_user_id, $specific_users);
                return $result;
                
            case 'specific_roles':
                if (!$is_logged_in) return false;
                $user = wp_get_current_user();
                $specific_roles = get_post_meta($tour_id, '_magiccl_tour_specific_roles', true) ?: array();
                $result = !empty(array_intersect($user->roles, $specific_roles));
                return $result;
        }

        return false;
    }

    /**
     * Check if user has already seen this tour
     */
    private static function has_user_seen_tour($tour_id) {
        $show_once = get_post_meta($tour_id, '_magiccl_tour_show_once', true);
        
        if (!$show_once) {
            return false; // Tour can be shown multiple times
        }

        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            $completed_tours = get_user_meta($user_id, '_magiccl_completed_tours', true) ?: array();
            return in_array($tour_id, $completed_tours);
        } else {
            // Check cookie for non-logged-in users
            if (isset($_COOKIE['magiccl_completed_tours'])) {
                $completed_tours = json_decode(sanitize_text_field(wp_unslash($_COOKIE['magiccl_completed_tours'])), true) ?: array();
                return in_array($tour_id, $completed_tours);
            }
        }

        return false;
    }

    /**
     * Check if location trigger matches current context
     */
    private static function location_trigger_matches($tour_id) {
        $trigger_type = get_post_meta($tour_id, '_magiccl_tour_trigger_type', true) ?: 'page';
        $trigger_value = get_post_meta($tour_id, '_magiccl_tour_trigger_value', true) ?: '';
        $current_url = self::get_current_page_url();



        switch ($trigger_type) {
            case 'page':
                $result = self::url_matches($current_url, $trigger_value);
                return $result;
                
            case 'selector':
                // For selector triggers, we'll need to check on the frontend via JS
                // For now, return true and let JS handle the actual check
                return true;
                
            case 'first_login':
                $result = self::is_user_first_login();
                return $result;
                
            case 'any_page':
                return true;
        }


        return false;
    }

    /**
     * Check if current URL matches the trigger URL
     */
    private static function url_matches($current_url, $trigger_url) {
        if (empty($trigger_url)) {
            return false;
        }

        // Extract path from current URL if it's a full URL
        $current_path = wp_parse_url($current_url, PHP_URL_PATH);
        if ($current_path === null) {
            $current_path = $current_url;
        }
        
        // Add query string if it exists
        $current_query = wp_parse_url($current_url, PHP_URL_QUERY);
        if ($current_query) {
            $current_path .= '?' . $current_query;
        }

        // Normalize paths for comparison
        $current_path = trailingslashit(strtolower($current_path));
        $trigger_path = trailingslashit(strtolower($trigger_url));

        // Support wildcards and exact matches
        if (strpos($trigger_path, '*') !== false) {
            $pattern = str_replace('*', '.*', preg_quote($trigger_path, '/'));
            $matches = preg_match('/^' . $pattern . '$/', $current_path);
            return $matches;
        }

        $exact_match = $current_path === $trigger_path;

        return $exact_match;
    }

    /**
     * Check if this is the user's first login
     */
    private static function is_user_first_login() {
        if (!is_user_logged_in()) {
            return false;
        }

        $user_id = get_current_user_id();
        $first_login_tours_shown = get_user_meta($user_id, '_magiccl_first_login_tours_shown', true);
        
        return !$first_login_tours_shown;
    }

    /**
     * Mark that first login tours have been shown for current user
     */
    public static function mark_first_login_tours_shown() {
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            update_user_meta($user_id, '_magiccl_first_login_tours_shown', true);
        }
    }

    /**
     * Get current page URL
     */
    public static function get_current_page_url() {
        
        if (is_admin()) {
            global $pagenow;
            
            // For admin pages, construct the path
            $path = '/wp-admin/';
            
            // Special handling for dashboard - both index.php and empty should match /wp-admin/
            if ($pagenow === 'index.php') {
                // Keep path as /wp-admin/ for dashboard
            } else {
                $path .= $pagenow;
            }
            
            if (!empty($_GET)) {
                $params = $_GET;
                // Remove tour-specific parameters
                unset($params['magiccl_tour_mode'], $params['tour_id'], $params['magiccl_continue_tour'], $params['magiccl_tour_step'], $params['magiccl_preview_step']);
                
                if (!empty($params)) {
                    $path .= '?' . http_build_query($params);
                }
            }
            

            
            return $path;
        }
        
        // Frontend URL
        global $wp;
        
        $path = '/' . ltrim($wp->request, '/');
        
        // Ensure path starts with /
        if (empty($path) || $path === '/') {
            $path = '/';
        }
        
        // Add query string if present
        if (!empty($_GET)) {
            $params = $_GET;
            unset($params['magiccl_tour_mode'], $params['tour_id'], $params['magiccl_continue_tour'], $params['magiccl_tour_step'], $params['magiccl_preview_step']);
            
            if (!empty($params)) {
                $path .= '?' . http_build_query($params);
            }
        }
        

        
        return $path;
    }

    /**
     * Get all active tours for the current page (legacy method for backward compatibility)
     */
    public static function get_active_tours_for_page($page_identifier = null) {
        return self::get_active_tours_for_context();
    }

    /**
     * Get current page identifier (legacy method for backward compatibility)
     */
    private static function get_current_page_identifier() {
        return self::get_current_page_url();
    }
}
