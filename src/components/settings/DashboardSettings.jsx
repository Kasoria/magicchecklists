import { useState, useEffect } from 'react'
import { Button, Label } from 'flowbite-react'

const DashboardSettings = ({ settings, onSave, loading, adminData }) => {
  // Get i18n data
  const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.mclAdminData?.i18n) || {};
  
  const [formData, setFormData] = useState({
    enabled: false,
    show_checklists: true,
    show_checklist_items: false,
    selected_checklist: '',
    selected_checklists: [],
    show_deadlines: false,
    show_tags: false,
    show_descriptions: false,
    show_quick_actions: true
  })

  const [checklists, setChecklists] = useState([])
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (settings) {
      let selectedChecklists = settings.selected_checklists || []
      if (Array.isArray(selectedChecklists)) {
        selectedChecklists = selectedChecklists.map(id => String(id))
      } else {
        selectedChecklists = []
      }

      setFormData(prev => ({
        ...prev,
        ...settings,
        selected_checklists: selectedChecklists
      }))
    }
  }, [settings])

  useEffect(() => {
    fetchChecklists()
  }, [])

  const fetchChecklists = async () => {
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'mcl_get_checklists',
          'nonce': adminData.nonces?.mcl_admin || ''
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const transformedChecklists = (data.data?.data || [])
            .filter(checklist => checklist.type !== 'publisher')
            .map(checklist => ({
              ...checklist,
              active: checklist.status === 'active'
            }))
          setChecklists(transformedChecklists)
        }
      }
    } catch (err) {
      console.error('Error fetching checklists:', err)
    }
  }

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleChecklistSelectionChange = (checklistId, isSelected) => {
    setFormData(prev => {
      const currentSelection = Array.isArray(prev.selected_checklists) ? [...prev.selected_checklists] : []
      const checklistIdStr = String(checklistId)
      
      if (isSelected) {
        if (!currentSelection.includes(checklistIdStr)) {
          currentSelection.push(checklistIdStr)
        }
      } else {
        const index = currentSelection.indexOf(checklistIdStr)
        if (index > -1) {
          currentSelection.splice(index, 1)
        }
      }
      
      return {
        ...prev,
        selected_checklists: currentSelection
      }
    })
  }

  const handleSelectAllChecklists = () => {
    const allChecklistIds = checklists.map(checklist => String(checklist.id))
    setFormData(prev => ({
      ...prev,
      selected_checklists: allChecklistIds
    }))
  }

  const handleDeselectAllChecklists = () => {
    setFormData(prev => ({
      ...prev,
      selected_checklists: []
    }))
  }

  const validateForm = () => {
    const errors = {}
    
    // If "Show Checklists" is enabled, at least one checklist must be selected
    if (formData.show_checklists && formData.selected_checklists.length === 0) {
      errors.selected_checklists = i18n.dashboardSettings?.validation?.checklistRequired || 'At least one checklist must be selected when "Show Checklists" is enabled.'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) {
      return // Don't save if validation fails
    }
    
    onSave(formData)
  }

  // Clear validation errors when relevant fields change
  useEffect(() => {
    if (validationErrors.selected_checklists && formData.selected_checklists.length > 0) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.selected_checklists
        return newErrors
      })
    }
  }, [formData.selected_checklists, validationErrors.selected_checklists])

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-brand-dark dark:text-white mb-4">{i18n.dashboardSettings?.title || 'Dashboard Widget'}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          {i18n.dashboardSettings?.description || 'Configure the MagicChecklists dashboard widget that appears on the WordPress admin dashboard. At least one display option must be enabled for the widget to appear.'}
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
        {/* Enable Dashboard Widget */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            {i18n.dashboardSettings?.labels?.enableWidget || 'Enable Dashboard Widget'}
          </Label>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {i18n.dashboardSettings?.descriptions?.enableWidget || 'Enable the MagicChecklists widget on the WordPress admin dashboard.'}
          </p>
        </div>

        {formData.enabled && (
          <>
            {/* Show Checklists */}
            <div className="space-y-2">
              <Label className="text-brand-dark dark:text-white font-medium">
                {i18n.dashboardSettings?.labels?.showChecklists || 'Show Checklists'}
              </Label>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.show_checklists}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_checklists: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {i18n.dashboardSettings?.descriptions?.showChecklists || 'Display a list of checklists with their current status. Choose which checklists to display below.'}
              </p>
              
              {formData.show_checklists && (
                <div className="mt-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-brand-dark dark:text-white">
                      {i18n.dashboardSettings?.labels?.selectChecklists || 'Select Checklists to Display'}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllChecklists}
                        className="text-xs px-2 py-1 bg-brand-accent text-brand-dark rounded hover:bg-brand-accent/90 transition-colors"
                      >
                        {i18n.dashboardSettings?.buttons?.selectAll || 'Select All'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllChecklists}
                        className="text-xs px-2 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                      >
                        {i18n.dashboardSettings?.buttons?.deselectAll || 'Deselect All'}
                      </button>
                    </div>
                  </div>
                  
                  {validationErrors.selected_checklists && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm mb-3">
                      {validationErrors.selected_checklists}
                    </div>
                  )}
                  
                  {checklists.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      {i18n.dashboardSettings?.messages?.noChecklists || 'No checklists found. Create some checklists first to display them in the widget.'}
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {checklists.map((checklist) => {
                          const isSelected = Array.isArray(formData.selected_checklists) && 
                            formData.selected_checklists.includes(String(checklist.id))
                          
                          return (
                            <label key={checklist.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleChecklistSelectionChange(checklist.id, e.target.checked)}
                                className="w-4 h-4 text-brand-accent bg-gray-100 border-gray-300 rounded focus:ring-brand-accent dark:focus:ring-brand-accent dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                                {checklist.title}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                checklist.active
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              }`}>
                                {checklist.active ? (i18n.dashboardSettings?.status?.active || 'Active') : (i18n.dashboardSettings?.status?.inactive || 'Inactive')}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {Array.isArray(formData.selected_checklists) && formData.selected_checklists.length === 0 ? (
                      i18n.dashboardSettings?.messages?.noChecklistsSelected || 'No checklists selected. All checklists will be displayed if none are specifically selected.'
                    ) : (
                      `${formData.selected_checklists?.length || 0} ${i18n.dashboardSettings?.messages?.checklistsSelected || 'checklist(s) selected for display.'}`
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Show Checklist Items */}
            <div className="space-y-2">
              <Label className="text-brand-dark dark:text-white font-medium">
                {i18n.dashboardSettings?.labels?.showChecklistItems || 'Show Checklist Items'}
              </Label>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.show_checklist_items}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_checklist_items: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {i18n.dashboardSettings?.descriptions?.showChecklistItems || 'Display items from a specific checklist. Select which checklist below.'}
              </p>
              
              {formData.show_checklist_items && (
                <div className="mt-3">
                  <select
                    value={formData.selected_checklist}
                    onChange={(e) => setFormData(prev => ({ ...prev, selected_checklist: e.target.value }))}
                    className="block w-full max-w-sm px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent text-brand-dark dark:text-white"
                  >
                    <option value="">{i18n.dashboardSettings?.labels?.selectChecklist || 'Select a checklist'}</option>
                    {checklists.map((checklist) => (
                      <option key={checklist.id} value={checklist.id}>
                        {checklist.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Show Deadlines */}
            <div className="space-y-2">
              <Label className="text-brand-dark dark:text-white font-medium">
                {i18n.dashboardSettings?.labels?.showDeadlines || 'Show Deadlines'}
              </Label>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.show_deadlines}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_deadlines: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {i18n.dashboardSettings?.descriptions?.showDeadlines || 'Display upcoming deadlines for checklist items with color-coded urgency.'}
              </p>
            </div>

            {/* Show Tags */}
            <div className="space-y-2">
              <Label className="text-brand-dark dark:text-white font-medium">
                {i18n.dashboardSettings?.labels?.showTags || 'Show Tags'}
              </Label>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.show_tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_tags: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {i18n.dashboardSettings?.descriptions?.showTags || 'Display tags associated with each checklist.'}
              </p>
            </div>

            {/* Show Descriptions */}
            <div className="space-y-2">
              <Label className="text-brand-dark dark:text-white font-medium">
                {i18n.dashboardSettings?.labels?.showDescriptions || 'Show Descriptions'}
              </Label>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.show_descriptions}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_descriptions: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {i18n.dashboardSettings?.descriptions?.showDescriptions || 'Display a truncated description for each checklist.'}
              </p>
            </div>

            {/* Show Quick Actions */}
            <div className="space-y-2">
              <Label className="text-brand-dark dark:text-white font-medium">
                {i18n.dashboardSettings?.labels?.showQuickActions || 'Show Quick Actions'}
              </Label>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.show_quick_actions}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_quick_actions: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {i18n.dashboardSettings?.descriptions?.showQuickActions || 'Display quick action buttons to activate/deactivate checklists directly from the dashboard.'}
              </p>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-brand-accent hover:bg-brand-accent/90 focus:ring-brand-accent text-brand-dark font-medium dark:bg-brand-accent hover:dark:bg-brand-accent/90"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {i18n.dashboardSettings?.buttons?.saving || 'Saving...'}
              </>
            ) : (
              i18n.dashboardSettings?.buttons?.save || 'Save Dashboard Widget Settings'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Ensure component has a display name for debugging
DashboardSettings.displayName = 'DashboardSettings'

export default DashboardSettings 