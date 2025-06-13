<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MCL_Shortcode {
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
            'mcl-shortcode-style',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-shortcode.css',
            array(),
            MAGIC_CHECKLISTS_VERSION
        );

        // Localize for React components (attached to window object)
        add_action('wp_footer', function() {
            ?>
            <script>
            window.mclShortcode = {
                ajaxurl: '<?php echo esc_js(admin_url('admin-ajax.php')); ?>',
                nonce: '<?php echo esc_js(wp_create_nonce('mcl_shortcode_nonce')); ?>',
                user_logged_in: '<?php echo is_user_logged_in() ? '1' : '0'; ?>',
                i18n: {
                    errorLoading: '<?php echo esc_js(__('Error loading checklist', 'magic-checklists')); ?>',
                    errorSaving: '<?php echo esc_js(__('Error saving state', 'magic-checklists')); ?>',
                    editChecklist: '<?php echo esc_js(__('Edit Checklist', 'magic-checklists')); ?>',
                    saveChanges: '<?php echo esc_js(__('Save Changes', 'magic-checklists')); ?>',
                    saving: '<?php echo esc_js(__('Saving...', 'magic-checklists')); ?>',
                    saveSuccess: '<?php echo esc_js(__('Changes saved successfully!', 'magic-checklists')); ?>',
                    networkError: '<?php echo esc_js(__('Network error. Please try again.', 'magic-checklists')); ?>',
                    emptyItems: '<?php echo esc_js(__('Please add content to at least one item before saving.', 'magic-checklists')); ?>',
                    cancel: '<?php echo esc_js(__('Cancel', 'magic-checklists')); ?>',
                    addItem: '<?php echo esc_js(__('Add Item', 'magic-checklists')); ?>',
                    deleteItem: '<?php echo esc_js(__('Delete', 'magic-checklists')); ?>',
                    priorityNone: '<?php echo esc_js(__('No Priority', 'magic-checklists')); ?>',
                    priorityLow: '<?php echo esc_js(__('Low Priority', 'magic-checklists')); ?>',
                    priorityMedium: '<?php echo esc_js(__('Medium Priority', 'magic-checklists')); ?>',
                    priorityHigh: '<?php echo esc_js(__('High Priority', 'magic-checklists')); ?>',
                    priorityCritical: '<?php echo esc_js(__('Critical Priority', 'magic-checklists')); ?>',
                    confirmDelete: '<?php echo esc_js(__('Are you sure you want to delete this item?', 'magic-checklists')); ?>',
                    addImage: '<?php echo esc_js(__('Add Image', 'magic-checklists')); ?>',
                    uploadImage: '<?php echo esc_js(__('Upload Image', 'magic-checklists')); ?>',
                    selectImage: '<?php echo esc_js(__('Select Image', 'magic-checklists')); ?>',
                    uploadNew: '<?php echo esc_js(__('Upload New', 'magic-checklists')); ?>',
                    selectExisting: '<?php echo esc_js(__('Select Existing', 'magic-checklists')); ?>',
                    dragDropImage: '<?php echo esc_js(__('Drag and drop image here or click to select', 'magic-checklists')); ?>',
                    imageRequirements: '<?php echo esc_js(__('Maximum file size: 10MB. Supported formats: JPG, PNG, GIF', 'magic-checklists')); ?>',
                    loadingImages: '<?php echo esc_js(__('Loading images...', 'magic-checklists')); ?>',
                    noImagesFound: '<?php echo esc_js(__('No images found', 'magic-checklists')); ?>',
                    insertImage: '<?php echo esc_js(__('Insert Image', 'magic-checklists')); ?>',
                    errorUploadingImage: '<?php echo esc_js(__('Error uploading image', 'magic-checklists')); ?>',
                    invalidFileType: '<?php echo esc_js(__('Invalid file type. Please upload a JPG, PNG, or GIF image.', 'magic-checklists')); ?>',
                    fileTooLarge: '<?php echo esc_js(__('File is too large. Maximum size is 10MB.', 'magic-checklists')); ?>',
                    enterUrl: '<?php echo esc_js(__('Enter URL (https:// or http://)', 'magic-checklists')); ?>',
                    pleaseEnterUrl: '<?php echo esc_js(__('Please enter a URL', 'magic-checklists')); ?>',
                    invalidUrl: '<?php echo esc_js(__('Please enter a valid URL starting with http:// or https://', 'magic-checklists')); ?>',
                    insertLink: '<?php echo esc_js(__('Insert Link', 'magic-checklists')); ?>',
                    removeLink: '<?php echo esc_js(__('Remove Link', 'magic-checklists')); ?>'
                }
            };
            </script>
            <?php
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
        if (!$checklist || $checklist->post_type !== 'mcl_checklist') {
            return '<!-- Magic Checklist not found -->';
        }
    
        // Check if shortcode is enabled
        if (!MCL_Admin::is_shortcode_enabled($checklist_id)) {
            return '<!-- Shortcode not enabled for this checklist -->';
        }
    
        // Create permissions object to check user access
        $permissions = new MCL_Permissions();
        $can_edit = $permissions->has_permission($checklist_id, 'edit');
        $can_interact = $permissions->has_permission($checklist_id, 'interact') || $can_edit;
    
        // Enqueue required assets (React build)
        wp_enqueue_style('mcl-shortcode-style');
        wp_enqueue_script('mcl-public-react'); // This is our React app
    
        // Get settings and items
        $settings = MCL_Admin::get_shortcode_settings($checklist_id);
        $items = get_post_meta($checklist_id, '_mcl_items', true) ?: array();
        
        // Get priority settings
        $enable_priority = !empty($settings['show_priority']) && get_post_meta($checklist_id, '_mcl_enable_item_priority', true);
        $priority_display_type = get_post_meta($checklist_id, '_mcl_priority_display_type', true) ?: 'color';
        
        // Get checked state
        $checked_state = $this->get_checked_state($checklist_id);
        
        // Add checked state to items
        foreach ($items as &$item) {
            $item['checked'] = in_array($item['id'], $checked_state);
        }

        // Track checklist view for analytics
        do_action('mcl_checklist_rendered', $checklist_id);
    
        // Generate unique instance ID
        $instance_id = 'mcl-shortcode-' . $checklist_id . '-' . $this->shortcode_counter;
        
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
                'deadline' => get_post_meta($checklist_id, '_mcl_deadline', true)
            )
        );

        // Start output buffering
        ob_start();
        ?>
        <div 
            id="<?php echo esc_attr($instance_id); ?>"
            class="mcl-shortcode-root"
            data-shortcode-props="<?php echo esc_attr(wp_json_encode($shortcode_data)); ?>"
            data-mcl-shortcode="true"
        ></div>
        <?php
        return ob_get_clean();
    }


    private function get_checked_state($checklist_id) {
        // Get checklist settings
        $settings = MCL_Admin::get_shortcode_settings($checklist_id);
        $handling = $settings['check_state'] ?? 'session';

        // Only global state is handled server-side
        if ($handling === 'global') {
            return get_post_meta($checklist_id, '_mcl_shortcode_checked_state', true) ?: array();
        }

        // Local and session storage are handled client-side
        return array();
    }
}

// Initialize the shortcode handler
function mcl_init_shortcode() {
    MCL_Shortcode::get_instance();
}
add_action('init', 'mcl_init_shortcode');