/**
 * Timezone utility functions
 * Ensures consistent time handling across the app
 */

/**
 * Format a date/time to user's local timezone
 * Input: ISO string or Date object (in UTC)
 * Output: "Jan 15, 2026" or "2:30 PM"
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const formatTime = (dateInput) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

/**
 * Format datetime as "Jan 15, 2026 at 2:30 PM"
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return "";
  return `${formatDate(dateInput)} at ${formatTime(dateInput)}`;
};

/**
 * Convert local datetime-local input to ISO string (UTC)
 * When user picks time in their browser, it's local time
 * We need to send UTC to backend
 */
export const localToUTC = (localDatetimeString) => {
  if (!localDatetimeString) return "";
  // localDatetimeString is like "2026-04-16T14:21" (local time from input)
  const localDate = new Date(localDatetimeString);
  // This creates a Date assuming the string is already in UTC
  // But we need to treat it as local time
  const utcDate = new Date(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth(),
    localDate.getUTCDate(),
    localDate.getUTCHours(),
    localDate.getUTCMinutes()
  );
  return utcDate.toISOString();
};

/**
 * Get user's timezone
 */
export const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Calculate end time from start time + duration (in minutes)
 * Properly handles timezone by working in UTC
 */
export const calculateEndTime = (startISOString, durationMinutes) => {
  if (!startISOString || !durationMinutes) return "";
  const startDate = new Date(startISOString);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return endDate.toISOString();
};

/**
 * Convert datetime-local HTML input to proper ISO format
 * The input value is in "YYYY-MM-DDTHH:mm" format (local time)
 * This function treats it as UTC for backend storage
 */
export const datetimeLocalToISO = (datetimeLocalValue) => {
  if (!datetimeLocalValue) return "";
  // Simply add Z to treat as UTC
  return `${datetimeLocalValue}:00Z`;
};
