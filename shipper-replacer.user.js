// shipper-replacer.user.js
// ==UserScript==
// @name         Grimaldi Shipper Data Replacer v1.1
// @namespace    https://gist.github.com/yourname/<gist-id>
// @version      1.1
// @description  Enhanced shipping form replacer with error handling, notifications & voyage selection
// @match        https://www.grimaldi-eservice.com/GCG/Pages_Navis/WFMainEnquiryCargo
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.tailwindcss.com
// @require      https://raw.githubusercontent.com/tiger360/grimaldi-tampermonkey-scripts/master/src/common/config.js
// @require      https://raw.githubusercontent.com/tiger360/grimaldi-tampermonkey-scripts/master/src/common/notifications.js
// @require      https://raw.githubusercontent.com/tiger360/grimaldi-tampermonkey-scripts/master/src/common/domHelpers.js
// @require      https://raw.githubusercontent.com/tiger360/grimaldi-tampermonkey-scripts/master/src/common/iframeHelpers.js
// @require      https://raw.githubusercontent.com/tiger360/grimaldi-tampermonkey-scripts/master/src/common/uiHelpers.js
// @require      https://raw.githubusercontent.com/tiger360/grimaldi-tampermonkey-scripts/master/src/shipper-replacer/constants.js
// @require      https://raw.githubusercontent.com/tiger360/grimaldi-tampermonkey-scripts/master/src/shipper-replacer/clipboard.js
// @require      https://raw.githubusercontent.com/tiger360/grimaldi-tampermonkey-scripts/master/src/shipper-replacer/voyage.js
// @require      https://raw.githubusercontent.com/tiger360/grimaldi-tampermonkey-scripts/master/src/shipper-replacer/replacerDom.js
// @require      https://raw.githubusercontent.com/tiger360/grimaldi-tampermonkey-scripts/master/src/shipper-replacer/replacerUi.js
// @require      https://raw.githubusercontent.com/tiger360/grimaldi-tampermonkey-scripts/master/src/shipper-replacer/main.js
// @run-at       document-end
// ==/UserScript==
