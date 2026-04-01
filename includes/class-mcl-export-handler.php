<?php
if (!defined('ABSPATH')) {
    exit;
}

class MAGICCL_Export_Handler {
  private static $instance = null;

  public static function get_instance() {
      if (null === self::$instance) {
          self::$instance = new self();
      }
      return self::$instance;
  }

  private function __construct() {  
    add_action('admin_post_export_checklist_txt', array($this, 'handle_txt_export'), 10);
    add_action('admin_post_export_checklist_pdf', array($this, 'handle_pdf_export'), 10);
    add_action('admin_post_export_checklist_json', array($this, 'handle_json_export'), 10);
    add_action('wp_ajax_magiccl_save_pdf_settings', array($this, 'save_pdf_settings'));
  }

    /**
     * Handle TXT export
     */
    public function handle_txt_export() {
      // Verify nonce first
      if (!isset($_POST['magiccl_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['magiccl_nonce'])), 'magiccl_export_txt')) {
          wp_die(esc_html__('Security check failed', 'magicchecklists'));
      }

      // Check permissions
      if (!current_user_can('manage_options')) {
          wp_die(esc_html__('You do not have permission to perform this action', 'magicchecklists'));
      }

      // Get and validate checklist ID
      $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
      if (!$checklist_id) {
          wp_die(esc_html__('No checklist selected', 'magicchecklists'));
      }

      // Get checklist data
      $checklist = get_post($checklist_id);
      if (!$checklist || $checklist->post_type !== 'magiccl_checklist') {
          wp_die(esc_html__('Invalid checklist', 'magicchecklists'));
      }

      $items = get_post_meta($checklist_id, '_magiccl_items', true);

      // Build content
      $content = $checklist->post_title . "\n\n";
      if (!empty($checklist->post_content)) {
          $content .= $checklist->post_content . "\n\n";
      }
      
      if (!empty($items)) {
          foreach ($items as $item) {
              $content .= "- " . wp_strip_all_tags($item['content']) . "\n";
          }
      }

      // Clean output buffer
      if (ob_get_level()) {
          ob_end_clean();
      }

      // Send headers
      nocache_headers();
      header('Content-Type: text/plain; charset=utf-8');
      header('Content-Disposition: attachment; filename="' . sanitize_file_name($checklist->post_title . '.txt') . '"');
      header('Pragma: public');
      
      // Output content - plain text file download, no HTML context
      // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Plain text file download, not HTML context.
      echo $content;
      exit;
  }

  public function handle_json_export() {
      if (!isset($_POST['magiccl_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['magiccl_nonce'])), 'magiccl_export_json')) {
          wp_die(esc_html__('Security check failed', 'magicchecklists'));
      }

      if (!current_user_can('manage_options')) {
          wp_die(esc_html__('You do not have permission to perform this action', 'magicchecklists'));
      }

      $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
      if (!$checklist_id) {
          wp_die(esc_html__('No checklist selected', 'magicchecklists'));
      }

      // Get all checklist data
      $export_data = $this->get_complete_checklist_data($checklist_id);

      // Clean output buffer
      if (ob_get_level()) {
          ob_end_clean();
      }

      // Send headers
      nocache_headers();
      header('Content-Type: application/json; charset=utf-8');
      header('Content-Disposition: attachment; filename="' . sanitize_file_name($export_data['title'] . '.json') . '"');
      header('Pragma: public');

      // Output JSON
      // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_json_encode returns safe JSON for file download.
      echo wp_json_encode($export_data, JSON_PRETTY_PRINT);
      exit;
  }

  public function handle_pdf_export() {
    
    if (!isset($_POST['magiccl_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['magiccl_nonce'])), 'magiccl_export_pdf')) {
        wp_die(esc_html__('Security check failed', 'magicchecklists'));
    }

    $export_id = isset($_POST['export_id']) ? sanitize_text_field($_POST['export_id']) : '';

    if (!$export_id) {
        wp_die(esc_html__('Export ID missing', 'magicchecklists'));
    }

    // Try to get the transient
    $settings = get_transient($export_id);

    if (!$settings) {
        // Test if transients are working at all
        $test_transient = 'magiccl_test_' . time();
        set_transient($test_transient, 'test', 60);
        $test_result = get_transient($test_transient);
        
        wp_die(esc_html__('Export settings have expired or are invalid. Please try again.', 'magicchecklists'));
    }

    // Continue with export...
    $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
    $checklist = get_post($checklist_id);
    $items = get_post_meta($checklist_id, '_magiccl_items', true);
    
    if (ob_get_level()) {
        ob_end_clean();
    }

    // Send headers for PDF
    nocache_headers();
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: inline; filename="' . sanitize_file_name($checklist->post_title . '.html') . '"');
    
    // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- generate_pdf_html escapes all dynamic content internally.
    echo $this->generate_pdf_html($checklist, $items, $settings);
    
    exit;
  }

    /**
     * Generate HTML for PDF export
     */
    private function generate_pdf_html($checklist, $items, $settings) {
      error_log('Generating PDF HTML with settings: ' . print_r($settings, true));
      // Get PDF settings
      $logo_url = $settings['logo_url'] ?? '';
      $header_text = $settings['header_text'] ?? '';
      $contact_info = $settings['contact_info'] ?? '';
      $footer_text = $settings['footer_text'] ?? '';

      ob_start();
      ?>
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title><?php echo esc_html($checklist->post_title); ?></title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="format-detection" content="telephone=no">
          <style>
              @media print {
                  @page {
                    margin: 1.5cm;
                    size: A4;
                  }
                  @page :first {
                      margin-top: 0;
                  }
                  html {
                      margin: 0;
                  }
                  body {
                      margin: 0;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                  }
              }
              body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
                  line-height: 1.6;
                  color: black;
                  padding: 20px;
                  max-width: 800px;
                  margin: 0 auto;
              }
              .magiccl-button {
                border: 0;
                border-radius: 10px;
                font-size: 20px;
                background: green;
                color: white;
                cursor: pointer;
                padding: 10px;
              }
              .header {
                  text-align: center;
                  border-bottom: 2px solid #bcbcbc;
                  margin-bottom: 15px;
              }
              .header-upper-wrapper {
                display: grid;
                grid-template-columns: 1fr 1fr;
                align-items: center;
                gap: 50px;
              }
              .logo {
                  max-width: 300px;
                  margin-bottom: 20px;
              }
              .header-text {
                  font-size: 14px;
                  margin: 10px 0;
                  text-align: left;
              }
              .title {
                  font-size: 24px;
                  margin: 0 0 10px 0;
              }
              .description {
                  margin: 10px 0;
              }
              .item {
                  margin: 15px 0;
                  padding-left: 25px;
                  position: relative;
                  page-break-inside: avoid;
              }
              .item:before {
                  content: "□";
                  position: absolute;
                  left: 0;
                  color: #1e1e1e;
              }
              .footer {
                  margin-top: auto;
                  text-align: center;
                  border-top: 2px solid #bcbcbc;
                  font-size: 12px;
                  color: #1e1e1e;
              }
              
              @media screen {
                  body {
                      background: #f5f5f5;
                  }
                  .container {
                      background: white;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                      border-radius: 8px;
                  }
              }

              @media print {
                .print-controls {
                    display: none !important;
                }
              }

            
              @media screen {
                .print-controls {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    background: white;
                    padding: 10px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
              }
          </style>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                    window.print();
                    
                    window.onafterprint = function() {
                        window.close();
                    };
                    
                }, 1000);
            });
        </script>
      </head>
      <body>
          <div class="container">
              <div class="header">
                <div class="header-upper-wrapper">
                  <?php if ($logo_url): ?>
                      <img src="<?php echo esc_url($logo_url); ?>" alt="Logo" class="logo">
                  <?php endif; ?>
  
                  <?php if ($header_text): ?>
                      <div class="header-text"><?php echo wp_kses_post(nl2br($header_text)); ?></div>
                  <?php endif; ?>
                </div>
              </div>
  
              <div class="items">
                  <h1 class="title"><?php echo esc_html($checklist->post_title); ?></h1>
                  <?php if (!empty($checklist->post_content)): ?>
                      <div class="description"><?php echo wp_kses_post($checklist->post_content); ?></div>
                  <?php endif; ?>
                  <?php if (!empty($items)): ?>
                      <?php foreach ($items as $item): ?>
                          <div class="item"><?php echo wp_kses_post($item['content']); ?></div>
                      <?php endforeach; ?>
                  <?php endif; ?>
              </div>
  
              <div class="footer">
                  <?php if ($contact_info): ?>
                      <div class="contact-info"><?php echo wp_kses_post(nl2br($contact_info)); ?></div>
                  <?php endif; ?>
  
                  <?php if ($footer_text): ?>
                      <div class="footer-text"><?php echo wp_kses_post(nl2br($footer_text)); ?></div>
                  <?php endif; ?>
  
                  <div class="generation-info">
                      <?php printf(
                          esc_html__('Generated by %s', 'magicchecklists'),
                          'MagicChecklists'
                      ); ?>
                  </div>
              </div>
          </div>
          <div class="print-controls">
            <button onclick="window.print()" class="magiccl-button">
                <?php esc_html_e('Print Now', 'magicchecklists'); ?>
            </button>
        </div>
      </body>
      </html>
      <?php
      return ob_get_clean();
  }

    /**
     * Get complete checklist data for export
     */
    private function get_complete_checklist_data($checklist_id) {
        $checklist = get_post($checklist_id);
        $meta_keys = array(
            '_magiccl_items',
            '_magiccl_time_date',
            '_magiccl_keyboard_shortcut',
            '_magiccl_active',
            '_magiccl_checked_state_handling',
            '_magiccl_theme',
            '_magiccl_priority',
            '_magiccl_enable_item_priority',
            '_magiccl_priority_display_type',
            '_magiccl_trigger_shortcut',
            '_magiccl_trigger_button',
            '_magiccl_short_title',
            '_magiccl_button_position',
            '_magiccl_tags',
            '_magiccl_enable_shortcode',
            '_magiccl_shortcode_settings'
        );

        $export_data = array(
            'title' => $checklist->post_title,
            'description' => $checklist->post_content,
            'meta' => array()
        );

        foreach ($meta_keys as $key) {
            $value = get_post_meta($checklist_id, $key, true);
            if ($value !== '') {
                $export_data['meta'][$key] = $value;
            }
        }

        return $export_data;
    }

    public function save_pdf_settings() {
      error_log('==== PDF Settings Save Start ====');
      
      if (!check_ajax_referer('magiccl_save_pdf_settings', '_ajax_nonce', false)) {
          error_log('Nonce verification failed');
          wp_send_json_error('Nonce verification failed');
          return;
      }
      
      if (!current_user_can('manage_options')) {
          error_log('Permission denied');
          wp_send_json_error('Permission denied');
          return;
      }
  
      // Generate export ID
      $export_id = 'magiccl_pdf_export_' . wp_generate_password(12, false);
      error_log('Generated export ID: ' . $export_id);
  
      // Sanitize and prepare settings
      $settings = array(
          'logo_url' => esc_url_raw($_POST['pdf_logo_url'] ?? ''),
          'header_text' => wp_kses_post(wp_unslash($_POST['pdf_header_text'] ?? '')),
          'contact_info' => wp_kses_post(wp_unslash($_POST['pdf_contact_info'] ?? '')),
          'footer_text' => wp_kses_post(wp_unslash($_POST['pdf_footer_text'] ?? ''))
      );
  
      error_log('Settings to save: ' . print_r($settings, true));
  
      // Test transient functionality
      $test_set = set_transient('magiccl_test_' . time(), 'test', 300);
      error_log('Test transient set result: ' . ($test_set ? 'success' : 'failed'));
  
      // Store settings in transient
      $transient_set = set_transient($export_id, $settings, 5 * MINUTE_IN_SECONDS);
      error_log('Main transient set result: ' . ($transient_set ? 'success' : 'failed'));
  
      // Verify transient was set by trying to retrieve it
      $verify = get_transient($export_id);
      error_log('Immediate transient verification: ' . ($verify ? 'success' : 'failed'));
  
      if (!$transient_set || !$verify) {
          error_log('Failed to save or verify settings transient');
          wp_send_json_error('Failed to save settings');
          return;
      }
  
      error_log('==== PDF Settings Save Complete ====');
      wp_send_json_success(['export_id' => $export_id]);
  }
}

class MAGICCL_PDF_Generator {
  public function generate($html, $filename) {
      if (!class_exists('PHPPDF')) {
          wp_die(esc_html__('PDF generation library is not available.', 'magicchecklists'));
      }

      // Basic PDF settings
      $pdf = new PHPPDF();
      $pdf->set_paper('A4', 'portrait');
      $pdf->set_margin(15);
      
      // Add content
      $pdf->add_html($html);

      // Output PDF
      header('Content-Type: application/pdf');
      header('Content-Disposition: attachment; filename="' . $filename . '"');
      header('Cache-Control: private, max-age=0, must-revalidate');
      header('Pragma: public');
      
      $pdf->output();
  }
}