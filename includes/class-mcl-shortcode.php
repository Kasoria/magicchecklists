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
        wp_register_style(
            'mcl-shortcode-style',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-shortcode.css',
            array(),
            MAGIC_CHECKLISTS_VERSION
        );

        wp_register_script(
            'mcl-shortcode',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/mcl-shortcode.js',
            array('sortablejs'),
            MAGIC_CHECKLISTS_VERSION,
            true
        );

        // Localize script
        wp_localize_script('mcl-shortcode', 'mclShortcode', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mcl_shortcode_nonce'),
            'i18n' => array(
                'errorLoading' => __('Error loading checklist', 'magic-checklists'),
                'errorSaving' => __('Error saving state', 'magic-checklists')
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
    
        // Enqueue required assets
        wp_enqueue_style('mcl-shortcode-style');
        wp_enqueue_script('mcl-shortcode');
    
        // Get settings and items
        $settings = MCL_Admin::get_shortcode_settings($checklist_id);
        $items = get_post_meta($checklist_id, '_mcl_items', true) ?: array();
        
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
             data-check-state="<?php echo esc_attr($settings['check_state'] ?? 'session'); ?>">
    
            <?php if (!empty($settings['show_title'])): ?>
                <h3 class="mcl-shortcode-title">
                    <?php echo esc_html($checklist->post_title); ?>
                </h3>
            <?php endif; ?>
    
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
                        <label class="mcl-item-label">
                            <input type="checkbox"
                                class="mcl-item-checkbox"
                                <?php checked(in_array($item['id'], $checked_state)); ?>>

                            <?php if (!empty($settings['show_numbers'])): ?>
                                <span class="mcl-item-number"><?php echo esc_html($index + 1); ?>.</span>
                            <?php endif; ?>

                            <?php if (!empty($settings['show_priority']) && !empty($item['priority']) && $item['priority'] !== 'none'): ?>
                                <span class="mcl-item-priority mcl-priority-<?php echo esc_attr($item['priority']); ?>"></span>
                            <?php endif; ?>

                            <span class="mcl-item-content">
                                <?php echo wp_kses_post($item['content']); ?>
                            </span>
                        </label>

                        <?php if (!empty($settings['enable_reorder'])): ?>
                            <span class="mcl-item-drag-handle">☰</span>
                        <?php endif; ?>
                    </li>
                <?php endforeach; ?>
            </ul>
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