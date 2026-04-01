import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Card, Button, Label, TextInput, Textarea, Alert, Select } from 'flowbite-react'
import { useToast } from './Toast'

// Consistent Checkbox Component
const Checkbox = ({ id, checked, onChange, label, className = "", disabled = false }) => (
  <div className={`flex items-center ${className}`}>
    <div className="relative">
      <input 
        type="checkbox" 
        id={id}
        className="sr-only" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <label 
        htmlFor={id}
        className={`cursor-pointer block w-4 h-4 border-2 rounded transition-all duration-200 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
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

// Toggle Switch Component
const ToggleSwitch = ({ id, checked, onChange, disabled = false, size = 'normal' }) => {
  // Inline-flex peer-based toggle
  const dimensionClasses = size === 'small'
    ? { track: 'w-8 h-5', dot: 'after:h-4 after:w-4 after:top-[1px] after:start-[1px]', translate: 'peer-checked:after:translate-x-[18px]' }
    : { track: 'w-11 h-6', dot: 'after:h-5 after:w-5 after:top-[2px] after:start-[2px]', translate: 'peer-checked:after:translate-x-full' }

  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <input
        id={id}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div
        className={`relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent dark:peer-checked:bg-brand-accent`}
      />
    </label>
  )
}

// Meta Field Selector Component
const MetaFieldSelector = ({ value, onChange, postTypes, adminData }) => {
  const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.magicclAdminData?.i18n) || {};
  const [isOpen, setIsOpen] = useState(false)
  const [metaFields, setMetaFields] = useState({})
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (postTypes.length > 0) {
      fetchMetaFields()
    }
  }, [postTypes])
  
  const fetchMetaFields = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('action', 'magiccl_get_meta_fields')
      formData.append('nonce', adminData.nonces?.magiccl_admin || '')
      
      postTypes.forEach(postType => {
        formData.append('post_types[]', postType)
      })
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (data.success) {
        setMetaFields(data.data)
      }
    } catch (error) {
      console.error('Error fetching meta fields:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleInputChange = (newValue) => {
    onChange(newValue)
    if (newValue.length > 0) {
      setIsOpen(true)
    }
  }
  
  const filteredOptions = Object.entries(metaFields).filter(([key, label]) => 
    key.toLowerCase().includes(value.toLowerCase()) || 
    label.toLowerCase().includes(value.toLowerCase())
  )
  
  return (
    <div className="relative">
      <div className="relative">
        <TextInput
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={i18n.editPublisherChecklist?.metaFieldSelector?.placeholder || "Type or select a custom field..."}
          className="pr-16"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-500 hover:text-gray-700"
          >
            ▼
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {loading ? (
            <div className="p-2 text-center text-gray-500">{i18n.editPublisherChecklist?.metaFieldSelector?.loading || "Loading..."}</div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onChange(key)
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
              >
                {label}
              </button>
            ))
          ) : (
            <div className="p-2 text-center text-gray-500">{i18n.editPublisherChecklist?.metaFieldSelector?.noFields || "No fields found"}</div>
          )}
        </div>
      )}
      
      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

// Requirement Instance Component
const RequirementInstance = ({ 
  requirement, 
  instance, 
  onUpdate, 
  onRemove, 
  isRepeatable,
  postTypes,
  adminData,
  requirementDefinitions
}) => {
  const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.magicclAdminData?.i18n) || {};
  const reqDef = requirementDefinitions[requirement.type]
  
  const updateInstance = (field, value) => {
    onUpdate(instance.id, field, value)
  }
  
  const updateConfig = (configKey, value) => {
    const newConfig = { ...instance.config, [configKey]: value }
    updateInstance('config', newConfig)
  }
  
  const getDisplayLabel = () => {
    if (requirement.type === 'custom_field' && instance.config.field_label) {
      return instance.config.field_label
    }
    if (requirement.type === 'custom_item' && instance.config.item_title) {
      return instance.config.item_title
    }
    return reqDef.label
  }
  
  return (
    <div className="!mt-0 border border-gray-500 rounded-lg p-3 bg-brand-light dark:bg-gray-800 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <ToggleSwitch
            id={`requirement_${requirement.type}_${instance.id}`}
            checked={instance.enabled}
            onChange={(checked) => updateInstance('enabled', checked)}
          />
          <label 
            htmlFor={`requirement_${requirement.type}_${instance.id}`}
            className="font-medium text-gray-900 text-sm dark:text-gray-100"
          >
            {getDisplayLabel()}
          </label>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`required_${requirement.type}_${instance.id}`}
              checked={instance.required}
              onChange={(checked) => updateInstance('required', checked)}
              label=""
            />
            <span className="text-xs font-medium text-brand-dark dark:text-gray-100">
{i18n.editPublisherChecklist?.fields?.required || "Required"}
            </span>
          </div>
          
          {isRepeatable && (
            <button
              type="button"
              onClick={() => onRemove(instance.id)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Configuration Fields */}
      {instance.enabled && reqDef.config_fields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {Object.entries(reqDef.config_fields).map(([fieldName, fieldDef]) => {
            // Hide custom_tip field if use_custom_tip is not enabled
            if (fieldName === 'custom_tip' && !instance.config.use_custom_tip) {
              return null
            }
            
            return (
            <div key={fieldName} className={fieldName === 'custom_tip' ? 'md:col-span-2' : ''}>
              <Label className="mb-1 text-sm">{fieldDef.label}</Label>
              {fieldDef.type === 'number' ? (
                <TextInput
                  type="number"
                  value={instance.config[fieldName] || fieldDef.default || ''}
                  onChange={(e) => updateConfig(fieldName, e.target.value)}
                  min={fieldDef.min}
                  max={fieldDef.max}
                  className="w-full"
                />
              ) : fieldDef.type === 'text' ? (
                                  <TextInput
                    value={instance.config[fieldName] || fieldDef.default || ''}
                    onChange={(e) => updateConfig(fieldName, e.target.value)}
                    placeholder={fieldDef.placeholder}
                    className="w-full"
                  />
                ) : fieldDef.type === 'checkbox' ? (
                  <Checkbox
                    id={`${requirement.type}_${instance.id}_${fieldName}`}
                    checked={instance.config[fieldName] === true || instance.config[fieldName] === '1'}
                    onChange={(checked) => updateConfig(fieldName, checked)}
                    label=""
                    className="mt-1"
                  />
              ) : fieldDef.type === 'select' && requirement.type === 'custom_field' && fieldName === 'field_name' ? (
                <MetaFieldSelector
                  value={instance.config[fieldName] || ''}
                  onChange={(value) => updateConfig(fieldName, value)}
                  postTypes={postTypes}
                  adminData={adminData}
                />
              ) : (
                <Select
                  value={instance.config[fieldName] || ''}
                  onChange={(e) => updateConfig(fieldName, e.target.value)}
                >
                  <option value="">{fieldDef.placeholder || 'Select...'}</option>
                                      {fieldDef.options && Object.entries(fieldDef.options).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </Select>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      {/* Status */}
      {instance.enabled && (
        <div className="text-sm text-gray-600 flex items-center gap-2 dark:text-gray-300">
          {reqDef.auto_check ? (
            <>
              <span className="text-green-600">✓</span>
{i18n.editPublisherChecklist?.fields?.automaticallyVerified || "Automatically verified"}
            </>
          ) : (
            <>
              <span className="text-yellow-600">👤</span>
{i18n.editPublisherChecklist?.fields?.manualVerificationRequired || "Manual verification required"}
            </>
          )}
        </div>
      )}
    </div>
  )
}

const EditPublisherChecklist = forwardRef(({ 
  adminData, 
  checklistId = null, 
  onSaved, 
  onBackToChecklists,
  onBackToTypeSelector,
  onSetFormRef 
}, ref) => {
  // Get i18n data
  const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.magicclAdminData?.i18n) || {};
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    post_types: [],
    active: false,
    show_tips: false
  })
  
  const [requirements, setRequirements] = useState({})
  const [requirementDefinitions, setRequirementDefinitions] = useState({})
  const [postTypeOptions, setPostTypeOptions] = useState([])
  const [loading, setLoading] = useState(!!checklistId)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Use the global toast system
  const { showSuccess, showError } = useToast()
  
  useEffect(() => {
    loadPostTypes()
    loadRequirementDefinitions()
    
    if (checklistId) {
      loadChecklist()
    }
  }, [checklistId])
  
  const loadPostTypes = async () => {
    try {
      const formData = new FormData()
      formData.append('action', 'magiccl_get_post_types')
      formData.append('nonce', adminData.nonces?.magiccl_admin || '')
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (data.success) {
        setPostTypeOptions(data.data)
      } else {
        console.error('Error loading post types:', data.data)
        // Fallback to basic post types if AJAX fails
        setPostTypeOptions([
          { key: 'post', label: i18n.editPublisherChecklist?.postTypes?.posts || 'Posts' },
          { key: 'page', label: i18n.editPublisherChecklist?.postTypes?.pages || 'Pages' }
        ])
      }
    } catch (error) {
      console.error('Error loading post types:', error)
      // Fallback to basic post types if AJAX fails
      setPostTypeOptions([
        { key: 'post', label: i18n.editPublisherChecklist?.postTypes?.posts || 'Posts' },
        { key: 'page', label: i18n.editPublisherChecklist?.postTypes?.pages || 'Pages' }
      ])
    }
  }
  
  const loadRequirementDefinitions = async () => {
    try {
      const formData = new FormData()
      formData.append('action', 'magiccl_get_requirement_definitions')
      formData.append('nonce', adminData.nonces?.magiccl_admin || '')
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (data.success) {
        setRequirementDefinitions(data.data)
      } else {
        // Fallback default definitions
        setRequirementDefinitions({
          word_count: {
            label: i18n.editPublisherChecklist?.requirements?.wordCount?.label || 'Word Count',
            description: i18n.editPublisherChecklist?.requirements?.wordCount?.description || 'Ensure content meets minimum word count requirements',
            auto_check: true,
            repeatable: false,
            config_fields: {
              min_words: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.minimumWords || 'Minimum Words',
                default: 300,
                min: 1
              },
              use_custom_tip: {
                type: 'checkbox',
                label: i18n.editPublisherChecklist?.fields?.useCustomTip || 'Use custom tip',
                default: false
              },
              custom_tip: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.customTip || 'Custom helpful tip',
                default: '',
                placeholder: i18n.editPublisherChecklist?.placeholders?.customTip || 'Enter your custom tip for this requirement...'
              }
            }
          },
          featured_image: {
            label: i18n.editPublisherChecklist?.requirements?.featuredImage?.label || 'Featured Image',
            description: i18n.editPublisherChecklist?.requirements?.featuredImage?.description || 'Require a featured image to be set',
            auto_check: true,
            repeatable: false,
            config_fields: {
              use_custom_tip: {
                type: 'checkbox',
                label: i18n.editPublisherChecklist?.fields?.useCustomTip || 'Use custom tip',
                default: false
              },
              custom_tip: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.customTip || 'Custom helpful tip',
                default: '',
                placeholder: i18n.editPublisherChecklist?.placeholders?.customTip || 'Enter your custom tip for this requirement...'
              }
            }
          },
          excerpt: {
            label: i18n.editPublisherChecklist?.requirements?.excerpt?.label || 'Excerpt',
            description: i18n.editPublisherChecklist?.requirements?.excerpt?.description || 'Ensure post has an excerpt within character limits',
            auto_check: true,
            repeatable: false,
            config_fields: {
              min_excerpt_length: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.minimumLength || 'Minimum Length',
                default: 50,
                min: 1
              },
              max_excerpt_length: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.maximumLength || 'Maximum Length',
                default: 300,
                min: 1
              },
              use_custom_tip: {
                type: 'checkbox',
                label: i18n.editPublisherChecklist?.fields?.useCustomTip || 'Use custom tip',
                default: false
              },
              custom_tip: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.customTip || 'Custom helpful tip',
                default: '',
                placeholder: i18n.editPublisherChecklist?.placeholders?.customTip || 'Enter your custom tip for this requirement...'
              }
            }
          },
          categories: {
            label: i18n.editPublisherChecklist?.requirements?.categories?.label || 'Categories',
            description: i18n.editPublisherChecklist?.requirements?.categories?.description || 'Require minimum number of categories',
            auto_check: true,
            repeatable: false,
            config_fields: {
              min_categories: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.minimumCategories || 'Minimum Categories',
                default: 1,
                min: 1
              },
              use_custom_tip: {
                type: 'checkbox',
                label: i18n.editPublisherChecklist?.fields?.useCustomTip || 'Use custom tip',
                default: false
              },
              custom_tip: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.customTip || 'Custom helpful tip',
                default: '',
                placeholder: i18n.editPublisherChecklist?.placeholders?.customTip || 'Enter your custom tip for this requirement...'
              }
            }
          },
          tags: {
            label: i18n.editPublisherChecklist?.requirements?.tags?.label || 'Tags',
            description: i18n.editPublisherChecklist?.requirements?.tags?.description || 'Require minimum number of tags',
            auto_check: true,
            repeatable: false,
            config_fields: {
              min_tags: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.minimumTags || 'Minimum Tags',
                default: 1,
                min: 1
              },
              use_custom_tip: {
                type: 'checkbox',
                label: i18n.editPublisherChecklist?.fields?.useCustomTip || 'Use custom tip',
                default: false
              },
              custom_tip: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.customTip || 'Custom helpful tip',
                default: '',
                placeholder: i18n.editPublisherChecklist?.placeholders?.customTip || 'Enter your custom tip for this requirement...'
              }
            }
          },
          custom_field: {
            label: i18n.editPublisherChecklist?.requirements?.customField?.label || 'Custom Field',
            description: i18n.editPublisherChecklist?.requirements?.customField?.description || 'Require specific custom fields to be filled',
            auto_check: true,
            repeatable: true,
            config_fields: {
              field_name: {
                type: 'select',
                label: i18n.editPublisherChecklist?.fields?.fieldName || 'Field Name',
                placeholder: i18n.editPublisherChecklist?.placeholders?.selectField || 'Select a custom field...'
              },
              field_label: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.displayLabel || 'Display Label',
                placeholder: i18n.editPublisherChecklist?.placeholders?.fieldLabel || 'Label for this field...'
              }
            }
          },
          heading_count: {
            label: i18n.editPublisherChecklist?.requirements?.headingCount?.label || 'Heading Count',
            description: i18n.editPublisherChecklist?.requirements?.headingCount?.description || 'Content must have specific heading counts (H2, H3, H4)',
            auto_check: true,
            repeatable: false,
            config_fields: {
              min_h2_headings: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.minimumH2 || 'Minimum H2 headings',
                default: 2,
                min: 0
              },
              min_h3_headings: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.minimumH3 || 'Minimum H3 headings',
                default: 1,
                min: 0
              },
              min_h4_headings: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.minimumH4 || 'Minimum H4 headings',
                default: 0,
                min: 0
              }
            }
          },
          external_links: {
            label: i18n.editPublisherChecklist?.requirements?.externalLinks?.label || 'External Links',
            description: i18n.editPublisherChecklist?.requirements?.externalLinks?.description || 'Content must have at least [X] external links',
            auto_check: true,
            repeatable: false,
            config_fields: {
              min_external_links: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.minimumExternalLinks || 'Minimum external links',
                default: 1,
                min: 0
              },
              use_custom_tip: {
                type: 'checkbox',
                label: i18n.editPublisherChecklist?.fields?.useCustomTip || 'Use custom tip',
                default: false
              },
              custom_tip: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.customTip || 'Custom helpful tip',
                default: '',
                placeholder: i18n.editPublisherChecklist?.placeholders?.customTip || 'Enter your custom tip for this requirement...'
              }
            }
          },
          internal_links: {
            label: i18n.editPublisherChecklist?.requirements?.internalLinks?.label || 'Internal Links',
            description: i18n.editPublisherChecklist?.requirements?.internalLinks?.description || 'Content must have at least [X] internal links',
            auto_check: true,
            repeatable: false,
            config_fields: {
              min_internal_links: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.minimumInternalLinks || 'Minimum internal links',
                default: 2,
                min: 0
              },
              use_custom_tip: {
                type: 'checkbox',
                label: i18n.editPublisherChecklist?.fields?.useCustomTip || 'Use custom tip',
                default: false
              },
              custom_tip: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.customTip || 'Custom helpful tip',
                default: '',
                placeholder: i18n.editPublisherChecklist?.placeholders?.customTip || 'Enter your custom tip for this requirement...'
              }
            }
          },
          title_length: {
            label: i18n.editPublisherChecklist?.requirements?.titleLength?.label || 'Title Length',
            description: i18n.editPublisherChecklist?.requirements?.titleLength?.description || 'Title must be between [X] and [Y] characters',
            auto_check: true,
            repeatable: false,
            config_fields: {
              min_title_length: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.minimumTitleLength || 'Minimum title length',
                default: 10,
                min: 1
              },
              max_title_length: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.maximumTitleLength || 'Maximum title length',
                default: 60,
                min: 1
              },
              use_custom_tip: {
                type: 'checkbox',
                label: i18n.editPublisherChecklist?.fields?.useCustomTip || 'Use custom tip',
                default: false
              },
              custom_tip: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.customTip || 'Custom helpful tip',
                default: '',
                placeholder: i18n.editPublisherChecklist?.placeholders?.customTip || 'Enter your custom tip for this requirement...'
              }
            }
          },
          meta_description: {
            label: i18n.editPublisherChecklist?.requirements?.metaDescription?.label || 'Meta Description',
            description: i18n.editPublisherChecklist?.requirements?.metaDescription?.description || 'Meta description must be between [X] and [Y] characters',
            auto_check: true,
            repeatable: false,
            config_fields: {
              min_meta_description_length: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.minimumMetaDescriptionLength || 'Minimum meta description length',
                default: 120,
                min: 1
              },
              max_meta_description_length: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.maximumMetaDescriptionLength || 'Maximum meta description length',
                default: 160,
                min: 1
              },
              use_custom_tip: {
                type: 'checkbox',
                label: i18n.editPublisherChecklist?.fields?.useCustomTip || 'Use custom tip',
                default: false
              },
              custom_tip: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.customTip || 'Custom helpful tip',
                default: '',
                placeholder: i18n.editPublisherChecklist?.placeholders?.customTip || 'Enter your custom tip for this requirement...'
              }
            }
          },
          meta_title: {
            label: i18n.editPublisherChecklist?.requirements?.metaTitle?.label || 'Meta Title',
            description: i18n.editPublisherChecklist?.requirements?.metaTitle?.description || 'Meta title must be between [X] and [Y] characters',
            auto_check: true,
            repeatable: false,
            config_fields: {
              min_meta_title_length: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.minimumMetaTitleLength || 'Minimum meta title length',
                default: 30,
                min: 1
              },
              max_meta_title_length: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.maximumMetaTitleLength || 'Maximum meta title length',
                default: 60,
                min: 1
              },
              use_custom_tip: {
                type: 'checkbox',
                label: i18n.editPublisherChecklist?.fields?.useCustomTip || 'Use custom tip',
                default: false
              },
              custom_tip: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.customTip || 'Custom helpful tip',
                default: '',
                placeholder: i18n.editPublisherChecklist?.placeholders?.customTip || 'Enter your custom tip for this requirement...'
              }
            }
          },
          image_alt_text: {
            label: i18n.editPublisherChecklist?.requirements?.imageAltText?.label || 'Image Alt Text',
            description: i18n.editPublisherChecklist?.requirements?.imageAltText?.description || 'All images must have alt text for accessibility',
            auto_check: true,
            repeatable: false,
            config_fields: {
              use_custom_tip: {
                type: 'checkbox',
                label: i18n.editPublisherChecklist?.fields?.useCustomTip || 'Use custom tip',
                default: false
              },
              custom_tip: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.customTip || 'Custom helpful tip',
                default: '',
                placeholder: i18n.editPublisherChecklist?.placeholders?.customTip || 'Enter your custom tip for this requirement...'
              }
            }
          },
          image_count: {
            label: i18n.editPublisherChecklist?.requirements?.imageCount?.label || 'Image Count',
            description: i18n.editPublisherChecklist?.requirements?.imageCount?.description || 'Content must have at least [X] images',
            auto_check: true,
            repeatable: false,
            config_fields: {
              min_images: {
                type: 'number',
                label: i18n.editPublisherChecklist?.fields?.minimumImages || 'Minimum images',
                default: 1,
                min: 0
              },
              use_custom_tip: {
                type: 'checkbox',
                label: i18n.editPublisherChecklist?.fields?.useCustomTip || 'Use custom tip',
                default: false
              },
              custom_tip: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.customTip || 'Custom helpful tip',
                default: '',
                placeholder: i18n.editPublisherChecklist?.placeholders?.customTip || 'Enter your custom tip for this requirement...'
              }
            }
          },
          custom_item: {
            label: i18n.editPublisherChecklist?.requirements?.customItem?.label || 'Custom Item',
            description: i18n.editPublisherChecklist?.requirements?.customItem?.description || 'Manual verification required',
            auto_check: false,
            repeatable: true,
            config_fields: {
              item_title: {
                type: 'text',
                label: i18n.editPublisherChecklist?.fields?.itemTitle || 'Item Title',
                placeholder: 'Enter the checklist item...'
              }
            }
          }
        })
      }
    } catch (error) {
      console.error('Error loading requirement definitions:', error)
    }
  }
  
  const loadChecklist = async () => {
    try {
      const formData = new FormData()
      formData.append('action', 'magiccl_get_checklist_for_edit')
      formData.append('checklist_id', checklistId)
      formData.append('nonce', adminData.nonces?.magiccl_admin || '')
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (data.success && data.data) {
        setFormData({
          title: data.data.title || '',
          description: data.data.description || '',
          post_types: data.data.post_types || [],
          active: data.data.active || false,
          show_tips: data.data.show_tips || false
        })
        
        // Process requirements
        if (data.data.requirements) {
          const processedRequirements = {}
          data.data.requirements.forEach(req => {
            if (!processedRequirements[req.type]) {
              processedRequirements[req.type] = []
            }
            processedRequirements[req.type].push({
              id: req.instance_id || `${req.type}_${Date.now()}`,
              enabled: true,
              required: req.required,
              config: req.config || {}
            })
          })
          setRequirements(processedRequirements)
        }
      }
    } catch (error) {
      console.error('Error loading checklist:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const addRequirementInstance = (type) => {
    const newInstance = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      enabled: true,
      required: true,
      config: {}
    }
    
    setRequirements(prev => ({
      ...prev,
      [type]: [...(prev[type] || []), newInstance]
    }))
  }
  
  const removeRequirementInstance = (type, instanceId) => {
    setRequirements(prev => ({
      ...prev,
      [type]: prev[type]?.filter(instance => instance.id !== instanceId) || []
    }))
  }
  
  const updateRequirementInstance = (type, instanceId, field, value) => {
    setRequirements(prev => {
      const currentInstances = prev[type] || []
      
      // For non-repeatable requirements, always ensure there's an instance
      if (currentInstances.length === 0 && !requirementDefinitions[type]?.repeatable) {
        return {
          ...prev,
          [type]: [{
            id: instanceId,
            enabled: field === 'enabled' ? value : false,
            required: field === 'required' ? value : true,
            config: field === 'config' ? value : {}
          }]
        }
      }
      
      // Update existing instance
      return {
        ...prev,
        [type]: currentInstances.map(instance => 
          instance.id === instanceId 
            ? { ...instance, [field]: value }
            : instance
        )
      }
    })
  }
  
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = i18n.editPublisherChecklist?.validation?.titleRequired || 'Checklist name is required'
    }
    
    if (formData.post_types.length === 0) {
      newErrors.post_types = i18n.editPublisherChecklist?.validation?.postTypeRequired || 'At least one post type must be selected'
    }
    
    // Check if at least one requirement is enabled
    const hasEnabledRequirements = Object.values(requirements).some(instances =>
      instances.some(instance => instance.enabled)
    )
    
    if (!hasEnabledRequirements) {
      newErrors.requirements = i18n.editPublisherChecklist?.validation?.requirementRequired || 'At least one requirement must be enabled'
    }
    
    // Validate custom field requirements
    Object.entries(requirements).forEach(([type, instances]) => {
      instances.forEach((instance, index) => {
        if (instance.enabled) {
          if (type === 'custom_field' && !instance.config.field_name) {
            newErrors[`${type}_${instance.id}_field_name`] = i18n.editPublisherChecklist?.validation?.fieldNameRequired || 'Field name is required'
          }
          if (type === 'custom_item' && !instance.config.item_title) {
            newErrors[`${type}_${instance.id}_item_title`] = i18n.editPublisherChecklist?.validation?.itemTitleRequired || 'Item title is required'
          }
        }
      })
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSave = async () => {
    if (!validateForm()) {
      return
    }
    
    setSaving(true)
    
    try {
      const submitData = new FormData()
      submitData.append('action', 'save_publisher_checklist')
      submitData.append('magiccl_nonce', adminData.nonces?.magiccl_admin || '')
      
      if (checklistId) {
        submitData.append('checklist_id', checklistId)
      }
      
      submitData.append('checklist_type', 'publisher')
      submitData.append('title', formData.title)
      submitData.append('description', formData.description)
      submitData.append('active', formData.active ? '1' : '0')
      submitData.append('show_tips', formData.show_tips ? '1' : '0')
      
      // Add post types
      formData.post_types.forEach(postType => {
        submitData.append('post_types[]', postType)
      })
      
      // Add requirements
      Object.entries(requirements).forEach(([type, instances]) => {
        instances.forEach(instance => {
          if (instance.enabled) {
            const prefix = `requirements[${type}][${instance.id}]`
            submitData.append(`${prefix}[enabled]`, '1')
            submitData.append(`${prefix}[required]`, instance.required ? '1' : '0')
            submitData.append(`${prefix}[instance_id]`, instance.id)
            
            Object.entries(instance.config).forEach(([key, value]) => {
              submitData.append(`${prefix}[config][${key}]`, value)
            })
          }
        })
      })
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: submitData
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Show success toast and handle callbacks
        showSuccess(i18n.editPublisherChecklist?.messages?.savedSuccessfully || 'Publisher checklist saved successfully!', {
          onClose: () => {
            const newId = data.data?.checklist_id || checklistId
            if (onSaved) onSaved(newId)
            else if (onBackToChecklists) onBackToChecklists()
          }
        })
      } else {
        throw new Error(data.data || i18n.editPublisherChecklist?.messages?.saveFailed || 'Failed to save checklist')
      }
    } catch (error) {
      console.error('Error saving checklist:', error)
      showError(error.message || i18n.editPublisherChecklist?.messages?.saveError || 'Failed to save checklist. Please try again.')
      setErrors({ save: error.message || 'Failed to save checklist. Please try again.' })
    } finally {
      setSaving(false)
    }
  }
  
  // Expose save function to parent component
  useImperativeHandle(ref, () => ({
    save: handleSave
  }))

  // Register this component with the parent when it mounts
  useEffect(() => {
    if (onSetFormRef && ref) {
      onSetFormRef(ref)
    }
    
    // Cleanup on unmount
    return () => {
      if (onSetFormRef) {
        onSetFormRef(null)
      }
    }
  }, [onSetFormRef, ref])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{i18n.editPublisherChecklist?.loading?.checklist || "Loading checklist..."}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Error Alert */}
      {errors.save && (
        <Alert color="failure">
          {errors.save}
        </Alert>
      )}
      
      {/* Basic Settings */}
      <Card>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white">{i18n.editPublisherChecklist?.sections?.basicSettings || "Basic Settings"}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="title" value={i18n.editPublisherChecklist?.labels?.checklistName || "Checklist Name"} className="mb-2" />
              <TextInput
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={i18n.editPublisherChecklist?.placeholders?.checklistName || "e.g., Content Quality Standards"}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
              <p className="text-gray-500 text-sm mt-1 dark:text-gray-300">
                {i18n.editPublisherChecklist?.descriptions?.checklistName || "This name will be shown in the Gutenberg sidebar when editing posts/pages."}
              </p>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="description" value={i18n.editPublisherChecklist?.labels?.description || "Description"} className="mb-2" />
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={i18n.editPublisherChecklist?.placeholders?.description || "Describe the purpose of this checklist..."}
                rows={3}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label value={i18n.editPublisherChecklist?.labels?.applyToPostTypes || "Apply to Post Types"} className="mb-2" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {postTypeOptions.map(postType => (
                  <Checkbox
                    key={postType.key}
                    id={`post_type_${postType.key}`}
                    checked={formData.post_types.includes(postType.key)}
                    onChange={(checked) => {
                      setFormData(prev => ({
                        ...prev,
                        post_types: checked 
                          ? [...prev.post_types, postType.key]
                          : prev.post_types.filter(type => type !== postType.key)
                      }))
                    }}
                    label={postType.label}
                  />
                ))}
              </div>
              {errors.post_types && (
                <p className="text-red-500 text-sm mt-1">{errors.post_types}</p>
              )}
              <p className="text-gray-500 text-sm mt-1 dark:text-gray-300">
                Select which post types this checklist should apply to.
              </p>
            </div>
            
            <div>
              <Label value={i18n.editPublisherChecklist?.labels?.activeStatus || "Active Status"} className="mb-2" />
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  id="active"
                  checked={formData.active}
                  onChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {i18n.editPublisherChecklist?.descriptions?.activeStatus || "When active, this checklist will be shown in the Gutenberg editor for the selected post types."}
                </span>
              </div>
            </div>
            
            <div>
              <Label value={i18n.editPublisherChecklist?.labels?.showHelpfulTips || "Show Helpful Tips"} className="mb-2" />
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  id="show_tips"
                  checked={formData.show_tips}
                  onChange={(checked) => setFormData(prev => ({ ...prev, show_tips: checked }))}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {i18n.editPublisherChecklist?.descriptions?.tips || "When enabled, the Gutenberg sidebar will show helpful tips for failed requirements to guide content creators."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Requirements */}
      <Card>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white">{i18n.editPublisherChecklist?.sections?.contentRequirements || "Content Requirements"}</h2>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300">
            {i18n.editPublisherChecklist?.descriptions?.contentRequirements || "Configure automatic checks that will verify content quality. Required items will prevent publishing until satisfied."}
          </p>
          
          {errors.requirements && (
            <Alert color="failure">
              {errors.requirements}
            </Alert>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
            {Object.entries(requirementDefinitions).map(([type, reqDef]) => {
              const instances = requirements[type] || []
              const isRepeatable = reqDef.repeatable
              
              return (
                <div key={type} className={`space-y-4 ${isRepeatable ? 'col-span-full' : ''} flex flex-col`}>
                  {/* Group Header */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-brand-dark dark:text-white">
                        {reqDef.label}
                        {isRepeatable && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
{i18n.editPublisherChecklist?.fields?.repeatable || "Repeatable"}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {reqDef.description}
                      </p>
                    </div>
                    
                    {isRepeatable && (
                      <Button
                        size="sm"
                        onClick={() => addRequirementInstance(type)}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
{type === 'custom_field' 
  ? (i18n.editPublisherChecklist?.buttons?.addCustomField || 'Add Custom Field')
  : type === 'custom_item'
  ? (i18n.editPublisherChecklist?.buttons?.addCustomItem || 'Add Custom Item') 
  : `Add ${reqDef.label}`}
                      </Button>
                    )}
                  </div>
                  
                  {/* Instances */}
                  <div className={`space-y-3 flex-1 ${
                    isRepeatable 
                      ? 'bg-gray-50 dark:bg-gray-800 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 items-stretch' 
                      : ''
                  }`}>
                    {instances.length > 0 ? (
                      instances.map(instance => (
                        <RequirementInstance
                          key={instance.id}
                          requirement={{ type }}
                          instance={instance}
                          onUpdate={(instanceId, field, value) => updateRequirementInstance(type, instanceId, field, value)}
                          onRemove={(instanceId) => removeRequirementInstance(type, instanceId)}
                          isRepeatable={isRepeatable}
                          postTypes={formData.post_types}
                          adminData={adminData}
                          requirementDefinitions={requirementDefinitions}
                        />
                      ))
                    ) : !isRepeatable ? (
                      // Single instance for non-repeatable items
                      <RequirementInstance
                        requirement={{ type }}
                        instance={{
                          id: type,
                          enabled: false,
                          required: true,
                          config: {}
                        }}
                        onUpdate={(instanceId, field, value) => updateRequirementInstance(type, instanceId, field, value)}
                        onRemove={() => {}}
                        isRepeatable={false}
                        postTypes={formData.post_types}
                        adminData={adminData}
                        requirementDefinitions={requirementDefinitions}
                      />
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
      
      {/* Footer Actions */}
      <div className="text-center">
        <Button
          color="blue"
          size="lg"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
{i18n.editPublisherChecklist?.buttons?.saving || "Saving..."}
            </>
          ) : (
            <>
{checklistId ? (i18n.editPublisherChecklist?.buttons?.update || 'Update Publisher Checklist') : (i18n.editPublisherChecklist?.buttons?.create || 'Create Publisher Checklist')}
            </>
          )}
        </Button>
      </div>
    </div>
  )
})

export default EditPublisherChecklist 