import { createManagers } from './modules/index.js';
import { ImageManager } from './modules/mcl-image-manager.js';
class MagicChecklistDrawer {
    constructor() {
        // Core elements
        this.drawer = document.getElementById('mcl-drawer');
        this.drawerContent = this.drawer.querySelector('.mcl-drawer-content');
        this.itemsList = document.getElementById('mcl-items');
        this.imageManager = new ImageManager({
            itemsList: this.itemsList,
            drawer: this,
            drawerContent: this.drawerContent,
            drawerDOM: this.drawer,
            getStoredToken: () => this.getStoredToken(),
            saveCallback: () => this.saveChecklistData()
        });
        this.activeChecklists = [];
        this.currentIndex = -1;
        this.bindNavigationEvents();

        // Unload lock on page unload or navigation
        window.addEventListener('beforeunload', () => {
            this.releaseLock();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.releaseLock();
            }
        });

        // Checklist-Manager
        this.checkedItems = new Set();
        this.currentChecklistData = null; 

        // Checked-State-Manager
        this.storagePrefix = 'mcl_checklist_';
        this.checkedItems = new Set();

        // Event-Manager
        this.elements = {
            itemsList: null,
            drawerContent: null,
            addItemButton: null,
            drawerCloseButton: null,
            uncheckAllButton: null
        };
        this.linkManager = null;
        this.handleItemsListEvents = this.handleItemsListEvents.bind(this);
        this.handleAddItem = this.handleAddItem.bind(this);
        this.handleCloseClick = this.handleCloseClick.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleUncheckAll = this.handleUncheckAll.bind(this);
        this.handleItemsListEvents = this.handleItemsListEvents.bind(this);

        // UI-Manager
        this.congratsTimeout = null;

        // Link-Manager
        this.toolbar = null;
        this.isToolbarVisible = false;
        this.currentSelection = null;
        this.selectionTimeout = null;
        this.currentIndicator = null;
        this.currentRemoveIndicator = null;
        this.currentLinkElement = null;
        this.container = this.drawer;

        this.handleSelection = this.handleSelection.bind(this);
        this.handleKeyboard = this.handleKeyboard.bind(this);
        this.createLink = this.createLink.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleSelectionChange = this.handleSelectionChange.bind(this);

        if (window.mcl_checklists?.invite_token) {
            this.storeInviteToken(window.mcl_checklists.invite_token);
        }
        
        this.initTriggerMethods();
        this.lastToggleTime = Date.now();
        this.toggleDebounceTime = 300;
        this.isClosing = false;
        
        // State
        this.currentChecklistId = null;
        this.drawerEventsBound = false;
        
        // Initialize managers
        const managers = createManagers(this);
        Object.assign(this, managers);

        // Rate limiting constants
        this.DRAWER_MAX_OPERATIONS = 20;
        this.ACTION_MAX_OPERATIONS = 30;
        this.TIMEOUT_DURATION = 10000; // milliseconds
        this.DRAWER_STORAGE_KEY = 'mcl_drawer_limit';
        this.ACTION_STORAGE_KEY = 'mcl_action_limit';
        this.DRAWER_STORAGE_PREFIX = 'mcl_drawer_limit_';
        this.ACTION_STORAGE_PREFIX = 'mcl_action_limit_';
        
        // Error elements
        this.activeErrorTimers = new Map();
        this.activeCountdowns = new Map();
        this.activeErrorTimers = new Map();
        this.globalError = document.getElementById('mcl-global-rate-limit-error');
        this.drawerError = document.getElementById('mcl-drawer-rate-limit-error');

        // Initialize storage and bind error events
        this.bindErrorEvents();
        
        // Initialize the drawer
        this.init();
    }

    initDrawerOnly() {
        // Initialize only drawer-related functionality
        const managers = createManagers(this);
        Object.assign(this, managers);
        
        this.priority.init();
        this.init();
    }

    init() {
        this.bindKeyboardShortcuts();
        // Initialize all managers
        this.priority.init();

        this.draggable.init();
        
    }

    initUIManager() {
        this.setupCongratulationsContainer();
    }    

    isAdministrator() {
        return window.mcl_checklists?.user_access?.is_admin === true;
    }

    isDraggableInitialized() {
        return this.draggable;
    }

    resetButtonPositions() {
        if (this.isDraggableInitialized()) {
            this.draggable.resetAllPositions();
        }
    }

    isRateLimitEnabled() {
        
        if (!this?.currentChecklistData) {
            return false;
        }
        
        const enabled = Boolean(this.currentChecklistData.enable_rate_limit);
        return enabled;
    }

    isRateLimitActive(storageKey) {
        const state = this.getRateLimitState(storageKey);
        const now = Date.now();
        
        // Check if we're still within timeout period and at/over limit
        return (now - state.lastReset < this.TIMEOUT_DURATION) && 
               (state.count >= (storageKey.includes('drawer') ? this.DRAWER_MAX_OPERATIONS : this.ACTION_MAX_OPERATIONS));
    }

    initChecklistStorage(checklistId) {
        if (!checklistId) {
            console.log('No checklist ID provided for storage init');
            return;
        }
        
        if (!this.isRateLimitEnabled()) {
            return;
        }
    
        const drawerKey = this.getChecklistStorageKey(this.DRAWER_STORAGE_PREFIX, checklistId);
        const actionKey = this.getChecklistStorageKey(this.ACTION_STORAGE_PREFIX, checklistId);
    
        const defaultState = {
            count: 0,
            lastReset: Date.now()
        };
    
        if (!localStorage.getItem(drawerKey)) {
            localStorage.setItem(drawerKey, JSON.stringify(defaultState));
        }
    
        if (!localStorage.getItem(actionKey)) {
            localStorage.setItem(actionKey, JSON.stringify(defaultState));
        }
    }

    canPerformDrawerOperation() {
        // Skip check for admin users
        if (this.isAdministrator()) {
            return { allowed: true };
        }
    
        // Check if rate limiting is enabled for this checklist
        if (!this.isRateLimitEnabled()) {
            return { allowed: true };
        }
    
        const checklistId = this.currentChecklistId;
        if (!checklistId) return { allowed: true };
    
        const storageKey = `${this.DRAWER_STORAGE_PREFIX}${checklistId}`;
        return this.checkRateLimit(storageKey, this.DRAWER_MAX_OPERATIONS);
    }

    canPerformAction() {
        if (this.isAdministrator() || !this.isRateLimitEnabled()) {
            return { allowed: true };
        }
    
        const checklistId = this.currentChecklistId;
        if (!checklistId) return { allowed: true };
    
        const storageKey = this.getChecklistStorageKey(this.ACTION_STORAGE_PREFIX, checklistId);
        
        // If rate limit is active, show error message
        if (this.isRateLimitActive(storageKey)) {
            const state = this.getRateLimitState(storageKey);
            const remainingTime = this.TIMEOUT_DURATION - (Date.now() - state.lastReset);
            this.showDrawerError(this.getCountdownMessage('drawer'));
            return { allowed: false, remainingTime: this.formatRemainingTime(remainingTime) };
        }
    
        return this.checkRateLimit(storageKey, this.ACTION_MAX_OPERATIONS);
    }

    getChecklistStorageKey(prefix, checklistId) {
        if (!checklistId) return null;
        return `${prefix}${checklistId}`;
    }

    checkActionRateLimit() {
        const actionCheck = this.canPerformAction();
        if (!actionCheck.allowed) {
            this.showDrawerError(this.getCountdownMessage('drawer'));
            return false;
        }
        return true;
    }

    checkRateLimit(storageKey, maxOperations) {
    
        if (!this.isRateLimitEnabled()) {
            return { allowed: true };
        }
    
        const state = this.getRateLimitState(storageKey);
        const now = Date.now();
    
        // Check if we're still within timeout period
        if (now - state.lastReset < this.TIMEOUT_DURATION) {
            if (state.count >= maxOperations) {
                const remainingTime = this.TIMEOUT_DURATION - (now - state.lastReset);
                return {
                    allowed: false,
                    remainingTime: this.formatRemainingTime(remainingTime)
                };
            }
            
            // Still within timeout but under limit
            state.count++;
            localStorage.setItem(storageKey, JSON.stringify(state));
            return { allowed: true };
        }
    
        // Past timeout period, reset
        this.resetRateLimit(storageKey);
        return { allowed: true };
    }    

    resetRateLimit(storageKey) {
        const resetState = {
            count: 1,
            lastReset: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(resetState));
    }

    getRateLimitState(storageKey) {
        try {
            const stored = localStorage.getItem(storageKey);
            let state = stored ? JSON.parse(stored) : null;
            
            // If no state or invalid state, initialize it
            if (!state || !state.lastReset || !state.count) {
                state = {
                    count: 0,
                    lastReset: Date.now()
                };
                localStorage.setItem(storageKey, JSON.stringify(state));
            }
            
            return state;
        } catch (error) {
            console.error('Error reading rate limit state:', error);
            return {
                count: 0,
                lastReset: Date.now()
            };
        }
    }

    formatRemainingTime(milliseconds) {
        const seconds = Math.ceil(milliseconds / 1000);
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }

    // Error Management Methods
    bindErrorEvents() {
        this.globalError?.querySelector('.mcl-rate-limit-close')
            ?.addEventListener('click', () => this.hideError('global'));
        
        this.drawerError?.querySelector('.mcl-rate-limit-close')
            ?.addEventListener('click', () => this.hideError('drawer'));
    }

    showGlobalError(message, duration = 5000) {
        this.showError('global', message, duration);
    }

    showDrawerError(message, duration = 5000) {
        this.showError('drawer', message, duration);
    }

    showError(type, message) {
        const errorElement = type === 'global' ? this.globalError : this.drawerError;
        if (!errorElement) return;
    
        // Clear existing timers
        this.clearErrorTimers(type);
    
        const messageElement = errorElement.querySelector('.mcl-rate-limit-message');
        if (!messageElement) return;
    
        // Get the rate limit state
        const storageKey = type === 'global' ? 
            this.getChecklistStorageKey(this.DRAWER_STORAGE_PREFIX, this.currentChecklistId) : 
            this.getChecklistStorageKey(this.ACTION_STORAGE_PREFIX, this.currentChecklistId);
        
        const state = this.getRateLimitState(storageKey);
        const resetTime = state.lastReset + this.TIMEOUT_DURATION;
        
        // Show error immediately
        errorElement.classList.add('active');
        
        // Start countdown
        const updateCountdown = () => {
            const remaining = Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
            
            if (remaining === 0) {
                this.hideError(type);
                return;
            }
            
            // Update message with current countdown
            const countdownMessage = message.replace(/\d{1,5}\s+second(?:s)?/, `${remaining} second${remaining !== 1 ? 's' : ''}`);
            messageElement.textContent = countdownMessage;
        };
    
        // Initial update
        updateCountdown();
    
        // Start interval for countdown
        const countdownInterval = setInterval(updateCountdown, 1000);
        this.activeCountdowns.set(type, countdownInterval);
    }

    getCountdownMessage(type) {
        const storageKey = type === 'global' ? this.DRAWER_STORAGE_KEY : this.ACTION_STORAGE_KEY;
        const state = this.getRateLimitState(storageKey);
        const remaining = Math.ceil((state.lastReset + this.TIMEOUT_DURATION - Date.now()) / 1000);
        
        return type === 'global' 
            ? `Rate limit reached. Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before opening the checklist again.`
            : `Too many actions. Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before performing more actions.`;
    }

    clearErrorTimers(type) {
        // Clear countdown interval
        if (this.activeCountdowns.has(type)) {
            clearInterval(this.activeCountdowns.get(type));
            this.activeCountdowns.delete(type);
        }

        // Clear hide timer
        if (this.activeErrorTimers.has(type)) {
            clearTimeout(this.activeErrorTimers.get(type));
            this.activeErrorTimers.delete(type);
        }
    }

    hideError(type) {
        const errorElement = type === 'global' ? this.globalError : this.drawerError;
        if (!errorElement) return;

        errorElement.classList.remove('active');
        this.clearErrorTimers(type);
    }

    hideAllErrors() {
        this.hideError('global');
        this.hideError('drawer');
    }

    initTriggerMethods() {
        // Initialize keyboard shortcuts
        this.bindKeyboardShortcuts();
        
        // Initialize floating buttons
        this.bindFloatingButtons();
    }

    handleKeyboardShortcut(event) {
        const activeChecklists = window.mcl_checklists?.shortcuts || {};
        
        if (this.isClosing) {
            return;
        }
        
        for (const [checklistId, checklistData] of Object.entries(activeChecklists)) {
            if (this.matchesShortcut(event, checklistData.shortcut)) {
                event.preventDefault();
                event.stopPropagation();
                this.toggleChecklist(checklistId);
                break;
            }
        }
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcut(e), true);
    }

    async toggleChecklist(checklistId) {
        const drawerCheck = this.canPerformDrawerOperation();
        if (!drawerCheck.allowed) {
            this.showGlobalError(this.getCountdownMessage('global'));
            return;
        }
        
        // If drawer is open and it's the same checklist, close it
        if (this.drawer.classList.contains('mcl-open') && this.currentChecklistId === checklistId) {
            this.isClosing = true;
            this.closeDrawer();
            
            // Reset state after animation completes
            setTimeout(() => {
                this.isClosing = false;
                this.currentChecklistId = null;
            }, this.toggleDebounceTime);
            
            return;
        }
    
        // If not closing, load the checklist using the consolidated method
        if (!this.isClosing) {
            await this.loadChecklist(checklistId);
        }
    }

    bindFloatingButtons() {
        const floatingButtons = document.querySelectorAll('.mcl-floating-button:not(.mcl-fab-list .mcl-floating-button), .mcl-multi-fab-trigger');
        
        floatingButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();

                const fabTriggerButton = event.currentTarget;

                // For FAB trigger, check if it was just dragged
                if (fabTriggerButton.classList.contains('mcl-multi-fab-trigger')) {
                    const fabContainer = fabTriggerButton.closest('.mcl-floating-buttons');
                    if (fabContainer && fabContainer.getAttribute('data-just-dragged') === 'true') {
                        fabContainer.removeAttribute('data-just-dragged');
                        return; // Don't toggle the list if it was just dragged
                    }
                    this.toggleFabList(fabTriggerButton);
                    return; // FAB trigger click handled
                }

                // For regular single floating buttons, check if it was just dragged
                // The data-just-dragged attribute is set directly on the button itself for single draggables
                if (button.getAttribute('data-just-dragged') === 'true') {
                    button.removeAttribute('data-just-dragged');
                    return; // Don't open drawer if it was just dragged
                }

                // Existing logic for single floating buttons to open the drawer
                const checklistId = button.dataset.checklistId;
                if (checklistId) {
                    if (this.drawer.classList.contains('mcl-drawer-open') && this.currentChecklistId === checklistId) {
                        this.closeDrawer();
                    } else {
                        await this.toggleChecklist(checklistId);
                    }
                }
            });
        });

        // Handling clicks inside the FAB list to open checklists
        const fabListButtons = document.querySelectorAll('.mcl-fab-list .mcl-floating-button');
        fabListButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();

                // If a button inside the FAB list is clicked, it should always try to open the checklist
                // and also close the FAB list itself.
                const checklistId = button.dataset.checklistId;
                if (checklistId) {
                    // Close the FAB list first
                    const fabTrigger = button.closest('.mcl-floating-buttons').querySelector('.mcl-multi-fab-trigger');
                    if (fabTrigger && fabTrigger.getAttribute('aria-expanded') === 'true') {
                        this.toggleFabList(fabTrigger, false); // Force close
                    }

                    // Then toggle the checklist (open or switch)
                    if (this.drawer.classList.contains('mcl-drawer-open') && this.currentChecklistId === checklistId) {
                        // If it's the same checklist and drawer is open, maybe do nothing or re-focus?
                        // For now, let's allow it to re-fetch if it's already open and same ID.
                         await this.toggleChecklist(checklistId);
                    } else {
                        await this.toggleChecklist(checklistId);
                    }
                }
            });
        });

        // Close FAB list if clicking outside
        document.addEventListener('click', (event) => {
            const fabContainer = document.querySelector('.mcl-floating-buttons.mcl-is-multi-trigger');
            if (fabContainer && !fabContainer.contains(event.target)) {
                const fabTrigger = fabContainer.querySelector('.mcl-multi-fab-trigger');
                if (fabTrigger && fabTrigger.getAttribute('aria-expanded') === 'true') {
                    this.toggleFabList(fabTrigger, false); // Force close
                }
            }
        });
    }

    toggleFabList(fabTrigger, forceState = null) {
        const fabList = fabTrigger.nextElementSibling;
        if (!fabList || !fabList.classList.contains('mcl-fab-list')) return;

        const isExpanded = fabTrigger.getAttribute('aria-expanded') === 'true';
        const newState = forceState !== null ? forceState : !isExpanded;

        fabTrigger.setAttribute('aria-expanded', newState.toString());
        if (newState) {
            fabList.hidden = false;
            // Focus the first item in the list for accessibility, or the list itself
            const firstButton = fabList.querySelector('.mcl-floating-button');
            if (firstButton) {
                // setTimeout(() => firstButton.focus(), 0); // Allow transition to complete
            } else {
                // setTimeout(() => fabList.focus(), 0); 
            }
        } else {
            // Add a delay to allow animation before setting hidden
            // This depends on the CSS transition duration
            setTimeout(() => {
                fabList.hidden = true;
            }, 200); // Match opacity transition duration from CSS
        }
    }

    matchesShortcut(event, shortcut) {
        // Add null check
        if (!shortcut) {
            return false;
        }
    
        const keys = shortcut.toLowerCase().split('+');
        let keyMatch = true;
    
        keys.forEach(key => {
            switch(key.trim()) {
                case 'ctrl':
                    keyMatch = keyMatch && event.ctrlKey;
                    break;
                case 'alt':
                case 'option':
                    keyMatch = keyMatch && event.altKey;
                    break;
                case 'shift':
                    keyMatch = keyMatch && event.shiftKey;
                    break;
                case 'meta':
                case 'cmd':
                case 'command':
                    keyMatch = keyMatch && event.metaKey;
                    break;
                default:
                    keyMatch = keyMatch && (event.key.toLowerCase() === key.trim());
            }
        });
    
        // Ensure no extra modifier keys are pressed
        const totalModifiers = event.ctrlKey + event.altKey + event.shiftKey + event.metaKey;
        const requiredModifiers = keys.filter(k => 
            ['ctrl', 'alt', 'option', 'shift', 'meta', 'cmd', 'command'].includes(k.trim())
        ).length;
    
        return keyMatch && totalModifiers === requiredModifiers;
    }

    async loadChecklist(checklistId) {
    
        try {
            const formData = new FormData();
            formData.append('action', 'mcl_get_checklist');
            formData.append('checklist_id', checklistId);
    
            // Add authentication data
            if (window.mcl_checklists?.nonce) {
                formData.append('nonce', window.mcl_checklists.nonce);
            }
    
            // Always include stored token if available
            const storedToken = this.getStoredToken();
            if (storedToken) {
                formData.append('stored_token', storedToken);
            }
    
            const checklistData = await this.fetchChecklistData(checklistId);
            
            if (checklistData.success) {
                this.currentChecklistData = checklistData.data;
                this.currentChecklistId = checklistId;
                
                // Track the checklist view
                this.trackChecklistView(checklistId);
    
                if (!this.drawerEventsBound) {
                    this.bindDrawerEvents();
                    this.drawerEventsBound = true;
                }
    
                // Check if the user has edit permissions
                if (checklistData.data.can_edit) {
                    if (checklistData.data.locked) {
    
                        // Disable editing features
                        this.disableEditing();
                    }
                } else {
                    // Ensure editing is disabled
                    this.disableEditing();
                }
    
                await this.renderChecklist(checklistData.data);
                this.openDrawer();
                this.updateNavigationButtons();
            }
        } catch (error) {
            console.error('Error loading checklist:', error);
        }
    }

    storeUsedToken(token) {
        try {
            let usedTokens = localStorage.getItem('mcl_used_tokens');
            usedTokens = usedTokens ? JSON.parse(usedTokens) : [];
            
            if (!usedTokens.includes(token)) {
                usedTokens.push(token);
                localStorage.setItem('mcl_used_tokens', JSON.stringify(usedTokens));
            }
        } catch (error) {
            console.error('Error storing used token:', error);
        }
    }

    storeInviteToken(tokenData) {
        try {
            const now = Math.floor(Date.now() / 1000);
            const expiryDate = tokenData.expiry_date ? 
                Math.floor(new Date(tokenData.expiry_date).getTime() / 1000) : 
                (tokenData.expiry || (now + (7 * 24 * 60 * 60))); // Default 7 days
    
            // Store token with proper structure
            const tokenToStore = {
                token: tokenData.token,
                checklist_id: tokenData.checklist_id,
                permissions: tokenData.permissions,
                expiry: expiryDate
            };
    
            localStorage.setItem('mcl_invite_token', JSON.stringify(tokenToStore));
    
            // Store token as used
            this.storeUsedToken(tokenData.token);
    
            // Also set a cookie with the token
            const expiryDateMs = expiryDate * 1000; // Convert to milliseconds
            const expires = new Date(expiryDateMs).toUTCString();
            document.cookie = `mcl_invite_token=${encodeURIComponent(tokenData.token)}; expires=${expires}; path=/; SameSite=Lax`;
    
        } catch (error) {
            console.error('Error storing invite token:', error);
        }
    }   
    
    getStoredToken() {
        try {
            const stored = localStorage.getItem('mcl_invite_token');
            if (!stored) return null;
    
            const data = JSON.parse(stored);
            const now = Math.floor(Date.now() / 1000);
    
            // Check if token has expired
            if (now > data.expiry) {
                console.log('Token expired, clearing from storage');
                localStorage.removeItem('mcl_invite_token');
                return null;
            }
    
            return data.token;
        } catch (error) {
            console.error('Error reading invite token:', error);
            return null;
        }
    }

    async releaseLock() {
        if (!this.currentChecklistId) return;
        if (!this.currentChecklistData || !this.currentChecklistData.can_edit) return;
    
        const formData = new FormData();
        formData.append('action', 'mcl_release_lock');
        formData.append('checklist_id', this.currentChecklistId);
    
        // Include nonce if available (for logged-in users)
        if (window.mcl_checklists?.nonce) {
            formData.append('nonce', window.mcl_checklists.nonce);
        }
    
        // Include stored_token if available
        const storedToken = this.getStoredToken();
        if (storedToken) {
            formData.append('stored_token', storedToken);
        }
    
        try {
            await fetch(window.mcl_checklists.ajax_url, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
        } catch (error) {
            console.error('Error releasing lock:', error);
        }
    }

    handleLockLoss() {
        // Inform the user
        alert('Your editing session has expired or another user is now editing this checklist.');
    
        // Disable editing features
        this.disableEditing();
    }   
    
    disableEditing() {
        // Disable content editing
        const contentElements = this.drawerContent.querySelectorAll('[contenteditable]');
        contentElements.forEach(el => {
            el.setAttribute('contenteditable', 'false');
        });
    
        // Hide add item button
        const addItemButton = this.drawer.querySelector('#mcl-add-item');
        if (addItemButton) {
            addItemButton.style.display = 'none';
        }
    
        // Disable remove item buttons
        const removeButtons = this.drawerContent.querySelectorAll('.mcl-remove-item');
        removeButtons.forEach(button => {
            button.style.display = 'none';
        });
    
        // Disable sorting
        if (this.itemsList && this.itemsList.sortableInstance) {
            this.itemsList.sortableInstance.option('disabled', true);
        }
    
        // Optionally, display a locked overlay or message
        const lockedOverlay = this.drawerContent.querySelector('.mcl-locked-overlay');
        if (lockedOverlay && this.currentChecklistData && this.currentChecklistData.locked) {
            lockedOverlay.style.display = 'block';
        }
    }       

    async fetchChecklistData(checklistId) {
        try {
            const response = await fetch(window.mcl_checklists.ajax_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'mcl_get_checklist',
                    checklist_id: checklistId,
                    nonce: window.mcl_checklists.nonce || '',
                    stored_token: this.getStoredToken() || ''
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // Check if there's invite token data in the response and store it
                if (result.data?.invite_token) {
                    this.storeInviteToken(result.data.invite_token);
                }
                return result;  // Return the full response object with success: true and data property
            } else {
                this.showError('drawer', result.data?.message || 'Error loading checklist');
                return { success: false };  // Return object with success: false
            }
        } catch (error) {
            console.error('Error fetching checklist data:', error);
            this.showError('drawer', 'Network error when loading checklist');
            return { success: false };  // Return object with success: false
        }
    }

    // Add new method for tracking views
    trackChecklistView(checklistId) {
        // Skip tracking if no checklist ID
        if (!checklistId) return;
        
        // Send analytics data
        fetch(window.mcl_checklists.ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'mcl_track_view',
                checklist_id: checklistId
            })
        }).catch(error => {
            // Silently fail tracking - don't disrupt user experience
            console.error('Analytics tracking error:', error);
        });
    }

    async saveChecklistData() {
        if (!this.currentChecklistId || !this.elements.itemsList) return;

        try {
            // Get all list items in their current order
            const items = Array.from(this.elements.itemsList.querySelectorAll('li')).map(li => {
                const itemId = li.getAttribute('data-item-id');
                const content = li.querySelector('.mcl-item-content')?.innerHTML || '';
                const parentId = li.getAttribute('data-parent-id') || ''; // Get parent ID if exists
                const priority = li.querySelector('.mcl-item-priority')?.getAttribute('data-priority') || 'none';

                return {
                    id: itemId,
                    content: content,
                    parent_id: parentId, // Include parent ID in the saved data
                    priority: priority
                };
            });

            const formData = new FormData();
            formData.append('action', 'mcl_update_checklist');
            formData.append('checklist_id', this.currentChecklistId);
            formData.append('items', JSON.stringify(items));
            formData.append('nonce', window.mcl_checklists.nonce);

            // Add stored token if it exists
            const storedToken = this.getStoredToken();
            if (storedToken) {
                formData.append('stored_token', storedToken);
            }

            const response = await fetch(window.mcl_checklists.ajax_url, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            const result = await response.json();
            
            if (!result.success) {
                console.error('Error saving checklist:', result.data);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error saving checklist:', error);
            return false;
        }
    }

    hasItemChanges(currentItems) {
        // If we don't have previous items data, assume there are changes
        if (!this.previousItems) {
            this.previousItems = currentItems;
            return true;
        }
    
        // Quick length check
        if (this.previousItems.length !== currentItems.length) {
            this.previousItems = currentItems;
            return true;
        }
    
        // Deep compare items
        const hasChanges = currentItems.some((item, index) => {
            const prevItem = this.previousItems[index];
            return !prevItem ||
                   item.id !== prevItem.id ||
                   item.content !== prevItem.content ||
                   item.priority !== prevItem.priority;
        });
    
        if (hasChanges) {
            this.previousItems = currentItems;
        }
    
        return hasChanges;
    }

    collectItemsData() {
        const items = [];
        const processedIds = new Set();
    
        this.itemsList.querySelectorAll('li').forEach(li => {
            const itemId = li.getAttribute('data-item-id');
            
            if (!processedIds.has(itemId)) {
                processedIds.add(itemId);
    
                const contentDiv = li.querySelector('.mcl-item-content');
                if (!contentDiv) return;
                
                const priorityIndicator = li.querySelector('.mcl-item-priority');
                const priority = priorityIndicator ? 
                    priorityIndicator.getAttribute('data-priority') : 'none';
    
                let content = contentDiv.innerHTML;
                content = content
                    .replace(/(?:<br\s*\/?>\s*?){3,}/g, '<br><br>')
                    .replace(/<p>(?:(?:\s|&nbsp;|<br\s*\/?>))*<\/p>/g, '')
                    .replace(/\u200B/g, '')
                    .replace(/^\s+/, '')
                    .replace(/\s+$/, '');
    
                items.push({
                    id: itemId,
                    content: content,
                    priority: priority
                });
            }
        });
    
        return items;
    }

    async addNewItem() {
        if (!this.currentChecklistData?.can_edit) {
            return;
        }
    
        const itemId = 'item_' + Date.now();
        const li = this.createListItem(itemId);
        
        this.itemsList.appendChild(li);
        this.scrollToNewItem(li);
        
        li.querySelector('[contenteditable="true"]').focus();
        
        try {
            await this.saveChecklistData();
            this.updateRemoveButtons();
        } catch (error) {
            console.error('Error adding new item:', error);
        }
        
        // After adding new item, update the progress counter
        this.updateProgressCounter();
    }
    
    createListItem(itemId) {
        const li = document.createElement('li');
        li.setAttribute('data-item-id', itemId);
        li.innerHTML = `
            <span class="drag-handle">☰</span>
            <input type="checkbox" class="mcl-item-checkbox">
            <div class="mcl-item-content" contenteditable="true"></div>
            <div class="mcl-list-item-actions">
                <button type="button" class="mcl-in-progress-btn" title="Toggle in progress">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M133 440a35.37 35.37 0 0 1-17.5-4.67c-12-6.8-19.46-20-19.46-34.33V111c0-14.37 7.46-27.53 19.46-34.33a35.13 35.13 0 0 1 35.77.45l247.85 148.36a36 36 0 0 1 0 61l-247.89 148.4A35.5 35.5 0 0 1 133 440Z"/></svg>
                </button>
                <button type="button" class="mcl-item-deadline-btn" title="Set a deadline for this item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSTimer0"><g fill="none" stroke-width="4"><circle cx="24" cy="28" r="16" fill="#fff" stroke="#fff"/><path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" d="M28 4h-8m4 0v8m11 4l3-3"/><path stroke="#000" stroke-linecap="round" stroke-linejoin="round" d="M24 28v-6m0 6h-6"/></g></mask><path fill="currentColor" d="M0 0h48v48H0z" mask="url(#ipSTimer0)"/></svg>
                </button>
                <button type="button" class="mcl-add-image-btn" title="Add image">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M416 64H96a64.07 64.07 0 0 0-64 64v256a64.07 64.07 0 0 0 64 64h320a64.07 64.07 0 0 0 64-64V128a64.07 64.07 0 0 0-64-64Zm-80 64a48 48 0 1 1-48 48a48.05 48.05 0 0 1 48-48ZM96 416a32 32 0 0 1-32-32v-67.63l94.84-84.3a48.06 48.06 0 0 1 65.8 1.9l64.95 64.81L172.37 416Zm352-32a32 32 0 0 1-32 32H217.63l121.42-121.42a47.72 47.72 0 0 1 61.64-.16L448 333.84Z"/></svg>
                </button>    
                <button type="button" class="mcl-remove-item mcl-remove-icon">×</button>
            </div>
        `;
    
        if (this.drawerContent.querySelector('.mcl-item-priority')) {
            const priorityType = this.drawerContent.querySelector('.mcl-item-priority')
                .getAttribute('data-display');
            const priorityIndicator = this.priority.createPriorityIndicator('none', priorityType);
            li.insertBefore(priorityIndicator, li.querySelector('.mcl-item-content'));
        }
    
        return li;
    }
    
    scrollToNewItem(newItem) {
        const drawerContent = this.drawerContent;
        const addItemButton = drawerContent.querySelector('#mcl-add-item');
        
        const buttonRect = addItemButton.getBoundingClientRect();
        const containerRect = drawerContent.getBoundingClientRect();
    
        if (buttonRect.bottom > containerRect.bottom) {
            drawerContent.scrollTo({
                top: drawerContent.scrollTop + (buttonRect.bottom - containerRect.bottom) + 20,
                behavior: 'smooth'
            });
        }
    }
    
    updateRemoveButtons() {
        const items = this.itemsList.querySelectorAll('li');
        const removeButtons = this.itemsList.querySelectorAll('.mcl-remove-item');
        
        removeButtons.forEach(button => {
            button.style.display = items.length <= 1 ? 'none' : '';
        });
    }
    
    async removeItem(listItem) {
        if (!listItem) return;
    
        if (!this.checkActionRateLimit()) {
            return;
        }
    
        try {
            listItem.remove();
            await this.saveChecklistData();
            this.updateRemoveButtons();
    
            if (this.currentChecklistData?.can_check) {
                const checkedItems = Array.from(
                    this.itemsList.querySelectorAll('.mcl-item-checkbox:checked')
                ).map(cb => cb.closest('li')?.getAttribute('data-item-id'))
                 .filter(Boolean);
                
                await this.saveCheckedState(
                    this.currentChecklistId, 
                    checkedItems
                );
            }
        } catch (error) {
            console.error('Error removing item:', error);
        }
        
        // After removing item, update the progress counter
        this.updateProgressCounter();
    }

    async renderChecklist(data) {
        // Store the current checklist data before processing checked states
        this.currentChecklistData = data;
        this.handleResetCheck(data);
        
        // Get checked state after current checklist data is set
        const checkedState = await this.getInitialCheckedState(data);
        
        // Update checklist ID and title
        this.drawer.setAttribute('data-checklist-id', this.currentChecklistId);
        
        // Update UI based on permissions
        this.updateAccessUI(data);
        
        // Handle deadline display
        this.updateDeadlineDisplay(data.time_date);

        const tagsContainer = this.drawerContent.querySelector('.mcl-drawer-tags');
        if (tagsContainer) {
            if (data.tags && data.tags.length > 0) {
                tagsContainer.innerHTML = data.tags
                    .map(tag => `
                        <span class="mcl-drawer-tag" 
                            style="background-color: ${tag.color}">
                            ${tag.name}
                        </span>
                    `).join('');
                tagsContainer.style.display = 'flex';
            } else {
                tagsContainer.innerHTML = '';
                tagsContainer.style.display = 'none';
            }
        }

        // Show or hide locked message
        const lockedMessageElement = this.drawerContent.querySelector('.mcl-locked-overlay');
        if (data.locked) {
            lockedMessageElement.style.display = 'flex';
            lockedMessageElement.textContent = data.locked_message || 'This checklist is currently being edited by another user.';
        } else {
            lockedMessageElement.style.display = 'none';
            lockedMessageElement.textContent = '';
        }
    
        const isEditable = data.can_edit && !data.locked;
        // Clear and populate items with the correct checked state
        await this.renderItems(
            data.items, 
            checkedState,
            data.enable_item_priority, 
            data.priority_display_type,
            isEditable
        );

        this.initInProgressState();
    
        // Handle descriptions - prioritize public description
        const placeholder = this.drawerContent.querySelector('.mcl-drawer-close');
        let descriptionContainer = this.drawerContent.querySelector('.mcl-description-container');
        
        // Remove existing description container if it exists
        if (descriptionContainer) {
            descriptionContainer.remove();
        }
        
        if (data.is_public && data.public_description) {
            // Create and insert description container with public description
            descriptionContainer = document.createElement('div');
            descriptionContainer.className = 'mcl-description-container';
            const publicDescEl = document.createElement('div');
            publicDescEl.className = 'mcl-public-description';
            publicDescEl.textContent = data.public_description;
            descriptionContainer.appendChild(publicDescEl);
            placeholder.parentNode.insertBefore(descriptionContainer, placeholder);
            this.drawer.classList.add('has-public-description');
        } else if (data.show_description === "1" && data.description) {
            // Create and insert description container with regular description
            descriptionContainer = document.createElement('div');
            descriptionContainer.className = 'mcl-description-container';
            const drawerDescEl = document.createElement('div');
            drawerDescEl.className = 'mcl-drawer-description';
            drawerDescEl.textContent = data.description;
            descriptionContainer.appendChild(drawerDescEl);
            placeholder.parentNode.insertBefore(descriptionContainer, placeholder);
            this.drawer.classList.add('has-description');
        } else {
            this.drawer.classList.remove('has-public-description', 'has-description');
        }
    
        // Initialize sorting only if user can edit
        this.initializeSortable();
    
        // Update theme
        this.updateTheme(data.theme);
        
        // After rendering items, update the progress counter
        this.updateProgressCounter();
    }

    async renderItems(items, checkedState, enablePriority, priorityDisplayType, canEdit) {
        const itemsList = this.itemsList;
        itemsList.innerHTML = '';
    
        if (!Array.isArray(items)) {
            console.error('Invalid items data');
            return;
        }
    
        const checklistData = this.drawer.currentChecklistData;
        const checklistId = this.drawer.currentChecklistId;
    
        // Get saved order for public users
        let savedOrder = null;
        if (this.currentChecklistData?.can_check && !this.currentChecklistData?.can_edit) {
            try {
                const orderKey = `mcl_order_${this.currentChecklistId}`;
                const storedOrder = localStorage.getItem(orderKey);
                savedOrder = storedOrder ? JSON.parse(storedOrder) : null;
            } catch (error) {
                console.error('Error reading order from localStorage:', error);
            }
        }
    
        // Reorder items if saved order exists
        let orderedItems = [...items];
        if (savedOrder) {
            orderedItems = savedOrder
                .map(id => items.find(item => item.id === id))
                .filter(Boolean);
            
            // Add any items that might not be in the saved order
            const savedIds = new Set(savedOrder);
            items.forEach(item => {
                if (!savedIds.has(item.id)) {
                    orderedItems.push(item);
                }
            });
        }
    
        // Determine checked state source
        const useLocalStorage = checklistData?.is_public && 
                              checklistData?.checked_state_handling === 'per_user';
    
        const finalCheckedState = useLocalStorage ? 
            this.getLocalCheckedState(this.currentChecklistId) : 
            checkedState;
    
        // Get stored priorities for per-user handling
        let storedPriorities = {};
        if (checklistData?.checked_state_handling === 'per_user' && !this.isAdministrator()) {
            storedPriorities = this.priority.getStoredPriorities(checklistId);
        }
    
        // Render items with correct order and checked state
        orderedItems.forEach(item => {
            const isChecked = finalCheckedState.includes(item.id);
            const li = document.createElement('li');
            li.setAttribute('data-item-id', item.id);
    
            // Add parent-child relationship if exists
            if (item.parent_id) {
                li.setAttribute('data-parent-id', item.parent_id);
                li.classList.add('mcl-child-item');
            }
    
            // Add drag handle only if user can actually edit
            const dragHandle = document.createElement('span');
            dragHandle.className = 'drag-handle';
            dragHandle.textContent = '☰';
            li.appendChild(dragHandle);
            
    
            // Create checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'mcl-item-checkbox';
            checkbox.checked = isChecked;
            li.appendChild(checkbox);
    
            // Add priority indicator if enabled
            if (enablePriority) {
                // Use stored priority for per-user handling
                const priority = checklistData?.checked_state_handling === 'per_user' && !this.drawer.isAdministrator()
                    ? storedPriorities[item.id] || item.priority || 'none'
                    : item.priority || 'none';
                    
                const priorityIndicator = this.priority.createPriorityIndicator(
                    priority,
                    priorityDisplayType,
                    item.id
                );
                li.appendChild(priorityIndicator);
            }
    
            const contentEditable = canEdit ? 'true' : 'false';
            // Create content div instead of span
            const content = document.createElement('div');
            content.setAttribute('contenteditable', contentEditable);
            content.className = 'mcl-item-content';
            
            if (item.content) {
                content.innerHTML = item.content;
            }
            
            if (isChecked) {
                content.classList.add('mcl-checked');
                li.classList.add('mcl-item-checked');
            }
            li.appendChild(content);

            const inProgressButton = document.createElement('button');
            inProgressButton.type = 'button';
            inProgressButton.className = 'mcl-in-progress-btn';
            inProgressButton.setAttribute('title', 'Toggle in progress');
            inProgressButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M133 440a35.37 35.37 0 0 1-17.5-4.67c-12-6.8-19.46-20-19.46-34.33V111c0-14.37 7.46-27.53 19.46-34.33a35.13 35.13 0 0 1 35.77.45l247.85 148.36a36 36 0 0 1 0 61l-247.89 148.4A35.5 35.5 0 0 1 133 440Z"/></svg>
            `;

            const deadlineButton = document.createElement('button');
            deadlineButton.type = 'button';
            deadlineButton.className = 'mcl-item-deadline-btn';
            deadlineButton.setAttribute('title', 'Set a deadline for this item');
            deadlineButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><mask id="ipSTimer0"><g fill="none" stroke-width="4"><circle cx="24" cy="28" r="16" fill="#fff" stroke="#fff"/><path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" d="M28 4h-8m4 0v8m11 4l3-3"/><path stroke="#000" stroke-linecap="round" stroke-linejoin="round" d="M24 28v-6m0 6h-6"/></g></mask><path fill="currentColor" d="M0 0h48v48H0z" mask="url(#ipSTimer0)"/></svg>
            `;

             // Create Add Image Button
            const addImageButton = document.createElement('button');
            addImageButton.type = 'button';
            addImageButton.className = 'mcl-add-image-btn';
            addImageButton.setAttribute('title', 'Add image');
            addImageButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path fill="currentColor" d="M416 64H96a64.07 64.07 0 0 0-64 64v256a64.07 64.07 0 0 0 64 64h320a64.07 64.07 0 0 0 64-64V128a64.07 64.07 0 0 0-64-64Zm-80 64a48 48 0 1 1-48 48a48.05 48.05 0 0 1 48-48ZM96 416a32 32 0 0 1-32-32v-67.63l94.84-84.3a48.06 48.06 0 0 1 65.8 1.9l64.95 64.81L172.37 416Zm352-32a32 32 0 0 1-32 32H217.63l121.42-121.42a47.72 47.72 0 0 1 61.64-.16L448 333.84Z"/>
                </svg>
            `;

            // Create Remove Button if the user can edit
            let removeButton = null;
            if (canEdit) {
                removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.className = 'mcl-remove-item mcl-remove-icon';
                removeButton.textContent = '×';
            }

            // Create the parent div for action buttons
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'mcl-list-item-actions';
            actionsDiv.appendChild(inProgressButton);
            actionsDiv.appendChild(deadlineButton);
            actionsDiv.appendChild(addImageButton);

            if (removeButton) {
                actionsDiv.appendChild(removeButton);
            }

            // Append the actions div to the list item
            if (canEdit) {
                li.appendChild(actionsDiv);
            }

            const deadlineContainer = document.createElement('div');
            deadlineContainer.className = 'mcl-item-deadline-container';
            deadlineContainer.style.display = 'none'; // Hidden by default
            
            li.appendChild(deadlineContainer);
            
            if (item.deadline) {
                const deadline = parseInt(item.deadline) * 1000;
                this.initializeItemDeadline(li, deadline);
            }

            const itemsList = document.getElementById('mcl-items');
            itemsList.appendChild(li);

        });

        // Add this line after rendering all items
        this.updateProgressCounter();

        // After rendering all items, ensure children are properly positioned
        this.reattachAllChildren();
    }
    
    uncheckAllItems() {
        this.itemsList.querySelectorAll('li').forEach(li => {
            const checkbox = li.querySelector('.mcl-item-checkbox');
            const itemText = li.querySelector('[contenteditable="true"]');

            // Uncheck the checkbox
            checkbox.checked = false;

            // Remove the checked class for styling
            itemText.classList.remove('mcl-checked');

            // Optionally, move the item to the top if desired
            this.itemsList.insertBefore(li, this.itemsList.firstChild);
        });

        // **Save the new checked state (which should be empty)**
        this.saveCheckedState(this.currentChecklistId, []);

        // **Save the checklist data if the user can edit**
        if (this.currentChecklistData?.can_edit) {
            this.saveChecklistData();
        }
        
        // After unchecking all items, update the progress counter
        this.updateProgressCounter();
    }
    
    handleCheckboxChange(e) {
        const checklistData = this.currentChecklistData;
        const checklistId = this.currentChecklistId;
    
        if (!checklistId || !checklistData) return;
    
        const checkbox = e.target;
        const listItem = checkbox.closest('li');
    
        if (!listItem) return;
    
        // Update UI immediately
        this.updateItemStyle(checkbox.checked, listItem);
    
        // Collect all checked items
        const checkedItems = Array.from(
            this.itemsList.querySelectorAll('.mcl-item-checkbox:checked')
        ).map(cb => cb.closest('li')?.getAttribute('data-item-id'))
         .filter(Boolean);
    
        // Save state based on handling type
        if (checklistData.checked_state_handling === 'per_user' && !window.mcl_checklists?.user_access?.is_logged_in) {
            // For non-logged-in users, save locally
            this.saveLocalCheckedState(checklistId, checkedItems);
        } else {
            // Save to server
            this.saveCheckedState(checklistId, checkedItems);
        }
    
        // Note: We removed the direct tracking call here to prevent double-counting
        // The tracking is already handled server-side via WordPress hooks
    
        // If user can check items, reorder the item with its children
        if (checklistData.can_check) {
            this.reorderItemWithChildren(checkbox.checked, listItem);
        }
    
        // Check completion status
        this.checkAllItemsCompleted();
    
        // Update progress counter
        this.updateProgressCounter();
    }
    
    updateItemStyle(isChecked, listItem) {
        const itemText = listItem.querySelector('[contenteditable]');
        if (!itemText) return;
    
        if (isChecked) {
            itemText.classList.add('mcl-checked');
            listItem.classList.add('mcl-item-checked');
        } else {
            itemText.classList.remove('mcl-checked');
            listItem.classList.remove('mcl-item-checked');
        }
    }
    
    syncAllItemsStyles() {
        const items = this.itemsList.querySelectorAll('li');
        items.forEach(item => {
            const checkbox = item.querySelector('.mcl-item-checkbox');
            const itemText = item.querySelector('[contenteditable]');
            if (checkbox && itemText) {
                this.updateItemStyle(checkbox.checked, item);
            }
        });
    }

    updateCheckedItemsCache(isChecked, itemId) {
        if (isChecked) {
            this.checkedItems.add(itemId);
        } else {
            this.checkedItems.delete(itemId);
        }
    }
    
    saveOrder() {
        const checklistId = this.currentChecklistId;
        if (!checklistId) return;
    
        // Get current order of items
        const itemOrder = Array.from(this.itemsList.querySelectorAll('li'))
            .map(li => li.getAttribute('data-item-id'));
    
        // Save to localStorage
        const orderKey = `mcl_order_${checklistId}`;
        try {
            localStorage.setItem(orderKey, JSON.stringify(itemOrder));
        } catch (error) {
            console.error('Error saving order:', error);
        }
    }

    reorderItems(isChecked, listItem) {
        // If the item is a parent or has a parent, use the new method
        const itemId = listItem.getAttribute('data-item-id');
        const hasChildren = this.itemsList.querySelector(`li[data-parent-id="${itemId}"]`);
        const hasParent = listItem.hasAttribute('data-parent-id');

        if (hasChildren || hasParent) {
            // If it's a child item, find and reorder the parent instead
            if (hasParent) {
                const parentId = listItem.getAttribute('data-parent-id');
                const parentItem = this.itemsList.querySelector(`li[data-item-id="${parentId}"]`);
                if (parentItem) {
                    const parentChecked = parentItem.querySelector('.mcl-item-checkbox').checked;
                    this.reorderItemWithChildren(parentChecked, parentItem);
                }
            } else {
                // If it's a parent item, reorder it with its children
                this.reorderItemWithChildren(isChecked, listItem);
            }
        } else {
            // For standalone items, use the original reordering logic
            if (isChecked) {
                this.itemsList.appendChild(listItem);
            } else {
                this.itemsList.insertBefore(listItem, this.itemsList.firstChild);
            }
        }
    }
    
    checkAllItemsCompleted() {
        const allItems = this.itemsList?.querySelectorAll('.mcl-item-checkbox');
        if (!allItems?.length) return;
        
        const allChecked = Array.from(allItems).every(checkbox => checkbox.checked);
        
        if (allChecked && allItems.length > 0) {
            this.showCongratulations();
        }
    }
    
    getCheckedState(checklistId = this.currentChecklistId) {
        if (!checklistId) return [];
    
        const checklistData = this.currentChecklistData;
        if (!checklistData) return [];
    
        // For per-user handling when user is not logged in (including invite link users)
        if (checklistData.checked_state_handling === 'per_user' && !window.mcl_checklists?.user_access?.is_logged_in) {
            return this.getLocalCheckedState(checklistId);
        }
    
        // For global handling (both public and private), return server state
        return checklistData.checked_state || [];
    }

    async saveCheckedState(checklistId, checkedItems) {
        if (!checklistId) return;
    
        const checklistData = this.currentChecklistData;
        if (!checklistData) return;
    
        // For per-user handling when user is not logged in (including invite link users)
        if (checklistData.checked_state_handling === 'per_user' && !window.mcl_checklists?.user_access?.is_logged_in) {
            this.saveLocalCheckedState(checklistId, checkedItems);
            return;
        }
    
        // For all other cases (including global handling), save to server
        try {
            const formData = new FormData();
            formData.append('action', 'mcl_save_checked_state');
            formData.append('checklist_id', checklistId);
    
            // Include nonce if available (for logged-in users)
            if (window.mcl_checklists?.nonce) {
                formData.append('nonce', window.mcl_checklists.nonce);
            }
    
            // Include stored_token if available
            const storedToken = this.getStoredToken();
            if (storedToken) {
                formData.append('stored_token', storedToken);
            }
    
            checkedItems.forEach(itemId => {
                formData.append('checked_items[]', itemId);
            });
    
            const response = await fetch(window.mcl_checklists.ajax_url, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
    
            const result = await response.json();
            if (!result.success) {
                console.error('Error saving checked state:', result.data);
            }
        } catch (error) {
            console.error('Error saving checked state:', error);
        }
    }
    
    getLocalCheckedState(checklistId) {
        if (!checklistId) return [];
    
        const storageKey = this.getStorageKey(checklistId);
        if (!storageKey) return [];
    
        try {
            const stored = localStorage.getItem(storageKey);
            const checkedState = stored ? JSON.parse(stored) : [];
            
            // Sync styles when getting initial state
            requestAnimationFrame(() => {
                this.syncAllItemsStyles();
            });
            
            return checkedState;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }
    
    saveLocalCheckedState(checklistId, checkedItems) {
        if (!checklistId) return;
    
        const storageKey = this.getStorageKey(checklistId);
        if (!storageKey) return;
    
        try {
            localStorage.setItem(storageKey, JSON.stringify(checkedItems));
            
            // Ensure styles are synced after saving
            requestAnimationFrame(() => {
                this.syncAllItemsStyles();
            });
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
    
    getStorageKey(checklistId) {
        if (!checklistId) return null;
        const safeId = String(checklistId).replace(/[^a-zA-Z0-9_-]/g, '');
        return `${this.storagePrefix}${safeId}`;
    }
    
    sanitizeKey(key) {
        if (typeof key !== 'string') return '';
        return key.replace(/[^a-zA-Z0-9_-]/g, '');
    }
    
    sanitizeData(data) {
        if (!Array.isArray(data)) return [];
        return data.map(item => this.sanitizeKey(item)).filter(Boolean);
    }
    
    bindDrawerEvents() {
        // Cache DOM elements on first bind
        this.cacheElements();
    
        // Remove any existing listeners
        this.removeExistingListeners();
    
        const checklistData = this.currentChecklistData;
    
        // Initialize LinkManager if user has edit permissions
        if (checklistData?.can_edit) {
            this.initLinkManager();
        }
    
        // Single event listener for all item-related events
        if (this.elements.itemsList) {
            this.elements.itemsList.addEventListener('click', this.handleItemsListEvents);
            this.elements.itemsList.addEventListener('change', this.handleItemsListEvents);
            this.elements.itemsList.addEventListener('keydown', this.handleItemsListEvents);
            this.elements.itemsList.addEventListener('paste', this.handleItemsListEvents);
        }
    
        // Add edit-only events if user has permission
        if (checklistData?.can_edit) {
            this.elements.addItemButton?.addEventListener('click', this.handleAddItem);
        }
    
        // Add general drawer events
        this.elements.drawerCloseButton?.addEventListener('click', this.handleCloseClick);
        document.addEventListener('click', this.handleOutsideClick);
    
        // Bind uncheck all if user can interact with checkboxes
        if (checklistData?.can_check) {
            this.elements.uncheckAllButton?.addEventListener('click', this.handleUncheckAll);
        }
    }
    
    cacheElements() {
        this.elements = {
            itemsList: this.itemsList,
            drawerContent: this.drawerContent,
            addItemButton: this.drawer.querySelector('#mcl-add-item'),
            drawerCloseButton: this.drawer.querySelector('#mcl-drawer-close'),
            uncheckAllButton: this.drawer.querySelector('#mcl-uncheck-all')
        };
    }
    
    handleItemsListEvents(e) {
        const target = e.target;
    
        // Handle link clicks separately
        if (target.matches('.mcl-item-content a') || target.closest('.mcl-item-content a')) {
            e.preventDefault();
            e.stopPropagation();
    
            const link = target.matches('a') ? target : target.closest('a');
            if (link.href) {
                window.open(link.href, '_blank', 'noopener,noreferrer');
            }
            return;
        }
    
        // For text selection in contenteditable, don't interfere
        if (target.matches('.mcl-item-content[contenteditable="true"]') ||
            target.closest('.mcl-item-content[contenteditable="true"]')) {
            switch (e.type) {
                case 'keydown':
                    this.handleItemKeydown(e, target);
                    break;
                case 'paste':
                    this.handlePaste(e);
                    break;
            }
            return;
        }
    
        // Check rate limit for all other interactions
        if (!this.checkActionRateLimit()) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
    
        // Continue with normal event handling
        const listItem = target?.closest('li');
        if (!listItem && !target.matches('.mcl-add-item')) {
            return;
        }
    
        switch (e.type) {
            case 'click':
                this.handleItemClick(e);
                break;
            case 'change':
                if (target.matches('.mcl-item-checkbox')) {
                    this.handleCheckboxChange(e, target, listItem);
                }
                break;
        }
    }
    
    handlePaste(e) {
        // Prevent default paste behavior
        e.preventDefault();
        e.stopPropagation();
    
        // Only handle paste in editable content areas
        if (!e.target.matches('.mcl-item-content[contenteditable="true"]')) {
            return;
        }
    
        // Get clipboard content
        const plainText = (e.originalEvent || e).clipboardData.getData('text/plain');
        const htmlText = (e.originalEvent || e).clipboardData.getData('text/html');
    
        let processedContent;
    
        if (htmlText) {
            // For HTML content, clean and sanitize
            const cleanedHtml = this.cleanPastedHTML(htmlText);
            processedContent = this.sanitizeContent(cleanedHtml);
        } else {
            // For plain text, check if it's a URL
            processedContent = this.convertUrlsToLinks(plainText);
        }
    
        // Insert at current selection
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
    
            // Create temporary container for the sanitized content
            const temp = document.createElement('div');
            temp.innerHTML = processedContent;
    
            // Create a document fragment
            const fragment = document.createDocumentFragment();
            while (temp.firstChild) {
                fragment.appendChild(temp.firstChild);
            }
    
            range.insertNode(fragment);
    
            // Move cursor to end
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
    
            // Trigger save to persist changes
            this.saveChecklistData();
        }
    }
    
    convertUrlsToLinks(text) {
        // URL regex pattern - more comprehensive
        const urlRegex = /(https?:\/\/(?:www\.|(?!www))[^\s.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi;
    
        // First escape HTML special characters
        const escapedText = text.replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    
        // Then convert URLs to anchor tags
        return escapedText.replace(urlRegex, (url) => {
            try {
                // Ensure URL has protocol
                const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                const parsedUrl = new URL(fullUrl);
    
                // Only allow http and https protocols
                if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
                    return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
                }
                return url;
            } catch {
                return url;
            }
        });
    }
    
    sanitizeContent(content) {
        // Create a safe div in memory
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
    
        try {
            // Only process links and basic formatting
            const allowedTags = ['a', 'b', 'strong', 'i', 'em', 'u', 'span', 'br'];
            const allowedAttrs = ['href', 'target', 'rel', 'class', 'style'];
    
            function cleanNode(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (!allowedTags.includes(node.tagName.toLowerCase())) {
                        return document.createTextNode(node.textContent);
                    }
    
                    // Keep only allowed attributes
                    Array.from(node.attributes).forEach(attr => {
                        if (!allowedAttrs.includes(attr.name)) {
                            node.removeAttribute(attr.name);
                        }
                    });
    
                    // Clean children
                    Array.from(node.childNodes).forEach(child => {
                        const cleanedChild = cleanNode(child);
                        if (cleanedChild !== child) {
                            node.replaceChild(cleanedChild, child);
                        }
                    });
                }
                return node;
            }
    
            Array.from(tempDiv.childNodes).forEach(node => {
                const cleanedNode = cleanNode(node);
                if (cleanedNode !== node) {
                    node.replaceChild(cleanedNode, node);
                }
            });
    
            return tempDiv.innerHTML;
    
        } catch (e) {
            console.error('Error sanitizing content:', e);
            return content;
        }
    }
    
    cleanPastedHTML(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
    
        // Whitelist of allowed tags and attributes
        const allowedTags = ['a', 'b', 'strong', 'i', 'em', 'u', 'span', 'br'];
    
        function cleanNode(node) {
            // Handle text nodes
            if (node.nodeType === Node.TEXT_NODE) {
                return node.cloneNode(true);
            }
    
            // Handle element nodes
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
    
                // If not an allowed tag, just return text content
                if (!allowedTags.includes(tagName)) {
                    return document.createTextNode(node.textContent);
                }
    
                // Create new clean element
                const cleanEl = document.createElement(tagName);
    
                // Special handling for links
                if (tagName === 'a') {
                    const href = node.getAttribute('href');
                    if (href && this.isValidUrl(href)) {
                        cleanEl.setAttribute('href', href);
                        cleanEl.setAttribute('target', '_blank');
                        cleanEl.setAttribute('rel', 'noopener noreferrer');
                    } else {
                        // Invalid URL - return just text
                        return document.createTextNode(node.textContent);
                    }
                }
    
                // Process children
                Array.from(node.childNodes).forEach(child => {
                    const cleanChild = cleanNode.call(this, child);
                    if (cleanChild) {
                        cleanEl.appendChild(cleanChild);
                    }
                });
    
                return cleanEl;
            }
    
            return null;
        }
    
        // Clean the content
        const cleanFragment = document.createDocumentFragment();
        Array.from(doc.body.childNodes).forEach(node => {
            const cleanedNode = cleanNode.call(this, node);
            if (cleanedNode) {
                cleanFragment.appendChild(cleanedNode);
            }
        });
    
        // Convert back to string
        const output = document.createElement('div');
        output.appendChild(cleanFragment);
        return output.innerHTML;
    }
    
    handleItemClick(e) {
        const target = e.target;
        if (!target) return;
    
        const listItem = target.closest('li');
    
        // Handle remove button clicks
        if (target.matches('.mcl-remove-item')) {
            e.preventDefault();
            e.stopPropagation();
            if (listItem) {
                this.removeItem(listItem);
            }
            return;
        }
    
        // Handle priority indicator clicks
        if (target.matches('.mcl-item-priority')) {
            e.stopPropagation();
            this.priority.cyclePriority(target);
            return;
        }
    
        // Handle link clicks
        if (target.matches('.mcl-item-content a')) {
            window.open(target.href, '_blank', 'noopener,noreferrer');
            e.preventDefault();
            e.stopPropagation();
        }

        if (target.closest('.mcl-in-progress-btn')) {
            e.preventDefault();
            e.stopPropagation();
            if (listItem) {
                this.toggleInProgress(listItem);
            }
            return;
        }

        if (target.closest('.mcl-item-deadline-btn')) {
            e.preventDefault();
            e.stopPropagation();
            if (listItem) {
                this.handleItemDeadlineClick(e);
            }
        }
    }

    reorderItem(listItem, isChecked) {
        if (!listItem || !this.elements.itemsList) return;
    
        // Use requestAnimationFrame for smooth reordering
        requestAnimationFrame(() => {
            // Add transition for smooth movement
            listItem.style.transition = 'transform 0.3s ease-in-out';
    
            if (isChecked) {
                // Move to bottom
                this.elements.itemsList.appendChild(listItem);
            } else {
                // Move to top
                this.elements.itemsList.insertBefore(listItem, this.elements.itemsList.firstChild);
            }
    
            // Remove transition after animation
            setTimeout(() => {
                listItem.style.transition = '';
            }, 300);
    
            // Save the new order if this is a public checklist
            const checklistData = this.drawer.currentChecklistData;
            if (checklistData?.is_public) {
                this.savePublicUserOrder();
            }
        });
    }

    handleItemKeydown(e, target, listItem) {
        // Only handle if it's a contenteditable div
        if (!target.matches('.mcl-item-content[contenteditable="true"]')) {
            return;
        }
    
        // Always prevent default Enter behavior
        if (e.key === 'Enter') {
            e.preventDefault();
            
            // Make sure we have a valid listItem
            if (!listItem) {
                listItem = target.closest('li');
            }
            
            // Only proceed if we have a valid listItem
            if (!listItem) {
                return;
            }
            
            // If Shift is pressed, insert a line break
            if (e.shiftKey) {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const br = document.createElement('br');
                range.deleteContents();
                range.insertNode(br);
                range.setStartAfter(br);
                range.setEndAfter(br);
                selection.removeAllRanges();
                selection.addRange(range);
                return;
            }
            
            // Regular Enter creates new item
            this.addNewItemAfterCurrent(listItem);
        }
    }

    addNewItemAfterCurrent(currentItem) {
        // Validate input
        if (!currentItem || !currentItem.parentNode) {
            console.warn('Invalid current item for insertion');
            return;
        }
    
        const itemId = 'item_' + Date.now();
        const li = this.createListItem(itemId);
        
        currentItem.parentNode.insertBefore(li, currentItem.nextSibling);
        this.scrollToNewItem(li);
        
        // Focus the new item's content
        const contentDiv = li.querySelector('[contenteditable="true"]');
        if (contentDiv) {
            contentDiv.focus();
        }
        
        this.saveChecklistData();
        this.updateRemoveButtons();
    }

    removeExistingListeners() {
        const { elements } = this;

        // Remove delegated events
        elements.itemsList?.removeEventListener('click', this.handleItemsListEvents);
        elements.itemsList?.removeEventListener('change', this.handleItemsListEvents);
        elements.itemsList?.removeEventListener('keydown', this.handleItemsListEvents);

        // Remove direct events
        elements.addItemButton?.removeEventListener('click', this.handleAddItem);
        elements.drawerCloseButton?.removeEventListener('click', this.handleCloseClick);
        elements.uncheckAllButton?.removeEventListener('click', this.handleUncheckAll);
        document.removeEventListener('click', this.handleOutsideClick);

        if (this.linkManager) {
            this.linkManager.destroy();
            this.linkManager = null;
        }
    }

    handleAddItem(e) {
        e.preventDefault();
        
        // Rate limit check for adding items
        if (!this.checkActionRateLimit()) {
            return;
        }

        this.addNewItem();
    }

    handleCloseClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.closeDrawer();
    }

    handleOutsideClick(e) {
        // Check if drawer is open and click is outside
        if (this.drawer.classList.contains('mcl-open')) {
            if (e.target.closest('.media-modal') || 
                e.target.closest('.media-frame') || 
                e.target.closest('.mcl-modal-overlay')) {
                return;
            }
            
            if (!this.drawer.contains(e.target)) {
                e.preventDefault();
                this.closeDrawer();
            }
        }
    }

    async handleUncheckAll(e) {
        e.preventDefault();
        
        // Rate limit check
        if (!this.checkActionRateLimit()) {
            return;
        }
    
        if (!confirm(window.mcl_checklists.i18n.uncheckAllConfirm)) {
            return;
        }
    
        const checklistId = this.currentChecklistId;
        const checklistData = this.currentChecklistData;
        
        if (!checklistId || !checklistData) {
            console.warn('Missing checklist data for uncheck all operation');
            return;
        }
    
        try {
            // Batch all DOM operations
            requestAnimationFrame(() => {
                const listItems = this.elements.itemsList.querySelectorAll('li');
                
                listItems.forEach(listItem => {
                    const checkbox = listItem.querySelector('.mcl-item-checkbox');
                    const itemText = listItem.querySelector('[contenteditable]');
                    
                    if (checkbox && itemText) {
                        // Update checkbox state
                        checkbox.checked = false;
                        
                        // Remove checked-related classes
                        itemText.classList.remove('mcl-checked');
                        listItem.classList.remove('mcl-item-checked');
                        
                        // Reset text styling
                        itemText.style.textDecoration = '';
                        itemText.style.opacity = '';
                        
                        // Move to top if allowed
                        if (checklistData.can_check) {
                            this.elements.itemsList.insertBefore(listItem, this.elements.itemsList.firstChild);
                        }
                    }
                });
    
                // Save empty state
                this.saveCheckedState(checklistId, [])
                    .catch(error => console.error('Error saving checked state:', error));
    
                // Save checklist data if needed
                if (this.currentChecklistData?.can_edit) {
                    this.saveChecklistData()
                        .catch(error => console.error('Error saving checklist:', error));
                }
            });
        } catch (error) {
            console.error('Error unchecking all items:', error);
        }
        
        // After unchecking all items, update the progress counter
        this.updateProgressCounter();
    }

    initializeSortable() {
        const checklistData = this.currentChecklistData;
        if (!checklistData || !this.elements.itemsList) return;
    
        // Clean up existing instance
        if (this.elements.itemsList.sortableInstance) {
            this.elements.itemsList.sortableInstance.destroy();
        }
    
        this.elements.itemsList.sortableInstance = new Sortable(this.elements.itemsList, {
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            forceFallback: true,
            onStart: (evt) => {
                const item = evt.item;
                // Add nesting indicator div
                const indicator = document.createElement('div');
                indicator.className = 'mcl-nesting-indicator';
                item.appendChild(indicator);
    
                // If this is a parent, store its children and hide them during drag
                if (!item.hasAttribute('data-parent-id')) {
                    const itemId = item.dataset.itemId;
                    const children = Array.from(this.elements.itemsList.querySelectorAll(`li[data-parent-id="${itemId}"]`));
                    item.dataset.hasChildren = children.length > 0 ? 'true' : 'false';
                    children.forEach(child => {
                        child.classList.add('mcl-hidden-child');
                    });
                }
            },
            onMove: (evt, originalEvent) => {
                const dragged = evt.dragged;
                const related = evt.related;
                if (!dragged || !related) return true;
    
                const mouseX = originalEvent.clientX;
    
                // If the dragged item is already a child, check if the user intends to unnest it.
                if (dragged.hasAttribute('data-parent-id')) {
                    const parentId = dragged.getAttribute('data-parent-id');
                    const parentItem = this.elements.itemsList.querySelector(`li[data-item-id="${parentId}"]`);
                    if (parentItem) {
                        const parentRect = parentItem.getBoundingClientRect();
                        // Use a smaller threshold (e.g. parent's left + 20px) to decide if unnesting is intended.
                        const unnestThreshold = parentRect.left + 20;
                        if (mouseX < unnestThreshold) {
                            // Remove the parent relationship if dragged far left.
                            dragged.removeAttribute('data-parent-id');
                            dragged.classList.remove('mcl-child-item');
                        }
                    }
                    // Allow vertical reordering without interfering with the existing child status.
                    return true;
                } else {
                    // For items that are not already children, use the standard nesting threshold.
                    const relatedRect = related.getBoundingClientRect();
                    const nestingOffset = 40;
                    const nestingThreshold = relatedRect.left + nestingOffset;
                    const isNesting = mouseX > nestingThreshold;
    
                    // Do not allow nesting if the related item is a child.
                    if (isNesting && related.hasAttribute('data-parent-id')) {
                        return false;
                    }
    
                    dragged.classList.toggle('is-nesting', isNesting);
    
                    if (isNesting) {
                        // Set the related item as the parent.
                        dragged.setAttribute('data-parent-id', related.dataset.itemId);
                        dragged.classList.add('mcl-child-item');
                    } else {
                        // Remove any parent relationship.
                        dragged.removeAttribute('data-parent-id');
                        dragged.classList.remove('mcl-child-item');
                    }
                    return true;
                }
            },
            onEnd: (evt) => {
                const item = evt.item;
    
                // Remove nesting indicator
                item.querySelector('.mcl-nesting-indicator')?.remove();
                item.classList.remove('is-nesting');
    
                // If this was a parent being moved, reattach its hidden children.
                if (item.dataset.hasChildren === 'true') {
                    delete item.dataset.hasChildren;
                    const children = Array.from(this.elements.itemsList.querySelectorAll('.mcl-hidden-child'));
                    let lastInsertedElement = item;
                    children.forEach(child => {
                        child.classList.remove('mcl-hidden-child');
                        lastInsertedElement.after(child);
                        lastInsertedElement = child;
                    });
                }
    
                // Handle any parent that might have moved indirectly.
                this.reattachAllChildren();
    
                // Save the new order.
                this.saveChecklistData();
            }
        });
    }
    

    // Add new method to reattach all children
    reattachAllChildren() {
        if (!this.elements.itemsList) return;

        // Get all parent items (items that have children)
        const parents = new Set();
        const children = Array.from(this.elements.itemsList.querySelectorAll('li[data-parent-id]'));
        children.forEach(child => {
            parents.add(child.getAttribute('data-parent-id'));
        });

        // For each parent, reattach its children in order
        parents.forEach(parentId => {
            const parentItem = this.elements.itemsList.querySelector(`li[data-item-id="${parentId}"]`);
            if (parentItem) {
                const parentChildren = children.filter(child => 
                    child.getAttribute('data-parent-id') === parentId
                );
                
                let lastInsertedElement = parentItem;
                parentChildren.forEach(child => {
                    // Only move if not already in correct position
                    if (child.previousElementSibling !== lastInsertedElement) {
                        lastInsertedElement.after(child);
                    }
                    lastInsertedElement = child;
                });
            }
        });
    }

    savePublicUserOrder() {
        const checklistId = this.currentChecklistId;
        if (!checklistId) return;
        
        const checklistData = this.currentChecklistData;
        // Save order for any non-admin user who can interact with the checklist
        if (!checklistData?.can_edit && checklistData?.can_check) {
            // Get current order efficiently
            const itemOrder = Array.from(
                this.elements.itemsList.querySelectorAll('li'),
                li => li.getAttribute('data-item-id')
            ).filter(Boolean);
        
            // Save to localStorage
            const orderKey = `mcl_order_${checklistId}`;
            try {
                localStorage.setItem(orderKey, JSON.stringify(itemOrder));
            } catch (error) {
                console.error('Error saving order to localStorage:', error);
            }
        }
    }

    getPublicUserOrder(checklistId) {
        if (!checklistId) {
            return null;
        }
    
        const orderKey = `mcl_order_${checklistId}`;
        try {
            const stored = localStorage.getItem(orderKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error reading order from localStorage:', error);
            return null;
        }
    }

    initLinkManager() {
        this.createToolbar();
    
        if (this.itemsList) {
            // Handle text selection from mouse
            this.itemsList.addEventListener('mouseup', this.handleSelectionChange);
    
            // Handle keyboard selection
            this.itemsList.addEventListener('keyup', (e) => {
                // Check for selection-related keys
                const selectionKeys = [
                    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Home', 'End', 'PageUp', 'PageDown'
                ];
    
                if (
                    ((e.ctrlKey || e.metaKey) && e.key === 'a') ||
                    (e.shiftKey && selectionKeys.includes(e.key)) ||
                    selectionKeys.includes(e.key)
                ) {
                    this.handleSelectionChange(e);
                }
            });
        }
    
        // Handle global selection changes
        document.addEventListener('selectionchange', () => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (this.isSelectionWithinEditableContent(range)) {
                    this.handleSelectionChange();
                }
            }
        });
    
        // Add keyboard shortcut listener
        document.addEventListener('keydown', this.handleKeyboard);
    
        // Add click outside listener
        document.addEventListener('mousedown', this.handleClickOutside);
    }
    
    isSelectionWithinEditableContent(range) {
        let container = range.commonAncestorContainer;
    
        // Find closest content element
        while (container && !container.classList?.contains('mcl-item-content')) {
            container = container.parentNode;
        }
    
        // Check if it's within our items list
        return container && this.itemsList.contains(container);
    }

    handleSelectionChange(e = null) {
        // Clear any existing timeout
        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
        }
        
        // Small delay to ensure selection is stable
        this.selectionTimeout = setTimeout(() => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (selectedText && this.isValidSelection(selection)) {
                this.showSelectionIndicator(selection);
            } else {
                this.removeSelectionIndicator();
            }
        }, 50);
    }
    
    isValidSelection(selection) {
        if (!selection.rangeCount) return false;
    
        const range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;
    
        // Find the editable content container
        while (container && !container.classList?.contains('mcl-item-content')) {
            container = container.parentNode;
        }
    
        // Make sure we're within an editable content area and not in the toolbar
        return container && 
               container.matches('[contenteditable="true"]') && 
               !container.closest('.mcl-link-toolbar') &&
               selection.toString().trim().length > 0; // Ensure there's actual text selected
    }
    
    removeRemoveLinkIndicator() {
        if (this.currentRemoveIndicator && this.currentRemoveIndicator.parentNode) {
            this.currentRemoveIndicator.parentNode.removeChild(this.currentRemoveIndicator);
        }
        this.currentRemoveIndicator = null;
        this.currentLinkElement = null;
    }
    
    showRemoveLinkIndicator(linkElement) {
        // Remove any existing indicators
        this.removeRemoveLinkIndicator();
        this.removeSelectionIndicator();
    
        const rect = linkElement.getBoundingClientRect();
        const drawerContentRect = this.drawerContent.getBoundingClientRect();
        const scrollTop = this.drawerContent.scrollTop;
    
        // Create remove link indicator
        const indicator = document.createElement('div');
        indicator.className = 'mcl-remove-link-indicator';
        indicator.innerHTML = `
            <button type="button" class="mcl-remove-link-btn" title="Remove link">
                <!-- SVG icon -->
            </button>
        `;
    
        // Calculate position
        const relativeTop = rect.top - drawerContentRect.top + scrollTop;
        const relativeLeft = rect.right - drawerContentRect.left;
    
        // Position styles
        indicator.style.position = 'absolute';
        indicator.style.top = `${relativeTop}px`;
        indicator.style.left = `${relativeLeft + 8}px`; // 8px offset from link
        
        // Add to drawer content
        this.drawerContent.appendChild(indicator);
        
        // Store reference to current link
        this.currentLinkElement = linkElement;
    
        // Handle remove button click
        indicator.querySelector('.mcl-remove-link-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.removeLink(linkElement);
        });
    
        // Store reference for cleanup
        this.currentRemoveIndicator = indicator;
    }
    
    showSelectionIndicator(selection) {
        // Remove any existing indicators first
        this.removeSelectionIndicator();
    
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
    
        // Only show if we have actual dimensions
        if (rect.width === 0 || rect.height === 0) return;
    
        // Check if selection contains or is within a link
        const containsLink = this.selectionContainsLink(range);
    
        // Create floating indicator
        const indicator = document.createElement('div');
        indicator.className = 'mcl-selection-indicator';
    
        indicator.innerHTML = `
        <div class="mcl-selection-buttons">
            <button type="button" class="mcl-add-link-btn" title="Add link (Ctrl/Cmd + K)" 
                    style="${containsLink ? 'display: none;' : ''}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
            </button>
            <button type="button" class="mcl-remove-link-btn" title="Remove link" 
                    style="${!containsLink ? 'display: none;' : ''}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18"></path>
                    <path d="M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        `;
    
        // Get container dimensions
        const containerRect = this.drawerContent.getBoundingClientRect();
        const containerScroll = this.drawerContent.scrollTop || 0;
    
        // Calculate position relative to the container
        const relativeTop = rect.top - containerRect.top + containerScroll;
        const relativeLeft = rect.left - containerRect.left;
    
        // Position indicator with offset
        const verticalOffset = 24;
    
        indicator.style.position = 'absolute';
        indicator.style.top = `${relativeTop - verticalOffset}px`;
        indicator.style.left = `${relativeLeft + (rect.width / 2)}px`;
        indicator.style.transform = 'translateX(-50%)';
    
        // Bind event handlers
        indicator.querySelector('.mcl-add-link-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.checkSelection(true);
        });
    
        indicator.querySelector('.mcl-remove-link-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.removeLink(range);
        });
    
        // Add to container
        this.drawerContent.appendChild(indicator);
        this.currentIndicator = indicator;
    }
    
    removeLink(range) {
        // Clone the range to avoid modifying the original selection
        const clonedRange = range.cloneRange();
        const selection = window.getSelection();
        
        try {
            // Check if selection is entirely within a link
            let linkElement = range.commonAncestorContainer;
            while (linkElement && !linkElement.matches?.('a')) {
                linkElement = linkElement.parentNode;
            }

            if (linkElement?.matches('a')) {
                // Case 1: Selection is within a single link
                const textContent = linkElement.textContent;
                const textNode = document.createTextNode(textContent);
                linkElement.parentNode.replaceChild(textNode, linkElement);
                
                // Update selection to cover the new text node
                clonedRange.selectNodeContents(textNode);
                selection.removeAllRanges();
                selection.addRange(clonedRange);
            } else {
                // Case 2: Selection contains links or parts of links
                const fragment = range.extractContents();
                
                // Process all links in the fragment
                const links = fragment.querySelectorAll('a');
                links.forEach(link => {
                    const textNode = document.createTextNode(link.textContent);
                    link.parentNode.replaceChild(textNode, link);
                });
                
                // Reinsert the modified content
                range.insertNode(fragment);
                
                // Restore selection
                selection.removeAllRanges();
                selection.addRange(clonedRange);
            }
            
            // Remove the indicator
            this.removeSelectionIndicator();
            
        } catch (error) {
            console.error('Error removing link:', error);
            // Restore original selection in case of error
            selection.removeAllRanges();
            selection.addRange(clonedRange);
        }
    }
    
    selectionContainsLink(range) {
        // First check if selection is entirely within a link
        let container = range.commonAncestorContainer;
        while (container && !container.matches?.('a')) {
            container = container.parentNode;
        }
        if (container?.matches?.('a')) return true;

        // Then check if selection contains any links
        const fragment = range.cloneContents();
        return fragment.querySelector('a') !== null;
    }

    removeSelectionIndicator() {
        if (this.currentIndicator && this.currentIndicator.parentNode) {
            this.currentIndicator.parentNode.removeChild(this.currentIndicator);
        }
        this.currentIndicator = null;
    }
    
    createToolbar() {
        if (this.toolbar) return;
    
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'mcl-link-toolbar';
        this.toolbar.innerHTML = `
                <div class="mcl-link-toolbar-inner">
                    <input type="text" 
                           placeholder="Enter URL (https:// or http://)" 
                           class="mcl-link-input">
                    <button type="button" class="mcl-link-submit" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                <div class="mcl-link-error"></div>
            `;
    
        const input = this.toolbar.querySelector('.mcl-link-input');
        const submit = this.toolbar.querySelector('.mcl-link-submit');
        const errorDiv = this.toolbar.querySelector('.mcl-link-error');
    
        // Handle input validation
        input.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            const isValid = this.isValidUrl(value);
            
            // Update UI state
            submit.disabled = !isValid;
            input.classList.toggle('invalid', !isValid && value !== '');
            
            // Clear error message when typing
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        });
    
        // Handle input keyboard events
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                
                const value = input.value.trim();
                
                if (!value) {
                    this.showError('Please enter a URL');
                    return;
                }
                
                if (!this.isValidUrl(value)) {
                    this.showError('Please enter a valid URL starting with http:// or https://');
                    return;
                }
                
                this.createLink(value);
            }
        });
    
        // Handle submit button click
        submit.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // If button is disabled, keep focus on input and do nothing
          if (submit.disabled) {
              input.focus();
              return;
          }
          
          const value = input.value.trim();
          if (!value) {
              this.showError('Please enter a URL');
              input.focus();
              return;
          }
          
          if (!this.isValidUrl(value)) {
              this.showError('Please enter a valid URL starting with http:// or https://');
              input.focus();
              return;
          }
          
          this.createLink(value);
        });
    
        // Prevent toolbar interactions from affecting selection
        this.toolbar.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.isToolbarVisible) {
              input.focus();
          }
        });
    
        // Add to drawer
        this.container.appendChild(this.toolbar);
    }

    handleClickOutside(e) {
        // Check if click is outside all indicators and toolbar
        if (this.isToolbarVisible && 
            !e.target.closest('.mcl-link-toolbar') && 
            !e.target.closest('.mcl-selection-indicator') &&
            !e.target.closest('.mcl-remove-link-indicator')) {
            this.hideToolbar();
        }
    
        // Remove indicators if clicking outside
        if (!e.target.closest('.mcl-selection-indicator') && 
            !e.target.closest('.mcl-remove-link-indicator') &&
            !e.target.closest('.mcl-item-content')) {
            this.removeSelectionIndicator();
            this.removeRemoveLinkIndicator();
        }
    }
    
    isValidUrl(url) {
        if (!url) return false;
        
        // Remove whitespace
        url = url.trim();
        
        if (!/^https?:\/\//i.test(url)) {
            // Check if it looks like a valid domain
            return !!(/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(url));
        }
        
        try {
            const urlObject = new URL(url);
            return ['http:', 'https:'].includes(urlObject.protocol);
        } catch {
            return false;
        }
    }

    handleSelection() {
        requestAnimationFrame(() => this.checkSelection());
    }

    checkSelection(userInitiated = false) {
        const selection = window.getSelection();
        
        if (!selection.rangeCount) {
            this.hideToolbar();
            return;
        }
    
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString().trim();
    
        // Find editable content element
        let container = range.commonAncestorContainer;
        while (container && !container.classList?.contains('mcl-item-content')) {
            container = container.parentNode;
        }
    
        // Only proceed if we're inside an editable content area
        if (!container || !container.matches('[contenteditable="true"]') || !selectedText) {
            this.hideToolbar();
            return;
        }
    
        // Only show toolbar if user initiated (through keyboard or button)
        if (userInitiated) {
            // Store selection information
            this.currentSelection = {
                range: range.cloneRange(),
                text: selectedText,
                editableContent: container
            };
    
            this.maintainVisualSelection();
            this.showToolbar(range);
            
            // Remove the indicator since we're showing the toolbar
            this.removeSelectionIndicator();
        }
    }
    
    maintainVisualSelection() {
        try {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
    
            const range = selection.getRangeAt(0);
            
            // Check if selection spans multiple nodes
            if (!range.commonAncestorContainer.textContent) {
                return;
            }
    
            // Remove any existing selection spans first
            const existingSpans = document.querySelectorAll('.mcl-selected-text');
            existingSpans.forEach(span => {
                if (span.parentNode) {
                    const text = document.createTextNode(span.textContent);
                    span.parentNode.replaceChild(text, span);
                }
            });
    
            // Only proceed if we have a text selection
            if (selection.toString().trim()) {
                try {
                    // Create temporary fragment
                    const fragment = range.extractContents();
                    const span = document.createElement('span');
                    span.className = 'mcl-selected-text';
                    span.appendChild(fragment);
                    range.insertNode(span);
                    
                    // Store reference to remove later
                    this.currentSelection.selectionSpan = span;
                } catch (e) {
                    console.warn('Could not wrap selection:', e);
                    // Restore original selection
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        } catch (e) {
            console.warn('Error maintaining selection:', e);
        }
    }
    
    showToolbar(range) {
        if (!this.toolbar || !range) return;
    
        // Prevent default scroll behavior on toolbar elements
        this.toolbar.querySelectorAll('input, button').forEach(element => {
            element.addEventListener('focus', (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, { capture: true });
        });
    
        const rect = range.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const containerScroll = this.container.scrollTop || 0;
        const documentScroll = window.scrollY || document.documentElement.scrollTop;
    
        // Calculate position relative to container
        const top = rect.top - containerRect.top + containerScroll + (documentScroll - (this.drawer == document ? documentScroll : 0));
        const left = rect.left - containerRect.left;
    
        // Keep toolbar within bounds
        const maxLeft = containerRect.width - this.toolbar.offsetWidth;
        const boundedLeft = Math.max(10, Math.min(left, maxLeft - 10));
    
        // Reset toolbar state
        const input = this.toolbar.querySelector('.mcl-link-input');
        const submit = this.toolbar.querySelector('.mcl-link-submit');
        const errorDiv = this.toolbar.querySelector('.mcl-link-error');
        
        input.value = '';
        input.classList.remove('invalid');
        submit.disabled = true;
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    
        // Position toolbar
        this.toolbar.style.transform = `translate(${boundedLeft}px, ${top - this.toolbar.offsetHeight - 10}px)`;
        
        // Store current scroll position before showing toolbar
        const currentScroll = {
            x: window.scrollX,
            y: window.scrollY
        };
    
        // Show toolbar
        this.toolbar.classList.add('mcl-link-toolbar-visible');
        
        // Use double requestAnimationFrame to ensure DOM updates are complete
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Prevent scroll
                if (this.container == document) {
                    window.scrollTo(currentScroll.x, currentScroll.y);
                } else {
                    this.container.scrollTop = containerScroll;
                }
                
                // Focus input with scroll prevention
                const preventScroll = () => {
                    window.scrollTo(currentScroll.x, currentScroll.y);
                    input.removeEventListener('focus', preventScroll);
                };
                
                input.addEventListener('focus', preventScroll);
                input.focus({ preventScroll: true });
            });
        });
    
        this.isToolbarVisible = true;
      }
    
    hideToolbar() {
          if (!this.toolbar) return;
          
          // Remove selection highlighting
          if (this.currentSelection?.selectionSpan) {
              const span = this.currentSelection.selectionSpan;
              const parent = span.parentNode;
              if (parent) {
                  parent.insertBefore(document.createTextNode(span.textContent), span);
                  parent.removeChild(span);
              }
          }
    
          this.toolbar.classList.remove('mcl-link-toolbar-visible');
          this.isToolbarVisible = false;
          this.currentSelection = null;
    }
    
    handleKeyboard(e) {
        // Handle Ctrl/Cmd + K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            
            // Get current selection
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (selectedText && this.isValidSelection(selection)) {
                // Show link toolbar immediately
                this.checkSelection(true);
            } else {
                // If no text is selected, show a hint to the user
                // You might want to add a small toast notification here
                console.log('Please select some text first');
            }
            return;
        }
    
        // Hide toolbar on Escape
        if (e.key === 'Escape') {
            if (this.isToolbarVisible) {
                e.preventDefault();
                this.hideToolbar();
            } else {
                this.removeSelectionIndicator();
            }
        }
    }
    
    createLink(url) {
          if (!this.currentSelection || !url || !this.isValidUrl(url)) return;
    
          try {
              // Normalize URL
              if (!/^https?:\/\//i.test(url)) {
                  url = 'https://' + url;
              }
    
              // Create and configure link
              const link = document.createElement('a');
              link.href = url;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
    
              // Get the selection content
              if (this.currentSelection.selectionSpan) {
                  // If we have a selection span, use its content
                  link.textContent = this.currentSelection.selectionSpan.textContent;
                  this.currentSelection.selectionSpan.parentNode.replaceChild(link, this.currentSelection.selectionSpan);
              } else {
                  // Fallback to range-based insertion
                  const range = this.currentSelection.range;
                  const fragment = range.extractContents();
                  link.appendChild(fragment);
                  range.insertNode(link);
              }
    
              // Clean up
              this.hideToolbar();
    
              // Move cursor after link
              const selection = window.getSelection();
              const newRange = document.createRange();
              newRange.setStartAfter(link);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
    
          } catch (error) {
              console.error('Error creating link:', error);
          }
    }

    destroy() {
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyboard);
        document.removeEventListener('mousedown', this.handleClickOutside);
    
        // Remove toolbar if it exists
        if (this.toolbar && this.toolbar.parentNode) {
            this.toolbar.parentNode.removeChild(this.toolbar);
            this.toolbar = null;
        }
    
        // Remove any existing selection spans
        if (this.itemsList) {
            const spans = this.itemsList.querySelectorAll('.mcl-selected-text');
            spans.forEach(span => {
                if (span.parentNode) {
                    span.parentNode.replaceChild(
                        document.createTextNode(span.textContent),
                        span
                    );
                }
            });
    
            // Remove any remaining indicators
            const indicators = this.itemsList.querySelectorAll('.mcl-selection-indicator, .mcl-remove-link-indicator');
            indicators.forEach(indicator => indicator.remove());
        }
        
        if (this.isDraggableInitialized()) {
            this.draggable.destroy();
        }
    }
    
    setupCongratulationsContainer() {
        const congratsContainer = this.drawer.querySelector('.mcl-congratulations');
        if (!congratsContainer) {
            console.warn('Congratulations container not found');
            return;
        }
    
        // Clear any existing confetti
        congratsContainer.querySelectorAll('.mcl-confetti').forEach(el => el.remove());
    }

    async getInitialCheckedState(data) {
        const checklistId = this.currentChecklistId;
    
        // If using per-user handling
        if (data.checked_state_handling === 'per_user') {
            // For logged-in users, get from user meta through server
            if (window.mcl_checklists?.user_access?.is_logged_in) {
                return data.checked_state || [];
            }
            // For non-logged in users, get from local storage
            return this.getLocalCheckedState(checklistId);
        }
    
        // For global state handling
        return data.checked_state || [];
    }

    updateAccessUI(data) {
        const { drawerContent } = this;
    
        // Update title editability
        const titleElement = drawerContent.querySelector('.mcl-drawer-title');
        titleElement.textContent = data.title;
        titleElement.contentEditable = (data.can_edit && !data.locked) ? 'true' : 'false';
    
        // Clear existing permission classes
        drawerContent.classList.remove('mcl-view-only', 'mcl-interact-only', 'mcl-locked');
    
        // Add appropriate permission class
        if (data.locked) {
            drawerContent.classList.add('mcl-locked');
        } else if (!data.can_check) {
            drawerContent.classList.add('mcl-view-only');
        } else if (!data.can_edit) {
            drawerContent.classList.add('mcl-interact-only');
        }
    
        // Update access indicator
        const accessIndicator = drawerContent.querySelector('.mcl-access-indicator');
        const accessText = accessIndicator.querySelector('.mcl-access-text');
    
        if (data.is_public) {
            accessIndicator.style.display = 'flex';
            let accessLevel = 'View Only';
            if (data.can_edit && !data.locked) {
                accessLevel = 'Edit View';
            } else if (data.can_edit && data.locked) {
                accessLevel = 'Locked';
            } else if (data.can_check) {
                accessLevel = 'Interactive';
            }
            accessText.textContent = `Public (${accessLevel})`;
        } else {
            accessIndicator.style.display = 'none';
        }
    
        // Update actions visibility based on permissions and locked state
        this.updateDrawerActions(data);
    }    

    updateDrawerActions(data) {
        const actionsContainer = this.drawerContent.querySelector('.mcl-drawer-actions');
        const addItemButton = actionsContainer.querySelector('#mcl-add-item');
        const uncheckAllButton = actionsContainer.querySelector('#mcl-uncheck-all');
    
        // Show/hide container based on permissions
        actionsContainer.style.display = data.can_check || (data.can_edit && !data.locked) ? 'flex' : 'none';
    
        // Add item button - only for edit permission and not locked
        addItemButton.style.display = (data.can_edit && !data.locked) ? 'flex' : 'none';
    
        // Uncheck all button - only for check or edit permission
        uncheckAllButton.style.display = (data.can_check || data.can_edit) ? 'flex' : 'none';
    }

    updateDeadlineDisplay(timeDate) {
        const countdownElement = this.drawerContent.querySelector('#mcl-countdown');
        const deadlineContainer = this.drawerContent.querySelector('#mcl-deadline-container');
    
        if (timeDate) {
            deadlineContainer.style.display = 'flex';
            countdownElement.setAttribute('data-deadline', timeDate);
            countdownElement.textContent = 'Loading countdown...';
            
            // Convert Unix timestamp to milliseconds
            const timestamp = parseInt(timeDate) * 1000;
            this.countdown.startCountdown(timestamp);
        } else {
            deadlineContainer.style.display = 'none';
            countdownElement.textContent = '';
            countdownElement.removeAttribute('data-deadline');
        }
    }

    updateTheme(theme) {
        const themeClass = theme === 'dark' ? 'mcl-theme-dark' : 
                           theme === 'custom' ? 'mcl-theme-custom' : 
                           'mcl-theme-light';
    
        // Remove all theme classes
        this.drawer.classList.remove('mcl-theme-dark', 'mcl-theme-light', 'mcl-theme-custom');
        this.drawerContent.classList.remove('mcl-theme-dark', 'mcl-theme-light', 'mcl-theme-custom');
    
        // Add the correct theme class
        this.drawer.classList.add(themeClass);
        this.drawerContent.classList.add(themeClass);
    }
    
    openDrawer() {
        const drawerCheck = this.canPerformDrawerOperation();
        if (!drawerCheck.allowed) {
            this.showGlobalError(this.getCountdownMessage('global'));
            return;
        }
        this.drawer.classList.add('mcl-open');
    }

    async closeDrawer() {
        try {
            // Only attempt to save checklist data if we actually modified items
            if (this.currentChecklistData?.can_edit && !this.currentChecklistData.locked) {
                await this.saveChecklistData().catch(error => {
                    // Log error but don't prevent drawer from closing
                    console.warn('Non-critical error during save:', error);
                });
            }

            if (this.currentChecklistData && this.currentChecklistData.can_edit) {
                // Release the lock
                await this.releaseLock();
            }

            // Hide locked overlays/messages
            const lockedOverlay = this.drawerContent.querySelector('.mcl-locked-overlay');
            if (lockedOverlay) {
                lockedOverlay.style.display = 'none';
            }

            const lockedMessageElement = this.drawerContent.querySelector('.mcl-locked-overlay');
            if (lockedMessageElement) {
                lockedMessageElement.style.display = 'none';
                lockedMessageElement.textContent = '';
            }
    
            // Close the drawer regardless of state
            this.drawer.classList.remove('mcl-open');
    
            // Reset all state
            this.currentChecklistId = null;
            this.drawerEventsBound = false;
    
            // Clean up congratulations if any
            this.cleanupCongratulations();
    
            // Clear checklist data
            this.currentChecklistData = null;
            this.activeChecklists = [];
            this.currentIndex = -1;
        } catch (error) {
            // Even if there's an error, ensure the drawer closes
            this.drawer.classList.remove('mcl-open');
            console.warn('Error during drawer closure:', error);
        }
    }

    showCongratulations() {
        const congratsContainer = this.drawer.querySelector('.mcl-congratulations');
        if (!congratsContainer) return;
    
        // Clear any existing timeout
        if (this.congratsTimeout) {
            clearTimeout(this.congratsTimeout);
        }
    
        // Add active class and create confetti
        congratsContainer.classList.add('active');
        this.createConfetti();
    
        // Remove after animation
        this.congratsTimeout = setTimeout(() => {
            congratsContainer.classList.remove('active');
        }, 3000);
    }

    createConfetti() {
        const congratsContainer = this.drawer.querySelector('.mcl-congratulations');
        const colors = ['#6c63ff', '#ff6b6b', '#ffd93d', '#6bff95', '#ff6bcd'];
    
        // Clear existing confetti
        congratsContainer.querySelectorAll('.mcl-confetti').forEach(el => el.remove());
    
        // Create new confetti pieces
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'mcl-confetti';
    
            // Randomize properties
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
    
            const fallDuration = 1 + Math.random() * 2;
            confetti.style.setProperty('--fall-duration', `${fallDuration}s`);
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
    
            fragment.appendChild(confetti);
        }
        congratsContainer.appendChild(fragment);
    }

    cleanupCongratulations() {
        const congratsContainer = this.drawer.querySelector('.mcl-congratulations');
        if (congratsContainer) {
            congratsContainer.classList.remove('active');
            congratsContainer.querySelectorAll('.mcl-confetti').forEach(el => el.remove());
        }
    
        if (this.congratsTimeout) {
            clearTimeout(this.congratsTimeout);
            this.congratsTimeout = null;
        }
    }

    bindNavigationEvents() {
        const prevButton = this.drawer.querySelector('.mcl-nav-prev');
        const nextButton = this.drawer.querySelector('.mcl-nav-next');

        prevButton?.addEventListener('click', () => this.navigateChecklists('prev'));
        nextButton?.addEventListener('click', () => this.navigateChecklists('next'));
    }

    async navigateChecklists(direction) {
        try {
          // Don't navigate if rate limit is reached
          const drawerCheck = this.canPerformDrawerOperation();
          if (!drawerCheck.allowed) {
            this.showGlobalError(this.getCountdownMessage('global'));
            return;
          }
    
          const activeChecklists = this.getActiveChecklists();
          
          // Don't proceed if we don't have multiple checklists
          if (activeChecklists.length <= 1) {
            return;
          }
    
          // Find current index if not set
          if (this.currentIndex === -1) {
            this.currentIndex = activeChecklists.indexOf(this.currentChecklistId);
          }
    
          // Calculate new index
          let newIndex;
          if (direction === 'next') {
            newIndex = (this.currentIndex + 1) % activeChecklists.length;
          } else {
            newIndex = (this.currentIndex - 1 + activeChecklists.length) % activeChecklists.length;
          }
    
          // Add transition class
          this.drawerContent.classList.add('switching');
    
          // Load the new checklist
          const nextChecklistId = activeChecklists[newIndex];
          await this.loadChecklist(nextChecklistId);
          this.currentIndex = newIndex;
    
          // Update button states
          this.updateNavigationButtons();
        } catch (error) {
        } finally {
          // Remove transition class
          setTimeout(() => {
            this.drawerContent.classList.remove('switching');
          }, 200);
        }
    }

    updateNavigationButtons() {
        const prevButton = this.drawer.querySelector('.mcl-nav-prev');
        const nextButton = this.drawer.querySelector('.mcl-nav-next');
    
        if (!prevButton || !nextButton) return;
    
        const activeChecklists = this.getActiveChecklists();
        const hasMultipleChecklists = activeChecklists.length > 1;
    
        // Only enable if we have multiple checklists and a current checklist
        if (hasMultipleChecklists && this.currentChecklistId) {
          prevButton.disabled = false;
          nextButton.disabled = false;
        } else {
          prevButton.disabled = true;
          nextButton.disabled = true;
        }
      }

    getActiveChecklists() {
        try {
          // Only gather if empty
          if (!this.activeChecklists.length) {
            const shortcuts = window.mcl_checklists?.shortcuts || {};
            this.activeChecklists = Object.entries(shortcuts)
              .filter(([id, data]) => {
                // Ensure we have valid data and the checklist is active
                return data && id;
              })
              .map(([id]) => id);
    
            // Sort by checklist ID
            this.activeChecklists.sort((a, b) => parseInt(a) - parseInt(b));
          }
          
          return this.activeChecklists;
        } catch (error) {
          return []; 
        }
    }

    handleResetCheck(checklistData) {
        // Ensure reset_info exists in the checklist data
        if (!checklistData.reset_info) return;
    
        const { reset_info } = checklistData;
    
        if (!reset_info.enabled) {
            // If reset is not enabled, just clear any existing reset info
            const existingInfo = this.drawerContent.querySelector('.mcl-reset-info');
            if (existingInfo) {
                existingInfo.remove();
            }
            return;
        }
    
        const storageKey = this.getStorageKey(checklistData.checklist_id);
    
        // Handle based on checked state handling method
        if (checklistData.checked_state_handling === 'per_user') {
            if (window.mcl_checklists?.user_access?.is_logged_in) {
                try {
                    const storedResetCounter = sessionStorage.getItem(`mcl_reset_counter_${checklistData.checklist_id}`);
                    
                    if (storedResetCounter !== reset_info.reset_counter.toString()) {
                        checklistData.checked_state = [];
                        sessionStorage.setItem(`mcl_reset_counter_${checklistData.checklist_id}`, reset_info.reset_counter);
                        this.uncheckAllItems();
                    }
                } catch (error) {
                    console.error('Error handling reset for logged-in user:', error);
                }
            } else {
                try {
                    const storedData = localStorage.getItem(`${storageKey}_reset`);
                    const storedInfo = storedData ? JSON.parse(storedData) : null;
    
                    if (!storedInfo || storedInfo.counter !== reset_info.reset_counter) {
                        localStorage.removeItem(storageKey);
                        localStorage.setItem(`${storageKey}_reset`, JSON.stringify({
                            counter: reset_info.reset_counter,
                            next: reset_info.next_reset
                        }));
                    }
                } catch (error) {
                    console.error('Error handling reset check for logged-out user:', error);
                }
            }
        } else {
            // Handle global checked state
            try {
                const storedResetCounter = sessionStorage.getItem(`mcl_reset_counter_${checklistData.checklist_id}`);
                
                if (storedResetCounter !== reset_info.reset_counter.toString()) {
                    // Reset global checked state for both public and private
                    checklistData.checked_state = [];
                    
                    sessionStorage.setItem(`mcl_reset_counter_${checklistData.checklist_id}`, reset_info.reset_counter);
                    this.uncheckAllItems();
                }
                
            } catch (error) {
                console.error('Error handling reset for global state:', error);
            }
        }
    
        // Show reset notification if applicable
        if (reset_info.was_reset) {
            this.showResetNotification();
        }
    
        // Update the reset info display
        if (reset_info.next_reset) {
            // Remove any existing reset info first
            const existingInfo = this.drawerContent.querySelector('.mcl-reset-info');
            if (existingInfo) {
                existingInfo.remove();
            }
    
            // Create and add new reset info
            const resetInfo = document.createElement('div');
            resetInfo.className = 'mcl-reset-info';
            
            // Calculate time remaining until reset
            const now = Math.floor(Date.now() / 1000);
            const timeRemaining = reset_info.next_reset - now;
            
            // Format time remaining
            const formattedTime = this.formatTimeRemaining(timeRemaining);
            
            resetInfo.innerHTML = `
                <span class="mcl-reset-info-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </span>
                <span class="mcl-reset-info-text">
                    Resets in: ${formattedTime}
                </span>
            `;
    
            // Add to drawer header
            const headerActions = this.drawerContent.querySelector('.mcl-drawer-actions');
            if (headerActions) {
                headerActions.appendChild(resetInfo);
            }
        }
    }

    /**
     * Format time remaining in hours and minutes
     * @param {number} seconds - Time remaining in seconds
     * @return {string} Formatted time string
     */
    formatTimeRemaining(seconds) {
        if (seconds <= 0) {
            return 'Soon';
        }
        
        // Calculate days, hours, and minutes
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        // Format the string based on how much time is left
        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    updateNextResetDisplay(nextReset) {
        const resetInfo = document.createElement('div');
        resetInfo.className = 'mcl-reset-info';
        
        // Calculate time remaining until reset
        const now = Math.floor(Date.now() / 1000);
        const timeRemaining = nextReset - now;
        
        // Format time remaining
        const formattedTime = this.formatTimeRemaining(timeRemaining);
        
        resetInfo.innerHTML = `
            <span class="mcl-reset-info-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            </span>
            <span class="mcl-reset-info-text">
                Resets in: ${formattedTime}
            </span>
        `;
    
        // Add to drawer header
        const headerActions = this.drawerContent.querySelector('.mcl-drawer-actions');
        if (headerActions) {
            headerActions.appendChild(resetInfo);
        }
    }

    showResetNotification() {
        const notification = document.createElement('div');
        notification.className = 'mcl-notification mcl-reset-notification';
        notification.innerHTML = `
            <div class="mcl-notification-content">
                <span class="mcl-notification-message">
                    This checklist has been automatically reset.
                </span>
                <button type="button" class="mcl-notification-close">
                    <span class="dashicons dashicons-no-alt"></span>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add close button functionality
        notification.querySelector('.mcl-notification-close').addEventListener('click', () => {
            notification.classList.add('mcl-notification-hiding');
            setTimeout(() => notification.remove(), 300);
        });
        
        // Show notification with animation
        requestAnimationFrame(() => {
            notification.classList.add('mcl-notification-visible');
        });
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.add('mcl-notification-hiding');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    initInProgressState() {
        // Get in-progress items from checklist data
        const inProgressItems = this.currentChecklistData?.items_in_progress || [];
        
        // Reset all items first
        this.itemsList.querySelectorAll('li').forEach(listItem => {
            listItem.classList.remove('mcl-item-in-progress');
            const btn = listItem.querySelector('.mcl-in-progress-btn');
            if (btn) {
                btn.classList.remove('active');
            }
        });
    
        // Apply in-progress state to relevant items
        inProgressItems.forEach(itemId => {
            const listItem = this.itemsList.querySelector(`li[data-item-id="${itemId}"]`);
            if (listItem) {
                listItem.classList.add('mcl-item-in-progress');
                const btn = listItem.querySelector('.mcl-in-progress-btn');
                if (btn) {
                    btn.classList.add('active');
                }
            }
        });
    }
    
    toggleInProgress(listItem) {
        if (!this.checkActionRateLimit()) return;
    
        const btn = listItem.querySelector('.mcl-in-progress-btn');
        
        if (btn) {
            btn.classList.toggle('active');
        }
        
        listItem.classList.toggle('mcl-item-in-progress');
    
        // Get all current in-progress items
        const inProgressItems = Array.from(
            this.itemsList.querySelectorAll('li.mcl-item-in-progress')
        ).map(li => li.getAttribute('data-item-id'));
    
        this.saveInProgressState(inProgressItems);
    }
    
    async saveInProgressState(inProgressItems) {
        try {
            const formData = new FormData();
            formData.append('action', 'mcl_save_in_progress');
            formData.append('checklist_id', this.currentChecklistId);
            formData.append('items_in_progress', JSON.stringify(inProgressItems));
    
            if (window.mcl_checklists?.nonce) {
                formData.append('nonce', window.mcl_checklists.nonce);
            }
    
            const storedToken = this.getStoredToken();
            if (storedToken) {
                formData.append('stored_token', storedToken);
            }
    
            const response = await fetch(window.mcl_checklists.ajax_url, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
    
            const result = await response.json();
            
            if (!result.success) {
                console.error('Error saving in-progress state:', result.data);
                this.initInProgressState();
            }
        } catch (error) {
            console.error('Error saving in-progress state:', error);
            this.initInProgressState();
        }
    }
    
    initializeItemDeadline(listItem, deadline) {
        const deadlineContainer = listItem.querySelector('.mcl-item-deadline-container');
        if (!deadlineContainer) return;
    
        deadlineContainer.style.display = 'block';
        deadlineContainer.innerHTML = `
            <div class="mcl-item-deadline-info">
                <span class="mcl-item-deadline-countdown"></span>
            </div>
        `;
    
        this.updateItemDeadlineStatus(listItem, deadline);
    }
    
    updateItemDeadlineStatus(listItem, deadline) {
        const now = Date.now();
        const timeLeft = deadline - now;
        
        // Remove existing status classes
        listItem.classList.remove(
            'mcl-deadline-24h',
            'mcl-deadline-2h',
            'mcl-deadline-passed'
        );
    
        // Add appropriate status class
        if (timeLeft < 0) {
            listItem.classList.add('mcl-deadline-passed');
        } else if (timeLeft < 7200000) { // 2 hours
            listItem.classList.add('mcl-deadline-2h');
        } else if (timeLeft < 86400000) { // 24 hours
            listItem.classList.add('mcl-deadline-24h');
        }
    
        // Update countdown text
        const countdownElement = listItem.querySelector('.mcl-item-deadline-countdown');
        if (countdownElement) {
            countdownElement.textContent = this.formatItemDeadlineCountdown(timeLeft);
        }
    }
    
    // Add method to format countdown
    formatItemDeadlineCountdown(timeLeft) {
        if (timeLeft < 0) {
            return 'Deadline passed';
        }
    
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    handleItemDeadlineClick(e) {
        const button = e.target.closest('.mcl-item-deadline-btn');
        if (!button) return;
    
        const listItem = button.closest('li');
        if (!listItem) return;
    
        const itemId = listItem.getAttribute('data-item-id');
    
        // Find deadline in the current checklist data
        let existingDeadline;
        if (this.currentChecklistData?.items) {
            const item = this.currentChecklistData.items.find(item => item.id === itemId);
            if (item?.deadline) {
                existingDeadline = parseInt(item.deadline);
            }
        }
    
        // Create datetime input modal
        const modal = document.createElement('div');
        modal.className = 'mcl-modal-overlay';
        
        // Set default value based on existing deadline or current time
        let defaultValue;
        if (existingDeadline && !isNaN(existingDeadline)) {
            const deadlineDate = new Date(existingDeadline * 1000);
            defaultValue = deadlineDate.getFullYear() + '-' +
                String(deadlineDate.getMonth() + 1).padStart(2, '0') + '-' +
                String(deadlineDate.getDate()).padStart(2, '0') + 'T' +
                String(deadlineDate.getHours()).padStart(2, '0') + ':' +
                String(deadlineDate.getMinutes()).padStart(2, '0');
        } else {
            const now = new Date();
            defaultValue = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0') + 'T' +
                String(now.getHours()).padStart(2, '0') + ':' +
                String(now.getMinutes()).padStart(2, '0');
        }
    
        // Get current time for min attribute
        const now = new Date();
        const minValue = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + 'T' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');
    
        modal.innerHTML = `
            <div class="mcl-modal">
                <div class="mcl-modal-header">
                    <h3 class="mcl-modal-title">Set Deadline</h3>
                    <button type="button" class="mcl-modal-close">&times;</button>
                </div>
                <div class="mcl-modal-content">
                    <input type="datetime-local" 
                           id="deadline-input" 
                           value="${defaultValue}"
                           min="${minValue}">
                </div>
                <div class="mcl-modal-actions">
                    <button type="button" class="mcl-modal-button mcl-modal-button-secondary" id="clear-deadline">
                        Clear
                    </button>
                    <button type="button" class="mcl-modal-button mcl-modal-button-primary" id="save-deadline">
                        Save
                    </button>
                </div>
            </div>
        `;
    
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 0);
    
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };
    
        // Bind events
        modal.querySelector('.mcl-modal-close').onclick = closeModal;
        modal.querySelector('#clear-deadline').onclick = () => {
            this.saveItemDeadline(listItem, null);
            closeModal();
        };
        modal.querySelector('#save-deadline').onclick = () => {
            const input = modal.querySelector('#deadline-input');
            const timestamp = Math.floor(new Date(input.value).getTime() / 1000);
            this.saveItemDeadline(listItem, timestamp);
            closeModal();
        };
    
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    async saveItemDeadline(listItem, timestamp) {
        try {
            const itemId = listItem.getAttribute('data-item-id');
            const formData = new FormData();
            formData.append('action', 'mcl_save_item_deadline');
            formData.append('checklist_id', this.currentChecklistId);
            formData.append('item_id', itemId);
            formData.append('deadline', timestamp);
    
            if (window.mcl_checklists?.nonce) {
                formData.append('nonce', window.mcl_checklists.nonce);
            }
    
            const response = await fetch(window.mcl_checklists.ajax_url, {
                method: 'POST',
                body: formData
            });
    
            const result = await response.json();
            if (result.success) {
                // Immediately initialize deadline display
                if (timestamp) {
                    // First, ensure the container exists and has proper structure
                    let deadlineContainer = listItem.querySelector('.mcl-item-deadline-container');
                    if (!deadlineContainer) {
                        deadlineContainer = document.createElement('div');
                        deadlineContainer.className = 'mcl-item-deadline-container';
                        listItem.appendChild(deadlineContainer);
                    }
    
                    // Create or update the inner structure
                    deadlineContainer.innerHTML = `
                        <div class="mcl-item-deadline-info">
                            <span class="mcl-item-deadline-countdown"></span>
                        </div>
                    `;
                    deadlineContainer.style.display = 'block';
    
                    // Store deadline in data attribute
                    listItem.setAttribute('data-deadline', timestamp);
    
                    // Ensure DOM is updated before starting countdown
                    requestAnimationFrame(() => {
                        // Double check elements exist before starting countdown
                        const countdownElement = deadlineContainer.querySelector('.mcl-item-deadline-countdown');
                        if (countdownElement) {
                            // Start countdown with a slight delay to ensure DOM is ready
                            setTimeout(() => {
                                this.countdown.startItemCountdown(listItem, timestamp * 1000);
                            }, 0);
                        }
                    });
                } else {
                    // Handle deadline removal
                    const container = listItem.querySelector('.mcl-item-deadline-container');
                    if (container) {
                        container.style.display = 'none';
                        container.innerHTML = ''; // Clear the container
                    }
                    listItem.removeAttribute('data-deadline');
                    this.countdown.clearItemCountdown(itemId);
                    
                    // Remove deadline-related classes
                    listItem.classList.remove('mcl-deadline-24h', 'mcl-deadline-2h', 'mcl-deadline-passed');
                }
            }
        } catch (error) {
            console.error('Error saving deadline:', error);
        }
    }

    startItemCountdown(listItem, deadline) {
        if (!listItem || !deadline) return;
    
        const itemId = listItem.getAttribute('data-item-id');
        this.clearItemCountdown(itemId);
    
        const container = listItem.querySelector('.mcl-item-deadline-container');
        if (!container) return;
    
        const countdownElement = container.querySelector('.mcl-item-deadline-countdown');
        if (!countdownElement) return;
    
        const updateItemCountdown = () => {
            const now = new Date();
            const distance = deadline - now.getTime();
    
            // Remove existing deadline classes
            listItem.classList.remove(
                'mcl-deadline-24h',
                'mcl-deadline-2h',
                'mcl-deadline-passed'
            );
    
            if (distance < 0) {
                const deadlineDate = new Date(deadline);
                deadlineDate.setTime(deadlineDate.getTime() + deadlineDate.getTimezoneOffset() * 60000);
                countdownElement.textContent = `Passed (${deadlineDate.toLocaleString()})`;
                listItem.classList.add('mcl-deadline-passed');
                this.clearItemCountdown(itemId);
                return;
            }
    
            // Always show countdown format for active deadlines
            countdownElement.textContent = this.formatItemCountdown(distance);
            this.updateItemDeadlineWarnings(listItem, distance);
        };
    
        updateItemCountdown();
        const interval = setInterval(updateItemCountdown, 60000);
        this.itemIntervals.set(itemId, interval);
    }

    formatItemCountdown(distance) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    
        if (days > 0) return `${days}d ${hours}h remaining`;
        if (hours > 0) return `${hours}h ${minutes}m remaining`;
        return `${minutes}m remaining`;
    }

    // Add to MagicChecklistDrawer class
    updateProgressCounter() {
        const items = this.itemsList.querySelectorAll('li');
        const checkedItems = this.itemsList.querySelectorAll('li input[type="checkbox"]:checked');
        
        const totalItems = items.length;
        const totalChecked = checkedItems.length;
        const percentage = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;
        
        // Update the stats
        const statsContainer = this.drawerContent.querySelector('.mcl-progress-stats');
        if (statsContainer) {
            const totalItemsEl = statsContainer.querySelector('.mcl-total-items');
            const checkedItemsEl = statsContainer.querySelector('.mcl-checked-items');
            const percentageEl = statsContainer.querySelector('.mcl-completion-percentage');
            
            if (totalItemsEl) {
                totalItemsEl.textContent = `${totalItems} items`;
            }
            if (checkedItemsEl) {
                checkedItemsEl.textContent = `${totalChecked} completed`;
            }
            if (percentageEl) {
                percentageEl.textContent = `${percentage}% complete`;
                if (percentage === 100) {
                    percentageEl.classList.add('complete');
                } else {
                    percentageEl.classList.remove('complete');
                }
            }
        }
        
        // Update the progress bar
        const progressFill = this.drawerContent.querySelector('.mcl-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
    }

    // Add new method to handle reordering with children
    reorderItemWithChildren(isChecked, listItem) {
        // Check if this is a child item
        if (listItem.hasAttribute('data-parent-id')) {
            // Get the parent item
            const parentId = listItem.getAttribute('data-parent-id');
            const parentItem = this.itemsList.querySelector(`li[data-item-id="${parentId}"]`);
            
            if (parentItem) {
                // Get all siblings (children of the same parent)
                const siblings = Array.from(
                    this.itemsList.querySelectorAll(`li[data-parent-id="${parentId}"]`)
                );
                
                if (isChecked) {
                    // Move to the end of the siblings
                    const lastSibling = siblings[siblings.length - 1];
                    lastSibling.after(listItem);
                } else {
                    // Move to the beginning of the siblings
                    const firstSibling = siblings[0];
                    firstSibling.before(listItem);
                }
            }
        } else {
            // This is a parent item - handle parent and its children together
            const itemId = listItem.getAttribute('data-item-id');
            const children = Array.from(
                this.itemsList.querySelectorAll(`li[data-parent-id="${itemId}"]`)
            );
            
            // Temporarily hide children
            children.forEach(child => child.classList.add('mcl-hidden-child'));
            
            // Move the parent item
            if (isChecked) {
                this.itemsList.appendChild(listItem);
            } else {
                this.itemsList.insertBefore(listItem, this.itemsList.firstChild);
            }
            
            // Reattach children right after their parent
            let lastInsertedElement = listItem;
            children.forEach(child => {
                child.classList.remove('mcl-hidden-child');
                lastInsertedElement.after(child);
                lastInsertedElement = child;
            });
        }
    }

    // Add new method for tracking item checks
    trackItemCheck(checklistId, itemId, isChecked) {
        // Skip tracking if missing data
        if (!checklistId || !itemId) return;
        
        // Send analytics data
        fetch(window.mcl_checklists.ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'mcl_track_item_check',
                checklist_id: checklistId,
                item_id: itemId,
                checked: isChecked
            })
        }).catch(error => {
            // Silently fail tracking - don't disrupt user experience
            console.error('Analytics tracking error:', error);
        });
    }
}

export default MagicChecklistDrawer;