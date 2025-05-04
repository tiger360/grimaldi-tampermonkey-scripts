// src/vehicle-handler/main.js

// Ensure the global namespace object exists
window.VH = window.VH || {};

const { vehicleConfig, vehicleMessages } = VH;
const { show } = VH.notifications;
const domHelpers    = VH.dom;
const iframeHelpers = VH.iframes;
const vehicleDom    = VH.vehicleDom;
const vehicleUi     = VH.vehicleUi;

VH.vehicleMain = {
  // State
  vehiclesFromClipboard: [],
  forwarderRef:          "",
  clipboardData:         null,

  /**
   * Load JSON from clipboard, parse vehicles, and update the UI.
   */
  async loadFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);

      if (!data.vehicules || !Array.isArray(data.vehicules)) {
        throw new Error("Invalid data format: missing vehicules array");
      }

      this.clipboardData = data;
      this.vehiclesFromClipboard = data.vehicules;
      this.forwarderRef = data.forwarderRef || "";

      const vehicleCount = this.vehiclesFromClipboard.length;
      const attachmentCount = this.vehiclesFromClipboard.reduce(
        (sum, v) => sum + (v.attachedUnits ? v.attachedUnits.length : 0),
        0
      );

      show(
        `Loaded ${vehicleCount} vehicle(s) with ${attachmentCount} attachment(s)`,
        "success"
      );

      vehicleUi.updateLoadedDataInfo(
        vehicleCount,
        attachmentCount,
        this.forwarderRef
      );
    } catch (err) {
      console.error("Error loading from clipboard:", err);
      show(`Cannot load from clipboard: ${err.message}`, "error");
    }
  },

  /**
   * After user confirms, actually add all vehicles to the booking.
   */
  async processVehicleAddition() {
    const vehicles = this.vehiclesFromClipboard;
    if (!vehicles || vehicles.length === 0) {
      show(vehicleMessages.noVehiclesToAdd, "error");
      return;
    }

    show("Adding vehicles...", "info");
    vehicleDom.isAddingVehicles = true;

    const summary = {
      addedBase: [],
      skippedBase: [],
      addedAttachments: [],
      skippedAttachments: []
    };

    try {
      for (const combo of vehicles) {
        await vehicleDom.addSingleVehicleWithAttachments(
          combo.baseUnit,
          combo.attachedUnits,
          summary
        );
      }

      show(vehicleMessages.allVehiclesAdded, "success");

      // Optionally click the "Add Units From File" button
      setTimeout(() => {
        vehicleDom.clickAddUnitsFromFileButton();
      }, vehicleConfig.delays.afterAddVehicle);

    } catch (err) {
      console.error("Error adding vehicles:", err);
      show(vehicleMessages.errorPrefix(err.message), "error");
    } finally {
      vehicleDom.isAddingVehicles = false;
      // Fix any missing cells after addition
      await vehicleDom.fixAllRowsMissingCells();
      // Render the summary in the panel
      vehicleUi.renderSummary(summary);
    }
  },

  /**
   * Entry‐point: initialize UI and bind handlers.
   */
  init() {
    vehicleUi.createUI();
    console.log("Grimaldi Vehicle Handler initialized");
  }
};

// Bootstrap on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => VH.vehicleMain.init());
} else {
  VH.vehicleMain.init();
}
