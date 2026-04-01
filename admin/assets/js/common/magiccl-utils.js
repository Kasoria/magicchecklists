const PriorityUtils = {
    PRIORITY_CYCLE: ['none', 'low', 'medium', 'high', 'critical'],
    
    updatePriorityDisplay(indicator, priority, displayType) {
        if (!indicator) return;
        
        if (displayType === 'number') {
            indicator.textContent = magicclAdmin.priorityNumbers[priority];
            indicator.setAttribute('data-display', 'number');
            indicator.style.backgroundColor = '';
        } else {
            indicator.textContent = '';
            indicator.setAttribute('data-display', 'color');
            indicator.style.backgroundColor = magicclAdmin.priorityColors[priority];
        }
        indicator.setAttribute('data-priority', priority);
    },

    addPriorityChangeAnimation(element) {
        element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            element.style.removeProperty('transform');
        }, 200);
    }
};

// Form validation utilities
const ValidationUtils = {
    addShakeAnimation(element) {
        element.classList.add('magiccl-shake');
        setTimeout(() => element.classList.remove('magiccl-shake'), 820);
    },

    showError(errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            this.addShakeAnimation(errorElement);
        }
    },

    hideError(errorElement) {
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
};

// AJAX utilities
const AjaxUtils = {
    async postData(action, data) {
        const formData = new FormData();
        formData.append('action', action);
        
        // Append nonce if provided in data or get from magicclAdmin.nonces
        let nonce = data._ajax_nonce || (magicclAdmin.nonces && magicclAdmin.nonces[action]);
        if (!nonce) {
            console.error(`No nonce found for action: ${action}`);
            throw new Error('Missing nonce');
        }
        
        formData.append('_ajax_nonce', nonce);
        
        // Append all data except _ajax_nonce which we've already handled
        for (const [key, value] of Object.entries(data)) {
            if (key !== '_ajax_nonce') {
                formData.append(key, value);
            }
        }

        try {
            const response = await fetch(magicclAdmin.ajaxurl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('AJAX Error:', error);
            throw error;
        }
    }
};

// Single export statement for all utilities
export { PriorityUtils, ValidationUtils, AjaxUtils };