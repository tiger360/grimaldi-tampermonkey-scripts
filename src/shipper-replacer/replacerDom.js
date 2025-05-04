// src/shipper-replacer/replacerDom.js

(function() {
  'use strict';

  // Ensure the global namespace object exists
  window.VH = window.VH || {};

  const { SHIPPER_CONFIG, CONFIG, notifications, dom, iframes, voyage } = VH;
  const { selectors } = SHIPPER_CONFIG;
  const { show, sendNtfy } = notifications;
  const { getBookingDocument, setFieldValue } = dom;
  const { waitForSingleIframeFullCycle, waitForReadyIframe } = iframes;
  const { handleVoyageSelection } = voyage;

  /**
   * DOM-centric operations for the Shipper Data Replacer script
   */
  VH.replacerDom = {
    /**
     * Build the user-facing TextBox values from hiddenFields.
     * Returns a deep clone of `data` with `.textValue` on shipper/consignee/notify.
     * @param {Object} data
     * @returns {Object}
     */
    generateTextBoxValues(data) {
      const d = JSON.parse(JSON.stringify(data)); // Deep clone

      // Helper to concat non-empty values
      const concat = (obj, keys) =>
        keys
          .map(k => obj.hiddenFields[k])
          .filter(v => v && v.trim())
          .join(" ");

      // Shipper TextBox
      d.shipper.textValue = concat(d.shipper, [
        "HiddenField_Shipper_Line1",
        "HiddenField_Shipper_HouseNo",
        "HiddenField_Shipper_Street",
        "HiddenField_Shipper_Line3",
        "HiddenField_Shipper_City",
        "HiddenField_Shipper_Country",
        "HiddenField_Shipper_CountryText"
      ]);

      // Consignee TextBox
      d.consignee.textValue = concat(d.consignee, [
        "HiddenField_Consignee_Line1",
        "HiddenField_Consignee_City",
        "HiddenField_Consignee_Country",
        "HiddenField_Consignee_CountryText"
      ]);

      // Notify TextBox
      d.notify.textValue = concat(d.notify, [
        "HiddenField_Notify_Line1",
        "HiddenField_Notify_City",
        "HiddenField_Notify_Country",
        "HiddenField_Notify_CountryText"
      ]);

      return d;
    },

    /**
     * Verify that all required fields exist in the booking form.
     * @param {Document} doc
     * @returns {string[]} array of missing field IDs
     */
    _verifyRequiredFields(doc) {
      const missing = [];
      Object.values(selectors.requiredFields).forEach(ids => {
        ids.forEach(id => {
          if (!doc.getElementById(id)) missing.push(id);
        });
      });
      return missing;
    },

    /**
     * Fill the booking form with shippingData, then perform voyage selection.
     * @param {Object} data  Parsed & text-augmented shipping data
     * @returns {Promise<boolean>} true on success
     */
    async fillBookingData(data) {
      try {
        // 1. get the booking iframe document
        let doc = getBookingDocument();

        // 2. verify required fields
        const missing = this._verifyRequiredFields(doc);
        if (missing.length) {
          const msg = `Missing form fields: ${missing.join(", ")}`;
          show("Error: missing form fields; see console for details", "error");
          console.error(msg);
          sendNtfy(msg, "high", data);
          return false;
        }

        // 3. fill Shipper
        setFieldValue(doc, "TextBox_Shipper", data.shipper.textValue);
        Object.entries(data.shipper.hiddenFields).forEach(([id, val]) => {
          setFieldValue(doc, id, val);
        });

        // 4. fill Consignee
        setFieldValue(doc, "TextBox_Consignee", data.consignee.textValue);
        Object.entries(data.consignee.hiddenFields).forEach(([id, val]) => {
          setFieldValue(doc, id, val);
        });

        // 5. fill Notify
        setFieldValue(doc, "TextBox_Notify", data.notify.textValue);
        Object.entries(data.notify.hiddenFields).forEach(([id, val]) => {
          setFieldValue(doc, id, val);
        });

        // 6. fill ForwarderRef
        setFieldValue(doc, "TextBox_ForwarderRef", data.forwarderRef);

        // 7. set "all units in one booking" checkbox
        const cbId = selectors.requiredFields.unitBooking[0];
        const cb = doc.getElementById(cbId);
        if (cb) {
          cb.checked = !!data.allUnitsInOneBooking;
          cb.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // 8. wait for the iframe to reload completely
        await waitForSingleIframeFullCycle();
        doc = getBookingDocument(); // Re-get the document after reload

        // 9. fill voyage fields
        setFieldValue(doc, "TextBox_Voyage", data.voyage.hidden);
        setFieldValue(doc, "HiddenField_Vyg", data.voyage.hidden);

        show("Form data filled; initiating voyage selection...", "warning");

        // 10. perform voyage selection
        const voyageOk = await handleVoyageSelection(data);
        if (!voyageOk) return false;

        // 11. wait for the next frame with customsCode dropdown
        const { document: doc2 } = await waitForReadyIframe(
          0,
          "#DropDownList_CustomsCode",
          CONFIG.delays.maxWaitTime
        );
        doc = doc2; // Update doc reference

        // 12. fill Customs Code
        setFieldValue(doc, "DropDownList_CustomsCode", data.customsCode.hidden);
        setFieldValue(doc, "HiddenField_CustomsCode", data.customsCode.hidden);

        // 13. fill Transit To
        setFieldValue(doc, "DropDownList_InTransitToCountry", data.transitTo.hidden);
        setFieldValue(doc, "HiddenField_InTransitToCountry", data.transitTo.hidden);

        return true;
      } catch (error) {
        const msg = `Error filling booking data: ${error.message}`;
        show(msg, "error");
        console.error(error);
        sendNtfy(msg, "high", data);
        return false;
      }
    },

    /**
     * Clicks the "Add Units From File" button in the booking form.
     * @returns {Promise<boolean>}
     */
    async clickAddUnitsFromFileButton() {
      try {
        const doc = getBookingDocument();
        const btn = doc.getElementById("Button_AddUnitsFromFile");
        if (!btn) {
          show("Add Units From File button not found", "error");
          console.error("Button_AddUnitsFromFile not found");
          return false;
        }
        btn.click();
        show("Add Units From File button clicked", "success");
        return true;
      } catch (error) {
        const msg = `Error clicking Add Units button: ${error.message}`;
        show(msg, "error");
        console.error(error);
        return false;
      }
    }
  };

})();
