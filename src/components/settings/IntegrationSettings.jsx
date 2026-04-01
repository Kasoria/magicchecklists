import { useState, useEffect } from 'react'
import { Button, Label, Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from 'flowbite-react'
import { useToast } from '../Toast.jsx'

const IntegrationSettings = ({ settings, onSave, loading, adminData }) => {
  // Get i18n data
  const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.magicclAdminData?.i18n) || {};
  
  const [formData, setFormData] = useState({
    enable_api: true,
    webhook_secret: '',
    webhook_endpoints: [],
    mainwp_api_key: '',
    magiccl_api_key: ''
  })

  const [webhookLogs, setWebhookLogs] = useState([])
  const [showApiKey, setShowApiKey] = useState(false)
  const [showMainWPKey, setShowMainWPKey] = useState(false)

  const { showSuccess, showError } = useToast()

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings,
        // Ensure webhook_endpoints is always an array
        webhook_endpoints: Array.isArray(settings.webhook_endpoints) ? settings.webhook_endpoints : []
      }))
    }
  }, [settings])

  useEffect(() => {
    fetchWebhookLogs()
  }, [])

  const fetchWebhookLogs = async () => {
    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'magiccl_get_webhook_logs',
          'nonce': adminData.nonces?.magiccl_admin || ''
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setWebhookLogs(data.data || [])
        }
      }
    } catch (err) {
      console.error('Error fetching webhook logs:', err)
    }
  }

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddEndpoint = () => {
    setFormData(prev => ({
      ...prev,
      webhook_endpoints: [...prev.webhook_endpoints, '']
    }))
  }

  const handleUpdateEndpoint = (index, value) => {
    setFormData(prev => ({
      ...prev,
      webhook_endpoints: prev.webhook_endpoints.map((endpoint, i) => 
        i === index ? value : endpoint
      )
    }))
  }

  const handleRemoveEndpoint = (index) => {
    if (confirm(i18n.integrationSettings?.confirmations?.deleteEndpoint || 'Are you sure you want to delete this webhook endpoint?')) {
      setFormData(prev => ({
        ...prev,
        webhook_endpoints: prev.webhook_endpoints.filter((_, i) => i !== index)
      }))
    }
  }

  const handleTestEndpoint = async (endpoint) => {
    if (!endpoint) return

    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'magiccl_test_webhook',
          'endpoint': endpoint,
          'nonce': adminData.nonces?.magiccl_admin || ''
        })
      })
      
      const data = await response.json()
      if (data.success) {
        showSuccess(i18n.integrationSettings?.messages?.connectionSuccess || 'Connection successful!', {
          title: i18n.integrationSettings?.titles?.webhookTest || 'Webhook Test',
          duration: 3000
        })
      } else {
        showError(`${i18n.integrationSettings?.messages?.connectionFailed || 'Connection failed'}: ${data.data?.message || i18n.integrationSettings?.messages?.unknownError || 'Unknown error'}`, {
          title: i18n.integrationSettings?.titles?.webhookTestFailed || 'Webhook Test Failed',
          duration: 5000
        })
      }
    } catch (err) {
      showError(`${i18n.integrationSettings?.messages?.connectionFailed || 'Connection failed'}: ${i18n.integrationSettings?.messages?.networkError || 'Network error'}`, {
        title: i18n.integrationSettings?.titles?.webhookTestFailed || 'Webhook Test Failed',
        duration: 5000
      })
    }
  }

  const generateWebhookSecret = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    handleInputChange('webhook_secret', secret)
  }

  const generateApiKey = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const prefix = 'magiccl_'
    let key = prefix
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    if (formData.magiccl_api_key && !confirm(i18n.integrationSettings?.confirmations?.regenerateApiKey || 'Are you sure you want to regenerate the API key? This will invalidate the existing key.')) {
      return
    }
    
    handleInputChange('magiccl_api_key', key)
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(formData.magiccl_api_key).then(() => {
      showSuccess(i18n.integrationSettings?.messages?.apiKeyCopied || 'API key copied to clipboard!', {
        title: i18n.integrationSettings?.titles?.copied || 'Copied',
        duration: 2000
      })
    })
  }

  const clearWebhookLogs = async () => {
    if (!confirm(i18n.integrationSettings?.confirmations?.clearLogs || 'Are you sure you want to clear all webhook logs?')) {
      return
    }

    try {
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'magiccl_clear_webhook_logs',
          'nonce': adminData.nonces?.magiccl_admin || ''
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setWebhookLogs([])
        showSuccess(i18n.integrationSettings?.messages?.logsCleared || 'Webhook logs cleared successfully!', {
          title: i18n.integrationSettings?.titles?.logsCleared || 'Logs Cleared',
          duration: 3000
        })
      } else {
        throw new Error(data.data?.message || i18n.integrationSettings?.errors?.clearLogsFailed || 'Failed to clear logs')
      }
    } catch (err) {
      showError(err.message || i18n.integrationSettings?.errors?.clearLogsError || 'Failed to clear webhook logs', {
        title: i18n.integrationSettings?.titles?.clearFailed || 'Clear Failed',
        duration: 5000
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-brand-dark dark:text-white mb-4">{i18n.integrationSettings?.title || 'API & Webhook Settings'}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          {i18n.integrationSettings?.description || 'Enable / disable the API endpoints of MagicChecklists, test webhook URLs and more.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* REST API Access */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            {i18n.integrationSettings?.labels?.restApiAccess || 'REST API Access'}
          </Label>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.enable_api}
                onChange={(e) => handleInputChange('enable_api', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {i18n.integrationSettings?.descriptions?.restApiAccess || 'Enable REST API access for MagicChecklists. When disabled, all plugin-specific API endpoints will be inaccessible.'}
          </p>
        </div>

        {/* Webhook Secret */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            {i18n.integrationSettings?.labels?.webhookSecret || 'Webhook Secret'}
          </Label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={formData.webhook_secret}
              onChange={(e) => handleInputChange('webhook_secret', e.target.value)}
              placeholder={i18n.integrationSettings?.placeholders?.webhookSecret || 'Enter a secret key for webhook security'}
              className="flex-1 px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent text-brand-dark dark:text-white"
            />
            <Button
              type="button"
              color="gray"
              onClick={generateWebhookSecret}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            >
              {i18n.integrationSettings?.buttons?.generateSecret || 'Generate Secret'}
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {i18n.integrationSettings?.descriptions?.webhookSecret || 'This secret key will be used to sign webhook payloads for security verification.'}
          </p>
        </div>

        {/* Webhook Endpoints */}
        <div className="space-y-4">
          <Label className="text-brand-dark dark:text-white font-medium">
            {i18n.integrationSettings?.labels?.webhookEndpoints || 'Webhook Endpoints'}
          </Label>
          <div className="space-y-3">
            {formData.webhook_endpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="url"
                  value={endpoint}
                  onChange={(e) => handleUpdateEndpoint(index, e.target.value)}
                  placeholder="https://"
                  className="flex-1 px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent text-brand-dark dark:text-white"
                />
                <Button
                  type="button"
                  size="sm"
                  color="gray"
                  onClick={() => handleTestEndpoint(endpoint)}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
                >
                  {i18n.integrationSettings?.buttons?.test || 'Test'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  color="gray"
                  onClick={() => handleRemoveEndpoint(index)}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
                >
                  {i18n.integrationSettings?.buttons?.remove || 'Remove'}
                </Button>
              </div>
            ))}
            <Button
              type="button"
              color="gray"
              onClick={handleAddEndpoint}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            >
              {i18n.integrationSettings?.buttons?.addEndpoint || 'Add Endpoint'}
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {i18n.integrationSettings?.descriptions?.webhookEndpoints || 'Add URLs where webhook notifications should be sent when checklist events occur.'}
          </p>
        </div>

        {/* MainWP API Key */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            {i18n.integrationSettings?.labels?.mainwpApiKey || 'MainWP API Key'}
          </Label>
          <div className="flex items-center space-x-2">
            <input
              type={showMainWPKey ? "text" : "password"}
              value={formData.mainwp_api_key}
              onChange={(e) => handleInputChange('mainwp_api_key', e.target.value)}
              placeholder={i18n.integrationSettings?.placeholders?.mainwpApiKey || 'Enter your MainWP API key'}
              className="flex-1 px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent text-brand-dark dark:text-white"
            />
            <Button
              type="button"
              color="gray"
              onClick={() => setShowMainWPKey(!showMainWPKey)}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            >
              {showMainWPKey ? (i18n.integrationSettings?.buttons?.hide || 'Hide') : (i18n.integrationSettings?.buttons?.show || 'Show')}
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {i18n.integrationSettings?.descriptions?.mainwpApiKey || 'Enter the API key generated from your MainWP dashboard to enable communication between MainWP and MagicChecklists.'}
          </p>
        </div>

        {/* MagicChecklists API Key */}
        <div className="space-y-2">
          <Label className="text-brand-dark dark:text-white font-medium">
            {i18n.integrationSettings?.labels?.magicclApiKey || 'MagicChecklists API Key'}
          </Label>
          <div className="flex items-center space-x-2">
            <input
              type={showApiKey ? "text" : "password"}
              value={formData.magiccl_api_key}
              readOnly
              placeholder={i18n.integrationSettings?.placeholders?.noApiKey || 'No API key generated'}
              className="flex-1 px-3 py-2 border border-gray-300 bg-gray-50 dark:bg-gray-600 dark:border-gray-600 rounded-md shadow-sm text-brand-dark dark:text-white"
            />
            <Button
              type="button"
              color="gray"
              onClick={generateApiKey}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            >
              {formData.magiccl_api_key ? (i18n.integrationSettings?.buttons?.regenerate || 'Regenerate') : (i18n.integrationSettings?.buttons?.generate || 'Generate')}
            </Button>
            <Button
              type="button"
              color="gray"
              onClick={() => setShowApiKey(!showApiKey)}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            >
              {showApiKey ? (i18n.integrationSettings?.buttons?.hide || 'Hide') : (i18n.integrationSettings?.buttons?.show || 'Show')}
            </Button>
            {formData.magiccl_api_key && (
              <Button
                type="button"
                color="gray"
                onClick={copyApiKey}
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
              >
                {i18n.integrationSettings?.buttons?.copy || 'Copy'}
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {i18n.integrationSettings?.descriptions?.magicclApiKey || 'Generate an API key to allow third-party applications to access your MagicChecklists data through the v2 API endpoints.'}
          </p>
          {formData.magiccl_api_key && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {i18n.integrationSettings?.warnings?.regenerateApiKey || 'Warning: Regenerating the API key will invalidate any existing integrations using the current key.'}
            </p>
          )}
        </div>

        {/* Webhook Logs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-brand-dark dark:text-white font-medium">
              {i18n.integrationSettings?.labels?.webhookLogs || 'Webhook Logs'}
            </Label>
            {webhookLogs.length > 0 && (
              <Button
                type="button"
                color="gray"
                onClick={clearWebhookLogs}
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
              >
                {i18n.integrationSettings?.buttons?.clearLogs || 'Clear Logs'}
              </Button>
            )}
          </div>
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell className="text-brand-dark dark:text-white">{i18n.integrationSettings?.table?.headers?.time || 'Time'}</TableHeadCell>
                  <TableHeadCell className="text-brand-dark dark:text-white">{i18n.integrationSettings?.table?.headers?.event || 'Event'}</TableHeadCell>
                  <TableHeadCell className="text-brand-dark dark:text-white">{i18n.integrationSettings?.table?.headers?.endpoint || 'Endpoint'}</TableHeadCell>
                  <TableHeadCell className="text-brand-dark dark:text-white">{i18n.integrationSettings?.table?.headers?.status || 'Status'}</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y divide-gray-200 dark:divide-gray-600">
                {webhookLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      {i18n.integrationSettings?.messages?.noLogsFound || 'No webhook logs found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  webhookLogs.map((log, index) => (
                    <TableRow key={index} className="bg-white dark:bg-brand-dark">
                      <TableCell className="text-brand-dark dark:text-white">{log.time}</TableCell>
                      <TableCell className="text-brand-dark dark:text-white">{log.event}</TableCell>
                      <TableCell className="text-brand-dark dark:text-white">{log.endpoint}</TableCell>
                      <TableCell className="text-brand-dark dark:text-white">{log.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-brand-accent hover:bg-brand-accent/90 focus:ring-brand-accent text-brand-dark font-medium dark:bg-brand-accent hover:dark:bg-brand-accent/90"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {i18n.integrationSettings?.buttons?.saving || 'Saving...'}
              </>
            ) : (
              i18n.integrationSettings?.buttons?.save || 'Save Integration Settings'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Ensure component has a display name for debugging
IntegrationSettings.displayName = 'IntegrationSettings'

export default IntegrationSettings 