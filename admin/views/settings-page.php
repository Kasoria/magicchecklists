<div class="wrap">
    <div class="mcl-wrap">
        <div class="mcl-header">
            <div class="mcl-title-wrapper">
                <h1 class="mcl-title">
                    <?php esc_html_e('Settings', 'magic-checklists'); ?>
                </h1>
            </div>
            <div class="mcl-intro">
                <p class="mcl-description mcl-description-light">
                    <?php esc_html_e('Configure MagicChecklists settings and preferences.', 'magic-checklists'); ?>
                </p>
            </div>
        </div>

        <div class="mcl-content">
            <div class="nav-tab-wrapper">
                <?php
                $active_tab = isset($_GET['tab']) ? sanitize_text_field($_GET['tab']) : 'general';
                ?>
                <a href="?page=mcl_settings&tab=general" 
                   class="nav-tab <?php echo $active_tab === 'general' ? 'nav-tab-active' : ''; ?>">
                    <?php esc_html_e('General', 'magic-checklists'); ?>
                </a>
                <a href="?page=mcl_settings&tab=integrations" 
                   class="nav-tab <?php echo $active_tab === 'integrations' ? 'nav-tab-active' : ''; ?>">
                    <?php esc_html_e('Integrations', 'magic-checklists'); ?>
                </a>
            </div>

            <?php if ($active_tab === 'general'): ?>
                <form method="post" action="options.php" class="mcl-form">
                    <?php
                    settings_fields('mcl_settings_group');
                    do_settings_sections('mcl_settings');
                    ?>
                    <div class="mcl-form-actions">
                        <?php submit_button(__('Save Settings', 'magic-checklists'), 'mcl-button mcl-button-primary'); ?>
                    </div>
                </form>
            <?php else: ?>
                <form method="post" action="options.php" class="mcl-form">
                    <?php
                    settings_fields('mcl_integration_settings_group');
                    do_settings_sections('mcl_integration_settings');
                    ?>
                    <div class="mcl-form-actions">
                        <?php submit_button(__('Save Integration Settings', 'magic-checklists'), 'mcl-button mcl-button-primary'); ?>
                    </div>
                </form>
            <?php endif; ?>
        </div>
    </div>
</div>