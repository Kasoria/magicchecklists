import MagicChecklistDrawer from './mcl-drawer.js';

function initializeMagicChecklist() {
  // Clean up old initialization if needed
  if (window.mcl_cleanup) {
    window.mcl_cleanup();
  }

  // Initialize new instance
  if (!window.MagicChecklist) {
    window.MagicChecklist = new MagicChecklistDrawer();
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