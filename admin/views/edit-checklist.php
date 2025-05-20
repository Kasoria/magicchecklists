<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$checklist_id = isset( $_GET['checklist_id'] ) ? intval( $_GET['checklist_id'] ) : 0;
$prefill_items = isset( $_GET['prefill_items'] ) ? true : false;
$checklist = null;

$all_pages = $this->get_registered_admin_pages();
$grouped_pages = $this->group_admin_pages($all_pages);
$allowed_pages = get_post_meta($checklist_id, '_mcl_allowed_pages', true) ?: array();
$notification_settings = null;
if ( $checklist_id ) {
    $checklist = get_post( $checklist_id );
    $time_date = get_post_meta( $checklist_id, '_mcl_time_date', true );
    if ( ! empty( $time_date ) && is_numeric( $time_date ) ) {
        $time_date_formatted = date( 'Y-m-d\TH:i', intval( $time_date ) );
    } else {
        $time_date_formatted = '';
    }
    $items = get_post_meta( $checklist_id, '_mcl_items', true );
    $keyboard_shortcut = get_post_meta( $checklist_id, '_mcl_keyboard_shortcut', true );
    $active = get_post_meta( $checklist_id, '_mcl_active', true );
    $checked_state_handling = get_post_meta( $checklist_id, '_mcl_checked_state_handling', true );
    if ( ! $checked_state_handling ) {
        $checked_state_handling = 'global'; // Default value
    }
    $theme = get_post_meta( $checklist_id, '_mcl_theme', true );
    if ( ! $theme ) {
        $theme = 'light';
    }
    $access_roles = get_post_meta( $checklist_id, '_mcl_access_roles', true ) ?: array();
    $access_roles_permission = get_post_meta( $checklist_id, '_mcl_access_roles_permission', true ) ?: 'interact';
    $access_users = get_post_meta( $checklist_id, '_mcl_access_users', true ) ?: array();
    $access_users_permission = get_post_meta( $checklist_id, '_mcl_access_users_permission', true ) ?: 'interact';
    $public_permission = get_post_meta($checklist_id, '_mcl_public_permission', true) ?: 'interact';
    $notification_manager = MCL_Notification_Manager::get_instance();
    $notification_settings = $notification_manager->get_notification_settings($checklist_id);

} else {
    $time_date = '';
    $items = array();
    $keyboard_shortcut = '';
    $active = 0;
    $checked_state_handling = 'global';
    $theme = 'light';
    $access_roles = array();
    $access_roles_permission = 'interact';
    $access_users = array();
    $access_users_permission = 'interact';
    $public_permission = 'interact';
    
    if ( $prefill_items ) {
        $user_id = get_current_user_id();
        $transient_key = 'mcl_prefilled_items_' . $user_id;
        $prefilled_items = get_transient( $transient_key );
        if ( $prefilled_items ) {
            $items = $prefilled_items;
            delete_transient( $transient_key );
        }
    }
}
?>
<div class="mcl-wrap">
    <div class="mcl-header">
        <div class="mcl-title-wrapper">
            <h1 class="mcl-title">
                <?php echo $checklist_id ? esc_html__('Edit Checklist', 'magic-checklists') : esc_html__('Add New Checklist', 'magic-checklists'); ?>
            </h1>
            <div class="mcl-actions">
                <a href="<?php echo admin_url('admin.php?page=mcl_checklists'); ?>" class="mcl-button mcl-button-secondary">
                    <span class="dashicons dashicons-arrow-left-alt"></span>
                    <?php esc_html_e('Back to Checklists', 'magic-checklists'); ?>
                </a>

            </div>
        </div>
        <div class="mcl-intro">
            <p class="mcl-description mcl-description-light">
                <?php esc_html_e('Configure your checklist settings below. You can add and manage list items at any time. Find them below the settings section.', 'magic-checklists'); ?>
            </p>
            <button type="submit" class="mcl-button mcl-button-primary mcl-submit-form">
                <?php echo $checklist_id ? esc_html__('Update Checklist', 'magic-checklists') : esc_html__('Create Checklist', 'magic-checklists'); ?>
            </button>
        </div>
    </div>

    <!-- Progress Tracker -->
    <div class="mcl-progress-wrapper">
                    <div   class="mcl-progress-tracker">
                        <div class="mcl-progress-line">
                            <div class="mcl-progress-line-fill" style="width: 0%"></div>
                        </div>
                        <div class="mcl-step-indicator active" data-step="1">
                            <div class="mcl-step-dot">1</div>
                            <div class="mcl-step-label"><?php esc_html_e('Basic Settings', 'magic-checklists'); ?></div>
                        </div>
                        <div class="mcl-step-indicator" data-step="2">
                            <div class="mcl-step-dot">2</div>
                            <div class="mcl-step-label"><?php esc_html_e('Advanced Settings', 'magic-checklists'); ?></div>
                        </div>
                        <div class="mcl-step-indicator" data-step="3">
                            <div class="mcl-step-dot">3</div>
                            <div class="mcl-step-label"><?php esc_html_e('Access Control', 'magic-checklists'); ?></div>
                        </div>
                        <div class="mcl-step-indicator" data-step="4">
                            <div class="mcl-step-dot">4</div>
                            <div class="mcl-step-label"><?php esc_html_e('Notifications', 'magic-checklists'); ?></div>
                        </div>
                    </div>
                </div>

    <div class="mcl-content">
        <!-- Settings Form Section -->
        <div class="mcl-settings-container">
            <form method="post"
            action="<?php echo admin_url('admin-post.php'); ?>"
            class="mcl-form"
            id="mcl-checklist-form">
            <?php wp_nonce_field('mcl_save_checklist', 'mcl_nonce'); ?>
            <div class="mcl-settings-wrapper">
            <input type="hidden" name="action" value="save_checklist">
            <input type="hidden" name="checklist_id" value="<?php echo esc_attr($checklist_id); ?>">

                

                <!-- Step 1: Basic Settings -->
                <div class="mcl-step active" data-step="1">
                    <div class="mcl-form-section">
                        <div class="mcl-form-group">
                            <label for="mcl_title" class="mcl-label"><?php esc_html_e('Title', 'magic-checklists'); ?> <span class="required">*</span></label>
                            <input 
                                name="title" 
                                type="text" 
                                id="mcl_title" 
                                value="<?php echo esc_attr($checklist ? $checklist->post_title : ''); ?>" 
                                class="mcl-input" 
                                required
                            >
                        </div>

                        <div class="mcl-form-group">
                            <label for="mcl_description" class="mcl-label"><?php esc_html_e('Description', 'magic-checklists'); ?></label>
                            <textarea 
                                name="description" 
                                id="mcl_description" 
                                class="mcl-textarea"
                            ><?php echo esc_textarea($checklist ? $checklist->post_content : ''); ?></textarea>
                            <div class="mcl-toggle-wrapper">
                                <div class="mcl-toggle-switch">
                                    <input type="checkbox" 
                                        name="show_description" 
                                        id="mcl_show_description" 
                                        value="1" 
                                        <?php checked(get_post_meta($checklist_id, '_mcl_show_description', true), 1); ?>>
                                    <label for="mcl_show_description" class="mcl-switch-label"></label>
                                </div>
                                <p class="mcl-description mcl-light">
                                    <?php esc_html_e('Show description in drawer', 'magic-checklists'); ?>
                                </p>
                            </div>
                        </div>

                        <div class="mcl-form-group mcl-form-outer-wrapper">
                            <div class="mcl-form-inner-wrapper">
                                <label for="mcl_active" class="mcl-label mcl-label-dark"><?php esc_html_e('Active Status', 'magic-checklists'); ?></label>
                                <div class="mcl-toggle-wrapper">
                                    <div class="mcl-toggle-switch">
                                        <input name="active" type="checkbox" id="mcl_active" value="1" <?php checked($active, 1); ?>>
                                        <label for="mcl_active" class="mcl-switch-label"></label>
                                    </div>
                                    <p class="mcl-description">
                                        <?php esc_html_e('When active, this checklist can be accessed using its keyboard shortcut or floating button.', 'magic-checklists'); ?>
                                    </p>
                                </div>
                            </div>

                            <div class="mcl-form-inner-wrapper">
                                <label for="mcl_theme" class="mcl-label mcl-label-dark"><?php esc_html_e('Drawer Theme', 'magic-checklists'); ?></label>
                                <select name="theme" id="mcl_theme" class="mcl-select">
                                    <option value="light" <?php selected($theme, 'light'); ?>><?php esc_html_e('Light', 'magic-checklists'); ?></option>
                                    <option value="dark" <?php selected($theme, 'dark'); ?>><?php esc_html_e('Dark', 'magic-checklists'); ?></option>
                                    <option value="custom" <?php selected($theme, 'custom'); ?>><?php esc_html_e('Custom Theme', 'magic-checklists'); ?></option>
                                </select>
                                <p class="mcl-description">
                                    <?php esc_html_e('Choose the visual theme for your checklist drawer.', 'magic-checklists'); ?>
                                </p>
                                <div class="mcl-custom-theme-settings" style="display: none;">
                                    <h4 class="mcl-theme-subtitle"><?php esc_html_e('Custom Theme Settings', 'magic-checklists'); ?></h4>
                                    
                                    <!-- Colors Section -->
                                    <div class="mcl-theme-section">
                                        <h5 class="mcl-theme-subtitle"><?php esc_html_e('Colors', 'magic-checklists'); ?></h5>
                                        <div class="mcl-theme-color-options">
                                            <div class="mcl-theme-color-option">
                                                <label for="mcl_drawer_bg_color"><?php esc_html_e('Background Color', 'magic-checklists'); ?></label>
                                                <input type="text" 
                                                    name="drawer_bg_color" 
                                                    id="mcl_drawer_bg_color" 
                                                    value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_drawer_bg_color', true) ?: '#ffffff'); ?>"
                                                    class="mcl-color-picker">
                                            </div>
                                            
                                            <div class="mcl-theme-color-option">
                                                <label for="mcl_list_item_bg_color"><?php esc_html_e('List Item Background', 'magic-checklists'); ?></label>
                                                <input type="text" 
                                                    name="list_item_bg_color" 
                                                    id="mcl_list_item_bg_color" 
                                                    value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_list_item_bg_color', true) ?: '#f8f9fa'); ?>"
                                                    class="mcl-color-picker">
                                            </div>

                                            <div class="mcl-theme-color-option">
                                                <label for="mcl_text_color"><?php esc_html_e('Text Color', 'magic-checklists'); ?></label>
                                                <input type="text" 
                                                    name="text_color" 
                                                    id="mcl_text_color" 
                                                    value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_text_color', true) ?: '#1a1a1a'); ?>"
                                                    class="mcl-color-picker">
                                            </div>

                                            <div class="mcl-theme-color-option">
                                                <label for="mcl_description_text_color"><?php esc_html_e('Description Text', 'magic-checklists'); ?></label>
                                                <input type="text" 
                                                    name="description_text_color" 
                                                    id="mcl_description_text_color" 
                                                    value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_description_text_color', true) ?: '#1a1a1a'); ?>"
                                                    class="mcl-color-picker">
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Typography Section -->
                                    <div class="mcl-theme-section">
                                        <h5 class="mcl-theme-subtitle"><?php esc_html_e('Typography', 'magic-checklists'); ?></h5>
                                        <div class="mcl-typography-options">
                                            <div class="mcl-theme-input-group">
                                                <label for="mcl_heading_font_size"><?php esc_html_e('Heading Size', 'magic-checklists'); ?></label>
                                                <div class="mcl-theme-input-with-unit">
                                                    <input type="number" 
                                                        name="heading_font_size" 
                                                        id="mcl_heading_font_size" 
                                                        value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_heading_font_size', true) ?: '24'); ?>"
                                                        class="mcl-input"
                                                        min="1"
                                                        max="50">
                                                    <span class="mcl-theme-input-suffix">px</span>
                                                </div>
                                            </div>

                                            <div class="mcl-theme-input-group">
                                                <label for="mcl_description_font_size"><?php esc_html_e('Description Size', 'magic-checklists'); ?></label>
                                                <div class="mcl-theme-input-with-unit">
                                                    <input type="number" 
                                                        name="description_font_size" 
                                                        id="mcl_description_font_size" 
                                                        value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_description_font_size', true) ?: '16'); ?>"
                                                        class="mcl-input"
                                                        min="1"
                                                        max="50">
                                                    <span class="mcl-theme-input-suffix">px</span>
                                                </div>
                                            </div>

                                            <div class="mcl-theme-input-group">
                                                <label for="mcl_list_item_font_size"><?php esc_html_e('List Item Size', 'magic-checklists'); ?></label>
                                                <div class="mcl-theme-input-with-unit">
                                                    <input type="number" 
                                                        name="list_item_font_size" 
                                                        id="mcl_list_item_font_size" 
                                                        value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_list_item_font_size', true) ?: '16'); ?>"
                                                        class="mcl-input"
                                                        min="1"
                                                        max="50">
                                                    <span class="mcl-theme-input-suffix">px</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Button Colors Section -->
                                    <div class="mcl-theme-section">
                                        <h5 class="mcl-theme-subtitle"><?php esc_html_e('Button Colors', 'magic-checklists'); ?></h5>
                                        <div class="mcl-button-settings">
                                            <div class="mcl-theme-color-option">
                                                <label for="mcl_primary_button_bg"><?php esc_html_e('Primary Button Background', 'magic-checklists'); ?></label>
                                                <input type="text" 
                                                    name="primary_button_bg" 
                                                    id="mcl_primary_button_bg" 
                                                    value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_primary_button_bg', true) ?: '#f2da22'); ?>"
                                                    class="mcl-color-picker">
                                            </div>

                                            <div class="mcl-theme-color-option">
                                                <label for="mcl_primary_button_text_color"><?php esc_html_e('Primary Button Text', 'magic-checklists'); ?></label>
                                                <input type="text" 
                                                    name="primary_button_text_color" 
                                                    id="mcl_primary_button_text_color" 
                                                    value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_primary_button_text_color', true) ?: '#1a1a1a'); ?>"
                                                    class="mcl-color-picker">
                                            </div>

                                            <div class="mcl-theme-color-option">
                                                <label for="mcl_secondary_button_bg"><?php esc_html_e('Secondary Button Background', 'magic-checklists'); ?></label>
                                                <input type="text" 
                                                    name="secondary_button_bg" 
                                                    id="mcl_secondary_button_bg" 
                                                    value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_secondary_button_bg', true) ?: '#f8f9fa'); ?>"
                                                    class="mcl-color-picker">
                                            </div>

                                            <div class="mcl-theme-color-option">
                                                <label for="mcl_secondary_button_text_color"><?php esc_html_e('Secondary Button Text', 'magic-checklists'); ?></label>
                                                <input type="text" 
                                                    name="secondary_button_text_color" 
                                                    id="mcl_secondary_button_text_color" 
                                                    value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_secondary_button_text_color', true) ?: '#1a1a1a'); ?>"
                                                    class="mcl-color-picker">
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Checkbox Style Section -->
                                    <div class="mcl-theme-section">
                                        <h5 class="mcl-theme-subtitle"><?php esc_html_e('Checkbox Style', 'magic-checklists'); ?></h5>
                                        <div class="mcl-checkbox-settings">
                                            <div class="mcl-theme-color-option">
                                                <label for="mcl_checkbox_bg_color"><?php esc_html_e('Background Color', 'magic-checklists'); ?></label>
                                                <input type="text" 
                                                    name="checkbox_bg_color" 
                                                    id="mcl_checkbox_bg_color" 
                                                    value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_checkbox_bg_color', true) ?: '#ffffff'); ?>"
                                                    class="mcl-color-picker">
                                            </div>

                                            <div class="mcl-theme-input-group">
                                                <label for="mcl_checkbox_border_radius"><?php esc_html_e('Border Radius', 'magic-checklists'); ?></label>
                                                <div class="mcl-theme-input-with-unit">
                                                    <input type="number" 
                                                        name="checkbox_border_radius" 
                                                        id="mcl_checkbox_border_radius" 
                                                        value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_checkbox_border_radius', true) ?: '4'); ?>"
                                                        class="mcl-input"
                                                        min="0"
                                                        max="12">
                                                    <span class="mcl-theme-input-suffix">px</span>
                                                </div>
                                            </div>

                                            <div class="mcl-theme-input-group">
                                                <label for="mcl_checkbox_style"><?php esc_html_e('Checkmark Style', 'magic-checklists'); ?></label>
                                                <select name="checkbox_style" id="mcl_checkbox_style" class="mcl-select">
                                                    <option value="standard" <?php selected(get_post_meta($checklist_id, '_mcl_checkbox_style', true), 'standard'); ?>>
                                                        <?php esc_html_e('Standard', 'magic-checklists'); ?>
                                                    </option>
                                                    <option value="custom" <?php selected(get_post_meta($checklist_id, '_mcl_checkbox_style', true), 'custom'); ?>>
                                                        <?php esc_html_e('Custom Image', 'magic-checklists'); ?>
                                                    </option>
                                                </select>
                                            </div>

                                            <div class="mcl-custom-checkbox-settings" style="display: <?php echo get_post_meta($checklist_id, '_mcl_checkbox_style', true) === 'custom' ? 'block' : 'none'; ?>;">
                                                <div class="mcl-media-upload">
                                                    <input type="hidden" 
                                                        name="checkbox_custom_icon" 
                                                        id="mcl_checkbox_custom_icon" 
                                                        value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_checkbox_custom_icon', true)); ?>">
                                                    <div class="mcl-media-preview">
                                                        <?php 
                                                        $icon_url = get_post_meta($checklist_id, '_mcl_checkbox_custom_icon', true);
                                                        if ($icon_url) {
                                                            echo '<img src="' . esc_url($icon_url) . '" alt="Custom checkmark">';
                                                        }
                                                        ?>
                                                    </div>
                                                    <button type="button" class="mcl-button mcl-button-secondary mcl-media-upload-btn">
                                                        <?php esc_html_e('Select Image', 'magic-checklists'); ?>
                                                    </button>
                                                    <button type="button" class="mcl-button mcl-button-secondary mcl-media-remove-btn" <?php echo !$icon_url ? 'style="display:none;"' : ''; ?>>
                                                        <?php esc_html_e('Remove', 'magic-checklists'); ?>
                                                    </button>
                                                </div>
                                            </div>

                                            <div class="mcl-standard-checkbox-settings" style="display: <?php echo get_post_meta($checklist_id, '_mcl_checkbox_style', true) !== 'custom' ? 'block' : 'none'; ?>;">
                                                <div class="mcl-theme-color-option">
                                                    <label for="mcl_checkbox_checkmark_color"><?php esc_html_e('Checkmark Color', 'magic-checklists'); ?></label>
                                                    <input type="text" 
                                                        name="checkbox_checkmark_color" 
                                                        id="mcl_checkbox_checkmark_color" 
                                                        value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_checkbox_checkmark_color', true) ?: '#ffffff'); ?>"
                                                        class="mcl-color-picker">
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Drawer Style Section -->
                                    <div class="mcl-theme-section">
                                        <h5 class="mcl-theme-subtitle"><?php esc_html_e('Drawer Style', 'magic-checklists'); ?></h5>
                                        <div class="mcl-drawer-style-options">
                                            <div class="mcl-theme-input-group">
                                                <label for="mcl_drawer_border_radius"><?php esc_html_e('Border Radius', 'magic-checklists'); ?></label>
                                                <div class="mcl-theme-input-with-unit">
                                                    <input type="number" 
                                                        name="drawer_border_radius" 
                                                        id="mcl_drawer_border_radius" 
                                                        value="<?php echo esc_attr(($value = get_post_meta($checklist_id, '_mcl_drawer_border_radius', true)) !== '' ? $value : '20'); ?>"
                                                        class="mcl-input"
                                                        min="0"
                                                        max="50">
                                                    <span class="mcl-theme-input-suffix">px</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Dimensions Section -->
                                    <div class="mcl-theme-section">
                                        <h5 class="mcl-theme-subtitle"><?php esc_html_e('Dimensions', 'magic-checklists'); ?></h5>
                                        <div class="mcl-dimensions-options">
                                            <div class="mcl-theme-input-group">
                                                <label for="mcl_drawer_width"><?php esc_html_e('Drawer Width', 'magic-checklists'); ?></label>
                                                <div class="mcl-theme-input-with-unit">
                                                    <input type="number" 
                                                        name="drawer_width" 
                                                        id="mcl_drawer_width" 
                                                        value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_drawer_width', true) ?: '600'); ?>"
                                                        class="mcl-input"
                                                        min="400"
                                                        max="2000">
                                                    <span class="mcl-theme-input-suffix">px</span>
                                                </div>
                                            </div>

                                            <div class="mcl-theme-input-group">
                                                <label for="mcl_drawer_height"><?php esc_html_e('Drawer Height', 'magic-checklists'); ?></label>
                                                <div class="mcl-theme-input-with-unit">
                                                    <input type="number" 
                                                        name="drawer_height" 
                                                        id="mcl_drawer_height" 
                                                        value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_drawer_height', true) ?: '600'); ?>"
                                                        class="mcl-input"
                                                        min="350"
                                                        max="2000">
                                                    <span class="mcl-theme-input-suffix">px</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Floating Button Section -->
                                    <div class="mcl-theme-section">
                                        <h5 class="mcl-theme-subtitle"><?php esc_html_e('Floating Button Settings', 'magic-checklists'); ?></h5>
                                        <div class="mcl-float-button-options">
                                            <div class="mcl-theme-color-option">
                                                <label for="mcl_float_button_bg"><?php esc_html_e('Background Color', 'magic-checklists'); ?></label>
                                                <input type="text" 
                                                    name="float_button_bg" 
                                                    id="mcl_float_button_bg" 
                                                    value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_float_button_bg', true) ?: '#ffffff'); ?>"
                                                    class="mcl-color-picker">
                                            </div>

                                            <div class="mcl-theme-color-option">
                                                <label for="mcl_float_button_text_color"><?php esc_html_e('Text Color', 'magic-checklists'); ?></label>
                                                <input type="text" 
                                                    name="float_button_text_color" 
                                                    id="mcl_float_button_text_color" 
                                                    value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_float_button_text_color', true) ?: '#1a1a1a'); ?>"
                                                    class="mcl-color-picker">
                                            </div>

                                            <div class="mcl-theme-input-group">
                                                <label for="mcl_float_button_font_size"><?php esc_html_e('Text Size', 'magic-checklists'); ?></label>
                                                <div class="mcl-theme-input-with-unit">
                                                    <input type="number" 
                                                        name="float_button_font_size" 
                                                        id="mcl_float_button_font_size" 
                                                        value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_float_button_font_size', true) ?: '16'); ?>"
                                                        class="mcl-input"
                                                        min="12"
                                                        max="24">
                                                    <span class="mcl-theme-input-suffix">px</span>
                                                </div>
                                            </div>

                                            <div class="mcl-checkbox-group">
                                                <label class="mcl-checkbox-label">
                                                    <input type="hidden" name="show_float_button_icon" value="0">
                                                    <input type="checkbox" 
                                                        name="show_float_button_icon" 
                                                        id="mcl_show_float_button_icon" 
                                                        value="1" 
                                                        <?php checked(get_post_meta($checklist_id, '_mcl_show_float_button_icon', true), '1'); ?>>
                                                    <?php esc_html_e('Show Checklist Icon', 'magic-checklists'); ?>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mcl-form-inner-wrapper">
                                <label for="mcl_tags_input" class="mcl-label mcl-label-dark"><?php esc_html_e('Tags', 'magic-checklists'); ?></label>
                                <div class="mcl-tags-container">
                                    <div class="mcl-tags-input-wrapper">
                                        <input type="text" 
                                            id="mcl_tags_input" 
                                            class="mcl-input" 
                                            placeholder="<?php esc_attr_e('Type tag name and press Enter', 'magic-checklists'); ?>">
                                    </div>
                                    <div class="mcl-tags-list" id="mcl_tags_list">
                                        <?php
                                        if ($checklist_id) {
                                            $existing_tags = get_post_meta($checklist_id, '_mcl_tags', true) ?: array();
                                            foreach ($existing_tags as $tag) {
                                                printf(
                                                    '<div class="mcl-tag-item" data-tag="%s">
                                                        <input type="hidden" name="mcl_tags[]" value="%s">
                                                        <input type="hidden" name="mcl_tag_colors[]" value="%s">
                                                        <span class="mcl-tag-text" style="background-color: %s">%s</span>
                                                        <div class="mcl-tag-actions">
                                                            <button type="button" class="mcl-tag-color-picker" title="%s">
                                                                <span class="dashicons dashicons-color-picker"></span>
                                                            </button>
                                                            <button type="button" class="mcl-tag-remove" title="%s">×</button>
                                                        </div>
                                                    </div>',
                                                    esc_attr($tag['name']),
                                                    esc_attr($tag['name']),
                                                    esc_attr($tag['color']),
                                                    esc_attr($tag['color']),
                                                    esc_html($tag['name']),
                                                    esc_attr__('Change color', 'magic-checklists'),
                                                    esc_attr__('Remove tag', 'magic-checklists')
                                                );
                                            }
                                        }
                                        ?>
                                    </div>
                                </div>
                                <p class="mcl-description">
                                    <?php esc_html_e('Add tags to organize your checklist. Press Enter to add a tag, then choose its color.', 'magic-checklists'); ?>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Advanced Settings -->
                <div class="mcl-step" data-step="2">
                    <div class="mcl-form-section">
                        <div class="mcl-form-group mcl-form-outer-wrapper">
                            <div class="mcl-form-inner-wrapper">
                                <label for="mcl_time_date" class="mcl-label mcl-label-dark"><?php esc_html_e('Deadline', 'magic-checklists'); ?></label>
                                <input 
                                    name="time_date" 
                                    type="datetime-local" 
                                    id="mcl_time_date" 
                                    value="<?php echo esc_attr($time_date_formatted); ?>" 
                                    class="mcl-input"
                                >
                                <p class="mcl-description">
                                    <?php esc_html_e('Set an optional deadline for completing this checklist. The countdown will change its background color depending on how much time is left. ', 'magic-checklists'); ?>
                                </p>
                            </div>

                            <div class="mcl-form-inner-wrapper">
                                <label for="mcl_keyboard_shortcut" class="mcl-label mcl-label-dark"><?php esc_html_e('Keyboard Shortcut', 'magic-checklists'); ?></label>
                                <input 
                                    name="keyboard_shortcut" 
                                    type="text" 
                                    id="mcl_keyboard_shortcut" 
                                    value="<?php echo esc_attr($keyboard_shortcut); ?>" 
                                    class="mcl-input" 
                                    readonly
                                >
                                <div id="mcl-shortcut-error" class="mcl-error"></div>
                                <p class="mcl-description">
                                    <?php esc_html_e('Click this field and press your desired key combination.', 'magic-checklists'); ?>
                                </p>
                            </div>
                        
                        
                            <div class="mcl-form-inner-wrapper">
                                <label class="mcl-label mcl-label-dark"><?php esc_html_e('Drawer Trigger Method', 'magic-checklists'); ?></label>
                                <div class="mcl-checkbox-group">
                                    <label class="mcl-checkbox-label">
                                        <input type="checkbox" 
                                            name="trigger_shortcut" 
                                            id="mcl_trigger_shortcut" 
                                            value="1" 
                                            <?php checked(get_post_meta($checklist_id, '_mcl_trigger_shortcut', true), 1); ?>>
                                        <?php esc_html_e('Keyboard Shortcut', 'magic-checklists'); ?>
                                    </label>
                                    
                                    <label class="mcl-checkbox-label">
                                        <input type="checkbox" 
                                            name="trigger_button" 
                                            id="mcl_trigger_button" 
                                            value="1" 
                                            <?php checked(get_post_meta($checklist_id, '_mcl_trigger_button', true), 1); ?>>
                                        <?php esc_html_e('Floating Button', 'magic-checklists'); ?>
                                    </label>
                                </div>
                                    <div class="mcl-floating-button-options" style="display: <?php echo get_post_meta($checklist_id, '_mcl_trigger_button', true) ? 'flex' : 'none'; ?>">
                                    <div class="mcl-form-group">
                                        <label for="mcl_short_title" class="mcl-label mcl-label-dark mcl-label-small"><?php esc_html_e('Floating Button Title', 'magic-checklists'); ?></label>
                                        <input 
                                            type="text" 
                                            name="short_title" 
                                            id="mcl_short_title" 
                                            value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_short_title', true)); ?>" 
                                            class="mcl-input"
                                            maxlength="50"
                                        >

                                        <div class="mcl-form-group">
                                            <label for="mcl_button_position" class="mcl-label mcl-label-dark mcl-label-small">
                                                <?php esc_html_e('Button Position', 'magic-checklists'); ?>
                                            </label>
                                            <select name="button_position" id="mcl_button_position" class="mcl-select">
                                                <?php
                                                $current_position = get_post_meta($checklist_id, '_mcl_button_position', true) ?: 'bottom-right';
                                                $positions = array(
                                                    'bottom-right' => __('Bottom Right', 'magic-checklists'),
                                                    'bottom-left' => __('Bottom Left', 'magic-checklists'),
                                                    'top-right' => __('Top Right', 'magic-checklists'),
                                                    'top-left' => __('Top Left', 'magic-checklists'),
                                                    'draggable' => __('Draggable', 'magic-checklists')
                                                );
                                                foreach ($positions as $value => $label) {
                                                    printf(
                                                        '<option value="%s" %s>%s</option>',
                                                        esc_attr($value),
                                                        selected($current_position, $value, false),
                                                        esc_html($label)
                                                    );
                                                }
                                                ?>
                                            </select>
                                            <p class="mcl-description">
                                                <?php esc_html_e('Select where the floating button should appear on the screen.', 'magic-checklists'); ?>
                                            </p>
                                        </div>
                                        <div class="mcl-form-group">
                                        <label class="mcl-label mcl-label-dark mcl-label-small">
                                                    <?php esc_html_e('Disable floating button when inside pagebuilders', 'magic-checklists'); ?>
                                            </label>
                                            <div class="mcl-toggle-wrapper">
                                                <div class="mcl-toggle-switch">
                                                    <input type="checkbox" 
                                                        name="disable_in_builders" 
                                                        id="mcl_disable_in_builders" 
                                                        value="1" 
                                                        <?php checked(get_post_meta($checklist_id, '_mcl_disable_in_builders', true), 1); ?>>
                                                    <label for="mcl_disable_in_builders" class="mcl-switch-label"></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mcl-form-inner-wrapper">
                                <label for="mcl_checked_state" class="mcl-label mcl-label-dark"><?php esc_html_e('Checked State Handling', 'magic-checklists'); ?></label>
                                <select name="checked_state" id="mcl_checked_state" class="mcl-select">
                                    <option value="per_user" <?php selected($checked_state_handling, 'per_user'); ?>><?php esc_html_e('Per User', 'magic-checklists'); ?></option>
                                    <option value="global" <?php selected($checked_state_handling, 'global'); ?>><?php esc_html_e('Global', 'magic-checklists'); ?></option>
                                </select>
                                <p class="mcl-description">
                                    <?php esc_html_e('"Per User" gives each user their own checked states. "Global" shares checked states among all users.', 'magic-checklists'); ?>
                                </p>
                            </div>
                            <div class="mcl-form-inner-wrapper">
                                <label for="mcl_priority" class="mcl-label mcl-label-dark"><?php esc_html_e( 'Checklist Priority', 'magic-checklists' ); ?></label>
                                <div class="mcl-priority-select">
                                    <select name="priority" id="mcl_priority" class="mcl-select">
                                        <?php
                                        $priority = get_post_meta( $checklist_id, '_mcl_priority', true ) ?: 'none';
                                        $priority_levels = $this->get_priority_levels();
                                        foreach ( $priority_levels as $value => $label ) :
                                            $selected = selected( $priority, $value, false );
                                            $color = $this->get_priority_colors()[$value];
                                        ?>
                                            <option value="<?php echo esc_attr( $value ); ?>" 
                                                    data-color="<?php echo esc_attr( $color ); ?>"
                                                    <?php echo $selected; ?>>
                                                <?php echo esc_html( $label ); ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                    <span class="mcl-priority-indicator" style="background-color: <?php echo esc_attr( $this->get_priority_colors()[$priority] ); ?>"></span>
                            </div>
                        </div>
                        <div class="mcl-form-inner-wrapper">
                            <label for="mcl_auto_reset" class="mcl-label mcl-label-dark">
                                <?php esc_html_e('Auto Reset Schedule', 'magic-checklists'); ?>
                            </label>
                            <div class="mcl-toggle-wrapper">
                                <div class="mcl-toggle-switch">
                                    <input type="checkbox" 
                                        name="auto_reset" 
                                        id="mcl_auto_reset" 
                                        value="1" 
                                        <?php checked(get_post_meta($checklist_id, '_mcl_auto_reset', true), 1); ?>>
                                    <label for="mcl_auto_reset" class="mcl-switch-label"></label>
                                </div>
                            </div>
                            <p class="mcl-description">
                                <?php esc_html_e('Enable automatic reset of checked items on a schedule.', 'magic-checklists'); ?>
                            </p>

                            <div class="mcl-reset-schedule-options" style="display: <?php echo get_post_meta($checklist_id, '_mcl_auto_reset', true) ? 'flex' : 'none'; ?>;">
                                <div class="mcl-form-group">
                                    <label for="mcl_reset_interval" class="mcl-label mcl-label-dark mcl-label-small">
                                        <?php esc_html_e('Reset Interval', 'magic-checklists'); ?>
                                    </label>
                                    <select name="reset_interval" id="mcl_reset_interval" class="mcl-select">
                                        <?php
                                        $current_interval = get_post_meta($checklist_id, '_mcl_reset_interval', true) ?: 'daily';
                                        $intervals = array(
                                            'daily' => __('Daily', 'magic-checklists'),
                                            'weekly' => __('Weekly', 'magic-checklists'),
                                            'monthly' => __('Monthly', 'magic-checklists'),
                                            'custom' => __('Custom', 'magic-checklists')
                                        );
                                        foreach ($intervals as $value => $label) {
                                            printf(
                                                '<option value="%s" %s>%s</option>',
                                                esc_attr($value),
                                                selected($current_interval, $value, false),
                                                esc_html($label)
                                            );
                                        }
                                        ?>
                                    </select>
                                </div>

                                <!-- Weekly options -->
                                <div id="mcl-weekly-options" class="mcl-form-group" style="display: <?php echo $current_interval === 'weekly' ? 'block' : 'none'; ?>;">
                                    <label for="mcl_week_day" class="mcl-label mcl-label-dark mcl-label-small">
                                        <?php esc_html_e('Day of Week', 'magic-checklists'); ?>
                                    </label>
                                    <select name="week_day" id="mcl_week_day" class="mcl-select">
                                        <?php
                                        $current_week_day = get_post_meta($checklist_id, '_mcl_week_day', true) ?: '1';
                                        $weekdays = array(
                                            '1' => __('Monday', 'magic-checklists'),
                                            '2' => __('Tuesday', 'magic-checklists'),
                                            '3' => __('Wednesday', 'magic-checklists'),
                                            '4' => __('Thursday', 'magic-checklists'),
                                            '5' => __('Friday', 'magic-checklists'),
                                            '6' => __('Saturday', 'magic-checklists'),
                                            '7' => __('Sunday', 'magic-checklists')
                                        );
                                        foreach ($weekdays as $value => $label) {
                                            printf(
                                                '<option value="%s" %s>%s</option>',
                                                esc_attr($value),
                                                selected($current_week_day, $value, false),
                                                esc_html($label)
                                            );
                                        }
                                        ?>
                                    </select>
                                </div>

                                <!-- Monthly options -->
                                <div id="mcl-monthly-options" class="mcl-form-group" style="display: <?php echo $current_interval === 'monthly' ? 'block' : 'none'; ?>;">
                                    <label for="mcl_month_day" class="mcl-label mcl-label-dark mcl-label-small">
                                        <?php esc_html_e('Day of Month', 'magic-checklists'); ?>
                                    </label>
                                    <select name="month_day" id="mcl_month_day" class="mcl-select">
                                        <?php
                                        $current_month_day = get_post_meta($checklist_id, '_mcl_month_day', true) ?: '1';
                                        for ($i = 1; $i <= 31; $i++) {
                                            printf(
                                                '<option value="%d" %s>%d</option>',
                                                $i,
                                                selected($current_month_day, $i, false),
                                                $i
                                            );
                                        }
                                        ?>
                                    </select>
                                </div>

                                <!-- Custom interval options -->
                                <div id="mcl-custom-reset-options" class="mcl-form-group" style="display: <?php echo $current_interval === 'custom' ? 'block' : 'none'; ?>;">
                                    <div class="mcl-custom-interval-inputs">
                                        <div class="mcl-input-group">
                                            <label for="mcl_custom_months" class="mcl-label mcl-label-dark mcl-label-small">
                                                <?php esc_html_e('Months', 'magic-checklists'); ?>
                                            </label>
                                            <input 
                                                type="number" 
                                                name="custom_months" 
                                                id="mcl_custom_months" 
                                                class="mcl-input" 
                                                min="0" 
                                                max="12" 
                                                value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_custom_months', true) ?: '0'); ?>"
                                            >
                                        </div>
                                        <div class="mcl-input-group">
                                            <label for="mcl_custom_weeks" class="mcl-label mcl-label-dark mcl-label-small">
                                                <?php esc_html_e('Weeks', 'magic-checklists'); ?>
                                            </label>
                                            <input 
                                                type="number" 
                                                name="custom_weeks" 
                                                id="mcl_custom_weeks" 
                                                class="mcl-input" 
                                                min="0" 
                                                max="52" 
                                                value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_custom_weeks', true) ?: '0'); ?>"
                                            >
                                        </div>
                                        <div class="mcl-input-group">
                                            <label for="mcl_custom_days" class="mcl-label mcl-label-dark mcl-label-small">
                                                <?php esc_html_e('Days', 'magic-checklists'); ?>
                                            </label>
                                            <input 
                                                type="number" 
                                                name="custom_days" 
                                                id="mcl_custom_days" 
                                                class="mcl-input" 
                                                min="0" 
                                                max="31" 
                                                value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_custom_days', true) ?: '0'); ?>"
                                            >
                                        </div>
                                    </div>
                                </div>

                                <!-- Reset time (always visible) -->
                                <div class="mcl-form-group">
                                    <label for="mcl_reset_time" class="mcl-label mcl-label-dark mcl-label-small">
                                        <?php esc_html_e('Reset Time', 'magic-checklists'); ?>
                                    </label>
                                    <input 
                                        type="time" 
                                        name="reset_time" 
                                        id="mcl_reset_time" 
                                        class="mcl-input" 
                                        value="<?php echo esc_attr(get_post_meta($checklist_id, '_mcl_reset_time', true) ?: '00:00'); ?>"
                                    >
                                </div>
                            </div>
                        </div>
                        </div>
                        
                        <!-- Item Locking Setting -->
                        <div class="mcl-form-inner-wrapper">
                            <label for="mcl_enable_item_locking" class="mcl-label mcl-label-dark">
                                <?php esc_html_e('Enable Item Locking', 'magic-checklists'); ?>
                            </label>
                            <div class="mcl-toggle-wrapper">
                                <div class="mcl-toggle-switch">
                                    <input name="enable_item_locking" type="checkbox" id="mcl_enable_item_locking" value="1" <?php checked(get_post_meta($checklist_id, '_mcl_enable_item_locking', true), 1); ?> >
                                    <label for="mcl_enable_item_locking" class="mcl-switch-label"></label>
                                </div>
                            </div>
                            <p class="mcl-description">
                                <?php esc_html_e('Enable locking of individual items to prevent editing.', 'magic-checklists'); ?>
                            </p>
                        </div>
                        
                        <div class="mcl-form-inner-wrapper">
    <label for="mcl_enable_shortcode" class="mcl-label mcl-label-dark">
        <?php esc_html_e('Enable Shortcode', 'magic-checklists'); ?>
    </label>
    <div class="mcl-toggle-wrapper">
        <div class="mcl-toggle-switch">
            <input type="checkbox" 
                name="enable_shortcode" 
                id="mcl_enable_shortcode" 
                value="1" 
                <?php checked(get_post_meta($checklist_id, '_mcl_enable_shortcode', true), 1); ?>>
            <label for="mcl_enable_shortcode" class="mcl-switch-label"></label>
        </div>
        <p class="mcl-description">
            <?php esc_html_e('Enable this to use this checklist as a shortcode in your content.', 'magic-checklists'); ?>
        </p>
    </div>

    <div class="mcl-shortcode-options" style="display: <?php echo get_post_meta($checklist_id, '_mcl_enable_shortcode', true) ? 'block' : 'none'; ?>;">

        <!-- Shortcode Preview -->
        <div class="mcl-shortcode-preview">
            <label class="mcl-label mcl-label-dark mcl-label-small">
                <?php esc_html_e('Shortcode', 'magic-checklists'); ?>
            </label>
            <div class="mcl-shortcode-code">
                <code>[magic_checklist id="<?php echo esc_attr($checklist_id); ?>"]</code>
                <button type="button" class="mcl-copy-shortcode mcl-button mcl-button-secondary">
                    <?php esc_html_e('Copy', 'magic-checklists'); ?>
                </button>
            </div>
        </div>

        <!-- Group 1: Display Options -->
        <div class="mcl-shortcode-section">
            <h4 class="mcl-settings-subtitle"><?php esc_html_e('Display Options', 'magic-checklists'); ?></h4>
            <div class="mcl-checkbox-group">
                <label class="mcl-checkbox-label">
                    <input type="checkbox" 
                        name="shortcode_show_title" 
                        value="1" 
                        <?php checked(MCL_Admin::get_shortcode_setting($checklist_id, 'show_title'), 1); ?>>
                    <?php esc_html_e('Show Title', 'magic-checklists'); ?>
                </label>

                <label class="mcl-checkbox-label">
                    <input type="checkbox" 
                        name="shortcode_show_description" 
                        value="1" 
                        <?php checked(MCL_Admin::get_shortcode_setting($checklist_id, 'show_description'), 1); ?>>
                    <?php esc_html_e('Show Description', 'magic-checklists'); ?>
                </label>

                <label class="mcl-checkbox-label">
                    <input type="checkbox" 
                        name="shortcode_show_deadline" 
                        value="1" 
                        <?php checked(MCL_Admin::get_shortcode_setting($checklist_id, 'show_deadline'), 1); ?>>
                    <?php esc_html_e('Show Deadline', 'magic-checklists'); ?>
                </label>

                <label class="mcl-checkbox-label">
                    <input type="checkbox" 
                        name="shortcode_show_priority" 
                        value="1" 
                        <?php checked(MCL_Admin::get_shortcode_setting($checklist_id, 'show_priority'), 1); ?>>
                    <?php esc_html_e('Show Priority Indicators', 'magic-checklists'); ?>
                </label>

                <label class="mcl-checkbox-label">
                    <input type="checkbox" 
                        name="shortcode_show_numbers" 
                        value="1" 
                        <?php checked(MCL_Admin::get_shortcode_setting($checklist_id, 'show_numbers'), 1); ?>>
                    <?php esc_html_e('Show Item Numbers', 'magic-checklists'); ?>
                </label>
            </div>
        </div>

        <!-- Group 2: Style Options Part 1 - Colors -->
        <div class="mcl-shortcode-section">
            <h4 class="mcl-settings-subtitle"><?php esc_html_e('Style Options - Colors', 'magic-checklists'); ?></h4>
            <div class="mcl-form-group">
                <div class="mcl-color-options">
                    <div class="mcl-color-option">
                        <label for="mcl_shortcode_title_text_color"><?php esc_html_e('Title Text Color', 'magic-checklists'); ?></label>
                        <input type="text" 
                            name="shortcode_title_text_color" 
                            id="mcl_shortcode_title_text_color" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'title_text_color', '#000000')); ?>"
                            class="mcl-color-picker">
                    </div>

                    <div class="mcl-color-option">
                        <label for="mcl_shortcode_description_text_color"><?php esc_html_e('Description Text Color', 'magic-checklists'); ?></label>
                        <input type="text" 
                            name="shortcode_description_text_color" 
                            id="mcl_shortcode_description_text_color" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'description_text_color', '#333333')); ?>"
                            class="mcl-color-picker">
                    </div>

                    <div class="mcl-color-option">
                        <label for="mcl_shortcode_deadline_text_color"><?php esc_html_e('Deadline Text Color', 'magic-checklists'); ?></label>
                        <input type="text" 
                            name="shortcode_deadline_text_color" 
                            id="mcl_shortcode_deadline_text_color" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'deadline_text_color', '#ff0000')); ?>"
                            class="mcl-color-picker">
                    </div>

                    <div class="mcl-color-option">
                        <label for="mcl_shortcode_list_item_text_color"><?php esc_html_e('List Item Text Color', 'magic-checklists'); ?></label>
                        <input type="text" 
                            name="shortcode_list_item_text_color" 
                            id="mcl_shortcode_list_item_text_color" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'list_item_text_color', '#1a1a1a')); ?>"
                            class="mcl-color-picker">
                    </div>

                    <div class="mcl-color-option">
                        <label for="mcl_shortcode_bg_color"><?php esc_html_e('Background Color', 'magic-checklists'); ?></label>
                        <input type="text" 
                            name="shortcode_bg_color" 
                            id="mcl_shortcode_bg_color" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'bg_color', '#ffffff')); ?>"
                            class="mcl-color-picker">
                    </div>

                    <div class="mcl-color-option">
                        <label for="mcl_shortcode_border_color"><?php esc_html_e('Border Color', 'magic-checklists'); ?></label>
                        <input type="text" 
                            name="shortcode_border_color" 
                            id="mcl_shortcode_border_color" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'border_color', '#e2e8f0')); ?>"
                            class="mcl-color-picker">
                    </div>

                    <div class="mcl-color-option">
                        <label for="mcl_shortcode_checkbox_border_color"><?php esc_html_e('Checkbox Border Color', 'magic-checklists'); ?></label>
                        <input type="text" 
                            name="shortcode_checkbox_border_color" 
                            id="mcl_shortcode_checkbox_border_color" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'checkbox_border_color', '#cccccc')); ?>"
                            class="mcl-color-picker">
                    </div>

                    <div class="mcl-color-option">
                        <label for="mcl_shortcode_checkbox_color_filled"><?php esc_html_e('Checkbox Color Filled', 'magic-checklists'); ?></label>
                        <input type="text" 
                            name="shortcode_checkbox_color_filled" 
                            id="mcl_shortcode_checkbox_color_filled" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'checkbox_color_filled', '#0ea5e9')); ?>"
                            class="mcl-color-picker">
                    </div>

                    <div class="mcl-color-option">
                        <label for="mcl_shortcode_checkbox_color_unfilled"><?php esc_html_e('Checkbox Color Unfilled', 'magic-checklists'); ?></label>
                        <input type="text" 
                            name="shortcode_checkbox_color_unfilled" 
                            id="mcl_shortcode_checkbox_color_unfilled" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'checkbox_color_unfilled', '#ffffff')); ?>"
                            class="mcl-color-picker">
                    </div>

                    <div class="mcl-color-option">
                        <label for="mcl_shortcode_checkmark_color"><?php esc_html_e('Checkmark Color', 'magic-checklists'); ?></label>
                        <input type="text" 
                            name="shortcode_checkmark_color" 
                            id="mcl_shortcode_checkmark_color" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'checkmark_color', '#ffffff')); ?>"
                            class="mcl-color-picker">
                    </div>
                </div>
            </div>
        </div>

        <!-- Group 3: Style Options Part 2 - Spacing and Dimensions -->
        <div class="mcl-shortcode-section">
            <h4 class="mcl-settings-subtitle"><?php esc_html_e('Style Options - Spacing & Dimensions', 'magic-checklists'); ?></h4>
            <div class="mcl-form-group">
                <!-- Checkbox Dimensions -->
                <div class="mcl-input-group">
                    <label for="mcl_shortcode_padding_block"><?php esc_html_e('Container Vertical Padding', 'magic-checklists'); ?></label>
                    <div class="mcl-input-with-unit">
                        <input type="number" 
                            name="shortcode_padding_block" 
                            id="mcl_shortcode_padding_block" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'padding_block', '32')); ?>"
                            class="mcl-input"
                            min="0"
                            max="100">
                        <span class="mcl-input-suffix">px</span>
                    </div>
                </div>

                <div class="mcl-input-group">
                    <label for="mcl_shortcode_padding_inline"><?php esc_html_e('Container Horizontal Padding', 'magic-checklists'); ?></label>
                    <div class="mcl-input-with-unit">
                        <input type="number" 
                            name="shortcode_padding_inline" 
                            id="mcl_shortcode_padding_inline" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'padding_inline', '32')); ?>"
                            class="mcl-input"
                            min="0"
                            max="100">
                        <span class="mcl-input-suffix">px</span>
                    </div>
                </div>
                <div class="mcl-input-group">
                    <label for="mcl_shortcode_container_gap"><?php esc_html_e('Container Gap', 'magic-checklists'); ?></label>
                    <div class="mcl-input-with-unit">
                        <input type="number" 
                            name="shortcode_container_gap" 
                            id="mcl_shortcode_container_gap" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'container_gap', '10')); ?>"
                            class="mcl-input"
                            min="0"
                            max="100">
                        <span class="mcl-input-suffix">px</span>
                    </div>
                </div>

                <div class="mcl-input-group">
                    <label for="mcl_shortcode_checkbox_dimensions"><?php esc_html_e('Checkbox Dimensions (padding)', 'magic-checklists'); ?></label>
                    <div class="mcl-input-with-unit">
                        <input type="number" 
                            name="shortcode_checkbox_dimensions" 
                            id="mcl_shortcode_checkbox_dimensions" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'checkbox_dimensions', '20')); ?>"
                            class="mcl-input"
                            min="10"
                            max="50">
                        <span class="mcl-input-suffix">px</span>
                    </div>
                </div>

                <!-- Checkbox Border Radius -->
                <div class="mcl-input-group">
                    <label for="mcl_shortcode_checkbox_border_radius"><?php esc_html_e('Checkbox Border Radius', 'magic-checklists'); ?></label>
                    <div class="mcl-input-with-unit">
                        <input type="number" 
                            name="shortcode_checkbox_border_radius" 
                            id="mcl_shortcode_checkbox_border_radius" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'checkbox_border_radius', '4')); ?>"
                            class="mcl-input"
                            min="0"
                            max="50">
                        <span class="mcl-input-suffix">px</span>
                    </div>
                </div>

                <!-- Checkbox Border Thickness -->
                <div class="mcl-input-group">
                    <label for="mcl_shortcode_checkbox_border_thickness"><?php esc_html_e('Checkbox Border Thickness', 'magic-checklists'); ?></label>
                    <div class="mcl-input-with-unit">
                        <input type="number" 
                            name="shortcode_checkbox_border_thickness" 
                            id="mcl_shortcode_checkbox_border_thickness" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'checkbox_border_thickness', '2')); ?>"
                            class="mcl-input"
                            min="1"
                            max="10">
                        <span class="mcl-input-suffix">px</span>
                    </div>
                </div>

                <!-- Border Type -->
                <div class="mcl-input-group">
                    <label for="mcl_shortcode_border_type"><?php esc_html_e('Border Type', 'magic-checklists'); ?></label>
                    <select name="shortcode_border_type" id="mcl_shortcode_border_type" class="mcl-select">
                        <option value="none" <?php selected(MCL_Admin::get_shortcode_setting($checklist_id, 'border_type'), 'none'); ?>>
                            <?php esc_html_e('None', 'magic-checklists'); ?>
                        </option>
                        <option value="solid" <?php selected(MCL_Admin::get_shortcode_setting($checklist_id, 'border_type'), 'solid'); ?>>
                            <?php esc_html_e('Solid', 'magic-checklists'); ?>
                        </option>
                        <option value="dashed" <?php selected(MCL_Admin::get_shortcode_setting($checklist_id, 'border_type'), 'dashed'); ?>>
                            <?php esc_html_e('Dashed', 'magic-checklists'); ?>
                        </option>
                        <option value="dotted" <?php selected(MCL_Admin::get_shortcode_setting($checklist_id, 'border_type'), 'dotted'); ?>>
                            <?php esc_html_e('Dotted', 'magic-checklists'); ?>
                        </option>
                    </select>
                </div>

                <!-- Border Radius -->
                <div class="mcl-input-group">
                    <label for="mcl_shortcode_border_radius"><?php esc_html_e('Border Radius', 'magic-checklists'); ?></label>
                    <div class="mcl-input-with-unit">
                        <input type="number" 
                            name="shortcode_border_radius" 
                            id="mcl_shortcode_border_radius" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'border_radius', '6')); ?>"
                            class="mcl-input"
                            min="0"
                            max="50">
                        <span class="mcl-input-suffix">px</span>
                    </div>
                </div>

                <!-- Border Thickness -->
                <div class="mcl-input-group">
                    <label for="mcl_shortcode_border_thickness"><?php esc_html_e('Border Thickness', 'magic-checklists'); ?></label>
                    <div class="mcl-input-with-unit">
                        <input type="number" 
                            name="shortcode_border_thickness" 
                            id="mcl_shortcode_border_thickness" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'border_thickness', '1')); ?>"
                            class="mcl-input"
                            min="1"
                            max="10">
                        <span class="mcl-input-suffix">px</span>
                    </div>
                </div>

                <!-- Item Spacing -->
                <div class="mcl-input-group">
                    <label for="mcl_shortcode_item_spacing"><?php esc_html_e('Item Spacing', 'magic-checklists'); ?></label>
                    <select name="shortcode_item_spacing" id="mcl_shortcode_item_spacing" class="mcl-select">
                        <option value="compact" <?php selected(MCL_Admin::get_shortcode_setting($checklist_id, 'item_spacing'), 'compact'); ?>>
                            <?php esc_html_e('Compact', 'magic-checklists'); ?>
                        </option>
                        <option value="comfortable" <?php selected(MCL_Admin::get_shortcode_setting($checklist_id, 'item_spacing'), 'comfortable'); ?>>
                            <?php esc_html_e('Comfortable', 'magic-checklists'); ?>
                        </option>
                        <option value="spacious" <?php selected(MCL_Admin::get_shortcode_setting($checklist_id, 'item_spacing'), 'spacious'); ?>>
                            <?php esc_html_e('Spacious', 'magic-checklists'); ?>
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Group 4: Style Options Part 3 - Typography -->
        <div class="mcl-shortcode-section">
            <h4 class="mcl-settings-subtitle"><?php esc_html_e('Style Options - Typography', 'magic-checklists'); ?></h4>
            <div class="mcl-form-group">
                <!-- Title Font Size -->
                <div class="mcl-input-group">
                    <label for="mcl_shortcode_title_font_size"><?php esc_html_e('Title Font Size', 'magic-checklists'); ?></label>
                    <div class="mcl-input-with-unit">
                        <input type="number" 
                            name="shortcode_title_font_size" 
                            id="mcl_shortcode_title_font_size" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'title_font_size', '18')); ?>"
                            class="mcl-input"
                            min="10"
                            max="36">
                        <span class="mcl-input-suffix">px</span>
                    </div>
                </div>

                <!-- Description Font Size -->
                <div class="mcl-input-group">
                    <label for="mcl_shortcode_description_font_size"><?php esc_html_e('Description Font Size', 'magic-checklists'); ?></label>
                    <div class="mcl-input-with-unit">
                        <input type="number" 
                            name="shortcode_description_font_size" 
                            id="mcl_shortcode_description_font_size" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'description_font_size', '14')); ?>"
                            class="mcl-input"
                            min="10"
                            max="24">
                        <span class="mcl-input-suffix">px</span>
                    </div>
                </div>

                <!-- List Item Font Size -->
                <div class="mcl-input-group">
                    <label for="mcl_shortcode_list_item_font_size"><?php esc_html_e('List Item Font Size', 'magic-checklists'); ?></label>
                    <div class="mcl-input-with-unit">
                        <input type="number" 
                            name="shortcode_list_item_font_size" 
                            id="mcl_shortcode_list_item_font_size" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'list_item_font_size', '16')); ?>"
                            class="mcl-input"
                            min="10"
                            max="24">
                        <span class="mcl-input-suffix">px</span>
                    </div>
                </div>

                <!-- Deadline Font Size -->
                <div class="mcl-input-group">
                    <label for="mcl_shortcode_deadline_font_size"><?php esc_html_e('Deadline Font Size', 'magic-checklists'); ?></label>
                    <div class="mcl-input-with-unit">
                        <input type="number" 
                            name="shortcode_deadline_font_size" 
                            id="mcl_shortcode_deadline_font_size" 
                            value="<?php echo esc_attr(MCL_Admin::get_shortcode_setting($checklist_id, 'deadline_font_size', '14')); ?>"
                            class="mcl-input"
                            min="10"
                            max="24">
                        <span class="mcl-input-suffix">px</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Group 5: Behavior Options -->
        <div class="mcl-shortcode-section">
            <h4 class="mcl-settings-subtitle"><?php esc_html_e('Behavior Options', 'magic-checklists'); ?></h4>
            <div class="mcl-checkbox-group">
                <label class="mcl-checkbox-label">
                    <input type="checkbox" 
                        name="shortcode_disable_drawer" 
                        value="1" 
                        <?php checked(MCL_Admin::get_shortcode_setting($checklist_id, 'disable_drawer'), 1); ?>>
                    <?php esc_html_e('Disable Drawer for this Checklist', 'magic-checklists'); ?>
                </label>

                <label class="mcl-checkbox-label">
                    <input type="checkbox" 
                        name="shortcode_enable_reorder" 
                        value="1" 
                        <?php checked(MCL_Admin::get_shortcode_setting($checklist_id, 'enable_reorder'), 1); ?>>
                    <?php esc_html_e('Allow Item Reordering', 'magic-checklists'); ?>
                </label>
            </div>
        </div>
    </div>
</div>

                    </div>
                </div>

                <!-- Step 3: Access Control -->
                <div class="mcl-step" data-step="3">
                    <div class="mcl-form-section">
                    <div class="mcl-form-outer-wrapper">
                        <div class="mcl-form-group mcl-form-inner-wrapper">
                                <label for="mcl_public_access" class="mcl-label mcl-label-dark">
                                    <?php esc_html_e('Public Access', 'magic-checklists'); ?>
                                </label>
                                <div class="mcl-toggle-wrapper">
                                    <div class="mcl-toggle-switch">
                                        <input type="checkbox" 
                                            name="public_access" 
                                            id="mcl_public_access" 
                                            value="1" 
                                            <?php checked(get_post_meta($checklist_id, '_mcl_public_access', true), 1); ?>>
                                        <label for="mcl_public_access" class="mcl-switch-label"></label>
                                    </div>
                                </div>
                                <p class="mcl-description">
                                    <?php esc_html_e('Enable this if you want any website visitor without authentication to have access to the checklist.'); ?>
                                </p>

                        <div class="mcl-public-access-options" 
                            style="display: <?php echo get_post_meta($checklist_id, '_mcl_public_access', true) ? 'flex' : 'none'; ?>;">
                            <div class="mcl-form-group">
                                <label class="mcl-label mcl-label-dark mcl-label-small" for="public_description"><?php esc_html_e('Public Description', 'magic-checklists'); ?></label>
                                <textarea 
                                    name="public_description" 
                                    id="public_description" 
                                    rows="3"><?php echo esc_textarea(get_post_meta($checklist_id, '_mcl_public_description', true)); ?></textarea>
                            </div>

                            <label for="mcl_public_checked_state" class="mcl-label mcl-label-dark mcl-label-small">
                                <?php esc_html_e('Public Checked State Handling', 'magic-checklists'); ?>
                            </label>
                            <select name="public_checked_state" id="mcl_public_checked_state" class="mcl-select">
                                <option value="per_user" <?php selected(get_post_meta($checklist_id, '_mcl_public_checked_state_handling', true), 'per_user'); ?>>
                                    <?php esc_html_e('Per User (using browser storage)', 'magic-checklists'); ?>
                                </option>
                                <option value="global" <?php selected(get_post_meta($checklist_id, '_mcl_public_checked_state_handling', true), 'global'); ?>>
                                    <?php esc_html_e('Global (shared between all users)', 'magic-checklists'); ?>
                                </option>
                            </select>
                            <label class="mcl-label mcl-label-small mcl-label-dark" for="mcl_public_permission">Public Access Level</label>
                                <select id="mcl_public_permission" name="public_permission" class="mcl-select">
                                <option value="view" <?php selected( $public_permission, 'view' ); ?>><?php _e('Can View', 'magic-checklists'); ?></option>
                                <option value="interact" <?php selected($public_permission, 'interact'); ?>><?php _e('Can Interact', 'magic-checklists'); ?></option>
                                <option value="edit" <?php selected($public_permission, 'edit'); ?>><?php _e('Can Edit', 'magic-checklists'); ?></option>
                                </select>
                        </div>
                    </div>

                        <div class="mcl-form-group mcl-form-inner-wrapper">
                            <label for="mcl_enable_rate_limit" class="mcl-label mcl-label-dark">
                                <?php esc_html_e('Enable Rate Limiting', 'magic-checklists'); ?>
                            </label>
                            <div class="mcl-toggle-wrapper">
                                <div class="mcl-toggle-switch">
                                    <input type="checkbox" 
                                        name="enable_rate_limit" 
                                        id="mcl_enable_rate_limit" 
                                        value="1" 
                                        <?php checked(get_post_meta($checklist_id, '_mcl_enable_rate_limit', true), 1); ?>>
                                    <label for="mcl_enable_rate_limit" class="mcl-switch-label"></label>
                                </div>
                                <p class="mcl-description">
                                    <?php esc_html_e('Limit how frequently users can perform actions on this checklist.', 'magic-checklists'); ?>
                                </p>
                            </div>
                        </div>
                    </div>
                        <!-- Allowed User Roles -->
                        
                        <div class="mcl-form-group mcl-form-inner-wrapper">
                            <label for="mcl_access_roles" class="mcl-label mcl-label-dark"><?php esc_html_e('Allowed User Roles', 'magic-checklists'); ?></label>
                            <select name="access_roles[]" id="mcl_access_roles" class="mcl-select" multiple>
                                <?php
                                $roles = wp_roles()->get_names();
                                foreach ( $roles as $role_value => $role_name ) {
                                    echo '<option value="' . esc_attr( $role_value ) . '"' . ( in_array( $role_value, $access_roles ) ? ' selected' : '' ) . '>' . esc_html( $role_name ) . '</option>';
                                }
                                ?>
                            </select>
                            <label for="mcl_access_roles_permission" class="mcl-label mcl-label-dark mcl-label-small"><?php esc_html_e('Permission Level', 'magic-checklists'); ?></label>
                            <select name="access_roles_permission" id="mcl_access_roles_permission" class="mcl-select">
                                <option value="view" <?php selected( $access_roles_permission, 'view' ); ?>><?php esc_html_e('Can View', 'magic-checklists'); ?></option>
                                <option value="interact" <?php selected( $access_roles_permission, 'interact' ); ?>><?php esc_html_e('Can Interact', 'magic-checklists'); ?></option>
                                <option value="edit" <?php selected( $access_roles_permission, 'edit' ); ?>><?php esc_html_e('Can Edit', 'magic-checklists'); ?></option>
                            </select>
                            <p class="mcl-description"><?php esc_html_e('Select the user roles that are allowed to access this checklist and their permission level.', 'magic-checklists'); ?></p>
                        </div>
                        <!-- Allowed Users -->
                        <div class="mcl-form-group mcl-form-inner-wrapper">
                            <label for="mcl_access_users mcl-form-inner-wrapper" class="mcl-label mcl-label-dark"><?php esc_html_e('Allowed Users', 'magic-checklists'); ?></label>
                            <select name="access_users[]" id="mcl_access_users" class="mcl-select" multiple>
                                <?php
                                $users = get_users( array( 'fields' => array( 'ID', 'display_name' ) ) );
                                foreach ( $users as $user ) {
                                    echo '<option value="' . esc_attr( $user->ID ) . '"' . ( in_array( $user->ID, $access_users ) ? ' selected' : '' ) . '>' . esc_html( $user->display_name ) . '</option>';
                                }
                                ?>
                            </select>
                            <label for="mcl_access_users_permission" class="mcl-label mcl-label-dark mcl-label-small"><?php esc_html_e('Permission Level', 'magic-checklists'); ?></label>
                            <select name="access_users_permission" id="mcl_access_users_permission" class="mcl-select">
                                <option value="view" <?php selected( $access_users_permission, 'view' ); ?>><?php esc_html_e('Can View', 'magic-checklists'); ?></option>
                                <option value="interact" <?php selected( $access_users_permission, 'interact' ); ?>><?php esc_html_e('Can Interact', 'magic-checklists'); ?></option>
                                <option value="edit" <?php selected( $access_users_permission, 'edit' ); ?>><?php esc_html_e('Can Edit', 'magic-checklists'); ?></option>
                            </select>
                            <p class="mcl-description"><?php esc_html_e('Select individual users who are allowed to access this checklist and their permission level.', 'magic-checklists'); ?></p>
                        </div>
                        <div class="mcl-form-inner-wrapper mcl-invite-links-section">
                            <label class="mcl-label mcl-label-dark"><?php esc_html_e('Invite Links', 'magic-checklists'); ?></label>
                            <p class="mcl-description"><?php esc_html_e('Generate invite links to share this checklist with anyone, even if they don\'t have a WordPress account.', 'magic-checklists'); ?></p>
                            
                            <div class="mcl-form-group">
                                <label for="mcl_invite_permissions" class="mcl-label mcl-label-dark mcl-label-small">
                                    <?php esc_html_e('Permission Level', 'magic-checklists'); ?>
                                </label>
                                <select name="invite_permissions" id="mcl_invite_permissions" class="mcl-select">
                                    <option value="view"><?php esc_html_e('Can View', 'magic-checklists'); ?></option>
                                    <option value="interact"><?php esc_html_e('Can Interact', 'magic-checklists'); ?></option>
                                    <option value="edit"><?php esc_html_e('Can Edit', 'magic-checklists'); ?></option>
                                </select>
                            </div>
                            
                            <div class="mcl-form-group">
                                <label for="mcl_invite_expiry" class="mcl-label mcl-label-dark mcl-label-small">
                                    <?php esc_html_e('Expires After', 'magic-checklists'); ?>
                                </label>
                                <select name="invite_expiry" id="mcl_invite_expiry" class="mcl-select">
                                    <option value="1"><?php esc_html_e('1 Day', 'magic-checklists'); ?></option>
                                    <option value="7"><?php esc_html_e('7 Days', 'magic-checklists'); ?></option>
                                    <option value="30"><?php esc_html_e('30 Days', 'magic-checklists'); ?></option>
                                </select>
                            </div>
                            
                            <div class="mcl-form-group">
                                <label for="mcl_invite_usage" class="mcl-label mcl-label-dark mcl-label-small">
                                    <?php esc_html_e('Usage Limit', 'magic-checklists'); ?>
                                </label>
                                <input type="number" 
                                    name="invite_usage" 
                                    id="mcl_invite_usage" 
                                    class="mcl-input" 
                                    min="0" 
                                    value="0" 
                                    placeholder="<?php esc_attr_e('0 for unlimited', 'magic-checklists'); ?>">
                            </div>
                            
                            <button type="button" id="mcl-generate-invite" class="mcl-button mcl-button-secondary">
                                <?php esc_html_e('Generate Invite Link', 'magic-checklists'); ?>
                            </button>
                            
                            <div id="mcl-invite-links-list" class="mcl-invite-links-list"></div>
                        </div>
                        <div class="mcl-form-inner-wrapper">
                            <label class="mcl-label mcl-label-dark">Loading Conditions</label>
                            <div class="mcl-toggle-wrapper">
                                <div class="mcl-toggle-switch">
                                <input type="checkbox" 
                                    name="load_everywhere" 
                                    id="mcl_load_everywhere" 
                                    value="1" 
                                    <?php 
                                    if ($checklist_id) {
                                        $load_everywhere = get_post_meta($checklist_id, '_mcl_load_everywhere', true);
                                        checked($load_everywhere === '' || $load_everywhere == 1, true);
                                    } else {
                                        echo 'checked';
                                    }
                                ?>>
                                    <label for="mcl_load_everywhere" class="mcl-switch-label"></label>
                                </div>
                                <span>Load Everywhere (Default)</span>
                            </div>

                            <div class="mcl-conditional-options" style="display: <?php 
                                if ($checklist_id) {
                                    echo get_post_meta($checklist_id, '_mcl_load_everywhere', true) ? 'none' : 'flex';
                                } else {
                                    echo 'none';
                                }
                            ?>;">
                                <!-- WordPress Pages Select -->
                                <div class="mcl-form-group">
                                    <label for="mcl_allowed_pages" class="mcl-label mcl-label-dark mcl-label-small">
                                        WordPress Admin Pages
                                    </label>
                                    <select name="allowed_pages[]" id="mcl_allowed_pages" class="mcl-select" multiple>
                                        <?php foreach ($grouped_pages as $group_name => $group_pages): ?>
                                            <optgroup label="<?php echo esc_attr($group_name); ?>">
                                                <?php foreach ($group_pages as $page_slug => $page_title): ?>
                                                    <option value="<?php echo esc_attr($page_slug); ?>" 
                                                            <?php echo in_array($page_slug, $allowed_pages) ? 'selected' : ''; ?>>
                                                        <?php echo esc_html($page_title); ?>
                                                    </option>
                                                <?php endforeach; ?>
                                            </optgroup>
                                        <?php endforeach; ?>
                                    </select>
                                    <p class="mcl-description">
                                        <?php esc_html_e('Select the WordPress admin pages where this checklist should be available. If none are selected, the checklist will be available on all pages.', 'magic-checklists'); ?>
                                    </p>
                                </div>
                                <!-- Custom URLs -->
                                <div class="mcl-form-group">
                                    <label class="mcl-label mcl-label-dark mcl-label-small">Custom URLs</label>
                                    <div class="mcl-url-list" id="mcl-url-list">
                                        <?php
                                        $allowed_urls = get_post_meta($checklist_id, '_mcl_allowed_urls', true) ?: array();
                                        foreach ($allowed_urls as $url) : ?>
                                            <div class="mcl-url-item">
                                                <input type="text" name="allowed_urls[]" value="<?php echo esc_attr($url); ?>" 
                                                    class="mcl-input" placeholder="Enter URL pattern (e.g., /posts/*)">
                                                <button type="button" class="mcl-remove-url mcl-button mcl-button-icon">×</button>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                    <button type="button" id="mcl-add-url" class="mcl-button mcl-button-secondary">
                                        Add URL Pattern
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="mcl-form-inner-wrapper">
                            <button type="button" id="mcl-force-delete-lock" class="mcl-button mcl-button-danger">
                                <?php esc_html_e('Force Delete Lock', 'magic-checklists'); ?>
                            </button>
                            <p class="mcl-description">
                                <?php esc_html_e('Use this button to forcefully remove the lock on this checklist if it is stuck. Only use this if you are sure no one else is editing this checklist.', 'magic-checklists'); ?>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Step 4: Notifications -->
                <div class="mcl-step" data-step="4">
                    <div class="mcl-form-section">
                        <div class="mcl-form-group mcl-form-inner-wrapper">
                            <label class="mcl-label mcl-label-dark"><?php esc_html_e('Notifications', 'magic-checklists'); ?></label>
                            <div class="mcl-toggle-wrapper">
                                <div class="mcl-toggle-switch">
                                    <input type="checkbox" 
                                        name="notifications_enabled" 
                                        id="mcl_notifications_enabled" 
                                        value="1" 
                                        <?php checked($notification_settings && $notification_settings->notifications_enabled, 1); ?>>
                                    <label for="mcl_notifications_enabled" class="mcl-switch-label"></label>
                                </div>
                                <p class="mcl-description">
                                    <?php esc_html_e('Enable notifications for this checklist', 'magic-checklists'); ?>
                                </p>
                            </div>
                            <div class="mcl-notification-settings" style="display: <?php echo ($notification_settings && $notification_settings->notifications_enabled) ? 'flex' : 'none'; ?>;">
                            <!-- Notification Methods -->
                            <div class="mcl-form-group">
                                <label class="mcl-label mcl-label-dark mcl-label-small"><?php esc_html_e('Notification Methods', 'magic-checklists'); ?></label>
                                <div class="mcl-checkbox-group">
                                    <label class="mcl-checkbox-label">
                                        <input type="checkbox" 
                                            name="email_enabled" 
                                            id="mcl_email_enabled" 
                                            value="1" 
                                            <?php checked($notification_settings && $notification_settings->email_enabled, 1); ?>>
                                        <?php esc_html_e('Email Notifications', 'magic-checklists'); ?>
                                    </label>
                                    
                                    <label class="mcl-checkbox-label">
                                        <input type="checkbox" 
                                            name="integration_enabled" 
                                            id="mcl_integration_enabled" 
                                            value="1" 
                                            <?php checked($notification_settings && $notification_settings->integration_enabled, 1); ?>>
                                        <?php esc_html_e('Integration Notifications', 'magic-checklists'); ?>
                                    </label>
                                </div>
                                <p class="mcl-description">
                                    <?php esc_html_e('Please check at least one option for the notifications to work.'); ?>
                                </p>
                            </div>

                            <!-- Email Settings -->
                            <div class="mcl-email-settings" style="display: <?php echo ($notification_settings && $notification_settings->email_enabled) ? 'block' : 'none'; ?>;">
                                <label for="mcl_email_recipients" class="mcl-label mcl-label-dark mcl-label-small">
                                    <?php esc_html_e('Email Recipients', 'magic-checklists'); ?>
                                </label>
                                <div class="mcl-email-input-group">
                                    <input type="text" 
                                        name="email_recipients" 
                                        id="mcl_email_recipients" 
                                        class="mcl-input" 
                                        value="<?php echo esc_attr($notification_settings ? $notification_settings->email_recipients : ''); ?>"
                                        placeholder="<?php esc_attr_e('email1@example.com, email2@example.com', 'magic-checklists'); ?>">
                                    <button type="button" class="mcl-button mcl-button-secondary test-email-notification">
                                        <?php esc_html_e('Test Email', 'magic-checklists'); ?>
                                    </button>
                                </div>
                                <p class="mcl-description">
                                    <?php esc_html_e('Enter email addresses separated by commas', 'magic-checklists'); ?>
                                </p>
                            </div>

                            <!-- Integration Settings -->
                            <div class="mcl-integration-settings" style="display: <?php echo ($notification_settings && $notification_settings->integration_enabled) ? 'block' : 'none'; ?>;">
                                <label for="mcl_slack_webhook" class="mcl-label mcl-label-dark mcl-label-small">
                                    <?php esc_html_e('Slack Webhook URL', 'magic-checklists'); ?>
                                </label>
                                <input type="url" 
                                    name="slack_webhook_url" 
                                    id="mcl_slack_webhook" 
                                    class="mcl-input" 
                                    value="<?php echo esc_attr($notification_settings ? $notification_settings->slack_webhook_url : ''); ?>"
                                    placeholder="https://hooks.slack.com/services/...">
                                
                                <label for="mcl_discord_webhook" class="mcl-label mcl-label-dark mcl-label-small">
                                    <?php esc_html_e('Discord Webhook URL', 'magic-checklists'); ?>
                                </label>
                                <input type="url" 
                                    name="discord_webhook_url" 
                                    id="mcl_discord_webhook" 
                                    class="mcl-input" 
                                    value="<?php echo esc_attr($notification_settings ? $notification_settings->discord_webhook_url : ''); ?>"
                                    placeholder="https://discord.com/api/webhooks/...">
                                
                                <div class="mcl-webhook-test-buttons">
                                    <button type="button" class="mcl-button mcl-button-secondary test-slack-webhook">
                                        <?php esc_html_e('Test Slack Webhook', 'magic-checklists'); ?>
                                    </button>
                                    <button type="button" class="mcl-button mcl-button-secondary test-discord-webhook">
                                        <?php esc_html_e('Test Discord Webhook', 'magic-checklists'); ?>
                                    </button>
                                </div>
                            </div>

                            <!-- Notification Triggers -->
                            <div class="mcl-form-group">
                                <label class="mcl-label mcl-label-dark mcl-label-small"><?php esc_html_e('Notification Triggers', 'magic-checklists'); ?></label>
                                <div class="mcl-checkbox-group">
                                    <label class="mcl-checkbox-label">
                                        <input type="checkbox" 
                                            name="notify_on_new_item" 
                                            value="1" 
                                            <?php checked($notification_settings && $notification_settings->notify_on_new_item, 1); ?>>
                                        <?php esc_html_e('New item added', 'magic-checklists'); ?>
                                    </label>
                                    
                                    <label class="mcl-checkbox-label">
                                        <input type="checkbox" 
                                            name="notify_on_delete_item" 
                                            value="1" 
                                            <?php checked($notification_settings && $notification_settings->notify_on_delete_item, 1); ?>>
                                        <?php esc_html_e('Item deleted', 'magic-checklists'); ?>
                                    </label>
                                    
                                    <label class="mcl-checkbox-label">
                                        <input type="checkbox" 
                                            name="notify_on_check_item" 
                                            value="1" 
                                            <?php checked($notification_settings && $notification_settings->notify_on_check_item, 1); ?>>
                                        <?php esc_html_e('Item checked', 'magic-checklists'); ?>
                                    </label>
                                    
                                    <label class="mcl-checkbox-label">
                                        <input type="checkbox" 
                                            name="notify_on_uncheck_item" 
                                            value="1" 
                                            <?php checked($notification_settings && $notification_settings->notify_on_uncheck_item, 1); ?>>
                                        <?php esc_html_e('Item unchecked', 'magic-checklists'); ?>
                                    </label>
                                    
                                    <label class="mcl-checkbox-label">
                                        <input type="checkbox" 
                                            name="notify_on_deadline" 
                                            id="mcl_notify_on_deadline" 
                                            value="1" 
                                            <?php checked($notification_settings && $notification_settings->notify_on_deadline, 1); ?>>
                                        <?php esc_html_e('Deadline approaching', 'magic-checklists'); ?>
                                    </label>
                                </div>
                            </div>

                            <!-- Deadline Settings -->
                            <div class="mcl-deadline-settings" style="display: <?php echo ($notification_settings && $notification_settings->notify_on_deadline) ? 'block' : 'none'; ?>;">
                                <label for="mcl_deadline_threshold" class="mcl-label mcl-label-dark mcl-label-small">
                                    <?php esc_html_e('Send deadline notification when', 'magic-checklists'); ?>
                                </label>
                                <div class="mcl-input-group">
                                    <input type="number" 
                                        name="deadline_threshold_hours" 
                                        id="mcl_deadline_threshold" 
                                        class="mcl-input" 
                                        min="1" 
                                        value="<?php echo esc_attr($notification_settings ? $notification_settings->deadline_threshold_hours : 24); ?>">
                                    <span class="mcl-input-suffix"><?php esc_html_e('hours remaining', 'magic-checklists'); ?></span>
                                </div>
                            </div>

                            <!-- Batch Settings -->
                            <div class="mcl-form-group">
                                <label for="mcl_batch_interval" class="mcl-label mcl-label-dark mcl-label-small">
                                    <?php esc_html_e('Notification Frequency', 'magic-checklists'); ?>
                                </label>
                                <select name="batch_interval" id="mcl_batch_interval" class="mcl-select">
                                    <?php
                                    $batch_interval = $notification_settings ? $notification_settings->batch_interval : 'fifteen_minutes';
                                    $intervals = array(
                                        'immediate' => __('Send Immediately', 'magic-checklists'),
                                        'fifteen_minutes' => __('Every 15 Minutes', 'magic-checklists'),
                                        'hourly' => __('Hourly', 'magic-checklists'),
                                        'daily' => __('Daily Digest', 'magic-checklists')
                                    );
                                    foreach ($intervals as $value => $label) {
                                        printf(
                                            '<option value="%s" %s>%s</option>',
                                            esc_attr($value),
                                            selected($batch_interval, $value, false),
                                            esc_html($label)
                                        );
                                    }
                                    ?>
                                </select>
                                <p class="mcl-description">
                                    <?php esc_html_e('Choose how often notifications should be sent', 'magic-checklists'); ?>
                                </p>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>

                <!-- Step Navigation -->
                <div class="mcl-step-navigation">
                    <button type="button" class="mcl-button mcl-button-secondary mcl-prev-step" style="display: none;">
                        <?php esc_html_e('Previous', 'magic-checklists'); ?>
                    </button>
                    <button type="button" class="mcl-button mcl-button-primary mcl-next-step">
                        <?php esc_html_e('Next', 'magic-checklists'); ?>
                    </button>
                </div>
            </div>
                <!-- List Items Section -->
        <div class="mcl-list-items-section">
            <div class="mcl-list-header">
                <h2 class="mcl-section-title mcl-light"><?php esc_html_e('Checklist Items', 'magic-checklists'); ?></h2>
                
                <!-- Priority Settings -->
                <div class="mcl-list-priority-settings">
                    <div class="mcl-form-group mcl-form-inner-wrapper">
                        <label for="mcl_enable_item_priority" class="mcl-label mcl-label-dark">
                            <?php esc_html_e('Enable Item Priorities', 'magic-checklists'); ?>
                        </label>
                        <div class="mcl-toggle-wrapper">
                            <div class="mcl-toggle-switch">
                                <input name="enable_item_priority" 
                                       type="checkbox" 
                                       id="mcl_enable_item_priority" 
                                       value="1" 
                                       <?php checked(get_post_meta($checklist_id, '_mcl_enable_item_priority', true), 1); ?>>
                                <label for="mcl_enable_item_priority" class="mcl-switch-label"></label>
                            </div>
                        </div>
                        <div class="mcl-priority-display-options" style="display: <?php echo get_post_meta($checklist_id, '_mcl_enable_item_priority', true) ? 'flex' : 'none'; ?>">
                        <div class="mcl-radio-group">
                            <label class="mcl-radio-label mcl-label-dark">
                                <input type="radio" 
                                       name="priority_display_type" 
                                       value="color" 
                                       <?php checked(get_post_meta($checklist_id, '_mcl_priority_display_type', true), 'color'); ?> 
                                       <?php checked(get_post_meta($checklist_id, '_mcl_priority_display_type', true), ''); ?>>
                                <?php esc_html_e('Color Indicators', 'magic-checklists'); ?>
                            </label>
                            <label class="mcl-radio-label mcl-label-dark">
                                <input type="radio" 
                                       name="priority_display_type" 
                                       value="number" 
                                       <?php checked(get_post_meta($checklist_id, '_mcl_priority_display_type', true), 'number'); ?>>
                                <?php esc_html_e('Numeric Indicators (0-4)', 'magic-checklists'); ?>
                            </label>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
            <!-- List Items Container -->
            <div class="mcl-items-container">
                <ul id="mcl-items" class="mcl-items-list">
                    <?php
                    $index = -1;
                    if (!empty($items)) :
                        foreach ($items as $index => $item) :
                    ?>
                        <li data-item-id="<?php echo esc_attr($item['id']); ?>" 
                            <?php echo isset($item['parent_id']) && !empty($item['parent_id']) ? 
                                'data-parent-id="' . esc_attr($item['parent_id']) . '" class="mcl-child-item"' : ''; ?>>
                            <span class="drag-handle">☰</span>
                            <input type="hidden" name="items[<?php echo esc_attr($index); ?>][id]" value="<?php echo esc_attr($item['id']); ?>">
                            <div class="mcl-item-wrapper">
                                <div class="mcl-item-content" 
                                     contenteditable="true"
                                     data-name="items[<?php echo esc_attr($index); ?>][content]"><?php 
                                    echo wp_kses(
                                        $item['content'],
                                        array(
                                            'a' => array(
                                                'href' => array(),
                                                'target' => array('_blank'),
                                                'rel' => array('noopener', 'noreferrer'),
                                                'class' => array()
                                            ),
                                            'br' => array(),
                                            'em' => array(),
                                            'i' => array(),
                                            'strong' => array(),
                                            'b' => array(),
                                            'u' => array(),
                                            'span' => array(
                                                'class' => array(),
                                                'style' => array()
                                            ),
                                            'img' => array(
                                                'src' => array(),
                                                'alt' => array(),
                                                'class' => array(),
                                                'data-mcl-image' => array(),
                                                'width' => array(),
                                                'height' => array(),
                                                'style' => array()
                                            )
                                        )
                                    );
                                ?></div>
                                
                                <div class="mcl-item-controls">
                                    <select class="mcl-parent-select" 
                                            name="items[<?php echo esc_attr($index); ?>][parent_id]"
                                            data-item-id="<?php echo esc_attr($item['id']); ?>">
                                        <option value=""><?php esc_html_e('No Parent', 'magic-checklists'); ?></option>
                                        <?php foreach ($items as $potential_parent): 
                                            // Skip self and items that already have parents
                                            if ($potential_parent['id'] === $item['id'] || 
                                                (isset($potential_parent['parent_id']) && !empty($potential_parent['parent_id']))) {
                                                continue;
                                            }
                                        ?>
                                            <option value="<?php echo esc_attr($potential_parent['id']); ?>"
                                                    <?php selected(isset($item['parent_id']) ? $item['parent_id'] : '', $potential_parent['id']); ?>>
                                                <?php echo esc_html(wp_trim_words($potential_parent['content'], 5)); ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                    
                                    <?php if (get_post_meta($checklist_id, '_mcl_enable_item_priority', true)) : ?>
                                        <!-- Existing priority select -->
                                        <select name="items[<?php echo esc_attr($index); ?>][priority]" class="mcl-select mcl-priority-select">
                                            <?php 
                                            $priority_levels = array(
                                                'none' => 'None',
                                                'low' => 'Low',
                                                'medium' => 'Medium',
                                                'high' => 'High',
                                                'critical' => 'Critical'
                                            );
                                            $current_priority = isset($item['priority']) ? $item['priority'] : 'none';
                                            
                                            foreach ($priority_levels as $value => $label) : ?>
                                                <option value="<?php echo esc_attr($value); ?>" 
                                                        <?php selected($current_priority, $value); ?>>
                                                    <?php echo esc_html($label); ?>
                                                </option>
                                            <?php endforeach; ?>
                                        </select>
                                    <?php endif; ?>
                                    <?php if ( get_post_meta( $checklist_id, '_mcl_enable_item_locking', true ) ) : ?>
                                    <!-- Locked flag for this item -->
                                    <label class="mcl-lock-checkbox">
                                        <input type="checkbox"
                                            name="items[<?php echo esc_attr($index); ?>][locked]"
                                            value="1"
                                            <?php checked(!empty($item['locked']), true); ?> >
                                        <?php esc_html_e('Locked', 'magic-checklists'); ?>
                                    </label>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <div class="mcl-list-item-actions">
                                <button type="button" class="mcl-add-image-btn" title="Add image">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                        <path fill="currentColor" d="M416 64H96a64.07 64.07 0 0 0-64 64v256a64.07 64.07 0 0 0 64 64h320a64.07 64.07 0 0 0 64-64V128a64.07 64.07 0 0 0-64-64Zm-80 64a48 48 0 1 1-48 48a48.05 48.05 0 0 1 48-48ZM96 416a32 32 0 0 1-32-32v-67.63l94.84-84.3a48.06 48.06 0 0 1 65.8 1.9l64.95 64.81L172.37 416Zm352-32a32 32 0 0 1-32 32H217.63l121.42-121.42a47.72 47.72 0 0 1 61.64-.16L448 333.84Z"/>
                                    </svg>
                                </button>
                                <button type="button" class="mcl-remove-item mcl-remove-icon">×</button>
                            </div>
                        </li>
                    <?php
                        endforeach;
                    else :
                        $index = 0;
                    ?>
                        <li data-item-id="<?php echo esc_attr('item_' . time()); ?>">
                            <span class="drag-handle">☰</span>
                            <input type="hidden" name="items[0][id]" value="<?php echo esc_attr('item_' . time()); ?>">
                            <div class="mcl-item-wrapper">
                                <div class="mcl-item-content" 
                                     contenteditable="true"
                                     data-name="items[0][content]"></div>
                                
                                <div class="mcl-item-controls">
                                    <select class="mcl-parent-select" 
                                            name="items[0][parent_id]"
                                            data-item-id="<?php echo esc_attr('item_' . time()); ?>">
                                        <option value=""><?php esc_html_e('No Parent', 'magic-checklists'); ?></option>
                                        <?php foreach ($items as $potential_parent): 
                                            // Skip self and items that already have parents
                                            if ($potential_parent['id'] === 'item_' . time() || 
                                                (isset($potential_parent['parent_id']) && !empty($potential_parent['parent_id']))) {
                                                continue;
                                            }
                                        ?>
                                            <option value="<?php echo esc_attr($potential_parent['id']); ?>"
                                                    <?php selected(isset($item['parent_id']) ? $item['parent_id'] : '', $potential_parent['id']); ?>>
                                                <?php echo esc_html(wp_trim_words($potential_parent['content'], 5)); ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                    
                                    <?php if (get_post_meta($checklist_id, '_mcl_enable_item_priority', true)) : ?>
                                        <!-- Existing priority select -->
                                        <select name="items[0][priority]" class="mcl-select mcl-priority-select">
                                            <?php 
                                            $priority_levels = array(
                                                'none' => 'None',
                                                'low' => 'Low',
                                                'medium' => 'Medium',
                                                'high' => 'High',
                                                'critical' => 'Critical'
                                            );
                                            $current_priority = isset($item['priority']) ? $item['priority'] : 'none';
                                            
                                            foreach ($priority_levels as $value => $label) : ?>
                                                <option value="<?php echo esc_attr($value); ?>" 
                                                        <?php selected($current_priority, $value); ?>>
                                                    <?php echo esc_html($label); ?>
                                                </option>
                                            <?php endforeach; ?>
                                        </select>
                                    <?php endif; ?>
                                    <?php if ( get_post_meta( $checklist_id, '_mcl_enable_item_locking', true ) ) : ?>
                                    <!-- Locked flag for this item -->
                                    <label class="mcl-lock-checkbox">
                                        <input type="checkbox"
                                            name="items[0][locked]"
                                            value="1"
                                            <?php checked(!empty($item['locked']), true); ?> >
                                        <?php esc_html_e('Locked', 'magic-checklists'); ?>
                                    </label>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <div class="mcl-list-item-actions">
                                <button type="button" class="mcl-add-image-btn" title="Add image">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                        <path fill="currentColor" d="M416 64H96a64.07 64.07 0 0 0-64 64v256a64.07 64.07 0 0 0 64 64h320a64.07 64.07 0 0 0 64-64V128a64.07 64.07 0 0 0-64-64Zm-80 64a48 48 0 1 1-48 48a48.05 48.05 0 0 1 48-48ZM96 416a32 32 0 0 1-32-32v-67.63l94.84-84.3a48.06 48.06 0 0 1 65.8 1.9l64.95 64.81L172.37 416Zm352-32a32 32 0 0 1-32 32H217.63l121.42-121.42a47.72 47.72 0 0 1 61.64-.16L448 333.84Z"/>
                                    </svg>
                                </button>
                                <button type="button" class="mcl-remove-item mcl-remove-icon">×</button>
                            </div>
                        </li>
                    <?php endif; ?>
                </ul>

                <!-- List Actions -->
                <div class="mcl-items-actions">
                    <button id="mcl-add-item" type="button" class="mcl-button mcl-button-secondary">
                        <span class="dashicons dashicons-plus-alt2"></span>
                        <?php esc_html_e('Add Item', 'magic-checklists'); ?>
                    </button>
                    <button id="mcl-delete-all" type="button" class="mcl-button mcl-button-danger">
                        <span class="dashicons dashicons-trash"></span>
                        <?php esc_html_e('Delete All Items', 'magic-checklists'); ?>
                    </button>
                </div>
            </div>
            <button type="submit" class="mcl-button mcl-button-primary mcl-submit-form mcl-submit-bottom-button">
                    <?php echo $checklist_id ? esc_html__('Update Checklist', 'magic-checklists') : esc_html__('Create Checklist', 'magic-checklists'); ?>
                </button>
        </div>
            </form>
        </div>
    </div>
</div>

<!-- Link Toolbar Template -->
<div class="mcl-link-toolbar" style="display: none;">
    <div class="mcl-link-toolbar-inner">
        <input type="text" class="mcl-link-input" placeholder="<?php esc_attr_e('Enter URL...', 'magic-checklists'); ?>">
        <button type="button" class="mcl-link-submit">
            <span class="dashicons dashicons-saved"></span>
        </button>
        <button type="button" class="mcl-remove-link-btn">
            <span class="dashicons dashicons-no-alt"></span>
        </button>
    </div>
    <div class="mcl-link-error"></div>
</div>

<script type="text/javascript">
document.addEventListener('DOMContentLoaded', function() {
    // Initialize conditional display handlers
    const triggerButton = document.getElementById('mcl_trigger_button');
    const shortTitleGroup = document.querySelector('.mcl-floating-button-options');
    
    if (triggerButton && shortTitleGroup) {
        triggerButton.addEventListener('change', function() {
            shortTitleGroup.style.display = this.checked ? 'flex' : 'none';
        });
    }

    const publicAccessToggle = document.getElementById('mcl_public_access');
    const publicAccessOptions = document.querySelector('.mcl-public-access-options');
    
    if (publicAccessToggle && publicAccessOptions) {
        publicAccessToggle.addEventListener('change', function() {
            publicAccessOptions.style.display = this.checked ? 'flex' : 'none';
        });
    }
});
</script>
</div>