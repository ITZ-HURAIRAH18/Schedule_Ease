/**
 * Get the API base URL dynamically based on the environment.
 *
 * Priority:
 * 1. VITE_API_BASE environment variable (explicit override)
 * 2. Vite dev server proxy (development - relative URLs)
 * 3. Fallback production URL (hardcoded backend URL)
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

  // Production fallback: use the deployed backend URL
  // When deployed on Vercel, the frontend should always talk to the backend's Vercel URL
  const productionBackendUrl = 'https://schedule-ease-zeta.vercel.app';
  console.log('📍 Using production backend URL:', productionBackendUrl);
  return productionBackendUrl;
};

/**
 * Get the Socket.IO server URL (without the namespace path)
 */
export const getSocketUrl = () => {
  // If VITE_API_BASE is explicitly set, use it
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }

  // For development with Vite proxy, use empty string (relative URLs)
  // The Vite dev server will proxy /socket.io requests to the backend
  if (import.meta.env.DEV) {
    return '';
  }

  // Production fallback: use the deployed backend URL
  const productionBackendUrl = 'https://schedule-ease-zeta.vercel.app';
  return productionBackendUrl;
};
