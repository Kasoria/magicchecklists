<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
$theme_class = $theme === 'dark' ? 'mcl-theme-dark' : 'mcl-theme-light';
?>
<div id="mcl-drawer" class="<?php echo esc_attr( $theme_class ); ?>">
  <div class="mcl-drawer-content <?php echo esc_attr( $theme_class ); ?>" data-checklist-id="<?php echo esc_attr( $checklist->ID ); ?>">
    <div class="mcl-congratulations">
        <div class="mcl-congrats-message">
            <?php esc_html_e('Great job! 🎉', 'magic-checklists'); ?>
        </div>
    </div>
    <button id="mcl-drawer-close">&times;</button>
    <h2 contenteditable="true" class="mcl-item-heading"><?php echo esc_html( $checklist->post_title ); ?></h2>
    <?php if ( $time_date ) : ?>
    <div class="mcl-deadline" id="mcl-deadline-container">
        <p>
            <strong><?php esc_html_e( 'Deadline:', 'magic-checklists' ); ?></strong>
            <span id="mcl-countdown" data-deadline="<?php echo esc_attr( $time_date ); ?>"></span>
        </p>
    </div>
    <?php endif; ?>
    <div class="mcl-progress-counter">
        <div class="mcl-progress-stats">
            <span class="mcl-total-items">0 items</span>
            <span class="mcl-checked-items">0 completed</span>
            <span class="mcl-completion-percentage">0% <?php esc_html_e('complete', 'magic-checklists'); ?></span>
        </div>
        <div class="mcl-progress-bar">
            <div class="mcl-progress-fill"></div>
        </div>
    </div>
    <ul id="mcl-items">
    <?php if ( ! empty( $items ) ) : ?>
        <?php foreach ( $items as $index => $item ) :
            $is_checked = in_array( $item['id'], $checked_state );
            $display_type = get_post_meta($checklist->ID, '_mcl_priority_display_type', true) ?: 'color';
        ?>
            <li data-item-id="<?php echo esc_attr( $item['id'] ); ?>">
            <span class="drag-handle">☰</span>
            <input type="checkbox" class="mcl-item-checkbox" <?php checked( $is_checked ); ?>>
            <?php 
            if (get_post_meta($checklist->ID, '_mcl_enable_item_priority', true)) : 
                $item_priority = isset($item['priority']) ? $item['priority'] : 'none';
                if ($display_type === 'number') {
                    $priority_numbers = MCL_Priority_Utils::get_priority_numbers();
                    $priority_value = $priority_numbers[$item_priority];
            ?>
                <span class="mcl-item-priority" 
                      data-priority="<?php echo esc_attr($item_priority); ?>"
                      data-display="number">
                    <?php echo esc_html($priority_value); ?>
                </span>
            <?php } else { 
                $priority_color = $this->get_priority_colors()[$item_priority];
            ?>
                <span class="mcl-item-priority" 
                      data-priority="<?php echo esc_attr($item_priority); ?>"
                      data-display="color"
                      style="background-color: <?php echo esc_attr($priority_color); ?>">
                </span>
            <?php } ?>
            <?php endif; ?>
            <!-- Replace span with div here -->
            <div contenteditable="true" class="mcl-item-content<?php echo $is_checked ? ' mcl-checked' : ''; ?>">
                <?php 
                // Safely output content allowing specific HTML tags
                echo wp_kses(
                    $item['content'], 
                    array(
                        'a' => array(
                            'href' => array(),
                            'target' => array(),
                            'rel' => array(),
                            'class' => array()
                        ),
                        'br' => array(),
                        'em' => array(),
                        'strong' => array(),
                        'span' => array(
                            'class' => array()
                        )
                    )
                ); 
                ?>
            </div>
            <div class="mcl-list-item-actions">
                <button type="button" class="mcl-remove-item mcl-remove-icon">×</button>
            </div>
        </li>
        <?php endforeach; ?>
    <?php endif; ?>
</ul>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const priorityColors = <?php echo json_encode($this->get_priority_colors()); ?>;
    const priorityNumbers = <?php echo json_encode(MCL_Priority_Utils::get_priority_numbers()); ?>;
    const displayType = '<?php echo get_post_meta($checklist->ID, '_mcl_priority_display_type', true) ?: 'color'; ?>';
    
    // Update priority indicators when priorities are loaded
    function updatePriorityIndicators() {
        document.querySelectorAll('.mcl-item-priority').forEach(indicator => {
            const priority = indicator.dataset.priority || 'none';
            if (displayType === 'number') {
                indicator.textContent = priorityNumbers[priority];
                indicator.setAttribute('data-display', 'number');
                indicator.style.backgroundColor = ''; // Remove color background
            } else {
                indicator.textContent = '';
                indicator.setAttribute('data-display', 'color');
                indicator.style.backgroundColor = priorityColors[priority];
            }
        });
    }
    updatePriorityIndicators();
});
</script>