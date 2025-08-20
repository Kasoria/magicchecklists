import { useState, useEffect } from 'react'
import { useToast } from './Toast.jsx'

const License = ({ adminData }) => {
  // Get i18n data
  const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.mclAdminData?.i18n) || {};
  
  const [licenseData, setLicenseData] = useState({
    isActive: false,
    licenseKey: '',
    activationId: '',
    maskedKey: '',
    loading: true,
    submitting: false
  })
  const { showSuccess, showError } = useToast()

  // Function to mask license key for display
  const maskLicenseKey = (key) => {
    if (!key) return ''
    const length = key.length
    if (length <= 10) {
      return 'X'.repeat(length)
    }
    return key.substring(0, 5) + 'X'.repeat(length - 10) + key.substring(length - 5)
  }

  // Load current license status
  useEffect(() => {
    loadLicenseStatus()
  }, [])

  const loadLicenseStatus = async () => {
    try {
      const formData = new FormData()
      formData.append('action', 'mcl_get_license_status')
      formData.append('nonce', adminData.nonces?.mcl_admin || '')

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setLicenseData(prev => ({
          ...prev,
          isActive: data.data.isActive,
          licenseKey: data.data.licenseKey || '',
          activationId: data.data.activationId || '',
          maskedKey: data.data.licenseKey ? maskLicenseKey(data.data.licenseKey) : '',
          loading: false
        }))
      } else {
        setLicenseData(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error(i18n.license?.console?.errorLoadingStatus || 'Error loading license status:', error)
      setLicenseData(prev => ({ ...prev, loading: false }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLicenseData(prev => ({ ...prev, submitting: true }))

    try {
      const formData = new FormData()
      const action = licenseData.isActive ? 'mcl_deactivate_license' : 'mcl_activate_license'
      
      formData.append('action', action)
      formData.append('nonce', adminData.nonces?.mcl_admin || '')
      
      if (!licenseData.isActive) {
        // For activation, send the license key
        formData.append('license_key', licenseData.licenseKey)
      }

      const response = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        showSuccess(data.data?.message || (licenseData.isActive ? (i18n.license?.messages?.deactivateSuccess || 'License deactivated successfully') : (i18n.license?.messages?.activateSuccess || 'License activated successfully')))
        loadLicenseStatus() // Reload the license status
      } else {
        showError(data.data?.message || i18n.license?.errors?.operationFailed || 'License operation failed')
      }
    } catch (error) {
      console.error(i18n.license?.console?.errorProcessing || 'Error processing license:', error)
      showError(i18n.license?.errors?.processingError || 'An error occurred while processing the license')
    } finally {
      setLicenseData(prev => ({ ...prev, submitting: false }))
    }
  }

  const handleLicenseKeyChange = (e) => {
    setLicenseData(prev => ({
      ...prev,
      licenseKey: e.target.value
    }))
  }

  if (licenseData.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    )
  }

  const action = licenseData.isActive ? 'deactivate' : 'activate'

  return (
    <div className="mcl-wrap max-w-4xl mx-auto">
      <div className="mcl-header mb-8">
        <div className="mcl-title-wrapper mb-4">
          <h1 className="text-3xl font-bold text-brand-dark dark:text-white">
            {i18n.license?.title || 'Manage License'}
          </h1>
        </div>
        <div className="mcl-intro">
          <p className="text-gray-600 dark:text-gray-300">
            {action === 'activate' 
              ? (i18n.license?.descriptions?.enterKey || 'Enter your license key to activate MagicChecklists.')
              : (i18n.license?.descriptions?.activated || 'Your license is successfully activated for this site.')
            }
          </p>
        </div>
      </div>

      <div className="mcl-content bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form 
          method="post" 
          className="mcl-form"
          onSubmit={handleSubmit}
        >
          <div className="mcl-form-section">
            <div className="mcl-form-group">
              {action === 'activate' ? (
                <>
                  <label htmlFor="license_key_input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {i18n.license?.labels?.licenseKey || 'License Key'}
                  </label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent dark:bg-gray-700 dark:text-white" 
                    type="text" 
                    name="license_key" 
                    id="license_key_input" 
                    value={licenseData.licenseKey}
                    onChange={handleLicenseKeyChange}
                    placeholder={i18n.license?.placeholders?.enterKey || 'Enter your license key'}
                    autoComplete="off"
                    required
                  />
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {i18n.license?.labels?.licenseKey || 'License Key'}
                  </label>
                  <div className="mcl-license-display bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 font-mono text-lg tracking-widest text-gray-800 dark:text-gray-200">
                    {licenseData.maskedKey}
                  </div>
                </>
              )}

              {licenseData.isActive && (
                <div className="mcl-activation-info mt-4">
                  <p className="text-gray-600 dark:text-gray-300 flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {i18n.license?.messages?.activatedOn || 'Activated on'}: {window.location.hostname}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mcl-form-actions mt-6">
            {action === 'activate' ? (
              <button 
                type="submit" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-brand-dark bg-brand-accent hover:bg-brand-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={licenseData.submitting}
              >
                {licenseData.submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {i18n.license?.buttons?.activating || 'Activating...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {i18n.license?.buttons?.activateLicense || 'Activate License'}
                  </>
                )}
              </button>
            ) : (
              <button 
                type="submit" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={licenseData.submitting}
              >
                {licenseData.submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {i18n.license?.buttons?.deactivating || 'Deactivating...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {i18n.license?.buttons?.deactivateLicense || 'Deactivate License'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default License 