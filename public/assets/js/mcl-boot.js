import { MCLWindowChecker } from './modules/mcl-window-checker.js';
import MagicChecklistDrawer from './mcl-drawer.js';

function initializeMagicChecklist() {
  // Only proceed if we should initialize in this context
  if (!MCLWindowChecker.shouldInitialize()) {
    return;
  }

  // Clean up old initialization if needed
  if (window.mcl_cleanup) {
    window.mcl_cleanup();
  }

  // Initialize new instance
  if (!window.MagicChecklist) {
    window.MagicChecklist = new MagicChecklistDrawer();
  }
  
  // Share initialization with parent window if in Bricks Builder iframe
  if (window !== window.top && window.location.href.includes('bricks=run')) {
    try {
      window.top.MagicChecklist = window.MagicChecklist;
    } catch (e) {
      console.warn('MagicChecklist: Unable to share initialization with parent window:', e);
    }
  }

  return window.MagicChecklist;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMagicChecklist);
} else {
  initializeMagicChecklist();
}

// Export for direct usage if needed
export { initializeMagicChecklist };