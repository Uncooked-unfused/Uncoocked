/**
 * Utility functions for standardized DD/MM/YYYY date formatting across the app.
 */

/**
 * Format a date to DD/MM/YYYY (e.g. 20/06/2026)
 * @param {string | number | Date | null | undefined} dateInput
 * @param {object} [options]
 * @param {boolean} [options.includeTime=false] - Whether to include time as DD/MM/YYYY, HH:mm
 * @param {string} [options.fallback="TBA"]
 * @returns {string}
 */
export function formatDate(dateInput, options = {}) {
  const { includeTime = false, fallback = "TBA" } = options;
  if (!dateInput && dateInput !== 0) return fallback;

  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (!trimmed) return fallback;

    // If already in DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return typeof dateInput === "string" ? dateInput : fallback;
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const dateFormatted = `${day}/${month}/${year}`;

  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${dateFormatted}, ${hours}:${minutes}`;
  }

  return dateFormatted;
}

/**
 * Format a date with time to DD/MM/YYYY, HH:mm (e.g. 20/06/2026, 14:30)
 * @param {string | number | Date | null | undefined} dateInput
 * @param {string} [fallback="TBA"]
 * @returns {string}
 */
export function formatDateTime(dateInput, fallback = "TBA") {
  return formatDate(dateInput, { includeTime: true, fallback });
}
