export class MCLRateLimiter {
  constructor() {
      // Fixed limits
      this.DRAWER_MAX_OPERATIONS = 5;
      this.ACTION_MAX_OPERATIONS = 15;
      this.TIMEOUT_DURATION = 30000;
      
      // Storage keys
      this.DRAWER_STORAGE_KEY = 'mcl_drawer_limit';
      this.ACTION_STORAGE_KEY = 'mcl_action_limit';
      
      // Initialize storage if needed
      this.initializeStorage();
  }

  initializeStorage() {
      const defaultState = {
          count: 0,
          lastReset: Date.now()
      };

      // Initialize drawer limits if not exists
      if (!localStorage.getItem(this.DRAWER_STORAGE_KEY)) {
          localStorage.setItem(this.DRAWER_STORAGE_KEY, JSON.stringify(defaultState));
      }

      // Initialize action limits if not exists
      if (!localStorage.getItem(this.ACTION_STORAGE_KEY)) {
          localStorage.setItem(this.ACTION_STORAGE_KEY, JSON.stringify(defaultState));
      }
  }

  canPerformDrawerOperation() {
      // Skip check for admin users
      if (window.mcl_checklists?.user_access?.is_admin) {
          return { allowed: true };
      }

      return this.checkLimit(this.DRAWER_STORAGE_KEY, this.DRAWER_MAX_OPERATIONS);
  }

  canPerformAction() {
      // Skip check for admin users
      if (window.mcl_checklists?.user_access?.is_admin) {
          return { allowed: true };
      }

      return this.checkLimit(this.ACTION_STORAGE_KEY, this.ACTION_MAX_OPERATIONS);
  }

  checkLimit(storageKey, maxOperations) {
      const state = this.getState(storageKey);
      const now = Date.now();
      
      // Check if we should reset the counter
      if (now - state.lastReset >= this.TIMEOUT_DURATION) {
          this.resetLimit(storageKey);
          return { allowed: true };
      }

      // Check if we've hit the limit
      if (state.count >= maxOperations) {
          const remainingTime = this.TIMEOUT_DURATION - (now - state.lastReset);
          return {
              allowed: false,
              remainingTime: this.formatRemainingTime(remainingTime)
          };
      }

      // Increment counter and save
      state.count++;
      localStorage.setItem(storageKey, JSON.stringify(state));
      return { allowed: true };
  }

  resetLimit(storageKey) {
      const resetState = {
          count: 1, // Start at 1 since we're performing an action
          lastReset: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(resetState));
  }

  getState(storageKey) {
      try {
          return JSON.parse(localStorage.getItem(storageKey)) || {
              count: 0,
              lastReset: Date.now()
          };
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

  // Helper method to clear all limits (useful for testing)
  clearLimits() {
      localStorage.removeItem(this.DRAWER_STORAGE_KEY);
      localStorage.removeItem(this.ACTION_STORAGE_KEY);
      this.initializeStorage();
  }
}