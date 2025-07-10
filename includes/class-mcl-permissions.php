<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class MCL_Permissions {

    private static $validated_tokens = [];

    public function __construct() {
        // Constructor can be used for dependencies if needed in the future
    }

    /**
     * Check if the current user is an administrator.
     * @return bool
     */
    public function is_administrator() {
        if (!is_user_logged_in()) {
            return false;
        }
        $user = wp_get_current_user();
        return in_array('administrator', (array) $user->roles);
    }

    /**
     * Retrieves invite token data from various sources (URL, AJAX, cookie).
     * Calls validate_invite_token internally.
     * @return object|null Token data object if a valid token is found, null otherwise.
     */
    public function get_invite_token_data() {
        // First check if we have a token in the URL
        if (isset($_GET['mcl_invite'])) {
            $token = sanitize_text_field($_GET['mcl_invite']);
            // Use the internal validation logic which also handles caching and usage increment
            return $this->validate_invite_token($token);
        }

        // Check for stored token in AJAX request
        if (wp_doing_ajax()) {
            $stored_token = isset($_POST['stored_token']) ? sanitize_text_field($_POST['stored_token']) : '';
            if ($stored_token) {
                return $this->validate_invite_token($stored_token);
            }
        }

        // Check for invite token in cookie
        if (isset($_COOKIE['mcl_invite_token'])) {
            $token = sanitize_text_field($_COOKIE['mcl_invite_token']);
            return $this->validate_invite_token($token);
        }

        return null;
    }
    
    /**
     * Validates a specific token string.
     * Public wrapper for the private validate_invite_token.
     * @param string $token The token string to validate.
     * @param bool $increment_usage Whether to increment usage count.
     * @return object|false Token data object if valid, false otherwise.
     */
    public function validate_token_string($token, $increment_usage = true) {
        return $this->validate_invite_token($token, $increment_usage);
    }

    private function validate_invite_token($token, $increment_usage = true) {
        // Return cached validation result if available for this request
        if (isset(self::$validated_tokens[$token])) {
            return self::$validated_tokens[$token];
        }

        if (empty($token)) {
            error_log('MCL: Empty token provided for validation.');
            return false;
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'mcl_invite_links';
        $current_time = current_time('mysql', true);

        $query = $wpdb->prepare(
            "SELECT * FROM {$table_name}
            WHERE token = %s
            AND expiry_date > %s
            AND (usage_limit = 0 OR usage_count < usage_limit)",
            $token,
            $current_time
        );

        $link = $wpdb->get_row($query);

        if (!$link) {
            // error_log('MCL: Invalid or expired token: ' . $token); // Be cautious about logging tokens
            return false;
        }

        // Increment usage if specified, not already cached for this request, and user hasn't used it based on cookie
        if ($increment_usage &&
            !$this->has_user_used_token($token)) { // Check cookie before incrementing DB

            $wpdb->update(
                $table_name,
                array('usage_count' => $link->usage_count + 1),
                array('id' => $link->id),
                array('%d'),
                array('%d')
            );
            $link->usage_count++; // Reflect change in the returned object

            // Mark token as used for this user in their cookie
            $this->mark_token_as_used($token);
        }

        // Cache the validation result for this request
        self::$validated_tokens[$token] = $link;
        return $link;
    }

    private function has_user_used_token($token) {
        if (isset($_COOKIE['mcl_used_tokens'])) {
            $used_tokens = json_decode(stripslashes($_COOKIE['mcl_used_tokens']), true);
            if (is_array($used_tokens) && in_array($token, $used_tokens)) {
                return true;
            }
        }
        return false;
    }

    private function mark_token_as_used($token) {
        $used_tokens = array();
        if (isset($_COOKIE['mcl_used_tokens'])) {
            $used_tokens = json_decode(stripslashes($_COOKIE['mcl_used_tokens']), true);
        }
        if (!is_array($used_tokens)) {
            $used_tokens = array();
        }

        if (!in_array($token, $used_tokens)) {
            $used_tokens[] = $token;
            setcookie(
                'mcl_used_tokens',
                json_encode($used_tokens),
                time() + (365 * DAY_IN_SECONDS), // WordPress constant
                COOKIEPATH,                       // WordPress constant
                COOKIE_DOMAIN,                    // WordPress constant
                is_ssl(),
                true
            );
        }
    }

    /**
     * Centralized permission check method.
     * @param int $checklist_id The ID of the checklist.
     * @param string $required_permission The permission level required ('view', 'interact', 'edit').
     * @return bool True if permission is granted, false otherwise.
     */
    public function has_permission($checklist_id, $required_permission = 'view') {
        
        // Check 1: Administrator access
        if ($this->is_administrator()) {
            return true;
        }

        // Check 2: Invite token access
        $token_data = $this->get_invite_token_data();
        if ($token_data && isset($token_data->checklist_id) && $token_data->checklist_id == $checklist_id) {
            if ($this->token_grants_permission($token_data, $required_permission)) {
                return true;
            }
        } else {
            if ($token_data) {
            } else {
            }
        }

        // Check 3: Public access
        $public_access = get_post_meta($checklist_id, '_mcl_public_access', true);
        
        if ($public_access == '1') {
            $public_permission_setting = get_post_meta($checklist_id, '_mcl_public_permission', true) ?: 'interact';
            
            if ($this->permission_sufficient($public_permission_setting, $required_permission)) {
                return true;
            }
        } else {
        }

        // Check 4: User-specific access (only for logged in users)
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            $user = wp_get_current_user();
            $user_roles = $user->roles;
            
            // Check role-based access
            if ($this->has_role_access($checklist_id, $required_permission)) {
                return true;
            }
            
            // Check user-specific access
            if ($this->has_user_access($checklist_id, $required_permission)) {
                return true;
            }
        }
        
        return false;
    }

    private function token_grants_permission($token_data, $required_permission) {
        $permissions_hierarchy = ['view' => 0, 'interact' => 1, 'edit' => 2];
        $token_permission_level = isset($token_data->permissions) ? ($permissions_hierarchy[$token_data->permissions] ?? -1) : -1;
        $required_permission_level = $permissions_hierarchy[$required_permission] ?? -1;
        return $token_permission_level >= $required_permission_level;
    }

    private function permission_sufficient($current_permission, $required_permission) {
        $permissions_hierarchy = ['view' => 0, 'interact' => 1, 'edit' => 2];
        $current_permission_level = $permissions_hierarchy[$current_permission] ?? -1;
        $required_permission_level = $permissions_hierarchy[$required_permission] ?? -1;
        return $current_permission_level >= $required_permission_level;
    }

    private function has_role_access($checklist_id, $required_permission = 'view') {
        if (!is_user_logged_in()) {
            return false;
        }

        $user = wp_get_current_user();
        $allowed_roles = get_post_meta($checklist_id, '_mcl_access_roles', true) ?: array();
        $roles_permission_setting = get_post_meta($checklist_id, '_mcl_access_roles_permission', true) ?: 'interact';

        $user_roles = (array) $user->roles;
        $has_allowed_role = !empty(array_intersect($allowed_roles, $user_roles));

        if (!$has_allowed_role) {
            return false;
        }

        $permission_check = $this->permission_sufficient($roles_permission_setting, $required_permission);
        return $permission_check;
    }

    private function has_user_access($checklist_id, $required_permission = 'view') {
        if (!is_user_logged_in()) {
            return false;
        }

        $user_id = get_current_user_id();
        $allowed_users = get_post_meta($checklist_id, '_mcl_access_users', true) ?: array();
        $users_permission_setting = get_post_meta($checklist_id, '_mcl_access_users_permission', true) ?: 'interact';

        $user_is_allowed = in_array($user_id, $allowed_users);

        if (!$user_is_allowed) {
            return false;
        }

        $permission_check = $this->permission_sufficient($users_permission_setting, $required_permission);
        return $permission_check;
    }

    /**
     * Gets the public permission level for a checklist.
     * @param int $checklist_id The ID of the checklist.
     * @return string|false The permission level string or false if not publicly accessible.
     */
    public function get_public_permission_level($checklist_id) {
        $public_access = get_post_meta($checklist_id, '_mcl_public_access', true);
        if ($public_access != '1') { // Ensure strict check for '1'
            return false;
        }
        return get_post_meta($checklist_id, '_mcl_public_permission', true) ?: 'interact';
    }

    /**
     * Checks if the user has an active invite token from any source.
     * @return bool True if an active token is found, false otherwise.
     */
    public function has_active_invite_token() {
        // get_invite_token_data will return null if no valid token is found from any source.
        return $this->get_invite_token_data() !== null;
    }
}
