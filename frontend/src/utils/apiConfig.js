/**
 * Get the API base URL dynamically based on the current hostname.
 * This allows the app to work when accessed via localhost or network IP.
 */
export const getApiBaseUrl = () => {
  // If VITE_API_BASE is explicitly set, use it
  if (import.meta.env.VITE_API_BASE) {
    console.log('📍 Using explicit API URL from env:', import.meta.env.VITE_API_BASE);
    return import.meta.env.VITE_API_BASE;
  }

  // For development with Vite proxy, use empty string (relative URLs)
  // The Vite dev server will proxy /api requests to the backend
  if (import.meta.env.DEV) {
    console.log('📍 Using Vite proxy (relative URLs)');
    return '';
  }

  // Otherwise, derive from current window location
  const hostname = window.location.hostname;
  
  // When frontend runs on HTTPS (localhost:5173), backend HTTP runs on port 5001
  // When frontend runs on HTTP, backend HTTP runs on port 5000
  const isFrontendHTTPS = window.location.protocol === 'https:';
  const backendPort = isFrontendHTTPS ? '5001' : '5000';

  // Log for debugging
  console.log('🌐 API URL Detection:', {
    hostname,
    frontendProtocol: window.location.protocol,
    backendPort,
    fullLocation: window.location.href
  });

  // Use HTTP to connect to backend's HTTP server
  const url = `http://${hostname}:${backendPort}`;
  console.log('📍 Using API URL:', url);
  return url;
};

/**
 * Get the Socket.IO server URL (without the namespace path)
 */
export const getSocketUrl = () => {
  // For development with Vite proxy, use empty string (relative URLs)
  // The Vite dev server will proxy /socket.io requests to the backend
  if (import.meta.env.DEV) {
    return '';
  }
  
  return getApiBaseUrl();
};
