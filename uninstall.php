<?php

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Check if we should delete data
$settings = get_option('mcl_settings', array());
$should_delete = isset($settings['delete_data_on_uninstall']) && $settings['delete_data_on_uninstall'];

if ($should_delete) {
    global $wpdb;

    // Delete custom post type posts and meta
    $posts = get_posts(array(
        'post_type' => 'mcl_checklist',
        'numberposts' => -1,
        'post_status' => 'any'
    ));

    foreach ($posts as $post) {
        wp_delete_post($post->ID, true);
    }

    // Delete custom tables
    $tables = array(
        $wpdb->prefix . 'mcl_invite_links',
        $wpdb->prefix . 'mcl_notification_settings',
        $wpdb->prefix . 'mcl_notification_queue'
    );

    foreach ($tables as $table) {
        $wpdb->query("DROP TABLE IF EXISTS {$table}");
    }

    // Delete options
    delete_option('mcl_settings');
    delete_option('mcl_db_version');
    delete_option('mcl_version');
    delete_option('mcl_plugin_data_version');
    delete_option('mcl_tutorial_checklist_created');
}