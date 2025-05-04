// src/shipper-replacer/main.js

(function() {
    'use strict';
  
    // Pull in the shared helpers and script-specific modules
    const { clipboard, notifications, dom, iframes, ui } = VH;
    const { show, sendNtfy } = notifications;
  
    /**
     * Handler for the floating “Fill Booking Data” button.
     * Orchestrates:
     *   1. Reading & validating clipboard JSON
     *   2. Generating text-box values
     *   3. Showing confirmation dialog
     *   4. Filling the form and selecting voyage
     *   5. Clicking “Add Units From File”
     */
    async function handleFillDataClick() {
      const btn = document.getElementById('fillBookingDataBtn');
      // prevent double-clicks
      if (btn.classList.contains('loading')) return;
  
      // set loading state
      btn.classList.add('loading');
      const originalText = btn.textContent;
      btn.textContent = 'Filling…';
  
      try {
        // 1. read & validate
        let data = await clipboard.getShippingDataFromClipboard();
        if (!data) return;
  
        // 2. build text-box values
        data = VH.replacerDom.generateTextBoxValues(data);
  
        // 3. confirm
        const confirmed = await VH.replacerUi.showConfirmationDialog(data);
        if (!confirmed) {
          show('Booking data fill canceled', 'warning');
          return;
        }
  
        // 4. fill the form (includes voyage selection)
        const success = await VH.replacerDom.fillBookingData(data);
        if (!success) return;
        show('All shipping data filled & voyage selected successfully!', 'success');
  
        // 5. click “Add Units From File”
        await VH.replacerDom.clickAddUnitsFromFileButton();
  
      } catch (error) {
        // unexpected errors
        show(`Error: ${error.message}`, 'error');
        sendNtfy(`Error in handling fill data: ${error.message}`);
        console.error(error);
      } finally {
        // restore button
        btn.classList.remove('loading');
        btn.textContent = originalText;
      }
    }
  
    /**
     * Initialize the UI and bind the click handler.
     */
    function init() {
      ui.createFloatingButton(
        'fillBookingDataBtn',
        'Fill Booking Data',
        handleFillDataClick
      );
      console.log('Grimaldi Shipper Data Replacer initialized');
    }
  
    // bootstrap on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
  })();
  