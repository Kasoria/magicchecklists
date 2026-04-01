import { useState, useEffect } from 'react'
import {
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Button,
  TextInput,
  Card,
  Dropdown,
  DropdownItem,
  DropdownDivider
} from 'flowbite-react'
import Select from 'react-select'
import ConfirmationModal from './ConfirmationModal.jsx'
import AnalyticsDashboard from './AnalyticsDashboard.jsx'
import { useToast } from './Toast.jsx'

const ChecklistsTable = ({ adminData, onEditChecklist, setActiveTab, setSidebarOpen }) => {
  // Get i18n data
  const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.magicclAdminData?.i18n) || {};
  
  const [checklists, setChecklists] = useState([])
  const [filteredChecklists, setFilteredChecklists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  
  // Toast notifications
  const { showSuccess, showError } = useToast()
  
  // Modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: 'delete',
    title: '',
    message: '',
    confirmText: '',
    cancelText: i18n.checklistsTable?.buttons?.noCancel || 'No, cancel',
    items: [],
    onConfirm: null
  })

  useEffect(() => {
    fetchChecklists()
  }, [])

  useEffect(() => {
    filterAndSortChecklists()
  }, [checklists, searchTerm, selectedTags, sortConfig])

  const fetchChecklists = async () => {
    try {
      setLoading(true)
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'magiccl_get_checklists',
          'nonce': adminData.nonces?.magiccl_admin || ''
        })
      })
      
      if (!response.ok) {
        throw new Error(i18n.checklistsTable?.errors?.fetchFailed || 'Failed to fetch checklists')
      }
      
      const data = await response.json()
      if (data.success) {
        setChecklists(data.data.data || [])
      } else {
        throw new Error(data.data?.message || i18n.checklistsTable?.errors?.fetchFailed || 'Failed to fetch checklists')
      }
    } catch (err) {
      setError(err.message)
      setChecklists([])
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortChecklists = () => {
    let filtered = [...checklists]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(checklist =>
        checklist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        checklist.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        checklist.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(checklist =>
        checklist.tags && checklist.tags.some(tag =>
          selectedTags.includes(tag.name)
        )
      )
    }

    // Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key]
        let bValue = b[sortConfig.key]

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    setFilteredChecklists(filtered)
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleToggleStatus = async (checklistId, currentStatus) => {
    try {
      const checklist = checklists.find(c => c.id === checklistId)
      const checklistTitle = checklist ? checklist.title : (i18n.checklistsTable?.labels?.checklist || 'checklist')
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'magiccl_toggle_active',
          'checklist_id': checklistId,
          'active': currentStatus === 'active' ? 0 : 1,
          '_ajax_nonce': adminData.nonces?.magiccl_toggle_active || ''
        })
      })
      
      if (response.ok) {
        showSuccess(
          `${i18n.checklistsTable?.messages?.checklistPrefix || 'Checklist'} "${checklistTitle}" ${i18n.checklistsTable?.messages?.hasBeenPrefix || 'has been'} ${newStatus === 'active' ? (i18n.checklistsTable?.messages?.activated || 'activated') : (i18n.checklistsTable?.messages?.deactivated || 'deactivated')} ${i18n.checklistsTable?.messages?.successfully || 'successfully'}.`,
          {
            title: `${i18n.checklistsTable?.titles?.checklistPrefix || 'Checklist'} ${newStatus === 'active' ? (i18n.checklistsTable?.titles?.activated || 'Activated') : (i18n.checklistsTable?.titles?.deactivated || 'Deactivated')}`,
            duration: 4000
          }
        )
        // Refresh the list instead of full page reload
        fetchChecklists()
      } else {
        throw new Error(i18n.checklistsTable?.errors?.toggleStatusFailed || 'Failed to toggle status')
      }
    } catch (err) {
      console.error('Error toggling status:', err)
      showError(
        i18n.checklistsTable?.errors?.updateStatusFailed || 'Failed to update checklist status. Please try again.',
        {
          title: i18n.checklistsTable?.titles?.statusUpdateFailed || 'Status Update Failed',
          duration: 5000
        }
      )
    }
  }

  const handleDelete = async (checklistId) => {
    const checklist = checklists.find(c => c.id === checklistId)
    
    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      title: i18n.checklistsTable?.titles?.deleteChecklist || 'Delete Checklist',
      message: i18n.checklistsTable?.messages?.deleteConfirmation || 'Are you sure you want to delete this checklist? This action cannot be undone.',
      confirmText: i18n.checklistsTable?.buttons?.yesDelete || 'Yes, delete',
      cancelText: i18n.checklistsTable?.buttons?.noCancel || 'No, cancel',
      items: checklist ? [checklist.title] : [],
      onConfirm: () => performDelete(checklistId)
    })
  }

  const performDelete = async (checklistId) => {
    try {
      const checklist = checklists.find(c => c.id === checklistId)
      const checklistTitle = checklist ? checklist.title : (i18n.checklistsTable?.labels?.checklist || 'checklist')
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'magiccl_delete_checklist',
          'checklist_id': checklistId,
          'nonce': adminData.nonces?.magiccl_admin || ''
        })
      })
      
      const data = await response.json()
      if (data.success) {
        showSuccess(
          `${i18n.checklistsTable?.messages?.checklistPrefix || 'Checklist'} "${checklistTitle}" ${i18n.checklistsTable?.messages?.hasBeenDeleted || 'has been deleted'} ${i18n.checklistsTable?.messages?.successfully || 'successfully'}.`,
          {
            title: i18n.checklistsTable?.titles?.checklistDeleted || 'Checklist Deleted',
            duration: 4000
          }
        )
        fetchChecklists() // Refresh the list
      } else {
        throw new Error(data.data?.message || i18n.checklistsTable?.errors?.deleteFailed || 'Failed to delete checklist')
      }
    } catch (err) {
      console.error('Error deleting checklist:', err)
      showError(
        err.message || i18n.checklistsTable?.errors?.deleteError || 'Failed to delete checklist. Please try again.',
        {
          title: i18n.checklistsTable?.titles?.deleteFailed || 'Delete Failed',
          duration: 5000
        }
      )
    }
  }

  const handleClone = async (checklistId) => {
    const checklist = checklists.find(c => c.id === checklistId)
    
    setConfirmationModal({
      isOpen: true,
      type: 'clone',
      title: i18n.checklistsTable?.titles?.cloneChecklist || 'Clone Checklist',
      message: i18n.checklistsTable?.messages?.cloneConfirmation || 'Are you sure you want to clone this checklist?',
      confirmText: i18n.checklistsTable?.buttons?.yesClone || 'Yes, clone',
      cancelText: i18n.checklistsTable?.buttons?.noCancel || 'No, cancel',
      confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-900',
      items: checklist ? [checklist.title] : [],
      onConfirm: () => performClone(checklistId)
    })
  }

  const performClone = async (checklistId) => {
    try {
      const checklist = checklists.find(c => c.id === checklistId)
      const checklistTitle = checklist ? checklist.title : (i18n.checklistsTable?.labels?.checklist || 'checklist')
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'magiccl_clone_checklist',
          'checklist_id': checklistId,
          'nonce': adminData.nonces?.magiccl_admin || ''
        })
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        showSuccess(
          `${i18n.checklistsTable?.messages?.checklistPrefix || 'Checklist'} "${checklistTitle}" ${i18n.checklistsTable?.messages?.hasBeenCloned || 'has been cloned'} ${i18n.checklistsTable?.messages?.successfully || 'successfully'}.`,
          {
            title: i18n.checklistsTable?.titles?.checklistCloned || 'Checklist Cloned',
            duration: 4000
          }
        )
        fetchChecklists() // Refresh the list
      } else {
        throw new Error(data.data?.message || i18n.checklistsTable?.errors?.cloneFailed || 'Failed to clone checklist')
      }
    } catch (err) {
      console.error('Error cloning checklist:', err)
      showError(
        err.message || i18n.checklistsTable?.errors?.cloneError || 'Failed to clone checklist. Please try again.',
        {
          title: i18n.checklistsTable?.titles?.cloneFailed || 'Clone Failed',
          duration: 5000
        }
      )
    }
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'urgent': 'red',
      'high': 'yellow',
      'normal': 'blue', 
      'low': 'gray',
      'none': 'gray'
    }
    return colors[priority] || 'gray'
  }

  const getPriorityLabel = (priority) => {
    const labels = {
      'urgent': i18n.checklistsTable?.priorities?.urgent || 'Urgent',
      'high': i18n.checklistsTable?.priorities?.high || 'High',
      'normal': i18n.checklistsTable?.priorities?.normal || 'Normal',
      'low': i18n.checklistsTable?.priorities?.low || 'Low',
      'none': i18n.checklistsTable?.priorities?.none || 'None'
    }
    return labels[priority] || labels.none
  }

  const getTypeLabel = (type) => {
    return type === 'publisher' ? (i18n.checklistsTable?.types?.publisher || 'Publisher') : (i18n.checklistsTable?.types?.classic || 'Classic')
  }

  // Check if any checklist has shortcode enabled
  const hasShortcodeEnabled = filteredChecklists.some(checklist => checklist.enable_shortcode)

  // Get unique tags for filter
  const allTags = checklists.reduce((tags, checklist) => {
    if (checklist.tags && Array.isArray(checklist.tags)) {
      checklist.tags.forEach(tag => {
        if (!tags.some(t => t.name === tag.name)) {
          tags.push(tag)
        }
      })
    }
    return tags
  }, [])

  // Convert tags to react-select format
  const tagOptions = allTags.map(tag => ({
    value: tag.name,
    label: tag.name,
    color: tag.color || '#3B82F6'
  }))

  // Convert selectedTags to react-select format
  const selectedTagOptions = tagOptions.filter(option => 
    selectedTags.includes(option.value)
  )

  // Custom styles for react-select to match dark mode
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'white',
      borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
      borderWidth: '1px',
      borderRadius: '0.5rem',
      boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
      minHeight: '2.5rem',
      '&:hover': {
        borderColor: '#3B82F6'
      }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'white',
      border: '1px solid #D1D5DB',
      borderRadius: '0.5rem',
      zIndex: 50
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3B82F6' 
        : state.isFocused 
          ? '#F3F4F6' 
          : 'transparent',
      color: state.isSelected 
        ? 'white' 
        : '#111827',
      padding: '8px 12px'
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#E5E7EB',
      borderRadius: '0.375rem'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#111827',
      fontSize: '0.875rem'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#6B7280',
      '&:hover': {
        backgroundColor: '#EF4444',
        color: 'white'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6B7280',
      fontSize: '0.875rem'
    }),
    input: (provided) => ({
      ...provided,
      color: '#111827'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#6B7280',
      '&:hover': {
        color: '#374151'
      }
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: '#6B7280',
      '&:hover': {
        color: '#374151'
      }
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Filters Card Skeleton */}
        <Card className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            <div>
              <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-32 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded-lg dark:bg-gray-700 w-full"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-24 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded dark:bg-gray-700 w-full"></div>
            </div>
            <div className="flex items-end">
              <div className="h-10 bg-gray-200 rounded dark:bg-gray-700 w-24"></div>
            </div>
          </div>
        </Card>

        {/* Table Card Skeleton */}
        <Card className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
          <div className="animate-pulse">
            {/* Table Header Skeleton */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-8 gap-4">
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-600 w-16"></div>
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-600 w-12"></div>
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-600 w-16"></div>
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-600 w-12"></div>
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-600 w-20"></div>
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-600 w-14"></div>
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-600 w-16"></div>
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-600 w-16"></div>
              </div>
            </div>

            {/* Table Rows Skeleton */}
            {[...Array(5)].map((_, index) => (
              <div key={index} className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                <div className="grid grid-cols-8 gap-4 items-center">
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-32"></div>
                  </div>
                  
                  {/* Type Badge */}
                  <div>
                    <div className="h-6 bg-gray-200 rounded-full dark:bg-gray-700 w-16"></div>
                  </div>
                  
                  {/* Priority Badge */}
                  <div>
                    <div className="h-6 bg-gray-200 rounded-full dark:bg-gray-700 w-14"></div>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex gap-1">
                    <div className="h-5 bg-gray-200 rounded dark:bg-gray-700 w-12"></div>
                    <div className="h-5 bg-gray-200 rounded dark:bg-gray-700 w-16"></div>
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded dark:bg-gray-700 w-full"></div>
                    <div className="h-3 bg-gray-200 rounded dark:bg-gray-700 w-3/4"></div>
                  </div>
                  
                  {/* Status Toggle */}
                  <div>
                    <div className="h-6 bg-gray-200 rounded-full dark:bg-gray-700 w-12"></div>
                  </div>
                  
                  {/* Shortcut */}
                  <div>
                    <div className="h-8 bg-gray-200 rounded dark:bg-gray-700 w-20"></div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded dark:bg-gray-700 w-8"></div>
                    <div className="h-8 bg-gray-200 rounded dark:bg-gray-700 w-8"></div>
                    <div className="h-8 bg-gray-200 rounded dark:bg-gray-700 w-8"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <span className="sr-only">{i18n.checklistsTable?.loading?.checklists || 'Loading checklists...'}</span>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-brand-dark dark:text-white mb-2">{i18n.checklistsTable?.errors?.loadingTitle || 'Error loading checklists'}</h3>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
          <Button 
            onClick={fetchChecklists} 
            className="mt-4 bg-brand-accent hover:bg-brand-accent/90 focus:ring-brand-accent"
          >
            {i18n.checklistsTable?.buttons?.tryAgain || 'Try Again'}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-brand-dark dark:text-white mb-2">
              {i18n.checklistsTable?.labels?.searchChecklists || 'Search Checklists'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-3 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                id="search"
                placeholder={i18n.checklistsTable?.placeholders?.searchByTitleDesc || 'Search by title, description, type...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full !h-[2.5rem] pl-10 pr-3 text-sm text-gray-900 bg-white border !border-gray-300 !rounded-[.5rem] focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 !dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-300 dark:focus:border-blue-300 transition-colors duration-200"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="tag-filter" className="block text-sm font-medium text-brand-dark dark:text-white mb-2">
              {i18n.checklistsTable?.labels?.filterByTags || 'Filter by Tags'}
            </label>
            <Select
              id="tag-filter"
              isMulti
              value={selectedTagOptions}
              onChange={(selectedOptions) => {
                const values = selectedOptions ? selectedOptions.map(option => option.value) : []
                setSelectedTags(values)
              }}
              options={tagOptions}
              styles={selectStyles}
              placeholder={i18n.checklistsTable?.placeholders?.selectTags || 'Select tags...'}
              className="react-select-container"
              classNamePrefix="react-select"
              isClearable
              isSearchable
            />
          </div>
          <div className="flex items-end">
            <Button
              color="gray"
              onClick={() => {
                setSearchTerm('')
                setSelectedTags([])
                setSortConfig({ key: null, direction: 'asc' })
              }}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            >
              {i18n.checklistsTable?.buttons?.clearFilters || 'Clear Filters'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
        {filteredChecklists.length === 0 ? (
          <div className="flex flex-col text-center py-12 justify-center items-center">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.75 2.75h6.5c3.31 0 6 2.69 6 6v6.5c0 3.31-2.69 6-6 6h-6.5c-3.31 0-6-2.69-6-6v-6.5c0-3.31 2.69-6 6-6z M11.692 7.889h4.52M11.692 12h4.52m-4.52 4.111h4.52M8.066 8.506a.617.617 0 1 0 0-1.234a.617.617 0 0 0 0 1.234m0 4.111a.617.617 0 1 0 0-1.234a.617.617 0 0 0 0 1.234m0 4.111a.617.617 0 1 0 0-1.234a.617.617 0 0 0 0 1.234" />
            </svg>
            <h3 className="text-lg font-medium text-brand-dark dark:text-white mb-2">
              {checklists.length === 0 ? (i18n.checklistsTable?.messages?.noChecklistsFound || 'No checklists found') : (i18n.checklistsTable?.messages?.noChecklistsMatch || 'No checklists match your filters')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {checklists.length === 0 
                ? (i18n.checklistsTable?.messages?.createFirstChecklist || 'Create your first checklist to get started.')
                : (i18n.checklistsTable?.messages?.adjustFilters || 'Try adjusting your search or filter criteria.')
              }
            </p>
            {checklists.length === 0 && (
              <Button
                onClick={() => {
                  if (typeof setActiveTab === 'function') {
                    setActiveTab('add-new')
                  }
                  if (window.innerWidth < 1024 && typeof setSidebarOpen === 'function') {
                    setSidebarOpen(false)
                  }
                  const url = new URL(window.location)
                  url.searchParams.set('page', 'magiccl_checklists')
                  url.searchParams.set('view', 'add-new')
                  window.history.pushState({}, '', url)
                }}
                className="bg-brand-accent hover:bg-brand-accent/90 focus:ring-brand-accent text-brand-dark"
              >
                {i18n.checklistsTable?.buttons?.addNewChecklist || 'Add New Checklist'}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <Table hoverable className="dark:divide-gray-600">
              <TableHead className="bg-gray-50 dark:bg-gray-700">
                <TableRow>
                  <TableHeadCell 
                    onClick={() => handleSort('title')}
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-brand-dark dark:text-white"
                  >
                    <div className="flex items-center">
                      {i18n.checklistsTable?.table?.headers?.title || 'Title'}
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </TableHeadCell>
                  <TableHeadCell 
                    onClick={() => handleSort('type')}
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-brand-dark dark:text-white"
                  >
                    <div className="flex items-center">
                      {i18n.checklistsTable?.table?.headers?.type || 'Type'}
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </TableHeadCell>
                  <TableHeadCell 
                    onClick={() => handleSort('priority')}
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-brand-dark dark:text-white"
                  >
                    <div className="flex items-center">
                      {i18n.checklistsTable?.table?.headers?.priority || 'Priority'}
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </TableHeadCell>
                  <TableHeadCell className="text-brand-dark dark:text-white">{i18n.checklistsTable?.table?.headers?.tags || 'Tags'}</TableHeadCell>
                  {hasShortcodeEnabled && (
                    <TableHeadCell className="text-brand-dark dark:text-white">{i18n.checklistsTable?.table?.headers?.shortcode || 'Shortcode'}</TableHeadCell>
                  )}
                  <TableHeadCell className="text-brand-dark dark:text-white">{i18n.checklistsTable?.table?.headers?.description || 'Description'}</TableHeadCell>
                  <TableHeadCell className="text-brand-dark dark:text-white">{i18n.checklistsTable?.table?.headers?.status || 'Status'}</TableHeadCell>
                  <TableHeadCell className="text-brand-dark dark:text-white">{i18n.checklistsTable?.table?.headers?.shortcut || 'Shortcut'}</TableHeadCell>
                  <TableHeadCell className="text-brand-dark dark:text-white">{i18n.checklistsTable?.table?.headers?.actions || 'Actions'}</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredChecklists.map((checklist) => (
                  <TableRow key={checklist.id} className="bg-white dark:bg-brand-dark hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <TableCell className="whitespace-nowrap font-medium text-brand-dark dark:text-white">
                      {checklist.title}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        color={checklist.type === 'publisher' ? 'yellow' : 'blue'}
                        size="sm"
                        className="justify-center"
                      >
                        {getTypeLabel(checklist.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        color={getPriorityColor(checklist.priority)}
                        size="sm"
                        className="justify-center"
                      >
                        {getPriorityLabel(checklist.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {checklist.tags && checklist.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            style={{ backgroundColor: tag.color }}
                            className="text-white dark:text-brand-dark"
                            size="xs"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    {hasShortcodeEnabled && (
                      <TableCell>
                        {checklist.enable_shortcode ? (
                          <code className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm whitespace-nowrap">
                            [magic_checklist id="{checklist.id}"]
                          </code>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="max-w-xs truncate text-gray-700 dark:text-gray-300">
                      {checklist.description}
                    </TableCell>
                    <TableCell>
                      <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={checklist.status === 'active'}
                          onChange={() => handleToggleStatus(checklist.id, checklist.status)}
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent dark:peer-checked:bg-brand-accent"></div>
                      </label>
                    </TableCell>
                    <TableCell>
                      {checklist.type === 'classic' ? (
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-brand-dark dark:text-white rounded text-sm">
                          {checklist.keyboard_shortcut || '—'}
                        </code>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="xs"
                          onClick={() => {
                            if (onEditChecklist) {
                              onEditChecklist(checklist.id, checklist.type || 'classic')
                            } else {
                              window.open(`/wp-admin/admin.php?page=magiccl_add_new&checklist_id=${checklist.id}`, '_self')
                            }
                          }}
                          className="text-brand-dark bg-brand-accent hover:bg-brand-accent/90 focus:ring-brand-accent border-brand-accent dark:bg-brand-accent/90 dark:hover:bg-brand-accent/80 dark:focus:ring-brand-accent/80"
                        >
                          {i18n.checklistsTable?.buttons?.edit || 'Edit'}
                        </Button>
                        <Dropdown
                          arrowIcon={false}
                          inline
                          placement="bottom-end"
                          className="z-50"
                          label={
                            <div className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 cursor-pointer transition-colors duration-200">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </div>
                          }
                        >
                          <DropdownItem
                            onClick={() => handleClone(checklist.id)}
                            className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            {i18n.checklistsTable?.buttons?.clone || 'Clone'}
                          </DropdownItem>
                          <DropdownDivider />
                          <DropdownItem
                            onClick={() => handleDelete(checklist.id)}
                            className="text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {i18n.checklistsTable?.buttons?.delete || 'Delete'}
                          </DropdownItem>
                        </Dropdown>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard analyticsData={adminData.analytics} adminData={adminData} />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        cancelText={confirmationModal.cancelText}
        confirmButtonClass={confirmationModal.confirmButtonClass}
        items={confirmationModal.items}
        icon={confirmationModal.type}
      />
    </div>
  )
}

// Ensure component has a display name for debugging
ChecklistsTable.displayName = 'ChecklistsTable'

export default ChecklistsTable 