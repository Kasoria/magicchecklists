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
                <a href="<?php echo admin_url('admin.php?page=mcl_tours'); ?>" class="mcl-button mcl-button-secondary">
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
                            <input type="text" id="trigger-page-url" class="mcl-input" 
                                   value="<?php echo $trigger_type === 'page' ? esc_attr($trigger_value) : ''; ?>"
                                   placeholder="<?php _e('e.g., /wp-admin/admin.php?page=my-page or use * for wildcards', 'magic-checklists'); ?>">
                            <select id="common-pages" class="mcl-select" style="margin-top: 8px;">
                                <option value=""><?php _e('Or select a common page...', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/"><?php _e('WordPress Dashboard', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/edit.php"><?php _e('Posts List', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/post-new.php"><?php _e('Add New Post', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/edit.php?post_type=page"><?php _e('Pages List', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/post-new.php?post_type=page"><?php _e('Add New Page', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/themes.php"><?php _e('Themes', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/plugins.php"><?php _e('Plugins', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/users.php"><?php _e('Users', 'magic-checklists'); ?></option>
                                <option value="/wp-admin/options-general.php"><?php _e('General Settings', 'magic-checklists'); ?></option>
                                <option value="/"><?php _e('Homepage (Frontend)', 'magic-checklists'); ?></option>
                            </select>
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
                            <?php _e('Specific Users', 'magic-checklists'); ?>
                        </label>
                        <div class="mcl-user-input" id="specific-users-input" style="<?php echo $user_condition !== 'specific_users' ? 'display: none;' : ''; ?>">
                            <select id="specific-users" class="mcl-select" multiple style="min-height: 100px;">
                                <?php
                                $users = get_users(array('orderby' => 'display_name'));
                                foreach ($users as $user) {
                                    $selected = in_array($user->ID, $specific_users) ? 'selected' : '';
                                    echo '<option value="' . $user->ID . '" ' . $selected . '>' . esc_html($user->display_name . ' (' . $user->user_login . ')') . '</option>';
                                }
                                ?>
                            </select>
                            <p class="description"><?php _e('Hold Ctrl/Cmd to select multiple users.', 'magic-checklists'); ?></p>
                        </div>
                        
                        <label class="mcl-radio-label">
                            <input type="radio" name="user_condition" value="specific_roles" <?php checked($user_condition, 'specific_roles'); ?>>
                            <?php _e('Specific User Roles', 'magic-checklists'); ?>
                        </label>
                        <div class="mcl-role-input" id="specific-roles-input" style="<?php echo $user_condition !== 'specific_roles' ? 'display: none;' : ''; ?>">
                            <select id="specific-roles" class="mcl-select" multiple style="min-height: 100px;">
                                <?php
                                global $wp_roles;
                                foreach ($wp_roles->roles as $role_key => $role) {
                                    $selected = in_array($role_key, $specific_roles) ? 'selected' : '';
                                    echo '<option value="' . $role_key . '" ' . $selected . '>' . esc_html($role['name']) . '</option>';
                                }
                                ?>
                            </select>
                            <p class="description"><?php _e('Hold Ctrl/Cmd to select multiple roles.', 'magic-checklists'); ?></p>
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
            <div class="mcl-instructions-box">
                <h3><?php _e('How to Create Tours', 'magic-checklists'); ?></h3>
                <div class="mcl-instruction-steps">
                    <div class="mcl-instruction-step">
                        <span class="mcl-step-number">1</span>
                        <div class="mcl-step-content">
                            <h4><?php _e('Configure Tour Settings', 'magic-checklists'); ?></h4>
                            <p><?php _e('Set up the basic information and behavior for your tour using the form on the left.', 'magic-checklists'); ?></p>
                        </div>
                    </div>
                    <div class="mcl-instruction-step">
                        <span class="mcl-step-number">2</span>
                        <div class="mcl-step-content">
                            <h4><?php _e('Open Visual Creator', 'magic-checklists'); ?></h4>
                            <p><?php _e('Click "Save & Open Visual Tour Creator" to start adding steps to your tour.', 'magic-checklists'); ?></p>
                        </div>
                    </div>
                    <div class="mcl-instruction-step">
                        <span class="mcl-step-number">3</span>
                        <div class="mcl-step-content">
                            <h4><?php _e('Select Elements', 'magic-checklists'); ?></h4>
                            <p><?php _e('In the visual creator, click on page elements to create tour steps for them.', 'magic-checklists'); ?></p>
                        </div>
                    </div>
                    <div class="mcl-instruction-step">
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
    max-width: 350px;
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
    border-radius: 4px;
}

.mcl-loading-content {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #646970;
}

.mcl-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.mcl-required {
    color: #d63638;
}

.mcl-steps-info {
    font-size: 12px;
    font-weight: normal;
    color: #646970;
    margin-left: 8px;
}

.mcl-steps-list {
    background: #f9f9f9;
    padding: 15px;
    border-radius: 4px;
    list-style: none;
    margin: 0;
    border: 1px solid #e0e0e0;
}

.mcl-admin-step-item {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    margin-bottom: 8px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: move;
    transition: all 0.2s ease;
}

.mcl-admin-step-item:hover {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.mcl-admin-step-item:last-child {
    margin-bottom: 0;
}

.mcl-drag-handle {
    color: #a7aaad;
    font-size: 14px;
    cursor: grab;
    user-select: none;
    flex-shrink: 0;
    padding: 4px;
    border-radius: 3px;
    transition: all 0.2s ease;
}

.mcl-drag-handle:active {
    cursor: grabbing;
}

.mcl-admin-step-item:hover .mcl-drag-handle {
    color: #2271b1;
    background: #f0f6fc;
}

.mcl-admin-step-item.sortable-ghost {
    opacity: 0.5;
}

.mcl-admin-step-item.sortable-drag {
    transform: rotate(2deg);
    opacity: 0.8;
}

.mcl-step-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.mcl-step-indicator {
    color: #2271b1;
    font-weight: 600;
    min-width: 24px;
    text-align: center;
    background: #e7f3ff;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
}

.mcl-step-details {
    flex: 1;
}

.mcl-step-details strong {
    display: block;
    margin-bottom: 4px;
    font-size: 14px;
    color: #1d2327;
}

.mcl-steps-list code {
    background: #e1e1e1;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    margin-right: 8px;
    color: #646970;
}

.mcl-step-page-url {
    font-size: 11px;
    color: #646970;
    font-style: italic;
    margin-top: 2px;
}

.mcl-trigger-input,
.mcl-user-input,
.mcl-role-input {
    background: #f9f9f9;
    padding: 15px;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    margin-top: 10px;
}

.mcl-radio-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.mcl-radio-group .mcl-radio-label {
    margin-bottom: 12px;
    color:rgb(220, 220, 220);
}

.mcl-empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #646970;
}

.mcl-empty-state .dashicons {
    font-size: 48px;
    width: 48px;
    height: 48px;
    margin-bottom: 15px;
    color: #c3c4c7;
}

.mcl-instructions-box,
.mcl-tips-box {
    background: #fff;
    border: 1px solid #c3c4c7;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 20px;
}

.mcl-instructions-box h3,
.mcl-tips-box h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #2271b1;
    font-size: 16px;
}

.mcl-instruction-step {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 20px;
}

.mcl-instruction-step:last-child {
    margin-bottom: 0;
}

.mcl-step-number {
    background: #2271b1;
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    flex-shrink: 0;
}

.mcl-step-content h4 {
    margin: 0 0 5px 0;
    font-size: 14px;
    color: #1d2327;
}

.mcl-step-content p {
    margin: 0;
    font-size: 13px;
    color: #646970;
    line-height: 1.4;
}

.mcl-tips-box ul {
    margin: 0;
    padding-left: 20px;
}

.mcl-tips-box li {
    margin-bottom: 8px;
    font-size: 13px;
    color: #646970;
}

.mcl-tips-box li:last-child {
    margin-bottom: 0;
}

.mcl-settings-actions {
    border-top: 1px solid #e2e8f0;
    background: #f8f9fa;
    margin: 0 -20px -20px -20px;
    padding: 20px;
    border-radius: 0 0 4px 4px;
}

.mcl-form-group .description {
    color:rgb(220, 220, 220);
}

@media (max-width: 1024px) {
    .mcl-tour-settings-container {
        flex-direction: column;
    }
    
    .mcl-tour-settings-sidebar {
        max-width: none;
    }
}

@media (max-width: 768px) {
    .mcl-admin-step-item {
        padding: 10px;
        gap: 8px;
    }
    
    .mcl-step-details strong {
        font-size: 13px;
    }
    
    .mcl-instruction-step {
        gap: 10px;
    }
    
    .mcl-step-number {
        width: 20px;
        height: 20px;
        font-size: 11px;
    }
}
</style>

<script>
jQuery(document).ready(function($) {
    const tourId = $('#tour-id').val();
    
    // Initialize sortable if we have steps
    initializeStepsSortable();
    
    // Form validation
    function validateForm() {
        let isValid = true;
        const title = $('#tour-title').val().trim();
        
        // Clear previous errors
        $('.mcl-input-error').removeClass('mcl-input-error');
        
        if (!title) {
            $('#tour-title').addClass('mcl-input-error');
            showNotification('<?php _e('Tour title is required.', 'magic-checklists'); ?>', 'error');
            isValid = false;
        }
        
        return isValid;
    }
    
    function showNotification(message, type = 'success') {
        const notification = $('<div class="notice notice-' + type + ' is-dismissible"><p>' + message + '</p></div>');
        $('.mcl-wrap .mcl-header').after(notification);
        
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
        const triggerType = $(this).val();
        $('#trigger-' + triggerType + '-input').show();
    });
    
    // Handle user condition changes
    $('input[name="user_condition"]').on('change', function() {
        $('.mcl-user-input, .mcl-role-input').hide();
        const userCondition = $(this).val();
        if (userCondition === 'specific_users') {
            $('#specific-users-input').show();
        } else if (userCondition === 'specific_roles') {
            $('#specific-roles-input').show();
        }
    });
    
    // Common pages dropdown
    $('#common-pages').on('change', function() {
        if ($(this).val()) {
            $('#trigger-page-url').val($(this).val());
            $(this).val('');
        }
    });
    
    // Save and create button
    $('#mcl-save-and-create').on('click', function() {
        if (!validateForm()) return;
        
        showLoading('<?php _e('Saving & Opening Creator...', 'magic-checklists'); ?>');
        
        saveTourSettings().then(function(savedTourId) {
            // Redirect to visual creator
            window.location.href = '<?php echo admin_url("index.php"); ?>?mcl_tour_mode=1&tour_id=' + savedTourId;
        }).catch(function(error) {
            hideLoading();
            console.error('Error saving tour:', error);
            showNotification('<?php _e('Error saving tour settings. Please try again.', 'magic-checklists'); ?>', 'error');
        });
    });
    
    // Save settings only button
    $('#mcl-save-settings').on('click', function() {
        if (!validateForm()) return;
        
        showLoading();
        
        saveTourSettings().then(function() {
            hideLoading();
            showNotification('<?php _e('Tour settings saved successfully!', 'magic-checklists'); ?>');
        }).catch(function(error) {
            hideLoading();
            console.error('Error saving tour:', error);
            showNotification('<?php _e('Error saving tour settings. Please try again.', 'magic-checklists'); ?>', 'error');
        });
    });
    
    // Reset completion button
    $('#mcl-reset-completion').on('click', function() {
        if (!confirm('<?php _e('Are you sure you want to reset your completion for this tour? This will allow you to see the tour again.', 'magic-checklists'); ?>')) {
            return;
        }
        
        showLoading('<?php _e('Resetting...', 'magic-checklists'); ?>');
        
        $.post(ajaxurl, {
            action: 'mcl_reset_tour_completion',
            tour_id: tourId,
            nonce: '<?php echo wp_create_nonce('mcl_tour_admin'); ?>'
        }, function(response) {
            hideLoading();
            if (response.success) {
                showNotification('<?php _e('Tour completion reset successfully.', 'magic-checklists'); ?>');
            } else {
                showNotification('<?php _e('Error resetting tour completion.', 'magic-checklists'); ?>', 'error');
            }
        }).fail(function() {
            hideLoading();
            showNotification('<?php _e('Error resetting tour completion.', 'magic-checklists'); ?>', 'error');
        });
    });
    
    function getTriggerValue() {
        const triggerType = $('input[name="trigger_type"]:checked').val();
        switch (triggerType) {
            case 'page':
                return $('#trigger-page-url').val();
            case 'selector':
                return $('#trigger-selector').val();
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
                specificUsers = $('#specific-users').val() || [];
            } else if (userCondition === 'specific_roles') {
                specificRoles = $('#specific-roles').val() || [];
            }
            
            // Build settings object
            const settings = {};
            if ($('#tour-active').is(':checked')) settings.active = true;
            if ($('#tour-autostart').is(':checked')) settings.autostart = true;
            if ($('#tour-show-once').is(':checked')) settings.show_once = true;
            
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
            
            $.post(ajaxurl, formData)
                .done(function(response) {
                    if (response.success) {
                        resolve(response.data.tour_id);
                    } else {
                        reject(response.data || 'Unknown error');
                    }
                })
                .fail(function(xhr, status, error) {
                    reject(error);
                });
        });
    }
});
</script> 