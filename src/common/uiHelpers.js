// src/common/uiHelpers.js

(function() {
  'use strict';

  // Ensure the global namespace object exists
  window.VH = window.VH || {};
  const { CONFIG } = VH;

  /**
   * UI‐related helper functions:
   *  - injecting CSS
   *  - creating floating buttons
   *  - adding simple tooltips
   */
  VH.ui = {
    /**
     * Injects a block of CSS into a <style> tag in the document head.
     * @param {string} css – the CSS rules to insert
     * @returns {HTMLStyleElement} the <style> element created
     */
    injectStyles(css) {
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
      return style;
    },

    /**
     * Creates a floating button in the bottom‐right (by default) of the page.
     * @param {string} id       – element ID for the button
     * @param {string} label    – textContent of the button
     * @param {Function} onClick – click handler
     * @param {Object} [styles] – optional CSS overrides, e.g. { background: "#f00" }
     * @returns {HTMLButtonElement}
     */
    createFloatingButton(id, label, onClick, styles = {}) {
      const btn = document.createElement("button");
      btn.id = id;
      btn.textContent = label;
      // default positioning & look
      btn.style.position = "fixed";
      btn.style.bottom   = CONFIG.ui.buttonPosition.bottom;
      btn.style.right    = CONFIG.ui.buttonPosition.right;
      btn.style.padding  = "8px 12px";
      btn.style.border   = "none";
      btn.style.borderRadius = "4px";
      btn.style.background   = "#3B82F6"; // Consider moving color to CONFIG
      btn.style.color        = "#fff";
      btn.style.cursor       = "pointer";
      btn.style.zIndex       = "10000"; // Consider moving z-index to CONFIG
      // apply any overrides
      Object.entries(styles).forEach(([prop, val]) => {
        btn.style[prop] = val;
      });
      btn.addEventListener("click", onClick);
      document.body.appendChild(btn);
      return btn;
    },

    /**
     * Attaches a native tooltip (title attribute) to a DOM element.
     * @param {Element} el   – the element to annotate
     * @param {string} text  – the tooltip text
     */
    addTooltip(el, text) {
      if (el) {
        el.title = text;
      }
    }
  };

})();
