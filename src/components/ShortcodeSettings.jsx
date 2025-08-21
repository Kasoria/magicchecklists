import React, { useState, useEffect } from 'react'
import { Label, TextInput, Button } from 'flowbite-react'
import ReactSelect from 'react-select'

// Consistent Checkbox Component
const Checkbox = ({ id, checked, onChange, label, className = "" }) => (
  <div className={`flex items-center ${className}`}>
    <div className="relative">
      <input 
        type="checkbox" 
        id={id}
        className="sr-only" 
        checked={!!checked}
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
        {checked ? (
          <svg className="w-3 h-3 text-brand-dark absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : null}
      </label>
    </div>
    {label && <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{label}</span>}
  </div>
)

const ShortcodeSettings = ({ formData, onChange, checklistId, adminData }) => {
  const [i18n, setI18n] = useState({})

  useEffect(() => {
    let i18nData;
    
    // First try adminData prop
    if (adminData?.i18n) {
      i18nData = adminData.i18n;
    }
    // Then try window.mclAdminData
    else if (typeof window !== 'undefined' && window.mclAdminData?.i18n) {
      i18nData = window.mclAdminData.i18n;
    }
    // Finally try window.mcl_checklists
    else if (typeof window !== 'undefined' && window.mcl_checklists?.i18n) {
      i18nData = window.mcl_checklists.i18n;
    }
    
    if (i18nData?.shortcodeSettings) {
      setI18n(i18nData.shortcodeSettings);
    }
  }, [adminData])
  if (!formData.enable_shortcode) {
    return null
  }

  const handleCopyShortcode = () => {
    const shortcode = `[magic_checklist id="${checklistId}"]`
    navigator.clipboard.writeText(shortcode).then(() => {
      // You could add a toast notification here
    })
  }

  return (
    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-600 rounded-lg space-y-6">
      <h4 className="text-lg font-semibold text-brand-dark dark:text-white">{i18n.header?.title || 'Shortcode Settings'}</h4>
      
      {/* Shortcode Display */}
      {checklistId && (
        <div>
          <label className="text-brand-dark dark:text-white text-sm">{i18n.shortcode?.label || 'Shortcode'}</label>
          <div className="flex items-center space-x-2 mt-1">
            <code className="bg-brand-dark text-white px-2 py-1 rounded text-sm flex-1">
              [magic_checklist id="{checklistId}"]
            </code>
            <Button 
              size="xs"
              onClick={handleCopyShortcode}
            >
              {i18n.shortcode?.copyButton || 'Copy'}
            </Button>
          </div>
        </div>
      )}

      {/* Display Options */}
      <div>
        <h5 className="font-medium text-brand-dark dark:text-white mb-3">{i18n.displayOptions?.title || 'Display Options'}</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Checkbox
            id="shortcode_show_title"
            checked={formData.shortcode_show_title}
            onChange={(checked) => onChange('shortcode_show_title', checked)}
            label={i18n.displayOptions?.showTitle || 'Show Title'}
          />

          <Checkbox
            id="shortcode_show_description"
            checked={formData.shortcode_show_description}
            onChange={(checked) => onChange('shortcode_show_description', checked)}
            label={i18n.displayOptions?.showDescription || 'Show Description'}
          />

          <Checkbox
            id="shortcode_show_deadline"
            checked={formData.shortcode_show_deadline}
            onChange={(checked) => onChange('shortcode_show_deadline', checked)}
            label={i18n.displayOptions?.showDeadline || 'Show Deadline'}
          />

          <Checkbox
            id="shortcode_show_priority"
            checked={formData.shortcode_show_priority}
            onChange={(checked) => onChange('shortcode_show_priority', checked)}
            label={i18n.displayOptions?.showPriority || 'Show Priority Indicators'}
          />

          <Checkbox
            id="shortcode_show_numbers"
            checked={formData.shortcode_show_numbers}
            onChange={(checked) => onChange('shortcode_show_numbers', checked)}
            label={i18n.displayOptions?.showNumbers || 'Show Item Numbers'}
          />
        </div>
      </div>

      {/* Style Options - Colors */}
      <div>
        <h5 className="font-medium text-brand-dark dark:text-white mb-3">{i18n.styleColors?.title || 'Style Options - Colors'}</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="shortcode_title_text_color" className="text-brand-dark dark:text-white">{i18n.styleColors?.titleTextColor || 'Title Text Color'}</label>
            <TextInput
              id="shortcode_title_text_color"
              type="color"
              value={formData.shortcode_title_text_color || '#000000'}
              onChange={(e) => onChange('shortcode_title_text_color', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="shortcode_description_text_color" className="text-brand-dark dark:text-white">{i18n.styleColors?.descriptionTextColor || 'Description Text Color'}</label>
            <TextInput
              id="shortcode_description_text_color"
              type="color"
              value={formData.shortcode_description_text_color || '#333333'}
              onChange={(e) => onChange('shortcode_description_text_color', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="shortcode_deadline_text_color" className="text-brand-dark dark:text-white">{i18n.styleColors?.deadlineTextColor || 'Deadline Text Color'}</label>
            <TextInput
              id="shortcode_deadline_text_color"
              type="color"
              value={formData.shortcode_deadline_text_color || '#ff0000'}
              onChange={(e) => onChange('shortcode_deadline_text_color', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="shortcode_list_item_text_color" className="text-brand-dark dark:text-white">{i18n.styleColors?.listItemTextColor || 'List Item Text Color'}</label>
            <TextInput
              id="shortcode_list_item_text_color"
              type="color"
              value={formData.shortcode_list_item_text_color || '#1a1a1a'}
              onChange={(e) => onChange('shortcode_list_item_text_color', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="shortcode_bg_color" className="text-brand-dark dark:text-white">{i18n.styleColors?.backgroundColor || 'Background Color'}</label>
            <TextInput
              id="shortcode_bg_color"
              type="color"
              value={formData.shortcode_bg_color || '#ffffff'}
              onChange={(e) => onChange('shortcode_bg_color', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="shortcode_border_color" className="text-brand-dark dark:text-white">{i18n.styleColors?.borderColor || 'Border Color'}</label>
            <TextInput
              id="shortcode_border_color"
              type="color"
              value={formData.shortcode_border_color || '#e2e8f0'}
              onChange={(e) => onChange('shortcode_border_color', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="shortcode_checkbox_border_color" className="text-brand-dark dark:text-white">{i18n.styleColors?.checkboxBorderColor || 'Checkbox Border Color'}</label>
            <TextInput
              id="shortcode_checkbox_border_color"
              type="color"
              value={formData.shortcode_checkbox_border_color || '#cccccc'}
              onChange={(e) => onChange('shortcode_checkbox_border_color', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="shortcode_checkbox_color_filled" className="text-brand-dark dark:text-white">{i18n.styleColors?.checkboxColorFilled || 'Checkbox Color Filled'}</label>
            <TextInput
              id="shortcode_checkbox_color_filled"
              type="color"
              value={formData.shortcode_checkbox_color_filled || '#0ea5e9'}
              onChange={(e) => onChange('shortcode_checkbox_color_filled', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="shortcode_checkbox_color_unfilled" className="text-brand-dark dark:text-white">{i18n.styleColors?.checkboxColorUnfilled || 'Checkbox Color Unfilled'}</label>
            <TextInput
              id="shortcode_checkbox_color_unfilled"
              type="color"
              value={formData.shortcode_checkbox_color_unfilled || '#ffffff'}
              onChange={(e) => onChange('shortcode_checkbox_color_unfilled', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="shortcode_checkmark_color" className="text-brand-dark dark:text-white">{i18n.styleColors?.checkmarkColor || 'Checkmark Color'}</label>
            <TextInput
              id="shortcode_checkmark_color"
              type="color"
              value={formData.shortcode_checkmark_color || '#ffffff'}
              onChange={(e) => onChange('shortcode_checkmark_color', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Style Options - Spacing & Dimensions */}
      <div>
        <h5 className="font-medium text-brand-dark dark:text-white mb-3">{i18n.styleSpacing?.title || 'Style Options - Spacing & Dimensions'}</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="shortcode_padding_block" className="text-brand-dark dark:text-white">{i18n.styleSpacing?.verticalPadding || 'Container Vertical Padding'}</label>
            <div className="flex items-center space-x-2">
              <TextInput
                id="shortcode_padding_block"
                type="number"
                min="0"
                max="100"
                value={formData.shortcode_padding_block || '32'}
                onChange={(e) => onChange('shortcode_padding_block', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>
          </div>

          <div>
            <label htmlFor="shortcode_padding_inline" className="text-brand-dark dark:text-white">{i18n.styleSpacing?.horizontalPadding || 'Container Horizontal Padding'}</label>
            <div className="flex items-center space-x-2">
              <TextInput
                id="shortcode_padding_inline"
                type="number"
                min="0"
                max="100"
                value={formData.shortcode_padding_inline || '32'}
                onChange={(e) => onChange('shortcode_padding_inline', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>
          </div>

          <div>
            <label htmlFor="shortcode_container_gap" className="text-brand-dark dark:text-white">{i18n.styleSpacing?.containerGap || 'Container Gap'}</label>
            <div className="flex items-center space-x-2">
              <TextInput
                id="shortcode_container_gap"
                type="number"
                min="0"
                max="50"
                value={formData.shortcode_container_gap || '10'}
                onChange={(e) => onChange('shortcode_container_gap', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>
          </div>

          <div>
            <label htmlFor="shortcode_checkbox_dimensions" className="text-brand-dark dark:text-white">{i18n.styleSpacing?.checkboxDimensions || 'Checkbox Dimensions'}</label>
            <div className="flex items-center space-x-2">
              <TextInput
                id="shortcode_checkbox_dimensions"
                type="number"
                min="12"
                max="40"
                value={formData.shortcode_checkbox_dimensions || '20'}
                onChange={(e) => onChange('shortcode_checkbox_dimensions', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>
          </div>

          <div>
            <label htmlFor="shortcode_checkbox_border_radius" className="text-brand-dark dark:text-white">{i18n.styleSpacing?.checkboxBorderRadius || 'Checkbox Border Radius'}</label>
            <div className="flex items-center space-x-2">
              <TextInput
                id="shortcode_checkbox_border_radius"
                type="number"
                min="0"
                max="20"
                value={formData.shortcode_checkbox_border_radius || '4'}
                onChange={(e) => onChange('shortcode_checkbox_border_radius', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>
          </div>

          <div>
            <label htmlFor="shortcode_checkbox_border_thickness" className="text-brand-dark dark:text-white">{i18n.styleSpacing?.checkboxBorderThickness || 'Checkbox Border Thickness'}</label>
            <div className="flex items-center space-x-2">
              <TextInput
                id="shortcode_checkbox_border_thickness"
                type="number"
                min="0"
                max="5"
                value={formData.shortcode_checkbox_border_thickness || '2'}
                onChange={(e) => onChange('shortcode_checkbox_border_thickness', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>
          </div>

          <div>
            <label htmlFor="shortcode_border_type" className="text-brand-dark dark:text-white">{i18n.styleSpacing?.borderType || 'Border Type'}</label>
            <ReactSelect
              inputId="shortcode_border_type"
              value={{ value: formData.shortcode_border_type || 'none', label: 
                formData.shortcode_border_type === 'solid' ? 'Solid' :
                formData.shortcode_border_type === 'dashed' ? 'Dashed' :
                formData.shortcode_border_type === 'dotted' ? 'Dotted' :
                'None'
              }}
              onChange={(selectedOption) => onChange('shortcode_border_type', selectedOption.value)}
              options={[
                { value: 'none', label: i18n.styleSpacing?.borderTypeNone || 'None' },
                { value: 'solid', label: i18n.styleSpacing?.borderTypeSolid || 'Solid' },
                { value: 'dashed', label: i18n.styleSpacing?.borderTypeDashed || 'Dashed' },
                { value: 'dotted', label: i18n.styleSpacing?.borderTypeDotted || 'Dotted' }
              ]}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder={i18n.styleSpacing?.selectBorderType || 'Select border type...'}
            />
          </div>

          <div>
            <label htmlFor="shortcode_border_radius" className="text-brand-dark dark:text-white">{i18n.styleSpacing?.borderRadius || 'Border Radius'}</label>
            <div className="flex items-center space-x-2">
              <TextInput
                id="shortcode_border_radius"
                type="number"
                min="0"
                max="50"
                value={formData.shortcode_border_radius || '6'}
                onChange={(e) => onChange('shortcode_border_radius', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>
          </div>

          <div>
            <label htmlFor="shortcode_border_thickness" className="text-brand-dark dark:text-white">{i18n.styleSpacing?.borderThickness || 'Border Thickness'}</label>
            <div className="flex items-center space-x-2">
              <TextInput
                id="shortcode_border_thickness"
                type="number"
                min="0"
                max="10"
                value={formData.shortcode_border_thickness || '1'}
                onChange={(e) => onChange('shortcode_border_thickness', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>
          </div>

          <div>
            <label htmlFor="shortcode_item_spacing" className="text-brand-dark dark:text-white">{i18n.styleSpacing?.itemSpacing || 'Item Spacing'}</label>
            <ReactSelect
              inputId="shortcode_item_spacing"
              value={{ value: formData.shortcode_item_spacing || 'comfortable', label: 
                formData.shortcode_item_spacing === 'compact' ? 'Compact' :
                formData.shortcode_item_spacing === 'spacious' ? 'Spacious' :
                'Comfortable'
              }}
              onChange={(selectedOption) => onChange('shortcode_item_spacing', selectedOption.value)}
              options={[
                { value: 'compact', label: i18n.styleSpacing?.spacingCompact || 'Compact' },
                { value: 'comfortable', label: i18n.styleSpacing?.spacingComfortable || 'Comfortable' },
                { value: 'spacious', label: i18n.styleSpacing?.spacingSpaciuous || 'Spacious' }
              ]}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder={i18n.styleSpacing?.selectSpacing || 'Select spacing...'}
            />
          </div>
        </div>
      </div>

      {/* Style Options - Typography */}
      <div>
        <h5 className="font-medium text-brand-dark dark:text-white mb-3">{i18n.styleTypography?.title || 'Style Options - Typography'}</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="shortcode_title_font_size" className="text-brand-dark dark:text-white">{i18n.styleTypography?.titleFontSize || 'Title Font Size'}</label>
            <div className="flex items-center space-x-2">
              <TextInput
                id="shortcode_title_font_size"
                type="number"
                min="12"
                max="48"
                value={formData.shortcode_title_font_size || '18'}
                onChange={(e) => onChange('shortcode_title_font_size', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>
          </div>

          <div>
            <label htmlFor="shortcode_description_font_size" className="text-brand-dark dark:text-white">{i18n.styleTypography?.descriptionFontSize || 'Description Font Size'}</label>
            <div className="flex items-center space-x-2">
              <TextInput
                id="shortcode_description_font_size"
                type="number"
                min="10"
                max="24"
                value={formData.shortcode_description_font_size || '14'}
                onChange={(e) => onChange('shortcode_description_font_size', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>
          </div>

          <div>
            <label htmlFor="shortcode_list_item_font_size" className="text-brand-dark dark:text-white">{i18n.styleTypography?.listItemFontSize || 'List Item Font Size'}</label>
            <div className="flex items-center space-x-2">
              <TextInput
                id="shortcode_list_item_font_size"
                type="number"
                min="10"
                max="24"
                value={formData.shortcode_list_item_font_size || '16'}
                onChange={(e) => onChange('shortcode_list_item_font_size', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>
          </div>

          <div>
            <label htmlFor="shortcode_deadline_font_size" className="text-brand-dark dark:text-white">{i18n.styleTypography?.deadlineFontSize || 'Deadline Font Size'}</label>
            <div className="flex items-center space-x-2">
              <TextInput
                id="shortcode_deadline_font_size"
                type="number"
                min="10"
                max="24"
                value={formData.shortcode_deadline_font_size || '14'}
                onChange={(e) => onChange('shortcode_deadline_font_size', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">px</span>
            </div>
          </div>
        </div>
      </div>

      {/* Behavior Options */}
      <div>
        <h5 className="font-medium text-brand-dark dark:text-white mb-3">{i18n.behaviorOptions?.title || 'Behavior Options'}</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="shortcode_width" className="text-brand-dark dark:text-white">{i18n.behaviorOptions?.containerWidth || 'Container Width'}</label>
            <ReactSelect
              inputId="shortcode_width"
              value={{ value: formData.shortcode_width || 'full', label: 
                formData.shortcode_width === 'narrow' ? 'Narrow (600px)' :
                formData.shortcode_width === 'custom' ? 'Custom' :
                'Full Width'
              }}
              onChange={(selectedOption) => onChange('shortcode_width', selectedOption.value)}
              options={[
                { value: 'full', label: i18n.behaviorOptions?.widthFull || 'Full Width' },
                { value: 'narrow', label: i18n.behaviorOptions?.widthNarrow || 'Narrow (600px)' },
                { value: 'custom', label: i18n.behaviorOptions?.widthCustom || 'Custom' }
              ]}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder={i18n.behaviorOptions?.selectWidth || 'Select width...'}
            />
          </div>

          {formData.shortcode_width === 'custom' && (
            <div>
              <label htmlFor="shortcode_custom_width" className="text-brand-dark dark:text-white">{i18n.behaviorOptions?.customWidth || 'Custom Width'}</label>
              <div className="flex items-center space-x-2">
                <TextInput
                  id="shortcode_custom_width"
                  type="number"
                  min="200"
                  max="2000"
                  value={formData.shortcode_custom_width || '800'}
                  onChange={(e) => onChange('shortcode_custom_width', e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">px</span>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="shortcode_check_state" className="text-brand-dark dark:text-white">{i18n.behaviorOptions?.checkedStateStorage || 'Checked State Storage'}</label>
            <ReactSelect
              inputId="shortcode_check_state"
              value={{ value: formData.shortcode_check_state || 'session', label: 
                formData.shortcode_check_state === 'global' ? 'Global (Database)' :
                formData.shortcode_check_state === 'local' ? 'Local Storage' :
                'Session Storage'
              }}
              onChange={(selectedOption) => onChange('shortcode_check_state', selectedOption.value)}
              options={[
                { value: 'session', label: i18n.behaviorOptions?.storageSession || 'Session Storage' },
                { value: 'local', label: i18n.behaviorOptions?.storageLocal || 'Local Storage' },
                { value: 'global', label: i18n.behaviorOptions?.storageGlobal || 'Global (Database)' }
              ]}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder={i18n.behaviorOptions?.selectStorageType || 'Select storage type...'}
            />
          </div>

          <Checkbox
            id="shortcode_disable_drawer"
            checked={formData.shortcode_disable_drawer}
            onChange={(checked) => onChange('shortcode_disable_drawer', checked)}
            label={i18n.behaviorOptions?.disableDrawer || 'Disable Drawer for this Checklist'}
          />

          <Checkbox
            id="shortcode_enable_reorder"
            checked={formData.shortcode_enable_reorder}
            onChange={(checked) => onChange('shortcode_enable_reorder', checked)}
            label={i18n.behaviorOptions?.allowReordering || 'Allow Item Reordering'}
          />
        </div>
      </div>
    </div>
  )
}

export default ShortcodeSettings 