<?php if (!defined('ABSPATH')) exit; // Exit if accessed directly ?>

<div class="mcl-wrap">
    <div class="mcl-header">
        <div class="mcl-title-wrapper">
            <h1 class="mcl-title">
                <?php esc_html_e('MagicChecklists Analytics', 'magic-checklists'); ?>
            </h1>
        </div>
        <div class="mcl-intro">
            <p class="mcl-description mcl-description-light">
                <?php esc_html_e('View detailed analytics and insights for all your checklists.', 'magic-checklists'); ?>
            </p>
        </div>
    </div>

    <div class="mcl-analytics-container">
        <!-- Analytics Overview Cards -->
        <div class="mcl-analytics-cards">
            <div class="mcl-analytics-card mcl-card-primary">
                <div class="mcl-card-icon">
                    <span class="dashicons dashicons-visibility"></span>
                </div>
                <div class="mcl-card-content">
                    <h2 class="mcl-card-title"><?php echo number_format($summary['total_views']); ?></h2>
                    <p class="mcl-card-description"><?php esc_html_e('Total Views', 'magic-checklists'); ?></p>
                </div>
            </div>
            
            <div class="mcl-analytics-card mcl-card-secondary">
                <div class="mcl-card-icon">
                    <span class="dashicons dashicons-yes-alt"></span>
                </div>
                <div class="mcl-card-content">
                    <h2 class="mcl-card-title"><?php echo number_format($summary['total_checks']); ?></h2>
                    <p class="mcl-card-description"><?php esc_html_e('Total Items Checked', 'magic-checklists'); ?></p>
                </div>
            </div>
            
            <div class="mcl-analytics-card mcl-card-accent">
                <div class="mcl-card-icon">
                    <span class="dashicons dashicons-list-view"></span>
                </div>
                <div class="mcl-card-content">
                    <h2 class="mcl-card-title"><?php echo number_format($summary['active_checklists']); ?></h2>
                    <p class="mcl-card-description"><?php esc_html_e('Active Checklists', 'magic-checklists'); ?></p>
                </div>
            </div>
            
            <div class="mcl-analytics-card">
                <div class="mcl-card-icon">
                    <span class="dashicons dashicons-clipboard"></span>
                </div>
                <div class="mcl-card-content">
                    <h2 class="mcl-card-title"><?php echo number_format($summary['total_checklists']); ?></h2>
                    <p class="mcl-card-description"><?php esc_html_e('Total Checklists', 'magic-checklists'); ?></p>
                </div>
            </div>
        </div>

        <!-- Deadlines Section -->
        <?php if (!empty($summary['approaching_deadlines'])): ?>
        <div class="mcl-analytics-section mcl-deadlines-section">
            <div class="mcl-section-header">
                <h2 class="mcl-section-title">
                    <span class="dashicons dashicons-calendar-alt"></span>
                    <?php esc_html_e('Approaching Deadlines', 'magic-checklists'); ?>
                </h2>
            </div>
            
            <div class="mcl-section-content">
                <table class="mcl-deadlines-table mcl-table">
                    <thead>
                        <tr>
                            <th><?php esc_html_e('Checklist', 'magic-checklists'); ?></th>
                            <th><?php esc_html_e('Item', 'magic-checklists'); ?></th>
                            <th><?php esc_html_e('Deadline', 'magic-checklists'); ?></th>
                            <th><?php esc_html_e('Time Remaining', 'magic-checklists'); ?></th>
                            <th><?php esc_html_e('Actions', 'magic-checklists'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($summary['approaching_deadlines'] as $deadline): ?>
                        <tr class="<?php echo $deadline['time_remaining'] < 0 ? 'mcl-deadline-overdue' : ''; ?> <?php echo isset($deadline['is_checklist_deadline']) && $deadline['is_checklist_deadline'] ? 'mcl-checklist-deadline-row' : ''; ?>">
                            <td>
                                <strong>
                                    <a href="<?php echo admin_url('admin.php?page=mcl_add_new&checklist_id=' . $deadline['checklist_id']); ?>">
                                        <?php echo esc_html($deadline['checklist_title']); ?>
                                    </a>
                                </strong>
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
                                    $hours_past = abs(floor($deadline['time_remaining'] / HOUR_IN_SECONDS));
                                    $days_past = floor($hours_past / 24);
                                    
                                    if ($days_past > 0) {
                                        printf(
                                            '<span class="mcl-deadline-label mcl-deadline-overdue">%s %s %s</span>',
                                            esc_html__('Overdue by', 'magic-checklists'),
                                            $days_past,
                                            _n('day', 'days', $days_past, 'magic-checklists')
                                        );
                                    } else {
                                        printf(
                                            '<span class="mcl-deadline-label mcl-deadline-overdue">%s %s %s</span>',
                                            esc_html__('Overdue by', 'magic-checklists'),
                                            $hours_past,
                                            _n('hour', 'hours', $hours_past, 'magic-checklists')
                                        );
                                    }
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
                            <td>
                                <a href="<?php echo admin_url('admin.php?page=mcl_add_new&checklist_id=' . $deadline['checklist_id']); ?>" class="mcl-action-button mcl-edit">
                                    <?php esc_html_e('View Checklist', 'magic-checklists'); ?>
                                </a>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
        <?php endif; ?>

        <!-- Most Popular Checklists -->
        <div class="mcl-analytics-section">
            <div class="mcl-section-header">
                <h2 class="mcl-section-title">
                    <span class="dashicons dashicons-chart-bar"></span>
                    <?php esc_html_e('Most Popular Checklists', 'magic-checklists'); ?>
                </h2>
            </div>
            
            <div class="mcl-section-content">
                <?php if (!empty($all_analytics)): ?>
                <table class="mcl-analytics-table mcl-table">
                    <thead>
                        <tr>
                            <th><?php esc_html_e('Checklist', 'magic-checklists'); ?></th>
                            <th><?php esc_html_e('Views', 'magic-checklists'); ?></th>
                            <th><?php esc_html_e('Last Viewed', 'magic-checklists'); ?></th>
                            <th><?php esc_html_e('Most Checked Items', 'magic-checklists'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($all_analytics as $analytics): ?>
                        <tr>
                            <td>
                                <strong>
                                    <a href="<?php echo admin_url('admin.php?page=mcl_add_new&checklist_id=' . $analytics->checklist_id); ?>">
                                        <?php echo esc_html($analytics->title); ?>
                                    </a>
                                </strong>
                            </td>
                            <td>
                                <span class="mcl-view-count">
                                    <?php echo number_format($analytics->view_count); ?>
                                </span>
                            </td>
                            <td>
                                <?php 
                                if (!empty($analytics->last_viewed)) {
                                    echo date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($analytics->last_viewed));
                                } else {
                                    esc_html_e('Never', 'magic-checklists');
                                }
                                ?>
                            </td>
                            <td>
                                <?php if (!empty($analytics->most_checked_items)): ?>
                                <ul class="mcl-most-checked-list">
                                    <?php foreach ($analytics->most_checked_items as $item): ?>
                                    <li>
                                        <div class="mcl-checked-item-content">
                                            <?php echo wp_kses_post($item->item_content); ?>
                                            <span class="mcl-check-count">
                                                <?php echo number_format($item->check_count); ?> <?php echo _n('check', 'checks', $item->check_count, 'magic-checklists'); ?>
                                            </span>
                                        </div>
                                    </li>
                                    <?php endforeach; ?>
                                </ul>
                                <?php else: ?>
                                <span class="mcl-no-data">
                                    <?php esc_html_e('No item check data yet', 'magic-checklists'); ?>
                                </span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <?php else: ?>
                <div class="mcl-no-analytics">
                    <p><?php esc_html_e('No analytics data available yet. Data will appear once your checklists are being used.', 'magic-checklists'); ?></p>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>
