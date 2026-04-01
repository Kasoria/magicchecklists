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
 * Author URI:        https://chrispump.me
 * Text Domain:       magicchecklists
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
define('MAGIC_CHECKLISTS_TEXT_DOMAIN', 'magicchecklists');

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
                if (strpos($class_name, 'MAGICCL_') !== 0) {
                    return;
                }

                // Convert class name to file path
                $class_name = str_replace('MAGICCL_', '', $class_name);
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
            $settings = get_option('magiccl_settings', array());
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
                'magicchecklists',
                false,
                dirname(plugin_basename(__FILE__)) . '/languages/'
            );
        }
        
        /**
         * Override the locale for our plugin only
         */
        public function override_plugin_locale($locale, $domain) {
            if ($domain === 'magicchecklists') {
                $settings = get_option('magiccl_settings', array());
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
            if ($domain === 'magicchecklists') {
                $settings = get_option('magiccl_settings', array());
                $plugin_language = isset($settings['plugin_language']) ? $settings['plugin_language'] : '';
                
                if (!empty($plugin_language)) {
                    $new_mofile = MAGIC_CHECKLISTS_PLUGIN_PATH . 'languages/magicchecklists-' . $plugin_language . '.mo';
                    
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
            new MAGICCL_CPT();
            
            // Store MAGICCL_Public instance globally for other classes to access
            global $magiccl_public_instance;
            $magiccl_public_instance = new MAGICCL_Public();
            
            MAGICCL_Settings::get_instance();
            MAGICCL_Export_Handler::get_instance();
            MAGICCL_Analytics::get_instance();
            MAGICCL_Notification_Manager::get_instance();
            MAGICCL_Global_Notification_Manager::get_instance();
            
            // Initialize tour functionality
            new MAGICCL_Tour_CPT();
            new MAGICCL_Tour_Public();

            // Initialize React development environment and store globally
            global $magiccl_react_dev;
            $magiccl_react_dev = new MAGICCL_React_Dev();

            // Load AJAX handler for test notifications
            require_once MAGIC_CHECKLISTS_PLUGIN_PATH . 'includes/class-mcl-notification-ajax-manager.php';
            MAGICCL_Notification_Ajax_Handler::get_instance();

            // Initialize image upload/select AJAX handlers
            new MAGICCL_Image_Handler();
            
            // Load i18n class
            require_once MAGIC_CHECKLISTS_PLUGIN_PATH . 'includes/class-mcl-i18n.php';

            // Initialize tutorial checklist handler (for AJAX)
            require_once MAGIC_CHECKLISTS_PLUGIN_PATH . 'includes/class-mcl-tutorial.php';
            MAGICCL_Tutorial::get_instance();

            if (is_admin()) {
                new MAGICCL_Admin();
                new MAGICCL_Tour_Admin();
                
                MAGICCL_Admin_Integration::get_instance();

                MAGICCL_Publisher_Checklist::get_instance();

                MAGICCL_Dashboard_Widget::get_instance();
            }

            require_once MAGIC_CHECKLISTS_PLUGIN_PATH . 'includes/class-mcl-shortcode.php';
            MAGICCL_Shortcode::get_instance();
        }

        public function activate() {
            MAGICCL_DB_Manager::get_instance()->install();
            MAGICCL_Analytics::get_instance()->activate();

            // Auto-detect and set plugin language based on WordPress locale
            $this->maybe_set_language_on_activation();

            // Create tutorial checklist on fresh installs
            require_once MAGIC_CHECKLISTS_PLUGIN_PATH . 'includes/class-mcl-tutorial.php';
            MAGICCL_Tutorial::get_instance()->maybe_create_on_activation();
        }

        /**
         * Auto-detect WordPress language and set plugin language if translation exists
         */
        private function maybe_set_language_on_activation() {
            $settings = get_option('magiccl_settings', array());

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
            $mo_file = MAGIC_CHECKLISTS_PLUGIN_PATH . 'languages/magicchecklists-' . $wp_locale . '.mo';

            if (file_exists($mo_file)) {
                $settings['plugin_language'] = $wp_locale;
                update_option('magiccl_settings', $settings);
            }
        }
        
        public function check_version() {
            // Migrate from old mcl_ prefix to magiccl_ prefix
            if (!get_option('magiccl_prefix_migrated')) {
                $this->migrate_prefix();
            }

            if (version_compare(get_option('magiccl_version', '1.2'), MAGIC_CHECKLISTS_VERSION, '<')) {
                // Run database updates
                MAGICCL_DB_Manager::get_instance()->install();
                
                // Update version
                update_option('magiccl_version', MAGIC_CHECKLISTS_VERSION);
            }

            $plugin_data_version = get_option('magiccl_plugin_data_version', '1.0');
            if (version_compare($plugin_data_version, '1.2.1', '<')) {
                // Run the upgrade routine for load_everywhere meta
                global $wpdb;
                
                // Get all checklist IDs that DON'T have the _magiccl_load_everywhere meta key
                $checklist_ids = $wpdb->get_col("
                    SELECT p.ID 
                    FROM {$wpdb->posts} p 
                    LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_magiccl_load_everywhere'
                    WHERE p.post_type = 'magiccl_checklist' 
                    AND pm.meta_id IS NULL
                ");

                // Bulk insert the meta values for all these checklists
                if (!empty($checklist_ids)) {
                    $values = array();
                    $placeholders = array();
                    
                    foreach ($checklist_ids as $checklist_id) {
                        $values[] = $checklist_id;
                        $values[] = '_magiccl_load_everywhere';
                        $values[] = '1';
                        $placeholders[] = '(%d, %s, %s)';
                    }

                    // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Placeholders are generated safely via array_fill with %d/%s
                    $query = $wpdb->prepare(
                        "INSERT INTO {$wpdb->postmeta} (post_id, meta_key, meta_value) VALUES " .
                        implode(', ', $placeholders), // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Placeholders generated safely via array_fill
                        $values
                    );

                    $wpdb->query($query); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- $query is built via $wpdb->prepare() above
                }
                
                // Update the plugin data version
                update_option('magiccl_plugin_data_version', '1.2.1');
            }
        }

        /**
         * Migrate from old mcl_ prefix to magiccl_ prefix
         */
        private function migrate_prefix() {
            global $wpdb;

            // Migrate post types
            $wpdb->query("UPDATE {$wpdb->posts} SET post_type = 'magiccl_checklist' WHERE post_type = 'mcl_checklist'");
            $wpdb->query("UPDATE {$wpdb->posts} SET post_type = 'magiccl_tour' WHERE post_type = 'mcl_tour'");

            // Migrate taxonomy
            $wpdb->query("UPDATE {$wpdb->term_taxonomy} SET taxonomy = 'magiccl_tag' WHERE taxonomy = 'mcl_tag'");

            // Migrate post meta keys
            $wpdb->query("UPDATE {$wpdb->postmeta} SET meta_key = REPLACE(meta_key, '_mcl_', '_magiccl_') WHERE meta_key LIKE '\\_mcl\\_%'");

            // Migrate options
            $old_options = $wpdb->get_results("SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE 'mcl\\_%'");
            foreach ($old_options as $option) {
                $new_name = 'magiccl_' . substr($option->option_name, 4);
                if (!get_option($new_name)) {
                    update_option($new_name, maybe_unserialize($option->option_value));
                }
                delete_option($option->option_name);
            }

            // Migrate user meta
            $wpdb->query("UPDATE {$wpdb->usermeta} SET meta_key = REPLACE(meta_key, 'mcl_', 'magiccl_') WHERE meta_key LIKE 'mcl\\_%'");

            // Migrate custom tables if they exist
            $old_tables = array(
                'mcl_global_notifications' => 'magiccl_global_notifications',
                'mcl_notification_settings' => 'magiccl_notification_settings',
                'mcl_feature_board_settings' => 'magiccl_feature_board_settings',
            );
            foreach ($old_tables as $old_suffix => $new_suffix) {
                $old_table = $wpdb->prefix . $old_suffix;
                $new_table = $wpdb->prefix . $new_suffix;
                if ($wpdb->get_var("SHOW TABLES LIKE '{$old_table}'") === $old_table
                    && $wpdb->get_var("SHOW TABLES LIKE '{$new_table}'") !== $new_table) {
                    $wpdb->query("RENAME TABLE `{$old_table}` TO `{$new_table}`");
                }
            }

            // Migrate transients
            $wpdb->query("UPDATE {$wpdb->options} SET option_name = REPLACE(option_name, '_transient_mcl_', '_transient_magiccl_') WHERE option_name LIKE '\\_transient\\_mcl\\_%'");
            $wpdb->query("UPDATE {$wpdb->options} SET option_name = REPLACE(option_name, '_transient_timeout_mcl_', '_transient_timeout_magiccl_') WHERE option_name LIKE '\\_transient\\_timeout\\_mcl\\_%'");

            update_option('magiccl_prefix_migrated', true);
        }

    }

    new MagicChecklists();
    new MAGICCL_API_Integration();
}
