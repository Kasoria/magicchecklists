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

<div class="wrap">
    <h1 class="wp-heading-inline"><?php echo esc_html($page_title); ?></h1>
    <hr class="wp-header-end">

    <div class="mcl-tour-settings-page">
        <div class="mcl-tour-settings-container">
            <div class="mcl-tour-settings-main">
                <!-- Tour Basic Information -->
                <div class="mcl-settings-section">
                    <h2><?php _e('Tour Information', 'magic-checklists'); ?></h2>
                    <form id="mcl-tour-info-form">
                        <table class="form-table">
                            <tr>
                                <th scope="row">
                                    <label for="tour-title"><?php _e('Tour Title', 'magic-checklists'); ?></label>
                                </th>
                                <td>
                                    <input type="text" id="tour-title" name="title" class="regular-text" 
                                           value="<?php echo esc_attr($tour ? $tour->post_title : ''); ?>"
                                           placeholder="<?php _e('Enter tour title...', 'magic-checklists'); ?>" required>
                                    <p class="description"><?php _e('Give your tour a descriptive name.', 'magic-checklists'); ?></p>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <label for="tour-description"><?php _e('Description', 'magic-checklists'); ?></label>
                                </th>
                                <td>
                                    <textarea id="tour-description" name="description" class="large-text" rows="3"
                                              placeholder="<?php _e('Optional description for this tour...', 'magic-checklists'); ?>"><?php echo esc_textarea($tour ? $tour->post_content : ''); ?></textarea>
                                    <p class="description"><?php _e('Optional description to help you remember what this tour is for.', 'magic-checklists'); ?></p>
                                </td>
                            </tr>
                        </table>
                    </form>
                </div>

                <!-- Tour Settings -->
                <div class="mcl-settings-section">
                    <h2><?php _e('Tour Settings', 'magic-checklists'); ?></h2>
                    <form id="mcl-tour-settings-form">
                        <table class="form-table">
                            <tr>
                                <th scope="row"><?php _e('Status', 'magic-checklists'); ?></th>
                                <td>
                                    <fieldset>
                                        <label>
                                            <input type="checkbox" id="tour-active" name="active" value="1" 
                                                   <?php checked(!empty($tour_settings['active'])); ?>>
                                            <?php _e('Active (show this tour to users)', 'magic-checklists'); ?>
                                        </label>
                                        <p class="description"><?php _e('Only active tours will be displayed to users.', 'magic-checklists'); ?></p>
                                    </fieldset>
                                </td>
                            </tr>
                        </table>
                        
                        <h3><?php _e('Trigger Conditions', 'magic-checklists'); ?></h3>
                        <table class="form-table">
                            <tr>
                                <th scope="row"><?php _e('Trigger Location', 'magic-checklists'); ?></th>
                                <td>
                                    <fieldset>
                                        <?php 
                                        $trigger_type = get_post_meta($tour_id, '_mcl_tour_trigger_type', true) ?: 'page';
                                        $trigger_value = get_post_meta($tour_id, '_mcl_tour_trigger_value', true) ?: '';
                                        ?>
                                        <label>
                                            <input type="radio" name="trigger_type" value="page" <?php checked($trigger_type, 'page'); ?>>
                                            <?php _e('Specific Page URL', 'magic-checklists'); ?>
                                        </label><br>
                                        <div class="mcl-trigger-input" id="trigger-page-input" style="margin: 10px 0 15px 25px; <?php echo $trigger_type !== 'page' ? 'display: none;' : ''; ?>">
                                            <input type="text" id="trigger-page-url" class="regular-text" 
                                                   value="<?php echo $trigger_type === 'page' ? esc_attr($trigger_value) : ''; ?>"
                                                   placeholder="<?php _e('e.g., /wp-admin/admin.php?page=my-page or use * for wildcards', 'magic-checklists'); ?>">
                                            <p class="description"><?php _e('Enter the URL where this tour should trigger. Use * for wildcards (e.g., /wp-admin/* for all admin pages).', 'magic-checklists'); ?></p>
                                            <select id="common-pages" class="regular-text" style="margin-top: 5px;">
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
                                        </div>
                                        
                                        <label>
                                            <input type="radio" name="trigger_type" value="selector" <?php checked($trigger_type, 'selector'); ?>>
                                            <?php _e('When CSS Selector Exists', 'magic-checklists'); ?>
                                        </label><br>
                                        <div class="mcl-trigger-input" id="trigger-selector-input" style="margin: 10px 0 15px 25px; <?php echo $trigger_type !== 'selector' ? 'display: none;' : ''; ?>">
                                            <input type="text" id="trigger-selector" class="regular-text" 
                                                   value="<?php echo $trigger_type === 'selector' ? esc_attr($trigger_value) : ''; ?>"
                                                   placeholder="<?php _e('e.g., .my-button, #specific-element', 'magic-checklists'); ?>">
                                            <p class="description"><?php _e('Tour will trigger when this CSS selector is found on any page.', 'magic-checklists'); ?></p>
                                        </div>
                                        
                                        <label>
                                            <input type="radio" name="trigger_type" value="first_login" <?php checked($trigger_type, 'first_login'); ?>>
                                            <?php _e('User\'s First Login (any page)', 'magic-checklists'); ?>
                                        </label><br>
                                        <div class="mcl-trigger-input" style="margin: 10px 0 15px 25px; <?php echo $trigger_type !== 'first_login' ? 'display: none;' : ''; ?>">
                                            <p class="description"><?php _e('This tour will trigger on any page, but only for users who have never seen a first-login tour before.', 'magic-checklists'); ?></p>
                                        </div>
                                        
                                        <label>
                                            <input type="radio" name="trigger_type" value="any_page" <?php checked($trigger_type, 'any_page'); ?>>
                                            <?php _e('Any Page', 'magic-checklists'); ?>
                                        </label><br>
                                        <div class="mcl-trigger-input" style="margin: 10px 0 15px 25px; <?php echo $trigger_type !== 'any_page' ? 'display: none;' : ''; ?>">
                                            <p class="description"><?php _e('This tour can trigger on any page (use with caution and combine with user conditions).', 'magic-checklists'); ?></p>
                                        </div>
                                    </fieldset>
                                </td>
                            </tr>
                            
                            <tr>
                                <th scope="row"><?php _e('User Conditions', 'magic-checklists'); ?></th>
                                <td>
                                    <fieldset>
                                        <?php 
                                        $user_condition = get_post_meta($tour_id, '_mcl_tour_user_condition', true) ?: 'all_users';
                                        $specific_users = get_post_meta($tour_id, '_mcl_tour_specific_users', true) ?: array();
                                        $specific_roles = get_post_meta($tour_id, '_mcl_tour_specific_roles', true) ?: array();
                                        ?>
                                        <label>
                                            <input type="radio" name="user_condition" value="all_users" <?php checked($user_condition, 'all_users'); ?>>
                                            <?php _e('All Users (logged in and logged out)', 'magic-checklists'); ?>
                                        </label><br>
                                        
                                        <label>
                                            <input type="radio" name="user_condition" value="all_logged_in" <?php checked($user_condition, 'all_logged_in'); ?>>
                                            <?php _e('All Logged In Users', 'magic-checklists'); ?>
                                        </label><br>
                                        
                                        <label>
                                            <input type="radio" name="user_condition" value="all_logged_out" <?php checked($user_condition, 'all_logged_out'); ?>>
                                            <?php _e('All Logged Out Users', 'magic-checklists'); ?>
                                        </label><br>
                                        
                                        <label>
                                            <input type="radio" name="user_condition" value="specific_users" <?php checked($user_condition, 'specific_users'); ?>>
                                            <?php _e('Specific Users', 'magic-checklists'); ?>
                                        </label><br>
                                        <div class="mcl-user-input" id="specific-users-input" style="margin: 10px 0 15px 25px; <?php echo $user_condition !== 'specific_users' ? 'display: none;' : ''; ?>">
                                            <select id="specific-users" multiple style="min-height: 100px; width: 100%; max-width: 400px;">
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
                                        
                                        <label>
                                            <input type="radio" name="user_condition" value="specific_roles" <?php checked($user_condition, 'specific_roles'); ?>>
                                            <?php _e('Specific User Roles', 'magic-checklists'); ?>
                                        </label><br>
                                        <div class="mcl-role-input" id="specific-roles-input" style="margin: 10px 0 15px 25px; <?php echo $user_condition !== 'specific_roles' ? 'display: none;' : ''; ?>">
                                            <select id="specific-roles" multiple style="min-height: 100px; width: 100%; max-width: 400px;">
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
                                    </fieldset>
                                </td>
                            </tr>
                        </table>
                        
                        <h3><?php _e('Display Options', 'magic-checklists'); ?></h3>
                        <table class="form-table">
                            <tr>
                                <th scope="row"><?php _e('Behavior', 'magic-checklists'); ?></th>
                                <td>
                                    <fieldset>
                                        <label>
                                            <input type="checkbox" id="tour-autostart" name="autostart" value="1" 
                                                   <?php checked(get_post_meta($tour_id, '_mcl_tour_autostart', true)); ?>>
                                            <?php _e('Auto-start tour when triggered', 'magic-checklists'); ?>
                                        </label><br>
                                        <label>
                                            <input type="checkbox" id="tour-show-once" name="show_once" value="1" 
                                                   <?php checked(get_post_meta($tour_id, '_mcl_tour_show_once', true)); ?>>
                                            <?php _e('Show only once per user', 'magic-checklists'); ?>
                                        </label>
                                        <p class="description"><?php _e('If checked, each user will only see this tour once. Tracked by user account or browser cookie.', 'magic-checklists'); ?></p>
                                    </fieldset>
                                </td>
                            </tr>
                        </table>
                    </form>
                </div>

                <!-- Current Steps Summary -->
                <div class="mcl-settings-section">
                    <h2><?php _e('Tour Steps', 'magic-checklists'); ?></h2>
                    <div class="mcl-steps-summary">
                        <?php if (!empty($tour_steps)): ?>
                            <p><?php echo sprintf(_n('This tour currently has %d step.', 'This tour currently has %d steps.', count($tour_steps), 'magic-checklists'), count($tour_steps)); ?></p>
                            <div class="mcl-steps-list-container">
                                <ul class="mcl-steps-list" id="mcl-admin-steps-list">
                                    <?php foreach ($tour_steps as $index => $step): ?>
                                        <?php if (is_array($step) && !empty($step)): ?>
                                        <li class="mcl-admin-step-item" data-step-index="<?php echo $index; ?>">
                                            <div class="mcl-step-drag-handle">
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
                        <?php else: ?>
                            <p><?php _e('No steps have been created yet. Use the visual tour creator to add steps.', 'magic-checklists'); ?></p>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="mcl-settings-actions">
                    <p class="submit">
                        <button type="button" class="button button-primary button-large" id="mcl-save-and-create">
                            <span class="dashicons dashicons-edit"></span>
                            <?php _e('Save & Open Visual Tour Creator', 'magic-checklists'); ?>
                        </button>
                        <button type="button" class="button button-secondary" id="mcl-save-settings">
                            <?php _e('Save Settings Only', 'magic-checklists'); ?>
                        </button>
                        <a href="<?php echo admin_url('admin.php?page=mcl_tours'); ?>" class="button">
                            <?php _e('Back to Tours List', 'magic-checklists'); ?>
                        </a>
                    </p>
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
                                <p><?php _e('Set up the basic information and behavior for your tour on this page.', 'magic-checklists'); ?></p>
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
    </div>
</div>

<style>
.mcl-tour-settings-page {
    max-width: 1200px;
    margin: 20px 0;
}

.mcl-tour-settings-container {
    display: flex;
    gap: 30px;
}

.mcl-tour-settings-main {
    flex: 2;
}

.mcl-tour-settings-sidebar {
    flex: 1;
    max-width: 350px;
}

.mcl-settings-section {
    background: #fff;
    border: 1px solid #c3c4c7;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 20px;
}

.mcl-settings-section h2 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 18px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
}

.mcl-steps-list {
    background: #f9f9f9;
    padding: 15px;
    border-radius: 4px;
    list-style: none;
    margin: 0;
}

.mcl-admin-step-item {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 8px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s ease;
    cursor: grab;
}

.mcl-admin-step-item:hover {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.mcl-admin-step-item.sortable-drag {
    cursor: grabbing;
    opacity: 0.8;
    transform: rotate(2deg);
}

.mcl-admin-step-item.sortable-ghost {
    opacity: 0.3;
}

.mcl-step-drag-handle {
    color: #8c8f94;
    cursor: grab;
    padding: 4px;
    border-radius: 3px;
    transition: color 0.2s ease;
}

.mcl-step-drag-handle:hover {
    color: #2271b1;
    background: #f0f6fc;
}

.mcl-step-drag-handle .dashicons {
    width: 16px;
    height: 16px;
    font-size: 16px;
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
    font-size: 12px;
}

.mcl-step-details {
    flex: 1;
}

.mcl-step-details strong {
    display: block;
    margin-bottom: 4px;
    font-size: 14px;
}

.mcl-steps-list code {
    background: #e1e1e1;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    margin-right: 8px;
}

.mcl-step-page-url {
    font-size: 11px;
    color: #646970;
    font-style: italic;
    margin-top: 2px;
}

.mcl-settings-actions {
    background: #fff;
    border: 1px solid #c3c4c7;
    border-radius: 4px;
    padding: 20px;
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
}

.mcl-instruction-step {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 20px;
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

.mcl-trigger-input,
.mcl-user-input,
.mcl-role-input {
    background: #f9f9f9;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
}

.mcl-trigger-input input[type="text"],
.mcl-trigger-input select {
    width: 100%;
    max-width: 500px;
}

fieldset label {
    display: block;
    margin-bottom: 8px;
    font-weight: normal;
}

fieldset label input[type="radio"] {
    margin-right: 8px;
}

#specific-users,
#specific-roles {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 5px;
}

@media (max-width: 1024px) {
    .mcl-tour-settings-container {
        flex-direction: column;
    }
    
    .mcl-tour-settings-sidebar {
        max-width: none;
    }
}
</style>

<script>
jQuery(document).ready(function($) {
    const tourId = <?php echo $tour_id; ?>;
    
    // Initialize sortable if we have steps
    <?php if (!empty($tour_steps)): ?>
    initializeStepsSortable();
    <?php endif; ?>
    
    function initializeStepsSortable() {
        const stepsList = document.getElementById('mcl-admin-steps-list');
        if (!stepsList || typeof Sortable === 'undefined') return;
        
        new Sortable(stepsList, {
            handle: '.mcl-step-drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: function(evt) {
                // Update step numbers visually first
                updateStepNumbers();
                
                // Handle the reordering
                handleStepsReorder();
            }
        });
    }
    
    function updateStepNumbers() {
        $('#mcl-admin-steps-list .mcl-step-indicator').each(function(index) {
            $(this).text((index + 1) + '.');
        });
    }
    
    function handleStepsReorder() {
        // Collect the new order based on DOM elements
        const stepItems = $('#mcl-admin-steps-list .mcl-admin-step-item');
        const newOrder = [];
        
        stepItems.each(function() {
            const stepIndex = parseInt($(this).data('step-index'));
            if (!isNaN(stepIndex)) {
                newOrder.push(stepIndex);
            }
        });

        console.log('Steps reorder detected:', {
            domElements: stepItems.length,
            newOrder: newOrder
        });

        // Update data-step-index attributes immediately to reflect new positions
        stepItems.each(function(newIndex) {
            $(this).data('step-index', newIndex);
            
            $(this).attr('data-step-index', newIndex);
        });

        // Save to server
        saveStepsOrder(newOrder);
    }
    
    function saveStepsOrder(newOrder) {
        console.log('Saving step order:', newOrder);
        
        // Send AJAX request to save new order
        $.post('<?php echo admin_url("admin-ajax.php"); ?>', {
            action: 'mcl_reorder_tour_steps',
            tour_id: tourId,
            step_order: newOrder,
            nonce: '<?php echo wp_create_nonce('mcl_tour_admin'); ?>'
        }, function(response) {
            if (response.success) {
                console.log('Step order saved successfully');
            } else {
                console.error('Failed to save step order:', response.data);
                // Could reload page or revert order on failure
            }
        }).fail(function(xhr, status, error) {
            console.error('Failed to save step order:', error);
            // Could reload page or revert order on failure
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
    
    // Handle common page selection
    $('#common-pages').on('change', function() {
        const selectedUrl = $(this).val();
        if (selectedUrl) {
            $('#trigger-page-url').val(selectedUrl);
        }
    });
    
    $('#mcl-save-and-create').on('click', function() {
        saveTourSettings().then(function(savedTourId) {
            // Redirect to visual creator
            window.location.href = '<?php echo admin_url("index.php"); ?>?mcl_tour_mode=1&tour_id=' + savedTourId;
        }).catch(function(error) {
            console.error('Error saving tour:', error);
            alert('Error saving tour settings. Please try again.');
        });
    });
    
    $('#mcl-save-settings').on('click', function() {
        saveTourSettings().then(function() {
            alert('Tour settings saved successfully!');
        }).catch(function(error) {
            console.error('Error saving tour:', error);
            alert('Error saving tour settings. Please try again.');
        });
    });
    
    function saveTourSettings() {
        return new Promise(function(resolve, reject) {
            // Get trigger data
            const triggerType = $('input[name="trigger_type"]:checked').val();
            let triggerValue = '';
            
            switch (triggerType) {
                case 'page':
                    triggerValue = $('#trigger-page-url').val();
                    break;
                case 'selector':
                    triggerValue = $('#trigger-selector').val();
                    break;
                case 'first_login':
                case 'any_page':
                    triggerValue = '';
                    break;
            }
            
            // Get user condition data
            const userCondition = $('input[name="user_condition"]:checked').val();
            let specificUsers = [];
            let specificRoles = [];
            
            if (userCondition === 'specific_users') {
                specificUsers = $('#specific-users').val() || [];
            } else if (userCondition === 'specific_roles') {
                specificRoles = $('#specific-roles').val() || [];
            }
            
            // Build settings object dynamically: only include keys when checked
            const settings = {};
            if ($('#tour-active').is(':checked')) settings.active = true;
            if ($('#tour-autostart').is(':checked')) settings.autostart = true;
            if ($('#tour-show-once').is(':checked')) settings.show_once = true;
            
            const formData = {
                action: 'mcl_save_tour_settings',
                tour_id: tourId,
                title: $('#tour-title').val(),
                description: $('#tour-description').val(),
                settings: settings,
                trigger_type: triggerType,
                trigger_value: triggerValue,
                user_condition: userCondition,
                specific_users: specificUsers,
                specific_roles: specificRoles,
                nonce: '<?php echo wp_create_nonce('mcl_tour_admin'); ?>'
            };
            
            $.post('<?php echo admin_url("admin-ajax.php"); ?>', formData)
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