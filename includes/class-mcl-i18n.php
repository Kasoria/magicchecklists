<?php
/**
 * Internationalization (i18n) class for MagicChecklists
 * 
 * Handles all translatable strings for the plugin, organized by component/section
 * 
 * @package MagicChecklists
 * @since 2.1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class MCL_I18n {
    
    /**
     * Get all translation strings organized by component
     * 
     * @return array
     */
    public static function get_all_translations() {
        return array(
            'common' => self::get_common_translations(),
            'analytics' => self::get_analytics_translations(),
            'accessControl' => self::get_access_control_translations(),
            'analyticsDashboard' => self::get_analytics_dashboard_overview_translations(),
            'checklistDrawer' => self::get_checklist_drawer_translations(),
        );
    }
    
    /**
     * Get common translations used across components
     * 
     * @return array
     */
    public static function get_common_translations() {
        return array(
            'loading' => __('Loading...', 'magic-checklists'),
            'error' => __('An error occurred', 'magic-checklists'),
            'save' => __('Save', 'magic-checklists'),
            'cancel' => __('Cancel', 'magic-checklists'),
            'delete' => __('Delete', 'magic-checklists'),
            'edit' => __('Edit', 'magic-checklists'),
            'yes' => __('Yes', 'magic-checklists'),
            'no' => __('No', 'magic-checklists'),
            'ok' => __('OK', 'magic-checklists'),
            'close' => __('Close', 'magic-checklists'),
        );
    }
    
    /**
     * Get all analytics dashboard translations
     * 
     * @return array
     */
    public static function get_analytics_translations() {
        return array(
            'dashboard' => self::get_analytics_dashboard_translations(),
            'timeFilters' => self::get_time_filter_translations(),
            'chartLabels' => self::get_chart_label_translations(),
            'activityMessages' => self::get_activity_message_translations(),
            'timeAgo' => self::get_time_ago_translations(),
            'clearModal' => self::get_clear_modal_translations(),
        );
    }
    
    /**
     * Get analytics dashboard main translations
     * 
     * @return array
     */
    private static function get_analytics_dashboard_translations() {
        return array(
            'totalViews' => __('Total Views', 'magic-checklists'),
            'totalChecks' => __('Total Checks', 'magic-checklists'),
            'activeChecklists' => __('Active Checklists', 'magic-checklists'),
            'totalChecklists' => __('Total Checklists', 'magic-checklists'),
            'usageTrends' => __('Usage Trends', 'magic-checklists'),
            'itemUsageDistribution' => __('Item Usage Distribution', 'magic-checklists'),
            'topPerformingChecklists' => __('Top Performing Checklists', 'magic-checklists'),
            'allChecklistsAnalytics' => __('All Checklists Analytics', 'magic-checklists'),
            'recentActivity' => __('Recent Activity', 'magic-checklists'),
            'clearAnalyticsData' => __('Clear Analytics Data', 'magic-checklists'),
            'checklist' => __('Checklist', 'magic-checklists'),
            'views' => __('Views', 'magic-checklists'),
            'checks' => __('Checks', 'magic-checklists'),
            'lastViewed' => __('Last Viewed', 'magic-checklists'),
            'mostCheckedItems' => __('Most Checked Items', 'magic-checklists'),
            'never' => __('Never', 'magic-checklists'),
            'unknown' => __('Unknown', 'magic-checklists'),
            'noUsageData' => __('No usage data', 'magic-checklists'),
            'noAnalyticsData' => __('No analytics data available yet. Data will appear once your checklists are being used.', 'magic-checklists'),
            'noRecentActivity' => __('No recent activity to display.', 'magic-checklists'),
            'clearAnalyticsDescription' => __('This will permanently delete all analytics data including views, item checks, and activity history.', 'magic-checklists'),
            'clearAllAnalytics' => __('Clear All Analytics', 'magic-checklists'),
            'clearing' => __('Clearing...', 'magic-checklists'),
        );
    }
    
    /**
     * Get time filter translations
     * 
     * @return array
     */
    private static function get_time_filter_translations() {
        return array(
            'last7Days' => __('Last 7 Days', 'magic-checklists'),
            'last30Days' => __('Last 30 Days', 'magic-checklists'),
            'last90Days' => __('Last 90 Days', 'magic-checklists'),
        );
    }
    
    /**
     * Get chart label translations
     * 
     * @return array
     */
    private static function get_chart_label_translations() {
        return array(
            'views' => __('Views', 'magic-checklists'),
            'checks' => __('Checks', 'magic-checklists'),
            'highUsage' => __('High Usage (10+)', 'magic-checklists'),
            'mediumUsage' => __('Medium Usage (3-9)', 'magic-checklists'),
            'lowUsage' => __('Low Usage (1-2)', 'magic-checklists'),
            'unused' => __('Unused', 'magic-checklists'),
        );
    }
    
    /**
     * Get activity message translations
     * 
     * @return array
     */
    private static function get_activity_message_translations() {
        return array(
            'checklistViewed' => __('Checklist "<span class="font-medium">{title}</span>" was viewed', 'magic-checklists'),
            'itemChecked' => __('Item <span class="font-medium">{item}</span> was checked in "<span class="font-medium">{title}</span>"', 'magic-checklists'),
        );
    }
    
    /**
     * Get time ago translations
     * 
     * @return array
     */
    private static function get_time_ago_translations() {
        return array(
            'minute' => __('minute', 'magic-checklists'),
            'minutes' => __('minutes', 'magic-checklists'),
            'hour' => __('hour', 'magic-checklists'),
            'hours' => __('hours', 'magic-checklists'),
            'day' => __('day', 'magic-checklists'),
            'days' => __('days', 'magic-checklists'),
            'ago' => __('ago', 'magic-checklists'),
        );
    }
    
    /**
     * Get clear modal translations
     * 
     * @return array
     */
    private static function get_clear_modal_translations() {
        return array(
            'title' => __('Clear All Analytics Data?', 'magic-checklists'),
            'message' => __('This will permanently delete all analytics data including view counts, item check history, and activity logs. This action cannot be undone.', 'magic-checklists'),
            'confirmButton' => __('Yes, clear all data', 'magic-checklists'),
            'items' => array(
                'viewCounts' => __('All checklist view counts', 'magic-checklists'),
                'checkHistory' => __('All item check history', 'magic-checklists'),
                'activityLogs' => __('All activity logs', 'magic-checklists'),
                'chartData' => __('Chart and trend data', 'magic-checklists'),
            ),
        );
    }
    
    /**
     * Get translations for a specific component
     * 
     * @param string $component Component name (e.g., 'analytics', 'common')
     * @return array
     */
    public static function get_component_translations($component) {
        $all_translations = self::get_all_translations();
        return isset($all_translations[$component]) ? $all_translations[$component] : array();
    }
    
    /**
     * Get flattened translations for JavaScript localization
     * Used for backward compatibility or simple JS access
     * 
     * @param string $component Component name
     * @return array
     */
    public static function get_flat_translations($component) {
        $translations = self::get_component_translations($component);
        return self::flatten_array($translations);
    }
    
    /**
     * Get all access control translations
     * 
     * @return array
     */
    public static function get_access_control_translations() {
        return array(
            'publicAccess' => self::get_public_access_translations(),
            'rateLimiting' => self::get_rate_limiting_translations(),
            'userRoles' => self::get_user_roles_translations(),
            'individualUsers' => self::get_individual_users_translations(),
            'inviteLinks' => self::get_invite_links_translations(),
            'loadingConditions' => self::get_loading_conditions_translations(),
            'forceDeleteLock' => self::get_force_delete_lock_translations(),
            'permissions' => self::get_permissions_translations(),
        );
    }

    /**
     * Get public access translations
     * 
     * @return array
     */
    private static function get_public_access_translations() {
        return array(
            'title' => __('Public Access', 'magic-checklists'),
            'description' => __('Enable this if you want any website visitor without authentication to have access to the checklist.', 'magic-checklists'),
            'publicDescription' => __('Public Description', 'magic-checklists'),
            'publicDescriptionPlaceholder' => __('Description visible to public users', 'magic-checklists'),
            'checkedStateHandling' => __('Public Checked State Handling', 'magic-checklists'),
            'perUser' => __('Per User (using browser storage)', 'magic-checklists'),
            'global' => __('Global (shared between all users)', 'magic-checklists'),
            'accessLevel' => __('Public Access Level', 'magic-checklists'),
        );
    }

    /**
     * Get rate limiting translations
     * 
     * @return array
     */
    private static function get_rate_limiting_translations() {
        return array(
            'title' => __('Enable Rate Limiting', 'magic-checklists'),
            'description' => __('Limit how frequently users can perform actions on this checklist.', 'magic-checklists'),
        );
    }

    /**
     * Get user roles translations
     * 
     * @return array
     */
    private static function get_user_roles_translations() {
        return array(
            'title' => __('Allowed User Roles', 'magic-checklists'),
            'placeholder' => __('Select user roles', 'magic-checklists'),
            'permissionLevel' => __('Permission Level', 'magic-checklists'),
            'permissionPlaceholder' => __('Select permission level...', 'magic-checklists'),
            'description' => __('Select the user roles that are allowed to access this checklist and their permission level.', 'magic-checklists'),
        );
    }

    /**
     * Get individual users translations
     * 
     * @return array
     */
    private static function get_individual_users_translations() {
        return array(
            'title' => __('Allowed Users', 'magic-checklists'),
            'placeholder' => __('Select individual users', 'magic-checklists'),
            'permissionLevel' => __('Permission Level', 'magic-checklists'),
            'permissionPlaceholder' => __('Select permission level...', 'magic-checklists'),
            'description' => __('Select individual users who are allowed to access this checklist and their permission level.', 'magic-checklists'),
        );
    }

    /**
     * Get invite links translations
     * 
     * @return array
     */
    private static function get_invite_links_translations() {
        return array(
            'title' => __('Invite Links', 'magic-checklists'),
            'description' => __('Generate invite links to share this checklist with anyone, even if they don\'t have a WordPress account.', 'magic-checklists'),
            'saveFirstBadge' => __('Save checklist first to enable', 'magic-checklists'),
            'saveFirstError' => __('Please save the checklist first to generate invite links', 'magic-checklists'),
            'permissionLevel' => __('Permission Level', 'magic-checklists'),
            'expiresAfter' => __('Expires After', 'magic-checklists'),
            'usageLimit' => __('Usage Limit', 'magic-checklists'),
            'usageLimitPlaceholder' => __('0 for unlimited', 'magic-checklists'),
            'usageLimitNote' => __('Set to 0 for unlimited uses', 'magic-checklists'),
            'generateButton' => __('Generate Invite Link', 'magic-checklists'),
            'generating' => __('Generating...', 'magic-checklists'),
            'loadingLinks' => __('Loading invite links...', 'magic-checklists'),
            'existingLinks' => __('Existing Invite Links', 'magic-checklists'),
            'expired' => __('Expired', 'magic-checklists'),
            'limitReached' => __('Limit Reached', 'magic-checklists'),
            'linkLabel' => __('Link:', 'magic-checklists'),
            'uses' => __('Uses:', 'magic-checklists'),
            'created' => __('Created:', 'magic-checklists'),
            'expires' => __('Expires:', 'magic-checklists'),
            'copyButton' => __('Copy', 'magic-checklists'),
            'deleteButton' => __('Delete', 'magic-checklists'),
            'deleteConfirm' => __('Are you sure you want to delete this invite link?', 'magic-checklists'),
            'generatedSuccess' => __('Invite link generated and copied to clipboard!', 'magic-checklists'),
            'copiedSuccess' => __('Link copied to clipboard!', 'magic-checklists'),
            'deleteSuccess' => __('Invite link deleted successfully', 'magic-checklists'),
            'generateError' => __('Failed to generate invite link:', 'magic-checklists'),
            'copyError' => __('Failed to copy link to clipboard', 'magic-checklists'),
            'deleteError' => __('Failed to delete invite link:', 'magic-checklists'),
            'loadError' => __('Failed to load invite links', 'magic-checklists'),
            'unknownError' => __('Unknown error', 'magic-checklists'),
            'oneDayLabel' => __('1 Day', 'magic-checklists'),
            'sevenDaysLabel' => __('7 Days', 'magic-checklists'),
            'thirtyDaysLabel' => __('30 Days', 'magic-checklists'),
        );
    }

    /**
     * Get loading conditions translations
     * 
     * @return array
     */
    private static function get_loading_conditions_translations() {
        return array(
            'title' => __('Loading Conditions', 'magic-checklists'),
            'description' => __('Control where this checklist should be available.', 'magic-checklists'),
            'loadEverywhere' => __('Load Everywhere (Default)', 'magic-checklists'),
            'adminPagesTitle' => __('WordPress Admin Pages', 'magic-checklists'),
            'loadingAdminPages' => __('Loading admin pages...', 'magic-checklists'),
            'adminPagesPlaceholder' => __('Select admin pages', 'magic-checklists'),
            'noAdminPages' => __('No admin pages found', 'magic-checklists'),
            'adminPagesDescription' => __('Select the WordPress admin pages where this checklist should be available.', 'magic-checklists'),
            'customUrlsTitle' => __('Custom URLs', 'magic-checklists'),
            'urlPlaceholder' => __('Enter URL pattern (e.g., /posts/*)', 'magic-checklists'),
            'addUrlButton' => __('Add URL Pattern', 'magic-checklists'),
        );
    }

    /**
     * Get force delete lock translations
     * 
     * @return array
     */
    private static function get_force_delete_lock_translations() {
        return array(
            'title' => __('Force Delete Lock', 'magic-checklists'),
            'description' => __('Use this button to forcefully remove the lock on this checklist if it is stuck. Only use this if you are sure no one else is editing this checklist.', 'magic-checklists'),
            'button' => __('Force Delete Lock', 'magic-checklists'),
            'confirmMessage' => __('Are you sure you want to force delete the lock?', 'magic-checklists'),
            'successMessage' => __('Lock has been successfully deleted.', 'magic-checklists'),
            'errorMessage' => __('Failed to delete the lock:', 'magic-checklists'),
            'genericError' => __('An error occurred while deleting the lock.', 'magic-checklists'),
        );
    }

    /**
     * Get permission-related translations
     * 
     * @return array
     */
    private static function get_permissions_translations() {
        return array(
            'canView' => __('Can View', 'magic-checklists'),
            'canInteract' => __('Can Interact', 'magic-checklists'),
            'canEdit' => __('Can Edit', 'magic-checklists'),
        );
    }

    /**
     * Get analytics dashboard overview translations
     * 
     * @return array
     */
    public static function get_analytics_dashboard_overview_translations() {
        return array(
            'header' => self::get_analytics_dashboard_header_translations(),
            'summaryCards' => self::get_summary_cards_translations(),
            'deadlines' => self::get_approaching_deadlines_translations(),
            'mostPopular' => self::get_most_popular_translations(),
            'mostChecked' => self::get_most_checked_translations(),
            'timeFormatting' => self::get_time_formatting_translations(),
        );
    }

    /**
     * Get analytics dashboard header translations
     * 
     * @return array
     */
    private static function get_analytics_dashboard_header_translations() {
        return array(
            'title' => __('Checklist Analytics Overview', 'magic-checklists'),
            'viewFullAnalytics' => __('View Full Analytics', 'magic-checklists'),
        );
    }

    /**
     * Get summary cards translations
     * 
     * @return array
     */
    private static function get_summary_cards_translations() {
        return array(
            'totalViews' => __('Total Views', 'magic-checklists'),
            'totalChecks' => __('Total Checks', 'magic-checklists'),
            'activeChecklists' => __('Active Checklists', 'magic-checklists'),
        );
    }

    /**
     * Get approaching deadlines translations
     * 
     * @return array
     */
    private static function get_approaching_deadlines_translations() {
        return array(
            'title' => __('Approaching Deadlines', 'magic-checklists'),
            'checklistColumn' => __('Checklist', 'magic-checklists'),
            'itemColumn' => __('Item', 'magic-checklists'),
            'deadlineColumn' => __('Deadline', 'magic-checklists'),
            'timeRemainingColumn' => __('Time Remaining', 'magic-checklists'),
            'checklistDeadline' => __('Checklist Deadline', 'magic-checklists'),
        );
    }

    /**
     * Get most popular translations
     * 
     * @return array
     */
    private static function get_most_popular_translations() {
        return array(
            'title' => __('Most Popular Checklist', 'magic-checklists'),
            'view' => __('view', 'magic-checklists'),
            'views' => __('views', 'magic-checklists'),
        );
    }

    /**
     * Get most checked item translations
     * 
     * @return array
     */
    private static function get_most_checked_translations() {
        return array(
            'title' => __('Most Checked Item', 'magic-checklists'),
            'in' => __('in', 'magic-checklists'),
            'check' => __('check', 'magic-checklists'),
            'checks' => __('checks', 'magic-checklists'),
        );
    }

    /**
     * Get time formatting translations
     * 
     * @return array
     */
    private static function get_time_formatting_translations() {
        return array(
            'overdue' => __('Overdue', 'magic-checklists'),
            'day' => __('day', 'magic-checklists'),
            'days' => __('days', 'magic-checklists'),
            'hour' => __('hour', 'magic-checklists'),
            'hours' => __('hours', 'magic-checklists'),
            'invalidDate' => __('Invalid date', 'magic-checklists'),
            'entireChecklist' => __('Entire Checklist', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistDrawer component translations
     * 
     * @return array
     */
    public static function get_checklist_drawer_translations() {
        return array(
            'imageModal' => self::get_checklist_drawer_image_modal_translations(),
            'deadlineModal' => self::get_checklist_drawer_deadline_modal_translations(),
            'progressCounter' => self::get_checklist_drawer_progress_translations(),
            'checklistStates' => self::get_checklist_drawer_states_translations(),
            'buttons' => self::get_checklist_drawer_buttons_translations(),
            'tooltips' => self::get_checklist_drawer_tooltips_translations(),
            'messages' => self::get_checklist_drawer_messages_translations(),
        );
    }

    /**
     * Get ChecklistDrawer image modal translations
     * 
     * @return array
     */
    private static function get_checklist_drawer_image_modal_translations() {
        return array(
            'insertImageTitle' => __('Insert Image', 'magic-checklists'),
            'uploadOrSelectTitle' => __('Upload or Select Image', 'magic-checklists'),
            'chooseHowToAdd' => __('Choose how you would like to add an image:', 'magic-checklists'),
            'wordPressMediaLibrary' => __('WordPress Media Library', 'magic-checklists'),
            'quickUpload' => __('Quick Upload', 'magic-checklists'),
            'uploadNew' => __('Upload New', 'magic-checklists'),
            'selectExisting' => __('Select Existing', 'magic-checklists'),
            'dragAndDrop' => __('Drag and drop image here or click to select', 'magic-checklists'),
            'fileRestrictions' => __('Maximum file size: 10MB. Supported formats: JPG, PNG, GIF', 'magic-checklists'),
            'loadingImages' => __('Loading images...', 'magic-checklists'),
            'noImagesFound' => __('No images found', 'magic-checklists'),
            'enterUrl' => __('Enter URL...', 'magic-checklists'),
            'uploadImage' => __('Upload Image', 'magic-checklists'),
            'uploading' => __('Uploading...', 'magic-checklists'),
            'selectImage' => __('Select Image', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistDrawer deadline modal translations
     * 
     * @return array
     */
    private static function get_checklist_drawer_deadline_modal_translations() {
        return array(
            'setDeadlineTitle' => __('Set Item Deadline', 'magic-checklists'),
            'deadlineDateTimeLabel' => __('Deadline Date & Time', 'magic-checklists'),
            'leaveEmptyHint' => __('Leave empty to remove deadline', 'magic-checklists'),
            'clearDeadline' => __('Clear Deadline', 'magic-checklists'),
            'saveDeadline' => __('Save Deadline', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistDrawer progress counter translations
     * 
     * @return array
     */
    private static function get_checklist_drawer_progress_translations() {
        return array(
            'items' => __('items', 'magic-checklists'),
            'completed' => __('completed', 'magic-checklists'),
            'complete' => __('complete', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistDrawer state messages translations
     * 
     * @return array
     */
    private static function get_checklist_drawer_states_translations() {
        return array(
            'loadingChecklist' => __('Loading checklist...', 'magic-checklists'),
            'checklistReset' => __('This checklist has been automatically reset.', 'magic-checklists'),
            'checklistLocked' => __('This checklist is locked by another user. You can still interact but cannot edit structure.', 'magic-checklists'),
            'deadlinePassed' => __('Deadline passed', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistDrawer buttons translations
     * 
     * @return array
     */
    private static function get_checklist_drawer_buttons_translations() {
        return array(
            'cancel' => __('Cancel', 'magic-checklists'),
            'startTour' => __('Start tour from this step', 'magic-checklists'),
            'addItem' => __('Add Item', 'magic-checklists'),
            'uncheckAll' => __('Uncheck All', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistDrawer tooltips translations
     * 
     * @return array
     */
    private static function get_checklist_drawer_tooltips_translations() {
        return array(
            'dragToReorder' => __('Drag to reorder', 'magic-checklists'),
            'markAsInProgress' => __('Mark as in progress', 'magic-checklists'),
            'removeFromInProgress' => __('Remove from in progress', 'magic-checklists'),
            'setDeadline' => __('Set deadline', 'magic-checklists'),
            'addImage' => __('Add image', 'magic-checklists'),
            'removeItem' => __('Remove item', 'magic-checklists'),
            'addLink' => __('Add link', 'magic-checklists'),
            'removeLink' => __('Remove link', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistDrawer messages translations
     * 
     * @return array
     */
    private static function get_checklist_drawer_messages_translations() {
        return array(
            'selectImageTitle' => __('Select Image', 'magic-checklists'),
            'invalidFileType' => __('Invalid file type. Please upload a JPG, PNG, or GIF image.', 'magic-checklists'),
            'invalidDate' => __('Invalid date', 'magic-checklists'),
        );
    }

    /**
     * Flatten nested array for JS localization
     * 
     * @param array $array
     * @param string $prefix
     * @return array
     */
    private static function flatten_array($array, $prefix = '') {
        $result = array();
        foreach ($array as $key => $value) {
            $new_key = $prefix ? $prefix . '.' . $key : $key;
            if (is_array($value)) {
                $result = array_merge($result, self::flatten_array($value, $new_key));
            } else {
                $result[$new_key] = $value;
            }
        }
        return $result;
    }
}