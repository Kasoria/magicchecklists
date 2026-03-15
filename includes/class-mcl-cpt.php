<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class MCL_CPT {
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
        add_action('mcl_tag_add_form_fields', [$this, 'add_color_field']);
        add_action('mcl_tag_edit_form_fields', [$this, 'edit_color_field']);
        add_action('created_mcl_tag', [$this, 'save_color_meta']);
        add_action('edited_mcl_tag', [$this, 'save_color_meta']);
        
        // Tag admin columns
        add_filter('manage_edit-mcl_tag_columns', [$this, 'add_color_column']);
        add_filter('manage_mcl_tag_custom_column', [$this, 'render_color_column'], 10, 3);
        
        // Color picker scripts
        add_action('admin_enqueue_scripts', [$this, 'enqueue_color_picker']);
    }

    public function register_checklist_cpt() {
        $labels = array(
            'name'               => _x('MagicChecklists', 'post type general name', 'magic-checklists'),
            'singular_name'      => _x('MagicChecklist', 'post type singular name', 'magic-checklists'),
            'menu_name'          => _x('MagicChecklists', 'admin menu', 'magic-checklists'),
            'name_admin_bar'     => _x('MagicChecklist', 'add new on admin bar', 'magic-checklists'),
            'add_new'            => _x('Add New', 'checklist', 'magic-checklists'),
            'add_new_item'       => __('Add New Checklist', 'magic-checklists'),
            'new_item'           => __('New Checklist', 'magic-checklists'),
            'edit_item'          => __('Edit Checklist', 'magic-checklists'),
            'view_item'          => __('View Checklist', 'magic-checklists'),
            'all_items'          => __('All Checklists', 'magic-checklists'),
            'search_items'       => __('Search Checklists', 'magic-checklists'),
            'parent_item_colon'  => __('Parent Checklists:', 'magic-checklists'),
            'not_found'          => __('No checklists found.', 'magic-checklists'),
            'not_found_in_trash' => __('No checklists found in Trash.', 'magic-checklists'),
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

        register_post_type('mcl_checklist', $args);
    }

    public function register_tag_taxonomy() {
        $labels = [
            'name' => __('Checklist Tags', 'magic-checklists'),
            'singular_name' => __('Tag', 'magic-checklists'),
            'search_items' => __('Search Tags', 'magic-checklists'),
            'all_items' => __('All Tags', 'magic-checklists'),
            'edit_item' => __('Edit Tag', 'magic-checklists'),
            'update_item' => __('Update Tag', 'magic-checklists'),
            'add_new_item' => __('Add New Tag', 'magic-checklists'),
            'new_item_name' => __('New Tag Name', 'magic-checklists'),
            'menu_name' => __('Tags', 'magic-checklists'),
        ];

        $args = [
            'labels' => $labels,
            'hierarchical' => false,
            'public' => false,
            'show_ui' => true,
            'show_admin_column' => true,
            'show_in_menu' => 'mcl_checklists',
            'show_in_rest' => true,
            'rewrite' => false,
        ];

        register_taxonomy('mcl_tag', 'mcl_checklist', $args);
    }

    public function enqueue_color_picker($hook) {
        if (!in_array($hook, ['edit-tags.php', 'term.php']) || 
            !isset($_GET['taxonomy']) || 
            $_GET['taxonomy'] !== 'mcl_tag') {
            return;
        }

        wp_enqueue_style('wp-color-picker');
        wp_enqueue_script('wp-color-picker');
        
        wp_add_inline_script('wp-color-picker', '
            jQuery(document).ready(function($){
                $(".mcl-color-picker").wpColorPicker();
            });
        ');
    }

    public function add_color_field() {
        ?>
        <div class="form-field">
            <label for="tag_color"><?php esc_html_e('Tag Color', 'magic-checklists'); ?></label>
            <select name="tag_color" id="tag_color" class="mcl-color-select">
                <?php foreach (self::TAG_COLORS as $name => $color): ?>
                    <option value="<?php echo esc_attr($color); ?>" style="background-color: <?php echo esc_attr($color); ?>">
                        <?php echo esc_html(ucfirst($name)); ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <p class="description">
                <?php esc_html_e('Select a color for this tag.', 'magic-checklists'); ?>
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
                <label for="tag_color"><?php esc_html_e('Tag Color', 'magic-checklists'); ?></label>
            </th>
            <td>
                <select name="tag_color" id="tag_color" class="mcl-color-select">
                    <?php foreach (self::TAG_COLORS as $name => $value): ?>
                        <option value="<?php echo esc_attr($value); ?>"
                                <?php selected($color, $value); ?>
                                style="background-color: <?php echo esc_attr($value); ?>">
                            <?php echo esc_html(ucfirst($name)); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <p class="description">
                    <?php esc_html_e('Select a color for this tag.', 'magic-checklists'); ?>
                </p>
            </td>
        </tr>
        <?php
    }

    public function save_color_meta($term_id) {
        if (isset($_POST['tag_color'])) {
            $color = sanitize_hex_color($_POST['tag_color']);
            update_term_meta($term_id, 'tag_color', $color);
        }
    }

    public function add_color_column($columns) {
        $new_columns = array();
        foreach ($columns as $key => $value) {
            $new_columns[$key] = $value;
            if ($key === 'name') {
                $new_columns['color'] = __('Color', 'magic-checklists');
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
            return __('No color set', 'magic-checklists');
        }

        return sprintf(
            '<span class="mcl-tag-color-preview" style="display:inline-block;width:20px;height:20px;background-color:%s;border-radius:4px;"></span>',
            esc_attr($color)
        );
    }

    // Helper method to get all tags with their colors
    public static function get_all_tags() {
        $tags = get_terms([
            'taxonomy' => 'mcl_tag',
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