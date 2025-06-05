if (isset($current_handle)) {
            wp_localize_script($current_handle, 'mclAdmin', array(
                'ajaxurl' => admin_url('admin-ajax.php'),
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonces' => array(
                    'mcl_toggle_active' => wp_create_nonce('mcl_toggle_active'),
                    'checkShortcut' => wp_create_nonce('mcl_check_shortcut_nonce'),
                    'inviteLinks' => wp_create_nonce($this->nonce_key),
                    'forceDeleteLock' => wp_create_nonce('mcl_force_delete_lock_nonce'),
                    'testWebhook' => wp_create_nonce('mcl_test_webhook'),
                    'pdfExport' => wp_create_nonce('mcl_save_pdf_settings')
                ),
                'currentChecklistId' => isset($_GET['checklist_id']) ? intval($_GET
                ['checklist_id']) : 0,
                'priorityColors' => MCL_Priority_Utils::get_priority_colors(),
                'priorityNumbers' => MCL_Priority_Utils::get_priority_numbers(),
                'i18n' => array(
                    'deleteAllConfirm' => __('Are you sure you want to delete all items? This 
                    cannot be undone.', 'magic-checklists'),
                    'errorUpdatingStatus' => __('An error occurred while updating the status. 
                    Please try again.', 'magic-checklists'),
                    'noInviteLinks' => __('No invite links created yet.', 'magic-checklists'),
                    'linkGenerated' => __('Invite link generated successfully.', 
                    'magic-checklists'),
                    'linkCopied' => __('Link copied to clipboard.', 'magic-checklists'),
                    'linkDeleted' => __('Invite link deleted successfully.', 
                    'magic-checklists'),
                    'confirmDeleteLink' => __('Are you sure you want to delete this invite 
                    link? Any users with this link will no longer be able to access the 
                    checklist.', 'magic-checklists'),
                    'errorGeneratingLink' => __('Error generating invite link. Please try 
                    again.', 'magic-checklists'),
                    'errorDeletingLink' => __('Error deleting invite link. Please try again.', 
                    'magic-checklists'),
                    'errorCopyingLink' => __('Error copying link to clipboard.', 
                    'magic-checklists'),
                    'copyLink' => __('Copy Link', 'magic-checklists'),
                    'deleteLink' => __('Delete Link', 'magic-checklists'),
                    'canView' => __('View Only', 'magic-checklists'),
                    'canInteract' => __('Can Interact', 'magic-checklists'),
                    'canEdit' => __('Can Edit', 'magic-checklists'),
                    'created' => __('Created', 'magic-checklists'),
                    'expires' => __('Expires', 'magic-checklists'),
                    'expired' => __('Expired', 'magic-checklists'),
                    'uses' => __('Uses', 'magic-checklists'),
                    'permissionUpdated' => __('Permission level updated successfully.', 
                    'magic-checklists'),
                    'errorUpdatingPermission' => __('Error updating permission level. Please 
                    try again.', 'magic-checklists'),
                    'webhookUrlRequired' => __('Webhook URL is required', 'magic-checklists'),
                    'webhookTestSuccess' => __('Webhook test successful', 'magic-checklists'),
                    'webhookTestFailed' => __('Webhook test failed', 'magic-checklists'),
                    'invalidWebhookUrl' => __('Invalid webhook URL format', 
                    'magic-checklists'),
                    'invalidSlackUrl' => __('Invalid Slack webhook URL', 'magic-checklists'),
                    'invalidDiscordUrl' => __('Invalid Discord webhook URL', 
                    'magic-checklists'),
                    'emailRecipientsRequired' => __('Email recipients are required', 
                    'magic-checklists'),
                    'emailTestSuccess' => __('Test email(s) sent successfully', 
                    'magic-checklists'),
                    'emailTestFailed' => __('Failed to send test email', 'magic-checklists'),
                    'invalidEmailFormat' => __('Invalid email format', 'magic-checklists'),
                    'testingEmail' => __('Testing email...', 'magic-checklists'),
                    'maxUploadSize' => wp_max_upload_size(),
                    'allowedMimeTypes' => array('image/jpeg', 'image/png', 'image/gif'),
                    'errorSavingPdfSettings' => __('Error saving PDF settings. Please try 
                    again.', 'magic-checklists'),
                )
            ));