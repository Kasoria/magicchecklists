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
            'customThemeSettings' => self::get_custom_theme_settings_translations(),
            'kanbanBoard' => self::get_kanban_board_translations(),
            'shortcodeSettings' => self::get_shortcode_settings_translations(),
            'shortcodeRenderer' => self::get_shortcode_renderer_translations(),
            'analyticsDashboard' => self::get_analytics_dashboard_overview_translations(),
            'checklistDrawer' => self::get_checklist_drawer_translations(),
            'checklistEditor' => self::get_checklist_editor_translations(),
            'notificationSettings' => self::get_notification_settings_translations(),
            'checklistItems' => self::get_checklist_items_translations(),
            'adminApp' => self::get_admin_app_translations(),
            'app' => self::get_app_translations(),
            'settings' => self::get_settings_translations(),
            'dashboardSettings' => self::get_dashboard_settings_translations(),
            'integrationSettings' => self::get_integration_settings_translations(),
            'generalSettings' => self::get_general_settings_translations(),
            'importExport' => self::get_import_export_translations(),
            'license' => self::get_license_translations(),
            'checklistsTable' => self::get_checklists_table_translations(),
            'checklistTypeSelector' => self::get_checklist_type_selector_translations(),
            'editPublisherChecklist' => self::get_edit_publisher_checklist_translations(),
            'tourPlayback' => self::get_tour_playback_translations(),
            'tourCreator' => self::get_tour_creator_translations(),
            'tourEditor' => self::get_tour_editor_translations(),
            'tours' => self::get_tours_translations(),
            'deadlineDisplay' => self::get_deadline_display_translations(),
            'resetNotification' => self::get_reset_notification_translations(),
            'congratsAnimation' => self::get_congrats_animation_translations(),
            'lockedOverlay' => self::get_locked_overlay_translations(),
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
     * Get all custom theme settings translations
     * 
     * @return array
     */
    public static function get_custom_theme_settings_translations() {
        return array(
            'title' => __('Custom Theme Settings', 'magic-checklists'),
            'description' => __('Customize the visual appearance of your checklist drawer.', 'magic-checklists'),
            'sections' => array(
                'colors' => array(
                    'title' => __('Colors', 'magic-checklists'),
                    'backgroundColorLabel' => __('Background Color', 'magic-checklists'),
                    'backgroundColorHelp' => __('Main background color of the drawer', 'magic-checklists'),
                    'listItemBackgroundLabel' => __('List Item Background', 'magic-checklists'),
                    'listItemBackgroundHelp' => __('Background color for checklist items', 'magic-checklists'),
                    'textColorLabel' => __('Text Color', 'magic-checklists'),
                    'textColorHelp' => __('Primary text color', 'magic-checklists'),
                    'descriptionTextColorLabel' => __('Description Text Color', 'magic-checklists'),
                    'descriptionTextColorHelp' => __('Color for description text', 'magic-checklists'),
                ),
                'typography' => array(
                    'title' => __('Typography', 'magic-checklists'),
                    'headingSizeLabel' => __('Heading Size', 'magic-checklists'),
                    'headingSizeHelp' => __('Size of the main title', 'magic-checklists'),
                    'descriptionSizeLabel' => __('Description Size', 'magic-checklists'),
                    'descriptionSizeHelp' => __('Size of description text', 'magic-checklists'),
                    'listItemSizeLabel' => __('List Item Size', 'magic-checklists'),
                    'listItemSizeHelp' => __('Size of checklist item text', 'magic-checklists'),
                ),
                'buttonColors' => array(
                    'title' => __('Button Colors', 'magic-checklists'),
                    'primaryButtonBackgroundLabel' => __('Primary Button Background', 'magic-checklists'),
                    'primaryButtonBackgroundHelp' => __('Background color for primary buttons', 'magic-checklists'),
                    'primaryButtonTextLabel' => __('Primary Button Text', 'magic-checklists'),
                    'primaryButtonTextHelp' => __('Text color for primary buttons', 'magic-checklists'),
                    'secondaryButtonBackgroundLabel' => __('Secondary Button Background', 'magic-checklists'),
                    'secondaryButtonBackgroundHelp' => __('Background color for secondary buttons', 'magic-checklists'),
                    'secondaryButtonTextLabel' => __('Secondary Button Text', 'magic-checklists'),
                    'secondaryButtonTextHelp' => __('Text color for secondary buttons', 'magic-checklists'),
                ),
                'checkboxStyle' => array(
                    'title' => __('Checkbox Style', 'magic-checklists'),
                    'checkboxBackgroundLabel' => __('Checkbox Background', 'magic-checklists'),
                    'checkboxBackgroundHelp' => __('Background color of checkboxes', 'magic-checklists'),
                    'borderRadiusLabel' => __('Checkbox Border Radius', 'magic-checklists'),
                    'borderRadiusHelp' => __('Rounded corners for checkboxes', 'magic-checklists'),
                    'checkmarkStyleLabel' => __('Checkmark Style', 'magic-checklists'),
                    'standardOption' => __('Standard', 'magic-checklists'),
                    'customImageOption' => __('Custom Image', 'magic-checklists'),
                    'placeholder' => __('Select checkmark style...', 'magic-checklists'),
                    'description' => __('Choose between standard checkmark or custom image', 'magic-checklists'),
                    'customIconTitle' => __('Custom Checkmark Icon', 'magic-checklists'),
                    'currentIconLabel' => __('Current icon', 'magic-checklists'),
                    'changeImageButton' => __('Change Image', 'magic-checklists'),
                    'selectImageButton' => __('Select Image Button', 'magic-checklists'),
                    'removeButton' => __('Remove', 'magic-checklists'),
                    'iconRecommendation' => __('Recommended: 24x24px PNG or SVG with transparency', 'magic-checklists'),
                    'checkmarkColorLabel' => __('Checkmark Color', 'magic-checklists'),
                    'checkmarkColorHelp' => __('Color of the standard checkmark', 'magic-checklists'),
                ),
                'drawerStyle' => array(
                    'title' => __('Drawer Style', 'magic-checklists'),
                    'borderRadiusLabel' => __('Border Radius', 'magic-checklists'),
                    'borderRadiusHelp' => __('Rounded corners for the drawer', 'magic-checklists'),
                ),
                'dimensions' => array(
                    'title' => __('Dimensions', 'magic-checklists'),
                    'drawerWidthLabel' => __('Drawer Width', 'magic-checklists'),
                    'drawerWidthHelp' => __('Maximum width of the drawer', 'magic-checklists'),
                    'drawerHeightLabel' => __('Drawer Height', 'magic-checklists'),
                    'drawerHeightHelp' => __('Maximum height of the drawer', 'magic-checklists'),
                ),
                'floatingButton' => array(
                    'title' => __('Floating Button Settings', 'magic-checklists'),
                    'buttonBackgroundLabel' => __('Button Background', 'magic-checklists'),
                    'buttonBackgroundHelp' => __('Background color of floating button', 'magic-checklists'),
                    'buttonTextColorLabel' => __('Button Text Color', 'magic-checklists'),
                    'buttonTextColorHelp' => __('Text color of floating button', 'magic-checklists'),
                    'textSizeLabel' => __('Text Size', 'magic-checklists'),
                    'textSizeHelp' => __('Font size for button text', 'magic-checklists'),
                    'showIconLabel' => __('Show Checklist Icon', 'magic-checklists'),
                    'showIconDescription' => __('Display a checklist icon alongside the button text', 'magic-checklists'),
                ),
            ),
            'validation' => array(
                'fontSizeRange' => __('Font size must be between 10 and 50 pixels', 'magic-checklists'),
                'widthRange' => __('Width must be between 400 and 2000 pixels', 'magic-checklists'),
                'heightRange' => __('Height must be between 350 and 2000 pixels', 'magic-checklists'),
                'invalidHexColor' => __('Please enter a valid hex color (e.g., #ffffff)', 'magic-checklists'),
                'errorSummary' => __('Please fix the following errors:', 'magic-checklists'),
            ),
            'mediaUploader' => array(
                'title' => __('Select Custom Checkmark Icon', 'magic-checklists'),
                'buttonText' => __('Use This Image', 'magic-checklists'),
            ),
        );
    }

    /**
     * Get all kanban board translations
     * 
     * @return array
     */
    public static function get_kanban_board_translations() {
        return array(
            'header' => array(
                'selectChecklistLabel' => __('Select Checklist:', 'magic-checklists'),
                'chooseChecklistOption' => __('Choose a checklist...', 'magic-checklists'),
                'addColumnButton' => __('Add Column', 'magic-checklists'),
            ),
            'column' => array(
                'editButton' => __('Edit Column', 'magic-checklists'),
                'deleteButton' => __('Delete Column', 'magic-checklists'),
            ),
            'item' => array(
                'assignButton' => __('Assign', 'magic-checklists'),
                'commentSingular' => __('comment', 'magic-checklists'),
                'commentPlural' => __('comments', 'magic-checklists'),
            ),
            'modals' => array(
                'editColumnTitle' => __('Edit Column', 'magic-checklists'),
                'addColumnTitle' => __('Add New Column', 'magic-checklists'),
                'cancelButton' => __('Cancel', 'magic-checklists'),
                'updateColumnButton' => __('Update Column', 'magic-checklists'),
                'addColumnButton' => __('Add Column', 'magic-checklists'),
                'columnTitleLabel' => __('Column Title', 'magic-checklists'),
                'columnTitlePlaceholder' => __('Enter column title...', 'magic-checklists'),
                'columnColorLabel' => __('Column Color', 'magic-checklists'),
                'assignUserTitle' => __('Assign User', 'magic-checklists'),
                'saveAssignmentButton' => __('Save Assignment', 'magic-checklists'),
                'selectUserLabel' => __('Select User', 'magic-checklists'),
                'unassignedOption' => __('Unassigned', 'magic-checklists'),
                'editTaskTitle' => __('Edit Task', 'magic-checklists'),
                'saveTaskButton' => __('Save Task', 'magic-checklists'),
                'taskContentLabel' => __('Task Content', 'magic-checklists'),
                'boldTitle' => __('Bold', 'magic-checklists'),
                'italicTitle' => __('Italic', 'magic-checklists'),
                'underlineTitle' => __('Underline', 'magic-checklists'),
                'addImageTitle' => __('Add Image', 'magic-checklists'),
                'commentsLabel' => __('Comments', 'magic-checklists'),
                'addCommentPlaceholder' => __('Add a comment...', 'magic-checklists'),
                'ctrlEnterToPost' => __('Ctrl+Enter to post', 'magic-checklists'),
                'commentButton' => __('Comment', 'magic-checklists'),
                'loadingComments' => __('Loading comments...', 'magic-checklists'),
                'noCommentsYet' => __('No comments yet. Be the first to comment!', 'magic-checklists'),
                'deleteColumnTitle' => __('Delete Column', 'magic-checklists'),
                'deleteColumnMessage' => __('Are you sure you want to delete the column "{columnTitle}"?', 'magic-checklists'),
                'deleteColumnConfirm' => __('Delete Column', 'magic-checklists'),
                'deleteColumnWarning' => __('This will also delete {itemCount} items in this column', 'magic-checklists'),
            ),
            'comment' => array(
                'deleteTitle' => __('Delete comment', 'magic-checklists'),
                'replyButton' => __('Reply', 'magic-checklists'),
                'replyPlaceholder' => __('Write a reply...', 'magic-checklists'),
                'cancelButton' => __('Cancel', 'magic-checklists'),
                'replySubmitButton' => __('Reply', 'magic-checklists'),
            ),
            'time' => array(
                'justNow' => __('just now', 'magic-checklists'),
                'minutesAgo' => __('{minutes}m ago', 'magic-checklists'),
                'hoursAgo' => __('{hours}h ago', 'magic-checklists'),
                'daysAgo' => __('{days}d ago', 'magic-checklists'),
            ),
            'prompts' => array(
                'enterImageUrl' => __('Enter image URL:', 'magic-checklists'),
            ),
            'confirm' => array(
                'deleteComment' => __('Are you sure you want to delete this comment and all its replies?', 'magic-checklists'),
            ),
            'errors' => array(
                'loadChecklistsFailed' => __('Failed to load checklists', 'magic-checklists'),
                'loadBoardFailed' => __('Failed to load Kanban board', 'magic-checklists'),
                'moveItemFailed' => __('Failed to move item', 'magic-checklists'),
                'columnTitleRequired' => __('Column title is required', 'magic-checklists'),
                'saveColumnFailed' => __('Failed to save column', 'magic-checklists'),
                'taskContentRequired' => __('Task content is required', 'magic-checklists'),
                'saveTaskFailed' => __('Failed to save task', 'magic-checklists'),
                'addCommentFailed' => __('Failed to add comment', 'magic-checklists'),
                'addReplyFailed' => __('Failed to add reply', 'magic-checklists'),
                'toggleLikeFailed' => __('Failed to toggle like', 'magic-checklists'),
                'deleteCommentFailed' => __('Failed to delete comment', 'magic-checklists'),
                'assignUserFailed' => __('Failed to assign user', 'magic-checklists'),
                'updateItemStateFailed' => __('Failed to update item state', 'magic-checklists'),
            ),
            'success' => array(
                'itemMoved' => __('Item moved successfully', 'magic-checklists'),
                'columnUpdated' => __('Column updated', 'magic-checklists'),
                'columnAdded' => __('Column added', 'magic-checklists'),
                'columnDeleted' => __('Column deleted', 'magic-checklists'),
                'taskUpdated' => __('Task updated successfully', 'magic-checklists'),
                'commentAdded' => __('Comment added successfully', 'magic-checklists'),
                'replyAdded' => __('Reply added successfully', 'magic-checklists'),
                'commentDeleted' => __('Comment deleted successfully', 'magic-checklists'),
                'userAssignmentUpdated' => __('User assignment updated', 'magic-checklists'),
                'itemChecked' => __('Item checked', 'magic-checklists'),
                'itemUnchecked' => __('Item unchecked', 'magic-checklists'),
            ),
        );
    }

    /**
     * Get all shortcode settings translations
     * 
     * @return array
     */
    public static function get_shortcode_settings_translations() {
        return array(
            'header' => array(
                'title' => __('Shortcode Settings', 'magic-checklists'),
            ),
            'shortcode' => array(
                'label' => __('Shortcode', 'magic-checklists'),
                'copyButton' => __('Copy', 'magic-checklists'),
            ),
            'displayOptions' => array(
                'title' => __('Display Options', 'magic-checklists'),
                'showTitle' => __('Show Title', 'magic-checklists'),
                'showDescription' => __('Show Description', 'magic-checklists'),
                'showDeadline' => __('Show Deadline', 'magic-checklists'),
                'showPriority' => __('Show Priority Indicators', 'magic-checklists'),
                'showNumbers' => __('Show Item Numbers', 'magic-checklists'),
            ),
            'styleColors' => array(
                'title' => __('Style Options - Colors', 'magic-checklists'),
                'titleTextColor' => __('Title Text Color', 'magic-checklists'),
                'descriptionTextColor' => __('Description Text Color', 'magic-checklists'),
                'deadlineTextColor' => __('Deadline Text Color', 'magic-checklists'),
                'listItemTextColor' => __('List Item Text Color', 'magic-checklists'),
                'backgroundColor' => __('Background Color', 'magic-checklists'),
                'borderColor' => __('Border Color', 'magic-checklists'),
                'checkboxBorderColor' => __('Checkbox Border Color', 'magic-checklists'),
                'checkboxColorFilled' => __('Checkbox Color Filled', 'magic-checklists'),
                'checkboxColorUnfilled' => __('Checkbox Color Unfilled', 'magic-checklists'),
                'checkmarkColor' => __('Checkmark Color', 'magic-checklists'),
            ),
            'styleSpacing' => array(
                'title' => __('Style Options - Spacing & Dimensions', 'magic-checklists'),
                'verticalPadding' => __('Container Vertical Padding', 'magic-checklists'),
                'horizontalPadding' => __('Container Horizontal Padding', 'magic-checklists'),
                'containerGap' => __('Container Gap', 'magic-checklists'),
                'checkboxDimensions' => __('Checkbox Dimensions', 'magic-checklists'),
                'checkboxBorderRadius' => __('Checkbox Border Radius', 'magic-checklists'),
                'checkboxBorderThickness' => __('Checkbox Border Thickness', 'magic-checklists'),
                'borderType' => __('Border Type', 'magic-checklists'),
                'borderTypeNone' => __('None', 'magic-checklists'),
                'borderTypeSolid' => __('Solid', 'magic-checklists'),
                'borderTypeDashed' => __('Dashed', 'magic-checklists'),
                'borderTypeDotted' => __('Dotted', 'magic-checklists'),
                'selectBorderType' => __('Select border type...', 'magic-checklists'),
                'borderRadius' => __('Border Radius', 'magic-checklists'),
                'borderThickness' => __('Border Thickness', 'magic-checklists'),
                'itemSpacing' => __('Item Spacing', 'magic-checklists'),
                'spacingCompact' => __('Compact', 'magic-checklists'),
                'spacingComfortable' => __('Comfortable', 'magic-checklists'),
                'spacingSpaciuous' => __('Spacious', 'magic-checklists'),
                'selectSpacing' => __('Select spacing...', 'magic-checklists'),
            ),
            'styleTypography' => array(
                'title' => __('Style Options - Typography', 'magic-checklists'),
                'titleFontSize' => __('Title Font Size', 'magic-checklists'),
                'descriptionFontSize' => __('Description Font Size', 'magic-checklists'),
                'listItemFontSize' => __('List Item Font Size', 'magic-checklists'),
                'deadlineFontSize' => __('Deadline Font Size', 'magic-checklists'),
            ),
            'behaviorOptions' => array(
                'title' => __('Behavior Options', 'magic-checklists'),
                'containerWidth' => __('Container Width', 'magic-checklists'),
                'widthFull' => __('Full Width', 'magic-checklists'),
                'widthNarrow' => __('Narrow (600px)', 'magic-checklists'),
                'widthCustom' => __('Custom', 'magic-checklists'),
                'selectWidth' => __('Select width...', 'magic-checklists'),
                'customWidth' => __('Custom Width', 'magic-checklists'),
                'checkedStateStorage' => __('Checked State Storage', 'magic-checklists'),
                'storageSession' => __('Session Storage', 'magic-checklists'),
                'storageLocal' => __('Local Storage', 'magic-checklists'),
                'storageGlobal' => __('Global (Database)', 'magic-checklists'),
                'selectStorageType' => __('Select storage type...', 'magic-checklists'),
                'disableDrawer' => __('Disable Drawer for this Checklist', 'magic-checklists'),
                'allowReordering' => __('Allow Item Reordering', 'magic-checklists'),
            ),
        );
    }

    /**
     * Get all shortcode renderer translations
     * 
     * @return array
     */
    public static function get_shortcode_renderer_translations() {
        return array(
            'countdown' => array(
                'expired' => __('Expired', 'magic-checklists'),
            ),
            'deadline' => array(
                'enterPrompt' => __('Enter deadline (YYYY-MM-DD HH:MM):', 'magic-checklists'),
                'dueLabel' => __('Due', 'magic-checklists'),
            ),
            'image' => array(
                'enterUrlPrompt' => __('Enter image URL:', 'magic-checklists'),
            ),
            'tooltips' => array(
                'removeFromProgress' => __('Remove from in progress', 'magic-checklists'),
                'markAsProgress' => __('Mark as in progress', 'magic-checklists'),
                'setDeadline' => __('Set deadline', 'magic-checklists'),
                'addImage' => __('Add image', 'magic-checklists'),
                'removeItem' => __('Remove item', 'magic-checklists'),
            ),
            'buttons' => array(
                'addItem' => __('Add Item', 'magic-checklists'),
            ),
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
            'congratsMessage' => __('Great job! 🎉', 'magic-checklists'),
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
     * Get ChecklistEditor component translations
     * 
     * @return array
     */
    public static function get_checklist_editor_translations() {
        return array(
            'loadingChecklist' => __('Loading checklist...', 'magic-checklists'),
            'failedToLoadType' => __('Failed to load checklist type:', 'magic-checklists'),
            'errorLoadingType' => __('Error loading checklist type:', 'magic-checklists'),
            'editChecklist' => self::get_edit_checklist_translations(),
        );
    }

    /**
     * Get EditChecklist component translations
     * 
     * @return array
     */
    private static function get_edit_checklist_translations() {
        return array(
            'stepTitles' => array(
                'basicSettings' => __('Basic Settings', 'magic-checklists'),
                'advancedSettings' => __('Advanced Settings', 'magic-checklists'),
                'accessControl' => __('Access Control', 'magic-checklists'),
                'notifications' => __('Notifications', 'magic-checklists'),
            ),
            'basicSettings' => array(
                'title' => __('Title', 'magic-checklists'),
                'titlePlaceholder' => __('Enter checklist title', 'magic-checklists'),
                'description' => __('Description', 'magic-checklists'),
                'descriptionPlaceholder' => __('Enter checklist description', 'magic-checklists'),
                'showDescriptionInDrawer' => __('Show description in drawer', 'magic-checklists'),
                'activeStatus' => __('Active Status', 'magic-checklists'),
                'activeStatusDescription' => __('When active, this checklist can be accessed using its keyboard shortcut or floating button.', 'magic-checklists'),
                'drawerTheme' => __('Drawer Theme', 'magic-checklists'),
                'chooseTheme' => __('Choose theme...', 'magic-checklists'),
                'themeDescription' => __('Choose the visual theme for your checklist drawer.', 'magic-checklists'),
                'tags' => __('Tags', 'magic-checklists'),
                'tagPlaceholder' => __('Type tag name and press Enter', 'magic-checklists'),
                'tagsHint' => __('Add tags to organize your checklist. Press Enter to add a tag, then click the edit icon to change its color.', 'magic-checklists'),
                'checklistPriority' => __('Checklist Priority', 'magic-checklists'),
                'selectPriorityPlaceholder' => __('Select priority...', 'magic-checklists'),
                'enableItemLocking' => __('Enable Item Locking', 'magic-checklists'),
                'itemLockingDescription' => __('Enable locking of individual items to prevent editing.', 'magic-checklists'),
                'enableShortcode' => __('Enable Shortcode', 'magic-checklists'),
                'shortcodeDescription' => __('Enable this to use this checklist as a shortcode in your content.', 'magic-checklists'),
                'autoResetSchedule' => __('Auto Reset Schedule', 'magic-checklists'),
                'autoResetDescription' => __('Enable automatic reset of checked items on a schedule.', 'magic-checklists'),
                'floatingButtonTitle' => __('Floating Button Title', 'magic-checklists'),
                'buttonTitle' => __('Button title', 'magic-checklists'),
                'selectIconImage' => __('Select Icon Image', 'magic-checklists'),
                'changeColor' => __('Change color', 'magic-checklists'),
            ),
            'advancedSettings' => array(
                'deadline' => __('Deadline', 'magic-checklists'),
                'deadlineDescription' => __('Set an optional deadline for completing this checklist.', 'magic-checklists'),
                'keyboardShortcut' => __('Keyboard Shortcut', 'magic-checklists'),
                'shortcutPlaceholder' => __('Click and press your desired key combination', 'magic-checklists'),
                'drawerTriggerMethod' => __('Drawer Trigger Method', 'magic-checklists'),
                'keyboardShortcutTrigger' => __('Keyboard Shortcut', 'magic-checklists'),
                'floatingButton' => __('Floating Button', 'magic-checklists'),
                'buttonPosition' => __('Button Position', 'magic-checklists'),
                'selectPosition' => __('Select position...', 'magic-checklists'),
                'checklistIcon' => __('Checklist Icon', 'magic-checklists'),
                'usePresetIcon' => __('Use Preset Icon', 'magic-checklists'),
                'customIcon' => __('Custom Icon', 'magic-checklists'),
                'chooseIconImage' => __('Choose Icon Image', 'magic-checklists'),
                'useAsIcon' => __('Use as Icon', 'magic-checklists'),
                'customIconAlt' => __('Custom icon', 'magic-checklists'),
                'remove' => __('Remove', 'magic-checklists'),
                'pasteImageUrl' => __('Or paste image URL', 'magic-checklists'),
                'disableInBuilders' => __('Disable floating button when inside pagebuilders', 'magic-checklists'),
                'checkedStateHandling' => __('Checked State Handling', 'magic-checklists'),
                'selectHandlingMethod' => __('Select handling method...', 'magic-checklists'),
                'checkedStateDescription' => __('"Per User" gives each user their own checked states. "Global" shares checked states among all users.', 'magic-checklists'),
                'resetInterval' => __('Reset Interval', 'magic-checklists'),
                'selectInterval' => __('Select interval...', 'magic-checklists'),
                'dayOfWeek' => __('Day of Week', 'magic-checklists'),
                'selectDay' => __('Select day...', 'magic-checklists'),
                'dayOfMonth' => __('Day of Month', 'magic-checklists'),
                'enterDayOfMonth' => __('Enter day of month', 'magic-checklists'),
                'customInterval' => __('Custom Interval', 'magic-checklists'),
                'months' => __('Months', 'magic-checklists'),
                'weeks' => __('Weeks', 'magic-checklists'),
                'days' => __('Days', 'magic-checklists'),
                'customIntervalHint' => __('At least one field must have a value greater than 0.', 'magic-checklists'),
                'resetTime' => __('Reset Time', 'magic-checklists'),
            ),
            'options' => array(
                'light' => __('Light', 'magic-checklists'),
                'dark' => __('Dark', 'magic-checklists'),
                'customTheme' => __('Custom Theme', 'magic-checklists'),
                'bottomRight' => __('Bottom Right', 'magic-checklists'),
                'bottomLeft' => __('Bottom Left', 'magic-checklists'),
                'topRight' => __('Top Right', 'magic-checklists'),
                'topLeft' => __('Top Left', 'magic-checklists'),
                'draggable' => __('Draggable', 'magic-checklists'),
                'perUser' => __('Per User', 'magic-checklists'),
                'global' => __('Global', 'magic-checklists'),
                'daily' => __('Daily', 'magic-checklists'),
                'weekly' => __('Weekly', 'magic-checklists'),
                'monthly' => __('Monthly', 'magic-checklists'),
                'custom' => __('Custom', 'magic-checklists'),
                'monday' => __('Monday', 'magic-checklists'),
                'tuesday' => __('Tuesday', 'magic-checklists'),
                'wednesday' => __('Wednesday', 'magic-checklists'),
                'thursday' => __('Thursday', 'magic-checklists'),
                'friday' => __('Friday', 'magic-checklists'),
                'saturday' => __('Saturday', 'magic-checklists'),
                'sunday' => __('Sunday', 'magic-checklists'),
            ),
            'priorities' => array(
                'none' => __('None', 'magic-checklists'),
                'low' => __('Low', 'magic-checklists'),
                'medium' => __('Medium', 'magic-checklists'),
                'high' => __('High', 'magic-checklists'),
                'critical' => __('Critical', 'magic-checklists'),
            ),
            'buttons' => array(
                'previous' => __('Previous', 'magic-checklists'),
                'next' => __('Next', 'magic-checklists'),
                'save' => __('Save', 'magic-checklists'),
            ),
            'validation' => array(
                'titleRequired' => __('Title is required', 'magic-checklists'),
                'triggerMethodsRequired' => __('At least one trigger method must be selected', 'magic-checklists'),
                'keyboardShortcutRequired' => __('Keyboard shortcut is required when shortcut trigger is enabled', 'magic-checklists'),
                'shortcutInUse' => __('This shortcut is already in use.', 'magic-checklists'),
                'invalidTimeFormat' => __('Invalid time format', 'magic-checklists'),
                'invalidDayOfWeek' => __('Invalid day of week selected', 'magic-checklists'),
                'dayOfMonthRange' => __('Day of month must be between 1 and 31', 'magic-checklists'),
                'customIntervalRequired' => __('At least one time period must be specified for custom intervals', 'magic-checklists'),
                'monthsRange' => __('Months must be between 0 and 12', 'magic-checklists'),
                'weeksRange' => __('Weeks must be between 0 and 52', 'magic-checklists'),
                'daysRange' => __('Days must be between 0 and 31', 'magic-checklists'),
                'usageLimitNumber' => __('Usage limit must be a number', 'magic-checklists'),
                'usageLimitNegative' => __('Usage limit cannot be negative', 'magic-checklists'),
                'notificationMethodRequired' => __('At least one notification method must be enabled', 'magic-checklists'),
                'emailRecipientsRequired' => __('Email recipients are required when email notifications are enabled', 'magic-checklists'),
                'itemsRequired' => __('At least one non-empty checklist item is required', 'magic-checklists'),
            ),
            'actions' => array(
                'save' => __('Save', 'magic-checklists'),
                'saving' => __('Saving...', 'magic-checklists'),
                'pageWillReload' => __('Page will reload automatically', 'magic-checklists'),
                'loadingChecklist' => __('Loading checklist...', 'magic-checklists'),
                'errorLoadingChecklist' => __('Failed to load checklist data', 'magic-checklists'),
                'errorValidatingShortcut' => __('Error validating shortcut:', 'magic-checklists'),
                'errorSavingChecklist' => __('Failed to save checklist. Please try again.', 'magic-checklists'),
                'failedToSaveChecklist' => __('Failed to save checklist', 'magic-checklists'),
            ),
        );
    }

    /**
     * Get NotificationSettings component translations
     * 
     * @return array
     */
    public static function get_notification_settings_translations() {
        return array(
            'notifications' => __('Notifications', 'magic-checklists'),
            'enableNotifications' => __('Enable notifications for this checklist', 'magic-checklists'),
            'notificationMethods' => __('Notification Methods', 'magic-checklists'),
            'notificationMethodsDescription' => __('Please check at least one option for the notifications to work.', 'magic-checklists'),
            'emailNotifications' => __('Email Notifications', 'magic-checklists'),
            'integrationNotifications' => __('Integration Notifications', 'magic-checklists'),
            'emailSettings' => __('Email Settings', 'magic-checklists'),
            'emailRecipients' => __('Email Recipients', 'magic-checklists'),
            'emailRecipientsPlaceholder' => __('email1@example.com, email2@example.com', 'magic-checklists'),
            'emailRecipientsDescription' => __('Enter email addresses separated by commas', 'magic-checklists'),
            'invalidEmailAddresses' => __('Please enter valid email addresses separated by commas', 'magic-checklists'),
            'testEmail' => __('Test Email', 'magic-checklists'),
            'testing' => __('Testing...', 'magic-checklists'),
            'integrationSettings' => __('Integration Settings', 'magic-checklists'),
            'slackWebhookUrl' => __('Slack Webhook URL', 'magic-checklists'),
            'slackWebhookPlaceholder' => __('https://hooks.slack.com/services/...', 'magic-checklists'),
            'validSlackWebhookUrl' => __('Please enter a valid Slack webhook URL', 'magic-checklists'),
            'testSlack' => __('Test Slack', 'magic-checklists'),
            'discordWebhookUrl' => __('Discord Webhook URL', 'magic-checklists'),
            'discordWebhookPlaceholder' => __('https://discord.com/api/webhooks/...', 'magic-checklists'),
            'validDiscordWebhookUrl' => __('Please enter a valid Discord webhook URL', 'magic-checklists'),
            'testDiscord' => __('Test Discord', 'magic-checklists'),
            'notificationTriggers' => __('Notification Triggers', 'magic-checklists'),
            'notificationTriggersDescription' => __('Choose which events should trigger notifications', 'magic-checklists'),
            'newItemAdded' => __('New item added', 'magic-checklists'),
            'itemDeleted' => __('Item deleted', 'magic-checklists'),
            'itemChecked' => __('Item checked', 'magic-checklists'),
            'itemUnchecked' => __('Item unchecked', 'magic-checklists'),
            'deadlineApproaching' => __('Deadline approaching', 'magic-checklists'),
            'commentsAndReplies' => __('Comments and replies', 'magic-checklists'),
            'sendDeadlineNotificationWhen' => __('Send deadline notification when', 'magic-checklists'),
            'hoursRemaining' => __('hours remaining', 'magic-checklists'),
            'notificationFrequency' => __('Notification Frequency', 'magic-checklists'),
            'sendImmediately' => __('Send Immediately', 'magic-checklists'),
            'every15Minutes' => __('Every 15 Minutes', 'magic-checklists'),
            'hourly' => __('Hourly', 'magic-checklists'),
            'dailyDigest' => __('Daily Digest', 'magic-checklists'),
            'selectFrequency' => __('Select frequency...', 'magic-checklists'),
            'chooseFrequencyDescription' => __('Choose how often notifications should be sent', 'magic-checklists'),
            'alerts' => array(
                'noNotificationMethods' => __('No notification methods enabled!', 'magic-checklists'),
                'noNotificationMethodsDescription' => __('Please enable at least one notification method for notifications to work.', 'magic-checklists'),
                'noEmailRecipients' => __('No email recipients!', 'magic-checklists'),
                'noEmailRecipientsDescription' => __('Please add email recipients to receive email notifications.', 'magic-checklists'),
                'noWebhookUrls' => __('No webhook URLs configured!', 'magic-checklists'),
                'noWebhookUrlsDescription' => __('Please add at least one webhook URL for integration notifications.', 'magic-checklists'),
                'enterWebhookUrlFirst' => __('Please enter a webhook URL first', 'magic-checklists'),
                'enterEmailRecipientsFirst' => __('Please enter email recipients first', 'magic-checklists'),
                'webhookTestSuccessful' => __('webhook test successful!', 'magic-checklists'),
                'webhookTestFailed' => __('Webhook test failed:', 'magic-checklists'),
                'webhookTestNetworkError' => __('Webhook test failed due to network error', 'magic-checklists'),
                'testEmailsSentSuccessfully' => __('Test email(s) sent successfully!', 'magic-checklists'),
                'emailTestFailed' => __('Email test failed:', 'magic-checklists'),
                'emailTestNetworkError' => __('Email test failed due to network error', 'magic-checklists'),
                'unknownError' => __('Unknown error', 'magic-checklists'),
            ),
        );
    }

    /**
     * Get ChecklistItems component translations
     * 
     * @return array
     */
    public static function get_checklist_items_translations() {
        return array(
            'header' => self::get_checklist_items_header_translations(),
            'actions' => self::get_checklist_items_actions_translations(),
            'tooltips' => self::get_checklist_items_tooltips_translations(),
            'modals' => self::get_checklist_items_modals_translations(),
            'priorities' => self::get_checklist_items_priorities_translations(),
            'alerts' => self::get_checklist_items_alerts_translations(),
            'timeFormatting' => self::get_checklist_items_time_translations(),
        );
    }

    /**
     * Get ChecklistItems header translations
     * 
     * @return array
     */
    private static function get_checklist_items_header_translations() {
        return array(
            'title' => __('Checklist Items', 'magic-checklists'),
            'description' => __('Add and organize your checklist items', 'magic-checklists'),
            'enablePriorities' => __('Enable Item Priorities', 'magic-checklists'),
            'enable' => __('Enable', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistItems actions translations
     * 
     * @return array
     */
    private static function get_checklist_items_actions_translations() {
        return array(
            'addItem' => __('Add Item', 'magic-checklists'),
            'deleteAll' => __('Delete All', 'magic-checklists'),
            'deleteAllConfirm' => __('Are you sure you want to delete all items?', 'magic-checklists'),
            'noParent' => __('No Parent', 'magic-checklists'),
            'selectParent' => __('Select parent...', 'magic-checklists'),
            'selectPriority' => __('Priority...', 'magic-checklists'),
            'untitledItem' => __('Untitled Item', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistItems tooltips translations
     * 
     * @return array
     */
    private static function get_checklist_items_tooltips_translations() {
        return array(
            'markAsInProgress' => __('Mark as in progress', 'magic-checklists'),
            'removeFromInProgress' => __('Remove from in progress', 'magic-checklists'),
            'setDeadline' => __('Set deadline', 'magic-checklists'),
            'addImage' => __('Add image', 'magic-checklists'),
            'startTour' => __('Start tour from this step', 'magic-checklists'),
            'lockItem' => __('Lock item', 'magic-checklists'),
            'unlockItem' => __('Unlock item', 'magic-checklists'),
            'removeItem' => __('Remove item', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistItems modals translations
     * 
     * @return array
     */
    private static function get_checklist_items_modals_translations() {
        return array(
            'imageModal' => self::get_checklist_items_image_modal_translations(),
            'linkModal' => self::get_checklist_items_link_modal_translations(),
            'deadlinePrompt' => self::get_checklist_items_deadline_prompt_translations(),
        );
    }

    /**
     * Get ChecklistItems image modal translations
     * 
     * @return array
     */
    private static function get_checklist_items_image_modal_translations() {
        return array(
            'insertImage' => __('Insert Image', 'magic-checklists'),
            'uploadOrSelect' => __('Upload or Select Image', 'magic-checklists'),
            'chooseMethod' => __('Choose how you would like to add an image:', 'magic-checklists'),
            'mediaLibrary' => __('WordPress Media Library', 'magic-checklists'),
            'quickUpload' => __('Quick Upload', 'magic-checklists'),
            'uploadNew' => __('Upload New', 'magic-checklists'),
            'selectExisting' => __('Select Existing', 'magic-checklists'),
            'dragDrop' => __('Drag and drop image here or click to select', 'magic-checklists'),
            'fileRestrictions' => __('Maximum file size: 10MB. Supported formats: JPG, PNG, GIF', 'magic-checklists'),
            'loadingImages' => __('Loading images...', 'magic-checklists'),
            'cancel' => __('Cancel', 'magic-checklists'),
            'uploadImage' => __('Upload Image', 'magic-checklists'),
            'uploading' => __('Uploading...', 'magic-checklists'),
            'selectImage' => __('Select Image', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistItems link modal translations
     * 
     * @return array
     */
    private static function get_checklist_items_link_modal_translations() {
        return array(
            'addLink' => __('Add Link', 'magic-checklists'),
            'url' => __('URL', 'magic-checklists'),
            'urlPlaceholder' => __('https://example.com', 'magic-checklists'),
            'text' => __('Text (optional)', 'magic-checklists'),
            'textPlaceholder' => __('Link text', 'magic-checklists'),
            'cancel' => __('Cancel', 'magic-checklists'),
            'addLinkButton' => __('Add Link', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistItems deadline prompt translations
     * 
     * @return array
     */
    private static function get_checklist_items_deadline_prompt_translations() {
        return array(
            'enterDeadline' => __('Enter deadline (YYYY-MM-DD HH:MM):', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistItems priorities translations
     * 
     * @return array
     */
    private static function get_checklist_items_priorities_translations() {
        return array(
            'none' => __('None', 'magic-checklists'),
            'low' => __('Low', 'magic-checklists'),
            'medium' => __('Medium', 'magic-checklists'),
            'high' => __('High', 'magic-checklists'),
            'critical' => __('Critical', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistItems alerts translations
     * 
     * @return array
     */
    private static function get_checklist_items_alerts_translations() {
        return array(
            'invalidFileType' => __('Invalid file type. Please upload a JPG, PNG, or GIF image.', 'magic-checklists'),
            'fileTooLarge' => __('File is too large. Maximum size is 10MB.', 'magic-checklists'),
            'uploadFailed' => __('Upload failed. Please try again.', 'magic-checklists'),
            'selectImageTitle' => __('Select Image', 'magic-checklists'),
        );
    }

    /**
     * Get ChecklistItems time formatting translations
     * 
     * @return array
     */
    private static function get_checklist_items_time_translations() {
        return array(
            'deadlinePassed' => __('Deadline passed', 'magic-checklists'),
            'remaining' => __('remaining', 'magic-checklists'),
            'due' => __('Due:', 'magic-checklists'),
            'daysShort' => __('d', 'magic-checklists'),
            'hoursShort' => __('h', 'magic-checklists'),
            'minutesShort' => __('m', 'magic-checklists'),
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

    /**
     * Get AdminApp component translations
     * 
     * @return array
     */
    public static function get_admin_app_translations() {
        return array(
            'addNew' => __('Add New', 'magic-checklists'),
            'checklists' => __('Checklists', 'magic-checklists'),
            'tours' => __('Tours', 'magic-checklists'),
            'kanbanBoard' => __('Kanban Board', 'magic-checklists'),
            'analytics' => __('Analytics', 'magic-checklists'),
            'settings' => __('Settings', 'magic-checklists'),
            'importExport' => __('Import / Export', 'magic-checklists'),
            'pluginName' => __('MagicChecklists', 'magic-checklists'),
            'allChecklists' => __('All Checklists', 'magic-checklists'),
            'editChecklist' => __('Edit Checklist', 'magic-checklists'),
            'addNewChecklist' => __('Add New Checklist', 'magic-checklists'),
            'editTour' => __('Edit Tour', 'magic-checklists'),
            'license' => __('License', 'magic-checklists'),
            'checklistsDescription' => __('Create and manage interactive checklists that can be accessed from anywhere on your site.', 'magic-checklists'),
            'editChecklistDescription' => __('Modify and update your existing checklist.', 'magic-checklists'),
            'addNewChecklistDescription' => __('Create a new interactive checklist for your site.', 'magic-checklists'),
            'editTourDescription' => __('Configure settings and steps for your interactive tour.', 'magic-checklists'),
            'toursDescription' => __('Create and manage interactive tours to guide users through your WordPress site.', 'magic-checklists'),
            'kanbanDescription' => __('Visualize and manage checklist tasks in a Kanban-style board with drag-and-drop functionality.', 'magic-checklists'),
            'importExportDescription' => __('Import and export classic checklists in various formats.', 'magic-checklists'),
            'analyticsDescription' => __('View performance metrics and usage statistics for your checklists.', 'magic-checklists'),
            'settingsDescription' => __('Configure your MagicChecklists plugin settings.', 'magic-checklists'),
            'licenseDescription' => __('Manage your MagicChecklists license activation.', 'magic-checklists'),
            'sideBySide' => __('Side by Side', 'magic-checklists'),
            'stacked' => __('Stacked', 'magic-checklists'),
            'layout' => __('Layout', 'magic-checklists'),
            'backToList' => __('Back to List', 'magic-checklists'),
            'back' => __('Back', 'magic-checklists'),
            'saveChanges' => __('Save Changes', 'magic-checklists'),
            'saveChecklist' => __('Save Checklist', 'magic-checklists'),
            'backToTours' => __('Back to Tours', 'magic-checklists'),
            'checklistsDescriptionShort' => __('Create and manage interactive checklists.', 'magic-checklists'),
            'addNewChecklistDescriptionShort' => __('Create a new interactive checklist.', 'magic-checklists'),
            'toursDescriptionShort' => __('Create and manage interactive tours.', 'magic-checklists'),
            'kanbanDescriptionShort' => __('Visualize and manage tasks in a Kanban board.', 'magic-checklists'),
            'importExportDescriptionShort' => __('Import and export classic checklists in various formats.', 'magic-checklists'),
            'analyticsDescriptionShort' => __('View performance metrics and usage statistics.', 'magic-checklists'),
            'settingsDescriptionShort' => __('Configure your plugin settings.', 'magic-checklists'),
            'licenseDescriptionShort' => __('Manage your license activation.', 'magic-checklists'),
            'lightMode' => __('Light Mode', 'magic-checklists'),
            'darkMode' => __('Dark Mode', 'magic-checklists'),
            'help' => __('Help', 'magic-checklists'),
            'expandSidebar' => __('Expand sidebar', 'magic-checklists'),
            'collapseSidebar' => __('Collapse sidebar', 'magic-checklists'),
            'switchToLightMode' => __('Switch to light mode', 'magic-checklists'),
            'switchToDarkMode' => __('Switch to dark mode', 'magic-checklists'),
        );
    }

    /**
     * Get App component translations
     * 
     * @return array
     */
    public static function get_app_translations() {
        return array(
            'waitingForReactBridge' => __('MCL: Waiting for React bridge...', 'magic-checklists'),
            'reactBridgeNotFound' => __('React component bridge not found after waiting', 'magic-checklists'),
            'initializationFailed' => __('MCL: Failed to initialize Magic Checklist:', 'magic-checklists'),
            'failedToLoadChecklistData' => __('MCL: Failed to load checklist data:', 'magic-checklists'),
            'failedToFetchChecklistData' => __('MCL: Failed to fetch checklist data', 'magic-checklists'),
            'failedToLoadGeneralSettings' => __('MCL: Failed to load general settings:', 'magic-checklists'),
            'errorLoadingChecklistData' => __('Error loading checklist data:', 'magic-checklists'),
            'legacyDataAvailable' => __('MCL: Legacy mcl_checklists data available:', 'magic-checklists'),
            'errorInitializingShortcode' => __('MCL: Error initializing shortcode:', 'magic-checklists'),
            'errorInitializingDynamicShortcode' => __('MCL: Error initializing dynamic shortcode:', 'magic-checklists'),
            'errorInitializingNestedShortcode' => __('MCL: Error initializing nested shortcode:', 'magic-checklists'),
            'autoInitializationFailed' => __('MCL: Auto-initialization failed:', 'magic-checklists'),
            'failedToReinitializeButtons' => __('MCL: Failed to reinitialize buttons:', 'magic-checklists'),
            'mclDrawerNotAvailable' => __('MCL: mclDrawer not available for button reinitialization', 'magic-checklists'),
        );
    }

    /**
     * Get Settings component translations
     * 
     * @return array
     */
    public static function get_settings_translations() {
        return array(
            'tabs' => array(
                'ariaLabel' => __('Settings tabs', 'magic-checklists'),
                'general' => __('General', 'magic-checklists'),
                'dashboardWidget' => __('Dashboard Widget', 'magic-checklists'),
                'integrations' => __('Integrations', 'magic-checklists'),
            ),
            'errors' => array(
                'fetchFailed' => __('Failed to fetch settings', 'magic-checklists'),
                'loadFailed' => __('Failed to load settings. Please try again.', 'magic-checklists'),
                'loadFailedTitle' => __('Settings Load Failed', 'magic-checklists'),
                'saveFailed' => __('Failed to save settings', 'magic-checklists'),
                'saveFailedRetry' => __('Failed to save settings. Please try again.', 'magic-checklists'),
                'saveFailedTitle' => __('Save Failed', 'magic-checklists'),
            ),
            'success' => array(
                'saved' => __('Settings saved successfully!', 'magic-checklists'),
                'savedTitle' => __('Settings Saved', 'magic-checklists'),
            ),
            'loading' => array(
                'srOnly' => __('Loading settings...', 'magic-checklists'),
            ),
        );
    }

    /**
     * Get Dashboard Settings component translations
     * 
     * @return array
     */
    public static function get_dashboard_settings_translations() {
        return array(
            'title' => __('Dashboard Widget', 'magic-checklists'),
            'description' => __('Configure the MagicChecklists dashboard widget that appears on the WordPress admin dashboard. At least one display option must be enabled for the widget to appear.', 'magic-checklists'),
            'labels' => array(
                'enableWidget' => __('Enable Dashboard Widget', 'magic-checklists'),
                'showChecklists' => __('Show Checklists', 'magic-checklists'),
                'selectChecklists' => __('Select Checklists to Display', 'magic-checklists'),
                'showChecklistItems' => __('Show Checklist Items', 'magic-checklists'),
                'selectChecklist' => __('Select a checklist', 'magic-checklists'),
                'showDeadlines' => __('Show Deadlines', 'magic-checklists'),
                'showTags' => __('Show Tags', 'magic-checklists'),
                'showDescriptions' => __('Show Descriptions', 'magic-checklists'),
                'showQuickActions' => __('Show Quick Actions', 'magic-checklists'),
            ),
            'descriptions' => array(
                'enableWidget' => __('Enable the MagicChecklists widget on the WordPress admin dashboard.', 'magic-checklists'),
                'showChecklists' => __('Display a list of checklists with their current status. Choose which checklists to display below.', 'magic-checklists'),
                'showChecklistItems' => __('Display items from a specific checklist. Select which checklist below.', 'magic-checklists'),
                'showDeadlines' => __('Display upcoming deadlines for checklist items with color-coded urgency.', 'magic-checklists'),
                'showTags' => __('Display tags associated with each checklist.', 'magic-checklists'),
                'showDescriptions' => __('Display a truncated description for each checklist.', 'magic-checklists'),
                'showQuickActions' => __('Display quick action buttons to activate/deactivate checklists directly from the dashboard.', 'magic-checklists'),
            ),
            'buttons' => array(
                'selectAll' => __('Select All', 'magic-checklists'),
                'deselectAll' => __('Deselect All', 'magic-checklists'),
                'saving' => __('Saving...', 'magic-checklists'),
                'save' => __('Save Dashboard Widget Settings', 'magic-checklists'),
            ),
            'messages' => array(
                'noChecklists' => __('No checklists found. Create some checklists first to display them in the widget.', 'magic-checklists'),
                'noChecklistsSelected' => __('No checklists selected. All checklists will be displayed if none are specifically selected.', 'magic-checklists'),
                'checklistsSelected' => __('checklist(s) selected for display.', 'magic-checklists'),
            ),
            'status' => array(
                'active' => __('Active', 'magic-checklists'),
                'inactive' => __('Inactive', 'magic-checklists'),
            ),
            'validation' => array(
                'checklistRequired' => __('At least one checklist must be selected when "Show Checklists" is enabled.', 'magic-checklists'),
            ),
        );
    }

    /**
     * Get Integration Settings component translations
     * 
     * @return array
     */
    public static function get_integration_settings_translations() {
        return array(
            'title' => __('API & Webhook Settings', 'magic-checklists'),
            'description' => __('Enable / disable the API endpoints of MagicChecklists, test webhook URLs and more.', 'magic-checklists'),
            'labels' => array(
                'restApiAccess' => __('REST API Access', 'magic-checklists'),
                'webhookSecret' => __('Webhook Secret', 'magic-checklists'),
                'webhookEndpoints' => __('Webhook Endpoints', 'magic-checklists'),
                'mainwpApiKey' => __('MainWP API Key', 'magic-checklists'),
                'mclApiKey' => __('MagicChecklists API Key', 'magic-checklists'),
                'webhookLogs' => __('Webhook Logs', 'magic-checklists'),
            ),
            'descriptions' => array(
                'restApiAccess' => __('Enable REST API access for MagicChecklists. When disabled, all plugin-specific API endpoints will be inaccessible.', 'magic-checklists'),
                'webhookSecret' => __('This secret key will be used to sign webhook payloads for security verification.', 'magic-checklists'),
                'webhookEndpoints' => __('Add URLs where webhook notifications should be sent when checklist events occur.', 'magic-checklists'),
                'mainwpApiKey' => __('Enter the API key generated from your MainWP dashboard to enable communication between MainWP and MagicChecklists.', 'magic-checklists'),
                'mclApiKey' => __('Generate an API key to allow third-party applications to access your MagicChecklists data through the v2 API endpoints.', 'magic-checklists'),
            ),
            'placeholders' => array(
                'webhookSecret' => __('Enter a secret key for webhook security', 'magic-checklists'),
                'mainwpApiKey' => __('Enter your MainWP API key', 'magic-checklists'),
                'noApiKey' => __('No API key generated', 'magic-checklists'),
            ),
            'buttons' => array(
                'generateSecret' => __('Generate Secret', 'magic-checklists'),
                'test' => __('Test', 'magic-checklists'),
                'remove' => __('Remove', 'magic-checklists'),
                'addEndpoint' => __('Add Endpoint', 'magic-checklists'),
                'hide' => __('Hide', 'magic-checklists'),
                'show' => __('Show', 'magic-checklists'),
                'regenerate' => __('Regenerate', 'magic-checklists'),
                'generate' => __('Generate', 'magic-checklists'),
                'copy' => __('Copy', 'magic-checklists'),
                'clearLogs' => __('Clear Logs', 'magic-checklists'),
                'saving' => __('Saving...', 'magic-checklists'),
                'save' => __('Save Integration Settings', 'magic-checklists'),
            ),
            'confirmations' => array(
                'deleteEndpoint' => __('Are you sure you want to delete this webhook endpoint?', 'magic-checklists'),
                'regenerateApiKey' => __('Are you sure you want to regenerate the API key? This will invalidate the existing key.', 'magic-checklists'),
                'clearLogs' => __('Are you sure you want to clear all webhook logs?', 'magic-checklists'),
            ),
            'messages' => array(
                'connectionSuccess' => __('Connection successful!', 'magic-checklists'),
                'connectionFailed' => __('Connection failed', 'magic-checklists'),
                'unknownError' => __('Unknown error', 'magic-checklists'),
                'networkError' => __('Network error', 'magic-checklists'),
                'apiKeyCopied' => __('API key copied to clipboard!', 'magic-checklists'),
                'logsCleared' => __('Webhook logs cleared successfully!', 'magic-checklists'),
                'noLogsFound' => __('No webhook logs found.', 'magic-checklists'),
            ),
            'titles' => array(
                'webhookTest' => __('Webhook Test', 'magic-checklists'),
                'webhookTestFailed' => __('Webhook Test Failed', 'magic-checklists'),
                'copied' => __('Copied', 'magic-checklists'),
                'logsCleared' => __('Logs Cleared', 'magic-checklists'),
                'clearFailed' => __('Clear Failed', 'magic-checklists'),
            ),
            'errors' => array(
                'clearLogsFailed' => __('Failed to clear logs', 'magic-checklists'),
                'clearLogsError' => __('Failed to clear webhook logs', 'magic-checklists'),
            ),
            'warnings' => array(
                'regenerateApiKey' => __('Warning: Regenerating the API key will invalidate any existing integrations using the current key.', 'magic-checklists'),
            ),
            'table' => array(
                'headers' => array(
                    'time' => __('Time', 'magic-checklists'),
                    'event' => __('Event', 'magic-checklists'),
                    'endpoint' => __('Endpoint', 'magic-checklists'),
                    'status' => __('Status', 'magic-checklists'),
                ),
            ),
        );
    }

    /**
     * Get General Settings component translations
     * 
     * @return array
     */
    public static function get_general_settings_translations() {
        return array(
            'title' => __('General Settings', 'magic-checklists'),
            'description' => __('Configure general plugin settings and behavior.', 'magic-checklists'),
            'labels' => array(
                'checklistNavigation' => __('Checklist Arrow Buttons Navigation', 'magic-checklists'),
                'progressCounter' => __('Progress Counter', 'magic-checklists'),
                'dataCleanup' => __('Data Cleanup', 'magic-checklists'),
                'pluginLanguage' => __('Plugin Language', 'magic-checklists'),
                'useWordPressLanguage' => __('Use WordPress Language (Default)', 'magic-checklists'),
                'speedDialAppearance' => __('Speed Dial Appearance', 'magic-checklists'),
                'backgroundColor' => __('Background Color', 'magic-checklists'),
                'iconColor' => __('Icon Color', 'magic-checklists'),
            ),
            'descriptions' => array(
                'checklistNavigation' => __('Enable navigation arrows to switch between active checklists when the drawer is open.', 'magic-checklists'),
                'progressCounter' => __('Show a progress counter in checklists displaying total items, completed items, and completion percentage.', 'magic-checklists'),
                'dataCleanup' => __('Delete all plugin data when uninstalling MagicChecklists (including checklists, settings, and database tables).', 'magic-checklists'),
                'pluginLanguage' => __('Choose the language for the MagicChecklists plugin interface. This overrides the WordPress language setting for this plugin only.', 'magic-checklists'),
                'speedDialAppearance' => __('Customize the appearance of the speed dial trigger button that appears when multiple checklists have floating buttons enabled.', 'magic-checklists'),
            ),
            'buttons' => array(
                'saving' => __('Saving...', 'magic-checklists'),
                'save' => __('Save General Settings', 'magic-checklists'),
            ),
        );
    }

    /**
     * Get Import/Export component translations
     * 
     * @return array
     */
    public static function get_import_export_translations() {
        return array(
            'titles' => array(
                'importComplete' => __('Import Complete', 'magic-checklists'),
                'exportChecklists' => __('Export Classic Checklists', 'magic-checklists'),
                'importFromText' => __('Import from Text', 'magic-checklists'),
                'importFromJson' => __('Import from JSON', 'magic-checklists'),
                'pdfExportSettings' => __('PDF Export Settings', 'magic-checklists'),
            ),
            'descriptions' => array(
                'importText' => __('Import checklist items from plain text. Enter one item per line.', 'magic-checklists'),
                'importJson' => __('Import a complete checklist from a JSON file exported from MagicChecklists.', 'magic-checklists'),
            ),
            'labels' => array(
                'pasteItems' => __('Paste items (one per line)', 'magic-checklists'),
                'uploadFile' => __('Upload JSON File', 'magic-checklists'),
                'logoUrl' => __('Header Logo URL', 'magic-checklists'),
                'headerText' => __('Header Text', 'magic-checklists'),
                'contactInfo' => __('Contact Information', 'magic-checklists'),
                'footerText' => __('Footer Text', 'magic-checklists'),
            ),
            'placeholders' => array(
                'enterItems' => __('Enter each checklist item on a new line...', 'magic-checklists'),
                'logoUrl' => __('https://example.com/logo.png', 'magic-checklists'),
                'headerText' => __('Header text for your PDF...', 'magic-checklists'),
                'contactInfo' => __('Contact information...', 'magic-checklists'),
                'footerText' => __('Footer text...', 'magic-checklists'),
            ),
            'buttons' => array(
                'editImported' => __('Edit the imported checklist →', 'magic-checklists'),
                'importText' => __('Import Text', 'magic-checklists'),
                'importJson' => __('Import JSON', 'magic-checklists'),
                'cancel' => __('Cancel', 'magic-checklists'),
                'exportPdf' => __('Export PDF', 'magic-checklists'),
            ),
            'messages' => array(
                'importSuccess' => __('Checklist imported successfully!', 'magic-checklists'),
                'pdfExportSuccess' => __('PDF export started! Check your browser downloads.', 'magic-checklists'),
                'noChecklists' => __('No classic checklists found.', 'magic-checklists'),
                'createChecklistsFirst' => __('Create some classic checklists first to enable export functionality.', 'magic-checklists'),
                'dragDropFile' => __('Drag and drop JSON file here or click to select', 'magic-checklists'),
                'jsonOnly' => __('Only .json files are supported', 'magic-checklists'),
            ),
            'errors' => array(
                'importFailed' => __('Failed to import checklist. Please try again.', 'magic-checklists'),
                'loadChecklistsFailed' => __('Failed to load checklists', 'magic-checklists'),
                'loadError' => __('An error occurred while loading checklists', 'magic-checklists'),
                'fileInputNotFound' => __('File input not found. Please try again.', 'magic-checklists'),
                'selectFile' => __('Please select a JSON file to import.', 'magic-checklists'),
                'validJsonFile' => __('Please select a valid JSON file.', 'magic-checklists'),
                'pdfExportFailed' => __('Failed to export PDF', 'magic-checklists'),
            ),
            'loading' => array(
                'checklists' => __('Loading checklists...', 'magic-checklists'),
            ),
            'table' => array(
                'headers' => array(
                    'title' => __('Title', 'magic-checklists'),
                    'items' => __('Items', 'magic-checklists'),
                    'actions' => __('Actions', 'magic-checklists'),
                ),
                'itemsLabel' => __('items', 'magic-checklists'),
            ),
        );
    }

    /**
     * Get License component translations
     * 
     * @return array
     */
    public static function get_license_translations() {
        return array(
            'title' => __('Manage License', 'magic-checklists'),
            'descriptions' => array(
                'enterKey' => __('Enter your license key to activate MagicChecklists.', 'magic-checklists'),
                'activated' => __('Your license is successfully activated for this site.', 'magic-checklists'),
            ),
            'labels' => array(
                'licenseKey' => __('License Key', 'magic-checklists'),
            ),
            'placeholders' => array(
                'enterKey' => __('Enter your license key', 'magic-checklists'),
            ),
            'buttons' => array(
                'activating' => __('Activating...', 'magic-checklists'),
                'activateLicense' => __('Activate License', 'magic-checklists'),
                'deactivating' => __('Deactivating...', 'magic-checklists'),
                'deactivateLicense' => __('Deactivate License', 'magic-checklists'),
            ),
            'messages' => array(
                'activatedOn' => __('Activated on', 'magic-checklists'),
                'deactivateSuccess' => __('License deactivated successfully', 'magic-checklists'),
                'activateSuccess' => __('License activated successfully', 'magic-checklists'),
            ),
            'errors' => array(
                'operationFailed' => __('License operation failed', 'magic-checklists'),
                'processingError' => __('An error occurred while processing the license', 'magic-checklists'),
            ),
            'console' => array(
                'errorLoadingStatus' => __('Error loading license status:', 'magic-checklists'),
                'errorProcessing' => __('Error processing license:', 'magic-checklists'),
            ),
        );
    }

    /**
     * Get ChecklistsTable component translations
     * 
     * @return array
     */
    public static function get_checklists_table_translations() {
        return array(
            'labels' => array(
                'checklist' => __('checklist', 'magic-checklists'),
                'searchChecklists' => __('Search Checklists', 'magic-checklists'),
                'filterByTags' => __('Filter by Tags', 'magic-checklists'),
            ),
            'placeholders' => array(
                'searchByTitleDesc' => __('Search by title, description, type...', 'magic-checklists'),
                'selectTags' => __('Select tags...', 'magic-checklists'),
            ),
            'buttons' => array(
                'noCancel' => __('No, cancel', 'magic-checklists'),
                'yesDelete' => __('Yes, delete', 'magic-checklists'),
                'yesClone' => __('Yes, clone', 'magic-checklists'),
                'tryAgain' => __('Try Again', 'magic-checklists'),
                'clearFilters' => __('Clear Filters', 'magic-checklists'),
                'addNewChecklist' => __('Add New Checklist', 'magic-checklists'),
                'edit' => __('Edit', 'magic-checklists'),
                'clone' => __('Clone', 'magic-checklists'),
                'delete' => __('Delete', 'magic-checklists'),
            ),
            'messages' => array(
                'checklistPrefix' => __('Checklist', 'magic-checklists'),
                'hasBeenPrefix' => __('has been', 'magic-checklists'),
                'activated' => __('activated', 'magic-checklists'),
                'deactivated' => __('deactivated', 'magic-checklists'),
                'successfully' => __('successfully', 'magic-checklists'),
                'hasBeenDeleted' => __('has been deleted', 'magic-checklists'),
                'hasBeenCloned' => __('has been cloned', 'magic-checklists'),
                'deleteConfirmation' => __('Are you sure you want to delete this checklist? This action cannot be undone.', 'magic-checklists'),
                'cloneConfirmation' => __('Are you sure you want to clone this checklist?', 'magic-checklists'),
                'noChecklistsFound' => __('No checklists found', 'magic-checklists'),
                'noChecklistsMatch' => __('No checklists match your filters', 'magic-checklists'),
                'createFirstChecklist' => __('Create your first checklist to get started.', 'magic-checklists'),
                'adjustFilters' => __('Try adjusting your search or filter criteria.', 'magic-checklists'),
            ),
            'titles' => array(
                'checklistPrefix' => __('Checklist', 'magic-checklists'),
                'activated' => __('Activated', 'magic-checklists'),
                'deactivated' => __('Deactivated', 'magic-checklists'),
                'statusUpdateFailed' => __('Status Update Failed', 'magic-checklists'),
                'deleteChecklist' => __('Delete Checklist', 'magic-checklists'),
                'checklistDeleted' => __('Checklist Deleted', 'magic-checklists'),
                'deleteFailed' => __('Delete Failed', 'magic-checklists'),
                'cloneChecklist' => __('Clone Checklist', 'magic-checklists'),
                'checklistCloned' => __('Checklist Cloned', 'magic-checklists'),
                'cloneFailed' => __('Clone Failed', 'magic-checklists'),
            ),
            'errors' => array(
                'fetchFailed' => __('Failed to fetch checklists', 'magic-checklists'),
                'toggleStatusFailed' => __('Failed to toggle status', 'magic-checklists'),
                'updateStatusFailed' => __('Failed to update checklist status. Please try again.', 'magic-checklists'),
                'deleteFailed' => __('Failed to delete checklist', 'magic-checklists'),
                'deleteError' => __('Failed to delete checklist. Please try again.', 'magic-checklists'),
                'cloneFailed' => __('Failed to clone checklist', 'magic-checklists'),
                'cloneError' => __('Failed to clone checklist. Please try again.', 'magic-checklists'),
                'loadingTitle' => __('Error loading checklists', 'magic-checklists'),
            ),
            'loading' => array(
                'checklists' => __('Loading checklists...', 'magic-checklists'),
            ),
            'priorities' => array(
                'urgent' => __('Urgent', 'magic-checklists'),
                'high' => __('High', 'magic-checklists'),
                'normal' => __('Normal', 'magic-checklists'),
                'low' => __('Low', 'magic-checklists'),
                'none' => __('None', 'magic-checklists'),
            ),
            'types' => array(
                'publisher' => __('Publisher', 'magic-checklists'),
                'classic' => __('Classic', 'magic-checklists'),
            ),
            'table' => array(
                'headers' => array(
                    'title' => __('Title', 'magic-checklists'),
                    'type' => __('Type', 'magic-checklists'),
                    'priority' => __('Priority', 'magic-checklists'),
                    'tags' => __('Tags', 'magic-checklists'),
                    'description' => __('Description', 'magic-checklists'),
                    'status' => __('Status', 'magic-checklists'),
                    'shortcut' => __('Shortcut', 'magic-checklists'),
                    'actions' => __('Actions', 'magic-checklists'),
                ),
            ),
        );
    }

    /**
     * Get ChecklistTypeSelector component translations
     * 
     * @return array
     */
    public static function get_checklist_type_selector_translations() {
        return array(
            'header' => array(
                'title' => __('Create New Item', 'magic-checklists'),
                'description' => __('Choose what you want to create. Each type serves different purposes and has unique features.', 'magic-checklists'),
            ),
            'classic' => array(
                'title' => __('Classic Checklist', 'magic-checklists'),
                'description' => __('Traditional checklists with custom items, keyboard shortcuts, and floating buttons. Perfect for personal task management and team collaboration.', 'magic-checklists'),
                'buttonText' => __('Create Classic Checklist', 'magic-checklists'),
                'features' => array(
                    'customItems' => __('Custom checklist items', 'magic-checklists'),
                    'keyboardShortcuts' => __('Keyboard shortcuts', 'magic-checklists'),
                    'floatingButtons' => __('Floating buttons', 'magic-checklists'),
                    'accessControl' => __('Access control', 'magic-checklists'),
                    'themes' => __('Themes and customization', 'magic-checklists'),
                    'shortcode' => __('Shortcode support', 'magic-checklists'),
                ),
            ),
            'publisher' => array(
                'title' => __('Publisher Checklist', 'magic-checklists'),
                'description' => __('Content publishing requirements with automatic verification. Ensure posts and pages meet quality standards before publication.', 'magic-checklists'),
                'buttonText' => __('Create Publisher Checklist', 'magic-checklists'),
                'features' => array(
                    'automaticChecking' => __('Automatic requirement checking', 'magic-checklists'),
                    'wordCount' => __('Word count validation', 'magic-checklists'),
                    'seoRequirements' => __('SEO requirements', 'magic-checklists'),
                    'featuredImage' => __('Featured image verification', 'magic-checklists'),
                    'linksAndTaxonomy' => __('Link and taxonomy checks', 'magic-checklists'),
                    'publishingPrevention' => __('Publishing prevention', 'magic-checklists'),
                ),
            ),
            'tour' => array(
                'title' => __('Tour', 'magic-checklists'),
                'description' => __('Guided tours that lead users through your WordPress admin or frontend. Perfect for onboarding, training, and feature introduction.', 'magic-checklists'),
                'buttonText' => __('Create Interactive Tour', 'magic-checklists'),
                'features' => array(
                    'stepByStep' => __('Step-by-step guidance', 'magic-checklists'),
                    'interactive' => __('Interactive elements', 'magic-checklists'),
                    'conditionalLogic' => __('Conditional logic', 'magic-checklists'),
                    'userTargeting' => __('User targeting', 'magic-checklists'),
                    'progressTracking' => __('Progress tracking', 'magic-checklists'),
                    'visualHighlights' => __('Visual highlights', 'magic-checklists'),
                ),
            ),
        );
    }

    /**
     * Get EditPublisherChecklist component translations
     * 
     * @return array
     */
    public static function get_edit_publisher_checklist_translations() {
        return array(
            'fields' => array(
                'useCustomTip' => __('Use custom tip', 'magic-checklists'),
                'customTip' => __('Custom helpful tip', 'magic-checklists'),
                'minimumWords' => __('Minimum words', 'magic-checklists'),
                'minimumLength' => __('Minimum Length', 'magic-checklists'),
                'maximumLength' => __('Maximum Length', 'magic-checklists'),
                'minimumCategories' => __('Minimum categories', 'magic-checklists'),
                'minimumTags' => __('Minimum tags', 'magic-checklists'),
                'minimumExternalLinks' => __('Minimum external links', 'magic-checklists'),
                'minimumInternalLinks' => __('Minimum internal links', 'magic-checklists'),
                'minimumTitleLength' => __('Minimum title length', 'magic-checklists'),
                'maximumTitleLength' => __('Maximum title length', 'magic-checklists'),
                'minimumExcerptLength' => __('Minimum excerpt length', 'magic-checklists'),
                'maximumExcerptLength' => __('Maximum excerpt length', 'magic-checklists'),
                'minimumMetaDescriptionLength' => __('Minimum meta description length', 'magic-checklists'),
                'maximumMetaDescriptionLength' => __('Maximum meta description length', 'magic-checklists'),
                'minimumMetaTitleLength' => __('Minimum meta title length', 'magic-checklists'),
                'maximumMetaTitleLength' => __('Maximum meta title length', 'magic-checklists'),
                'minimumImages' => __('Minimum images', 'magic-checklists'),
                'fieldName' => __('Field Name', 'magic-checklists'),
                'displayLabel' => __('Display Label', 'magic-checklists'),
                'minimumH2' => __('Minimum H2 headings', 'magic-checklists'),
                'minimumH3' => __('Minimum H3 headings', 'magic-checklists'),
                'minimumH4' => __('Minimum H4 headings', 'magic-checklists'),
                'itemTitle' => __('Item Title', 'magic-checklists'),
                'description' => __('Description', 'magic-checklists'),
                'required' => __('Required', 'magic-checklists'),
                'automaticallyVerified' => __('Automatically verified', 'magic-checklists'),
                'manualVerificationRequired' => __('Manual verification required', 'magic-checklists'),
                'repeatable' => __('Repeatable', 'magic-checklists'),
            ),
            'requirements' => array(
                'wordCount' => array(
                    'label' => __('Minimum Word Count', 'magic-checklists'),
                    'description' => __('Content must have at least [X] words', 'magic-checklists'),
                ),
                'featuredImage' => array(
                    'label' => __('Featured Image', 'magic-checklists'),
                    'description' => __('Post must have a featured image', 'magic-checklists'),
                ),
                'excerpt' => array(
                    'label' => __('Excerpt', 'magic-checklists'),
                    'description' => __('Excerpt must be between [X] and [Y] characters', 'magic-checklists'),
                ),
                'categories' => array(
                    'label' => __('Minimum Categories', 'magic-checklists'),
                    'description' => __('Post must have at least [X] categories', 'magic-checklists'),
                ),
                'tags' => array(
                    'label' => __('Minimum Tags', 'magic-checklists'),
                    'description' => __('Post must have at least [X] tags', 'magic-checklists'),
                ),
                'externalLinks' => array(
                    'label' => __('External Links', 'magic-checklists'),
                    'description' => __('Content must have at least [X] external links', 'magic-checklists'),
                ),
                'internalLinks' => array(
                    'label' => __('Internal Links', 'magic-checklists'),
                    'description' => __('Content must have at least [X] internal links', 'magic-checklists'),
                ),
                'titleLength' => array(
                    'label' => __('Title Length', 'magic-checklists'),
                    'description' => __('Title must be between [X] and [Y] characters', 'magic-checklists'),
                ),
                'metaDescription' => array(
                    'label' => __('Meta Description', 'magic-checklists'),
                    'description' => __('Meta description must be between [X] and [Y] characters', 'magic-checklists'),
                ),
                'metaTitle' => array(
                    'label' => __('Meta Title', 'magic-checklists'),
                    'description' => __('Meta title must be between [X] and [Y] characters', 'magic-checklists'),
                ),
                'imageAltText' => array(
                    'label' => __('Image Alt Text', 'magic-checklists'),
                    'description' => __('All images must have alt text for accessibility', 'magic-checklists'),
                ),
                'headingCount' => array(
                    'label' => __('Heading Count', 'magic-checklists'),
                    'description' => __('Content must have specific heading counts (H2, H3, H4)', 'magic-checklists'),
                ),
                'imageCount' => array(
                    'label' => __('Image Count', 'magic-checklists'),
                    'description' => __('Content must have at least [X] images', 'magic-checklists'),
                ),
                'customField' => array(
                    'label' => __('Custom Field', 'magic-checklists'),
                    'description' => __('Custom field must be filled', 'magic-checklists'),
                ),
                'customItem' => array(
                    'label' => __('Custom Item', 'magic-checklists'),
                    'description' => __('Manual verification required', 'magic-checklists'),
                ),
            ),
            'sections' => array(
                'basicSettings' => __('Basic Settings', 'magic-checklists'),
                'contentRequirements' => __('Content Requirements', 'magic-checklists'),
            ),
            'buttons' => array(
                'addCustomField' => __('Add Custom Field', 'magic-checklists'),
                'addCustomItem' => __('Add Custom Item', 'magic-checklists'),
                'create' => __('Create Publisher Checklist', 'magic-checklists'),
                'update' => __('Update Publisher Checklist', 'magic-checklists'),
                'saveChecklist' => __('Save Checklist', 'magic-checklists'),
                'addCustomRequirement' => __('Add Custom Requirement', 'magic-checklists'),
                'removeRequirement' => __('Remove', 'magic-checklists'),
            ),
            'metaFieldSelector' => array(
                'placeholder' => __('Type or select a custom field...', 'magic-checklists'),
                'loading' => __('Loading...', 'magic-checklists'),
                'noFields' => __('No fields found', 'magic-checklists'),
            ),
            'labels' => array(
                'checklistName' => __('Checklist Name', 'magic-checklists'),
                'description' => __('Description', 'magic-checklists'),
                'preventPublishing' => __('Prevent publishing if requirements are not met', 'magic-checklists'),
                'blockPublishing' => __('Block publishing completely', 'magic-checklists'),
                'showWarning' => __('Show warning only', 'magic-checklists'),
                'postTypes' => __('Post Types', 'magic-checklists'),
                'userRoles' => __('User Roles', 'magic-checklists'),
                'requirements' => __('Requirements', 'magic-checklists'),
                'wordCount' => __('Word Count', 'magic-checklists'),
                'hasExcerpt' => __('Has Excerpt', 'magic-checklists'),
                'hasFeaturedImage' => __('Has Featured Image', 'magic-checklists'),
                'hasCategories' => __('Has Categories', 'magic-checklists'),
                'hasTags' => __('Has Tags', 'magic-checklists'),
                'hasCustomFields' => __('Has Custom Fields', 'magic-checklists'),
                'hasInternalLinks' => __('Has Internal Links', 'magic-checklists'),
                'hasExternalLinks' => __('Has External Links', 'magic-checklists'),
                'seoTitle' => __('SEO Title', 'magic-checklists'),
                'seoDescription' => __('SEO Description', 'magic-checklists'),
                'enableReadabilityChecks' => __('Enable readability checks', 'magic-checklists'),
                'customRequirement' => __('Custom Requirement', 'magic-checklists'),
                'minimumWords' => __('Minimum words', 'magic-checklists'),
                'maximumWords' => __('Maximum words', 'magic-checklists'),
                'minimumLinks' => __('Minimum links', 'magic-checklists'),
                'minimumCategories' => __('Minimum categories', 'magic-checklists'),
                'minimumTags' => __('Minimum tags', 'magic-checklists'),
                'requiredFields' => __('Required fields (comma-separated)', 'magic-checklists'),
                'titleMinLength' => __('Title min length', 'magic-checklists'),
                'titleMaxLength' => __('Title max length', 'magic-checklists'),
                'descriptionMinLength' => __('Description min length', 'magic-checklists'),
                'descriptionMaxLength' => __('Description max length', 'magic-checklists'),
                'customRequirementName' => __('Requirement name', 'magic-checklists'),
                'customRequirementDescription' => __('Description', 'magic-checklists'),
            ),
            'placeholders' => array(
                'checklistName' => __('Enter checklist name', 'magic-checklists'),
                'description' => __('Enter checklist description', 'magic-checklists'),
                'customTip' => __('Enter your custom tip for this requirement...', 'magic-checklists'),
                'selectField' => __('Select a custom field...', 'magic-checklists'),
                'fieldLabel' => __('Label for this field...', 'magic-checklists'),
                'minimumWords' => __('e.g., 300', 'magic-checklists'),
                'maximumWords' => __('e.g., 2000', 'magic-checklists'),
                'minimumLinks' => __('e.g., 2', 'magic-checklists'),
                'minimumCategories' => __('e.g., 1', 'magic-checklists'),
                'minimumTags' => __('e.g., 3', 'magic-checklists'),
                'requiredFields' => __('field1, field2, field3', 'magic-checklists'),
                'titleMinLength' => __('e.g., 30', 'magic-checklists'),
                'titleMaxLength' => __('e.g., 60', 'magic-checklists'),
                'descriptionMinLength' => __('e.g., 120', 'magic-checklists'),
                'descriptionMaxLength' => __('e.g., 160', 'magic-checklists'),
                'customRequirementName' => __('Enter requirement name', 'magic-checklists'),
                'customRequirementDescription' => __('Describe what this requirement checks', 'magic-checklists'),
            ),
            'messages' => array(
                'checklistSaved' => __('Publisher checklist saved successfully!', 'magic-checklists'),
                'selectAtLeastOnePostType' => __('Please select at least one post type', 'magic-checklists'),
                'selectAtLeastOneUserRole' => __('Please select at least one user role', 'magic-checklists'),
                'selectAtLeastOneRequirement' => __('Please select at least one requirement', 'magic-checklists'),
                'checklistNameRequired' => __('Checklist name is required', 'magic-checklists'),
                'validNumberRequired' => __('Please enter a valid number', 'magic-checklists'),
                'positiveNumberRequired' => __('Please enter a positive number', 'magic-checklists'),
                'maxMustBeGreaterThanMin' => __('Maximum value must be greater than minimum value', 'magic-checklists'),
                'customRequirementNameRequired' => __('Custom requirement name is required', 'magic-checklists'),
            ),
            'descriptions' => array(
                'checklistDescription' => __('Describe the purpose of this publishing checklist', 'magic-checklists'),
                'checklistName' => __('This name will be shown in the Gutenberg sidebar when editing posts/pages.', 'magic-checklists'),
                'postTypes' => __('Select which post types this checklist should apply to.', 'magic-checklists'),
                'activeStatus' => __('When active, this checklist will be shown in the Gutenberg editor for the selected post types.', 'magic-checklists'),
                'tips' => __('When enabled, the Gutenberg sidebar will show helpful tips for failed requirements to guide content creators.', 'magic-checklists'),
                'contentRequirements' => __('Configure automatic checks that will verify content quality. Required items will prevent publishing until satisfied.', 'magic-checklists'),
                'preventPublishingDescription' => __('Choose how to handle posts that don\'t meet requirements', 'magic-checklists'),
                'postTypesDescription' => __('Select which post types this checklist applies to', 'magic-checklists'),
                'userRolesDescription' => __('Select which user roles this checklist applies to', 'magic-checklists'),
                'requirementsDescription' => __('Configure publishing requirements and validation rules', 'magic-checklists'),
                'wordCountDescription' => __('Set minimum and maximum word count requirements', 'magic-checklists'),
                'hasExcerptDescription' => __('Require posts to have an excerpt', 'magic-checklists'),
                'hasFeaturedImageDescription' => __('Require posts to have a featured image', 'magic-checklists'),
                'hasCategoriesDescription' => __('Require posts to have categories assigned', 'magic-checklists'),
                'hasTagsDescription' => __('Require posts to have tags assigned', 'magic-checklists'),
                'hasCustomFieldsDescription' => __('Require specific custom fields to be filled', 'magic-checklists'),
                'hasInternalLinksDescription' => __('Require posts to contain internal links', 'magic-checklists'),
                'hasExternalLinksDescription' => __('Require posts to contain external links', 'magic-checklists'),
                'seoTitleDescription' => __('Set SEO title length requirements', 'magic-checklists'),
                'seoDescriptionDescription' => __('Set SEO meta description length requirements', 'magic-checklists'),
                'readabilityChecksDescription' => __('Enable readability score validation (requires SEO plugin)', 'magic-checklists'),
                'customRequirementDescription' => __('Define custom publishing requirements with your own validation logic', 'magic-checklists'),
            ),
            'validation' => array(
                'fieldNameRequired' => __('Field name is required', 'magic-checklists'),
                'itemTitleRequired' => __('Item title is required', 'magic-checklists'),
            ),
            'errors' => array(
                'saveFailed' => __('Failed to save publisher checklist', 'magic-checklists'),
                'loadFailed' => __('Failed to load checklist data', 'magic-checklists'),
                'validationFailed' => __('Please correct the errors above before saving', 'magic-checklists'),
            ),
            'loading' => array(
                'saving' => __('Saving...', 'magic-checklists'),
                'loadingChecklist' => __('Loading checklist...', 'magic-checklists'),
            ),
        );
    }

    /**
     * Get tour playback translations
     * 
     * @return array
     */
    public static function get_tour_playback_translations() {
        return array(
            'noTourData' => __('MCL Tour Playback: No tour data provided', 'magic-checklists'),
            'noTourSteps' => __('MCL Tour Playback: Tour has no steps', 'magic-checklists'),
            'driverNotAvailable' => __('MCL Tour Playback: Driver function not available, retrying...', 'magic-checklists'),
            'driverStillNotAvailable' => __('MCL Tour Playback: Driver function still not available after retry', 'magic-checklists'),
            'clickContinueNextPage' => __('Click "Continue" to go to the next page...', 'magic-checklists'),
            'tourStep' => __('Tour Step', 'magic-checklists'),
            'continue' => __('Continue', 'magic-checklists'),
            'done' => __('Done', 'magic-checklists'),
            'next' => __('Next', 'magic-checklists'),
            'previous' => __('Previous', 'magic-checklists'),
            'errorNextStep' => __('MCL Tour: Error moving to next step', 'magic-checklists'),
            'errorPrevStepSamePage' => __('MCL Tour: Error moving to previous step within page', 'magic-checklists'),
            'errorPrevStep' => __('MCL Tour: Error moving to previous step', 'magic-checklists'),
            'exitConfirmation' => __('Are you sure you want to exit the tour?', 'magic-checklists'),
            'errorCloseConfirmation' => __('MCL Tour: Error in close confirmation:', 'magic-checklists'),
            'errorStartingTour' => __('MCL Tour Playback: Error starting tour:', 'magic-checklists'),
            'errorContinuingTour' => __('MCL Tour Playback: Error continuing tour:', 'magic-checklists'),
            'loadingNextPage' => __('Loading next page...', 'magic-checklists'),
            'closeTour' => __('Close tour', 'magic-checklists'),
            'checkItemMissingParams' => __('MCL Tour: checkChecklistItem - Missing parameters', 'magic-checklists'),
            'failedCheckItem' => __('MCL Tour: Failed to check checklist item', 'magic-checklists'),
            'errorCheckingItem' => __('MCL Tour Playback: Error checking checklist item:', 'magic-checklists'),
            'uncheckItemMissingParams' => __('MCL Tour: uncheckChecklistItem - Missing parameters', 'magic-checklists'),
            'failedUncheckItem' => __('MCL Tour: Failed to uncheck checklist item', 'magic-checklists'),
            'errorUncheckingItem' => __('MCL Tour Playback: Error unchecking checklist item:', 'magic-checklists'),
            'closeModal' => __('Close modal', 'magic-checklists'),
            'exitTourTitle' => __('Exit Tour?', 'magic-checklists'),
            'noContinueTour' => __('No, continue tour', 'magic-checklists'),
            'yesExitTour' => __('Yes, exit tour', 'magic-checklists'),
        );
    }

    /**
     * Get tour creator translations
     * 
     * @return array
     */
    public static function get_tour_creator_translations() {
        return array(
            'failedLoadTourData' => __('Failed to load tour data', 'magic-checklists'),
            'errorLoadingTourData' => __('Error loading tour data:', 'magic-checklists'),
            'previewFailedTimeout' => __('Preview failed: Tour steps could not be loaded in time.', 'magic-checklists'),
            'noStepsForPreview' => __('No tour steps available for preview. Please ensure the tour is loaded.', 'magic-checklists'),
            'invalidStepIndex' => __('Invalid step index for preview:', 'magic-checklists'),
            'tourHasSteps' => __('Tour has', 'magic-checklists'),
            'steps' => __('steps', 'magic-checklists'),
            'previewNotAvailable' => __('Tour preview is not available. Please refresh the page and try again.', 'magic-checklists'),
            'preview' => __('Preview', 'magic-checklists'),
            'previewTour' => __('Preview Tour', 'magic-checklists'),
            'errorLoadingChecklists' => __('Error loading checklists:', 'magic-checklists'),
            'stepDeletedSuccessfully' => __('Step deleted successfully', 'magic-checklists'),
            'tourTitleRequired' => __('Tour title is required to save.', 'magic-checklists'),
            'tourSavedSuccessfully' => __('Tour saved successfully!', 'magic-checklists'),
            'errorSavingTour' => __('Error saving tour', 'magic-checklists'),
            'addStepsBeforePreview' => __('Please add some steps before previewing the tour.', 'magic-checklists'),
            'failedSavePreviewWarning' => __('Failed to save tour data. Preview may not work correctly.', 'magic-checklists'),
            'clickElementToSelect' => __('Click on an element to select it...', 'magic-checklists'),
            'tourCreator' => __('Tour Creator', 'magic-checklists'),
            'selectMode' => __('Select Mode', 'magic-checklists'),
            'navigateMode' => __('Navigate Mode', 'magic-checklists'),
            'navigate' => __('Navigate', 'magic-checklists'),
            'select' => __('Select', 'magic-checklists'),
            'clickElementsToCreateSteps' => __('Click on elements to create tour steps', 'magic-checklists'),
            'navigateNormally' => __('Navigate the site normally - links and forms will work', 'magic-checklists'),
            'saving' => __('Saving...', 'magic-checklists'),
            'save' => __('Save', 'magic-checklists'),
            'exit' => __('Exit', 'magic-checklists'),
            'step' => __('step', 'magic-checklists'),
            'noStepsAdded' => __('No steps added yet. Click on elements to create steps.', 'magic-checklists'),
            'untitledStep' => __('Untitled Step', 'magic-checklists'),
            'noElement' => __('No element', 'magic-checklists'),
            'editTourStep' => __('Edit Tour Step', 'magic-checklists'),
            'stepTitle' => __('Step Title', 'magic-checklists'),
            'enterStepTitle' => __('Enter step title...', 'magic-checklists'),
            'stepContent' => __('Step Content', 'magic-checklists'),
            'enterStepContent' => __('Enter the content for this step...', 'magic-checklists'),
            'canUseHTML' => __('You can use HTML for formatting.', 'magic-checklists'),
            'linkToChecklist' => __('Link to Checklist', 'magic-checklists'),
            'selectChecklistOptional' => __('Select a checklist (optional)', 'magic-checklists'),
            'linkToItem' => __('Link to Item', 'magic-checklists'),
            'selectItemOptional' => __('Select an item (optional)', 'magic-checklists'),
            'popoverPosition' => __('Popover Position', 'magic-checklists'),
            'bottomDefault' => __('Bottom (Default)', 'magic-checklists'),
            'top' => __('Top', 'magic-checklists'),
            'left' => __('Left', 'magic-checklists'),
            'right' => __('Right', 'magic-checklists'),
            'targetElement' => __('Target Element', 'magic-checklists'),
            'cssSelectorPlaceholder' => __('CSS selector (e.g., #my-button)', 'magic-checklists'),
            'clickToSelectElement' => __('Click to select element visually', 'magic-checklists'),
            'enterCssSelectorOrClick' => __('Enter a CSS selector or click the crosshairs to select an element visually.', 'magic-checklists'),
            'pageUrl' => __('Page URL', 'magic-checklists'),
            'leaveEmptyForCurrentPage' => __('Leave empty for current page', 'magic-checklists'),
            'pageUrlDescription' => __('The page where this step should appear. Leave empty to use the current page.', 'magic-checklists'),
            'showNavigationButtons' => __('Show navigation buttons', 'magic-checklists'),
            'cancel' => __('Cancel', 'magic-checklists'),
            'saveStep' => __('Save Step', 'magic-checklists'),
            'exitTourCreatorTitle' => __('Exit Tour Creator?', 'magic-checklists'),
            'exitConfirmMessage' => __('Are you sure you want to exit? Any unsaved changes will be lost.', 'magic-checklists'),
            'yesExit' => __('Yes, exit', 'magic-checklists'),
            'noContinueEditing' => __('No, continue editing', 'magic-checklists'),
            'deleteTourStepTitle' => __('Delete Tour Step?', 'magic-checklists'),
            'deleteStepConfirm' => __('Are you sure you want to delete', 'magic-checklists'),
            'deleteThisStep' => __('Are you sure you want to delete this step?', 'magic-checklists'),
            'yesDelete' => __('Yes, delete', 'magic-checklists'),
            'noKeepIt' => __('No, keep it', 'magic-checklists'),
        );
    }

    /**
     * Get tour editor translations
     * 
     * @return array
     */
    public static function get_tour_editor_translations() {
        return array(
            // Basic Information
            'basicInformation' => __('Basic Information', 'magic-checklists'),
            'tourTitle' => __('Tour Title', 'magic-checklists'),
            'enterTourTitle' => __('Enter tour title...', 'magic-checklists'),
            'tourTitleDescription' => __('Give your tour a descriptive name.', 'magic-checklists'),
            'description' => __('Description', 'magic-checklists'),
            'optionalDescription' => __('Optional description for this tour...', 'magic-checklists'),
            'descriptionHelp' => __('Optional description to help you remember what this tour is for.', 'magic-checklists'),
            'activeLabel' => __('Active (show this tour to users)', 'magic-checklists'),
            'activeDescription' => __('Only active tours will be displayed to users.', 'magic-checklists'),
            
            // Trigger Settings
            'triggerSettings' => __('Trigger Settings', 'magic-checklists'),
            'triggerLocation' => __('Trigger Location', 'magic-checklists'),
            'specificPageUrl' => __('Specific Page URL', 'magic-checklists'),
            'selectTemplateOrCustomUrl' => __('Select a template or enter custom URL', 'magic-checklists'),
            'urlPlaceholder' => __('e.g., /wp-admin/edit.php', 'magic-checklists'),
            'urlHelp' => __('Enter the URL where this tour should trigger. Use * for wildcards.', 'magic-checklists'),
            'whenCssSelectorExists' => __('When CSS Selector Exists', 'magic-checklists'),
            'cssSelectorPlaceholder' => __('e.g., .my-button, #specific-element', 'magic-checklists'),
            'cssSelectorHelp' => __('Tour will trigger when this CSS selector is found on any page.', 'magic-checklists'),
            'usersFirstLogin' => __('User\'s First Login (any page)', 'magic-checklists'),
            'firstLoginHelp' => __('Tour will show only on the user\'s first login to WordPress.', 'magic-checklists'),
            'anyPage' => __('Any Page', 'magic-checklists'),
            'anyPageHelp' => __('Tour can trigger on any page (use with caution).', 'magic-checklists'),
            
            // User Conditions
            'userConditions' => __('User Conditions', 'magic-checklists'),
            'whoShouldSeeTour' => __('Who should see this tour?', 'magic-checklists'),
            'allUsers' => __('All Users (logged in and logged out)', 'magic-checklists'),
            'allLoggedInUsers' => __('All Logged In Users', 'magic-checklists'),
            'allLoggedOutUsers' => __('All Logged Out Users', 'magic-checklists'),
            'specificUsersOnly' => __('Specific Users Only', 'magic-checklists'),
            'selectSpecificUsersHelp' => __('Select specific users who should see this tour.', 'magic-checklists'),
            'typeUsernames' => __('Type usernames...', 'magic-checklists'),
            'specificUserRolesOnly' => __('Specific User Roles Only', 'magic-checklists'),
            'selectUserRolesHelp' => __('Select user roles that should see this tour.', 'magic-checklists'),
            'selectUserRoles' => __('Select user roles...', 'magic-checklists'),
            
            // Display Options
            'displayOptions' => __('Display Options', 'magic-checklists'),
            'autostartTourWhenTriggered' => __('Auto-start tour when triggered', 'magic-checklists'),
            'autostartHelp' => __('If enabled, the tour will start automatically when the trigger conditions are met.', 'magic-checklists'),
            'showOnlyOncePerUser' => __('Show only once per user', 'magic-checklists'),
            'showOnceHelp' => __('If checked, each user will only see this tour once. Tracked by user account or browser cookie.', 'magic-checklists'),
            
            // Appearance & Behavior
            'appearanceBehavior' => __('Appearance & Behavior', 'magic-checklists'),
            'animation' => __('Animation', 'magic-checklists'),
            'enableAnimatedTransitions' => __('Enable animated transitions', 'magic-checklists'),
            'animationHelp' => __('When enabled, the tour will smoothly animate between steps. Disable for a static, instant appearance.', 'magic-checklists'),
            'progressDisplay' => __('Progress Display', 'magic-checklists'),
            'showProgressIndicator' => __('Show progress indicator', 'magic-checklists'),
            'progressTextTemplate' => __('Progress Text Template', 'magic-checklists'),
            'progressPlaceholder' => __('{{current}} of {{total}}', 'magic-checklists'),
            'progressHelp' => __('Customize the progress text. Use {{current}} for current step and {{total}} for total steps.', 'magic-checklists'),
            
            // Exit Control
            'exitControl' => __('Exit Control', 'magic-checklists'),
            'allowUsersToCloseTour' => __('Allow users to close tour', 'magic-checklists'),
            'allowCloseHelp' => __('When disabled, users must complete the entire tour before they can exit.', 'magic-checklists'),
            'showConfirmationDialogBeforeExit' => __('Show confirmation dialog before exit', 'magic-checklists'),
            'exitConfirmationMessage' => __('Exit Confirmation Message', 'magic-checklists'),
            'exitConfirmationPlaceholder' => __('Are you sure you want to exit the tour?', 'magic-checklists'),
            'exitConfirmationHelp' => __('Message shown when users try to exit the tour (only when confirmation is enabled).', 'magic-checklists'),
            
            // Button Text
            'buttonText' => __('Button Text', 'magic-checklists'),
            'nextButtonText' => __('Next Button Text', 'magic-checklists'),
            'nextPlaceholder' => __('Next', 'magic-checklists'),
            'previousButtonText' => __('Previous Button Text', 'magic-checklists'),
            'previousPlaceholder' => __('Previous', 'magic-checklists'),
            'doneButtonText' => __('Done Button Text', 'magic-checklists'),
            'donePlaceholder' => __('Done', 'magic-checklists'),
            'closeButtonText' => __('Close Button Text', 'magic-checklists'),
            'closePlaceholder' => __('Close', 'magic-checklists'),
            'buttonTextHelp' => __('Customize the text displayed on tour navigation buttons.', 'magic-checklists'),
            
            // Default Buttons
            'defaultButtonsToShow' => __('Default Buttons to Show', 'magic-checklists'),
            'nextButton' => __('Next button', 'magic-checklists'),
            'previousButton' => __('Previous button', 'magic-checklists'),
            'closeButton' => __('Close button', 'magic-checklists'),
            'defaultButtonsHelp' => __('Select which buttons should be shown by default on each tour step. Individual steps can override these settings.', 'magic-checklists'),
            
            // Overlay Style
            'overlayStyle' => __('Overlay Style', 'magic-checklists'),
            'overlayColor' => __('Overlay Color', 'magic-checklists'),
            'overlayOpacity' => __('Overlay Opacity', 'magic-checklists'),
            'overlayHelp' => __('Customize the background overlay that appears behind the tour popover.', 'magic-checklists'),
            
            // Popover Style
            'popoverStyle' => __('Popover Style', 'magic-checklists'),
            'customCssClass' => __('Custom CSS Class', 'magic-checklists'),
            'customCssPlaceholder' => __('my-custom-tour-theme', 'magic-checklists'),
            'customCssHelp' => __('Add a custom CSS class to style the popover. Leave empty for default styling. Try: mcl-theme-dark, mcl-theme-primary, mcl-theme-minimal, mcl-theme-rounded, or mcl-theme-large.', 'magic-checklists'),
            
            // Advanced Options
            'advancedOptions' => __('Advanced Options', 'magic-checklists'),
            'highlightPadding' => __('Highlight Padding', 'magic-checklists'),
            'paddingHelp' => __('Padding around highlighted elements in pixels.', 'magic-checklists'),
            'smoothScroll' => __('Smooth Scroll', 'magic-checklists'),
            'smoothScrollHelp' => __('Enable smooth scrolling to highlighted elements.', 'magic-checklists'),
            
            // Tour Steps
            'tourStep' => __('Tour Step', 'magic-checklists'),
            'tourStepsTitle' => __('Tour Steps', 'magic-checklists'),
            'dragToReorder' => __('(drag to reorder)', 'magic-checklists'),
            'noStepsYet' => __('No steps added yet. Use the visual creator to add steps.', 'magic-checklists'),
            'viewAllSteps' => __('View All Steps', 'magic-checklists'),
            
            // Actions
            'saveAndOpenVisualCreator' => __('Save & Open Visual Creator', 'magic-checklists'),
            'saveSettingsOnly' => __('Save Settings Only', 'magic-checklists'),
            'resetMyCompletion' => __('Reset My Completion', 'magic-checklists'),
            'saving' => __('Saving...', 'magic-checklists'),
            'backToTours' => __('Back to Tours', 'magic-checklists'),
            
            // Getting Started / Create Guide
            'gettingStarted' => __('Getting Started', 'magic-checklists'),
            'createYourTour' => __('Create Your Tour', 'magic-checklists'),
            'configureSettings' => __('Configure Settings', 'magic-checklists'),
            'configureSettingsDescription' => __('Set up the basic information, trigger conditions, and customize the appearance.', 'magic-checklists'),
            'addTourSteps' => __('Add Tour Steps', 'magic-checklists'),
            'addTourStepsDescription' => __('Use the visual tour creator to add interactive steps by clicking on elements.', 'magic-checklists'),
            'previewAndTest' => __('Preview & Test', 'magic-checklists'),
            'previewAndTestDescription' => __('Use the preview feature to test your tour and make adjustments.', 'magic-checklists'),
            'testAndActivate' => __('Test & Activate', 'magic-checklists'),
            'testAndActivateDescription' => __('Preview your tour, make adjustments, then activate it for your users.', 'magic-checklists'),
            'configureTrigger' => __('Configure Trigger', 'magic-checklists'),
            'configureTriggerDescription' => __('Choose when and where your tour should appear to users.', 'magic-checklists'),
            'saveAndCreate' => __('Save & Create', 'magic-checklists'),
            'saveAndCreateDescription' => __('Click "Save & Open Visual Creator" to start adding interactive steps.', 'magic-checklists'),
            'addSteps' => __('Add Steps', 'magic-checklists'),
            'addStepsDescription' => __('Use the visual creator to click on elements and create guided tour steps.', 'magic-checklists'),
            'setTourTitle' => __('Set Tour Title', 'magic-checklists'),
            'setTourTitleDescription' => __('Give your tour a descriptive name that explains its purpose.', 'magic-checklists'),
            
            // Additional messages
            'tourSettingsSavedSuccessfully' => __('Tour settings saved successfully!', 'magic-checklists'),
            'errorSavingTourSettings' => __('Error saving tour settings', 'magic-checklists'),
            'errorSavingStepOrder' => __('Error saving step order', 'magic-checklists'),
        );
    }

    /**
     * Get tours list translations
     * 
     * @return array
     */
    public static function get_tours_translations() {
        return array(
            'errorUpdatingTourStatus' => __('Error updating tour status', 'magic-checklists'),
            'tourDuplicatedSuccessfully' => __('Tour duplicated successfully', 'magic-checklists'),
            'errorDuplicatingTour' => __('Error duplicating tour', 'magic-checklists'),
            'tourDeletedSuccessfully' => __('Tour deleted successfully', 'magic-checklists'),
            'errorDeletingTour' => __('Error deleting tour', 'magic-checklists'),
            'tourCompletionResetSuccessfully' => __('Tour completion reset successfully', 'magic-checklists'),
            'errorResettingTourCompletion' => __('Error resetting tour completion', 'magic-checklists'),
            'pageUrl' => __('Page URL', 'magic-checklists'),
            'cssSelector' => __('CSS Selector', 'magic-checklists'),
            'firstLogin' => __('First Login', 'magic-checklists'),
            'anyPage' => __('Any Page', 'magic-checklists'),
            'allUsers' => __('All Users', 'magic-checklists'),
            'loggedIn' => __('Logged In', 'magic-checklists'),
            'loggedOut' => __('Logged Out', 'magic-checklists'),
            'specificUsers' => __('Specific Users', 'magic-checklists'),
            'specificRoles' => __('Specific Roles', 'magic-checklists'),
            'noToursYet' => __('No tours yet', 'magic-checklists'),
            'createFirstTourDescription' => __('Create your first tour to guide users through your WordPress site.', 'magic-checklists'),
            'createYourFirstTour' => __('Create Your First Tour', 'magic-checklists'),
            'title' => __('Title', 'magic-checklists'),
            'steps' => __('Steps', 'magic-checklists'),
            'trigger' => __('Trigger', 'magic-checklists'),
            'status' => __('Status', 'magic-checklists'),
            'date' => __('Date', 'magic-checklists'),
            'actions' => __('Actions', 'magic-checklists'),
            'noTitle' => __('(no title)', 'magic-checklists'),
            'step' => __('step', 'magic-checklists'),
            'autoStart' => __('Auto-start', 'magic-checklists'),
            'active' => __('Active', 'magic-checklists'),
            'inactive' => __('Inactive', 'magic-checklists'),
            'tourSettings' => __('Tour Settings', 'magic-checklists'),
            'openCreator' => __('Open Creator', 'magic-checklists'),
            'duplicate' => __('Duplicate', 'magic-checklists'),
            'resetCompletion' => __('Reset Completion', 'magic-checklists'),
            'delete' => __('Delete', 'magic-checklists'),
            'deleteTourTitle' => __('Delete Tour', 'magic-checklists'),
            'deleteTourConfirm' => __('Are you sure you want to delete the tour', 'magic-checklists'),
            'actionCannotBeUndone' => __('This action cannot be undone.', 'magic-checklists'),
            'deleting' => __('Deleting...', 'magic-checklists'),
            'deleteTour' => __('Delete Tour', 'magic-checklists'),
            'cancel' => __('Cancel', 'magic-checklists'),
        );
    }
    
    /**
     * Get deadline display translations
     * 
     * @return array
     */
    public static function get_deadline_display_translations() {
        return array(
            'deadline' => __('Deadline', 'magic-checklists'),
            'deadlinePassed' => __('Deadline passed', 'magic-checklists'),
            'timeRemaining' => __('Time remaining', 'magic-checklists'),
            'overdue' => __('Overdue', 'magic-checklists'),
            'due' => __('Due', 'magic-checklists'),
            'remaining' => __('remaining', 'magic-checklists'),
            'daysShort' => __('d', 'magic-checklists'),
            'hoursShort' => __('h', 'magic-checklists'),
            'minutesShort' => __('m', 'magic-checklists'),
            'secondsShort' => __('s', 'magic-checklists'),
            'days' => __('days', 'magic-checklists'),
            'hours' => __('hours', 'magic-checklists'),
            'minutes' => __('minutes', 'magic-checklists'),
            'seconds' => __('seconds', 'magic-checklists'),
            'day' => __('day', 'magic-checklists'),
            'hour' => __('hour', 'magic-checklists'),
            'minute' => __('minute', 'magic-checklists'),
            'second' => __('second', 'magic-checklists'),
            'invalidDeadline' => __('Invalid deadline', 'magic-checklists'),
            'noDeadline' => __('No deadline', 'magic-checklists'),
        );
    }
    
    /**
     * Get reset notification translations
     * 
     * @return array
     */
    public static function get_reset_notification_translations() {
        return array(
            'message' => __('This checklist has been automatically reset.', 'magic-checklists'),
        );
    }
    
    /**
     * Get congratulations animation translations
     * 
     * @return array
     */
    public static function get_congrats_animation_translations() {
        return array(
            'message' => __('Great job! 🎉', 'magic-checklists'),
        );
    }
    
    /**
     * Get locked overlay translations
     * 
     * @return array
     */
    public static function get_locked_overlay_translations() {
        return array(
            'message' => __('This checklist is currently locked for editing by another user.', 'magic-checklists'),
        );
    }
}