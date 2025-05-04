// src/vehicle-handler/vehicleUi.js

// Ensure global namespace
window.VH = window.VH || {};

const { vehicleConfig: CONFIG, vehicleMessages: MESSAGES } = VH;
const { show }       = VH.notifications;
const { injectStyles, addTooltip } = VH.ui;
const { vehiclesFromClipboard } = VH.vehicleMain;

VH.vehicleUi = {
  /**
   * Create the floating panel with all controls.
   */
  createUI() {
    // Inject any needed styles (panel, buttons, overlay)
    injectStyles(`
      .vehicle-handler-panel {
        position: fixed;
        top: 50px;
        right: 20px;
        width: 300px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
      }
      .vehicle-handler-panel button {
        width: 100%;
        margin: 5px 0;
        padding: 8px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
      }
      .vehicle-handler-panel button:hover { opacity: 0.9; }
    `);

    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(overlay);

    // Create panel
    const panel = document.createElement('div');
    panel.className = 'vehicle-handler-panel';
    panel.innerHTML = `
      <h4 style="margin:0 0 10px;text-align:center;">Vehicle Handler</h4>
      <button id="loadFromClipboardBtn" style="background:#3B82F6;color:#fff;">Load Vehicles from Clipboard</button>
      <div id="loadedDataInfo" style="display:none;"></div>
      <button id="addAllBtn" style="background:#10B981;color:#fff;">Preview & Add Vehicles</button>
      <button id="fixCellsBtn" style="background:#F59E0B;color:#fff;">Fix Missing Cells</button>
      <div id="summaryArea" style="margin-top:10px;font-size:12px;color:#333;"></div>
      <a href="#" id="toggleDebugBtn" style="display:block;text-align:center;font-size:11px;margin-top:5px;">Disable Debug</a>
    `;
    document.body.appendChild(panel);

    // Wire up events
    document.getElementById('loadFromClipboardBtn')
      .addEventListener('click', () => VH.vehicleMain.loadFromClipboard());
    document.getElementById('addAllBtn')
      .addEventListener('click', () => this.showVehiclePreview());
    document.getElementById('fixCellsBtn')
      .addEventListener('click', async () => {
        document.querySelector(CONFIG.selectors.loadingOverlay).style.display = 'flex';
        await VH.vehicleDom.fixAllRowsMissingCells();
        document.querySelector(CONFIG.selectors.loadingOverlay).style.display = 'none';
      });
    document.getElementById('toggleDebugBtn')
      .addEventListener('click', e => {
        e.preventDefault();
        VH.utils.DEBUG.enabled = !VH.utils.DEBUG.enabled;
        e.target.textContent = VH.utils.DEBUG.enabled ? 'Disable Debug' : 'Enable Debug';
        show(`Debug ${VH.utils.DEBUG.enabled ? 'enabled' : 'disabled'}`, 'info');
      });

    // Tooltips
    addTooltip(document.getElementById('loadFromClipboardBtn'), 'Load vehicle data from clipboard JSON');
    addTooltip(document.getElementById('addAllBtn'), 'Preview vehicles before adding them');
    addTooltip(document.getElementById('fixCellsBtn'), 'Fix any missing cells in the booking rows');
  },

  /**
   * Update the little info box after loading data.
   */
  updateLoadedDataInfo(vehicleCount, attachmentCount, forwarderRef = '') {
    const infoEl = document.getElementById('loadedDataInfo');
    infoEl.style.display = 'block';
    infoEl.innerHTML = `
      <div style="padding:8px;background:#EFF6FF;border-radius:4px;">
        <strong style="font-size:14px;">${forwarderRef || 'Vehicles Ready'}</strong><br>
        ${vehicleCount} vehicle(s), ${attachmentCount} attachment(s)
      </div>
    `;
  },

  /**
   * Show a full‐screen modal preview of the loaded vehicles.
   */
  showVehiclePreview() {
    if (!vehiclesFromClipboard || vehiclesFromClipboard.length === 0) {
      show(MESSAGES.noVehiclesToPreview, 'error');
      return;
    }

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'vehiclePreviewModal';
    backdrop.style.cssText = `
      position: fixed; top: 0; left: 0; width:100%; height:100%;
      background: rgba(0,0,0,0.7); display:flex; justify-content:center;
      align-items:center; z-index:10003;
    `;

    // Modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background:white; width:90%; height:90%; border-radius:8px;
      display:flex; flex-direction:column; overflow:hidden;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding:15px; background:#f0f8ff; border-bottom:1px solid #e0e0e0;
      display:flex; justify-content:space-between; align-items:center;
    `;
    header.innerHTML = `
      <h2 style="margin:0;font-size:18px;">Vehicle Preview</h2>
      <div>
        <button id="confirmVehiclesBtn" style="margin-right:10px;padding:8px 15px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">Confirm & Add Vehicles</button>
        <button id="closePreviewBtn" style="padding:8px 15px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;">Cancel</button>
      </div>
    `;

    // Iframe for preview content
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'flex:1;border:none;';

    modal.appendChild(header);
    modal.appendChild(iframe);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Write preview HTML into the iframe
    const previewHtml = this.generateVehiclePreviewHtml(vehiclesFromClipboard);
    iframe.onload = () => {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(previewHtml);
      doc.close();
    };
    iframe.src = 'about:blank';

    // Close handlers
    document.getElementById('closePreviewBtn').addEventListener('click', () => {
      backdrop.remove();
    });
    document.getElementById('confirmVehiclesBtn').addEventListener('click', () => {
      backdrop.remove();
      VH.vehicleMain.processVehicleAddition();
    });
  },

  /**
   * Generate the full HTML (with Tailwind) for the vehicle preview.
   * Just paste your previous generateVehiclePreviewHtml implementation here.
   */
  generateVehiclePreviewHtml(vehicles) {
    // … copy-paste the long HTML + CSS + JS you already have …
    // For brevity, assume it returns a complete <html>…</html> string.
    let html = `<!DOCTYPE html><html lang="en"><head>…</head><body>…</body></html>`;
    return html;
  },

  /**
   * Render the summary of additions/skips after processing.
   */
  renderSummary(summary) {
    const area = document.querySelector(CONFIG.selectors.summaryArea);
    if (!area) return;
    area.innerHTML = `
      <strong>Base Added:</strong> ${summary.addedBase.join(', ') || 'None'}<br>
      <strong>Base Skipped:</strong> ${summary.skippedBase.join(', ') || 'None'}<br>
      <strong>Attachments Added:</strong> ${summary.addedAttachments.join(', ') || 'None'}<br>
      <strong>Attachments Skipped:</strong> ${summary.skippedAttachments.join(', ') || 'None'}
    `;
  }
};
