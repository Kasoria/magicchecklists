<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MAGICCL_CPT {
    // Store color options as class constant
    const TAG_COLORS = [
        'blue' => '#3498db',
        'green' => '#2ecc71',
        'red' => '#e74c3c',
        'orange' => '#f39c12',
        'purple' => '#9b59b6',
        'turquoise' => '#1abc9c',
        'yellow' => '#f1c40f',
        'gray' => '#95a5a6'
    ];

    public function __construct() {
        // CPT registration
        add_action('init', [$this, 'register_checklist_cpt']);
        
        // Taxonomy registration
        add_action('init', [$this, 'register_tag_taxonomy']);
        
        // Tag color management
        add_action('magiccl_tag_add_form_fields', [$this, 'add_color_field']);
        add_action('magiccl_tag_edit_form_fields', [$this, 'edit_color_field']);
        add_action('created_magiccl_tag', [$this, 'save_color_meta']);
        add_action('edited_magiccl_tag', [$this, 'save_color_meta']);
        
        // Tag admin columns
        add_filter('manage_edit-magiccl_tag_columns', [$this, 'add_color_column']);
        add_filter('manage_magiccl_tag_custom_column', [$this, 'render_color_column'], 10, 3);
        
        // Color picker scripts
        add_action('admin_enqueue_scripts', [$this, 'enqueue_color_picker']);
    }

    public function register_checklist_cpt() {
        $labels = array(
            'name'               => _x('MagicChecklists', 'post type general name', 'magicchecklists'),
            'singular_name'      => _x('MagicChecklist', 'post type singular name', 'magicchecklists'),
            'menu_name'          => _x('MagicChecklists', 'admin menu', 'magicchecklists'),
            'name_admin_bar'     => _x('MagicChecklist', 'add new on admin bar', 'magicchecklists'),
            'add_new'            => _x('Add New', 'checklist', 'magicchecklists'),
            'add_new_item'       => __('Add New Checklist', 'magicchecklists'),
            'new_item'           => __('New Checklist', 'magicchecklists'),
            'edit_item'          => __('Edit Checklist', 'magicchecklists'),
            'view_item'          => __('View Checklist', 'magicchecklists'),
            'all_items'          => __('All Checklists', 'magicchecklists'),
            'search_items'       => __('Search Checklists', 'magicchecklists'),
            'parent_item_colon'  => __('Parent Checklists:', 'magicchecklists'),
            'not_found'          => __('No checklists found.', 'magicchecklists'),
            'not_found_in_trash' => __('No checklists found in Trash.', 'magicchecklists'),
        );

        $args = array(
            'labels'             => $labels,
            'public'             => false,
            'show_ui'            => false,
            'show_in_menu'       => false,
            'capability_type'    => 'post',
            'hierarchical'       => false,
            'supports'           => array('title', 'editor'),
            'has_archive'        => false,
            'exclude_from_search'=> true,
            'publicly_queryable' => false,
            'show_in_nav_menus'  => false,
        );

        register_post_type('magiccl_checklist', $args);
    }

    public function register_tag_taxonomy() {
        $labels = [
            'name' => __('Checklist Tags', 'magicchecklists'),
            'singular_name' => __('Tag', 'magicchecklists'),
            'search_items' => __('Search Tags', 'magicchecklists'),
            'all_items' => __('All Tags', 'magicchecklists'),
            'edit_item' => __('Edit Tag', 'magicchecklists'),
            'update_item' => __('Update Tag', 'magicchecklists'),
            'add_new_item' => __('Add New Tag', 'magicchecklists'),
            'new_item_name' => __('New Tag Name', 'magicchecklists'),
            'menu_name' => __('Tags', 'magicchecklists'),
        ];

        $args = [
            'labels' => $labels,
            'hierarchical' => false,
            'public' => false,
            'show_ui' => true,
            'show_admin_column' => true,
            'show_in_menu' => 'magiccl_checklists',
            'show_in_rest' => true,
            'rewrite' => false,
        ];

        register_taxonomy('magiccl_tag', 'magiccl_checklist', $args);
    }

    public function enqueue_color_picker($hook) {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Checking taxonomy query parameter for conditional asset loading.
        if (!in_array($hook, ['edit-tags.php', 'term.php']) ||
            !isset($_GET['taxonomy']) || // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Checking taxonomy query parameter for conditional asset loading.
            sanitize_text_field(wp_unslash($_GET['taxonomy'])) !== 'magiccl_tag') { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Checking taxonomy query parameter for conditional asset loading.
            return;
        }

        wp_enqueue_style('wp-color-picker');
        wp_enqueue_script('wp-color-picker');
        
        wp_add_inline_script('wp-color-picker', '
            jQuery(document).ready(function($){
                $(".magiccl-color-picker").wpColorPicker();
            });
        ');
    }

    public function add_color_field() {
        ?>
        <div class="form-field">
            <label for="tag_color"><?php esc_html_e('Tag Color', 'magicchecklists'); ?></label>
            <select name="tag_color" id="tag_color" class="magiccl-color-select">
                <?php foreach (self::TAG_COLORS as $name => $color): ?>
                    <option value="<?php echo esc_attr($color); ?>" style="background-color: <?php echo esc_attr($color); ?>">
                        <?php echo esc_html(ucfirst($name)); ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <p class="description">
                <?php esc_html_e('Select a color for this tag.', 'magicchecklists'); ?>
            </p>
        </div>
        <?php
    }

    public function edit_color_field($term) {
        $color = get_term_meta($term->term_id, 'tag_color', true);
        $color = $color ?: '#3498db'; // Default to blue if no color is set
        ?>
        <tr class="form-field">
            <th scope="row">
                <label for="tag_color"><?php esc_html_e('Tag Color', 'magicchecklists'); ?></label>
            </th>
            <td>
                <select name="tag_color" id="tag_color" class="magiccl-color-select">
                    <?php foreach (self::TAG_COLORS as $name => $value): ?>
                        <option value="<?php echo esc_attr($value); ?>"
                                <?php selected($color, $value); ?>
                                style="background-color: <?php echo esc_attr($value); ?>">
                            <?php echo esc_html(ucfirst($name)); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <p class="description">
                    <?php esc_html_e('Select a color for this tag.', 'magicchecklists'); ?>
                </p>
            </td>
        </tr>
        <?php
    }

    public function save_color_meta($term_id) {
        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified by WordPress core taxonomy term save handler.
        if (isset($_POST['tag_color'])) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified by WordPress core taxonomy term save handler.
            $color = sanitize_hex_color(wp_unslash($_POST['tag_color'])); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified by WordPress core taxonomy term save handler.
            update_term_meta($term_id, 'tag_color', $color);
        }
    }

    public function add_color_column($columns) {
        $new_columns = array();
        foreach ($columns as $key => $value) {
            $new_columns[$key] = $value;
            if ($key === 'name') {
                $new_columns['color'] = __('Color', 'magicchecklists');
            }
        }
        return $new_columns;
    }

    public function render_color_column($content, $column_name, $term_id) {
        if ($column_name !== 'color') {
            return $content;
        }

        $color = get_term_meta($term_id, 'tag_color', true);
        if (!$color) {
            return __('No color set', 'magicchecklists');
        }

        return sprintf(
            '<span class="magiccl-tag-color-preview" style="display:inline-block;width:20px;height:20px;background-color:%s;border-radius:4px;"></span>',
            esc_attr($color)
        );
    }

    // Helper method to get all tags with their colors
    public static function get_all_tags() {
        $tags = get_terms([
            'taxonomy' => 'magiccl_tag',
            'hide_empty' => false,
        ]);

        if (is_wp_error($tags)) {
            return [];
        }

        $tags_with_colors = array_map(function($tag) {
            $color = get_term_meta($tag->term_id, 'tag_color', true);
            $tag->color = $color ?: '#3498db'; // Default to blue if no color is set
            return $tag;
        }, $tags);

        return $tags_with_colors;
    }
}