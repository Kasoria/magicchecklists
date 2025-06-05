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
 * Version:           2.0.0
 * Requires at least: 6.5
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

if ( ! class_exists( 'MagicChecklists' ) ) {

    class MagicChecklists {

        public function __construct() {
            $this->define_constants();
            $this->setup_autoloader();
            $this->init_hooks();
        }

        /**
         * Define plugin constants
         */
        private function define_constants() {
            define('MAGIC_CHECKLISTS_VERSION', '2.0.0');
            define('MAGIC_CHECKLISTS_PLUGIN_PATH', plugin_dir_path(__FILE__));
            define('MAGIC_CHECKLISTS_PLUGIN_URL', plugin_dir_url(__FILE__));
            define('MAGIC_CHECKLISTS_ADMIN_PATH', MAGIC_CHECKLISTS_PLUGIN_PATH . 'admin/');
            define('MAGIC_CHECKLISTS_ADMIN_URL', MAGIC_CHECKLISTS_PLUGIN_URL . 'admin/');
            define('MAGIC_CHECKLISTS_PUBLIC_PATH', MAGIC_CHECKLISTS_PLUGIN_PATH . 'public/');
            define('MAGIC_CHECKLISTS_PUBLIC_URL', MAGIC_CHECKLISTS_PLUGIN_URL . 'public/');
            define('MAGIC_CHECKLISTS_TEXT_DOMAIN', 'magic-checklists');
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
            
            // Include SureCart Licensing (third-party, not using our autoloader)
            if (!class_exists('SureCart\Licensing\Client')) {
                // Include the autoloader if SureCart uses Composer
                if (file_exists(MAGIC_CHECKLISTS_PLUGIN_PATH . 'licensing/vendor/autoload.php')) {
                    require_once MAGIC_CHECKLISTS_PLUGIN_PATH . 'licensing/vendor/autoload.php';
                } else {
                    // Fallback to direct inclusion if autoloader is not present
                    require_once MAGIC_CHECKLISTS_PLUGIN_PATH . 'licensing/src/Client.php';
                }
            }

            register_activation_hook(__FILE__, array($this, 'activate'));
        }

        /**
         * Initialize hooks
         */
        private function init_hooks() {
            add_action('plugins_loaded', array($this, 'load_textdomain'));
            add_action('init', array($this, 'init'));
            add_action('plugins_loaded', array($this, 'check_version'));
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

            if (is_admin()) {
                new MCL_Admin();
                new MCL_Tour_Admin();
                
                MCL_Admin_Integration::get_instance();

                MCL_Publisher_Checklist::get_instance();

                MCL_Dashboard_Widget::get_instance();
            }

            // Initialize SureCart Licensing
            $this->init_licensing();

            require_once MAGIC_CHECKLISTS_PLUGIN_PATH . 'includes/class-mcl-shortcode.php';
            MCL_Shortcode::get_instance();
        }

        public function activate() {
            MCL_DB_Manager::get_instance()->install();
            MCL_Analytics::get_instance()->activate();
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

        /**
         * Initialize SureCart Licensing
         */
        private function init_licensing() {
            // Replace 'YOUR_PUBLIC_TOKEN' with your actual public token from SureCart
            $client = new \SureCart\Licensing\Client('MagicChecklists', 'pt_cBheuHynZ9Ft9mhGLuoWM1LA', __FILE__);

            // Set your text domain
            $client->set_textdomain(MAGIC_CHECKLISTS_TEXT_DOMAIN);

            // Add the pre-built license settings page
            $client->settings()->add_page(array(
                'type'                 => 'submenu',
                'parent_slug'          => 'mcl_checklists',
                'page_title'           => 'Manage License',
                'menu_title'           => 'Manage License',
                'capability'           => 'manage_options',
                'menu_slug'            => 'mcl_manage_license',
                'icon_url'             => '',
                'position'             => null,
                'activated_redirect'   => admin_url('admin.php?page=mcl_checklists'),
                'deactivated_redirect' => admin_url('admin.php?page=mcl_checklists'),
            ));
        }
    }

    new MagicChecklists();
    new MCL_API_Integration();
}
