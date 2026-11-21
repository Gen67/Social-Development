/**
 * utils.js
 * Small, pure helper functions with no dependency on app state.
 */
(function (SocialHub) {
    "use strict";

    /**
     * Shortens large numbers for display: 1200 -> "1.2K", 48200 -> "48K".
     * @param {number} value
     * @returns {string}
     */
    function formatNumber(value) {
        if (value < 1000) {
            return String(value);
        }
        const decimals = value >= 10000 ? 0 : 1;
        return (value / 1000).toFixed(decimals) + "K";
    }

    /**
     * Escapes user-provided text before inserting it into HTML.
     * Always use this for anything the user typed (captions, file names)
     * to prevent XSS.
     * @param {string} text
     * @returns {string}
     */
    function escapeHtml(text) {
        const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
        return String(text).replace(/[&<>"]/g, (char) => entities[char]);
    }

    /**
     * Returns a small colored dot for a platform.
     * @param {string} platformKey - key of SocialHub.PLATFORMS
     * @returns {string} HTML string
     */
    function platformDot(platformKey) {
        const color = SocialHub.PLATFORMS[platformKey].color;
        return `<span class="dot" style="background: ${color}"></span>`;
    }

    SocialHub.utils = { formatNumber, escapeHtml, platformDot };

})(window.SocialHub = window.SocialHub || {});