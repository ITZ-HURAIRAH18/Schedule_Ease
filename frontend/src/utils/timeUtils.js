/**
 * Timezone utility functions
 * Ensures consistent time handling across the app
 */

/**
 * Format a date/time to user's local timezone
 * Input: ISO string or Date object (in UTC)
 * Output: "Jan 15, 2026"
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

/**
 * Format time to user's local timezone
 * Input: ISO string, Date object, or HH:mm string
 * Output: "2:30 PM"
 */
export const formatTime = (dateInput) => {
  if (!dateInput) return "";
  
  // Handle HH:mm strings (like availability slots)
  if (typeof dateInput === 'string' && dateInput.length === 5 && dateInput.includes(':')) {
    const [hours, minutes] = dateInput.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  
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
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  return `${formatDate(dateInput)} at ${formatTime(dateInput)}`;
};

/**
 * Convert local "YYYY-MM-DDTHH:mm" to ISO string (UTC)
 * This is used when submitting form data from a datetime-local input
 */
export const localToUTC = (localDatetimeString) => {
  if (!localDatetimeString) return "";
  
  // Format from <input type="datetime-local"> is YYYY-MM-DDTHH:mm
  const [datePart, timePart] = localDatetimeString.split("T");
  if (!datePart || !timePart) return "";
  
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  
  // Create Date object in local timezone
  // Note: month is 0-indexed in JS Date constructor
  const localDate = new Date(year, month - 1, day, hours, minutes, 0);
  
  if (isNaN(localDate.getTime())) return "";
  
  // .toISOString() returns the UTC representation
  return localDate.toISOString();
};

/**
 * Get user's current browser timezone
 */
export const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch (e) {
    return "UTC";
  }
};

/**
 * Calculate end time from start time + duration (in minutes)
 * Input: local "YYYY-MM-DDTHH:mm"
 * Output: local "YYYY-MM-DDTHH:mm"
 */
export const calculateEndTime = (localStartString, durationMinutes) => {
  if (!localStartString || isNaN(durationMinutes)) return "";
  
  const [datePart, timePart] = localStartString.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  
  const startDate = new Date(year, month - 1, day, hours, minutes);
  const endDate = new Date(startDate.getTime() + Number(durationMinutes) * 60000);
  
  // Return in "YYYY-MM-DDTHH:mm" format for datetime-local input
  const pad = (num) => String(num).padStart(2, '0');
  
  return `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
};
