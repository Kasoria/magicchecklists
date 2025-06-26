import { useState, useEffect } from 'react'
import { Button, Label } from 'flowbite-react'

const GeneralSettings = ({ settings, onSave, loading, adminData }) => {
  const [formData, setFormData] = useState({
    enable_checklist_navigation: false,
    enable_progress_counter: false,
    delete_data_on_uninstall: false,
    speed_dial_bg_color: '#374151',
    speed_dial_icon_color: '#ffffff'
  })

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings
      }))
    }
  }, [settings])

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



        {/* Speed Dial Colors */}
        <div className="space-y-4">
          <Label className="text-brand-dark dark:text-white font-medium">
            Speed Dial Appearance
          </Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="speed_dial_bg_color" className="text-brand-dark dark:text-white text-sm">
                Background Color
              </Label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id="speed_dial_bg_color"
                  value={formData.speed_dial_bg_color}
                  onChange={(e) => handleInputChange('speed_dial_bg_color', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.speed_dial_bg_color}
                  onChange={(e) => handleInputChange('speed_dial_bg_color', e.target.value)}
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  className="flex-1 px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent text-brand-dark dark:text-white"
                  placeholder="#374151"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="speed_dial_icon_color" className="text-brand-dark dark:text-white text-sm">
                Icon Color
              </Label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id="speed_dial_icon_color"
                  value={formData.speed_dial_icon_color}
                  onChange={(e) => handleInputChange('speed_dial_icon_color', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.speed_dial_icon_color}
                  onChange={(e) => handleInputChange('speed_dial_icon_color', e.target.value)}
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  className="flex-1 px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent text-brand-dark dark:text-white"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Customize the appearance of the speed dial trigger button that appears when multiple checklists have floating buttons enabled.
          </p>
        </div>

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
                Saving...
              </>
            ) : (
              'Save General Settings'
            )}
          </Button>
        </div>
      </form>
      
      <style>{`
        input[type="color"] {
          width: 48px;
          height: 40px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          padding: 2px;
        }
        input[type="color"]::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        input[type="color"]::-webkit-color-swatch {
          border: none;
          border-radius: 4px;
        }
        input[type="color"]::-moz-color-swatch {
          border: none;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}

// Ensure component has a display name for debugging
GeneralSettings.displayName = 'GeneralSettings'

export default GeneralSettings 