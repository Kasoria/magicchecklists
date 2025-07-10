import React from 'react'
import { Card, Button } from 'flowbite-react'

const ChecklistTypeSelector = ({ adminData, onSelectType }) => {
  const checklistTypes = [
    {
      id: 'classic',
      title: 'Classic Checklist',
      description: 'Traditional checklists with custom items, keyboard shortcuts, and floating buttons. Perfect for personal task management and team collaboration.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12">
          <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      ),
      features: [
        'Custom checklist items',
        'Keyboard shortcuts',
        'Floating buttons',
        'Access control',
        'Themes and customization',
        'Shortcode support'
      ],
      url: `${adminData.pluginUrl?.replace('/wp-content/plugins/magicchecklists/', '') || ''}admin.php?page=mcl_checklists&view=add-new&type=classic`,
      buttonText: 'Create Classic Checklist'
    },
    {
      id: 'publisher',
      title: 'Publisher Checklist',
      description: 'Content publishing requirements with automatic verification. Ensure posts and pages meet quality standards before publication.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      features: [
        'Automatic requirement checking',
        'Word count validation',
        'SEO requirements',
        'Featured image verification',
        'Link and taxonomy checks',
        'Publishing prevention'
      ],
      url: `${adminData.pluginUrl?.replace('/wp-content/plugins/magicchecklists/', '') || ''}admin.php?page=mcl_checklists&view=add-new&type=publisher`,
      buttonText: 'Create Publisher Checklist'
    },
    {
      id: 'tour',
      title: 'Tour',
      description: 'Guided tours that lead users through your WordPress admin or frontend. Perfect for onboarding, training, and feature introduction.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12">
          <path fill="currentColor" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
      features: [
        'Step-by-step guidance',
        'Interactive elements',
        'Conditional logic',
        'User targeting',
        'Progress tracking',
        'Visual highlights'
      ],
      url: `${adminData.pluginUrl?.replace('/wp-content/plugins/magicchecklists/', '') || ''}admin.php?page=mcl_checklists&view=tours&action=add`,
      buttonText: 'Create Interactive Tour',
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
          Create New Item
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Choose what you want to create. Each type serves different purposes and has unique features.
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