export class PriorityManager {
    constructor(drawer) {
        this.drawer = drawer;
        this.priorityCycle = ['none', 'low', 'medium', 'high', 'critical'];
        this.priorityNumbers = window.mcl_checklists.priority_numbers;
        this.priorityColors = window.mcl_checklists.priority_colors;
        this.PRIORITY_STORAGE_KEY = 'mcl_priority_state_';
    }

  init() {
      // Any initial setup needed for priorities
  }

  cyclePriority(indicator) {
    // Check rate limit first
    if (!this.drawer.checkActionRateLimit()) {
        return;
    }

    const currentPriority = indicator.getAttribute('data-priority');
    const currentIndex = this.priorityCycle.indexOf(currentPriority);
    const nextIndex = (currentIndex + 1) % this.priorityCycle.length;
    const nextPriority = this.priorityCycle[nextIndex];
    const displayType = indicator.getAttribute('data-display');

    this.updatePriorityDisplay(indicator, nextPriority, displayType);
    
    // Add animation class
    indicator.classList.add('mcl-priority-changed');
    setTimeout(() => {
        indicator.classList.remove('mcl-priority-changed');
    }, 300);

    // Save the priority state
    this.savePriorityState(indicator);
  }

  savePriorityState(indicator) {
    const checklistData = this.drawer.currentChecklistData;
    const checklistId = this.drawer.currentChecklistId;
    
    if (!checklistId || !checklistData) return;

    const listItem = indicator.closest('li');
    if (!listItem) return;

    const itemId = listItem.getAttribute('data-item-id');
    const priority = indicator.getAttribute('data-priority');

    // For administrators or global state handling, save to server
    if (this.drawer.isAdministrator() || checklistData.checked_state_handling === 'global') {
        this.drawer.saveChecklistData();
        return;
    }

    // For per-user handling, save to localStorage
    const storageKey = `${this.PRIORITY_STORAGE_KEY}${checklistId}`;
    try {
        const currentPriorities = this.getStoredPriorities(checklistId);
        currentPriorities[itemId] = priority;
        localStorage.setItem(storageKey, JSON.stringify(currentPriorities));
    } catch (error) {
        console.error('Error saving priority state:', error);
    }
  }

  getStoredPriorities(checklistId) {
    const storageKey = `${this.PRIORITY_STORAGE_KEY}${checklistId}`;
    try {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Error reading priority state:', error);
        return {};
    }
  }

  updatePriorityDisplay(indicator, priority, displayType) {
    if (displayType === 'number') {
        indicator.textContent = this.priorityNumbers[priority];
        indicator.setAttribute('data-display', 'number');
        indicator.style.backgroundColor = '';
    } else {
        indicator.textContent = '';
        indicator.setAttribute('data-display', 'color');
        indicator.style.backgroundColor = this.priorityColors[priority];
    }
    
    indicator.setAttribute('data-priority', priority);
  }

  getPriorityValue(priority) {
    return this.priorityNumbers[priority] || 0;
  }

  createPriorityIndicator(priority = 'none', displayType = 'color', itemId = null) {
    const checklistData = this.drawer.currentChecklistData;
    
    // If using per-user handling and not an admin, check localStorage
    if (checklistData?.checked_state_handling === 'per_user' && !this.drawer.isAdministrator() && itemId) {
        const storedPriorities = this.getStoredPriorities(this.drawer.currentChecklistId);
        priority = storedPriorities[itemId] || priority;
    }

    const indicator = document.createElement('span');
    indicator.className = 'mcl-item-priority';
    this.updatePriorityDisplay(indicator, priority, displayType);
    return indicator;
  }
}