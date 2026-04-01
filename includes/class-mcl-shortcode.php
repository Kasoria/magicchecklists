<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MAGICCL_Shortcode {
    private static $instance = null;
    private $shortcode_counter = 0;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Register shortcode
        add_shortcode('magic_checklist', array($this, 'render_shortcode'));
        
        // Register assets
        add_action('wp_enqueue_scripts', array($this, 'register_assets'));
    }

    public function register_assets() {
        // Register CSS styles for shortcode
        wp_register_style(
            'magiccl-shortcode-style',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/magiccl-shortcode.css',
            array(),
            MAGIC_CHECKLISTS_VERSION
        );

        // Localize for React components (attached to window object via wp_add_inline_script)
        add_action('wp_footer', function() {
            $shortcode_data = array(
                'ajaxurl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('magiccl_shortcode_nonce'),
                'user_logged_in' => is_user_logged_in() ? '1' : '0',
                'i18n' => array(
                    'errorLoading' => __('Error loading checklist', 'magicchecklists'),
                    'errorSaving' => __('Error saving state', 'magicchecklists'),
                    'editChecklist' => __('Edit Checklist', 'magicchecklists'),
                    'saveChanges' => __('Save Changes', 'magicchecklists'),
                    'saving' => __('Saving...', 'magicchecklists'),
                    'saveSuccess' => __('Changes saved successfully!', 'magicchecklists'),
                    'networkError' => __('Network error. Please try again.', 'magicchecklists'),
                    'emptyItems' => __('Please add content to at least one item before saving.', 'magicchecklists'),
                    'cancel' => __('Cancel', 'magicchecklists'),
                    'addItem' => __('Add Item', 'magicchecklists'),
                    'deleteItem' => __('Delete', 'magicchecklists'),
                    'priorityNone' => __('No Priority', 'magicchecklists'),
                    'priorityLow' => __('Low Priority', 'magicchecklists'),
                    'priorityMedium' => __('Medium Priority', 'magicchecklists'),
                    'priorityHigh' => __('High Priority', 'magicchecklists'),
                    'priorityCritical' => __('Critical Priority', 'magicchecklists'),
                    'confirmDelete' => __('Are you sure you want to delete this item?', 'magicchecklists'),
                    'addImage' => __('Add Image', 'magicchecklists'),
                    'uploadImage' => __('Upload Image', 'magicchecklists'),
                    'selectImage' => __('Select Image', 'magicchecklists'),
                    'uploadNew' => __('Upload New', 'magicchecklists'),
                    'selectExisting' => __('Select Existing', 'magicchecklists'),
                    'dragDropImage' => __('Drag and drop image here or click to select', 'magicchecklists'),
                    'imageRequirements' => __('Maximum file size: 10MB. Supported formats: JPG, PNG, GIF', 'magicchecklists'),
                    'loadingImages' => __('Loading images...', 'magicchecklists'),
                    'noImagesFound' => __('No images found', 'magicchecklists'),
                    'insertImage' => __('Insert Image', 'magicchecklists'),
                    'errorUploadingImage' => __('Error uploading image', 'magicchecklists'),
                    'invalidFileType' => __('Invalid file type. Please upload a JPG, PNG, or GIF image.', 'magicchecklists'),
                    'fileTooLarge' => __('File is too large. Maximum size is 10MB.', 'magicchecklists'),
                    'enterUrl' => __('Enter URL (https:// or http://)', 'magicchecklists'),
                    'pleaseEnterUrl' => __('Please enter a URL', 'magicchecklists'),
                    'invalidUrl' => __('Please enter a valid URL starting with http:// or https://', 'magicchecklists'),
                    'insertLink' => __('Insert Link', 'magicchecklists'),
                    'removeLink' => __('Remove Link', 'magicchecklists'),
                ),
            );
            wp_add_inline_script('jquery', 'window.magicclShortcode = ' . wp_json_encode($shortcode_data) . ';');
        });
    }

    public function render_shortcode($atts) {
        $this->shortcode_counter++;
    
        // Parse attributes
        $atts = shortcode_atts(array(
            'id' => 0,
            'class' => ''
        ), $atts, 'magic_checklist');
    
        $checklist_id = intval($atts['id']);
        if (!$checklist_id) {
            return '<!-- Invalid Magic Checklist ID -->';
        }
    
        // Get checklist data
        $checklist = get_post($checklist_id);
        if (!$checklist || $checklist->post_type !== 'magiccl_checklist') {
            return '<!-- Magic Checklist not found -->';
        }
    
        // Check if shortcode is enabled
        if (!MAGICCL_Admin::is_shortcode_enabled($checklist_id)) {
            return '<!-- Shortcode not enabled for this checklist -->';
        }
    
        // Create permissions object to check user access
        $permissions = new MAGICCL_Permissions();
        $can_edit = $permissions->has_permission($checklist_id, 'edit');
        $can_interact = $permissions->has_permission($checklist_id, 'interact') || $can_edit;
    
        // Enqueue required assets (React build)
        wp_enqueue_style('magiccl-shortcode-style');
        wp_enqueue_script('magiccl-public-react'); // This is our React app
    
        // Get settings and items
        $settings = MAGICCL_Admin::get_shortcode_settings($checklist_id);
        $items = get_post_meta($checklist_id, '_magiccl_items', true) ?: array();
        
        // Get priority settings
        $enable_priority = !empty($settings['show_priority']) && get_post_meta($checklist_id, '_magiccl_enable_item_priority', true);
        $priority_display_type = get_post_meta($checklist_id, '_magiccl_priority_display_type', true) ?: 'color';
        
        // Get checked state
        $checked_state = $this->get_checked_state($checklist_id);

        // Get in-progress state
        $in_progress_state = $this->get_in_progress_state($checklist_id);

        // Add checked and in-progress state to items
        foreach ($items as &$item) {
            $item['checked'] = in_array($item['id'], $checked_state);
            $item['inProgress'] = in_array($item['id'], $in_progress_state);
        }

        // Track checklist view for analytics
        do_action('magiccl_checklist_rendered', $checklist_id);
    
        // Generate unique instance ID
        $instance_id = 'magiccl-shortcode-' . $checklist_id . '-' . $this->shortcode_counter;
        
        // Check for auto-reset
        $reset_enabled = get_post_meta($checklist_id, '_magiccl_enable_auto_reset', true) === '1';
        $was_reset = false;
        if ($reset_enabled) {
            $magiccl_public = MAGICCL_Public::get_instance();
            $was_reset = $magiccl_public->check_and_handle_reset($checklist_id);
        }

        // Prepare data for React component
        $shortcode_data = array(
            'checklistId' => $checklist_id,
            'instanceId' => $this->shortcode_counter,
            'settings' => $settings,
            'items' => $items,
            'permissions' => array(
                'can_edit' => $can_edit,
                'can_interact' => $can_interact
            ),
            'priorityEnabled' => $enable_priority,
            'priorityDisplayType' => $priority_display_type,
            'checklist' => array(
                'title' => $checklist->post_title,
                'content' => $checklist->post_content,
                'deadline' => get_post_meta($checklist_id, '_magiccl_deadline', true)
            ),
            'reset_info' => array(
                'enabled' => $reset_enabled,
                'was_reset' => $was_reset,
                'reset_counter' => get_post_meta($checklist_id, '_magiccl_reset_counter', true) ?: 1
            )
        );

        // Start output buffering
        ob_start();
        ?>
        <div 
            id="<?php echo esc_attr($instance_id); ?>"
            class="magiccl-shortcode-root"
            data-shortcode-props="<?php echo esc_attr(wp_json_encode($shortcode_data)); ?>"
            data-magiccl-shortcode="true"
        ></div>
        <?php
        return ob_get_clean();
    }


    private function get_checked_state($checklist_id) {
        // Get checklist settings
        $settings = MAGICCL_Admin::get_shortcode_settings($checklist_id);
        $handling = $settings['check_state'] ?? 'session';

        // Only global state is handled server-side
        if ($handling === 'global') {
            // Use same key as drawer/admin for cross-view sync
            return get_post_meta($checklist_id, '_magiccl_checked_state', true) ?: array();
        }

        // Local and session storage are handled client-side
        return array();
    }

    private function get_in_progress_state($checklist_id) {
        // Get checklist settings
        $settings = MAGICCL_Admin::get_shortcode_settings($checklist_id);
        $handling = $settings['check_state'] ?? 'session';

        // Only global state is handled server-side
        if ($handling === 'global') {
            // Use same key as drawer/admin for cross-view sync
            return get_post_meta($checklist_id, '_magiccl_items_in_progress', true) ?: array();
        }

        // Local and session storage are handled client-side
        return array();
    }
}

// Initialize the shortcode handler
function magiccl_init_shortcode() {
    MAGICCL_Shortcode::get_instance();
}
add_action('init', 'magiccl_init_shortcode');