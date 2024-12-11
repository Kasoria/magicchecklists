<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>

<div class="mcl-wrap">
    <div class="mcl-header">
        <div class="mcl-title-wrapper">
            <h1 class="mcl-title"><?php esc_html_e( 'Import Checklist', 'magic-checklists' ); ?></h1>
            <div class="mcl-actions">
                <a href="<?php echo admin_url( 'admin.php?page=mcl_checklists' ); ?>" class="mcl-button mcl-button-secondary">
                    <span class="dashicons dashicons-arrow-left-alt"></span>
                    <?php esc_html_e( 'Back to Checklists', 'magic-checklists' ); ?>
                </a>
            </div>
        </div>
        <div class="mcl-intro">
            <p class="mcl-description mcl-description-light">
                <?php esc_html_e( 'Import your existing checklist items by pasting them below. Each line will be converted into a separate checklist item automatically.', 'magic-checklists' ); ?>
            </p>
        </div>
    </div>

    <div class="mcl-content">
        <form method="post" action="<?php echo admin_url( 'admin-post.php' ); ?>" class="mcl-form mcl-import-form">
            <?php wp_nonce_field( 'mcl_import_checklist', 'mcl_nonce' ); ?>
            <input type="hidden" name="action" value="import_checklist">
            
            <div class="mcl-form-group">
                <label for="mcl_import_textarea" class="mcl-label">
                    <?php esc_html_e( 'Checklist Items', 'magic-checklists' ); ?>
                </label>
                <textarea 
                    name="checklist_items" 
                    id="mcl_import_textarea" 
                    class="mcl-textarea" 
                    rows="10" 
                    required 
                    placeholder="<?php echo esc_attr__( "Create website mockup in Figma\nOptimize images for web performance\nImplement responsive navigation menu", 'magic-checklists' ); ?>"
                ></textarea>
                <p class="mcl-description">
                    <?php esc_html_e( "Enter one item per line. Long items will wrap automatically but still count as one item. Press Enter only when you want to start a new item.", 'magic-checklists' ); ?>
                </p>
            </div>

            <div class="mcl-form-actions">
                <button type="submit" class="mcl-button mcl-button-primary">
                    <span class="dashicons dashicons-upload"></span>
                    <?php esc_html_e( 'Import Items', 'magic-checklists' ); ?>
                </button>
            </div>
        </form>
    </div>
</div>