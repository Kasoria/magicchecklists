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

class MAGICCL_I18n {
    
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
            'loading' => __('Loading...', 'magicchecklists'),
            'error' => __('An error occurred', 'magicchecklists'),
            'save' => __('Save', 'magicchecklists'),
            'cancel' => __('Cancel', 'magicchecklists'),
            'delete' => __('Delete', 'magicchecklists'),
            'edit' => __('Edit', 'magicchecklists'),
            'yes' => __('Yes', 'magicchecklists'),
            'no' => __('No', 'magicchecklists'),
            'ok' => __('OK', 'magicchecklists'),
            'close' => __('Close', 'magicchecklists'),
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
            'totalViews' => __('Total Views', 'magicchecklists'),
            'totalChecks' => __('Total Checks', 'magicchecklists'),
            'activeChecklists' => __('Active Checklists', 'magicchecklists'),
            'totalChecklists' => __('Total Checklists', 'magicchecklists'),
            'usageTrends' => __('Usage Trends', 'magicchecklists'),
            'itemUsageDistribution' => __('Item Usage Distribution', 'magicchecklists'),
            'topPerformingChecklists' => __('Top Performing Checklists', 'magicchecklists'),
            'allChecklistsAnalytics' => __('All Checklists Analytics', 'magicchecklists'),
            'recentActivity' => __('Recent Activity', 'magicchecklists'),
            'clearAnalyticsData' => __('Clear Analytics Data', 'magicchecklists'),
            'checklist' => __('Checklist', 'magicchecklists'),
            'views' => __('Views', 'magicchecklists'),
            'checks' => __('Checks', 'magicchecklists'),
            'lastViewed' => __('Last Viewed', 'magicchecklists'),
            'mostCheckedItems' => __('Most Checked Items', 'magicchecklists'),
            'never' => __('Never', 'magicchecklists'),
            'unknown' => __('Unknown', 'magicchecklists'),
            'noUsageData' => __('No usage data', 'magicchecklists'),
            'noAnalyticsData' => __('No analytics data available yet. Data will appear once your checklists are being used.', 'magicchecklists'),
            'noRecentActivity' => __('No recent activity to display.', 'magicchecklists'),
            'clearAnalyticsDescription' => __('This will permanently delete all analytics data including views, item checks, and activity history.', 'magicchecklists'),
            'clearAllAnalytics' => __('Clear All Analytics', 'magicchecklists'),
            'clearing' => __('Clearing...', 'magicchecklists'),
        );
    }
    
    /**
     * Get time filter translations
     * 
     * @return array
     */
    private static function get_time_filter_translations() {
        return array(
            'last7Days' => __('Last 7 Days', 'magicchecklists'),
            'last30Days' => __('Last 30 Days', 'magicchecklists'),
            'last90Days' => __('Last 90 Days', 'magicchecklists'),
        );
    }
    
    /**
     * Get chart label translations
     * 
     * @return array
     */
    private static function get_chart_label_translations() {
        return array(
            'views' => __('Views', 'magicchecklists'),
            'checks' => __('Checks', 'magicchecklists'),
            'highUsage' => __('High Usage (10+)', 'magicchecklists'),
            'mediumUsage' => __('Medium Usage (3-9)', 'magicchecklists'),
            'lowUsage' => __('Low Usage (1-2)', 'magicchecklists'),
            'unused' => __('Unused', 'magicchecklists'),
        );
    }
    
    /**
     * Get activity message translations
     * 
     * @return array
     */
    private static function get_activity_message_translations() {
        return array(
            'checklistViewed' => __('Checklist "<span class="font-medium">{title}</span>" was viewed', 'magicchecklists'),
            'itemChecked' => __('Item <span class="font-medium">{item}</span> was checked in "<span class="font-medium">{title}</span>"', 'magicchecklists'),
        );
    }
    
    /**
     * Get time ago translations
     * 
     * @return array
     */
    private static function get_time_ago_translations() {
        return array(
            'minute' => __('minute', 'magicchecklists'),
            'minutes' => __('minutes', 'magicchecklists'),
            'hour' => __('hour', 'magicchecklists'),
            'hours' => __('hours', 'magicchecklists'),
            'day' => __('day', 'magicchecklists'),
            'days' => __('days', 'magicchecklists'),
            'ago' => __('ago', 'magicchecklists'),
        );
    }
    
    /**
     * Get clear modal translations
     * 
     * @return array
     */
    private static function get_clear_modal_translations() {
        return array(
            'title' => __('Clear All Analytics Data?', 'magicchecklists'),
            'message' => __('This will permanently delete all analytics data including view counts, item check history, and activity logs. This action cannot be undone.', 'magicchecklists'),
            'confirmButton' => __('Yes, clear all data', 'magicchecklists'),
            'items' => array(
                'viewCounts' => __('All checklist view counts', 'magicchecklists'),
                'checkHistory' => __('All item check history', 'magicchecklists'),
                'activityLogs' => __('All activity logs', 'magicchecklists'),
                'chartData' => __('Chart and trend data', 'magicchecklists'),
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
            'title' => __('Custom Theme Settings', 'magicchecklists'),
            'description' => __('Customize the visual appearance of your checklist drawer.', 'magicchecklists'),
            'sections' => array(
                'colors' => array(
                    'title' => __('Colors', 'magicchecklists'),
                    'backgroundColorLabel' => __('Background Color', 'magicchecklists'),
                    'backgroundColorHelp' => __('Main background color of the drawer', 'magicchecklists'),
                    'listItemBackgroundLabel' => __('List Item Background', 'magicchecklists'),
                    'listItemBackgroundHelp' => __('Background color for checklist items', 'magicchecklists'),
                    'textColorLabel' => __('Text Color', 'magicchecklists'),
                    'textColorHelp' => __('Primary text color', 'magicchecklists'),
                    'descriptionTextColorLabel' => __('Description Text Color', 'magicchecklists'),
                    'descriptionTextColorHelp' => __('Color for description text', 'magicchecklists'),
                ),
                'typography' => array(
                    'title' => __('Typography', 'magicchecklists'),
                    'headingSizeLabel' => __('Heading Size', 'magicchecklists'),
                    'headingSizeHelp' => __('Size of the main title', 'magicchecklists'),
                    'descriptionSizeLabel' => __('Description Size', 'magicchecklists'),
                    'descriptionSizeHelp' => __('Size of description text', 'magicchecklists'),
                    'listItemSizeLabel' => __('List Item Size', 'magicchecklists'),
                    'listItemSizeHelp' => __('Size of checklist item text', 'magicchecklists'),
                ),
                'buttonColors' => array(
                    'title' => __('Button Colors', 'magicchecklists'),
                    'primaryButtonBackgroundLabel' => __('Primary Button Background', 'magicchecklists'),
                    'primaryButtonBackgroundHelp' => __('Background color for primary buttons', 'magicchecklists'),
                    'primaryButtonTextLabel' => __('Primary Button Text', 'magicchecklists'),
                    'primaryButtonTextHelp' => __('Text color for primary buttons', 'magicchecklists'),
                    'secondaryButtonBackgroundLabel' => __('Secondary Button Background', 'magicchecklists'),
                    'secondaryButtonBackgroundHelp' => __('Background color for secondary buttons', 'magicchecklists'),
                    'secondaryButtonTextLabel' => __('Secondary Button Text', 'magicchecklists'),
                    'secondaryButtonTextHelp' => __('Text color for secondary buttons', 'magicchecklists'),
                ),
                'checkboxStyle' => array(
                    'title' => __('Checkbox Style', 'magicchecklists'),
                    'checkboxBackgroundLabel' => __('Checkbox Background', 'magicchecklists'),
                    'checkboxBackgroundHelp' => __('Background color of checkboxes', 'magicchecklists'),
                    'borderRadiusLabel' => __('Checkbox Border Radius', 'magicchecklists'),
                    'borderRadiusHelp' => __('Rounded corners for checkboxes', 'magicchecklists'),
                    'checkmarkStyleLabel' => __('Checkmark Style', 'magicchecklists'),
                    'standardOption' => __('Standard', 'magicchecklists'),
                    'customImageOption' => __('Custom Image', 'magicchecklists'),
                    'placeholder' => __('Select checkmark style...', 'magicchecklists'),
                    'description' => __('Choose between standard checkmark or custom image', 'magicchecklists'),
                    'customIconTitle' => __('Custom Checkmark Icon', 'magicchecklists'),
                    'currentIconLabel' => __('Current icon', 'magicchecklists'),
                    'changeImageButton' => __('Change Image', 'magicchecklists'),
                    'selectImageButton' => __('Select Image Button', 'magicchecklists'),
                    'removeButton' => __('Remove', 'magicchecklists'),
                    'iconRecommendation' => __('Recommended: 24x24px PNG or SVG with transparency', 'magicchecklists'),
                    'checkmarkColorLabel' => __('Checkmark Color', 'magicchecklists'),
                    'checkmarkColorHelp' => __('Color of the standard checkmark', 'magicchecklists'),
                ),
                'drawerStyle' => array(
                    'title' => __('Drawer Style', 'magicchecklists'),
                    'borderRadiusLabel' => __('Border Radius', 'magicchecklists'),
                    'borderRadiusHelp' => __('Rounded corners for the drawer', 'magicchecklists'),
                ),
                'dimensions' => array(
                    'title' => __('Dimensions', 'magicchecklists'),
                    'drawerWidthLabel' => __('Drawer Width', 'magicchecklists'),
                    'drawerWidthHelp' => __('Maximum width of the drawer', 'magicchecklists'),
                    'drawerHeightLabel' => __('Drawer Height', 'magicchecklists'),
                    'drawerHeightHelp' => __('Maximum height of the drawer', 'magicchecklists'),
                ),
                'floatingButton' => array(
                    'title' => __('Floating Button Settings', 'magicchecklists'),
                    'buttonBackgroundLabel' => __('Button Background', 'magicchecklists'),
                    'buttonBackgroundHelp' => __('Background color of floating button', 'magicchecklists'),
                    'buttonTextColorLabel' => __('Button Text Color', 'magicchecklists'),
                    'buttonTextColorHelp' => __('Text color of floating button', 'magicchecklists'),
                    'textSizeLabel' => __('Text Size', 'magicchecklists'),
                    'textSizeHelp' => __('Font size for button text', 'magicchecklists'),
                    'showIconLabel' => __('Show Checklist Icon', 'magicchecklists'),
                    'showIconDescription' => __('Display a checklist icon alongside the button text', 'magicchecklists'),
                ),
            ),
            'validation' => array(
                'fontSizeRange' => __('Font size must be between 10 and 50 pixels', 'magicchecklists'),
                'widthRange' => __('Width must be between 400 and 2000 pixels', 'magicchecklists'),
                'heightRange' => __('Height must be between 350 and 2000 pixels', 'magicchecklists'),
                'invalidHexColor' => __('Please enter a valid hex color (e.g., #ffffff)', 'magicchecklists'),
                'errorSummary' => __('Please fix the following errors:', 'magicchecklists'),
            ),
            'mediaUploader' => array(
                'title' => __('Select Custom Checkmark Icon', 'magicchecklists'),
                'buttonText' => __('Use This Image', 'magicchecklists'),
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
                'selectChecklistLabel' => __('Select Checklist:', 'magicchecklists'),
                'chooseChecklistOption' => __('Choose a checklist...', 'magicchecklists'),
                'addColumnButton' => __('Add Column', 'magicchecklists'),
                'featureBoardSettingsButton' => __('Feature Board', 'magicchecklists'),
                'ideaSubmissionsButton' => __('Idea Submissions', 'magicchecklists'),
            ),
            'column' => array(
                'editButton' => __('Edit Column', 'magicchecklists'),
                'deleteButton' => __('Delete Column', 'magicchecklists'),
            ),
            'item' => array(
                'assignButton' => __('Assign', 'magicchecklists'),
                'commentSingular' => __('comment', 'magicchecklists'),
                'commentPlural' => __('comments', 'magicchecklists'),
            ),
            'modals' => array(
                'editColumnTitle' => __('Edit Column', 'magicchecklists'),
                'addColumnTitle' => __('Add New Column', 'magicchecklists'),
                'cancelButton' => __('Cancel', 'magicchecklists'),
                'updateColumnButton' => __('Update Column', 'magicchecklists'),
                'addColumnButton' => __('Add Column', 'magicchecklists'),
                'columnTitleLabel' => __('Column Title', 'magicchecklists'),
                'columnTitlePlaceholder' => __('Enter column title...', 'magicchecklists'),
                'columnColorLabel' => __('Column Color', 'magicchecklists'),
                'assignUserTitle' => __('Assign User', 'magicchecklists'),
                'saveAssignmentButton' => __('Save Assignment', 'magicchecklists'),
                'selectUserLabel' => __('Select User', 'magicchecklists'),
                'unassignedOption' => __('Unassigned', 'magicchecklists'),
                'editTaskTitle' => __('Edit Task', 'magicchecklists'),
                'saveTaskButton' => __('Save Task', 'magicchecklists'),
                'taskContentLabel' => __('Task Content', 'magicchecklists'),
                'boldTitle' => __('Bold', 'magicchecklists'),
                'italicTitle' => __('Italic', 'magicchecklists'),
                'underlineTitle' => __('Underline', 'magicchecklists'),
                'addImageTitle' => __('Add Image', 'magicchecklists'),
                'commentsLabel' => __('Comments', 'magicchecklists'),
                'addCommentPlaceholder' => __('Add a comment...', 'magicchecklists'),
                'ctrlEnterToPost' => __('Ctrl+Enter to post', 'magicchecklists'),
                'commentButton' => __('Comment', 'magicchecklists'),
                'loadingComments' => __('Loading comments...', 'magicchecklists'),
                'noCommentsYet' => __('No comments yet. Be the first to comment!', 'magicchecklists'),
                'deleteColumnTitle' => __('Delete Column', 'magicchecklists'),
                'deleteColumnMessage' => __('Are you sure you want to delete the column "{columnTitle}"?', 'magicchecklists'),
                'deleteColumnConfirm' => __('Delete Column', 'magicchecklists'),
                'deleteColumnWarning' => __('This will also delete {itemCount} items in this column', 'magicchecklists'),
            ),
            'comment' => array(
                'deleteTitle' => __('Delete comment', 'magicchecklists'),
                'replyButton' => __('Reply', 'magicchecklists'),
                'replyPlaceholder' => __('Write a reply...', 'magicchecklists'),
                'cancelButton' => __('Cancel', 'magicchecklists'),
                'replySubmitButton' => __('Reply', 'magicchecklists'),
            ),
            'time' => array(
                'justNow' => __('just now', 'magicchecklists'),
                'minutesAgo' => __('{minutes}m ago', 'magicchecklists'),
                'hoursAgo' => __('{hours}h ago', 'magicchecklists'),
                'daysAgo' => __('{days}d ago', 'magicchecklists'),
            ),
            'prompts' => array(
                'enterImageUrl' => __('Enter image URL:', 'magicchecklists'),
            ),
            'confirm' => array(
                'deleteComment' => __('Are you sure you want to delete this comment and all its replies?', 'magicchecklists'),
            ),
            'errors' => array(
                'loadChecklistsFailed' => __('Failed to load checklists', 'magicchecklists'),
                'loadBoardFailed' => __('Failed to load Kanban board', 'magicchecklists'),
                'moveItemFailed' => __('Failed to move item', 'magicchecklists'),
                'columnTitleRequired' => __('Column title is required', 'magicchecklists'),
                'saveColumnFailed' => __('Failed to save column', 'magicchecklists'),
                'taskContentRequired' => __('Task content is required', 'magicchecklists'),
                'saveTaskFailed' => __('Failed to save task', 'magicchecklists'),
                'addCommentFailed' => __('Failed to add comment', 'magicchecklists'),
                'addReplyFailed' => __('Failed to add reply', 'magicchecklists'),
                'toggleLikeFailed' => __('Failed to toggle like', 'magicchecklists'),
                'deleteCommentFailed' => __('Failed to delete comment', 'magicchecklists'),
                'assignUserFailed' => __('Failed to assign user', 'magicchecklists'),
                'updateItemStateFailed' => __('Failed to update item state', 'magicchecklists'),
            ),
            'success' => array(
                'itemMoved' => __('Item moved successfully', 'magicchecklists'),
                'columnUpdated' => __('Column updated', 'magicchecklists'),
                'columnAdded' => __('Column added', 'magicchecklists'),
                'columnDeleted' => __('Column deleted', 'magicchecklists'),
                'taskUpdated' => __('Task updated successfully', 'magicchecklists'),
                'commentAdded' => __('Comment added successfully', 'magicchecklists'),
                'replyAdded' => __('Reply added successfully', 'magicchecklists'),
                'commentDeleted' => __('Comment deleted successfully', 'magicchecklists'),
                'userAssignmentUpdated' => __('User assignment updated', 'magicchecklists'),
                'itemChecked' => __('Item checked', 'magicchecklists'),
                'itemUnchecked' => __('Item unchecked', 'magicchecklists'),
            ),
            'featureBoard' => array(
                // Header buttons
                'featureBoardSettingsButton' => __('Feature Board', 'magicchecklists'),
                'ideaSubmissionsButton' => __('Idea Submissions', 'magicchecklists'),
                'submitIdeaButton' => __('Submit Idea', 'magicchecklists'),

                // Settings modal
                'settingsTitle' => __('Feature Board Settings', 'magicchecklists'),
                'saving' => __('Saving...', 'magicchecklists'),
                'saveButton' => __('Save Settings', 'magicchecklists'),
                'settingsSaved' => __('Feature board settings saved', 'magicchecklists'),
                'saveFailed' => __('Failed to save settings', 'magicchecklists'),

                // Enable toggle
                'enableLabel' => __('Enable Feature Board', 'magicchecklists'),
                'enableDescription' => __('Allow public visitors to interact with this board', 'magicchecklists'),

                // Upvote settings
                'upvoteSettings' => __('Upvote Settings', 'magicchecklists'),
                'upvoteModeLabel' => __('Who can upvote?', 'magicchecklists'),
                'upvoteModeAnyone' => __('Anyone (no login required)', 'magicchecklists'),
                'upvoteModeLoggedIn' => __('Logged-in users only', 'magicchecklists'),
                'upvoteModeEmailVerified' => __('Email verification required', 'magicchecklists'),
                'requireVerificationLabel' => __('Require email verification before counting upvote', 'magicchecklists'),
                'showUpvoteCountLabel' => __('Show upvote count on items', 'magicchecklists'),
                'upvoteTitle' => __('Upvote this item', 'magicchecklists'),

                // Upvote protection for anonymous users
                'anonUpvoteProtection' => __('Anonymous Upvote Protection', 'magicchecklists'),
                'anonUpvoteProtectionDesc' => __('Prevent users from upvoting multiple times without logging in.', 'magicchecklists'),
                'localStorageCheckLabel' => __('Browser storage check (localStorage)', 'magicchecklists'),
                'localStorageCheckDesc' => __('Remembers upvotes in the browser. Can be bypassed by clearing browser data or using incognito mode.', 'magicchecklists'),
                'ipCheckLabel' => __('IP address check (server-side)', 'magicchecklists'),
                'ipCheckDesc' => __('Stores hashed IP addresses to prevent duplicate upvotes. More reliable than browser storage.', 'magicchecklists'),
                'gdprNotice' => __('GDPR Notice:', 'magicchecklists'),
                'gdprNoticeText' => __('Even hashed IP addresses may be considered personal data under GDPR. Ensure you have appropriate consent mechanisms and privacy policy disclosures if enabling this option for EU visitors.', 'magicchecklists'),

                // Comment settings
                'commentSettings' => __('Comment Settings', 'magicchecklists'),
                'commentModeLabel' => __('Who can comment?', 'magicchecklists'),
                'commentModeAnyone' => __('Anyone (no login required)', 'magicchecklists'),
                'commentModeLoggedIn' => __('Logged-in users only', 'magicchecklists'),
                'commentModeDisabled' => __('Comments disabled', 'magicchecklists'),
                'showCommentCountLabel' => __('Show comment count on items', 'magicchecklists'),

                // Idea submission settings
                'ideaSubmissionSettings' => __('Idea Submission Settings', 'magicchecklists'),
                'enableIdeaSubmission' => __('Allow visitors to submit new ideas', 'magicchecklists'),
                'ideaSubmissionModeLabel' => __('Who can submit ideas?', 'magicchecklists'),
                'ideaModeAnyone' => __('Anyone (no login required)', 'magicchecklists'),
                'ideaModeLoggedIn' => __('Logged-in users only', 'magicchecklists'),
                'defaultColumnLabel' => __('Default column for new ideas', 'magicchecklists'),
                'selectColumn' => __('Select a column...', 'magicchecklists'),
                'enableModerationLabel' => __('Require admin approval before publishing ideas', 'magicchecklists'),

                // Idea submission modal (frontend)
                'submitIdeaTitle' => __('Submit Your Idea', 'magicchecklists'),
                'ideaTitleLabel' => __('Title', 'magicchecklists'),
                'ideaTitlePlaceholder' => __('Enter your idea title...', 'magicchecklists'),
                'ideaDescriptionLabel' => __('Description (optional)', 'magicchecklists'),
                'ideaDescriptionPlaceholder' => __('Describe your idea in detail...', 'magicchecklists'),
                'submitting' => __('Submitting...', 'magicchecklists'),
                'moderationNotice' => __('Your idea will be reviewed by our team before being published.', 'magicchecklists'),

                // Email prompt modal
                'loginRequiredTitle' => __('Login Required', 'magicchecklists'),
                'loginRequiredMessage' => __('Please log in to perform this action.', 'magicchecklists'),
                'loginButton' => __('Log In', 'magicchecklists'),
                'emailPromptTitle' => __('Enter Your Details', 'magicchecklists'),
                'emailPromptUpvote' => __('Enter your email to upvote this item.', 'magicchecklists'),
                'emailPromptIdea' => __('Enter your details to submit your idea.', 'magicchecklists'),
                'nameLabel' => __('Name', 'magicchecklists'),
                'namePlaceholder' => __('Your name (optional)', 'magicchecklists'),
                'emailLabel' => __('Email', 'magicchecklists'),
                'emailPlaceholder' => __('your@email.com', 'magicchecklists'),
                'emailVerificationNotice' => __('A verification link will be sent to your email.', 'magicchecklists'),
                'emailVerificationSent' => __('Please check your email to verify your upvote', 'magicchecklists'),
                'continueButton' => __('Continue', 'magicchecklists'),

                // Idea submissions modal (admin)
                'ideaSubmissionsTitle' => __('Idea Submissions', 'magicchecklists'),
                'noIdeas' => __('No pending idea submissions', 'magicchecklists'),
                'submittedBy' => __('Submitted by', 'magicchecklists'),
                'approveButton' => __('Approve', 'magicchecklists'),
                'rejectButton' => __('Reject', 'magicchecklists'),
                'ideaApproved' => __('Idea approved and added to board', 'magicchecklists'),
                'approveFailed' => __('Failed to approve idea', 'magicchecklists'),
                'ideaRejected' => __('Idea rejected', 'magicchecklists'),
                'rejectFailed' => __('Failed to reject idea', 'magicchecklists'),
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
                'title' => __('Shortcode Settings', 'magicchecklists'),
            ),
            'shortcode' => array(
                'label' => __('Shortcode', 'magicchecklists'),
                'copyButton' => __('Copy', 'magicchecklists'),
            ),
            'displayOptions' => array(
                'title' => __('Display Options', 'magicchecklists'),
                'showTitle' => __('Show Title', 'magicchecklists'),
                'showDescription' => __('Show Description', 'magicchecklists'),
                'showDeadline' => __('Show Deadline', 'magicchecklists'),
                'showPriority' => __('Show Priority Indicators', 'magicchecklists'),
                'showNumbers' => __('Show Item Numbers', 'magicchecklists'),
            ),
            'styleColors' => array(
                'title' => __('Style Options - Colors', 'magicchecklists'),
                'titleTextColor' => __('Title Text Color', 'magicchecklists'),
                'descriptionTextColor' => __('Description Text Color', 'magicchecklists'),
                'deadlineTextColor' => __('Deadline Text Color', 'magicchecklists'),
                'listItemTextColor' => __('List Item Text Color', 'magicchecklists'),
                'backgroundColor' => __('Background Color', 'magicchecklists'),
                'borderColor' => __('Border Color', 'magicchecklists'),
                'checkboxBorderColor' => __('Checkbox Border Color', 'magicchecklists'),
                'checkboxColorFilled' => __('Checkbox Color Filled', 'magicchecklists'),
                'checkboxColorUnfilled' => __('Checkbox Color Unfilled', 'magicchecklists'),
                'checkmarkColor' => __('Checkmark Color', 'magicchecklists'),
            ),
            'styleSpacing' => array(
                'title' => __('Style Options - Spacing & Dimensions', 'magicchecklists'),
                'verticalPadding' => __('Container Vertical Padding', 'magicchecklists'),
                'horizontalPadding' => __('Container Horizontal Padding', 'magicchecklists'),
                'containerGap' => __('Container Gap', 'magicchecklists'),
                'checkboxDimensions' => __('Checkbox Dimensions', 'magicchecklists'),
                'checkboxBorderRadius' => __('Checkbox Border Radius', 'magicchecklists'),
                'checkboxBorderThickness' => __('Checkbox Border Thickness', 'magicchecklists'),
                'borderType' => __('Border Type', 'magicchecklists'),
                'borderTypeNone' => __('None', 'magicchecklists'),
                'borderTypeSolid' => __('Solid', 'magicchecklists'),
                'borderTypeDashed' => __('Dashed', 'magicchecklists'),
                'borderTypeDotted' => __('Dotted', 'magicchecklists'),
                'selectBorderType' => __('Select border type...', 'magicchecklists'),
                'borderRadius' => __('Border Radius', 'magicchecklists'),
                'borderThickness' => __('Border Thickness', 'magicchecklists'),
                'itemSpacing' => __('Item Spacing', 'magicchecklists'),
                'spacingCompact' => __('Compact', 'magicchecklists'),
                'spacingComfortable' => __('Comfortable', 'magicchecklists'),
                'spacingSpaciuous' => __('Spacious', 'magicchecklists'),
                'selectSpacing' => __('Select spacing...', 'magicchecklists'),
            ),
            'styleTypography' => array(
                'title' => __('Style Options - Typography', 'magicchecklists'),
                'titleFontSize' => __('Title Font Size', 'magicchecklists'),
                'descriptionFontSize' => __('Description Font Size', 'magicchecklists'),
                'listItemFontSize' => __('List Item Font Size', 'magicchecklists'),
                'deadlineFontSize' => __('Deadline Font Size', 'magicchecklists'),
            ),
            'behaviorOptions' => array(
                'title' => __('Behavior Options', 'magicchecklists'),
                'containerWidth' => __('Container Width', 'magicchecklists'),
                'widthFull' => __('Full Width', 'magicchecklists'),
                'widthNarrow' => __('Narrow (600px)', 'magicchecklists'),
                'widthCustom' => __('Custom', 'magicchecklists'),
                'selectWidth' => __('Select width...', 'magicchecklists'),
                'customWidth' => __('Custom Width', 'magicchecklists'),
                'checkedStateStorage' => __('Checked State Storage', 'magicchecklists'),
                'storageSession' => __('Session Storage', 'magicchecklists'),
                'storageLocal' => __('Local Storage', 'magicchecklists'),
                'storageGlobal' => __('Global (Database)', 'magicchecklists'),
                'selectStorageType' => __('Select storage type...', 'magicchecklists'),
                'disableDrawer' => __('Disable Drawer for this Checklist', 'magicchecklists'),
                'allowReordering' => __('Allow Item Reordering', 'magicchecklists'),
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
                'expired' => __('Expired', 'magicchecklists'),
            ),
            'deadline' => array(
                'enterPrompt' => __('Enter deadline (YYYY-MM-DD HH:MM):', 'magicchecklists'),
                'dueLabel' => __('Due', 'magicchecklists'),
            ),
            'image' => array(
                'enterUrlPrompt' => __('Enter image URL:', 'magicchecklists'),
            ),
            'tooltips' => array(
                'removeFromProgress' => __('Remove from in progress', 'magicchecklists'),
                'markAsProgress' => __('Mark as in progress', 'magicchecklists'),
                'setDeadline' => __('Set deadline', 'magicchecklists'),
                'addImage' => __('Add image', 'magicchecklists'),
                'removeItem' => __('Remove item', 'magicchecklists'),
            ),
            'buttons' => array(
                'addItem' => __('Add Item', 'magicchecklists'),
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
            'title' => __('Public Access', 'magicchecklists'),
            'description' => __('Enable this if you want any website visitor without authentication to have access to the checklist.', 'magicchecklists'),
            'publicDescription' => __('Public Description', 'magicchecklists'),
            'publicDescriptionPlaceholder' => __('Description visible to public users', 'magicchecklists'),
            'checkedStateHandling' => __('Public Checked State Handling', 'magicchecklists'),
            'perUser' => __('Per User (using browser storage)', 'magicchecklists'),
            'global' => __('Global (shared between all users)', 'magicchecklists'),
            'accessLevel' => __('Public Access Level', 'magicchecklists'),
        );
    }

    /**
     * Get rate limiting translations
     * 
     * @return array
     */
    private static function get_rate_limiting_translations() {
        return array(
            'title' => __('Enable Rate Limiting', 'magicchecklists'),
            'description' => __('Limit how frequently users can perform actions on this checklist.', 'magicchecklists'),
        );
    }

    /**
     * Get user roles translations
     * 
     * @return array
     */
    private static function get_user_roles_translations() {
        return array(
            'title' => __('Allowed User Roles', 'magicchecklists'),
            'placeholder' => __('Select user roles', 'magicchecklists'),
            'permissionLevel' => __('Permission Level', 'magicchecklists'),
            'permissionPlaceholder' => __('Select permission level...', 'magicchecklists'),
            'description' => __('Select the user roles that are allowed to access this checklist and their permission level.', 'magicchecklists'),
        );
    }

    /**
     * Get individual users translations
     * 
     * @return array
     */
    private static function get_individual_users_translations() {
        return array(
            'title' => __('Allowed Users', 'magicchecklists'),
            'placeholder' => __('Select individual users', 'magicchecklists'),
            'permissionLevel' => __('Permission Level', 'magicchecklists'),
            'permissionPlaceholder' => __('Select permission level...', 'magicchecklists'),
            'description' => __('Select individual users who are allowed to access this checklist and their permission level.', 'magicchecklists'),
        );
    }

    /**
     * Get invite links translations
     * 
     * @return array
     */
    private static function get_invite_links_translations() {
        return array(
            'title' => __('Invite Links', 'magicchecklists'),
            'description' => __('Generate invite links to share this checklist with anyone, even if they don\'t have a WordPress account.', 'magicchecklists'),
            'saveFirstBadge' => __('Save checklist first to enable', 'magicchecklists'),
            'saveFirstError' => __('Please save the checklist first to generate invite links', 'magicchecklists'),
            'permissionLevel' => __('Permission Level', 'magicchecklists'),
            'expiresAfter' => __('Expires After', 'magicchecklists'),
            'usageLimit' => __('Usage Limit', 'magicchecklists'),
            'usageLimitPlaceholder' => __('0 for unlimited', 'magicchecklists'),
            'usageLimitNote' => __('Set to 0 for unlimited uses', 'magicchecklists'),
            'generateButton' => __('Generate Invite Link', 'magicchecklists'),
            'generating' => __('Generating...', 'magicchecklists'),
            'loadingLinks' => __('Loading invite links...', 'magicchecklists'),
            'existingLinks' => __('Existing Invite Links', 'magicchecklists'),
            'expired' => __('Expired', 'magicchecklists'),
            'limitReached' => __('Limit Reached', 'magicchecklists'),
            'linkLabel' => __('Link:', 'magicchecklists'),
            'uses' => __('Uses:', 'magicchecklists'),
            'created' => __('Created:', 'magicchecklists'),
            'expires' => __('Expires:', 'magicchecklists'),
            'copyButton' => __('Copy', 'magicchecklists'),
            'deleteButton' => __('Delete', 'magicchecklists'),
            'deleteConfirm' => __('Are you sure you want to delete this invite link?', 'magicchecklists'),
            'generatedSuccess' => __('Invite link generated and copied to clipboard!', 'magicchecklists'),
            'copiedSuccess' => __('Link copied to clipboard!', 'magicchecklists'),
            'deleteSuccess' => __('Invite link deleted successfully', 'magicchecklists'),
            'generateError' => __('Failed to generate invite link:', 'magicchecklists'),
            'copyError' => __('Failed to copy link to clipboard', 'magicchecklists'),
            'deleteError' => __('Failed to delete invite link:', 'magicchecklists'),
            'loadError' => __('Failed to load invite links', 'magicchecklists'),
            'unknownError' => __('Unknown error', 'magicchecklists'),
            'oneDayLabel' => __('1 Day', 'magicchecklists'),
            'sevenDaysLabel' => __('7 Days', 'magicchecklists'),
            'thirtyDaysLabel' => __('30 Days', 'magicchecklists'),
        );
    }

    /**
     * Get loading conditions translations
     * 
     * @return array
     */
    private static function get_loading_conditions_translations() {
        return array(
            'title' => __('Loading Conditions', 'magicchecklists'),
            'description' => __('Control where this checklist should be available.', 'magicchecklists'),
            'loadEverywhere' => __('Load Everywhere (Default)', 'magicchecklists'),
            'adminPagesTitle' => __('WordPress Admin Pages', 'magicchecklists'),
            'loadingAdminPages' => __('Loading admin pages...', 'magicchecklists'),
            'adminPagesPlaceholder' => __('Select admin pages', 'magicchecklists'),
            'noAdminPages' => __('No admin pages found', 'magicchecklists'),
            'adminPagesDescription' => __('Select the WordPress admin pages where this checklist should be available.', 'magicchecklists'),
            'customUrlsTitle' => __('Custom URLs', 'magicchecklists'),
            'urlPlaceholder' => __('Enter URL pattern (e.g., /posts/*)', 'magicchecklists'),
            'addUrlButton' => __('Add URL Pattern', 'magicchecklists'),
        );
    }

    /**
     * Get force delete lock translations
     * 
     * @return array
     */
    private static function get_force_delete_lock_translations() {
        return array(
            'title' => __('Force Delete Lock', 'magicchecklists'),
            'description' => __('Use this button to forcefully remove the lock on this checklist if it is stuck. Only use this if you are sure no one else is editing this checklist.', 'magicchecklists'),
            'button' => __('Force Delete Lock', 'magicchecklists'),
            'confirmMessage' => __('Are you sure you want to force delete the lock?', 'magicchecklists'),
            'successMessage' => __('Lock has been successfully deleted.', 'magicchecklists'),
            'errorMessage' => __('Failed to delete the lock:', 'magicchecklists'),
            'genericError' => __('An error occurred while deleting the lock.', 'magicchecklists'),
        );
    }

    /**
     * Get permission-related translations
     * 
     * @return array
     */
    private static function get_permissions_translations() {
        return array(
            'canView' => __('Can View', 'magicchecklists'),
            'canInteract' => __('Can Interact', 'magicchecklists'),
            'canEdit' => __('Can Edit', 'magicchecklists'),
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
            'title' => __('Checklist Analytics Overview', 'magicchecklists'),
            'viewFullAnalytics' => __('View Full Analytics', 'magicchecklists'),
        );
    }

    /**
     * Get summary cards translations
     * 
     * @return array
     */
    private static function get_summary_cards_translations() {
        return array(
            'totalViews' => __('Total Views', 'magicchecklists'),
            'totalChecks' => __('Total Checks', 'magicchecklists'),
            'activeChecklists' => __('Active Checklists', 'magicchecklists'),
        );
    }

    /**
     * Get approaching deadlines translations
     * 
     * @return array
     */
    private static function get_approaching_deadlines_translations() {
        return array(
            'title' => __('Approaching Deadlines', 'magicchecklists'),
            'checklistColumn' => __('Checklist', 'magicchecklists'),
            'itemColumn' => __('Item', 'magicchecklists'),
            'deadlineColumn' => __('Deadline', 'magicchecklists'),
            'timeRemainingColumn' => __('Time Remaining', 'magicchecklists'),
            'checklistDeadline' => __('Checklist Deadline', 'magicchecklists'),
        );
    }

    /**
     * Get most popular translations
     * 
     * @return array
     */
    private static function get_most_popular_translations() {
        return array(
            'title' => __('Most Popular Checklist', 'magicchecklists'),
            'view' => __('view', 'magicchecklists'),
            'views' => __('views', 'magicchecklists'),
        );
    }

    /**
     * Get most checked item translations
     * 
     * @return array
     */
    private static function get_most_checked_translations() {
        return array(
            'title' => __('Most Checked Item', 'magicchecklists'),
            'in' => __('in', 'magicchecklists'),
            'check' => __('check', 'magicchecklists'),
            'checks' => __('checks', 'magicchecklists'),
        );
    }

    /**
     * Get time formatting translations
     * 
     * @return array
     */
    private static function get_time_formatting_translations() {
        return array(
            'overdue' => __('Overdue', 'magicchecklists'),
            'day' => __('day', 'magicchecklists'),
            'days' => __('days', 'magicchecklists'),
            'hour' => __('hour', 'magicchecklists'),
            'hours' => __('hours', 'magicchecklists'),
            'invalidDate' => __('Invalid date', 'magicchecklists'),
            'entireChecklist' => __('Entire Checklist', 'magicchecklists'),
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
            'insertImageTitle' => __('Insert Image', 'magicchecklists'),
            'uploadOrSelectTitle' => __('Upload or Select Image', 'magicchecklists'),
            'chooseHowToAdd' => __('Choose how you would like to add an image:', 'magicchecklists'),
            'wordPressMediaLibrary' => __('WordPress Media Library', 'magicchecklists'),
            'quickUpload' => __('Quick Upload', 'magicchecklists'),
            'uploadNew' => __('Upload New', 'magicchecklists'),
            'selectExisting' => __('Select Existing', 'magicchecklists'),
            'dragAndDrop' => __('Drag and drop image here or click to select', 'magicchecklists'),
            'fileRestrictions' => __('Maximum file size: 10MB. Supported formats: JPG, PNG, GIF', 'magicchecklists'),
            'loadingImages' => __('Loading images...', 'magicchecklists'),
            'noImagesFound' => __('No images found', 'magicchecklists'),
            'enterUrl' => __('Enter URL...', 'magicchecklists'),
            'uploadImage' => __('Upload Image', 'magicchecklists'),
            'uploading' => __('Uploading...', 'magicchecklists'),
            'selectImage' => __('Select Image', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistDrawer deadline modal translations
     * 
     * @return array
     */
    private static function get_checklist_drawer_deadline_modal_translations() {
        return array(
            'setDeadlineTitle' => __('Set Item Deadline', 'magicchecklists'),
            'deadlineDateTimeLabel' => __('Deadline Date & Time', 'magicchecklists'),
            'leaveEmptyHint' => __('Leave empty to remove deadline', 'magicchecklists'),
            'clearDeadline' => __('Clear Deadline', 'magicchecklists'),
            'saveDeadline' => __('Save Deadline', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistDrawer progress counter translations
     * 
     * @return array
     */
    private static function get_checklist_drawer_progress_translations() {
        return array(
            'items' => __('items', 'magicchecklists'),
            'completed' => __('completed', 'magicchecklists'),
            'complete' => __('complete', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistDrawer state messages translations
     * 
     * @return array
     */
    private static function get_checklist_drawer_states_translations() {
        return array(
            'loadingChecklist' => __('Loading checklist...', 'magicchecklists'),
            'checklistReset' => __('This checklist has been automatically reset.', 'magicchecklists'),
            'checklistLocked' => __('This checklist is locked by another user. You can still interact but cannot edit structure.', 'magicchecklists'),
            'deadlinePassed' => __('Deadline passed', 'magicchecklists'),
            'congratsMessage' => __('Great job! 🎉', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistDrawer buttons translations
     * 
     * @return array
     */
    private static function get_checklist_drawer_buttons_translations() {
        return array(
            'cancel' => __('Cancel', 'magicchecklists'),
            'startTour' => __('Start tour from this step', 'magicchecklists'),
            'addItem' => __('Add Item', 'magicchecklists'),
            'uncheckAll' => __('Uncheck All', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistDrawer tooltips translations
     * 
     * @return array
     */
    private static function get_checklist_drawer_tooltips_translations() {
        return array(
            'dragToReorder' => __('Drag to reorder', 'magicchecklists'),
            'markAsInProgress' => __('Mark as in progress', 'magicchecklists'),
            'removeFromInProgress' => __('Remove from in progress', 'magicchecklists'),
            'setDeadline' => __('Set deadline', 'magicchecklists'),
            'addImage' => __('Add image', 'magicchecklists'),
            'removeItem' => __('Remove item', 'magicchecklists'),
            'addLink' => __('Add link', 'magicchecklists'),
            'removeLink' => __('Remove link', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistDrawer messages translations
     * 
     * @return array
     */
    private static function get_checklist_drawer_messages_translations() {
        return array(
            'selectImageTitle' => __('Select Image', 'magicchecklists'),
            'invalidFileType' => __('Invalid file type. Please upload a JPG, PNG, or GIF image.', 'magicchecklists'),
            'invalidDate' => __('Invalid date', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistEditor component translations
     * 
     * @return array
     */
    public static function get_checklist_editor_translations() {
        return array(
            'loadingChecklist' => __('Loading checklist...', 'magicchecklists'),
            'failedToLoadType' => __('Failed to load checklist type:', 'magicchecklists'),
            'errorLoadingType' => __('Error loading checklist type:', 'magicchecklists'),
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
                'basicSettings' => __('Basic Settings', 'magicchecklists'),
                'advancedSettings' => __('Advanced Settings', 'magicchecklists'),
                'accessControl' => __('Access Control', 'magicchecklists'),
                'notifications' => __('Notifications', 'magicchecklists'),
            ),
            'basicSettings' => array(
                'title' => __('Title', 'magicchecklists'),
                'titlePlaceholder' => __('Enter checklist title', 'magicchecklists'),
                'description' => __('Description', 'magicchecklists'),
                'descriptionPlaceholder' => __('Enter checklist description', 'magicchecklists'),
                'showDescriptionInDrawer' => __('Show description in drawer', 'magicchecklists'),
                'activeStatus' => __('Active Status', 'magicchecklists'),
                'activeStatusDescription' => __('When active, this checklist can be accessed using its keyboard shortcut or floating button.', 'magicchecklists'),
                'drawerTheme' => __('Drawer Theme', 'magicchecklists'),
                'chooseTheme' => __('Choose theme...', 'magicchecklists'),
                'themeDescription' => __('Choose the visual theme for your checklist drawer.', 'magicchecklists'),
                'tags' => __('Tags', 'magicchecklists'),
                'tagPlaceholder' => __('Type tag name and press Enter', 'magicchecklists'),
                'tagsHint' => __('Add tags to organize your checklist. Press Enter to add a tag, then click the edit icon to change its color.', 'magicchecklists'),
                'checklistPriority' => __('Checklist Priority', 'magicchecklists'),
                'selectPriorityPlaceholder' => __('Select priority...', 'magicchecklists'),
                'enableItemLocking' => __('Enable Item Locking', 'magicchecklists'),
                'itemLockingDescription' => __('Enable locking of individual items to prevent editing.', 'magicchecklists'),
                'enableShortcode' => __('Enable Shortcode', 'magicchecklists'),
                'shortcodeDescription' => __('Enable this to use this checklist as a shortcode in your content.', 'magicchecklists'),
                'autoResetSchedule' => __('Auto Reset Schedule', 'magicchecklists'),
                'autoResetDescription' => __('Enable automatic reset of checked items on a schedule.', 'magicchecklists'),
                'floatingButtonTitle' => __('Floating Button Title', 'magicchecklists'),
                'buttonTitle' => __('Button title', 'magicchecklists'),
                'selectIconImage' => __('Select Icon Image', 'magicchecklists'),
                'changeColor' => __('Change color', 'magicchecklists'),
            ),
            'advancedSettings' => array(
                'deadline' => __('Deadline', 'magicchecklists'),
                'deadlineDescription' => __('Set an optional deadline for completing this checklist.', 'magicchecklists'),
                'keyboardShortcut' => __('Keyboard Shortcut', 'magicchecklists'),
                'shortcutPlaceholder' => __('Click and press your desired key combination', 'magicchecklists'),
                'drawerTriggerMethod' => __('Drawer Trigger Method', 'magicchecklists'),
                'keyboardShortcutTrigger' => __('Keyboard Shortcut', 'magicchecklists'),
                'floatingButton' => __('Floating Button', 'magicchecklists'),
                'buttonPosition' => __('Button Position', 'magicchecklists'),
                'selectPosition' => __('Select position...', 'magicchecklists'),
                'checklistIcon' => __('Checklist Icon', 'magicchecklists'),
                'usePresetIcon' => __('Use Preset Icon', 'magicchecklists'),
                'customIcon' => __('Custom Icon', 'magicchecklists'),
                'chooseIconImage' => __('Choose Icon Image', 'magicchecklists'),
                'useAsIcon' => __('Use as Icon', 'magicchecklists'),
                'customIconAlt' => __('Custom icon', 'magicchecklists'),
                'remove' => __('Remove', 'magicchecklists'),
                'pasteImageUrl' => __('Or paste image URL', 'magicchecklists'),
                'disableInBuilders' => __('Disable floating UI inside page builders', 'magicchecklists'),
                'checkedStateHandling' => __('Checked State Handling', 'magicchecklists'),
                'selectHandlingMethod' => __('Select handling method...', 'magicchecklists'),
                'checkedStateDescription' => __('"Per User" gives each user their own checked states. "Global" shares checked states among all users.', 'magicchecklists'),
                'resetInterval' => __('Reset Interval', 'magicchecklists'),
                'selectInterval' => __('Select interval...', 'magicchecklists'),
                'dayOfWeek' => __('Day of Week', 'magicchecklists'),
                'selectDay' => __('Select day...', 'magicchecklists'),
                'dayOfMonth' => __('Day of Month', 'magicchecklists'),
                'enterDayOfMonth' => __('Enter day of month', 'magicchecklists'),
                'customInterval' => __('Custom Interval', 'magicchecklists'),
                'months' => __('Months', 'magicchecklists'),
                'weeks' => __('Weeks', 'magicchecklists'),
                'days' => __('Days', 'magicchecklists'),
                'customIntervalHint' => __('At least one field must have a value greater than 0.', 'magicchecklists'),
                'resetTime' => __('Reset Time', 'magicchecklists'),
            ),
            'options' => array(
                'light' => __('Light', 'magicchecklists'),
                'dark' => __('Dark', 'magicchecklists'),
                'customTheme' => __('Custom Theme', 'magicchecklists'),
                'bottomRight' => __('Bottom Right', 'magicchecklists'),
                'bottomLeft' => __('Bottom Left', 'magicchecklists'),
                'topRight' => __('Top Right', 'magicchecklists'),
                'topLeft' => __('Top Left', 'magicchecklists'),
                'draggable' => __('Draggable', 'magicchecklists'),
                'perUser' => __('Per User', 'magicchecklists'),
                'global' => __('Global', 'magicchecklists'),
                'daily' => __('Daily', 'magicchecklists'),
                'weekly' => __('Weekly', 'magicchecklists'),
                'monthly' => __('Monthly', 'magicchecklists'),
                'custom' => __('Custom', 'magicchecklists'),
                'monday' => __('Monday', 'magicchecklists'),
                'tuesday' => __('Tuesday', 'magicchecklists'),
                'wednesday' => __('Wednesday', 'magicchecklists'),
                'thursday' => __('Thursday', 'magicchecklists'),
                'friday' => __('Friday', 'magicchecklists'),
                'saturday' => __('Saturday', 'magicchecklists'),
                'sunday' => __('Sunday', 'magicchecklists'),
            ),
            'priorities' => array(
                'none' => __('None', 'magicchecklists'),
                'low' => __('Low', 'magicchecklists'),
                'medium' => __('Medium', 'magicchecklists'),
                'high' => __('High', 'magicchecklists'),
                'critical' => __('Critical', 'magicchecklists'),
            ),
            'buttons' => array(
                'previous' => __('Previous', 'magicchecklists'),
                'next' => __('Next', 'magicchecklists'),
                'save' => __('Save', 'magicchecklists'),
            ),
            'validation' => array(
                'titleRequired' => __('Title is required', 'magicchecklists'),
                'triggerMethodsRequired' => __('At least one trigger method must be selected', 'magicchecklists'),
                'keyboardShortcutRequired' => __('Keyboard shortcut is required when shortcut trigger is enabled', 'magicchecklists'),
                'shortcutInUse' => __('This shortcut is already in use.', 'magicchecklists'),
                'invalidTimeFormat' => __('Invalid time format', 'magicchecklists'),
                'invalidDayOfWeek' => __('Invalid day of week selected', 'magicchecklists'),
                'dayOfMonthRange' => __('Day of month must be between 1 and 31', 'magicchecklists'),
                'customIntervalRequired' => __('At least one time period must be specified for custom intervals', 'magicchecklists'),
                'monthsRange' => __('Months must be between 0 and 12', 'magicchecklists'),
                'weeksRange' => __('Weeks must be between 0 and 52', 'magicchecklists'),
                'daysRange' => __('Days must be between 0 and 31', 'magicchecklists'),
                'usageLimitNumber' => __('Usage limit must be a number', 'magicchecklists'),
                'usageLimitNegative' => __('Usage limit cannot be negative', 'magicchecklists'),
                'notificationMethodRequired' => __('At least one notification method must be enabled', 'magicchecklists'),
                'emailRecipientsRequired' => __('Email recipients are required when email notifications are enabled', 'magicchecklists'),
                'itemsRequired' => __('At least one non-empty checklist item is required', 'magicchecklists'),
            ),
            'actions' => array(
                'save' => __('Save', 'magicchecklists'),
                'saving' => __('Saving...', 'magicchecklists'),
                'pageWillReload' => __('Page will reload automatically', 'magicchecklists'),
                'loadingChecklist' => __('Loading checklist...', 'magicchecklists'),
                'errorLoadingChecklist' => __('Failed to load checklist data', 'magicchecklists'),
                'errorValidatingShortcut' => __('Error validating shortcut:', 'magicchecklists'),
                'errorSavingChecklist' => __('Failed to save checklist. Please try again.', 'magicchecklists'),
                'failedToSaveChecklist' => __('Failed to save checklist', 'magicchecklists'),
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
            'notifications' => __('Notifications', 'magicchecklists'),
            'enableNotifications' => __('Enable notifications for this checklist', 'magicchecklists'),
            'notificationMethods' => __('Notification Methods', 'magicchecklists'),
            'notificationMethodsDescription' => __('Please check at least one option for the notifications to work.', 'magicchecklists'),
            'emailNotifications' => __('Email Notifications', 'magicchecklists'),
            'integrationNotifications' => __('Integration Notifications', 'magicchecklists'),
            'emailSettings' => __('Email Settings', 'magicchecklists'),
            'emailRecipients' => __('Email Recipients', 'magicchecklists'),
            'emailRecipientsPlaceholder' => __('email1@example.com, email2@example.com', 'magicchecklists'),
            'emailRecipientsDescription' => __('Enter email addresses separated by commas', 'magicchecklists'),
            'invalidEmailAddresses' => __('Please enter valid email addresses separated by commas', 'magicchecklists'),
            'testEmail' => __('Test Email', 'magicchecklists'),
            'testing' => __('Testing...', 'magicchecklists'),
            'integrationSettings' => __('Integration Settings', 'magicchecklists'),
            'slackWebhookUrl' => __('Slack Webhook URL', 'magicchecklists'),
            'slackWebhookPlaceholder' => __('https://hooks.slack.com/services/...', 'magicchecklists'),
            'validSlackWebhookUrl' => __('Please enter a valid Slack webhook URL', 'magicchecklists'),
            'testSlack' => __('Test Slack', 'magicchecklists'),
            'discordWebhookUrl' => __('Discord Webhook URL', 'magicchecklists'),
            'discordWebhookPlaceholder' => __('https://discord.com/api/webhooks/...', 'magicchecklists'),
            'validDiscordWebhookUrl' => __('Please enter a valid Discord webhook URL', 'magicchecklists'),
            'testDiscord' => __('Test Discord', 'magicchecklists'),
            'notificationTriggers' => __('Notification Triggers', 'magicchecklists'),
            'notificationTriggersDescription' => __('Choose which events should trigger notifications', 'magicchecklists'),
            'newItemAdded' => __('New item added', 'magicchecklists'),
            'itemDeleted' => __('Item deleted', 'magicchecklists'),
            'itemChecked' => __('Item checked', 'magicchecklists'),
            'itemUnchecked' => __('Item unchecked', 'magicchecklists'),
            'deadlineApproaching' => __('Deadline approaching', 'magicchecklists'),
            'commentsAndReplies' => __('Comments and replies', 'magicchecklists'),
            'sendDeadlineNotificationWhen' => __('Send deadline notification when', 'magicchecklists'),
            'hoursRemaining' => __('hours remaining', 'magicchecklists'),
            'notificationFrequency' => __('Notification Frequency', 'magicchecklists'),
            'sendImmediately' => __('Send Immediately', 'magicchecklists'),
            'every15Minutes' => __('Every 15 Minutes', 'magicchecklists'),
            'hourly' => __('Hourly', 'magicchecklists'),
            'dailyDigest' => __('Daily Digest', 'magicchecklists'),
            'selectFrequency' => __('Select frequency...', 'magicchecklists'),
            'chooseFrequencyDescription' => __('Choose how often notifications should be sent', 'magicchecklists'),
            'alerts' => array(
                'noNotificationMethods' => __('No notification methods enabled!', 'magicchecklists'),
                'noNotificationMethodsDescription' => __('Please enable at least one notification method for notifications to work.', 'magicchecklists'),
                'noEmailRecipients' => __('No email recipients!', 'magicchecklists'),
                'noEmailRecipientsDescription' => __('Please add email recipients to receive email notifications.', 'magicchecklists'),
                'noWebhookUrls' => __('No webhook URLs configured!', 'magicchecklists'),
                'noWebhookUrlsDescription' => __('Please add at least one webhook URL for integration notifications.', 'magicchecklists'),
                'enterWebhookUrlFirst' => __('Please enter a webhook URL first', 'magicchecklists'),
                'enterEmailRecipientsFirst' => __('Please enter email recipients first', 'magicchecklists'),
                'webhookTestSuccessful' => __('webhook test successful!', 'magicchecklists'),
                'webhookTestFailed' => __('Webhook test failed:', 'magicchecklists'),
                'webhookTestNetworkError' => __('Webhook test failed due to network error', 'magicchecklists'),
                'testEmailsSentSuccessfully' => __('Test email(s) sent successfully!', 'magicchecklists'),
                'emailTestFailed' => __('Email test failed:', 'magicchecklists'),
                'emailTestNetworkError' => __('Email test failed due to network error', 'magicchecklists'),
                'unknownError' => __('Unknown error', 'magicchecklists'),
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
            'title' => __('Checklist Items', 'magicchecklists'),
            'description' => __('Add and organize your checklist items', 'magicchecklists'),
            'enablePriorities' => __('Enable Item Priorities', 'magicchecklists'),
            'enable' => __('Enable', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistItems actions translations
     * 
     * @return array
     */
    private static function get_checklist_items_actions_translations() {
        return array(
            'addItem' => __('Add Item', 'magicchecklists'),
            'deleteAll' => __('Delete All', 'magicchecklists'),
            'deleteAllConfirm' => __('Are you sure you want to delete all items?', 'magicchecklists'),
            'noParent' => __('No Parent', 'magicchecklists'),
            'selectParent' => __('Select parent...', 'magicchecklists'),
            'selectPriority' => __('Priority...', 'magicchecklists'),
            'untitledItem' => __('Untitled Item', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistItems tooltips translations
     * 
     * @return array
     */
    private static function get_checklist_items_tooltips_translations() {
        return array(
            'markAsInProgress' => __('Mark as in progress', 'magicchecklists'),
            'removeFromInProgress' => __('Remove from in progress', 'magicchecklists'),
            'setDeadline' => __('Set deadline', 'magicchecklists'),
            'addImage' => __('Add image', 'magicchecklists'),
            'startTour' => __('Start tour from this step', 'magicchecklists'),
            'lockItem' => __('Lock item', 'magicchecklists'),
            'unlockItem' => __('Unlock item', 'magicchecklists'),
            'removeItem' => __('Remove item', 'magicchecklists'),
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
            'insertImage' => __('Insert Image', 'magicchecklists'),
            'uploadOrSelect' => __('Upload or Select Image', 'magicchecklists'),
            'chooseMethod' => __('Choose how you would like to add an image:', 'magicchecklists'),
            'mediaLibrary' => __('WordPress Media Library', 'magicchecklists'),
            'quickUpload' => __('Quick Upload', 'magicchecklists'),
            'uploadNew' => __('Upload New', 'magicchecklists'),
            'selectExisting' => __('Select Existing', 'magicchecklists'),
            'dragDrop' => __('Drag and drop image here or click to select', 'magicchecklists'),
            'fileRestrictions' => __('Maximum file size: 10MB. Supported formats: JPG, PNG, GIF', 'magicchecklists'),
            'loadingImages' => __('Loading images...', 'magicchecklists'),
            'cancel' => __('Cancel', 'magicchecklists'),
            'uploadImage' => __('Upload Image', 'magicchecklists'),
            'uploading' => __('Uploading...', 'magicchecklists'),
            'selectImage' => __('Select Image', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistItems link modal translations
     * 
     * @return array
     */
    private static function get_checklist_items_link_modal_translations() {
        return array(
            'addLink' => __('Add Link', 'magicchecklists'),
            'url' => __('URL', 'magicchecklists'),
            'urlPlaceholder' => __('https://example.com', 'magicchecklists'),
            'text' => __('Text (optional)', 'magicchecklists'),
            'textPlaceholder' => __('Link text', 'magicchecklists'),
            'cancel' => __('Cancel', 'magicchecklists'),
            'addLinkButton' => __('Add Link', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistItems deadline prompt translations
     * 
     * @return array
     */
    private static function get_checklist_items_deadline_prompt_translations() {
        return array(
            'enterDeadline' => __('Enter deadline (YYYY-MM-DD HH:MM):', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistItems priorities translations
     * 
     * @return array
     */
    private static function get_checklist_items_priorities_translations() {
        return array(
            'none' => __('None', 'magicchecklists'),
            'low' => __('Low', 'magicchecklists'),
            'medium' => __('Medium', 'magicchecklists'),
            'high' => __('High', 'magicchecklists'),
            'critical' => __('Critical', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistItems alerts translations
     * 
     * @return array
     */
    private static function get_checklist_items_alerts_translations() {
        return array(
            'invalidFileType' => __('Invalid file type. Please upload a JPG, PNG, or GIF image.', 'magicchecklists'),
            'fileTooLarge' => __('File is too large. Maximum size is 10MB.', 'magicchecklists'),
            'uploadFailed' => __('Upload failed. Please try again.', 'magicchecklists'),
            'selectImageTitle' => __('Select Image', 'magicchecklists'),
        );
    }

    /**
     * Get ChecklistItems time formatting translations
     * 
     * @return array
     */
    private static function get_checklist_items_time_translations() {
        return array(
            'deadlinePassed' => __('Deadline passed', 'magicchecklists'),
            'remaining' => __('remaining', 'magicchecklists'),
            'due' => __('Due:', 'magicchecklists'),
            'daysShort' => __('d', 'magicchecklists'),
            'hoursShort' => __('h', 'magicchecklists'),
            'minutesShort' => __('m', 'magicchecklists'),
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
            'addNew' => __('Add New', 'magicchecklists'),
            'checklists' => __('Checklists', 'magicchecklists'),
            'tours' => __('Tours', 'magicchecklists'),
            'kanbanBoard' => __('Kanban Board', 'magicchecklists'),
            'analytics' => __('Analytics', 'magicchecklists'),
            'settings' => __('Settings', 'magicchecklists'),
            'importExport' => __('Import / Export', 'magicchecklists'),
            'pluginName' => __('MagicChecklists', 'magicchecklists'),
            'allChecklists' => __('All Checklists', 'magicchecklists'),
            'editChecklist' => __('Edit Checklist', 'magicchecklists'),
            'addNewChecklist' => __('Add New Checklist', 'magicchecklists'),
            'editTour' => __('Edit Tour', 'magicchecklists'),
            'license' => __('License', 'magicchecklists'),
            'checklistsDescription' => __('Create and manage interactive checklists that can be accessed from anywhere on your site.', 'magicchecklists'),
            'editChecklistDescription' => __('Modify and update your existing checklist.', 'magicchecklists'),
            'addNewChecklistDescription' => __('Create a new interactive checklist for your site.', 'magicchecklists'),
            'editTourDescription' => __('Configure settings and steps for your interactive tour.', 'magicchecklists'),
            'toursDescription' => __('Create and manage interactive tours to guide users through your WordPress site.', 'magicchecklists'),
            'kanbanDescription' => __('Visualize and manage checklist tasks in a Kanban-style board with drag-and-drop functionality.', 'magicchecklists'),
            'importExportDescription' => __('Import and export classic checklists in various formats.', 'magicchecklists'),
            'analyticsDescription' => __('View performance metrics and usage statistics for your checklists.', 'magicchecklists'),
            'settingsDescription' => __('Configure your MagicChecklists plugin settings.', 'magicchecklists'),
            'licenseDescription' => __('Manage your MagicChecklists license activation.', 'magicchecklists'),
            'sideBySide' => __('Side by Side', 'magicchecklists'),
            'stacked' => __('Stacked', 'magicchecklists'),
            'layout' => __('Layout', 'magicchecklists'),
            'backToList' => __('Back to List', 'magicchecklists'),
            'back' => __('Back', 'magicchecklists'),
            'saveChanges' => __('Save Changes', 'magicchecklists'),
            'saveChecklist' => __('Save Checklist', 'magicchecklists'),
            'backToTours' => __('Back to Tours', 'magicchecklists'),
            'checklistsDescriptionShort' => __('Create and manage interactive checklists.', 'magicchecklists'),
            'addNewChecklistDescriptionShort' => __('Create a new interactive checklist.', 'magicchecklists'),
            'toursDescriptionShort' => __('Create and manage interactive tours.', 'magicchecklists'),
            'kanbanDescriptionShort' => __('Visualize and manage tasks in a Kanban board.', 'magicchecklists'),
            'importExportDescriptionShort' => __('Import and export classic checklists in various formats.', 'magicchecklists'),
            'analyticsDescriptionShort' => __('View performance metrics and usage statistics.', 'magicchecklists'),
            'settingsDescriptionShort' => __('Configure your plugin settings.', 'magicchecklists'),
            'licenseDescriptionShort' => __('Manage your license activation.', 'magicchecklists'),
            'lightMode' => __('Light Mode', 'magicchecklists'),
            'darkMode' => __('Dark Mode', 'magicchecklists'),
            'help' => __('Help', 'magicchecklists'),
            'expandSidebar' => __('Expand sidebar', 'magicchecklists'),
            'collapseSidebar' => __('Collapse sidebar', 'magicchecklists'),
            'switchToLightMode' => __('Switch to light mode', 'magicchecklists'),
            'switchToDarkMode' => __('Switch to dark mode', 'magicchecklists'),
        );
    }

    /**
     * Get App component translations
     * 
     * @return array
     */
    public static function get_app_translations() {
        return array(
            'waitingForReactBridge' => __('MCL: Waiting for React bridge...', 'magicchecklists'),
            'reactBridgeNotFound' => __('React component bridge not found after waiting', 'magicchecklists'),
            'initializationFailed' => __('MCL: Failed to initialize Magic Checklist:', 'magicchecklists'),
            'failedToLoadChecklistData' => __('MCL: Failed to load checklist data:', 'magicchecklists'),
            'failedToFetchChecklistData' => __('MCL: Failed to fetch checklist data', 'magicchecklists'),
            'failedToLoadGeneralSettings' => __('MCL: Failed to load general settings:', 'magicchecklists'),
            'errorLoadingChecklistData' => __('Error loading checklist data:', 'magicchecklists'),
            'legacyDataAvailable' => __('MCL: Legacy magiccl_checklists data available:', 'magicchecklists'),
            'errorInitializingShortcode' => __('MCL: Error initializing shortcode:', 'magicchecklists'),
            'errorInitializingDynamicShortcode' => __('MCL: Error initializing dynamic shortcode:', 'magicchecklists'),
            'errorInitializingNestedShortcode' => __('MCL: Error initializing nested shortcode:', 'magicchecklists'),
            'autoInitializationFailed' => __('MCL: Auto-initialization failed:', 'magicchecklists'),
            'failedToReinitializeButtons' => __('MCL: Failed to reinitialize buttons:', 'magicchecklists'),
            'mclDrawerNotAvailable' => __('MCL: mclDrawer not available for button reinitialization', 'magicchecklists'),
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
                'ariaLabel' => __('Settings tabs', 'magicchecklists'),
                'general' => __('General', 'magicchecklists'),
                'dashboardWidget' => __('Dashboard Widget', 'magicchecklists'),
                'integrations' => __('Integrations', 'magicchecklists'),
            ),
            'errors' => array(
                'fetchFailed' => __('Failed to fetch settings', 'magicchecklists'),
                'loadFailed' => __('Failed to load settings. Please try again.', 'magicchecklists'),
                'loadFailedTitle' => __('Settings Load Failed', 'magicchecklists'),
                'saveFailed' => __('Failed to save settings', 'magicchecklists'),
                'saveFailedRetry' => __('Failed to save settings. Please try again.', 'magicchecklists'),
                'saveFailedTitle' => __('Save Failed', 'magicchecklists'),
            ),
            'success' => array(
                'saved' => __('Settings saved successfully!', 'magicchecklists'),
                'savedTitle' => __('Settings Saved', 'magicchecklists'),
            ),
            'loading' => array(
                'srOnly' => __('Loading settings...', 'magicchecklists'),
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
            'title' => __('Dashboard Widget', 'magicchecklists'),
            'description' => __('Configure the MagicChecklists dashboard widget that appears on the WordPress admin dashboard. At least one display option must be enabled for the widget to appear.', 'magicchecklists'),
            'labels' => array(
                'enableWidget' => __('Enable Dashboard Widget', 'magicchecklists'),
                'showChecklists' => __('Show Checklists', 'magicchecklists'),
                'selectChecklists' => __('Select Checklists to Display', 'magicchecklists'),
                'showChecklistItems' => __('Show Checklist Items', 'magicchecklists'),
                'selectChecklist' => __('Select a checklist', 'magicchecklists'),
                'showDeadlines' => __('Show Deadlines', 'magicchecklists'),
                'showTags' => __('Show Tags', 'magicchecklists'),
                'showDescriptions' => __('Show Descriptions', 'magicchecklists'),
                'showQuickActions' => __('Show Quick Actions', 'magicchecklists'),
            ),
            'descriptions' => array(
                'enableWidget' => __('Enable the MagicChecklists widget on the WordPress admin dashboard.', 'magicchecklists'),
                'showChecklists' => __('Display a list of checklists with their current status. Choose which checklists to display below.', 'magicchecklists'),
                'showChecklistItems' => __('Display items from a specific checklist. Select which checklist below.', 'magicchecklists'),
                'showDeadlines' => __('Display upcoming deadlines for checklist items with color-coded urgency.', 'magicchecklists'),
                'showTags' => __('Display tags associated with each checklist.', 'magicchecklists'),
                'showDescriptions' => __('Display a truncated description for each checklist.', 'magicchecklists'),
                'showQuickActions' => __('Display quick action buttons to activate/deactivate checklists directly from the dashboard.', 'magicchecklists'),
            ),
            'buttons' => array(
                'selectAll' => __('Select All', 'magicchecklists'),
                'deselectAll' => __('Deselect All', 'magicchecklists'),
                'saving' => __('Saving...', 'magicchecklists'),
                'save' => __('Save Dashboard Widget Settings', 'magicchecklists'),
            ),
            'messages' => array(
                'noChecklists' => __('No checklists found. Create some checklists first to display them in the widget.', 'magicchecklists'),
                'noChecklistsSelected' => __('No checklists selected. All checklists will be displayed if none are specifically selected.', 'magicchecklists'),
                'checklistsSelected' => __('checklist(s) selected for display.', 'magicchecklists'),
            ),
            'status' => array(
                'active' => __('Active', 'magicchecklists'),
                'inactive' => __('Inactive', 'magicchecklists'),
            ),
            'validation' => array(
                'checklistRequired' => __('At least one checklist must be selected when "Show Checklists" is enabled.', 'magicchecklists'),
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
            'title' => __('API & Webhook Settings', 'magicchecklists'),
            'description' => __('Enable / disable the API endpoints of MagicChecklists, test webhook URLs and more.', 'magicchecklists'),
            'labels' => array(
                'restApiAccess' => __('REST API Access', 'magicchecklists'),
                'webhookSecret' => __('Webhook Secret', 'magicchecklists'),
                'webhookEndpoints' => __('Webhook Endpoints', 'magicchecklists'),
                'mainwpApiKey' => __('MainWP API Key', 'magicchecklists'),
                'mclApiKey' => __('MagicChecklists API Key', 'magicchecklists'),
                'webhookLogs' => __('Webhook Logs', 'magicchecklists'),
            ),
            'descriptions' => array(
                'restApiAccess' => __('Enable REST API access for MagicChecklists. When disabled, all plugin-specific API endpoints will be inaccessible.', 'magicchecklists'),
                'webhookSecret' => __('This secret key will be used to sign webhook payloads for security verification.', 'magicchecklists'),
                'webhookEndpoints' => __('Add URLs where webhook notifications should be sent when checklist events occur.', 'magicchecklists'),
                'mainwpApiKey' => __('Enter the API key generated from your MainWP dashboard to enable communication between MainWP and MagicChecklists.', 'magicchecklists'),
                'mclApiKey' => __('Generate an API key to allow third-party applications to access your MagicChecklists data through the v2 API endpoints.', 'magicchecklists'),
            ),
            'placeholders' => array(
                'webhookSecret' => __('Enter a secret key for webhook security', 'magicchecklists'),
                'mainwpApiKey' => __('Enter your MainWP API key', 'magicchecklists'),
                'noApiKey' => __('No API key generated', 'magicchecklists'),
            ),
            'buttons' => array(
                'generateSecret' => __('Generate Secret', 'magicchecklists'),
                'test' => __('Test', 'magicchecklists'),
                'remove' => __('Remove', 'magicchecklists'),
                'addEndpoint' => __('Add Endpoint', 'magicchecklists'),
                'hide' => __('Hide', 'magicchecklists'),
                'show' => __('Show', 'magicchecklists'),
                'regenerate' => __('Regenerate', 'magicchecklists'),
                'generate' => __('Generate', 'magicchecklists'),
                'copy' => __('Copy', 'magicchecklists'),
                'clearLogs' => __('Clear Logs', 'magicchecklists'),
                'saving' => __('Saving...', 'magicchecklists'),
                'save' => __('Save Integration Settings', 'magicchecklists'),
            ),
            'confirmations' => array(
                'deleteEndpoint' => __('Are you sure you want to delete this webhook endpoint?', 'magicchecklists'),
                'regenerateApiKey' => __('Are you sure you want to regenerate the API key? This will invalidate the existing key.', 'magicchecklists'),
                'clearLogs' => __('Are you sure you want to clear all webhook logs?', 'magicchecklists'),
            ),
            'messages' => array(
                'connectionSuccess' => __('Connection successful!', 'magicchecklists'),
                'connectionFailed' => __('Connection failed', 'magicchecklists'),
                'unknownError' => __('Unknown error', 'magicchecklists'),
                'networkError' => __('Network error', 'magicchecklists'),
                'apiKeyCopied' => __('API key copied to clipboard!', 'magicchecklists'),
                'logsCleared' => __('Webhook logs cleared successfully!', 'magicchecklists'),
                'noLogsFound' => __('No webhook logs found.', 'magicchecklists'),
            ),
            'titles' => array(
                'webhookTest' => __('Webhook Test', 'magicchecklists'),
                'webhookTestFailed' => __('Webhook Test Failed', 'magicchecklists'),
                'copied' => __('Copied', 'magicchecklists'),
                'logsCleared' => __('Logs Cleared', 'magicchecklists'),
                'clearFailed' => __('Clear Failed', 'magicchecklists'),
            ),
            'errors' => array(
                'clearLogsFailed' => __('Failed to clear logs', 'magicchecklists'),
                'clearLogsError' => __('Failed to clear webhook logs', 'magicchecklists'),
            ),
            'warnings' => array(
                'regenerateApiKey' => __('Warning: Regenerating the API key will invalidate any existing integrations using the current key.', 'magicchecklists'),
            ),
            'table' => array(
                'headers' => array(
                    'time' => __('Time', 'magicchecklists'),
                    'event' => __('Event', 'magicchecklists'),
                    'endpoint' => __('Endpoint', 'magicchecklists'),
                    'status' => __('Status', 'magicchecklists'),
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
            'title' => __('General Settings', 'magicchecklists'),
            'description' => __('Configure general plugin settings and behavior.', 'magicchecklists'),
            'labels' => array(
                'checklistNavigation' => __('Checklist Arrow Buttons Navigation', 'magicchecklists'),
                'progressCounter' => __('Progress Counter', 'magicchecklists'),
                'dataCleanup' => __('Data Cleanup', 'magicchecklists'),
                'pluginLanguage' => __('Plugin Language', 'magicchecklists'),
                'useWordPressLanguage' => __('Use WordPress Language (Default)', 'magicchecklists'),
                'speedDialAppearance' => __('Speed Dial Appearance', 'magicchecklists'),
                'backgroundColor' => __('Background Color', 'magicchecklists'),
                'iconColor' => __('Icon Color', 'magicchecklists'),
            ),
            'descriptions' => array(
                'checklistNavigation' => __('Enable navigation arrows to switch between active checklists when the drawer is open.', 'magicchecklists'),
                'progressCounter' => __('Show a progress counter in checklists displaying total items, completed items, and completion percentage.', 'magicchecklists'),
                'dataCleanup' => __('Delete all plugin data when uninstalling MagicChecklists (including checklists, settings, and database tables).', 'magicchecklists'),
                'pluginLanguage' => __('Choose the language for the MagicChecklists plugin interface. This overrides the WordPress language setting for this plugin only.', 'magicchecklists'),
                'speedDialAppearance' => __('Customize the appearance of the speed dial trigger button that appears when multiple checklists have floating buttons enabled.', 'magicchecklists'),
            ),
            'buttons' => array(
                'saving' => __('Saving...', 'magicchecklists'),
                'save' => __('Save General Settings', 'magicchecklists'),
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
                'importComplete' => __('Import Complete', 'magicchecklists'),
                'exportChecklists' => __('Export Classic Checklists', 'magicchecklists'),
                'importFromText' => __('Import from Text', 'magicchecklists'),
                'importFromJson' => __('Import from JSON', 'magicchecklists'),
                'pdfExportSettings' => __('PDF Export Settings', 'magicchecklists'),
            ),
            'descriptions' => array(
                'importText' => __('Import checklist items from plain text. Enter one item per line.', 'magicchecklists'),
                'importJson' => __('Import a complete checklist from a JSON file exported from MagicChecklists.', 'magicchecklists'),
            ),
            'labels' => array(
                'pasteItems' => __('Paste items (one per line)', 'magicchecklists'),
                'uploadFile' => __('Upload JSON File', 'magicchecklists'),
                'logoUrl' => __('Header Logo URL', 'magicchecklists'),
                'headerText' => __('Header Text', 'magicchecklists'),
                'contactInfo' => __('Contact Information', 'magicchecklists'),
                'footerText' => __('Footer Text', 'magicchecklists'),
            ),
            'placeholders' => array(
                'enterItems' => __('Enter each checklist item on a new line...', 'magicchecklists'),
                'logoUrl' => __('https://example.com/logo.png', 'magicchecklists'),
                'headerText' => __('Header text for your PDF...', 'magicchecklists'),
                'contactInfo' => __('Contact information...', 'magicchecklists'),
                'footerText' => __('Footer text...', 'magicchecklists'),
            ),
            'buttons' => array(
                'editImported' => __('Edit the imported checklist →', 'magicchecklists'),
                'importText' => __('Import Text', 'magicchecklists'),
                'importJson' => __('Import JSON', 'magicchecklists'),
                'cancel' => __('Cancel', 'magicchecklists'),
                'exportPdf' => __('Export PDF', 'magicchecklists'),
            ),
            'messages' => array(
                'importSuccess' => __('Checklist imported successfully!', 'magicchecklists'),
                'pdfExportSuccess' => __('PDF export started! Check your browser downloads.', 'magicchecklists'),
                'noChecklists' => __('No classic checklists found.', 'magicchecklists'),
                'createChecklistsFirst' => __('Create some classic checklists first to enable export functionality.', 'magicchecklists'),
                'dragDropFile' => __('Drag and drop JSON file here or click to select', 'magicchecklists'),
                'jsonOnly' => __('Only .json files are supported', 'magicchecklists'),
            ),
            'errors' => array(
                'importFailed' => __('Failed to import checklist. Please try again.', 'magicchecklists'),
                'loadChecklistsFailed' => __('Failed to load checklists', 'magicchecklists'),
                'loadError' => __('An error occurred while loading checklists', 'magicchecklists'),
                'fileInputNotFound' => __('File input not found. Please try again.', 'magicchecklists'),
                'selectFile' => __('Please select a JSON file to import.', 'magicchecklists'),
                'validJsonFile' => __('Please select a valid JSON file.', 'magicchecklists'),
                'pdfExportFailed' => __('Failed to export PDF', 'magicchecklists'),
            ),
            'loading' => array(
                'checklists' => __('Loading checklists...', 'magicchecklists'),
            ),
            'table' => array(
                'headers' => array(
                    'title' => __('Title', 'magicchecklists'),
                    'items' => __('Items', 'magicchecklists'),
                    'actions' => __('Actions', 'magicchecklists'),
                ),
                'itemsLabel' => __('items', 'magicchecklists'),
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
            'title' => __('Manage License', 'magicchecklists'),
            'descriptions' => array(
                'enterKey' => __('Enter your license key to activate MagicChecklists.', 'magicchecklists'),
                'activated' => __('Your license is successfully activated for this site.', 'magicchecklists'),
            ),
            'labels' => array(
                'licenseKey' => __('License Key', 'magicchecklists'),
            ),
            'placeholders' => array(
                'enterKey' => __('Enter your license key', 'magicchecklists'),
            ),
            'buttons' => array(
                'activating' => __('Activating...', 'magicchecklists'),
                'activateLicense' => __('Activate License', 'magicchecklists'),
                'deactivating' => __('Deactivating...', 'magicchecklists'),
                'deactivateLicense' => __('Deactivate License', 'magicchecklists'),
            ),
            'messages' => array(
                'activatedOn' => __('Activated on', 'magicchecklists'),
                'deactivateSuccess' => __('License deactivated successfully', 'magicchecklists'),
                'activateSuccess' => __('License activated successfully', 'magicchecklists'),
            ),
            'errors' => array(
                'operationFailed' => __('License operation failed', 'magicchecklists'),
                'processingError' => __('An error occurred while processing the license', 'magicchecklists'),
            ),
            'console' => array(
                'errorLoadingStatus' => __('Error loading license status:', 'magicchecklists'),
                'errorProcessing' => __('Error processing license:', 'magicchecklists'),
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
                'checklist' => __('checklist', 'magicchecklists'),
                'searchChecklists' => __('Search Checklists', 'magicchecklists'),
                'filterByTags' => __('Filter by Tags', 'magicchecklists'),
            ),
            'placeholders' => array(
                'searchByTitleDesc' => __('Search by title, description, type...', 'magicchecklists'),
                'selectTags' => __('Select tags...', 'magicchecklists'),
            ),
            'buttons' => array(
                'noCancel' => __('No, cancel', 'magicchecklists'),
                'yesDelete' => __('Yes, delete', 'magicchecklists'),
                'yesClone' => __('Yes, clone', 'magicchecklists'),
                'tryAgain' => __('Try Again', 'magicchecklists'),
                'clearFilters' => __('Clear Filters', 'magicchecklists'),
                'addNewChecklist' => __('Add New Checklist', 'magicchecklists'),
                'edit' => __('Edit', 'magicchecklists'),
                'clone' => __('Clone', 'magicchecklists'),
                'delete' => __('Delete', 'magicchecklists'),
            ),
            'messages' => array(
                'checklistPrefix' => __('Checklist', 'magicchecklists'),
                'hasBeenPrefix' => __('has been', 'magicchecklists'),
                'activated' => __('activated', 'magicchecklists'),
                'deactivated' => __('deactivated', 'magicchecklists'),
                'successfully' => __('successfully', 'magicchecklists'),
                'hasBeenDeleted' => __('has been deleted', 'magicchecklists'),
                'hasBeenCloned' => __('has been cloned', 'magicchecklists'),
                'deleteConfirmation' => __('Are you sure you want to delete this checklist? This action cannot be undone.', 'magicchecklists'),
                'cloneConfirmation' => __('Are you sure you want to clone this checklist?', 'magicchecklists'),
                'noChecklistsFound' => __('No checklists found', 'magicchecklists'),
                'noChecklistsMatch' => __('No checklists match your filters', 'magicchecklists'),
                'createFirstChecklist' => __('Create your first checklist to get started.', 'magicchecklists'),
                'adjustFilters' => __('Try adjusting your search or filter criteria.', 'magicchecklists'),
            ),
            'titles' => array(
                'checklistPrefix' => __('Checklist', 'magicchecklists'),
                'activated' => __('Activated', 'magicchecklists'),
                'deactivated' => __('Deactivated', 'magicchecklists'),
                'statusUpdateFailed' => __('Status Update Failed', 'magicchecklists'),
                'deleteChecklist' => __('Delete Checklist', 'magicchecklists'),
                'checklistDeleted' => __('Checklist Deleted', 'magicchecklists'),
                'deleteFailed' => __('Delete Failed', 'magicchecklists'),
                'cloneChecklist' => __('Clone Checklist', 'magicchecklists'),
                'checklistCloned' => __('Checklist Cloned', 'magicchecklists'),
                'cloneFailed' => __('Clone Failed', 'magicchecklists'),
            ),
            'errors' => array(
                'fetchFailed' => __('Failed to fetch checklists', 'magicchecklists'),
                'toggleStatusFailed' => __('Failed to toggle status', 'magicchecklists'),
                'updateStatusFailed' => __('Failed to update checklist status. Please try again.', 'magicchecklists'),
                'deleteFailed' => __('Failed to delete checklist', 'magicchecklists'),
                'deleteError' => __('Failed to delete checklist. Please try again.', 'magicchecklists'),
                'cloneFailed' => __('Failed to clone checklist', 'magicchecklists'),
                'cloneError' => __('Failed to clone checklist. Please try again.', 'magicchecklists'),
                'loadingTitle' => __('Error loading checklists', 'magicchecklists'),
            ),
            'loading' => array(
                'checklists' => __('Loading checklists...', 'magicchecklists'),
            ),
            'priorities' => array(
                'urgent' => __('Urgent', 'magicchecklists'),
                'high' => __('High', 'magicchecklists'),
                'normal' => __('Normal', 'magicchecklists'),
                'low' => __('Low', 'magicchecklists'),
                'none' => __('None', 'magicchecklists'),
            ),
            'types' => array(
                'publisher' => __('Publisher', 'magicchecklists'),
                'classic' => __('Classic', 'magicchecklists'),
            ),
            'table' => array(
                'headers' => array(
                    'title' => __('Title', 'magicchecklists'),
                    'type' => __('Type', 'magicchecklists'),
                    'priority' => __('Priority', 'magicchecklists'),
                    'tags' => __('Tags', 'magicchecklists'),
                    'description' => __('Description', 'magicchecklists'),
                    'status' => __('Status', 'magicchecklists'),
                    'shortcut' => __('Shortcut', 'magicchecklists'),
                    'actions' => __('Actions', 'magicchecklists'),
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
                'title' => __('Create New Item', 'magicchecklists'),
                'description' => __('Choose what you want to create. Each type serves different purposes and has unique features.', 'magicchecklists'),
            ),
            'classic' => array(
                'title' => __('Classic Checklist', 'magicchecklists'),
                'description' => __('Traditional checklists with custom items, keyboard shortcuts, and floating buttons. Perfect for personal task management and team collaboration.', 'magicchecklists'),
                'buttonText' => __('Create Classic Checklist', 'magicchecklists'),
                'features' => array(
                    'customItems' => __('Custom checklist items', 'magicchecklists'),
                    'keyboardShortcuts' => __('Keyboard shortcuts', 'magicchecklists'),
                    'floatingButtons' => __('Floating buttons', 'magicchecklists'),
                    'accessControl' => __('Access control', 'magicchecklists'),
                    'themes' => __('Themes and customization', 'magicchecklists'),
                    'shortcode' => __('Shortcode support', 'magicchecklists'),
                ),
            ),
            'publisher' => array(
                'title' => __('Publisher Checklist', 'magicchecklists'),
                'description' => __('Content publishing requirements with automatic verification. Ensure posts and pages meet quality standards before publication.', 'magicchecklists'),
                'buttonText' => __('Create Publisher Checklist', 'magicchecklists'),
                'features' => array(
                    'automaticChecking' => __('Automatic requirement checking', 'magicchecklists'),
                    'wordCount' => __('Word count validation', 'magicchecklists'),
                    'seoRequirements' => __('SEO requirements', 'magicchecklists'),
                    'featuredImage' => __('Featured image verification', 'magicchecklists'),
                    'linksAndTaxonomy' => __('Link and taxonomy checks', 'magicchecklists'),
                    'publishingPrevention' => __('Publishing prevention', 'magicchecklists'),
                ),
            ),
            'tour' => array(
                'title' => __('Tour', 'magicchecklists'),
                'description' => __('Guided tours that lead users through your WordPress admin or frontend. Perfect for onboarding, training, and feature introduction.', 'magicchecklists'),
                'buttonText' => __('Create Interactive Tour', 'magicchecklists'),
                'features' => array(
                    'stepByStep' => __('Step-by-step guidance', 'magicchecklists'),
                    'interactive' => __('Interactive elements', 'magicchecklists'),
                    'conditionalLogic' => __('Conditional logic', 'magicchecklists'),
                    'userTargeting' => __('User targeting', 'magicchecklists'),
                    'progressTracking' => __('Progress tracking', 'magicchecklists'),
                    'visualHighlights' => __('Visual highlights', 'magicchecklists'),
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
                'useCustomTip' => __('Use custom tip', 'magicchecklists'),
                'customTip' => __('Custom helpful tip', 'magicchecklists'),
                'minimumWords' => __('Minimum words', 'magicchecklists'),
                'minimumLength' => __('Minimum Length', 'magicchecklists'),
                'maximumLength' => __('Maximum Length', 'magicchecklists'),
                'minimumCategories' => __('Minimum categories', 'magicchecklists'),
                'minimumTags' => __('Minimum tags', 'magicchecklists'),
                'minimumExternalLinks' => __('Minimum external links', 'magicchecklists'),
                'minimumInternalLinks' => __('Minimum internal links', 'magicchecklists'),
                'minimumTitleLength' => __('Minimum title length', 'magicchecklists'),
                'maximumTitleLength' => __('Maximum title length', 'magicchecklists'),
                'minimumExcerptLength' => __('Minimum excerpt length', 'magicchecklists'),
                'maximumExcerptLength' => __('Maximum excerpt length', 'magicchecklists'),
                'minimumMetaDescriptionLength' => __('Minimum meta description length', 'magicchecklists'),
                'maximumMetaDescriptionLength' => __('Maximum meta description length', 'magicchecklists'),
                'minimumMetaTitleLength' => __('Minimum meta title length', 'magicchecklists'),
                'maximumMetaTitleLength' => __('Maximum meta title length', 'magicchecklists'),
                'minimumImages' => __('Minimum images', 'magicchecklists'),
                'fieldName' => __('Field Name', 'magicchecklists'),
                'displayLabel' => __('Display Label', 'magicchecklists'),
                'minimumH2' => __('Minimum H2 headings', 'magicchecklists'),
                'minimumH3' => __('Minimum H3 headings', 'magicchecklists'),
                'minimumH4' => __('Minimum H4 headings', 'magicchecklists'),
                'itemTitle' => __('Item Title', 'magicchecklists'),
                'description' => __('Description', 'magicchecklists'),
                'required' => __('Required', 'magicchecklists'),
                'automaticallyVerified' => __('Automatically verified', 'magicchecklists'),
                'manualVerificationRequired' => __('Manual verification required', 'magicchecklists'),
                'repeatable' => __('Repeatable', 'magicchecklists'),
            ),
            'requirements' => array(
                'wordCount' => array(
                    'label' => __('Minimum Word Count', 'magicchecklists'),
                    'description' => __('Content must have at least [X] words', 'magicchecklists'),
                ),
                'featuredImage' => array(
                    'label' => __('Featured Image', 'magicchecklists'),
                    'description' => __('Post must have a featured image', 'magicchecklists'),
                ),
                'excerpt' => array(
                    'label' => __('Excerpt', 'magicchecklists'),
                    'description' => __('Excerpt must be between [X] and [Y] characters', 'magicchecklists'),
                ),
                'categories' => array(
                    'label' => __('Minimum Categories', 'magicchecklists'),
                    'description' => __('Post must have at least [X] categories', 'magicchecklists'),
                ),
                'tags' => array(
                    'label' => __('Minimum Tags', 'magicchecklists'),
                    'description' => __('Post must have at least [X] tags', 'magicchecklists'),
                ),
                'externalLinks' => array(
                    'label' => __('External Links', 'magicchecklists'),
                    'description' => __('Content must have at least [X] external links', 'magicchecklists'),
                ),
                'internalLinks' => array(
                    'label' => __('Internal Links', 'magicchecklists'),
                    'description' => __('Content must have at least [X] internal links', 'magicchecklists'),
                ),
                'titleLength' => array(
                    'label' => __('Title Length', 'magicchecklists'),
                    'description' => __('Title must be between [X] and [Y] characters', 'magicchecklists'),
                ),
                'metaDescription' => array(
                    'label' => __('Meta Description', 'magicchecklists'),
                    'description' => __('Meta description must be between [X] and [Y] characters', 'magicchecklists'),
                ),
                'metaTitle' => array(
                    'label' => __('Meta Title', 'magicchecklists'),
                    'description' => __('Meta title must be between [X] and [Y] characters', 'magicchecklists'),
                ),
                'imageAltText' => array(
                    'label' => __('Image Alt Text', 'magicchecklists'),
                    'description' => __('All images must have alt text for accessibility', 'magicchecklists'),
                ),
                'headingCount' => array(
                    'label' => __('Heading Count', 'magicchecklists'),
                    'description' => __('Content must have specific heading counts (H2, H3, H4)', 'magicchecklists'),
                ),
                'imageCount' => array(
                    'label' => __('Image Count', 'magicchecklists'),
                    'description' => __('Content must have at least [X] images', 'magicchecklists'),
                ),
                'customField' => array(
                    'label' => __('Custom Field', 'magicchecklists'),
                    'description' => __('Custom field must be filled', 'magicchecklists'),
                ),
                'customItem' => array(
                    'label' => __('Custom Item', 'magicchecklists'),
                    'description' => __('Manual verification required', 'magicchecklists'),
                ),
            ),
            'sections' => array(
                'basicSettings' => __('Basic Settings', 'magicchecklists'),
                'contentRequirements' => __('Content Requirements', 'magicchecklists'),
            ),
            'buttons' => array(
                'addCustomField' => __('Add Custom Field', 'magicchecklists'),
                'addCustomItem' => __('Add Custom Item', 'magicchecklists'),
                'create' => __('Create Publisher Checklist', 'magicchecklists'),
                'update' => __('Update Publisher Checklist', 'magicchecklists'),
                'saveChecklist' => __('Save Checklist', 'magicchecklists'),
                'addCustomRequirement' => __('Add Custom Requirement', 'magicchecklists'),
                'removeRequirement' => __('Remove', 'magicchecklists'),
            ),
            'metaFieldSelector' => array(
                'placeholder' => __('Type or select a custom field...', 'magicchecklists'),
                'loading' => __('Loading...', 'magicchecklists'),
                'noFields' => __('No fields found', 'magicchecklists'),
            ),
            'labels' => array(
                'checklistName' => __('Checklist Name', 'magicchecklists'),
                'description' => __('Description', 'magicchecklists'),
                'preventPublishing' => __('Prevent publishing if requirements are not met', 'magicchecklists'),
                'blockPublishing' => __('Block publishing completely', 'magicchecklists'),
                'showWarning' => __('Show warning only', 'magicchecklists'),
                'postTypes' => __('Post Types', 'magicchecklists'),
                'userRoles' => __('User Roles', 'magicchecklists'),
                'requirements' => __('Requirements', 'magicchecklists'),
                'wordCount' => __('Word Count', 'magicchecklists'),
                'hasExcerpt' => __('Has Excerpt', 'magicchecklists'),
                'hasFeaturedImage' => __('Has Featured Image', 'magicchecklists'),
                'hasCategories' => __('Has Categories', 'magicchecklists'),
                'hasTags' => __('Has Tags', 'magicchecklists'),
                'hasCustomFields' => __('Has Custom Fields', 'magicchecklists'),
                'hasInternalLinks' => __('Has Internal Links', 'magicchecklists'),
                'hasExternalLinks' => __('Has External Links', 'magicchecklists'),
                'seoTitle' => __('SEO Title', 'magicchecklists'),
                'seoDescription' => __('SEO Description', 'magicchecklists'),
                'enableReadabilityChecks' => __('Enable readability checks', 'magicchecklists'),
                'customRequirement' => __('Custom Requirement', 'magicchecklists'),
                'minimumWords' => __('Minimum words', 'magicchecklists'),
                'maximumWords' => __('Maximum words', 'magicchecklists'),
                'minimumLinks' => __('Minimum links', 'magicchecklists'),
                'minimumCategories' => __('Minimum categories', 'magicchecklists'),
                'minimumTags' => __('Minimum tags', 'magicchecklists'),
                'requiredFields' => __('Required fields (comma-separated)', 'magicchecklists'),
                'titleMinLength' => __('Title min length', 'magicchecklists'),
                'titleMaxLength' => __('Title max length', 'magicchecklists'),
                'descriptionMinLength' => __('Description min length', 'magicchecklists'),
                'descriptionMaxLength' => __('Description max length', 'magicchecklists'),
                'customRequirementName' => __('Requirement name', 'magicchecklists'),
                'customRequirementDescription' => __('Description', 'magicchecklists'),
            ),
            'placeholders' => array(
                'checklistName' => __('Enter checklist name', 'magicchecklists'),
                'description' => __('Enter checklist description', 'magicchecklists'),
                'customTip' => __('Enter your custom tip for this requirement...', 'magicchecklists'),
                'selectField' => __('Select a custom field...', 'magicchecklists'),
                'fieldLabel' => __('Label for this field...', 'magicchecklists'),
                'minimumWords' => __('e.g., 300', 'magicchecklists'),
                'maximumWords' => __('e.g., 2000', 'magicchecklists'),
                'minimumLinks' => __('e.g., 2', 'magicchecklists'),
                'minimumCategories' => __('e.g., 1', 'magicchecklists'),
                'minimumTags' => __('e.g., 3', 'magicchecklists'),
                'requiredFields' => __('field1, field2, field3', 'magicchecklists'),
                'titleMinLength' => __('e.g., 30', 'magicchecklists'),
                'titleMaxLength' => __('e.g., 60', 'magicchecklists'),
                'descriptionMinLength' => __('e.g., 120', 'magicchecklists'),
                'descriptionMaxLength' => __('e.g., 160', 'magicchecklists'),
                'customRequirementName' => __('Enter requirement name', 'magicchecklists'),
                'customRequirementDescription' => __('Describe what this requirement checks', 'magicchecklists'),
            ),
            'messages' => array(
                'checklistSaved' => __('Publisher checklist saved successfully!', 'magicchecklists'),
                'selectAtLeastOnePostType' => __('Please select at least one post type', 'magicchecklists'),
                'selectAtLeastOneUserRole' => __('Please select at least one user role', 'magicchecklists'),
                'selectAtLeastOneRequirement' => __('Please select at least one requirement', 'magicchecklists'),
                'checklistNameRequired' => __('Checklist name is required', 'magicchecklists'),
                'validNumberRequired' => __('Please enter a valid number', 'magicchecklists'),
                'positiveNumberRequired' => __('Please enter a positive number', 'magicchecklists'),
                'maxMustBeGreaterThanMin' => __('Maximum value must be greater than minimum value', 'magicchecklists'),
                'customRequirementNameRequired' => __('Custom requirement name is required', 'magicchecklists'),
            ),
            'descriptions' => array(
                'checklistDescription' => __('Describe the purpose of this publishing checklist', 'magicchecklists'),
                'checklistName' => __('This name will be shown in the Gutenberg sidebar when editing posts/pages.', 'magicchecklists'),
                'postTypes' => __('Select which post types this checklist should apply to.', 'magicchecklists'),
                'activeStatus' => __('When active, this checklist will be shown in the Gutenberg editor for the selected post types.', 'magicchecklists'),
                'tips' => __('When enabled, the Gutenberg sidebar will show helpful tips for failed requirements to guide content creators.', 'magicchecklists'),
                'contentRequirements' => __('Configure automatic checks that will verify content quality. Required items will prevent publishing until satisfied.', 'magicchecklists'),
                'preventPublishingDescription' => __('Choose how to handle posts that don\'t meet requirements', 'magicchecklists'),
                'postTypesDescription' => __('Select which post types this checklist applies to', 'magicchecklists'),
                'userRolesDescription' => __('Select which user roles this checklist applies to', 'magicchecklists'),
                'requirementsDescription' => __('Configure publishing requirements and validation rules', 'magicchecklists'),
                'wordCountDescription' => __('Set minimum and maximum word count requirements', 'magicchecklists'),
                'hasExcerptDescription' => __('Require posts to have an excerpt', 'magicchecklists'),
                'hasFeaturedImageDescription' => __('Require posts to have a featured image', 'magicchecklists'),
                'hasCategoriesDescription' => __('Require posts to have categories assigned', 'magicchecklists'),
                'hasTagsDescription' => __('Require posts to have tags assigned', 'magicchecklists'),
                'hasCustomFieldsDescription' => __('Require specific custom fields to be filled', 'magicchecklists'),
                'hasInternalLinksDescription' => __('Require posts to contain internal links', 'magicchecklists'),
                'hasExternalLinksDescription' => __('Require posts to contain external links', 'magicchecklists'),
                'seoTitleDescription' => __('Set SEO title length requirements', 'magicchecklists'),
                'seoDescriptionDescription' => __('Set SEO meta description length requirements', 'magicchecklists'),
                'readabilityChecksDescription' => __('Enable readability score validation (requires SEO plugin)', 'magicchecklists'),
                'customRequirementDescription' => __('Define custom publishing requirements with your own validation logic', 'magicchecklists'),
            ),
            'validation' => array(
                'fieldNameRequired' => __('Field name is required', 'magicchecklists'),
                'itemTitleRequired' => __('Item title is required', 'magicchecklists'),
            ),
            'errors' => array(
                'saveFailed' => __('Failed to save publisher checklist', 'magicchecklists'),
                'loadFailed' => __('Failed to load checklist data', 'magicchecklists'),
                'validationFailed' => __('Please correct the errors above before saving', 'magicchecklists'),
            ),
            'loading' => array(
                'saving' => __('Saving...', 'magicchecklists'),
                'loadingChecklist' => __('Loading checklist...', 'magicchecklists'),
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
            'noTourData' => __('MCL Tour Playback: No tour data provided', 'magicchecklists'),
            'noTourSteps' => __('MCL Tour Playback: Tour has no steps', 'magicchecklists'),
            'driverNotAvailable' => __('MCL Tour Playback: Driver function not available, retrying...', 'magicchecklists'),
            'driverStillNotAvailable' => __('MCL Tour Playback: Driver function still not available after retry', 'magicchecklists'),
            'clickContinueNextPage' => __('Click "Continue" to go to the next page...', 'magicchecklists'),
            'tourStep' => __('Tour Step', 'magicchecklists'),
            'continue' => __('Continue', 'magicchecklists'),
            'done' => __('Done', 'magicchecklists'),
            'next' => __('Next', 'magicchecklists'),
            'previous' => __('Previous', 'magicchecklists'),
            'errorNextStep' => __('MCL Tour: Error moving to next step', 'magicchecklists'),
            'errorPrevStepSamePage' => __('MCL Tour: Error moving to previous step within page', 'magicchecklists'),
            'errorPrevStep' => __('MCL Tour: Error moving to previous step', 'magicchecklists'),
            'exitConfirmation' => __('Are you sure you want to exit the tour?', 'magicchecklists'),
            'errorCloseConfirmation' => __('MCL Tour: Error in close confirmation:', 'magicchecklists'),
            'errorStartingTour' => __('MCL Tour Playback: Error starting tour:', 'magicchecklists'),
            'errorContinuingTour' => __('MCL Tour Playback: Error continuing tour:', 'magicchecklists'),
            'loadingNextPage' => __('Loading next page...', 'magicchecklists'),
            'closeTour' => __('Close tour', 'magicchecklists'),
            'checkItemMissingParams' => __('MCL Tour: checkChecklistItem - Missing parameters', 'magicchecklists'),
            'failedCheckItem' => __('MCL Tour: Failed to check checklist item', 'magicchecklists'),
            'errorCheckingItem' => __('MCL Tour Playback: Error checking checklist item:', 'magicchecklists'),
            'uncheckItemMissingParams' => __('MCL Tour: uncheckChecklistItem - Missing parameters', 'magicchecklists'),
            'failedUncheckItem' => __('MCL Tour: Failed to uncheck checklist item', 'magicchecklists'),
            'errorUncheckingItem' => __('MCL Tour Playback: Error unchecking checklist item:', 'magicchecklists'),
            'closeModal' => __('Close modal', 'magicchecklists'),
            'exitTourTitle' => __('Exit Tour?', 'magicchecklists'),
            'noContinueTour' => __('No, continue tour', 'magicchecklists'),
            'yesExitTour' => __('Yes, exit tour', 'magicchecklists'),
        );
    }

    /**
     * Get tour creator translations
     * 
     * @return array
     */
    public static function get_tour_creator_translations() {
        return array(
            'failedLoadTourData' => __('Failed to load tour data', 'magicchecklists'),
            'errorLoadingTourData' => __('Error loading tour data:', 'magicchecklists'),
            'previewFailedTimeout' => __('Preview failed: Tour steps could not be loaded in time.', 'magicchecklists'),
            'noStepsForPreview' => __('No tour steps available for preview. Please ensure the tour is loaded.', 'magicchecklists'),
            'invalidStepIndex' => __('Invalid step index for preview:', 'magicchecklists'),
            'tourHasSteps' => __('Tour has', 'magicchecklists'),
            'steps' => __('steps', 'magicchecklists'),
            'previewNotAvailable' => __('Tour preview is not available. Please refresh the page and try again.', 'magicchecklists'),
            'preview' => __('Preview', 'magicchecklists'),
            'previewTour' => __('Preview Tour', 'magicchecklists'),
            'errorLoadingChecklists' => __('Error loading checklists:', 'magicchecklists'),
            'stepDeletedSuccessfully' => __('Step deleted successfully', 'magicchecklists'),
            'tourTitleRequired' => __('Tour title is required to save.', 'magicchecklists'),
            'tourSavedSuccessfully' => __('Tour saved successfully!', 'magicchecklists'),
            'errorSavingTour' => __('Error saving tour', 'magicchecklists'),
            'addStepsBeforePreview' => __('Please add some steps before previewing the tour.', 'magicchecklists'),
            'failedSavePreviewWarning' => __('Failed to save tour data. Preview may not work correctly.', 'magicchecklists'),
            'clickElementToSelect' => __('Click on an element to select it...', 'magicchecklists'),
            'tourCreator' => __('Tour Creator', 'magicchecklists'),
            'selectMode' => __('Select Mode', 'magicchecklists'),
            'navigateMode' => __('Navigate Mode', 'magicchecklists'),
            'navigate' => __('Navigate', 'magicchecklists'),
            'select' => __('Select', 'magicchecklists'),
            'clickElementsToCreateSteps' => __('Click on elements to create tour steps', 'magicchecklists'),
            'navigateNormally' => __('Navigate the site normally - links and forms will work', 'magicchecklists'),
            'saving' => __('Saving...', 'magicchecklists'),
            'save' => __('Save', 'magicchecklists'),
            'exit' => __('Exit', 'magicchecklists'),
            'step' => __('step', 'magicchecklists'),
            'noStepsAdded' => __('No steps added yet. Click on elements to create steps.', 'magicchecklists'),
            'untitledStep' => __('Untitled Step', 'magicchecklists'),
            'noElement' => __('No element', 'magicchecklists'),
            'editTourStep' => __('Edit Tour Step', 'magicchecklists'),
            'stepTitle' => __('Step Title', 'magicchecklists'),
            'enterStepTitle' => __('Enter step title...', 'magicchecklists'),
            'stepContent' => __('Step Content', 'magicchecklists'),
            'enterStepContent' => __('Enter the content for this step...', 'magicchecklists'),
            'canUseHTML' => __('You can use HTML for formatting.', 'magicchecklists'),
            'linkToChecklist' => __('Link to Checklist', 'magicchecklists'),
            'selectChecklistOptional' => __('Select a checklist (optional)', 'magicchecklists'),
            'linkToItem' => __('Link to Item', 'magicchecklists'),
            'selectItemOptional' => __('Select an item (optional)', 'magicchecklists'),
            'popoverPosition' => __('Popover Position', 'magicchecklists'),
            'bottomDefault' => __('Bottom (Default)', 'magicchecklists'),
            'top' => __('Top', 'magicchecklists'),
            'left' => __('Left', 'magicchecklists'),
            'right' => __('Right', 'magicchecklists'),
            'targetElement' => __('Target Element', 'magicchecklists'),
            'cssSelectorPlaceholder' => __('CSS selector (e.g., #my-button)', 'magicchecklists'),
            'clickToSelectElement' => __('Click to select element visually', 'magicchecklists'),
            'enterCssSelectorOrClick' => __('Enter a CSS selector or click the crosshairs to select an element visually.', 'magicchecklists'),
            'pageUrl' => __('Page URL', 'magicchecklists'),
            'leaveEmptyForCurrentPage' => __('Leave empty for current page', 'magicchecklists'),
            'pageUrlDescription' => __('The page where this step should appear. Leave empty to use the current page.', 'magicchecklists'),
            'showNavigationButtons' => __('Show navigation buttons', 'magicchecklists'),
            'cancel' => __('Cancel', 'magicchecklists'),
            'saveStep' => __('Save Step', 'magicchecklists'),
            'exitTourCreatorTitle' => __('Exit Tour Creator?', 'magicchecklists'),
            'exitConfirmMessage' => __('Are you sure you want to exit? Any unsaved changes will be lost.', 'magicchecklists'),
            'yesExit' => __('Yes, exit', 'magicchecklists'),
            'noContinueEditing' => __('No, continue editing', 'magicchecklists'),
            'deleteTourStepTitle' => __('Delete Tour Step?', 'magicchecklists'),
            'deleteStepConfirm' => __('Are you sure you want to delete', 'magicchecklists'),
            'deleteThisStep' => __('Are you sure you want to delete this step?', 'magicchecklists'),
            'yesDelete' => __('Yes, delete', 'magicchecklists'),
            'noKeepIt' => __('No, keep it', 'magicchecklists'),
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
            'basicInformation' => __('Basic Information', 'magicchecklists'),
            'tourTitle' => __('Tour Title', 'magicchecklists'),
            'enterTourTitle' => __('Enter tour title...', 'magicchecklists'),
            'tourTitleDescription' => __('Give your tour a descriptive name.', 'magicchecklists'),
            'description' => __('Description', 'magicchecklists'),
            'optionalDescription' => __('Optional description for this tour...', 'magicchecklists'),
            'descriptionHelp' => __('Optional description to help you remember what this tour is for.', 'magicchecklists'),
            'activeLabel' => __('Active (show this tour to users)', 'magicchecklists'),
            'activeDescription' => __('Only active tours will be displayed to users.', 'magicchecklists'),
            
            // Trigger Settings
            'triggerSettings' => __('Trigger Settings', 'magicchecklists'),
            'triggerLocation' => __('Trigger Location', 'magicchecklists'),
            'specificPageUrl' => __('Specific Page URL', 'magicchecklists'),
            'selectTemplateOrCustomUrl' => __('Select a template or enter custom URL', 'magicchecklists'),
            'urlPlaceholder' => __('e.g., /wp-admin/edit.php', 'magicchecklists'),
            'urlHelp' => __('Enter the URL where this tour should trigger. Use * for wildcards.', 'magicchecklists'),
            'whenCssSelectorExists' => __('When CSS Selector Exists', 'magicchecklists'),
            'cssSelectorPlaceholder' => __('e.g., .my-button, #specific-element', 'magicchecklists'),
            'cssSelectorHelp' => __('Tour will trigger when this CSS selector is found on any page.', 'magicchecklists'),
            'usersFirstLogin' => __('User\'s First Login (any page)', 'magicchecklists'),
            'firstLoginHelp' => __('Tour will show only on the user\'s first login to WordPress.', 'magicchecklists'),
            'anyPage' => __('Any Page', 'magicchecklists'),
            'anyPageHelp' => __('Tour can trigger on any page (use with caution).', 'magicchecklists'),
            
            // User Conditions
            'userConditions' => __('User Conditions', 'magicchecklists'),
            'whoShouldSeeTour' => __('Who should see this tour?', 'magicchecklists'),
            'allUsers' => __('All Users (logged in and logged out)', 'magicchecklists'),
            'allLoggedInUsers' => __('All Logged In Users', 'magicchecklists'),
            'allLoggedOutUsers' => __('All Logged Out Users', 'magicchecklists'),
            'specificUsersOnly' => __('Specific Users Only', 'magicchecklists'),
            'selectSpecificUsersHelp' => __('Select specific users who should see this tour.', 'magicchecklists'),
            'typeUsernames' => __('Type usernames...', 'magicchecklists'),
            'specificUserRolesOnly' => __('Specific User Roles Only', 'magicchecklists'),
            'selectUserRolesHelp' => __('Select user roles that should see this tour.', 'magicchecklists'),
            'selectUserRoles' => __('Select user roles...', 'magicchecklists'),
            
            // Display Options
            'displayOptions' => __('Display Options', 'magicchecklists'),
            'autostartTourWhenTriggered' => __('Auto-start tour when triggered', 'magicchecklists'),
            'autostartHelp' => __('If enabled, the tour will start automatically when the trigger conditions are met.', 'magicchecklists'),
            'showOnlyOncePerUser' => __('Show only once per user', 'magicchecklists'),
            'showOnceHelp' => __('If checked, each user will only see this tour once. Tracked by user account or browser cookie.', 'magicchecklists'),
            
            // Appearance & Behavior
            'appearanceBehavior' => __('Appearance & Behavior', 'magicchecklists'),
            'animation' => __('Animation', 'magicchecklists'),
            'enableAnimatedTransitions' => __('Enable animated transitions', 'magicchecklists'),
            'animationHelp' => __('When enabled, the tour will smoothly animate between steps. Disable for a static, instant appearance.', 'magicchecklists'),
            'progressDisplay' => __('Progress Display', 'magicchecklists'),
            'showProgressIndicator' => __('Show progress indicator', 'magicchecklists'),
            'progressTextTemplate' => __('Progress Text Template', 'magicchecklists'),
            'progressPlaceholder' => __('{{current}} of {{total}}', 'magicchecklists'),
            'progressHelp' => __('Customize the progress text. Use {{current}} for current step and {{total}} for total steps.', 'magicchecklists'),
            
            // Exit Control
            'exitControl' => __('Exit Control', 'magicchecklists'),
            'allowUsersToCloseTour' => __('Allow users to close tour', 'magicchecklists'),
            'allowCloseHelp' => __('When disabled, users must complete the entire tour before they can exit.', 'magicchecklists'),
            'showConfirmationDialogBeforeExit' => __('Show confirmation dialog before exit', 'magicchecklists'),
            'exitConfirmationMessage' => __('Exit Confirmation Message', 'magicchecklists'),
            'exitConfirmationPlaceholder' => __('Are you sure you want to exit the tour?', 'magicchecklists'),
            'exitConfirmationHelp' => __('Message shown when users try to exit the tour (only when confirmation is enabled).', 'magicchecklists'),
            
            // Button Text
            'buttonText' => __('Button Text', 'magicchecklists'),
            'nextButtonText' => __('Next Button Text', 'magicchecklists'),
            'nextPlaceholder' => __('Next', 'magicchecklists'),
            'previousButtonText' => __('Previous Button Text', 'magicchecklists'),
            'previousPlaceholder' => __('Previous', 'magicchecklists'),
            'doneButtonText' => __('Done Button Text', 'magicchecklists'),
            'donePlaceholder' => __('Done', 'magicchecklists'),
            'closeButtonText' => __('Close Button Text', 'magicchecklists'),
            'closePlaceholder' => __('Close', 'magicchecklists'),
            'buttonTextHelp' => __('Customize the text displayed on tour navigation buttons.', 'magicchecklists'),
            
            // Default Buttons
            'defaultButtonsToShow' => __('Default Buttons to Show', 'magicchecklists'),
            'nextButton' => __('Next button', 'magicchecklists'),
            'previousButton' => __('Previous button', 'magicchecklists'),
            'closeButton' => __('Close button', 'magicchecklists'),
            'defaultButtonsHelp' => __('Select which buttons should be shown by default on each tour step. Individual steps can override these settings.', 'magicchecklists'),
            
            // Overlay Style
            'overlayStyle' => __('Overlay Style', 'magicchecklists'),
            'overlayColor' => __('Overlay Color', 'magicchecklists'),
            'overlayOpacity' => __('Overlay Opacity', 'magicchecklists'),
            'overlayHelp' => __('Customize the background overlay that appears behind the tour popover.', 'magicchecklists'),
            
            // Popover Style
            'popoverStyle' => __('Popover Style', 'magicchecklists'),
            'customCssClass' => __('Custom CSS Class', 'magicchecklists'),
            'customCssPlaceholder' => __('my-custom-tour-theme', 'magicchecklists'),
            'customCssHelp' => __('Add a custom CSS class to style the popover. Leave empty for default styling. Try: magiccl-theme-dark, magiccl-theme-primary, magiccl-theme-minimal, magiccl-theme-rounded, or magiccl-theme-large.', 'magicchecklists'),
            
            // Advanced Options
            'advancedOptions' => __('Advanced Options', 'magicchecklists'),
            'highlightPadding' => __('Highlight Padding', 'magicchecklists'),
            'paddingHelp' => __('Padding around highlighted elements in pixels.', 'magicchecklists'),
            'smoothScroll' => __('Smooth Scroll', 'magicchecklists'),
            'smoothScrollHelp' => __('Enable smooth scrolling to highlighted elements.', 'magicchecklists'),
            
            // Tour Steps
            'tourStep' => __('Tour Step', 'magicchecklists'),
            'tourStepsTitle' => __('Tour Steps', 'magicchecklists'),
            'dragToReorder' => __('(drag to reorder)', 'magicchecklists'),
            'noStepsYet' => __('No steps added yet. Use the visual creator to add steps.', 'magicchecklists'),
            'viewAllSteps' => __('View All Steps', 'magicchecklists'),
            
            // Actions
            'saveAndOpenVisualCreator' => __('Save & Open Visual Creator', 'magicchecklists'),
            'saveSettingsOnly' => __('Save Settings Only', 'magicchecklists'),
            'resetMyCompletion' => __('Reset My Completion', 'magicchecklists'),
            'saving' => __('Saving...', 'magicchecklists'),
            'backToTours' => __('Back to Tours', 'magicchecklists'),
            
            // Getting Started / Create Guide
            'gettingStarted' => __('Getting Started', 'magicchecklists'),
            'createYourTour' => __('Create Your Tour', 'magicchecklists'),
            'configureSettings' => __('Configure Settings', 'magicchecklists'),
            'configureSettingsDescription' => __('Set up the basic information, trigger conditions, and customize the appearance.', 'magicchecklists'),
            'addTourSteps' => __('Add Tour Steps', 'magicchecklists'),
            'addTourStepsDescription' => __('Use the visual tour creator to add interactive steps by clicking on elements.', 'magicchecklists'),
            'previewAndTest' => __('Preview & Test', 'magicchecklists'),
            'previewAndTestDescription' => __('Use the preview feature to test your tour and make adjustments.', 'magicchecklists'),
            'testAndActivate' => __('Test & Activate', 'magicchecklists'),
            'testAndActivateDescription' => __('Preview your tour, make adjustments, then activate it for your users.', 'magicchecklists'),
            'configureTrigger' => __('Configure Trigger', 'magicchecklists'),
            'configureTriggerDescription' => __('Choose when and where your tour should appear to users.', 'magicchecklists'),
            'saveAndCreate' => __('Save & Create', 'magicchecklists'),
            'saveAndCreateDescription' => __('Click "Save & Open Visual Creator" to start adding interactive steps.', 'magicchecklists'),
            'addSteps' => __('Add Steps', 'magicchecklists'),
            'addStepsDescription' => __('Use the visual creator to click on elements and create guided tour steps.', 'magicchecklists'),
            'setTourTitle' => __('Set Tour Title', 'magicchecklists'),
            'setTourTitleDescription' => __('Give your tour a descriptive name that explains its purpose.', 'magicchecklists'),
            
            // Additional messages
            'tourSettingsSavedSuccessfully' => __('Tour settings saved successfully!', 'magicchecklists'),
            'errorSavingTourSettings' => __('Error saving tour settings', 'magicchecklists'),
            'errorSavingStepOrder' => __('Error saving step order', 'magicchecklists'),
        );
    }

    /**
     * Get tours list translations
     * 
     * @return array
     */
    public static function get_tours_translations() {
        return array(
            'errorUpdatingTourStatus' => __('Error updating tour status', 'magicchecklists'),
            'tourDuplicatedSuccessfully' => __('Tour duplicated successfully', 'magicchecklists'),
            'errorDuplicatingTour' => __('Error duplicating tour', 'magicchecklists'),
            'tourDeletedSuccessfully' => __('Tour deleted successfully', 'magicchecklists'),
            'errorDeletingTour' => __('Error deleting tour', 'magicchecklists'),
            'tourCompletionResetSuccessfully' => __('Tour completion reset successfully', 'magicchecklists'),
            'errorResettingTourCompletion' => __('Error resetting tour completion', 'magicchecklists'),
            'pageUrl' => __('Page URL', 'magicchecklists'),
            'cssSelector' => __('CSS Selector', 'magicchecklists'),
            'firstLogin' => __('First Login', 'magicchecklists'),
            'anyPage' => __('Any Page', 'magicchecklists'),
            'allUsers' => __('All Users', 'magicchecklists'),
            'loggedIn' => __('Logged In', 'magicchecklists'),
            'loggedOut' => __('Logged Out', 'magicchecklists'),
            'specificUsers' => __('Specific Users', 'magicchecklists'),
            'specificRoles' => __('Specific Roles', 'magicchecklists'),
            'noToursYet' => __('No tours yet', 'magicchecklists'),
            'createFirstTourDescription' => __('Create your first tour to guide users through your WordPress site.', 'magicchecklists'),
            'createYourFirstTour' => __('Create Your First Tour', 'magicchecklists'),
            'title' => __('Title', 'magicchecklists'),
            'steps' => __('Steps', 'magicchecklists'),
            'trigger' => __('Trigger', 'magicchecklists'),
            'status' => __('Status', 'magicchecklists'),
            'date' => __('Date', 'magicchecklists'),
            'actions' => __('Actions', 'magicchecklists'),
            'noTitle' => __('(no title)', 'magicchecklists'),
            'step' => __('step', 'magicchecklists'),
            'autoStart' => __('Auto-start', 'magicchecklists'),
            'active' => __('Active', 'magicchecklists'),
            'inactive' => __('Inactive', 'magicchecklists'),
            'tourSettings' => __('Tour Settings', 'magicchecklists'),
            'openCreator' => __('Open Creator', 'magicchecklists'),
            'duplicate' => __('Duplicate', 'magicchecklists'),
            'resetCompletion' => __('Reset Completion', 'magicchecklists'),
            'delete' => __('Delete', 'magicchecklists'),
            'deleteTourTitle' => __('Delete Tour', 'magicchecklists'),
            'deleteTourConfirm' => __('Are you sure you want to delete the tour', 'magicchecklists'),
            'actionCannotBeUndone' => __('This action cannot be undone.', 'magicchecklists'),
            'deleting' => __('Deleting...', 'magicchecklists'),
            'deleteTour' => __('Delete Tour', 'magicchecklists'),
            'cancel' => __('Cancel', 'magicchecklists'),
        );
    }
    
    /**
     * Get deadline display translations
     * 
     * @return array
     */
    public static function get_deadline_display_translations() {
        return array(
            'deadline' => __('Deadline', 'magicchecklists'),
            'deadlinePassed' => __('Deadline passed', 'magicchecklists'),
            'timeRemaining' => __('Time remaining', 'magicchecklists'),
            'overdue' => __('Overdue', 'magicchecklists'),
            'due' => __('Due', 'magicchecklists'),
            'remaining' => __('remaining', 'magicchecklists'),
            'daysShort' => __('d', 'magicchecklists'),
            'hoursShort' => __('h', 'magicchecklists'),
            'minutesShort' => __('m', 'magicchecklists'),
            'secondsShort' => __('s', 'magicchecklists'),
            'days' => __('days', 'magicchecklists'),
            'hours' => __('hours', 'magicchecklists'),
            'minutes' => __('minutes', 'magicchecklists'),
            'seconds' => __('seconds', 'magicchecklists'),
            'day' => __('day', 'magicchecklists'),
            'hour' => __('hour', 'magicchecklists'),
            'minute' => __('minute', 'magicchecklists'),
            'second' => __('second', 'magicchecklists'),
            'invalidDeadline' => __('Invalid deadline', 'magicchecklists'),
            'noDeadline' => __('No deadline', 'magicchecklists'),
        );
    }
    
    /**
     * Get reset notification translations
     * 
     * @return array
     */
    public static function get_reset_notification_translations() {
        return array(
            'message' => __('This checklist has been automatically reset.', 'magicchecklists'),
        );
    }
    
    /**
     * Get congratulations animation translations
     * 
     * @return array
     */
    public static function get_congrats_animation_translations() {
        return array(
            'message' => __('Great job! 🎉', 'magicchecklists'),
        );
    }
    
    /**
     * Get locked overlay translations
     * 
     * @return array
     */
    public static function get_locked_overlay_translations() {
        return array(
            'message' => __('This checklist is currently locked for editing by another user.', 'magicchecklists'),
        );
    }
}