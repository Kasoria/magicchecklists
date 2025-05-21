class MCLShortcodeHandler {
    constructor(container) {
        this.container = container;
        this.checklistId = container.dataset.checklistId;
        this.instanceId = container.dataset.instanceId;
        this.stateHandling = container.dataset.checkState;
        this.priorityDisplayType = container.dataset.priorityDisplayType || 'color';
        this.items = container.querySelector('.mcl-shortcode-items');
        this.checkedItems = new Set();
        this.countdownInterval = null;
        this.itemOrder = [];

        // Initialize
        this.init();
    }

    init() {
        // Load initial state and order
        this.loadCheckedState();
        this.loadItemOrder();

        // Bind events
        this.bindEvents();

        // Initialize sortable if enabled
        if (this.container.querySelector('.mcl-item-drag-handle')) {
            this.initSortable();
        }

        // Initialize countdown if present
        this.initCountdown();
    }

    bindEvents() {
        // Handle checkbox changes
        this.items.addEventListener('change', (e) => {
            if (e.target.matches('.mcl-item-checkbox')) {
                this.handleCheckboxChange(e);
            }
        });
    }

    handleCheckboxChange(e) {
        const checkbox = e.target;
        const listItem = checkbox.closest('.mcl-shortcode-item');
        const itemId = listItem.dataset.itemId;

        // Debounce to prevent rapid toggling
        if (listItem.dataset.processing) {
            e.preventDefault();
            return;
        }

        listItem.dataset.processing = 'true';
        setTimeout(() => {
            delete listItem.dataset.processing;
        }, 200);

        if (checkbox.checked) {
            this.checkedItems.add(itemId);
            listItem.classList.add('mcl-shortcode-checked');
        } else {
            this.checkedItems.delete(itemId);
            listItem.classList.remove('mcl-shortcode-checked');
        }

        this.saveCheckedState();
    }

    getStorageKey(type = 'checked') {
        return `mcl_shortcode_${this.checklistId}_${this.instanceId}_${type}`;
    }

    loadCheckedState() {
        switch (this.stateHandling) {
            case 'session':
            case 'local':
                // Always use localStorage for logged-out users
                this.loadFromLocalStorage();
                break;
            case 'global':
                // Global state is loaded from PHP rendering
                this.checkedItems = new Set(
                    Array.from(this.items.querySelectorAll(':checked'))
                        .map(cb => cb.closest('.mcl-shortcode-item').dataset.itemId)
                );
                break;
        }

        // Update UI to reflect loaded state
        this.updateCheckboxes();
    }

    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem(this.getStorageKey('checked'));
            if (stored) {
                this.checkedItems = new Set(JSON.parse(stored));
            }
        } catch (error) {
            console.warn('Error loading from local storage:', error);
        }
    }

    loadItemOrder() {
        // Load item order based on storage type
        if (this.stateHandling === 'global') {
            this.itemOrder = Array.from(this.items.querySelectorAll('.mcl-shortcode-item'))
                .map(item => item.dataset.itemId);
        } else {
            try {
                const stored = localStorage.getItem(this.getStorageKey('order'));
                if (stored) {
                    this.itemOrder = JSON.parse(stored);
                    this.applyStoredOrder();
                } else {
                    // Initialize order if not stored
                    this.itemOrder = Array.from(this.items.querySelectorAll('.mcl-shortcode-item'))
                        .map(item => item.dataset.itemId);
                }
            } catch (error) {
                console.warn('Error loading item order from storage:', error);
            }
        }
    }

    applyStoredOrder() {
        const itemsMap = new Map();
        this.items.querySelectorAll('.mcl-shortcode-item').forEach(item => {
            itemsMap.set(item.dataset.itemId, item);
        });

        // Reorder items according to stored order
        this.itemOrder.forEach(itemId => {
            const item = itemsMap.get(itemId);
            if (item) {
                this.items.appendChild(item);
            }
        });

        this.updateItemNumbers();
    }

    async saveCheckedState() {
        const checkedArray = Array.from(this.checkedItems);

        switch (this.stateHandling) {
            case 'session':
            case 'local':
                try {
                    localStorage.setItem(
                        this.getStorageKey('checked'),
                        JSON.stringify(checkedArray)
                    );
                } catch (error) {
                    console.warn('Error saving to local storage:', error);
                }
                break;

            case 'global':
                await this.saveToServer(checkedArray);
                break;
        }
    }

    async saveToServer(checkedItems) {
        try {
            const formData = new FormData();
            formData.append('action', 'mcl_save_checked_state');
            formData.append('nonce', mclShortcode.nonce);
            formData.append('checklist_id', this.checklistId);
            formData.append('context', 'shortcode');
            formData.append('item_order', JSON.stringify(this.itemOrder));
            checkedItems.forEach(id => formData.append('checked_items[]', id));

            const response = await fetch(mclShortcode.ajaxurl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            const data = await response.json();
            if (!data.success) {
                console.warn('Error saving state to server:', data);
            }
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    updateCheckboxes() {
        this.items.querySelectorAll('.mcl-shortcode-item').forEach(item => {
            const checkbox = item.querySelector('.mcl-item-checkbox');
            const itemId = item.dataset.itemId;

            checkbox.checked = this.checkedItems.has(itemId);
            item.classList.toggle('mcl-shortcode-checked', checkbox.checked);
        });
    }

    initSortable() {
        if (typeof Sortable === 'undefined') {
            console.warn('Sortable.js is required for reordering functionality');
            return;
        }

        new Sortable(this.items, {
            handle: '.mcl-item-drag-handle',
            animation: 150,
            ghostClass: 'mcl-shortcode-ghost',
            dragClass: 'mcl-shortcode-drag',
            onEnd: (evt) => {
                // Update item order
                this.itemOrder = Array.from(this.items.querySelectorAll('.mcl-shortcode-item'))
                    .map(item => item.dataset.itemId);
                
                // Save the new order
                if (this.stateHandling === 'global') {
                    this.saveToServer(Array.from(this.checkedItems));
                } else {
                    try {
                        localStorage.setItem(
                            this.getStorageKey('order'),
                            JSON.stringify(this.itemOrder)
                        );
                    } catch (error) {
                        console.warn('Error saving order to local storage:', error);
                    }
                }

                // Update item numbers if enabled
                this.updateItemNumbers();
            }
        });
    }

    updateItemNumbers() {
        const numberElements = this.items.querySelectorAll('.mcl-item-number');
        if (numberElements.length) {
            numberElements.forEach((el, index) => {
                el.textContent = `${index + 1}.`;
            });
        }
    }

    initCountdown() {
        const countdown = this.container.querySelector('.mcl-countdown');
        if (!countdown || !countdown.dataset.deadline) return;

        const deadline = parseInt(countdown.dataset.deadline) * 1000; // Convert to milliseconds
        
        const updateCountdown = () => {
            const now = Date.now();
            const remaining = deadline - now;

            if (remaining <= 0) {
                countdown.textContent = 'Expired';
                countdown.classList.add('mcl-expired');
                clearInterval(this.countdownInterval);
                return;
            }

            // Calculate time units
            const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

            // Format the countdown text
            let text = '';
            if (days > 0) {
                text += `${days}d `;
            }
            if (hours > 0 || days > 0) {
                text += `${hours}h `;
            }
            text += `${minutes}m`;

            countdown.textContent = text;

            // Add warning classes
            countdown.classList.remove('mcl-warning', 'mcl-urgent');
            if (remaining <= 2 * 60 * 60 * 1000) { // 2 hours
                countdown.classList.add('mcl-urgent');
            } else if (remaining <= 24 * 60 * 60 * 1000) { // 24 hours
                countdown.classList.add('mcl-warning');
            }
        };

        // Update immediately and then every minute
        updateCountdown();
        this.countdownInterval = setInterval(updateCountdown, 60000);
    }

    destroy() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }
}

// Initialize all shortcode instances on the page
document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.mcl-shortcode-container');
    containers.forEach(container => {
        new MCLShortcodeHandler(container);
    });
});