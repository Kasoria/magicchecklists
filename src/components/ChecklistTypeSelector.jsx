import React from 'react'
import { Card, Button } from 'flowbite-react'

const ChecklistTypeSelector = ({ adminData, onSelectType }) => {
  // Get i18n data
  const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.magicclAdminData?.i18n) || {};
  const checklistTypes = [
    {
      id: 'classic',
      title: i18n.checklistTypeSelector?.classic?.title || 'Classic Checklist',
      description: i18n.checklistTypeSelector?.classic?.description || 'Traditional checklists with custom items, keyboard shortcuts, and floating buttons. Perfect for personal task management and team collaboration.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12">
          <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      ),
      features: [
        i18n.checklistTypeSelector?.classic?.features?.customItems || 'Custom checklist items',
        i18n.checklistTypeSelector?.classic?.features?.keyboardShortcuts || 'Keyboard shortcuts',
        i18n.checklistTypeSelector?.classic?.features?.floatingButtons || 'Floating buttons',
        i18n.checklistTypeSelector?.classic?.features?.accessControl || 'Access control',
        i18n.checklistTypeSelector?.classic?.features?.themes || 'Themes and customization',
        i18n.checklistTypeSelector?.classic?.features?.shortcode || 'Shortcode support'
      ],
      url: `${adminData.pluginUrl?.replace('/wp-content/plugins/magicchecklists/', '') || ''}admin.php?page=magiccl_checklists&view=add-new&type=classic`,
      buttonText: i18n.checklistTypeSelector?.classic?.buttonText || 'Create Classic Checklist'
    },
    {
      id: 'publisher',
      title: i18n.checklistTypeSelector?.publisher?.title || 'Publisher Checklist',
      description: i18n.checklistTypeSelector?.publisher?.description || 'Content publishing requirements with automatic verification. Ensure posts and pages meet quality standards before publication.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      features: [
        i18n.checklistTypeSelector?.publisher?.features?.automaticChecking || 'Automatic requirement checking',
        i18n.checklistTypeSelector?.publisher?.features?.wordCount || 'Word count validation',
        i18n.checklistTypeSelector?.publisher?.features?.seoRequirements || 'SEO requirements',
        i18n.checklistTypeSelector?.publisher?.features?.featuredImage || 'Featured image verification',
        i18n.checklistTypeSelector?.publisher?.features?.linksAndTaxonomy || 'Link and taxonomy checks',
        i18n.checklistTypeSelector?.publisher?.features?.publishingPrevention || 'Publishing prevention'
      ],
      url: `${adminData.pluginUrl?.replace('/wp-content/plugins/magicchecklists/', '') || ''}admin.php?page=magiccl_checklists&view=add-new&type=publisher`,
      buttonText: i18n.checklistTypeSelector?.publisher?.buttonText || 'Create Publisher Checklist'
    },
    {
      id: 'tour',
      title: i18n.checklistTypeSelector?.tour?.title || 'Tour',
      description: i18n.checklistTypeSelector?.tour?.description || 'Guided tours that lead users through your WordPress admin or frontend. Perfect for onboarding, training, and feature introduction.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12">
          <path fill="currentColor" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
      features: [
        i18n.checklistTypeSelector?.tour?.features?.stepByStep || 'Step-by-step guidance',
        i18n.checklistTypeSelector?.tour?.features?.interactive || 'Interactive elements',
        i18n.checklistTypeSelector?.tour?.features?.conditionalLogic || 'Conditional logic',
        i18n.checklistTypeSelector?.tour?.features?.userTargeting || 'User targeting',
        i18n.checklistTypeSelector?.tour?.features?.progressTracking || 'Progress tracking',
        i18n.checklistTypeSelector?.tour?.features?.visualHighlights || 'Visual highlights'
      ],
      url: `${adminData.pluginUrl?.replace('/wp-content/plugins/magicchecklists/', '') || ''}admin.php?page=magiccl_checklists&view=tours&action=add`,
      buttonText: i18n.checklistTypeSelector?.tour?.buttonText || 'Create Interactive Tour',
      type: 'tour'
    }
  ]

  const handleTypeSelect = (type) => {
    if (onSelectType) {
      if (type === 'tour') {
        // For tours, we need to navigate to the tours tab and trigger new tour creation
        onSelectType({ type: 'tour', action: 'create' })
      } else {
        onSelectType(type)
      }
    } else {
      // Default behavior: navigate to the URL
      const selectedType = checklistTypes.find(t => t.id === type)
      if (selectedType) {
        window.location.href = selectedType.url
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-dark dark:text-white mb-4">
          {i18n.checklistTypeSelector?.header?.title || 'Create New Item'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {i18n.checklistTypeSelector?.header?.description || 'Choose what you want to create. Each type serves different purposes and has unique features.'}
        </p>
      </div>

      {/* Type Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {checklistTypes.map((type) => (
          <Card
            key={type.id}
            className="relative h-full border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            onClick={() => handleTypeSelect(type.id)}
          >
            <div className="text-center h-full flex flex-col">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                {type.icon}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-brand-dark dark:text-white mb-4">
                {type.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed flex-grow">
                {type.description}
              </p>

              {/* Button */}
              <Button
                size="md"
                className="w-auto font-semibold bg-brand-dark text-white hover:bg-brand-dark/90"
                onClick={(e) => {
                  e.stopPropagation()
                  handleTypeSelect(type.id)
                }}
              >
                {type.buttonText}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ChecklistTypeSelector 