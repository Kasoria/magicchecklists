import React, { useState, useEffect, useRef } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
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

// Deadline Modal Component with inline styles
const DeadlineModal = ({ isOpen, onClose, onSave, currentDeadline }) => {
  const [dateTime, setDateTime] = useState('')

  useEffect(() => {
    if (isOpen && currentDeadline) {
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
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        padding: '24px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          Set Item Deadline
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Deadline Date & Time
          </label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <p style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            Leave empty to remove deadline
          </p>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => { onSave(null); onClose() }}
            disabled={!currentDeadline}
            style={{
              padding: '8px 16px',
              backgroundColor: currentDeadline ? '#fef2f2' : '#f3f4f6',
              color: currentDeadline ? '#dc2626' : '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: currentDeadline ? 'pointer' : 'not-allowed',
              opacity: currentDeadline ? 1 : 0.5
            }}
          >
            Clear Deadline
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Comment component for threaded display with inline styles
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
    <div style={{
      marginLeft: level > 0 ? '24px' : '0',
      borderLeft: level > 0 ? '2px solid #e5e7eb' : 'none',
      paddingLeft: level > 0 ? '16px' : '0',
      marginBottom: '16px'
    }}>
      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'start',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {comment.user_name ? comment.user_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <span style={{
                fontWeight: '500',
                color: '#1f2937',
                fontSize: '14px'
              }}>
                {comment.user_name || 'Anonymous'}
              </span>
              <span style={{
                fontSize: '12px',
                color: '#6b7280',
                marginLeft: '8px'
              }}>
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => onDelete(comment.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              title={i18n.comment?.deleteTitle || "Delete comment"}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        <div style={{
          color: '#374151',
          fontSize: '14px',
          marginBottom: '12px'
        }}
          dangerouslySetInnerHTML={{ __html: comment.comment_content?.replace(/\\'/g, "'").replace(/\\"/g, '"') || '' }}
        />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '12px'
        }}>
          <button
            onClick={() => onLike(comment.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              color: comment.user_liked ? '#ef4444' : '#6b7280',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <span>{comment.user_liked ? '❤️' : '🤍'}</span>
            <span>{comment.like_count || 0}</span>
          </button>

          {level === 0 && (
            <button
              onClick={handleShowReplyForm}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#374151'}
              onMouseLeave={(e) => e.target.style.color = '#6b7280'}
            >
              {i18n.comment?.replyButton || 'Reply'}
            </button>
          )}
        </div>

        {showReplyForm && (
          <div ref={replyFormRef} style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <textarea
              ref={replyInputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={i18n.comment?.replyPlaceholder || "Write a reply..."}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none'
              }}
              rows={2}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px',
              marginTop: '8px'
            }}>
              <button
                onClick={() => setShowReplyForm(false)}
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                {i18n.comment?.cancelButton || 'Cancel'}
              </button>
              <button
                onClick={handleReply}
                style={{
                  fontSize: '12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                {i18n.comment?.replySubmitButton || 'Reply'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: '12px' }}>
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

// Confirmation Modal component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, items = [] }) => {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '28rem',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          {title}
        </h3>
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          {message}
        </p>
        {items.length > 0 && (
          <ul style={{
            listStyle: 'disc',
            paddingLeft: '20px',
            marginBottom: '16px',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Simple Modal component with inline styles for frontend compatibility
const Modal = ({ isOpen, onClose, title, children, footer, size = "md" }) => {
  if (!isOpen) return null

  const sizeMap = {
    sm: '28rem',
    md: '28rem',
    lg: '42rem',
    xl: '56rem'
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: sizeMap[size],
          marginTop: '32px',
          marginBottom: '32px',
          maxHeight: 'calc(100vh - 4rem)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 10,
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.target.style.color = '#6b7280'}
            onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '16px',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 12rem)',
          flex: 1
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '16px',
            borderTop: '1px solid #e5e7eb',
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'white',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px'
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

const ShortcodeKanbanView = ({
  checklistId,
  items = [],
  permissions = {},
  settings = {},
  checklist = {}
}) => {
  const [i18n, setI18n] = useState({})
  const [board, setBoard] = useState([])
  const [users, setUsers] = useState([])
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [editingColumn, setEditingColumn] = useState(null)
  const [columnTitle, setColumnTitle] = useState('')
  const [columnColor, setColumnColor] = useState('#3B82F6')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [columnToDelete, setColumnToDelete] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskContent, setTaskContent] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningItem, setAssigningItem] = useState(null)
  const [selectedUser, setSelectedUser] = useState('')
  const [taskComments, setTaskComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
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

  // Deadline modal state
  const [showDeadlineModal, setShowDeadlineModal] = useState(false)
  const [deadlineModalItem, setDeadlineModalItem] = useState(null)
  const [deadlineModalColumnId, setDeadlineModalColumnId] = useState(null)

  // Feature board state
  const [featureBoardSettings, setFeatureBoardSettings] = useState({
    enabled: false,
    upvote_mode: 'logged_in',
    upvote_require_email_verification: false,
    upvote_anon_check_localstorage: true,
    upvote_anon_check_ip: false,
    comments_mode: 'logged_in',
    idea_submission_enabled: false,
    idea_submission_mode: 'logged_in',
    idea_default_column: 'col_todo',
    idea_moderation_enabled: true,
    show_upvote_count: true,
    show_comment_count: true
  })

  // Column sync settings state
  const [columnSyncSettings, setColumnSyncSettings] = useState({
    enabled: false,
    done_column: '',
    in_progress_column: '',
    todo_column: ''
  })

  const [localUpvotes, setLocalUpvotes] = useState({}) // Track upvotes in localStorage
  const [itemUpvotes, setItemUpvotes] = useState({})
  const [showIdeaModal, setShowIdeaModal] = useState(false)
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaDescription, setIdeaDescription] = useState('')
  const [showEmailPrompt, setShowEmailPrompt] = useState(false)
  const [emailPromptType, setEmailPromptType] = useState(null) // 'upvote' or 'idea'
  const [pendingUpvoteItem, setPendingUpvoteItem] = useState(null)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [submittingIdea, setSubmittingIdea] = useState(false)
  const [ideaMessage, setIdeaMessage] = useState(null)

  // Initialize i18n
  useEffect(() => {
    if (window.magiccl_checklists && window.magiccl_checklists.i18n && window.magiccl_checklists.i18n.kanbanBoard) {
      setI18n(window.magiccl_checklists.i18n.kanbanBoard)
    }
  }, [])

  // Load kanban board structure
  useEffect(() => {
    loadKanbanBoard()
    loadFeatureBoardSettings()
    loadColumnSyncSettings()
  }, [checklistId])

  // Listen for checklist data changes from other views (drawer, admin kanban, etc.)
  useEffect(() => {
    const handleChecklistDataChanged = (event) => {
      const { checklistId: changedChecklistId, action, source } = event.detail || {}

      // Only reload if this is the current checklist and the change came from another source
      if (changedChecklistId && String(changedChecklistId) === String(checklistId) && source !== 'shortcode_kanban') {
        loadKanbanBoard()
      }
    }

    window.addEventListener('magicclChecklistDataChanged', handleChecklistDataChanged)

    return () => {
      window.removeEventListener('magicclChecklistDataChanged', handleChecklistDataChanged)
    }
  }, [checklistId])

  // Load upvotes when board is loaded
  useEffect(() => {
    if (board.length > 0 && featureBoardSettings.enabled) {
      loadItemUpvotes()
    }
  }, [board, featureBoardSettings.enabled])

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
    try {
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      // Fetch column sync settings first to ensure we have the latest
      let syncSettings = columnSyncSettings
      try {
        const syncResponse = await fetch(ajaxUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            action: 'magiccl_get_column_sync_settings',
            checklist_id: checklistId,
            nonce: nonce
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

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_get_kanban_board',
          checklist_id: checklistId,
          nonce: nonce,
          context: 'shortcode'
        })
      })

      const data = await response.json()
      if (data.success && data.data.board) {
        // Apply column sync if enabled to ensure items are in correct columns
        const syncedBoard = applyColumnSyncToBoard(data.data.board, syncSettings)
        setBoard(syncedBoard)
        setUsers(data.data.users || [])
      } else {
        // If no board structure exists, create a default one
        createDefaultBoard()
      }
    } catch (error) {
      console.error('Error loading Kanban board:', error)
      createDefaultBoard()
    }
  }

  const createDefaultBoard = () => {
    // Create a simple 3-column board with all items in the first column
    const defaultBoard = [
      {
        id: 'col_todo',
        title: i18n.defaultColumns?.todo || 'To Do',
        color: '#ef4444',
        items: items.map(item => ({
          id: item.id,
          title: item.content,
          checked: item.checked || false,
          inProgress: item.inProgress || false
        }))
      },
      {
        id: 'col_inprogress',
        title: i18n.defaultColumns?.inProgress || 'In Progress',
        color: '#f59e0b',
        items: []
      },
      {
        id: 'col_done',
        title: i18n.defaultColumns?.done || 'Done',
        color: '#22c55e',
        items: []
      }
    ]
    // Apply column sync if enabled
    const syncedBoard = applyColumnSyncToBoard(defaultBoard, columnSyncSettings)
    setBoard(syncedBoard)
  }

  // Feature board functions
  const loadFeatureBoardSettings = async () => {
    try {
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_get_feature_board_settings',
          checklist_id: checklistId,
          nonce: nonce
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

  // Column sync settings functions
  const loadColumnSyncSettings = async () => {
    try {
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_get_column_sync_settings',
          checklist_id: checklistId,
          nonce: nonce
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

  // localStorage helpers for anonymous upvote tracking
  const getLocalStorageKey = () => `magiccl_upvotes_${checklistId}`

  const loadLocalUpvotes = () => {
    try {
      const stored = localStorage.getItem(getLocalStorageKey())
      if (stored) {
        setLocalUpvotes(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading local upvotes:', error)
    }
  }

  const saveLocalUpvote = (itemId) => {
    try {
      const updated = { ...localUpvotes, [itemId]: true }
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(updated))
      setLocalUpvotes(updated)
    } catch (error) {
      console.error('Error saving local upvote:', error)
    }
  }

  const removeLocalUpvote = (itemId) => {
    try {
      const updated = { ...localUpvotes }
      delete updated[itemId]
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(updated))
      setLocalUpvotes(updated)
    } catch (error) {
      console.error('Error removing local upvote:', error)
    }
  }

  const hasLocalUpvote = (itemId) => {
    return !!localUpvotes[itemId]
  }

  // Check if item is upvoted (combines server state + localStorage for anonymous users)
  const isItemUpvoted = (itemId) => {
    // First check server-provided state
    if (itemUpvotes[itemId]?.user_upvoted) {
      return true
    }
    // For anonymous users with localStorage check enabled, also check localStorage
    const isLoggedIn = window.magiccl_checklists?.user_access?.is_logged_in || false
    if (!isLoggedIn && featureBoardSettings.upvote_mode === 'anyone' && featureBoardSettings.upvote_anon_check_localstorage) {
      return hasLocalUpvote(itemId)
    }
    return false
  }

  // Load localStorage upvotes on mount
  useEffect(() => {
    loadLocalUpvotes()
  }, [checklistId])

  const loadItemUpvotes = async () => {
    try {
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      // Collect all item IDs from board
      const itemIds = []
      board.forEach(column => {
        column.items?.forEach(item => {
          itemIds.push(item.id)
        })
      })

      if (itemIds.length === 0) return

      // Use FormData to properly send array of item IDs
      const formData = new FormData()
      formData.append('action', 'magiccl_get_item_upvotes')
      formData.append('checklist_id', checklistId)
      formData.append('nonce', nonce)
      // Append each item ID separately to create proper array in PHP
      itemIds.forEach(id => {
        formData.append('item_ids[]', id)
      })

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success && data.data.upvotes) {
        setItemUpvotes(data.data.upvotes)
      }
    } catch (error) {
      console.error('Error loading item upvotes:', error)
    }
  }

  const handleUpvote = async (itemId) => {
    const isLoggedIn = window.magiccl_checklists?.user_access?.is_logged_in || false
    const upvoteMode = featureBoardSettings.upvote_mode

    // Check if login is required
    if (upvoteMode === 'logged_in' && !isLoggedIn) {
      setEmailPromptType('login_required')
      setShowEmailPrompt(true)
      return
    }

    // Check if email verification is required for anonymous upvote
    if (!isLoggedIn && upvoteMode === 'email_verified') {
      setPendingUpvoteItem(itemId)
      setEmailPromptType('upvote')
      setShowEmailPrompt(true)
      return
    }

    // For 'anyone' mode, check localStorage if enabled (and user is not logged in)
    if (!isLoggedIn && upvoteMode === 'anyone' && featureBoardSettings.upvote_anon_check_localstorage) {
      if (hasLocalUpvote(itemId)) {
        // User already upvoted this item - toggle off (remove upvote)
        await submitUpvote(itemId)
        return
      }
    }

    // Mode is 'anyone' or user is logged in - proceed directly
    await submitUpvote(itemId)
  }

  const submitUpvote = async (itemId, email = '', name = '') => {
    try {
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_toggle_item_upvote',
          checklist_id: checklistId,
          item_id: itemId,
          user_email: email,
          user_name: name,
          nonce: nonce
        })
      })

      const data = await response.json()
      if (data.success) {
        if (data.data.action === 'pending_verification') {
          setIdeaMessage({ type: 'info', text: data.data.message || i18n.featureBoard?.emailVerificationSent || 'Please check your email to verify your upvote' })
        } else {
          // Update local upvote state
          setItemUpvotes(prev => ({
            ...prev,
            [itemId]: {
              count: data.data.upvote_count,
              user_upvoted: data.data.user_upvoted
            }
          }))

          // Update localStorage for anonymous users if localStorage check is enabled
          const isLoggedIn = window.magiccl_checklists?.user_access?.is_logged_in || false
          if (!isLoggedIn && featureBoardSettings.upvote_mode === 'anyone' && featureBoardSettings.upvote_anon_check_localstorage) {
            if (data.data.action === 'added') {
              saveLocalUpvote(itemId)
            } else if (data.data.action === 'removed') {
              removeLocalUpvote(itemId)
            }
          }
        }
        setShowEmailPrompt(false)
        setPendingUpvoteItem(null)
        setUserEmail('')
        setUserName('')
      } else {
        if (data.data?.require_login) {
          setEmailPromptType('login_required')
          setShowEmailPrompt(true)
        } else if (data.data?.require_email) {
          setPendingUpvoteItem(itemId)
          setEmailPromptType('upvote')
          setShowEmailPrompt(true)
        } else {
          console.error('Error upvoting:', data.data?.message)
        }
      }
    } catch (error) {
      console.error('Error submitting upvote:', error)
    }
  }

  const handleEmailPromptSubmit = () => {
    if (!userEmail.trim()) {
      return
    }

    if (emailPromptType === 'upvote' && pendingUpvoteItem) {
      submitUpvote(pendingUpvoteItem, userEmail, userName)
    } else if (emailPromptType === 'idea') {
      submitIdea()
    }
  }

  const openIdeaModal = () => {
    const isLoggedIn = window.magiccl_checklists?.user_access?.is_logged_in || false
    const submissionMode = featureBoardSettings.idea_submission_mode

    if (submissionMode === 'logged_in' && !isLoggedIn) {
      setEmailPromptType('login_required')
      setShowEmailPrompt(true)
      return
    }

    setShowIdeaModal(true)
    setIdeaTitle('')
    setIdeaDescription('')
    setIdeaMessage(null)
  }

  const submitIdea = async () => {
    if (!ideaTitle.trim()) return

    const isLoggedIn = window.magiccl_checklists?.user_access?.is_logged_in || false
    const submissionMode = featureBoardSettings.idea_submission_mode

    // Check if email verification is required for anonymous submission
    if (!isLoggedIn && submissionMode === 'email_verified' && !userEmail.trim()) {
      setEmailPromptType('idea')
      setShowEmailPrompt(true)
      return
    }

    setSubmittingIdea(true)

    try {
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_submit_idea',
          checklist_id: checklistId,
          title: ideaTitle,
          description: ideaDescription,
          user_email: userEmail,
          user_name: userName,
          nonce: nonce
        })
      })

      const data = await response.json()
      if (data.success) {
        setIdeaMessage({ type: 'success', text: data.data.message })
        setIdeaTitle('')
        setIdeaDescription('')
        setUserEmail('')
        setUserName('')

        // Reload board if idea was auto-approved
        if (data.data.status === 'approved') {
          loadKanbanBoard()
        }

        // Close modal after showing message
        setTimeout(() => {
          setShowIdeaModal(false)
          setShowEmailPrompt(false)
          setIdeaMessage(null)
        }, 3000)
      } else {
        if (data.data?.require_login) {
          setShowIdeaModal(false)
          setEmailPromptType('login_required')
          setShowEmailPrompt(true)
        } else if (data.data?.require_email) {
          setEmailPromptType('idea')
          setShowEmailPrompt(true)
        } else {
          setIdeaMessage({ type: 'error', text: data.data?.message || 'Failed to submit idea' })
        }
      }
    } catch (error) {
      console.error('Error submitting idea:', error)
      setIdeaMessage({ type: 'error', text: 'Failed to submit idea' })
    } finally {
      setSubmittingIdea(false)
    }
  }

  // Drag and Drop handlers
  const handleDragStart = (e, item, columnId) => {
    if (!permissions.can_interact) return
    setDraggedItem({ ...item, sourceColumn: columnId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, columnId) => {
    if (!permissions.can_interact) return
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedItem || draggedItem.sourceColumn === targetColumnId || !permissions.can_interact) {
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

    // Save to server
    await saveKanbanBoard(newBoard)
    setDraggedItem(null)

    // Dispatch event to notify other views that item was moved
    window.dispatchEvent(new CustomEvent('magicclChecklistDataChanged', {
      detail: {
        checklistId: checklistId,
        action: 'item_moved',
        itemId: draggedItem.id,
        source: 'shortcode_kanban'
      }
    }))
  }

  // Column management
  const openColumnModal = (column = null) => {
    if (!permissions.can_edit) return
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
    if (!columnTitle.trim() || !permissions.can_edit) return

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
        items: []
      }
      updatedColumns = [...board, newColumn]
    }

    setBoard(updatedColumns)
    closeColumnModal()
    await saveKanbanBoard(updatedColumns)
  }

  const deleteColumn = async () => {
    if (!columnToDelete || !permissions.can_edit) return

    const updatedColumns = board.filter(col => col.id !== columnToDelete.id)
    setBoard(updatedColumns)
    setShowDeleteConfirm(false)
    setColumnToDelete(null)
    await saveKanbanBoard(updatedColumns)
  }

  // Task editing
  const openTaskModal = (item, columnId) => {
    setEditingTask({ ...item, columnId })
    setTaskContent(item.title || '')
    loadTaskComments(item.id)
    setShowTaskModal(true)
  }

  const closeTaskModal = () => {
    setShowTaskModal(false)
    setEditingTask(null)
    setTaskContent('')
    setTaskComments([])
    setNewComment('')
  }

  const saveTask = async () => {
    if (!permissions.can_edit || !editingTask) return

    const contentFromEditor = contentEditableRef.current?.innerHTML || taskContent
    if (!contentFromEditor.trim()) return

    const newBoard = board.map(column => {
      if (column.id === editingTask.columnId) {
        return {
          ...column,
          items: column.items.map(item =>
            item.id === editingTask.id
              ? { ...item, title: contentFromEditor.trim() }
              : item
          )
        }
      }
      return column
    })

    setBoard(newBoard)
    await saveKanbanBoard(newBoard)

    // Dispatch event to notify other views that item content changed
    window.dispatchEvent(new CustomEvent('magicclChecklistDataChanged', {
      detail: {
        checklistId: checklistId,
        action: 'item_updated',
        itemId: editingTask.id,
        source: 'shortcode_kanban'
      }
    }))

    closeTaskModal()
  }

  const toggleItemCheck = async (item, columnId) => {
    if (!permissions.can_interact) return

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

    // Update board - update checked state and move if needed
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
            items: column.items.map(boardItem =>
              boardItem.id === item.id
                ? { ...boardItem, checked: newCheckedState }
                : boardItem
            )
          }
        }
        return column
      })
    }

    setBoard(newBoard)
    await saveKanbanBoard(newBoard)

    // Dispatch event to notify other views
    window.dispatchEvent(new CustomEvent('magicclChecklistDataChanged', {
      detail: {
        checklistId: checklistId,
        action: shouldMoveColumn ? 'item_checked_and_moved' : 'item_checked',
        itemId: item.id,
        source: 'shortcode_kanban'
      }
    }))
  }

  const saveKanbanBoard = async (boardData) => {
    try {
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_save_kanban_board',
          checklist_id: checklistId,
          board: JSON.stringify(boardData),
          nonce: nonce,
          context: 'shortcode'
        })
      })

      const data = await response.json()
      if (!data.success) {
        console.warn('Error saving kanban board:', data)
      }
    } catch (error) {
      console.error('Failed to save kanban board:', error)
    }
  }

  // Cycle through priority levels
  const cyclePriority = async (item, columnId) => {
    if (!permissions.can_edit) return

    const priorities = ['none', 'low', 'medium', 'high', 'critical']
    const currentIndex = priorities.indexOf(item.priority || 'none')
    const nextPriority = priorities[(currentIndex + 1) % priorities.length]

    // Update board state
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
    await saveKanbanBoard(newBoard)
  }

  // Handle deadline click - open modal
  const handleDeadlineClick = (item, columnId) => {
    if (!permissions.can_edit) return
    setDeadlineModalItem(item)
    setDeadlineModalColumnId(columnId)
    setShowDeadlineModal(true)
  }

  // Save item deadline
  const saveItemDeadline = async (timestamp) => {
    if (!deadlineModalItem) return

    const itemId = deadlineModalItem.id
    const columnId = deadlineModalColumnId

    // Update board state
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
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      const formData = new FormData()
      formData.append('action', 'magiccl_save_item_deadline')
      formData.append('checklist_id', checklistId)
      formData.append('item_id', itemId)
      formData.append('deadline', timestamp || '')
      formData.append('nonce', nonce)

      await fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })
    } catch (error) {
      console.error('Error saving deadline:', error)
    }

    // Close modal
    setShowDeadlineModal(false)
    setDeadlineModalItem(null)
    setDeadlineModalColumnId(null)
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = (e.clipboardData || window.clipboardData).getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value)
  }

  // Image management functions
  const handleAddImage = () => {
    if (!permissions.can_edit) return
    setImageError(null)

    // Check if user is logged in and can use media library
    const isLoggedIn = window.magiccl_checklists?.user_access?.is_logged_in || false

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
      title: i18n.modals?.selectImage || 'Select Image',
      library: { type: 'image' },
      multiple: false,
      button: { text: i18n.modals?.insertImage || 'Insert Image' }
    })

    mediaFrame.on('select', () => {
      const attachment = mediaFrame.state().get('selection').first().toJSON()
      insertImageIntoEditor(attachment)
      closeImageModal()
    })

    mediaFrame.open()
  }

  const loadExistingImages = async () => {
    if (!checklistId) return
    setLoadingImages(true)
    try {
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      const formData = new FormData()
      formData.append('action', 'magiccl_get_uploaded_images')
      formData.append('checklist_id', checklistId)
      if (nonce) {
        formData.append('nonce', nonce)
      }

      const response = await fetch(ajaxUrl, {
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
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      const formData = new FormData()
      formData.append('action', 'magiccl_upload_image')
      formData.append('file', file)
      formData.append('checklist_id', checklistId || 0)
      if (nonce) {
        formData.append('nonce', nonce)
      }

      const response = await fetch(ajaxUrl, {
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
        setImageError(result.data?.message || i18n.errors?.uploadFailed || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setImageError(i18n.errors?.uploadFailed || 'Upload failed. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const insertImageIntoEditor = (imageData) => {
    if (!contentEditableRef.current) return

    // Focus the editor first to ensure cursor position
    contentEditableRef.current.focus()

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
      setImageError(i18n.errors?.invalidFileType || 'Invalid file type. Please upload a JPG, PNG, or GIF image.')
      return
    }

    if (selectedFile.size > maxSize) {
      setImageError(i18n.errors?.fileTooLarge || 'File is too large. Maximum size is 10MB.')
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

  // User assignment
  const openAssignModal = (item, columnId) => {
    if (!permissions.can_edit) return
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
    await saveKanbanBoard(newBoard)
  }

  // Comments system
  const loadTaskComments = async (itemId) => {
    // Strip ALL non-numeric characters to get unique ID (e.g., "item_123_1" -> "1231")
    const numericId = itemId.toString().replace(/\D/g, '')
    const itemIdInt = parseInt(numericId, 10)
    const checklistIdInt = parseInt(checklistId, 10)

    if (!checklistId || !itemId || isNaN(checklistIdInt) || isNaN(itemIdInt)) {
      setTaskComments([])
      return
    }

    setLoadingComments(true)
    try {
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_get_threaded_comments',
          checklist_id: checklistIdInt,
          item_id: itemIdInt,
          nonce: nonce
        })
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

  const addComment = async () => {
    if (!newComment.trim() || !editingTask) return

    // Strip ALL non-numeric characters to get unique ID (e.g., "item_123_1" -> "1231")
    const numericId = editingTask.id.toString().replace(/\D/g, '')
    const itemIdInt = parseInt(numericId, 10)

    try {
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_add_threaded_comment',
          checklist_id: checklistId,
          item_id: itemIdInt,
          parent_id: '',
          comment_content: newComment,
          nonce: nonce
        })
      })

      const data = await response.json()
      if (data.success) {
        await loadTaskComments(editingTask.id)
        loadKanbanBoard() // Reload to update comment counts
        setNewComment('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const addReply = async (parentId, replyText) => {
    if (!replyText.trim() || !editingTask) return

    // Strip ALL non-numeric characters to get unique ID (e.g., "item_123_1" -> "1231")
    const numericId = editingTask.id.toString().replace(/\D/g, '')
    const itemIdInt = parseInt(numericId, 10)

    try {
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_add_threaded_comment',
          checklist_id: checklistId,
          item_id: itemIdInt,
          parent_id: parentId,
          comment_content: replyText,
          nonce: nonce
        })
      })

      const data = await response.json()
      if (data.success) {
        await loadTaskComments(editingTask.id)
        loadKanbanBoard() // Reload to update comment counts
      }
    } catch (error) {
      console.error('Error adding reply:', error)
    }
  }

  const toggleCommentLike = async (commentId) => {
    try {
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_toggle_comment_like',
          comment_id: commentId,
          nonce: nonce
        })
      })

      const data = await response.json()
      if (data.success) {
        setTaskComments(prevComments =>
          updateCommentLikes(prevComments, commentId, data.data.like_count, data.data.user_liked)
        )
      }
    } catch (error) {
      console.error('Error toggling like:', error)
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
    if (!confirm(i18n.confirm?.deleteComment || 'Are you sure you want to delete this comment and all its replies?')) {
      return
    }

    try {
      const ajaxUrl = window.magiccl_checklists?.ajax_url || '/wp-admin/admin-ajax.php'
      const nonce = window.magiccl_checklists?.nonce || ''

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_delete_threaded_comment',
          comment_id: commentId,
          nonce: nonce
        })
      })

      const data = await response.json()
      if (data.success) {
        await loadTaskComments(editingTask.id)
        loadKanbanBoard() // Reload to update comment counts
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  return (
    <div className="magiccl-kanban-shortcode" style={{
      padding: '20px',
      backgroundColor: settings.bg_color || '#f9fafb',
      borderRadius: '8px'
    }}>
      {/* CSS for proper line-break rendering in kanban items */}
      <style>{`
        .magiccl-kanban-item-content div {
          display: block !important;
        }
        .magiccl-kanban-item-content p {
          display: block !important;
          margin: 0;
        }
        .magiccl-kanban-item-content br {
          display: block !important;
          content: "" !important;
        }
        .magiccl-kanban-item-content img {
          display: block !important;
          max-width: 100% !important;
          height: auto !important;
          margin: 8px 0 !important;
        }
      `}</style>

      {/* Header */}
      {settings.show_title && checklist.title && (
        <h3 style={{
          fontSize: settings.title_font_size ? `${settings.title_font_size}px` : '24px',
          color: settings.title_text_color || '#1f2937',
          marginBottom: '12px',
          fontWeight: '600'
        }}>
          {checklist.title}
        </h3>
      )}

      {settings.show_description && checklist.content && (
        <div
          style={{
            fontSize: settings.description_font_size ? `${settings.description_font_size}px` : '14px',
            color: settings.description_text_color || '#6b7280',
            marginBottom: '16px'
          }}
          dangerouslySetInnerHTML={{ __html: checklist.content }}
        />
      )}

      {/* Add Column Button and Submit Idea Button */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {permissions.can_edit && (
          <button
            onClick={() => openColumnModal()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            <span style={{ fontSize: '18px' }}>+</span>
            {i18n.header?.addColumnButton || 'Add Column'}
          </button>
        )}

        {/* Submit Idea Button - Feature Board */}
        {featureBoardSettings.enabled && featureBoardSettings.idea_submission_enabled && (
          <button
            onClick={openIdeaModal}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {i18n.featureBoard?.submitIdeaButton || 'Submit Idea'}
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start',
        overflowX: 'auto',
        overflowY: 'auto',
        maxHeight: '70vh',
        paddingBottom: '16px'
      }}>
        {board.map(column => (
          <div
            key={column.id}
            style={{
              minWidth: '280px',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: dragOverColumn === column.id ? '2px solid #3b82f6' : '1px solid #e5e7eb'
            }}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: column.color
                }} />
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}>
                  {column.title}
                </h4>
                <span style={{
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  {column.items.length}
                </span>
              </div>
              {permissions.can_edit && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      const menu = e.currentTarget.nextElementSibling
                      menu.style.display = menu.style.display === 'none' ? 'block' : 'none'
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      fontSize: '18px',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6'
                      e.target.style.color = '#374151'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent'
                      e.target.style.color = '#6b7280'
                    }}
                  >
                    ⋮
                  </button>
                  <div style={{
                    display: 'none',
                    position: 'absolute',
                    right: 0,
                    marginTop: '8px',
                    width: '150px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                    zIndex: 10
                  }}>
                    <button
                      onClick={(e) => {
                        openColumnModal(column)
                        e.currentTarget.parentElement.style.display = 'none'
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 16px',
                        fontSize: '14px',
                        color: '#374151',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {i18n.column?.editButton || 'Edit Column'}
                    </button>
                    <button
                      onClick={(e) => {
                        setColumnToDelete(column)
                        setShowDeleteConfirm(true)
                        e.currentTarget.parentElement.style.display = 'none'
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 16px',
                        fontSize: '14px',
                        color: '#ef4444',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {i18n.column?.deleteButton || 'Delete Column'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Column Items */}
            <div style={{ minHeight: '100px' }}>
              {column.items.map(item => (
                <div
                  key={item.id}
                  draggable={permissions.can_interact}
                  onDragStart={(e) => handleDragStart(e, item, column.id)}
                  onClick={() => {
                    // Feature board: single click opens view modal for anyone
                    // Non-feature board: only editors can double-click to edit
                    if (featureBoardSettings.enabled) {
                      openTaskModal(item, column.id)
                    }
                  }}
                  onDoubleClick={() => {
                    // Non-feature board: double-click to edit (requires edit permission)
                    if (!featureBoardSettings.enabled && permissions.can_edit) {
                      openTaskModal(item, column.id)
                    }
                  }}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '8px',
                    cursor: featureBoardSettings.enabled ? 'pointer' : (permissions.can_interact ? 'move' : 'default'),
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '8px', marginBottom: '8px' }}>
                    {/* Hide checkbox when feature board is enabled */}
                    {permissions.can_interact && !featureBoardSettings.enabled && (
                      <button
                        onClick={() => toggleItemCheck(item, column.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          marginTop: '2px',
                          fontSize: '16px'
                        }}
                      >
                        {item.checked ? '✅' : '⭕'}
                      </button>
                    )}
                    {/* Priority Indicator - Clickable to cycle (only if item priority is enabled) */}
                    {checklist.enable_item_priority && (
                      <div
                        onClick={permissions.can_edit ? (e) => { e.stopPropagation(); cyclePriority(item, column.id) } : undefined}
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: getPriorityColor(item.priority || 'none'),
                          flexShrink: 0,
                          marginTop: '2px',
                          cursor: permissions.can_edit ? 'pointer' : 'default'
                        }}
                        title={permissions.can_edit
                          ? (item.priority && item.priority !== 'none' ? `Priority: ${item.priority} (click to change)` : 'Click to set priority')
                          : (item.priority && item.priority !== 'none' ? `Priority: ${item.priority}` : '')}
                      />
                    )}
                    <div
                      className="magiccl-kanban-item-content"
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        color: item.checked ? '#9ca3af' : '#1f2937',
                        textDecoration: item.checked ? 'line-through' : 'none',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        lineHeight: '1.5'
                      }}
                      dangerouslySetInnerHTML={{ __html: item.title }}
                    />
                  </div>

                  {/* Comment count indicator */}
                  {item.comment_count > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '8px'
                    }}>
                      <svg style={{ width: '12px', height: '12px', marginRight: '4px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{item.comment_count} {item.comment_count === 1 ? (i18n.item?.commentSingular || 'comment') : (i18n.item?.commentPlural || 'comments')}</span>
                    </div>
                  )}

                  {/* Item Footer - Deadline, Upvote and User Assignment */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid #f3f4f6',
                    gap: '8px'
                  }}>
                    {/* Deadline Badge - Clickable to edit (if has edit permission) */}
                    <div
                      onClick={permissions.can_edit ? () => handleDeadlineClick(item, column.id) : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: '#6b7280',
                        cursor: permissions.can_edit ? 'pointer' : 'default'
                      }}
                      title={permissions.can_edit ? (item.deadline ? 'Click to edit deadline' : 'Click to set deadline') : ''}
                    >
                      <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{item.deadline ? formatDate(item.deadline, 'datetime') : (permissions.can_edit ? 'Set deadline' : '')}</span>
                    </div>
                    {/* Upvote Button - Feature Board */}
                    {featureBoardSettings.enabled && featureBoardSettings.show_upvote_count && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpvote(item.id)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: isItemUpvoted(item.id) ? '#fef3c7' : 'none',
                          border: isItemUpvoted(item.id) ? '1px solid #fbbf24' : '1px solid #e5e7eb',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          transition: 'all 0.2s',
                          fontSize: '12px',
                          color: isItemUpvoted(item.id) ? '#d97706' : '#6b7280'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isItemUpvoted(item.id) ? '#fde68a' : '#f3f4f6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isItemUpvoted(item.id) ? '#fef3c7' : 'transparent'
                        }}
                        title={i18n.featureBoard?.upvoteTitle || 'Upvote this item'}
                      >
                        <svg style={{ width: '14px', height: '14px' }} fill={isItemUpvoted(item.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <span style={{ fontWeight: '500' }}>{itemUpvotes[item.id]?.count || 0}</span>
                      </button>
                    )}

                    {/* User Assignment */}
                    <button
                      onClick={() => openAssignModal(item, column.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: permissions.can_edit ? 'pointer' : 'default',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s',
                        marginLeft: 'auto'
                      }}
                      onMouseEnter={(e) => permissions.can_edit && (e.target.style.backgroundColor = '#f3f4f6')}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {item.assigned_user ? (
                        <>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#3b82f6',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {item.assigned_user.name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            {item.assigned_user.name.split(' ')[0]}
                          </span>
                        </>
                      ) : (
                        <>
                          <svg style={{ width: '16px', height: '16px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{i18n.item?.assignButton || 'Assign'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Column Modal */}
      <Modal
        isOpen={showColumnModal}
        onClose={closeColumnModal}
        title={editingColumn ? (i18n.modals?.editColumnTitle || 'Edit Column') : (i18n.modals?.addColumnTitle || 'Add Column')}
        footer={
          <>
            <button
              onClick={closeColumnModal}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            >
              {i18n.modals?.cancelButton || 'Cancel'}
            </button>
            <button
              onClick={saveColumn}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              {editingColumn ? (i18n.modals?.updateColumnButton || 'Update') : (i18n.modals?.addColumnButton || 'Add')}
            </button>
          </>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
            {i18n.modals?.columnTitleLabel || 'Column Title'}
          </label>
          <input
            type="text"
            value={columnTitle}
            onChange={(e) => setColumnTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            placeholder={i18n.modals?.columnTitlePlaceholder || "Enter column title..."}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
            {i18n.modals?.columnColorLabel || 'Column Color'}
          </label>
          <input
            type="color"
            value={columnColor}
            onChange={(e) => setColumnColor(e.target.value)}
            style={{
              width: '60px',
              height: '40px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          />
        </div>
      </Modal>

      {/* Task Edit Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={closeTaskModal}
        title={permissions.can_edit ? (i18n.modals?.editTaskTitle || "Edit Task") : (i18n.modals?.viewItemTitle || "View Item")}
        size="lg"
        footer={
          <>
            <button
              onClick={closeTaskModal}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            >
              {permissions.can_edit ? (i18n.modals?.cancelButton || 'Cancel') : (i18n.modals?.closeButton || 'Close')}
            </button>
            {permissions.can_edit && (
              <button
                onClick={saveTask}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                {i18n.modals?.saveTaskButton || 'Save'}
              </button>
            )}
          </>
        }
      >
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
            {i18n.modals?.taskContentLabel || 'Task Content'}
          </label>

          {/* Simple formatting toolbar - only for editors */}
          {permissions.can_edit && (
            <div style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '8px',
              padding: '8px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <button
                type="button"
                onClick={() => formatText('bold')}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  fontWeight: 'bold',
                  color: '#374151',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => formatText('italic')}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  fontStyle: 'italic',
                  color: '#374151',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => formatText('underline')}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                  color: '#374151',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                title="Underline"
              >
                U
              </button>
              <button
                type="button"
                onClick={addImageToEditor}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: '#374151',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                title={i18n.modals?.insertImageTitle || "Insert Image"}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}

          {/* Rich text editor / read-only view */}
          <div
            ref={contentEditableRef}
            contentEditable={permissions.can_edit}
            suppressContentEditableWarning={true}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              lineHeight: '1.5',
              outline: 'none',
              transition: 'border-color 0.2s',
              backgroundColor: permissions.can_edit ? 'white' : '#f9fafb',
              cursor: permissions.can_edit ? 'text' : 'default'
            }}
            dangerouslySetInnerHTML={{ __html: taskContent }}
            onPaste={permissions.can_edit ? handlePaste : undefined}
            onFocus={(e) => permissions.can_edit && (e.target.style.borderColor = '#3b82f6')}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db'
              if (permissions.can_edit) {
                setTaskContent(e.target.innerHTML)
              }
            }}
          />

          {/* Comments Section */}
          <div style={{
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '2px solid #e5e7eb'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {i18n.comment?.sectionTitle || 'Comments'}
            </h4>

            {/* Add comment form - show based on feature board settings or permissions */}
            {(() => {
              const isLoggedIn = window.magiccl_checklists?.user_access?.is_logged_in || false
              let canComment = false

              if (featureBoardSettings.enabled) {
                // Feature board: check comments_mode setting
                if (featureBoardSettings.comments_mode === 'anyone') {
                  canComment = true
                } else if (featureBoardSettings.comments_mode === 'logged_in' && isLoggedIn) {
                  canComment = true
                }
              } else {
                // Non-feature board: use standard permissions
                canComment = permissions.can_interact
              }

              return canComment ? (
                <div style={{ marginBottom: '16px' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={i18n.comment?.placeholder || "Add a comment..."}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    rows={3}
                  />
                  <button
                    onClick={addComment}
                    style={{
                      marginTop: '8px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                  >
                    {i18n.comment?.submitButton || 'Post Comment'}
                  </button>
                </div>
              ) : null
            })()}

            {/* Comments list */}
            {loadingComments ? (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                {i18n.comment?.loading || 'Loading comments...'}
              </div>
            ) : taskComments.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#9ca3af',
                fontSize: '14px'
              }}>
                {i18n.comment?.noComments || 'No comments yet'}
              </div>
            ) : (
              <div>
                {taskComments.map(comment => (
                  <Comment
                    key={comment.id}
                    comment={comment}
                    onReply={addReply}
                    onLike={toggleCommentLike}
                    onDelete={deleteComment}
                    isAdmin={permissions.can_edit}
                    i18n={i18n}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* User Assignment Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={i18n.modals?.assignUserTitle || "Assign User"}
        footer={
          <>
            <button
              onClick={() => setShowAssignModal(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            >
              {i18n.modals?.cancelButton || 'Cancel'}
            </button>
            <button
              onClick={saveAssignment}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              {i18n.modals?.assignButton || 'Assign'}
            </button>
          </>
        }
      >
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#374151',
            fontWeight: '500'
          }}>
            {i18n.modals?.selectUserLabel || 'Select User'}
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          >
            <option value="">{i18n.modals?.unassignOption || 'Unassigned'}</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Delete Column Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={deleteColumn}
        title={i18n.confirm?.deleteColumnTitle || 'Delete Column'}
        message={i18n.confirm?.deleteColumnMessage || 'Are you sure you want to delete this column?'}
        confirmText={i18n.confirm?.deleteButton || 'Delete'}
        items={columnToDelete?.items.length > 0 ? [
          i18n.confirm?.deleteColumnWarning || `This column contains ${columnToDelete.items.length} item(s). All items will be permanently deleted.`
        ] : []}
      />

      {/* Image Choice Modal */}
      {showImageModal === 'choice' && (
        <Modal isOpen={true} onClose={closeImageModal} title={i18n.modals?.insertImage || 'Insert Image'}>
          <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px' }}>
            {i18n.modals?.chooseImageMethod || 'Choose how you would like to add an image:'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              onClick={openMediaLibrary}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              {i18n.modals?.mediaLibrary || 'WordPress Media Library'}
            </button>
            <button
              type="button"
              onClick={() => setShowImageModal('upload')}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
            >
              {i18n.modals?.quickUpload || 'Quick Upload'}
            </button>
            <button
              type="button"
              onClick={closeImageModal}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            >
              {i18n.modals?.cancelButton || 'Cancel'}
            </button>
          </div>
        </Modal>
      )}

      {/* Image Upload Modal */}
      {showImageModal === 'upload' && (
        <Modal
          isOpen={true}
          onClose={closeImageModal}
          title={i18n.modals?.uploadOrSelectImage || 'Upload or Select Image'}
          size="lg"
          footer={
            <>
              <button
                type="button"
                onClick={closeImageModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              >
                {i18n.modals?.cancelButton || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedImageFile) {
                    uploadImage(selectedImageFile)
                  } else if (selectedExistingImage) {
                    insertImageIntoEditor(selectedExistingImage)
                    closeImageModal()
                  }
                }}
                disabled={(!selectedImageFile && !selectedExistingImage) || uploadingImage}
                style={{
                  padding: '8px 16px',
                  backgroundColor: (!selectedImageFile && !selectedExistingImage) || uploadingImage ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!selectedImageFile && !selectedExistingImage) || uploadingImage ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) e.target.style.backgroundColor = '#2563eb'
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) e.target.style.backgroundColor = '#3b82f6'
                }}
              >
                {uploadingImage ? (i18n.modals?.uploading || 'Uploading...') : selectedImageFile ? (i18n.modals?.uploadImage || 'Upload Image') : (i18n.modals?.selectImage || 'Select Image')}
              </button>
            </>
          }
        >
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setExistingImages([])}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderBottom: !existingImages.length || existingImages.length === 0 ? '2px solid #3b82f6' : '2px solid transparent',
                  color: !existingImages.length || existingImages.length === 0 ? '#3b82f6' : '#6b7280',
                  background: 'none',
                  border: 'none',
                  borderBottom: !existingImages.length || existingImages.length === 0 ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#374151'}
                onMouseLeave={(e) => {
                  if (!(!existingImages.length || existingImages.length === 0)) e.target.style.color = '#6b7280'
                }}
              >
                {i18n.modals?.uploadNew || 'Upload New'}
              </button>
              <button
                type="button"
                onClick={loadExistingImages}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderBottom: existingImages.length > 0 ? '2px solid #3b82f6' : '2px solid transparent',
                  color: existingImages.length > 0 ? '#3b82f6' : '#6b7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#374151'}
                onMouseLeave={(e) => {
                  if (!(existingImages.length > 0)) e.target.style.color = '#6b7280'
                }}
              >
                {i18n.modals?.selectExisting || 'Select Existing'}
              </button>
            </div>

            {/* Upload Tab */}
            {(!existingImages.length || existingImages.length === 0) && (
              <div>
                <div
                  style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    padding: '32px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onDragOver={(e) => { e.preventDefault() }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0])
                    }
                  }}
                  onClick={() => document.getElementById('shortcode-kanban-image-upload-input').click()}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#9ca3af'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="shortcode-kanban-image-upload-input"
                  />

                  {!imagePreview ? (
                    <div>
                      <svg style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: '#9ca3af' }} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p style={{ color: '#6b7280', marginBottom: '8px', fontSize: '14px' }}>
                        {i18n.modals?.dragDropImage || 'Drag and drop image here or click to select'}
                      </p>
                      <p style={{ color: '#9ca3af', fontSize: '12px' }}>
                        {i18n.modals?.imageRestrictions || 'Maximum file size: 10MB. Supported formats: JPG, PNG, GIF'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px' }} />
                      <button
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedImageFile(null)
                          setImagePreview(null)
                          setImageError(null)
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {imageError && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    color: '#dc2626',
                    fontSize: '14px'
                  }}>
                    {imageError}
                  </div>
                )}
              </div>
            )}

            {/* Select Tab */}
            {existingImages.length > 0 && (
              <div>
                {loadingImages ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '14px' }}>
                    {i18n.modals?.loadingImages || 'Loading images...'}
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    maxHeight: '24rem',
                    overflowY: 'auto'
                  }}>
                    {existingImages.map((image) => (
                      <div
                        key={image.url}
                        onClick={() => setSelectedExistingImage(image)}
                        style={{
                          border: selectedExistingImage === image ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                          backgroundColor: selectedExistingImage === image ? '#eff6ff' : 'white',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedExistingImage !== image) e.currentTarget.style.borderColor = '#d1d5db'
                        }}
                        onMouseLeave={(e) => {
                          if (selectedExistingImage !== image) e.currentTarget.style.borderColor = '#e5e7eb'
                        }}
                      >
                        <img src={image.url} alt={image.filename} style={{ width: '100%', height: '96px', objectFit: 'cover', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }} />
                        <div style={{ padding: '8px' }}>
                          <p style={{ fontSize: '12px', fontWeight: '500', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {image.filename}
                          </p>
                          <p style={{ fontSize: '12px', color: '#6b7280' }}>
                            {image.width}×{image.height}
                          </p>
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

      {/* Feature Board - Idea Submission Modal */}
      <Modal
        isOpen={showIdeaModal}
        onClose={() => {
          setShowIdeaModal(false)
          setIdeaTitle('')
          setIdeaDescription('')
          setIdeaMessage(null)
        }}
        title={i18n.featureBoard?.submitIdeaTitle || 'Submit Your Idea'}
        footer={
          ideaMessage?.type !== 'success' && (
            <>
              <button
                onClick={() => {
                  setShowIdeaModal(false)
                  setIdeaTitle('')
                  setIdeaDescription('')
                  setIdeaMessage(null)
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              >
                {i18n.modals?.cancelButton || 'Cancel'}
              </button>
              <button
                onClick={submitIdea}
                disabled={!ideaTitle.trim() || submittingIdea}
                style={{
                  padding: '8px 16px',
                  backgroundColor: !ideaTitle.trim() || submittingIdea ? '#d1d5db' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !ideaTitle.trim() || submittingIdea ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) e.target.style.backgroundColor = '#059669'
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) e.target.style.backgroundColor = '#10b981'
                }}
              >
                {submittingIdea ? (i18n.featureBoard?.submitting || 'Submitting...') : (i18n.featureBoard?.submitButton || 'Submit Idea')}
              </button>
            </>
          )
        }
      >
        <div>
          {ideaMessage && (
            <div style={{
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              backgroundColor: ideaMessage.type === 'success' ? '#d1fae5' : ideaMessage.type === 'error' ? '#fee2e2' : '#dbeafe',
              color: ideaMessage.type === 'success' ? '#065f46' : ideaMessage.type === 'error' ? '#991b1b' : '#1e40af',
              fontSize: '14px'
            }}>
              {ideaMessage.text}
            </div>
          )}

          {ideaMessage?.type !== 'success' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontWeight: '500',
                  fontSize: '14px'
                }}>
                  {i18n.featureBoard?.ideaTitleLabel || 'Title'} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  placeholder={i18n.featureBoard?.ideaTitlePlaceholder || 'Enter your idea title...'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontWeight: '500',
                  fontSize: '14px'
                }}>
                  {i18n.featureBoard?.ideaDescriptionLabel || 'Description (optional)'}
                </label>
                <textarea
                  value={ideaDescription}
                  onChange={(e) => setIdeaDescription(e.target.value)}
                  placeholder={i18n.featureBoard?.ideaDescriptionPlaceholder || 'Describe your idea in detail...'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '100px',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  rows={4}
                />
              </div>

              {featureBoardSettings.idea_moderation_enabled && (
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '12px'
                }}>
                  {i18n.featureBoard?.moderationNotice || 'Your idea will be reviewed by our team before being published.'}
                </p>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Feature Board - Email Prompt Modal */}
      <Modal
        isOpen={showEmailPrompt}
        onClose={() => {
          setShowEmailPrompt(false)
          setUserEmail('')
          setUserName('')
          setPendingUpvoteItem(null)
          setEmailPromptType(null)
        }}
        title={
          emailPromptType === 'login_required'
            ? (i18n.featureBoard?.loginRequiredTitle || 'Login Required')
            : (i18n.featureBoard?.emailPromptTitle || 'Enter Your Details')
        }
        footer={
          emailPromptType !== 'login_required' && (
            <>
              <button
                onClick={() => {
                  setShowEmailPrompt(false)
                  setUserEmail('')
                  setUserName('')
                  setPendingUpvoteItem(null)
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              >
                {i18n.modals?.cancelButton || 'Cancel'}
              </button>
              <button
                onClick={handleEmailPromptSubmit}
                disabled={!userEmail.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: !userEmail.trim() ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !userEmail.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) e.target.style.backgroundColor = '#2563eb'
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) e.target.style.backgroundColor = '#3b82f6'
                }}
              >
                {i18n.featureBoard?.continueButton || 'Continue'}
              </button>
            </>
          )
        }
      >
        <div>
          {emailPromptType === 'login_required' ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <svg style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '16px'
              }}>
                {i18n.featureBoard?.loginRequiredMessage || 'Please log in to perform this action.'}
              </p>
              <button
                onClick={() => {
                  setShowEmailPrompt(false)
                  // Redirect to login or show login modal
                  if (window.magiccl_checklists?.login_url) {
                    window.location.href = window.magiccl_checklists.login_url
                  }
                }}
                style={{
                  padding: '8px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                {i18n.featureBoard?.loginButton || 'Log In'}
              </button>
            </div>
          ) : (
            <>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '16px'
              }}>
                {emailPromptType === 'upvote'
                  ? (i18n.featureBoard?.emailPromptUpvote || 'Enter your email to upvote this item.')
                  : (i18n.featureBoard?.emailPromptIdea || 'Enter your details to submit your idea.')
                }
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontWeight: '500',
                  fontSize: '14px'
                }}>
                  {i18n.featureBoard?.nameLabel || 'Name'}
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={i18n.featureBoard?.namePlaceholder || 'Your name (optional)'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontWeight: '500',
                  fontSize: '14px'
                }}>
                  {i18n.featureBoard?.emailLabel || 'Email'} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder={i18n.featureBoard?.emailPlaceholder || 'your@email.com'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              {featureBoardSettings.upvote_require_email_verification && emailPromptType === 'upvote' && (
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {i18n.featureBoard?.emailVerificationNotice || 'A verification link will be sent to your email.'}
                </p>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Feature Board - Global Message Display */}
      {ideaMessage && !showIdeaModal && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          borderRadius: '8px',
          backgroundColor: ideaMessage.type === 'success' ? '#10b981' : ideaMessage.type === 'error' ? '#ef4444' : '#3b82f6',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out'
        }}>
          {ideaMessage.text}
        </div>
      )}

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

export default ShortcodeKanbanView
