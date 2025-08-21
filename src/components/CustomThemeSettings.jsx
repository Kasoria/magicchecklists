import React, { useState, useEffect } from 'react'
import { Card, Label, Button, Alert } from 'flowbite-react'
import ReactSelect from 'react-select'

// Simple Toggle Component
const Toggle = ({ checked, onChange, label }) => (
  <div className="flex items-center">
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 mt-1 ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </div>
    </div>
    {label && <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{label}</span>}
  </div>
)

const CustomThemeSettings = ({ formData, onChange, adminData }) => {
  // Create a state for i18n data that can be updated when available
  const [i18n, setI18n] = useState({});
  
  useEffect(() => {
    // Function to get i18n data from available sources
    const getI18nData = () => {
      let i18nData = {};
      
      // First try adminData prop
      if (adminData?.i18n) {
        i18nData = adminData.i18n;
      }
      // Then try window.mclAdminData
      else if (typeof window !== 'undefined' && window.mclAdminData?.i18n) {
        i18nData = window.mclAdminData.i18n;
      }
      
      return i18nData;
    };
    
    const i18nData = getI18nData();
    
    // If we have i18n data, set it
    if (Object.keys(i18nData).length > 0) {
      setI18n(i18nData);
    } else {
      // If not available yet, try again after a short delay
      // This handles cases where window.mclAdminData is loaded after component mount
      setTimeout(() => {
        const retryI18nData = getI18nData();
        if (Object.keys(retryI18nData).length > 0) {
          setI18n(retryI18nData);
        }
      }, 100);
    }
  }, [adminData]);

  const [customIconPreview, setCustomIconPreview] = useState(formData.checkbox_custom_icon || '')
  const [errors, setErrors] = useState({})

  const handleInputChange = (field, value) => {
    // Validate input based on field type
    const newErrors = { ...errors }

    if (field.includes('font_size')) {
      if (value < 10 || value > 50) {
        newErrors[field] = i18n.customThemeSettings?.validation?.fontSizeRange || 'Font size must be between 10 and 50 pixels'
      } else {
        delete newErrors[field]
      }
    } else if (field === 'drawer_width') {
      if (value < 400 || value > 2000) {
        newErrors[field] = i18n.customThemeSettings?.validation?.widthRange || 'Width must be between 400 and 2000 pixels'
      } else {
        delete newErrors[field]
      }
    } else if (field === 'drawer_height') {
      if (value < 350 || value > 2000) {
        newErrors[field] = i18n.customThemeSettings?.validation?.heightRange || 'Height must be between 350 and 2000 pixels'
      } else {
        delete newErrors[field]
      }
    } else if (field.includes('color')) {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      if (value && !hexColorRegex.test(value)) {
        newErrors[field] = i18n.customThemeSettings?.validation?.invalidHexColor || 'Please enter a valid hex color (e.g., #ffffff)'
      } else {
        delete newErrors[field]
      }
    }

    setErrors(newErrors)
    onChange(field, value)
  }

  const handleMediaUpload = () => {
    // WordPress media uploader
    if (window.wp && window.wp.media) {
      const mediaUploader = window.wp.media({
        title: i18n.customThemeSettings?.mediaUploader?.title || 'Select Custom Checkmark Icon',
        button: {
          text: i18n.customThemeSettings?.mediaUploader?.buttonText || 'Use This Image'
        },
        multiple: false,
        library: {
          type: ['image']
        }
      })

      mediaUploader.on('select', () => {
        const attachment = mediaUploader.state().get('selection').first().toJSON()
        setCustomIconPreview(attachment.url)
        handleInputChange('checkbox_custom_icon', attachment.url)
      })

      mediaUploader.open()
    }
  }

  const removeCustomIcon = () => {
    setCustomIconPreview('')
    handleInputChange('checkbox_custom_icon', '')
  }

  const ColorInput = ({ label, field, helpText }) => (
    <div className="space-y-2">
      <Label htmlFor={field} value={label} className="text-brand-dark dark:text-white" />
      <div className="flex items-center space-x-2">
        <input
          type="color"
          id={field}
          value={formData[field] || '#ffffff'}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
        />
        <input
          type="text"
          value={formData[field] || '#ffffff'}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          placeholder="#ffffff"
        />
      </div>
      {errors[field] && (
        <p className="text-red-500 text-sm">{errors[field]}</p>
      )}
      {helpText && (
        <p className="text-sm text-gray-600 dark:text-gray-300">{helpText}</p>
      )}
    </div>
  )

  const NumberInputWithUnit = ({ label, field, unit, min, max, helpText }) => (
    <div className="space-y-2">
      <Label htmlFor={field} value={label} className="text-brand-dark dark:text-white" />
      <div className="flex items-center space-x-2">
        <input
          type="number"
          id={field}
          value={formData[field] || ''}
          onChange={(e) => handleInputChange(field, parseInt(e.target.value) || '')}
          min={min}
          max={max}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
        />
        <span className="text-gray-500 text-sm">{unit}</span>
      </div>
      {errors[field] && (
        <p className="text-red-500 text-sm">{errors[field]}</p>
      )}
      {helpText && (
        <p className="text-sm text-gray-600 dark:text-gray-300">{helpText}</p>
      )}
    </div>
  )

  return (
    <Card className="mt-6">
      <div className="space-y-8">
        <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
          <h4 className="text-lg font-semibold text-brand-dark dark:text-white">
            {i18n.customThemeSettings?.title || 'Custom Theme Settings'}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {i18n.customThemeSettings?.description || 'Customize the visual appearance of your checklist drawer.'}
          </p>
        </div>

        {/* Colors Section */}
        <div className="space-y-6">
          <h5 className="text-base font-semibold text-brand-dark dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
            {i18n.customThemeSettings?.sections?.colors?.title || 'Colors'}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ColorInput 
              label={i18n.customThemeSettings?.sections?.colors?.backgroundColorLabel || "Background Color"} 
              field="drawer_bg_color"
              helpText={i18n.customThemeSettings?.sections?.colors?.backgroundColorHelp || "Main background color of the drawer"}
            />
            <ColorInput 
              label={i18n.customThemeSettings?.sections?.colors?.listItemBackgroundLabel || "List Item Background"} 
              field="list_item_bg_color"
              helpText={i18n.customThemeSettings?.sections?.colors?.listItemBackgroundHelp || "Background color for checklist items"}
            />
            <ColorInput 
              label={i18n.customThemeSettings?.sections?.colors?.textColorLabel || "Text Color"} 
              field="text_color"
              helpText={i18n.customThemeSettings?.sections?.colors?.textColorHelp || "Primary text color"}
            />
            <ColorInput 
              label={i18n.customThemeSettings?.sections?.colors?.descriptionTextColorLabel || "Description Text Color"} 
              field="description_text_color"
              helpText={i18n.customThemeSettings?.sections?.colors?.descriptionTextColorHelp || "Color for description text"}
            />
          </div>
        </div>

        {/* Typography Section */}
        <div className="space-y-6">
          <h5 className="text-base font-semibold text-brand-dark dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
            {i18n.customThemeSettings?.sections?.typography?.title || 'Typography'}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NumberInputWithUnit 
              label={i18n.customThemeSettings?.sections?.typography?.headingSizeLabel || "Heading Size"} 
              field="heading_font_size" 
              unit="px" 
              min={12} 
              max={48}
              helpText={i18n.customThemeSettings?.sections?.typography?.headingSizeHelp || "Size of the main title"}
            />
            <NumberInputWithUnit 
              label={i18n.customThemeSettings?.sections?.typography?.descriptionSizeLabel || "Description Size"} 
              field="description_font_size" 
              unit="px" 
              min={10} 
              max={24}
              helpText={i18n.customThemeSettings?.sections?.typography?.descriptionSizeHelp || "Size of description text"}
            />
            <NumberInputWithUnit 
              label={i18n.customThemeSettings?.sections?.typography?.listItemSizeLabel || "List Item Size"} 
              field="list_item_font_size" 
              unit="px" 
              min={10} 
              max={24}
              helpText={i18n.customThemeSettings?.sections?.typography?.listItemSizeHelp || "Size of checklist item text"}
            />
          </div>
        </div>

        {/* Button Colors Section */}
        <div className="space-y-6">
          <h5 className="text-base font-semibold text-brand-dark dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
            {i18n.customThemeSettings?.sections?.buttonColors?.title || 'Button Colors'}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ColorInput 
              label={i18n.customThemeSettings?.sections?.buttonColors?.primaryButtonBackgroundLabel || "Primary Button Background"} 
              field="primary_button_bg"
              helpText={i18n.customThemeSettings?.sections?.buttonColors?.primaryButtonBackgroundHelp || "Background color for primary buttons"}
            />
            <ColorInput 
              label={i18n.customThemeSettings?.sections?.buttonColors?.primaryButtonTextLabel || "Primary Button Text"} 
              field="primary_button_text_color"
              helpText={i18n.customThemeSettings?.sections?.buttonColors?.primaryButtonTextHelp || "Text color for primary buttons"}
            />
            <ColorInput 
              label={i18n.customThemeSettings?.sections?.buttonColors?.secondaryButtonBackgroundLabel || "Secondary Button Background"} 
              field="secondary_button_bg"
              helpText={i18n.customThemeSettings?.sections?.buttonColors?.secondaryButtonBackgroundHelp || "Background color for secondary buttons"}
            />
            <ColorInput 
              label={i18n.customThemeSettings?.sections?.buttonColors?.secondaryButtonTextLabel || "Secondary Button Text"} 
              field="secondary_button_text_color"
              helpText={i18n.customThemeSettings?.sections?.buttonColors?.secondaryButtonTextHelp || "Text color for secondary buttons"}
            />
          </div>
        </div>

        {/* Checkbox Style Section */}
        <div className="space-y-6">
          <h5 className="text-base font-semibold text-brand-dark dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
            {i18n.customThemeSettings?.sections?.checkboxStyle?.title || 'Checkbox Style'}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ColorInput 
              label={i18n.customThemeSettings?.sections?.checkboxStyle?.checkboxBackgroundLabel || "Checkbox Background"} 
              field="checkbox_bg_color"
              helpText={i18n.customThemeSettings?.sections?.checkboxStyle?.checkboxBackgroundHelp || "Background color of checkboxes"}
            />
            <NumberInputWithUnit 
              label={i18n.customThemeSettings?.sections?.checkboxStyle?.borderRadiusLabel || "Checkbox Border Radius"} 
              field="checkbox_border_radius" 
              unit="px" 
              min={0} 
              max={12}
              helpText={i18n.customThemeSettings?.sections?.checkboxStyle?.borderRadiusHelp || "Rounded corners for checkboxes"}
            />
            <div className="space-y-2">
              <Label htmlFor="checkbox_style" value={i18n.customThemeSettings?.sections?.checkboxStyle?.checkmarkStyleLabel || "Checkmark Style"} className="text-brand-dark dark:text-white" />
              <ReactSelect
                inputId="checkbox_style"
                value={{ value: formData.checkbox_style || 'standard', label: formData.checkbox_style === 'custom' ? (i18n.customThemeSettings?.sections?.checkboxStyle?.customImageOption || 'Custom Image') : (i18n.customThemeSettings?.sections?.checkboxStyle?.standardOption || 'Standard') }}
                onChange={(selectedOption) => handleInputChange('checkbox_style', selectedOption.value)}
                options={[
                  { value: 'standard', label: i18n.customThemeSettings?.sections?.checkboxStyle?.standardOption || 'Standard' },
                  { value: 'custom', label: i18n.customThemeSettings?.sections?.checkboxStyle?.customImageOption || 'Custom Image' }
                ]}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder={i18n.customThemeSettings?.sections?.checkboxStyle?.placeholder || "Select checkmark style..."}
              />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {i18n.customThemeSettings?.sections?.checkboxStyle?.description || "Choose between standard checkmark or custom image"}
              </p>
            </div>
          </div>

          {/* Custom Icon Settings */}
          {formData.checkbox_style === 'custom' && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
              <h6 className="text-sm font-medium text-brand-dark dark:text-white">{i18n.customThemeSettings?.sections?.checkboxStyle?.customIconTitle || "Custom Checkmark Icon"}</h6>
              <div className="space-y-4">
                {customIconPreview && (
                  <div className="flex items-center space-x-4">
                    <img src={customIconPreview} alt="Custom checkmark" className="w-8 h-8 object-contain" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{i18n.customThemeSettings?.sections?.checkboxStyle?.currentIconLabel || "Current icon"}</span>
                  </div>
                )}
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    color="gray"
                    onClick={handleMediaUpload}
                  >
                    {customIconPreview ? (i18n.customThemeSettings?.sections?.checkboxStyle?.changeImageButton || 'Change Image') : (i18n.customThemeSettings?.sections?.checkboxStyle?.selectImageButton || 'Select Image')}
                  </Button>
                  {customIconPreview && (
                    <Button
                      type="button"
                      color="failure"
                      onClick={removeCustomIcon}
                    >
                      {i18n.customThemeSettings?.sections?.checkboxStyle?.removeButton || 'Remove'}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {i18n.customThemeSettings?.sections?.checkboxStyle?.iconRecommendation || "Recommended: 24x24px PNG or SVG with transparency"}
                </p>
              </div>
            </div>
          )}

          {/* Standard Checkmark Settings */}
          {formData.checkbox_style !== 'custom' && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <ColorInput 
                label={i18n.customThemeSettings?.sections?.checkboxStyle?.checkmarkColorLabel || "Checkmark Color"} 
                field="checkbox_checkmark_color"
                helpText={i18n.customThemeSettings?.sections?.checkboxStyle?.checkmarkColorHelp || "Color of the standard checkmark"}
              />
            </div>
          )}
        </div>

        {/* Drawer Style Section */}
        <div className="space-y-6">
          <h5 className="text-base font-semibold text-brand-dark dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
            {i18n.customThemeSettings?.sections?.drawerStyle?.title || 'Drawer Style'}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NumberInputWithUnit 
              label={i18n.customThemeSettings?.sections?.drawerStyle?.borderRadiusLabel || "Border Radius"} 
              field="drawer_border_radius" 
              unit="px" 
              min={0} 
              max={50}
              helpText={i18n.customThemeSettings?.sections?.drawerStyle?.borderRadiusHelp || "Rounded corners for the drawer"}
            />
          </div>
        </div>

        {/* Dimensions Section */}
        <div className="space-y-6">
          <h5 className="text-base font-semibold text-brand-dark dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
            {i18n.customThemeSettings?.sections?.dimensions?.title || 'Dimensions'}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NumberInputWithUnit 
              label={i18n.customThemeSettings?.sections?.dimensions?.drawerWidthLabel || "Drawer Width"} 
              field="drawer_width" 
              unit="px" 
              min={400} 
              max={2000}
              helpText={i18n.customThemeSettings?.sections?.dimensions?.drawerWidthHelp || "Maximum width of the drawer"}
            />
            <NumberInputWithUnit 
              label={i18n.customThemeSettings?.sections?.dimensions?.drawerHeightLabel || "Drawer Height"} 
              field="drawer_height" 
              unit="px" 
              min={350} 
              max={2000}
              helpText={i18n.customThemeSettings?.sections?.dimensions?.drawerHeightHelp || "Maximum height of the drawer"}
            />
          </div>
        </div>

        {/* Floating Button Section */}
        <div className="space-y-6">
          <h5 className="text-base font-semibold text-brand-dark dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
            {i18n.customThemeSettings?.sections?.floatingButton?.title || 'Floating Button Settings'}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ColorInput 
              label={i18n.customThemeSettings?.sections?.floatingButton?.buttonBackgroundLabel || "Button Background"} 
              field="float_button_bg"
              helpText={i18n.customThemeSettings?.sections?.floatingButton?.buttonBackgroundHelp || "Background color of floating button"}
            />
            <ColorInput 
              label={i18n.customThemeSettings?.sections?.floatingButton?.buttonTextColorLabel || "Button Text Color"} 
              field="float_button_text_color"
              helpText={i18n.customThemeSettings?.sections?.floatingButton?.buttonTextColorHelp || "Text color of floating button"}
            />
            <NumberInputWithUnit 
              label={i18n.customThemeSettings?.sections?.floatingButton?.textSizeLabel || "Text Size"} 
              field="float_button_font_size" 
              unit="px" 
              min={12} 
              max={24}
              helpText={i18n.customThemeSettings?.sections?.floatingButton?.textSizeHelp || "Font size for button text"}
            />
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label value={i18n.customThemeSettings?.sections?.floatingButton?.showIconLabel || "Show Checklist Icon"} className="text-brand-dark dark:text-white font-medium" />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {i18n.customThemeSettings?.sections?.floatingButton?.showIconDescription || "Display a checklist icon alongside the button text"}
                </p>
              </div>
              <Toggle
                checked={formData.show_float_button_icon || false}
                onChange={(checked) => handleInputChange('show_float_button_icon', checked)}
              />
            </div>
          </div>
        </div>

        {/* Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <Alert color="failure">
            <div className="space-y-1">
              <p className="font-medium">{i18n.customThemeSettings?.validation?.errorSummary || "Please fix the following errors:"}</p>
              <ul className="list-disc list-inside text-sm">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          </Alert>
        )}
      </div>
    </Card>
  )
}

export default CustomThemeSettings 