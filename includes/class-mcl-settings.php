<?php
if (!defined('ABSPATH')) {
    exit;
}

class MAGICCL_Settings {
    private static $instance = null;
    private $option_name = 'magiccl_settings';
    private $integration_option_name = 'magiccl_integration_settings';
    
    /**
     * Note: Menu position and date format settings are handled globally
     * in the MagicPlugins landing page (magic_plugins_settings option).
     * Use MAGICCL_Admin::get_shared_date_format() and MAGICCL_Admin::format_date()
     * for date formatting throughout the plugin.
     */
    
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'), 20);
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_settings_scripts'));
        
        // Add AJAX handlers for React settings
        add_action('wp_ajax_magiccl_get_settings', array($this, 'ajax_get_settings'));
        add_action('wp_ajax_magiccl_save_settings', array($this, 'ajax_save_settings'));
        add_action('wp_ajax_magiccl_get_webhook_logs', array($this, 'ajax_get_webhook_logs'));
        add_action('wp_ajax_magiccl_test_webhook', array($this, 'ajax_test_webhook'));
        add_action('wp_ajax_magiccl_clear_webhook_logs', array($this, 'ajax_clear_webhook_logs'));
        add_action('wp_ajax_magiccl_get_available_languages', array($this, 'ajax_get_available_languages'));
        
        // Add public AJAX handler for getting general settings (for frontend styling)
        add_action('wp_ajax_magiccl_get_general_settings', array($this, 'ajax_get_general_settings'));
        add_action('wp_ajax_nopriv_magiccl_get_general_settings', array($this, 'ajax_get_general_settings'));

    }

    public function enqueue_settings_scripts($hook) {
        if ($hook !== 'magicchecklists_page_magiccl_settings') {
            return;
        }

        // Since we're using React for settings now, we don't need the old integration settings JS
        // The React app handles all the settings functionality
        
        // Keep this method for backwards compatibility but don't enqueue the old script
        // wp_enqueue_script(
        //     'magiccl-integration-settings',
        //     MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/pages/magiccl-integration-settings.js',
        //     array(),
        //     MAGIC_CHECKLISTS_VERSION,
        //     true
        // );

        // The React admin app is already enqueued by the main admin class
    }
    
    public function add_settings_page() {
        add_submenu_page(
            'magiccl_checklists',
            __('Settings', 'magicchecklists'),
            __('Settings', 'magicchecklists'),
            'manage_options',
            'magiccl_settings',
            array($this, 'render_settings_page')
        );
    }
    
    public function register_settings() {
        register_setting(
            'magiccl_settings_group',
            $this->option_name,
            array(
                'type' => 'array',
                'sanitize_callback' => array($this, 'sanitize_settings')
            )
        );
        
        register_setting(
            'magiccl_integration_settings_group',
            $this->integration_option_name,
            array(
                'type' => 'array',
                'sanitize_callback' => array($this, 'sanitize_integration_settings')
            )
        );
        
        register_setting(
            'magiccl_dashboard_widget_settings_group',
            'magiccl_dashboard_widget_settings',
            array(
                'type' => 'array',
                'sanitize_callback' => array($this, 'sanitize_dashboard_widget_settings')
            )
        );

        add_settings_section(
            'magiccl_general_settings',
            __('General Settings', 'magicchecklists'),
            array($this, 'render_section_description'),
            'magiccl_settings'
        );

        add_settings_section(
            'magiccl_webhook_settings',
            __('API & Webhook settings', 'magicchecklists'),
            array($this, 'render_webhook_section_description'),
            'magiccl_integration_settings'
        );

        add_settings_section(
            'magiccl_dashboard_widget_settings',
            __('Dashboard Widget', 'magicchecklists'),
            array($this, 'render_dashboard_widget_section_description'),
            'magiccl_dashboard_settings'
        );

        add_settings_field(
            'enable_checklist_navigation',
            __('Checklist Arrow Buttons Navigation', 'magicchecklists'),
            array($this, 'render_checklist_navigation_field'),
            'magiccl_settings',
            'magiccl_general_settings'
        );

        add_settings_field(
            'enable_progress_counter',
            __('Progress Counter', 'magicchecklists'),
            array($this, 'render_progress_counter_field'),
            'magiccl_settings',
            'magiccl_general_settings'
        );

        add_settings_field(
            'delete_data_on_uninstall',
            __('Data Cleanup', 'magicchecklists'),
            array($this, 'render_delete_data_field'),
            'magiccl_settings',
            'magiccl_general_settings'
        );



        add_settings_field(
            'speed_dial_bg_color',
            __('Speed Dial Background Color', 'magicchecklists'),
            array($this, 'render_speed_dial_bg_color_field'),
            'magiccl_settings',
            'magiccl_general_settings'
        );

        add_settings_field(
            'speed_dial_icon_color',
            __('Speed Dial Icon Color', 'magicchecklists'),
            array($this, 'render_speed_dial_icon_color_field'),
            'magiccl_settings',
            'magiccl_general_settings'
        );



        add_settings_field(
            'enable_api',
            __('REST API Access', 'magicchecklists'),
            array($this, 'render_enable_api_field'),
            'magiccl_integration_settings',
            'magiccl_webhook_settings'
        );

        add_settings_field(
            'webhook_secret',
            __('Webhook Secret', 'magicchecklists'),
            array($this, 'render_webhook_secret_field'),
            'magiccl_integration_settings',
            'magiccl_webhook_settings'
        );

        add_settings_field(
            'webhook_endpoints',
            __('Webhook Endpoints', 'magicchecklists'),
            array($this, 'render_webhook_endpoints_field'),
            'magiccl_integration_settings',
            'magiccl_webhook_settings'
        );

        add_settings_field(
            'webhook_logs',
            __('Webhook Logs', 'magicchecklists'),
            array($this, 'render_webhook_logs_field'),
            'magiccl_integration_settings',
            'magiccl_webhook_settings'
        );

        // Add MainWP integration field
        add_settings_field(
            'mainwp_api_key',
            __('MainWP API Key', 'magicchecklists'),
            array($this, 'render_mainwp_api_key_field'),
            'magiccl_integration_settings',
            'magiccl_webhook_settings'
        );

        // Add API key generator field
        add_settings_field(
            'magiccl_api_key',
            __('MagicChecklists API Key', 'magicchecklists'),
            array($this, 'render_api_key_field'),
            'magiccl_integration_settings',
            'magiccl_webhook_settings'
        );

        // Dashboard Widget Settings
        add_settings_field(
            'dashboard_widget_enabled',
            __('Enable Dashboard Widget', 'magicchecklists'),
            array($this, 'render_dashboard_widget_enabled_field'),
            'magiccl_dashboard_settings',
            'magiccl_dashboard_widget_settings'
        );

        add_settings_field(
            'dashboard_widget_show_checklists',
            __('Show Checklists', 'magicchecklists'),
            array($this, 'render_dashboard_widget_show_checklists_field'),
            'magiccl_dashboard_settings',
            'magiccl_dashboard_widget_settings'
        );

        add_settings_field(
            'dashboard_widget_selected_checklists',
            __('Select Checklists to Display', 'magicchecklists'),
            array($this, 'render_dashboard_widget_selected_checklists_field'),
            'magiccl_dashboard_settings',
            'magiccl_dashboard_widget_settings'
        );

        add_settings_field(
            'dashboard_widget_show_checklist_items',
            __('Show Checklist Items', 'magicchecklists'),
            array($this, 'render_dashboard_widget_show_items_field'),
            'magiccl_dashboard_settings',
            'magiccl_dashboard_widget_settings'
        );

        add_settings_field(
            'dashboard_widget_show_deadlines',
            __('Show Deadlines', 'magicchecklists'),
            array($this, 'render_dashboard_widget_show_deadlines_field'),
            'magiccl_dashboard_settings',
            'magiccl_dashboard_widget_settings'
        );

        add_settings_field(
            'dashboard_widget_show_tags',
            __('Show Tags', 'magicchecklists'),
            array($this, 'render_dashboard_widget_show_tags_field'),
            'magiccl_dashboard_settings',
            'magiccl_dashboard_widget_settings'
        );

        add_settings_field(
            'dashboard_widget_show_descriptions',
            __('Show Descriptions', 'magicchecklists'),
            array($this, 'render_dashboard_widget_show_descriptions_field'),
            'magiccl_dashboard_settings',
            'magiccl_dashboard_widget_settings'
        );

        add_settings_field(
            'dashboard_widget_show_quick_actions',
            __('Show Quick Actions', 'magicchecklists'),
            array($this, 'render_dashboard_widget_show_quick_actions_field'),
            'magiccl_dashboard_settings',
            'magiccl_dashboard_widget_settings'
        );
    }

    public function render_webhook_section_description() {
        echo '<p class="magiccl-description">' . 
             esc_html__('Enable / disable the API endpoints of MagicChecklists, test webhook URLs and more.', 'magicchecklists') . 
             '</p>';
    }

    public function render_dashboard_widget_section_description() {
        echo '<p class="magiccl-description">' . 
             esc_html__('Configure the MagicChecklists dashboard widget that appears on the WordPress admin dashboard. At least one display option must be enabled for the widget to appear.', 'magicchecklists') . 
             '</p>';
    }

    public function render_webhook_secret_field() {
        $options = get_option($this->integration_option_name, array());
        $secret = isset($options['webhook_secret']) ? $options['webhook_secret'] : '';
        ?>
        <div class="magiccl-field-wrapper">
            <input type="text" 
                   class="regular-text" 
                   name="<?php echo esc_attr($this->integration_option_name); ?>[webhook_secret]" 
                   value="<?php echo esc_attr($secret); ?>"
                   placeholder="<?php esc_attr_e('Enter a secret key for webhook security', 'magicchecklists'); ?>">
            <button type="button" class="button" id="generate-webhook-secret">
                <?php esc_html_e('Generate Secret', 'magicchecklists'); ?>
            </button>
            <p class="magiccl-description">
                <?php esc_html_e('This secret key will be used to sign webhook payloads for security verification.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_webhook_endpoints_field() {
        $options = get_option($this->integration_option_name, array());
        $endpoints = isset($options['webhook_endpoints']) ? $options['webhook_endpoints'] : array();
        ?>
        <div class="magiccl-field-wrapper magiccl-webhook-endpoints">
            <div class="magiccl-endpoint-list">
                <?php foreach ($endpoints as $index => $endpoint): ?>
                    <div class="magiccl-endpoint-item">
                        <input type="text" 
                               class="regular-text"
                               name="<?php echo esc_attr($this->integration_option_name); ?>[webhook_endpoints][]"
                               value="<?php echo esc_attr($endpoint); ?>"
                               placeholder="<?php esc_attr_e('https://', 'magicchecklists'); ?>">
                        <button type="button" class="button test-endpoint">
                            <?php esc_html_e('Test', 'magicchecklists'); ?>
                        </button>
                        <button type="button" class="button remove-endpoint">
                            <?php esc_html_e('Remove', 'magicchecklists'); ?>
                        </button>
                    </div>
                <?php endforeach; ?>
            </div>
            <button type="button" class="button add-endpoint">
                <?php esc_html_e('Add Endpoint', 'magicchecklists'); ?>
            </button>
            <p class="magiccl-description">
                <?php esc_html_e('Add URLs where webhook notifications should be sent when checklist events occur.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_webhook_logs_field() {
        $logs = $this->get_webhook_logs();
        ?>
        <div class="magiccl-field-wrapper magiccl-webhook-logs">
            <table class="widefat">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Time', 'magicchecklists'); ?></th>
                        <th><?php esc_html_e('Event', 'magicchecklists'); ?></th>
                        <th><?php esc_html_e('Endpoint', 'magicchecklists'); ?></th>
                        <th><?php esc_html_e('Status', 'magicchecklists'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($logs)): ?>
                        <tr>
                            <td colspan="4"><?php esc_html_e('No webhook logs found.', 'magicchecklists'); ?></td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($logs as $log): ?>
                            <tr>
                                <td><?php echo esc_html($log['time']); ?></td>
                                <td><?php echo esc_html($log['event']); ?></td>
                                <td><?php echo esc_html($log['endpoint']); ?></td>
                                <td><?php echo esc_html($log['status']); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
            <button type="button" class="button clear-logs">
                <?php esc_html_e('Clear Logs', 'magicchecklists'); ?>
            </button>
        </div>
        <?php
    }

    private function get_webhook_logs() {
        return get_option('magiccl_webhook_logs', array());
    }
    
    public function render_section_description() {
        echo '<p class="magiccl-description">' . 
             esc_html__('Configure general plugin settings and behavior.', 'magicchecklists') . 
             '</p>';
    }
    
    public function render_delete_data_field() {
        $options = get_option($this->option_name, array());
        $delete_data = isset($options['delete_data_on_uninstall']) ? $options['delete_data_on_uninstall'] : false;
        ?>
        <div class="magiccl-toggle-wrapper">
            <label class="magiccl-toggle-switch">
                <input type="checkbox" 
                       name="<?php echo esc_attr($this->option_name); ?>[delete_data_on_uninstall]" 
                       <?php checked($delete_data, true); ?>>
                <span class="magiccl-switch-label"></span>
            </label>
            <p class="magiccl-description">
                <?php esc_html_e('Delete all plugin data when uninstalling MagicChecklists (including checklists, settings, and database tables).', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_checklist_navigation_field() {
        $options = get_option($this->option_name, array());
        $enable_navigation = isset($options['enable_checklist_navigation']) ? 
            $options['enable_checklist_navigation'] : false;
        ?>
        <div class="magiccl-toggle-wrapper">
            <label class="magiccl-toggle-switch">
                <input type="checkbox" 
                       name="<?php echo esc_attr($this->option_name); ?>[enable_checklist_navigation]" 
                       <?php checked($enable_navigation, true); ?>>
                <span class="magiccl-switch-label"></span>
            </label>
            <p class="magiccl-description">
                <?php esc_html_e('Enable navigation arrows to switch between active checklists when the drawer is open.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_progress_counter_field() {
        $options = get_option($this->option_name, array());
        $enable_counter = isset($options['enable_progress_counter']) ? 
            $options['enable_progress_counter'] : false;
        ?>
        <div class="magiccl-toggle-wrapper">
            <label class="magiccl-toggle-switch">
                <input type="checkbox" 
                       name="<?php echo esc_attr($this->option_name); ?>[enable_progress_counter]" 
                       <?php checked($enable_counter, true); ?>>
                <span class="magiccl-switch-label"></span>
            </label>
            <p class="magiccl-description">
                <?php esc_html_e('Show a progress counter in checklists displaying total items, completed items, and completion percentage.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }
    
    public function render_settings_page() {
        include MAGIC_CHECKLISTS_PLUGIN_PATH . 'admin/views/settings-page.php';
    }
    
    public function sanitize_settings($input) {
        $sanitized = array();
        
        if (isset($input['delete_data_on_uninstall'])) {
            $sanitized['delete_data_on_uninstall'] = (bool) $input['delete_data_on_uninstall'];
        }
        
        if (isset($input['enable_checklist_navigation'])) {
            $sanitized['enable_checklist_navigation'] = (bool) $input['enable_checklist_navigation'];
        }

        if (isset($input['enable_progress_counter'])) {
            $sanitized['enable_progress_counter'] = (bool) $input['enable_progress_counter'];
        }


        
        if (isset($input['speed_dial_bg_color'])) {
            $bg_color = sanitize_text_field($input['speed_dial_bg_color']);
            if (preg_match('/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $bg_color)) {
                $sanitized['speed_dial_bg_color'] = $bg_color;
            } else {
                $sanitized['speed_dial_bg_color'] = '#374151'; // Default value
            }
        }

        if (isset($input['speed_dial_icon_color'])) {
            $icon_color = sanitize_text_field($input['speed_dial_icon_color']);
            if (preg_match('/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $icon_color)) {
                $sanitized['speed_dial_icon_color'] = $icon_color;
            } else {
                $sanitized['speed_dial_icon_color'] = '#ffffff'; // Default value
            }
        }

        // Handle plugin language setting
        if (isset($input['plugin_language'])) {
            $plugin_language = sanitize_text_field($input['plugin_language']);
            // Validate that it's either empty (use WordPress default) or a valid locale code
            if (empty($plugin_language) || preg_match('/^[a-z]{2}_[A-Z]{2}$/', $plugin_language)) {
                $sanitized['plugin_language'] = $plugin_language;
            } else {
                $sanitized['plugin_language'] = ''; // Default to WordPress language
            }
        }

        
        return $sanitized;
    }
    
    public static function get_setting($key, $default = false) {
        if ($key === 'dashboard_widget') {
            $options = get_option('magiccl_dashboard_widget_settings', array());
            return !empty($options) ? $options : $default;
        }
        
        $options = get_option('magiccl_settings', array());
        return isset($options[$key]) ? $options[$key] : $default;
    }

    public function sanitize_integration_settings($input) {
        $sanitized = array();
        $sanitized['enable_api'] = isset($input['enable_api']) ? (bool) $input['enable_api'] : false;
        
        if (isset($input['webhook_secret'])) {
            $sanitized['webhook_secret'] = sanitize_text_field($input['webhook_secret']);
        }
        
        if (isset($input['webhook_endpoints'])) {
            if (is_array($input['webhook_endpoints'])) {
                $sanitized['webhook_endpoints'] = array_map('esc_url_raw', $input['webhook_endpoints']);
                $sanitized['webhook_endpoints'] = array_filter($sanitized['webhook_endpoints']);
            } else {
                $sanitized['webhook_endpoints'] = array();
            }
        } else {
            $sanitized['webhook_endpoints'] = array();
        }
        
        // Encrypt API keys before saving
        if (isset($input['mainwp_api_key'])) {
            $sanitized['mainwp_api_key'] = $this->encrypt_api_key(wp_unslash($input['mainwp_api_key']));
        }

        if (isset($input['magiccl_api_key'])) {
            $sanitized['magiccl_api_key'] = $this->encrypt_api_key(wp_unslash($input['magiccl_api_key']));
        }
        
        return $sanitized;
    }

    /**
     * Encrypt API key
     */
    private function encrypt_api_key($key) {
        if (empty($key)) {
            return '';
        }

        $salt = wp_salt('auth');
        $iv = openssl_random_pseudo_bytes(16); // Generate proper IV
        
        $encrypted = openssl_encrypt(
            $key,
            'AES-256-CBC',
            $salt,
            0,
            $iv
        );

        if ($encrypted === false) {
            return '';
        }

        // Store IV with the encrypted data
        return base64_encode($iv . $encrypted);
    }

    /**
     * Decrypt API key
     */
    private function decrypt_api_key($stored_value) {
        if (empty($stored_value)) {
            return '';
        }

        $decoded = base64_decode($stored_value);
        if ($decoded === false) {
            return '';
        }

        // Extract IV from stored data
        $iv = substr($decoded, 0, 16);
        $encrypted = substr($decoded, 16);
        
        $salt = wp_salt('auth');
        
        $decrypted = openssl_decrypt(
            $encrypted,
            'AES-256-CBC',
            $salt,
            0,
            $iv
        );

        return $decrypted !== false ? $decrypted : '';
    }

    public function render_enable_api_field() {
        $options = get_option($this->integration_option_name, array());
        $enable_api = isset($options['enable_api']) ? $options['enable_api'] : true; // Default to enabled
        ?>
        <div class="magiccl-toggle-wrapper">
            <label class="magiccl-toggle-switch">
                <input type="checkbox" 
                       name="<?php echo esc_attr($this->integration_option_name); ?>[enable_api]" 
                       <?php checked($enable_api, true); ?>>
                <span class="magiccl-switch-label"></span>
            </label>
            <p class="magiccl-description">
                <?php esc_html_e('Enable REST API access for MagicChecklists. When disabled, all plugin-specific API endpoints will be inaccessible.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }



    public function render_mainwp_api_key_field() {
        $options = get_option($this->integration_option_name, array());
        $encrypted_key = isset($options['mainwp_api_key']) ? $options['mainwp_api_key'] : '';
        $api_key = $encrypted_key ? $this->decrypt_api_key($encrypted_key) : '';
        ?>
        <div class="magiccl-field-wrapper">
            <div class="magiccl-api-key-input">
                <input type="password" 
                       class="regular-text" 
                       name="<?php echo esc_attr($this->integration_option_name); ?>[mainwp_api_key]" 
                       value="<?php echo esc_attr($api_key); ?>"
                       placeholder="<?php esc_attr_e('Enter your MainWP API key', 'magicchecklists'); ?>">
                <button type="button" class="button toggle-api-key">
                    <i class="eye icon"></i> <?php esc_html_e('Show', 'magicchecklists'); ?>
                </button>
            </div>
            <p class="magiccl-description">
                <?php esc_html_e('Enter the API key generated from your MainWP dashboard to enable communication between MainWP and MagicChecklists.', 'magicchecklists'); ?>
            </p>
        </div>

        <?php
        $hide_label = esc_js(__('Hide', 'magicchecklists'));
        $show_label = esc_js(__('Show', 'magicchecklists'));
        $toggle_js = 'jQuery(document).ready(function($) {'
            . '$(".toggle-api-key").on("click", function() {'
            . 'var input = $(this).prev("input");'
            . 'var icon = $(this).find("i");'
            . 'if (input.attr("type") === "password") {'
            . 'input.attr("type", "text");'
            . 'icon.removeClass("eye").addClass("eye slash");'
            . '$(this).html(\'<i class="eye slash icon"></i> ' . $hide_label . '\');'
            . '} else {'
            . 'input.attr("type", "password");'
            . 'icon.removeClass("eye slash").addClass("eye");'
            . '$(this).html(\'<i class="eye icon"></i> ' . $show_label . '\');'
            . '}'
            . '});'
            . '});';
        wp_add_inline_script('jquery', $toggle_js);
        ?>
        <?php
    }

    public function render_api_key_field() {
        $options = get_option($this->integration_option_name, array());
        $encrypted_key = isset($options['magiccl_api_key']) ? $options['magiccl_api_key'] : '';
        $api_key = $encrypted_key ? $this->decrypt_api_key($encrypted_key) : '';
        ?>
        <div class="magiccl-field-wrapper">
            <div class="magiccl-api-key-container">
                <input type="password" 
                       class="regular-text" 
                       id="magiccl_api_key"
                       name="<?php echo esc_attr($this->integration_option_name); ?>[magiccl_api_key]" 
                       value="<?php echo esc_attr($api_key); ?>"
                       readonly
                       placeholder="<?php esc_attr_e('No API key generated', 'magicchecklists'); ?>">
                <button type="button" class="button button-secondary" id="generate_api_key">
                    <?php echo empty($api_key) ? 
                        esc_html__('Generate API Key', 'magicchecklists') : 
                        esc_html__('Regenerate API Key', 'magicchecklists'); ?>
                </button>
                <button type="button" class="button toggle-magiccl-api-key">
                    <span class="dashicons dashicons-visibility"></span>
                    <?php esc_html_e('Show', 'magicchecklists'); ?>
                </button>
                <button type="button" class="button magiccl-copy-button" id="copy_api_key" style="display: <?php echo empty($api_key) ? 'none' : 'inline-block'; ?>;">
                    <svg class="magiccl-copy-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <svg class="magiccl-copy-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
                        <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                </button>
            </div>
            <p class="magiccl-description">
                <?php esc_html_e('Generate an API key to allow third-party applications to access your MagicChecklists data through the v2 API endpoints.', 'magicchecklists'); ?>
            </p>
            <p class="magiccl-api-key-warning" style="color: #d63638;">
                <?php esc_html_e('Warning: Regenerating the API key will invalidate any existing integrations using the current key.', 'magicchecklists'); ?>
            </p>
        </div>

        <?php
        $api_key_css = '.magiccl-api-key-container { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .magiccl-api-key-container input[readonly] { background-color: #f0f0f1; }
        .magiccl-api-key-warning { margin-top: 8px; display: none; }
        #magiccl_api_key:not(:placeholder-shown) ~ .magiccl-api-key-warning { display: block; }
        .toggle-magiccl-api-key .dashicons { margin-top: 4px; }
        .magiccl-copy-button { padding: 0 8px; height: 30px; display: inline-flex; align-items: center; justify-content: center; }
        .magiccl-copy-icon, .magiccl-copy-success-icon { display: block; color: #50575e; }
        .magiccl-copy-button:hover .magiccl-copy-icon { color: #135e96; }';
        wp_register_style('magiccl-settings-inline', false);
        wp_enqueue_style('magiccl-settings-inline');
        wp_add_inline_style('magiccl-settings-inline', $api_key_css);
        ?>

        <?php
        $confirm_msg = esc_js(__('Are you sure you want to regenerate the API key? This will invalidate the existing key.', 'magicchecklists'));
        $regenerate_msg = esc_js(__('Regenerate API Key', 'magicchecklists'));
        $hide_msg = esc_js(__('Hide', 'magicchecklists'));
        $show_msg = esc_js(__('Show', 'magicchecklists'));
        $api_key_js = 'jQuery(document).ready(function($) {'
            . 'function generateApiKey() {'
            . 'var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";'
            . 'var prefix = "magiccl_";'
            . 'var key = prefix;'
            . 'for (var i = 0; i < 32; i++) { key += chars.charAt(Math.floor(Math.random() * chars.length)); }'
            . 'return key;'
            . '}'
            . '$("#generate_api_key").on("click", function() {'
            . 'if ($("#magiccl_api_key").val() !== "") {'
            . 'if (!confirm("' . $confirm_msg . '")) { return; }'
            . '}'
            . 'var newKey = generateApiKey();'
            . '$("#magiccl_api_key").val(newKey);'
            . '$(this).text("' . $regenerate_msg . '");'
            . '$("#copy_api_key").show();'
            . '});'
            . '$(".toggle-magiccl-api-key").on("click", function() {'
            . 'var input = $("#magiccl_api_key");'
            . 'var icon = $(this).find(".dashicons");'
            . 'if (input.attr("type") === "password") {'
            . 'input.attr("type", "text");'
            . 'icon.removeClass("dashicons-visibility").addClass("dashicons-hidden");'
            . '$(this).html(\'<span class="dashicons dashicons-hidden"></span> ' . $hide_msg . '\');'
            . '} else {'
            . 'input.attr("type", "password");'
            . 'icon.removeClass("dashicons-hidden").addClass("dashicons-visibility");'
            . '$(this).html(\'<span class="dashicons dashicons-visibility"></span> ' . $show_msg . '\');'
            . '}'
            . '});'
            . '$("#copy_api_key").on("click", function() {'
            . 'var apiKeyInput = document.getElementById("magiccl_api_key");'
            . 'var currentType = apiKeyInput.type;'
            . 'var copyIcon = $(this).find(".magiccl-copy-icon");'
            . 'var successIcon = $(this).find(".magiccl-copy-success-icon");'
            . 'apiKeyInput.type = "text";'
            . 'apiKeyInput.select();'
            . 'document.execCommand("copy");'
            . 'apiKeyInput.type = currentType;'
            . 'copyIcon.hide();'
            . 'successIcon.show();'
            . 'successIcon.css("color", "#00a32a");'
            . 'setTimeout(function() { successIcon.hide(); copyIcon.show(); }, 2000);'
            . '});'
            . '});';
        wp_register_script('magiccl-settings-inline', false, array('jquery'));
        wp_enqueue_script('magiccl-settings-inline');
        wp_add_inline_script('magiccl-settings-inline', $api_key_js);
        ?>
        <?php
    }

    // Dashboard Widget Field Renderers
    public function render_dashboard_widget_enabled_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $enabled = isset($widget_settings['enabled']) ? $widget_settings['enabled'] : false;
        ?>
        <div class="magiccl-toggle-wrapper">
            <label class="magiccl-toggle-switch">
                <input type="checkbox" 
                       name="magiccl_dashboard_widget_settings[enabled]" 
                       <?php checked($enabled, true); ?>>
                <span class="magiccl-switch-label"></span>
            </label>
            <p class="magiccl-description">
                <?php esc_html_e('Enable the MagicChecklists widget on the WordPress admin dashboard.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_dashboard_widget_show_checklists_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $show_checklists = isset($widget_settings['show_checklists']) ? $widget_settings['show_checklists'] : true;
        ?>
        <div class="magiccl-toggle-wrapper">
            <label class="magiccl-toggle-switch">
                <input type="checkbox" 
                       name="magiccl_dashboard_widget_settings[show_checklists]" 
                       <?php checked($show_checklists, true); ?>>
                <span class="magiccl-switch-label"></span>
            </label>
            <p class="magiccl-description">
                <?php esc_html_e('Display a list of checklists with their current status. Choose which checklists to display below.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_dashboard_widget_selected_checklists_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $selected_checklists = isset($widget_settings['selected_checklists']) ? $widget_settings['selected_checklists'] : array();
        
        // Get all checklists for selection (excluding publisher checklists)
        $checklists = get_posts(array(
            'post_type' => 'magiccl_checklist',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC',
            'meta_query' => array(
                array(
                    'key' => '_magiccl_checklist_type',
                    'value' => 'publisher',
                    'compare' => '!='
                )
            )
        ));
        ?>
        <div class="magiccl-field-wrapper">
            <?php if (empty($checklists)): ?>
                <p class="magiccl-description">
                    <?php esc_html_e('No checklists found. Create some checklists first to display them in the widget.', 'magicchecklists'); ?>
                </p>
            <?php else: ?>
                                 <p class="magiccl-description" style="margin-bottom: 10px;">
                     <?php esc_html_e('Select which checklists to display in the dashboard widget. If none are selected, all checklists will be displayed.', 'magicchecklists'); ?>
                 </p>
                
                <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; background: #f9f9f9;">
                    <div style="margin-bottom: 10px;">
                        <button type="button" id="magiccl-select-all-checklists" class="button button-secondary" style="margin-right: 5px;">
                            <?php esc_html_e('Select All', 'magicchecklists'); ?>
                        </button>
                        <button type="button" id="magiccl-deselect-all-checklists" class="button button-secondary">
                            <?php esc_html_e('Deselect All', 'magicchecklists'); ?>
                        </button>
                    </div>
                    
                    <?php foreach ($checklists as $checklist): ?>
                        <?php 
                        // Double-check that this isn't a publisher checklist
                        $checklist_type = get_post_meta($checklist->ID, '_magiccl_checklist_type', true) ?: 'classic';
                        if ($checklist_type === 'publisher') {
                            continue; // Skip publisher checklists
                        }
                        
                        $is_active = get_post_meta($checklist->ID, '_magiccl_active', true) == '1';
                        $is_selected = in_array($checklist->ID, array_map('intval', $selected_checklists));
                        ?>
                        <div style="margin-bottom: 8px; display: flex; align-items: center;">
                            <label style="display: flex; align-items: center; cursor: pointer; width: 100%;">
                                <input type="checkbox" 
                                       name="magiccl_dashboard_widget_settings[selected_checklists][]" 
                                       value="<?php echo esc_attr($checklist->ID); ?>"
                                       <?php checked($is_selected, true); ?>
                                       style="margin-right: 8px;">
                                <span style="flex-grow: 1;">
                                    <?php echo esc_html($checklist->post_title); ?>
                                </span>
                                <span style="font-size: 11px; padding: 2px 6px; border-radius: 3px; margin-left: 8px; <?php echo $is_active ? 'background-color: #d1e7dd; color: #0f5132;' : 'background-color: #f8d7da; color: #721c24;'; ?>">
                                    <?php echo $is_active ? esc_html__('Active', 'magicchecklists') : esc_html__('Inactive', 'magicchecklists'); ?>
                                </span>
                            </label>
                        </div>
                    <?php endforeach; ?>
                </div>
                
                <p class="magiccl-description" style="margin-top: 8px; font-size: 12px; color: #666;">
                    <?php 
                    $selected_count = count($selected_checklists);
                    if ($selected_count === 0) {
                        esc_html_e('No checklists selected. All checklists will be displayed.', 'magicchecklists');
                    } else {
                        echo sprintf(
                            /* translators: %d: number of selected checklists */
                            esc_html(_n('%d checklist selected.', '%d checklists selected.', $selected_count, 'magicchecklists')),
                            intval($selected_count)
                        );
                    }
                    ?>
                </p>
            <?php endif; ?>
        </div>
        
        <?php
        wp_add_inline_script('jquery', '
            jQuery(document).ready(function($) {
                $("#magiccl-select-all-checklists").on("click", function() {
                    $("input[name=\'magiccl_dashboard_widget_settings[selected_checklists][]\']").prop("checked", true);
                });
                $("#magiccl-deselect-all-checklists").on("click", function() {
                    $("input[name=\'magiccl_dashboard_widget_settings[selected_checklists][]\']").prop("checked", false);
                });
            });
        ');
        ?>
        <?php
    }

    public function render_dashboard_widget_show_items_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $show_items = isset($widget_settings['show_checklist_items']) ? $widget_settings['show_checklist_items'] : false;
        $selected_checklist = isset($widget_settings['selected_checklist']) ? $widget_settings['selected_checklist'] : '';
        
        // Get all checklists for the dropdown (excluding publisher checklists)
        $checklists = get_posts(array(
            'post_type' => 'magiccl_checklist',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC',
            'meta_query' => array(
                array(
                    'key' => '_magiccl_checklist_type',
                    'value' => 'publisher',
                    'compare' => '!='
                )
            )
        ));
        ?>
        <div class="magiccl-toggle-wrapper">
            <label class="magiccl-toggle-switch">
                <input type="checkbox" 
                       id="show_checklist_items"
                       name="magiccl_dashboard_widget_settings[show_checklist_items]" 
                       <?php checked($show_items, true); ?>>
                <span class="magiccl-switch-label"></span>
            </label>
            <p class="magiccl-description">
                <?php esc_html_e('Display items from a specific checklist. Select which checklist below.', 'magicchecklists'); ?>
            </p>
            <div class="magiccl-dependent-field" style="margin-top: 10px; display: <?php echo $show_items ? 'block' : 'none'; ?>;">
                <select name="magiccl_dashboard_widget_settings[selected_checklist]" class="regular-text">
                    <option value=""><?php esc_html_e('Select a checklist', 'magicchecklists'); ?></option>
                    <?php foreach ($checklists as $checklist): ?>
                        <?php 
                        // Double-check that this isn't a publisher checklist
                        $checklist_type = get_post_meta($checklist->ID, '_magiccl_checklist_type', true) ?: 'classic';
                        if ($checklist_type === 'publisher') {
                            continue; // Skip publisher checklists
                        }
                        ?>
                        <option value="<?php echo esc_attr($checklist->ID); ?>" 
                                <?php selected($selected_checklist, $checklist->ID); ?>>
                            <?php echo esc_html($checklist->post_title); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>
        
        <?php
        wp_add_inline_script('jquery', '
            jQuery(document).ready(function($) {
                $("#show_checklist_items").on("change", function() {
                    $(".magiccl-dependent-field").toggle(this.checked);
                });
            });
        ');
        ?>
        <?php
    }

    public function render_dashboard_widget_show_deadlines_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $show_deadlines = isset($widget_settings['show_deadlines']) ? $widget_settings['show_deadlines'] : false;
        ?>
        <div class="magiccl-toggle-wrapper">
            <label class="magiccl-toggle-switch">
                <input type="checkbox" 
                       name="magiccl_dashboard_widget_settings[show_deadlines]" 
                       <?php checked($show_deadlines, true); ?>>
                <span class="magiccl-switch-label"></span>
            </label>
            <p class="magiccl-description">
                <?php esc_html_e('Display upcoming deadlines for checklist items with color-coded urgency.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_dashboard_widget_show_tags_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $show_tags = isset($widget_settings['show_tags']) ? $widget_settings['show_tags'] : false;
        ?>
        <div class="magiccl-toggle-wrapper">
            <label class="magiccl-toggle-switch">
                <input type="checkbox" 
                       name="magiccl_dashboard_widget_settings[show_tags]" 
                       <?php checked($show_tags, true); ?>>
                <span class="magiccl-switch-label"></span>
            </label>
            <p class="magiccl-description">
                <?php esc_html_e('Display tags associated with each checklist.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_dashboard_widget_show_descriptions_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $show_descriptions = isset($widget_settings['show_descriptions']) ? $widget_settings['show_descriptions'] : false;
        ?>
        <div class="magiccl-toggle-wrapper">
            <label class="magiccl-toggle-switch">
                <input type="checkbox" 
                       name="magiccl_dashboard_widget_settings[show_descriptions]" 
                       <?php checked($show_descriptions, true); ?>>
                <span class="magiccl-switch-label"></span>
            </label>
            <p class="magiccl-description">
                <?php esc_html_e('Display a truncated description for each checklist.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_dashboard_widget_show_quick_actions_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $show_quick_actions = isset($widget_settings['show_quick_actions']) ? $widget_settings['show_quick_actions'] : true;
        ?>
        <div class="magiccl-toggle-wrapper">
            <label class="magiccl-toggle-switch">
                <input type="checkbox" 
                       name="magiccl_dashboard_widget_settings[show_quick_actions]" 
                       <?php checked($show_quick_actions, true); ?>>
                <span class="magiccl-switch-label"></span>
            </label>
            <p class="magiccl-description">
                <?php esc_html_e('Display quick action buttons to activate/deactivate checklists directly from the dashboard.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }

    public function sanitize_dashboard_widget_settings($input) {
        $sanitized = array();
        
        if (isset($input['enabled'])) {
            $sanitized['enabled'] = (bool) $input['enabled'];
        }
        
        if (isset($input['show_checklists'])) {
            $sanitized['show_checklists'] = (bool) $input['show_checklists'];
        }
        
        if (isset($input['show_checklist_items'])) {
            $sanitized['show_checklist_items'] = (bool) $input['show_checklist_items'];
        }
        
        if (isset($input['selected_checklist'])) {
            $sanitized['selected_checklist'] = intval($input['selected_checklist']);
        }
        
        // Handle multiple checklist selection
        if (isset($input['selected_checklists'])) {
            $selected_checklists = $input['selected_checklists'];
            if (is_array($selected_checklists)) {
                $sanitized['selected_checklists'] = array_map('intval', array_filter($selected_checklists, 'is_numeric'));
            } else {
                $sanitized['selected_checklists'] = array();
            }
        } else {
            // If not set, default to empty array (show all checklists)
            $sanitized['selected_checklists'] = array();
        }
        
        // Validation: If "Show Checklists" is enabled, at least one checklist must be selected
        if (!empty($sanitized['show_checklists']) && empty($sanitized['selected_checklists'])) {
            add_settings_error(
                'magiccl_dashboard_widget_settings',
                'no_checklists_selected',
                __('At least one checklist must be selected when "Show Checklists" is enabled.', 'magicchecklists'),
                'error'
            );
            
            // Keep the previous valid settings if validation fails
            $current_settings = get_option('magiccl_dashboard_widget_settings', array());
            return $current_settings;
        }
        
        if (isset($input['show_deadlines'])) {
            $sanitized['show_deadlines'] = (bool) $input['show_deadlines'];
        }
        
        if (isset($input['show_tags'])) {
            $sanitized['show_tags'] = (bool) $input['show_tags'];
        }
        
        if (isset($input['show_descriptions'])) {
            $sanitized['show_descriptions'] = (bool) $input['show_descriptions'];
        }
        
        if (isset($input['show_quick_actions'])) {
            $sanitized['show_quick_actions'] = (bool) $input['show_quick_actions'];
        }
        
        return $sanitized;
    }

    /**
     * AJAX handler to get all settings
     */
    public function ajax_get_settings() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'magicchecklists'));
        }

        check_ajax_referer('magiccl_admin_nonce', 'nonce');

        $general_settings = get_option($this->option_name, array());
        $integration_settings = get_option($this->integration_option_name, array());
        $dashboard_settings = get_option('magiccl_dashboard_widget_settings', array());

        // Decrypt API keys for display
        if (isset($integration_settings['mainwp_api_key'])) {
            $integration_settings['mainwp_api_key'] = $this->decrypt_api_key($integration_settings['mainwp_api_key']);
        }
        if (isset($integration_settings['magiccl_api_key'])) {
            $integration_settings['magiccl_api_key'] = $this->decrypt_api_key($integration_settings['magiccl_api_key']);
        }

        wp_send_json_success(array(
            'general' => $general_settings,
            'integration' => $integration_settings,
            'dashboard' => $dashboard_settings
        ));
    }

    /**
     * AJAX handler to save settings
     */
    public function ajax_save_settings() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'magicchecklists'));
        }

        check_ajax_referer('magiccl_admin_nonce', 'nonce');

        $section = isset($_POST['section']) ? sanitize_text_field(wp_unslash($_POST['section'])) : '';
        $settings_json = isset($_POST['settings']) ? wp_unslash($_POST['settings']) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Raw JSON string; applying sanitize_text_field before decode would corrupt JSON structure. All decoded values are sanitized via map_deep and sanitize_settings() below.
        $settings = json_decode($settings_json, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($settings)) {
            wp_send_json_error(array('message' => 'Invalid settings data'));
            return;
        }

        // Sanitize all decoded values before processing
        $settings = map_deep($settings, 'sanitize_text_field');

        switch ($section) {
            case 'general':
                $sanitized = $this->sanitize_settings($settings);
                update_option($this->option_name, $sanitized);
                break;
            case 'integration':
                $sanitized = $this->sanitize_integration_settings($settings);
                update_option($this->integration_option_name, $sanitized);
                break;
            case 'dashboard':
                $sanitized = $this->sanitize_dashboard_widget_settings($settings);
                
                // Check if validation failed (settings errors were added)
                $settings_errors = get_settings_errors('magiccl_dashboard_widget_settings');
                if (!empty($settings_errors)) {
                    // Get the error message
                    $error_message = $settings_errors[0]['message'];
                    wp_send_json_error(array('message' => $error_message));
                    return;
                }
                
                update_option('magiccl_dashboard_widget_settings', $sanitized);
                break;
            default:
                wp_send_json_error(array('message' => 'Invalid section'));
                return;
        }

        wp_send_json_success(array('message' => 'Settings saved successfully'));
    }



    /**
     * AJAX handler to get webhook logs
     */
    public function ajax_get_webhook_logs() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'magicchecklists'));
        }

        check_ajax_referer('magiccl_admin_nonce', 'nonce');

        $logs = $this->get_webhook_logs();
        wp_send_json_success($logs);
    }

    /**
     * AJAX handler to test webhook
     */
    public function ajax_test_webhook() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'magicchecklists'));
        }

        check_ajax_referer('magiccl_admin_nonce', 'nonce');

        $endpoint = isset($_POST['endpoint']) ? esc_url_raw(wp_unslash($_POST['endpoint'])) : '';
        
        if (!$endpoint) {
            wp_send_json_error(array('message' => 'Invalid endpoint URL'));
            return;
        }

        // Send a test payload
        $test_payload = array(
            'event' => 'test',
            'data' => array(
                'message' => 'This is a test webhook from MagicChecklists',
                'timestamp' => current_time('timestamp')
            )
        );

        $response = wp_remote_post($endpoint, array(
            'body' => json_encode($test_payload),
            'headers' => array(
                'Content-Type' => 'application/json',
                'User-Agent' => 'MagicChecklists-Webhook/1.0'
            ),
            'timeout' => 10
        ));

        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        } else {
            $status_code = wp_remote_retrieve_response_code($response);
            if ($status_code >= 200 && $status_code < 300) {
                wp_send_json_success(array('message' => 'Webhook test successful'));
            } else {
                wp_send_json_error(array('message' => 'Webhook returned status: ' . $status_code));
            }
        }
    }

    /**
     * AJAX handler to clear webhook logs
     */
    public function ajax_clear_webhook_logs() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'magicchecklists'));
        }

        check_ajax_referer('magiccl_admin_nonce', 'nonce');

        delete_option('magiccl_webhook_logs');
        wp_send_json_success(array('message' => 'Webhook logs cleared'));
    }

    /**
     * Public AJAX handler to get general settings for frontend styling
     */
    public function ajax_get_general_settings() {
        // No permission check needed as this is for public frontend styling
        // But we'll only return safe, non-sensitive settings
        
        $general_settings = get_option($this->option_name, array());
        
        // Only return frontend-safe settings
        $safe_settings = array(
            'speed_dial_bg_color' => isset($general_settings['speed_dial_bg_color']) ? $general_settings['speed_dial_bg_color'] : '#374151',
            'speed_dial_icon_color' => isset($general_settings['speed_dial_icon_color']) ? $general_settings['speed_dial_icon_color'] : '#ffffff',
        );

        wp_send_json_success($safe_settings);
    }

    public function render_speed_dial_bg_color_field() {
        $options = get_option($this->option_name, array());
        $bg_color = isset($options['speed_dial_bg_color']) ? $options['speed_dial_bg_color'] : '#374151';
        ?>
        <div class="magiccl-field-wrapper">
            <input type="color" 
                   name="<?php echo esc_attr($this->option_name); ?>[speed_dial_bg_color]" 
                   value="<?php echo esc_attr($bg_color); ?>"
                   class="magiccl-color-picker">
            <input type="text" 
                   name="<?php echo esc_attr($this->option_name); ?>[speed_dial_bg_color]" 
                   value="<?php echo esc_attr($bg_color); ?>"
                   class="regular-text magiccl-color-text"
                   pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$">
            <p class="magiccl-description">
                <?php esc_html_e('Choose the background color for the speed dial trigger button when multiple checklists are active.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_speed_dial_icon_color_field() {
        $options = get_option($this->option_name, array());
        $icon_color = isset($options['speed_dial_icon_color']) ? $options['speed_dial_icon_color'] : '#ffffff';
        ?>
        <div class="magiccl-field-wrapper">
            <input type="color" 
                   name="<?php echo esc_attr($this->option_name); ?>[speed_dial_icon_color]" 
                   value="<?php echo esc_attr($icon_color); ?>"
                   class="magiccl-color-picker">
            <input type="text" 
                   name="<?php echo esc_attr($this->option_name); ?>[speed_dial_icon_color]" 
                   value="<?php echo esc_attr($icon_color); ?>"
                   class="regular-text magiccl-color-text"
                   pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$">
            <p class="magiccl-description">
                <?php esc_html_e('Choose the icon color for the speed dial trigger button when multiple checklists are active.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }

    /**
     * AJAX handler to get available languages
     */
    public function ajax_get_available_languages() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'magicchecklists'));
        }

        check_ajax_referer('magiccl_admin_nonce', 'nonce');

        $languages = $this->get_available_languages();
        wp_send_json_success($languages);
    }

    /**
     * Get available languages by scanning for .mo files
     */
    private function get_available_languages() {
        $languages = array();
        
        // Always include the default WordPress language option
        $languages[] = array(
            'value' => '', 
            'label' => __('Use WordPress Language (Default)', 'magicchecklists')
        );
        
        // Always include English
        $languages[] = array(
            'value' => 'en_US', 
            'label' => 'English'
        );
        
        $full_path = MAGIC_CHECKLISTS_PLUGIN_PATH . 'languages/';
        
        if (is_dir($full_path)) {
            $mo_files = glob($full_path . 'magicchecklists-*.mo');
            
            foreach ($mo_files as $mo_file) {
                $filename = basename($mo_file, '.mo');
                $locale = str_replace('magicchecklists-', '', $filename);
                
                // Skip if it's already added (like en_US) or if it's not a valid locale format
                if ($locale === 'en_US' || !preg_match('/^[a-z]{2}_[A-Z]{2}$/', $locale)) {
                    continue;
                }
                
                // Get language name from WordPress
                $language_name = $this->get_language_name($locale);
                
                $languages[] = array(
                    'value' => $locale,
                    'label' => $language_name
                );
            }
        }
        
        return $languages;
    }
    
    /**
     * Get human-readable language name from locale code
     */
    private function get_language_name($locale) {
        $language_names = array(
            'de_DE' => 'Deutsch (German)',
            'fr_FR' => 'Français (French)',
            'es_ES' => 'Español (Spanish)',
            'it_IT' => 'Italiano (Italian)',
            'pt_PT' => 'Português (Portuguese)',
            'pt_BR' => 'Português do Brasil (Brazilian Portuguese)',
            'nl_NL' => 'Nederlands (Dutch)',
            'sv_SE' => 'Svenska (Swedish)',
            'no_NO' => 'Norsk (Norwegian)',
            'da_DK' => 'Dansk (Danish)',
            'fi_FI' => 'Suomi (Finnish)',
            'ru_RU' => 'Русский (Russian)',
            'zh_CN' => '简体中文 (Chinese Simplified)',
            'zh_TW' => '繁體中文 (Chinese Traditional)',
            'ja_JP' => '日本語 (Japanese)',
            'ko_KR' => '한국어 (Korean)',
            'ar_AR' => 'العربية (Arabic)',
            'he_IL' => 'עברית (Hebrew)',
            'tr_TR' => 'Türkçe (Turkish)',
            'pl_PL' => 'Polski (Polish)',
            'cs_CZ' => 'Čeština (Czech)',
            'sk_SK' => 'Slovenčina (Slovak)',
            'hu_HU' => 'Magyar (Hungarian)',
            'ro_RO' => 'Română (Romanian)',
            'bg_BG' => 'Български (Bulgarian)',
            'hr_HR' => 'Hrvatski (Croatian)',
            'sr_RS' => 'Српски (Serbian)',
            'uk_UA' => 'Українська (Ukrainian)',
            'el_GR' => 'Ελληνικά (Greek)',
        );
        
        return isset($language_names[$locale]) ? $language_names[$locale] : $locale;
    }

}
