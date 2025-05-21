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
        error_log("shortcode classloaded");
    }

    public function register_assets() {

        wp_register_script(
            'sortablejs',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/vendor/sortable.min.js',
            array(),
            MAGIC_CHECKLISTS_VERSION,
            true
        );

        wp_register_style(
            'mcl-shortcode-style',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-shortcode.css',
            array(),
            MAGIC_CHECKLISTS_VERSION
        );

        wp_register_script(
            'mcl-shortcode',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/mcl-shortcode.js',
            array('sortablejs', 'jquery'),
            MAGIC_CHECKLISTS_VERSION,
            true
        );
        
        // Register the editor script and styles
        wp_register_script(
            'mcl-shortcode-editor',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/mcl-shortcode-editor.js',
            array('sortablejs', 'jquery', 'mcl-shortcode'),
            MAGIC_CHECKLISTS_VERSION,
            true
        );
        
        wp_register_style(
            'mcl-shortcode-editor-style',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-shortcode-editor.css',
            array('mcl-shortcode-style'),
            MAGIC_CHECKLISTS_VERSION
        );

        // Register additional styles for image and link functionality
        wp_register_style(
            'mcl-shortcode-image-style',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-shortcode-image.css',
            array('mcl-shortcode-editor-style'),
            MAGIC_CHECKLISTS_VERSION
        );
        
        wp_register_style(
            'mcl-shortcode-link-style',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-shortcode-link.css',
            array('mcl-shortcode-editor-style'),
            MAGIC_CHECKLISTS_VERSION
        );

        // Localize script
        wp_localize_script('mcl-shortcode', 'mclShortcode', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mcl_shortcode_nonce'),
            'user_logged_in' => is_user_logged_in(),
            'i18n' => array(
                'errorLoading' => __('Error loading checklist', 'magic-checklists'),
                'errorSaving' => __('Error saving state', 'magic-checklists'),
                'editChecklist' => __('Edit Checklist', 'magic-checklists'),
                'saveChanges' => __('Save Changes', 'magic-checklists'),
                'saving' => __('Saving...', 'magic-checklists'), 
                'saveSuccess' => __('Changes saved successfully!', 'magic-checklists'),
                'networkError' => __('Network error. Please try again.', 'magic-checklists'),
                'emptyItems' => __('Please add content to at least one item before saving.', 'magic-checklists'),
                'cancel' => __('Cancel', 'magic-checklists'),
                'addItem' => __('Add Item', 'magic-checklists'),
                'deleteItem' => __('Delete', 'magic-checklists'),
                'priorityNone' => __('No Priority', 'magic-checklists'),
                'priorityLow' => __('Low Priority', 'magic-checklists'),
                'priorityMedium' => __('Medium Priority', 'magic-checklists'),
                'priorityHigh' => __('High Priority', 'magic-checklists'),
                'priorityCritical' => __('Critical Priority', 'magic-checklists'),
                'confirmDelete' => __('Are you sure you want to delete this item?', 'magic-checklists'),
                'addImage' => __('Add Image', 'magic-checklists'),
                'uploadImage' => __('Upload Image', 'magic-checklists'),
                'selectImage' => __('Select Image', 'magic-checklists'),
                'uploadNew' => __('Upload New', 'magic-checklists'),
                'selectExisting' => __('Select Existing', 'magic-checklists'),
                'dragDropImage' => __('Drag and drop image here or click to select', 'magic-checklists'),
                'imageRequirements' => __('Maximum file size: 10MB. Supported formats: JPG, PNG, GIF', 'magic-checklists'),
                'loadingImages' => __('Loading images...', 'magic-checklists'),
                'noImagesFound' => __('No images found', 'magic-checklists'),
                'insertImage' => __('Insert Image', 'magic-checklists'),
                'errorUploadingImage' => __('Error uploading image', 'magic-checklists'),
                'invalidFileType' => __('Invalid file type. Please upload a JPG, PNG, or GIF image.', 'magic-checklists'),
                'fileTooLarge' => __('File is too large. Maximum size is 10MB.', 'magic-checklists'),
                'enterUrl' => __('Enter URL (https:// or http://)', 'magic-checklists'),
                'pleaseEnterUrl' => __('Please enter a URL', 'magic-checklists'),
                'invalidUrl' => __('Please enter a valid URL starting with http:// or https://', 'magic-checklists'),
                'insertLink' => __('Insert Link', 'magic-checklists'),
                'removeLink' => __('Remove Link', 'magic-checklists')
            )
        ));
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
    
        // Enqueue required assets
        wp_enqueue_style('mcl-shortcode-style');
        wp_enqueue_script('mcl-shortcode');
        
        // Enqueue editor assets if user can edit
        if ($can_edit) {
            wp_enqueue_style('mcl-shortcode-editor-style');
            wp_enqueue_style('mcl-shortcode-image-style');
            wp_enqueue_style('mcl-shortcode-link-style');
            wp_enqueue_script('mcl-shortcode-editor');
        }
    
        // Get settings and items
        $settings = MCL_Admin::get_shortcode_settings($checklist_id);
        $items = get_post_meta($checklist_id, '_mcl_items', true) ?: array();
        
        // Get priority settings
        $enable_priority = !empty($settings['show_priority']) && get_post_meta($checklist_id, '_mcl_enable_item_priority', true);
        $priority_display_type = get_post_meta($checklist_id, '_mcl_priority_display_type', true) ?: 'color';
        
        // Get checked state
        $checked_state = $this->get_checked_state($checklist_id);
    
        // Start output buffering
        ob_start();
    
        // Generate unique instance ID
        $instance_id = 'mcl-shortcode-' . $checklist_id . '-' . $this->shortcode_counter;
    
        // Build classes array
        $classes = array(
            'mcl-shortcode-container',
            'mcl-spacing-' . ($settings['item_spacing'] ?? 'comfortable'),
            'mcl-border-' . ($settings['border_type'] ?? 'solid'),
            $atts['class']
        );
    
        // Add width class
        if (($settings['width'] ?? 'full') === 'custom') {
            $classes[] = 'mcl-width-custom';
        } elseif ($settings['width'] === 'narrow') {
            $classes[] = 'mcl-width-narrow';
        }
    
        // Add CSS variables for dynamic styles
        $style = sprintf(
            '--mcl-shortcode-custom-width: %dpx;',
            absint($settings['custom_width'] ?? 800)
        );
    
        // Define CSS variables
        $variables = array(
            'title-text-color' => $settings['title_text_color'] ?? '#000000',
            'description-text-color' => $settings['description_text_color'] ?? '#333333',
            'deadline-text-color' => $settings['deadline_text_color'] ?? '#ff0000',
            'list-item-text-color' => $settings['list_item_text_color'] ?? '#1a1a1a',
            'border-color' => $settings['border_color'] ?? '#e2e8f0',
            'checkbox-border-color' => $settings['checkbox_border_color'] ?? '#cccccc',
            'checkbox-color-filled' => $settings['checkbox_color_filled'] ?? '#0ea5e9',
            'checkbox-color-unfilled' => $settings['checkbox_color_unfilled'] ?? '#ffffff',
            'checkmark-color' => $settings['checkmark_color'] ?? '#ffffff',
            'bg' => $settings['bg_color'] ?? '#ffffff',
            'title-font-size' => ($settings['title_font_size'] ?? '18') . 'px',
            'description-font-size' => ($settings['description_font_size'] ?? '14') . 'px',
            'list-item-font-size' => ($settings['list_item_font_size'] ?? '16') . 'px',
            'deadline-font-size' => ($settings['deadline_font_size'] ?? '14') . 'px',
            'padding-block' => ($settings['padding_block'] ?? '32') . 'px',
            'padding-inline' => ($settings['padding_inline'] ?? '32') . 'px',
            'container-gap' => ($settings['container_gap'] ?? '10') . 'px',
            'padding-block-mobile' => (min(intval($settings['padding_block'] ?? '32'), 24)) . 'px',
            'padding-inline-mobile' => (min(intval($settings['padding_inline'] ?? '32'), 24)) . 'px',
            'checkbox-dimensions' => ($settings['checkbox_dimensions'] ?? '20') . 'px',
            'checkbox-border-radius' => ($settings['checkbox_border_radius'] ?? '4') . 'px',
            'checkbox-border-thickness' => ($settings['checkbox_border_thickness'] ?? '2') . 'px',
            'border-radius' => ($settings['border_radius'] ?? '6') . 'px',
            'border-thickness' => ($settings['border_thickness'] ?? '1') . 'px'
        );
    
        foreach ($variables as $key => $value) {
            $style .= sprintf('--mcl-shortcode-%s: %s;', $key, $value);
        }
    
        ?>
        <div id="<?php echo esc_attr($instance_id); ?>"
             class="<?php echo esc_attr(implode(' ', array_filter($classes))); ?>"
             style="<?php echo esc_attr($style); ?>"
             data-checklist-id="<?php echo esc_attr($checklist_id); ?>"
             data-instance-id="<?php echo esc_attr($this->shortcode_counter); ?>"
             data-check-state="<?php echo esc_attr($settings['check_state'] ?? 'session'); ?>"
             data-can-edit="<?php echo esc_attr($can_edit ? '1' : '0'); ?>"
             data-can-interact="<?php echo esc_attr($can_interact ? '1' : '0'); ?>"
             data-priority-enabled="<?php echo esc_attr($enable_priority ? '1' : '0'); ?>"
             data-priority-display-type="<?php echo esc_attr($priority_display_type); ?>">
    
            <div class="mcl-shortcode-header">
                <?php if (!empty($settings['show_title'])): ?>
                    <h3 class="mcl-shortcode-title">
                        <?php echo esc_html($checklist->post_title); ?>
                    </h3>
                <?php endif; ?>
    
                <?php if ($can_edit): ?>
                    <button type="button" class="mcl-shortcode-edit-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span><?php esc_html_e('Edit', 'magic-checklists'); ?></span>
                    </button>
                <?php endif; ?>
            </div>
    
            <?php if (!empty($settings['show_description']) && $checklist->post_content): ?>
                    <div class="mcl-shortcode-description">
                    <?php echo wp_kses_post($checklist->post_content); ?>
                </div>
            <?php endif; ?>
    
            <?php if (!empty($settings['show_deadline'])): ?>
                <?php
                $deadline = get_post_meta($checklist_id, '_mcl_deadline', true);
                if ($deadline):
                    $deadline_time = intval($deadline);
                ?>
                    <div class="mcl-shortcode-deadline">
                        <?php echo esc_html(date_i18n(get_option('date_format'), $deadline_time)); ?>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
    
            <ul class="mcl-shortcode-items">
                <?php foreach ($items as $index => $item): ?>
                    <li class="mcl-shortcode-item<?php echo in_array($item['id'], $checked_state) ? ' mcl-shortcode-checked' : ''; ?>"
                        data-item-id="<?php echo esc_attr($item['id']); ?>">
                        <?php if (!empty($settings['enable_reorder']) && $can_interact): ?>
                            <span class="mcl-item-drag-handle">☰</span>
                        <?php endif; ?>
                        <label class="mcl-item-label">
                            <input type="checkbox"
                                class="mcl-item-checkbox"
                                <?php checked(in_array($item['id'], $checked_state)); ?>>
    
                            <?php if (!empty($settings['show_numbers'])): ?>
                                <span class="mcl-item-number"><?php echo esc_html($index + 1); ?>.</span>
                            <?php endif; ?>
    
                            <?php if (!empty($settings['show_priority']) && !empty($item['priority']) && $item['priority'] !== 'none'): ?>
                                <?php 
                                // Get priority display type
                                $priority_display_type = get_post_meta($checklist_id, '_mcl_priority_display_type', true) ?: 'color';
                                
                                if ($priority_display_type === 'number') {
                                    // Number-based priority display
                                    $priority_numbers = [
                                        'low' => '1',
                                        'medium' => '2',
                                        'high' => '3',
                                        'critical' => '4'
                                    ];
                                    $number = isset($priority_numbers[$item['priority']]) ? $priority_numbers[$item['priority']] : '';
                                    ?>
                                    <span class="mcl-item-priority mcl-priority-<?php echo esc_attr($item['priority']); ?> mcl-priority-number">
                                        <?php echo esc_html($number); ?>
                                    </span>
                                <?php } else { ?>
                                    <!-- Default color-based priority indicator -->
                                    <span class="mcl-item-priority mcl-priority-<?php echo esc_attr($item['priority']); ?>"></span>
                                <?php } ?>
                            <?php endif; ?>
    
                            <span class="mcl-item-content">
                                <?php echo wp_kses_post($item['content']); ?>
                            </span>
                        </label>
                    </li>
                <?php endforeach; ?>
            </ul>
            
            <?php if ($can_edit): ?>
            <!-- Editor Modal (hidden by default) -->
            <div class="mcl-shortcode-editor-modal" style="display: none;">
                <div class="mcl-shortcode-editor-overlay"></div>
                <div class="mcl-shortcode-editor-content">
                    <div class="mcl-shortcode-editor-header">
                        <h3><?php echo esc_html__('Edit Checklist', 'magic-checklists'); ?></h3>
                        <button type="button" class="mcl-shortcode-editor-close">&times;</button>
                    </div>
                    <div class="mcl-shortcode-editor-body">
                        <ul class="mcl-shortcode-editor-items"></ul>
                        <button type="button" class="mcl-shortcode-add-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <?php echo esc_html__('Add Item', 'magic-checklists'); ?>
                        </button>
                    </div>
                    <div class="mcl-shortcode-editor-footer">
                        <button type="button" class="mcl-shortcode-editor-cancel">
                            <?php echo esc_html__('Cancel', 'magic-checklists'); ?>
                        </button>
                        <button type="button" class="mcl-shortcode-editor-save">
                            <?php echo esc_html__('Save Changes', 'magic-checklists'); ?>
                        </button>
                    </div>
                </div>
            </div>
            <?php endif; ?>
        </div>
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