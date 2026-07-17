import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "react-loading-skeleton/dist/skeleton.css";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext.jsx"; // ✅ import your Auth context

// Use Vite env var (must be prefixed with VITE_). Create a .env file in the frontend
// root with: VITE_GOOGLE_CLIENT_ID=your-client-id
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
 
  console.warn(
    "VITE_GOOGLE_CLIENT_ID is not set. Google OAuth will not work until you provide it in your environment."
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* ✅ Google OAuth wrapper */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* ✅ Wrap everything in AuthProvider */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
