import React from 'react'
import { Card, Button, Badge } from 'flowbite-react'

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
      buttonText: 'Create Publisher Checklist',
      isNew: true,
      featured: true
    },
    {
      id: 'tour',
      title: 'Interactive Tour',
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

  const comparisonFeatures = [
    { name: 'Custom Items', classic: true, publisher: false, tour: false },
    { name: 'Automatic Verification', classic: false, publisher: true, tour: false },
    { name: 'Publishing Control', classic: false, publisher: true, tour: false },
    { name: 'Step-by-Step Guidance', classic: false, publisher: false, tour: true },
    { name: 'Interactive Elements', classic: false, publisher: false, tour: true },
    { name: 'Keyboard Shortcuts', classic: true, publisher: false, tour: false },
    { name: 'Visual Highlights', classic: false, publisher: false, tour: true }
  ]

  const useCases = {
    classic: [
      'Personal task management',
      'Team project tracking',
      'General purpose checklists',
      'Client-facing requirements'
    ],
    publisher: [
      'Content quality control',
      'SEO compliance checking',
      'Editorial workflows',
      'Publication standards'
    ],
    tour: [
      'User onboarding',
      'Feature introduction',
      'Training workflows',
      'Navigation guidance'
    ]
  }

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
            className={`relative h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
              type.featured 
                ? 'border-2 border-brand-accent bg-gradient-to-br from-white to-yellow-50 dark:from-gray-800 dark:to-yellow-900/10' 
                : 'border border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => handleTypeSelect(type.id)}
          >
            {/* New Badge */}
            {type.isNew && (
              <div className="absolute -top-3 right-4 z-10">
                <Badge color="warning" size="sm" className="font-semibold">
                  New!
                </Badge>
              </div>
            )}

            <div className="p-8 text-center h-full flex flex-col">
              {/* Icon */}
              <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                type.featured 
                  ? 'bg-brand-accent text-brand-dark' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {type.icon}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-brand-dark dark:text-white mb-4">
                {type.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed flex-grow">
                {type.description}
              </p>

              {/* Features */}
              <div className="mb-8">
                <ul className="space-y-3 text-left">
                  {type.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Button */}
              <Button
                color={type.featured ? 'yellow' : 'blue'}
                size="lg"
                className="w-full font-semibold"
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

      {/* Comparison Section */}
      <Card className="p-8">
        <h3 className="text-2xl font-bold text-brand-dark dark:text-white text-center mb-8">
          Need help choosing?
        </h3>

        {/* Comparison Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <thead>
              <tr className="bg-brand-dark dark:bg-gray-900">
                <th className="px-6 py-4 text-left text-white font-semibold">Feature</th>
                <th className="px-6 py-4 text-center text-white font-semibold">Classic Checklist</th>
                <th className="px-6 py-4 text-center text-white font-semibold">Publisher Checklist</th>
                <th className="px-6 py-4 text-center text-white font-semibold">Interactive Tour</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((feature, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 font-medium text-brand-dark dark:text-white">
                    {feature.name}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {feature.classic ? (
                      <span className="text-green-500 text-2xl font-bold">✓</span>
                    ) : (
                      <span className="text-red-500 text-2xl font-bold">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {feature.publisher ? (
                      <span className="text-green-500 text-2xl font-bold">✓</span>
                    ) : (
                      <span className="text-red-500 text-2xl font-bold">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {feature.tour ? (
                      <span className="text-green-500 text-2xl font-bold">✓</span>
                    ) : (
                      <span className="text-red-500 text-2xl font-bold">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Use Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border-l-4 border-blue-500">
            <h4 className="text-lg font-bold text-brand-dark dark:text-white mb-4">
              Use Classic Checklist for:
            </h4>
            <ul className="space-y-2">
              {useCases.classic.map((useCase, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700 dark:text-gray-300">{useCase}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border-l-4 border-yellow-500">
            <h4 className="text-lg font-bold text-brand-dark dark:text-white mb-4">
              Use Publisher Checklist for:
            </h4>
            <ul className="space-y-2">
              {useCases.publisher.map((useCase, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700 dark:text-gray-300">{useCase}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border-l-4 border-green-500">
            <h4 className="text-lg font-bold text-brand-dark dark:text-white mb-4">
              Use Interactive Tour for:
            </h4>
            <ul className="space-y-2">
              {useCases.tour.map((useCase, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700 dark:text-gray-300">{useCase}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ChecklistTypeSelector 