// src/common/domHelpers.js

(function() {
  'use strict';

  // Ensure the global namespace object exists
  window.VH = window.VH || {};
  const { CONFIG } = VH;

  /**
   * DOM-related helper functions for booking tables and iframes
   */
  VH.dom = {
    /**
     * Returns the booking iframe’s document.
     * Assumes only one relevant dialog is open and visible.
     * @throws if dialog or iframe isn’t found or accessible.
     */
    getBookingDocument() {
      const dialog = document.querySelector("div.ui-dialog[style*='display: block;']");
      if (!dialog) throw new Error("Booking dialog not found");
      const iframe = dialog.querySelector("iframe");
      if (!iframe) throw new Error("Booking iframe not found");
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (!doc) throw new Error("Iframe document inaccessible");
        return doc;
      } catch (e) {
        throw new Error(`Error accessing iframe content: ${e.message}`);
      }
    },

    /**
     * Sets the value of an element and dispatches a change event.
     * @param {Document} doc
     * @param {string} id - element’s ID
     * @param {string} value
     * @returns {boolean} true if element was found and set
     */
    setFieldValue(doc, id, value = "") {
      const el = doc.getElementById(id);
      if (!el) return false;
      el.value = value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    },

    /**
     * Returns all table rows matching a selector (default: booked-items rows).
     * Filters out the header row (tr_0).
     * @param {Document} doc
     * @param {string} selector – CSS selector for rows
     * @returns {HTMLElement[]} array of <tr> elements
     */
    getTableRows(doc, selector = "#table_bookeditems tr[id^='tr_']") {
      return Array.from(doc.querySelectorAll(selector))
                  .filter(row => row.id !== "tr_0"); // Exclude header row
    },

    /**
     * Waits until a new row appears in the table compared to a previous list of IDs.
     * @param {string[]} oldIds - list of row IDs before adding
     * @param {string} selector - same selector passed to getTableRows
     * @returns {Promise<{doc: Document, newRowId: string}>} The updated document and the ID of the new row.
     * @throws on timeout
     */
    async waitForNewRow(oldIds, selector) {
      const start = Date.now();
      const pollInterval = CONFIG.delays.pollInterval;
      const maxWait     = CONFIG.delays.maxWaitTime;

      while (Date.now() - start < maxWait) {
        let doc;
        try {
          doc = this.getBookingDocument();
        } catch {
          // Dialog/iframe might not be ready yet, wait and retry
          await new Promise(r => setTimeout(r, pollInterval));
          continue;
        }

        const currentIds = this.getTableRows(doc, selector)
                               .map(r => r.id);
        const newId = currentIds.find(id => !oldIds.includes(id));
        if (newId) {
          return { doc, newRowId: newId };
        }

        await new Promise(r => setTimeout(r, pollInterval));
      }

      throw new Error("Timed out waiting for new row");
    }
  };

})();
