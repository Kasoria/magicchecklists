<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Template for rendering floating checklist buttons
 * 
 * @package MagicChecklists
 */

$is_multi = count($active_checklists) > 1;
$container_classes = ['mcl-floating-buttons'];
$fab_trigger_is_draggable = false;

if ($is_multi) {
    $container_classes[] = 'mcl-is-multi-trigger';
    $container_classes[] = 'position-bottom-right';

    // Check if any checklist *within* the FAB group is set to be draggable, 
    // if so, the FAB trigger itself becomes draggable.
    foreach ($active_checklists as $checklist) {
        if (get_post_meta($checklist->ID, '_mcl_button_position', true) === 'draggable') {
            $fab_trigger_is_draggable = true;
            break;
        }
    }
    if ($fab_trigger_is_draggable) {
        // Container needs this to act as the draggable area boundary for the FAB trigger
        $container_classes[] = 'has-draggable-fab'; 
    }

} else if (!empty($active_checklists)) {
    $container_classes[] = 'mcl-is-single';
    $first_checklist = reset($active_checklists);
    $position_setting = get_post_meta($first_checklist->ID, '_mcl_button_position', true) ?: 'bottom-right';
    
    if ($position_setting === 'draggable') {
        // If the single button itself is draggable, the container sets up the boundary
        $container_classes[] = 'has-draggable'; 
    } else {
        // For fixed-position single button, container takes the position class
        $container_classes[] = 'position-' . $position_setting;
    }
} else {
    // No active checklists
}


?>
<div class="<?php echo esc_attr(trim(implode(' ', array_unique(array_filter($container_classes))))); ?>">
    <?php if ($is_multi) : ?>
        <button class="mcl-multi-fab-trigger <?php echo $fab_trigger_is_draggable ? 'draggable' : '' ?>" 
                aria-expanded="false" 
                aria-controls="mcl-fab-list" 
                title="<?php esc_attr_e('Toggle Checklists Menu', 'magic-checklists'); ?>"
                <?php if ($fab_trigger_is_draggable): ?>
                data-draggable="true"
                data-drag-target-container="true" <?php // Custom attribute to tell JS to drag the parent container ?>
                <?php endif; ?>
        >
            <svg class="mcl-fab-open-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <svg class="mcl-fab-close-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span class="mcl-sr-only"><?php esc_html_e('Toggle Checklists Menu', 'magic-checklists'); ?></span>
        </button>
        <div class="mcl-fab-list" id="mcl-fab-list" role="list" hidden>
            <?php 
            foreach ($active_checklists as $checklist) : 
                // Individual items in the FAB list are not draggable themselves; the whole group moves.
                $position = get_post_meta($checklist->ID, '_mcl_button_position', true) ?: 'bottom-right';
                
                $priority = get_post_meta($checklist->ID, '_mcl_priority', true) ?: 'none';
                $priority_color = MCL_Priority_Utils::get_priority_colors()[$priority];
                $priority_levels = MCL_Priority_Utils::get_priority_levels();
                $priority_label = isset($priority_levels[$priority]) ? $priority_levels[$priority] : $priority_levels['none'];
                
                $theme = get_post_meta($checklist->ID, '_mcl_theme', true) ?: 'light';
                $theme_class = 'mcl-theme-';
                switch ($theme) {
                    case 'dark': $theme_class .= 'dark'; break;
                    case 'custom': $theme_class .= 'custom'; break;
                    default: $theme_class .= 'light';
                }
                $short_title = get_post_meta($checklist->ID, '_mcl_short_title', true);
                $display_title = $short_title ?: $checklist->post_title;

                $button_classes_item = array(
                    'mcl-floating-button',
                    $theme_class,
                    ($priority !== 'none' ? 'has-priority' : '')
                );

            ?>
                <button 
                    class="<?php echo esc_attr(trim(implode(' ', array_filter($button_classes_item)))); ?>"
                    data-checklist-id="<?php echo esc_attr($checklist->ID); ?>"
                    data-position="<?php echo esc_attr($position); ?>" 
                    title="<?php echo esc_attr($checklist->post_title); ?>"
                >
                    <div class="mcl-floating-button-head">
                        <svg class="mcl-floating-button-svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M15.9701 12.8006H12.8901C12.4701 12.8006 12.1401 12.4706 12.1401 12.0506C12.1401 11.6406 12.4701 11.3006 12.8901 11.3006H15.9701C16.3901 11.3006 16.7201 11.6406 16.7201 12.0506C16.7201 12.4706 16.3901 12.8006 15.9701 12.8006ZM15.9701 17.6506H12.8901C12.4701 17.6506 12.1401 17.3106 12.1401 16.9006C12.1401 16.4906 12.4701 16.1506 12.8901 16.1506H15.9701C16.3901 16.1506 16.7201 16.4906 16.7201 16.9006C16.7201 17.3106 16.3901 17.6506 15.9701 17.6506ZM10.8101 11.2106L9.33007 12.6906C9.18007 12.8406 8.99007 12.9106 8.80007 12.9106C8.60007 12.9106 8.41007 12.8406 8.27007 12.6906L7.50007 11.9306C7.21007 11.6306 7.21007 11.1606 7.50007 10.8706C7.80007 10.5706 8.27007 10.5706 8.57007 10.8706L8.80007 11.1006L9.75007 10.1506C10.0401 9.85056 10.5201 9.85056 10.8101 10.1506C11.1001 10.4406 11.1001 10.9106 10.8101 11.2106ZM10.8101 16.0506L9.33007 17.5406C9.19007 17.6806 9.00007 17.7606 8.80007 17.7606C8.60007 17.7606 8.41007 17.6806 8.27007 17.5406L7.50007 16.7806C7.21007 16.4806 7.21007 16.0106 7.51007 15.7106C7.80007 15.4206 8.27007 15.4206 8.57007 15.7106L8.80007 15.9506L9.75007 14.9906C10.0401 14.7006 10.5201 14.7006 10.8101 14.9906C11.1001 15.2906 11.1001 15.7606 10.8101 16.0506ZM16.8928 4.38212C16.7728 4.34667 16.6552 4.43627 16.6374 4.56011C16.4646 5.75625 15.4285 6.68056 14.1901 6.68056H9.81007C8.57169 6.68056 7.52694 5.75639 7.35293 4.56039C7.3349 4.43647 7.21714 4.34685 7.09711 4.38253C5.34579 4.90305 4.07007 6.53496 4.07007 8.46056V17.3606C4.07007 19.7006 5.97007 21.6106 8.32007 21.6106H15.6801C18.0301 21.6106 19.9301 19.7006 19.9301 17.3606V8.46056C19.9301 6.53445 18.6537 4.90219 16.8928 4.38212Z" fill="currentColor"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M9.81357 5.48062H14.1936C14.8736 5.48062 15.4336 4.94062 15.4536 4.26063C15.4636 4.24063 15.4636 4.22062 15.4636 4.20062V3.66062C15.4636 2.96062 14.8936 2.39062 14.1936 2.39062H9.81357C9.11357 2.39062 8.53357 2.96062 8.53357 3.66062V4.20062C8.53357 4.22062 8.53357 4.23063 8.54357 4.25063C8.56357 4.94062 9.13357 5.48062 9.81357 5.48062Z" fill="currentColor"/>
                        </svg>
                        <?php if ($priority !== 'none'): ?>
                            <span class="mcl-priority-badge" 
                                  style="background-color: <?php echo esc_attr($priority_color); ?>"
                                  data-priority="<?php echo esc_attr($priority); ?>">
                                <?php echo esc_html($priority_label); ?>
                            </span>
                        <?php endif; ?>
                    </div>
                    <span class="mcl-floating-button-text">
                        <?php echo esc_html($display_title); ?>
                    </span>
                </button>
            <?php endforeach; ?>
        </div>
    <?php else : ?>
        <?php // Original loop for single button case
        foreach ($active_checklists as $checklist) : 
            $position = get_post_meta($checklist->ID, '_mcl_button_position', true) ?: 'bottom-right';
            $is_single_draggable = $position === 'draggable';
            
            $priority = get_post_meta($checklist->ID, '_mcl_priority', true) ?: 'none';
            $priority_color = MCL_Priority_Utils::get_priority_colors()[$priority];
            $priority_levels = MCL_Priority_Utils::get_priority_levels();
            $priority_label = isset($priority_levels[$priority]) ? $priority_levels[$priority] : $priority_levels['none'];
            
            $theme = get_post_meta($checklist->ID, '_mcl_theme', true) ?: 'light';
            $theme_class = 'mcl-theme-';
            switch ($theme) {
                case 'dark': $theme_class .= 'dark'; break;
                case 'custom': $theme_class .= 'custom'; break;
                default: $theme_class .= 'light';
            }
            $short_title = get_post_meta($checklist->ID, '_mcl_short_title', true);
            $display_title = $short_title ?: $checklist->post_title;

            $button_classes = array(
                'mcl-floating-button',
                $theme_class,
                ($priority !== 'none' ? 'has-priority' : ''),
                // If single button is draggable, it gets the .draggable class
                ($is_single_draggable ? 'draggable' : '') 
            );

        ?>
            <button 
                class="<?php echo esc_attr(trim(implode(' ', array_filter($button_classes)))); ?>"
                data-checklist-id="<?php echo esc_attr($checklist->ID); ?>"
                data-position="<?php echo esc_attr($position); ?>"
                <?php if ($is_single_draggable): ?>
                data-draggable="true"
                <?php endif; ?>
                title="<?php echo esc_attr($checklist->post_title); ?>"
            >
                <div class="mcl-floating-button-head">
                    <svg class="mcl-floating-button-svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M15.9701 12.8006H12.8901C12.4701 12.8006 12.1401 12.4706 12.1401 12.0506C12.1401 11.6406 12.4701 11.3006 12.8901 11.3006H15.9701C16.3901 11.3006 16.7201 11.6406 16.7201 12.0506C16.7201 12.4706 16.3901 12.8006 15.9701 12.8006ZM15.9701 17.6506H12.8901C12.4701 17.6506 12.1401 17.3106 12.1401 16.9006C12.1401 16.4906 12.4701 16.1506 12.8901 16.1506H15.9701C16.3901 16.1506 16.7201 16.4906 16.7201 16.9006C16.7201 17.3106 16.3901 17.6506 15.9701 17.6506ZM10.8101 11.2106L9.33007 12.6906C9.18007 12.8406 8.99007 12.9106 8.80007 12.9106C8.60007 12.9106 8.41007 12.8406 8.27007 12.6906L7.50007 11.9306C7.21007 11.6306 7.21007 11.1606 7.50007 10.8706C7.80007 10.5706 8.27007 10.5706 8.57007 10.8706L8.80007 11.1006L9.75007 10.1506C10.0401 9.85056 10.5201 9.85056 10.8101 10.1506C11.1001 10.4406 11.1001 10.9106 10.8101 11.2106ZM10.8101 16.0506L9.33007 17.5406C9.19007 17.6806 9.00007 17.7606 8.80007 17.7606C8.60007 17.7606 8.41007 17.6806 8.27007 17.5406L7.50007 16.7806C7.21007 16.4806 7.21007 16.0106 7.51007 15.7106C7.80007 15.4206 8.27007 15.4206 8.57007 15.7106L8.80007 15.9506L9.75007 14.9906C10.0401 14.7006 10.5201 14.7006 10.8101 14.9906C11.1001 15.2906 11.1001 15.7606 10.8101 16.0506ZM16.8928 4.38212C16.7728 4.34667 16.6552 4.43627 16.6374 4.56011C16.4646 5.75625 15.4285 6.68056 14.1901 6.68056H9.81007C8.57169 6.68056 7.52694 5.75639 7.35293 4.56039C7.3349 4.43647 7.21714 4.34685 7.09711 4.38253C5.34579 4.90305 4.07007 6.53496 4.07007 8.46056V17.3606C4.07007 19.7006 5.97007 21.6106 8.32007 21.6106H15.6801C18.0301 21.6106 19.9301 19.7006 19.9301 17.3606V8.46056C19.9301 6.53445 18.6537 4.90219 16.8928 4.38212Z" fill="currentColor"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M9.81357 5.48062H14.1936C14.8736 5.48062 15.4336 4.94062 15.4536 4.26063C15.4636 4.24063 15.4636 4.22062 15.4636 4.20062V3.66062C15.4636 2.96062 14.8936 2.39062 14.1936 2.39062H9.81357C9.11357 2.39062 8.53357 2.96062 8.53357 3.66062V4.20062C8.53357 4.22062 8.53357 4.23063 8.54357 4.25063C8.56357 4.94062 9.13357 5.48062 9.81357 5.48062Z" fill="currentColor"/>
                    </svg>
                    <?php if ($priority !== 'none'): ?>
                        <span class="mcl-priority-badge" 
                              style="background-color: <?php echo esc_attr($priority_color); ?>"
                              data-priority="<?php echo esc_attr($priority); ?>">
                            <?php echo esc_html($priority_label); ?>
                        </span>
                    <?php endif; ?>
                </div>
                <span class="mcl-floating-button-text">
                    <?php echo esc_html($display_title); ?>
                </span>
            </button>
        <?php endforeach; ?>
    <?php endif; ?>
</div>