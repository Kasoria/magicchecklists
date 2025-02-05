window.MCL = window.MCL || {};

window.MCL.WindowChecker = class {
    static #initialized = false;

    static isBricksEditor() {
        try {
            return window.location.href.includes('bricks=run') || 
                   document.body.classList.contains('bricks-edit-mode');
        } catch (e) {
            return false;
        }
    }

    static isBricksIframe() {
        try {
            return window !== window.top && this.isBricksEditor();
        } catch (e) {
            return false;
        }
    }

    static isMainWindow() {
        try {
            return window === window.top;
        } catch (e) {
            return true;
        }
    }

    static shouldLoadAssets() {
        // If we're in a Bricks iframe, don't load assets
        if (this.isBricksIframe()) {
            return false;
        }

        // If we're already initialized, don't load again
        if (this.#initialized) {
            return false;
        }

        // If we're in main window or any other context, load assets
        this.#initialized = true;
        return true;
    }

    static setupBricksHandler() {
        // Only handle keyboard events in Bricks iframe
        if (!this.isBricksIframe()) {
            return;
        }

        document.addEventListener('keydown', (e) => {
            const eventData = {
                type: 'mcl-bricks-keydown',
                key: e.key,
                code: e.code,
                keyCode: e.keyCode,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                shiftKey: e.shiftKey,
                metaKey: e.metaKey
            };

            window.top.postMessage(eventData, window.location.origin);
        }, true);
    }

    static init() {
        // Early return if we shouldn't load assets
        if (!this.shouldLoadAssets()) {
            if (this.isBricksIframe()) {
                this.setupBricksHandler();
            }
            return false;
        }

        // Set up event listener for Bricks iframe messages
        if (this.isMainWindow() && this.isBricksEditor()) {
            window.addEventListener('message', (event) => {
                if (event.origin !== window.location.origin) return;

                if (event.data.type === 'mcl-bricks-keydown') {
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

                    document.dispatchEvent(simulatedEvent);
                }
            });
        }

        return true;
    }
}

if (!window.MCL.WindowChecker.init()) {
    window.MCL.preventInit = true;
}