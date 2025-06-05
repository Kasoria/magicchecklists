import { useState, useEffect } from 'react'
import { Button, Label } from 'flowbite-react'

const GeneralSettings = ({ settings, onSave, loading, adminData }) => {
  const [formData, setFormData] = useState({
    enable_checklist_navigation: false,
    enable_progress_counter: false,
    delete_data_on_uninstall: false,
    menu_position_type: 'default',
    menu_position_relative_to: '',
    menu_position: 'after',
    custom_position: ''
  })

  const [menuItems, setMenuItems] = useState([])

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings
      }))
    }
  }, [settings])

  useEffect(() => {
    // Fetch menu items for positioning
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'mcl_get_menu_items',
          'nonce': adminData.nonces?.mcl_admin || ''
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMenuItems(data.data || [])
        }
      }
    } catch (err) {
      console.error('Error fetching menu items:', err)
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
    
    // Validate menu position settings
    if (formData.menu_position_type === 'relative' && !formData.menu_position_relative_to) {
      alert('Please select a menu item for relative positioning.')
      return
    }
    
    if (formData.menu_position_type === 'custom' && !formData.custom_position) {
      alert('Please enter a position number between 1 and 99.')
      return
    }

    // Validate before/after positioning
    const restrictedBeforeItems = ['index.php', 'dashboard']
    if (formData.menu_position === 'before' && restrictedBeforeItems.includes(formData.menu_position_relative_to)) {
      alert("Cannot position menu before this item. Please select 'After' or choose a different menu item.")
      return
    }

    onSave(formData)
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-brand-dark dark:text-white mb-4">General Settings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Configure general plugin settings and behavior.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Checklist Navigation */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            Checklist Arrow Buttons Navigation
          </Label>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.enable_checklist_navigation}
                onChange={(e) => handleInputChange('enable_checklist_navigation', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Enable navigation arrows to switch between active checklists when the drawer is open.
          </p>
        </div>

        {/* Progress Counter */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            Progress Counter
          </Label>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.enable_progress_counter}
                onChange={(e) => handleInputChange('enable_progress_counter', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Show a progress counter in checklists displaying total items, completed items, and completion percentage.
          </p>
        </div>

        {/* Data Cleanup */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            Data Cleanup
          </Label>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.delete_data_on_uninstall}
                onChange={(e) => handleInputChange('delete_data_on_uninstall', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Delete all plugin data when uninstalling MagicChecklists (including checklists, settings, and database tables).
          </p>
        </div>

        {/* Menu Position */}
        <div className="space-y-4">
          <Label className="text-brand-dark dark:text-white font-medium">
            Menu Position
          </Label>
          <div className="space-y-3">
            <select
              value={formData.menu_position_type}
              onChange={(e) => handleInputChange('menu_position_type', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent text-brand-dark dark:text-white"
            >
              <option value="default">Default Position</option>
              <option value="relative">Relative to Another Menu Item</option>
              <option value="custom">Custom Position (1-99)</option>
            </select>

            {formData.menu_position_type === 'relative' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={formData.menu_position}
                  onChange={(e) => handleInputChange('menu_position', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent text-brand-dark dark:text-white"
                >
                  <option value="after">After</option>
                  <option value="before">Before</option>
                </select>

                <select
                  value={formData.menu_position_relative_to}
                  onChange={(e) => handleInputChange('menu_position_relative_to', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent text-brand-dark dark:text-white"
                >
                  <option value="">Select Menu Item</option>
                  {menuItems.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.menu_position_type === 'custom' && (
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={formData.custom_position}
                  onChange={(e) => handleInputChange('custom_position', e.target.value)}
                  placeholder="1-99"
                  className="block w-20 px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent text-brand-dark dark:text-white"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Enter a number between 1 and 99
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Choose where to display the MagicChecklists menu item in the admin menu.
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
              'Save General Settings'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Ensure component has a display name for debugging
GeneralSettings.displayName = 'GeneralSettings'

export default GeneralSettings 