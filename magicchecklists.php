<?php
/**
 * MagicChecklists
 *
 * @package           MagicChecklists
 * @author            Christian Wenterodt
 * @copyright         2024 Christian Wenterodt
 * @license           GPL-2.0-or-later
 *
 * @wordpress-plugin
 * Plugin Name:       MagicChecklists
 * Plugin URI:        https://magicplugins.io
 * Description:       Allows the creation of custom checklists in the WordPress backend.
 * Version:           2.3
 * Requires PHP:      7.4
 * Author:            Christian Wenterodt
 * Author URI:        https://magicplugins.io
 * Text Domain:       magic-checklists
 * Domain Path:       /languages
 * License:           GPL v2 or later
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Define plugin constants
define('MAGIC_CHECKLISTS_VERSION', '2.3');
define('MAGIC_CHECKLISTS_PLUGIN_FILE', __FILE__);
define('MAGIC_CHECKLISTS_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('MAGIC_CHECKLISTS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MAGIC_CHECKLISTS_ADMIN_PATH', MAGIC_CHECKLISTS_PLUGIN_PATH . 'admin/');
define('MAGIC_CHECKLISTS_ADMIN_URL', MAGIC_CHECKLISTS_PLUGIN_URL . 'admin/');
define('MAGIC_CHECKLISTS_PUBLIC_PATH', MAGIC_CHECKLISTS_PLUGIN_PATH . 'public/');
define('MAGIC_CHECKLISTS_PUBLIC_URL', MAGIC_CHECKLISTS_PLUGIN_URL . 'public/');
define('MAGIC_CHECKLISTS_TEXT_DOMAIN', 'magic-checklists');

if ( ! class_exists( 'MagicChecklists' ) ) {

    class MagicChecklists {

        public function __construct() {
            $this->setup_autoloader();
            $this->init_hooks();
        }

        /**
         * Setup the autoloader for our plugin classes
         */
        private function setup_autoloader() {
            spl_autoload_register(function($class_name) {
                // Only handle our plugin's classes
                if (strpos($class_name, 'MCL_') !== 0) {
                    return;
                }

                // Convert class name to file path
                $class_name = str_replace('MCL_', '', $class_name);
                $file_name = 'class-mcl-' . strtolower(str_replace('_', '-', $class_name)) . '.php';
                $file_path = MAGIC_CHECKLISTS_PLUGIN_PATH . 'includes/' . $file_name;

                // Check if file exists and load it
                if (file_exists($file_path)) {
                    require_once $file_path;
                }
            });

            register_activation_hook(MAGIC_CHECKLISTS_PLUGIN_FILE, array($this, 'activate'));
        }

        /**
         * Initialize hooks
         */
        private function init_hooks() {
            // Apply language override filter very early
            add_action('plugins_loaded', array($this, 'setup_language_override'), 5);
            add_action('plugins_loaded', array($this, 'load_textdomain'), 10);
            add_action('init', array($this, 'init'));
            add_action('plugins_loaded', array($this, 'check_version'));
        }

        /**
         * Setup language override filter early
         */
        public function setup_language_override() {
            // Check if user has set a custom language for the plugin
            $settings = get_option('mcl_settings', array());
            $plugin_language = isset($settings['plugin_language']) ? $settings['plugin_language'] : '';
            
            // If a custom language is set, add filters before any textdomain is loaded
            if (!empty($plugin_language)) {
                add_filter('plugin_locale', array($this, 'override_plugin_locale'), 10, 2);
                add_filter('load_textdomain_mofile', array($this, 'override_mo_file'), 10, 2);
            }
        }

        /**
         * Load plugin textdomain
         */
        public function load_textdomain() {
            load_plugin_textdomain(
                'magic-checklists',
                false,
                dirname(plugin_basename(__FILE__)) . '/languages/'
            );
        }
        
        /**
         * Override the locale for our plugin only
         */
        public function override_plugin_locale($locale, $domain) {
            if ($domain === 'magic-checklists') {
                $settings = get_option('mcl_settings', array());
                $plugin_language = isset($settings['plugin_language']) ? $settings['plugin_language'] : '';
                
                if (!empty($plugin_language)) {
                    return $plugin_language;
                }
            }
            return $locale;
        }

        /**
         * Override the MO file path for our plugin
         */
        public function override_mo_file($mofile, $domain) {
            if ($domain === 'magic-checklists') {
                $settings = get_option('mcl_settings', array());
                $plugin_language = isset($settings['plugin_language']) ? $settings['plugin_language'] : '';
                
                if (!empty($plugin_language)) {
                    $languages_path = dirname(plugin_basename(__FILE__)) . '/languages/';
                    $new_mofile = WP_PLUGIN_DIR . '/' . $languages_path . 'magic-checklists-' . $plugin_language . '.mo';
                    
                    if (file_exists($new_mofile)) {
                        return $new_mofile;
                    }
                }
            }
            return $mofile;
        }

        /**
         * Initialize the plugin
         */
        public function init() {
            new MCL_CPT();
            
            // Store MCL_Public instance globally for other classes to access
            global $mcl_public_instance;
            $mcl_public_instance = new MCL_Public();
            
            MCL_Settings::get_instance();
            MCL_Export_Handler::get_instance();
            MCL_Analytics::get_instance();
            MCL_Notification_Manager::get_instance();
            MCL_Global_Notification_Manager::get_instance();
            
            // Initialize tour functionality
            new MCL_Tour_CPT();
            new MCL_Tour_Public();

            // Initialize React development environment and store globally
            global $mcl_react_dev;
            $mcl_react_dev = new MCL_React_Dev();

            // Load AJAX handler for test notifications
            require_once MAGIC_CHECKLISTS_PLUGIN_PATH . 'includes/class-mcl-notification-ajax-manager.php';
            MCL_Notification_Ajax_Handler::get_instance();

            // Initialize image upload/select AJAX handlers
            new MCL_Image_Handler();
            
            // Load i18n class
            require_once MAGIC_CHECKLISTS_PLUGIN_PATH . 'includes/class-mcl-i18n.php';

            // Initialize tutorial checklist handler (for AJAX)
            require_once MAGIC_CHECKLISTS_PLUGIN_PATH . 'includes/class-mcl-tutorial.php';
            MCL_Tutorial::get_instance();

            if (is_admin()) {
                new MCL_Admin();
                new MCL_Tour_Admin();
                
                MCL_Admin_Integration::get_instance();

                MCL_Publisher_Checklist::get_instance();

                MCL_Dashboard_Widget::get_instance();
            }

            require_once MAGIC_CHECKLISTS_PLUGIN_PATH . 'includes/class-mcl-shortcode.php';
            MCL_Shortcode::get_instance();
        }

        public function activate() {
            MCL_DB_Manager::get_instance()->install();
            MCL_Analytics::get_instance()->activate();

            // Auto-detect and set plugin language based on WordPress locale
            $this->maybe_set_language_on_activation();

            // Create tutorial checklist on fresh installs
            require_once MAGIC_CHECKLISTS_PLUGIN_PATH . 'includes/class-mcl-tutorial.php';
            MCL_Tutorial::get_instance()->maybe_create_on_activation();
        }

        /**
         * Auto-detect WordPress language and set plugin language if translation exists
         */
        private function maybe_set_language_on_activation() {
            $settings = get_option('mcl_settings', array());

            // Only set if not already configured
            if (!empty($settings['plugin_language'])) {
                return;
            }

            // Get WordPress locale
            $wp_locale = get_locale();

            // Skip if English (default)
            if ($wp_locale === 'en_US' || empty($wp_locale)) {
                return;
            }

            // Check if we have a translation file for this locale
            $mo_file = MAGIC_CHECKLISTS_PLUGIN_PATH . 'languages/magic-checklists-' . $wp_locale . '.mo';

            if (file_exists($mo_file)) {
                $settings['plugin_language'] = $wp_locale;
                update_option('mcl_settings', $settings);
            }
        }
        
        public function check_version() {
            if (version_compare(get_option('mcl_version', '1.2'), MAGIC_CHECKLISTS_VERSION, '<')) {
                // Run database updates
                MCL_DB_Manager::get_instance()->install();
                
                // Update version
                update_option('mcl_version', MAGIC_CHECKLISTS_VERSION);
            }

            $plugin_data_version = get_option('mcl_plugin_data_version', '1.0');
            if (version_compare($plugin_data_version, '1.2.1', '<')) {
                // Run the upgrade routine for load_everywhere meta
                global $wpdb;
                
                // Get all checklist IDs that DON'T have the _mcl_load_everywhere meta key
                $checklist_ids = $wpdb->get_col("
                    SELECT p.ID 
                    FROM {$wpdb->posts} p 
                    LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_mcl_load_everywhere'
                    WHERE p.post_type = 'mcl_checklist' 
                    AND pm.meta_id IS NULL
                ");

                // Bulk insert the meta values for all these checklists
                if (!empty($checklist_ids)) {
                    $values = array();
                    $placeholders = array();
                    
                    foreach ($checklist_ids as $checklist_id) {
                        $values[] = $checklist_id;
                        $values[] = '_mcl_load_everywhere';
                        $values[] = '1';
                        $placeholders[] = '(%d, %s, %s)';
                    }

                    $query = $wpdb->prepare(
                        "INSERT INTO {$wpdb->postmeta} (post_id, meta_key, meta_value) VALUES " . 
                        implode(', ', $placeholders),
                        $values
                    );
                    
                    $wpdb->query($query);
                }
                
                // Update the plugin data version
                update_option('mcl_plugin_data_version', '1.2.1');
            }
        }

    }

    new MagicChecklists();
    new MCL_API_Integration();
}
