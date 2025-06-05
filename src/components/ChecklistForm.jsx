import { useState } from 'react'

const ChecklistForm = ({ onClose, adminData, checklist = null }) => {
  // Redirect to the existing PHP form page
  const redirectUrl = checklist 
    ? `${adminData.pluginUrl ? adminData.pluginUrl.replace('/wp-content/plugins/magicchecklists/', '') : ''}admin.php?page=mcl_add_new&checklist_id=${checklist.id}`
    : `${adminData.pluginUrl ? adminData.pluginUrl.replace('/wp-content/plugins/magicchecklists/', '') : ''}admin.php?page=mcl_add_new`

  // Auto-redirect
  if (typeof window !== 'undefined') {
    window.location.href = redirectUrl
  }

  return (
    <div className="text-center py-8">
      <p>Redirecting to the form...</p>
      <p className="text-sm text-gray-600 mt-2">
        If you are not redirected automatically, 
        <a href={redirectUrl} className="text-blue-600 hover:underline ml-1">
          click here
        </a>
      </p>
    </div>
  )
}

// Ensure component has a display name for debugging
ChecklistForm.displayName = 'ChecklistForm'

export default ChecklistForm 