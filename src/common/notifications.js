// src/common/notifications.js

(function() {
  'use strict';

  // Ensure the global namespace object exists
  window.VH = window.VH || {};
  const { CONFIG } = VH;

  /**
   * In‐page notifications and ntfy.sh push notifications
   */
  VH.notifications = {
    /**
     * Show a temporary in‐page notification.
     *
     * Relies on CSS classes:
     *   .notification
     *   .notification.success
     *   .notification.error
     *   .notification.warning
     *
     * @param {string} message  The text to display
     * @param {string} [type="success"]  One of "success" | "error" | "warning" | "info"
     * @param {number} [duration=CONFIG.ui.notificationDuration]  Milliseconds to display
     * @returns {HTMLDivElement}  The notification element
     */
    show(message, type = "success", duration = CONFIG.ui.notificationDuration) {
      // Remove existing notifications
      document.querySelectorAll(".notification").forEach(n => {
        n.style.opacity = "0";
        setTimeout(() => n.remove(), 300); // Consider moving fade time to CONFIG
      });

      // Create new
      const notif = document.createElement("div");
      notif.className = `notification ${type}`;
      notif.textContent = message;
      document.body.appendChild(notif);

      // Auto‐hide
      setTimeout(() => {
        notif.style.opacity = "0";
        setTimeout(() => notif.remove(), 300); // Consider moving fade time to CONFIG
      }, duration);

      return notif;
    },

    /**
     * Send a push notification via ntfy.sh
     *
     * Requires GM_xmlhttpRequest to be granted.
     *
     * @param {string} message        The message body
     * @param {string} [priority="default"]  ntfy priority header
     * @param {Object|null} [clipboardData] Optional data with forwarderRef for title
     */
    sendNtfy(message, priority = "default", clipboardData = null) {
      const topicUrl = CONFIG.ntfy.url + CONFIG.ntfy.topic;

      // Build title
      let title = "Grimaldi Notification";
      if (clipboardData && clipboardData.forwarderRef) {
        title += ` — Ref: ${clipboardData.forwarderRef}`;
      }

      // Timestamp
      const now = new Date();
      const pad = n => n.toString().padStart(2, "0");
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      GM_xmlhttpRequest({
        method: "POST",
        url: topicUrl,
        headers: {
          "Content-Type": "text/plain",
          Priority: priority,
          Title:    `${title} @ ${dateStr}`
        },
        data: `[${dateStr}] ${message}`,
        onerror: (err) => {
          console.error("ntfy.sh error:", err);
        }
      });
    }
  };

})();
