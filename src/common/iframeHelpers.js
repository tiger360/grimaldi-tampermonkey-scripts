// src/common/iframeHelpers.js

// Ensure the global namespace object exists
window.VH = window.VH || {};
const { CONFIG } = VH;

/**
 * Helpers for waiting on and inspecting iframes inside Grimaldi dialogs
 */
VH.iframes = {
  /**
   * Wait until exactly `count` dialog iframes are fully loaded (readyState === "complete").
   * @param {number} count
   * @param {number} [maxWaitTime=10000] ms
   * @param {number} [checkInterval=200] ms
   * @returns {Promise<Array<{ iframe: HTMLIFrameElement, document: Document, dialogId: string|null }>>}
   */
  waitForIframeCount(count, maxWaitTime = 10000, checkInterval = 200) {
    return new Promise((resolve, reject) => {
      const start = Date.now();

      const check = () => {
        const dialogs = document.querySelectorAll(
          "div.ui-dialog[style*='display: block;']"
        );
        const loaded = [];

        dialogs.forEach((dialog) => {
          const iframe = dialog.querySelector("iframe");
          if (!iframe) return;
          try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            if (doc && doc.readyState === "complete") {
              loaded.push({
                iframe,
                document: doc,
                dialogId: dialog.getAttribute("aria-labelledby") || null
              });
            }
          } catch (e) {
            // Access denied or not yet ready, ignore
          }
        });

        if (loaded.length === count) {
          resolve(loaded);
        } else if (Date.now() - start < maxWaitTime) {
          setTimeout(check, checkInterval);
        } else {
          reject(
            new Error(
              `Timeout waiting for ${count} iframe(s): only ${loaded.length} loaded`
            )
          );
        }
      };

      check();
    });
  },

  /**
   * Wait until the iframe at the given index is loaded and contains the given selector(s).
   * @param {number} iframeIndex - zero-based index
   * @param {string|string[]} selectors - CSS selector or array of selectors to wait for
   * @param {number} [maxWaitTime=15000] ms
   * @returns {Promise<{ elements: HTMLElement[], document: Document }>}
   */
  async waitForReadyIframe(iframeIndex = 0, selectors = [], maxWaitTime = 15000) {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
    // First ensure the iframe exists and is fully loaded
    const frames = await this.waitForIframeCount(
      iframeIndex + 1,
      maxWaitTime,
      CONFIG.delays.pollInterval
    );
    const { iframe, document: doc } = frames[iframeIndex];

    const foundElements = [];
    const start = Date.now();

    for (const sel of selectorArray) {
      let el = null;
      while (Date.now() - start < maxWaitTime) {
        try {
          el = doc.querySelector(sel);
        } catch {
          el = null;
        }
        if (el) {
          foundElements.push(el);
          break;
        }
        // wait a bit and retry
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, CONFIG.delays.pollInterval));
      }
      if (!el) {
        throw new Error(`Selector "${sel}" not found in iframe #${iframeIndex}`);
      }
    }

    return { elements: foundElements, document: doc };
  },

  /**
   * Wait for a single dialog iframe to go through loading => complete.
   * Resolves when readyState === "complete".
   * @param {number} [maxWaitTime=15000] ms
   * @returns {Promise<{ iframe: HTMLIFrameElement, document: Document }>}
   */
  async waitForSingleIframeFullCycle(maxWaitTime = 15000) {
    // Wait for exactly 1 iframe loaded
    const [frame] = await this.waitForIframeCount(
      1,
      maxWaitTime,
      CONFIG.delays.pollInterval
    );
    const { iframe } = frame;
    const start = Date.now();

    while (Date.now() - start < maxWaitTime) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc && doc.readyState === "complete") {
          return { iframe, document: doc };
        }
      } catch {
        // might not be accessible yet
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, CONFIG.delays.pollInterval));
    }

    throw new Error("Timeout waiting for iframe full load cycle");
  }
};
