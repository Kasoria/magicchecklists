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
        
        // Add AJAX handlers for React settings
        add_action('wp_ajax_mcl_get_settings', array($this, 'ajax_get_settings'));
        add_action('wp_ajax_mcl_save_settings', array($this, 'ajax_save_settings'));
        add_action('wp_ajax_mcl_get_menu_items', array($this, 'ajax_get_menu_items'));
        add_action('wp_ajax_mcl_get_webhook_logs', array($this, 'ajax_get_webhook_logs'));
        add_action('wp_ajax_mcl_test_webhook', array($this, 'ajax_test_webhook'));
        add_action('wp_ajax_mcl_clear_webhook_logs', array($this, 'ajax_clear_webhook_logs'));
    }

    public function enqueue_settings_scripts($hook) {
        if ($hook !== 'magicchecklists_page_mcl_settings') {
            return;
        }

        // Since we're using React for settings now, we don't need the old integration settings JS
        // The React app handles all the settings functionality
        
        // Keep this method for backwards compatibility but don't enqueue the old script
        // wp_enqueue_script(
        //     'mcl-integration-settings',
        //     MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/pages/mcl-integration-settings.js',
        //     array(),
        //     MAGIC_CHECKLISTS_VERSION,
        //     true
        // );

        // The React admin app is already enqueued by the main admin class
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
        
        register_setting(
            'mcl_dashboard_widget_settings_group',
            'mcl_dashboard_widget_settings',
            array(
                'type' => 'array',
                'sanitize_callback' => array($this, 'sanitize_dashboard_widget_settings')
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

        add_settings_section(
            'mcl_dashboard_widget_settings',
            __('Dashboard Widget', 'magic-checklists'),
            array($this, 'render_dashboard_widget_section_description'),
            'mcl_dashboard_settings'
        );

        add_settings_field(
            'enable_checklist_navigation',
            __('Checklist Arrow Buttons Navigation', 'magic-checklists'),
            array($this, 'render_checklist_navigation_field'),
            'mcl_settings',
            'mcl_general_settings'
        );

        add_settings_field(
            'enable_progress_counter',
            __('Progress Counter', 'magic-checklists'),
            array($this, 'render_progress_counter_field'),
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
            'menu_position_type',
            __('Menu Position', 'magic-checklists'),
            array($this, 'render_menu_position_field'),
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

        // Add MainWP integration field
        add_settings_field(
            'mainwp_api_key',
            __('MainWP API Key', 'magic-checklists'),
            array($this, 'render_mainwp_api_key_field'),
            'mcl_integration_settings',
            'mcl_webhook_settings'
        );

        // Add API key generator field
        add_settings_field(
            'mcl_api_key',
            __('MagicChecklists API Key', 'magic-checklists'),
            array($this, 'render_api_key_field'),
            'mcl_integration_settings',
            'mcl_webhook_settings'
        );

        // Dashboard Widget Settings
        add_settings_field(
            'dashboard_widget_enabled',
            __('Enable Dashboard Widget', 'magic-checklists'),
            array($this, 'render_dashboard_widget_enabled_field'),
            'mcl_dashboard_settings',
            'mcl_dashboard_widget_settings'
        );

        add_settings_field(
            'dashboard_widget_show_checklists',
            __('Show Checklists', 'magic-checklists'),
            array($this, 'render_dashboard_widget_show_checklists_field'),
            'mcl_dashboard_settings',
            'mcl_dashboard_widget_settings'
        );

        add_settings_field(
            'dashboard_widget_show_checklist_items',
            __('Show Checklist Items', 'magic-checklists'),
            array($this, 'render_dashboard_widget_show_items_field'),
            'mcl_dashboard_settings',
            'mcl_dashboard_widget_settings'
        );

        add_settings_field(
            'dashboard_widget_show_deadlines',
            __('Show Deadlines', 'magic-checklists'),
            array($this, 'render_dashboard_widget_show_deadlines_field'),
            'mcl_dashboard_settings',
            'mcl_dashboard_widget_settings'
        );

        add_settings_field(
            'dashboard_widget_show_tags',
            __('Show Tags', 'magic-checklists'),
            array($this, 'render_dashboard_widget_show_tags_field'),
            'mcl_dashboard_settings',
            'mcl_dashboard_widget_settings'
        );

        add_settings_field(
            'dashboard_widget_show_descriptions',
            __('Show Descriptions', 'magic-checklists'),
            array($this, 'render_dashboard_widget_show_descriptions_field'),
            'mcl_dashboard_settings',
            'mcl_dashboard_widget_settings'
        );

        add_settings_field(
            'dashboard_widget_show_quick_actions',
            __('Show Quick Actions', 'magic-checklists'),
            array($this, 'render_dashboard_widget_show_quick_actions_field'),
            'mcl_dashboard_settings',
            'mcl_dashboard_widget_settings'
        );
    }

    public function render_webhook_section_description() {
        echo '<p class="mcl-description">' . 
             esc_html__('Enable / disable the API endpoints of MagicChecklists, test webhook URLs and more.', 'magic-checklists') . 
             '</p>';
    }

    public function render_dashboard_widget_section_description() {
        echo '<p class="mcl-description">' . 
             esc_html__('Configure the MagicChecklists dashboard widget that appears on the WordPress admin dashboard. At least one display option must be enabled for the widget to appear.', 'magic-checklists') . 
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

    public function render_progress_counter_field() {
        $options = get_option($this->option_name, array());
        $enable_counter = isset($options['enable_progress_counter']) ? 
            $options['enable_progress_counter'] : false;
        ?>
        <div class="mcl-toggle-wrapper">
            <label class="mcl-toggle-switch">
                <input type="checkbox" 
                       name="<?php echo esc_attr($this->option_name); ?>[enable_progress_counter]" 
                       <?php checked($enable_counter, true); ?>>
                <span class="mcl-switch-label"></span>
            </label>
            <p class="mcl-description">
                <?php esc_html_e('Show a progress counter in checklists displaying total items, completed items, and completion percentage.', 'magic-checklists'); ?>
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

        if (isset($input['menu_position_type'])) {
            $sanitized['menu_position_type'] = sanitize_text_field($input['menu_position_type']);
            
            if ($input['menu_position_type'] === 'relative') {
                $sanitized['menu_position_relative_to'] = sanitize_text_field($input['menu_position_relative_to']);
                $sanitized['menu_position'] = in_array($input['menu_position'], ['before', 'after']) ? 
                    $input['menu_position'] : 'after';
            } elseif ($input['menu_position_type'] === 'custom') {
                $custom_position = isset($input['custom_position']) ? 
                    intval($input['custom_position']) : 0;
                $sanitized['custom_position'] = max(1, min(99, $custom_position));
            }
        }
        
        return $sanitized;
    }
    
    public static function get_setting($key, $default = false) {
        if ($key === 'dashboard_widget') {
            $options = get_option('mcl_dashboard_widget_settings', array());
            return !empty($options) ? $options : $default;
        }
        
        $options = get_option('mcl_settings', array());
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
            $sanitized['mainwp_api_key'] = $this->encrypt_api_key(sanitize_text_field($input['mainwp_api_key']));
        }
        
        if (isset($input['mcl_api_key'])) {
            $sanitized['mcl_api_key'] = $this->encrypt_api_key(sanitize_text_field($input['mcl_api_key']));
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

    public function render_menu_position_field() {
        $options = get_option($this->option_name, array());
        $position_type = isset($options['menu_position_type']) ? $options['menu_position_type'] : 'default';
        $relative_to = isset($options['menu_position_relative_to']) ? $options['menu_position_relative_to'] : '';
        $position = isset($options['menu_position']) ? $options['menu_position'] : 'after';
        $custom_position = isset($options['custom_position']) ? intval($options['custom_position']) : '';
        
        // Get all admin menu items
        global $menu;
        $menu_items = array();
        foreach ($menu as $item) {
            if (!empty($item[0]) && !empty($item[2])) {
                $title = strip_tags($item[0]);
                $menu_items[$item[2]] = $title;
            }
        }
        ?>
        <div class="mcl-field-wrapper mcl-menu-position-setting">
            <select name="<?php echo esc_attr($this->option_name); ?>[menu_position_type]" 
                    id="mcl-menu-position-type" 
                    class="mcl-menu-position-type">
                <option value="default" <?php selected($position_type, 'default'); ?>>
                    <?php esc_html_e('Default Position', 'magic-checklists'); ?>
                </option>
                <option value="relative" <?php selected($position_type, 'relative'); ?>>
                    <?php esc_html_e('Relative to Another Menu Item', 'magic-checklists'); ?>
                </option>
                <option value="custom" <?php selected($position_type, 'custom'); ?>>
                    <?php esc_html_e('Custom Position (1-99)', 'magic-checklists'); ?>
                </option>
            </select>
    
            <div id="mcl-relative-position-wrapper" 
                 class="mcl-relative-position-wrapper" 
                 style="<?php echo $position_type === 'relative' ? '' : 'display: none;'; ?>">
                <select name="<?php echo esc_attr($this->option_name); ?>[menu_position]" 
                        class="mcl-position-select">
                    <option value="after" <?php selected($position, 'after'); ?>>
                        <?php esc_html_e('After', 'magic-checklists'); ?>
                    </option>
                    <option value="before" <?php selected($position, 'before'); ?>>
                        <?php esc_html_e('Before', 'magic-checklists'); ?>
                    </option>
                </select>
    
                <select name="<?php echo esc_attr($this->option_name); ?>[menu_position_relative_to]" 
                        class="mcl-menu-item-select">
                    <option value=""><?php esc_html_e('Select Menu Item', 'magic-checklists'); ?></option>
                    <?php foreach ($menu_items as $slug => $title): ?>
                        <option value="<?php echo esc_attr($slug); ?>" 
                                <?php selected($relative_to, $slug); ?>>
                            <?php echo esc_html($title); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
    
            <div id="mcl-custom-position-wrapper" 
                 class="mcl-custom-position-wrapper" 
                 style="<?php echo $position_type === 'custom' ? '' : 'display: none;'; ?>">
                <input type="number" 
                       name="<?php echo esc_attr($this->option_name); ?>[custom_position]" 
                       value="<?php echo esc_attr($custom_position); ?>"
                       min="1" 
                       max="99" 
                       class="small-text"
                       placeholder="1-99">
                <p class="mcl-description mcl-custom-position-note" style="display: inline-block; margin-left: 10px;">
                    <?php esc_html_e('Enter a number between 1 and 99', 'magic-checklists'); ?>
                </p>
            </div>
    
            <p class="mcl-description">
                <?php esc_html_e('Choose where to display the MagicChecklists menu item in the admin menu.', 'magic-checklists'); ?>
            </p>
        </div>
    
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            const positionTypeSelect = document.getElementById('mcl-menu-position-type');
            const relativeWrapper = document.getElementById('mcl-relative-position-wrapper');
            const customWrapper = document.getElementById('mcl-custom-position-wrapper');
            const menuItemSelect = document.querySelector('.mcl-menu-item-select');
            const positionSelect = document.querySelector('.mcl-position-select');
            const customInput = customWrapper.querySelector('input[type="number"]');
            const form = positionTypeSelect.closest('form');
            
            // List of menu items that shouldn't be positioned before
            const restrictedBeforeItems = ['index.php', 'dashboard'];
            
            function validateMenuPosition() {
                const selectedItem = menuItemSelect.value;
                const selectedPosition = positionSelect.value;
                
                if (selectedPosition === 'before' && restrictedBeforeItems.includes(selectedItem)) {
                    const warning = document.createElement('div');
                    warning.className = 'mcl-warning-message';
                    warning.style.color = '#d63638';
                    warning.style.marginTop = '5px';
                    warning.textContent = '<?php esc_html_e("Cannot position menu before this item. Please select 'After' or choose a different menu item.", "magic-checklists"); ?>';
                    
                    const existingWarning = menuItemSelect.parentNode.querySelector('.mcl-warning-message');
                    if (existingWarning) {
                        existingWarning.remove();
                    }
                    
                    menuItemSelect.parentNode.appendChild(warning);
                    return false;
                }
                
                const existingWarning = menuItemSelect.parentNode.querySelector('.mcl-warning-message');
                if (existingWarning) {
                    existingWarning.remove();
                }
                
                return true;
            }
            
            if (positionTypeSelect) {
                positionTypeSelect.addEventListener('change', function() {
                    relativeWrapper.style.display = this.value === 'relative' ? 'block' : 'none';
                    customWrapper.style.display = this.value === 'custom' ? 'block' : 'none';
                });
    
                menuItemSelect?.addEventListener('change', validateMenuPosition);
                positionSelect?.addEventListener('change', validateMenuPosition);
    
                // Validate custom position input
                customInput.addEventListener('input', function() {
                    let value = parseInt(this.value);
                    if (value < 1) this.value = 1;
                    if (value > 99) this.value = 99;
                });
    
                // Form validation
                form.addEventListener('submit', function(e) {
                    if (positionTypeSelect.value === 'relative') {
                        if (!menuItemSelect.value || menuItemSelect.value === '') {
                            e.preventDefault();
                            alert('<?php esc_html_e("Please select a menu item for relative positioning.", "magic-checklists"); ?>');
                            menuItemSelect.focus();
                            return;
                        }
                        
                        if (!validateMenuPosition()) {
                            e.preventDefault();
                            alert('<?php esc_html_e("Invalid menu position combination selected. Please adjust your selection.", "magic-checklists"); ?>');
                            return;
                        }
                    } else if (positionTypeSelect.value === 'custom') {
                        if (!customInput.value) {
                            e.preventDefault();
                            alert('<?php esc_html_e("Please enter a position number between 1 and 99.", "magic-checklists"); ?>');
                            customInput.focus();
                            return;
                        }
                    }
                });
            }
        });
        </script>
        <?php
    }

    public function render_mainwp_api_key_field() {
        $options = get_option($this->integration_option_name, array());
        $encrypted_key = isset($options['mainwp_api_key']) ? $options['mainwp_api_key'] : '';
        $api_key = $encrypted_key ? $this->decrypt_api_key($encrypted_key) : '';
        ?>
        <div class="mcl-field-wrapper">
            <div class="mcl-api-key-input">
                <input type="password" 
                       class="regular-text" 
                       name="<?php echo esc_attr($this->integration_option_name); ?>[mainwp_api_key]" 
                       value="<?php echo esc_attr($api_key); ?>"
                       placeholder="<?php esc_attr_e('Enter your MainWP API key', 'magic-checklists'); ?>">
                <button type="button" class="button toggle-api-key">
                    <i class="eye icon"></i> <?php esc_html_e('Show', 'magic-checklists'); ?>
                </button>
            </div>
            <p class="mcl-description">
                <?php esc_html_e('Enter the API key generated from your MainWP dashboard to enable communication between MainWP and MagicChecklists.', 'magic-checklists'); ?>
            </p>
        </div>

        <script>
        jQuery(document).ready(function($) {
            $('.toggle-api-key').on('click', function() {
                var input = $(this).prev('input');
                var icon = $(this).find('i');
                
                if (input.attr('type') === 'password') {
                    input.attr('type', 'text');
                    icon.removeClass('eye').addClass('eye slash');
                    $(this).html('<i class="eye slash icon"></i> <?php esc_html_e("Hide", "magic-checklists"); ?>');
                } else {
                    input.attr('type', 'password');
                    icon.removeClass('eye slash').addClass('eye');
                    $(this).html('<i class="eye icon"></i> <?php esc_html_e("Show", "magic-checklists"); ?>');
                }
            });
        });
        </script>
        <?php
    }

    public function render_api_key_field() {
        $options = get_option($this->integration_option_name, array());
        $encrypted_key = isset($options['mcl_api_key']) ? $options['mcl_api_key'] : '';
        $api_key = $encrypted_key ? $this->decrypt_api_key($encrypted_key) : '';
        ?>
        <div class="mcl-field-wrapper">
            <div class="mcl-api-key-container">
                <input type="password" 
                       class="regular-text" 
                       id="mcl_api_key"
                       name="<?php echo esc_attr($this->integration_option_name); ?>[mcl_api_key]" 
                       value="<?php echo esc_attr($api_key); ?>"
                       readonly
                       placeholder="<?php esc_attr_e('No API key generated', 'magic-checklists'); ?>">
                <button type="button" class="button button-secondary" id="generate_api_key">
                    <?php echo empty($api_key) ? 
                        esc_html__('Generate API Key', 'magic-checklists') : 
                        esc_html__('Regenerate API Key', 'magic-checklists'); ?>
                </button>
                <button type="button" class="button toggle-mcl-api-key">
                    <span class="dashicons dashicons-visibility"></span>
                    <?php esc_html_e('Show', 'magic-checklists'); ?>
                </button>
                <button type="button" class="button mcl-copy-button" id="copy_api_key" style="display: <?php echo empty($api_key) ? 'none' : 'inline-block'; ?>;">
                    <svg class="mcl-copy-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <svg class="mcl-copy-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
                        <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                </button>
            </div>
            <p class="mcl-description">
                <?php esc_html_e('Generate an API key to allow third-party applications to access your MagicChecklists data through the v2 API endpoints.', 'magic-checklists'); ?>
            </p>
            <p class="mcl-api-key-warning" style="color: #d63638;">
                <?php esc_html_e('Warning: Regenerating the API key will invalidate any existing integrations using the current key.', 'magic-checklists'); ?>
            </p>
        </div>

        <style>
        .mcl-api-key-container {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }
        .mcl-api-key-container input[readonly] {
            background-color: #f0f0f1;
        }
        .mcl-api-key-warning {
            margin-top: 8px;
            display: none;
        }
        #mcl_api_key:not(:placeholder-shown) ~ .mcl-api-key-warning {
            display: block;
        }
        .toggle-mcl-api-key .dashicons {
            margin-top: 4px;
        }
        .mcl-copy-button {
            padding: 0 8px;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .mcl-copy-icon, .mcl-copy-success-icon {
            display: block;
            color: #50575e;
        }
        .mcl-copy-button:hover .mcl-copy-icon {
            color: #135e96;
        }
        </style>

        <script>
        jQuery(document).ready(function($) {
            function generateApiKey() {
                const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const prefix = 'mcl_';
                let key = prefix;
                for (let i = 0; i < 32; i++) {
                    key += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return key;
            }

            $('#generate_api_key').on('click', function() {
                if ($('#mcl_api_key').val() !== '') {
                    if (!confirm('<?php esc_html_e('Are you sure you want to regenerate the API key? This will invalidate the existing key.', 'magic-checklists'); ?>')) {
                        return;
                    }
                }

                const newKey = generateApiKey();
                $('#mcl_api_key').val(newKey);
                $(this).text('<?php esc_html_e('Regenerate API Key', 'magic-checklists'); ?>');
                $('#copy_api_key').show();
            });

            $('.toggle-mcl-api-key').on('click', function() {
                var input = $('#mcl_api_key');
                var icon = $(this).find('.dashicons');
                
                if (input.attr('type') === 'password') {
                    input.attr('type', 'text');
                    icon.removeClass('dashicons-visibility').addClass('dashicons-hidden');
                    $(this).html('<span class="dashicons dashicons-hidden"></span> <?php esc_html_e("Hide", "magic-checklists"); ?>');
                } else {
                    input.attr('type', 'password');
                    icon.removeClass('dashicons-hidden').addClass('dashicons-visibility');
                    $(this).html('<span class="dashicons dashicons-visibility"></span> <?php esc_html_e("Show", "magic-checklists"); ?>');
                }
            });

            $('#copy_api_key').on('click', function() {
                const apiKeyInput = document.getElementById('mcl_api_key');
                const currentType = apiKeyInput.type;
                const copyIcon = $(this).find('.mcl-copy-icon');
                const successIcon = $(this).find('.mcl-copy-success-icon');
                
                apiKeyInput.type = 'text'; // Temporarily show the text to copy it
                apiKeyInput.select();
                document.execCommand('copy');
                apiKeyInput.type = currentType; // Restore the original type
                
                // Show success icon
                copyIcon.hide();
                successIcon.show();
                successIcon.css('color', '#00a32a'); // WordPress success green
                
                // Reset after 2 seconds
                setTimeout(() => {
                    successIcon.hide();
                    copyIcon.show();
                }, 2000);
            });
        });
        </script>
        <?php
    }

    // Dashboard Widget Field Renderers
    public function render_dashboard_widget_enabled_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $enabled = isset($widget_settings['enabled']) ? $widget_settings['enabled'] : false;
        ?>
        <div class="mcl-toggle-wrapper">
            <label class="mcl-toggle-switch">
                <input type="checkbox" 
                       name="mcl_dashboard_widget_settings[enabled]" 
                       <?php checked($enabled, true); ?>>
                <span class="mcl-switch-label"></span>
            </label>
            <p class="mcl-description">
                <?php esc_html_e('Enable the MagicChecklists widget on the WordPress admin dashboard.', 'magic-checklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_dashboard_widget_show_checklists_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $show_checklists = isset($widget_settings['show_checklists']) ? $widget_settings['show_checklists'] : true;
        ?>
        <div class="mcl-toggle-wrapper">
            <label class="mcl-toggle-switch">
                <input type="checkbox" 
                       name="mcl_dashboard_widget_settings[show_checklists]" 
                       <?php checked($show_checklists, true); ?>>
                <span class="mcl-switch-label"></span>
            </label>
            <p class="mcl-description">
                <?php esc_html_e('Display a list of all checklists with their current status.', 'magic-checklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_dashboard_widget_show_items_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $show_items = isset($widget_settings['show_checklist_items']) ? $widget_settings['show_checklist_items'] : false;
        $selected_checklist = isset($widget_settings['selected_checklist']) ? $widget_settings['selected_checklist'] : '';
        
        // Get all checklists for the dropdown
        $checklists = get_posts(array(
            'post_type' => 'mcl_checklist',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC'
        ));
        ?>
        <div class="mcl-toggle-wrapper">
            <label class="mcl-toggle-switch">
                <input type="checkbox" 
                       id="show_checklist_items"
                       name="mcl_dashboard_widget_settings[show_checklist_items]" 
                       <?php checked($show_items, true); ?>>
                <span class="mcl-switch-label"></span>
            </label>
            <p class="mcl-description">
                <?php esc_html_e('Display items from a specific checklist. Select which checklist below.', 'magic-checklists'); ?>
            </p>
            <div class="mcl-dependent-field" style="margin-top: 10px; display: <?php echo $show_items ? 'block' : 'none'; ?>;">
                <select name="mcl_dashboard_widget_settings[selected_checklist]" class="regular-text">
                    <option value=""><?php esc_html_e('Select a checklist', 'magic-checklists'); ?></option>
                    <?php foreach ($checklists as $checklist): ?>
                        <option value="<?php echo esc_attr($checklist->ID); ?>" 
                                <?php selected($selected_checklist, $checklist->ID); ?>>
                            <?php echo esc_html($checklist->post_title); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $('#show_checklist_items').on('change', function() {
                $('.mcl-dependent-field').toggle(this.checked);
            });
        });
        </script>
        <?php
    }

    public function render_dashboard_widget_show_deadlines_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $show_deadlines = isset($widget_settings['show_deadlines']) ? $widget_settings['show_deadlines'] : false;
        ?>
        <div class="mcl-toggle-wrapper">
            <label class="mcl-toggle-switch">
                <input type="checkbox" 
                       name="mcl_dashboard_widget_settings[show_deadlines]" 
                       <?php checked($show_deadlines, true); ?>>
                <span class="mcl-switch-label"></span>
            </label>
            <p class="mcl-description">
                <?php esc_html_e('Display upcoming deadlines for checklist items with color-coded urgency.', 'magic-checklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_dashboard_widget_show_tags_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $show_tags = isset($widget_settings['show_tags']) ? $widget_settings['show_tags'] : false;
        ?>
        <div class="mcl-toggle-wrapper">
            <label class="mcl-toggle-switch">
                <input type="checkbox" 
                       name="mcl_dashboard_widget_settings[show_tags]" 
                       <?php checked($show_tags, true); ?>>
                <span class="mcl-switch-label"></span>
            </label>
            <p class="mcl-description">
                <?php esc_html_e('Display tags associated with each checklist.', 'magic-checklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_dashboard_widget_show_descriptions_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $show_descriptions = isset($widget_settings['show_descriptions']) ? $widget_settings['show_descriptions'] : false;
        ?>
        <div class="mcl-toggle-wrapper">
            <label class="mcl-toggle-switch">
                <input type="checkbox" 
                       name="mcl_dashboard_widget_settings[show_descriptions]" 
                       <?php checked($show_descriptions, true); ?>>
                <span class="mcl-switch-label"></span>
            </label>
            <p class="mcl-description">
                <?php esc_html_e('Display a truncated description for each checklist.', 'magic-checklists'); ?>
            </p>
        </div>
        <?php
    }

    public function render_dashboard_widget_show_quick_actions_field() {
        $widget_settings = self::get_setting('dashboard_widget', array());
        $show_quick_actions = isset($widget_settings['show_quick_actions']) ? $widget_settings['show_quick_actions'] : true;
        ?>
        <div class="mcl-toggle-wrapper">
            <label class="mcl-toggle-switch">
                <input type="checkbox" 
                       name="mcl_dashboard_widget_settings[show_quick_actions]" 
                       <?php checked($show_quick_actions, true); ?>>
                <span class="mcl-switch-label"></span>
            </label>
            <p class="mcl-description">
                <?php esc_html_e('Display quick action buttons to activate/deactivate checklists directly from the dashboard.', 'magic-checklists'); ?>
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
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        check_ajax_referer('mcl_admin_nonce', 'nonce');

        $general_settings = get_option($this->option_name, array());
        $integration_settings = get_option($this->integration_option_name, array());
        $dashboard_settings = get_option('mcl_dashboard_widget_settings', array());

        // Decrypt API keys for display
        if (isset($integration_settings['mainwp_api_key'])) {
            $integration_settings['mainwp_api_key'] = $this->decrypt_api_key($integration_settings['mainwp_api_key']);
        }
        if (isset($integration_settings['mcl_api_key'])) {
            $integration_settings['mcl_api_key'] = $this->decrypt_api_key($integration_settings['mcl_api_key']);
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
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        check_ajax_referer('mcl_admin_nonce', 'nonce');

        $section = sanitize_text_field($_POST['section']);
        $settings_json = stripslashes($_POST['settings']);
        $settings = json_decode($settings_json, true);

        if (!$settings) {
            wp_send_json_error(array('message' => 'Invalid settings data'));
            return;
        }

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
                update_option('mcl_dashboard_widget_settings', $sanitized);
                break;
            default:
                wp_send_json_error(array('message' => 'Invalid section'));
                return;
        }

        wp_send_json_success(array('message' => 'Settings saved successfully'));
    }

    /**
     * AJAX handler to get menu items
     */
    public function ajax_get_menu_items() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        check_ajax_referer('mcl_admin_nonce', 'nonce');

        global $menu;
        $menu_items = array();
        
        if (is_array($menu)) {
            foreach ($menu as $item) {
                if (!empty($item[0]) && !empty($item[2])) {
                    $title = strip_tags($item[0]);
                    $menu_items[] = array(
                        'slug' => $item[2],
                        'title' => $title
                    );
                }
            }
        }

        wp_send_json_success($menu_items);
    }

    /**
     * AJAX handler to get webhook logs
     */
    public function ajax_get_webhook_logs() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        check_ajax_referer('mcl_admin_nonce', 'nonce');

        $logs = $this->get_webhook_logs();
        wp_send_json_success($logs);
    }

    /**
     * AJAX handler to test webhook
     */
    public function ajax_test_webhook() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        check_ajax_referer('mcl_admin_nonce', 'nonce');

        $endpoint = esc_url_raw($_POST['endpoint']);
        
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
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        check_ajax_referer('mcl_admin_nonce', 'nonce');

        delete_option('mcl_webhook_logs');
        wp_send_json_success(array('message' => 'Webhook logs cleared'));
    }
}