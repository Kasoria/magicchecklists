import React, { useState, useEffect } from 'react'
import { Card, Button, Label, TextInput, Textarea, Select, Badge, Alert, Spinner } from 'flowbite-react'
import ReactSelect from 'react-select'
import { formatDate } from '../utils/dateUtils'

// Improved Toggle Component matching ChecklistsTable style
const Toggle = ({ checked, onChange, label, disabled = false }) => (
  <div className="flex items-center">
    <label className="inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent dark:peer-checked:bg-brand-accent peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
    </label>
    {label && <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{label}</span>}
  </div>
)

const AccessControl = ({ formData, onChange, adminData }) => {
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
      // Then try window.magicclAdminData
      else if (typeof window !== 'undefined' && window.magicclAdminData?.i18n) {
        i18nData = window.magicclAdminData.i18n;
      }
      
      return i18nData;
    };
    
    const i18nData = getI18nData();
    
    // If we have i18n data, set it
    if (Object.keys(i18nData).length > 0) {
      setI18n(i18nData);
    } else {
      // If not available yet, try again after a short delay
      // This handles cases where window.magicclAdminData is loaded after component mount
      setTimeout(() => {
        const retryI18nData = getI18nData();
        if (Object.keys(retryI18nData).length > 0) {
          setI18n(retryI18nData);
        }
      }, 100);
    }
  }, [adminData]);
  const [inviteLinks, setInviteLinks] = useState([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [adminPages, setAdminPages] = useState([])
  const [loadingAdminPages, setLoadingAdminPages] = useState(false)
  const [adminPagesError, setAdminPagesError] = useState('')
  const [groupedAdminPages, setGroupedAdminPages] = useState([])

  useEffect(() => {
    // Load users, roles, and admin pages
    loadUsers()
    loadRoles()
    loadAdminPages()
    
    if (formData.checklist_id || adminData.checklist_id) {
      loadInviteLinks()
    }
  }, [formData.checklist_id, adminData.checklist_id])

  const loadUsers = async () => {
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_get_users',
          nonce: adminData.nonces?.magiccl_admin || ''
        })
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.data.map(user => ({ value: user.ID, label: user.display_name })))
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_get_roles',
          nonce: adminData.nonces?.magiccl_admin || ''
        })
      })
      const data = await response.json()
      if (data.success) {
        setRoles(data.data.map(role => ({ value: role.value, label: role.name })))
      }
    } catch (error) {
      console.error('Error loading roles:', error)
    }
  }

  const loadAdminPages = async () => {
    try {
      setLoadingAdminPages(true)
      setAdminPagesError('')
      
      console.log('Loading admin pages...', { 
        ajaxurl: adminData.ajaxurl, 
        nonce: adminData.nonces?.magiccl_admin 
      })
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_get_admin_pages',
          nonce: adminData.nonces?.magiccl_admin || ''
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Admin pages response data:', data)
      
      if (data.success) {
        // Create flat list of admin pages for the multi-select
        const pages = data.data.map(page => ({ 
          value: page.slug, 
          label: page.title 
        }))
        setAdminPages(pages)
        
        // Group admin pages by category for better organization
        // This mimics the old PHP implementation that grouped pages
        const groupedOptions = [
          { label: 'Core WordPress', options: pages.filter(p => p.label.includes('WordPress') || p.label.includes('Posts') || p.label.includes('Pages') || p.label.includes('Media')) },
          { label: 'Plugins & Extensions', options: pages.filter(p => p.label.includes('Plugin') || p.label.includes('Extension') || p.label.includes('Add-on')) },
          { label: 'Settings', options: pages.filter(p => p.label.includes('Settings') || p.label.includes('Options')) },
          { label: 'Other', options: pages.filter(p => 
            !p.label.includes('WordPress') && 
            !p.label.includes('Posts') && 
            !p.label.includes('Pages') && 
            !p.label.includes('Media') && 
            !p.label.includes('Plugin') && 
            !p.label.includes('Extension') && 
            !p.label.includes('Add-on') && 
            !p.label.includes('Settings') && 
            !p.label.includes('Options')
          ) }
        ]
        // Filter out empty groups
        const filteredGroups = groupedOptions.filter(group => group.options.length > 0)
        setGroupedAdminPages(filteredGroups)
        
        console.log('Grouped admin pages:', filteredGroups)
      } else {
        setAdminPagesError(data.data?.message || 'Error loading admin pages')
        console.error('Error in admin pages response:', data.data?.message)
      }
    } catch (error) {
      setAdminPagesError('Failed to load admin pages')
      console.error('Error loading admin pages:', error)
    } finally {
      setLoadingAdminPages(false)
    }
  }

  const loadInviteLinks = async () => {
    const checklist_id = formData.checklist_id || adminData.checklist_id;
    if (!checklist_id) return;
    
    try {
      setLoadingInvites(true);
      
      // Debug the nonce value
      console.log('Checklist ID for invite links:', checklist_id);
      
      // Get the nonce
      const nonceValue = await getInviteLinksNonce();
      console.log('Using nonce for loading invite links:', nonceValue);
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_get_invite_links',
          checklist_id: checklist_id,
          nonce: nonceValue
        })
      })
      const data = await response.json()
      if (data.success) {
        setInviteLinks(data.data)
      } else {
        console.error('Failed to load invite links:', data.data?.message || 'Unknown error')
        setInviteError(i18n.accessControl?.inviteLinks?.loadError || 'Failed to load invite links')
      }
    } catch (error) {
      console.error('Error loading invite links:', error)
      setInviteError(i18n.accessControl?.inviteLinks?.loadError || 'Error loading invite links')
    } finally {
      setLoadingInvites(false)
    }
  }

  const generateInviteLink = async () => {
    if (!formData.checklist_id && !adminData.checklist_id) {
      setInviteError(i18n.accessControl?.inviteLinks?.saveFirstError || 'Please save the checklist first to generate invite links')
      return
    }
    
    setInviteSuccess('')
    setInviteError('')
    setGeneratingInvite(true)
    
    try {
      console.log('Checklist ID for generating:', formData.checklist_id || adminData.checklist_id);
      
      // Get the nonce
      const nonceValue = await getInviteLinksNonce();
      console.log('Using nonce for generating invite link:', nonceValue);
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_generate_invite',
          checklist_id: formData.checklist_id || adminData.checklist_id,
          permissions: formData.invite_permissions || 'interact',
          expiry_days: formData.invite_expiry || '7',
          usage_limit: formData.invite_usage || '0',
          nonce: nonceValue
        })
      })
      const data = await response.json()
      if (data.success) {
        // Copy to clipboard
        await navigator.clipboard.writeText(data.data.invite_url)
        setInviteSuccess(i18n.accessControl?.inviteLinks?.generatedSuccess || 'Invite link generated and copied to clipboard!')
        loadInviteLinks() // Refresh the list
        
        // Reset invite form
        onChange('invite_permissions', 'interact')
        onChange('invite_expiry', '7')
        onChange('invite_usage', '0')
      } else {
        setInviteError((i18n.accessControl?.inviteLinks?.generateError || 'Failed to generate invite link:') + ' ' + (data.data?.message || (i18n.accessControl?.inviteLinks?.unknownError || 'Unknown error')))
      }
    } catch (error) {
      console.error('Error generating invite link:', error)
      setInviteError('Error generating invite link: ' + error.message)
    } finally {
      setGeneratingInvite(false)
    }
  }

  const deleteInviteLink = async (linkId) => {
    if (!confirm(i18n.accessControl?.inviteLinks?.deleteConfirm || 'Are you sure you want to delete this invite link?')) return
    
    try {
      // Get the nonce
      const nonceValue = await getInviteLinksNonce();
      console.log('Using nonce for deleting invite link:', nonceValue);
      
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_delete_invite_link',
          link_id: linkId,
          nonce: nonceValue
        })
      })
      const data = await response.json()
      if (data.success) {
        setInviteSuccess(i18n.accessControl?.inviteLinks?.deleteSuccess || 'Invite link deleted successfully')
        loadInviteLinks() // Refresh the list
      } else {
        setInviteError((i18n.accessControl?.inviteLinks?.deleteError || 'Failed to delete invite link:') + ' ' + (data.data?.message || (i18n.accessControl?.inviteLinks?.unknownError || 'Unknown error')))
      }
    } catch (error) {
      console.error('Error deleting invite link:', error)
      setInviteError('Error deleting invite link: ' + error.message)
    }
  }

  const copyLinkToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      setInviteSuccess(i18n.accessControl?.inviteLinks?.copiedSuccess || 'Link copied to clipboard!')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setInviteSuccess('')
      }, 3000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      setInviteError(i18n.accessControl?.inviteLinks?.copyError || 'Failed to copy link to clipboard')
    }
  }

  const addUrlPattern = () => {
    const newUrls = [...(formData.allowed_urls || []), '']
    onChange('allowed_urls', newUrls)
  }

  const updateUrlPattern = (index, value) => {
    const newUrls = [...(formData.allowed_urls || [])]
    newUrls[index] = value
    onChange('allowed_urls', newUrls)
  }

  const removeUrlPattern = (index) => {
    const newUrls = (formData.allowed_urls || []).filter((_, i) => i !== index)
    onChange('allowed_urls', newUrls)
  }

  const formatPermission = (permission) => {
    switch (permission) {
      case 'view': return i18n.accessControl?.permissions?.canView || 'Can View';
      case 'interact': return i18n.accessControl?.permissions?.canInteract || 'Can Interact';
      case 'edit': return i18n.accessControl?.permissions?.canEdit || 'Can Edit';
      default: return permission;
    }
  }

  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'view': return 'gray';
      case 'interact': return 'blue';
      case 'edit': return 'red';
      default: return 'gray';
    }
  }

  const permissionOptions = [
    { value: 'view', label: i18n.accessControl?.permissions?.canView || 'Can View' },
    { value: 'interact', label: i18n.accessControl?.permissions?.canInteract || 'Can Interact' },
    { value: 'edit', label: i18n.accessControl?.permissions?.canEdit || 'Can Edit' }
  ]

  // Function to get the invite links nonce
  const getInviteLinksNonce = async () => {
    // Check if we already have a nonce
    if (adminData.nonces?.inviteLinks) {
      return adminData.nonces.inviteLinks;
    }
    
    // If not, let's try to generate one by fetching it directly
    try {
      // First try directly from the global window object if available
      if (typeof window !== 'undefined' && window.magicclAdminData && window.magicclAdminData.nonces?.inviteLinks) {
        console.log('Retrieved invite links nonce from window.magicclAdminData');
        return window.magicclAdminData.nonces.inviteLinks;
      }
      
      // Fallback - attempt to fetch the nonce from the server 
      console.log('Attempting to fetch a new nonce for invite links');
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'magiccl_get_invite_nonce',
          _ajax_nonce: adminData.nonces?.magiccl_admin || ''
        })
      });
      
      const data = await response.json();
      if (data.success && data.data.nonce) {
        console.log('Successfully fetched new nonce');
        return data.data.nonce;
      }
    } catch (error) {
      console.error('Error fetching invite links nonce:', error);
    }
    
    // If all else fails, return a placeholder - this likely won't work but it's better than nothing
    console.warn('Using fallback value for invite links nonce - this may not work');
    return 'magiccl_invite_links_nonce';
  }

  // Role Permission Rules handlers
  const addRolePermissionRule = () => {
    const newRules = [...(formData.role_permission_rules || []), { permission: 'interact', roles: [] }]
    onChange('role_permission_rules', newRules)
  }

  const updateRolePermissionRule = (index, field, value) => {
    const newRules = [...(formData.role_permission_rules || [])]
    newRules[index] = { ...newRules[index], [field]: value }
    onChange('role_permission_rules', newRules)
  }

  const removeRolePermissionRule = (index) => {
    const newRules = (formData.role_permission_rules || []).filter((_, i) => i !== index)
    onChange('role_permission_rules', newRules)
  }

  // User Permission Rules handlers
  const addUserPermissionRule = () => {
    const newRules = [...(formData.user_permission_rules || []), { permission: 'interact', users: [] }]
    onChange('user_permission_rules', newRules)
  }

  const updateUserPermissionRule = (index, field, value) => {
    const newRules = [...(formData.user_permission_rules || [])]
    newRules[index] = { ...newRules[index], [field]: value }
    onChange('user_permission_rules', newRules)
  }

  const removeUserPermissionRule = (index) => {
    const newRules = (formData.user_permission_rules || []).filter((_, i) => i !== index)
    onChange('user_permission_rules', newRules)
  }

  return (
    <div className="space-y-6">
      {/* Public Access */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-brand-dark dark:text-white font-semibold">{i18n.accessControl?.publicAccess?.title || 'Public Access'}</label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {i18n.accessControl?.publicAccess?.description || 'Enable this if you want any website visitor without authentication to have access to the checklist.'}
              </p>
            </div>
            <Toggle
              checked={formData.public_access}
              onChange={(checked) => onChange('public_access', checked)}
            />
          </div>

          {formData.public_access && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <label htmlFor="public_description" className="text-brand-dark dark:text-white">{i18n.accessControl?.publicAccess?.publicDescription || 'Public Description'}</label>
                <Textarea
                  id="public_description"
                  value={formData.public_description || ''}
                  onChange={(e) => onChange('public_description', e.target.value)}
                  rows={3}
                  placeholder={i18n.accessControl?.publicAccess?.publicDescriptionPlaceholder || 'Description visible to public users'}
                />
              </div>

              <div>
                <label htmlFor="public_checked_state_handling" className="text-brand-dark dark:text-white">{i18n.accessControl?.publicAccess?.checkedStateHandling || 'Public Checked State Handling'}</label>
                <Select
                  id="public_checked_state_handling"
                  value={formData.public_checked_state_handling || 'per_user'}
                  onChange={(e) => onChange('public_checked_state_handling', e.target.value)}
                >
                  <option value="per_user">{i18n.accessControl?.publicAccess?.perUser || 'Per User (using browser storage)'}</option>
                  <option value="global">{i18n.accessControl?.publicAccess?.global || 'Global (shared between all users)'}</option>
                </Select>
              </div>

              <div>
                <label htmlFor="public_permission" className="text-brand-dark dark:text-white">{i18n.accessControl?.publicAccess?.accessLevel || 'Public Access Level'}</label>
                <Select
                  id="public_permission"
                  value={formData.public_permission || 'interact'}
                  onChange={(e) => onChange('public_permission', e.target.value)}
                >
                  {permissionOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-brand-dark dark:text-white font-semibold">{i18n.accessControl?.rateLimiting?.title || 'Enable Rate Limiting'}</label>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {i18n.accessControl?.rateLimiting?.description || 'Limit how frequently users can perform actions on this checklist.'}
            </p>
          </div>
          <Toggle
            checked={formData.enable_rate_limit}
            onChange={(checked) => onChange('enable_rate_limit', checked)}
          />
        </div>
      </Card>

      {/* User Roles Access */}
      <Card>
        <div className="space-y-4">
          <div>
            <label className="text-brand-dark dark:text-white font-semibold">{i18n.accessControl?.userRoles?.title || 'Role Permission Rules'}</label>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {i18n.accessControl?.userRoles?.description || 'Create permission rules for user roles. Each rule grants a permission level to one or more roles.'}
            </p>
          </div>

          {/* Permission Rules List */}
          <div className="space-y-3">
            {(formData.role_permission_rules || []).map((rule, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-brand-dark dark:text-white">{i18n.accessControl?.userRoles?.permissionLevel || 'Permission Level'}</label>
                        <ReactSelect
                          value={permissionOptions.find(option => option.value === (rule.permission || 'interact'))}
                          onChange={(selectedOption) => updateRolePermissionRule(index, 'permission', selectedOption.value)}
                          options={permissionOptions}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          placeholder={i18n.accessControl?.userRoles?.permissionPlaceholder || 'Select permission...'}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-brand-dark dark:text-white">
                          {i18n.accessControl?.userRoles?.rolesLabel || 'Roles'}
                          <span className="text-xs text-gray-500 ml-1">({i18n.accessControl?.userRoles?.orLogic || 'any of these roles'})</span>
                        </label>
                        <ReactSelect
                          isMulti
                          options={roles}
                          value={roles.filter(role => (rule.roles || []).includes(role.value))}
                          onChange={(selectedRoles) => updateRolePermissionRule(index, 'roles', selectedRoles.map(r => r.value))}
                          placeholder={i18n.accessControl?.userRoles?.placeholder || 'Select roles...'}
                          className="react-select-container"
                          classNamePrefix="react-select"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    color="failure"
                    outline
                    onClick={() => removeRolePermissionRule(index)}
                    className="mt-6"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            size="sm"
            color="blue"
            outline
            onClick={addRolePermissionRule}
          >
            {i18n.accessControl?.userRoles?.addRuleButton || '+ Add Role Permission Rule'}
          </Button>

          {(formData.role_permission_rules || []).length > 1 && (
            <Alert color="info" className="mt-2">
              <span className="font-medium">{i18n.accessControl?.userRoles?.multipleRulesNote || 'Note:'}</span> {i18n.accessControl?.userRoles?.multipleRulesDescription || 'When a user matches multiple rules, they receive the highest permission level granted.'}
            </Alert>
          )}
        </div>
      </Card>

      {/* Individual Users Access */}
      <Card>
        <div className="space-y-4">
          <div>
            <label className="text-brand-dark dark:text-white font-semibold">{i18n.accessControl?.individualUsers?.title || 'User Permission Rules'}</label>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {i18n.accessControl?.individualUsers?.description || 'Create permission rules for specific users. Each rule grants a permission level to one or more users.'}
            </p>
          </div>

          {/* Permission Rules List */}
          <div className="space-y-3">
            {(formData.user_permission_rules || []).map((rule, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-brand-dark dark:text-white">{i18n.accessControl?.individualUsers?.permissionLevel || 'Permission Level'}</label>
                        <ReactSelect
                          value={permissionOptions.find(option => option.value === (rule.permission || 'interact'))}
                          onChange={(selectedOption) => updateUserPermissionRule(index, 'permission', selectedOption.value)}
                          options={permissionOptions}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          placeholder={i18n.accessControl?.individualUsers?.permissionPlaceholder || 'Select permission...'}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-brand-dark dark:text-white">
                          {i18n.accessControl?.individualUsers?.usersLabel || 'Users'}
                          <span className="text-xs text-gray-500 ml-1">({i18n.accessControl?.individualUsers?.orLogic || 'any of these users'})</span>
                        </label>
                        <ReactSelect
                          isMulti
                          options={users}
                          value={users.filter(user => (rule.users || []).includes(user.value))}
                          onChange={(selectedUsers) => updateUserPermissionRule(index, 'users', selectedUsers.map(u => u.value))}
                          placeholder={i18n.accessControl?.individualUsers?.placeholder || 'Select users...'}
                          className="react-select-container"
                          classNamePrefix="react-select"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    color="failure"
                    outline
                    onClick={() => removeUserPermissionRule(index)}
                    className="mt-6"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            size="sm"
            color="blue"
            outline
            onClick={addUserPermissionRule}
          >
            {i18n.accessControl?.individualUsers?.addRuleButton || '+ Add User Permission Rule'}
          </Button>

          {(formData.user_permission_rules || []).length > 1 && (
            <Alert color="info" className="mt-2">
              <span className="font-medium">{i18n.accessControl?.individualUsers?.multipleRulesNote || 'Note:'}</span> {i18n.accessControl?.individualUsers?.multipleRulesDescription || 'When a user matches multiple rules, they receive the highest permission level granted.'}
            </Alert>
          )}
        </div>
      </Card>

      {/* Invite Links */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-brand-dark dark:text-white font-semibold">{i18n.accessControl?.inviteLinks?.title || 'Invite Links'}</label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {i18n.accessControl?.inviteLinks?.description || 'Generate invite links to share this checklist with anyone, even if they don\'t have a WordPress account.'}
              </p>
            </div>
            {(formData.checklist_id || adminData.checklist_id) ? null : (
              <Badge color="yellow">
{i18n.accessControl?.inviteLinks?.saveFirstBadge || 'Save checklist first to enable'}
              </Badge>
            )}
          </div>

          {inviteSuccess && (
            <Alert color="success" onDismiss={() => setInviteSuccess('')}>
              {inviteSuccess}
            </Alert>
          )}
          
          {inviteError && (
            <Alert color="failure" onDismiss={() => setInviteError('')}>
              {inviteError}
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="invite_permissions" className="text-brand-dark dark:text-white">{i18n.accessControl?.inviteLinks?.permissionLevel || 'Permission Level'}</label>
              <ReactSelect
                inputId="invite_permissions"
                value={permissionOptions.find(option => option.value === (formData.invite_permissions || 'interact'))}
                onChange={(selectedOption) => onChange('invite_permissions', selectedOption.value)}
                options={permissionOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select permission level..."
                isDisabled={!formData.checklist_id && !adminData.checklist_id || generatingInvite}
              />
            </div>

            <div>
              <label htmlFor="invite_expiry" className="text-brand-dark dark:text-white">{i18n.accessControl?.inviteLinks?.expiresAfter || 'Expires After'}</label>
              <ReactSelect
                inputId="invite_expiry"
                value={{ 
                  value: formData.invite_expiry || '7', 
                  label: formData.invite_expiry === '1' ? (i18n.accessControl?.inviteLinks?.oneDayLabel || '1 Day') : 
                         formData.invite_expiry === '30' ? (i18n.accessControl?.inviteLinks?.thirtyDaysLabel || '30 Days') : 
                         (i18n.accessControl?.inviteLinks?.sevenDaysLabel || '7 Days') 
                }}
                onChange={(selectedOption) => onChange('invite_expiry', selectedOption.value)}
                options={[
                  { value: '1', label: i18n.accessControl?.inviteLinks?.oneDayLabel || '1 Day' },
                  { value: '7', label: i18n.accessControl?.inviteLinks?.sevenDaysLabel || '7 Days' },
                  { value: '30', label: i18n.accessControl?.inviteLinks?.thirtyDaysLabel || '30 Days' }
                ]}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select expiry..."
                isDisabled={!formData.checklist_id && !adminData.checklist_id || generatingInvite}
              />
            </div>

            <div>
              <label htmlFor="invite_usage" className="text-brand-dark dark:text-white">{i18n.accessControl?.inviteLinks?.usageLimit || 'Usage Limit'}</label>
              <TextInput
                id="invite_usage"
                type="number"
                min="0"
                value={formData.invite_usage || '0'}
                onChange={(e) => onChange('invite_usage', e.target.value)}
                placeholder={i18n.accessControl?.inviteLinks?.usageLimitPlaceholder || '0 for unlimited'}
                disabled={!formData.checklist_id && !adminData.checklist_id || generatingInvite}
              />
              <p className="text-xs text-gray-600 mt-1">
                {i18n.accessControl?.inviteLinks?.usageLimitNote || 'Set to 0 for unlimited uses'}
              </p>
            </div>
          </div>

          <Button
            onClick={generateInviteLink}
            className="w-full md:w-auto bg-brand-accent hover:bg-brand-accent/90 text-brand-dark dark:bg-brand-accent hover:dark:bg-brand-accent/90"
            disabled={!formData.checklist_id && !adminData.checklist_id || generatingInvite}
          >
            {generatingInvite ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {i18n.accessControl?.inviteLinks?.generating || 'Generating...'}
              </>
            ) : (
              i18n.accessControl?.inviteLinks?.generateButton || 'Generate Invite Link'
            )}
          </Button>

          {/* Existing Invite Links */}
          {loadingInvites ? (
            <div className="flex justify-center items-center p-4">
              <Spinner size="lg" />
              <span className="ml-2">{i18n.accessControl?.inviteLinks?.loadingLinks || 'Loading invite links...'}</span>
            </div>
          ) : (
            inviteLinks.length > 0 && (
              <div className="space-y-3">
                <label className="font-semibold">{i18n.accessControl?.inviteLinks?.existingLinks || 'Existing Invite Links'}</label>
                {inviteLinks.map((link) => {
                  const isExpired = new Date(link.expiry_date) < new Date()
                  const isLimitReached = link.usage_limit > 0 && link.usage_count >= link.usage_limit
                  
                  return (
                    <div
                      key={link.id}
                      className={`p-4 border rounded-lg ${
                        isExpired || isLimitReached 
                          ? 'border-red-200 bg-red-50 dark:bg-red-900/10' 
                          : 'border-gray-200 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge color={getPermissionColor(link.permissions)}>
                              {formatPermission(link.permissions)}
                            </Badge>
                            {(isExpired || isLimitReached) && (
                              <Badge color="failure">
                                {isExpired ? (i18n.accessControl?.inviteLinks?.expired || 'Expired') : (i18n.accessControl?.inviteLinks?.limitReached || 'Limit Reached')}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <p className="mb-1">
                              <span className="font-medium">{i18n.accessControl?.inviteLinks?.linkLabel || 'Link:'}</span>{' '}
                              <span className="truncate inline-block max-w-md">{link.invite_url}</span>
                            </p>
                            <p>{i18n.accessControl?.inviteLinks?.uses || 'Uses:'} {link.usage_count}/{link.usage_limit > 0 ? link.usage_limit : '∞'}</p>
                                            <p>{i18n.accessControl?.inviteLinks?.created || 'Created:'} {formatDate(link.created_at, 'datetime')}</p>
                <p>{i18n.accessControl?.inviteLinks?.expires || 'Expires:'} {formatDate(link.expiry_date, 'datetime')}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            color="blue"
                            onClick={() => copyLinkToClipboard(link.invite_url)}
                            disabled={isExpired || isLimitReached}
                          >
                            {i18n.accessControl?.inviteLinks?.copyButton || 'Copy'}
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            outline
                            onClick={() => deleteInviteLink(link.id)}
                          >
                            {i18n.accessControl?.inviteLinks?.deleteButton || 'Delete'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      </Card>

      {/* Loading Conditions */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-brand-dark dark:text-white font-semibold">{i18n.accessControl?.loadingConditions?.title || 'Loading Conditions'}</label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {i18n.accessControl?.loadingConditions?.description || 'Control where this checklist should be available.'}
              </p>
            </div>
            <Toggle
              checked={formData.load_everywhere}
              onChange={(checked) => onChange('load_everywhere', checked)}
              label={i18n.accessControl?.loadingConditions?.loadEverywhere || 'Load Everywhere (Default)'}
            />
          </div>

          {!formData.load_everywhere && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {/* WordPress Admin Pages */}
              <div>
                <label className="font-semibold dark:text-white">{i18n.accessControl?.loadingConditions?.adminPagesTitle || 'WordPress Admin Pages'}</label>
                {loadingAdminPages ? (
                  <div className="flex items-center space-x-2 py-2">
                    <Spinner size="sm" />
                    <span className="text-sm">{i18n.accessControl?.loadingConditions?.loadingAdminPages || 'Loading admin pages...'}</span>
                  </div>
                ) : adminPagesError ? (
                  <Alert color="failure" className="mt-2 mb-2">
                    {adminPagesError}
                  </Alert>
                ) : (
                  <ReactSelect
                    isMulti
                    options={groupedAdminPages.length > 0 ? groupedAdminPages : adminPages}
                    value={adminPages.filter(page => (formData.allowed_pages || []).includes(page.value))}
                    onChange={(selectedPages) => {
                      onChange('allowed_pages', selectedPages.map(page => page.value))
                    }}
                    placeholder={i18n.accessControl?.loadingConditions?.adminPagesPlaceholder || 'Select admin pages'}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    noOptionsMessage={() => i18n.accessControl?.loadingConditions?.noAdminPages || 'No admin pages found'}
                  />
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {i18n.accessControl?.loadingConditions?.adminPagesDescription || 'Select the WordPress admin pages where this checklist should be available.'}
                </p>
              </div>

              {/* Custom URLs */}
              <div>
                <label className="font-semibold dark:text-white">{i18n.accessControl?.loadingConditions?.customUrlsTitle || 'Custom URLs'}</label>
                <div className="space-y-2">
                  {(formData.allowed_urls || []).map((url, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <TextInput
                        value={url}
                        onChange={(e) => updateUrlPattern(index, e.target.value)}
                        placeholder={i18n.accessControl?.loadingConditions?.urlPlaceholder || 'Enter URL pattern (e.g., /posts/*)'}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        color="failure"
                        outline
                        onClick={() => removeUrlPattern(index)}
                        className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 hover:dark:bg-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    color="blue"
                    outline
                    onClick={addUrlPattern}
                  >
                    {i18n.accessControl?.loadingConditions?.addUrlButton || 'Add URL Pattern'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Force Delete Lock */}
      {formData.checklist_id && (
        <Card className="p-6">
          <div className="space-y-4">
            <label className="text-brand-dark dark:text-white font-semibold">{i18n.accessControl?.forceDeleteLock?.title || 'Force Delete Lock'}</label>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {i18n.accessControl?.forceDeleteLock?.description || 'Use this button to forcefully remove the lock on this checklist if it is stuck. Only use this if you are sure no one else is editing this checklist.'}
            </p>
            <Button
              color="failure"
              onClick={async () => {
                if (!confirm(i18n.accessControl?.forceDeleteLock?.confirmMessage || 'Are you sure you want to force delete the lock?')) return
                
                try {
                  const response = await fetch(adminData.ajaxurl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                      action: 'magiccl_force_delete_lock',
                      checklist_id: formData.checklist_id,
                      nonce: adminData.nonces?.forceDeleteLock || ''
                    })
                  })
                  const data = await response.json()
                  if (data.success) {
                    alert(i18n.accessControl?.forceDeleteLock?.successMessage || 'Lock has been successfully deleted.')
                  } else {
                    alert((i18n.accessControl?.forceDeleteLock?.errorMessage || 'Failed to delete the lock:') + ' ' + (data.data?.message || (i18n.accessControl?.inviteLinks?.unknownError || 'Unknown error.')))
                  }
                } catch (error) {
                  console.error('Error deleting lock:', error)
                  alert(i18n.accessControl?.forceDeleteLock?.genericError || 'An error occurred while deleting the lock.')
                }
              }}
            >
              {i18n.accessControl?.forceDeleteLock?.button || 'Force Delete Lock'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default AccessControl 