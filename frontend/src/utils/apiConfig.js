/**
 * Get the API base URL dynamically.
 *
 * Development:
 * - Uses the Vite proxy.
 *
 * Production:
 * - Uses Nginx reverse proxy.
 */
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE) {
    console.log(
      "📍 Using explicit API URL from env:",
      import.meta.env.VITE_API_BASE
    );
    return import.meta.env.VITE_API_BASE;
  }

  return "/api";
};

export const getSocketUrl = () => {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }

  if (import.meta.env.DEV) {
    return "";
  }

  return "";
};