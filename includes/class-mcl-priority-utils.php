<?php

if ( ! defined( 'ABSPATH' ) ) {
  exit;
}

class MAGICCL_Priority_Utils {
    public static function get_priority_levels() {
        return array(
            'none'     => __( 'None', 'magicchecklists' ),
            'low'      => __( 'Low', 'magicchecklists' ),
            'medium'   => __( 'Medium', 'magicchecklists' ),
            'high'     => __( 'High', 'magicchecklists' ),
            'critical' => __( 'Critical', 'magicchecklists' )
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