// No longer importing the old drawer - React component handles everything now
// import MagicChecklistDrawer from './mcl-drawer.js';

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    // Check if element already exists
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    // Set up observer to watch for the element
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Set timeout
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

async function initializeMagicChecklist() {
  // Clean up old initialization if needed
  if (window.mcl_cleanup) {
    window.mcl_cleanup();
  }

  console.log('MCL: Starting initialization...')

  try {
    // Wait for the essential DOM elements that React provides
    console.log('MCL: Waiting for DOM elements...')
    await waitForElement('#mcl-drawer');
    await waitForElement('#mcl-items');
    console.log('MCL: DOM elements found')
    
    // Wait for React component to set up the global bridge
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds with 100ms intervals - increased from 50
    
    console.log('MCL: Waiting for mclDrawer bridge...')
    while (!window.mclDrawer && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      if (attempts % 10 === 0) {
        console.log(`MCL: Still waiting for bridge... attempt ${attempts}/${maxAttempts}`)
      }
    }
    
    if (window.mclDrawer) {
      console.log('MCL: Bridge found! Completing initialization...')
      
      // Set up global reference for compatibility
      window.MagicChecklist = window.mclDrawer;
      
      // Trigger floating button binding
      if (window.mclDrawer.bindFloatingButtons) {
        console.log('MCL: Binding floating buttons...')
        window.mclDrawer.bindFloatingButtons();
      }
      
      console.log('MCL: Initialization complete!')
      return window.mclDrawer;
    } else {
      throw new Error('React component bridge not found after waiting');
    }

  } catch (error) {
    console.warn('MagicChecklist initialization failed:', error);
    return null;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMagicChecklist);
} else {
  initializeMagicChecklist();
}

// Make the function globally available for React component
window.initializeMagicChecklist = initializeMagicChecklist;

// Export for direct usage if needed
export { initializeMagicChecklist };