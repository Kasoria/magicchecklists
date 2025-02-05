<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$checklists = get_posts( array(
    'post_type'      => 'mcl_checklist',
    'posts_per_page' => -1,
    'post_status'    => 'publish',
) );
?>
<div class="mcl-wrap">
    <div class="mcl-header">
        <div class="mcl-title-wrapper">
            <h1 class="mcl-title">
                <?php esc_html_e( 'MagicChecklists', 'magic-checklists' ); ?>
            </h1>
            <div class="mcl-actions">
                <a href="<?php echo admin_url( 'admin.php?page=mcl_add_new' ); ?>" class="mcl-button mcl-button-primary">
                    <span class="dashicons dashicons-plus-alt"></span>
                    <?php esc_html_e( 'Add New', 'magic-checklists' ); ?>
                </a>
                <a href="<?php echo admin_url( 'admin.php?page=mcl_import' ); ?>" class="mcl-button mcl-button-secondary">
                    <span class="dashicons dashicons-upload"></span>
                    <?php esc_html_e( 'Import', 'magic-checklists' ); ?>
                </a>
            </div>
        </div>
        <div class="mcl-intro">
            <p class="mcl-description mcl-description-light">
                <?php esc_html_e( 'Create and manage interactive checklists that can be accessed from anywhere on your site. Perfect for workflows, project management, and recurring tasks.', 'magic-checklists' ); ?>
            </p>
        </div>
    </div>

    <div class="mcl-content">
        <div class="mcl-info">
            <p class="mcl-subtitle">
                <?php esc_html_e( 'Your Active Checklists', 'magic-checklists' ); ?>
            </p>
            <p class="mcl-description">
                <?php esc_html_e( 'Use keyboard shortcuts to quickly access your checklists from anywhere on your site.', 'magic-checklists' ); ?>
            </p>
    </div>

    <div class="mcl-table-filters">
        <div class="mcl-filter-group mcl-form-group">
            <label for="mcl-tag-filter" class="mcl-label mcl-label-dark mcl-label-small"><?php esc_html_e('Filter by Tags', 'magic-checklists'); ?></label>
            <select id="mcl-tag-filter" class="mcl-select" multiple>
                <?php
                $unique_tags = array();
                foreach ($checklists as $checklist) {
                    $checklist_tags = get_post_meta($checklist->ID, '_mcl_tags', true);
                    if (is_array($checklist_tags)) {
                        foreach ($checklist_tags as $tag) {
                            $tag_name = $tag['name'];
                            if (!isset($unique_tags[$tag_name])) {
                                printf(
                                    '<option value="%s">%s</option>',
                                    esc_attr($tag_name),
                                    esc_html($tag_name)
                                );
                            }
                        }
                    }
                }
                ?>
            </select>
        </div>
    </div>

    <?php if ( $checklists ) : ?>
        <div class="mcl-table-wrapper">
            <table class="mcl-table">
                <thead>
                    <tr>
                        <th class="sortable" data-sort="title"><?php esc_html_e( 'Title', 'magic-checklists' ); ?></th>
                        <th class="sortable" data-sort="priority"><?php esc_html_e( 'Priority', 'magic-checklists' ); ?></th>
                        <th class="sortable" data-sort="tags"><?php esc_html_e('Tags', 'magic-checklists'); ?></th>
                        <th><?php esc_html_e( 'Description', 'magic-checklists' ); ?></th>
                        <th><?php esc_html_e( 'Activate / Deactivate', 'magic-checklists' ); ?></th>
                        <th><?php esc_html_e( 'Shortcut', 'magic-checklists' ); ?></th>
                        <th><?php esc_html_e( 'Actions', 'magic-checklists' ); ?></th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ( $checklists as $checklist ) : 
                    $priority = get_post_meta( $checklist->ID, '_mcl_priority', true );
                    // Set default priority to 'none' if empty or invalid
                    $priority = !empty($priority) ? $priority : 'none';
                    
                    // Get priority levels and colors from the admin class
                    $admin = new MCL_Admin();
                    $priority_levels = $admin->get_priority_levels();
                    $priority_colors = $admin->get_priority_colors();
                    
                    // Ensure we have a valid priority level
                    $priority_label = isset($priority_levels[$priority]) ? $priority_levels[$priority] : $priority_levels['none'];
                    $priority_color = isset($priority_colors[$priority]) ? $priority_colors[$priority] : $priority_colors['none'];
                ?>
                        <tr>
                            <td><?php echo esc_html( $checklist->post_title ); ?></td>
                            <td>
                                <span class="mcl-priority-badge" 
                                    style="background-color: <?php echo esc_attr($priority_colors[$priority]); ?>"
                                    data-priority="<?php echo esc_attr($priority); ?>">
                                    <?php echo esc_html($priority_levels[$priority]); ?>
                                </span>
                            </td>
                            <td class="mcl-tags-cell">
                                <?php
                                $saved_tags = get_post_meta($checklist->ID, '_mcl_tags', true);
                                if (is_array($saved_tags)) {
                                    foreach ($saved_tags as $tag) {
                                        printf(
                                            '<span class="mcl-tag-badge" style="background-color: %s">%s</span>',
                                            esc_attr($tag['color']),
                                            esc_html($tag['name'])
                                        );
                                    }
                                }
                                ?>
                            </td>
                            <td><?php echo esc_html( $checklist->post_content ); ?></td>
                            <td class="mcl-toggle-cell">
                                <div class="mcl-toggle-switch">
                                    <input type="checkbox" class="mcl-toggle-active" id="mcl-toggle-<?php echo esc_attr( $checklist->ID ); ?>" data-checklist-id="<?php echo esc_attr( $checklist->ID ); ?>" <?php checked( get_post_meta( $checklist->ID, '_mcl_active', true ), '1' ); ?>
                                    data-nonce="<?php echo wp_create_nonce( 'mcl_toggle_active' ); ?>">
                                    <label for="mcl-toggle-<?php echo esc_attr( $checklist->ID ); ?>" class="mcl-switch-label"></label>
                                </div>
                            </td>
                            <td><?php echo esc_html( get_post_meta( $checklist->ID, '_mcl_keyboard_shortcut', true ) ); ?></td>
                            <td>
                                <a href="<?php echo admin_url( 'admin.php?page=mcl_add_new&checklist_id=' . $checklist->ID ); ?>" class="mcl-action-button mcl-edit"><?php esc_html_e( 'Edit', 'magic-checklists' ); ?></a>
                                <a href="<?php echo wp_nonce_url( admin_url( 'admin-post.php?action=delete_checklist&checklist_id=' . $checklist->ID ), 'mcl_delete_checklist' ); ?>" class="mcl-action-button mcl-delete" onclick="return confirm('<?php esc_html_e( 'Are you sure you want to delete this checklist?', 'magic-checklists' ); ?>');"><?php esc_html_e( 'Delete', 'magic-checklists' ); ?></a>
                                <a href="<?php echo wp_nonce_url( admin_url( 'admin-post.php?action=clone_checklist&checklist_id=' . $checklist->ID ), 'mcl_clone_checklist' ); ?>" class="mcl-action-button mcl-clone"><?php esc_html_e( 'Clone', 'magic-checklists' ); ?></a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php else : ?>
            <div class="mcl-empty-state">
                <p class="mcl-description">
                    <?php esc_html_e( 'No checklists found. Create your first checklist to get started.', 'magic-checklists' ); ?>
                </p>
                <a href="<?php echo admin_url( 'admin.php?page=mcl_add_new' ); ?>" class="mcl-button mcl-button-primary">
                    <?php esc_html_e( 'Create First Checklist', 'magic-checklists' ); ?>
                </a>
            </div>
        <?php endif; ?>
</div>