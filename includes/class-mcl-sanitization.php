<?php

if (!defined('ABSPATH')) {
    exit;
}

class MAGICCL_Sanitization {
    /**
     * List of allowed HTML tags and their attributes
     * @var array
     */
    private static $allowed_html = [
        'a' => [
            'href' => true,
            'target' => ['_blank', '_self'],
            'rel' => true,
            'class' => true,
            'style' => [
                'text-decoration',
                'font-weight',
                'font-style'
            ]
        ],
        'br' => [],
        'em' => [
            'style' => [
                'font-style'
            ]
        ],
        'i' => [
            'style' => [
                'font-style'
            ]
        ],
        'strong' => [
            'style' => [
                'font-weight'
            ]
        ],
        'b' => [
            'style' => [
                'font-weight'
            ]
        ],
        'u' => [
            'style' => [
                'text-decoration'
            ]
        ],
        'span' => [
            'class' => true,
            'style' => [
                'text-decoration',
                'font-weight',
                'font-style'
            ]
        ],
        'code' => [
            'class' => true,
            'style' => [
                'font-family',
                'font-size',
                'color',
                'background-color'
            ]
        ],
        'pre' => [
            'class' => true,
            'style' => [
                'font-family',
                'font-size',
                'color',
                'background-color'
            ]
        ],
        'img' => array(
                'src' => array(),
                'alt' => array(),
                'class' => array(),
                'width' => array(),
                'height' => array(),
                'data-magiccl-image' => array(),
                'style' => array()
            )
    ];

    /**
     * Sanitize item content while preserving allowed HTML
     * @param string $content
     * @return string
     */
    public static function sanitize_item_content($content) {
        if (empty($content)) {
            return '';
        }

        $allowed_html = array(
            'a' => array(
                'href' => array(),
                'target' => array(),
                'rel' => array(),
                'class' => array()
            ),
            'b' => array(),
            'strong' => array(),
            'i' => array(),
            'em' => array(),
            'u' => array(),
            'span' => array(
                'class' => array()
            ),
            'br' => array(),
            'img' => array(
                'src' => array(),
                'alt' => array(),
                'class' => array(),
                'width' => array(),
                'height' => array(),
                'data-magiccl-image' => array(),
                'style' => array()
            )
        );

        // First pass: Basic HTML sanitization
        $content = wp_kses($content, $allowed_html);

        // Second pass: Ensure images are from allowed sources
        if (strpos($content, '<img') !== false) {
            $dom = new DOMDocument();
            libxml_use_internal_errors(true);
            $dom->loadHTML('<?xml encoding="UTF-8">' . $content, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
            libxml_clear_errors();

            $images = $dom->getElementsByTagName('img');
            foreach ($images as $img) {
                $src = $img->getAttribute('src');
                
                // Only allow images from wp-content uploads
                if (!self::is_valid_wp_image($src)) {
                    $img->parentNode->removeChild($img);
                    continue;
                }

                // Add our custom class
                $img->setAttribute('class', 'magiccl-item-image');
                $img->setAttribute('data-magiccl-image', 'true');
            }

            $content = $dom->saveHTML();
        }

        return $content;
    }

    private static function is_valid_wp_image($src) {
        $upload_dir = wp_upload_dir();
        $upload_url = $upload_dir['baseurl'];

        // Check if image URL starts with WordPress uploads directory
        return strpos($src, $upload_url) === 0;
    }

    /**
     * Validate and sanitize a URL
     * @param string $url
     * @return string|false Returns sanitized URL or false if invalid
     */
    public static function sanitize_url($url) {
        // Remove any whitespace
        $url = trim($url);
        
        // Basic URL validation
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }
        
        // Ensure URL uses a safe protocol
        $allowed_protocols = ['http', 'https'];
        $protocol = wp_parse_url($url, PHP_URL_SCHEME);
        
        if (!in_array(strtolower($protocol), $allowed_protocols)) {
            return false;
        }
        
        // Use WordPress URL sanitization
        return esc_url_raw($url);
    }

    /**
     * Sanitize inline styles
     * @param string $content
     * @return string
     */
    private static function sanitize_styles($content) {
        // Only allow specific style properties
        $allowed_styles = [
            'text-decoration',
            'font-weight',
            'font-style'
        ];
        
        // Clean up style attributes
        return preg_replace_callback(
            '/style\s*=\s*(["\'])(.*?)\1/i',
            function($matches) use ($allowed_styles) {
                $styles = explode(';', $matches[2]);
                $clean_styles = [];
                
                foreach ($styles as $style) {
                    $style = trim($style);
                    if (empty($style)) continue;
                    
                    list($property, $value) = array_pad(explode(':', $style, 2), 2, '');
                    $property = trim(strtolower($property));
                    
                    if (in_array($property, $allowed_styles)) {
                        $clean_styles[] = $property . ':' . trim($value);
                    }
                }
                
                return !empty($clean_styles) ? 
                    'style="' . implode('; ', $clean_styles) . '"' : 
                    '';
            },
            $content
        );
    }

    /**
     * Validate link attributes
     * @param array $attributes
     * @return array
     */
    public static function sanitize_link_attributes($attributes) {
        $safe_attributes = [];
        
        // Required attributes for links
        $safe_attributes['rel'] = 'noopener noreferrer';
        $safe_attributes['target'] = '_blank';
        
        // Sanitize href
        if (isset($attributes['href'])) {
            $safe_url = self::sanitize_url($attributes['href']);
            if ($safe_url) {
                $safe_attributes['href'] = $safe_url;
            }
        }
        
        // Allow specific class names
        if (isset($attributes['class'])) {
            $safe_attributes['class'] = sanitize_html_class($attributes['class']);
        }
        
        return $safe_attributes;
    }
}