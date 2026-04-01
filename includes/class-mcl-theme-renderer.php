<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

/**
 * Class MAGICCL_Theme_Renderer
 * Handles generation of custom CSS for checklist themes
 */
class MAGICCL_Theme_Renderer {

    /**
     * Generate custom CSS for a checklist
     *
     * @param int $checklist_id The ID of the checklist
     * @return string The CSS to be added to the page
     */
    public function generate_custom_theme_css($checklist_id) {
        $settings = array(
            'drawer_bg_color' => get_post_meta($checklist_id, '_magiccl_drawer_bg_color', true) ?: '#ffffff',
            'list_item_bg_color' => get_post_meta($checklist_id, '_magiccl_list_item_bg_color', true) ?: '#f8f9fa',
            'text_color' => get_post_meta($checklist_id, '_magiccl_text_color', true) ?: '#1a1a1a',
            'heading_font_size' => get_post_meta($checklist_id, '_magiccl_heading_font_size', true) ?: '24',
            'description_text_color' => get_post_meta($checklist_id, '_magiccl_description_text_color', true) ?: '#1a1a1a',
            'description_font_size' => get_post_meta($checklist_id, '_magiccl_description_font_size', true) ?: '16',
            'list_item_font_size' => get_post_meta($checklist_id, '_magiccl_list_item_font_size', true) ?: '16',
            'primary_button_bg' => get_post_meta($checklist_id, '_magiccl_primary_button_bg', true) ?: '#f2da22',
            'primary_button_text_color' => get_post_meta($checklist_id, '_magiccl_primary_button_text_color', true) ?: '#1a1a1a',
            'secondary_button_bg' => get_post_meta($checklist_id, '_magiccl_secondary_button_bg', true) ?: '#f8f9fa',
            'secondary_button_text_color' => get_post_meta($checklist_id, '_magiccl_secondary_button_text_color', true) ?: '#1a1a1a',
            'drawer_width' => get_post_meta($checklist_id, '_magiccl_drawer_width', true) ?: '600',
            'drawer_height' => get_post_meta($checklist_id, '_magiccl_drawer_height', true) ?: '600',
            'float_button_bg' => get_post_meta($checklist_id, '_magiccl_float_button_bg', true) ?: '#ffffff',
            'float_button_text_color' => get_post_meta($checklist_id, '_magiccl_float_button_text_color', true) ?: '#1a1a1a',
            'float_button_font_size' => get_post_meta($checklist_id, '_magiccl_float_button_font_size', true) ?: '16',
            'show_float_button_icon' => get_post_meta($checklist_id, '_magiccl_show_float_button_icon', true) === '1',
            'drawer_border_radius' => ($value = get_post_meta($checklist_id, '_magiccl_drawer_border_radius', true)) !== '' ? $value : '20',
            'checkbox_bg_color' => get_post_meta($checklist_id, '_magiccl_checkbox_bg_color', true) ?: '#ffffff',
            'checkbox_border_radius' => get_post_meta($checklist_id, '_magiccl_checkbox_border_radius', true) ?: '4',
            'checkbox_style' => get_post_meta($checklist_id, '_magiccl_checkbox_style', true) ?: 'standard',
            'checkbox_custom_icon' => get_post_meta($checklist_id, '_magiccl_checkbox_custom_icon', true),
            'checkbox_checkmark_color' => get_post_meta($checklist_id, '_magiccl_checkbox_checkmark_color', true) ?: '#ffffff',
        );
    
        ob_start();
        ?>
        /* Custom theme styles for checklist <?php echo esc_html($checklist_id); ?> */
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom {
            max-width: <?php echo esc_html($settings['drawer_width']); ?>px;
        }
    
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-drawer-content {
            background-color: <?php echo esc_html($settings['drawer_bg_color']); ?>;
            color: <?php echo esc_html($settings['text_color']); ?>;
            max-height: <?php echo esc_html($settings['drawer_height']); ?>px;
        }
    
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-drawer-title {
            font-size: <?php echo esc_html($settings['heading_font_size']); ?>px;
            color: <?php echo esc_html($settings['text_color']); ?> !important;
        }
    
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-items-list li {
            background-color: <?php echo esc_html($settings['list_item_bg_color']); ?>;
        }
    
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-items-list li .magiccl-item-content {
            font-size: <?php echo esc_html($settings['list_item_font_size']); ?>px;
            color: <?php echo esc_html($settings['text_color']); ?>;
        }
    
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-items-list li .magiccl-item-content * {
            color: inherit;
        }
    
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-drawer-button-primary {
            background-color: <?php echo esc_html($settings['primary_button_bg']); ?>;
            color: <?php echo esc_html($settings['primary_button_text_color']); ?>;
        }

        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-drawer-button-primary:hover {
            background-color: <?php echo esc_html($settings['primary_button_bg']); ?>;
            opacity: 0.9;
        }

        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-drawer-button-primary svg path {
            stroke: <?php echo esc_html($settings['primary_button_text_color']); ?>;
        }
    
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-drawer-button-secondary {
            background-color: <?php echo esc_html($settings['secondary_button_bg']); ?>;
            color: <?php echo esc_html($settings['secondary_button_text_color']); ?>;
        }

        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-drawer-button-secondary:hover {
            background-color: <?php echo esc_html($settings['secondary_button_bg']); ?>;
            opacity: 0.9;
        }

        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-drawer-button-secondary svg path {
            fill: <?php echo esc_html($settings['secondary_button_text_color']); ?>;
        }
    
        .magiccl-floating-button[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom {
            background-color: <?php echo esc_html($settings['float_button_bg']); ?>;
            color: <?php echo esc_html($settings['float_button_text_color']); ?>;
        }

        <?php if (!$settings['show_float_button_icon']) : ?>
        .magiccl-floating-button[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-floating-button-head {
            display: none;
        }
        <?php else: ?>
        .magiccl-floating-button[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-floating-button-svg path {
            fill: <?php echo esc_html($settings['float_button_text_color']); ?>;
        }
        <?php endif; ?>
    
        .magiccl-floating-button[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-floating-button-text {
            font-size: <?php echo esc_html($settings['float_button_font_size']); ?>px;
        }

        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom {
            border-radius: <?php echo esc_html($settings['drawer_border_radius']); ?>px <?php echo esc_html($settings['drawer_border_radius']); ?>px 0 0;
        }

        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom input[type="checkbox"].magiccl-item-checkbox {
            background-color: <?php echo esc_html($settings['checkbox_bg_color']); ?> !important;
            border-radius: <?php echo esc_html($settings['checkbox_border_radius']); ?>px !important;
            border: 2px solid <?php echo esc_html($settings['checkbox_bg_color']); ?> !important;
            width: 20px !important;
            height: 20px !important;
        }

        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom input[type="checkbox"].magiccl-item-checkbox:checked {
            background-color: <?php echo esc_html($settings['checkbox_bg_color']); ?> !important;
            border-color: <?php echo esc_html($settings['checkbox_bg_color']); ?> !important;
        }

        <?php if ($settings['checkbox_style'] === 'custom' && $settings['checkbox_custom_icon']) : ?>
            #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom input[type="checkbox"].magiccl-item-checkbox:checked::before {
                content: url("<?php echo esc_url($settings['checkbox_custom_icon']); ?>") !important;
            }
        <?php else : ?>
            #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom input[type="checkbox"].magiccl-item-checkbox:checked::before {
                content: url("data:image/svg+xml;utf8,<svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path fill-rule='evenodd' clip-rule='evenodd' d='M8.72123 18.1441C8.36923 18.1441 8.04323 17.9591 7.86223 17.6561C6.94423 16.1161 5.76323 14.7311 4.35423 13.5401C3.93223 13.1831 3.88023 12.5521 4.23623 12.1301C4.59323 11.7071 5.22323 11.6551 5.64523 12.0121C6.78923 12.9791 7.80023 14.0621 8.66223 15.2441C10.2992 12.5971 13.5172 8.40012 18.5642 5.95512C19.0612 5.71612 19.6592 5.92112 19.9002 6.41912C20.1402 6.91612 19.9332 7.51412 19.4362 7.75512C13.8602 10.4561 10.7022 15.5491 9.60423 17.6141C9.43423 17.9321 9.10623 18.1351 8.74523 18.1441H8.72123Z' fill='<?php echo esc_attr(str_replace('#', '%23', $settings['checkbox_checkmark_color'])); ?>'/></svg>") !important;
            }
        <?php endif; ?>

        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-public-description {
            font-size: <?php echo esc_html($settings['description_font_size']); ?>px;
            color: <?php echo esc_html($settings['description_text_color']); ?>;
        }
    
        /* Additional text color rules for comprehensive coverage */
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom,
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom * {
            color: <?php echo esc_html($settings['text_color']); ?>;
        }

        /* Ensure buttons maintain their own text colors */
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-drawer-button-primary,
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-drawer-button-primary * {
            color: <?php echo esc_html($settings['primary_button_text_color']); ?> !important;
        }

        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-drawer-button-secondary,
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-drawer-button-secondary * {
            color: <?php echo esc_html($settings['secondary_button_text_color']); ?> !important;
        }

        /* Description text color override */
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-public-description,
        #magiccl-drawer[data-checklist-id="<?php echo esc_attr($checklist_id); ?>"].magiccl-theme-custom .magiccl-public-description * {
            color: <?php echo esc_html($settings['description_text_color']); ?> !important;
        }
    
        <?php
        return ob_get_clean();
    }
}
