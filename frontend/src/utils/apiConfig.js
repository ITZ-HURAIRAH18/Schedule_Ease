/**
 * Get the API base URL dynamically based on the current hostname.
 * This allows the app to work when accessed via localhost or network IP.
 */
export const getApiBaseUrl = () => {
  // If VITE_API_BASE is explicitly set, use it
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }

  // Otherwise, derive from current window location
  const hostname = window.location.hostname;
  const port = '5000'; // Backend port

  // Log for debugging
  console.log('🌐 API URL Detection:', {
    hostname,
    port,
    fullLocation: window.location.href
  });

  // For localhost development, ALWAYS use HTTP (backend uses self-signed HTTPS certs)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const url = `http://${hostname}:${port}`;
    console.log('📍 Using localhost API URL:', url);
    return url;
  }

  // For network IPs (including mobile), use HTTP
  const url = `http://${hostname}:${port}`;
  console.log('📍 Using network API URL:', url);
  return url;
};

/**
 * Get the Socket.IO server URL (without the namespace path)
 */
export const getSocketUrl = () => {
  return getApiBaseUrl();
};
