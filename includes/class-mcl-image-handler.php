<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MAGICCL_Image_Handler {
    private $upload_dir;
    private $upload_url;
    private $allowed_mime_types = array(
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    );

    public function __construct() {
        // Set up upload directory
        $wp_upload_dir = wp_upload_dir();
        $this->upload_dir = $wp_upload_dir['basedir'] . '/magiccl-uploads';
        $this->upload_url = $wp_upload_dir['baseurl'] . '/magiccl-uploads';

        // Create upload directory if it doesn't exist
        if (!file_exists($this->upload_dir)) {
          if (!wp_mkdir_p($this->upload_dir)) {
              error_log('MCL: Failed to create upload directory');
              return;
          }
            
            // Create .htaccess to protect direct access
            $htaccess = $this->upload_dir . '/.htaccess';
            if (!file_exists($htaccess)) {
                // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- Writing security file during plugin init; WP_Filesystem not available yet.
                file_put_contents($htaccess, 'deny from all');
            }

            // Create index.php for extra security
            $index = $this->upload_dir . '/index.php';
            if (!file_exists($index)) {
                // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- Writing security file during plugin init; WP_Filesystem not available yet.
                file_put_contents($index, '<?php // Silence is golden');
            }
        }

        add_action('wp_ajax_magiccl_upload_image', array($this, 'handle_upload'));
        add_action('wp_ajax_nopriv_magiccl_upload_image', array($this, 'handle_upload'));
        add_action('wp_ajax_magiccl_get_uploaded_images', array($this, 'get_uploaded_images'));
        add_action('wp_ajax_nopriv_magiccl_get_uploaded_images', array($this, 'get_uploaded_images'));
        add_action('wp_ajax_magiccl_get_account_images', array($this, 'get_account_images'));
        add_action('wp_ajax_nopriv_magiccl_get_account_images', array($this, 'get_account_images'));

        add_action('init', array($this, 'add_rewrite_rules'));
        add_filter('query_vars', array($this, 'add_query_vars'));
        add_action('template_redirect', array($this, 'serve_image'));
    }

    /**
     * Verify nonce from any accepted image-handler AJAX context.
     */
    private function verify_nonce() {
        $nonce = isset($_POST['nonce']) ? sanitize_text_field(wp_unslash($_POST['nonce'])) : '';
        return (
            wp_verify_nonce($nonce, 'magiccl_ajax_nonce')
            || wp_verify_nonce($nonce, 'magiccl_ajax_nopriv_nonce')
            || wp_verify_nonce($nonce, 'magiccl_admin_nonce')
            || wp_verify_nonce($nonce, 'magiccl_shortcode_nonce')
        );
    }

    public function add_rewrite_rules() {
        add_rewrite_rule(
            'magiccl-image/([^/]+)/?$',
            'index.php?magiccl_image_id=$matches[1]',
            'top'
        );
    }

    public function add_query_vars($vars) {
        $vars[] = 'magiccl_image_id';
        return $vars;
    }

    public function serve_image() {
        $image_id = get_query_var('magiccl_image_id');
        if (!$image_id) return;

        $file_path = $this->upload_dir . '/' . sanitize_file_name($image_id);
        if (!file_exists($file_path)) {
            status_header(404);
            die('404 - Image not found');
        }

        // Get file info
        $mime_type = mime_content_type($file_path);
        $file_size = filesize($file_path);

        // Set headers
        header('Content-Type: ' . $mime_type);
        header('Content-Length: ' . $file_size);
        header('Cache-Control: public, max-age=31536000');

        // Output file
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile -- Streaming binary image data to browser; WP_Filesystem not suitable for direct output.
        readfile($file_path);
        exit;
    }

    public function handle_upload() {
      // First, prevent any output
      ob_clean();

      try {
          if ( ! $this->verify_nonce() ) {
              wp_send_json_error(array('message' => 'Security check failed'));
              return;
          }

          // Check if file was uploaded
          if (empty($_FILES['file'])) {
              wp_send_json_error(array('message' => 'No file uploaded'));
              return;
          }

          // Verify checklist access
          $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
          if (!$checklist_id) {
              wp_send_json_error(array('message' => 'Invalid checklist ID'));
              return;
          }

          // Initialize Public class for permission check
          $public = new MAGICCL_Public();

          // Handle stored token for invite users
          if (isset($_POST['stored_token'])) {
              $public->set_stored_token(sanitize_text_field(wp_unslash($_POST['stored_token'])));
          }

          // Check if user has edit permission
          if (!$public->has_permission($checklist_id, 'edit')) {
              wp_send_json_error(array('message' => 'Permission denied'));
              return;
          }

          // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- File array; name sanitized below, content handled by wp_handle_upload().
          $file = $_FILES['file'];
          $file['name'] = sanitize_file_name($file['name']);
          $file['type'] = sanitize_mime_type($file['type']);

          // Validate file type
          if (!in_array($file['type'], $this->allowed_mime_types, true)) {
              wp_send_json_error(array(
                  'message' => 'Invalid file type',
                  'debug' => array(
                      'received_type' => $file['type'],
                      'allowed_types' => $this->allowed_mime_types
                  )
              ));
              return;
          }

          // Ensure upload directory exists and is writable
          if (!file_exists($this->upload_dir)) {
              if (!wp_mkdir_p($this->upload_dir)) {
                  wp_send_json_error(array('message' => 'Failed to create upload directory'));
                  return;
              }
          }

          if (!wp_is_writable($this->upload_dir)) {
              wp_send_json_error(array('message' => 'Upload directory is not writable'));
              return;
          }

          // Use WordPress upload handler
          $upload_overrides = array(
              'test_form' => false,
              'unique_filename_callback' => array($this, 'generate_unique_filename'),
              'upload_dir' => array(
                  'path' => $this->upload_dir,
                  'url' => $this->upload_url,
                  'subdir' => '',
                  'basedir' => $this->upload_dir,
                  'baseurl' => $this->upload_url,
                  'error' => false,
              ),
          );

          // Temporarily override upload directory
          add_filter('upload_dir', function() {
              return array(
                  'path' => $this->upload_dir,
                  'url' => $this->upload_url,
                  'subdir' => '',
                  'basedir' => $this->upload_dir,
                  'baseurl' => $this->upload_url,
                  'error' => false,
              );
          });

          $movefile = wp_handle_upload($file, array('test_form' => false));

          remove_all_filters('upload_dir');

          if (isset($movefile['error'])) {
              wp_send_json_error(array(
                  'message' => 'Failed to save file: ' . $movefile['error']
              ));
              return;
          }

          $filepath = $movefile['file'];
          $filename = basename($filepath);

          // Get image dimensions
          $dimensions = getimagesize($filepath);
          if ($dimensions === false) {
              wp_delete_file($filepath);
              wp_send_json_error(array('message' => 'Invalid image file'));
              return;
          }

          // Calculate display dimensions (max width: 400px)
          $max_width = 400;
          $ratio = $dimensions[0] / $dimensions[1];
          $width = min($dimensions[0], $max_width);
          $height = round($width / $ratio);

          wp_send_json_success(array(
              'url' => $this->upload_url . '/' . $filename,
              'width' => $width,
              'height' => $height,
              'alt' => pathinfo($file['name'], PATHINFO_FILENAME)
          ));

      } catch (Exception $e) {
          error_log('MCL: Upload error: ' . $e->getMessage());
          error_log('MCL: Stack trace: ' . $e->getTraceAsString());
          wp_send_json_error(array('message' => 'Upload failed: ' . $e->getMessage()));
      }
  }

  private function generate_unique_filename($original_name) {
      $info = pathinfo($original_name);
      $ext = strtolower($info['extension']);
      $filename = sanitize_file_name($info['filename']);
      
      return sprintf(
          '%s-%s-%s.%s',
          $filename,
          uniqid(),
          substr(md5(wp_rand()), 0, 6),
          $ext
      );
  }

    public function cleanup_old_images() {
        // Get all images from meta
        global $wpdb;
        $images = $wpdb->get_col(
            "SELECT meta_value 
            FROM $wpdb->postmeta 
            WHERE meta_key = '_magiccl_images'"
        );

        // Get list of all image filenames still in use
        $active_images = array();
        foreach ($images as $meta_value) {
            $meta_array = maybe_unserialize($meta_value);
            if (is_array($meta_array)) {
                foreach ($meta_array as $image) {
                    $active_images[] = $image['filename'];
                }
            }
        }

        // Scan upload directory
        $files = scandir($this->upload_dir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..' || $file === '.htaccess' || $file === 'index.php') {
                continue;
            }

            // Delete file if not in use
            if (!in_array($file, $active_images)) {
                wp_delete_file($this->upload_dir . '/' . $file);
            }
        }
    }

    public function get_uploaded_images() {
        try {
            if ( ! $this->verify_nonce() ) {
                wp_send_json_error(array('message' => 'Security check failed'));
                return;
            }

            // Verify checklist access
            $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
            if (!$checklist_id) {
                wp_send_json_error(array('message' => 'Invalid checklist ID'));
                return;
            }

            // Initialize Public class for permission check
            $public = new MAGICCL_Public();

            // Handle stored token for invite users
            if (isset($_POST['stored_token'])) {
                $public->set_stored_token(sanitize_text_field(wp_unslash($_POST['stored_token'])));
            }
            
            // Check if user has edit permission
            if (!$public->has_permission($checklist_id, 'edit')) {
                wp_send_json_error(array('message' => 'Permission denied'));
                return;
            }
    
            // Scan upload directory
            $images = array();
            if (file_exists($this->upload_dir)) {
                $files = scandir($this->upload_dir);
                foreach ($files as $file) {
                    if ($file === '.' || $file === '..' || $file === '.htaccess' || $file === 'index.php') {
                        continue;
                    }
    
                    $file_path = $this->upload_dir . '/' . $file;
                    $file_url = $this->upload_url . '/' . $file;
                    
                    // Get image dimensions
                    $dimensions = getimagesize($file_path);
                    if ($dimensions) {
                        $images[] = array(
                            'url' => $file_url,
                            'filename' => $file,
                            'width' => $dimensions[0],
                            'height' => $dimensions[1],
                            'modified' => filemtime($file_path)
                        );
                    }
                }
            }
    
            // Sort by most recent first
            usort($images, function($a, $b) {
                return $b['modified'] - $a['modified'];
            });
    
            wp_send_json_success($images);
    
        } catch (Exception $e) {
            error_log('MCL: Error getting uploaded images: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Failed to get images'));
        }
    }

    private function scanImageContent($file_path) {
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Reading local file for security scanning, not a remote URL.
        $content = file_get_contents($file_path);
        $suspicious_patterns = array(
            '<?php',
            '<?=',
            '<script',
            'eval(',
            'base64_decode('
        );

        foreach ($suspicious_patterns as $pattern) {
            if (stripos($content, $pattern) !== false) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get images from MagicDash account storage
     *
     * Fetches images uploaded to the user's MagicDash account.
     * These images can be used across all connected WordPress sites.
     */
    public function get_account_images() {
        try {
            if ( ! $this->verify_nonce() ) {
                wp_send_json_error(array('message' => 'Security check failed'));
                return;
            }

            // Verify checklist access
            $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
            if (!$checklist_id) {
                wp_send_json_error(array('message' => 'Invalid checklist ID'));
                return;
            }

            // Initialize Public class for permission check
            $public = new MAGICCL_Public();

            // Handle stored token for invite users
            if (isset($_POST['stored_token'])) {
                $public->set_stored_token(sanitize_text_field(wp_unslash($_POST['stored_token'])));
            }

            // Check if user has edit permission
            if (!$public->has_permission($checklist_id, 'edit')) {
                wp_send_json_error(array('message' => 'Permission denied'));
                return;
            }

            // Get MagicProxy to make authenticated request to MagicDash
            $proxy = new MAGICCL_MagicProxy();

            // Check if site is connected to MagicDash
            if (!$proxy->is_connected()) {
                wp_send_json_error(array(
                    'message' => 'Site not connected to MagicDash',
                    'not_connected' => true
                ));
                return;
            }

            // Fetch images from MagicDash API
            $response = $proxy->request('GET', '/api/images?limit=50');

            if (is_wp_error($response)) {
                wp_send_json_error(array('message' => $response->get_error_message()));
                return;
            }

            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);

            if (!$data || !isset($data['success']) || !$data['success']) {
                $error_msg = isset($data['error']) ? $data['error'] : 'Failed to fetch images from MagicDash';
                wp_send_json_error(array('message' => $error_msg));
                return;
            }

            // Transform the data to match expected format
            $images = array();
            if (isset($data['data']) && is_array($data['data'])) {
                foreach ($data['data'] as $image) {
                    $images[] = array(
                        'url' => $image['url'],
                        'filename' => $image['originalFilename'] ?? $image['filename'],
                        'width' => $image['width'] ?? 200,
                        'height' => $image['height'] ?? 200,
                        'alt' => $image['alt'] ?? '',
                        'source' => 'magicdash'
                    );
                }
            }

            wp_send_json_success($images);

        } catch (Exception $e) {
            error_log('MCL: Error getting MagicDash images: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Failed to get images from MagicDash'));
        }
    }
}

// Initialize the handler
$magiccl_image_handler = new MAGICCL_Image_Handler();