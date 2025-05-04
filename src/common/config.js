// src/common/config.js

(function() {
  'use strict';

  // Ensure the global namespace object exists
  window.VH = window.VH || {};

  /**
   * Shared configuration values
   */
  VH.CONFIG = {
    // ntfy.sh push notification settings
    ntfy: {
      topic: "grimaldi_2025",
      url:   "https://ntfy.sh/"
    },

    // UI‐related defaults
    ui: {
      // How long (ms) to show in‐page notifications
      notificationDuration: 5000,
      // Where to position floating buttons
      buttonPosition: {
        bottom: "20px",
        right:  "20px"
      }
    },

    // Common timing delays
    delays: {
      pollInterval:     300,    // ms between polls (e.g. waiting for new rows)
      maxWaitTime:      20000,  // ms before giving up on waits
      iframeRefresh:    1000,   // ms between iframe reload attempts
      afterAddVehicle:  1500,   // ms after clicking “add” before next action
      afterDropdownClick: 800   // ms after opening a dropdown
    }
  };

  /**
   * Shared notification/error message templates
   */
  VH.MESSAGES = {
    // When a booking table is unexpectedly empty or its rows change
    bookingTableEmpty: () =>
      "Booking table is empty or has changed unexpectedly",

    // Report which fields were not found in a form
    pageStructureMismatch: missingFields =>
      `Page structure mismatch—missing fields: ${missingFields.join(", ")}`,

    // Generic error prefix
    errorPrefix: errMsg =>
      `Error: ${errMsg}`
  };

})();
