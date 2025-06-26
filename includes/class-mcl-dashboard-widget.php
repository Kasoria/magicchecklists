<?php
if (!defined('ABSPATH')) {
    exit;
}

class MCL_Dashboard_Widget {
    private static $instance = null;
    private $widget_id = 'mcl_dashboard_widget';
    
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('wp_dashboard_setup', array($this, 'add_dashboard_widget'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_widget_scripts'));
        add_action('wp_ajax_mcl_widget_toggle_checklist', array($this, 'ajax_toggle_checklist'));
        add_action('wp_ajax_mcl_widget_toggle_item', array($this, 'ajax_toggle_item'));
    }
    
    public function add_dashboard_widget() {
        // Only add if widget is enabled and at least one option is selected
        if (!$this->should_show_widget()) {
            return;
        }
        
        wp_add_dashboard_widget(
            $this->widget_id,
            __('MagicChecklists', 'magic-checklists'),
            array($this, 'render_widget_content'),
            array($this, 'render_widget_config')
        );
    }
    
    public function enqueue_widget_scripts($hook) {
        if ($hook !== 'index.php') {
            return;
        }
        
        if (!$this->should_show_widget()) {
            return;
        }
        
        wp_enqueue_style(
            'mcl-dashboard-widget',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/mcl-dashboard-widget.css',
            array(),
            MAGIC_CHECKLISTS_VERSION
        );
        
        wp_enqueue_script(
            'mcl-dashboard-widget',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/mcl-dashboard-widget.js',
            array('jquery'),
            MAGIC_CHECKLISTS_VERSION,
            true
        );
        
        wp_localize_script('mcl-dashboard-widget', 'mclDashboardWidget', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mcl_widget_nonce'),
            'i18n' => array(
                'confirmToggle' => __('Are you sure you want to toggle this checklist?', 'magic-checklists'),
                'error' => __('An error occurred. Please try again.', 'magic-checklists'),
                'activating' => __('Activating...', 'magic-checklists'),
                'deactivating' => __('Deactivating...', 'magic-checklists'),
            )
        ));
    }
    
    private function should_show_widget() {
        $widget_settings = MCL_Settings::get_setting('dashboard_widget', array());
        
        if (!isset($widget_settings['enabled']) || !$widget_settings['enabled']) {
            return false;
        }
        
        // Check if at least one display option is enabled
        $display_options = array(
            'show_checklists',
            'show_checklist_items',
            'show_deadlines',
            'show_tags',
            'show_descriptions',
            'show_quick_actions'
        );
        
        foreach ($display_options as $option) {
            if (!empty($widget_settings[$option])) {
                return true;
            }
        }
        
        return false;
    }
    
    public function render_widget_content() {
        $widget_settings = MCL_Settings::get_setting('dashboard_widget', array());
        $checklists = $this->get_checklists_data();
        
        if (empty($checklists)) {
            echo '<p class="mcl-widget-empty">' . esc_html__('No checklists found.', 'magic-checklists') . '</p>';
            return;
        }
        
        echo '<div class="mcl-dashboard-widget-content">';
        
        foreach ($checklists as $checklist) {
            $this->render_checklist_item($checklist, $widget_settings);
        }
        
        echo '</div>';
        
        // Add link to main plugin page
        echo '<div class="mcl-widget-footer">';
        echo '<a href="' . esc_url(admin_url('admin.php?page=mcl_checklists')) . '" class="mcl-widget-link">';
        echo esc_html__('View All Checklists', 'magic-checklists') . ' →';
        echo '</a>';
        echo '</div>';
    }
    
    private function render_checklist_item($checklist, $settings) {
        $checklist_id = $checklist['id'];
        $is_active = $checklist['active'];
        
        echo '<div class="mcl-widget-checklist" data-checklist-id="' . esc_attr($checklist_id) . '">';
        
        // Checklist header
        echo '<div class="mcl-widget-checklist-header">';
        
        if (!empty($settings['show_checklists'])) {
            echo '<h4 class="mcl-widget-checklist-title">';
            echo esc_html($checklist['title']);
            
            // Status indicator
            echo '<span class="mcl-widget-status mcl-status-' . ($is_active ? 'active' : 'inactive') . '">';
            echo $is_active ? esc_html__('Active', 'magic-checklists') : esc_html__('Inactive', 'magic-checklists');
            echo '</span>';
            echo '</h4>';
        }
        
        // Quick actions (only show if checklists are being displayed)
        if (!empty($settings['show_quick_actions']) && !empty($settings['show_checklists'])) {
            echo '<div class="mcl-widget-actions">';
            echo '<button type="button" class="mcl-widget-toggle-btn ' . ($is_active ? 'active' : 'inactive') . '" ';
            echo 'data-checklist-id="' . esc_attr($checklist_id) . '" ';
            echo 'data-current-state="' . ($is_active ? '1' : '0') . '">';
            echo $is_active ? esc_html__('Deactivate', 'magic-checklists') : esc_html__('Activate', 'magic-checklists');
            echo '</button>';
            echo '</div>';
        }
        
        echo '</div>';
        
        // Description
        if (!empty($settings['show_descriptions']) && !empty($checklist['description'])) {
            echo '<div class="mcl-widget-description">';
            echo '<p>' . wp_kses_post(wp_trim_words($checklist['description'], 20)) . '</p>';
            echo '</div>';
        }
        
        // Tags
        if (!empty($settings['show_tags']) && !empty($checklist['tags'])) {
            echo '<div class="mcl-widget-tags">';
            echo '<span class="mcl-widget-label">' . esc_html__('Tags:', 'magic-checklists') . '</span>';
            foreach ($checklist['tags'] as $tag) {
                echo '<span class="mcl-widget-tag" style="background-color: ' . esc_attr($tag['color']) . '">';
                echo esc_html($tag['name']);
                echo '</span>';
            }
            echo '</div>';
        }
        
        // Deadlines
        if (!empty($settings['show_deadlines'])) {
            $deadlines = $this->get_checklist_deadlines($checklist_id);
            if (!empty($deadlines)) {
                echo '<div class="mcl-widget-deadlines">';
                echo '<span class="mcl-widget-label">' . esc_html__('Upcoming Deadlines:', 'magic-checklists') . '</span>';
                echo '<ul class="mcl-widget-deadline-list">';
                foreach ($deadlines as $deadline) {
                    $deadline_class = $this->get_deadline_urgency_class($deadline['timestamp']);
                    $is_checklist_deadline = isset($deadline['is_checklist_deadline']) && $deadline['is_checklist_deadline'];
                    $extra_class = $is_checklist_deadline ? ' mcl-widget-checklist-deadline' : '';
                    
                    echo '<li class="mcl-widget-deadline ' . esc_attr($deadline_class . $extra_class) . '">';
                    echo '<span class="mcl-deadline-item">' . wp_kses_post($deadline['item_content']) . '</span>';
                    echo '<span class="mcl-deadline-date">';
                    if ($deadline_class === 'overdue') {
                        echo '<strong>' . esc_html__('OVERDUE', 'magic-checklists') . '</strong> - ';
                    }
                    echo esc_html($deadline['formatted_date']);
                    echo '</span>';
                    if ($is_checklist_deadline) {
                        echo '<span class="mcl-deadline-type">' . esc_html__('Checklist', 'magic-checklists') . '</span>';
                    }
                    echo '</li>';
                }
                echo '</ul>';
                echo '</div>';
            }
        }
        
        // Checklist items (if specific checklist is selected)
        if (!empty($settings['show_checklist_items']) && !empty($settings['selected_checklist']) && $settings['selected_checklist'] == $checklist_id) {
            $items = $this->get_checklist_items($checklist_id);
            if (!empty($items)) {
                $checked_state = $this->get_checked_state($checklist_id);
                $can_interact = $this->can_user_interact_with_checklist($checklist_id);
                
                echo '<div class="mcl-widget-items">';
                echo '<span class="mcl-widget-label">' . esc_html__('Items:', 'magic-checklists') . '</span>';
                echo '<ul class="mcl-widget-item-list">';
                foreach ($items as $item) {
                    $is_checked = in_array($item['id'], $checked_state);
                    $item_class = 'mcl-widget-item' . ($is_checked ? ' mcl-widget-item-checked' : '');
                    
                    echo '<li class="' . esc_attr($item_class) . '" data-item-id="' . esc_attr($item['id']) . '" data-checklist-id="' . esc_attr($checklist_id) . '">';
                    
                    if ($can_interact) {
                        echo '<label class="mcl-widget-checkbox-wrapper">';
                        echo '<input type="checkbox" class="mcl-widget-checkbox" ' . checked($is_checked, true, false) . ' data-item-id="' . esc_attr($item['id']) . '">';
                        echo '<span class="mcl-widget-checkmark"></span>';
                        echo '</label>';
                    } else {
                        echo '<span class="mcl-widget-status-indicator ' . ($is_checked ? 'checked' : 'unchecked') . '"></span>';
                    }
                    
                    echo '<span class="mcl-widget-item-content">' . $this->format_item_content_for_widget($item['content']) . '</span>';
                    echo '</li>';
                }
                echo '</ul>';
                echo '</div>';
            }
        }
        
        echo '</div>';
    }
    
    private function get_checklists_data() {
        $widget_settings = MCL_Settings::get_setting('dashboard_widget', array());
        $selected_checklists = isset($widget_settings['selected_checklists']) ? $widget_settings['selected_checklists'] : array();
        
        $query_args = array(
            'post_type' => 'mcl_checklist',
            'post_status' => 'publish',
            'posts_per_page' => 10, // Limit for dashboard
            'orderby' => 'title',
            'order' => 'ASC',
            'meta_query' => array(
                array(
                    'key' => '_mcl_checklist_type',
                    'value' => 'publisher',
                    'compare' => '!='
                )
            )
        );
        
        // If specific checklists are selected, filter to only those
        if (!empty($selected_checklists) && is_array($selected_checklists)) {
            $query_args['post__in'] = array_map('intval', $selected_checklists);
            $query_args['posts_per_page'] = -1; // Show all selected checklists, not limited to 10
        }
        
        $checklists = get_posts($query_args);
        
        $result = array();
        foreach ($checklists as $checklist) {
            // Double-check that this isn't a publisher checklist (in case meta_query didn't work perfectly)
            $checklist_type = get_post_meta($checklist->ID, '_mcl_checklist_type', true) ?: 'classic';
            if ($checklist_type === 'publisher') {
                continue; // Skip publisher checklists
            }
            
            $result[] = array(
                'id' => $checklist->ID,
                'title' => $checklist->post_title,
                'description' => $checklist->post_content,
                'active' => get_post_meta($checklist->ID, '_mcl_active', true) == '1',
                'tags' => get_post_meta($checklist->ID, '_mcl_tags', true) ?: array()
            );
        }
        
        return $result;
    }
    
    /**
     * Format item content for widget display, handling image-only content
     */
    private function format_item_content_for_widget($content) {
        // Strip HTML tags to get plain text
        $plain_text = wp_strip_all_tags($content);
        $trimmed_text = trim($plain_text);
        
        // If there's meaningful text content, use it
        if (!empty($trimmed_text) && strlen($trimmed_text) > 2) {
            return esc_html(wp_trim_words($trimmed_text, 15));
        }
        
        // If no meaningful text, check if content contains images
        if (preg_match('/<img[^>]*>/i', $content)) {
            // Try to extract alt text from the first image
            if (preg_match('/<img[^>]*alt=["\']([^"\']*)["\'][^>]*>/i', $content, $matches)) {
                $alt_text = trim($matches[1]);
                if (!empty($alt_text)) {
                    return esc_html('[Image: ' . wp_trim_words($alt_text, 10) . ']');
                }
            }
            
            // Try to extract title attribute from the first image
            if (preg_match('/<img[^>]*title=["\']([^"\']*)["\'][^>]*>/i', $content, $matches)) {
                $title_text = trim($matches[1]);
                if (!empty($title_text)) {
                    return esc_html('[Image: ' . wp_trim_words($title_text, 10) . ']');
                }
            }
            
            // Fallback for images without alt text
            return esc_html__('[Image]', 'magic-checklists');
        }
        
        // Check for other media types
        if (preg_match('/<(video|audio|iframe|embed)[^>]*>/i', $content)) {
            return esc_html__('[Media]', 'magic-checklists');
        }
        
        // If content contains other HTML but no readable text
        if (strlen($content) > strlen($trimmed_text) && strlen($content) > 10) {
            return esc_html__('[Content]', 'magic-checklists');
        }
        
        // Fallback for truly empty or minimal content
        return esc_html__('[Empty item]', 'magic-checklists');
    }
    
    private function get_checklist_deadlines($checklist_id) {
        // Only show deadlines for active checklists
        $is_active = get_post_meta($checklist_id, '_mcl_active', true) == '1';
        if (!$is_active) {
            return array();
        }
        
        // Check if this checklist should be displayed based on selection
        $widget_settings = MCL_Settings::get_setting('dashboard_widget', array());
        $selected_checklists = isset($widget_settings['selected_checklists']) ? $widget_settings['selected_checklists'] : array();
        
        // If specific checklists are selected, only show deadlines for those
        if (!empty($selected_checklists) && is_array($selected_checklists)) {
            if (!in_array($checklist_id, array_map('intval', $selected_checklists))) {
                return array();
            }
        }
        
        $result = array();
        $now = current_time('timestamp');
        $future_threshold = $now + (30 * DAY_IN_SECONDS); // Show future deadlines within 30 days
        $past_threshold = $now - (7 * DAY_IN_SECONDS); // Show overdue deadlines from last 7 days
        
        // Get checklist title for display
        $checklist_title = get_the_title($checklist_id);
        
        // Check for checklist-level deadline first
        $checklist_deadline = get_post_meta($checklist_id, '_mcl_time_date', true);
        
        // Validate and process checklist deadline if it exists
        if (!empty($checklist_deadline)) {
            $checklist_deadline = intval($checklist_deadline);
            
            // Show deadlines that are either overdue (within last 7 days) or upcoming (within next 30 days)
            if ($checklist_deadline > 86400 && 
                (($checklist_deadline >= $past_threshold && $checklist_deadline <= $now) || 
                 ($checklist_deadline > $now && $checklist_deadline <= $future_threshold))) {
                $result[] = array(
                    'item_id' => 'checklist',
                    'item_content' => '<strong>' . esc_html($checklist_title) . '</strong>',
                    'timestamp' => $checklist_deadline,
                                            'formatted_date' => MCL_Admin::format_date($checklist_deadline),
                    'is_checklist_deadline' => true
                );
            }
        }
        
        // Get item deadlines
        $item_deadlines = get_post_meta($checklist_id, '_mcl_item_deadlines', true) ?: array();
        $items = get_post_meta($checklist_id, '_mcl_items', true) ?: array();
        
        // Create item map for faster lookup
        $item_map = array();
        foreach ($items as $item) {
            $item_map[$item['id']] = $item;
        }
        
        // Get checked items to filter out completed items
        $checked_items = $this->get_checked_state($checklist_id);
        
        foreach ($item_deadlines as $item_id => $timestamp) {
            // Skip if item is already checked off
            if (in_array($item_id, $checked_items)) {
                continue;
            }
            
            // Validate timestamp and show both overdue and upcoming deadlines
            $timestamp = intval($timestamp);
            if ($timestamp <= 86400 || 
                ($timestamp < $past_threshold) || 
                ($timestamp > $future_threshold)) {
                continue; // Skip invalid, too old, or too far future deadlines
            }
            
            // Find the item content
            $item_content = '';
            if (isset($item_map[$item_id]) && !empty($item_map[$item_id]['content'])) {
                $item_content = $item_map[$item_id]['content'];
            }
            
            if (!empty($item_content)) {
                $result[] = array(
                    'item_id' => $item_id,
                    'item_content' => $item_content,
                    'timestamp' => $timestamp,
                                            'formatted_date' => MCL_Admin::format_date($timestamp),
                    'is_checklist_deadline' => false
                );
            }
        }
        
        // Sort by deadline (earliest first)
        usort($result, function($a, $b) {
            return $a['timestamp'] - $b['timestamp'];
        });
        
        return array_slice($result, 0, 3); // Limit to 3 deadlines for dashboard
    }
    
    private function get_deadline_urgency_class($timestamp) {
        $now = current_time('timestamp');
        $diff = $timestamp - $now;
        
        if ($diff < 0) {
            return 'overdue'; // Past deadline
        } elseif ($diff <= DAY_IN_SECONDS) {
            return 'urgent'; // Within 24 hours
        } elseif ($diff <= 3 * DAY_IN_SECONDS) {
            return 'warning'; // Within 3 days
        } else {
            return 'normal';
        }
    }
    
    private function get_checklist_items($checklist_id) {
        $items = get_post_meta($checklist_id, '_mcl_items', true) ?: array();
        return $items;
    }
    
    private function get_checked_state($checklist_id) {
        $is_public = get_post_meta($checklist_id, '_mcl_public_access', true) == '1';
        
        if ($is_public) {
            $handling = get_post_meta($checklist_id, '_mcl_public_checked_state_handling', true) ?: 'per_user';
        } else {
            $handling = get_post_meta($checklist_id, '_mcl_checked_state_handling', true) ?: 'global';
        }
        
        if ($handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            $checked_state = get_user_meta($user_id, "_mcl_drawer_checked_state_" . $checklist_id, true);
        } else {
            $checked_state = get_post_meta($checklist_id, '_mcl_checked_state', true);
        }
        
        // Ensure we always return a proper array, not an object
        if (!is_array($checked_state)) {
            return array();
        }
        
        // Re-index the array to ensure it's a proper indexed array, not an associative array
        return array_values($checked_state);
    }
    
    private function can_user_interact_with_checklist($checklist_id) {
        if (!class_exists('MCL_Permissions')) {
            return false;
        }
        
        $permissions = new MCL_Permissions();
        return $permissions->has_permission($checklist_id, 'interact');
    }
    
    public function ajax_toggle_checklist() {
        check_ajax_referer('mcl_widget_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array(
                'message' => __('You do not have permission to perform this action', 'magic-checklists')
            ));
        }
        
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $new_state = isset($_POST['new_state']) ? intval($_POST['new_state']) : 0;
        
        if (!$checklist_id) {
            wp_send_json_error(array(
                'message' => __('Invalid checklist ID', 'magic-checklists')
            ));
        }
        
        $result = update_post_meta($checklist_id, '_mcl_active', $new_state);
        
        if ($result !== false) {
            wp_send_json_success(array(
                'message' => $new_state ? 
                    __('Checklist activated successfully', 'magic-checklists') : 
                    __('Checklist deactivated successfully', 'magic-checklists'),
                'new_state' => $new_state
            ));
        } else {
            wp_send_json_error(array(
                'message' => __('Failed to update checklist status', 'magic-checklists')
            ));
        }
    }
    
    public function ajax_toggle_item() {
        check_ajax_referer('mcl_widget_nonce', 'nonce');
        
        $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
        $item_id = isset($_POST['item_id']) ? sanitize_text_field($_POST['item_id']) : '';
        $checked = isset($_POST['checked']) ? (bool) $_POST['checked'] : false;
        
        if (!$checklist_id || !$item_id) {
            wp_send_json_error(array(
                'message' => __('Invalid parameters', 'magic-checklists')
            ));
        }
        
        // Check if user can interact with this checklist
        if (!$this->can_user_interact_with_checklist($checklist_id)) {
            wp_send_json_error(array(
                'message' => __('You do not have permission to interact with this checklist', 'magic-checklists')
            ));
        }
        
        // Get current checked state
        $checked_state = $this->get_checked_state($checklist_id);
        
        // Update checked state
        if ($checked) {
            if (!in_array($item_id, $checked_state)) {
                $checked_state[] = $item_id;
            }
        } else {
            $checked_state = array_diff($checked_state, array($item_id));
            // Re-index array to prevent gaps that could cause object conversion
            $checked_state = array_values($checked_state);
        }
        
        // Save checked state
        $this->save_checked_state($checklist_id, $checked_state);
        
        wp_send_json_success(array(
            'message' => $checked ? 
                __('Item checked', 'magic-checklists') : 
                __('Item unchecked', 'magic-checklists'),
            'checked' => $checked
        ));
    }
    
    private function save_checked_state($checklist_id, $checked_state) {
        // Ensure we're saving a proper indexed array
        $checked_state = array_values(array_filter($checked_state));
        
        $is_public = get_post_meta($checklist_id, '_mcl_public_access', true) == '1';
        
        if ($is_public) {
            $handling = get_post_meta($checklist_id, '_mcl_public_checked_state_handling', true) ?: 'per_user';
        } else {
            $handling = get_post_meta($checklist_id, '_mcl_checked_state_handling', true) ?: 'global';
        }
        
        if ($handling === 'per_user' && is_user_logged_in()) {
            $user_id = get_current_user_id();
            update_user_meta($user_id, "_mcl_drawer_checked_state_" . $checklist_id, $checked_state);
        } else {
            update_post_meta($checklist_id, '_mcl_checked_state', $checked_state);
        }
    }
    
    public function render_widget_config() {
        // Widget configuration form (appears when clicking "Configure" on the widget)
        $widget_settings = MCL_Settings::get_setting('dashboard_widget', array());
        ?>
        <p>
            <?php esc_html_e('Configure this widget from the', 'magic-checklists'); ?>
            <a href="<?php echo esc_url(admin_url('admin.php?page=mcl_checklists&view=settings')); ?>">
                <?php esc_html_e('Settings page', 'magic-checklists'); ?>
            </a>
        </p>
        <?php
    }
}
