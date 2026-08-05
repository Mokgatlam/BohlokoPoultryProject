/**
 * Admin Shared Utilities
 * ======================
 * 
 * SRS Reference: FR-015 through FR-023 - Shared Admin Functions
 * 
 * Common utility functions used across all admin pages. Provides
 * XSS protection, UI helpers, formatting, and authentication.
 * 
 * Functions:
 *   - escapeHtml(): XSS prevention via HTML entity encoding
 *   - toggleSidebar(): Mobile sidebar navigation toggle
 *   - logout(): Authentication cleanup and redirect
 *   - formatCurrency(): South African Rand formatting
 *   - formatDate(): Date formatting (en-ZA locale)
 *   - formatDateTime(): DateTime formatting (en-ZA locale)
 *   - showAlert(): Toast notification display
 * 
 * Coding Principles Demonstrated:
 *   1. DRY (Don't Repeat Yourself)
 *      - These utilities are shared across 20+ admin pages
 *      - Avoids duplicating formatting logic in each page
 * 
 *   2. Security: XSS Prevention
 *      - escapeHtml() uses DOM API (not regex) for encoding
 *      - createTextNode() handles all special characters correctly
 * 
 *   3. Localization
 *      - en-ZA locale for currency and date formatting
 *      - Rand (R) symbol for South African context
 * 
 *   4. Progressive Enhancement
 *      - Functions work without any external dependencies
 *      - Safe for use in any page that includes this script
 */

/**
 * Escape HTML special characters to prevent XSS attacks.
 * 
 * Principle: DOM-Based Encoding
 * Uses createTextNode() + innerHTML to properly encode ALL special
 * characters (<, >, &, ", ', etc.) without manual regex replacement.
 * This is the recommended approach for XSS prevention.
 * 
 * @param {string} str - Raw string to escape
 * @returns {string} HTML-safe encoded string
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

/**
 * Toggle the mobile sidebar navigation.
 * 
 * Principle: CSS Class Toggle
 * Uses classList.toggle() for declarative state management.
 * The sidebar and overlay share a coordinated open/close state.
 */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.querySelector('.sidebar-overlay').classList.toggle('active');
}

/**
 * Log out the current user and redirect to login.
 * 
 * Principle: Graceful Degradation
 * Calls api.auth.logout() if available, but always clears localStorage
 * and redirects regardless of API success. This ensures logout works
 * even if the API is unreachable.
 */
function logout() {
    if (typeof api !== 'undefined' && api.auth && api.auth.logout) {
        api.auth.logout().catch(() => {}); // Fire-and-forget
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = getLoginPath();
}

/**
 * Format a number as South African Rand currency.
 * 
 * Principle: Localization
 * Uses en-ZA locale for consistent formatting with the farm's location.
 * 
 * @param {number} amount - Numeric amount
 * @returns {string} Formatted string (e.g., "R1,234.56")
 */
function formatCurrency(amount) {
    return 'R' + (amount || 0).toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Format a date string to short date format.
 * 
 * @param {string} dateStr - ISO 8601 date string
 * @returns {string} Formatted date (e.g., "2026/08/05")
 */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-ZA');
}

/**
 * Format a date string to full datetime format.
 * 
 * @param {string} dateStr - ISO 8601 date string
 * @returns {string} Formatted datetime (e.g., "2026/08/05 14:30:00")
 */
function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-ZA');
}

/**
 * Display a temporary toast notification.
 * 
 * Principle: Non-Intrusive Feedback
 * Creates a fixed-position alert that auto-dismisses after 5 seconds.
 * Uses Bootstrap alert classes for consistent styling.
 * 
 * @param {string} message - Notification message
 * @param {string} type - Bootstrap alert type (success, danger, warning, info)
 */
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top:20px;right:20px;z-index:9999;min-width:300px;';
    alert.innerHTML = `${escapeHtml(message)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}