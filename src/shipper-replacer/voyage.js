// src/shipper-replacer/voyage.js

(function() {
  'use strict';

  // Ensure the global namespace object exists
  window.VH = window.VH || {};

  const { SHIPPER_CONFIG, CONFIG, notifications, dom, iframes } = VH;
  const { selectors }    = SHIPPER_CONFIG;
  const { show }         = notifications;
  const { getBookingDocument } = dom;
  const { waitForIframeCount, waitForReadyIframe } = iframes;

  /**
   * Handles voyage selection logic within the booking process.
   */
  VH.voyage = {
    /**
     * Returns the Document of the second iframe inside any currently open dialog.
     * @throws if fewer than two dialog iframes are present or accessible.
     */
    getVoyageDocument() {
      const dialogs     = document.querySelectorAll("div.ui-dialog[style*='display: block;']");
      const allIframes  = Array.from(dialogs).flatMap(d => Array.from(d.querySelectorAll("iframe")));
      if (allIframes.length < 2) {
        throw new Error("Voyage iframe not found (need at least two active iframes)");
      }
      const iframe = allIframes[1];
      try {
        return iframe.contentDocument || iframe.contentWindow.document;
      } catch (e) {
        throw new Error(`Error accessing voyage iframe: ${e.message}`);
      }
    },

    /**
     * Clicks the FindVoyage button, waits for the voyage dialog iframes,
     * and selects the correct voyage (TBN or by matching text).
     *
     * @param {Object}  data.voyage.hidden  The voyage ID to select
     * @returns {Promise<boolean>}  true on success, false on failure
     */
    async handleVoyageSelection(data) {
      const voyageValue = data.voyage.hidden;
      const maxRetries  = 3;
      const waitTime    = 2000; // Consider moving to CONFIG.delays if used elsewhere
      let attempt       = 0;

      while (attempt < maxRetries) {
        attempt++;
        try {
          // click the FindVoyage button in the booking doc
          const bookingDoc = getBookingDocument();
          const btn = bookingDoc.getElementById(selectors.voyageSelection.findVoyageButton);
          if (!btn) throw new Error("FindVoyage button not found");
          btn.click();
          show("Opening voyage selection…", "warning");

          // wait for two iframes to load
          await waitForIframeCount(2, CONFIG.delays.maxWaitTime);

          // wait until the second iframe has its submit button or table
          await waitForReadyIframe(1, "input[type='submit']", CONFIG.delays.maxWaitTime);

          // get the voyage iframe document
          const voyageDoc = this.getVoyageDocument();

          // handle TBN specially
          if (voyageValue === "TBN0125") { // Consider making "TBN0125" a constant
            const tbnBtn = voyageDoc.getElementById(selectors.voyageSelection.tbnVoyageButton);
            if (!tbnBtn) throw new Error("TBN voyage button not found");
            tbnBtn.click();
            show("TBN voyage selected", "success");
          } else {
            // find the table cell matching the voyageValue
            const cells = Array.from(voyageDoc.querySelectorAll("td"));
            const cell  = cells.find(td => td.textContent.trim() === voyageValue);
            if (!cell) throw new Error(`Voyage ${voyageValue} not found`);
            // click the submit button in that row
            const row    = cell.closest("tr");
            const submit = row.querySelector("input[type='submit']");
            if (!submit) throw new Error(`Submit button for voyage ${voyageValue} not found`);
            submit.click();
            show(`Voyage ${voyageValue} selected`, "success");
          }

          // small delay to allow selection to apply
          await new Promise(r => setTimeout(r, waitTime));
          return true;
        } catch (err) {
          console.error(`Voyage selection attempt ${attempt} failed:`, err);
          show(`Voyage selection failed (attempt ${attempt})`, "error");
          if (attempt < maxRetries) {
            // close any open dialog
            Array.from(document.querySelectorAll("button[title='close']"))
                 .pop()
                 ?.click();
            await new Promise(r => setTimeout(r, waitTime));
          } else {
            show(`Giving up after ${maxRetries} attempts`, "error");
            return false;
          }
        }
      }
    }
  };

})();
