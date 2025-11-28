import React, { useState, useEffect } from 'react'
import { Card, Button, Label, TextInput, Textarea, Badge, Alert, Progress, Tabs, Spinner, HelperText } from 'flowbite-react'
import ReactSelect from 'react-select'
import ChecklistItems from './ChecklistItems'
import AccessControl from './AccessControl'
import NotificationSettings from './NotificationSettings'
import CustomThemeSettings from './CustomThemeSettings'
import ShortcodeSettings from './ShortcodeSettings'

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

const EditChecklist = ({ adminData, checklistId = null, checklistType = 'classic', onBackToChecklists, layoutMode = 'stacked', onSetFormRef }) => {
  // Get i18n data
  const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.mclAdminData?.i18n) || {};
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    show_description: false,
    active: false,
    theme: 'light',
    time_date: '',
    keyboard_shortcut: '',
    trigger_shortcut: false,
    trigger_button: false,
    short_title: '',
    button_position: 'bottom-right',
    disable_in_builders: false,
    checked_state_handling: 'global',
    priority: 'none',
    auto_reset: false,
    reset_interval: 'daily',
    week_day: '1',
    month_day: '1',
    custom_months: '0',
    custom_weeks: '0',
    custom_days: '0',
    reset_time: '00:00',
    enable_item_locking: false,
    enable_shortcode: false,
    enable_item_priority: false,
    priority_display_type: 'color',
    tags: [],
    items: [],
    // Custom theme settings
    drawer_bg_color: '#ffffff',
    list_item_bg_color: '#f8f9fa',
    text_color: '#1a1a1a',
    description_text_color: '#1a1a1a',
    heading_font_size: '24',
    description_font_size: '16',
    list_item_font_size: '16',
    primary_button_bg: '#f2da22',
    primary_button_text_color: '#1a1a1a',
    secondary_button_bg: '#f8f9fa',
    secondary_button_text_color: '#1a1a1a',
    checkbox_bg_color: '#ffffff',
    checkbox_border_radius: '4',
    checkbox_style: 'standard',
    checkbox_custom_icon: '',
    checkbox_checkmark_color: '#ffffff',
    drawer_border_radius: '20',
    drawer_width: '600',
    drawer_height: '600',
    float_button_bg: '#ffffff',
    float_button_text_color: '#1a1a1a',
    float_button_font_size: '16',
    show_float_button_icon: false,
    // Icon settings
    checklist_icon_type: 'preset',
    checklist_icon_preset: 'checklist-1',
    checklist_icon_custom: '',
    // Access control
    public_access: false,
    public_description: '',
    public_checked_state_handling: 'per_user',
    public_permission: 'interact',
    enable_rate_limit: false,
    access_roles: [],
    access_roles_permission: 'interact',
    access_users: [],
    access_users_permission: 'interact',
    role_permission_rules: [],
    user_permission_rules: [],
    load_everywhere: false,
    allowed_pages: [],
    allowed_urls: [],
    // Notifications
    notifications_enabled: false,
    email_enabled: false,
    integration_enabled: false,
    email_recipients: '',
    slack_webhook_url: '',
    discord_webhook_url: '',
    notify_on_new_item: false,
    notify_on_delete_item: false,
    notify_on_check_item: false,
    notify_on_uncheck_item: false,
    notify_on_deadline: false,
    notify_on_comments: false,
    deadline_threshold_hours: '24',
    batch_interval: 'fifteen_minutes',
    // Shortcode settings
    shortcode_display_mode: 'list',
    shortcode_show_title: true,
    shortcode_show_description: true,
    shortcode_show_deadline: false,
    shortcode_show_priority: false,
    shortcode_show_numbers: true,
    shortcode_title_text_color: '#000000',
    shortcode_description_text_color: '#333333',
    shortcode_deadline_text_color: '#ff0000',
    shortcode_list_item_text_color: '#1a1a1a',
    shortcode_bg_color: '#ffffff',
    shortcode_border_color: '#e2e8f0',
    shortcode_checkbox_border_color: '#cccccc',
    shortcode_checkbox_color_filled: '#0ea5e9',
    shortcode_checkbox_color_unfilled: '#ffffff',
    shortcode_checkmark_color: '#ffffff',
    shortcode_padding_block: '32',
    shortcode_padding_inline: '32',
    shortcode_container_gap: '10',
    shortcode_checkbox_dimensions: '20',
    shortcode_checkbox_border_radius: '4',
    shortcode_checkbox_border_thickness: '2',
    shortcode_border_type: 'none',
    shortcode_border_radius: '6',
    shortcode_border_thickness: '1',
    shortcode_item_spacing: 'comfortable',
    shortcode_title_font_size: '18',
    shortcode_description_font_size: '14',
    shortcode_list_item_font_size: '16',
    shortcode_deadline_font_size: '14',
    shortcode_disable_drawer: false,
    shortcode_enable_reorder: false,
    invite_permissions: 'interact',
    invite_expiry: '7',
    invite_usage: '0',
    shortcode_check_state: 'session',
    shortcode_width: 'full',
    shortcode_custom_width: '800'
  })

  // UI state
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [shortcutError, setShortcutError] = useState('')

  const totalSteps = 4
  const stepTitles = [
    i18n.checklistEditor?.editChecklist?.stepTitles?.basicSettings || 'Basic Settings',
    i18n.checklistEditor?.editChecklist?.stepTitles?.advancedSettings || 'Advanced Settings', 
    i18n.checklistEditor?.editChecklist?.stepTitles?.accessControl || 'Access Control',
    i18n.checklistEditor?.editChecklist?.stepTitles?.notifications || 'Notifications'
  ]

  const priorityLevels = {
    'none': { label: i18n.checklistEditor?.editChecklist?.priorities?.none || 'None', color: '#6b7280' },
    'low': { label: i18n.checklistEditor?.editChecklist?.priorities?.low || 'Low', color: '#10b981' },
    'medium': { label: i18n.checklistEditor?.editChecklist?.priorities?.medium || 'Medium', color: '#f59e0b' },
    'high': { label: i18n.checklistEditor?.editChecklist?.priorities?.high || 'High', color: '#ef4444' },
    'critical': { label: i18n.checklistEditor?.editChecklist?.priorities?.critical || 'Critical', color: '#991b1b' }
  }

  // Load checklist data if editing
  useEffect(() => {
    if (checklistId) {
      loadChecklistData()
    }
  }, [checklistId])

  // Track unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [unsavedChanges])

  // Notify parent component that form is ready
  useEffect(() => {
    if (onSetFormRef) {
      onSetFormRef(true) // Just signal that form is ready
    }
    return () => {
      if (onSetFormRef) {
        onSetFormRef(null) // Clean up when unmounting
      }
    }
  }, [onSetFormRef])

  const loadChecklistData = async () => {
    try {
      setLoading(true)
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_get_checklist_for_edit',
          checklist_id: checklistId,
          'nonce': adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        const loadedData = data.data
        
        // Handle shortcode settings - flatten them into individual fields
        if (loadedData.shortcode_settings) {
          const shortcodeSettings = loadedData.shortcode_settings
          
          // Flatten shortcode settings into individual form fields
          Object.keys(shortcodeSettings).forEach(key => {
            loadedData[`shortcode_${key}`] = shortcodeSettings[key]
          })
          
          // Remove the nested object since we've flattened it
          delete loadedData.shortcode_settings
        }
        
        setFormData(prevData => ({ ...prevData, ...loadedData }))
      } else {
        throw new Error(data.data?.message || 'Failed to load checklist')
      }
    } catch (error) {
      console.error('Error loading checklist:', error)
      setErrors({ general: i18n.checklistEditor?.editChecklist?.actions?.errorLoadingChecklist || 'Failed to load checklist data' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setUnsavedChanges(true)
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleShortcutInputFocus = () => {
    // Signal to global shortcut listeners to temporarily disable
    window.mclShortcutInputActive = true
  }

  const handleShortcutInputBlur = () => {
    // Re-enable global shortcut listeners
    window.mclShortcutInputActive = false
  }

  const handleShortcutCapture = async (e) => {
    if (e.key === 'Tab' || e.key === 'Enter') return
    
    // Only process keydown events to avoid duplicate processing
    if (e.type !== 'keydown') return
    
    // Aggressively prevent the event from propagating to global shortcut listeners
    e.preventDefault()
    e.stopPropagation()
    
    // Access the native event for stopImmediatePropagation if available
    if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation()
    }
    
    const keyParts = []
    if (e.ctrlKey) keyParts.push('Ctrl')
    if (e.shiftKey) keyParts.push('Shift')
    if (e.altKey) keyParts.push('Alt')
    if (e.metaKey) keyParts.push('Meta')
    
    const modifierKeys = ['Control', 'Shift', 'Alt', 'Meta', 'Tab', 'Enter']
    if (!modifierKeys.includes(e.key)) {
      const keyChar = e.key.length === 1 ? e.key.toUpperCase() : e.code.replace('Key', '').toUpperCase()
      keyParts.push(keyChar)
    }
    
    if (keyParts.length > 1) {
      const shortcut = keyParts.join('+')
      handleInputChange('keyboard_shortcut', shortcut)
      
      // Validate shortcut
      try {
        const response = await fetch(adminData.ajaxurl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            action: 'mcl_check_shortcut',
            shortcut: shortcut,
            checklist_id: checklistId || '',
            '_ajax_nonce': adminData.nonces?.checkShortcut || ''
          })
        })
        
        const data = await response.json()
        if (data.success && data.data.exists) {
          setShortcutError(i18n.checklistEditor?.editChecklist?.validation?.shortcutInUse || 'This shortcut is already in use.')
        } else {
          setShortcutError('')
        }
      } catch (error) {
        console.error(i18n.checklistEditor?.editChecklist?.actions?.errorValidatingShortcut || 'Error validating shortcut:', error)
      }
    }
  }

  const validateStep = (step) => {
    const newErrors = {}
    
    switch (step) {
      case 1: // Basic Settings
        if (!formData.title.trim()) {
          newErrors.title = i18n.checklistEditor?.editChecklist?.validation?.titleRequired || 'Title is required'
        }
        break
        
      case 2: // Advanced Settings
        if (!formData.trigger_shortcut && !formData.trigger_button) {
          newErrors.trigger_methods = i18n.checklistEditor?.editChecklist?.validation?.triggerMethodsRequired || 'At least one trigger method must be selected'
        }
        if (formData.trigger_shortcut && !formData.keyboard_shortcut.trim()) {
          newErrors.keyboard_shortcut = i18n.checklistEditor?.editChecklist?.validation?.keyboardShortcutRequired || 'Keyboard shortcut is required when shortcut trigger is enabled'
        }
        if (shortcutError) {
          newErrors.keyboard_shortcut = shortcutError
        }
        
        // Auto reset validation
        if (formData.auto_reset) {
          // Validate reset time format
          const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
          if (!timePattern.test(formData.reset_time)) {
            newErrors.reset_time = i18n.checklistEditor?.editChecklist?.validation?.invalidTimeFormat || 'Invalid time format'
          }
          
          // Validate weekly settings
          if (formData.reset_interval === 'weekly') {
            const weekDay = parseInt(formData.week_day)
            if (weekDay < 1 || weekDay > 7) {
              newErrors.week_day = i18n.checklistEditor?.editChecklist?.validation?.invalidDayOfWeek || 'Invalid day of week selected'
            }
          }
          
          // Validate monthly settings
          if (formData.reset_interval === 'monthly') {
            const monthDay = parseInt(formData.month_day)
            if (monthDay < 1 || monthDay > 31) {
              newErrors.month_day = i18n.checklistEditor?.editChecklist?.validation?.dayOfMonthRange || 'Day of month must be between 1 and 31'
            }
          }
          
          // Validate custom settings
          if (formData.reset_interval === 'custom') {
            const months = parseInt(formData.custom_months) || 0
            const weeks = parseInt(formData.custom_weeks) || 0
            const days = parseInt(formData.custom_days) || 0
            
            if (months === 0 && weeks === 0 && days === 0) {
              newErrors.custom_interval = i18n.checklistEditor?.editChecklist?.validation?.customIntervalRequired || 'At least one time period must be specified for custom intervals'
            }
            
            if (months < 0 || months > 12) {
              newErrors.custom_months = i18n.checklistEditor?.editChecklist?.validation?.monthsRange || 'Months must be between 0 and 12'
            }
            
            if (weeks < 0 || weeks > 52) {
              newErrors.custom_weeks = i18n.checklistEditor?.editChecklist?.validation?.weeksRange || 'Weeks must be between 0 and 52'
            }
            
            if (days < 0 || days > 31) {
              newErrors.custom_days = i18n.checklistEditor?.editChecklist?.validation?.daysRange || 'Days must be between 0 and 31'
            }
          }
        }
        break
        
      case 3: // Access Control - generally no required fields
        // Validate invite link settings if any
        if (formData.invite_usage && isNaN(parseInt(formData.invite_usage))) {
          newErrors.invite_usage = i18n.checklistEditor?.editChecklist?.validation?.usageLimitNumber || 'Usage limit must be a number'
        }
        
        if (formData.invite_usage && parseInt(formData.invite_usage) < 0) {
          newErrors.invite_usage = i18n.checklistEditor?.editChecklist?.validation?.usageLimitNegative || 'Usage limit cannot be negative'
        }
        break
        
      case 4: // Notifications
        if (formData.notifications_enabled) {
          if (!formData.email_enabled && !formData.integration_enabled) {
            newErrors.notification_methods = i18n.checklistEditor?.editChecklist?.validation?.notificationMethodRequired || 'At least one notification method must be enabled'
          }
          if (formData.email_enabled && !formData.email_recipients.trim()) {
            newErrors.email_recipients = i18n.checklistEditor?.editChecklist?.validation?.emailRecipientsRequired || 'Email recipients are required when email notifications are enabled'
          }
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateItems = () => {
    const hasValidItem = formData.items.some(item => item.content && item.content.trim())
    if (!hasValidItem) {
      setErrors(prev => ({ ...prev, items: i18n.checklistEditor?.editChecklist?.validation?.itemsRequired || 'At least one non-empty checklist item is required' }))
      return false
    }
    return true
  }

  const handleNext = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handlePrev = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate all steps
    let isValid = true
    for (let step = 1; step <= totalSteps; step++) {
      if (!validateStep(step)) {
        isValid = false
        setCurrentStep(step) // Go to first invalid step
        break
      }
    }
    
    // Validate items
    if (!validateItems()) {
      isValid = false
    }
    
    if (!isValid) return

    // Set loading state first
    setLoading(true)

    // Use requestAnimationFrame to defer work until after the browser paints
    // This ensures the loading spinner is visible before we start the heavy work
    requestAnimationFrame(() => {
      setTimeout(async () => {
        try {

          // Prepare form data for submission
          const submitData = new URLSearchParams({
        action: 'save_checklist',
        checklist_id: checklistId || '',
        checklist_type: checklistType,
        mcl_nonce: adminData.nonces?.mcl_save_checklist || '',
        title: formData.title,
        description: formData.description,
        show_description: formData.show_description ? '1' : '0',
        time_date: formData.time_date,
        keyboard_shortcut: formData.keyboard_shortcut,
        active: formData.active ? '1' : '0',
        checked_state: formData.checked_state_handling,
        theme: formData.theme,
        priority: formData.priority,
        enable_item_priority: formData.enable_item_priority ? '1' : '0',
        trigger_shortcut: formData.trigger_shortcut ? '1' : '0',
        trigger_button: formData.trigger_button ? '1' : '0',
        short_title: formData.short_title,
        button_position: formData.button_position,
        disable_in_builders: formData.disable_in_builders ? '1' : '0',
        priority_display_type: formData.priority_display_type,
        public_access: formData.public_access ? '1' : '0',
        public_permission: formData.public_permission,
        public_checked_state: formData.public_checked_state_handling,
        public_description: formData.public_description,
        enable_rate_limit: formData.enable_rate_limit ? '1' : '0',
        enable_item_locking: formData.enable_item_locking ? '1' : '0',
        access_roles_permission: formData.access_roles_permission,
        access_users_permission: formData.access_users_permission,
        load_everywhere: formData.load_everywhere ? '1' : '0',
        enable_shortcode: formData.enable_shortcode ? '1' : '0',
        notifications_enabled: formData.notifications_enabled ? '1' : '0',
        email_enabled: formData.email_enabled ? '1' : '0',
        integration_enabled: formData.integration_enabled ? '1' : '0',
        email_recipients: formData.email_recipients,
        slack_webhook_url: formData.slack_webhook_url,
        discord_webhook_url: formData.discord_webhook_url,
        notify_on_new_item: formData.notify_on_new_item ? '1' : '0',
        notify_on_delete_item: formData.notify_on_delete_item ? '1' : '0',
        notify_on_check_item: formData.notify_on_check_item ? '1' : '0',
        notify_on_uncheck_item: formData.notify_on_uncheck_item ? '1' : '0',
        notify_on_deadline: formData.notify_on_deadline ? '1' : '0',
        notify_on_comments: formData.notify_on_comments ? '1' : '0',
        deadline_threshold_hours: formData.deadline_threshold_hours,
        batch_interval: formData.batch_interval,
        auto_reset: formData.auto_reset ? '1' : '0',
        reset_interval: formData.reset_interval,
        week_day: formData.week_day,
        month_day: formData.month_day,
        custom_months: formData.custom_months,
        custom_weeks: formData.custom_weeks,
        custom_days: formData.custom_days,
        reset_time: formData.reset_time,
        invite_permissions: formData.invite_permissions || 'interact',
        invite_expiry: formData.invite_expiry || '7',
        invite_usage: formData.invite_usage || '0',
        drawer_bg_color: formData.drawer_bg_color,
        list_item_bg_color: formData.list_item_bg_color,
        text_color: formData.text_color,
        description_text_color: formData.description_text_color,
        heading_font_size: formData.heading_font_size,
        description_font_size: formData.description_font_size,
        list_item_font_size: formData.list_item_font_size,
        primary_button_bg: formData.primary_button_bg,
        primary_button_text_color: formData.primary_button_text_color,
        secondary_button_bg: formData.secondary_button_bg,
        secondary_button_text_color: formData.secondary_button_text_color,
        checkbox_bg_color: formData.checkbox_bg_color,
        checkbox_border_radius: formData.checkbox_border_radius,
        checkbox_style: formData.checkbox_style,
        checkbox_custom_icon: formData.checkbox_custom_icon,
        checkbox_checkmark_color: formData.checkbox_checkmark_color,
        drawer_border_radius: formData.drawer_border_radius,
        drawer_width: formData.drawer_width,
        drawer_height: formData.drawer_height,
        float_button_bg: formData.float_button_bg,
        float_button_text_color: formData.float_button_text_color,
        float_button_font_size: formData.float_button_font_size,
        show_float_button_icon: formData.show_float_button_icon ? '1' : '0',
        shortcode_display_mode: formData.shortcode_display_mode || 'list',
        shortcode_show_title: formData.shortcode_show_title ? '1' : '0',
        shortcode_show_description: formData.shortcode_show_description ? '1' : '0',
        shortcode_show_deadline: formData.shortcode_show_deadline ? '1' : '0',
        shortcode_show_priority: formData.shortcode_show_priority ? '1' : '0',
        shortcode_show_numbers: formData.shortcode_show_numbers ? '1' : '0',
        shortcode_title_text_color: formData.shortcode_title_text_color,
        shortcode_description_text_color: formData.shortcode_description_text_color,
        shortcode_deadline_text_color: formData.shortcode_deadline_text_color,
        shortcode_list_item_text_color: formData.shortcode_list_item_text_color,
        shortcode_bg_color: formData.shortcode_bg_color,
        shortcode_border_color: formData.shortcode_border_color,
        shortcode_checkbox_border_color: formData.shortcode_checkbox_border_color,
        shortcode_checkbox_color_filled: formData.shortcode_checkbox_color_filled,
        shortcode_checkbox_color_unfilled: formData.shortcode_checkbox_color_unfilled,
        shortcode_checkmark_color: formData.shortcode_checkmark_color,
        shortcode_padding_block: formData.shortcode_padding_block,
        shortcode_padding_inline: formData.shortcode_padding_inline,
        shortcode_container_gap: formData.shortcode_container_gap,
        shortcode_checkbox_dimensions: formData.shortcode_checkbox_dimensions,
        shortcode_checkbox_border_radius: formData.shortcode_checkbox_border_radius,
        shortcode_checkbox_border_thickness: formData.shortcode_checkbox_border_thickness,
        shortcode_border_type: formData.shortcode_border_type,
        shortcode_border_radius: formData.shortcode_border_radius,
        shortcode_border_thickness: formData.shortcode_border_thickness,
        shortcode_item_spacing: formData.shortcode_item_spacing,
        shortcode_title_font_size: formData.shortcode_title_font_size,
        shortcode_description_font_size: formData.shortcode_description_font_size,
        shortcode_list_item_font_size: formData.shortcode_list_item_font_size,
        shortcode_deadline_font_size: formData.shortcode_deadline_font_size,
        shortcode_disable_drawer: formData.shortcode_disable_drawer ? '1' : '0',
        shortcode_enable_reorder: formData.shortcode_enable_reorder ? '1' : '0',
        shortcode_check_state: formData.shortcode_check_state || 'session',
        shortcode_width: formData.shortcode_width || 'full',
        shortcode_custom_width: formData.shortcode_custom_width || '800',
        checklist_icon_type: formData.checklist_icon_type,
        checklist_icon_preset: formData.checklist_icon_preset,
        checklist_icon_custom: formData.checklist_icon_custom
      })

      // Add items data
      formData.items.forEach((item, index) => {
        submitData.append(`items[${index}][id]`, item.id || `item_${Date.now()}_${index}`)
        submitData.append(`items[${index}][content]`, item.content || '')
        submitData.append(`items[${index}][priority]`, item.priority || 'none')
        submitData.append(`items[${index}][locked]`, item.locked ? '1' : '0')
        submitData.append(`items[${index}][in_progress]`, item.in_progress ? '1' : '0')
        submitData.append(`items[${index}][checked]`, item.checked ? '1' : '0')
        if (item.parent_id) {
          submitData.append(`items[${index}][parent_id]`, item.parent_id)
        }
        if (item.deadline) {
          submitData.append(`items[${index}][deadline]`, item.deadline)
        }
      })

      // Add tags data
      formData.tags.forEach((tag, index) => {
        submitData.append(`mcl_tags[${index}]`, tag.name)
        submitData.append(`mcl_tag_colors[${index}]`, tag.color)
      })

      // Add array data (legacy format - kept for backwards compatibility)
      formData.access_roles.forEach((role, index) => {
        submitData.append(`access_roles[${index}]`, role)
      })

      formData.access_users.forEach((user, index) => {
        submitData.append(`access_users[${index}]`, user)
      })

      // Add new granular permission rules
      if (formData.role_permission_rules && formData.role_permission_rules.length > 0) {
        formData.role_permission_rules.forEach((rule, ruleIndex) => {
          submitData.append(`role_permission_rules[${ruleIndex}][permission]`, rule.permission || 'interact')
          if (rule.roles && rule.roles.length > 0) {
            rule.roles.forEach((role, roleIndex) => {
              submitData.append(`role_permission_rules[${ruleIndex}][roles][${roleIndex}]`, role)
            })
          }
        })
      }

      if (formData.user_permission_rules && formData.user_permission_rules.length > 0) {
        formData.user_permission_rules.forEach((rule, ruleIndex) => {
          submitData.append(`user_permission_rules[${ruleIndex}][permission]`, rule.permission || 'interact')
          if (rule.users && rule.users.length > 0) {
            rule.users.forEach((user, userIndex) => {
              submitData.append(`user_permission_rules[${ruleIndex}][users][${userIndex}]`, user)
            })
          }
        })
      }

      formData.allowed_pages.forEach((page, index) => {
        submitData.append(`allowed_pages[${index}]`, page)
      })

      formData.allowed_urls.forEach((url, index) => {
        submitData.append(`allowed_urls[${index}]`, url)
      })

      const response = await fetch(adminData.admin_url + 'admin-post.php', {
        method: 'POST',
        body: submitData
      })
      
      if (response.ok) {
        setUnsavedChanges(false)
        // Small delay to ensure state update takes effect before redirect
        setTimeout(() => {
          window.location.href = adminData.admin_url + 'admin.php?page=mcl_checklists'
        }, 100)
      } else {
        throw new Error('Failed to save checklist')
      }
        } catch (error) {
          console.error('Error saving checklist:', error)
          setErrors({ general: i18n.checklistEditor?.editChecklist?.actions?.errorSavingChecklist || 'Failed to save checklist. Please try again.' })
        } finally {
          setLoading(false)
        }
      }, 0) // Execute on next tick
    }) // requestAnimationFrame callback
  }

  const renderProgressTracker = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          
          return (
            <div
              key={stepNumber}
              className={`flex flex-col items-center cursor-pointer transition-all duration-200 ${
                isActive ? 'text-brand-accent' : isCompleted ? 'text-green-500' : 'text-gray-400'
              }`}
              onClick={() => setCurrentStep(stepNumber)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                isActive 
                  ? 'border-brand-accent bg-brand-accent text-brand-dark' 
                  : isCompleted 
                    ? 'border-green-500 bg-green-500 text-white' 
                    : 'border-gray-300 bg-white text-gray-400'
              }`}>
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              <span className="text-sm font-medium text-center">{stepTitles[index]}</span>
            </div>
          )
        })}
      </div>
      <Progress 
        progress={(currentStep - 1) / (totalSteps - 1) * 100} 
        size="sm" 
        color="yellow"
      />
    </div>
  )

  const renderBasicSettings = () => (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title" className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.basicSettings?.title || 'Title'}</Label>
        <span className="text-red-500 ml-1">*</span>
        <TextInput
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          color={errors.title ? 'failure' : 'gray'}
          placeholder={i18n.checklistEditor?.editChecklist?.basicSettings?.titlePlaceholder || 'Enter checklist title'}
          required
        />
        {errors.title && <HelperText color="failure">{errors.title}</HelperText>}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.basicSettings?.description || 'Description'}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          placeholder={i18n.checklistEditor?.editChecklist?.basicSettings?.descriptionPlaceholder || 'Enter checklist description'}
        />
        <div className="flex items-center mt-2">
          <Toggle
            checked={formData.show_description}
            onChange={(checked) => handleInputChange('show_description', checked)}
            label={i18n.checklistEditor?.editChecklist?.basicSettings?.showDescriptionInDrawer || 'Show description in drawer'}
          />
        </div>
      </div>

      {/* Active Status */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-brand-dark dark:text-white font-semibold">{i18n.checklistEditor?.editChecklist?.basicSettings?.activeStatus || 'Active Status'}</Label>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {i18n.checklistEditor?.editChecklist?.basicSettings?.activeStatusDescription || 'When active, this checklist can be accessed using its keyboard shortcut or floating button.'}
            </p>
          </div>
          <Toggle
            checked={formData.active}
            onChange={(checked) => handleInputChange('active', checked)}
          />
        </div>
      </div>

      {/* Theme */}
      <div>
        <Label htmlFor="theme" className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.basicSettings?.drawerTheme || 'Drawer Theme'}</Label>
        <ReactSelect
          inputId="theme"
          value={{ value: formData.theme, label: formData.theme === 'light' ? (i18n.checklistEditor?.editChecklist?.options?.light || 'Light') : formData.theme === 'dark' ? (i18n.checklistEditor?.editChecklist?.options?.dark || 'Dark') : (i18n.checklistEditor?.editChecklist?.options?.customTheme || 'Custom Theme') }}
          onChange={(selectedOption) => handleInputChange('theme', selectedOption.value)}
          options={[
            { value: 'light', label: i18n.checklistEditor?.editChecklist?.options?.light || 'Light' },
            { value: 'dark', label: i18n.checklistEditor?.editChecklist?.options?.dark || 'Dark' },
            { value: 'custom', label: i18n.checklistEditor?.editChecklist?.options?.customTheme || 'Custom Theme' }
          ]}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder={i18n.checklistEditor?.editChecklist?.basicSettings?.chooseTheme || 'Choose theme...'}
        />
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {i18n.checklistEditor?.editChecklist?.basicSettings?.themeDescription || 'Choose the visual theme for your checklist drawer.'}
        </p>
      </div>

      {/* Custom Theme Settings */}
      {formData.theme === 'custom' && (
        <CustomThemeSettings 
          formData={formData} 
          onChange={handleInputChange}
          adminData={adminData}
        />
      )}

      {/* Tags */}
      <div>
        <Label className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.basicSettings?.tags || 'Tags'}</Label>
        <div className="space-y-2">
          <TextInput
            placeholder={i18n.checklistEditor?.editChecklist?.basicSettings?.tagPlaceholder || 'Type tag name and press Enter'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const tagName = e.target.value.trim()
                if (tagName && !formData.tags.some(tag => tag.name === tagName)) {
                  const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#f1c40f', '#95a5a6']
                  const newTag = { name: tagName, color: colors[formData.tags.length % colors.length] }
                  handleInputChange('tags', [...formData.tags, newTag])
                  e.target.value = ''
                }
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm"
                style={{ backgroundColor: tag.color }}
              >
                <span>{tag.name}</span>
                <div className="flex items-center gap-1 ml-1">
                  {/* Color Picker Button */}
                  <div className="relative">
                    <input
                      type="color"
                      value={tag.color}
                      onChange={(e) => {
                        const newTags = [...formData.tags]
                        newTags[index] = { ...newTags[index], color: e.target.value }
                        handleInputChange('tags', newTags)
                      }}
                      className="w-4 h-4 rounded border-0 cursor-pointer opacity-0 absolute inset-0"
                      title="Change color"
                    />
                    <button
                      type="button"
                      className="w-4 h-4 rounded border border-white/30 hover:border-white/60 transition-colors flex items-center justify-center"
                      title="Change color"
                    >
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newTags = formData.tags.filter((_, i) => i !== index)
                      handleInputChange('tags', newTags)
                    }}
                    className="text-white hover:text-gray-200 ml-1"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {i18n.checklistEditor?.editChecklist?.basicSettings?.tagsHint || 'Add tags to organize your checklist. Press Enter to add a tag, then click the edit icon to change its color.'}
        </p>
      </div>
    </div>
  )

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      {/* Deadline */}
      <div>
        <Label htmlFor="time_date" className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.advancedSettings?.deadline || 'Deadline'}</Label>
        <TextInput
          id="time_date"
          type="datetime-local"
          value={formData.time_date}
          onChange={(e) => handleInputChange('time_date', e.target.value)}
        />
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {i18n.checklistEditor?.editChecklist?.advancedSettings?.deadlineDescription || 'Set an optional deadline for completing this checklist.'}
        </p>
      </div>

      {/* Keyboard Shortcut */}
      <div>
        <Label htmlFor="keyboard_shortcut" className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.advancedSettings?.keyboardShortcut || 'Keyboard Shortcut'}</Label>
        <TextInput
          id="keyboard_shortcut"
          value={formData.keyboard_shortcut}
          onKeyDown={handleShortcutCapture}
          onKeyUp={handleShortcutCapture}
          onFocus={handleShortcutInputFocus}
          onBlur={handleShortcutInputBlur}
          color={errors.keyboard_shortcut || shortcutError ? 'failure' : 'gray'}
          placeholder={i18n.checklistEditor?.editChecklist?.advancedSettings?.shortcutPlaceholder || 'Click and press your desired key combination'}
          readOnly
        />
        {(errors.keyboard_shortcut || shortcutError) && (
          <HelperText color="failure">{errors.keyboard_shortcut || shortcutError}</HelperText>
        )}
      </div>

      {/* Trigger Methods */}
      <div>
        <Label className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.advancedSettings?.drawerTriggerMethod || 'Drawer Trigger Method'}</Label>
        {errors.trigger_methods && (
          <p className="text-red-500 text-sm mb-2">{errors.trigger_methods}</p>
        )}
        <div className="space-y-2">
          <Checkbox
            id="trigger_shortcut"
            checked={formData.trigger_shortcut}
            onChange={(checked) => handleInputChange('trigger_shortcut', checked)}
            label={i18n.checklistEditor?.editChecklist?.advancedSettings?.keyboardShortcutTrigger || 'Keyboard Shortcut'}
          />
          <Checkbox
            id="trigger_button"
            checked={formData.trigger_button}
            onChange={(checked) => handleInputChange('trigger_button', checked)}
            label={i18n.checklistEditor?.editChecklist?.advancedSettings?.floatingButton || 'Floating Button'}
          />
        </div>

        {/* Floating Button Options */}
        {formData.trigger_button && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
            <div>
              <Label htmlFor="short_title">{i18n.checklistEditor?.editChecklist?.basicSettings?.floatingButtonTitle || 'Floating Button Title'}</Label>
              <TextInput
                id="short_title"
                value={formData.short_title}
                onChange={(e) => handleInputChange('short_title', e.target.value)}
                maxLength="50"
                placeholder={i18n.checklistEditor?.editChecklist?.basicSettings?.buttonTitle || 'Button title'}
              />
            </div>
            <div>
              <Label htmlFor="button_position">{i18n.checklistEditor?.editChecklist?.advancedSettings?.buttonPosition || 'Button Position'}</Label>
              <ReactSelect
                inputId="button_position"
                value={{ value: formData.button_position, label: formData.button_position === 'bottom-right' ? (i18n.checklistEditor?.editChecklist?.options?.bottomRight || 'Bottom Right') : formData.button_position === 'bottom-left' ? (i18n.checklistEditor?.editChecklist?.options?.bottomLeft || 'Bottom Left') : formData.button_position === 'top-right' ? (i18n.checklistEditor?.editChecklist?.options?.topRight || 'Top Right') : formData.button_position === 'top-left' ? (i18n.checklistEditor?.editChecklist?.options?.topLeft || 'Top Left') : (i18n.checklistEditor?.editChecklist?.options?.draggable || 'Draggable') }}
                onChange={(selectedOption) => handleInputChange('button_position', selectedOption.value)}
                options={[
                  { value: 'bottom-right', label: i18n.checklistEditor?.editChecklist?.options?.bottomRight || 'Bottom Right' },
                  { value: 'bottom-left', label: i18n.checklistEditor?.editChecklist?.options?.bottomLeft || 'Bottom Left' },
                  { value: 'top-right', label: i18n.checklistEditor?.editChecklist?.options?.topRight || 'Top Right' },
                  { value: 'top-left', label: i18n.checklistEditor?.editChecklist?.options?.topLeft || 'Top Left' },
                  { value: 'draggable', label: i18n.checklistEditor?.editChecklist?.options?.draggable || 'Draggable' }
                ]}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder={i18n.checklistEditor?.editChecklist?.advancedSettings?.selectPosition || 'Select position...'}
              />
            </div>
            
            {/* Icon Selection */}
            <div>
              <Label className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.advancedSettings?.checklistIcon || 'Checklist Icon'}</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="icon_type"
                      value="preset"
                      checked={formData.checklist_icon_type === 'preset'}
                      onChange={() => handleInputChange('checklist_icon_type', 'preset')}
                      className="mr-2"
                    />
                    <span>{i18n.checklistEditor?.editChecklist?.advancedSettings?.usePresetIcon || 'Use Preset Icon'}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="icon_type"
                      value="custom"
                      checked={formData.checklist_icon_type === 'custom'}
                      onChange={() => handleInputChange('checklist_icon_type', 'custom')}
                      className="mr-2"
                    />
                    <span>{i18n.checklistEditor?.editChecklist?.advancedSettings?.customIcon || 'Custom Icon'}</span>
                  </label>
                </div>

                {/* Preset Icon Selection */}
                {formData.checklist_icon_type === 'preset' && (
                  <div className="grid grid-cols-5 gap-3 p-3 bg-white dark:bg-gray-800 rounded border">
                    {[
                      { id: 'checklist-1', svg: '<path fillRule="evenodd" clipRule="evenodd" d="M15.9701 12.8006H12.8901C12.4701 12.8006 12.1401 12.4706 12.1401 12.0506C12.1401 11.6406 12.4701 11.3006 12.8901 11.3006H15.9701C16.3901 11.3006 16.7201 11.6406 16.7201 12.0506C16.7201 12.4706 16.3901 12.8006 15.9701 12.8006ZM15.9701 17.6506H12.8901C12.4701 17.6506 12.1401 17.3106 12.1401 16.9006C12.1401 16.4906 12.4701 16.1506 12.8901 16.1506H15.9701C16.3901 16.1506 16.7201 16.4906 16.7201 16.9006C16.7201 17.3106 16.3901 17.6506 15.9701 17.6506ZM10.8101 11.2106L9.33007 12.6906C9.18007 12.8406 8.99007 12.9106 8.80007 12.9106C8.60007 12.9106 8.41007 12.8406 8.27007 12.6906L7.50007 11.9306C7.21007 11.6306 7.21007 11.1606 7.50007 10.8706C7.80007 10.5706 8.27007 10.5706 8.57007 10.8706L8.80007 11.1006L9.75007 10.1506C10.0401 9.85056 10.5201 9.85056 10.8101 10.1506C11.1001 10.4406 11.1001 10.9106 10.8101 11.2106ZM10.8101 16.0506L9.33007 17.5406C9.19007 17.6806 9.00007 17.7606 8.80007 17.7606C8.60007 17.7606 8.41007 17.6806 8.27007 17.5406L7.50007 16.7806C7.21007 16.4806 7.21007 16.0106 7.51007 15.7106C7.80007 15.4206 8.27007 15.4206 8.57007 15.7106L8.80007 15.9506L9.75007 14.9906C10.0401 14.7006 10.5201 14.7006 10.8101 14.9906C11.1001 15.2906 11.1001 15.7606 10.8101 16.0506ZM16.8928 4.38212C16.7728 4.34667 16.6552 4.43627 16.6374 4.56011C16.4646 5.75625 15.4285 6.68056 14.1901 6.68056H9.81007C8.57169 6.68056 7.52694 5.75639 7.35293 4.56039C7.3349 4.43647 7.21714 4.34685 7.09711 4.38253C5.34579 4.90305 4.07007 6.53496 4.07007 8.46056V17.3606C4.07007 19.7006 5.97007 21.6106 8.32007 21.6106H15.6801C18.0301 21.6106 19.9301 19.7006 19.9301 17.3606V8.46056C19.9301 6.53445 18.6537 4.90219 16.8928 4.38212Z" fill="currentColor"/><path fillRule="evenodd" clipRule="evenodd" d="M9.81357 5.48062H14.1936C14.8736 5.48062 15.4336 4.94062 15.4536 4.26063C15.4636 4.24063 15.4636 4.22062 15.4636 4.20062V3.66062C15.4636 2.96062 14.8936 2.39062 14.1936 2.39062H9.81357C9.11357 2.39062 8.53357 2.96062 8.53357 3.66062V4.20062C8.53357 4.22062 8.53357 4.23063 8.54357 4.25063C8.56357 4.94062 9.13357 5.48062 9.81357 5.48062Z" fill="currentColor"/>' },
                      { id: 'tasks-1', svg: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.692 7.889h4.52M11.692 12h4.52m-4.52 4.111h4.52M8.066 8.506a.617.617 0 1 0 0-1.234a.617.617 0 0 0 0 1.234m0 4.111a.617.617 0 1 0 0-1.234a.617.617 0 0 0 0 1.234m0 4.111a.617.617 0 1 0 0-1.234a.617.617 0 0 0 0 1.234"/><rect width="18.5" height="18.5" x="2.75" y="2.75" rx="6"/></g>' },
                      { id: 'task-2', svg: '<path fill="currentColor" d="M15.25 2h-6.5A6.76 6.76 0 0 0 2 8.75v6.5A6.75 6.75 0 0 0 8.75 22h6.5A6.75 6.75 0 0 0 22 15.25v-6.5A6.76 6.76 0 0 0 15.25 2M8.04 17.48a1.37 1.37 0 1 1 1.37-1.37a1.36 1.36 0 0 1-1.37 1.37m0-4.11A1.37 1.37 0 1 1 9.41 12a1.36 1.36 0 0 1-1.37 1.42zm0-4.11a1.37 1.37 0 1 1 1.37-1.37a1.36 1.36 0 0 1-1.37 1.37m8.15 7.6h-4.52a.75.75 0 1 1 0-1.5h4.52a.75.75 0 1 1 0 1.5m0-4.11h-4.52a.75.75 0 1 1 0-1.5h4.52a.75.75 0 1 1 0 1.5m0-4.11h-4.52a.75.75 0 0 1 0-1.5h4.52a.75.75 0 1 1 0 1.5"/>' },
                      { id: 'list-1', svg: '<path fill="currentColor" d="M9 8.5a.5.5 0 0 1 .5-.5H13a.5.5 0 0 1 0 1H9.5a.5.5 0 0 1-.5-.5Zm0 3a.5.5 0 0 1 .5-.5H13a.5.5 0 0 1 0 1H9.5a.5.5 0 0 1-.5-.5Zm0 3a.5.5 0 0 1 .5-.5H13a.5.5 0 0 1 0 1H9.5a.5.5 0 0 1-.5-.5Zm-1-6a.75.75 0 1 1-1.5 0a.75.75 0 0 1 1.5 0Zm0 3a.75.75 0 1 1-1.5 0a.75.75 0 0 1 1.5 0Zm-.75 3.75a.75.75 0 1 0 0-1.5a.75.75 0 0 0 0 1.5ZM7.085 3A1.5 1.5 0 0 1 8.5 2h3a1.5 1.5 0 0 1 1.415 1H14.5A1.5 1.5 0 0 1 16 4.5v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 16.5v-12A1.5 1.5 0 0 1 5.5 3h1.585ZM8.5 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3ZM7.085 4H5.5a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-12a.5.5 0 0 0-.5-.5h-1.585A1.5 1.5 0 0 1 11.5 5h-3a1.5 1.5 0 0 1-1.415-1Z"/>' },
                      { id: '', svg: '<path fill="#000000" d="M7.085 3H5.5A1.5 1.5 0 0 0 4 4.5v12A1.5 1.5 0 0 0 5.5 18h9a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 14.5 3h-1.585A1.5 1.5 0 0 0 11.5 2h-3a1.5 1.5 0 0 0-1.415 1ZM8.5 3h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1ZM9 8.5a.5.5 0 0 1 .5-.5H13a.5.5 0 0 1 0 1H9.5a.5.5 0 0 1-.5-.5Zm0 3a.5.5 0 0 1 .5-.5H13a.5.5 0 0 1 0 1H9.5a.5.5 0 0 1-.5-.5Zm0 3a.5.5 0 0 1 .5-.5H13a.5.5 0 0 1 0 1H9.5a.5.5 0 0 1-.5-.5Zm-1-6a.75.75 0 1 1-1.5 0a.75.75 0 0 1 1.5 0Zm0 3a.75.75 0 1 1-1.5 0a.75.75 0 0 1 1.5 0Zm-.75 3.75a.75.75 0 1 1 0-1.5a.75.75 0 0 1 0 1.5Z"/>' },
                      { id: 'checklist-2', svg: '<text x="12" y="18" text-anchor="middle" font-size="20" fill="currentColor">✅</text>' },
                      { id: 'document-1', svg: '<text x="12" y="18" text-anchor="middle" font-size="20" fill="currentColor">📄</text>' },
                      { id: 'check-square', svg: '<text x="12" y="18" text-anchor="middle" font-size="20" fill="currentColor">☑️</text>' },
                      { id: 'file-text', svg: '<text x="12" y="18" text-anchor="middle" font-size="20" fill="currentColor">📝</text>' },
                      { id: 'folder', svg: '<text x="12" y="18" text-anchor="middle" font-size="20" fill="currentColor">📁</text>' }
                    ].map((icon) => (
                      <button
                        key={icon.id}
                        type="button"
                        className={`w-12 h-12 flex items-center justify-center rounded border-2 transition-colors ${
                          formData.checklist_icon_preset === icon.id
                            ? 'border-brand-accent bg-brand-accent/10'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => handleInputChange('checklist_icon_preset', icon.id)}
                      >
                        <svg
                          className="w-6 h-6 text-gray-700"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          dangerouslySetInnerHTML={{ __html: icon.svg }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom Icon Upload */}
                {formData.checklist_icon_type === 'custom' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (typeof wp !== 'undefined' && wp.media) {
                            const mediaFrame = wp.media({
                              title: 'Select Icon Image',
                              library: { type: 'image' },
                              multiple: false,
                              button: { text: i18n.checklistEditor?.editChecklist?.advancedSettings?.useAsIcon || 'Use as Icon' }
                            })

                            mediaFrame.on('select', () => {
                              const attachment = mediaFrame.state().get('selection').first().toJSON()
                              handleInputChange('checklist_icon_custom', attachment.url)
                            })

                            mediaFrame.open()
                          }
                        }}
                      >
                        {i18n.checklistEditor?.editChecklist?.advancedSettings?.chooseIconImage || 'Choose Icon Image'}
                      </Button>
                      {formData.checklist_icon_custom && (
                        <div className="flex items-center gap-2">
                          <img 
                            src={formData.checklist_icon_custom} 
                            alt={i18n.checklistEditor?.editChecklist?.advancedSettings?.customIconAlt || 'Custom icon'} 
                            className="w-8 h-8 object-contain"
                          />
                          <Button
                            type="button"
                            size="xs"
                            color="gray"
                            onClick={() => handleInputChange('checklist_icon_custom', '')}
                          >
                            {i18n.checklistEditor?.editChecklist?.advancedSettings?.remove || 'Remove'}
                          </Button>
                        </div>
                      )}
                    </div>
                    {formData.checklist_icon_custom && (
                      <TextInput
                        value={formData.checklist_icon_custom}
                        onChange={(e) => handleInputChange('checklist_icon_custom', e.target.value)}
                        placeholder={i18n.checklistEditor?.editChecklist?.advancedSettings?.pasteImageUrl || 'Or paste image URL'}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <Checkbox
              id="disable_in_builders"
              checked={formData.disable_in_builders}
              onChange={(checked) => handleInputChange('disable_in_builders', checked)}
              label={i18n.checklistEditor?.editChecklist?.advancedSettings?.disableInBuilders || 'Disable floating button when inside pagebuilders'}
            />
          </div>
        )}
      </div>

      {/* Checked State Handling */}
      <div>
        <Label htmlFor="checked_state_handling" className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.advancedSettings?.checkedStateHandling || 'Checked State Handling'}</Label>
        <ReactSelect
          inputId="checked_state_handling"
          value={{ value: formData.checked_state_handling, label: formData.checked_state_handling === 'per_user' ? (i18n.checklistEditor?.editChecklist?.options?.perUser || 'Per User') : (i18n.checklistEditor?.editChecklist?.options?.global || 'Global') }}
          onChange={(selectedOption) => handleInputChange('checked_state_handling', selectedOption.value)}
          options={[
            { value: 'per_user', label: i18n.checklistEditor?.editChecklist?.options?.perUser || 'Per User' },
            { value: 'global', label: i18n.checklistEditor?.editChecklist?.options?.global || 'Global' }
          ]}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder={i18n.checklistEditor?.editChecklist?.advancedSettings?.selectHandlingMethod || 'Select handling method...'}
        />
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {i18n.checklistEditor?.editChecklist?.advancedSettings?.checkedStateDescription || '"Per User" gives each user their own checked states. "Global" shares checked states among all users.'}
        </p>
      </div>

      {/* Priority */}
      <div>
        <Label htmlFor="priority" className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.basicSettings?.checklistPriority || 'Checklist Priority'}</Label>
        <div className="flex items-center space-x-2">
          <ReactSelect
            inputId="priority"
            value={{ value: formData.priority, label: priorityLevels[formData.priority]?.label || 'None' }}
            onChange={(selectedOption) => handleInputChange('priority', selectedOption.value)}
            options={Object.entries(priorityLevels).map(([value, { label }]) => ({
              value: value,
              label: label
            }))}
            className="react-select-container flex-1"
            classNamePrefix="react-select"
            placeholder={i18n.checklistEditor?.editChecklist?.basicSettings?.selectPriorityPlaceholder || 'Select priority...'}
          />
          <div 
            className="w-6 h-6 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: priorityLevels[formData.priority]?.color }}
          />
        </div>
      </div>

      {/* Item Locking */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-brand-dark dark:text-white font-semibold">{i18n.checklistEditor?.editChecklist?.basicSettings?.enableItemLocking || 'Enable Item Locking'}</Label>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {i18n.checklistEditor?.editChecklist?.basicSettings?.itemLockingDescription || 'Enable locking of individual items to prevent editing.'}
            </p>
          </div>
          <Toggle
            checked={formData.enable_item_locking}
            onChange={(checked) => handleInputChange('enable_item_locking', checked)}
          />
        </div>
      </div>

      {/* Shortcode */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-brand-dark dark:text-white font-semibold">{i18n.checklistEditor?.editChecklist?.basicSettings?.enableShortcode || 'Enable Shortcode'}</Label>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {i18n.checklistEditor?.editChecklist?.basicSettings?.shortcodeDescription || 'Enable this to use this checklist as a shortcode in your content.'}
            </p>
          </div>
          <Toggle
            checked={formData.enable_shortcode}
            onChange={(checked) => handleInputChange('enable_shortcode', checked)}
          />
        </div>
        
        <ShortcodeSettings 
          formData={formData} 
          onChange={handleInputChange}
          checklistId={checklistId}
          adminData={adminData}
        />
      </div>

      {/* Auto Reset Schedule */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-brand-dark dark:text-white font-semibold">{i18n.checklistEditor?.editChecklist?.basicSettings?.autoResetSchedule || 'Auto Reset Schedule'}</Label>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {i18n.checklistEditor?.editChecklist?.basicSettings?.autoResetDescription || 'Enable automatic reset of checked items on a schedule.'}
            </p>
          </div>
          <Toggle
            checked={formData.auto_reset}
            onChange={(checked) => handleInputChange('auto_reset', checked)}
          />
        </div>

        {/* Reset Schedule Options */}
        {formData.auto_reset && (
          <div className="mt-4 space-y-4">
            {/* Reset Interval */}
            <div>
              <Label htmlFor="reset_interval" className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.advancedSettings?.resetInterval || 'Reset Interval'}</Label>
              <ReactSelect
                inputId="reset_interval"
                value={{ 
                  value: formData.reset_interval, 
                  label: formData.reset_interval === 'daily' ? (i18n.checklistEditor?.editChecklist?.options?.daily || 'Daily') : 
                         formData.reset_interval === 'weekly' ? (i18n.checklistEditor?.editChecklist?.options?.weekly || 'Weekly') : 
                         formData.reset_interval === 'monthly' ? (i18n.checklistEditor?.editChecklist?.options?.monthly || 'Monthly') : 
                         (i18n.checklistEditor?.editChecklist?.options?.custom || 'Custom') 
                }}
                onChange={(selectedOption) => handleInputChange('reset_interval', selectedOption.value)}
                options={[
                  { value: 'daily', label: i18n.checklistEditor?.editChecklist?.options?.daily || 'Daily' },
                  { value: 'weekly', label: i18n.checklistEditor?.editChecklist?.options?.weekly || 'Weekly' },
                  { value: 'monthly', label: i18n.checklistEditor?.editChecklist?.options?.monthly || 'Monthly' },
                  { value: 'custom', label: i18n.checklistEditor?.editChecklist?.options?.custom || 'Custom' }
                ]}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder={i18n.checklistEditor?.editChecklist?.advancedSettings?.selectInterval || 'Select interval...'}
              />
            </div>

            {/* Weekly Options */}
            {formData.reset_interval === 'weekly' && (
              <div>
                <Label htmlFor="week_day" className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.advancedSettings?.dayOfWeek || 'Day of Week'}</Label>
                <ReactSelect
                  inputId="week_day"
                  value={{ 
                    value: formData.week_day, 
                    label: [
                      i18n.checklistEditor?.editChecklist?.options?.monday || 'Monday',
                      i18n.checklistEditor?.editChecklist?.options?.tuesday || 'Tuesday',
                      i18n.checklistEditor?.editChecklist?.options?.wednesday || 'Wednesday',
                      i18n.checklistEditor?.editChecklist?.options?.thursday || 'Thursday',
                      i18n.checklistEditor?.editChecklist?.options?.friday || 'Friday',
                      i18n.checklistEditor?.editChecklist?.options?.saturday || 'Saturday',
                      i18n.checklistEditor?.editChecklist?.options?.sunday || 'Sunday'
                    ][parseInt(formData.week_day) - 1] || (i18n.checklistEditor?.editChecklist?.options?.monday || 'Monday')
                  }}
                  onChange={(selectedOption) => handleInputChange('week_day', selectedOption.value)}
                  options={[
                    { value: '1', label: i18n.checklistEditor?.editChecklist?.options?.monday || 'Monday' },
                    { value: '2', label: i18n.checklistEditor?.editChecklist?.options?.tuesday || 'Tuesday' },
                    { value: '3', label: i18n.checklistEditor?.editChecklist?.options?.wednesday || 'Wednesday' },
                    { value: '4', label: i18n.checklistEditor?.editChecklist?.options?.thursday || 'Thursday' },
                    { value: '5', label: i18n.checklistEditor?.editChecklist?.options?.friday || 'Friday' },
                    { value: '6', label: i18n.checklistEditor?.editChecklist?.options?.saturday || 'Saturday' },
                    { value: '7', label: i18n.checklistEditor?.editChecklist?.options?.sunday || 'Sunday' }
                  ]}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder={i18n.checklistEditor?.editChecklist?.advancedSettings?.selectDay || 'Select day...'}
                />
                {errors.week_day && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.week_day}</p>
                )}
              </div>
            )}

            {/* Monthly Options */}
            {formData.reset_interval === 'monthly' && (
              <div>
                <Label htmlFor="month_day" className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.advancedSettings?.dayOfMonth || 'Day of Month'}</Label>
                <TextInput
                  id="month_day"
                  value={formData.month_day}
                  onChange={(e) => handleInputChange('month_day', e.target.value)}
                  color={errors.month_day ? 'failure' : 'gray'}
                  placeholder={i18n.checklistEditor?.editChecklist?.advancedSettings?.enterDayOfMonth || 'Enter day of month'}
                />
                {errors.month_day && <HelperText color="failure">{errors.month_day}</HelperText>}
              </div>
            )}

            {/* Custom Options */}
            {formData.reset_interval === 'custom' && (
              <div className="space-y-3">
                <Label className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.advancedSettings?.customInterval || 'Custom Interval'}</Label>
                {errors.custom_interval && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.custom_interval}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="custom_months" className="text-sm text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.advancedSettings?.months || 'Months'}</Label>
                    <TextInput
                      id="custom_months"
                      type="number"
                      min="0"
                      max="12"
                      value={formData.custom_months}
                      onChange={(e) => {
                        const value = Math.max(0, Math.min(12, parseInt(e.target.value) || 0))
                        handleInputChange('custom_months', value.toString())
                        
                        // Ensure at least one field has a value greater than 0
                        const months = value
                        const weeks = parseInt(formData.custom_weeks) || 0
                        const days = parseInt(formData.custom_days) || 0
                        
                        if (months === 0 && weeks === 0 && days === 0) {
                          handleInputChange('custom_days', '1')
                        }
                      }}
                      placeholder="0"
                      color={errors.custom_months ? 'failure' : 'gray'}
                    />
                    {errors.custom_months && <HelperText color="failure">{errors.custom_months}</HelperText>}
                  </div>
                  <div>
                    <Label htmlFor="custom_weeks" className="text-sm text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.advancedSettings?.weeks || 'Weeks'}</Label>
                    <TextInput
                      id="custom_weeks"
                      type="number"
                      min="0"
                      max="52"
                      value={formData.custom_weeks}
                      onChange={(e) => {
                        const value = Math.max(0, Math.min(52, parseInt(e.target.value) || 0))
                        handleInputChange('custom_weeks', value.toString())
                        
                        // Ensure at least one field has a value greater than 0
                        const months = parseInt(formData.custom_months) || 0
                        const weeks = value
                        const days = parseInt(formData.custom_days) || 0
                        
                        if (months === 0 && weeks === 0 && days === 0) {
                          handleInputChange('custom_days', '1')
                        }
                      }}
                      placeholder="0"
                      color={errors.custom_weeks ? 'failure' : 'gray'}
                    />
                    {errors.custom_weeks && <HelperText color="failure">{errors.custom_weeks}</HelperText>}
                  </div>
                  <div>
                    <Label htmlFor="custom_days" className="text-sm text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.advancedSettings?.days || 'Days'}</Label>
                    <TextInput
                      id="custom_days"
                      type="number"
                      min="0"
                      max="31"
                      value={formData.custom_days}
                      onChange={(e) => {
                        const value = Math.max(0, Math.min(31, parseInt(e.target.value) || 0))
                        handleInputChange('custom_days', value.toString())
                        
                        // Ensure at least one field has a value greater than 0
                        const months = parseInt(formData.custom_months) || 0
                        const weeks = parseInt(formData.custom_weeks) || 0
                        const days = value
                        
                        if (months === 0 && weeks === 0 && days === 0) {
                          handleInputChange('custom_days', '1')
                        }
                      }}
                      placeholder="0"
                      color={errors.custom_days ? 'failure' : 'gray'}
                    />
                    {errors.custom_days && <HelperText color="failure">{errors.custom_days}</HelperText>}
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {i18n.checklistEditor?.editChecklist?.advancedSettings?.customIntervalHint || 'At least one field must have a value greater than 0.'}
                </p>
              </div>
            )}

            {/* Reset Time */}
            <div>
              <Label htmlFor="reset_time" className="text-brand-dark dark:text-white">{i18n.checklistEditor?.editChecklist?.advancedSettings?.resetTime || 'Reset Time'}</Label>
              <TextInput
                id="reset_time"
                type="time"
                value={formData.reset_time}
                onChange={(e) => handleInputChange('reset_time', e.target.value)}
                color={errors.reset_time ? 'failure' : 'gray'}
              />
              {errors.reset_time && <HelperText color="failure">{errors.reset_time}</HelperText>}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (loading && !formData.title) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="xl" />
        <span className="ml-2">{i18n.checklistEditor?.editChecklist?.actions?.loadingChecklist || 'Loading checklist...'}</span>
      </div>
    )
  }

  return (
    <div className="w-full relative">
      {/* Global Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
            <svg className="animate-spin h-12 w-12 text-brand-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {i18n.checklistEditor?.editChecklist?.actions?.saving || 'Saving...'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {i18n.checklistEditor?.editChecklist?.actions?.pageWillReload || 'Page will reload automatically'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errors.general && (
        <Alert color="failure" className="mb-6">
          {errors.general}
        </Alert>
      )}

      {/* Progress Tracker */}
      {renderProgressTracker()}

      {/* Form */}
      <form id="checklist-form" onSubmit={handleSubmit} className="space-y-8">
        <div className={`grid gap-8 ${
          layoutMode === 'side-by-side' 
            ? 'grid-cols-1 lg:grid-cols-2' 
            : 'grid-cols-1'
        }`}>
          {/* Form Steps */}
          <div className={layoutMode === 'side-by-side' ? '' : ''}>
            <Card className="p-6">
              {currentStep === 1 && renderBasicSettings()}
              {currentStep === 2 && renderAdvancedSettings()}
              {currentStep === 3 && (
                <AccessControl 
                  formData={formData} 
                  onChange={handleInputChange}
                  adminData={{...adminData, checklist_id: checklistId}}
                />
              )}
              {currentStep === 4 && (
                <NotificationSettings 
                  formData={formData} 
                  onChange={handleInputChange}
                  adminData={adminData}
                />
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  color="gray"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                >
                  {i18n.checklistEditor?.editChecklist?.buttons?.previous || 'Previous'}
                </Button>
                {currentStep === totalSteps ? (
                  <Button
                    className="bg-brand-accent hover:bg-brand-accent/90 text-brand-dark dark:bg-brand-accent hover:dark:bg-brand-accent/90"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {i18n.checklistEditor?.editChecklist?.actions?.saving || 'Saving...'}
                      </span>
                    ) : (
                      i18n.checklistEditor?.editChecklist?.actions?.save || i18n.common?.save || 'Save'
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-brand-accent hover:bg-brand-accent/90 text-brand-dark dark:bg-brand-accent hover:dark:bg-brand-accent/90"
                  >
                    {i18n.checklistEditor?.editChecklist?.buttons?.next || 'Next'}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Checklist Items */}
          <div className={layoutMode === 'side-by-side' ? '' : ''}>
            <ChecklistItems 
              items={formData.items}
              onChange={(items) => handleInputChange('items', items)}
              enablePriority={formData.enable_item_priority}
              enableLocking={formData.enable_item_locking}
              onPriorityToggle={(checked) => handleInputChange('enable_item_priority', checked)}
              errors={errors}
              checklistId={checklistId}
              adminData={adminData}
            />
          </div>
        </div>
      </form>
    </div>
  )
}

export default EditChecklist 