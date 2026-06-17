/**
 * Date utility functions to handle timezone-aware date parsing and formatting
 */

/**
 * Parse a date string (YYYY-MM-DD) in local timezone instead of UTC
 * This prevents dates from appearing one day earlier due to timezone conversion
 * 
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} Date object in local timezone
 */
export const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  
  // Split the date string to get year, month, day
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  
  // Create date in local timezone (month is 0-indexed)
  return new Date(year, month - 1, day);
};

/**
 * Format a date string to local date format
 * 
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string in local format
 */
export const formatLocalDate = (dateString) => {
  if (!dateString) return '-';
  
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString();
};

/**
 * Format a datetime string to local date and time format
 * 
 * @param {string} dateString - ISO datetime string
 * @returns {string} Formatted datetime string in local format
 */
export const formatLocalDateTime = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Made with Bob
