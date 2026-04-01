import React, { useState, useEffect, useRef } from 'react'
import ChecklistTypeSelector from './ChecklistTypeSelector'
import EditChecklist from './EditChecklist'
import EditPublisherChecklist from './EditPublisherChecklist'

const ChecklistEditor = ({ adminData, checklistId = null, checklistType = null, onBackToChecklists, layoutMode = 'stacked', onSetFormRef, onSelectType }) => {
  const [currentView, setCurrentView] = useState('type-selector')
  const [selectedType, setSelectedType] = useState(checklistType)
  const [editingChecklistId, setEditingChecklistId] = useState(checklistId)
  const [loading, setLoading] = useState(false)
  const publisherChecklistRef = useRef(null)
  
  // Get i18n strings from localized data
  const i18n = adminData.i18n?.checklistEditor || {}
  const commonI18n = adminData.i18n?.common || {}

  useEffect(() => {
    // Determine initial view based on props
    if (checklistId) {
      // Editing existing checklist - load data to determine type
      if (checklistType) {
        // Type already provided
        setSelectedType(checklistType)
        setCurrentView('edit')
      } else {
        // Need to fetch checklist type
        loadChecklistType()
      }
    } else if (checklistType) {
      // Type already selected - go to edit form
      setCurrentView('edit')
      setSelectedType(checklistType)
    } else {
      // New checklist - show type selector
      setCurrentView('type-selector')
    }
  }, [checklistId, checklistType])

  const loadChecklistType = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_get_checklist_for_edit',
          checklist_id: checklistId,
          'nonce': adminData.nonces?.magiccl_admin || ''
        })
      })

      const data = await response.json()
      
      if (data.success && data.data) {
        const type = data.data.type || 'classic'
        setSelectedType(type)
        setCurrentView('edit')
      } else {
        console.error(i18n.failedToLoadType || 'Failed to load checklist type:', data.data?.message)
        // Fallback to classic type
        setSelectedType('classic')
        setCurrentView('edit')
      }
    } catch (error) {
      console.error(i18n.errorLoadingType || 'Error loading checklist type:', error)
      // Fallback to classic type
      setSelectedType('classic')
      setCurrentView('edit')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeSelect = (type) => {
    // Check if parent component provided a type selector handler (for tours)
    if (onSelectType) {
      onSelectType(type)
      return
    }
    
    // Default behavior for checklist types
    setSelectedType(type)
    setCurrentView('edit')
    
    // Update URL to reflect the selected type
    const url = new URL(window.location)
    url.searchParams.set('type', type)
    window.history.pushState({}, '', url)
  }

  const handleBackToTypeSelector = () => {
    setCurrentView('type-selector')
    setSelectedType(null)
    
    // Update URL to remove type parameter
    const url = new URL(window.location)
    url.searchParams.delete('type')
    window.history.pushState({}, '', url)
  }

  const handleChecklistSaved = (newChecklistId) => {
    setEditingChecklistId(newChecklistId)
    
    // Update URL to reflect saved checklist
    const url = new URL(window.location)
    url.searchParams.set('checklist_id', newChecklistId)
    if (!url.searchParams.has('type')) {
      url.searchParams.set('type', selectedType)
    }
    window.history.pushState({}, '', url)
  }

  // Show loading state while determining checklist type
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{i18n.loadingChecklist || 'Loading checklist...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="magiccl-checklist-editor">
      {currentView === 'type-selector' && (
        <ChecklistTypeSelector 
          adminData={adminData}
          onSelectType={handleTypeSelect}
        />
      )}
      
      {currentView === 'edit' && selectedType === 'classic' && (
        <EditChecklist 
          adminData={adminData}
          checklistId={editingChecklistId}
          checklistType={selectedType}
          onSaved={handleChecklistSaved}
          onBackToTypeSelector={!checklistId ? handleBackToTypeSelector : null}
          onBackToChecklists={onBackToChecklists}
          layoutMode={layoutMode}
          onSetFormRef={onSetFormRef}
        />
      )}
      
      {currentView === 'edit' && selectedType === 'publisher' && (
        <EditPublisherChecklist 
          ref={publisherChecklistRef}
          adminData={adminData}
          checklistId={editingChecklistId}
          onSaved={handleChecklistSaved}
          onBackToTypeSelector={!checklistId ? handleBackToTypeSelector : null}
          onBackToChecklists={onBackToChecklists}
          onSetFormRef={onSetFormRef}
        />
      )}
    </div>
  )
}

export default ChecklistEditor 