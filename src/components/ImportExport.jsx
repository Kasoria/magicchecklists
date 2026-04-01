import React, { useEffect, useState } from 'react'
import { Table, Button, Card, Spinner, Label, TextInput } from 'flowbite-react'
import { useToast } from './Toast.jsx'

const ImportExport = ({ adminData }) => {
  // Get i18n data
  const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.magicclAdminData?.i18n) || {};
  
  const { showSuccess, showError } = useToast()
  const [importedChecklistId, setImportedChecklistId] = useState(null)
  const [checklists, setChecklists] = useState([])
  const [loading, setLoading] = useState(true)
  const [importText, setImportText] = useState('')
  const [importFile, setImportFile] = useState(null)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [selectedChecklistForPdf, setSelectedChecklistForPdf] = useState(null)
  const [pdfSettings, setPdfSettings] = useState({
    logoUrl: '',
    headerText: '',
    contactInfo: '',
    footerText: ''
  })

  useEffect(() => {
    // Check for URL parameters for import success/error
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('imported') === '1') {
      const checklistId = urlParams.get('checklist_id')
      if (checklistId) {
        setImportedChecklistId(checklistId)
        showSuccess(
          <div>
            <p>{i18n.importExport?.messages?.importSuccess || 'Checklist imported successfully!'}</p>
            <a 
              href={`${adminData.admin_url}admin.php?page=magiccl_checklists&checklist_id=${checklistId}&type=classic`}
              className="underline hover:no-underline font-medium"
              onClick={() => window.location.href = `${adminData.admin_url}admin.php?page=magiccl_add_new&checklist_id=${checklistId}&type=classic`}
            >
              {i18n.importExport?.buttons?.editImported || 'Edit the imported checklist →'}
            </a>
          </div>,
          {
            title: i18n.importExport?.titles?.importComplete || 'Import Complete',
            duration: 8000
          }
        )
      }
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname + '?page=magiccl_import')
    } else if (urlParams.get('error') === '1') {
      showError(i18n.importExport?.errors?.importFailed || 'Failed to import checklist. Please try again.')
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname + '?page=magiccl_import')
    }

    // Fetch all checklists via AJAX
    const fetchData = async () => {
      try {
        
        const formData = new FormData()
        formData.append('action', 'magiccl_get_checklists')
        formData.append('_ajax_nonce', adminData.nonces.magiccl_admin)

        const response = await fetch(adminData.ajaxurl, {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.data && Array.isArray(result.data.data)) {
          // Only classic checklists for import/export
          const classics = result.data.data.filter(item => !item.type || item.type === 'classic')
          setChecklists(classics)
        } else {
          const errorMsg = typeof result.data === 'string' ? result.data : (i18n.importExport?.errors?.loadChecklistsFailed || 'Failed to load checklists')
          throw new Error(errorMsg)
        }
      } catch (err) {
        console.error('Error fetching checklists:', err)
        showError(err.message || i18n.importExport?.errors?.loadError || 'An error occurred while loading checklists')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [adminData, showSuccess, showError])

  const handleTextImport = e => {
    e.preventDefault()
    const form = document.getElementById('import-text-form')
    if (form) {
      form.submit()
    }
  }

  const handleFileImport = e => {
    e.preventDefault()
    const fileInput = document.getElementById('importFile')
    const form = document.getElementById('import-json-form')
    
    // Check if file input exists
    if (!fileInput) {
      showError(i18n.importExport?.errors?.fileInputNotFound || 'File input not found. Please try again.')
      return
    }
    
    // Validate that a file is actually selected
    if (!fileInput.files || fileInput.files.length === 0) {
      showError(i18n.importExport?.errors?.selectFile || 'Please select a JSON file to import.')
      return
    }
    
    // Validate file type
    const file = fileInput.files[0]
    if (!file.name.toLowerCase().endsWith('.json')) {
      showError(i18n.importExport?.errors?.validJsonFile || 'Please select a valid JSON file.')
      return
    }
    
    if (form) {
      form.submit()
    }
  }

  const handleExport = async (type, checklistId) => {
    if (type === 'pdf') {
      setSelectedChecklistForPdf(checklistId)
      setShowPdfModal(true)
      return
    }

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = `${adminData.admin_url}admin-post.php`
    form.target = '_blank'
    
    const actionInput = document.createElement('input')
    actionInput.type = 'hidden'
    actionInput.name = 'action'
    actionInput.value = `export_checklist_${type}`
    form.appendChild(actionInput)
    
    const idInput = document.createElement('input')
    idInput.type = 'hidden'
    idInput.name = 'checklist_id'
    idInput.value = checklistId
    form.appendChild(idInput)
    
    const nonceInput = document.createElement('input')
    nonceInput.type = 'hidden'
    nonceInput.name = 'magiccl_nonce'
    nonceInput.value = adminData.nonces[`magiccl_export_${type}`]
    form.appendChild(nonceInput)
    
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  const handlePdfExport = async () => {
    try {
      // First save PDF settings
      const formData = new FormData()
      formData.append('action', 'magiccl_save_pdf_settings')
      formData.append('pdf_logo_url', pdfSettings.logoUrl)
      formData.append('pdf_header_text', pdfSettings.headerText)
      formData.append('pdf_contact_info', pdfSettings.contactInfo)
      formData.append('pdf_footer_text', pdfSettings.footerText)
      formData.append('_ajax_nonce', adminData.nonces.magiccl_save_pdf_settings || adminData.nonces.magiccl_admin)

      const saveResponse = await fetch(adminData.ajaxurl, {
        method: 'POST',
        body: formData
      })

      const saveResult = await saveResponse.json()
      if (!saveResult.success) {
        throw new Error(saveResult.data || 'Failed to save PDF settings')
      }

      // Then export PDF
      const exportForm = document.createElement('form')
      exportForm.method = 'POST'
      exportForm.action = `${adminData.admin_url}admin-post.php`
      exportForm.target = '_blank'
      
      const inputs = {
        action: 'export_checklist_pdf',
        checklist_id: selectedChecklistForPdf,
        export_id: saveResult.data.export_id,
        magiccl_nonce: adminData.nonces.magiccl_export_pdf
      }

      Object.entries(inputs).forEach(([name, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value
        exportForm.appendChild(input)
      })
      
      document.body.appendChild(exportForm)
      exportForm.submit()
      document.body.removeChild(exportForm)
      
      setShowPdfModal(false)
      showSuccess(i18n.importExport?.messages?.pdfExportSuccess || 'PDF export started! Check your browser downloads.')
    } catch (err) {
      console.error('PDF export error:', err)
      showError(err.message || i18n.importExport?.errors?.pdfExportFailed || 'Failed to export PDF')
    }
  }

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="xl" />
          <span className="ml-3 text-lg">{i18n.importExport?.loading?.checklists || 'Loading checklists...'}</span>
        </div>
      ) : (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">{i18n.importExport?.titles?.exportChecklists || 'Export Classic Checklists'}</h2>
          {checklists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">{i18n.importExport?.messages?.noChecklists || 'No classic checklists found.'}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                {i18n.importExport?.messages?.createChecklistsFirst || 'Create some classic checklists first to enable export functionality.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">{i18n.importExport?.table?.headers?.title || 'Title'}</th>
                    <th scope="col" className="px-6 py-3">{i18n.importExport?.table?.headers?.items || 'Items'}</th>
                    <th scope="col" className="px-6 py-3">{i18n.importExport?.table?.headers?.actions || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {checklists.map(item => (
                    <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.title}</td>
                      <td className="px-6 py-4">{item.items_count || 0} {i18n.importExport?.table?.itemsLabel || 'items'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            color="gray" 
                            onClick={() => handleExport('txt', item.id)}
                          >
                            TXT
                          </Button>
                          <Button 
                            size="sm" 
                            color="blue" 
                            onClick={() => handleExport('json', item.id)}
                          >
                            JSON
                          </Button>
                          <Button 
                            size="sm" 
                            color="yellow" 
                            onClick={() => handleExport('pdf', item.id)}
                          >
                            PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4 dark:text-white">{i18n.importExport?.titles?.importFromText || 'Import from Text'}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {i18n.importExport?.descriptions?.importText || 'Import checklist items from plain text. Enter one item per line.'}
          </p>
          <form id="import-text-form" action={`${adminData.admin_url}admin-post.php`} method="post">
            <input type="hidden" name="action" value="import_checklist" />
            <input type="hidden" name="type" value="classic" />
            <input type="hidden" name="magiccl_nonce" value={adminData.nonces.magiccl_import_checklist} />
            <Label htmlFor="importText">{i18n.importExport?.labels?.pasteItems || 'Paste items (one per line)'}</Label>
            <textarea
              id="importText"
              name="checklist_items"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              rows={6}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder={i18n.importExport?.placeholders?.enterItems || 'Enter each checklist item on a new line...'}
            />
            <Button size="sm" className="mt-4" onClick={handleTextImport} disabled={!importText.trim()}>
              {i18n.importExport?.buttons?.importText || 'Import Text'}
            </Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold mb-4 dark:text-white">{i18n.importExport?.titles?.importFromJson || 'Import from JSON'}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {i18n.importExport?.descriptions?.importJson || 'Import a complete checklist from a JSON file exported from MagicChecklists.'}
          </p>
          <form
            id="import-json-form"
            action={`${adminData.admin_url}admin-post.php`}
            method="post"
            encType="multipart/form-data"
          >
            <input type="hidden" name="action" value="import_json_checklist" />
            <input type="hidden" name="type" value="classic" />
            <input type="hidden" name="magiccl_json_nonce" value={adminData.nonces.magiccl_import_json_checklist} />
            
                        <Label htmlFor="importFile">{i18n.importExport?.labels?.uploadFile || 'Upload JSON File'}</Label>
            
            {/* Always render the file input but keep it hidden */}
            <input
              id="importFile"
              type="file"
              name="json_file"
              accept=".json"
              className="hidden"
              onChange={e => setImportFile(e.target.files[0])}
            />
            
            {!importFile ? (
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors mt-2 bg-gray-50 dark:bg-gray-700"
                onDragOver={e => { e.preventDefault() }}
                onDragEnter={e => { e.preventDefault(); e.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20') }}
                onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20') }}
                onDrop={e => { 
                  e.preventDefault()
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20')
                  const files = e.dataTransfer.files
                  if (files[0] && files[0].name.toLowerCase().endsWith('.json')) {
                    setImportFile(files[0])
                    // Update the actual file input
                    const fileInput = document.getElementById('importFile')
                    const dataTransfer = new DataTransfer()
                    dataTransfer.items.add(files[0])
                    fileInput.files = dataTransfer.files
                  }
                }}
                onClick={() => document.getElementById('importFile').click()}
              >
                <div className="space-y-3">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-300">{i18n.importExport?.messages?.dragDropFile || 'Drag and drop JSON file here or click to select'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{i18n.importExport?.messages?.jsonOnly || 'Only .json files are supported'}</p>
                </div>
              </div>
            ) : (
              <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{importFile.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{(importFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => {
                      setImportFile(null)
                      // Clear the actual file input
                      const fileInput = document.getElementById('importFile')
                      if (fileInput) {
                        fileInput.value = ''
                      }
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            <Button size="sm" className="mt-4" onClick={handleFileImport} disabled={!importFile}>
              {i18n.importExport?.buttons?.importJson || 'Import JSON'}
            </Button>
          </form>
        </Card>
      </div>

      {/* PDF Export Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{i18n.importExport?.titles?.pdfExportSettings || 'PDF Export Settings'}</h3>
              <button
                onClick={() => setShowPdfModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="logoUrl">{i18n.importExport?.labels?.logoUrl || 'Header Logo URL'}</Label>
                <TextInput
                  id="logoUrl"
                  type="url"
                  value={pdfSettings.logoUrl}
                  onChange={e => setPdfSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder={i18n.importExport?.placeholders?.logoUrl || 'https://example.com/logo.png'}
                />
              </div>
              
              <div>
                <Label htmlFor="headerText">{i18n.importExport?.labels?.headerText || 'Header Text'}</Label>
                <textarea
                  id="headerText"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  value={pdfSettings.headerText}
                  onChange={e => setPdfSettings(prev => ({ ...prev, headerText: e.target.value }))}
                  placeholder={i18n.importExport?.placeholders?.headerText || 'Header text for your PDF...'}
                />
              </div>
              
              <div>
                <Label htmlFor="contactInfo">{i18n.importExport?.labels?.contactInfo || 'Contact Information'}</Label>
                <textarea
                  id="contactInfo"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  value={pdfSettings.contactInfo}
                  onChange={e => setPdfSettings(prev => ({ ...prev, contactInfo: e.target.value }))}
                  placeholder={i18n.importExport?.placeholders?.contactInfo || 'Contact information...'}
                />
              </div>
              
              <div>
                <Label htmlFor="footerText">{i18n.importExport?.labels?.footerText || 'Footer Text'}</Label>
                <textarea
                  id="footerText"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  value={pdfSettings.footerText}
                  onChange={e => setPdfSettings(prev => ({ ...prev, footerText: e.target.value }))}
                  placeholder={i18n.importExport?.placeholders?.footerText || 'Footer text...'}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button color="gray" onClick={() => setShowPdfModal(false)}>
                {i18n.importExport?.buttons?.cancel || 'Cancel'}
              </Button>
              <Button color="yellow" onClick={handlePdfExport}>
                {i18n.importExport?.buttons?.exportPdf || 'Export PDF'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportExport 