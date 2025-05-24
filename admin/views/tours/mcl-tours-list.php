<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$tours = get_posts(array(
    'post_type' => 'mcl_tour',
    'posts_per_page' => -1,
    'orderby' => 'date',
    'order' => 'DESC'
));
?>

<div class="mcl-wrap">
    <div class="mcl-header">
        <div class="mcl-title-wrapper">
            <h1 class="mcl-title"><?php _e('Tours', 'magic-checklists'); ?></h1>
            <div class="mcl-actions">
                <a href="<?php echo admin_url('admin.php?page=mcl_tours&create=1'); ?>" class="mcl-button mcl-button-primary">
                    <span class="dashicons dashicons-plus-alt2"></span>
                    <?php _e('Add New Tour', 'magic-checklists'); ?>
                </a>
            </div>
        </div>
        <div class="mcl-intro">
            <p class="mcl-description mcl-description-light">
                <?php _e('Create interactive tours to guide users through your WordPress admin interface. Tours help users learn how to use features and complete important tasks.', 'magic-checklists'); ?>
            </p>
        </div>
    </div>

    <div class="mcl-content">

        <?php if (empty($tours)): ?>
            <div class="mcl-empty-state mcl-tours-list">
                <div class="mcl-empty-state-icon">
                    <span class="dashicons dashicons-location-alt"></span>
                </div>
                <h2><?php _e('No tours yet', 'magic-checklists'); ?></h2>
                <p><?php _e('Create your first tour to guide users through your WordPress site.', 'magic-checklists'); ?></p>
                <a href="<?php echo admin_url('admin.php?page=mcl_tours&create=1'); ?>" class="mcl-button mcl-button-primary">
                    <?php _e('Create Your First Tour', 'magic-checklists'); ?>
                </a>
            </div>
        <?php else: ?>
            <div class="mcl-table-wrapper">
                <table class="mcl-table">
            <thead>
                <tr>
                    <th scope="col" class="manage-column column-title column-primary">
                        <?php _e('Title', 'magic-checklists'); ?>
                    </th>
                    <th scope="col" class="manage-column column-steps">
                        <?php _e('Steps', 'magic-checklists'); ?>
                    </th>
                    <th scope="col" class="manage-column column-trigger">
                        <?php _e('Trigger', 'magic-checklists'); ?>
                    </th>
                    <th scope="col" class="manage-column column-status">
                        <?php _e('Status', 'magic-checklists'); ?>
                    </th>
                    <th scope="col" class="manage-column column-date">
                        <?php _e('Date', 'magic-checklists'); ?>
                    </th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($tours as $tour): 
                    $steps = get_post_meta($tour->ID, '_mcl_tour_steps', true) ?: array();
                    $is_active = get_post_meta($tour->ID, '_mcl_tour_active', true);
                    $step_count = count($steps);
                    
                    // Get trigger information
                    $trigger_type = get_post_meta($tour->ID, '_mcl_tour_trigger_type', true) ?: 'page';
                    $trigger_value = get_post_meta($tour->ID, '_mcl_tour_trigger_value', true) ?: '';
                    $user_condition = get_post_meta($tour->ID, '_mcl_tour_user_condition', true) ?: 'all_users';
                    $autostart = get_post_meta($tour->ID, '_mcl_tour_autostart', true);
                ?>
                <tr>
                    <td class="title column-title has-row-actions column-primary">
                        <strong>
                            <a href="<?php echo admin_url('admin.php?page=mcl_tours&edit=' . $tour->ID); ?>">
                                <?php echo esc_html($tour->post_title ?: __('(no title)', 'magic-checklists')); ?>
                            </a>
                        </strong>
                        <div class="row-actions">
                            <span class="edit">
                                <a href="<?php echo admin_url('admin.php?page=mcl_tours&edit=' . $tour->ID); ?>" class="mcl-edit">
                                    <?php _e('Edit', 'magic-checklists'); ?>
                                </a> |
                            </span>
                            <span class="duplicate">
                                <a href="#" class="mcl-duplicate-tour mcl-clone" data-tour-id="<?php echo $tour->ID; ?>">
                                    <?php _e('Duplicate', 'magic-checklists'); ?>
                                </a> |
                            </span>
                            <span class="reset">
                                <a href="#" class="mcl-reset-completion" data-tour-id="<?php echo $tour->ID; ?>">
                                    <?php _e('Reset Completion', 'magic-checklists'); ?>
                                </a> |
                            </span>
                            <span class="trash">
                                <a href="#" class="mcl-delete-tour mcl-delete" data-tour-id="<?php echo $tour->ID; ?>">
                                    <?php _e('Delete', 'magic-checklists'); ?>
                                </a>
                            </span>
                        </div>
                    </td>
                    <td class="column-steps">
                        <?php echo sprintf(_n('%d step', '%d steps', $step_count, 'magic-checklists'), $step_count); ?>
                    </td>
                    <td class="column-trigger">
                        <?php 
                        // Display trigger type
                        $trigger_labels = array(
                            'page' => __('Page URL', 'magic-checklists'),
                            'selector' => __('CSS Selector', 'magic-checklists'),
                            'first_login' => __('First Login', 'magic-checklists'),
                            'any_page' => __('Any Page', 'magic-checklists')
                        );
                        $trigger_label = $trigger_labels[$trigger_type] ?? $trigger_type;
                        
                        echo '<div class="mcl-trigger-type">' . esc_html($trigger_label) . '</div>';
                        
                        if ($trigger_value) {
                            echo '<div class="mcl-trigger-value">' . esc_html(substr($trigger_value, 0, 30)) . (strlen($trigger_value) > 30 ? '...' : '') . '</div>';
                        }
                        
                        // Display user condition
                        $user_labels = array(
                            'all_users' => __('All Users', 'magic-checklists'),
                            'all_logged_in' => __('Logged In', 'magic-checklists'),
                            'all_logged_out' => __('Logged Out', 'magic-checklists'),
                            'specific_users' => __('Specific Users', 'magic-checklists'),
                            'specific_roles' => __('Specific Roles', 'magic-checklists')
                        );
                        $user_label = $user_labels[$user_condition] ?? $user_condition;
                        
                        echo '<div class="mcl-user-condition">' . esc_html($user_label) . '</div>';
                        
                        if ($autostart) {
                            echo '<div class="mcl-autostart-badge">' . __('Auto-start', 'magic-checklists') . '</div>';
                        }
                        ?>
                    </td>
                    <td class="column-status">
                        <label class="mcl-toggle-switch">
                            <input type="checkbox" 
                                   class="mcl-tour-status-toggle" 
                                   data-tour-id="<?php echo $tour->ID; ?>"
                                   <?php checked($is_active, '1'); ?>>
                            <span class="mcl-toggle-slider"></span>
                        </label>
                        <span class="mcl-status-text">
                            <?php echo $is_active ? __('Active', 'magic-checklists') : __('Inactive', 'magic-checklists'); ?>
                        </span>
                    </td>
                    <td class="column-date">
                        <?php echo get_the_date('Y/m/d', $tour->ID); ?>
                    </td>
                </tr>
                <?php endforeach; ?>
                </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<style>
.mcl-toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
}

.mcl-toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.mcl-toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
}

.mcl-toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked + .mcl-toggle-slider {
    background-color: #2271b1;
}

input:checked + .mcl-toggle-slider:before {
    transform: translateX(20px);
}

.mcl-status-text {
    margin-left: 10px;
    font-weight: 500;
}

.mcl-trigger-type {
    font-weight: 600;
    color: #2271b1;
    margin-bottom: 2px;
}

.mcl-trigger-value {
    font-size: 11px;
    color: #646970;
    font-family: monospace;
    background: #f0f0f0;
    padding: 2px 4px;
    border-radius: 2px;
    margin-bottom: 4px;
    display: inline-block;
}

.mcl-user-condition {
    font-size: 11px;
    color: #50575e;
    margin-bottom: 2px;
}

.mcl-autostart-badge {
    background: #00a32a;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    display: inline-block;
    font-weight: 500;
}

.column-steps,
.column-trigger,
.column-status,
.column-date {
    width: 120px;
}

.column-trigger {
    width: 150px;
}

.mcl-tours-list .mcl-empty-state {
    text-align: center;
    padding: 60px 20px;
    max-width: 500px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}

.mcl-tours-list .mcl-empty-state-icon .dashicons {
    font-size: 64px;
    width: 64px;
    height: 64px;
    color: #c3c4c7;
    margin-bottom: 20px;
}

.mcl-tours-list .mcl-empty-state h2 {
    margin: 0 0 10px;
    color: #1d2327;
}

.mcl-tours-list .mcl-empty-state p {
    color: #646970;
    margin-bottom: 20px;
}
</style>

<script>
jQuery(document).ready(function($) {
    // Handle tour status toggle
    $('.mcl-tour-status-toggle').on('change', function() {
        const tourId = $(this).data('tour-id');
        const statusText = $(this).closest('tr').find('.mcl-status-text');
        
        $.post('<?php echo admin_url('admin-ajax.php'); ?>', {
            action: 'mcl_toggle_tour_status',
            tour_id: tourId,
            nonce: '<?php echo wp_create_nonce('mcl_tour_admin'); ?>'
        }, function(response) {
            if (response.success) {
                statusText.text(response.data.active ? '<?php _e('Active', 'magic-checklists'); ?>' : '<?php _e('Inactive', 'magic-checklists'); ?>');
            } else {
                // Revert toggle on error
                $(this).prop('checked', !$(this).prop('checked'));
                alert('<?php _e('Error updating tour status', 'magic-checklists'); ?>');
            }
        }.bind(this)).fail(function(xhr, status, error) {
            console.error('Failed to toggle tour status:', error);
            console.error('Response:', xhr.responseText);
            // Revert toggle on error
            $(this).prop('checked', !$(this).prop('checked'));
            alert('<?php _e('Error updating tour status', 'magic-checklists'); ?>');
        }.bind(this));
    });

    // Handle tour deletion
    $('.mcl-delete-tour').on('click', function(e) {
        e.preventDefault();
        
        if (!confirm('<?php _e('Are you sure you want to delete this tour?', 'magic-checklists'); ?>')) {
            return;
        }
        
        const tourId = $(this).data('tour-id');
        const row = $(this).closest('tr');
        
        $.post('<?php echo admin_url('admin-ajax.php'); ?>', {
            action: 'mcl_delete_tour',
            tour_id: tourId,
            nonce: '<?php echo wp_create_nonce('mcl_tour_admin'); ?>'
        }, function(response) {
            if (response.success) {
                row.fadeOut(function() {
                    row.remove();
                    // Check if table is empty and reload page if needed
                    if ($('.wp-list-table tbody tr').length === 0) {
                        location.reload();
                    }
                });
            } else {
                alert('<?php _e('Error deleting tour', 'magic-checklists'); ?>');
            }
        }).fail(function(xhr, status, error) {
            console.error('Failed to delete tour:', error);
            console.error('Response:', xhr.responseText);
            alert('<?php _e('Error deleting tour', 'magic-checklists'); ?>');
        });
    });

    // Handle tour completion reset
    $('.mcl-reset-completion').on('click', function(e) {
        e.preventDefault();
        
        if (!confirm('<?php _e('Reset completion status for this tour? You will be able to see it again.', 'magic-checklists'); ?>')) {
            return;
        }
        
        const tourId = $(this).data('tour-id');
        
        $.post('<?php echo admin_url('admin-ajax.php'); ?>', {
            action: 'mcl_reset_tour_completion',
            tour_id: tourId,
            nonce: '<?php echo wp_create_nonce('mcl_tour_admin'); ?>'
        }, function(response) {
            if (response.success) {
                alert('<?php _e('Tour completion reset successfully. You can now see this tour again.', 'magic-checklists'); ?>');
            } else {
                alert('<?php _e('Error resetting tour completion', 'magic-checklists'); ?>');
            }
        }).fail(function(xhr, status, error) {
            console.error('Failed to reset tour completion:', error);
            console.error('Response:', xhr.responseText);
            alert('<?php _e('Error resetting tour completion', 'magic-checklists'); ?>');
        });
    });
});
</script>
