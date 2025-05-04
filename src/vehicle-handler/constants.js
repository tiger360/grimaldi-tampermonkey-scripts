// src/vehicle-handler/constants.js

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
    loadingOverlay:          '.loading-overlay',
    panel:                   '.vehicle-handler-panel',
    loadClipboardBtn:        '#loadFromClipboardBtn',
    addAllBtn:               '#addAllBtn',
    fixCellsBtn:             '#fixCellsBtn',
    toggleDebugBtn:          '#toggleDebugBtn',
    loadedDataInfo:          '#loadedDataInfo',
    previewVehiclesBtn:      '#previewVehiclesBtn',
    closePreviewBtn:         '#closePreviewBtn',
    confirmVehiclesBtn:      '#confirmVehiclesBtn',
    vehiclePreviewModal:     '#vehiclePreviewModal',
    summaryArea:             '#summaryArea'
  },

  delays: {
    iframeRefresh:      1000,   // ms between iframe reload attempts
    afterAddVehicle:    1500,   // ms after adding a vehicle before next action
    afterDropdownClick: 800,    // ms after opening a dropdown
    maxWaitTime:        20000,  // ms before giving up on waits
    pollInterval:       300,    // ms between polls (e.g. waiting for new rows)
    pollShort:          200,    // shorter poll for very fast checks
    notificationFadeIn: 100,    // ms fade in notifications
    notificationFadeOut:300,    // ms fade out notifications
    notificationDuration:5000,  // ms to hold in‐page notifications
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
  bookingTableEmpty:    COMMON_MESSAGES.bookingTableEmpty,
  pageStructureMismatch:COMMON_MESSAGES.pageStructureMismatch,
  usingExistingVehicle: chassis => `Using existing vehicle with chassis ${chassis}`,
  attachmentExists:     chassis => `Attachment ${chassis} already exists, skipping`,
  noVehiclesToAdd:      'No vehicles to add. Please load data from clipboard first.',
  noVehiclesToPreview:  'No vehicles to preview. Please load data from clipboard first.',
  errorPrefix:          err => `Error: ${err}`,
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
