export class ImageManager {
    constructor(config) {
        this.itemsList = config.itemsList;
        this.drawer = config.drawer;
        this.drawerContent = config.drawerContent;
        this.saveCallback = config.saveCallback;
        this.getStoredToken = config.getStoredToken;
        this.currentItem = null;
        this.isResizing = false;
        this.startX = 0;
        this.startWidth = 0;
        this.modal = null;
        this.mediaFrame = null;
        const isAdminPage = typeof window.mclAdmin !== 'undefined';
        this.isLoggedIn = isAdminPage || window.mcl_checklists?.user_access?.is_logged_in || false;
        this.drawerDOM = config.drawerDOM;
        this.getCurrentChecklistId = config.getCurrentChecklistId;
        
        this.bindEvents();
    }

    bindEvents() {
        // Delegate image button clicks
        if (this.itemsList) {
            this.itemsList.addEventListener('click', (e) => {
                if (e.target.closest('.mcl-add-image-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleImageButtonClick(e.target.closest('li'));
                }
            });
        }

        // Handle image resizing
        document.addEventListener('mousedown', (e) => {
            if (e.target.matches('.mcl-item-image')) {
                this.startImageResize(e);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isResizing) {
                this.handleImageResize(e);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isResizing) {
                this.stopImageResize();
            }
        });
    }

    handleImageButtonClick(listItem) {
        if (!listItem) return;
        
        this.currentItem = listItem;

        // Show different UI based on login state
        if (this.isLoggedIn) {
            this.showImageModal();
        } else {
            this.showUploadArea();
        }
    }

    showUploadArea() {
        // Remove any existing modal first
        this.closeModal();
    
        // Create upload area modal with tabs
        this.modal = document.createElement('div');
        this.modal.className = 'mcl-modal-overlay';
        this.modal.innerHTML = `
            <div class="mcl-modal mcl-upload-modal">
                <div class="mcl-modal-header">
                    <h3 class="mcl-modal-title">Upload or Select Image</h3>
                    <button type="button" class="mcl-modal-close">&times;</button>
                </div>
                <div class="mcl-modal-tabs">
                    <button type="button" class="mcl-tab-button active" data-tab="upload">Upload New</button>
                    <button type="button" class="mcl-tab-button" data-tab="select">Select Existing</button>
                </div>
                <div class="mcl-modal-content">
                    <div class="mcl-tab-content mcl-tab-upload active">
                        <div class="mcl-upload-area" id="mcl-upload-area">
                            <div class="mcl-upload-message">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                <p>Drag and drop image here or click to select</p>
                                <span class="mcl-upload-requirements">Maximum file size: 10MB. Supported formats: JPG, PNG, GIF</span>
                            </div>
                            <input type="file" accept="image/*" class="mcl-file-input" />
                        </div>
                        <div class="mcl-upload-preview" style="display: none;">
                            <img src="" alt="Preview" />
                            <button type="button" class="mcl-remove-preview">×</button>
                        </div>
                        <div class="mcl-upload-error" style="display: none;"></div>
                        <div class="mcl-upload-progress" style="display: none;">
                            <div class="mcl-progress-bar">
                                <div class="mcl-progress-fill"></div>
                            </div>
                            <span class="mcl-progress-text">0%</span>
                        </div>
                    </div>
                    <div class="mcl-tab-content mcl-tab-select">
                        <div class="mcl-images-grid"></div>
                        <div class="mcl-images-loading">Loading images...</div>
                        <div class="mcl-images-error" style="display: none;"></div>
                    </div>
                </div>
                <div class="mcl-modal-actions">
                    <button type="button" class="mcl-modal-button mcl-modal-button-primary" data-action="upload" disabled>
                        Upload Image
                    </button>
                    <button type="button" class="mcl-modal-button mcl-modal-secondary" data-action="cancel">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    
        // Initialize upload area
        this.initializeUploadArea();
        
        // Initialize tabs
        this.initializeTabs();
    
        // Load existing images
        this.loadExistingImages();
    
        document.body.appendChild(this.modal);
        requestAnimationFrame(() => this.modal.classList.add('active'));
    }

    initializeTabs() {
        const tabButtons = this.modal.querySelectorAll('.mcl-tab-button');
        const contents = this.modal.querySelectorAll('.mcl-tab-content');
        const uploadButton = this.modal.querySelector('[data-action="upload"]');
    
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
    
                // Update content visibility
                contents.forEach(content => {
                    content.classList.remove('active');
                    if (content.classList.contains(`mcl-tab-${button.dataset.tab}`)) {
                        content.classList.add('active');
                    }
                });
    
                // Update button text and state
                if (button.dataset.tab === 'select') {
                    uploadButton.textContent = 'Select Image';
                    uploadButton.disabled = true; // Enable when image is selected
                } else {
                    uploadButton.textContent = 'Upload Image';
                    uploadButton.disabled = !this.modal.querySelector('.mcl-file-input').files.length;
                }
            });
        });
    }
    
    async loadExistingImages() {
        const grid = this.modal.querySelector('.mcl-images-grid');
        const loading = this.modal.querySelector('.mcl-images-loading');
        const uploadButton = this.modal.querySelector('[data-action="upload"]');
    
        try {
            let checklistId = 0;
            if (this.drawer && typeof this.drawer.currentChecklistId !== 'undefined') {
                checklistId = this.drawer.currentChecklistId;
            } else if (typeof window.mclAdmin !== 'undefined' && typeof window.mclAdmin.currentChecklistId !== 'undefined' && window.mclAdmin.currentChecklistId !== "0") {
                checklistId = window.mclAdmin.currentChecklistId;
            }

            const formData = new FormData();
            formData.append('action', 'mcl_get_uploaded_images');
            formData.append('checklist_id', checklistId);
    
            const storedToken = (typeof this.getStoredToken === 'function') ? this.getStoredToken() : null;
            if (storedToken) {
                formData.append('stored_token', storedToken);
            }
    
            let ajaxUrl = null;
            if (typeof window.mclAdmin !== 'undefined' && typeof window.mclAdmin.ajax_url !== 'undefined') {
                // We are on the edit-checklist page (admin)
                ajaxUrl = window.mclAdmin.ajax_url;
            } else if (typeof window.mcl_checklists !== 'undefined' && typeof window.mcl_checklists.ajax_url !== 'undefined') {
                // We are on a front-end page or a page where mcl_checklists is defined
                ajaxUrl = window.mcl_checklists.ajax_url;
            }

            // Proceed only if ajaxUrl is available
            if (!ajaxUrl) {
                console.error('No AJAX URL defined.');
                return;
            }

            // Now use ajaxUrl in your fetch calls:
            const response = await fetch(ajaxUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
                
            const data = await response.json();
    
            if (!data.success) {
                throw new Error(data.data?.message || 'Failed to load images');
            }
    
            // Create grid of images
            grid.innerHTML = data.data.length ? data.data.map(image => `
                <div class="mcl-image-item" data-url="${image.url}">
                    <img src="${image.url}" alt="" />
                    <div class="mcl-image-info">
                        <span class="mcl-image-name">${image.filename}</span>
                        <span class="mcl-image-dimensions">${image.width}×${image.height}</span>
                    </div>
                </div>
            `).join('') : '<p class="mcl-no-images">No images found</p>';
    
            // Add click handlers
            grid.querySelectorAll('.mcl-image-item').forEach(item => {
                item.addEventListener('click', () => {
                    grid.querySelectorAll('.mcl-image-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    uploadButton.disabled = false;
                });
            });
    
        } catch (error) {
            console.error('Error loading images:', error);
            error.style.display = 'block';
            error.textContent = error.message;
        } finally {
            loading.style.display = 'none';
        }
    }

    initializeUploadArea() {
        const uploadArea = this.modal.querySelector('.mcl-upload-area');
        const fileInput = this.modal.querySelector('.mcl-file-input');
        const preview = this.modal.querySelector('.mcl-upload-preview');
        const previewImg = preview.querySelector('img');
        const uploadButton = this.modal.querySelector('[data-action="upload"]');
        const errorDisplay = this.modal.querySelector('.mcl-upload-error');

        this.modal.addEventListener('dragover', (e) => e.preventDefault());
        this.modal.addEventListener('drop', (e) => e.preventDefault());
        
        // Initialize interact.js
        interact(uploadArea).dropzone({
            accept: 'Files',  // Changed from 'image/*' to 'Files'
            overlap: 0.75,
    
            ondropactivate: (event) => {
                event.target.classList.add('mcl-drop-active');
            },
    
            ondragenter: (event) => {
                event.target.classList.add('mcl-drop-target');
                event.relatedTarget.classList.add('mcl-can-drop');
                
                // Prevent default to allow dropping
                event.preventDefault();
            },
    
            ondragleave: (event) => {
                event.target.classList.remove('mcl-drop-target');
                event.relatedTarget.classList.remove('mcl-can-drop');
                
                // Prevent default
                event.preventDefault();
            },
    
            ondrop: (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                // Get dropped files
                const droppedFiles = event.dataTransfer?.files || event.target.files;
                if (droppedFiles?.length > 0) {
                    this.handleFileSelection(droppedFiles[0]);
                }
            },
    
            ondropdeactivate: (event) => {
                event.target.classList.remove('mcl-drop-active', 'mcl-drop-target');
            }
        });

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
            uploadArea.classList.remove('mcl-drop-target');
        });
    
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files[0]);
            }
            
            uploadArea.classList.remove('mcl-drop-active', 'mcl-drop-target');
        });

        // Handle manual file selection
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                this.handleFileSelection(e.target.files[0]);
            }
        });

        // Handle preview removal
        this.modal.querySelector('.mcl-remove-preview').addEventListener('click', () => {
            preview.style.display = 'none';
            uploadArea.style.display = 'flex';
            uploadButton.disabled = true;
            fileInput.value = '';
        });

        // Handle upload button
        uploadButton.addEventListener('click', () => {
            const file = fileInput.files[0];
            if (file) {
                this.uploadFile(file);
            }
        });

        const actionButton = this.modal.querySelector('[data-action="upload"]');
        actionButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const activeTab = this.modal.querySelector('.mcl-tab-button.active');
            if (activeTab.dataset.tab === 'select') {
                // Handle image selection
                const selectedImage = this.modal.querySelector('.mcl-image-item.selected');
                if (selectedImage) {
                    const imageUrl = selectedImage.dataset.url;
                    const img = selectedImage.querySelector('img');
                    // Create attachment data structure
                    const attachment = {
                        url: imageUrl,
                        alt: '',
                        width: img.naturalWidth,
                        height: img.naturalHeight
                    };
                    this.insertImage(attachment);
                    this.closeModal();
                }
            } else {
                // Handle file upload
                const file = this.modal.querySelector('.mcl-file-input').files[0];
                if (file) {
                    await this.uploadFile(file);
                }
            }
        });

        // Handle modal close
        this.modal.querySelector('.mcl-modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        this.modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            this.closeModal();
        });
    }

    showImageModal() {
        // Remove any existing modal first
        this.closeModal();
    
        // Create new modal with additional button
        this.modal = document.createElement('div');
        this.modal.className = 'mcl-modal-overlay';
        this.modal.innerHTML = `
            <div class="mcl-modal">
                <div class="mcl-modal-header">
                    <h3 class="mcl-modal-title">Insert Image</h3>
                    <button type="button" class="mcl-modal-close">&times;</button>
                </div>
                <div class="mcl-modal-content">
                    <p>Choose how you would like to add an image:</p>
                </div>
                <div class="mcl-modal-actions">
                    <button type="button" class="mcl-modal-button mcl-modal-button-primary" data-action="media-library">
                        WordPress Media Library
                    </button>
                    <button type="button" class="mcl-modal-button mcl-modal-secondary" data-action="direct-upload">
                        Quick Upload
                    </button>
                    <button type="button" class="mcl-modal-button mcl-modal-secondary" data-action="cancel">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    
        // Handle button clicks with proper event delegation
        this.modal.querySelector('.mcl-modal').addEventListener('click', async (e) => {
            const target = e.target;
            e.preventDefault(); // Prevent any default actions
            
            if (target.matches('.mcl-modal-close') || 
                target.matches('[data-action="cancel"]')) {
                this.closeModal();
                return;
            }
    
            if (target.matches('[data-action="media-library"]')) {
                // Store current modal element
                const currentModal = this.modal;
                // Clear the modal reference before closing
                this.modal = null;
                // Remove the modal
                currentModal.classList.remove('active');
                await new Promise(resolve => setTimeout(resolve, 300));
                if (currentModal.parentNode) {
                    currentModal.parentNode.removeChild(currentModal);
                }
                // Open media library
                this.openMediaLibrary();
                return;
            }
    
            if (target.matches('[data-action="direct-upload"]')) {
                // Store current modal element
                const currentModal = this.modal;
                // Clear the modal reference before closing
                this.modal = null;
                // Remove the modal
                currentModal.classList.remove('active');
                await new Promise(resolve => setTimeout(resolve, 300));
                if (currentModal.parentNode) {
                    currentModal.parentNode.removeChild(currentModal);
                }
                // Show upload area
                this.showUploadArea();
                return;
            }
        });
    
        document.body.appendChild(this.modal);
        requestAnimationFrame(() => this.modal.classList.add('active'));
    }

    handleFileSelection(file) {
        const uploadArea = this.modal.querySelector('.mcl-upload-area');
        const preview = this.modal.querySelector('.mcl-upload-preview');
        const previewImg = preview.querySelector('img');
        const uploadButton = this.modal.querySelector('[data-action="upload"]');
        const errorDisplay = this.modal.querySelector('.mcl-upload-error');
        const fileInput = this.modal.querySelector('.mcl-file-input');

        // Validate file
        if (!this.validateFile(file)) {
            return;
        }

        // Clear any previous errors
        errorDisplay.style.display = 'none';

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            uploadArea.style.display = 'none';
            preview.style.display = 'block';
            uploadButton.disabled = false;
        };
        reader.readAsDataURL(file);

        // Update file input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
    }

    validateFile(file) {
        const errorDisplay = this.modal.querySelector('.mcl-upload-error');
        const maxSize = 10 * 1024 * 1024;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

        if (!allowedTypes.includes(file.type)) {
            this.showError('Invalid file type. Please upload a JPG, PNG, or GIF image.');
            return false;
        }

        if (file.size > maxSize) {
            this.showError('File is too large. Maximum size is 10MB.');
            return false;
        }

        return true;
    }

    showError(message) {
        const errorDisplay = this.modal.querySelector('.mcl-upload-error');
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
    }

    async uploadFile(file) {
        const progressBar = this.modal.querySelector('.mcl-upload-progress');
        const uploadButton = this.modal.querySelector('[data-action="upload"]');
    
        // Show progress bar
        progressBar.style.display = 'flex';
        uploadButton.disabled = true;
    
        try {
            let checklistId = 0;
            if (this.drawer && typeof this.drawer.currentChecklistId !== 'undefined') {
                checklistId = this.drawer.currentChecklistId;
            } else if (typeof window.mclAdmin !== 'undefined' && typeof window.mclAdmin.currentChecklistId !== 'undefined' && window.mclAdmin.currentChecklistId !== "0") {
                checklistId = window.mclAdmin.currentChecklistId;
            }
    
            const formData = new FormData();
            formData.append('action', 'mcl_upload_image');
            formData.append('file', file);
            formData.append('checklist_id', checklistId);
    
            const storedToken = (typeof this.getStoredToken === 'function') ? this.getStoredToken() : null;
            if (storedToken) {
                formData.append('stored_token', storedToken);
            }
    
            let ajaxUrl = null;
            if (typeof window.mclAdmin !== 'undefined' && typeof window.mclAdmin.ajax_url !== 'undefined') {
                // We are on the edit-checklist page (admin)
                ajaxUrl = window.mclAdmin.ajax_url;
            } else if (typeof window.mcl_checklists !== 'undefined' && typeof window.mcl_checklists.ajax_url !== 'undefined') {
                // We are on a front-end page or a page where mcl_checklists is defined
                ajaxUrl = window.mcl_checklists.ajax_url;
            }
    
            // Proceed only if ajaxUrl is available
            if (!ajaxUrl) {
                console.error('No AJAX URL defined.');
                return;
            }
    
            const response = await fetch(ajaxUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
    
            const responseText = await response.text();
    
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('JSON parse error:', e);
                console.log('Invalid JSON:', responseText);
                throw new Error('Server returned invalid JSON');
            }
    
            if (data.success) {
                this.insertImage(data.data);
                this.closeModal();
            } else {
                this.showError(data.data?.message || 'Upload failed. Please try again.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            this.showError('Upload failed. Please try again.');
        } finally {
            progressBar.style.display = 'none';
            uploadButton.disabled = false;
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('active');
            setTimeout(() => {
                if (this.modal && this.modal.parentNode) {
                    this.modal.parentNode.removeChild(this.modal);
                }
                this.modal = null;
            }, 300);
        }
    }

    setDrawerZIndex(index) {
        const isAdminPage = typeof window.mclAdmin !== 'undefined';
        if (!isAdminPage) {
            if (this.drawer && typeof this.drawer === 'object') {
                try {
                    this.drawerDOM.style.zIndex = index;
                } catch (error) {
                    console.warn('Failed to set drawer zIndex:', error);
                }
            }
        }
    }    

    openMediaLibrary() {
        // If there's an existing frame, remove it
        if (this.mediaFrame) {
            this.mediaFrame.remove();
        }
    
        // Create new media frame
        this.mediaFrame = wp.media({
            title: 'Select Image',
            library: { type: 'image' },
            multiple: false,
            button: { text: 'Insert Image' }
        });
    
        // Handle selection
        this.mediaFrame.on('select', () => {
            const attachment = this.mediaFrame.state().get('selection').first().toJSON();
            this.insertImage(attachment);
        });
    
        // Handle closing - MODIFIED
        this.mediaFrame.on('close', () => {
            this.setDrawerZIndex('999999');
        });
    
        // Handle opening - MODIFIED
        this.mediaFrame.on('open', () => {
            this.setDrawerZIndex('99999');
        });
    
        this.mediaFrame.open();
    }

    insertImage(imageData) {
        if (!this.currentItem) return;
    
        const contentDiv = this.currentItem.querySelector('.mcl-item-content');
        if (!contentDiv) return;
    
        // Create image element
        const img = document.createElement('img');
        img.src = imageData.url;
        img.alt = imageData.alt || '';
        img.className = 'mcl-item-image';
        img.setAttribute('data-mcl-image', 'true');
    
        // Calculate dimensions maintaining aspect ratio
        const maxWidth = 400;
        const aspectRatio = imageData.height / imageData.width;
        let newWidth, newHeight;
    
        if (imageData.width > maxWidth) {
            newWidth = maxWidth;
            newHeight = Math.round(maxWidth * aspectRatio);
        } else {
            newWidth = imageData.width;
            newHeight = imageData.height;
        }
    
        // Set constrained dimensions
        img.width = newWidth;
        img.height = newHeight;
        img.style.width = `${newWidth}px`;
        img.style.height = `${newHeight}px`;
    
        // Insert image and add line break after
        contentDiv.appendChild(img);
    
        if (typeof this.saveCallback === 'function') {
            this.saveCallback();
        }
    
        this.currentItem = null;
    }

    startImageResize(e) {
        const img = e.target;
        this.isResizing = true;
        this.startX = e.clientX;
        this.startWidth = img.offsetWidth;
        
        img.classList.add('mcl-resizing');
    }

    handleImageResize(e) {
        if (!this.isResizing) return;

        const currentX = e.clientX;
        const diff = currentX - this.startX;
        
        const img = document.querySelector('.mcl-item-image.mcl-resizing');
        if (!img) return;

        // Calculate new width maintaining aspect ratio
        const newWidth = Math.max(50, Math.min(400, this.startWidth + diff));
        const aspectRatio = img.naturalHeight / img.naturalWidth;
        
        img.style.width = `${newWidth}px`;
        img.style.height = `${Math.round(newWidth * aspectRatio)}px`;
    }

    stopImageResize() {
        const img = document.querySelector('.mcl-item-image.mcl-resizing');
        if (img) {
            img.classList.remove('mcl-resizing');
            
            // Save the new dimensions using callback
            if (typeof this.saveCallback === 'function') {
                this.saveCallback();
            }
        }
        
        this.isResizing = false;
        this.startX = 0;
        this.startWidth = 0;
    }
}