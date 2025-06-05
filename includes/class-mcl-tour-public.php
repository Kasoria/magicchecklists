<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MCL_Tour_Public {
    
    private static $assets_loaded = false;
    
    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_tour_assets'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_tour_assets'));
        add_action('wp_footer', array($this, 'render_tour_ui'));
        add_action('admin_footer', array($this, 'render_tour_ui'));
        add_action('wp_ajax_mcl_mark_tour_complete', array($this, 'mark_tour_complete'));
        add_action('wp_ajax_nopriv_mcl_mark_tour_complete', array($this, 'mark_tour_complete'));
        add_action('wp_ajax_mcl_get_tour_creator_ui', array($this, 'get_tour_creator_ui'));
        add_action('wp_ajax_nopriv_mcl_get_tour_creator_ui', array($this, 'get_tour_creator_ui'));
        
        // Listen for assets loading to prevent duplicates across contexts
        add_action('mcl_tour_assets_loading', array($this, 'on_assets_loading'));
        
        // Add pagebuilder-specific hooks to ensure assets load in their contexts
        $this->add_pagebuilder_hooks();
    }

    /**
     * Generate a consistent session key for asset loading tracking
     */
    private function get_session_key($context = 'general') {
        $user_id = get_current_user_id();
        $time_window = floor(time() / 60); // 1-minute windows - just enough to catch pagebuilder triple-loading
        return 'mcl_assets_loaded_' . $user_id . '_' . $time_window; // Remove context to prevent over-granularity
    }

    /**
     * Called when assets are being loaded to mark them as loaded across contexts
     */
    public function on_assets_loading() {
        $this->set_assets_loaded();
    }

    /**
     * Add hooks specific to pagebuilders to ensure tour assets load in their contexts
     */
    private function add_pagebuilder_hooks() {
        // Use low priority to ensure these run after the main enqueue hooks
        // This helps prevent duplicate loading by allowing the primary hooks to run first
        $priority = 20;
        
        // Elementor hooks
        add_action('elementor/preview/enqueue_styles', array($this, 'enqueue_tour_assets'), $priority);
        add_action('elementor/editor/after_enqueue_scripts', array($this, 'enqueue_tour_assets'), $priority);
        add_action('elementor/frontend/after_enqueue_scripts', array($this, 'enqueue_tour_assets'), $priority);
        
        // Bricks hooks
        add_action('bricks/frontend/enqueue_scripts', array($this, 'enqueue_tour_assets'), $priority);
        add_action('bricks/builder/enqueue_scripts', array($this, 'enqueue_tour_assets'), $priority);
        
        // Divi hooks
        add_action('et_fb_enqueue_assets', array($this, 'enqueue_tour_assets'), $priority);
        
        // Beaver Builder hooks
        add_action('fl_builder_preview_enqueue_ui_scripts', array($this, 'enqueue_tour_assets'), $priority);
        
        // Generic pagebuilder footer hooks
        add_action('elementor/preview/footer', array($this, 'render_tour_ui'), $priority);
        add_action('bricks/frontend/footer', array($this, 'render_tour_ui'), $priority);
    }

    /**
     * Detect if we're likely in an iframe context
     * Based on main plugin's is_inside_pagebuilder method but more comprehensive
     */
    private function is_likely_iframe() {
        // Check pagebuilder-specific indicators (matches main plugin logic)
        $pagebuilder_indicators = array(
            // Elementor
            isset($_GET['elementor-preview']) ||
            (defined('ELEMENTOR_VERSION') && class_exists('\Elementor\Plugin') && 
             method_exists('\Elementor\Plugin', 'instance') && 
             isset(\Elementor\Plugin::$instance->preview) && 
             \Elementor\Plugin::$instance->preview->is_preview_mode()),
            
            // Bricks
            isset($_GET['bricks']) || 
            (function_exists('bricks_is_builder') && bricks_is_builder()),
            
            // Divi
            isset($_GET['et_fb']) || 
            (function_exists('et_core_is_fb_enabled') && et_core_is_fb_enabled()),
            
            // Other pagebuilders
            isset($_GET['fl_builder']),      // Beaver Builder
            isset($_GET['ct_builder']),      // Oxygen
            isset($_GET['tve']),             // Thrive Architect
            isset($_GET['vc_editable']),     // WPBakery
            isset($_GET['fb-edit']),         // Fusion Builder
            isset($_GET['preview']),         // Generic preview
            
            // Generic iframe indicators
            isset($_GET['iframe']),
            isset($_GET['preview_iframe']),
        );
        
        // Check HTTP headers that might indicate iframe
        $header_indicators = array(
            isset($_SERVER['HTTP_SEC_FETCH_DEST']) && $_SERVER['HTTP_SEC_FETCH_DEST'] === 'iframe',
            isset($_SERVER['HTTP_X_FRAME_OPTIONS']),
        );
        
        return in_array(true, array_merge($pagebuilder_indicators, $header_indicators), true);
    }

    /**
     * Check if we're inside a pagebuilder (matches main plugin's method)
     */
    private function is_inside_pagebuilder() {
        // Elementor
        if (isset($_GET['elementor-preview']) || 
            (defined('ELEMENTOR_VERSION') && class_exists('\Elementor\Plugin') && 
             method_exists('\Elementor\Plugin', 'instance') && 
             isset(\Elementor\Plugin::$instance->preview) && 
             \Elementor\Plugin::$instance->preview->is_preview_mode())) {
            return true;
        }
    
        // Bricks
        if (isset($_GET['bricks']) || 
            (function_exists('bricks_is_builder') && bricks_is_builder())) {
            return true;
        }
    
        // Divi
        if (isset($_GET['et_fb']) || 
            (function_exists('et_core_is_fb_enabled') && et_core_is_fb_enabled())) {
            return true;
        }
    
        return false;
    }

    public function enqueue_tour_assets($hook = '') {
        // Check if we're on a plugin admin page - always load assets there
        $is_plugin_page = false;
        if (is_admin()) {
            $is_plugin_page = in_array($hook, [
                'magicchecklists_page_mcl_tours',
                'toplevel_page_magic-checklists',
                'magic-checklists_page_mcl_tours',
                'magic-checklists_page_mcl_checklists'
            ]);
        }
        
        // For plugin pages, skip all checks and load assets directly
        if ($is_plugin_page) {
            // Only prevent duplicate loading within same request
            if (self::$assets_loaded) {
                return;
            }
            
            // Check if we're in tour creation mode
            $is_tour_mode = isset($_GET['mcl_tour_mode']) && $_GET['mcl_tour_mode'] == '1';
            $continue_tour_id = isset($_GET['mcl_continue_tour']) ? intval($_GET['mcl_continue_tour']) : 0;
            $continue_step = isset($_GET['mcl_tour_step']) ? intval($_GET['mcl_tour_step']) : 0;
            
            self::$assets_loaded = true;
            $this->load_tour_assets($is_tour_mode, array(), $continue_tour_id, $continue_step);
            return;
        }
        
        // For non-plugin pages, apply checks
        
        // Prevent multiple asset loading in the same request using multiple checks
        if (self::$assets_loaded) {
            return;
        }
        
        // Additional check using WordPress's script queue to prevent duplicate loading
        if (wp_script_is('driver-js', 'enqueued') || wp_script_is('driver-js', 'done')) {
            return;
        }
        
        // Check if we're in a context where assets have already been loaded
        if (defined('MCL_TOUR_ASSETS_LOADED') && MCL_TOUR_ASSETS_LOADED) {
            return;
        }
        
        // Check if we're inside a pagebuilder - only use transient logic for pagebuilders
        $is_inside_pagebuilder = $this->is_inside_pagebuilder();
        
        // Only check transients for pagebuilder contexts to prevent triple loading
        if ($is_inside_pagebuilder) {
            $session_key = $this->get_session_key();
            
            if (get_transient($session_key)) {
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('MCL Tour: Assets already loaded in pagebuilder session, skipping. Key: ' . $session_key . ', URL: ' . $_SERVER['REQUEST_URI']);
                }
                return;
            }
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('MCL Tour: No existing pagebuilder transient found, proceeding with asset loading. Key: ' . $session_key . ', URL: ' . $_SERVER['REQUEST_URI']);
            }
        }
        
        // Check if we're in tour creation mode
        $is_tour_mode = isset($_GET['mcl_tour_mode']) && $_GET['mcl_tour_mode'] == '1';
        
        // Check if we're continuing a tour
        $continue_tour_id = isset($_GET['mcl_continue_tour']) ? intval($_GET['mcl_continue_tour']) : 0;
        $continue_step = isset($_GET['mcl_tour_step']) ? intval($_GET['mcl_tour_step']) : 0;
        
        // We already checked pagebuilder status above, use it consistently
        // $is_inside_pagebuilder is already set above
        
        // For tour creation mode, always load assets everywhere (pagebuilders use iframes)
        if ($is_tour_mode) {
            $this->set_assets_loaded($is_inside_pagebuilder);
            $this->load_tour_assets($is_tour_mode, array(), $continue_tour_id, $continue_step);
            return;
        }
        
        // For continuing tours, always load assets
        if ($continue_tour_id) {
            $this->set_assets_loaded($is_inside_pagebuilder);
            $this->load_tour_assets($is_tour_mode, array(), $continue_tour_id, $continue_step);
            return;
        }
        
        // If we're inside a pagebuilder, always check for tours since the main window might have tour mode enabled
        // This ensures assets are loaded in pagebuilder iframes when the parent is in tour mode
        if ($is_inside_pagebuilder) {
            // Try to detect if parent window is in tour mode by checking referrer or other indicators
            $should_load_for_pagebuilder = false;
            
            // Check if there are any tour mode indicators in the URL or referrer
            $referrer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
            if ($referrer && (strpos($referrer, 'mcl_tour_mode=1') !== false || strpos($referrer, 'tour_id=') !== false)) {
                $should_load_for_pagebuilder = true;
            }
            
            // Also check for tour-related GET parameters that might have been passed through
            if (isset($_GET['tour_id']) || isset($_GET['mcl_preview_step'])) {
                $should_load_for_pagebuilder = true;
            }
            
            // Check session/cookie for tour mode (fallback method)
            if (!$should_load_for_pagebuilder && isset($_COOKIE['mcl_tour_mode']) && $_COOKIE['mcl_tour_mode'] == '1') {
                $should_load_for_pagebuilder = true;
            }
            
            // Force load if we have a specific parameter (can be set by pagebuilder integration)
            // But only if we haven't already loaded assets in this session
            if (!$should_load_for_pagebuilder && isset($_GET['mcl_force_tour_assets'])) {
                // Check if we've already loaded in this session to prevent loops
                $session_key = $this->get_session_key();
                
                if (!get_transient($session_key)) {
                    $should_load_for_pagebuilder = true;
                } else {
                    if (defined('WP_DEBUG') && WP_DEBUG) {
                        error_log('MCL Tour: Skipping forced asset load - already loaded in session: ' . $session_key);
                    }
                }
            }
            
            if ($should_load_for_pagebuilder) {
                // Load with tour mode indicators from referrer/params
                $tour_id = 0;
                if (isset($_GET['tour_id'])) {
                    $tour_id = intval($_GET['tour_id']);
                } elseif ($referrer && preg_match('/[?&]tour_id=(\d+)/', $referrer, $matches)) {
                    $tour_id = intval($matches[1]);
                }
                
                $this->set_assets_loaded(true); // Always use transient for pagebuilder
                $this->load_tour_assets(true, array(), $tour_id, 0);
                return;
            }
        }
        
        // Check if any tours should be triggered on current page
        if (!MCL_Tour_CPT::has_tours_for_current_page()) {
            return; // No tours for this page, don't load assets
        }
        
        // Get active tours for current context
        $active_tours = MCL_Tour_CPT::get_active_tours_for_context();
        
        if (empty($active_tours)) {
            return;
        }

        $this->set_assets_loaded($is_inside_pagebuilder);
        $this->load_tour_assets($is_tour_mode, $active_tours, $continue_tour_id, $continue_step);
    }

    /**
     * Set the assets loaded flag using multiple mechanisms to prevent duplicate loading
     */
    private function set_assets_loaded($use_transient = null) {
        self::$assets_loaded = true;
        
        // Define a constant that persists across different contexts
        if (!defined('MCL_TOUR_ASSETS_LOADED')) {
            define('MCL_TOUR_ASSETS_LOADED', true);
        }
        
        // Set a global variable as additional backup
        $GLOBALS['mcl_tour_assets_loaded'] = true;
        
        // Only use transient for pagebuilder contexts to prevent triple-loading
        // For other contexts, rely on other checks above
        if ($use_transient === true || ($use_transient === null && $this->is_inside_pagebuilder())) {
            $session_key = $this->get_session_key();
            set_transient($session_key, true, 10); // 10 seconds
        }
    }

    private function load_tour_assets($is_tour_mode, $active_tours, $continue_tour_id = 0, $continue_step = 0) {
        // Additional safety check before loading assets
        if (wp_script_is('driver-js', 'enqueued') || wp_script_is('driver-js', 'done')) {
            return;
        }
        
        // Fire action to allow other instances to know assets are being loaded
        do_action('mcl_tour_assets_loading');
        
        // Enqueue global modal component for tour confirmations
        wp_enqueue_script(
            'mcl-global-modal',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/js/mcl-global-modal.js',
            array('jquery'),
            MAGIC_CHECKLISTS_VERSION,
            true
        );
        
        wp_enqueue_style(
            'mcl-global-modal',
            MAGIC_CHECKLISTS_ADMIN_URL . 'assets/css/mcl-global-modal.css',
            array(),
            MAGIC_CHECKLISTS_VERSION
        );
        
        // Enqueue driver.js
        wp_enqueue_script(
            'driver-js',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/vendor/driver.js.iife.js',
            array('mcl-global-modal'),
            '1.3.1',
            true
        );

        wp_enqueue_style(
            'driver-css',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/vendor/driver.css',
            array('mcl-global-modal'),
            '1.3.1'
        );



        // Enqueue tour public scripts
        if ($is_tour_mode) {
            wp_enqueue_script(
                'mcl-tour-creator',
                MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/mcl-tour-creator.js',
                array('jquery', 'driver-js', 'wp-util', 'json2'),
                MAGIC_CHECKLISTS_VERSION,
                true
            );
        } else {
            wp_enqueue_script(
                'mcl-tour-playback',
                MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/js/mcl-tour-playback.js',
                array('jquery', 'driver-js'),
                MAGIC_CHECKLISTS_VERSION,
                true
            );
        }

        wp_enqueue_style(
            'mcl-tour-public',
            MAGIC_CHECKLISTS_PUBLIC_URL . 'assets/css/mcl-tour-public.css',
            array('driver-css'),
            MAGIC_CHECKLISTS_VERSION
        );

        // Prepare tour data for JS
        $tours_data = array();
        
        // Handle tour continuation
        if ($continue_tour_id) {
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
                    'continue_from_step' => $continue_step
                );
            }
        } else {
            // Normal tour loading
            foreach ($active_tours as $tour) {
                $tour_id = $tour->ID;
                $steps = get_post_meta($tour_id, '_mcl_tour_steps', true) ?: array();
                $settings = get_post_meta($tour_id, '_mcl_tour_settings', true) ?: array();
                $autostart = get_post_meta($tour_id, '_mcl_tour_autostart', true);
                $trigger_type = get_post_meta($tour_id, '_mcl_tour_trigger_type', true) ?: 'page';
                $trigger_value = get_post_meta($tour_id, '_mcl_tour_trigger_value', true) ?: '';
                
                $tours_data[] = array(
                    'id' => $tour_id,
                    'title' => $tour->post_title,
                    'steps' => $steps,
                    'settings' => $settings,
                    'autostart' => $autostart,
                    'trigger_type' => $trigger_type,
                    'trigger_value' => $trigger_value
                );
            }
        }

        // Localize script
        $localize_handle = $is_tour_mode ? 'mcl-tour-creator' : 'mcl-tour-playback';
        $localize_object_name = $is_tour_mode ? 'mclTourCreatorData' : 'mclTour';

        wp_localize_script($localize_handle, $localize_object_name, array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => $is_tour_mode ? wp_create_nonce('mcl_tour_admin') : wp_create_nonce('mcl_tour_public'),
            'tours' => $tours_data,
            'is_tour_mode' => $is_tour_mode,
            'tour_id' => isset($_GET['tour_id']) ? intval($_GET['tour_id']) : 0,
            'continue_tour_id' => $continue_tour_id,
            'continue_step' => $continue_step,
            'is_likely_iframe' => $this->is_likely_iframe(),
            'dashboard_url' => $is_tour_mode ? admin_url('index.php') : '',
            'i18n' => array(
                'next' => __('Next', 'magic-checklists'),
                'prev' => __('Previous', 'magic-checklists'),
                'done' => __('Done', 'magic-checklists'),
                'skip' => __('Skip', 'magic-checklists'),
                'creating' => __('Creating Tour...', 'magic-checklists'),
                'selectElement' => __('Select Element', 'magic-checklists'),
                'navigate' => __('Navigate', 'magic-checklists'),
                // Creator specific i18n
                'save' => __('Save', 'magic-checklists'),
                'cancel' => __('Cancel', 'magic-checklists'),
                'delete' => __('Delete', 'magic-checklists'),
                'confirmDeleteStep' => __('Are you sure you want to delete this step?', 'magic-checklists'),
                'stepTitle' => __('Step Title', 'magic-checklists'),
                'stepContent' => __('Step Content', 'magic-checklists'),
                'selectChecklist' => __('Select Checklist', 'magic-checklists'),
                'selectItem' => __('Select Checklist Item', 'magic-checklists'),
                'tourSaved' => __('Tour saved successfully', 'magic-checklists'),
                'tourDeleted' => __('Tour deleted successfully', 'magic-checklists'),
                'error' => __('An error occurred', 'magic-checklists'),
                'unsavedChanges' => __('You have unsaved changes. Are you sure you want to leave?', 'magic-checklists'),
                'exitCreator' => __('Exit Creator', 'magic-checklists'),
                'saveAndExit' => __('Save & Exit', 'magic-checklists'),
                'exitWithoutSaving' => __('Exit Without Saving', 'magic-checklists'),
                'elementReselection' => __('Reselecting element for step: ', 'magic-checklists'),
                'clickToSelect' => __('Click an element on the page to select it for this step.', 'magic-checklists'),
                'pageUrlMismatch' => __('The current page URL does not match the step\'s page URL. Please navigate to the correct page to preview or edit this step.', 'magic-checklists'),
                'stepSaved' => __('Step saved!', 'magic-checklists'),
                'stepNotSaved' => __('Step not saved. Please fill in required fields.', 'magic-checklists'),
                'errorSavingStep' => __('Error saving step.', 'magic-checklists'),
                'previewNotAvailable' => __('Preview not available. Step has no element or is on a different page.', 'magic-checklists'),
                'stepDeleted' => __('Step deleted.', 'magic-checklists'),
                'tourPreview' => __('Tour Preview', 'magic-checklists'),
                'tourSettings' => __('Tour Settings', 'magic-checklists'),
                'exitMessage' => __('Are you sure you want to exit the tour creator? Any unsaved changes will be lost.', 'magic-checklists'),
                'confirmExit' => __('Confirm Exit', 'magic-checklists'),
                'titleRequired' => __('Tour title is required to save.', 'magic-checklists'),
            )
        ));

        // If in tour creation mode, also enqueue TinyMCE
        if ($is_tour_mode) {
            wp_enqueue_editor();
            wp_enqueue_media();
        }
    }

    public function render_tour_ui() {
        $is_tour_mode = isset($_GET['mcl_tour_mode']) && $_GET['mcl_tour_mode'] == '1';
        $continue_tour_id = isset($_GET['mcl_continue_tour']) ? intval($_GET['mcl_continue_tour']) : 0;
        
        // Check if tours are active on this page
        $has_tours = $is_tour_mode || $continue_tour_id || MCL_Tour_CPT::has_tours_for_current_page();
        
        if ($is_tour_mode) {
            // Only render creator UI in top-level window to prevent duplicates
            // Use both server-side detection and client-side failsafe
            $is_likely_iframe = $this->is_likely_iframe();
            
            if (!$is_likely_iframe) {
                include MAGIC_CHECKLISTS_PLUGIN_PATH . 'public/views/mcl-tour-creator.php';
            } else {
                // Add a small script to check if we're actually in top window
                // and render UI if the parent didn't already do it
                ?>
                <script>
                (function() {
                    // Only inject creator UI if we're in the top window and it hasn't been injected yet
                    if (window.self === window.top && !document.getElementById('mcl-tour-creator')) {
                        // Create a flag to prevent multiple injections
                        if (!window.mclTourCreatorLoaded) {
                            window.mclTourCreatorLoaded = true;
                            
                            // Load the creator UI via AJAX as fallback
                            fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                                body: new URLSearchParams({
                                    action: 'mcl_get_tour_creator_ui',
                                    nonce: '<?php echo wp_create_nonce('mcl_tour_admin'); ?>'
                                })
                            })
                            .then(response => response.text())
                            .then(html => {
                                if (html && !document.getElementById('mcl-tour-creator')) {
                                    document.body.insertAdjacentHTML('beforeend', html);
                                }
                            })
                            .catch(error => {
                                console.warn('MCL Tour: Could not load creator UI via AJAX:', error);
                            });
                        }
                    }
                })();
                </script>
                <?php
            }
        } elseif ($has_tours) {
            // Note: Confirmation modal is now handled by the global modal component
            // The global modal assets are loaded on all admin pages and tour pages will use MCLModal.show()
        }
    }

    /**
     * Legacy confirmation modal function - now using global modal component
     * @deprecated Use MCLModal.show() instead
     */
    private function render_confirmation_modal() {
        // This function is now deprecated in favor of the global modal component
        // Tour scripts should use MCLModal.show() for confirmations instead
        return;
    }

    public function mark_tour_complete() {
        // Try both nonces since tours can be completed in both admin and public contexts
        $nonce_valid = false;
        
        if (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_tour_public')) {
            $nonce_valid = true;
        } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_tour_admin')) {
            $nonce_valid = true;
        }
        
        if (!$nonce_valid) {
            wp_send_json_error('Invalid nonce');
        }
        
        $tour_id = intval($_POST['tour_id']);
        $is_first_login = isset($_POST['is_first_login']) && $_POST['is_first_login'];
        
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            $completed_tours = get_user_meta($user_id, '_mcl_completed_tours', true) ?: array();
            
            if (!in_array($tour_id, $completed_tours)) {
                $completed_tours[] = $tour_id;
                update_user_meta($user_id, '_mcl_completed_tours', $completed_tours);
            }
            
            // Mark first login tours as shown if this was a first login tour
            if ($is_first_login) {
                MCL_Tour_CPT::mark_first_login_tours_shown();
            }
        } else {
            // Use session/cookie for non-logged-in users
            if (!isset($_COOKIE['mcl_completed_tours'])) {
                $completed_tours = array();
            } else {
                $completed_tours = json_decode(stripslashes($_COOKIE['mcl_completed_tours']), true) ?: array();
            }
            
            if (!in_array($tour_id, $completed_tours)) {
                $completed_tours[] = $tour_id;
                setcookie('mcl_completed_tours', json_encode($completed_tours), time() + (30 * DAY_IN_SECONDS), COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
            }
        }
        
        wp_send_json_success();
    }

    public function get_tour_creator_ui() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_tour_admin')) {
            wp_die('Invalid nonce');
        }

        // Check if tour creation mode is requested via POST or GET
        $is_tour_mode = (isset($_POST['mcl_tour_mode']) && $_POST['mcl_tour_mode'] == '1') ||
                       (isset($_GET['mcl_tour_mode']) && $_GET['mcl_tour_mode'] == '1');
                       
        if (!$is_tour_mode) {
            wp_die('Not in tour creation mode');
        }

        // Set GET parameters for the included file to use
        if (isset($_POST['mcl_tour_mode'])) {
            $_GET['mcl_tour_mode'] = $_POST['mcl_tour_mode'];
        }
        if (isset($_POST['tour_id']) && !empty($_POST['tour_id'])) {
            $_GET['tour_id'] = $_POST['tour_id'];
        }

        // Capture the output of the creator UI
        ob_start();
        include MAGIC_CHECKLISTS_PLUGIN_PATH . 'public/views/mcl-tour-creator.php';
        $ui_html = ob_get_clean();

        // Return the HTML directly (not JSON) since we'll inject it into the DOM
        echo $ui_html;
        wp_die();
    }
}
