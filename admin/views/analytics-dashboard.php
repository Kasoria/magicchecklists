<?php if (!defined('ABSPATH')) exit; ?>

<div class="mcl-analytics-dashboard">
    <div class="mcl-analytics-header">
        <h2><?php esc_html_e('Checklist Analytics Overview', 'magic-checklists'); ?></h2>
        <a href="<?php echo admin_url('admin.php?page=mcl_analytics'); ?>" class="mcl-button mcl-button-secondary">
            <?php esc_html_e('View Full Analytics', 'magic-checklists'); ?>
        </a>
    </div>

    <div class="mcl-analytics-summary">
        <div class="mcl-summary-card">
            <div class="mcl-summary-icon">
                <span class="dashicons dashicons-visibility"></span>
            </div>
            <div class="mcl-summary-content">
                <h3><?php esc_html_e('Total Views', 'magic-checklists'); ?></h3>
                <p class="mcl-summary-value"><?php echo number_format($summary['total_views']); ?></p>
            </div>
        </div>
        
        <div class="mcl-summary-card">
            <div class="mcl-summary-icon">
                <span class="dashicons dashicons-yes-alt"></span>
            </div>
            <div class="mcl-summary-content">
                <h3><?php esc_html_e('Total Checks', 'magic-checklists'); ?></h3>
                <p class="mcl-summary-value"><?php echo number_format($summary['total_checks']); ?></p>
            </div>
        </div>
        
        <div class="mcl-summary-card">
            <div class="mcl-summary-icon">
                <span class="dashicons dashicons-list-view"></span>
            </div>
            <div class="mcl-summary-content">
                <h3><?php esc_html_e('Active Checklists', 'magic-checklists'); ?></h3>
                <p class="mcl-summary-value"><?php echo number_format($summary['active_checklists']); ?></p>
            </div>
        </div>
    </div>

    <?php if (!empty($approaching_deadlines)): ?>
    <div class="mcl-approaching-deadlines">
        <h3><?php esc_html_e('Approaching Deadlines', 'magic-checklists'); ?></h3>
        <table class="mcl-deadlines-table">
            <thead>
                <tr>
                    <th><?php esc_html_e('Checklist', 'magic-checklists'); ?></th>
                    <th><?php esc_html_e('Item', 'magic-checklists'); ?></th>
                    <th><?php esc_html_e('Deadline', 'magic-checklists'); ?></th>
                    <th><?php esc_html_e('Time Remaining', 'magic-checklists'); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($approaching_deadlines as $deadline): ?>
                <tr class="<?php echo $deadline['time_remaining'] < 0 ? 'mcl-deadline-overdue' : ''; ?> <?php echo isset($deadline['is_checklist_deadline']) && $deadline['is_checklist_deadline'] ? 'mcl-checklist-deadline-row' : ''; ?>">
                    <td>
                        <a href="<?php echo admin_url('admin.php?page=mcl_add_new&checklist_id=' . $deadline['checklist_id']); ?>">
                            <?php echo esc_html($deadline['checklist_title']); ?>
                        </a>
                        <?php if (isset($deadline['is_checklist_deadline']) && $deadline['is_checklist_deadline']): ?>
                            <span class="mcl-checklist-deadline-badge"><?php esc_html_e('Checklist Deadline', 'magic-checklists'); ?></span>
                        <?php endif; ?>
                    </td>
                    <td><?php echo wp_kses_post($deadline['item_content']); ?></td>
                    <td><?php 
                        // Validate timestamp before displaying
                        $timestamp = intval($deadline['deadline']);
                        if ($timestamp > 86400) { // Skip timestamps before Jan 2, 1970
                            echo date_i18n(get_option('date_format') . ' ' . get_option('time_format'), $timestamp);
                        } else {
                            echo esc_html__('Invalid date', 'magic-checklists');
                        }
                    ?></td>
                    <td>
                        <?php 
                        if ($deadline['time_remaining'] < 0) {
                            echo '<span class="mcl-deadline-label mcl-deadline-overdue">' . esc_html__('Overdue', 'magic-checklists') . '</span>';
                        } else {
                            $hours = floor($deadline['time_remaining'] / HOUR_IN_SECONDS);
                            $days = floor($hours / 24);
                            
                            if ($days > 0) {
                                printf(
                                    '<span class="mcl-deadline-label">%s %s</span>',
                                    $days,
                                    _n('day', 'days', $days, 'magic-checklists')
                                );
                            } else {
                                printf(
                                    '<span class="mcl-deadline-label %s">%s %s</span>',
                                    $hours < 12 ? 'mcl-deadline-soon' : '',
                                    $hours,
                                    _n('hour', 'hours', $hours, 'magic-checklists')
                                );
                            }
                        }
                        ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>

    <?php if (!empty($summary['most_popular'])): ?>
    <div class="mcl-most-popular">
        <h3><?php esc_html_e('Most Popular Checklist', 'magic-checklists'); ?></h3>
        <div class="mcl-popular-item">
            <a href="<?php echo admin_url('admin.php?page=mcl_add_new&checklist_id=' . $summary['most_popular']->checklist_id); ?>">
                <?php echo esc_html($summary['most_popular']->post_title); ?>
            </a>
            <span class="mcl-view-count">
                <?php printf(
                    /* translators: %s: number of views */
                    _n('%s view', '%s views', $summary['most_popular']->view_count, 'magic-checklists'),
                    number_format($summary['most_popular']->view_count)
                ); ?>
            </span>
        </div>
    </div>
    <?php endif; ?>

    <?php if (!empty($summary['most_checked_item'])): ?>
    <div class="mcl-most-checked">
        <h3><?php esc_html_e('Most Checked Item', 'magic-checklists'); ?></h3>
        <div class="mcl-popular-item">
            <div class="mcl-item-content">
                <?php echo wp_kses_post($summary['most_checked_item']->item_content); ?>
                <small class="mcl-item-checklist">
                    <?php esc_html_e('in', 'magic-checklists'); ?> 
                    <a href="<?php echo admin_url('admin.php?page=mcl_add_new&checklist_id=' . $summary['most_checked_item']->checklist_id); ?>">
                        <?php echo esc_html($summary['most_checked_item']->post_title); ?>
                    </a>
                </small>
            </div>
            <span class="mcl-check-count">
                <?php printf(
                    /* translators: %s: number of checks */
                    _n('%s check', '%s checks', $summary['most_checked_item']->check_count, 'magic-checklists'),
                    number_format($summary['most_checked_item']->check_count)
                ); ?>
            </span>
        </div>
    </div>
    <?php endif; ?>
</div> 