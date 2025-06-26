import { useState, useEffect } from 'react'
import { Button, Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell, Badge, Dropdown, DropdownItem, DropdownDivider } from 'flowbite-react'
import { useToast } from './Toast.jsx'
import ConfirmationModal from './ConfirmationModal.jsx'
import { formatDate } from '../utils/dateUtils'

const Tours = ({ adminData, onEditTour }) => {
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [tourToDelete, setTourToDelete] = useState(null)
  const [processingActions, setProcessingActions] = useState(new Set())
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    loadTours()
  }, [])

  const handleEditTourSettings = (tourId) => {
    // Open tour settings (TourEditor) - this calls the parent's onEditTour
    // For new tours, pass 0 to indicate creation mode
    onEditTour(tourId || 0)
  }

  const handleOpenTourCreator = (tourId) => {
    // Redirect to WordPress dashboard with tour mode parameters
    const tourIdToUse = tourId || 0
    const dashboardUrl = new URL(adminData.dashboard_url || '/wp-admin/index.php', window.location.origin)
    
    // Add tour mode parameters
    dashboardUrl.searchParams.set('mcl_tour_mode', '1')
    if (tourIdToUse > 0) {
      dashboardUrl.searchParams.set('tour_id', tourIdToUse.toString())
    }
    
    // Set cookie as backup for page navigation
    document.cookie = 'mcl_tour_mode=1; path=/; SameSite=Lax'
    
    // Redirect to dashboard with tour parameters
    window.location.href = dashboardUrl.href
  }

  const handleExitTourCreator = () => {
    // This function is no longer needed since tour creator now runs on dashboard
    // But keeping it for any edge cases where it might be called
    console.warn('handleExitTourCreator called - tour creator should be on dashboard')
  }

  const loadTours = async () => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('action', 'mcl_get_tours_list')
      formData.append('nonce', adminData.nonces.mcl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setTours(data.data)
      } else {
        console.error('Failed to load tours:', data.data)
      }
    } catch (error) {
      console.error('Error loading tours:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (tourId, currentStatus) => {
    if (processingActions.has(`status-${tourId}`)) return

    setProcessingActions(prev => new Set(prev).add(`status-${tourId}`))

    try {
      const formData = new FormData()
      formData.append('action', 'mcl_toggle_tour_status')
      formData.append('tour_id', tourId)
      formData.append('nonce', adminData.nonces.mcl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setTours(tours.map(tour => 
          tour.id === tourId 
            ? { ...tour, active: data.data.active }
            : tour
        ))
      } else {
        console.error('Failed to toggle tour status:', data.data)
        showError('Error updating tour status')
      }
    } catch (error) {
      console.error('Error toggling tour status:', error)
      showError('Error updating tour status')
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(`status-${tourId}`)
        return newSet
      })
    }
  }

  const handleDeleteTour = async () => {
    if (!tourToDelete || processingActions.has(`delete-${tourToDelete.id}`)) return

    setProcessingActions(prev => new Set(prev).add(`delete-${tourToDelete.id}`))

    try {
      const formData = new FormData()
      formData.append('action', 'mcl_delete_tour')
      formData.append('tour_id', tourToDelete.id)
      formData.append('nonce', adminData.nonces.mcl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setTours(tours.filter(tour => tour.id !== tourToDelete.id))
        showSuccess('Tour deleted successfully')
      } else {
        console.error('Failed to delete tour:', data.data)
        showError('Error deleting tour')
      }
    } catch (error) {
      console.error('Error deleting tour:', error)
      showError('Error deleting tour')
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(`delete-${tourToDelete.id}`)
        return newSet
      })
      setShowDeleteModal(false)
      setTourToDelete(null)
    }
  }

  const handleDuplicateTour = async (tourId) => {
    if (processingActions.has(`duplicate-${tourId}`)) return

    setProcessingActions(prev => new Set(prev).add(`duplicate-${tourId}`))

    try {
      const formData = new FormData()
      formData.append('action', 'mcl_duplicate_tour')
      formData.append('tour_id', tourId)
      formData.append('nonce', adminData.nonces.mcl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        await loadTours() // Reload the list
        showSuccess('Tour duplicated successfully')
      } else {
        console.error('Failed to duplicate tour:', data.data)
        showError('Error duplicating tour')
      }
    } catch (error) {
      console.error('Error duplicating tour:', error)
      showError('Error duplicating tour')
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(`duplicate-${tourId}`)
        return newSet
      })
    }
  }

  const handleResetCompletion = async (tourId) => {
    if (processingActions.has(`reset-${tourId}`)) return

    setProcessingActions(prev => new Set(prev).add(`reset-${tourId}`))

    try {
      const formData = new FormData()
      formData.append('action', 'mcl_reset_tour_completion')
      formData.append('tour_id', tourId)
      formData.append('nonce', adminData.nonces.mcl_tour_admin)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        showSuccess('Tour completion reset successfully')
      } else {
        console.error('Failed to reset tour completion:', data.data)
        showError('Error resetting tour completion')
      }
    } catch (error) {
      console.error('Error resetting tour completion:', error)
      showError('Error resetting tour completion')
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(`reset-${tourId}`)
        return newSet
      })
    }
  }

  const formatTriggerInfo = (tour) => {
    const triggerLabels = {
      page: 'Page URL',
      selector: 'CSS Selector',
      first_login: 'First Login',
      any_page: 'Any Page'
    }

    const userLabels = {
      all_users: 'All Users',
      all_logged_in: 'Logged In',
      all_logged_out: 'Logged Out',
      specific_users: 'Specific Users',
      specific_roles: 'Specific Roles'
    }

    return {
      trigger: triggerLabels[tour.trigger_type] || tour.trigger_type,
      value: tour.trigger_value || '',
      user: userLabels[tour.user_condition] || tour.user_condition,
      autostart: tour.autostart
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    )
  }

  if (tours.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No tours yet</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Create your first tour to guide users through your WordPress site.
        </p>
        <Button
          color="brand"
          onClick={() => handleEditTourSettings(null)}
          className="inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Your First Tour
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tours Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>Title</TableHeadCell>
              <TableHeadCell>Steps</TableHeadCell>
              <TableHeadCell>Trigger</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Date</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y">
            {tours.map((tour) => {
              const triggerInfo = formatTriggerInfo(tour)
              return (
                <TableRow key={tour.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    <div>
                      <button
                        onClick={() => handleEditTourSettings(tour.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                      >
                        {tour.title || '(no title)'}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {tour.step_count} {tour.step_count === 1 ? 'step' : 'steps'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {triggerInfo.trigger}
                      </div>
                      {triggerInfo.value && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded inline-block">
                          {triggerInfo.value.length > 30 ? triggerInfo.value.substring(0, 30) + '...' : triggerInfo.value}
                        </div>
                      )}
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {triggerInfo.user}
                      </div>
                      {triggerInfo.autostart && (
                        <Badge color="success" size="sm">Auto-start</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={tour.active}
                          onChange={() => handleStatusToggle(tour.id, tour.active)}
                          disabled={processingActions.has(`status-${tour.id}`)}
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent dark:peer-checked:bg-brand-accent"></div>
                      </label>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {tour.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(tour.date, 'date')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Dropdown
                      label=""
                      dismissOnClick={true}
                      renderTrigger={() => (
                        <button className="inline-flex items-center p-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      )}
                    >
                      <DropdownItem
                        onClick={() => handleEditTourSettings(tour.id)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Tour Settings
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => handleOpenTourCreator(tour.id)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Open Creator
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => handleDuplicateTour(tour.id)}
                        disabled={processingActions.has(`duplicate-${tour.id}`)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Duplicate
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => handleResetCompletion(tour.id)}
                        disabled={processingActions.has(`reset-${tour.id}`)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset Completion
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem
                        onClick={() => {
                          setTourToDelete(tour)
                          setShowDeleteModal(true)
                        }}
                        className="text-red-600 dark:text-red-400"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteTour}
        title="Delete Tour"
        message={`Are you sure you want to delete the tour "${tourToDelete?.title}"? This action cannot be undone.`}
        confirmText={processingActions.has(`delete-${tourToDelete?.id}`) ? 'Deleting...' : 'Delete Tour'}
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900"
        icon="delete"
      />
    </div>
  )
}

export default Tours 