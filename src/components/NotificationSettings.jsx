import React, { useState } from 'react'
import { Card, Button, Label, TextInput, Alert } from 'flowbite-react'
import ReactSelect from 'react-select'

// Consistent Checkbox Component
const Checkbox = ({ id, checked, onChange, label, className = "" }) => (
  <div className={`flex items-center ${className}`}>
    <div className="relative">
      <input 
        type="checkbox" 
        id={id}
        className="sr-only" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label 
        htmlFor={id}
        className={`cursor-pointer block w-4 h-4 border-2 rounded transition-all duration-200 ${
          checked 
            ? 'bg-brand-accent border-brand-accent' 
            : 'bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:border-brand-accent'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-brand-dark absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </label>
    </div>
    {label && <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{label}</span>}
  </div>
)

// Improved Toggle Component matching ChecklistsTable style
const Toggle = ({ checked, onChange, label, disabled = false }) => (
  <div className="flex items-center">
    <label className="inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent dark:peer-checked:bg-brand-accent peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
    </label>
    {label && <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{label}</span>}
  </div>
)

const NotificationSettings = ({ formData, onChange, adminData }) => {
  const [testingWebhook, setTestingWebhook] = useState({ slack: false, discord: false })
  const [testingEmail, setTestingEmail] = useState(false)
  
  // Initialize i18n data
  const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.mclAdminData?.i18n) || {};
  const t = i18n.notificationSettings || {};

  const testWebhook = async (platform) => {
    const webhookField = `${platform}_webhook_url`
    const webhookUrl = formData[webhookField]

    if (!webhookUrl) {
      alert(t.alerts?.enterWebhookUrlFirst || 'Please enter a webhook URL first')
      return
    }

    setTestingWebhook(prev => ({ ...prev, [platform]: true }))

    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_test_notification_webhook',
          platform: platform,
          webhook_url: webhookUrl,
          nonce: adminData.nonces?.testWebhook || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        alert(t.alerts?.webhookTestSuccessful || 'Test successful')
      } else {
        alert(`${t.alerts?.webhookTestFailed || 'Test failed'}: ${data.data?.message || (t.alerts?.unknownError || 'Unknown error')}`)
      }
    } catch (error) {
      console.error('Webhook test error:', error)
      alert(t.alerts?.webhookTestNetworkError || 'Test failed')
    } finally {
      setTestingWebhook(prev => ({ ...prev, [platform]: false }))
    }
  }

  const testEmailNotification = async () => {
    if (!formData.email_recipients) {
      alert(t.alerts?.enterEmailRecipientsFirst || 'Please enter email recipients first')
      return
    }

    setTestingEmail(true)

    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_test_email_notification',
          recipients: formData.email_recipients,
          nonce: adminData.nonces?.testWebhook || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        alert(t.alerts?.testEmailsSentSuccessfully || 'Test successful')
      } else {
        alert(`${t.alerts?.emailTestFailed || 'Test failed'}: ${data.data?.message || (t.alerts?.unknownError || 'Unknown error')}`)
      }
    } catch (error) {
      console.error('Email test error:', error)
      alert(t.alerts?.emailTestNetworkError || 'Test failed')
    } finally {
      setTestingEmail(false)
    }
  }

  const validateEmails = (emails) => {
    if (!emails.trim()) return false
    
    const emailList = emails.split(',').map(email => email.trim())
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    return emailList.every(email => emailRegex.test(email) && email.length <= 254)
  }

  const validateWebhookUrl = (url, platform) => {
    if (!url) return true // Empty URLs are allowed
    
    const urlRegex = /^https:\/\/[^\s/$.?#].[^\s]*$/
    if (!urlRegex.test(url)) return false
    
    // Platform-specific validation
    if (platform === 'slack' && !url.startsWith('https://hooks.slack.com/')) return false
    if (platform === 'discord' && !url.startsWith('https://discord.com/api/webhooks/')) return false
    
    return true
  }

  return (
    <div className="space-y-6">
      {/* Main Notifications Toggle */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-brand-dark dark:text-white font-semibold">{t.notifications || 'Notification Settings'}</label>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t.enableNotifications || 'Configure notification settings for this checklist'}
            </p>
          </div>
          <Toggle
            checked={formData.notifications_enabled}
            onChange={(checked) => onChange('notifications_enabled', checked)}
          />
        </div>
      </Card>

      {formData.notifications_enabled && (
        <>
          {/* Notification Methods */}
          <Card>
            <div className="space-y-4">
              <label className="text-brand-dark dark:text-white font-semibold">{t.notificationMethods || 'Notification Methods'}</label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t.notificationMethodsDescription || 'Please check at least one option for the notifications to work.'}
              </p>

              <div className="space-y-3">
                <Checkbox
                  id="email_enabled"
                  checked={formData.email_enabled}
                  onChange={(checked) => onChange('email_enabled', checked)}
                  label={t.emailNotifications || 'Email Notifications'}
                />

                <Checkbox
                  id="integration_enabled"
                  checked={formData.integration_enabled}
                  onChange={(checked) => onChange('integration_enabled', checked)}
                  label={t.integrationNotifications || 'Integration Notifications'}
                />
              </div>
            </div>
          </Card>

          {/* Email Settings */}
          {formData.email_enabled && (
            <Card>
              <div className="space-y-4">
                <label className="text-brand-dark dark:text-white font-semibold">{t.emailNotifications || 'Email Notifications'}</label>
                
                <div>
                  <label htmlFor="email_recipients" className="text-brand-dark dark:text-white">{t.emailRecipients || 'Recipients'}</label>
                  <div className="flex items-start space-x-2">
                    <div className="flex-1">
                      <TextInput
                        id="email_recipients"
                        value={formData.email_recipients || ''}
                        onChange={(e) => onChange('email_recipients', e.target.value)}
                        placeholder={t.emailRecipientsPlaceholder || 'email1@example.com, email2@example.com'}
                        color={
                          formData.email_recipients && !validateEmails(formData.email_recipients) 
                            ? 'failure' 
                            : 'gray'
                        }
                      />
                      {formData.email_recipients && !validateEmails(formData.email_recipients) && (
                        <p className="text-red-500 text-sm mt-1">
                          {t.invalidEmailAddresses || 'Please enter valid email addresses separated by commas'}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      color="blue"
                      outline
                      onClick={testEmailNotification}
                      disabled={testingEmail || !formData.email_recipients}
                    >
                      {testingEmail ? (t.testing || 'Testing...') : (t.testEmail || 'Test Email')}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {t.emailRecipientsDescription || 'Enter email addresses separated by commas'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Integration Settings */}
          {formData.integration_enabled && (
            <Card>
              <div className="space-y-6">
                <label className="text-brand-dark dark:text-white font-semibold">{t.integrationSettings || 'Integration Settings'}</label>
                
                {/* Slack Webhook */}
                <div>
                  <label htmlFor="slack_webhook_url" className="text-brand-dark dark:text-white">{t.slackWebhookUrl || 'Slack Webhook URL'}</label>
                  <div className="flex items-start space-x-2">
                    <div className="flex-1">
                      <TextInput
                        id="slack_webhook_url"
                        value={formData.slack_webhook_url || ''}
                        onChange={(e) => onChange('slack_webhook_url', e.target.value)}
                        placeholder={t.slackWebhookPlaceholder || 'https://hooks.slack.com/services/...'}
                        color={
                          formData.slack_webhook_url && !validateWebhookUrl(formData.slack_webhook_url, 'slack')
                            ? 'failure'
                            : 'gray'
                        }
                      />
                      {formData.slack_webhook_url && !validateWebhookUrl(formData.slack_webhook_url, 'slack') && (
                        <p className="text-red-500 text-sm mt-1">
                          {t.validSlackWebhookUrl || 'Please enter a valid Slack webhook URL'}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      color="blue"
                      outline
                      onClick={() => testWebhook('slack')}
                      disabled={testingWebhook.slack || !formData.slack_webhook_url}
                    >
                      {testingWebhook.slack ? (t.testing || 'Testing...') : (t.testSlack || 'Test Slack')}
                    </Button>
                  </div>
                </div>

                {/* Discord Webhook */}
                <div>
                  <label htmlFor="discord_webhook_url" className="text-brand-dark dark:text-white">{t.discordWebhookUrl || 'Discord Webhook URL'}</label>
                  <div className="flex items-start space-x-2">
                    <div className="flex-1">
                      <TextInput
                        id="discord_webhook_url"
                        value={formData.discord_webhook_url || ''}
                        onChange={(e) => onChange('discord_webhook_url', e.target.value)}
                        placeholder={t.discordWebhookPlaceholder || 'https://discord.com/api/webhooks/...'}
                        color={
                          formData.discord_webhook_url && !validateWebhookUrl(formData.discord_webhook_url, 'discord')
                            ? 'failure'
                            : 'gray'
                        }
                      />
                      {formData.discord_webhook_url && !validateWebhookUrl(formData.discord_webhook_url, 'discord') && (
                        <p className="text-red-500 text-sm mt-1">
                          {t.validDiscordWebhookUrl || 'Please enter a valid Discord webhook URL'}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      color="blue"
                      outline
                      onClick={() => testWebhook('discord')}
                      disabled={testingWebhook.discord || !formData.discord_webhook_url}
                    >
                      {testingWebhook.discord ? (t.testing || 'Testing...') : (t.testDiscord || 'Test Discord')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Notification Triggers */}
          <Card>
            <div className="space-y-4">
              <label className="text-brand-dark dark:text-white font-semibold">{t.notificationTriggers || 'Notification Triggers'}</label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t.notificationTriggersDescription || 'Choose which events should trigger notifications'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Checkbox
                  id="notify_on_new_item"
                  checked={formData.notify_on_new_item}
                  onChange={(checked) => onChange('notify_on_new_item', checked)}
                  label={t.newItemAdded || 'New item added'}
                />

                <Checkbox
                  id="notify_on_delete_item"
                  checked={formData.notify_on_delete_item}
                  onChange={(checked) => onChange('notify_on_delete_item', checked)}
                  label={t.itemDeleted || 'Item deleted'}
                />

                <Checkbox
                  id="notify_on_check_item"
                  checked={formData.notify_on_check_item}
                  onChange={(checked) => onChange('notify_on_check_item', checked)}
                  label={t.itemChecked || 'Item Checked'}
                />

                <Checkbox
                  id="notify_on_uncheck_item"
                  checked={formData.notify_on_uncheck_item}
                  onChange={(checked) => onChange('notify_on_uncheck_item', checked)}
                  label={t.itemUnchecked || 'Item Unchecked'}
                />

                <Checkbox
                  id="notify_on_deadline"
                  checked={formData.notify_on_deadline}
                  onChange={(checked) => onChange('notify_on_deadline', checked)}
                  label={t.deadlineApproaching || 'Deadline Approaching'}
                />

                <Checkbox
                  id="notify_on_comments"
                  checked={formData.notify_on_comments}
                  onChange={(checked) => onChange('notify_on_comments', checked)}
                  label={t.commentsAndReplies || 'Comments and replies'}
                />
              </div>

              {/* Deadline Settings */}
              {formData.notify_on_deadline && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <label htmlFor="deadline_threshold_hours" className="text-brand-dark dark:text-white">{t.sendDeadlineNotification || 'Send deadline notification when'}</label>
                    <div className="flex items-center space-x-2">
                      <TextInput
                        id="deadline_threshold_hours"
                        type="number"
                        min="1"
                        value={formData.deadline_threshold_hours || '24'}
                        onChange={(e) => onChange('deadline_threshold_hours', e.target.value)}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{t.hoursRemaining || 'hours remaining'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Notification Frequency */}
          <Card>
            <div className="space-y-4">
              <label className="text-brand-dark dark:text-white font-semibold">{t.notificationFrequency || 'Notification Frequency'}</label>
              
              <div>
                <ReactSelect
                  inputId="batch_interval"
                  value={{ value: formData.batch_interval || 'fifteen_minutes', label: 
                    formData.batch_interval === 'immediate' ? (t.sendImmediately || 'Send Immediately') :
                    formData.batch_interval === 'hourly' ? (t.hourly || 'Hourly') :
                    formData.batch_interval === 'daily' ? (t.dailyDigest || 'Daily Digest') :
                    (t.every15Minutes || 'Every 15 Minutes')
                  }}
                  onChange={(selectedOption) => onChange('batch_interval', selectedOption.value)}
                  options={[
                    { value: 'immediate', label: t.sendImmediately || 'Send Immediately' },
                    { value: 'fifteen_minutes', label: t.every15Minutes || 'Every 15 Minutes' },
                    { value: 'hourly', label: t.hourly || 'Hourly' },
                    { value: 'daily', label: t.dailyDigest || 'Daily Digest' }
                  ]}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder={t.selectFrequency || 'Select frequency...'}
                />
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {t.chooseFrequencyDescription || 'Choose how often notifications should be sent'}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Validation Warnings */}
      {formData.notifications_enabled && (
        <>
          {!formData.email_enabled && !formData.integration_enabled && (
            <Alert color="warning">
              <span className="font-medium">{t.alerts?.noNotificationMethods || 'No notification methods enabled!'}</span> {t.alerts?.noNotificationMethodsDescription || 'Please enable at least one notification method for notifications to work.'}
            </Alert>
          )}

          {formData.email_enabled && !formData.email_recipients && (
            <Alert color="warning">
              <span className="font-medium">{t.alerts?.noEmailRecipients || 'No email recipients!'}</span> {t.alerts?.noEmailRecipientsDescription || 'Please add email recipients to receive email notifications.'}
            </Alert>
          )}

          {formData.integration_enabled && !formData.slack_webhook_url && !formData.discord_webhook_url && (
            <Alert color="warning">
              <span className="font-medium">{t.alerts?.noWebhookUrls || 'No webhook URLs configured!'}</span> {t.alerts?.noWebhookUrlsDescription || 'Please add at least one webhook URL for integration notifications.'}
            </Alert>
          )}
        </>
      )}
    </div>
  )
}

export default NotificationSettings 