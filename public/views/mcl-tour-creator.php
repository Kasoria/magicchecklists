<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>

<!-- Minimal Tour Creator Floating UI -->
<div id="mcl-tour-creator" class="mcl-tour-creator">
    <!-- Floating Control Panel -->
    <div class="mcl-tour-floating-panel" id="mcl-tour-floating-panel">
        <div class="mcl-panel-header">
            <div class="mcl-panel-drag-handle">
                <span class="dashicons dashicons-move"></span>
                <span class="mcl-panel-title"><?php _e('Tour Creator', 'magic-checklists'); ?></span>
            </div>
            <button type="button" class="mcl-panel-toggle" id="mcl-panel-toggle">
                <span class="dashicons dashicons-arrow-down-alt2"></span>
            </button>
        </div>
        
        <div class="mcl-panel-content">
            <!-- Mode Indicator and Toggle -->
            <div class="mcl-mode-section">
                <div class="mcl-mode-indicator" data-mode="select">
                    <span class="dashicons dashicons-crosshairs"></span>
                    <span class="mcl-mode-text"><?php _e('Select Mode', 'magic-checklists'); ?></span>
                </div>
                <button type="button" class="button button-small mcl-toggle-mode" id="mcl-toggle-mode">
                    <span class="dashicons dashicons-move"></span>
                    <?php _e('Navigate', 'magic-checklists'); ?>
                </button>
            </div>

            <!-- Quick Actions -->
            <div class="mcl-actions-section">
                <button type="button" class="button button-small mcl-preview-tour" id="mcl-preview-tour">
                    <span class="dashicons dashicons-visibility"></span>
                    <?php _e('Preview', 'magic-checklists'); ?>
                </button>
                <button type="button" class="button button-small mcl-save-tour" id="mcl-save-tour">
                    <span class="dashicons dashicons-saved"></span>
                    <?php _e('Save', 'magic-checklists'); ?>
                </button>
                <button type="button" class="button button-small mcl-exit-creator" id="mcl-exit-creator">
                    <span class="dashicons dashicons-no-alt"></span>
                    <?php _e('Exit', 'magic-checklists'); ?>
                </button>
            </div>

            <!-- Steps Counter -->
            <div class="mcl-steps-info" id="mcl-steps-info">
                <div class="mcl-steps-header" id="mcl-steps-header">
                    <span class="mcl-steps-count" id="mcl-steps-count">0 <?php _e('steps', 'magic-checklists'); ?></span>
                    <button type="button" class="mcl-steps-toggle" id="mcl-steps-toggle">
                        <span class="dashicons dashicons-arrow-down-alt2"></span>
                    </button>
                </div>
                <div class="mcl-steps-list" id="mcl-steps-list" style="display: none;">
                    <div class="mcl-no-steps" id="mcl-no-steps">
                        <?php _e('No steps added yet. Click on elements to create steps.', 'magic-checklists'); ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Hidden tour title for saving -->
    <input type="hidden" id="mcl-tour-title" value="">
</div>

<!-- Step Editor Modal -->
<div id="mcl-step-editor-modal" class="mcl-tour-step-modal">
    <div class="mcl-modal-content">
        <div class="mcl-modal-header">
            <h3><?php _e('Edit Tour Step', 'magic-checklists'); ?></h3>
            <button type="button" class="mcl-modal-close" id="mcl-step-editor-close">
                <span class="dashicons dashicons-no-alt"></span>
            </button>
        </div>
        
        <div class="mcl-modal-body">
            <form id="mcl-step-editor-form">
                <div class="mcl-form-group">
                    <label for="mcl-step-title"><?php _e('Step Title', 'magic-checklists'); ?></label>
                    <input type="text" id="mcl-step-title" name="title" class="mcl-form-control" placeholder="<?php _e('Enter step title...', 'magic-checklists'); ?>">
                </div>

                <div class="mcl-form-group">
                    <label for="mcl-step-content"><?php _e('Step Content', 'magic-checklists'); ?></label>
                    <textarea id="mcl-step-content" name="content" rows="5" class="mcl-form-control" placeholder="<?php _e('Enter the content for this step...', 'magic-checklists'); ?>"></textarea>
                    <p class="description"><?php _e('You can use HTML for formatting.', 'magic-checklists'); ?></p>
                </div>

                <div class="mcl-form-group mcl-form-row">
                    <div class="mcl-form-col">
                        <label for="mcl-step-checklist"><?php _e('Link to Checklist', 'magic-checklists'); ?></label>
                        <select id="mcl-step-checklist" name="checklist_id" class="mcl-form-control">
                            <option value=""><?php _e('Select a checklist (optional)', 'magic-checklists'); ?></option>
                        </select>
                    </div>
                    <div class="mcl-form-col">
                        <label for="mcl-step-checklist-item"><?php _e('Link to Item', 'magic-checklists'); ?></label>
                        <select id="mcl-step-checklist-item" name="checklist_item_id" class="mcl-form-control" disabled>
                            <option value=""><?php _e('Select an item (optional)', 'magic-checklists'); ?></option>
                        </select>
                    </div>
                </div>

                <div class="mcl-form-group mcl-form-row">
                    <div class="mcl-form-col">
                        <label for="mcl-step-position"><?php _e('Popover Position', 'magic-checklists'); ?></label>
                        <select id="mcl-step-position" name="position" class="mcl-form-control">
                            <option value="bottom"><?php _e('Bottom (Default)', 'magic-checklists'); ?></option>
                            <option value="top"><?php _e('Top', 'magic-checklists'); ?></option>
                            <option value="left"><?php _e('Left', 'magic-checklists'); ?></option>
                            <option value="right"><?php _e('Right', 'magic-checklists'); ?></option>
                        </select>
                    </div>
                    <div class="mcl-form-col">
                        <label for="mcl-step-element"><?php _e('Target Element', 'magic-checklists'); ?></label>
                        <div class="mcl-selector-group">
                            <input type="text" id="mcl-step-element" name="element" class="mcl-form-control" placeholder="<?php _e('CSS selector (e.g., #my-button)', 'magic-checklists'); ?>">
                            <button type="button" class="button button-small mcl-reselect-element" id="mcl-reselect-element" title="<?php _e('Click to select element visually', 'magic-checklists'); ?>">
                                <span class="dashicons dashicons-crosshairs"></span>
                            </button>
                        </div>
                        <p class="description"><?php _e('Enter a CSS selector or click the crosshairs to select an element visually.', 'magic-checklists'); ?></p>
                    </div>
                </div>

                <div class="mcl-form-group">
                    <label for="mcl-step-page-url"><?php _e('Page URL', 'magic-checklists'); ?></label>
                    <input type="text" id="mcl-step-page-url" name="page_url" class="mcl-form-control" placeholder="<?php _e('Leave empty for current page', 'magic-checklists'); ?>">
                    <p class="description"><?php _e('The page where this step should appear. Leave empty to use the current page. Include the path starting with /, e.g., /wp-admin/admin.php?page=some-page', 'magic-checklists'); ?></p>
                </div>

                <div class="mcl-form-group">
                    <label>
                        <input type="checkbox" id="mcl-step-show-buttons" name="show_buttons" checked>
                        <?php _e('Show navigation buttons', 'magic-checklists'); ?>
                    </label>
                </div>

                <input type="hidden" id="mcl-step-index" name="step_index">
            </form>
        </div>
        
        <div class="mcl-modal-footer">
            <button type="button" class="button button-secondary" id="mcl-step-editor-cancel">
                <?php _e('Cancel', 'magic-checklists'); ?>
            </button>
            <button type="button" class="button button-primary" id="mcl-step-editor-save">
                <?php _e('Save Step', 'magic-checklists'); ?>
            </button>
        </div>
    </div>
</div>


