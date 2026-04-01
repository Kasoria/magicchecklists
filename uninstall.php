<?php

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Check if we should delete data
$settings = get_option('magiccl_settings', array());
$should_delete = isset($settings['delete_data_on_uninstall']) && $settings['delete_data_on_uninstall'];

if ($should_delete) {
    global $wpdb;

    // Delete custom post type posts and meta
    $posts = get_posts(array(
        'post_type' => 'magiccl_checklist',
        'numberposts' => -1,
        'post_status' => 'any'
    ));

    foreach ($posts as $post) {
        wp_delete_post($post->ID, true);
    }

    // Delete custom tables
    $tables = array(
        $wpdb->prefix . 'magiccl_invite_links',
        $wpdb->prefix . 'magiccl_notification_settings',
        $wpdb->prefix . 'magiccl_notification_queue'
    );

    foreach ($tables as $table) {
        $wpdb->query("DROP TABLE IF EXISTS {$table}");
    }

    // Delete options
    delete_option('magiccl_settings');
    delete_option('magiccl_db_version');
    delete_option('magiccl_version');
    delete_option('magiccl_plugin_data_version');
    delete_option('magiccl_tutorial_checklist_created');
}