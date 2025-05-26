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
                    <span class="mcl-icon-selector">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 24"><path fill="currentColor" d="M5.523 4.75a.75.75 0 0 0-.75.75v1.625a.75.75 0 0 1-1.5 0V5.5a2.25 2.25 0 0 1 2.25-2.25h1.625a.75.75 0 0 1 0 1.5zM9.648 4a.75.75 0 0 1 .75-.75h3.25a.75.75 0 1 1 0 1.5h-3.25a.75.75 0 0 1-.75-.75m6.5 0a.75.75 0 0 1 .75-.75h1.625a2.25 2.25 0 0 1 2.25 2.25v1.625a.75.75 0 1 1-1.5 0V5.5a.75.75 0 0 0-.75-.75h-1.625a.75.75 0 0 1-.75-.75M4.023 9.625a.75.75 0 0 1 .75.75v3.25a.75.75 0 0 1-1.5 0v-3.25a.75.75 0 0 1 .75-.75m16 0a.75.75 0 0 1 .75.75v3.25a.75.75 0 0 1-.724.75l-.748-.546a.8.8 0 0 1-.028-.204v-3.25a.75.75 0 0 1 .75-.75M12.127 20.65l-.151-1.4h-1.578a.75.75 0 0 0 0 1.5h1.742zm-8.104-4.525a.75.75 0 0 1 .75.75V18.5c0 .414.336.75.75.75h1.625a.75.75 0 0 1 0 1.5H5.523a2.25 2.25 0 0 1-2.25-2.25v-1.625a.75.75 0 0 1 .75-.75"/><path fill="currentColor" fill-rule="evenodd" d="M13.01 11.726a.75.75 0 0 1 .818.044l6.525 4.767a.75.75 0 0 1-.305 1.343l-2.364.438l1.259 2.181a.75.75 0 0 1-1.3.75l-1.259-2.181l-1.562 1.829a.75.75 0 0 1-1.316-.407l-.866-8.034a.75.75 0 0 1 .37-.73m1.8 6.874l.778-.91a2.25 2.25 0 0 1 1.3-.75l1.176-.218l-3.75-2.74z" clip-rule="evenodd"/></svg>
                    </span>
                    <span class="mcl-icon-navigate" style="display: none;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M12.5 5.5V2m0 10V9m0 13c6 0 7.5-4.51 7.5-10S18.5 2 12.5 2S5 6.51 5 12s1.5 10 7.5 10"/><path d="M14 7c0-.466 0-.699-.076-.883a1 1 0 0 0-.541-.54c-.184-.077-.417-.077-.883-.077s-.699 0-.883.076a1 1 0 0 0-.54.541C11 6.301 11 6.534 11 7v.5c0 .466 0 .699.076.883a1 1 0 0 0 .541.54c.184.077.417.077.883.077s.699 0 .883-.076a1 1 0 0 0 .54-.541C14 8.199 14 7.966 14 7.5zm-8.5 5h14"/></g></svg>
                    </span>
                    <span class="mcl-mode-text"><?php _e('Select Mode', 'magic-checklists'); ?></span>
                </div>
                <button type="button" class="mcl-button mcl-button-secondary mcl-toggle-mode" id="mcl-toggle-mode">
                    <span class="mcl-icon-selector" style="display: none;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 24"><path fill="currentColor" d="M5.523 4.75a.75.75 0 0 0-.75.75v1.625a.75.75 0 0 1-1.5 0V5.5a2.25 2.25 0 0 1 2.25-2.25h1.625a.75.75 0 0 1 0 1.5zM9.648 4a.75.75 0 0 1 .75-.75h3.25a.75.75 0 1 1 0 1.5h-3.25a.75.75 0 0 1-.75-.75m6.5 0a.75.75 0 0 1 .75-.75h1.625a2.25 2.25 0 0 1 2.25 2.25v1.625a.75.75 0 1 1-1.5 0V5.5a.75.75 0 0 0-.75-.75h-1.625a.75.75 0 0 1-.75-.75M4.023 9.625a.75.75 0 0 1 .75.75v3.25a.75.75 0 0 1-1.5 0v-3.25a.75.75 0 0 1 .75-.75m16 0a.75.75 0 0 1 .75.75v3.25a.75.75 0 0 1-.724.75l-.748-.546a.8.8 0 0 1-.028-.204v-3.25a.75.75 0 0 1 .75-.75M12.127 20.65l-.151-1.4h-1.578a.75.75 0 0 0 0 1.5h1.742zm-8.104-4.525a.75.75 0 0 1 .75.75V18.5c0 .414.336.75.75.75h1.625a.75.75 0 0 1 0 1.5H5.523a2.25 2.25 0 0 1-2.25-2.25v-1.625a.75.75 0 0 1 .75-.75"/><path fill="currentColor" fill-rule="evenodd" d="M13.01 11.726a.75.75 0 0 1 .818.044l6.525 4.767a.75.75 0 0 1-.305 1.343l-2.364.438l1.259 2.181a.75.75 0 0 1-1.3.75l-1.259-2.181l-1.562 1.829a.75.75 0 0 1-1.316-.407l-.866-8.034a.75.75 0 0 1 .37-.73m1.8 6.874l.778-.91a2.25 2.25 0 0 1 1.3-.75l1.176-.218l-3.75-2.74z" clip-rule="evenodd"/></svg>
                    </span>
                    <span class="mcl-icon-navigate">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M12.5 5.5V2m0 10V9m0 13c6 0 7.5-4.51 7.5-10S18.5 2 12.5 2S5 6.51 5 12s1.5 10 7.5 10"/><path d="M14 7c0-.466 0-.699-.076-.883a1 1 0 0 0-.541-.54c-.184-.077-.417-.077-.883-.077s-.699 0-.883.076a1 1 0 0 0-.54.541C11 6.301 11 6.534 11 7v.5c0 .466 0 .699.076.883a1 1 0 0 0 .541.54c.184.077.417.077.883.077s.699 0 .883-.076a1 1 0 0 0 .54-.541C14 8.199 14 7.966 14 7.5zm-8.5 5h14"/></g></svg>
                    </span>
                    <span><?php _e('Navigate', 'magic-checklists'); ?></span>
                </button>
            </div>

            <!-- Quick Actions -->
            <div class="mcl-actions-section">
                <button type="button" class="mcl-button mcl-button-secondary mcl-button-outline mcl-preview-tour" id="mcl-preview-tour">
                    <span class="dashicons dashicons-visibility"></span>
                    <?php _e('Preview', 'magic-checklists'); ?>
                </button>
                <button type="button" class="mcl-button mcl-button-primary mcl-save-tour" id="mcl-save-tour">
                    <span class="dashicons dashicons-saved"></span>
                    <?php _e('Save', 'magic-checklists'); ?>
                </button>
                <button type="button" class="mcl-button mcl-button-danger mcl-exit-creator" id="mcl-exit-creator">
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

    <!-- Toast Notification Container -->
    <div class="mcl-toast-container" id="mcl-toast-container"></div>

    <!-- Confirmation Modal -->
    <div class="mcl-confirmation-modal" id="mcl-confirmation-modal">
        <div class="mcl-confirmation-modal-content">
            <div class="mcl-confirmation-modal-inner">
                <button type="button" class="mcl-confirmation-modal-close" id="mcl-confirmation-modal-close">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path fill="currentColor" fill-rule="evenodd" d="M4.28 3.22a.75.75 0 0 0-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06L8 9.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L9.06 8l3.72-3.72a.75.75 0 0 0-1.06-1.06L8 6.94L4.28 3.22Z" clip-rule="evenodd"/>
                    </svg>
                    <span class="sr-only"><?php _e('Close modal', 'magic-checklists'); ?></span>
                </button>
                <div class="mcl-confirmation-modal-body">
                    <div class="mcl-confirmation-modal-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                    </div>
                    <h3 class="mcl-confirmation-modal-title" id="mcl-confirmation-modal-title">
                        <?php _e('Are you sure?', 'magic-checklists'); ?>
                    </h3>
                    <div class="mcl-confirmation-modal-actions">
                        <button type="button" class="mcl-button mcl-button-danger" id="mcl-confirmation-modal-confirm">
                            <?php _e('Yes, I\'m sure', 'magic-checklists'); ?>
                        </button>
                        <button type="button" class="mcl-button mcl-button-secondary" id="mcl-confirmation-modal-cancel">
                            <?php _e('No, cancel', 'magic-checklists'); ?>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
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
                            <button type="button" class="mcl-button mcl-button-secondary mcl-reselect-element" id="mcl-reselect-element" title="<?php _e('Click to select element visually', 'magic-checklists'); ?>">
                                <span class="mcl-icon-selector">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 24"><path fill="currentColor" d="M5.523 4.75a.75.75 0 0 0-.75.75v1.625a.75.75 0 0 1-1.5 0V5.5a2.25 2.25 0 0 1 2.25-2.25h1.625a.75.75 0 0 1 0 1.5zM9.648 4a.75.75 0 0 1 .75-.75h3.25a.75.75 0 1 1 0 1.5h-3.25a.75.75 0 0 1-.75-.75m6.5 0a.75.75 0 0 1 .75-.75h1.625a2.25 2.25 0 0 1 2.25 2.25v1.625a.75.75 0 1 1-1.5 0V5.5a.75.75 0 0 0-.75-.75h-1.625a.75.75 0 0 1-.75-.75M4.023 9.625a.75.75 0 0 1 .75.75v3.25a.75.75 0 0 1-1.5 0v-3.25a.75.75 0 0 1 .75-.75m16 0a.75.75 0 0 1 .75.75v3.25a.75.75 0 0 1-.724.75l-.748-.546a.8.8 0 0 1-.028-.204v-3.25a.75.75 0 0 1 .75-.75M12.127 20.65l-.151-1.4h-1.578a.75.75 0 0 0 0 1.5h1.742zm-8.104-4.525a.75.75 0 0 1 .75.75V18.5c0 .414.336.75.75.75h1.625a.75.75 0 0 1 0 1.5H5.523a2.25 2.25 0 0 1-2.25-2.25v-1.625a.75.75 0 0 1 .75-.75"/><path fill="currentColor" fill-rule="evenodd" d="M13.01 11.726a.75.75 0 0 1 .818.044l6.525 4.767a.75.75 0 0 1-.305 1.343l-2.364.438l1.259 2.181a.75.75 0 0 1-1.3.75l-1.259-2.181l-1.562 1.829a.75.75 0 0 1-1.316-.407l-.866-8.034a.75.75 0 0 1 .37-.73m1.8 6.874l.778-.91a2.25 2.25 0 0 1 1.3-.75l1.176-.218l-3.75-2.74z" clip-rule="evenodd"/></svg>
                                </span>
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
            <button type="button" class="mcl-button mcl-button-secondary" id="mcl-step-editor-cancel">
                <?php _e('Cancel', 'magic-checklists'); ?>
            </button>
            <button type="button" class="mcl-button mcl-button-primary" id="mcl-step-editor-save">
                <?php _e('Save Step', 'magic-checklists'); ?>
            </button>
        </div>
    </div>
</div>


