export class MCLWindowChecker {
  static #initialized = false;
  static #mainWindowInstance = null;
  
  static isMainWindow() {
    try {
      return window === window.top;
    } catch (e) {
      console.warn('MagicChecklist: Unable to determine window context:', e);
      return true;
    }
  }

  static registerMainInstance(instance) {
    if (this.isMainWindow()) {
      this.#mainWindowInstance = instance;
      this.setupIframeEventListeners();
    }
  }

  static setupIframeEventListeners() {
    // Listen for messages from iframes
    window.addEventListener('message', (event) => {
      // Verify message origin for security
      if (!this.isValidOrigin(event.origin)) {
        return;
      }

      // Handle keyboard events from iframes
      if (event.data.type === 'mcl-keydown') {
        // Recreate the keyboard event
        const simulatedEvent = new KeyboardEvent('keydown', {
          key: event.data.key,
          code: event.data.code,
          keyCode: event.data.keyCode,
          ctrlKey: event.data.ctrlKey,
          altKey: event.data.altKey,
          shiftKey: event.data.shiftKey,
          metaKey: event.data.metaKey,
          bubbles: true,
          cancelable: true
        });

        // Dispatch the event on the main window
        if (this.#mainWindowInstance) {
          this.#mainWindowInstance.handleKeyboardShortcut(simulatedEvent);
        }
      }
    });
  }

  static isValidOrigin(origin) {
    try {
      // Get the WordPress site URL from window location
      const siteUrl = new URL(window.location.href).origin;
      return origin === siteUrl;
    } catch (e) {
      console.warn('MagicChecklist: Invalid origin:', e);
      return false;
    }
  }

  static setupIframeKeyboardHandler() {
    if (!this.isMainWindow()) {
      // Add keyboard event listener in iframe
      document.addEventListener('keydown', (e) => {
        // Create a serializable version of the keyboard event
        const eventData = {
          type: 'mcl-keydown',
          key: e.key,
          code: e.code,
          keyCode: e.keyCode,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
          metaKey: e.metaKey
        };

        // Send to parent window
        window.top.postMessage(eventData, window.location.origin);
      }, true); // Use capture phase to catch events early
    }
  }

  static shouldInitialize() {
    if (this.#initialized) {
      return false;
    }

    const shouldInit = this.isMainWindow();
    if (shouldInit) {
      this.#initialized = true;
    } else {
      // If this is an iframe, set up keyboard handling
      this.setupIframeKeyboardHandler();
    }
    return shouldInit;
  }

  static isIframe() {
    return window !== window.top;
  }

  static isBricksIframe() {
    return this.isIframe() && window.location.href.includes('bricks=run');
  }

  static cleanup() {
    this.#initialized = false;
    this.#mainWindowInstance = null;
  }
}