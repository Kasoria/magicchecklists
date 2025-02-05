import { ValidationUtils } from '../common/mcl-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    const ImportExportManager = {
        init() {
            this.initTabHandling();
            this.initFormHandling();
            this.initTextareaHandling();
            this.initJSONUpload();
        },

        initTabHandling() {
            const tabLinks = document.querySelectorAll('.mcl-tab-link');
            const tabContents = document.querySelectorAll('.mcl-tab-content');

            tabLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Remove active class from all tabs and contents
                    tabLinks.forEach(tab => tab.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    // Add active class to clicked tab and corresponding content
                    link.classList.add('active');
                    const targetId = link.getAttribute('data-tab');
                    document.getElementById(targetId).classList.add('active');
                });
            });
        },

        initFormHandling() {
            const importForm = document.querySelector('.mcl-import-form');
            if (importForm) {
                importForm.addEventListener('submit', (e) => this.handleImportSubmit(e));
            }
        },

        initTextareaHandling() {
            const textarea = document.getElementById('mcl_import_textarea');
            if (!textarea) return;

            // Add paste handling
            textarea.addEventListener('paste', (e) => this.handlePaste(e));

            // Auto-resize textarea
            textarea.addEventListener('input', () => this.autoResizeTextarea(textarea));

            // Handle tab key
            textarea.addEventListener('keydown', (e) => this.handleTabKey(e));
        },

        handleImportSubmit(e) {
            const textarea = document.getElementById('mcl_import_textarea');
            if (!textarea) return;

            const lines = textarea.value.trim().split('\n');
            const nonEmptyLines = lines.filter(line => line.trim().length > 0);

            if (nonEmptyLines.length === 0) {
                e.preventDefault();
                ValidationUtils.showError(
                    document.querySelector('.mcl-error') || this.createErrorElement(textarea),
                    'Please enter at least one item'
                );
                return;
            }

            textarea.value = nonEmptyLines.join('\n');
        },

        handlePaste(e) {
            e.preventDefault();
            let pastedText = (e.clipboardData || window.clipboardData).getData('text');
            pastedText = this.cleanupPastedContent(pastedText);

            const textarea = e.target;
            const startPos = textarea.selectionStart;
            const endPos = textarea.selectionEnd;

            textarea.value = 
                textarea.value.substring(0, startPos) +
                pastedText +
                textarea.value.substring(endPos);

            textarea.selectionStart = textarea.selectionEnd = startPos + pastedText.length;
            this.autoResizeTextarea(textarea);
        },

        handleTabKey(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                const textarea = e.target;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;

                textarea.value = 
                    textarea.value.substring(0, start) +
                    '\t' +
                    textarea.value.substring(end);

                textarea.selectionStart = textarea.selectionEnd = start + 1;
            }
        },

        cleanupPastedContent(text) {
            return text
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .join('\n');
        },

        autoResizeTextarea(textarea) {
            textarea.style.height = 'auto';
            const newHeight = Math.max(
                200,
                Math.min(
                    textarea.scrollHeight,
                    600
                )
            );
            textarea.style.height = newHeight + 'px';
        },

        createErrorElement(textarea) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'mcl-error';
            textarea.parentNode.insertBefore(errorDiv, textarea.nextSibling);
            return errorDiv;
        },

        initJSONUpload() {
            const uploadArea = document.getElementById('mcl-json-upload-area');
            const fileInput = document.getElementById('mcl_json_file');
            const preview = document.querySelector('.mcl-json-preview');
            
            if (!uploadArea || !fileInput) return;
        
            // Handle manual file selection - FIXED DOUBLE CLICK
            uploadArea.addEventListener('click', (e) => {
                // Prevent click if target is the file input itself
                if (e.target !== fileInput) {
                    e.preventDefault();
                    fileInput.click();
                }
            });
        
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    this.handleJSONFileSelection(e.target.files[0]);
                }
            });
        
            // Handle native drag and drop events - ADDED
            uploadArea.addEventListener('dragenter', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.add('mcl-drop-active');
            });
        
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.add('mcl-drop-target');
            });
        
            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('mcl-drop-active', 'mcl-drop-target');
            });
        
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('mcl-drop-active', 'mcl-drop-target');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleJSONFileSelection(files[0]);
                }
            });
        
            // Initialize interact.js dropzone - MODIFIED
            interact(uploadArea).dropzone({
                accept: 'Files',
                overlap: 0.75,
        
                ondropactivate: (event) => {
                    event.target.classList.add('mcl-drop-active');
                },
        
                ondragenter: (event) => {
                    event.target.classList.add('mcl-drop-target');
                },
        
                ondragleave: (event) => {
                    event.target.classList.remove('mcl-drop-target');
                },
        
                ondrop: (event) => {
                    // Let the native drop handler handle the file
                    event.target.classList.remove('mcl-drop-active', 'mcl-drop-target');
                },
        
                ondropdeactivate: (event) => {
                    event.target.classList.remove('mcl-drop-active', 'mcl-drop-target');
                }
            });
        
            // Handle preview removal if preview exists
            const removeButton = preview?.querySelector('.mcl-json-preview-remove');
            if (removeButton) {
                removeButton.addEventListener('click', () => {
                    preview.style.display = 'none';
                    uploadArea.style.display = 'flex';
                    fileInput.value = '';
                });
            }
        },

        handleJSONFileSelection(file) {
            const uploadArea = document.getElementById('mcl-json-upload-area');
            const preview = document.querySelector('.mcl-json-preview');
            const fileInput = document.getElementById('mcl_json_file');
            const errorDisplay = document.querySelector('.mcl-json-error');
    
            // Validate file
            if (!this.validateJSONFile(file)) {
                return;
            }
    
            // Clear any previous errors
            if (errorDisplay) {
                errorDisplay.style.display = 'none';
            }
    
            // Update file input
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
    
            // Update preview if it exists
            if (preview) {
                const nameElement = preview.querySelector('.mcl-json-preview-name');
                const sizeElement = preview.querySelector('.mcl-json-preview-size');
                
                if (nameElement) nameElement.textContent = file.name;
                if (sizeElement) sizeElement.textContent = this.formatFileSize(file.size);
                
                uploadArea.style.display = 'none';
                preview.style.display = 'block';
            }
        },

        validateJSONFile(file) {
            const errorDisplay = document.querySelector('.mcl-json-error');
            const maxSize = 10 * 1024 * 1024; // 10MB
    
            if (!file.name.toLowerCase().endsWith('.json')) {
                this.showJSONError('Please select a JSON file.', errorDisplay);
                return false;
            }
    
            if (file.size > maxSize) {
                this.showJSONError('File is too large. Maximum size is 10MB.', errorDisplay);
                return false;
            }
    
            return true;
        },
    
        showJSONError(message, errorDisplay) {
            if (errorDisplay) {
                errorDisplay.textContent = message;
                errorDisplay.style.display = 'block';
                ValidationUtils.addShakeAnimation(errorDisplay);
            } else {
                console.error(message);
            }
        },
    
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    };

    ImportExportManager.init();
});

document.addEventListener('DOMContentLoaded', function() {
    const PdfExportManager = {
        init() {
            this.initLogoUpload();
            this.initLogoRemoval();
            this.initFormSubmission();
        },

        initLogoUpload() {
            const uploadButton = document.getElementById('upload_logo_button');
            if (!uploadButton) return;

            uploadButton.addEventListener('click', (e) => {
                e.preventDefault();

                const mediaUploader = wp.media({
                    title: mclAdmin.i18n.selectLogo || 'Select Logo',
                    button: {
                        text: mclAdmin.i18n.useLogo || 'Use this logo'
                    },
                    multiple: false
                });

                mediaUploader.on('select', () => {
                    const attachment = mediaUploader.state().get('selection').first().toJSON();
                    document.getElementById('pdf_logo_url').value = attachment.url;
                    const preview = document.getElementById('pdf_logo_preview');
                    preview.src = attachment.url;
                    preview.style.display = 'block';
                    document.getElementById('remove_logo_button').style.display = 'inline-block';
                });

                mediaUploader.open();
            });
        },

        initLogoRemoval() {
            const removeButton = document.getElementById('remove_logo_button');
            if (!removeButton) return;

            removeButton.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('pdf_logo_url').value = '';
                document.getElementById('pdf_logo_preview').style.display = 'none';
                removeButton.style.display = 'none';
            });
        },

        initFormSubmission() {
            const form = document.querySelector('form input[name="action"][value="export_checklist_pdf"]')?.closest('form');
            if (!form) {
                console.log('PDF export form not found');
                return;
            }
        
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                formData.append('action', 'mcl_save_pdf_settings');
                formData.append('_ajax_nonce', mclAdmin.nonces.pdfExport);
                
                try {
                    // 1. First save PDF settings to get export_id
                    const saveResponse = await fetch(mclAdmin.ajaxurl, {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });
        
                    if (!saveResponse.ok) throw new Error(`HTTP error! status: ${saveResponse.status}`);
                    
                    const saveData = await saveResponse.json();
                    if (!saveData.success) throw new Error(saveData.data || 'Failed to save PDF settings');
        
                    // 2. Create temporary form for PDF download
                    const downloadForm = document.createElement('form');
                    downloadForm.method = 'POST';
                    downloadForm.action = form.getAttribute('action');
                    downloadForm.style.display = 'none';
        
                    // Add required parameters
                    const params = {
                        action: 'export_checklist_pdf',
                        checklist_id: formData.get('checklist_id'),
                        export_id: saveData.data.export_id,
                        mcl_nonce: formData.get('mcl_nonce')
                    };
        
                    // Create hidden inputs
                    for (const [key, value] of Object.entries(params)) {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = value;
                        downloadForm.appendChild(input);
                    }
        
                    // Submit form
                    document.body.appendChild(downloadForm);
                    downloadForm.submit();
                    document.body.removeChild(downloadForm);
        
                } catch (error) {
                    console.error('PDF Export Error:', error);
                    alert(mclAdmin.i18n.errorSavingPdfSettings);
                }
            });
        }
    };

    PdfExportManager.init();
});