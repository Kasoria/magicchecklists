<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

/**
 * React Development Environment Handler
 * 
 * This class handles loading React components in both development and production modes.
 * Instead of duplicating logic, it leverages the existing MCL_Public::should_load_assets()
 * logic to determine when to enqueue React scripts, ensuring consistency with the 
 * existing permission and loading systems.
 * 
 * @since 2.0.0
 */
class MCL_React_Dev {
    
    private $vite_dev_server = 'http://localhost:3000';
    public $is_dev_mode = false;
    
    /**
     * Allows developers to explicitly turn dev-mode on or off by defining the
     * `MCL_DEV_MODE` constant in wp-config.php. If the constant is defined
     * the plugin will never perform the localhost availability check – this
     * avoids unnecessary requests on production while still giving full
     * control in local environments.
     */
    private function is_dev_mode_forced() {
        return defined( 'MCL_DEV_MODE' );
    }
    
    public function __construct() {
        // Decide whether we're in development mode.
        // 1. Respect explicit override via constant first.
        if ( $this->is_dev_mode_forced() ) {
            $this->is_dev_mode = (bool) MCL_DEV_MODE;
        } else {
            // 2. Otherwise auto-detect by pinging the dev-server (only when useful).
            $this->is_dev_mode = $this->is_vite_dev_server_running();
        }
        
        // If in dev mode, inject React Refresh preamble into head for HMR support
        if ( $this->is_dev_mode ) {
            add_action( 'admin_head', array( $this, 'vite_refresh_preamble' ) );
            add_action( 'wp_head', array( $this, 'vite_refresh_preamble' ) );
        }
        
        // Hook into the existing MCL_Public enqueue logic
        add_action( 'admin_enqueue_scripts', array( $this, 'maybe_enqueue_react_scripts' ), 6 ); // After MCL_Public (priority 5)
        add_action( 'wp_enqueue_scripts', array( $this, 'maybe_enqueue_react_scripts' ), 6 );
        
        // Add React root elements to both frontend and admin
        add_action( 'wp_footer', array( $this, 'add_react_root_elements' ) );
        add_action( 'admin_footer', array( $this, 'add_react_root_elements' ) );
        
        add_action( 'admin_head', array( $this, 'add_admin_styles' ) );
    }
    
    /**
     * Check if Vite dev server is running by making a test request
     */
    public function is_vite_dev_server_running() {
        // If the developer forced dev-mode explicitly, never probe the server.
        if ( $this->is_dev_mode_forced() ) {
            return (bool) MCL_DEV_MODE;
        }

        // Only check in development/staging environments
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            /*
             * Use WordPress HTTP API for the availability check instead of
             * file_get_contents(). The HTTP API will return a WP_Error on
             * failure instead of triggering the PHP warning:
             *   "file_get_contents(...): Failed to open stream: Connection refused".
             * This keeps the admin UI clean while still accurately detecting
             * whether the Vite dev-server is running.
             */

            $response = wp_remote_get( $this->vite_dev_server, [
                'timeout' => 1,
                'redirection' => 0,
                'blocking' => true,
                'sslverify' => false, // Local dev server is usually http
                'headers' => [],
            ] );

            // If we didn't get a WP_Error back, the dev-server accepted the
            // connection – even when it responds with 404 for the root path.
            // That is enough to know that the server is running.

            return ! is_wp_error( $response );
        }
        
        return false;
    }
    
    /**
     * Hook into existing MCL_Public enqueue logic to provide React scripts
     */
    public function maybe_enqueue_react_scripts( $hook ) {
        // Get the global MCL_Public instance
        global $mcl_public_instance;
        if ( ! $mcl_public_instance ) {
            return; // MCL_Public not loaded yet
        }
        
        // Check for tour mode parameters first - if present, always load React
        $is_tour_mode = isset($_GET['mcl_tour_mode']) && $_GET['mcl_tour_mode'] == '1';
        $continue_tour_id = isset($_GET['mcl_continue_tour']) ? intval($_GET['mcl_continue_tour']) : 0;
        $has_tour_id = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : 0;
        
        // Force React loading for tour mode, regardless of checklist conditions
        $force_load_for_tours = $is_tour_mode || $continue_tour_id || $has_tour_id;
        
        // Check tour mode cookie as fallback
        if (!$force_load_for_tours && isset($_COOKIE['mcl_tour_mode']) && $_COOKIE['mcl_tour_mode'] == '1') {
            $force_load_for_tours = true;
        }
        
        // If not tour mode, check if MCL_Public would load assets using its existing logic
        if ( !$force_load_for_tours && ! $mcl_public_instance->should_load_assets() ) {
            return;
        }
        
        // Determine which React app to load based on context
        if ( is_admin() ) {
            // Check if this is a plugin admin page
            $screen = get_current_screen();
            if ( $screen ) {
                $plugin_pages = array(
                    'toplevel_page_magic_plugins',        // Main MagicPlugins landing page
                    'magicplugins_page_mcl_checklists',    // MagicChecklists main page
                    'magicplugins_page_mcl_manage_license' // License management page
                );
                
                if ( in_array( $screen->id, $plugin_pages ) ) {
                    // Load admin React app
                    $this->enqueue_admin_scripts( $hook );
                    // Also load public React app for drawer/floating buttons on admin pages
                    $this->enqueue_public_scripts( $hook );
                } else {
                    // Load public React app for drawer/floating buttons on admin pages
                    $this->enqueue_public_scripts( $hook );
                }
            } else {
            }
        } else {
            // Load public React app on frontend
            $this->enqueue_public_scripts( $hook );
        }
    }

    /**
     * Enqueue admin React scripts
     */
    private function enqueue_admin_scripts( $hook ) {
        if ( $this->is_dev_mode ) {
            $this->enqueue_admin_dev_scripts( $hook );
        } else {
            $this->enqueue_admin_prod_scripts( $hook );
        }
        $this->localize_admin_data();
    }

    /**
     * Enqueue public React scripts  
     */
    private function enqueue_public_scripts( $hook ) {
        
        if ( $this->is_dev_mode ) {
            $this->enqueue_public_dev_scripts( $hook );
        } else {
            $this->enqueue_public_prod_scripts( $hook );
        }
    }
    
    /**
     * Enqueue admin development scripts from Vite dev server
     */
    private function enqueue_admin_dev_scripts( $hook ) {
        // Check if tour assets are needed and enqueue them first
        if ($this->should_load_tour_assets()) {
            $this->enqueue_tour_assets();
        }

        // Vite client for HMR
        wp_enqueue_script(
            'vite-client',
            $this->vite_dev_server . '/@vite/client',
            array(),
            null,
            false
        );
        
        // Add type="module" to Vite client
        add_filter( 'script_loader_tag', function( $tag, $handle ) {
            if ( $handle === 'vite-client' ) {
                return str_replace( ' src=', ' type="module" src=', $tag );
            }
            return $tag;
        }, 10, 2 );
        
        // Admin React app from Vite dev server
        wp_enqueue_script(
            'mcl-react-admin-dev',
            $this->vite_dev_server . '/src/admin.jsx',
            array( 'vite-client' ),
            null,
            true
        );
        
        add_filter( 'script_loader_tag', function( $tag, $handle ) {
            if ( $handle === 'mcl-react-admin-dev' ) {
                return str_replace( ' src=', ' type="module" src=', $tag );
            }
            return $tag;
        }, 10, 2 );
        
        // Localize script data for React
        $this->localize_admin_data();
    }
    
    /**
     * Enqueue public development scripts from Vite dev server
     */
    private function enqueue_public_dev_scripts( $hook ) {
        // Check if tour assets are needed and enqueue them first
        if ($this->should_load_tour_assets()) {
            $this->enqueue_tour_assets();
        }

        // Check if we're loading both admin and public on the same page
        $is_plugin_page = is_admin() && $this->is_plugin_admin_page();
        $public_handle_suffix = $is_plugin_page ? '-drawer' : '';
        
        // Vite client for HMR - only enqueue if not already enqueued
        if ( ! wp_script_is( 'vite-client', 'enqueued' ) ) {
            wp_enqueue_script(
                'vite-client',
                $this->vite_dev_server . '/@vite/client',
                array(),
                null,
                false
            );
            
            // Add type="module" to Vite client
            add_filter( 'script_loader_tag', function( $tag, $handle ) {
                if ( $handle === 'vite-client' ) {
                    return str_replace( ' src=', ' type="module" src=', $tag );
                }
                return $tag;
            }, 10, 2 );
        }
        
        // Public React app from Vite dev server
        wp_enqueue_script(
            'mcl-react-public-dev' . $public_handle_suffix,
            $this->vite_dev_server . '/src/main.jsx',
            array( 'vite-client' ),
            null,
            true
        );
        
        add_filter( 'script_loader_tag', function( $tag, $handle ) use ( $public_handle_suffix ) {
            if ( $handle === 'mcl-react-public-dev' . $public_handle_suffix ) {
                return str_replace( ' src=', ' type="module" src=', $tag );
            }
            return $tag;
        }, 10, 2 );
        
        // Localize script data for React
        $this->localize_public_data( $public_handle_suffix );
    }
    
    /**
     * Enqueue admin production built scripts
     */
    private function enqueue_admin_prod_scripts( $hook ) {
        // Check if tour assets are needed and enqueue them first
        if ($this->should_load_tour_assets()) {
            $this->enqueue_tour_assets();
        }

        $dist_path = MAGIC_CHECKLISTS_PLUGIN_PATH . 'dist/';
        $dist_url = MAGIC_CHECKLISTS_PLUGIN_URL . 'dist/';
        
        // Load vendor chunks first
        $vendor_handles = $this->enqueue_vendor_chunks( $dist_path, $dist_url );
        
        // Load the main CSS file (Vite generates index-[hash].css for all styles)
        $this->enqueue_main_css( $dist_path, $dist_url );
        
        // Admin React app
        if ( file_exists( $dist_path . 'admin.js' ) ) {
            wp_enqueue_script(
                'mcl-react-admin',
                $dist_url . 'admin.js',
                $vendor_handles,
                MAGIC_CHECKLISTS_VERSION,
                true
            );
            
            // Add type="module" to admin script
            add_filter( 'script_loader_tag', function( $tag, $handle ) {
                if ( $handle === 'mcl-react-admin' ) {
                    return str_replace( ' src=', ' type="module" src=', $tag );
                }
                return $tag;
            }, 10, 2 );
        }
        
        // Localize script data for React
        $this->localize_admin_data();
    }
    
    /**
     * Enqueue public production built scripts
     */
    private function enqueue_public_prod_scripts( $hook ) {
        // Check if tour assets are needed and enqueue them first
        if ($this->should_load_tour_assets()) {
            $this->enqueue_tour_assets();
        }

        $dist_path = MAGIC_CHECKLISTS_PLUGIN_PATH . 'dist/';
        $dist_url = MAGIC_CHECKLISTS_PLUGIN_URL . 'dist/';
        
        // Check if we're loading both admin and public on the same page
        $is_plugin_page = $this->is_plugin_admin_page();
        $public_handle_suffix = $is_plugin_page ? '-drawer' : '';
        
        // Load vendor chunks first
        $vendor_handles = $this->enqueue_vendor_chunks( $dist_path, $dist_url );
        
        // Load the main CSS file (Vite generates index-[hash].css for all styles)
        $this->enqueue_main_css( $dist_path, $dist_url );
        
        // Public React app
        if ( file_exists( $dist_path . 'main.js' ) ) {
            wp_enqueue_script(
                'mcl-react-public' . $public_handle_suffix,
                $dist_url . 'main.js',
                $vendor_handles,
                MAGIC_CHECKLISTS_VERSION,
                true
            );
            
            // Add type="module" to public script
            add_filter( 'script_loader_tag', function( $tag, $handle ) use ( $public_handle_suffix ) {
                if ( $handle === 'mcl-react-public' . $public_handle_suffix ) {
                    return str_replace( ' src=', ' type="module" src=', $tag );
                }
                return $tag;
            }, 10, 2 );
        }
        
        // Localize script data for React
        $this->localize_public_data( $public_handle_suffix );
    }
    
    /**
     * Enqueue the main CSS file generated by Vite
     */
    private function enqueue_main_css( $dist_path, $dist_url ) {
        // Only enqueue CSS once if not already enqueued
        if ( wp_style_is( 'mcl-react-styles', 'enqueued' ) ) {
            return;
        }
        
        // Vite generates CSS files as styles-[hash].css in the assets folder
        $css_files = glob( $dist_path . 'assets/styles-*.css' );
        
        if ( ! empty( $css_files ) ) {
            $css_file = str_replace( $dist_path, '', $css_files[0] );
            wp_enqueue_style(
                'mcl-react-styles',
                $dist_url . $css_file,
                array(),
                MAGIC_CHECKLISTS_VERSION
            );
        } else {
            // Fallback: check for index-[hash].css pattern (from previous builds)
            $css_files = glob( $dist_path . 'assets/index-*.css' );
            if ( ! empty( $css_files ) ) {
                $css_file = str_replace( $dist_path, '', $css_files[0] );
                wp_enqueue_style(
                    'mcl-react-styles',
                    $dist_url . $css_file,
                    array(),
                    MAGIC_CHECKLISTS_VERSION
                );
            } else {
                // Final fallback: check for CSS in root directory
                if ( file_exists( $dist_path . 'index.css' ) ) {
                    wp_enqueue_style(
                        'mcl-react-styles',
                        $dist_url . 'index.css',
                        array(),
                        MAGIC_CHECKLISTS_VERSION
                    );
                }
            }
        }
    }
    
    /**
     * Enqueue vendor chunks for optimized loading
     * @return array Array of vendor handle names
     */
    private function enqueue_vendor_chunks( $dist_path, $dist_url ) {
        $vendor_handles = array();
        
        // Load vendor chunk (React, ReactDOM) - only enqueue if not already enqueued
        $vendor_files = glob( $dist_path . 'vendor-*.js' );
        if ( ! empty( $vendor_files ) && ! wp_script_is( 'mcl-vendor-chunk', 'enqueued' ) ) {
            $vendor_file = str_replace( $dist_path, '', $vendor_files[0] );
            wp_enqueue_script(
                'mcl-vendor-chunk',
                $dist_url . $vendor_file,
                array(),
                MAGIC_CHECKLISTS_VERSION,
                true
            );
            
            add_filter( 'script_loader_tag', function( $tag, $handle ) {
                if ( $handle === 'mcl-vendor-chunk' ) {
                    return str_replace( ' src=', ' type="module" src=', $tag );
                }
                return $tag;
            }, 10, 2 );
        }
        
        if ( wp_script_is( 'mcl-vendor-chunk', 'enqueued' ) || wp_script_is( 'mcl-vendor-chunk', 'done' ) ) {
            $vendor_handles[] = 'mcl-vendor-chunk';
        }
        
        // Load Flowbite chunk - only enqueue if not already enqueued
        $flowbite_files = glob( $dist_path . 'flowbite-*.js' );
        if ( ! empty( $flowbite_files ) && ! wp_script_is( 'mcl-flowbite-chunk', 'enqueued' ) ) {
            $flowbite_file = str_replace( $dist_path, '', $flowbite_files[0] );
            wp_enqueue_script(
                'mcl-flowbite-chunk',
                $dist_url . $flowbite_file,
                array( 'mcl-vendor-chunk' ),
                MAGIC_CHECKLISTS_VERSION,
                true
            );
            
            add_filter( 'script_loader_tag', function( $tag, $handle ) {
                if ( $handle === 'mcl-flowbite-chunk' ) {
                    return str_replace( ' src=', ' type="module" src=', $tag );
                }
                return $tag;
            }, 10, 2 );
        }
        
        if ( wp_script_is( 'mcl-flowbite-chunk', 'enqueued' ) || wp_script_is( 'mcl-flowbite-chunk', 'done' ) ) {
            $vendor_handles[] = 'mcl-flowbite-chunk';
        }
        
        // Load utils chunk - only enqueue if not already enqueued
        $utils_files = glob( $dist_path . 'utils-*.js' );
        if ( ! empty( $utils_files ) && ! wp_script_is( 'mcl-utils-chunk', 'enqueued' ) ) {
            $utils_file = str_replace( $dist_path, '', $utils_files[0] );
            wp_enqueue_script(
                'mcl-utils-chunk',
                $dist_url . $utils_file,
                array( 'mcl-vendor-chunk' ),
                MAGIC_CHECKLISTS_VERSION,
                true
            );
            
            add_filter( 'script_loader_tag', function( $tag, $handle ) {
                if ( $handle === 'mcl-utils-chunk' ) {
                    return str_replace( ' src=', ' type="module" src=', $tag );
                }
                return $tag;
            }, 10, 2 );
        }
        
        if ( wp_script_is( 'mcl-utils-chunk', 'enqueued' ) || wp_script_is( 'mcl-utils-chunk', 'done' ) ) {
            $vendor_handles[] = 'mcl-utils-chunk';
        }
        
        return $vendor_handles;
    }
    
    /**
     * Localize data for admin React apps
     */
    private function localize_admin_data() {
        $handle = $this->is_dev_mode ? 'mcl-react-admin-dev' : 'mcl-react-admin';
        
        $current_page = 'main';
        $page_params = array();
        
        $screen = get_current_screen();
        if ( $screen ) {
            switch ( $screen->id ) {
                case 'toplevel_page_mcl_checklists':
                    $current_page = 'main';
                    break;
                case 'magicchecklists_page_mcl_add_new':
                    $current_page = 'add_new';
                    $page_params = array(
                        'type' => isset($_GET['type']) ? sanitize_text_field($_GET['type']) : '',
                        'checklist_id' => isset($_GET['checklist_id']) ? intval($_GET['checklist_id']) : 0,
                    );
                    break;
                case 'magicchecklists_page_mcl_tours':
                    $current_page = 'tours';
                    $page_params = array(
                        'edit' => isset($_GET['edit']) ? intval($_GET['edit']) : 0,
                        'create' => isset($_GET['create']) ? true : false,
                    );
                    break;
                case 'magicchecklists_page_mcl_import':
                    $current_page = 'import';
                    break;
                case 'magicchecklists_page_mcl_analytics':
                    $current_page = 'analytics';
                    break;
            }
        }

        // Get analytics data for admin pages
        $analytics_data = array();
        if (class_exists('MCL_Analytics')) {
            $analytics = MCL_Analytics::get_instance();
            
            // For the analytics page, get comprehensive data. For others, just summary.
            if ($current_page === 'analytics') {
                $analytics_data = $analytics->get_comprehensive_analytics();
            } else {
                $analytics_data = $analytics->get_analytics_summary();
            }
        }
        
        wp_localize_script( $handle, 'mclAdminData', array(
            'ajaxurl' => admin_url( 'admin-ajax.php' ),
            'restUrl' => rest_url( 'mcl/v1/' ),
            'nonces' => array(
                'wp_rest' => wp_create_nonce( 'wp_rest' ),
                'mcl_admin' => wp_create_nonce( 'mcl_admin_nonce' ),
                'mcl_toggle_active' => wp_create_nonce( 'mcl_toggle_active' ),
                'mcl_save_theme_mode' => wp_create_nonce( 'mcl_save_theme_mode' ),
                'mcl_save_checklist' => wp_create_nonce( 'mcl_save_checklist' ),
                'inviteLinks' => wp_create_nonce( 'mcl_invite_links_nonce' ),
                'testWebhook' => wp_create_nonce( 'mcl_test_webhook' ),
                'mcl_import_checklist' => wp_create_nonce( 'mcl_import_checklist' ),
                'mcl_import_json_checklist' => wp_create_nonce( 'mcl_import_json_checklist' ),
                'mcl_export_txt' => wp_create_nonce( 'mcl_export_txt' ),
                'mcl_export_json' => wp_create_nonce( 'mcl_export_json' ),
                'mcl_export_pdf' => wp_create_nonce( 'mcl_export_pdf' ),
                'mcl_save_pdf_settings' => wp_create_nonce( 'mcl_save_pdf_settings' ),
                'mcl_get_comprehensive_analytics' => wp_create_nonce( 'mcl_get_comprehensive_analytics' ),
                'mcl_cleanup_test_data' => wp_create_nonce( 'mcl_cleanup_test_data' ),
                'mcl_tour_admin' => wp_create_nonce( 'mcl_tour_admin' ),
            ),
            'currentUser' => wp_get_current_user()->ID,
            'savedTheme' => get_user_meta( get_current_user_id(), 'mcl_theme', true ),
            'isAdmin' => is_admin(),
            'isDev' => $this->is_dev_mode,
            'pluginUrl' => MAGIC_CHECKLISTS_PLUGIN_URL,
            'admin_url' => admin_url(),
            'dashboard_url' => admin_url('index.php'),
            'currentPage' => $current_page,
            'pageParams' => $page_params,
            'analytics' => $analytics_data,
            'i18n' => array(
                'loading' => __( 'Loading...', 'magic-checklists' ),
                'error' => __( 'An error occurred', 'magic-checklists' ),
                'save' => __( 'Save', 'magic-checklists' ),
                'cancel' => __( 'Cancel', 'magic-checklists' ),
                'delete' => __( 'Delete', 'magic-checklists' ),
                'edit' => __( 'Edit', 'magic-checklists' ),
            )
        ));
    }
    
    /**
     * Localize data for public React apps
     */
    private function localize_public_data( $public_handle_suffix = '' ) {
        $handle = $this->is_dev_mode ? 'mcl-react-public-dev' . $public_handle_suffix : 'mcl-react-public' . $public_handle_suffix;
        
        // Check if we're in tour mode to provide additional admin data
        $is_tour_mode = isset($_GET['mcl_tour_mode']) && $_GET['mcl_tour_mode'] == '1';
        $continue_tour_id = isset($_GET['mcl_continue_tour']) ? intval($_GET['mcl_continue_tour']) : 0;
        $has_tour_id = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : 0;
        $tour_mode_detected = $is_tour_mode || $continue_tour_id || $has_tour_id;
        
        // Base public data
        $public_data = array(
            'ajaxurl' => admin_url( 'admin-ajax.php' ),
            'restUrl' => rest_url( 'mcl/v1/' ),
            'nonces' => array(
                'wp_rest' => wp_create_nonce( 'wp_rest' ),
                'mcl_admin' => wp_create_nonce( 'mcl_admin_nonce' ),
                'mcl_ajax' => wp_create_nonce( 'mcl_ajax_nonce' ),
                'mcl_ajax_nopriv' => wp_create_nonce( 'mcl_ajax_nopriv_nonce' ),
                'mcl_tour_public' => wp_create_nonce( 'mcl_tour_public' ),
            ),
            'currentUser' => wp_get_current_user()->ID,
            'isLoggedIn' => is_user_logged_in(),
            'isAdmin' => current_user_can( 'manage_options' ),
            'isDev' => $this->is_dev_mode,
            'pluginUrl' => MAGIC_CHECKLISTS_PLUGIN_URL,
            'priorityColors' => class_exists('MCL_Priority_Utils') ? MCL_Priority_Utils::get_priority_colors() : array(),
            'priorityNumbers' => class_exists('MCL_Priority_Utils') ? MCL_Priority_Utils::get_priority_numbers() : array(),
            'i18n' => array(
                'loading' => __( 'Loading...', 'magic-checklists' ),
                'error' => __( 'An error occurred', 'magic-checklists' ),
                'save' => __( 'Save', 'magic-checklists' ),
                'cancel' => __( 'Cancel', 'magic-checklists' ),
                'delete' => __( 'Delete', 'magic-checklists' ),
                'edit' => __( 'Edit', 'magic-checklists' ),
            )
        );
        
        // Add tour-specific data when in tour mode
        if ($tour_mode_detected) {
            $public_data['nonces']['mcl_tour_admin'] = wp_create_nonce( 'mcl_tour_admin' );
            $public_data['nonces']['mcl_tour_public'] = wp_create_nonce( 'mcl_tour_public' );
            $public_data['dashboard_url'] = admin_url( 'index.php' );
            $public_data['admin_url'] = admin_url();
        }
        
        // Always add tour data if tours are available for the current page
        $tour_data = $this->get_tour_data_for_js($is_tour_mode, $continue_tour_id, $has_tour_id);
        if (!empty($tour_data['tours'])) {
            
            // Use the same object name that TourPlayback expects
            wp_localize_script( $handle, 'mclTourPlaybackData', $tour_data );
        }
        
        wp_localize_script( $handle, 'mclPublicData', $public_data );
    }
    
    /**
     * Get tour data for JavaScript localization
     */
    private function get_tour_data_for_js($is_tour_mode, $continue_tour_id, $has_tour_id) {
        
        $tours_data = array();
        
        // Handle tour continuation
        if ($continue_tour_id) {
            $continue_step = isset($_GET['mcl_continue_step']) ? intval($_GET['mcl_continue_step']) : 0;
            $tour = get_post($continue_tour_id);
            if ($tour && $tour->post_type === 'mcl_tour') {
                $steps = get_post_meta($continue_tour_id, '_mcl_tour_steps', true) ?: array();
                $settings = get_post_meta($continue_tour_id, '_mcl_tour_settings', true) ?: array();
                
                $tours_data[] = array(
                    'id' => $continue_tour_id,
                    'title' => $tour->post_title,
                    'steps' => $steps,
                    'settings' => $settings,
                    'autostart' => true,
                    'active' => true,
                    'continue_from_step' => $continue_step
                );
                
            }
        } 
        
        // Handle tour creator mode - load specific tour if provided
        elseif ($is_tour_mode && $has_tour_id) {
            $tour = get_post($has_tour_id);
            if ($tour && $tour->post_type === 'mcl_tour') {
                $steps = get_post_meta($has_tour_id, '_mcl_tour_steps', true) ?: array();
                $settings = get_post_meta($has_tour_id, '_mcl_tour_settings', true) ?: array();
                
                $tours_data[] = array(
                    'id' => $has_tour_id,
                    'title' => $tour->post_title,
                    'steps' => $steps,
                    'settings' => $settings,
                    'autostart' => false,
                    'active' => true,
                    'trigger_type' => get_post_meta($has_tour_id, '_mcl_tour_trigger_type', true) ?: 'page',
                    'trigger_value' => get_post_meta($has_tour_id, '_mcl_tour_trigger_value', true) ?: ''
                );
                
            }
        }
        
        // Normal tour loading (only if not in creator mode or continuation mode)
        elseif (!$is_tour_mode && !$continue_tour_id) {
            // Only load normal tours if we have the Tour CPT class available
            if (class_exists('MCL_Tour_CPT')) {
                $active_tours = MCL_Tour_CPT::get_active_tours_for_context();
                
                foreach ($active_tours as $tour) {
                    $tour_id = $tour->ID;
                    $steps = get_post_meta($tour_id, '_mcl_tour_steps', true) ?: array();
                    $settings = get_post_meta($tour_id, '_mcl_tour_settings', true) ?: array();
                    
                    // Get autostart from settings first, then fall back to meta field
                    $autostart = false;
                    if (isset($settings['autostart'])) {
                        $autostart = $settings['autostart'];
                    } else {
                        $autostart_meta = get_post_meta($tour_id, '_mcl_tour_autostart', true);
                        $autostart = !empty($autostart_meta);
                    }
                    
                    $trigger_type = get_post_meta($tour_id, '_mcl_tour_trigger_type', true) ?: 'page';
                    $trigger_value = get_post_meta($tour_id, '_mcl_tour_trigger_value', true) ?: '';
                    $user_condition = get_post_meta($tour_id, '_mcl_tour_user_condition', true) ?: 'all_users';
                    $specific_users = get_post_meta($tour_id, '_mcl_tour_specific_users', true) ?: array();
                    $specific_roles = get_post_meta($tour_id, '_mcl_tour_specific_roles', true) ?: array();
                    $show_once = get_post_meta($tour_id, '_mcl_tour_show_once', true);
                    
                    $tours_data[] = array(
                        'id' => $tour_id,
                        'title' => $tour->post_title,
                        'steps' => $steps,
                        'settings' => $settings,
                        'autostart' => $autostart,
                        'active' => true,
                        'trigger_type' => $trigger_type,
                        'trigger_value' => $trigger_value,
                        'user_condition' => $user_condition,
                        'specific_users' => $specific_users,
                        'specific_roles' => $specific_roles,
                        'show_once' => !empty($show_once)
                    );
                    
                }
            }
        }
        
        return array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => $is_tour_mode ? wp_create_nonce('mcl_tour_admin') : wp_create_nonce('mcl_tour_public'),
            'tours' => $tours_data,
            'is_tour_mode' => $is_tour_mode,
            'continue_tour_id' => $continue_tour_id,
            'user_id' => get_current_user_id(),
            'is_logged_in' => is_user_logged_in(),
            'current_url' => $this->get_current_page_url(),
            'user_roles' => is_user_logged_in() ? wp_get_current_user()->roles : array()
        );
    }
    
    /**
     * Get current page URL for tour matching
     */
    private function get_current_page_url() {
        if (is_admin()) {
            // For admin pages, use the full URL including query parameters
            $protocol = is_ssl() ? 'https://' : 'http://';
            $current_url = $protocol . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        } else {
            // For frontend pages, use WordPress functions
            global $wp;
            $current_url = home_url(add_query_arg(array(), $wp->request));
        }
        
        return $current_url;
    }
    
    /**
     * Get development status
     */
    public function is_development_mode() {
        return $this->is_dev_mode;
    }
    
    /**
     * Output the Vite React Refresh preamble snippet for HMR
     */
    public function vite_refresh_preamble() {
        // HMR preamble required by @vitejs/plugin-react
        echo '<script type="module">';
        echo 'import RefreshRuntime from "' . esc_url( $this->vite_dev_server ) . '/@react-refresh";';
        echo 'RefreshRuntime.injectIntoGlobalHook(window);';
        echo 'window.$RefreshReg$ = () => {};';
        echo 'window.$RefreshSig$ = () => type => type;';
        echo '</script>';
    }
    
    /**
     * Add React root element to the DOM
     */
    public function add_react_root_elements() {
        // Get the MCL_Public instance to leverage its existing logic
        global $mcl_public_instance;
        if ( ! $mcl_public_instance ) {
            return; // No point adding roots if MCL_Public isn't even loaded
        }
        
        // Check for tour mode parameters first - if present, always add React roots
        $is_tour_mode = isset($_GET['mcl_tour_mode']) && $_GET['mcl_tour_mode'] == '1';
        $continue_tour_id = isset($_GET['mcl_continue_tour']) ? intval($_GET['mcl_continue_tour']) : 0;
        $has_tour_id = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : 0;
        
        // Force React roots for tour mode, regardless of checklist conditions
        $force_load_for_tours = $is_tour_mode || $continue_tour_id || $has_tour_id;
        
        // Check tour mode cookie as fallback
        if (!$force_load_for_tours && isset($_COOKIE['mcl_tour_mode']) && $_COOKIE['mcl_tour_mode'] == '1') {
            $force_load_for_tours = true;
        }
        
        // If not tour mode, check if MCL_Public would load assets using its existing logic
        if ( !$force_load_for_tours && ! $mcl_public_instance->should_load_assets() ) {
            return;
        }
        
        if ( ! is_admin() ) {
            // Add public root element on frontend pages
            echo '<div id="mcl-public-root"></div>';
        } else {
            // Check if this is a plugin admin page
            $screen = get_current_screen();
            if ( $screen ) {
                $plugin_pages = array(
                    'toplevel_page_magic_plugins',        // Main MagicPlugins landing page
                    'magicplugins_page_mcl_checklists',    // MagicChecklists main page
                    'magicplugins_page_mcl_manage_license' // License management page
                );
                
                if ( in_array( $screen->id, $plugin_pages ) ) {
                    // MCL_Admin already creates the mcl-admin-root div in page content
                    // Only add public root for drawer/floating buttons on admin pages
                    echo '<div id="mcl-public-root"></div>';
                } else {
                    // Public React handles drawer/floating buttons on admin pages
                    echo '<div id="mcl-public-root"></div>';
                }
            }
        }
    }
    
    /**
     * Add admin styles for React integration
     */
    public function add_admin_styles() {
        // Only add styles on plugin pages - check specific hook names
        $screen = get_current_screen();
        if ( ! $screen ) {
            return;
        }
        
        $plugin_pages = array(
            'toplevel_page_magic_plugins',        // Main MagicPlugins landing page
            'magicplugins_page_mcl_checklists',    // MagicChecklists main page
            'magicplugins_page_mcl_manage_license' // License management page
        );
        
        if ( ! in_array( $screen->id, $plugin_pages ) ) {
            return;
        }
        
        ?>
        <style>
        #mcl-admin-root {
            width: 100%;
            min-height: 100%;
            margin: 0;
            padding: 0;
            background: transparent;
        }

        .wrap #mcl-admin-root {
            margin: 0;
        }

        @media screen and (max-width: 782px) {
            #mcl-admin-root {
                min-height: calc(100vh - 46px);
            }
        }

        #wpfooter {
            display: none !important;
        }

        #wpcontent {
            padding: 0 !important;
        }
        #wpbody-content {
            padding-bottom: 0 !important;
        }
        /* Theme-based WP admin background color overrides */
        html:not(.dark) body,
        html:not(.dark) #wpwrap {
            background-color: #f4f4f4 !important;
        }
        html.dark body,
        html.dark #wpwrap {
            background-color: #011326 !important;
        }
        </style>
        <?php
    }

    /**
     * Check if current admin page is a plugin admin page
     */
    private function is_plugin_admin_page() {
        if ( ! is_admin() ) {
            return false;
        }
        
        $screen = get_current_screen();
        if ( ! $screen ) {
            return false;
        }
        
        $plugin_pages = array(
            'toplevel_page_magic_plugins',        // Main MagicPlugins landing page
            'magicplugins_page_mcl_checklists',    // MagicChecklists main page
            'magicplugins_page_mcl_manage_license' // License management page
        );
        
        return in_array( $screen->id, $plugin_pages );
    }

    private function should_load_tour_assets() {
        // Check for tour mode parameters
        $is_tour_mode = isset($_GET['mcl_tour_mode']) && $_GET['mcl_tour_mode'] == '1';
        $continue_tour_id = isset($_GET['mcl_continue_tour']) ? intval($_GET['mcl_continue_tour']) : 0;
        $has_tour_id = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : 0;
        
        // Check tour mode cookie as fallback
        $tour_cookie = isset($_COOKIE['mcl_tour_mode']) && $_COOKIE['mcl_tour_mode'] == '1';
        
        return $is_tour_mode || $continue_tour_id || $has_tour_id || $tour_cookie;
    }

    /**
     * Enqueue driver.js and related tour assets when needed
     */
    private function enqueue_tour_assets() {
        // Only enqueue if not already loaded
        if (wp_script_is('driver-js', 'enqueued') || wp_script_is('driver-js', 'done')) {
            return;
        }
        // Enqueue driver.js
        wp_enqueue_script(
            'driver-js',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/vendor/driver.js.iife.js',
            array(),
            '1.3.1',
            true
        );

        wp_enqueue_style(
            'driver-css',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/vendor/driver.css',
            array(),
            '1.3.1'
        );

        // Enqueue tour public styles
                    wp_enqueue_style(
                'mcl-tour-driver',
                MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-tour-driver.css',
                array('driver-css'),
                MAGIC_CHECKLISTS_VERSION
            );
    }
}
