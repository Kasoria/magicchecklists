<?php

if (!defined('ABSPATH')) {
    exit;
}

class MCL_Sanitization {
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

        // Strip all script tags and their contents first
        $content = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $content);

        // Remove potentially harmful attributes while preserving styling
        $content = preg_replace('/(?<=\s)on\w+="[^"]*"/i', '', $content);
        
        // Remove any javascript: or data: URLs
        $content = preg_replace('/(?<=href=(["\']))(?:javascript|data):/i', 'invalid:', $content);
        
        // Ensure all links have noopener and noreferrer
        $content = preg_replace(
            '/<a\s([^>]*?)>/i',
            '<a $1 rel="noopener noreferrer" target="_blank">',
            $content
        );

        // Clean up specific inline styles for formatting
        $content = self::sanitize_styles($content);
        
        // Final sanitization using WordPress function
        return wp_kses($content, self::$allowed_html);
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
        $protocol = parse_url($url, PHP_URL_SCHEME);
        
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