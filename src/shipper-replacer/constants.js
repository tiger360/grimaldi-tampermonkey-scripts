// src/shipper-replacer/constants.js

// Ensure the global namespace object exists
window.VH = window.VH || {};

/**
 * Script-specific configuration for the Shipper Data Replacer
 */
VH.SHIPPER_CONFIG = {
  selectors: {
    // Main booking dialog + iframe
    bookingDialog: 'div.ui-dialog[style*="display: block;"]',
    bookingIframe: 'iframe',

    // Which fields must exist before filling the form
    requiredFields: {
      shipper: [
        "TextBox_Shipper",
        "HiddenField_Shipper",
        "HiddenField_Shipper_Line1",
        "HiddenField_Shipper_City",
        "HiddenField_Shipper_Country",
        "HiddenField_Shipper_CountryText"
      ],
      consignee: [
        "TextBox_Consignee",
        "HiddenField_Consignee",
        "HiddenField_Consignee_Line1",
        "HiddenField_Consignee_City",
        "HiddenField_Consignee_Country",
        "HiddenField_Consignee_CountryText"
      ],
      notify: [
        "TextBox_Notify",
        "HiddenField_Notify",
        "HiddenField_Notify_Line1",
        "HiddenField_Notify_City",
        "HiddenField_Notify_Country",
        "HiddenField_Notify_CountryText"
      ],
      voyage: [
        "TextBox_Voyage",
        "HiddenField_Vyg",
        "Button_FindVoyageNew"
      ],
      portInfo: [
        "TextBox_POL",
        "HiddenField_POL",
        "HiddenField_POLCALL",
        "TextBox_POD",
        "HiddenField_POD"
      ],
      customsCode: [
        "DropDownList_CustomsCode",
        "HiddenField_CustomsCode"
      ],
      transitInfo: [
        "DropDownList_InTransitToCountry",
        "HiddenField_InTransitToCountry"
      ],
      forwarder: [
        "TextBox_ForwarderRef"
      ],
      unitBooking: [
        "CheckBox_GRP1BL"
      ]
    },

    // Buttons for opening / handling the voyage-selection dialog
    voyageSelection: {
      findVoyageButton: "Button_FindVoyageNew",
      tbnVoyageButton:  "ASPxPageControl1_Button_TBN_Y0"
    }
  }
};
