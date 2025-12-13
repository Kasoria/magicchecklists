import { useState, useEffect } from 'react'
import { Button, TextInput, Label, Alert, Spinner, Badge } from 'flowbite-react'

const MagicDashSettings = ({ adminData, onConnectionChange }) => {
  const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.mclAdminData?.i18n) || {}

  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    magicdashUrl: 'https://app.magicplugins.io',
    siteId: '',
    connectedAt: null,
    connectedPlugins: []
  })

  const [formData, setFormData] = useState({
    magicdashUrl: 'https://app.magicplugins.io',
    apiKey: ''
  })

  useEffect(() => {
    fetchConnectionStatus()
  }, [])

  const fetchConnectionStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'mcl_get_magicdash_connection',
          'nonce': adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        setConnectionStatus(data.data)
        setFormData(prev => ({
          ...prev,
          magicdashUrl: data.data.magicdashUrl || 'https://app.magicplugins.io'
        }))
      } else {
        setError(data.data?.message || 'Failed to fetch connection status')
      }
    } catch (err) {
      console.error('Error fetching connection status:', err)
      setError('Failed to load connection status')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.apiKey.trim()) {
      setError('Please enter your API key')
      return
    }

    try {
      setConnecting(true)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'mcl_connect_magicdash',
          'magicdash_url': formData.magicdashUrl,
          'api_key': formData.apiKey,
          'nonce': adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('Connected successfully! Your checklists will now sync with MagicDash.')
        setFormData(prev => ({ ...prev, apiKey: '' }))
        await fetchConnectionStatus()
        if (onConnectionChange) onConnectionChange(true)
      } else {
        setError(data.data?.message || 'Failed to connect')
      }
    } catch (err) {
      console.error('Error connecting:', err)
      setError('Failed to connect to MagicDash')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setError(null)
    setSuccess(null)

    if (!window.confirm('Are you sure you want to disconnect from MagicDash? This will affect all MagicPlugins on this site.')) {
      return
    }

    try {
      setDisconnecting(true)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'mcl_disconnect_magicdash',
          'nonce': adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('Disconnected successfully')
        await fetchConnectionStatus()
        if (onConnectionChange) onConnectionChange(false)
      } else {
        setError(data.data?.message || 'Failed to disconnect')
      }
    } catch (err) {
      console.error('Error disconnecting:', err)
      setError('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleTestConnection = async () => {
    setError(null)
    setSuccess(null)

    try {
      setTesting(true)

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'mcl_test_magicdash_connection',
          'nonce': adminData.nonces?.mcl_admin || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('Connection is working!')
      } else {
        setError(data.data?.message || 'Connection test failed')
      }
    } catch (err) {
      console.error('Error testing connection:', err)
      setError('Failed to test connection')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading connection status...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          MagicDash Connection
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Connect your WordPress site to MagicDash to manage all your checklists from a central dashboard.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert color="failure" onDismiss={() => setError(null)}>
          <span className="font-medium">Error:</span> {error}
        </Alert>
      )}
      {success && (
        <Alert color="success" onDismiss={() => setSuccess(null)}>
          <span className="font-medium">Success:</span> {success}
        </Alert>
      )}

      {connectionStatus.isConnected ? (
        /* Connected State */
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-green-800 dark:text-green-200">
                Connected to MagicDash
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">MagicDash URL</span>
              <a
                href={connectionStatus.magicdashUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {connectionStatus.magicdashUrl}
              </a>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Site ID</span>
              <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {connectionStatus.siteId}
              </code>
            </div>

            {connectionStatus.connectedAt && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Connected</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(connectionStatus.connectedAt * 1000).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Connected Plugins</span>
              <div className="flex gap-2">
                {connectionStatus.connectedPlugins.map(plugin => (
                  <Badge key={plugin} color="info">{plugin}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              color="light"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>

            <Button
              color="failure"
              outline
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Not Connected State */
        <form onSubmit={handleConnect} className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              How to connect:
            </h4>
            <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>Go to your MagicDash account at <a href="https://app.magicplugins.io" target="_blank" rel="noopener noreferrer" className="underline">app.magicplugins.io</a></li>
              <li>Navigate to Sites and click "Add Site"</li>
              <li>Copy the generated API key</li>
              <li>Paste it below and click Connect</li>
            </ol>
          </div>

          <div>
            <Label htmlFor="magicdash-url" value="MagicDash URL" className="mb-2 block" />
            <TextInput
              id="magicdash-url"
              type="url"
              value={formData.magicdashUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, magicdashUrl: e.target.value }))}
              placeholder="https://app.magicplugins.io"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Usually you don't need to change this unless you have a self-hosted instance.
            </p>
          </div>

          <div>
            <Label htmlFor="api-key" value="API Key" className="mb-2 block" />
            <TextInput
              id="api-key"
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="md_live_xxxxxxxxxxxxx"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The API key from your MagicDash account.
            </p>
          </div>

          <Button
            type="submit"
            color="blue"
            disabled={connecting}
          >
            {connecting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Connecting...
              </>
            ) : (
              'Connect to MagicDash'
            )}
          </Button>
        </form>
      )}

      {/* Info about shared connection */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Shared Connection:</strong> This connection is shared across all MagicPlugins on this site.
            When you connect here, MagicAssistant and other MagicPlugins will automatically use the same connection.
          </p>
        </div>
      </div>
    </div>
  )
}

MagicDashSettings.displayName = 'MagicDashSettings'

export default MagicDashSettings
