// src/shipper-replacer/clipboard.js

(function() {
  'use strict';

  // Ensure the global namespace object exists
  window.VH = window.VH || {};
  const { notifications } = VH;

  /**
   * Clipboard utilities for the Shipper Data Replacer script
   */
  VH.clipboard = {
    /**
     * Reads shipping data JSON from the clipboard, validates its structure,
     * and returns the parsed object or null on failure.
     *
     * @returns {Promise<Object|null>}
     */
    async getShippingDataFromClipboard() {
      let clipboardText = "";

      // Try the modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.readText) {
        try {
          clipboardText = await navigator.clipboard.readText();
          console.log("Clipboard content read via Clipboard API");
        } catch (err) {
          console.warn("Clipboard API failed, falling back:", err);
          clipboardText = await this.getClipboardContentFallback();
        }
      } else {
        // Fallback for older browsers
        console.log("Clipboard API not available, using fallback");
        clipboardText = await this.getClipboardContentFallback();
      }

      if (!clipboardText || !clipboardText.trim()) {
        notifications.show("Clipboard is empty", "error");
        console.error("Clipboard is empty");
        return null;
      }

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(clipboardText);
      } catch (parseErr) {
        notifications.show("Clipboard content is not valid JSON", "error");
        console.error("JSON parse error:", parseErr);
        return null;
      }

      // Validate structure
      if (!this.validateShippingDataStructure(data)) {
        notifications.show(
          "Clipboard contains invalid shipping data structure",
          "error"
        );
        console.error("Invalid shipping data structure", data);
        return null;
      }

      console.log("Successfully loaded shipping data from clipboard", data);
      notifications.show("Shipping data loaded from clipboard", "success", 2000);
      return data;
    },

    /**
     * Fallback method to read clipboard text via execCommand('paste').
     *
     * @returns {Promise<string>}
     */
    async getClipboardContentFallback() {
      return new Promise((resolve) => {
        const textarea = document.createElement("textarea");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();

        // Attempt to paste
        const successful = document.execCommand("paste");
        const text = textarea.value;
        document.body.removeChild(textarea);

        if (!successful) {
          console.error("execCommand('paste') failed");
        }
        resolve(text || "");
      });
    },

    /**
     * Validates that the shipping data object has the expected properties.
     *
     * @param {Object} data
     * @returns {boolean}
     */
    validateShippingDataStructure(data) {
      if (!data || typeof data !== "object") return false;

      // Top-level required properties
      const requiredProps = [
        "shipper",
        "consignee",
        "notify",
        "forwarderRef",
        "customsCode",
        "transitTo",
        "voyage",
        "portOfLoading",
        "portOfDischarge",
        "allUnitsInOneBooking"
      ];
      for (const prop of requiredProps) {
        if (!(prop in data)) {
          console.error(`Missing required property: ${prop}`);
          return false;
        }
      }

      // Each party must have hiddenFields object
      for (const party of ["shipper", "consignee", "notify"]) {
        if (
          !data[party] ||
          typeof data[party] !== "object" ||
          !data[party].hiddenFields ||
          typeof data[party].hiddenFields !== "object"
        ) {
          console.error(`Invalid or missing hiddenFields for: ${party}`);
          return false;
        }
      }

      // customsCode, transitTo, voyage must each have a 'hidden' property
      for (const field of ["customsCode", "transitTo", "voyage"]) {
        if (
          !data[field] ||
          typeof data[field] !== "object" ||
          !("hidden" in data[field])
        ) {
          console.error(`Invalid structure for: ${field}`);
          return false;
        }
      }

      // portOfLoading and portOfDischarge each need 'text' and 'hidden'
      for (const port of ["portOfLoading", "portOfDischarge"]) {
        if (
          !data[port] ||
          typeof data[port] !== "object" ||
          !("text" in data[port]) ||
          !("hidden" in data[port])
        ) {
          console.error(`Invalid structure for: ${port}`);
          return false;
        }
      }

      return true;
    }
  };

})();
