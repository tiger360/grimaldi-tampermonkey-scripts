// src/vehicle-handler/vehicleDom.js

(function() {
  'use strict';

  // Ensure the global namespace object exists
  window.VH = window.VH || {};

  const { vehicleConfig: CONFIG, vehicleMessages: MESSAGES, notifications, dom, utils, vehicleMain } = VH;
  const { show }    = notifications;
  const { getBookingDocument, setFieldValue, getTableRows, waitForNewRow } = dom;
  const { mapAttachmentType, mapPriority, DEBUG } = utils;

  /**
   * Field definitions for filling vehicle details
   */
  const VEHICLE_FIELDS = [
    { prefix: 'TextBox_MakeModel',       getValue: (veh, id, doc) => `${veh.makeModel} (${veh.fullName}) [${veh.vehicleType}]` },
    { prefix: 'HiddenField_MakeModel',   getValue: (veh, id, doc) => veh.makeModel },
    { prefix: 'TextBox_Year',            getValue: (veh, id, doc) => veh.year },
    { prefix: 'TextBox_Length',          getValue: (veh, id, doc) => veh.length },
    { prefix: 'TextBox_Width',           getValue: (veh, id, doc) => veh.width },
    { prefix: 'TextBox_Height',          getValue: (veh, id, doc) => veh.height },
    { prefix: 'TextBox_Weight',          getValue: (veh, id, doc) => veh.weight },
    { prefix: 'DropDownList_EngineType', getValue: (veh, id, doc) => veh.engineType },
    { prefix: 'DropDownList_Priority',   getValue: (veh, id, doc) => mapPriority(veh.priority) },
    { prefix: 'TextBox_Chassis',         getValue: (veh, id, doc) => veh.chassis },
    { prefix: 'TextBox_DoG',             getValue: (veh, id, doc) =>
        doc.getElementById('HiddenField_POD').value === 'CMDLA' // Consider making 'CMDLA' a constant
          ? veh.goodsDescriptionHS.hsCode
          : '.'
    },
    { prefix: 'HiddenField_DoG',         getValue: (veh, id, doc) =>
        doc.getElementById('HiddenField_POD').value === 'CMDLA' // Consider making 'CMDLA' a constant
          ? veh.goodsDescriptionHS.hsCode
          : '.'
    },
    { prefix: 'HiddenField_HSCodeList',  getValue: (veh, id, doc) =>
        `_${veh.goodsDescriptionHS.description}_${veh.goodsDescriptionHS.hsCode}`
    },
    { prefix: 'TextBox_ClientVID',       getValue: (veh, id, doc) => veh.clientVID },
    { prefix: 'TextBox_ClientVehicleID', getValue: (veh, id, doc) => veh.clientVID }
  ];

  const EXPECTED_FIELDS = VEHICLE_FIELDS.map(f => f.prefix);

  VH.vehicleDom = {
    isAddingVehicles: false,

    /**
     * Find a row ID by chassis input value.
     * @param {Document} doc
     * @param {string} chassis
     * @returns {string|null} the row suffix if found
     */
    findExistingChassis(doc, chassis) {
      const inputs = doc.querySelectorAll(`input[id^="${CONFIG.selectors.chassisPattern}"]`);
      for (const input of inputs) {
        if (input.value === chassis) {
          const match = input.id.match(
            new RegExp(`${CONFIG.selectors.chassisPattern}(.*)`)
          );
          if (match && match[1]) return match[1];
        }
      }
      return null;
    },

    /**
     * Given a chassis number, locate its vehicle data from the clipboard store.
     * @param {string} chassis
     * @returns {Object|null}
     */
    findVehicleDataByChassis(chassis) {
      const vehicles = vehicleMain.vehiclesFromClipboard || [];
      for (const combo of vehicles) {
        if (combo.baseUnit.chassis === chassis) {
          return combo.baseUnit;
        }
        if (combo.attachedUnits) {
          const found = combo.attachedUnits.find(u => u.chassis === chassis);
          if (found) return found;
        }
      }
      return null;
    },

    /**
     * After cloning a cell, populate clientVID / clientVehicleID if applicable.
     */
    applyVehicleDataToCell(doc, rowId, newCell, cellSuffix) {
      const isNew = rowId.includes('NEW_');
      const cleanId = isNew ? rowId.replace('NEW_', '') : rowId;
      const chassisInput = doc.getElementById(
        `TextBox_Chassis_${isNew ? 'NEW_' : ''}${cleanId}`
      );
      if (!chassisInput?.value) return false;

      const vehicleData = this.findVehicleDataByChassis(chassisInput.value);
      if (!vehicleData) return false;

      if (cellSuffix === 'cell_14' || cellSuffix === 'cell_16') {
        const inp = newCell.querySelector('input');
        if (inp) {
          inp.value = vehicleData.clientVID || '';
          return true;
        }
      }
      return false;
    },

    /**
     * Ensure that each required cell exists in the newly added row; clone from a template row if missing.
     */
    ensureAllCellsExist(doc, rowId) {
      DEBUG.log('Ensuring Cells Exist', rowId);

      const isNew = rowId.includes('NEW_');
      const cleanId = isNew ? rowId.replace('NEW_', '') : rowId;
      const rowEl = doc.getElementById(`tr_${rowId}`);
      if (!rowEl) {
        DEBUG.error('Row Not Found', `tr_${rowId}`);
        return false;
      }

      // Pick any other row as template
      const otherRows = getTableRows(doc, CONFIG.selectors.rowPattern)
        .filter(r => r.id !== `tr_${rowId}`);
      if (!otherRows.length) {
        DEBUG.error('No template rows found');
        return false;
      }
      const template = otherRows[0];
      const m = template.id.match(/tr_(?:NEW_)?(\d+)/);
      if (!m) {
        DEBUG.error('Invalid template row ID', template.id);
        return false;
      }
      const tplNum = m[1];
      const tplIsNew = template.id.includes('NEW_');
      const tplPrefix = tplIsNew ? 'NEW_' : '';

      // Gather existing cell IDs
      const existing = Array.from(rowEl.querySelectorAll('td'))
                           .map(td => td.id)
                           .filter(id => id && id.includes('cell_'));
      let added = 0;

      for (const suffix of CONFIG.attributes.requiredCells) {
        if (!existing.some(id => id.endsWith(suffix))) {
          const tplCellId = `tr_${tplPrefix}${tplNum}_${suffix}`;
          const tplCell   = doc.getElementById(tplCellId);
          if (!tplCell) {
            DEBUG.error('Template Cell Not Found', tplCellId);
            continue;
          }
          const newCell = tplCell.cloneNode(true);
          newCell.id = `tr_${rowId}_${suffix}`;

          // Rewrite any id/name attributes inside the cell HTML
          let html = newCell.innerHTML;
          html = html.replace(
            new RegExp(`(id|name)="([^"]*?)${tplPrefix}${tplNum}([^"]*?)"`, 'g'),
            (_, attr, pre, post) => `${attr}="${pre}${isNew ? 'NEW_' : ''}${cleanId}${post}"`
          );
          html = html.replace(
            new RegExp(`(id|name)="([^"]*?)${tplNum}([^"]*?)"`, 'g'),
            (_, attr, pre, post) => `${attr}="${pre}${cleanId}${post}"`
          );
          newCell.innerHTML = html;

          // Populate ClientVID if that's the kind of cell
          this.applyVehicleDataToCell(doc, rowId, newCell, suffix);

          rowEl.appendChild(newCell);
          DEBUG.log('Added Cell', { cellId: newCell.id, suffix });
          added++;
        }
      }

      if (added > 0) {
        DEBUG.log('Cells Added', { rowId, count: added });
        return true;
      }
      return false;
    },

    /**
     * Fill all the standard vehicle detail fields in a row.
     */
    async fillVehicleDetails(doc, rowId, vehicle) {
      DEBUG.log('Filling Vehicle Details', { rowId, vehicle });
      const id = rowId.replace(/^tr_/, '');
      let ok = true;
      for (const field of VEHICLE_FIELDS) {
        const value = field.getValue(vehicle, id, doc);
        ok = ok && setFieldValue(doc, `${field.prefix}_${id}`, value);
      }
      // optional license plate
      if (vehicle.registration) {
        ok = ok && setFieldValue(doc, `TextBox_LicencePlate_${id}`, vehicle.registration);
      }
      if (!ok) {
        DEBUG.error('Failed to set all vehicle details', vehicle);
      }
      return ok;
    },

    /**
     * Add one base vehicle, then its attachments, skipping any already present.
     */
    async addSingleVehicleWithAttachments(baseVehicle, attachedUnits, summary) {
      DEBUG.log('Starting New Vehicle Addition', baseVehicle.makeModel);

      try {
        let doc = getBookingDocument();

        if (!this.verifyFirstRowStructure(doc)) {
          throw new Error('Page structure mismatch');
        }

        const beforeIds = getTableRows(doc, CONFIG.selectors.rowPattern).map(r => r.id);
        let rowId = this.findExistingChassis(doc, baseVehicle.chassis);

        // Add base unit if not already present
        if (!rowId) {
          const btn = doc.querySelector(CONFIG.selectors.addNewLineButton);
          if (!btn) throw new Error('AddNewLine button not found');
          btn.click();

          const { doc: newDoc, newRowId } = await waitForNewRow(beforeIds, CONFIG.selectors.rowPattern);
          doc   = newDoc; // Update doc reference
          rowId = newRowId.replace(/^tr_/, '');

          await this.fillVehicleDetails(doc, newRowId, baseVehicle);
          summary.addedBase.push(baseVehicle.chassis);
          await new Promise(r => setTimeout(r, CONFIG.delays.afterDropdownClick));
        } else {
          DEBUG.log('Using existing vehicle', { chassis: baseVehicle.chassis, rowId });
          show(MESSAGES.usingExistingVehicle(baseVehicle.chassis), 'info');
          summary.skippedBase.push(baseVehicle.chassis);
        }

        // Attach any piggybacks/trailers
        if (attachedUnits?.length) {
          for (const unit of attachedUnits) {
            const exist = this.findExistingChassis(doc, unit.chassis);
            if (exist) {
              DEBUG.log('Attachment exists', { chassis: unit.chassis, rowId: exist });
              show(MESSAGES.attachmentExists(unit.chassis), 'info');
              summary.skippedAttachments.push(unit.chassis);
              continue;
            }
            // Need to re-get doc inside loop in case adding attachment reloads it
            doc = getBookingDocument();
            await this.addAttachmentToVehicle(doc, rowId, unit);
            await new Promise(r => setTimeout(r, CONFIG.delays.afterDropdownClick));
            summary.addedAttachments.push(unit.chassis);
          }
        }

        return true;
      } catch (err) {
        DEBUG.error('Vehicle Addition Error', err);
        throw err; // Re-throw to be caught by the main processing loop
      }
    },

    /**
     * Click the dropdown on a base row, choose the attachment type, and fill its details.
     */
    async addAttachmentToVehicle(doc, baseNumericId, attachedUnit) {
      try {
        // Ensure doc is fresh before interacting
        doc = getBookingDocument();

        let dropdown = doc.querySelector(`#dropdown_${baseNumericId}`)
                    || doc.querySelector(`#dropdown_NEW_${baseNumericId}`);
        if (!dropdown) {
          DEBUG.error('Dropdown not found', { baseNumericId });
          return false;
        }

        const beforeIds = getTableRows(doc, CONFIG.selectors.rowPattern).map(r => r.id);
        dropdown.click();

        const mappedType = mapAttachmentType(attachedUnit.type);
        const btn = await this.findAttachmentButton(doc, baseNumericId, mappedType);
        if (!btn) {
          DEBUG.error('Attach button not found', { type: attachedUnit.type });
          // Attempt to close the dropdown if button not found?
          return false;
        }

        btn.click();
        const { doc: newDoc, newRowId } = await waitForNewRow(beforeIds, CONFIG.selectors.rowPattern);
        doc = newDoc; // Update doc reference

        await this.fillVehicleDetails(doc, newRowId, attachedUnit);
        return true;
      } catch (err) {
        DEBUG.error('Add Attachment Error', err);
        return false;
      }
    },

    /**
     * Locate the button element that corresponds to a given attachment type.
     */
    async findAttachmentButton(doc, baseNumericId, attachmentType) {
      // try exact match
      let btn = doc.querySelector(
        `[onclick*="${attachmentType}"][onclick*="${baseNumericId}"]`
      ) || doc.querySelector(
        `[onclick*="${attachmentType}"][onclick*="NEW_${baseNumericId}"]`
      );

      // fallback: search by text or partial match
      if (!btn) {
        const candidates = Array.from(doc.querySelectorAll(`[onclick*="${baseNumericId}"]`));
        for (const c of candidates) {
          if (this.isProbablyForAttachmentType(c.getAttribute('onclick')||'', c.textContent||'', attachmentType)) {
            btn = c;
            break;
          }
        }
      }

      return btn;
    },

    /**
     * Heuristic to match a button’s onclick or text to a given attachment type.
     */
    isProbablyForAttachmentType(onclickText, buttonText, desiredType) {
      onclickText = onclickText.toLowerCase();
      buttonText  = buttonText.toLowerCase();
      const dt = desiredType.toLowerCase();

      if (dt.includes('piggy')) {
        return onclickText.includes('piggy') || buttonText.includes('piggy');
      }
      if (dt.includes('attach') || dt.includes('tr')) {
        return onclickText.includes('trailer') || buttonText.includes('trailer')
            || (onclickText.includes('attach') && onclickText.includes('tr'))
            || (buttonText.includes('attach') && buttonText.includes('tr'));
      }
      return onclickText.includes(dt) || buttonText.includes(dt);
    },

    /**
     * Verify that the very first booking row has all expected fields.
     */
    verifyFirstRowStructure(doc) {
      const rows = getTableRows(doc, CONFIG.selectors.rowPattern);
      if (!rows.length) {
        show(MESSAGES.bookingTableEmpty(), 'error'); // Call the function
        return false;
      }
      const suffix = rows[0].id.replace(/^tr_/, '');
      const missing = EXPECTED_FIELDS.filter(prefix => !doc.getElementById(`${prefix}_${suffix}`));
      if (missing.length) {
        show(MESSAGES.pageStructureMismatch(missing), 'error');
        return false;
      }
      return true;
    },

    /**
     * Scan every row and clone any missing cells from a template.
     */
    async fixAllRowsMissingCells() {
      if (this.isAddingVehicles) {
        DEBUG.log('Skipping fix missing cells during addition');
        return false;
      }

      let doc;
      try {
        doc = getBookingDocument();
      } catch {
        DEBUG.error('Fix Missing Cells', 'Booking document not accessible');
        return false;
      }

      const rows = getTableRows(doc, CONFIG.selectors.rowPattern);
      let fixes = 0;
      for (const r of rows) {
        const rid = r.id.replace(/^tr_/, '');
        if (this.ensureAllCellsExist(doc, rid)) fixes++;
      }
      if (fixes > 0) {
        show(`Fixed missing cells in ${fixes} row(s)`, 'success');
      }
      return fixes > 0;
    },

    /**
     * Click the “Add Units From File” button if present.
     */
    async clickAddUnitsFromFileButton() {
      try {
        const doc = getBookingDocument();
        const btn = Array.from(doc.querySelectorAll('input[type="button"],button'))
          .find(b => (b.value || b.textContent).includes('Add Units From File'));
        if (!btn) return false;
        btn.click();
        show(MESSAGES.clickedAddUnits, 'success');
        return true;
      } catch (err) {
        DEBUG.error('Click Add Units Error', err);
        return false;
      }
    }
  };

})();
      return false;
    }
  },

  /**
   * Locate the button element that corresponds to a given attachment type.
   */
  async findAttachmentButton(doc, baseNumericId, attachmentType) {
    // try exact match
    let btn = doc.querySelector(
      `[onclick*="${attachmentType}"][onclick*="${baseNumericId}"]`
    ) || doc.querySelector(
      `[onclick*="${attachmentType}"][onclick*="NEW_${baseNumericId}"]`
    );

    // fallback: search by text or partial match
    if (!btn) {
      const candidates = Array.from(doc.querySelectorAll(`[onclick*="${baseNumericId}"]`));
      for (const c of candidates) {
        if (this.isProbablyForAttachmentType(c.getAttribute('onclick')||'', c.textContent||'', attachmentType)) {
          btn = c;
          break;
        }
      }
    }

    return btn;
  },

  /**
   * Heuristic to match a button’s onclick or text to a given attachment type.
   */
  isProbablyForAttachmentType(onclickText, buttonText, desiredType) {
    onclickText = onclickText.toLowerCase();
    buttonText  = buttonText.toLowerCase();
    const dt = desiredType.toLowerCase();

    if (dt.includes('piggy')) {
      return onclickText.includes('piggy') || buttonText.includes('piggy');
    }
    if (dt.includes('attach') || dt.includes('tr')) {
      return onclickText.includes('trailer') || buttonText.includes('trailer')
          || (onclickText.includes('attach') && onclickText.includes('tr'))
          || (buttonText.includes('attach') && buttonText.includes('tr'));
    }
    return onclickText.includes(dt) || buttonText.includes(dt);
  },

  /**
   * Verify that the very first booking row has all expected fields.
   */
  verifyFirstRowStructure(doc) {
    const rows = getTableRows(doc, CONFIG.selectors.rowPattern);
    if (!rows.length) {
      show(MESSAGES.bookingTableEmpty, 'error');
      return false;
    }
    const suffix = rows[0].id.replace(/^tr_/, '');
    const missing = EXPECTED_FIELDS.filter(prefix => !doc.getElementById(`${prefix}_${suffix}`));
    if (missing.length) {
      show(MESSAGES.pageStructureMismatch(missing), 'error');
      return false;
    }
    return true;
  },

  /**
   * Scan every row and clone any missing cells from a template.
   */
  async fixAllRowsMissingCells() {
    if (this.isAddingVehicles) {
      DEBUG.log('Skipping fix missing cells during addition');
      return false;
    }

    let doc;
    try {
      doc = getBookingDocument();
    } catch {
      DEBUG.error('Fix Missing Cells', 'Booking document not accessible');
      return false;
    }

    const rows = getTableRows(doc, CONFIG.selectors.rowPattern);
    let fixes = 0;
    for (const r of rows) {
      const rid = r.id.replace(/^tr_/, '');
      if (this.ensureAllCellsExist(doc, rid)) fixes++;
    }
    if (fixes > 0) {
      show(`Fixed missing cells in ${fixes} row(s)`, 'success');
    }
    return fixes > 0;
  },

  /**
   * Click the “Add Units From File” button if present.
   */
  async clickAddUnitsFromFileButton() {
    try {
      const doc = getBookingDocument();
      const btn = Array.from(doc.querySelectorAll('input[type="button"],button'))
        .find(b => (b.value || b.textContent).includes('Add Units From File'));
      if (!btn) return false;
      btn.click();
      show(MESSAGES.clickedAddUnits, 'success');
      return true;
    } catch (err) {
      DEBUG.error('Click Add Units Error', err);
      return false;
    }
  }
};
