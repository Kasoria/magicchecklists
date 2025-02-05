<?php

if ( ! defined( 'ABSPATH' ) ) {
  exit;
}

class MCL_Priority_Utils {
    public static function get_priority_levels() {
        return array(
            'none'     => __( 'None', 'magic-checklists' ),
            'low'      => __( 'Low', 'magic-checklists' ),
            'medium'   => __( 'Medium', 'magic-checklists' ),
            'high'     => __( 'High', 'magic-checklists' ),
            'critical' => __( 'Critical', 'magic-checklists' )
        );
    }

    public static function get_priority_colors() {
        return array(
            'none'     => '#808080',
            'low'      => '#4CAF50',
            'medium'   => '#ffe607',
            'high'     => '#ff9c07',
            'critical' => '#F44336'
        );
    }

    public static function get_priority_numbers() {
        return array(
            'none'     => '0',
            'low'      => '1',
            'medium'   => '2',
            'high'     => '3',
            'critical' => '4'
        );
    }
}