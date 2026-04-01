import { useState, useEffect, useRef } from 'react'
import { Button, Label, TextInput, Textarea, Card, Select, Badge, Modal } from 'flowbite-react'
import { useToast } from './Toast.jsx'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const TourEditor = ({ adminData, tourId, onBackToTours }) => {
  const { showSuccess, showError } = useToast()
  const [tourData, setTourData] = useState({
    title: '',
    description: '',
    active: false,
    trigger_type: 'page',
    trigger_value: '',
    user_condition: 'all_users',
    specific_users: [],
    specific_roles: [],
    autostart: false,
    show_once: false,
    settings: {
      animate: true,
      show_progress: true,
      progress_text: '{{current}} of {{total}}',
      allow_close: true,
      confirm_exit: false,
      exit_message: 'Are you sure you want to exit the tour?',
      next_btn_text: 'Next',
      prev_btn_text: 'Previous',
      done_btn_text: 'Done',
      close_btn_text: 'Close',
      default_buttons: ['next', 'previous', 'close'],
      overlay_color: '#000000',
      overlay_opacity: 0.75,
      popover_class: '',
      padding: 4,
      smooth_scroll: true
    }
  })
  
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [availableUsers, setAvailableUsers] = useState([])
  const [availableRoles, setAvailableRoles] = useState([])
  const [showStepsModal, setShowStepsModal] = useState(false)

  const isEditing = Boolean(tourId)

  useEffect(() => {
    loadUsers()
    loadRoles()
    if (tourId) {
      loadTour()
    } else {
      // For new tours, ensure we have reasonable defaults
      setTourData(prev => ({
        ...prev,
        // Keep the defaults from initial state, but ensure active is false for new tours
        active: false
      }))
    }
  }, [tourId])

  const loadTour = async () => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('action', 'magiccl_get_tour_data')
      formData.append('tour_id', tourId)
      formData.append('nonce', adminData.nonces.magiccl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        const loadedData = data.data
        setTourData({
          title: loadedData.title || '',
          description: loadedData.description || '',
          active: loadedData.active || false,
          trigger_type: loadedData.trigger_type || 'page',
          trigger_value: loadedData.trigger_value || '',
          user_condition: loadedData.user_condition || 'all_users',
          specific_users: loadedData.specific_users || [],
          specific_roles: loadedData.specific_roles || [],
          autostart: loadedData.autostart || false,
          show_once: loadedData.show_once || false,
          settings: {
            // Use defaults only if the setting doesn't exist (undefined), not if it's false
            animate: loadedData.settings?.hasOwnProperty('animate') ? loadedData.settings.animate : true,
            show_progress: loadedData.settings?.hasOwnProperty('show_progress') ? loadedData.settings.show_progress : true,
            progress_text: loadedData.settings?.hasOwnProperty('progress_text') ? loadedData.settings.progress_text : (adminData?.i18n?.tourEditor?.progressPlaceholder || '{{current}} of {{total}}'),
            allow_close: loadedData.settings?.hasOwnProperty('allow_close') ? loadedData.settings.allow_close : true,
            confirm_exit: loadedData.settings?.hasOwnProperty('confirm_exit') ? loadedData.settings.confirm_exit : false,
            exit_message: loadedData.settings?.hasOwnProperty('exit_message') ? loadedData.settings.exit_message : (adminData?.i18n?.tourEditor?.exitConfirmationPlaceholder || 'Are you sure you want to exit the tour?'),
            next_btn_text: loadedData.settings?.hasOwnProperty('next_btn_text') ? loadedData.settings.next_btn_text : (adminData?.i18n?.tourEditor?.nextPlaceholder || 'Next'),
            prev_btn_text: loadedData.settings?.hasOwnProperty('prev_btn_text') ? loadedData.settings.prev_btn_text : (adminData?.i18n?.tourEditor?.previousPlaceholder || 'Previous'),
            done_btn_text: loadedData.settings?.hasOwnProperty('done_btn_text') ? loadedData.settings.done_btn_text : (adminData?.i18n?.tourEditor?.donePlaceholder || 'Done'),
            close_btn_text: loadedData.settings?.hasOwnProperty('close_btn_text') ? loadedData.settings.close_btn_text : (adminData?.i18n?.tourEditor?.closePlaceholder || 'Close'),
            default_buttons: loadedData.settings?.hasOwnProperty('default_buttons') ? loadedData.settings.default_buttons : ['next', 'previous', 'close'],
            overlay_color: loadedData.settings?.hasOwnProperty('overlay_color') ? loadedData.settings.overlay_color : '#000000',
            overlay_opacity: loadedData.settings?.hasOwnProperty('overlay_opacity') ? loadedData.settings.overlay_opacity : 0.75,
            popover_class: loadedData.settings?.hasOwnProperty('popover_class') ? loadedData.settings.popover_class : '',
            padding: loadedData.settings?.hasOwnProperty('padding') ? loadedData.settings.padding : 4,
            smooth_scroll: loadedData.settings?.hasOwnProperty('smooth_scroll') ? loadedData.settings.smooth_scroll : true
          }
        })
        setSteps(loadedData.steps || [])
      } else {
        console.error('Failed to load tour:', data.data)
      }
    } catch (error) {
      console.error('Error loading tour:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const formData = new FormData()
      formData.append('action', 'magiccl_get_users_for_tour')
      formData.append('nonce', adminData.nonces.magiccl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setAvailableUsers(data.data)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadRoles = async () => {
    try {
      const formData = new FormData()
      formData.append('action', 'magiccl_get_roles_for_tour')
      formData.append('nonce', adminData.nonces.magiccl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setAvailableRoles(data.data)
      }
    } catch (error) {
      console.error('Error loading roles:', error)
    }
  }

  const handleSave = async (openCreator = false) => {
    // Debug: log settings being saved
    console.log('TourEditor.handleSave:', {
      active: tourData.active,
      autostart: tourData.autostart,
      show_once: tourData.show_once,
      settings: tourData.settings
    });
    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('action', 'magiccl_save_tour_settings')
      formData.append('tour_id', tourId || 0)
      formData.append('title', tourData.title)
      formData.append('description', tourData.description)
      formData.append('trigger_type', tourData.trigger_type)
      formData.append('trigger_value', tourData.trigger_value)
      formData.append('user_condition', tourData.user_condition)
      formData.append('specific_users', JSON.stringify(tourData.specific_users))
      formData.append('specific_roles', JSON.stringify(tourData.specific_roles))
      
      // Include all settings - ensure we send every setting explicitly
      const settings = {
        // Basic tour flags
        active: tourData.active,
        autostart: tourData.autostart,
        show_once: tourData.show_once,
        
        // Animation settings
        animate: tourData.settings.animate,
        
        // Progress settings
        show_progress: tourData.settings.show_progress,
        progress_text: tourData.settings.progress_text,
        
        // Exit control settings
        allow_close: tourData.settings.allow_close,
        confirm_exit: tourData.settings.confirm_exit,
        exit_message: tourData.settings.exit_message,
        
        // Button text settings
        next_btn_text: tourData.settings.next_btn_text,
        prev_btn_text: tourData.settings.prev_btn_text,
        done_btn_text: tourData.settings.done_btn_text,
        close_btn_text: tourData.settings.close_btn_text,
        
        // Default buttons array
        default_buttons: tourData.settings.default_buttons,
        
        // Overlay settings
        overlay_color: tourData.settings.overlay_color,
        overlay_opacity: tourData.settings.overlay_opacity,
        
        // Popover settings
        popover_class: tourData.settings.popover_class,
        
        // Advanced settings
        padding: tourData.settings.padding,
        smooth_scroll: tourData.settings.smooth_scroll
      }
      formData.append('settings', JSON.stringify(settings))
      formData.append('nonce', adminData.nonces.magiccl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        if (openCreator) {
          // Set tour mode cookie for navigation persistence
          document.cookie = 'magiccl_tour_mode=1; path=/; SameSite=Lax'
          
          // Redirect to visual creator on dashboard
          const dashboardUrl = new URL(adminData.dashboard_url || '/wp-admin/index.php', window.location.origin)
          dashboardUrl.searchParams.set('magiccl_tour_mode', '1')
          dashboardUrl.searchParams.set('tour_id', data.data.tour_id.toString())
          
          window.location.href = dashboardUrl.href
        } else {
          // Show success message and optionally go back to list
          showSuccess(adminData?.i18n?.tourEditor?.tourSettingsSavedSuccessfully || 'Tour settings saved successfully!')
          // Don't automatically go back - let user decide
        }
      } else {
        console.error('Failed to save tour:', data.data)
        showError(adminData?.i18n?.tourEditor?.errorSavingTourSettings || 'Error saving tour settings')
      }
    } catch (error) {
      console.error('Error saving tour:', error)
      showError('Error saving tour settings')
    } finally {
      setSaving(false)
    }
  }

  const handleResetCompletion = async () => {
    if (!tourId) return
    
    try {
      const formData = new FormData()
      formData.append('action', 'magiccl_reset_tour_completion')
      formData.append('tour_id', tourId)
      formData.append('nonce', adminData.nonces.magiccl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        showSuccess(adminData?.i18n?.tours?.tourCompletionResetSuccessfully || 'Tour completion reset successfully!')
      } else {
        showError(adminData?.i18n?.tours?.errorResettingTourCompletion || 'Error resetting tour completion')
      }
    } catch (error) {
      console.error('Error resetting completion:', error)
      showError('Error resetting tour completion')
    }
  }

  const updateTourData = (field, value) => {
    setTourData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateSettings = (field, value) => {
    setTourData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }))
  }

  const handleTriggerTypeChange = (type) => {
    setTourData(prev => ({
      ...prev,
      trigger_type: type,
      trigger_value: '' // Reset trigger value when type changes
    }))
  }

  const handleUserConditionChange = (condition) => {
    setTourData(prev => ({
      ...prev,
      user_condition: condition,
      specific_users: [], // Reset specific selections
      specific_roles: []
    }))
  }

  const handleStepsDragEnd = (result) => {
    if (!result.destination) {
      return
    }

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex === destinationIndex) {
      return
    }

    const newSteps = Array.from(steps)
    const [reorderedStep] = newSteps.splice(sourceIndex, 1)
    newSteps.splice(destinationIndex, 0, reorderedStep)

    setSteps(newSteps)

    // Save the new order to the server
    if (tourId) {
      saveStepsOrder(newSteps)
    }
  }

  const saveStepsOrder = async (reorderedSteps) => {
    try {
      const formData = new FormData()
      formData.append('action', 'magiccl_reorder_tour_steps')
      formData.append('tour_id', tourId)
      formData.append('steps', JSON.stringify(reorderedSteps))
      formData.append('nonce', adminData.nonces.magiccl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (!data.success) {
        console.error('Failed to save step order:', data.data)
        showError(adminData?.i18n?.tourEditor?.errorSavingStepOrder || 'Error saving step order')
      }
    } catch (error) {
      console.error('Error saving step order:', error)
      showError('Error saving step order')
    }
  }

  const triggerTemplates = [
    { value: '/wp-admin/', label: 'WordPress Dashboard' },
    { value: '/wp-admin/edit.php', label: 'Posts List' },
    { value: '/wp-admin/post-new.php', label: 'Add New Post' },
    { value: '/wp-admin/edit.php?post_type=page', label: 'Pages List' },
    { value: '/wp-admin/post-new.php?post_type=page', label: 'Add New Page' },
    { value: '/wp-admin/themes.php', label: 'Themes' },
    { value: '/wp-admin/plugins.php', label: 'Plugins' },
    { value: '/wp-admin/users.php', label: 'Users' },
    { value: '/wp-admin/options-general.php', label: 'General Settings' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Basic Information */}
          <Card>
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.basicInformation || 'Basic Information'}</h2>
              
              <div>
                <Label htmlFor="title" value={adminData?.i18n?.tourEditor?.tourTitle || 'Tour Title'} className="text-sm font-medium text-gray-900 dark:text-white mb-2 block" />
                <TextInput
                  id="title"
                  value={tourData.title}
                  onChange={(e) => updateTourData('title', e.target.value)}
                  placeholder={adminData?.i18n?.tourEditor?.enterTourTitle || 'Enter tour title...'}
                  required
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {adminData?.i18n?.tourEditor?.tourTitleDescription || 'Give your tour a descriptive name.'}
                </p>
              </div>

              <div>
                <Label htmlFor="description" value={adminData?.i18n?.tourEditor?.description || 'Description'} className="text-sm font-medium text-gray-900 dark:text-white mb-2 block" />
                <Textarea
                  id="description"
                  value={tourData.description}
                  onChange={(e) => updateTourData('description', e.target.value)}
                  placeholder={adminData?.i18n?.tourEditor?.optionalDescription || 'Optional description for this tour...'}
                  rows={3}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {adminData?.i18n?.tourEditor?.descriptionHelp || 'Optional description to help you remember what this tour is for.'}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={tourData.active}
                    onChange={(e) => updateTourData('active', e.target.checked)}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent dark:peer-checked:bg-brand-accent"></div>
                </label>
                <Label htmlFor="active" value={adminData?.i18n?.tourEditor?.activeLabel || 'Active (show this tour to users)'} className="text-sm font-medium text-gray-900 dark:text-white" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {adminData?.i18n?.tourEditor?.activeDescription || 'Only active tours will be displayed to users.'}
              </p>
            </div>
          </Card>

          {/* Trigger Settings */}
          <Card>
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.triggerSettings || 'Trigger Settings'}</h2>
              
              <div>
                <Label value={adminData?.i18n?.tourEditor?.triggerLocation || 'Trigger Location'} className="text-sm font-medium text-gray-900 dark:text-white mb-3 block" />
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="trigger_type"
                        value="page"
                        checked={tourData.trigger_type === 'page'}
                        onChange={(e) => handleTriggerTypeChange('page')}
                        className="w-4 h-4 text-brand-accent"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.specificPageUrl || 'Specific Page URL'}</span>
                    </label>
                    {tourData.trigger_type === 'page' && (
                      <div className="mt-3 ml-7 space-y-2">
                        <Select
                          value=""
                          onChange={(e) => e.target.value && updateTourData('trigger_value', e.target.value)}
                        >
                          <option value="">{adminData?.i18n?.tourEditor?.selectTemplateOrCustomUrl || 'Select a template or enter custom URL'}</option>
                          {triggerTemplates.map(template => (
                            <option key={template.value} value={template.value}>{template.label}</option>
                          ))}
                        </Select>
                        <TextInput
                          value={tourData.trigger_value}
                          onChange={(e) => updateTourData('trigger_value', e.target.value)}
                          placeholder={adminData?.i18n?.tourEditor?.urlPlaceholder || 'e.g., /wp-admin/edit.php'}
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {adminData?.i18n?.tourEditor?.urlHelp || 'Enter the URL where this tour should trigger. Use * for wildcards.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="trigger_type"
                        value="selector"
                        checked={tourData.trigger_type === 'selector'}
                        onChange={(e) => handleTriggerTypeChange('selector')}
                        className="w-4 h-4 text-brand-accent"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.whenCssSelectorExists || 'When CSS Selector Exists'}</span>
                    </label>
                    {tourData.trigger_type === 'selector' && (
                      <div className="mt-3 ml-7">
                        <TextInput
                          value={tourData.trigger_value}
                          onChange={(e) => updateTourData('trigger_value', e.target.value)}
                          placeholder={adminData?.i18n?.tourEditor?.cssSelectorPlaceholder || 'e.g., .my-button, #specific-element'}
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {adminData?.i18n?.tourEditor?.cssSelectorHelp || 'Tour will trigger when this CSS selector is found on any page.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="trigger_type"
                        value="first_login"
                        checked={tourData.trigger_type === 'first_login'}
                        onChange={(e) => handleTriggerTypeChange('first_login')}
                        className="w-4 h-4 text-brand-accent"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.usersFirstLogin || "User's First Login (any page)"}</span>
                    </label>
                    {tourData.trigger_type === 'first_login' && (
                      <div className="mt-3 ml-7">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {adminData?.i18n?.tourEditor?.firstLoginHelp || 'This tour will trigger on any page for users who have never seen a first-login tour.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="trigger_type"
                        value="any_page"
                        checked={tourData.trigger_type === 'any_page'}
                        onChange={(e) => handleTriggerTypeChange('any_page')}
                        className="w-4 h-4 text-brand-accent"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.anyPage || 'Any Page'}</span>
                    </label>
                    {tourData.trigger_type === 'any_page' && (
                      <div className="mt-3 ml-7">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {adminData?.i18n?.tourEditor?.anyPageHelp || 'This tour can trigger on any page (use with caution and combine with user conditions).'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* User Conditions */}
          <Card>
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.userConditions || 'User Conditions'}</h2>
              
              <div>
                <Label value={adminData?.i18n?.tourEditor?.whoShouldSeeTour || 'Who should see this tour?'} className="text-sm font-medium text-gray-900 dark:text-white mb-3 block" />
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="user_condition"
                        value="all_users"
                        checked={tourData.user_condition === 'all_users'}
                        onChange={(e) => handleUserConditionChange('all_users')}
                        className="w-4 h-4 text-brand-accent"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.allUsers || 'All Users (logged in and logged out)'}</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="user_condition"
                        value="all_logged_in"
                        checked={tourData.user_condition === 'all_logged_in'}
                        onChange={(e) => handleUserConditionChange('all_logged_in')}
                        className="w-4 h-4 text-brand-accent"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.allLoggedInUsers || 'All Logged In Users'}</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="user_condition"
                        value="all_logged_out"
                        checked={tourData.user_condition === 'all_logged_out'}
                        onChange={(e) => handleUserConditionChange('all_logged_out')}
                        className="w-4 h-4 text-brand-accent"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.allLoggedOutUsers || 'All Logged Out Users'}</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="user_condition"
                        value="specific_users"
                        checked={tourData.user_condition === 'specific_users'}
                        onChange={(e) => handleUserConditionChange('specific_users')}
                        className="w-4 h-4 text-brand-accent"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.specificUsersOnly || 'Specific Users Only'}</span>
                    </label>
                    {tourData.user_condition === 'specific_users' && (
                      <div className="mt-3 ml-7">
                        <Select
                          multiple
                          value={tourData.specific_users}
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                            updateTourData('specific_users', values)
                          }}
                        >
                          {availableUsers.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.display_name} ({user.email})
                            </option>
                          ))}
                        </Select>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {adminData?.i18n?.tourEditor?.selectSpecificUsersHelp || 'Select specific users who should see this tour.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="user_condition"
                        value="specific_roles"
                        checked={tourData.user_condition === 'specific_roles'}
                        onChange={(e) => handleUserConditionChange('specific_roles')}
                        className="w-4 h-4 text-brand-accent"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.specificUserRolesOnly || 'Specific User Roles Only'}</span>
                    </label>
                    {tourData.user_condition === 'specific_roles' && (
                      <div className="mt-3 ml-7">
                        <Select
                          multiple
                          value={tourData.specific_roles}
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, option => option.value)
                            updateTourData('specific_roles', values)
                          }}
                        >
                          {availableRoles.map(role => (
                            <option key={role.key} value={role.key}>
                              {role.name}
                            </option>
                          ))}
                        </Select>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {adminData?.i18n?.tourEditor?.selectUserRolesHelp || 'Select user roles that should see this tour.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Display Options */}
          <Card>
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.displayOptions || 'Display Options'}</h2>
              
              <div className="flex items-center space-x-3">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={tourData.autostart}
                    onChange={(e) => updateTourData('autostart', e.target.checked)}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent dark:peer-checked:bg-brand-accent"></div>
                </label>
                <Label value={adminData?.i18n?.tourEditor?.autostartTourWhenTriggered || 'Auto-start tour when triggered'} className="text-sm font-medium text-gray-900 dark:text-white" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {adminData?.i18n?.tourEditor?.autostartHelp || 'If enabled, the tour will start automatically when the trigger conditions are met.'}
              </p>

              <div className="flex items-center space-x-3">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={tourData.show_once}
                    onChange={(e) => updateTourData('show_once', e.target.checked)}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent dark:peer-checked:bg-brand-accent"></div>
                </label>
                <Label value={adminData?.i18n?.tourEditor?.showOnlyOncePerUser || 'Show only once per user'} className="text-sm font-medium text-gray-900 dark:text-white" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {adminData?.i18n?.tourEditor?.showOnceHelp || 'If checked, each user will only see this tour once. Tracked by user account or browser cookie.'}
              </p>
            </div>
          </Card>

          {/* Appearance & Behavior Settings */}
          <Card>
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.appearanceBehavior || 'Appearance & Behavior'}</h2>
              
              {/* Animation Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{adminData?.i18n?.tourEditor?.animation || 'Animation'}</h3>
                <div className="flex items-center space-x-3">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={tourData.settings.animate}
                      onChange={(e) => updateSettings('animate', e.target.checked)}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent dark:peer-checked:bg-brand-accent"></div>
                  </label>
                  <Label value={adminData?.i18n?.tourEditor?.enableAnimatedTransitions || 'Enable animated transitions'} className="text-sm font-medium text-gray-900 dark:text-white" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {adminData?.i18n?.tourEditor?.animationHelp || 'When enabled, the tour will smoothly animate between steps. Disable for a static, instant appearance.'}
                </p>
              </div>

              {/* Progress Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{adminData?.i18n?.tourEditor?.progressDisplay || 'Progress Display'}</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={tourData.settings.show_progress}
                        onChange={(e) => updateSettings('show_progress', e.target.checked)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent dark:peer-checked:bg-brand-accent"></div>
                    </label>
                    <Label value={adminData?.i18n?.tourEditor?.showProgressIndicator || 'Show progress indicator'} className="text-sm font-medium text-gray-900 dark:text-white" />
                  </div>
                  
                  <div>
                    <Label htmlFor="progress-text" value={adminData?.i18n?.tourEditor?.progressTextTemplate || 'Progress Text Template'} className="text-sm font-medium text-gray-900 dark:text-white mb-2 block" />
                    <TextInput
                      id="progress-text"
                      value={tourData.settings.progress_text}
                      onChange={(e) => updateSettings('progress_text', e.target.value)}
                      placeholder={adminData?.i18n?.tourEditor?.progressPlaceholder || '{{current}} of {{total}}'}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {adminData?.i18n?.tourEditor?.progressHelp || 'Customize the progress text. Use {{current}} for current step and {{total}} for total steps.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exit Control Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{adminData?.i18n?.tourEditor?.exitControl || 'Exit Control'}</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={tourData.settings.allow_close}
                        onChange={(e) => updateSettings('allow_close', e.target.checked)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent dark:peer-checked:bg-brand-accent"></div>
                    </label>
                    <Label value={adminData?.i18n?.tourEditor?.allowUsersToCloseTour || 'Allow users to close tour'} className="text-sm font-medium text-gray-900 dark:text-white" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {adminData?.i18n?.tourEditor?.allowCloseHelp || 'When disabled, users must complete the entire tour before they can exit.'}
                  </p>

                  <div className="flex items-center space-x-3">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={tourData.settings.confirm_exit}
                        onChange={(e) => updateSettings('confirm_exit', e.target.checked)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent dark:peer-checked:bg-brand-accent"></div>
                    </label>
                    <Label value={adminData?.i18n?.tourEditor?.showConfirmationDialogBeforeExit || 'Show confirmation dialog before exit'} className="text-sm font-medium text-gray-900 dark:text-white" />
                  </div>

                  <div>
                    <Label htmlFor="exit-message" value={adminData?.i18n?.tourEditor?.exitConfirmationMessage || 'Exit Confirmation Message'} className="text-sm font-medium text-gray-900 dark:text-white mb-2 block" />
                    <TextInput
                      id="exit-message"
                      value={tourData.settings.exit_message}
                      onChange={(e) => updateSettings('exit_message', e.target.value)}
                      placeholder={adminData?.i18n?.tourEditor?.exitConfirmationPlaceholder || 'Are you sure you want to exit the tour?'}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {adminData?.i18n?.tourEditor?.exitMessageHelp || 'Message shown when users try to exit the tour (only when confirmation is enabled).'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Button Customization */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{adminData?.i18n?.tourEditor?.buttonText || 'Button Text'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="next-btn" value={adminData?.i18n?.tourEditor?.nextButtonText || 'Next Button Text'} className="text-sm font-medium text-gray-900 dark:text-white mb-2 block" />
                    <TextInput
                      id="next-btn"
                      value={tourData.settings.next_btn_text}
                      onChange={(e) => updateSettings('next_btn_text', e.target.value)}
                      placeholder={adminData?.i18n?.tourEditor?.nextPlaceholder || 'Next'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="prev-btn" value={adminData?.i18n?.tourEditor?.previousButtonText || 'Previous Button Text'} className="text-sm font-medium text-gray-900 dark:text-white mb-2 block" />
                    <TextInput
                      id="prev-btn"
                      value={tourData.settings.prev_btn_text}
                      onChange={(e) => updateSettings('prev_btn_text', e.target.value)}
                      placeholder={adminData?.i18n?.tourEditor?.previousPlaceholder || 'Previous'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="done-btn" value={adminData?.i18n?.tourEditor?.doneButtonText || 'Done Button Text'} className="text-sm font-medium text-gray-900 dark:text-white mb-2 block" />
                    <TextInput
                      id="done-btn"
                      value={tourData.settings.done_btn_text}
                      onChange={(e) => updateSettings('done_btn_text', e.target.value)}
                      placeholder={adminData?.i18n?.tourEditor?.donePlaceholder || 'Done'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="close-btn" value={adminData?.i18n?.tourEditor?.closeButtonText || 'Close Button Text'} className="text-sm font-medium text-gray-900 dark:text-white mb-2 block" />
                    <TextInput
                      id="close-btn"
                      value={tourData.settings.close_btn_text}
                      onChange={(e) => updateSettings('close_btn_text', e.target.value)}
                      placeholder={adminData?.i18n?.tourEditor?.closePlaceholder || 'Close'}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {adminData?.i18n?.tourEditor?.buttonTextHelp || 'Customize the text displayed on tour navigation buttons.'}
                </p>
              </div>

              {/* Default Button Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{adminData?.i18n?.tourEditor?.defaultButtonsToShow || 'Default Buttons to Show'}</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tourData.settings.default_buttons.includes('next')}
                      onChange={(e) => {
                        const buttons = e.target.checked 
                          ? [...tourData.settings.default_buttons, 'next']
                          : tourData.settings.default_buttons.filter(b => b !== 'next')
                        updateSettings('default_buttons', buttons)
                      }}
                      className="w-4 h-4 text-brand-accent"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.nextButton || 'Next button'}</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tourData.settings.default_buttons.includes('previous')}
                      onChange={(e) => {
                        const buttons = e.target.checked 
                          ? [...tourData.settings.default_buttons, 'previous']
                          : tourData.settings.default_buttons.filter(b => b !== 'previous')
                        updateSettings('default_buttons', buttons)
                      }}
                      className="w-4 h-4 text-brand-accent"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.previousButton || 'Previous button'}</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tourData.settings.default_buttons.includes('close')}
                      onChange={(e) => {
                        const buttons = e.target.checked 
                          ? [...tourData.settings.default_buttons, 'close']
                          : tourData.settings.default_buttons.filter(b => b !== 'close')
                        updateSettings('default_buttons', buttons)
                      }}
                      className="w-4 h-4 text-brand-accent"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{adminData?.i18n?.tourEditor?.closeButton || 'Close button'}</span>
                  </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {adminData?.i18n?.tourEditor?.defaultButtonsHelp || 'Select which buttons should be shown by default on each tour step. Individual steps can override these settings.'}
                </p>
              </div>

              {/* Overlay Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{adminData?.i18n?.tourEditor?.overlayStyle || 'Overlay Style'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="overlay-color" value={adminData?.i18n?.tourEditor?.overlayColor || 'Overlay Color'} className="text-sm font-medium text-gray-900 dark:text-white mb-2 block" />
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        id="overlay-color"
                        value={tourData.settings.overlay_color}
                        onChange={(e) => updateSettings('overlay_color', e.target.value)}
                        className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                      <TextInput
                        value={tourData.settings.overlay_color}
                        onChange={(e) => updateSettings('overlay_color', e.target.value)}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="overlay-opacity" value={adminData?.i18n?.tourEditor?.overlayOpacity || 'Overlay Opacity'} className="text-sm font-medium text-gray-900 dark:text-white mb-2 block" />
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        id="overlay-opacity"
                        min="0"
                        max="1"
                        step="0.1"
                        value={tourData.settings.overlay_opacity}
                        onChange={(e) => updateSettings('overlay_opacity', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[3rem]">
                        {tourData.settings.overlay_opacity}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {adminData?.i18n?.tourEditor?.overlayStyleHelp || 'Customize the background overlay that appears behind the tour popover.'}
                </p>
              </div>

              {/* Popover Styling */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{adminData?.i18n?.tourEditor?.popoverStyle || 'Popover Style'}</h3>
                <div>
                  <Label htmlFor="popover-class" value={adminData?.i18n?.tourEditor?.customCssClass || 'Custom CSS Class'} className="text-sm font-medium text-gray-900 dark:text-white mb-2 block" />
                  <TextInput
                    id="popover-class"
                    value={tourData.settings.popover_class}
                    onChange={(e) => updateSettings('popover_class', e.target.value)}
                    placeholder={adminData?.i18n?.tourEditor?.customCssPlaceholder || 'my-custom-tour-theme'}
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {adminData?.i18n?.tourEditor?.customCssHelp || 'Add a custom CSS class to style the popover. Leave empty for default styling.\nTry: magiccl-theme-dark, magiccl-theme-primary, magiccl-theme-minimal, magiccl-theme-rounded, or magiccl-theme-large.'}
                  </p>
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{adminData?.i18n?.tourEditor?.advancedOptions || 'Advanced Options'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="padding" value={adminData?.i18n?.tourEditor?.highlightPadding || 'Highlight Padding'} className="text-sm font-medium text-gray-900 dark:text-white mb-2 block" />
                    <TextInput
                      type="number"
                      id="padding"
                      min="0"
                      max="50"
                      value={tourData.settings.padding}
                      onChange={(e) => updateSettings('padding', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {adminData?.i18n?.tourEditor?.paddingHelp || 'Padding around highlighted elements in pixels.'}
                    </p>
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center space-x-3">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={tourData.settings.smooth_scroll}
                          onChange={(e) => updateSettings('smooth_scroll', e.target.checked)}
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent dark:peer-checked:bg-brand-accent"></div>
                      </label>
                      <Label value={adminData?.i18n?.tourEditor?.smoothScroll || 'Smooth Scroll'} className="text-sm font-medium text-gray-900 dark:text-white" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {adminData?.i18n?.tourEditor?.smoothScrollHelp || 'Enable smooth scrolling to highlighted elements.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Current Steps */}
          {steps.length > 0 && (
            <Card>
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {steps.length} {steps.length === 1 ? (adminData?.i18n?.tourEditor?.tourStep || 'Tour Step') : (adminData?.i18n?.tourEditor?.tourStepsTitle || 'Tour Steps')}
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">{adminData?.i18n?.tourEditor?.dragToReorder || '(drag to reorder)'}</span>
                </h2>
                <DragDropContext onDragEnd={handleStepsDragEnd}>
                  <Droppable droppableId="tour-steps">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-3 ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2' : ''}`}
                      >
                        {steps.map((step, index) => (
                          <Draggable key={`step-${index}`} draggableId={`step-${index}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 ${
                                  snapshot.isDragging 
                                    ? 'shadow-lg transform rotate-2 bg-white dark:bg-gray-700 border-brand-accent' 
                                    : 'hover:shadow-md'
                                }`}
                              >
                                <div 
                                  {...provided.dragHandleProps}
                                  className="flex-shrink-0 cursor-move p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                  </svg>
                                </div>
                                <div className="flex-shrink-0 w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center text-brand-dark text-sm font-bold">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {step.title || `Step ${index + 1}`}
                                  </div>
                                  {step.element && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 inline-block">
                                      {step.element}
                                    </div>
                                  )}
                                  {step.page_url && (
                                    <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                      {step.page_url}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <div className="flex flex-col sm:flex-row justify-center gap-4 py-4">
              {isEditing ? (
                // Editing existing tour - show all options
                <>
                  <Button
                    color="brand"
                    onClick={() => handleSave(true)}
                    disabled={saving || !tourData.title.trim()}
                    className="flex items-center justify-center dark:text-gray-100"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {saving ? (adminData?.i18n?.tourEditor?.saving || 'Saving...') : (adminData?.i18n?.tourEditor?.saveAndOpenVisualCreator || 'Save & Open Visual Creator')}
                  </Button>
                  <Button
                    color="gray"
                    onClick={() => handleSave(false)}
                    disabled={saving || !tourData.title.trim()}
                  >
                    {adminData?.i18n?.tourEditor?.saveSettingsOnly || 'Save Settings Only'}
                  </Button>
                  {steps.length > 0 && (
                    <Button
                      color="gray"
                      onClick={handleResetCompletion}
                      className="flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {adminData?.i18n?.tourEditor?.resetMyCompletion || 'Reset My Completion'}
                    </Button>
                  )}
                </>
              ) : (
                // Creating new tour - only show save & open creator
                <Button
                  color="brand"
                  onClick={() => handleSave(true)}
                  disabled={saving || !tourData.title.trim()}
                  className="flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {saving ? (adminData?.i18n?.tourEditor?.saving || 'Saving...') : (adminData?.i18n?.tourEditor?.saveAndOpenVisualCreator || 'Save & Open Visual Creator')}
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {isEditing ? (adminData?.i18n?.tourEditor?.gettingStarted || 'Getting Started') : (adminData?.i18n?.tourEditor?.createYourTour || 'Create Your Tour')}
              </h3>
              
              <div className="space-y-4">
                {(isEditing ? [
                  {
                    step: 1,
                    title: adminData?.i18n?.tourEditor?.configureSettings || 'Configure Settings',
                    description: adminData?.i18n?.tourEditor?.configureSettingsDescription || 'Set up the basic information, trigger conditions, and customize the appearance.'
                  },
                  {
                    step: 2,
                    title: adminData?.i18n?.tourEditor?.addTourSteps || 'Add Tour Steps',
                    description: adminData?.i18n?.tourEditor?.addTourStepsDescription || 'Use the visual tour creator to add interactive steps by clicking on elements.'
                  },
                  {
                    step: 3,
                    title: adminData?.i18n?.tourEditor?.previewAndTest || 'Preview & Test',
                    description: adminData?.i18n?.tourEditor?.previewAndTestDescription || 'Use the preview feature to test your tour and make adjustments.'
                  },
                  {
                    step: 4,
                    title: adminData?.i18n?.tourEditor?.testAndActivate || 'Test & Activate',
                    description: adminData?.i18n?.tourEditor?.testAndActivateDescription || 'Preview your tour, make adjustments, then activate it for your users.'
                  }
                ] : [
                  {
                    step: 1,
                    title: adminData?.i18n?.tourEditor?.setTourTitle || 'Set Tour Title',
                    description: adminData?.i18n?.tourEditor?.setTourTitleDescription || 'Give your tour a descriptive name that explains its purpose.'
                  },
                  {
                    step: 2,
                    title: adminData?.i18n?.tourEditor?.configureTrigger || 'Configure Trigger',
                    description: adminData?.i18n?.tourEditor?.configureTriggerDescription || 'Choose when and where your tour should appear to users.'
                  },
                  {
                    step: 3,
                    title: adminData?.i18n?.tourEditor?.saveAndCreate || 'Save & Create',
                    description: adminData?.i18n?.tourEditor?.saveAndCreateDescription || 'Click "Save & Open Visual Creator" to start adding interactive steps.'
                  },
                  {
                    step: 4,
                    title: adminData?.i18n?.tourEditor?.addSteps || 'Add Steps',
                    description: adminData?.i18n?.tourEditor?.addStepsDescription || 'Use the visual creator to click on elements and create guided tour steps.'
                  }
                ]).map((item) => (
                  <div key={item.step} className="flex items-start space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-brand-accent text-brand-dark rounded-full text-sm font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TourEditor 