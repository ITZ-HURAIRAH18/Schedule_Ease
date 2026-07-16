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
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  // Same origin in all environments; the custom path /api/socket.io
  // routes through the Nginx /api/ proxy in production and Vite proxy in dev
  return "";
};