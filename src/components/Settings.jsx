import { useState, useEffect } from 'react'
import { Card, Button, Tabs, TabItem } from 'flowbite-react'
import GeneralSettings from './settings/GeneralSettings.jsx'
import DashboardSettings from './settings/DashboardSettings.jsx'
import IntegrationSettings from './settings/IntegrationSettings.jsx'
import MagicDashSettings from './settings/MagicDashSettings.jsx'
import { useToast } from './Toast.jsx'

const Settings = ({ adminData }) => {
  // Get i18n data
  const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.mclAdminData?.i18n) || {};
  
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    general: {},
    dashboard: {},
    integration: {}
  })

  const { showSuccess, showError } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'mcl_get_settings',
          'nonce': adminData.nonces?.mcl_admin || ''
        })
      })
      
      if (!response.ok) {
        throw new Error(i18n.settings?.errors?.fetchFailed || 'Failed to fetch settings')
      }
      
      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
      } else {
        throw new Error(data.data?.message || i18n.settings?.errors?.fetchFailed || 'Failed to fetch settings')
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
      showError(i18n.settings?.errors?.loadFailed || 'Failed to load settings. Please try again.', {
        title: i18n.settings?.errors?.loadFailedTitle || 'Settings Load Failed',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (section, sectionSettings) => {
    try {
      setLoading(true)
      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'action': 'mcl_save_settings',
          'section': section,
          'settings': JSON.stringify(sectionSettings),
          'nonce': adminData.nonces?.mcl_admin || ''
        })
      })
      
      if (!response.ok) {
        throw new Error(i18n.settings?.errors?.saveFailed || 'Failed to save settings')
      }
      
      const data = await response.json()
      if (data.success) {
        // Update local state
        setSettings(prev => ({
          ...prev,
          [section]: sectionSettings
        }))
        
        showSuccess(i18n.settings?.success?.saved || 'Settings saved successfully!', {
          title: i18n.settings?.success?.savedTitle || 'Settings Saved',
          duration: 4000
        })
      } else {
        throw new Error(data.data?.message || i18n.settings?.errors?.saveFailed || 'Failed to save settings')
      }
    } catch (err) {
      console.error('Error saving settings:', err)
      showError(err.message || i18n.settings?.errors?.saveFailedRetry || 'Failed to save settings. Please try again.', {
        title: i18n.settings?.errors?.saveFailedTitle || 'Save Failed',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && Object.keys(settings.general).length === 0) {
    return (
      <div className="space-y-6">
        <Card className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
          <div className="animate-pulse">
            <div className="flex space-x-4 mb-6">
              <div className="h-10 bg-gray-200 rounded dark:bg-gray-700 w-20"></div>
              <div className="h-10 bg-gray-200 rounded dark:bg-gray-700 w-32"></div>
              <div className="h-10 bg-gray-200 rounded dark:bg-gray-700 w-28"></div>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-32"></div>
                  <div className="h-10 bg-gray-200 rounded dark:bg-gray-700 w-full"></div>
                  <div className="h-3 bg-gray-200 rounded dark:bg-gray-700 w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
          <span className="sr-only">{i18n.settings?.loading?.srOnly || 'Loading settings...'}</span>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
        <Tabs
          aria-label={i18n.settings?.tabs?.ariaLabel || 'Settings tabs'}
          variant="underline"
          onActiveTabChange={(tab) => setActiveTab(['general', 'dashboard', 'integrations', 'magicdash'][tab])}
        >
          <TabItem 
            active={activeTab === 'general'} 
            title={i18n.settings?.tabs?.general || 'General'}
            icon={() => (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          >
            <GeneralSettings
              settings={settings.general}
              onSave={(generalSettings) => saveSettings('general', generalSettings)}
              loading={loading}
              adminData={adminData}
            />
          </TabItem>
          
          <TabItem 
            active={activeTab === 'dashboard'} 
            title={i18n.settings?.tabs?.dashboardWidget || 'Dashboard Widget'}
            icon={() => (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )}
          >
            <DashboardSettings
              settings={settings.dashboard}
              onSave={(dashboardSettings) => saveSettings('dashboard', dashboardSettings)}
              loading={loading}
              adminData={adminData}
            />
          </TabItem>
          
          <TabItem 
            active={activeTab === 'integrations'} 
            title={i18n.settings?.tabs?.integrations || 'Integrations'}
            icon={() => (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          >
            <IntegrationSettings
              settings={settings.integration}
              onSave={(integrationSettings) => saveSettings('integration', integrationSettings)}
              loading={loading}
              adminData={adminData}
            />
          </TabItem>

          <TabItem
            active={activeTab === 'magicdash'}
            title={i18n.settings?.tabs?.magicdash || 'MagicDash'}
            icon={() => (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            )}
          >
            <MagicDashSettings
              adminData={adminData}
            />
          </TabItem>
        </Tabs>
      </Card>
    </div>
  )
}

// Ensure component has a display name for debugging
Settings.displayName = 'Settings'

export default Settings 