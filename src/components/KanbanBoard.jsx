import React, { useState, useEffect, useRef } from 'react'
import { useToast } from './Toast.jsx'
import ConfirmationModal from './ConfirmationModal.jsx'
import { formatDate } from '../utils/dateUtils'

// Helper function to get priority color
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'critical': return '#7c3aed' // purple
    case 'high': return '#ef4444' // red
    case 'medium': return '#f59e0b' // amber
    case 'low': return '#22c55e' // green
    default: return '#6b7280' // gray
  }
}

// Deadline Modal Component
const DeadlineModal = ({ isOpen, onClose, onSave, currentDeadline }) => {
  const [dateTime, setDateTime] = useState('')

  useEffect(() => {
    if (isOpen && currentDeadline) {
      // Convert UTC timestamp to local browser time for datetime-local input
      const date = new Date(currentDeadline * 1000)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
    } else if (isOpen) {
      setDateTime('')
    }
  }, [isOpen, currentDeadline])

  const handleSave = () => {
    if (dateTime) {
      const date = new Date(dateTime)
      const timestamp = Math.floor(date.getTime() / 1000)
      onSave(timestamp)
    } else {
      onSave(null)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Set Item Deadline
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Deadline Date & Time
          </label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave empty to remove deadline
          </p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => { onSave(null); onClose() }}
            disabled={!currentDeadline}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              currentDeadline
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Clear Deadline
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Comment component for threaded display
const Comment = ({ comment, onReply, onLike, onDelete, level = 0, isAdmin = false, i18n = {} }) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const replyFormRef = useRef(null)
  const replyInputRef = useRef(null)

  const handleReply = async () => {
    if (replyText.trim()) {
      await onReply(comment.id, replyText)
      setReplyText('')
      setShowReplyForm(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleReply()
    }
  }

  const handleShowReplyForm = () => {
    setShowReplyForm(true)
    // Use setTimeout to ensure the form is rendered before scrolling and focusing
    setTimeout(() => {
      if (replyFormRef.current) {
        replyFormRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      }
      if (replyInputRef.current) {
        replyInputRef.current.focus()
      }
    }, 100)
  }

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''} mb-4`}>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {comment.user_name ? comment.user_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {comment.user_name || 'Anonymous'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
              title={i18n.kanbanBoard?.comment?.deleteTitle || "Delete comment"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="text-gray-800 dark:text-gray-200 text-sm mb-3" 
             dangerouslySetInnerHTML={{ __html: comment.comment_content?.replace(/\\'/g, "'").replace(/\\"/g, '"') || '' }} />
        
        <div className="flex items-center space-x-4 text-xs">
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center space-x-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded px-2 py-1 ${
              comment.user_liked ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            <span>{comment.user_liked ? '❤️' : '🤍'}</span>
            <span>{comment.like_count || 0}</span>
          </button>
          
          {level === 0 && (
            <button
              onClick={handleShowReplyForm}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {i18n.kanbanBoard?.comment?.replyButton || 'Reply'}
            </button>
          )}
        </div>

        {showReplyForm && (
          <div ref={replyFormRef} className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <textarea
              ref={replyInputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={i18n.kanbanBoard?.comment?.replyPlaceholder || "Write a reply..."}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              rows={2}
            />
            <div className="flex items-center justify-end space-x-2 mt-2">
              <button
                onClick={() => setShowReplyForm(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {i18n.kanbanBoard?.comment?.cancelButton || 'Cancel'}
              </button>
              <button
                onClick={handleReply}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                {i18n.kanbanBoard?.comment?.replySubmitButton || 'Reply'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onDelete={onDelete}
              isAdmin={isAdmin}
              level={level + 1}
              i18n={i18n}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Simple Modal component for KanbanBoard
const Modal = ({ isOpen, onClose, title, children, footer, size = "md" }) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-md", 
    lg: "max-w-2xl",
    xl: "max-w-4xl"
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div 
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} my-8 max-h-[calc(100vh-8rem)]`}
        onClick={(e) => e.stopPropagation()}
        style={{ marginTop: 'max(2rem, 32px)' }} // Account for admin bar (32px) + margin
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600 sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-12rem)]">{children}</div>
        {footer && <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-600 sticky bottom-0 bg-white dark:bg-gray-800 rounded-b-lg">{footer}</div>}
      </div>
    </div>
  )
}

const KanbanBoard = ({ adminData }) => {
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

  // Core state
  const [checklists, setChecklists] = useState([])
  const [selectedChecklist, setSelectedChecklist] = useState(null)
  const [board, setBoard] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [enableItemPriority, setEnableItemPriority] = useState(false)

  // Drag state
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)

  // Column menu state
  const [openMenuColumnId, setOpenMenuColumnId] = useState(null)
  const columnMenuRef = useRef(null)

  // Modal state
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [editingColumn, setEditingColumn] = useState(null)
  const [columnTitle, setColumnTitle] = useState('')
  const [columnColor, setColumnColor] = useState('#3B82F6')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [columnToDelete, setColumnToDelete] = useState(null)

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningItem, setAssigningItem] = useState(null)
  const [selectedUser, setSelectedUser] = useState('')

  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskContent, setTaskContent] = useState('')
  const [taskComment, setTaskComment] = useState('')
  
  // Enhanced comment system state
  const [taskComments, setTaskComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  
  // Rich text editor refs
  const contentEditableRef = useRef(null)

  // Image management state
  const [showImageModal, setShowImageModal] = useState(null) // 'choice', 'upload', or null
  const [existingImages, setExistingImages] = useState([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState(null)
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedExistingImage, setSelectedExistingImage] = useState(null)

  // Feature board settings state
  const [showFeatureBoardModal, setShowFeatureBoardModal] = useState(false)
  const [featureBoardSettings, setFeatureBoardSettings] = useState({
    enabled: false,
    upvote_mode: 'logged_in',
    upvote_require_email_verification: false,
    upvote_anon_check_localstorage: true,
    upvote_anon_check_ip: false,
    comments_mode: 'logged_in',
    idea_submission_enabled: false,
    idea_submission_mode: 'logged_in',
    idea_default_column: '',
    idea_moderation_enabled: true,
    show_upvote_count: true,
    show_comment_count: true
  })
  const [savingFeatureBoardSettings, setSavingFeatureBoardSettings] = useState(false)

  // Idea submissions moderation state
  const [showIdeaSubmissionsModal, setShowIdeaSubmissionsModal] = useState(false)
  const [ideaSubmissions, setIdeaSubmissions] = useState([])
  const [loadingIdeaSubmissions, setLoadingIdeaSubmissions] = useState(false)

  // Column sync settings state
  const [showColumnSyncModal, setShowColumnSyncModal] = useState(false)
  const [columnSyncSettings, setColumnSyncSettings] = useState({
    enabled: false,
    done_column: '',
    in_progress_column: '',
    todo_column: ''
  })
  const [savingColumnSyncSettings, setSavingColumnSyncSettings] = useState(false)

  // Deadline modal state
  const [showDeadlineModal, setShowDeadlineModal] = useState(false)
  const [deadlineModalItem, setDeadlineModalItem] = useState(null)
  const [deadlineModalColumnId, setDeadlineModalColumnId] = useState(null)

  const { showSuccess, showError } = useToast()

  // Fetch checklists on mount
  useEffect(() => {
    fetchChecklists()
  }, [])

  // Load board and feature board settings when checklist changes
  useEffect(() => {
    if (selectedChecklist) {
      loadKanbanBoard()
      loadFeatureBoardSettings()
      loadColumnSyncSettings()
    }
  }, [selectedChecklist])

  // Listen for checklist data changes from other views (drawer, shortcode, etc.)
  useEffect(() => {
    const handleChecklistDataChanged = (event) => {
      const { checklistId, action, source } = event.detail || {}

      // Only reload if this is the currently selected checklist and the change came from another source
      if (checklistId && String(checklistId) === String(selectedChecklist) && source !== 'kanban') {
        loadKanbanBoard()
      }
    }

    window.addEventListener('mclChecklistDataChanged', handleChecklistDataChanged)

    return () => {
      window.removeEventListener('mclChecklistDataChanged', handleChecklistDataChanged)
    }
  }, [selectedChecklist])

  // Click outside to close column menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuColumnId && columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setOpenMenuColumnId(null)
      }
    }

    if (openMenuColumnId) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuColumnId])

  const fetchChecklists = async () => {
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_get_checklists',
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success && data.data.data) {
        const classicChecklists = data.data.data.filter(c => c.type === 'classic')
        setChecklists(classicChecklists)
        
        if (classicChecklists.length > 0 && !selectedChecklist) {
          setSelectedChecklist(classicChecklists[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching checklists:', error)
      showError(i18n.kanbanBoard?.errors?.loadChecklistsFailed || 'Failed to load checklists')
    }
  }

  // Apply column sync to reorganize items based on their checked/in-progress state
  const applyColumnSyncToBoard = (boardData, syncSettings) => {
    const isEnabled = syncSettings.enabled === true || syncSettings.enabled === 'true' || syncSettings.enabled === '1'
    if (!isEnabled || !syncSettings.done_column || !syncSettings.todo_column) {
      return boardData
    }

    // Collect all items from all columns
    const allItems = []
    boardData.forEach(column => {
      column.items.forEach(item => {
        allItems.push({ ...item, originalColumnId: column.id })
      })
    })

    // Determine which columns are managed by sync
    const managedColumns = [syncSettings.done_column, syncSettings.todo_column]
    if (syncSettings.in_progress_column) {
      managedColumns.push(syncSettings.in_progress_column)
    }

    // Create new board with items in correct columns based on state
    const newBoard = boardData.map(column => ({
      ...column,
      items: allItems.filter(item => {
        // Checked items go to done column
        if (item.checked && column.id === syncSettings.done_column) {
          return true
        }
        // In-progress items (not checked) go to in_progress column if configured
        if (!item.checked && item.inProgress && syncSettings.in_progress_column && column.id === syncSettings.in_progress_column) {
          return true
        }
        // Unchecked, non-in-progress items go to todo column
        if (!item.checked && !item.inProgress && column.id === syncSettings.todo_column) {
          return true
        }
        // If no in_progress_column configured, unchecked items (even if in-progress) go to todo
        if (!item.checked && !syncSettings.in_progress_column && column.id === syncSettings.todo_column) {
          return true
        }
        // Keep items in their original column if it's not a managed column
        if (item.originalColumnId === column.id && !managedColumns.includes(column.id)) {
          return true
        }
        return false
      }).map(({ originalColumnId, ...item }) => item)
    }))

    return newBoard
  }

  const loadKanbanBoard = async () => {
    setLoading(true)
    try {
      // Fetch column sync settings first to ensure we have the latest
      let syncSettings = columnSyncSettings
      try {
        const syncResponse = await fetch(adminData.ajaxurl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            action: 'mcl_get_column_sync_settings',
            checklist_id: selectedChecklist,
            nonce: adminData.nonces?.mcl_admin || ''
          })
        })
        const syncData = await syncResponse.json()
        if (syncData.success && syncData.data.settings) {
          syncSettings = syncData.data.settings
          setColumnSyncSettings(syncSettings)
        }
      } catch (syncError) {
        console.error('Error loading column sync settings:', syncError)
      }

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_get_kanban_board',
          checklist_id: selectedChecklist,
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        // Apply column sync if enabled to ensure items are in correct columns
        const syncedBoard = applyColumnSyncToBoard(data.data.board || [], syncSettings)
        setBoard(syncedBoard)
        setUsers(data.data.users || [])
        setEnableItemPriority(data.data.enable_item_priority || false)
      } else {
        showError(data.data || i18n.kanbanBoard?.errors?.loadBoardFailed || 'Failed to load Kanban board')
      }
    } catch (error) {
      console.error('Error loading Kanban board:', error)
      showError(i18n.kanbanBoard?.errors?.loadBoardFailed || 'Failed to load Kanban board')
    } finally {
      setLoading(false)
    }
  }

  // Feature Board Settings functions
  const loadFeatureBoardSettings = async () => {
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_get_feature_board_settings',
          checklist_id: selectedChecklist,
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success && data.data.settings) {
        setFeatureBoardSettings(data.data.settings)
      }
    } catch (error) {
      console.error('Error loading feature board settings:', error)
    }
  }

  const saveFeatureBoardSettings = async () => {
    setSavingFeatureBoardSettings(true)
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_save_feature_board_settings',
          checklist_id: selectedChecklist,
          nonce: adminData.nonces?.mcl_admin || '',
          ...featureBoardSettings
        })
      })

      const data = await response.json()
      if (data.success) {
        showSuccess(i18n.kanbanBoard?.featureBoard?.settingsSaved || 'Feature board settings saved')
        setShowFeatureBoardModal(false)
      } else {
        showError(data.data?.message || i18n.kanbanBoard?.featureBoard?.saveFailed || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving feature board settings:', error)
      showError(i18n.kanbanBoard?.featureBoard?.saveFailed || 'Failed to save settings')
    } finally {
      setSavingFeatureBoardSettings(false)
    }
  }

  // Column Sync Settings functions
  const loadColumnSyncSettings = async () => {
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_get_column_sync_settings',
          checklist_id: selectedChecklist,
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success && data.data.settings) {
        setColumnSyncSettings(data.data.settings)
      }
    } catch (error) {
      console.error('Error loading column sync settings:', error)
    }
  }

  const saveColumnSyncSettings = async () => {
    setSavingColumnSyncSettings(true)
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_save_column_sync_settings',
          checklist_id: selectedChecklist,
          nonce: adminData.nonces?.mcl_admin || '',
          ...columnSyncSettings
        })
      })

      const data = await response.json()
      if (data.success) {
        showSuccess(i18n.kanbanBoard?.columnSync?.settingsSaved || 'Column sync settings saved')
        setShowColumnSyncModal(false)
      } else {
        showError(data.data?.message || i18n.kanbanBoard?.columnSync?.saveFailed || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving column sync settings:', error)
      showError(i18n.kanbanBoard?.columnSync?.saveFailed || 'Failed to save settings')
    } finally {
      setSavingColumnSyncSettings(false)
    }
  }

  const openColumnSyncModal = () => {
    setShowColumnSyncModal(true)
  }

  const loadIdeaSubmissions = async () => {
    setLoadingIdeaSubmissions(true)
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_get_idea_submissions',
          checklist_id: selectedChecklist,
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        setIdeaSubmissions(data.data.submissions || [])
      }
    } catch (error) {
      console.error('Error loading idea submissions:', error)
    } finally {
      setLoadingIdeaSubmissions(false)
    }
  }

  const approveIdea = async (ideaId) => {
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_approve_idea',
          idea_id: ideaId,
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        showSuccess(i18n.kanbanBoard?.featureBoard?.ideaApproved || 'Idea approved and added to board')
        loadIdeaSubmissions()
        loadKanbanBoard()
      } else {
        showError(data.data?.message || i18n.kanbanBoard?.featureBoard?.approveFailed || 'Failed to approve idea')
      }
    } catch (error) {
      console.error('Error approving idea:', error)
      showError(i18n.kanbanBoard?.featureBoard?.approveFailed || 'Failed to approve idea')
    }
  }

  const rejectIdea = async (ideaId) => {
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_reject_idea',
          idea_id: ideaId,
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        showSuccess(i18n.kanbanBoard?.featureBoard?.ideaRejected || 'Idea rejected')
        loadIdeaSubmissions()
      } else {
        showError(data.data?.message || i18n.kanbanBoard?.featureBoard?.rejectFailed || 'Failed to reject idea')
      }
    } catch (error) {
      console.error('Error rejecting idea:', error)
      showError(i18n.kanbanBoard?.featureBoard?.rejectFailed || 'Failed to reject idea')
    }
  }

  const openFeatureBoardModal = () => {
    setShowFeatureBoardModal(true)
  }

  const openIdeaSubmissionsModal = () => {
    setShowIdeaSubmissionsModal(true)
    loadIdeaSubmissions()
  }

  // Drag and Drop
  const handleDragStart = (e, item, columnId) => {
    setDraggedItem({ ...item, sourceColumn: columnId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedItem || draggedItem.sourceColumn === targetColumnId) {
      setDraggedItem(null)
      return
    }

    // Update board optimistically
    const newBoard = board.map(column => {
      if (column.id === draggedItem.sourceColumn) {
        return {
          ...column,
          items: column.items.filter(item => item.id !== draggedItem.id)
        }
      }
      if (column.id === targetColumnId) {
        return {
          ...column,
          items: [...column.items, draggedItem]
        }
      }
      return column
    })
    setBoard(newBoard)

    // Update server - save entire board structure to post meta
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_save_kanban_board',
          checklist_id: selectedChecklist,
          board: JSON.stringify(newBoard),
          nonce: adminData.nonces?.mcl_admin || '',
          context: 'admin'
        })
      })

      const data = await response.json()
      if (!data.success) {
        showError(i18n.kanbanBoard?.errors?.moveItemFailed || 'Failed to move item')
        loadKanbanBoard() // Revert
      } else {
        showSuccess(i18n.kanbanBoard?.success?.itemMoved || 'Item moved successfully')
        // Dispatch event to notify other views that checklist data changed
        window.dispatchEvent(new CustomEvent('mclChecklistDataChanged', {
          detail: {
            checklistId: selectedChecklist,
            action: 'item_moved',
            itemId: draggedItem.id,
            source: 'kanban'
          }
        }))
      }
    } catch (error) {
      console.error('Error moving item:', error)
      showError(i18n.kanbanBoard?.errors?.moveItemFailed || 'Failed to move item')
      loadKanbanBoard()
    }

    setDraggedItem(null)
  }

  // Column management
  const openColumnModal = (column = null) => {
    setEditingColumn(column)
    setColumnTitle(column?.title || '')
    setColumnColor(column?.color || '#3B82F6')
    setShowColumnModal(true)
  }

  const closeColumnModal = () => {
    setShowColumnModal(false)
    setEditingColumn(null)
    setColumnTitle('')
    setColumnColor('#3B82F6')
  }

  const saveColumn = async () => {
    if (!columnTitle.trim()) {
      showError(i18n.kanbanBoard?.errors?.columnTitleRequired || 'Column title is required')
      return
    }

    let updatedColumns
    if (editingColumn) {
      updatedColumns = board.map(col => 
        col.id === editingColumn.id 
          ? { ...col, title: columnTitle, color: columnColor }
          : col
      )
    } else {
      const newColumn = {
        id: `col_${Date.now()}`,
        title: columnTitle,
        color: columnColor,
        position: board.length,
        items: []
      }
      updatedColumns = [...board, newColumn]
    }

    setBoard(updatedColumns)
    closeColumnModal()

    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_update_kanban_columns',
          checklist_id: selectedChecklist,
          columns: JSON.stringify(updatedColumns.map(col => ({
            id: col.id,
            title: col.title,
            color: col.color
          }))),
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        showSuccess(editingColumn ? (i18n.kanbanBoard?.success?.columnUpdated || 'Column updated') : (i18n.kanbanBoard?.success?.columnAdded || 'Column added'))
      } else {
        showError('Failed to save column')
        loadKanbanBoard()
      }
    } catch (error) {
      console.error('Error saving column:', error)
      showError('Failed to save column')
      loadKanbanBoard()
    }
  }

  const deleteColumn = async () => {
    if (!columnToDelete) return

    const updatedColumns = board.filter(col => col.id !== columnToDelete.id)
    setBoard(updatedColumns)
    setShowDeleteConfirm(false)
    setColumnToDelete(null)

    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_update_kanban_columns',
          checklist_id: selectedChecklist,
          columns: JSON.stringify(updatedColumns.map(col => ({
            id: col.id,
            title: col.title,
            color: col.color
          }))),
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        showSuccess('Column deleted')
      } else {
        showError('Failed to delete column')
        loadKanbanBoard()
      }
    } catch (error) {
      console.error('Error deleting column:', error)
      showError('Failed to delete column')
      loadKanbanBoard()
    }
  }

  // Task editing
  const openTaskModal = (item, columnId) => {
    setEditingTask({ ...item, columnId })
    setTaskContent(item.title || '')
    setTaskComment(item.comment || '')
    loadTaskComments(item.id)
    setShowTaskModal(true)
  }

  const closeTaskModal = () => {
    setShowTaskModal(false)
    setEditingTask(null)
    setTaskContent('')
    setTaskComment('')
    setTaskComments([])
    setNewComment('')
    setReplyingTo(null)
    setReplyText('')
  }

  const saveTask = async () => {
    // Get content from contentEditable div
    const contentFromEditor = contentEditableRef.current?.innerHTML || taskContent
    
    if (!editingTask || !contentFromEditor.trim()) {
      showError(i18n.kanbanBoard?.errors?.taskContentRequired || 'Task content is required')
      return
    }

    const newTaskTitle = contentFromEditor.trim()

    // Update board optimistically
    const newBoard = board.map(column => {
      if (column.id === editingTask.columnId) {
        return {
          ...column,
          items: column.items.map(item => {
            if (item.id === editingTask.id) {
              return {
                ...item,
                title: newTaskTitle,
                comment: taskComment.trim()
              }
            }
            return item
          })
        }
      }
      return column
    })
    setBoard(newBoard)

    try {
      // Save kanban board structure to the database
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_save_kanban_board',
          checklist_id: selectedChecklist,
          board: JSON.stringify(newBoard),
          nonce: adminData.nonces?.mcl_admin || '',
          context: 'admin'
        })
      })

      const data = await response.json()
      if (!data.success) {
        showError(i18n.kanbanBoard?.errors?.saveTaskFailed || 'Failed to save task content')
        loadKanbanBoard() // Revert changes
        return
      }

      // Save comment to the comments table (even if empty to update/clear existing comment)
      if (taskComment.trim()) {
        await saveTaskComment(editingTask.id, taskComment.trim())
      } else {
        // If comment is empty, we should clear it from the database
        await saveTaskComment(editingTask.id, '')
      }

      // Dispatch event to notify other views that checklist data changed
      window.dispatchEvent(new CustomEvent('mclChecklistDataChanged', {
        detail: {
          checklistId: selectedChecklist,
          action: 'item_updated',
          itemId: editingTask.id,
          source: 'kanban'
        }
      }))

      closeTaskModal()
      showSuccess(i18n.kanbanBoard?.success?.taskUpdated || 'Task updated successfully')
    } catch (error) {
      console.error('Error saving task:', error)
      showError(i18n.kanbanBoard?.errors?.saveTaskFailed || 'Failed to save task')
      loadKanbanBoard() // Revert changes
    }
  }

  // Helper function to save comments to the database
  const saveTaskComment = async (itemId, commentContent) => {
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_save_task_comment',
          checklist_id: selectedChecklist,
          item_id: itemId,
          comment_content: commentContent,
          user_name: adminData.currentUser?.display_name || 'Anonymous',
          user_email: adminData.currentUser?.user_email || '',
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (!data.success) {
        console.warn('Failed to save comment:', data.data)
      }
    } catch (error) {
      console.warn('Error saving comment:', error)
    }
  }

  // Enhanced comment system functions
  const loadTaskComments = async (itemId) => {
    // Strip ALL non-numeric characters to get unique ID (e.g., "item_123_1" -> "1231")
    const numericId = itemId.toString().replace(/\D/g, '')
    const itemIdInt = parseInt(numericId, 10)
    const checklistIdInt = parseInt(selectedChecklist, 10)
    
    if (!selectedChecklist || !itemId || isNaN(checklistIdInt) || isNaN(itemIdInt) || checklistIdInt <= 0 || itemIdInt <= 0) {
      setTaskComments([])
      return
    }

    setLoadingComments(true)
    try {
      // Send parameters as integers
      const params = new URLSearchParams({
        action: 'mcl_get_threaded_comments',
        checklist_id: checklistIdInt,
        item_id: itemIdInt,
        nonce: adminData.nonces?.mcl_admin || ''
      })
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      })

      const data = await response.json()
      if (data.success) {
        setTaskComments(data.data.comments || [])
      } else {
        console.warn('Failed to load comments:', data.data)
        setTaskComments([])
      }
    } catch (error) {
      console.error('Error loading comments:', error)
      setTaskComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  const addComment = async (commentText = null) => {
    const text = commentText || newComment

    if (!text.trim()) return

    // Strip ALL non-numeric characters to get unique ID (e.g., "item_123_1" -> "1231")
    const numericId = editingTask.id.toString().replace(/\D/g, '')
    const itemIdInt = parseInt(numericId, 10)

    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_add_threaded_comment',
          checklist_id: selectedChecklist,
          item_id: itemIdInt,
          parent_id: '',
          comment_content: text,
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        // Reload comments to get the updated structure
        await loadTaskComments(editingTask.id)
        
        // Reload kanban board to update comment counts
        loadKanbanBoard()
        
        // Clear the input
        setNewComment('')
        
        showSuccess(i18n.kanbanBoard?.success?.commentAdded || 'Comment added successfully')
      } else {
        showError(data.data || i18n.kanbanBoard?.errors?.addCommentFailed || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      showError(i18n.kanbanBoard?.errors?.addCommentFailed || 'Failed to add comment')
    }
  }

  const addReply = async (parentId, replyText) => {
    if (!replyText.trim()) return

    // Strip ALL non-numeric characters to get unique ID (e.g., "item_123_1" -> "1231")
    const numericId = editingTask.id.toString().replace(/\D/g, '')
    const itemIdInt = parseInt(numericId, 10)

    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_add_threaded_comment',
          checklist_id: selectedChecklist,
          item_id: itemIdInt,
          parent_id: parentId,
          comment_content: replyText,
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        // Reload comments to get the updated structure
        await loadTaskComments(editingTask.id)
        
        // Reload kanban board to update comment counts
        loadKanbanBoard()
        
        showSuccess(i18n.kanbanBoard?.success?.replyAdded || 'Reply added successfully')
      } else {
        showError(data.data || i18n.kanbanBoard?.errors?.addReplyFailed || 'Failed to add reply')
      }
    } catch (error) {
      console.error('Error adding reply:', error)
      showError(i18n.kanbanBoard?.errors?.addReplyFailed || 'Failed to add reply')
    }
  }

  const toggleCommentLike = async (commentId) => {
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_toggle_comment_like',
          comment_id: commentId,
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        // Update the comment in state
        setTaskComments(prevComments => 
          updateCommentLikes(prevComments, commentId, data.data.like_count, data.data.user_liked)
        )
      } else {
        showError(data.data || i18n.kanbanBoard?.errors?.toggleLikeFailed || 'Failed to toggle like')
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      showError(i18n.kanbanBoard?.errors?.toggleLikeFailed || 'Failed to toggle like')
    }
  }

  const updateCommentLikes = (comments, commentId, newLikeCount, userLiked) => {
    return comments.map(comment => {
      if (comment.id == commentId) {
        return { ...comment, like_count: newLikeCount, user_liked: userLiked }
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentLikes(comment.replies, commentId, newLikeCount, userLiked)
        }
      }
      return comment
    })
  }

  const deleteComment = async (commentId) => {
    if (!confirm(i18n.kanbanBoard?.confirm?.deleteComment || 'Are you sure you want to delete this comment and all its replies?')) {
      return
    }

    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_delete_threaded_comment',
          comment_id: commentId,
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        // Reload comments to refresh the list
        await loadTaskComments(editingTask.id)
        
        // Reload kanban board to update comment counts
        loadKanbanBoard()
        
        showSuccess(i18n.kanbanBoard?.success?.commentDeleted || 'Comment deleted successfully')
      } else {
        showError(data.data || i18n.kanbanBoard?.errors?.deleteCommentFailed || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      showError(i18n.kanbanBoard?.errors?.deleteCommentFailed || 'Failed to delete comment')
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)
    
    if (seconds < 60) return i18n.kanbanBoard?.time?.justNow || 'just now'
    if (seconds < 3600) return (i18n.kanbanBoard?.time?.minutesAgo || '{minutes}m ago').replace('{minutes}', Math.floor(seconds / 60))
    if (seconds < 86400) return (i18n.kanbanBoard?.time?.hoursAgo || '{hours}h ago').replace('{hours}', Math.floor(seconds / 3600))
    if (seconds < 2592000) return (i18n.kanbanBoard?.time?.daysAgo || '{days}d ago').replace('{days}', Math.floor(seconds / 86400))
    return date.toLocaleDateString()
  }

  // Rich text editor utilities
  const handlePaste = (e) => {
    e.preventDefault()
    const text = (e.clipboardData || window.clipboardData).getData('text/plain')
    
    // Check if the pasted content is a URL
    const urlRegex = /(https?:\/\/[^\s]+)/g
    if (urlRegex.test(text)) {
      // Create a link element
      const linkHtml = `<a href="${text}" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: underline;">${text}</a>`
      document.execCommand('insertHTML', false, linkHtml)
    } else {
      // Insert as plain text
      document.execCommand('insertText', false, text)
    }
  }

  // Image management functions
  const handleAddImage = () => {
    setImageError(null)

    // Check if user is logged in and can use media library
    const isLoggedIn = adminData?.currentUser || false

    if (isLoggedIn && typeof wp !== 'undefined' && wp.media) {
      // Show choice modal for logged in users
      setShowImageModal('choice')
    } else {
      // Show upload area directly for non-logged in users
      setShowImageModal('upload')
    }
  }

  const closeImageModal = () => {
    setShowImageModal(null)
    setExistingImages([])
    setSelectedImageFile(null)
    setImagePreview(null)
    setSelectedExistingImage(null)
    setImageError(null)
  }

  const openMediaLibrary = () => {
    if (typeof wp === 'undefined' || !wp.media) {
      console.error('WordPress media library not available')
      return
    }

    const mediaFrame = wp.media({
      title: i18n.kanbanBoard?.modals?.selectImage || 'Select Image',
      library: { type: 'image' },
      multiple: false,
      button: { text: i18n.kanbanBoard?.modals?.insertImage || 'Insert Image' }
    })

    mediaFrame.on('select', () => {
      const attachment = mediaFrame.state().get('selection').first().toJSON()
      insertImageIntoEditor(attachment)
      closeImageModal()
    })

    mediaFrame.open()
  }

  const loadExistingImages = async () => {
    if (!selectedChecklist) return
    setLoadingImages(true)
    try {
      const formData = new FormData()
      formData.append('action', 'mcl_get_uploaded_images')
      formData.append('checklist_id', selectedChecklist)

      const nonce = adminData?.nonces?.mcl_admin || ''
      if (nonce) {
        formData.append('nonce', nonce)
      }

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setExistingImages(result.data)
      } else {
        console.error('Failed to load existing images:', result.data?.message)
        setExistingImages([])
      }
    } catch (error) {
      console.error('Error loading existing images:', error)
      setExistingImages([])
    } finally {
      setLoadingImages(false)
    }
  }

  const uploadImage = async (file) => {
    setUploadingImage(true)
    setImageError(null)

    try {
      const formData = new FormData()
      formData.append('action', 'mcl_upload_image')
      formData.append('file', file)
      formData.append('checklist_id', selectedChecklist || 0)

      const nonce = adminData?.nonces?.mcl_admin || ''
      if (nonce) {
        formData.append('nonce', nonce)
      }

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        insertImageIntoEditor(result.data)
        closeImageModal()
      } else {
        setImageError(result.data?.message || i18n.kanbanBoard?.errors?.uploadFailed || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setImageError(i18n.kanbanBoard?.errors?.uploadFailed || 'Upload failed. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const insertImageIntoEditor = (imageData) => {
    if (!contentEditableRef.current) return

    // Focus the editor first to ensure cursor position
    contentEditableRef.current.focus()

    const maxWidth = 200
    const aspectRatio = imageData.height / imageData.width
    let width = Math.min(imageData.width, maxWidth)
    let height = Math.round(width * aspectRatio)

    const imageHtml = `<img src="${imageData.url}" alt="${imageData.alt || 'Uploaded image'}" style="max-width: 100%; height: auto; margin: 8px 0;" />`

    // Insert at cursor position (or at the end if no cursor)
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      document.execCommand('insertHTML', false, imageHtml)
    } else {
      // If no selection, append to the end
      contentEditableRef.current.innerHTML += imageHtml
    }
  }

  const handleFileSelect = (selectedFile) => {
    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']

    if (!allowedTypes.includes(selectedFile.type)) {
      setImageError(i18n.kanbanBoard?.errors?.invalidFileType || 'Invalid file type. Please upload a JPG, PNG, or GIF image.')
      return
    }

    if (selectedFile.size > maxSize) {
      setImageError(i18n.kanbanBoard?.errors?.fileTooLarge || 'File is too large. Maximum size is 10MB.')
      return
    }

    setSelectedImageFile(selectedFile)
    setImageError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(selectedFile)
  }

  const addImageToEditor = () => {
    handleAddImage()
  }

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value)
  }

  // User assignment
  const openAssignModal = (item, columnId) => {
    setAssigningItem({ ...item, columnId })
    setSelectedUser(item.assigned_user?.id || '')
    setShowAssignModal(true)
  }

  const saveAssignment = async () => {
    if (!assigningItem) return

    const newBoard = board.map(column => {
      if (column.id === assigningItem.columnId) {
        return {
          ...column,
          items: column.items.map(item => {
            if (item.id === assigningItem.id) {
              const assignedUser = users.find(u => u.id == selectedUser)
              return {
                ...item,
                assigned_user: assignedUser ? {
                  id: assignedUser.id,
                  name: assignedUser.name,
                  avatar: assignedUser.avatar
                } : null
              }
            }
            return item
          })
        }
      }
      return column
    })
    setBoard(newBoard)
    setShowAssignModal(false)

    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_assign_kanban_user',
          checklist_id: selectedChecklist,
          item_id: assigningItem.id,
          user_id: selectedUser || 0,
          nonce: adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        showSuccess(i18n.kanbanBoard?.success?.userAssignmentUpdated || 'User assignment updated')
      } else {
        showError(i18n.kanbanBoard?.errors?.assignUserFailed || 'Failed to assign user')
        loadKanbanBoard()
      }
    } catch (error) {
      console.error('Error assigning user:', error)
      showError(i18n.kanbanBoard?.errors?.assignUserFailed || 'Failed to assign user')
      loadKanbanBoard()
    }
  }

  const toggleItemCheck = async (item, columnId) => {
    const newCheckedState = !item.checked

    // Determine target column for auto-move if column sync is enabled
    let targetColumnId = columnId
    let shouldMoveColumn = false

    // Convert enabled to boolean explicitly (in case it's a string "true"/"false")
    const isEnabled = columnSyncSettings.enabled === true || columnSyncSettings.enabled === 'true' || columnSyncSettings.enabled === '1'

    if (isEnabled) {
      if (newCheckedState && columnSyncSettings.done_column) {
        // Item is being checked - move to Done column
        targetColumnId = columnSyncSettings.done_column
        // Use string comparison to avoid type mismatch
        shouldMoveColumn = String(columnId) !== String(targetColumnId)
      } else if (!newCheckedState && columnSyncSettings.todo_column) {
        // Item is being unchecked - move to To Do column
        targetColumnId = columnSyncSettings.todo_column
        // Use string comparison to avoid type mismatch
        shouldMoveColumn = String(columnId) !== String(targetColumnId)
      }
    }

    // Update board optimistically - update checked state and move if needed
    let newBoard
    if (shouldMoveColumn) {
      // Remove from current column and add to target column
      const updatedItem = { ...item, checked: newCheckedState }
      newBoard = board.map(column => {
        // Use string comparison to handle type mismatches
        if (String(column.id) === String(columnId)) {
          // Remove from source column
          return {
            ...column,
            items: column.items.filter(boardItem => boardItem.id !== item.id)
          }
        }
        if (String(column.id) === String(targetColumnId)) {
          // Add to target column
          return {
            ...column,
            items: [...column.items, updatedItem]
          }
        }
        return column
      })
    } else {
      // Just update the checked state in place
      newBoard = board.map(column => {
        if (column.id === columnId) {
          return {
            ...column,
            items: column.items.map(boardItem => {
              if (boardItem.id === item.id) {
                return { ...boardItem, checked: newCheckedState }
              }
              return boardItem
            })
          }
        }
        return column
      })
    }
    setBoard(newBoard)

    // Get all checked items
    const checkedItems = []
    newBoard.forEach(column => {
      column.items.forEach(boardItem => {
        if (boardItem.checked) {
          checkedItems.push(boardItem.id)
        }
      })
    })

    try {
      const formData = new FormData()
      formData.append('action', 'mcl_save_checked_state')
      formData.append('checklist_id', selectedChecklist)
      formData.append('checked_items', JSON.stringify(checkedItems))
      formData.append('context', 'kanban')

      // Use the correct nonce from window.mcl_checklists (same as ChecklistDrawer)
      const nonce = window.mcl_checklists?.nonce || ''
      if (nonce) {
        formData.append('nonce', nonce)
      }

      // Add stored token for invite users if available (same as ChecklistDrawer)
      const storedToken = window.mcl_checklists?.invite_token?.token
      if (storedToken) {
        formData.append('stored_token', storedToken)
      }

      // Use the same AJAX URL as ChecklistDrawer
      const ajaxUrl = window.mcl_checklists?.ajax_url || adminData.ajaxurl || '/wp-admin/admin-ajax.php'

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })

      const data = await response.json()
      if (data.success) {
        // If we moved the item, also save the board structure
        if (shouldMoveColumn) {
          await fetch(adminData.ajaxurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              action: 'mcl_save_kanban_board',
              checklist_id: selectedChecklist,
              board: JSON.stringify(newBoard),
              nonce: adminData.nonces?.mcl_admin || '',
              context: 'admin'
            })
          })
          showSuccess(i18n.kanbanBoard?.success?.itemCheckedAndMoved || (newCheckedState ? 'Item checked and moved' : 'Item unchecked and moved'))
        } else {
          showSuccess(newCheckedState ? (i18n.kanbanBoard?.success?.itemChecked || 'Item checked') : (i18n.kanbanBoard?.success?.itemUnchecked || 'Item unchecked'))
        }

        // Dispatch event to notify other views
        window.dispatchEvent(new CustomEvent('mclChecklistDataChanged', {
          detail: {
            checklistId: selectedChecklist,
            action: shouldMoveColumn ? 'item_checked_and_moved' : 'item_checked',
            itemId: item.id,
            source: 'kanban'
          }
        }))
      } else {
        showError(i18n.kanbanBoard?.errors?.updateItemStateFailed || 'Failed to update item state')
        loadKanbanBoard()
      }
    } catch (error) {
      console.error('Error toggling item:', error)
      showError(i18n.kanbanBoard?.errors?.updateItemStateFailed || 'Failed to update item state')
      loadKanbanBoard()
    }
  }

  // Cycle through priority levels
  const cyclePriority = async (item, columnId) => {
    const priorities = ['none', 'low', 'medium', 'high', 'critical']
    const currentIndex = priorities.indexOf(item.priority || 'none')
    const nextPriority = priorities[(currentIndex + 1) % priorities.length]

    // Update board state optimistically
    const newBoard = board.map(column => {
      if (column.id === columnId) {
        return {
          ...column,
          items: column.items.map(boardItem =>
            boardItem.id === item.id ? { ...boardItem, priority: nextPriority } : boardItem
          )
        }
      }
      return column
    })
    setBoard(newBoard)

    // Save to backend
    try {
      await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'mcl_save_kanban_board',
          checklist_id: selectedChecklist,
          board: JSON.stringify(newBoard),
          nonce: adminData.nonces?.mcl_admin || '',
          context: 'admin'
        })
      })
    } catch (error) {
      console.error('Error saving priority:', error)
      loadKanbanBoard() // Revert on error
    }
  }

  // Handle deadline click - open modal
  const handleDeadlineClick = (item, columnId) => {
    setDeadlineModalItem(item)
    setDeadlineModalColumnId(columnId)
    setShowDeadlineModal(true)
  }

  // Save item deadline
  const saveItemDeadline = async (timestamp) => {
    if (!deadlineModalItem) return

    const itemId = deadlineModalItem.id
    const columnId = deadlineModalColumnId

    // Update board state optimistically
    const newBoard = board.map(column => {
      if (column.id === columnId) {
        return {
          ...column,
          items: column.items.map(boardItem =>
            boardItem.id === itemId ? { ...boardItem, deadline: timestamp } : boardItem
          )
        }
      }
      return column
    })
    setBoard(newBoard)

    // Save to backend
    try {
      const ajaxUrl = window.mcl_checklists?.ajax_url || adminData.ajaxurl || '/wp-admin/admin-ajax.php'
      const nonce = window.mcl_checklists?.nonce || adminData.nonces?.mcl_admin || ''

      const formData = new FormData()
      formData.append('action', 'mcl_save_item_deadline')
      formData.append('checklist_id', selectedChecklist)
      formData.append('item_id', itemId)
      formData.append('deadline', timestamp || '')
      formData.append('nonce', nonce)

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })

      const data = await response.json()
      if (data.success) {
        showSuccess(timestamp ? (i18n.kanbanBoard?.success?.deadlineSet || 'Deadline set') : (i18n.kanbanBoard?.success?.deadlineCleared || 'Deadline cleared'))
      } else {
        showError(i18n.kanbanBoard?.errors?.deadlineSaveFailed || 'Failed to save deadline')
        loadKanbanBoard() // Revert on error
      }
    } catch (error) {
      console.error('Error saving deadline:', error)
      showError(i18n.kanbanBoard?.errors?.deadlineSaveFailed || 'Failed to save deadline')
      loadKanbanBoard()
    }

    // Close modal
    setShowDeadlineModal(false)
    setDeadlineModalItem(null)
    setDeadlineModalColumnId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-gray-700 dark:text-white font-medium">
              {i18n.kanbanBoard?.header?.selectChecklistLabel || 'Select Checklist:'}
            </label>
            <select
              value={selectedChecklist || ''}
              onChange={(e) => setSelectedChecklist(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{i18n.kanbanBoard?.header?.chooseChecklistOption || 'Choose a checklist...'}</option>
              {checklists.map(checklist => (
                <option key={checklist.id} value={checklist.id}>
                  {checklist.title}
                </option>
              ))}
            </select>
          </div>
          {selectedChecklist && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openColumnModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {i18n.kanbanBoard?.header?.addColumnButton || 'Add Column'}
              </button>

              {/* Feature Board Settings Button */}
              <button
                onClick={openFeatureBoardModal}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {i18n.kanbanBoard?.header?.featureBoardSettingsButton || 'Feature Board'}
              </button>

              {/* Column Sync Settings Button */}
              <button
                onClick={openColumnSyncModal}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {i18n.kanbanBoard?.header?.columnSyncSettingsButton || 'Column Sync'}
              </button>

              {/* Idea Submissions Button - only show if feature board is enabled */}
              {featureBoardSettings.enabled && featureBoardSettings.idea_submission_enabled && (
                <button
                  onClick={openIdeaSubmissionsModal}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {i18n.kanbanBoard?.header?.ideaSubmissionsButton || 'Idea Submissions'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      {selectedChecklist && (
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh] pb-4">
          <div className="flex items-start space-x-4 min-w-max">
            {board.map(column => (
              <div
                key={column.id}
                className={`flex-shrink-0 w-80 ${dragOverColumn === column.id ? 'ring-2 ring-blue-500' : ''}`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {column.title}
                      </h3>
                      <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                        {column.items.length}
                      </span>
                    </div>
                    <div className="relative" ref={openMenuColumnId === column.id ? columnMenuRef : null}>
                      <button
                        onClick={() => setOpenMenuColumnId(openMenuColumnId === column.id ? null : column.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      {openMenuColumnId === column.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() => {
                              openColumnModal(column)
                              setOpenMenuColumnId(null)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            {i18n.kanbanBoard?.column?.editButton || 'Edit Column'}
                          </button>
                          <button
                            onClick={() => {
                              setColumnToDelete(column)
                              setShowDeleteConfirm(true)
                              setOpenMenuColumnId(null)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            {i18n.kanbanBoard?.column?.deleteButton || 'Delete Column'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column Items */}
                  <div className="space-y-2 min-h-[100px]">
                    {column.items.map(item => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item, column.id)}
                        onDoubleClick={() => openTaskModal(item, column.id)}
                        className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start space-x-2 flex-1">
                            <button 
                              onClick={() => toggleItemCheck(item, column.id)}
                              className={`flex-shrink-0 mt-0.5 hover:scale-110 transition-transform ${
                                item.checked ? 'text-green-500' : 'text-gray-400'
                              }`}
                            >
                              {item.checked ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                </svg>
                              )}
                            </button>
                            {/* Priority Indicator - Clickable to cycle (only if item priority is enabled) */}
                            {enableItemPriority && (
                              <div
                                onClick={(e) => { e.stopPropagation(); cyclePriority(item, column.id) }}
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  backgroundColor: getPriorityColor(item.priority || 'none'),
                                  flexShrink: 0,
                                  marginTop: '2px',
                                  cursor: 'pointer'
                                }}
                                title={item.priority && item.priority !== 'none' ? `Priority: ${item.priority} (click to change)` : 'Click to set priority'}
                              />
                            )}
                            <div
                              className={`font-medium text-sm flex-1 ${
                                item.checked
                                  ? 'text-gray-500 dark:text-gray-400 line-through'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                              dangerouslySetInnerHTML={{ __html: item.title }}
                            />
                          </div>
                        </div>

                        {/* Item Comment */}
                        {item.comment && (
                          <div className="mt-2 mb-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-600 p-2 rounded">
                              {item.comment}
                            </p>
                          </div>
                        )}

                        {/* Comment count indicator */}
                        {item.comment_count > 0 && (
                          <div className="mt-2 mb-2">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span>{item.comment_count} {item.comment_count === 1 ? (i18n.kanbanBoard?.item?.commentSingular || 'comment') : (i18n.kanbanBoard?.item?.commentPlural || 'comments')}</span>
                            </div>
                          </div>
                        )}

                        {/* Item Footer */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                          {/* Deadline Badge - Clickable to edit */}
                          <div
                            onClick={() => handleDeadlineClick(item, column.id)}
                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                            title={item.deadline ? 'Click to edit deadline' : 'Click to set deadline'}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{item.deadline ? formatDate(item.deadline, 'datetime') : 'Set deadline'}</span>
                          </div>
                          <button
                            onClick={() => openAssignModal(item, column.id)}
                            className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded px-1 py-0.5"
                          >
                            {item.assigned_user ? (
                              <>
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                  {item.assigned_user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {item.assigned_user.name.split(' ')[0]}
                                </span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-xs text-gray-400">{i18n.kanbanBoard?.item?.assignButton || 'Assign'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Column Modal */}
      <Modal
        isOpen={showColumnModal}
        onClose={closeColumnModal}
        title={editingColumn ? (i18n.kanbanBoard?.modals?.editColumnTitle || 'Edit Column') : (i18n.kanbanBoard?.modals?.addColumnTitle || 'Add New Column')}
        footer={
          <>
            <button
              onClick={closeColumnModal}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {i18n.kanbanBoard?.modals?.cancelButton || 'Cancel'}
            </button>
            <button
              onClick={saveColumn}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingColumn ? (i18n.kanbanBoard?.modals?.updateColumnButton || 'Update Column') : (i18n.kanbanBoard?.modals?.addColumnButton || 'Add Column')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {i18n.kanbanBoard?.modals?.columnTitleLabel || 'Column Title'}
            </label>
            <input
              type="text"
              value={columnTitle}
              onChange={(e) => setColumnTitle(e.target.value)}
              placeholder={i18n.kanbanBoard?.modals?.columnTitlePlaceholder || "Enter column title..."}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {i18n.kanbanBoard?.modals?.columnColorLabel || 'Column Color'}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={columnColor}
                onChange={(e) => setColumnColor(e.target.value)}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {columnColor}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Assign User Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={i18n.kanbanBoard?.modals?.assignUserTitle || "Assign User"}
        footer={
          <>
            <button
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {i18n.kanbanBoard?.modals?.cancelButton || 'Cancel'}
            </button>
            <button
              onClick={saveAssignment}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {i18n.kanbanBoard?.modals?.saveAssignmentButton || 'Save Assignment'}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {i18n.kanbanBoard?.modals?.selectUserLabel || 'Select User'}
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">{i18n.kanbanBoard?.modals?.unassignedOption || 'Unassigned'}</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Task Edit Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={closeTaskModal}
        title={i18n.kanbanBoard?.modals?.editTaskTitle || "Edit Task"}
        size="lg"
        footer={
          <>
            <button
              onClick={closeTaskModal}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {i18n.kanbanBoard?.modals?.cancelButton || 'Cancel'}
            </button>
            <button
              onClick={saveTask}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {i18n.kanbanBoard?.modals?.saveTaskButton || 'Save Task'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {i18n.kanbanBoard?.modals?.taskContentLabel || 'Task Content'}
            </label>
            
            {/* Simple formatting toolbar */}
            <div className="flex items-center gap-1 mb-2 p-2 bg-gray-50 rounded border">
              <button
                type="button"
                onClick={() => formatText('bold')}
                className="p-1 rounded hover:bg-gray-200 text-gray-600 text-sm font-bold"
                title={i18n.kanbanBoard?.modals?.boldTitle || "Bold"}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => formatText('italic')}
                className="p-1 rounded hover:bg-gray-200 text-gray-600 text-sm italic"
                title={i18n.kanbanBoard?.modals?.italicTitle || "Italic"}
              >
                I
              </button>
              <button
                type="button"
                onClick={() => formatText('underline')}
                className="p-1 rounded hover:bg-gray-200 text-gray-600 text-sm underline"
                title={i18n.kanbanBoard?.modals?.underlineTitle || "Underline"}
              >
                U
              </button>
              <div className="w-px h-4 bg-gray-300 mx-1"></div>
              <button
                type="button"
                onClick={addImageToEditor}
                className="p-1 rounded hover:bg-gray-200 text-gray-600 text-xs"
                title={i18n.kanbanBoard?.modals?.addImageTitle || "Add Image"}
              >
                🖼️
              </button>
            </div>

            {/* Rich text editor */}
            <div
              ref={contentEditableRef}
              contentEditable
              suppressContentEditableWarning={true}
              className="w-full min-h-[100px] p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              style={{ fontSize: '14px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: taskContent }}
              onPaste={handlePaste}
              onBlur={(e) => setTaskContent(e.target.innerHTML)}
            />
          </div>

          {/* Comments Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {i18n.kanbanBoard?.modals?.commentsLabel || 'Comments'} ({taskComments.length})
            </label>
            
            {/* Add New Comment */}
            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={i18n.kanbanBoard?.modals?.addCommentPlaceholder || "Add a comment..."}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    addComment()
                  }
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {i18n.kanbanBoard?.modals?.ctrlEnterToPost || 'Ctrl+Enter to post'}
                </span>
                <button
                  onClick={() => addComment()}
                  disabled={!newComment.trim()}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {i18n.kanbanBoard?.modals?.commentButton || 'Comment'}
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="max-h-80 overflow-y-auto space-y-3">
              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-500">{i18n.kanbanBoard?.modals?.loadingComments || 'Loading comments...'}</span>
                </div>
              ) : taskComments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">{i18n.kanbanBoard?.modals?.noCommentsYet || 'No comments yet. Be the first to comment!'}</p>
                </div>
              ) : (
                taskComments.map(comment => (
                  <Comment
                    key={comment.id}
                    comment={comment}
                    onReply={addReply}
                    onLike={toggleCommentLike}
                    onDelete={deleteComment}
                    isAdmin={true}
                    level={0}
                    i18n={i18n}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      </Modal>

      {/* Delete Column Confirmation */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setColumnToDelete(null)
        }}
        onConfirm={deleteColumn}
        title={i18n.kanbanBoard?.modals?.deleteColumnTitle || "Delete Column"}
        message={i18n.kanbanBoard?.modals?.deleteColumnMessage?.replace('{columnTitle}', columnToDelete?.title || '') || `Are you sure you want to delete the column "${columnToDelete?.title}"?`}
        confirmText={i18n.kanbanBoard?.modals?.deleteColumnConfirm || "Delete Column"}
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        icon="delete"
        items={columnToDelete?.items?.length > 0 ? [i18n.kanbanBoard?.modals?.deleteColumnWarning?.replace('{itemCount}', columnToDelete.items.length) || `This will also delete ${columnToDelete.items.length} items in this column`] : []}
      />

      {/* Image Choice Modal */}
      {showImageModal === 'choice' && (
        <Modal isOpen={true} onClose={closeImageModal} title={i18n.kanbanBoard?.modals?.insertImage || 'Insert Image'}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{i18n.kanbanBoard?.modals?.chooseImageMethod || 'Choose how you would like to add an image:'}</p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              onClick={openMediaLibrary}
            >
              {i18n.kanbanBoard?.modals?.mediaLibrary || 'WordPress Media Library'}
            </button>
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              onClick={() => setShowImageModal('upload')}
            >
              {i18n.kanbanBoard?.modals?.quickUpload || 'Quick Upload'}
            </button>
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              onClick={closeImageModal}
            >
              {i18n.kanbanBoard?.modals?.cancelButton || 'Cancel'}
            </button>
          </div>
        </Modal>
      )}

      {/* Image Upload Modal */}
      {showImageModal === 'upload' && (
        <Modal
          isOpen={true}
          onClose={closeImageModal}
          title={i18n.kanbanBoard?.modals?.uploadOrSelectImage || 'Upload or Select Image'}
          size="lg"
          footer={
            <div className="flex justify-between w-full">
              <button
                type="button"
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                onClick={closeImageModal}
              >
                {i18n.kanbanBoard?.modals?.cancelButton || 'Cancel'}
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                onClick={() => {
                  if (selectedImageFile) {
                    uploadImage(selectedImageFile)
                  } else if (selectedExistingImage) {
                    insertImageIntoEditor(selectedExistingImage)
                    closeImageModal()
                  }
                }}
                disabled={(!selectedImageFile && !selectedExistingImage) || uploadingImage}
              >
                {uploadingImage ? (i18n.kanbanBoard?.modals?.uploading || 'Uploading...') : selectedImageFile ? (i18n.kanbanBoard?.modals?.uploadImage || 'Upload Image') : (i18n.kanbanBoard?.modals?.selectImage || 'Select Image')}
              </button>
            </div>
          }
        >
          <div>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-600 mb-4">
              <button
                type="button"
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  !existingImages.length || existingImages.length === 0
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setExistingImages([])}
              >
                {i18n.kanbanBoard?.modals?.uploadNew || 'Upload New'}
              </button>
              <button
                type="button"
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  existingImages.length > 0
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={loadExistingImages}
              >
                {i18n.kanbanBoard?.modals?.selectExisting || 'Select Existing'}
              </button>
            </div>

            {/* Upload Tab */}
            {(!existingImages.length || existingImages.length === 0) && (
              <div>
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onDragOver={e => { e.preventDefault() }}
                  onDrop={e => {
                    e.preventDefault()
                    if (e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0])
                    }
                  }}
                  onClick={() => document.getElementById('kanban-image-upload-input').click()}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="kanban-image-upload-input"
                  />

                  {!imagePreview ? (
                    <div className="space-y-3">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-gray-600 dark:text-gray-400">{i18n.kanbanBoard?.modals?.dragDropImage || 'Drag and drop image here or click to select'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{i18n.kanbanBoard?.modals?.imageRestrictions || 'Maximum file size: 10MB. Supported formats: JPG, PNG, GIF'}</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="max-w-full h-auto rounded-md" />
                      <button
                        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-70 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedImageFile(null)
                          setImagePreview(null)
                          setImageError(null)
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {imageError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {imageError}
                  </div>
                )}
              </div>
            )}

            {/* Select Tab */}
            {existingImages.length > 0 && (
              <div>
                {loadingImages ? (
                  <div className="text-center py-8 text-gray-500">{i18n.kanbanBoard?.modals?.loadingImages || 'Loading images...'}</div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {existingImages.map((image) => (
                      <div
                        key={image.url}
                        className={`border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedExistingImage === image
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedExistingImage(image)}
                      >
                        <img src={image.url} alt={image.filename} className="w-full h-24 object-cover rounded-t-md" />
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-800 truncate">{image.filename}</p>
                          <p className="text-xs text-gray-500">{image.width}×{image.height}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Feature Board Settings Modal */}
      <Modal
        isOpen={showFeatureBoardModal}
        onClose={() => setShowFeatureBoardModal(false)}
        title={i18n.kanbanBoard?.featureBoard?.settingsTitle || 'Feature Board Settings'}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setShowFeatureBoardModal(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              {i18n.kanbanBoard?.modals?.cancelButton || 'Cancel'}
            </button>
            <button
              onClick={saveFeatureBoardSettings}
              disabled={savingFeatureBoardSettings}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {savingFeatureBoardSettings
                ? (i18n.kanbanBoard?.featureBoard?.saving || 'Saving...')
                : (i18n.kanbanBoard?.featureBoard?.saveButton || 'Save Settings')
              }
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Enable Feature Board */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {i18n.kanbanBoard?.featureBoard?.enableLabel || 'Enable Feature Board'}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {i18n.kanbanBoard?.featureBoard?.enableDescription || 'Allow public visitors to interact with this board'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={featureBoardSettings.enabled}
                onChange={(e) => setFeatureBoardSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {featureBoardSettings.enabled && (
            <>
              {/* Upvote Settings */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  {i18n.kanbanBoard?.featureBoard?.upvoteSettings || 'Upvote Settings'}
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {i18n.kanbanBoard?.featureBoard?.upvoteModeLabel || 'Who can upvote?'}
                    </label>
                    <select
                      value={featureBoardSettings.upvote_mode}
                      onChange={(e) => setFeatureBoardSettings(prev => ({ ...prev, upvote_mode: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="anyone">{i18n.kanbanBoard?.featureBoard?.upvoteModeAnyone || 'Anyone (no login required)'}</option>
                      <option value="logged_in">{i18n.kanbanBoard?.featureBoard?.upvoteModeLoggedIn || 'Logged-in users only'}</option>
                      <option value="email_verified">{i18n.kanbanBoard?.featureBoard?.upvoteModeEmailVerified || 'Email verification required'}</option>
                    </select>
                  </div>

                  {featureBoardSettings.upvote_mode === 'email_verified' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="upvote_require_verification"
                        checked={featureBoardSettings.upvote_require_email_verification}
                        onChange={(e) => setFeatureBoardSettings(prev => ({ ...prev, upvote_require_email_verification: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="upvote_require_verification" className="text-sm text-gray-700 dark:text-gray-300">
                        {i18n.kanbanBoard?.featureBoard?.requireVerificationLabel || 'Require email verification before counting upvote'}
                      </label>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="show_upvote_count"
                      checked={featureBoardSettings.show_upvote_count}
                      onChange={(e) => setFeatureBoardSettings(prev => ({ ...prev, show_upvote_count: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="show_upvote_count" className="text-sm text-gray-700 dark:text-gray-300">
                      {i18n.kanbanBoard?.featureBoard?.showUpvoteCountLabel || 'Show upvote count on items'}
                    </label>
                  </div>

                  {/* Anonymous Upvote Protection - only shown when upvote_mode is 'anyone' */}
                  {featureBoardSettings.upvote_mode === 'anyone' && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-3">
                        {i18n.kanbanBoard?.featureBoard?.anonUpvoteProtection || 'Anonymous Upvote Protection'}
                      </h5>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                        {i18n.kanbanBoard?.featureBoard?.anonUpvoteProtectionDesc || 'Prevent users from upvoting multiple times without logging in.'}
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="upvote_anon_check_localstorage"
                            checked={featureBoardSettings.upvote_anon_check_localstorage}
                            onChange={(e) => setFeatureBoardSettings(prev => ({ ...prev, upvote_anon_check_localstorage: e.target.checked }))}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="upvote_anon_check_localstorage" className="text-sm text-yellow-800 dark:text-yellow-200">
                            {i18n.kanbanBoard?.featureBoard?.localStorageCheckLabel || 'Browser storage check (localStorage)'}
                          </label>
                        </div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 ml-6">
                          {i18n.kanbanBoard?.featureBoard?.localStorageCheckDesc || 'Remembers upvotes in the browser. Can be bypassed by clearing browser data or using incognito mode.'}
                        </p>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="upvote_anon_check_ip"
                            checked={featureBoardSettings.upvote_anon_check_ip}
                            onChange={(e) => setFeatureBoardSettings(prev => ({ ...prev, upvote_anon_check_ip: e.target.checked }))}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="upvote_anon_check_ip" className="text-sm text-yellow-800 dark:text-yellow-200">
                            {i18n.kanbanBoard?.featureBoard?.ipCheckLabel || 'IP address check (server-side)'}
                          </label>
                        </div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 ml-6">
                          {i18n.kanbanBoard?.featureBoard?.ipCheckDesc || 'Stores hashed IP addresses to prevent duplicate upvotes. More reliable than browser storage.'}
                        </p>
                        <div className="ml-6 p-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded text-xs text-orange-800 dark:text-orange-200">
                          <strong>{i18n.kanbanBoard?.featureBoard?.gdprNotice || 'GDPR Notice:'}</strong>{' '}
                          {i18n.kanbanBoard?.featureBoard?.gdprNoticeText || 'Even hashed IP addresses may be considered personal data under GDPR. Ensure you have appropriate consent mechanisms and privacy policy disclosures if enabling this option for EU visitors.'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comment Settings */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  {i18n.kanbanBoard?.featureBoard?.commentSettings || 'Comment Settings'}
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {i18n.kanbanBoard?.featureBoard?.commentModeLabel || 'Who can comment?'}
                    </label>
                    <select
                      value={featureBoardSettings.comments_mode}
                      onChange={(e) => setFeatureBoardSettings(prev => ({ ...prev, comments_mode: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="anyone">{i18n.kanbanBoard?.featureBoard?.commentModeAnyone || 'Anyone (no login required)'}</option>
                      <option value="logged_in">{i18n.kanbanBoard?.featureBoard?.commentModeLoggedIn || 'Logged-in users only'}</option>
                      <option value="disabled">{i18n.kanbanBoard?.featureBoard?.commentModeDisabled || 'Comments disabled'}</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="show_comment_count"
                      checked={featureBoardSettings.show_comment_count}
                      onChange={(e) => setFeatureBoardSettings(prev => ({ ...prev, show_comment_count: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="show_comment_count" className="text-sm text-gray-700 dark:text-gray-300">
                      {i18n.kanbanBoard?.featureBoard?.showCommentCountLabel || 'Show comment count on items'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Idea Submission Settings */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  {i18n.kanbanBoard?.featureBoard?.ideaSubmissionSettings || 'Idea Submission Settings'}
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="idea_submission_enabled"
                      checked={featureBoardSettings.idea_submission_enabled}
                      onChange={(e) => setFeatureBoardSettings(prev => ({ ...prev, idea_submission_enabled: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="idea_submission_enabled" className="text-sm text-gray-700 dark:text-gray-300">
                      {i18n.kanbanBoard?.featureBoard?.enableIdeaSubmission || 'Allow visitors to submit new ideas'}
                    </label>
                  </div>

                  {featureBoardSettings.idea_submission_enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {i18n.kanbanBoard?.featureBoard?.ideaSubmissionModeLabel || 'Who can submit ideas?'}
                        </label>
                        <select
                          value={featureBoardSettings.idea_submission_mode}
                          onChange={(e) => setFeatureBoardSettings(prev => ({ ...prev, idea_submission_mode: e.target.value }))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="anyone">{i18n.kanbanBoard?.featureBoard?.ideaModeAnyone || 'Anyone (no login required)'}</option>
                          <option value="logged_in">{i18n.kanbanBoard?.featureBoard?.ideaModeLoggedIn || 'Logged-in users only'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {i18n.kanbanBoard?.featureBoard?.defaultColumnLabel || 'Default column for new ideas'}
                        </label>
                        <select
                          value={featureBoardSettings.idea_default_column}
                          onChange={(e) => setFeatureBoardSettings(prev => ({ ...prev, idea_default_column: e.target.value }))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">{i18n.kanbanBoard?.featureBoard?.selectColumn || 'Select a column...'}</option>
                          {board.map(column => (
                            <option key={column.id} value={column.id}>{column.title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="idea_moderation_enabled"
                          checked={featureBoardSettings.idea_moderation_enabled}
                          onChange={(e) => setFeatureBoardSettings(prev => ({ ...prev, idea_moderation_enabled: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="idea_moderation_enabled" className="text-sm text-gray-700 dark:text-gray-300">
                          {i18n.kanbanBoard?.featureBoard?.enableModerationLabel || 'Require admin approval before publishing ideas'}
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Idea Submissions Modal */}
      <Modal
        isOpen={showIdeaSubmissionsModal}
        onClose={() => setShowIdeaSubmissionsModal(false)}
        title={i18n.kanbanBoard?.featureBoard?.ideaSubmissionsTitle || 'Idea Submissions'}
        size="lg"
      >
        <div className="space-y-4">
          {loadingIdeaSubmissions ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : ideaSubmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {i18n.kanbanBoard?.featureBoard?.noIdeas || 'No pending idea submissions'}
            </div>
          ) : (
            <div className="space-y-4">
              {ideaSubmissions.map(idea => (
                <div key={idea.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">{idea.title}</h4>
                      {idea.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{idea.description}</p>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <span>{i18n.kanbanBoard?.featureBoard?.submittedBy || 'Submitted by'}: {idea.user_name || idea.user_email}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(idea.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => approveIdea(idea.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        {i18n.kanbanBoard?.featureBoard?.approveButton || 'Approve'}
                      </button>
                      <button
                        onClick={() => rejectIdea(idea.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        {i18n.kanbanBoard?.featureBoard?.rejectButton || 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Column Sync Settings Modal */}
      <Modal
        isOpen={showColumnSyncModal}
        onClose={() => setShowColumnSyncModal(false)}
        title={i18n.kanbanBoard?.columnSync?.settingsTitle || 'Column Sync Settings'}
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowColumnSyncModal(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              {i18n.kanbanBoard?.modals?.cancelButton || 'Cancel'}
            </button>
            <button
              onClick={saveColumnSyncSettings}
              disabled={savingColumnSyncSettings}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {savingColumnSyncSettings
                ? (i18n.kanbanBoard?.columnSync?.saving || 'Saving...')
                : (i18n.kanbanBoard?.columnSync?.saveButton || 'Save Settings')
              }
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Enable Column Sync */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {i18n.kanbanBoard?.columnSync?.enableLabel || 'Enable Column Sync'}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {i18n.kanbanBoard?.columnSync?.enableDescription || 'Automatically move items between columns based on their state'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={columnSyncSettings.enabled}
                onChange={(e) => setColumnSyncSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {columnSyncSettings.enabled && (
            <>
              {/* Info message */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {i18n.kanbanBoard?.columnSync?.infoMessage || 'When enabled, checking/unchecking items will automatically move them to the configured columns.'}
                </p>
              </div>

              {/* Done Column */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {i18n.kanbanBoard?.columnSync?.doneColumnLabel || 'Done Column'}
                  </h4>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {i18n.kanbanBoard?.columnSync?.doneColumnDescription || 'Items will move to this column when checked off'}
                </p>
                <select
                  value={columnSyncSettings.done_column}
                  onChange={(e) => setColumnSyncSettings(prev => ({ ...prev, done_column: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">{i18n.kanbanBoard?.columnSync?.selectColumn || 'Select a column...'}</option>
                  {board.map(column => (
                    <option key={column.id} value={column.id}>{column.title}</option>
                  ))}
                </select>
              </div>

              {/* To Do Column */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {i18n.kanbanBoard?.columnSync?.todoColumnLabel || 'To Do Column'}
                  </h4>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {i18n.kanbanBoard?.columnSync?.todoColumnDescription || 'Items will move to this column when unchecked'}
                </p>
                <select
                  value={columnSyncSettings.todo_column}
                  onChange={(e) => setColumnSyncSettings(prev => ({ ...prev, todo_column: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">{i18n.kanbanBoard?.columnSync?.selectColumn || 'Select a column...'}</option>
                  {board.map(column => (
                    <option key={column.id} value={column.id}>{column.title}</option>
                  ))}
                </select>
              </div>

              {/* In Progress Column (for future use) */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {i18n.kanbanBoard?.columnSync?.inProgressColumnLabel || 'In Progress Column'}
                  </h4>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {i18n.kanbanBoard?.columnSync?.inProgressColumnDescription || 'Items will move to this column when marked as in progress'}
                </p>
                <select
                  value={columnSyncSettings.in_progress_column}
                  onChange={(e) => setColumnSyncSettings(prev => ({ ...prev, in_progress_column: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">{i18n.kanbanBoard?.columnSync?.selectColumn || 'Select a column...'}</option>
                  {board.map(column => (
                    <option key={column.id} value={column.id}>{column.title}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Deadline Modal */}
      <DeadlineModal
        isOpen={showDeadlineModal}
        onClose={() => {
          setShowDeadlineModal(false)
          setDeadlineModalItem(null)
          setDeadlineModalColumnId(null)
        }}
        onSave={saveItemDeadline}
        currentDeadline={deadlineModalItem?.deadline}
      />
    </div>
  )
}

export default KanbanBoard