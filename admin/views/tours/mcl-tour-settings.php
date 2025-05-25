<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$tour_id = isset($_GET['edit']) ? intval($_GET['edit']) : (isset($_GET['tour_id']) ? intval($_GET['tour_id']) : 0);
$tour = null;
$tour_steps = array();
$tour_settings = array();

if ($tour_id) {
    $tour = get_post($tour_id);
    if ($tour && $tour->post_type === 'mcl_tour') {
        $tour_steps = get_post_meta($tour_id, '_mcl_tour_steps', true) ?: array();
        $tour_settings = get_post_meta($tour_id, '_mcl_tour_settings', true) ?: array();
    } else {
        wp_die(__('Tour not found.', 'magic-checklists'));
    }
}

$page_title = $tour_id ? __('Edit Tour', 'magic-checklists') : __('Create New Tour', 'magic-checklists');
?>

<div class="mcl-wrap">
    <div class="mcl-header">
        <div class="mcl-title-wrapper">
            <h1 class="mcl-title"><?php echo esc_html($page_title); ?></h1>
            <div class="mcl-actions">
                <a href="<?php echo admin_url('admin.php?page=mcl_tours'); ?>" class="mcl-button mcl-button-primary">
                    <span class="dashicons dashicons-arrow-left-alt"></span>
                    <?php _e('Back to Tours', 'magic-checklists'); ?>
                </a>
            </div>
        </div>
        <div class="mcl-intro">
            <p class="mcl-description mcl-description-light">
                <?php _e('Configure your tour settings below. After saving settings, you can use the visual tour creator to add interactive steps.', 'magic-checklists'); ?>
            </p>
        </div>
    </div>

    <div class="mcl-tour-settings-container">
        <div class="mcl-tour-settings-main">
            <!-- Loading Overlay -->
            <div class="mcl-loading-overlay" id="mcl-loading-overlay" style="display: none;">
                <div class="mcl-loading-content">
                    <span class="dashicons dashicons-update-alt mcl-spin"></span>
                    <span class="mcl-loading-text"><?php _e('Saving...', 'magic-checklists'); ?></span>
                </div>
            </div>

            <!-- Basic Information -->
            <div class="mcl-form-section">
                <h2 class="mcl-section-title"><?php _e('Basic Information', 'magic-checklists'); ?></h2>
                
                <div class="mcl-form-group">
                    <label for="tour-title" class="mcl-label"><?php _e('Tour Title', 'magic-checklists'); ?> <span class="mcl-required">*</span></label>
                    <input type="text" id="tour-title" name="title" class="mcl-input" 
                           value="<?php echo esc_attr($tour ? $tour->post_title : ''); ?>"
                           placeholder="<?php _e('Enter tour title...', 'magic-checklists'); ?>" required>
                    <p class="description"><?php _e('Give your tour a descriptive name.', 'magic-checklists'); ?></p>
                </div>

                <div class="mcl-form-group">
                    <label for="tour-description" class="mcl-label"><?php _e('Description', 'magic-checklists'); ?></label>
                    <textarea id="tour-description" name="description" class="mcl-textarea" rows="3"
                              placeholder="<?php _e('Optional description for this tour...', 'magic-checklists'); ?>"><?php echo esc_textarea($tour ? $tour->post_content : ''); ?></textarea>
                    <p class="description"><?php _e('Optional description to help you remember what this tour is for.', 'magic-checklists'); ?></p>
                </div>

                <div class="mcl-form-group">
                    <div class="mcl-toggle-wrapper">
                        <label class="mcl-toggle-switch">
                            <input type="checkbox" id="tour-active" name="active" value="1" 
                                   <?php checked(!empty($tour_settings['active'])); ?>>
                            <span class="mcl-switch-label"></span>
                        </label>
                        <label for="tour-active" class="mcl-label"><?php _e('Active (show this tour to users)', 'magic-checklists'); ?></label>
                    </div>
                    <p class="description"><?php _e('Only active tours will be displayed to users.', 'magic-checklists'); ?></p>
                </div>
            </div>

            <!-- Trigger Settings -->
            <div class="mcl-form-section">
                <h2 class="mcl-section-title"><?php _e('Trigger Settings', 'magic-checklists'); ?></h2>
                
                <?php 
                $trigger_type = get_post_meta($tour_id, '_mcl_tour_trigger_type', true) ?: 'page';
                $trigger_value = get_post_meta($tour_id, '_mcl_tour_trigger_value', true) ?: '';
                ?>
                
                <div class="mcl-form-group">
                    <label class="mcl-label"><?php _e('Trigger Location', 'magic-checklists'); ?></label>
                    <div class="mcl-radio-group">
                        <label class="mcl-radio-label">
                            <input type="radio" name="trigger_type" value="page" <?php checked($trigger_type, 'page'); ?>>
                            <?php _e('Specific Page URL', 'magic-checklists'); ?>
                        </label>
                        <div class="mcl-trigger-input" id="trigger-page-input" style="<?php echo $trigger_type !== 'page' ? 'display: none;' : ''; ?>">
                            <select id="trigger-page-template" class="mcl-input" style="margin-bottom: 5px;">
                                <option value=""><?php _e('Select a template or enter custom URL', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/"><?php _e('WordPress Dashboard', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/edit.php"><?php _e('Posts List', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/post-new.php"><?php _e('Add New Post', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/edit.php?post_type=page"><?php _e('Pages List', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/post-new.php?post_type=page"><?php _e('Add New Page', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/themes.php"><?php _e('Themes', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/plugins.php"><?php _e('Plugins', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/users.php"><?php _e('Users', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/options-general.php"><?php _e('General Settings', 'magic-checklists'); ?></option>
                            </select>
                            <input type="text" id="trigger-page" class="mcl-input" 
                                   value="<?php echo $trigger_type === 'page' ? esc_attr($trigger_value) : ''; ?>"
                                   placeholder="<?php _e('e.g., /wp-admin/edit.php', 'magic-checklists'); ?>">
                            <p class="description"><?php _e('Enter the URL where this tour should trigger. Use * for wildcards.', 'magic-checklists'); ?></p>
                        </div>
                        
                        <label class="mcl-radio-label">
                            <input type="radio" name="trigger_type" value="selector" <?php checked($trigger_type, 'selector'); ?>>
                            <?php _e('When CSS Selector Exists', 'magic-checklists'); ?>
                        </label>
                        <div class="mcl-trigger-input" id="trigger-selector-input" style="<?php echo $trigger_type !== 'selector' ? 'display: none;' : ''; ?>">
                            <input type="text" id="trigger-selector" class="mcl-input" 
                                   value="<?php echo $trigger_type === 'selector' ? esc_attr($trigger_value) : ''; ?>"
                                   placeholder="<?php _e('e.g., .my-button, #specific-element', 'magic-checklists'); ?>">
                            <p class="description"><?php _e('Tour will trigger when this CSS selector is found on any page.', 'magic-checklists'); ?></p>
                        </div>
                        
                        <label class="mcl-radio-label">
                            <input type="radio" name="trigger_type" value="first_login" <?php checked($trigger_type, 'first_login'); ?>>
                            <?php _e('User\'s First Login (any page)', 'magic-checklists'); ?>
                        </label>
                        <div class="mcl-trigger-input" id="trigger-first-login-input" style="<?php echo $trigger_type !== 'first_login' ? 'display: none;' : ''; ?>">
                            <p class="description"><?php _e('This tour will trigger on any page for users who have never seen a first-login tour.', 'magic-checklists'); ?></p>
                        </div>
                        
                        <label class="mcl-radio-label">
                            <input type="radio" name="trigger_type" value="any_page" <?php checked($trigger_type, 'any_page'); ?>>
                            <?php _e('Any Page', 'magic-checklists'); ?>
                        </label>
                        <div class="mcl-trigger-input" id="trigger-any-page-input" style="<?php echo $trigger_type !== 'any_page' ? 'display: none;' : ''; ?>">
                            <p class="description"><?php _e('This tour can trigger on any page (use with caution and combine with user conditions).', 'magic-checklists'); ?></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Conditions -->
            <div class="mcl-form-section">
                <h2 class="mcl-section-title"><?php _e('User Conditions', 'magic-checklists'); ?></h2>
                
                <?php 
                $user_condition = get_post_meta($tour_id, '_mcl_tour_user_condition', true) ?: 'all_users';
                $specific_users = get_post_meta($tour_id, '_mcl_tour_specific_users', true) ?: array();
                $specific_roles = get_post_meta($tour_id, '_mcl_tour_specific_roles', true) ?: array();
                ?>
                
                <div class="mcl-form-group">
                    <label class="mcl-label"><?php _e('Who should see this tour?', 'magic-checklists'); ?></label>
                    <div class="mcl-radio-group">
                        <label class="mcl-radio-label">
                            <input type="radio" name="user_condition" value="all_users" <?php checked($user_condition, 'all_users'); ?>>
                            <?php _e('All Users (logged in and logged out)', 'magic-checklists'); ?>
                        </label>
                        
                        <label class="mcl-radio-label">
                            <input type="radio" name="user_condition" value="all_logged_in" <?php checked($user_condition, 'all_logged_in'); ?>>
                            <?php _e('All Logged In Users', 'magic-checklists'); ?>
                        </label>
                        
                        <label class="mcl-radio-label">
                            <input type="radio" name="user_condition" value="all_logged_out" <?php checked($user_condition, 'all_logged_out'); ?>>
                            <?php _e('All Logged Out Users', 'magic-checklists'); ?>
                        </label>
                        
                        <label class="mcl-radio-label">
                            <input type="radio" name="user_condition" value="specific_users" <?php checked($user_condition, 'specific_users'); ?>>
                            <?php _e('Specific Users Only', 'magic-checklists'); ?>
                        </label>
                        <div class="mcl-user-input" id="specific-users-input" style="<?php echo $user_condition !== 'specific_users' ? 'display: none;' : ''; ?>">
                            <select id="specific-users" multiple="multiple" class="mcl-users-select" style="width: 100%;">
                                <?php 
                                $users = get_users(array('number' => 100));
                                foreach ($users as $user) {
                                    $selected = in_array($user->ID, $specific_users) ? 'selected' : '';
                                    echo '<option value="' . esc_attr($user->ID) . '" ' . $selected . '>' . esc_html($user->display_name . ' (' . $user->user_email . ')') . '</option>';
                                }
                                ?>
                            </select>
                            <p class="description"><?php _e('Select specific users who should see this tour.', 'magic-checklists'); ?></p>
                        </div>
                        
                        <label class="mcl-radio-label">
                            <input type="radio" name="user_condition" value="specific_roles" <?php checked($user_condition, 'specific_roles'); ?>>
                            <?php _e('Specific User Roles Only', 'magic-checklists'); ?>
                        </label>
                        <div class="mcl-user-input" id="specific-roles-input" style="<?php echo $user_condition !== 'specific_roles' ? 'display: none;' : ''; ?>">
                            <select id="specific-roles" multiple="multiple" class="mcl-roles-select" style="width: 100%;">
                                <?php 
                                $roles = wp_roles()->get_names();
                                foreach ($roles as $role_key => $role_name) {
                                    $selected = in_array($role_key, $specific_roles) ? 'selected' : '';
                                    echo '<option value="' . esc_attr($role_key) . '" ' . $selected . '>' . esc_html($role_name) . '</option>';
                                }
                                ?>
                            </select>
                            <p class="description"><?php _e('Select user roles that should see this tour.', 'magic-checklists'); ?></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Display Options -->
            <div class="mcl-form-section">
                <h2 class="mcl-section-title"><?php _e('Display Options', 'magic-checklists'); ?></h2>
                
                <div class="mcl-form-group">
                    <div class="mcl-toggle-wrapper">
                        <label class="mcl-toggle-switch">
                            <input type="checkbox" id="tour-autostart" name="autostart" value="1" 
                                   <?php checked(get_post_meta($tour_id, '_mcl_tour_autostart', true)); ?>>
                            <span class="mcl-switch-label"></span>
                        </label>
                        <label for="tour-autostart" class="mcl-label"><?php _e('Auto-start tour when triggered', 'magic-checklists'); ?></label>
                    </div>
                    <p class="description"><?php _e('If enabled, the tour will start automatically when the trigger conditions are met.', 'magic-checklists'); ?></p>
                </div>

                <div class="mcl-form-group">
                    <div class="mcl-toggle-wrapper">
                        <label class="mcl-toggle-switch">
                            <input type="checkbox" id="tour-show-once" name="show_once" value="1" 
                                   <?php checked(get_post_meta($tour_id, '_mcl_tour_show_once', true)); ?>>
                            <span class="mcl-switch-label"></span>
                        </label>
                        <label for="tour-show-once" class="mcl-label"><?php _e('Show only once per user', 'magic-checklists'); ?></label>
                    </div>
                    <p class="description"><?php _e('If checked, each user will only see this tour once. Tracked by user account or browser cookie.', 'magic-checklists'); ?></p>
                </div>
            </div>

            <!-- Appearance & Behavior Settings -->
            <div class="mcl-form-section">
                <h2 class="mcl-section-title">
                    <?php _e('Appearance & Behavior', 'magic-checklists'); ?>
                </h2>
                
                <!-- Animation Settings -->
                <div class="mcl-form-group">
                    <h3 class="mcl-subsection-title"><?php _e('Animation', 'magic-checklists'); ?></h3>
                    <div class="mcl-toggle-wrapper">
                        <label class="mcl-toggle-switch">
                            <input type="checkbox" id="tour-animate" name="animate" value="1" 
                                   <?php checked(!isset($tour_settings['animate']) || $tour_settings['animate'] !== false); ?>>
                            <span class="mcl-switch-label"></span>
                        </label>
                        <label for="tour-animate" class="mcl-label"><?php _e('Enable animated transitions', 'magic-checklists'); ?></label>
                    </div>
                    <p class="description">
                        <?php _e('When enabled, the tour will smoothly animate between steps. Disable for a static, instant appearance.', 'magic-checklists'); ?>
                    </p>
                </div>

                <!-- Progress Settings -->
                <div class="mcl-form-group">
                    <h3 class="mcl-subsection-title"><?php _e('Progress Display', 'magic-checklists'); ?></h3>
                    <div class="mcl-toggle-wrapper">
                        <label class="mcl-toggle-switch">
                            <input type="checkbox" id="tour-show-progress" name="show_progress" value="1" 
                                   <?php checked(!isset($tour_settings['show_progress']) || $tour_settings['show_progress'] !== false); ?>>
                            <span class="mcl-switch-label"></span>
                        </label>
                        <label for="tour-show-progress" class="mcl-label"><?php _e('Show progress indicator', 'magic-checklists'); ?></label>
                    </div>
                    <div class="mcl-form-row" style="margin-top: 10px;">
                        <div class="mcl-form-col">
                            <label for="tour-progress-text" class="mcl-label"><?php _e('Progress Text Template', 'magic-checklists'); ?></label>
                            <input type="text" id="tour-progress-text" name="progress_text" class="mcl-input" 
                                   value="<?php echo esc_attr($tour_settings['progress_text'] ?? '{{current}} of {{total}}'); ?>"
                                   placeholder="{{current}} of {{total}}">
                            <p class="description">
                                <?php _e('Customize the progress text. Use {{current}} for current step and {{total}} for total steps.', 'magic-checklists'); ?>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Exit Control Settings -->
                <div class="mcl-form-group">
                    <h3 class="mcl-subsection-title"><?php _e('Exit Control', 'magic-checklists'); ?></h3>
                    <div class="mcl-toggle-wrapper">
                        <label class="mcl-toggle-switch">
                            <input type="checkbox" id="tour-allow-close" name="allow_close" value="1" 
                                   <?php checked(!isset($tour_settings['allow_close']) || $tour_settings['allow_close'] !== false); ?>>
                            <span class="mcl-switch-label"></span>
                        </label>
                        <label for="tour-allow-close" class="mcl-label"><?php _e('Allow users to close tour', 'magic-checklists'); ?></label>
                    </div>
                    <p class="description">
                        <?php _e('When disabled, users must complete the entire tour before they can exit.', 'magic-checklists'); ?>
                    </p>
                    
                    <div class="mcl-toggle-wrapper" style="margin-top: 15px;">
                        <label class="mcl-toggle-switch">
                            <input type="checkbox" id="tour-confirm-exit" name="confirm_exit" value="1" 
                                   <?php checked(!empty($tour_settings['confirm_exit'])); ?>>
                            <span class="mcl-switch-label"></span>
                        </label>
                        <label for="tour-confirm-exit" class="mcl-label"><?php _e('Show confirmation dialog before exit', 'magic-checklists'); ?></label>
                    </div>
                    <div class="mcl-form-row" style="margin-top: 10px;">
                        <div class="mcl-form-col">
                            <label for="tour-exit-message" class="mcl-label"><?php _e('Exit Confirmation Message', 'magic-checklists'); ?></label>
                            <input type="text" id="tour-exit-message" name="exit_message" class="mcl-input" 
                                   value="<?php echo esc_attr($tour_settings['exit_message'] ?? 'Are you sure you want to exit the tour?'); ?>"
                                   placeholder="Are you sure you want to exit the tour?">
                            <p class="description">
                                <?php _e('Message shown when users try to exit the tour (only when confirmation is enabled).', 'magic-checklists'); ?>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Button Customization -->
                <div class="mcl-form-group">
                    <h3 class="mcl-subsection-title"><?php _e('Button Text', 'magic-checklists'); ?></h3>
                    <div class="mcl-form-row">
                        <div class="mcl-form-col">
                            <label for="tour-next-btn-text" class="mcl-label"><?php _e('Next Button Text', 'magic-checklists'); ?></label>
                            <input type="text" id="tour-next-btn-text" name="next_btn_text" class="mcl-input" 
                                   value="<?php echo esc_attr($tour_settings['next_btn_text'] ?? 'Next'); ?>"
                                   placeholder="Next">
                        </div>
                        <div class="mcl-form-col">
                            <label for="tour-prev-btn-text" class="mcl-label"><?php _e('Previous Button Text', 'magic-checklists'); ?></label>
                            <input type="text" id="tour-prev-btn-text" name="prev_btn_text" class="mcl-input" 
                                   value="<?php echo esc_attr($tour_settings['prev_btn_text'] ?? 'Previous'); ?>"
                                   placeholder="Previous">
                        </div>
                    </div>
                    <div class="mcl-form-row">
                        <div class="mcl-form-col">
                            <label for="tour-done-btn-text" class="mcl-label"><?php _e('Done Button Text', 'magic-checklists'); ?></label>
                            <input type="text" id="tour-done-btn-text" name="done_btn_text" class="mcl-input" 
                                   value="<?php echo esc_attr($tour_settings['done_btn_text'] ?? 'Done'); ?>"
                                   placeholder="Done">
                        </div>
                        <div class="mcl-form-col">
                            <label for="tour-close-btn-text" class="mcl-label"><?php _e('Close Button Text', 'magic-checklists'); ?></label>
                            <input type="text" id="tour-close-btn-text" name="close_btn_text" class="mcl-input" 
                                   value="<?php echo esc_attr($tour_settings['close_btn_text'] ?? 'Close'); ?>"
                                   placeholder="Close">
                        </div>
                    </div>
                    <p class="description">
                        <?php _e('Customize the text displayed on tour navigation buttons.', 'magic-checklists'); ?>
                    </p>
                </div>

                <!-- Default Button Configuration -->
                <div class="mcl-form-group">
                    <h3 class="mcl-subsection-title"><?php _e('Default Buttons to Show', 'magic-checklists'); ?></h3>
                    <div class="mcl-checkbox-group">
                        <label class="mcl-checkbox-label">
                            <input type="checkbox" name="default_buttons[]" value="next" 
                                   <?php checked(in_array('next', $tour_settings['default_buttons'] ?? ['next', 'previous', 'close'])); ?>>
                            <?php _e('Next button', 'magic-checklists'); ?>
                        </label>
                        <label class="mcl-checkbox-label">
                            <input type="checkbox" name="default_buttons[]" value="previous" 
                                   <?php checked(in_array('previous', $tour_settings['default_buttons'] ?? ['next', 'previous', 'close'])); ?>>
                            <?php _e('Previous button', 'magic-checklists'); ?>
                        </label>
                        <label class="mcl-checkbox-label">
                            <input type="checkbox" name="default_buttons[]" value="close" 
                                   <?php checked(in_array('close', $tour_settings['default_buttons'] ?? ['next', 'previous', 'close'])); ?>>
                            <?php _e('Close button', 'magic-checklists'); ?>
                        </label>
                    </div>
                    <p class="description"><?php _e('Select which buttons should be shown by default on each tour step. Individual steps can override these settings.', 'magic-checklists'); ?></p>
                </div>

                <!-- Overlay Settings -->
                <div class="mcl-form-group">
                    <h3 class="mcl-subsection-title"><?php _e('Overlay Style', 'magic-checklists'); ?></h3>
                    <div class="mcl-form-row">
                        <div class="mcl-form-col">
                            <label for="tour-overlay-color" class="mcl-label"><?php _e('Overlay Color', 'magic-checklists'); ?></label>
                            <div class="mcl-color-input-wrapper">
                                <input type="color" id="tour-overlay-color" name="overlay_color" class="mcl-color-input" 
                                       value="<?php echo esc_attr($tour_settings['overlay_color'] ?? '#000000'); ?>">
                                <input type="text" id="tour-overlay-color-text" class="mcl-input mcl-color-text" 
                                       value="<?php echo esc_attr($tour_settings['overlay_color'] ?? '#000000'); ?>"
                                       placeholder="#000000">
                            </div>
                        </div>
                        <div class="mcl-form-col">
                            <label for="tour-overlay-opacity" class="mcl-label"><?php _e('Overlay Opacity', 'magic-checklists'); ?></label>
                            <div class="mcl-range-input-wrapper">
                                <input type="range" id="tour-overlay-opacity" name="overlay_opacity" class="mcl-range-input" 
                                       min="0" max="1" step="0.1" value="<?php echo esc_attr($tour_settings['overlay_opacity'] ?? '0.75'); ?>">
                                <span class="mcl-range-value"><?php echo esc_html($tour_settings['overlay_opacity'] ?? '0.75'); ?></span>
                            </div>
                        </div>
                    </div>
                    <p class="description">
                        <?php _e('Customize the background overlay that appears behind the tour popover.', 'magic-checklists'); ?>
                    </p>
                </div>

                <!-- Popover Styling -->
                <div class="mcl-form-group">
                    <h3 class="mcl-subsection-title"><?php _e('Popover Style', 'magic-checklists'); ?></h3>
                    <div class="mcl-form-row">
                        <div class="mcl-form-col">
                            <label for="tour-popover-class" class="mcl-label"><?php _e('Custom CSS Class', 'magic-checklists'); ?></label>
                            <input type="text" id="tour-popover-class" name="popover_class" class="mcl-input" 
                                   value="<?php echo esc_attr($tour_settings['popover_class'] ?? ''); ?>"
                                   placeholder="my-custom-tour-theme">
                            <p class="description">
                                <?php _e('Add a custom CSS class to style the popover. Leave empty for default styling.', 'magic-checklists'); ?>
                                <?php _e('Try: mcl-theme-dark, mcl-theme-primary, mcl-theme-minimal, mcl-theme-rounded, or mcl-theme-large.', 'magic-checklists'); ?>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Advanced Settings -->
                <div class="mcl-form-group">
                    <h3 class="mcl-subsection-title"><?php _e('Advanced Options', 'magic-checklists'); ?></h3>
                    <div class="mcl-form-row">
                        <div class="mcl-form-col">
                            <label for="tour-padding" class="mcl-label"><?php _e('Highlight Padding', 'magic-checklists'); ?></label>
                            <input type="number" id="tour-padding" name="padding" class="mcl-input" 
                                   value="<?php echo esc_attr($tour_settings['padding'] ?? '4'); ?>" min="0" max="50">
                            <p class="description"><?php _e('Padding around highlighted elements in pixels.', 'magic-checklists'); ?></p>
                        </div>
                        <div class="mcl-form-col">
                            <label for="tour-smooth-scroll" class="mcl-label"><?php _e('Smooth Scroll', 'magic-checklists'); ?></label>
                            <div class="mcl-toggle-wrapper">
                                <label class="mcl-toggle-switch">
                                    <input type="checkbox" id="tour-smooth-scroll" name="smooth_scroll" value="1" 
                                           <?php checked(!isset($tour_settings['smooth_scroll']) || $tour_settings['smooth_scroll'] !== false); ?>>
                                    <span class="mcl-switch-label"></span>
                                </label>
                            </div>
                            <p class="description"><?php _e('Enable smooth scrolling to highlighted elements.', 'magic-checklists'); ?></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Current Steps -->
            <?php if (!empty($tour_steps)): ?>
            <div class="mcl-form-section">
                <h2 class="mcl-section-title">
                    <?php echo sprintf(_n('%d Tour Step', '%d Tour Steps', count($tour_steps), 'magic-checklists'), count($tour_steps)); ?>
                    <span class="mcl-steps-info"><?php _e('(drag to reorder)', 'magic-checklists'); ?></span>
                </h2>
                <div class="mcl-steps-list-container">
                    <ul class="mcl-steps-list" id="mcl-admin-steps-list">
                        <?php foreach ($tour_steps as $index => $step): ?>
                            <?php if (is_array($step) && !empty($step)): ?>
                            <li class="mcl-admin-step-item" data-step-index="<?php echo $index; ?>">
                                <div class="mcl-drag-handle">
                                    <span class="dashicons dashicons-move"></span>
                                </div>
                                <div class="mcl-step-content">
                                    <span class="mcl-step-indicator"><?php echo ($index + 1) . '.'; ?></span>
                                    <div class="mcl-step-details">
                                        <strong><?php echo esc_html(isset($step['title']) && $step['title'] ? $step['title'] : sprintf(__('Step %d', 'magic-checklists'), $index + 1)); ?></strong>
                                        <?php if (!empty($step['element'])): ?>
                                            <code><?php echo esc_html($step['element']); ?></code>
                                        <?php endif; ?>
                                        <?php if (!empty($step['page_url'])): ?>
                                            <div class="mcl-step-page-url"><?php echo esc_html($step['page_url']); ?></div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </li>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </ul>
                </div>
            </div>
            <?php else: ?>
            <div class="mcl-form-section">
                <h2 class="mcl-section-title"><?php _e('Tour Steps', 'magic-checklists'); ?></h2>
                <div class="mcl-empty-steps">
                    <div class="mcl-empty-state">
                        <span class="dashicons dashicons-location-alt"></span>
                        <p><?php _e('No steps have been created yet. Use the visual tour creator to add interactive steps to your tour.', 'magic-checklists'); ?></p>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <!-- Action Buttons -->
            <div class="mcl-form-section mcl-settings-actions">
                <div class="mcl-form-actions">
                    <button type="button" class="mcl-button mcl-button-primary" id="mcl-save-and-create">
                        <span class="dashicons dashicons-edit"></span>
                        <?php _e('Save & Open Visual Tour Creator', 'magic-checklists'); ?>
                    </button>
                    <button type="button" class="mcl-button mcl-button-secondary" id="mcl-save-settings">
                        <?php _e('Save Settings Only', 'magic-checklists'); ?>
                    </button>
                    <?php if ($tour_id && !empty($tour_steps)): ?>
                    <button type="button" class="mcl-button mcl-button-secondary" id="mcl-reset-completion">
                        <span class="dashicons dashicons-update"></span>
                        <?php _e('Reset My Completion', 'magic-checklists'); ?>
                    </button>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Instructions Sidebar -->
        <div class="mcl-tour-settings-sidebar">
            <div class="mcl-sidebar-box">
                <h3><?php _e('Getting Started', 'magic-checklists'); ?></h3>
                <div class="mcl-steps-guide">
                    <div class="mcl-guide-step">
                        <span class="mcl-step-number">1</span>
                        <div class="mcl-step-content">
                            <h4><?php _e('Configure Settings', 'magic-checklists'); ?></h4>
                            <p><?php _e('Set up the basic information, trigger conditions, and customize the appearance.', 'magic-checklists'); ?></p>
                        </div>
                    </div>
                    <div class="mcl-guide-step">
                        <span class="mcl-step-number">2</span>
                        <div class="mcl-step-content">
                            <h4><?php _e('Add Tour Steps', 'magic-checklists'); ?></h4>
                            <p><?php _e('Use the visual tour creator to add interactive steps by clicking on elements.', 'magic-checklists'); ?></p>
                        </div>
                    </div>
                    <div class="mcl-guide-step">
                        <span class="mcl-step-number">3</span>
                        <div class="mcl-step-content">
                            <h4><?php _e('Preview & Test', 'magic-checklists'); ?></h4>
                            <p><?php _e('Use the preview feature to test your tour and make adjustments.', 'magic-checklists'); ?></p>
                        </div>
                    </div>
                    <div class="mcl-guide-step">
                        <span class="mcl-step-number">4</span>
                        <div class="mcl-step-content">
                            <h4><?php _e('Test & Activate', 'magic-checklists'); ?></h4>
                            <p><?php _e('Preview your tour, make adjustments, then activate it for your users.', 'magic-checklists'); ?></p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mcl-tips-box">
                <h3><?php _e('Pro Tips', 'magic-checklists'); ?></h3>
                <ul>
                    <li><?php _e('Use descriptive titles for each step', 'magic-checklists'); ?></li>
                    <li><?php _e('Test your tour on different screen sizes', 'magic-checklists'); ?></li>
                    <li><?php _e('Keep steps concise and actionable', 'magic-checklists'); ?></li>
                    <li><?php _e('Use the preview feature to test the flow', 'magic-checklists'); ?></li>
                    <li><?php _e('Customize colors and styles to match your brand', 'magic-checklists'); ?></li>
                    <li><?php _e('Consider disabling animations on slower devices', 'magic-checklists'); ?></li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Hidden inputs -->
    <input type="hidden" id="tour-id" value="<?php echo $tour_id; ?>">
</div>

<style>
.mcl-tour-settings-container {
    display: flex;
    gap: 30px;
    margin-top: 20px;
}

.mcl-tour-settings-main {
    flex: 2;
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
}

.mcl-tour-settings-sidebar {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: sticky;
    top: 64px; /* WordPress admin bar height */
    align-self: flex-start;
    max-height: calc(100vh - 64px);
    overflow-y: auto;
}

.mcl-subsection-title {
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: 600;
    color: #2563eb;
    border-left: 3px solid #f2da22;
    padding-left: 12px;
}

.mcl-form-group p.description {
    font-size: 16px;
    color: rgb(214, 214, 214);
    line-height: 1.4;
}

.mcl-form-group {
    margin-bottom: 24px;
}

.mcl-form-group:last-child {
    margin-bottom: 0;
}

.mcl-input, .mcl-textarea {
    width: 100%;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s ease;
    background: #fff;
}

.mcl-input:focus, .mcl-textarea:focus {
    outline: none;
    border-color: #f2da22;
    box-shadow: 0 0 0 3px rgba(242, 218, 34, 0.1);
}

.mcl-form-row {
    display: flex;
    gap: 20px;
}

.mcl-form-col {
    flex: 1;
}

.mcl-radio-group, .mcl-checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.mcl-radio-label, .mcl-checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: #fff;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: background-color 0.2s ease;
}

.mcl-radio-label:hover, .mcl-checkbox-label:hover {
    background-color: var(--mcl-accent);
    color: var(--mcl-primary);
}

.mcl-trigger-input, .mcl-user-input {
    margin-left: 24px;
    margin-top: 8px;
}

.mcl-color-input-wrapper {
    display: flex;
    gap: 10px;
    align-items: center;
}

.mcl-color-input {
    width: 50px;
    height: 40px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
}

.mcl-color-text {
    flex: 1;
}

.mcl-range-input-wrapper {
    display: flex;
    gap: 10px;
    align-items: center;
}

.mcl-range-input {
    flex: 1;
}

.mcl-range-value {
    min-width: 50px;
    font-weight: 500;
    color: #374151;
}

.mcl-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    border-radius: 8px;
}

.mcl-loading-content {
    text-align: center;
    color: #374151;
    font-weight: 500;
}

.mcl-spin {
    animation: mcl-spin 1s linear infinite;
}

@keyframes mcl-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.mcl-settings-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-top: 2px solid #f1f5f9;
    border-radius: 8px;
}

.mcl-form-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 0;
    justify-content: start;
}

.mcl-sidebar-box, .mcl-tips-box {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mcl-sidebar-box h3, .mcl-tips-box h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
}

.mcl-guide-step {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
}

.mcl-step-number {
    background: #f2da22;
    color: #011326;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 12px;
    flex-shrink: 0;
    margin-top: 2px;
}

.mcl-guide-step .mcl-step-content h4 {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
}

.mcl-guide-step .mcl-step-content p {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
    line-height: 1.4;
}

.mcl-tips-box ul {
    margin: 0;
    padding-left: 20px;
}

.mcl-tips-box li {
    margin-bottom: 8px;
    font-size: 13px;
    color: #6b7280;
    line-height: 1.4;
}

.mcl-empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #6b7280;
}

.mcl-empty-state .dashicons {
    font-size: 48px;
    color: #cbd5e1;
    margin-bottom: 16px;
}

.mcl-steps-list-container {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #f8fafc;
    padding: 12px;
}

.mcl-steps-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.mcl-admin-step-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: move;
    transition: all 0.2s ease;
}

.mcl-admin-step-item:hover {
    border-color: #f2da22;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mcl-drag-handle {
    color: #9ca3af;
    cursor: grab;
}

.mcl-drag-handle:active {
    cursor: grabbing;
}

.mcl-step-indicator {
    background: #f2da22;
    color: #011326;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 12px;
    flex-shrink: 0;
}

.mcl-admin-step-item .mcl-step-content {
    flex: 1;
}

.mcl-step-details strong {
    display: block;
    color: #1a1a1a;
    margin-bottom: 4px;
}

.mcl-step-details code {
    background: #f1f5f9;
    color: #64748b;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    margin-right: 8px;
}

.mcl-step-page-url {
    font-size: 12px;
    color: #3b82f6;
    font-style: italic;
    margin-top: 4px;
}

.mcl-steps-info {
    font-size: 12px;
    color: #6b7280;
    font-weight: 400;
    font-style: italic;
}

.mcl-required {
    color: #dc2626;
}

.description {
    margin: 6px 0 0 0;
    font-size: 12px;
    color: #6b7280;
    line-height: 1.4;
}

.description a {
    color: #3b82f6;
    text-decoration: none;
}

.description a:hover {
    text-decoration: underline;
}

/* Responsive design */
@media (max-width: 768px) {
    .mcl-tour-settings-container {
        flex-direction: column;
    }
    
    .mcl-form-row {
        flex-direction: column;
        gap: 0;
    }
    
    .mcl-form-actions {
        justify-content: center;
    }
    
    .mcl-color-input-wrapper,
    .mcl-range-input-wrapper {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>

<script>
jQuery(document).ready(function($) {
    const tourId = parseInt($('#tour-id').val()) || 0;
    
    // Initialize Choices.js for user/role selectors
    initMultiSelects();
    
    // Initialize sortable for steps
    initializeStepsSortable();

    function initMultiSelects() {
        const multiSelectElements = document.querySelectorAll('.mcl-users-select, .mcl-roles-select');

        multiSelectElements.forEach((element) => {
            if (element) {
                const choices = new Choices(element, {
                    removeItemButton: true,
                    searchResultLimit: 20,
                    shouldSort: false,
                    placeholder: true,
                    placeholderValue: 'Click here to search and select',
                    searchPlaceholderValue: 'Type to search...',
                });
                
                // Store the Choices instance on the element for later access
                element.choices = choices;
            }
        });
    }

    function showNotification(message, type = 'success') {
        const notification = $('<div class="notice notice-' + type + ' is-dismissible"><p>' + message + '</p></div>');
        $('.mcl-wrap').prepend(notification);
        
        setTimeout(function() {
            notification.fadeOut(function() {
                $(this).remove();
            });
        }, 5000);
    }
    
    function showLoading(text = '<?php _e('Saving...', 'magic-checklists'); ?>') {
        $('#mcl-loading-overlay .mcl-loading-text').text(text);
        $('#mcl-loading-overlay').show();
    }
    
    function hideLoading() {
        $('#mcl-loading-overlay').hide();
    }
    
    function initializeStepsSortable() {
        const stepsList = document.getElementById('mcl-admin-steps-list');
        if (!stepsList || typeof Sortable === 'undefined') return;
        
        new Sortable(stepsList, {
            handle: '.mcl-drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: function(evt) {
                if (evt.oldIndex !== evt.newIndex) {
                    updateStepNumbers();
                    handleStepsReorder();
                }
            }
        });
    }
    
    function updateStepNumbers() {
        $('#mcl-admin-steps-list .mcl-step-indicator').each(function(index) {
            $(this).text((index + 1) + '.');
        });
    }
    
    function handleStepsReorder() {
        const stepItems = $('#mcl-admin-steps-list .mcl-admin-step-item');
        const newOrder = [];
        
        stepItems.each(function() {
            const stepIndex = parseInt($(this).data('step-index'));
            if (!isNaN(stepIndex)) {
                newOrder.push(stepIndex);
            }
        });

        // Update data-step-index attributes
        stepItems.each(function(newIndex) {
            $(this).data('step-index', newIndex);
            $(this).attr('data-step-index', newIndex);
        });

        // Save to server
        saveStepsOrder(newOrder);
    }
    
    function saveStepsOrder(newOrder) {
        $.post(ajaxurl, {
            action: 'mcl_reorder_tour_steps',
            tour_id: tourId,
            step_order: newOrder,
            nonce: '<?php echo wp_create_nonce('mcl_tour_admin'); ?>'
        }, function(response) {
            if (!response.success) {
                console.error('Failed to save step order:', response.data);
                showNotification('<?php _e('Failed to save step order.', 'magic-checklists'); ?>', 'error');
            }
        }).fail(function() {
            showNotification('<?php _e('Error saving step order.', 'magic-checklists'); ?>', 'error');
        });
    }
    
    // Handle trigger type changes
    $('input[name="trigger_type"]').on('change', function() {
        $('.mcl-trigger-input').hide();
        const selectedType = $(this).val();
        $('#trigger-' + selectedType + '-input').show();
    });
    
    // Handle user condition changes
    $('input[name="user_condition"]').on('change', function() {
        $('.mcl-user-input').hide();
        const selectedCondition = $(this).val();
        $('#' + selectedCondition.replace('_', '-') + '-input').show();
    });
    
    // Handle page template selection
    $('#trigger-page-template').on('change', function() {
        const selectedTemplate = $(this).val();
        if (selectedTemplate) {
            $('#trigger-page').val(selectedTemplate);
        }
    });
    
    // Color picker synchronization
    $('#tour-overlay-color').on('input', function() {
        $('#tour-overlay-color-text').val($(this).val());
    });
    
    $('#tour-overlay-color-text').on('input', function() {
        const colorValue = $(this).val();
        if (/^#[0-9A-F]{6}$/i.test(colorValue)) {
            $('#tour-overlay-color').val(colorValue);
        }
    });
    
    // Range input value display
    $('#tour-overlay-opacity').on('input', function() {
        $('.mcl-range-value').text($(this).val());
    });
    
    // Save and create button
    $('#mcl-save-and-create').on('click', function() {
        saveTourSettings().then(function(savedTourId) {
            if (savedTourId) {
                showLoading('<?php _e('Opening tour creator...', 'magic-checklists'); ?>');
                // Redirect to dashboard with tour creator mode
                window.location.href = '<?php echo admin_url(); ?>' + '?mcl_tour_mode=1&tour_id=' + savedTourId;
            }
        }).catch(function() {
            hideLoading();
        });
    });
    
    // Save settings only button
    $('#mcl-save-settings').on('click', function() {
        saveTourSettings().then(function() {
            showNotification('<?php _e('Tour settings saved successfully!', 'magic-checklists'); ?>');
        });
    });
    
    // Reset completion button
    $('#mcl-reset-completion').on('click', function() {
        if (!confirm('<?php _e('Are you sure you want to reset your completion status for this tour?', 'magic-checklists'); ?>')) {
            return;
        }
        
        $.post(ajaxurl, {
            action: 'mcl_reset_tour_completion',
            tour_id: tourId,
            nonce: '<?php echo wp_create_nonce('mcl_tour_admin'); ?>'
        }, function(response) {
            if (response.success) {
                showNotification('<?php _e('Tour completion reset successfully!', 'magic-checklists'); ?>');
            } else {
                showNotification('<?php _e('Error resetting tour completion.', 'magic-checklists'); ?>', 'error');
            }
        }).fail(function() {
            showNotification('<?php _e('Error resetting tour completion.', 'magic-checklists'); ?>', 'error');
        });
    });

    function getTriggerValue() {
        const triggerType = $('input[name="trigger_type"]:checked').val();
        switch (triggerType) {
            case 'page':
                return $('#trigger-page').val();
            case 'selector':
                return $('#trigger-selector').val();
            case 'first_login':
            case 'any_page':
            default:
                return '';
        }
    }
    
    function saveTourSettings() {
        return new Promise(function(resolve, reject) {
            // Get trigger data
            const triggerType = $('input[name="trigger_type"]:checked').val();
            const triggerValue = getTriggerValue();
            
            // Get user condition data
            const userCondition = $('input[name="user_condition"]:checked').val();
            let specificUsers = [];
            let specificRoles = [];
            
            if (userCondition === 'specific_users') {
                const usersSelect = document.getElementById('specific-users');
                if (usersSelect && usersSelect.choices) {
                    specificUsers = usersSelect.choices.getValue().map(choice => choice.value);
                } else {
                    specificUsers = $('#specific-users').val() || [];
                }
            } else if (userCondition === 'specific_roles') {
                const rolesSelect = document.getElementById('specific-roles');
                if (rolesSelect && rolesSelect.choices) {
                    specificRoles = rolesSelect.choices.getValue().map(choice => choice.value);
                } else {
                    specificRoles = $('#specific-roles').val() || [];
                }
            }
            
            // Build settings object with all the new appearance options
            const settings = {};
            if ($('#tour-active').is(':checked')) settings.active = true;
            if ($('#tour-autostart').is(':checked')) settings.autostart = true;
            if ($('#tour-show-once').is(':checked')) settings.show_once = true;
            
            // Animation settings
            settings.animate = $('#tour-animate').is(':checked');
            
            // Progress settings
            settings.show_progress = $('#tour-show-progress').is(':checked');
            settings.progress_text = $('#tour-progress-text').val() || '{{current}} of {{total}}';
            
            // Exit control settings
            settings.allow_close = $('#tour-allow-close').is(':checked');
            settings.confirm_exit = $('#tour-confirm-exit').is(':checked');
            settings.exit_message = $('#tour-exit-message').val() || 'Are you sure you want to exit the tour?';
            
            // Button text settings
            settings.next_btn_text = $('#tour-next-btn-text').val() || 'Next';
            settings.prev_btn_text = $('#tour-prev-btn-text').val() || 'Previous';
            settings.done_btn_text = $('#tour-done-btn-text').val() || 'Done';
            settings.close_btn_text = $('#tour-close-btn-text').val() || 'Close';
            
            // Default buttons
            settings.default_buttons = [];
            $('input[name="default_buttons[]"]:checked').each(function() {
                settings.default_buttons.push($(this).val());
            });
            
            // Overlay settings
            settings.overlay_color = $('#tour-overlay-color').val() || '#000000';
            settings.overlay_opacity = parseFloat($('#tour-overlay-opacity').val()) || 0.75;
            
            // Popover settings
            settings.popover_class = $('#tour-popover-class').val() || '';
            
            // Advanced settings
            settings.padding = parseInt($('#tour-padding').val()) || 4;
            settings.smooth_scroll = $('#tour-smooth-scroll').is(':checked');
            
            showLoading();
            
            const formData = {
                action: 'mcl_save_tour_settings',
                tour_id: tourId,
                title: $('#tour-title').val().trim(),
                description: $('#tour-description').val().trim(),
                settings: settings,
                trigger_type: triggerType,
                trigger_value: triggerValue,
                user_condition: userCondition,
                specific_users: specificUsers,
                specific_roles: specificRoles,
                nonce: '<?php echo wp_create_nonce('mcl_tour_admin'); ?>'
            };
            
            $.post(ajaxurl, formData, function(response) {
                hideLoading();
                if (response.success) {
                    // Update tour ID if it was newly created
                    if (response.data.tour_id && !tourId) {
                        $('#tour-id').val(response.data.tour_id);
                        // Update URL to show edit mode
                        const newUrl = new URL(window.location);
                        newUrl.searchParams.set('edit', response.data.tour_id);
                        newUrl.searchParams.delete('create');
                        window.history.replaceState({}, '', newUrl);
                    }
                    resolve(response.data.tour_id);
                } else {
                    showNotification('<?php _e('Error saving tour settings: ', 'magic-checklists'); ?>' + (response.data || '<?php _e('Unknown error', 'magic-checklists'); ?>'), 'error');
                    reject();
                }
            }).fail(function() {
                hideLoading();
                showNotification('<?php _e('Error saving tour settings. Please try again.', 'magic-checklists'); ?>', 'error');
                reject();
            });
        });
    }
});
</script>
