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
    // Base HTML structure with styles
    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Grimaldi Vehicle Verification</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- Optional: Add a font library like Inter for better readability -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Inter', sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 20px;
            }
            /* Base Unit Styling */
            .base-unit-card {
                border-left: 8px solid #3B82F6; /* Blue */
                background-color: #EFF6FF; /* Light Blue */
                position: relative;
                transition: box-shadow 0.2s ease-in-out;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
            }
            .base-unit-card:hover {
                 box-shadow: 0 8px 16px rgba(59, 130, 246, 0.25);
            }

            /* Base Unit Counter */
            .base-unit-counter {
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 2.5rem;
                background-color: #3B82F6;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.25rem;
                z-index: 10;
            }

            /* Base Unit Label */
            .base-unit-label {
                position: absolute;
                top: 0;
                right: 0;
                background-color: #3B82F6;
                color: white;
                font-size: 0.65rem;
                font-weight: bold;
                padding: 4px 10px;
                border-bottom-left-radius: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            /* Chassis Number Styling */
            .chassis-number {
                font-family: 'Courier New', monospace;
                font-weight: 600;
                background-color: #F3F4F6;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                border: 1px solid #E5E7EB;
                letter-spacing: 0.05em;
            }

            /* Data Cards Container */
            .data-cards-container {
                display: flex;
                gap: 0.5rem;
                margin-top: 0.75rem;
                width: 100%;
                justify-content: space-between;
            }

            /* Info Card */
            .info-card {
                flex: 1;
                min-width: 120px;
                text-align: center;
                padding: 0.5rem;
                background-color: #f8fafc;
                border-radius: 0.25rem;
                border: 1px solid #e2e8f0;
            }

            .info-card-label {
                font-size: 0.7rem;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                font-weight: 500;
                margin-bottom: 0.25rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .info-card-value {
                font-size: 0.875rem;
                font-weight: 600;
                color: #0f172a;
            }

            /* Attached Unit Styling */
            .attached-unit-card {
                margin-left: 2.5rem; /* Indentation */
                position: relative;
                transition: box-shadow 0.2s ease-in-out;
            }
             .attached-unit-card:hover {
                 box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }

            /* Connecting line for attached units */
            .attached-unit-card::before {
                content: '';
                position: absolute;
                top: 50%;
                left: -1.75rem; /* Position relative to the indentation */
                width: 1.25rem; /* Length of the horizontal line */
                height: 2px;
                background-color: #9CA3AF; /* Gray color for the line */
                transform: translateY(-50%);
            }
            .attached-unit-card::after { /* Optional: vertical part of the connector */
                 content: '';
                 position: absolute;
                 top: 0;
                 bottom: 0;
                 left: -1.75rem;
                 width: 2px;
                 background-color: #E5E7EB; /* Lighter gray */
                 z-index: -1; /* Place behind the card content */
            }
            /* Style connector lines only if there are siblings */
             .attached-unit-card:first-child::after { top: 50%; }
             .attached-unit-card:last-child::after { bottom: 50%; }
             .attached-unit-card:only-child::after { display: none; } /* Hide vertical if only one */


            .piggyback-unit {
                border-left: 6px solid #10B981; /* Green */
                background-color: #F0FDF4; /* Light Green */
            }
             .piggyback-unit:hover {
                 box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
             }


            .trailer-unit {
                border-left: 6px solid #F59E0B; /* Amber */
                background-color: #FFFBEB; /* Light Amber */
            }
            .trailer-unit:hover {
                 box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
             }

            /* Type Badge Styling */
            .type-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px; /* Fixed size */
                height: 28px;
                border-radius: 0.375rem; /* rounded-md */
                color: white;
                font-weight: 600;
                font-size: 0.875rem; /* text-sm */
                flex-shrink: 0; /* Prevent shrinking in flex */
            }
            .type-T { background-color: #2563EB; } /* Blue */
            .type-C { background-color: #F59E0B; } /* Amber */
            .type-V { background-color: #10B981; } /* Green */
            .type-S { background-color: #6366F1; } /* Indigo */

            /* Small info cards on the right */
            .info-card {
                background-color: white;
                border-radius: 0.375rem; /* rounded-md */
                padding: 0.3rem 0.6rem;
                text-align: center;
                border: 1px solid #E5E7EB; /* border-gray-200 */
                min-width: 80px; /* Ensure minimum width */
            }
            .info-card-label {
                font-size: 0.65rem; /* text-xs */
                color: #6B7280; /* text-gray-500 */
                margin-bottom: 0.1rem;
                text-transform: uppercase;
                font-weight: 500;
            }
            .info-card-value {
                font-size: 0.8rem; /* Slightly smaller than text-sm */
                font-weight: 600;
                color: #1F2937; /* text-gray-800 */
                white-space: nowrap;
            }

            /* Attachment Type Label (PB/AT) */
            .attachment-label {
                 position: absolute;
                 left: -1.75rem; /* Align with the connector line */
                 top: 50%;
                 transform: translateY(-50%) translateX(-100%); /* Position left of the line */
                 padding: 2px 6px;
                 font-size: 0.7rem;
                 font-weight: 700;
                 border-radius: 4px;
                 background-color: white;
                 border: 1px solid;
            }
             .label-PB { color: #059669; border-color: #6EE7B7; background-color: #D1FAE5; } /* Green */
             .label-AT { color: #D97706; border-color: #FCD34D; background-color: #FEF9C3; } /* Amber */

             /* Header styling */
             header {
                margin-bottom: 1.5rem;
                background-color: white;
                padding: 1rem;
                border-radius: 0.5rem;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                border-top: 4px solid #3B82F6;
             }

             .header-title {
                font-size: 1.5rem;
                font-weight: bold;
                text-align: center;
                color: #1F2937;
             }

             .header-subtitle {
                text-align: center;
                color: #6B7280;
                font-size: 0.875rem;
                margin-top: 0.25rem;
             }

             .stats-container {
                display: flex;
                justify-content: center;
                gap: 0.5rem;
                margin-top: 1rem;
             }

             .stat-badge {
                display: inline-flex;
                align-items: center;
                background-color: #EFF6FF;
                color: #1E40AF;
                font-size: 0.75rem;
                font-weight: 500;
                padding: 0.25rem 0.75rem;
                border-radius: 9999px;
             }

             /* Legend styling */
             .legend {
                margin-bottom: 1.5rem;
                padding: 1rem;
                background-color: white;
                border-radius: 0.5rem;
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                font-size: 0.875rem;
             }

             .legend-title {
                font-weight: 600;
                color: #4B5563;
                width: 100%;
                margin-bottom: 0.25rem;
             }

             .legend-item {
                display: flex;
                align-items: center;
             }

             /* Vehicle combination container */
             .combination-group {
                position: relative;
                border: 1px solid #E5E7EB;
                border-radius: 0.75rem;
                padding: 1.5rem 0.75rem 0.75rem;
                margin-bottom: 2rem;
                background-color: white;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
             }
        </style>
    </head>
    <body>
        <div class="max-w-6xl mx-auto">
            <header>
                <h1 class="header-title">Grimaldi Booking Verification</h1>
                <p class="header-subtitle">Review vehicle combinations below</p>
                <div class="stats-container">
                    <span class="stat-badge">
                        <span id="totalBaseUnits">0</span> Base Units
                    </span>
                    <span class="stat-badge" style="background-color: #F0FDF4; color: #065F46;">
                        <span id="totalAttachedUnits">0</span> Attached Units
                    </span>
                    <span class="stat-badge" style="background-color: #F3F4F6; color: #4B5563;">
                        <span id="totalVehicles">0</span> Total Vehicles
                    </span>
                </div>
            </header>

            <!-- Legend -->
            <div class="legend">
                <h3 class="legend-title">Legend:</h3>
                <div class="legend-item"><span class="type-badge type-T" style="margin-right: 0.5rem;">T</span> Truck</div>
                <div class="legend-item"><span class="type-badge type-C" style="margin-right: 0.5rem;">C</span> Car</div>
                <div class="legend-item"><span class="type-badge type-V" style="margin-right: 0.5rem;">V</span> Small Van</div>
                <div class="legend-item"><span class="type-badge type-S" style="margin-right: 0.5rem;">S</span> Tractor/Construction</div>
                <div class="legend-item">
                    <span class="label-PB" style="position:relative; left:0; transform:none; margin-right: 0.5rem;">PB</span> Piggyback
                </div>
                <div class="legend-item">
                    <span class="label-AT" style="position:relative; left:0; transform:none; margin-right: 0.5rem;">AT</span> Attached Trailer
                </div>
            </div>

            <div id="vehicle-combinations" class="space-y-6">
    `;

    // Helper functions
    const formatDimensions = (l, w, h) => {
        if (!l || !w || !h) return 'N/A';
        return `${(l / 100).toFixed(2)}x${(w / 100).toFixed(2)}x${(h / 100).toFixed(2)} m`;
    };

    const formatWeight = weight => {
        if (weight === null || weight === undefined) return 'N/A';
        if (weight >= 1000) {
            return `${(weight / 1000).toFixed(2)} t`;
        }
        return `${weight} kg`;
    };

    const getTypeBadgeHTML = type => {
        if (!type) return '';
        return `<span class="type-badge type-${type}">${type}</span>`;
    };

    // SVG Icons (Heroicons Mini)
    const icons = {
        dimensions: '<svg class="inline h-3 w-3 mr-0.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M11.25 3.25a.75.75 0 00-1.5 0v1.25h-1.25a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V6.25h1.25a.75.75 0 000-1.5h-1.25V3.25zM6.25 8.75a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-7.5zM3.75 13.75a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H3.75z"></path></svg>',
        weight: '<svg class="inline h-3 w-3 mr-0.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1a.75.75 0 01.75.75V3.767c.416.097.81.248 1.166.443a.75.75 0 01-.832 1.342 4.969 4.969 0 00-1.084-.348V16.25a.75.75 0 01-1.5 0V5.203a4.969 4.969 0 00-1.084.349 .75.75 0 01-.832-1.343c.356-.195.75-.346 1.166-.443V1.75A.75.75 0 0110 1zm-4.25 7.5a.75.75 0 01.75-.75H8.5V17a.75.75 0 001.5 0V7.75h2a.75.75 0 010 1.5H10v7.75a.75.75 0 01-1.5 0V9.25H6.5a.75.75 0 01-.75-.75z" clip-rule="evenodd" /></svg>',
        id: '<svg class="inline h-3 w-3 mr-0.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z"></path></svg>',
        hsCode: '<svg class="inline h-3 w-3 mr-0.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zM0 13.75a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H0z" clip-rule="evenodd" /></svg>',
        engine: '<svg class="inline h-3 w-3 mr-0.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clip-rule="evenodd" /></svg>'
    };

    // Counters
    let totalBase = 0;
    let totalAttached = 0;

    // Generate HTML for each vehicle combination
    vehicles.forEach(combo => {
        totalBase++;
        const baseUnit = combo.baseUnit;
        const attachedUnits = combo.attachedUnits || [];
        totalAttached += attachedUnits.length;

        html += `
        <div class="combination-group">
            <!-- Base Unit Card -->
            <div class="base-unit-card p-4 rounded-lg flex flex-wrap md:flex-nowrap items-center gap-3 shadow-md">
                <div class="base-unit-counter">${totalBase}</div>
                <div class="base-unit-label">BASE UNIT</div>
                <!-- Left Side: Type, Name, Details -->
                <div class="flex-grow flex items-start gap-3 pl-8">
                    ${getTypeBadgeHTML(baseUnit.vehicleType)}
                    <div class="flex-grow">
                        <h3 class="font-semibold text-base text-gray-900">
                            ${baseUnit.fullName || baseUnit.makeModel} ${baseUnit.year ? `(${baseUnit.year})` : ''}
                        </h3>
                        <div class="mt-1">
                            <div class="mb-1">
                                <span class="text-xs font-medium text-gray-500">Chassis:</span>
                                <span class="chassis-number">${baseUnit.chassis || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Data Cards -->
                <div class="data-cards-container">
                    <div class="info-card">
                        <div class="info-card-label">
                            ${icons.dimensions} DIMS
                        </div>
                        <div class="info-card-value">
                            ${formatDimensions(baseUnit.length, baseUnit.width, baseUnit.height)}
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-label">
                            ${icons.weight} WEIGHT
                        </div>
                        <div class="info-card-value">
                            ${formatWeight(baseUnit.weight)}
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-label">
                            ${icons.id} VID
                        </div>
                        <div class="info-card-value font-mono">
                            ${baseUnit.clientVID || 'N/A'}
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-label">
                            ${icons.hsCode} HS CODE
                        </div>
                        <div class="info-card-value font-mono">
                            ${baseUnit.goodsDescriptionHS?.hsCode || 'N/A'}
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-label">
                            ${icons.engine} ENGINE
                        </div>
                        <div class="info-card-value">
                            ${baseUnit.engineType || 'CONV'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add attached units if any
        if (attachedUnits.length > 0) {
            html += `<div class="mt-1 mb-1 space-y-1">`;

            attachedUnits.forEach(unit => {
                const isPiggyback = unit.type === 'PIGGY_BACK';
                const attachmentClass = isPiggyback ? 'piggyback-unit' : 'trailer-unit';
                const attachmentLabel = isPiggyback ? 'PB' : 'AT';
                const labelClass = isPiggyback ? 'label-PB' : 'label-AT';

                html += `
                <div class="attached-unit-card ${attachmentClass} p-3 rounded-lg shadow-sm flex flex-wrap md:flex-nowrap items-center gap-3 hover:shadow-md transition-shadow">
                    <span class="attachment-label ${labelClass}">${attachmentLabel}</span>
                    <!-- Left Side -->
                    <div class="flex-grow flex items-start gap-3">
                        ${getTypeBadgeHTML(unit.vehicleType)}
                        <div class="flex-grow">
                            <h4 class="font-medium text-sm text-gray-800">
                                ${unit.fullName || unit.makeModel} ${unit.year ? `(${unit.year})` : ''}
                            </h4>
                            <div class="mt-1">
                                <div class="mb-1">
                                    <span class="text-xs font-medium text-gray-500">Chassis:</span>
                                    <span class="chassis-number">${unit.chassis || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Data Cards for Attached Unit -->
                    <div class="data-cards-container">
                        <div class="info-card">
                            <div class="info-card-label">
                                ${icons.dimensions} DIMS
                            </div>
                            <div class="info-card-value">
                                ${formatDimensions(unit.length, unit.width, unit.height)}
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-card-label">
                                ${icons.weight} WEIGHT
                            </div>
                            <div class="info-card-value">
                                ${formatWeight(unit.weight)}
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-card-label">
                                ${icons.id} VID
                            </div>
                            <div class="info-card-value font-mono">
                                ${unit.clientVID || 'N/A'}
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-card-label">
                                ${icons.hsCode} HS CODE
                            </div>
                            <div class="info-card-value font-mono">
                                ${unit.goodsDescriptionHS?.hsCode || 'N/A'}
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-card-label">
                                ${icons.engine} ENGINE
                            </div>
                            <div class="info-card-value">
                                ${unit.engineType || 'CONV'}
                            </div>
                        </div>
                    </div>
                </div>
                `;
            });

            html += `</div>`;
        }

        html += `</div>`; // Close combination-group
    });

    // Close containers and add script to update counters
    html += `
            </div>
        </div>

        <script>
            // Update counters
            document.getElementById('totalBaseUnits').textContent = '${totalBase}';
            document.getElementById('totalAttachedUnits').textContent = '${totalAttached}';
            document.getElementById('totalVehicles').textContent = '${totalBase + totalAttached}';
        </script>
    </body>
    </html>
    `;

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
