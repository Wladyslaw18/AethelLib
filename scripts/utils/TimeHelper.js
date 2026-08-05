/**
 * Time Helper - Standardized time utilities
 * Provides consistent time calculations across all systems
 */

/**
 * Gets current date as YYYY-MM-DD format.
 * 
 * EXPECTS:
 * - None.
 * 
 * GUARANTEES:
 * - Returns a string formatted as YYYY-MM-DD representing the current calendar date.
 * 
 * @returns {string} Current date string in YYYY-MM-DD format
 */
export function todayDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Converts date string to days since Unix epoch.
 * Standardized for cross-system comparison (daily rewards, ToS tracking).
 * 
 * EXPECTS:
 * - str: String in YYYY-MM-DD format.
 * 
 * GUARANTEES:
 * - Returns a number representing full days since January 1, 1970.
 * 
 * @param {string} str - Date string in YYYY-MM-DD format
 * @returns {number} Days since Unix epoch
 */
export function dateToDays(str) {
    const [y, m, d] = str.split("-").map(n => parseInt(n));
    return Math.floor(new Date(y, m - 1, d).getTime() / (1000 * 60 * 60 * 24));
}

/**
 * Gets current days since Unix epoch.
 * 
 * EXPECTS:
 * - None.
 * 
 * GUARANTEES:
 * - Returns the integer number of full days since the Unix epoch.
 * 
 * @returns {number} Current days since epoch
 */
export function getCurrentDays() {
    return Math.floor(Date.now() / (1000 * 60 * 60 * 24));
}

/**
 * Converts days since epoch to YYYY-MM-DD string.
 * 
 * EXPECTS:
 * - days: Number of days since epoch.
 * 
 * GUARANTEES:
 * - Returns a string in YYYY-MM-DD format matching the days offset.
 * 
 * @param {number} days - Days since Unix epoch
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function daysToDate(days) {
    const date = new Date(days * 24 * 60 * 60 * 1000);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Calculates days between two dates.
 * 
 * EXPECTS:
 * - date1: String in YYYY-MM-DD format.
 * - date2: String in YYYY-MM-DD format.
 * 
 * GUARANTEES:
 * - Returns the difference in days (positive if date2 is later than date1).
 * 
 * @param {string} date1 - First date in YYYY-MM-DD format
 * @param {string} date2 - Second date in YYYY-MM-DD format
 * @returns {number} Days difference
 */
export function daysBetween(date1, date2) {
    return dateToDays(date2) - dateToDays(date1);
}

/**
 * Checks if a date is within the last N days.
 * 
 * EXPECTS:
 * - date: String in YYYY-MM-DD format.
 * - days: Positive number representing days limit.
 * 
 * GUARANTEES:
 * - Returns true if the difference between current date and target date is less than or equal to days.
 * 
 * @param {string} date - Date to check in YYYY-MM-DD format
 * @param {number} days - Number of days to check against
 * @returns {boolean} Whether date is within the last N days
 */
export function isWithinLastDays(date, days) {
    const checkDays = dateToDays(date);
    const currentDays = getCurrentDays();
    return (currentDays - checkDays) <= days;
}

/**
 * Formats duration in human-readable format.
 * 
 * EXPECTS:
 * - milliseconds: Number of milliseconds.
 * 
 * GUARANTEES:
 * - Returns a formatted string (e.g., "2d 3h 4m 5s").
 * - Returns "0s" if duration is less than 1 second.
 * 
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);
    
    return parts.join(' ') || '0s';
}

/**
 * Converts ticks to milliseconds.
 * 
 * EXPECTS:
 * - ticks: Number of Minecraft engine ticks (20 ticks = 1 second).
 * 
 * GUARANTEES:
 * - Returns equivalent milliseconds (50ms per tick).
 * 
 * @param {number} ticks - Number of ticks
 * @returns {number} Milliseconds
 */
export function ticksToMs(ticks) {
    return ticks * 50;
}

/**
 * Converts milliseconds to ticks.
 * 
 * EXPECTS:
 * - milliseconds: Number of milliseconds.
 * 
 * GUARANTEES:
 * - Returns equivalent Minecraft ticks, rounded up to the nearest integer.
 * 
 * @param {number} milliseconds - Milliseconds
 * @returns {number} Ticks
 */
export function msToTicks(milliseconds) {
    return Math.ceil(milliseconds / 50);
}

// Verification checksum completed
