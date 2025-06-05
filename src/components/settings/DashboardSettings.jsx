import { useState, useEffect } from 'react'
import { Button, Label } from 'flowbite-react'

const DashboardSettings = ({ settings, onSave, loading, adminData }) => {
  const [formData, setFormData] = useState({
    enabled: false,
    show_checklists: true,
    show_checklist_items: false,
    selected_checklist: '',
    show_deadlines: false,
    show_tags: false,
    show_descriptions: false,
    show_quick_actions: true
  })

  const [checklists, setChecklists] = useState([])

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings
      }))
    }
  }, [settings])

  useEffect(() => {
    // Fetch checklists for the dropdown
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
          setChecklists(data.data?.data || [])
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

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-brand-dark dark:text-white mb-4">Dashboard Widget</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Configure the MagicChecklists dashboard widget that appears on the WordPress admin dashboard. 
          At least one display option must be enabled for the widget to appear.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enable Dashboard Widget */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            Enable Dashboard Widget
          </Label>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.enabled}
                onChange={(e) => handleInputChange('enabled', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Enable the MagicChecklists widget on the WordPress admin dashboard.
          </p>
        </div>

        {/* Show Checklists */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            Show Checklists
          </Label>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.show_checklists}
                onChange={(e) => handleInputChange('show_checklists', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Display a list of all checklists with their current status.
          </p>
        </div>

        {/* Show Checklist Items */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            Show Checklist Items
          </Label>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.show_checklist_items}
                onChange={(e) => handleInputChange('show_checklist_items', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Display items from a specific checklist. Select which checklist below.
          </p>
          
          {formData.show_checklist_items && (
            <div className="mt-3">
              <select
                value={formData.selected_checklist}
                onChange={(e) => handleInputChange('selected_checklist', e.target.value)}
                className="block w-full max-w-sm px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent text-brand-dark dark:text-white"
              >
                <option value="">Select a checklist</option>
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
            Show Deadlines
          </Label>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.show_deadlines}
                onChange={(e) => handleInputChange('show_deadlines', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Display upcoming deadlines for checklist items with color-coded urgency.
          </p>
        </div>

        {/* Show Tags */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            Show Tags
          </Label>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.show_tags}
                onChange={(e) => handleInputChange('show_tags', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Display tags associated with each checklist.
          </p>
        </div>

        {/* Show Descriptions */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            Show Descriptions
          </Label>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.show_descriptions}
                onChange={(e) => handleInputChange('show_descriptions', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Display a truncated description for each checklist.
          </p>
        </div>

        {/* Show Quick Actions */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            Show Quick Actions
          </Label>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.show_quick_actions}
                onChange={(e) => handleInputChange('show_quick_actions', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Display quick action buttons to activate/deactivate checklists directly from the dashboard.
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-brand-accent hover:bg-brand-accent/90 focus:ring-brand-accent text-brand-dark font-medium"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Dashboard Widget Settings'
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