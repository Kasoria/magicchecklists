<?php
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="mcl-wrap">
    <div class="mcl-header">
        <div class="mcl-title-wrapper">
            <h1 class="mcl-title"><?php esc_html_e('Import / Export Checklists', 'magic-checklists'); ?></h1>
            <div class="mcl-actions">
                <a href="<?php echo admin_url('admin.php?page=mcl_checklists'); ?>" class="mcl-button mcl-button-secondary">
                    <span class="dashicons dashicons-arrow-left-alt"></span>
                    <?php esc_html_e('Back to Checklists', 'magic-checklists'); ?>
                </a>
            </div>
        </div>
    </div>

    <div class="mcl-content">
        <div class="mcl-tabs">
            <ul class="mcl-tabs-nav">
                <li class="mcl-tab-item">
                    <a href="#import" class="mcl-tab-link active" data-tab="import">
                        <?php esc_html_e('Import', 'magic-checklists'); ?>
                    </a>
                </li>
                <li class="mcl-tab-item">
                    <a href="#export" class="mcl-tab-link" data-tab="export">
                        <?php esc_html_e('Export', 'magic-checklists'); ?>
                    </a>
                </li>
            </ul>
        </div>

        <!-- Import Tab -->
        <div id="import" class="mcl-tab-content active">
            <form method="post" action="<?php echo admin_url('admin-post.php'); ?>" class="mcl-form mcl-import-form">
                <?php wp_nonce_field('mcl_import_checklist', 'mcl_nonce'); ?>
                <input type="hidden" name="action" value="import_checklist">
                
                <div class="mcl-form-group">
                    <label for="mcl_import_textarea" class="mcl-label">
                        <?php esc_html_e('Checklist Items', 'magic-checklists'); ?>
                    </label>
                    <textarea 
                        name="checklist_items" 
                        id="mcl_import_textarea" 
                        class="mcl-textarea" 
                        rows="10" 
                        required 
                        placeholder="<?php echo esc_attr__("Create website mockup in Figma\nOptimize images for web performance\nImplement responsive navigation menu", 'magic-checklists'); ?>"
                    ></textarea>
                    <p class="mcl-description">
                        <?php esc_html_e("Enter one item per line. Long items will wrap automatically but still count as one item. Press Enter only when you want to start a new item.", 'magic-checklists'); ?>
                    </p>
                </div>

                <div class="mcl-form-actions">
                    <button type="submit" class="mcl-button mcl-button-primary">
                        <span class="dashicons dashicons-upload"></span>
                        <?php esc_html_e('Import Items', 'magic-checklists'); ?>
                    </button>
                </div>
            </form>
            <div class="mcl-form-group">
                <h3 class="mcl-section-title"><?php esc_html_e('Import complete checklist from JSON file', 'magic-checklists'); ?></h3>
                <form method="post" action="<?php echo admin_url('admin-post.php'); ?>" class="mcl-form mcl-import-form" enctype="multipart/form-data">
                    <?php wp_nonce_field('mcl_import_json_checklist', 'mcl_json_nonce'); ?>
                    <input type="hidden" name="action" value="import_json_checklist">
                    
                    <div class="mcl-form-group">
                        <label class="mcl-label">
                            <?php esc_html_e('JSON File', 'magic-checklists'); ?>
                        </label>
                        
                        <div class="mcl-json-upload-area" id="mcl-json-upload-area">
                            <div class="mcl-json-upload-message">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                <p><?php esc_html_e('Drag and drop JSON file here or click to select', 'magic-checklists'); ?></p>
                                <span class="mcl-json-upload-requirements"><?php esc_html_e('Only .json files are supported', 'magic-checklists'); ?></span>
                            </div>
                            <input 
                                type="file" 
                                name="json_file" 
                                id="mcl_json_file" 
                                class="mcl-json-file-input" 
                                accept=".json" 
                                required
                            >
                        </div>

                        <div class="mcl-json-preview">
                            <div class="mcl-json-preview-content">
                                <svg class="mcl-json-preview-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <path d="M10 12h4"/>
                                    <path d="M10 16h4"/>
                                </svg>
                                <div class="mcl-json-preview-info">
                                    <div class="mcl-json-preview-name"></div>
                                    <div class="mcl-json-preview-size"></div>
                                </div>
                                <button type="button" class="mcl-json-preview-remove">&times;</button>
                            </div>
                        </div>

                        <div class="mcl-json-error"></div>
                        
                        <p class="mcl-description">
                            <?php esc_html_e("Upload a JSON file exported from Magic Checklists. This will create a new checklist with all settings intact.", 'magic-checklists'); ?>
                        </p>
                    </div>

                    <div class="mcl-form-actions">
                        <button type="submit" class="mcl-button mcl-button-primary">
                            <span class="dashicons dashicons-upload"></span>
                            <?php esc_html_e('Import from JSON', 'magic-checklists'); ?>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Export Tab -->
        <div id="export" class="mcl-tab-content">
            <div class="mcl-export-options">
                <div class="mcl-export-main">
                <!-- Text Export -->
                <div class="mcl-export-option">
                    <h3 class="mcl-label"><?php esc_html_e('Plain Text Export', 'magic-checklists'); ?></h3>
                    <p><?php esc_html_e('Export your checklist as a simple text file with one item per line.', 'magic-checklists'); ?></p>
                    <form class="mcl-export-form" method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                        <?php wp_nonce_field('mcl_export_txt', 'mcl_nonce'); ?>
                        <input type="hidden" name="action" value="export_checklist_txt">
                        <select name="checklist_id" class="mcl-select" required>
                            <option value=""><?php esc_html_e('Select Checklist', 'magic-checklists'); ?></option>
                            <?php
                            $checklists = get_posts([
                                'post_type' => 'mcl_checklist',
                                'posts_per_page' => -1,
                                'orderby' => 'title',
                                'order' => 'ASC'
                            ]);
                            foreach ($checklists as $checklist) {
                                printf(
                                    '<option value="%d">%s</option>',
                                    $checklist->ID,
                                    esc_html($checklist->post_title)
                                );
                            }
                            ?>
                        </select>
                        <button type="submit" class="mcl-button mcl-button-secondary mcl-export-button">
                            <span class="dashicons dashicons-download"></span>
                            <?php esc_html_e('Download TXT', 'magic-checklists'); ?>
                        </button>
                    </form>
                </div>
                <!-- Complete Export -->
                <div class="mcl-export-option">
                    <h3 class="mcl-label"><?php esc_html_e('Complete Export', 'magic-checklists'); ?></h3>
                    <p><?php esc_html_e('Export complete checklist data including all settings and configurations.', 'magic-checklists'); ?></p>
                    <form class="mcl-export-form" method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                        <?php wp_nonce_field('mcl_export_json', 'mcl_nonce'); ?>
                        <input type="hidden" name="action" value="export_checklist_json">
                        <select name="checklist_id" class="mcl-select" required>
                            <option value=""><?php esc_html_e('Select Checklist', 'magic-checklists'); ?></option>
                            <?php
                            foreach ($checklists as $checklist) {
                                printf(
                                    '<option value="%d">%s</option>',
                                    $checklist->ID,
                                    esc_html($checklist->post_title)
                                );
                            }
                            ?>
                        </select>
                        <button type="submit" class="mcl-button mcl-button-secondary mcl-export-button">
                            <span class="dashicons dashicons-download"></span>
                            <?php esc_html_e('Download JSON', 'magic-checklists'); ?>
                        </button>
                    </form>
                </div>
                        </div>

                <!-- PDF Export -->
                <div class="mcl-export-option">
                    <h3 class="mcl-label"><?php esc_html_e('PDF Export', 'magic-checklists'); ?></h3>
                    <p><?php esc_html_e('Export your checklist as a PDF file with custom header and footer.', 'magic-checklists'); ?></p>
                    
                    <form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                        <?php wp_nonce_field('mcl_export_pdf', 'mcl_nonce'); ?>
                        <input type="hidden" name="action" value="export_checklist_pdf">
                        
                        <div class="mcl-form-group">
                            <select name="checklist_id" class="mcl-select" required>
                                <option value=""><?php esc_html_e('Select Checklist', 'magic-checklists'); ?></option>
                                <?php foreach ($checklists as $checklist): ?>
                                    <option value="<?php echo esc_attr($checklist->ID); ?>">
                                        <?php echo esc_html($checklist->post_title); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="mcl-pdf-settings">
                            <h4><?php esc_html_e('PDF Settings', 'magic-checklists'); ?></h4>
                            
                            <!-- Logo Settings -->
                            <div class="mcl-form-group">
                                <label class="mcl-label">
                                    <?php esc_html_e('Header Logo', 'magic-checklists'); ?>
                                </label>
                                <div class="mcl-logo-upload">
                                    <input type="hidden" name="pdf_logo_url" id="pdf_logo_url" 
                                        value="<?php echo esc_attr(get_option('mcl_pdf_logo_url', '')); ?>">
                                    <img src="<?php echo esc_url(get_option('mcl_pdf_logo_url', '')); ?>" 
                                        id="pdf_logo_preview" style="max-height: 100px; display: <?php echo get_option('mcl_pdf_logo_url') ? 'block' : 'none'; ?>">
                                    <button type="button" class="mcl-button mcl-button-secondary" id="upload_logo_button">
                                        <?php esc_html_e('Upload Logo', 'magic-checklists'); ?>
                                    </button>
                                    <button type="button" class="mcl-button mcl-button-secondary" id="remove_logo_button" 
                                            style="display: <?php echo get_option('mcl_pdf_logo_url') ? 'inline-block' : 'none'; ?>">
                                        <?php esc_html_e('Remove Logo', 'magic-checklists'); ?>
                                    </button>
                                </div>
                            </div>

                            <!-- Header Text -->
                            <div class="mcl-form-group">
                                <label for="pdf_header_text" class="mcl-label mcl-label-dark mcl-label-small">
                                    <?php esc_html_e('Header Text', 'magic-checklists'); ?>
                                </label>
                                <textarea name="pdf_header_text" id="pdf_header_text" class="mcl-textarea" rows="3"><?php 
                                    echo esc_textarea(get_option('mcl_pdf_header_text', '')); 
                                ?></textarea>
                            </div>

                            <!-- Contact Info -->
                            <div class="mcl-form-group">
                                <label for="pdf_contact_info" class="mcl-label mcl-label-dark mcl-label-small">
                                    <?php esc_html_e('Contact Information', 'magic-checklists'); ?>
                                </label>
                                <textarea name="pdf_contact_info" id="pdf_contact_info" class="mcl-textarea" rows="3"><?php 
                                    echo esc_textarea(get_option('mcl_pdf_contact_info', '')); 
                                ?></textarea>
                            </div>

                            <!-- Footer Text -->
                            <div class="mcl-form-group">
                                <label for="pdf_footer_text" class="mcl-label mcl-label-dark mcl-label-small">
                                    <?php esc_html_e('Footer Text', 'magic-checklists'); ?>
                                </label>
                                <textarea name="pdf_footer_text" id="pdf_footer_text" class="mcl-textarea" rows="3"><?php 
                                    echo esc_textarea(get_option('mcl_pdf_footer_text', '')); 
                                ?></textarea>
                            </div>
                        </div>

                        <div class="mcl-form-actions">
                            <button type="submit" class="mcl-button mcl-button-secondary">
                                <span class="dashicons dashicons-download"></span>
                                <?php esc_html_e('Generate PDF', 'magic-checklists'); ?>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>