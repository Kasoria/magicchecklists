<?php
if (!defined('ABSPATH')) {
    exit;
}

class MCL_Settings {
    private static $instance = null;
    private $option_name = 'mcl_settings';
    private $integration_option_name = 'mcl_integration_settings';
    
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
    }

    public function enqueue_settings_scripts($hook) {
        if ($hook !== 'magicchecklists_page_mcl_settings') {
            return;
        }

        wp_enqueue_script(
            'mcl-integration-settings',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/pages/mcl-integration-settings.js',
            array(),
            MAGIC_CHECKLISTS_VERSION,
            true
        );

        wp_localize_script('mcl-integration-settings', 'mclIntegration', array(
            'nonce' => wp_create_nonce('mcl_integration_nonce'),
            'ajaxurl' => admin_url('admin-ajax.php'),
            'i18n' => array(
                'confirmDeleteEndpoint' => __('Are you sure you want to delete this webhook endpoint?', 'magic-checklists'),
                'testingConnection' => __('Testing connection...', 'magic-checklists'),
                'testSuccess' => __('Connection successful!', 'magic-checklists'),
                'testFailed' => __('Connection failed:', 'magic-checklists'),
                'confirmClearLogs' => __('Are you sure you want to clear all webhook logs?', 'magic-checklists'),
                'clearLogsFailed' => __('Failed to clear webhook logs', 'magic-checklists')
            )
        ));
    }
    
    public function add_settings_page() {
        add_submenu_page(
            'mcl_checklists',
            __('Settings', 'magic-checklists'),
            __('Settings', 'magic-checklists'),
            'manage_options',
            'mcl_settings',
            array($this, 'render_settings_page')
        );
    }
    
    public function register_settings() {
        register_setting(
            'mcl_settings_group',
            $this->option_name,
            array(
                'type' => 'array',
                'sanitize_callback' => array($this, 'sanitize_settings')
            )
        );
        
        register_setting(
            'mcl_integration_settings_group',
            $this->integration_option_name,
            array(
                'type' => 'array',
                'sanitize_callback' => array($this, 'sanitize_integration_settings')
            )
        );

        add_settings_section(
            'mcl_general_settings',
            __('General Settings', 'magic-checklists'),
            array($this, 'render_section_description'),
            'mcl_settings'
        );

        add_settings_section(
            'mcl_webhook_settings',
            __('API & Webhook settings', 'magic-checklists'),
            array($this, 'render_webhook_section_description'),
            'mcl_integration_settings'
        );

        add_settings_field(
            'enable_checklist_navigation',
            __('Checklist Arrow Buttons Navigation', 'magic-checklists'),
            array($this, 'render_checklist_navigation_field'),
            'mcl_settings',
            'mcl_general_settings'
        );

        add_settings_field(
            'delete_data_on_uninstall',
            __('Data Cleanup', 'magic-checklists'),
            array($this, 'render_delete_data_field'),
            'mcl_settings',
            'mcl_general_settings'
        );

        add_settings_field(
            'enable_api',
            __('REST API Access', 'magic-checklists'),
            array($this, 'render_enable_api_field'),
            'mcl_integration_settings',
            'mcl_webhook_settings'
        );

        add_settings_field(
            'webhook_secret',
            __('Webhook Secret', 'magic-checklists'),
            array($this, 'render_webhook_secret_field'),
            'mcl_integration_settings',
            'mcl_webhook_settings'
        );

        add_settings_field(
            'webhook_endpoints',
            __('Webhook Endpoints', 'magic-checklists'),
            array($this, 'render_webhook_endpoints_field'),
            'mcl_integration_settings',
            'mcl_webhook_settings'
        );

        add_settings_field(
            'webhook_logs',
            __('Webhook Logs', 'magic-checklists'),
            array($this, 'render_webhook_logs_field'),
            'mcl_integration_settings',
            'mcl_webhook_settings'
        );
    }

    public function render_webhook_section_description() {
        echo '<p class="mcl-description">' . 
             esc_html__('Enable / disable the API endpoints of MagicChecklists, test webhook URLs and more.', 'magic-checklists') . 
             '</p>';
    }

    public function render_webhook_secret_field() {
        $options = get_option($this->integration_option_name, array());
        $secret = isset($options['webhook_secret']) ? $options['webhook_secret'] : '';
        ?>
        <div class="mcl-field-wrapper">
            <input type="text" 
                   class="regular-text" 
                   name="<?php echo esc_attr($this->integration_option_name); ?>[webhook_secret]" 
                   value="<?php echo esc_attr($secret); ?>"
                   placeholder="<?php esc_attr_e('Enter a secret key for webhook security', 'magic-checklists'); ?>">
            <button type="button" class="button" id="generate-webhook-secret">
                <?php esc_html_e('Generate Secret', 'magic-checklists'); ?>
            </button>
            <p class="mcl-description">
                <?php esc_html_e('This secret key will be used to sign webhook payloads for security verification.', 'magic-checklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_webhook_endpoints_field() {
        $options = get_option($this->integration_option_name, array());
        $endpoints = isset($options['webhook_endpoints']) ? $options['webhook_endpoints'] : array();
        ?>
        <div class="mcl-field-wrapper mcl-webhook-endpoints">
            <div class="mcl-endpoint-list">
                <?php foreach ($endpoints as $index => $endpoint): ?>
                    <div class="mcl-endpoint-item">
                        <input type="text" 
                               class="regular-text"
                               name="<?php echo esc_attr($this->integration_option_name); ?>[webhook_endpoints][]"
                               value="<?php echo esc_attr($endpoint); ?>"
                               placeholder="<?php esc_attr_e('https://', 'magic-checklists'); ?>">
                        <button type="button" class="button test-endpoint">
                            <?php esc_html_e('Test', 'magic-checklists'); ?>
                        </button>
                        <button type="button" class="button remove-endpoint">
                            <?php esc_html_e('Remove', 'magic-checklists'); ?>
                        </button>
                    </div>
                <?php endforeach; ?>
            </div>
            <button type="button" class="button add-endpoint">
                <?php esc_html_e('Add Endpoint', 'magic-checklists'); ?>
            </button>
            <p class="mcl-description">
                <?php esc_html_e('Add URLs where webhook notifications should be sent when checklist events occur.', 'magic-checklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_webhook_logs_field() {
        $logs = $this->get_webhook_logs();
        ?>
        <div class="mcl-field-wrapper mcl-webhook-logs">
            <table class="widefat">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Time', 'magic-checklists'); ?></th>
                        <th><?php esc_html_e('Event', 'magic-checklists'); ?></th>
                        <th><?php esc_html_e('Endpoint', 'magic-checklists'); ?></th>
                        <th><?php esc_html_e('Status', 'magic-checklists'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($logs)): ?>
                        <tr>
                            <td colspan="4"><?php esc_html_e('No webhook logs found.', 'magic-checklists'); ?></td>
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
                <?php esc_html_e('Clear Logs', 'magic-checklists'); ?>
            </button>
        </div>
        <?php
    }

    private function get_webhook_logs() {
        return get_option('mcl_webhook_logs', array());
    }
    
    public function render_section_description() {
        echo '<p class="mcl-description">' . 
             esc_html__('Configure general plugin settings and behavior.', 'magic-checklists') . 
             '</p>';
    }
    
    public function render_delete_data_field() {
        $options = get_option($this->option_name, array());
        $delete_data = isset($options['delete_data_on_uninstall']) ? $options['delete_data_on_uninstall'] : false;
        ?>
        <div class="mcl-toggle-wrapper">
            <label class="mcl-toggle-switch">
                <input type="checkbox" 
                       name="<?php echo esc_attr($this->option_name); ?>[delete_data_on_uninstall]" 
                       <?php checked($delete_data, true); ?>>
                <span class="mcl-switch-label"></span>
            </label>
            <p class="mcl-description">
                <?php esc_html_e('Delete all plugin data when uninstalling MagicChecklists (including checklists, settings, and database tables).', 'magic-checklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_checklist_navigation_field() {
        $options = get_option($this->option_name, array());
        $enable_navigation = isset($options['enable_checklist_navigation']) ? 
            $options['enable_checklist_navigation'] : false;
        ?>
        <div class="mcl-toggle-wrapper">
            <label class="mcl-toggle-switch">
                <input type="checkbox" 
                       name="<?php echo esc_attr($this->option_name); ?>[enable_checklist_navigation]" 
                       <?php checked($enable_navigation, true); ?>>
                <span class="mcl-switch-label"></span>
            </label>
            <p class="mcl-description">
                <?php esc_html_e('Enable navigation arrows to switch between active checklists when the drawer is open.', 'magic-checklists'); ?>
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
        
        return $sanitized;
    }
    
    public static function get_setting($key, $default = false) {
        $options = get_option('mcl_settings', array());
        return isset($options[$key]) ? $options[$key] : $default;
    }

    public function sanitize_integration_settings($input) {
        $sanitized = array();
        $sanitized['enable_api'] = isset($input['enable_api']) ? (bool) $input['enable_api'] : false;
        
        if (isset($input['webhook_secret'])) {
            $sanitized['webhook_secret'] = sanitize_text_field($input['webhook_secret']);
        }
        
        if (isset($input['webhook_endpoints']) && is_array($input['webhook_endpoints'])) {
            $sanitized['webhook_endpoints'] = array_map('esc_url_raw', $input['webhook_endpoints']);
            $sanitized['webhook_endpoints'] = array_filter($sanitized['webhook_endpoints']);
        }
        
        return $sanitized;
    }

    public function render_enable_api_field() {
        $options = get_option($this->integration_option_name, array());
        $enable_api = isset($options['enable_api']) ? $options['enable_api'] : true; // Default to enabled
        ?>
        <div class="mcl-toggle-wrapper">
            <label class="mcl-toggle-switch">
                <input type="checkbox" 
                       name="<?php echo esc_attr($this->integration_option_name); ?>[enable_api]" 
                       <?php checked($enable_api, true); ?>>
                <span class="mcl-switch-label"></span>
            </label>
            <p class="mcl-description">
                <?php esc_html_e('Enable REST API access for MagicChecklists. When disabled, all plugin-specific API endpoints will be inaccessible.', 'magic-checklists'); ?>
            </p>
        </div>
        <?php
    }
}