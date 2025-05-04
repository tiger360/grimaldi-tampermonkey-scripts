// src/shipper-replacer/replacerUi.js

// Ensure the global namespace object exists
window.VH = window.VH || {};
const { SHIPPER_CONFIG } = VH;
const { ui, notifications } = VH;

/**
 * UI module for the Shipper Data Replacer script.
 * Provides a confirmation dialog before filling the form.
 */
VH.replacerUi = {
  /**
   * Shows a Tailwind-styled modal to confirm booking data.
   * @param {Object} data  Parsed & text-augmented shipping data
   * @returns {Promise<boolean>} resolves true if user confirms, false if cancels
   */
  showConfirmationDialog(data) {
    return new Promise(resolve => {
      // Backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50';

      // Modal container
      const modal = document.createElement('div');
      modal.className = 'bg-white rounded-lg overflow-hidden max-w-3xl w-full shadow-lg';

      // Helper to safely display a field or fallback
      const display = (val, fallback = 'N/A') =>
        val && val.toString().trim() ? val : fallback;

      // Build inner HTML with Tailwind classes
      modal.innerHTML = `
        <div class="px-6 py-4 border-b">
          <h2 class="text-xl font-bold text-gray-800">Confirm Booking Data</h2>
        </div>
        <div class="p-6 space-y-4 max-h-[70vh] overflow-auto text-gray-700 text-sm">
          <div class="grid grid-cols-2 gap-4">
            <div><span class="font-semibold">Ref:</span> <span class="font-mono">${display(data.forwarderRef)}</span></div>
            <div><span class="font-semibold">Voyage:</span> <span class="font-mono">${display(data.voyage.hidden)}</span></div>
            <div class="col-span-2">
              <span class="font-semibold">Route:</span>
              <span>${display(data.portOfLoading.text)} → ${display(data.portOfDischarge.text)}${data.transitTo.hidden ? ` (Transit: ${display(data.transitTo.hidden)})` : ''}</span>
            </div>
          </div>

          <hr/>

          <div>
            <h4 class="font-semibold text-gray-800 mb-1">Shipper</h4>
            <p class="whitespace-pre-wrap">${display(data.shipper.textValue)}</p>
          </div>
          <div>
            <h4 class="font-semibold text-gray-800 mb-1">Consignee</h4>
            <p class="whitespace-pre-wrap">${display(data.consignee.textValue)}</p>
          </div>
          <div>
            <h4 class="font-semibold text-gray-800 mb-1">Notify Party</h4>
            <p class="whitespace-pre-wrap">${display(data.notify.textValue)}</p>
          </div>

          <hr/>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="font-semibold text-gray-800">Customs Code</h4>
              <p>${display(data.customsCode.hidden)}</p>
            </div>
            <div>
              <h4 class="font-semibold text-gray-800">Transit To</h4>
              <p>${display(data.transitTo.hidden)}</p>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-100 flex justify-end space-x-2">
          <button id="vh-cancel" class="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition">Cancel</button>
          <button id="vh-confirm" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Confirm
          </button>
        </div>
      `;

      // Append to document
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      // Handler for confirmation
      modal.querySelector('#vh-confirm').addEventListener('click', () => {
        backdrop.remove();
        resolve(true);
      });

      // Handler for cancellation
      modal.querySelector('#vh-cancel').addEventListener('click', () => {
        backdrop.remove();
        resolve(false);
      });
    });
  }
};
