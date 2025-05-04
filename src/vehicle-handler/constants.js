// src/vehicle-handler/constants.js

(function() {
  'use strict';

  // Ensure the global namespace object exists
  window.VH = window.VH || {};

  // Short alias to the shared messages
  const { MESSAGES: COMMON_MESSAGES } = VH;

  /**
   * Script-specific configuration for the Vehicle Handler
   */
  VH.vehicleConfig = {
    selectors: {
      bookingDialog:           'div.ui-dialog[style*="display: block;"]',
      bookingIframe:           'iframe',
      addNewLineButton:        '#Button_AddNewLine',
      bookedItemsTable:        '#table_bookeditems',
      bookedItemsHeaderTable:  '#table_bookeditems_header',
      clientVIDPattern:        'TextBox_ClientVID_',
      chassisPattern:          'TextBox_Chassis_',
      rowPattern:              '#table_bookeditems tr[id^="tr_"]',
      loadingOverlay:          '.loading-overlay', // Ensure this class is defined in vehicleUi.js CSS
      panel:                   '.vehicle-handler-panel',
      loadClipboardBtn:        '#loadFromClipboardBtn',
      addAllBtn:               '#addAllBtn',
      fixCellsBtn:             '#fixCellsBtn',
      toggleDebugBtn:          '#toggleDebugBtn',
      loadedDataInfo:          '#loadedDataInfo',
      previewVehiclesBtn:      '#previewVehiclesBtn', // This seems unused, addAllBtn triggers preview
      closePreviewBtn:         '#closePreviewBtn',
      confirmVehiclesBtn:      '#confirmVehiclesBtn',
      vehiclePreviewModal:     '#vehiclePreviewModal',
      summaryArea:             '#summaryArea'
    },

    // Inherit delays from common config and add/override specifics
    delays: {
      ...VH.CONFIG.delays, // Inherit common delays
      pollShort:          200,    // shorter poll for very fast checks
      notificationFadeIn: 100,    // ms fade in notifications (Consider moving to common UI config)
      notificationFadeOut:300,    // ms fade out notifications (Consider moving to common UI config)
      domChangeFixDelay:   1000,  // ms after DOM mutation before fixing cells
      fixCellsInterval:    5000,  // ms between periodic “fix cells” runs
      uiInitDelay:         100    // ms delay before hooking up dynamic UI
    },

    attributes: {
      // Cells that must exist or be cloned in each booking row
      requiredCells: [
        'cell_81',  // Load Mode
        'cell_9',   // Waiver
        'cell_10',  // Lot
        'cell_11',  // Block
        'cell_13',  // Checkbox
        'cell_14',  // ClientVID
        'cell_15',  // CAMachine checkbox
        'cell_16'   // ClientVehicleID
      ]
    }
  };

  /**
   * Script-specific user messages
   */
  VH.vehicleMessages = {
    bookingTableEmpty:    COMMON_MESSAGES.bookingTableEmpty, // Keep as function call reference
    pageStructureMismatch:COMMON_MESSAGES.pageStructureMismatch, // Keep as function call reference
    usingExistingVehicle: chassis => `Using existing vehicle with chassis ${chassis}`,
    attachmentExists:     chassis => `Attachment ${chassis} already exists, skipping`,
    noVehiclesToAdd:      'No vehicles to add. Please load data from clipboard first.',
    noVehiclesToPreview:  'No vehicles to preview. Please load data from clipboard first.',
    errorPrefix:          COMMON_MESSAGES.errorPrefix, // Keep as function call reference
    allVehiclesAdded:     'All vehicles added successfully',
    clickedAddUnits:      'Clicked "Add Units From File" button'
  };

  /**
   * External→internal attachment type mappings
   */
  VH.ATTACHMENT_TYPE_MAPPINGS = {
    PIGGYBACK:        'PIGGY_BACK',
    TRAILER:          'ATTACHEDTR',
    PIGGY:            'PIGGY_BACK',
    TRAILER_ATTACHED: 'ATTACHEDTR'
  };

  /**
   * Human-readable priority → internal code
   */
  VH.PRIORITY_MAPPINGS = {
    'As New \\ VIP': 'U',
    'New':           'N',
    'Priority':      'P',
    'Used':          '_',
    'Factory New Vehicle': 'F'
  };

})();
