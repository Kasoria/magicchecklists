<?php
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * MagicChecklists Analytics
 * 
 * Tracks usage and interaction data for MagicChecklists
 * 
 * @since 1.0.0
 */
class MCL_Analytics {
    
    /**
     * The singleton instance
     */
    private static $instance = null;
    
    /**
     * Database tables
     */
    private $analytics_table;
    private $item_analytics_table;
    
    /**
     * Meta keys for storing analytics data
     */
    private $meta_keys = [
        '_mcl_view_count',
        '_mcl_last_viewed',
        '_mcl_most_checked_items',
    ];
    
    /**
     * Get the singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        global $wpdb;
        
        // Set up database table names
        $this->analytics_table = $wpdb->prefix . 'mcl_analytics';
        $this->item_analytics_table = $wpdb->prefix . 'mcl_item_analytics';
        
        // Hook into checklist interactions
        add_action('wp_ajax_mcl_track_view', array($this, 'track_view'));
        add_action('wp_ajax_nopriv_mcl_track_view', array($this, 'track_view'));
        
        add_action('wp_ajax_mcl_track_item_check', array($this, 'track_item_check'));
        add_action('wp_ajax_nopriv_mcl_track_item_check', array($this, 'track_item_check'));
        
        // Hook into checklist rendering to track views
        add_action('mcl_checklist_rendered', array($this, 'track_checklist_view'));
        
        // Hook into item checked/unchecked actions defined in class-mcl-public.php
        add_action('mcl_item_checked', array($this, 'track_item_checked'), 10, 4);
        add_action('mcl_item_unchecked', array($this, 'track_item_unchecked'), 10, 4);
        
        // Hook into deadlines
        add_action('mcl_admin_init', array($this, 'check_approaching_deadlines'));
        
        // Render analytics in admin
        add_action('mcl_after_checklist_table', array($this, 'render_analytics_dashboard'));
        
        // Cleanup old data - run weekly
        add_action('mcl_weekly_cleanup', array($this, 'cleanup_old_data'));
    }
    
    /**
     * Activate analytics module
     */
    public function activate() {
        $this->create_tables();
    }
    
    /**
     * Create database tables for analytics
     */
    public function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        // Create analytics table for general checklist data
        $sql = "CREATE TABLE {$this->analytics_table} (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            checklist_id bigint(20) UNSIGNED NOT NULL,
            view_count bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            last_viewed datetime DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY checklist_id (checklist_id),
            KEY last_viewed (last_viewed)
        ) $charset_collate;";
        dbDelta($sql);
        
        // Create item analytics table
        $sql = "CREATE TABLE {$this->item_analytics_table} (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            checklist_id bigint(20) UNSIGNED NOT NULL,
            item_id varchar(36) NOT NULL,
            item_content text NOT NULL,
            check_count bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            last_checked datetime DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY checklist_item (checklist_id, item_id),
            KEY checklist_id (checklist_id),
            KEY last_checked (last_checked)
        ) $charset_collate;";
        dbDelta($sql);
    }
    
    /**
     * Track a checklist view
     */
    public function track_view() {
        // Verify request
        if (!isset($_POST['checklist_id'])) {
            wp_send_json_error('Missing checklist ID');
            return;
        }
        
        $checklist_id = intval($_POST['checklist_id']);
        $this->track_checklist_view($checklist_id);
        
        wp_send_json_success();
    }
    
    /**
     * Track a checklist view from internal hook
     */
    public function track_checklist_view($checklist_id) {
        global $wpdb;
        
        // Update view count in analytics table
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT view_count FROM {$this->analytics_table} WHERE checklist_id = %d",
            $checklist_id
        ));
        
        if ($count !== null) {
            // Update existing record
            $wpdb->update(
                $this->analytics_table,
                array(
                    'view_count' => $count + 1,
                    'last_viewed' => current_time('mysql')
                ),
                array('checklist_id' => $checklist_id)
            );
        } else {
            // Insert new record
            $wpdb->insert(
                $this->analytics_table,
                array(
                    'checklist_id' => $checklist_id,
                    'view_count' => 1,
                    'last_viewed' => current_time('mysql')
                )
            );
        }
    }
    
    /**
     * Track a checkbox check/uncheck event from AJAX
     */
    public function track_item_check() {
        // Verify request
        if (!isset($_POST['checklist_id'], $_POST['item_id'], $_POST['checked'])) {
            wp_send_json_error('Missing required data');
            return;
        }
        
        $checklist_id = intval($_POST['checklist_id']);
        $item_id = sanitize_text_field($_POST['item_id']);
        $checked = filter_var($_POST['checked'], FILTER_VALIDATE_BOOLEAN);
        
        if ($checked) {
            $this->track_item_checked($checklist_id, $item_id, true);
        } else {
            $this->track_item_unchecked($checklist_id, $item_id, false);
        }
        
        wp_send_json_success();
    }
    
    /**
     * Track when an item is checked
     */
    public function track_item_checked($checklist_id, $item_id, $checked, $context = 'drawer') {
        global $wpdb;
        
        // Get current checklist items to extract content
        $items = get_post_meta($checklist_id, '_mcl_items', true);
        $item_content = '';
        
        if (is_array($items)) {
            foreach ($items as $item) {
                if ($item['id'] === $item_id) {
                    $item_content = $item['content'];
                    break;
                }
            }
        }
        
        // Check if we already have this item in the analytics
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->item_analytics_table} WHERE checklist_id = %d AND item_id = %s",
            $checklist_id, $item_id
        ));
        
        if ($exists) {
            // Update existing record
            $wpdb->query($wpdb->prepare(
                "UPDATE {$this->item_analytics_table} 
                SET check_count = check_count + 1, last_checked = %s, item_content = %s
                WHERE checklist_id = %d AND item_id = %s",
                current_time('mysql'), $item_content, $checklist_id, $item_id
            ));
        } else {
            // Insert new record
            $wpdb->insert(
                $this->item_analytics_table,
                array(
                    'checklist_id' => $checklist_id,
                    'item_id' => $item_id,
                    'item_content' => $item_content,
                    'check_count' => 1,
                    'last_checked' => current_time('mysql')
                )
            );
        }
    }
    
    /**
     * Track when an item is unchecked (currently not counting unchecks)
     */
    public function track_item_unchecked($checklist_id, $item_id, $checked, $context = 'drawer') {
        // Currently not tracking unchecks specifically
        // We could implement this if needed later
    }
    
    /**
     * Get view analytics for a specific checklist
     */
    public function get_checklist_views($checklist_id) {
        global $wpdb;
        
        $data = $wpdb->get_row($wpdb->prepare(
            "SELECT view_count, last_viewed FROM {$this->analytics_table} WHERE checklist_id = %d",
            $checklist_id
        ));
        
        if (!$data) {
            return array(
                'view_count' => 0,
                'last_viewed' => null
            );
        }
        
        return array(
            'view_count' => intval($data->view_count),
            'last_viewed' => $data->last_viewed
        );
    }
    
    /**
     * Get the most checked items for a checklist
     */
    public function get_most_checked_items($checklist_id, $limit = 5) {
        global $wpdb;
        
        $items = $wpdb->get_results($wpdb->prepare(
            "SELECT item_id, item_content, check_count, last_checked 
            FROM {$this->item_analytics_table} 
            WHERE checklist_id = %d 
            ORDER BY check_count DESC, last_checked DESC 
            LIMIT %d",
            $checklist_id, $limit
        ));
        
        return $items;
    }
    
    /**
     * Get all checklist analytics
     */
    public function get_all_checklist_analytics() {
        global $wpdb;
        
        $analytics = $wpdb->get_results(
            "SELECT a.checklist_id, a.view_count, a.last_viewed, p.post_title as title
            FROM {$this->analytics_table} a
            JOIN {$wpdb->posts} p ON a.checklist_id = p.ID
            WHERE p.post_type = 'mcl_checklist'
            ORDER BY a.view_count DESC, a.last_viewed DESC"
        );
        
        // Get most checked items for each checklist
        foreach ($analytics as &$item) {
            $item->most_checked_items = $this->get_most_checked_items($item->checklist_id, 3);
        }
        
        return $analytics;
    }
    
    /**
     * Get approaching deadlines for all checklists
     * 
     * @param int $threshold_hours Hours threshold to consider a deadline approaching (default: 72)
     * @return array Approaching deadlines
     */
    public function get_approaching_deadlines($threshold_hours = 168) {
        $approaching_deadlines = array();
        $threshold_time = time() + ($threshold_hours * HOUR_IN_SECONDS);
        
        // Get all active checklists
        $checklists = get_posts(array(
            'post_type' => 'mcl_checklist',
            'meta_key' => '_mcl_active',
            'meta_value' => '1',
            'posts_per_page' => -1,
            'fields' => 'ids'
        ));
        
        foreach ($checklists as $checklist_id) {
            // Check for checklist-level deadline first
            $checklist_deadline = get_post_meta($checklist_id, '_mcl_time_date', true);
            
            // Validate and process checklist deadline if it exists
            if (!empty($checklist_deadline)) {
                $checklist_deadline = intval($checklist_deadline);
                
                // Skip invalid timestamps
                if ($checklist_deadline > 86400) { // Skip timestamps before Jan 2, 1970
                    // Check if deadline is approaching or past
                    if ($checklist_deadline <= $threshold_time) {
                        $approaching_deadlines[] = array(
                            'checklist_id' => $checklist_id,
                            'checklist_title' => get_the_title($checklist_id),
                            'item_id' => 'checklist',
                            'item_content' => '<strong>' . __('Entire Checklist', 'magic-checklists') . '</strong>',
                            'deadline' => $checklist_deadline,
                            'time_remaining' => $checklist_deadline - time(),
                            'is_checklist_deadline' => true
                        );
                    }
                }
            }
            
            // Get item deadlines
            $deadlines = get_post_meta($checklist_id, '_mcl_item_deadlines', true) ?: array();
            
            if (empty($deadlines)) {
                continue;
            }
            
            // Get checklist items
            $items = get_post_meta($checklist_id, '_mcl_items', true) ?: array();
            $item_map = array();
            
            foreach ($items as $item) {
                $item_map[$item['id']] = $item;
            }
            
            // Get checked items to filter out completed items
            $checked_items = get_post_meta($checklist_id, '_mcl_checked_state', true) ?: array();
            
            // Check each deadline
            foreach ($deadlines as $item_id => $deadline) {
                // Skip if item is already checked off
                if (in_array($item_id, $checked_items)) {
                    continue;
                }
                
                // Validate deadline timestamp - skip if invalid or 0
                $deadline = intval($deadline);
                if ($deadline <= 86400) { // Skip timestamps before Jan 2, 1970 (likely errors)
                    continue;
                }
                
                // Deadline is a timestamp - check if it's approaching
                if ($deadline <= $threshold_time) {
                    // Make sure we have the item content
                    $item_content = '';
                    if (isset($item_map[$item_id]) && !empty($item_map[$item_id]['content'])) {
                        $item_content = $item_map[$item_id]['content'];
                    } else {
                        // Try to find item content from items directly
                        foreach ($items as $item) {
                            if ($item['id'] === $item_id && !empty($item['content'])) {
                                $item_content = $item['content'];
                                break;
                            }
                        }
                    }
                    
                    $approaching_deadlines[] = array(
                        'checklist_id' => $checklist_id,
                        'checklist_title' => get_the_title($checklist_id),
                        'item_id' => $item_id,
                        'item_content' => $item_content,
                        'deadline' => $deadline,
                        'time_remaining' => $deadline - time(),
                        'is_checklist_deadline' => false
                    );
                }
            }
        }
        
        // Sort by deadline (closest first)
        usort($approaching_deadlines, function($a, $b) {
            return $a['deadline'] - $b['deadline'];
        });
        
        return $approaching_deadlines;
    }
    
    /**
     * Check for approaching deadlines and notify if needed
     */
    public function check_approaching_deadlines() {
        $approaching = $this->get_approaching_deadlines();
        
        // Store in transient for dashboard
        set_transient('mcl_approaching_deadlines', $approaching, HOUR_IN_SECONDS);
        
        return $approaching;
    }
    
    /**
     * Get summary counts for dashboard
     */
    public function get_analytics_summary() {
        global $wpdb;
        
        // Total checklists
        $total_checklists = wp_count_posts('mcl_checklist');
        $active_checklists = get_posts(array(
            'post_type' => 'mcl_checklist',
            'meta_key' => '_mcl_active',
            'meta_value' => '1',
            'posts_per_page' => -1,
            'fields' => 'ids'
        ));
        
        // Total views
        $total_views = (int) $wpdb->get_var("SELECT SUM(view_count) FROM {$this->analytics_table}");
        
        // Total item checks
        $total_checks = (int) $wpdb->get_var("SELECT SUM(check_count) FROM {$this->item_analytics_table}");
        
        // Most popular checklist
        $most_popular = $wpdb->get_row(
            "SELECT a.checklist_id, a.view_count, p.post_title 
            FROM {$this->analytics_table} a
            JOIN {$wpdb->posts} p ON a.checklist_id = p.ID 
            WHERE p.post_type = 'mcl_checklist' 
            ORDER BY a.view_count DESC LIMIT 1"
        );
        
        // Most checked item
        $most_checked_item = $wpdb->get_row(
            "SELECT ia.checklist_id, ia.item_id, ia.item_content, ia.check_count, p.post_title 
            FROM {$this->item_analytics_table} ia
            JOIN {$wpdb->posts} p ON ia.checklist_id = p.ID 
            WHERE p.post_type = 'mcl_checklist' 
            ORDER BY ia.check_count DESC LIMIT 1"
        );
        
        return array(
            'total_checklists' => $total_checklists->publish ?? 0,
            'active_checklists' => count($active_checklists),
            'total_views' => $total_views,
            'total_checks' => $total_checks,
            'most_popular' => $most_popular,
            'most_checked_item' => $most_checked_item,
            'approaching_deadlines' => get_transient('mcl_approaching_deadlines') ?: array()
        );
    }
    
    /**
     * Render analytics dashboard on admin page
     */
    public function render_analytics_dashboard() {
        // Only render if current user can manage options
        if (!current_user_can('manage_options')) {
            return;
        }
        
        $summary = $this->get_analytics_summary();
        $approaching_deadlines = $summary['approaching_deadlines'];
        
        // Include analytics template
        include MAGIC_CHECKLISTS_PLUGIN_PATH . 'admin/views/analytics-dashboard.php';
    }
    
    /**
     * Render full analytics page
     */
    public function render_analytics_page() {
        $summary = $this->get_analytics_summary();
        $all_analytics = $this->get_all_checklist_analytics();
        
        include MAGIC_CHECKLISTS_PLUGIN_PATH . 'admin/views/analytics-page.php';
    }
    
    /**
     * Clean up old analytics data
     */
    public function cleanup_old_data() {
        global $wpdb;
        
        // Remove analytics for deleted checklists
        $wpdb->query("
            DELETE a FROM {$this->analytics_table} a
            LEFT JOIN {$wpdb->posts} p ON a.checklist_id = p.ID
            WHERE p.ID IS NULL OR p.post_type != 'mcl_checklist'
        ");
        
        $wpdb->query("
            DELETE ia FROM {$this->item_analytics_table} ia
            LEFT JOIN {$wpdb->posts} p ON ia.checklist_id = p.ID
            WHERE p.ID IS NULL OR p.post_type != 'mcl_checklist'
        ");
    }
    
    /**
     * Get the threshold hours for approaching deadlines
     * 
     * @return int Hours threshold for approaching deadlines
     */
    public function get_approaching_deadlines_threshold() {
        return 168; // This should match the default value in get_approaching_deadlines()
    }
} 