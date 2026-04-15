# Production Deployment Guide - ScheduleEase

## Issues Fixed ✅

### 1. **Mixed Content Error (CRITICAL)**
**Problem**: Frontend (HTTPS) was making HTTP requests to `http://schedule-ease-a4ur.vercel.app:5001`
**Fix**: Updated `frontend/src/utils/apiConfig.js` to use correct backend URL: `https://schedule-ease-zeta.vercel.app`

### 2. **Socket.IO 404 Errors**
**Problem**: Socket.IO was trying to connect to frontend domain instead of backend, and Vercel doesn't support WebSockets in serverless
**Fix**: 
- Updated Socket.IO configuration to use correct backend URL in production
- Disabled Socket.IO in Vercel serverless environment (it won't work)
- Added graceful fallback with console warnings

### 3. **Google Sign-In Origin Not Allowed**
**Problem**: Google OAuth client ID not configured for production domain
**Fix**: Documented required Google Cloud Console configuration (see below)

### 4. **Backend Routing Issues**
**Problem**: `vercel.json` only routed `/api/*` requests, missing other endpoints
**Fix**: Updated to route all requests to `server.js`

---

## Deployment Steps

### Frontend (https://schedule-ease-a4ur.vercel.app)

1. **Set Environment Variables in Vercel Dashboard**:
   - Go to: Vercel Dashboard → Your Frontend Project → Settings → Environment Variables
   - Add these variables:
     ```
     VITE_API_BASE=https://schedule-ease-zeta.vercel.app
     VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
     ```

2. **Redeploy Frontend**:
   ```bash
   cd "E:\My Projects\Nexagen Project\frontend"
   git add .
   git commit -m "fix: Update API configuration for production deployment"
   vercel --prod
   ```

### Backend (https://schedule-ease-zeta.vercel.app)

1. **Set Environment Variables in Vercel Dashboard**:
   - Go to: Vercel Dashboard → Your Backend Project → Settings → Environment Variables
   - Add these variables:
     ```
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret_key
     GOOGLE_CLIENT_ID=your_google_client_id
     GOOGLE_CLIENT_SECRET=your_google_client_secret
     NODE_ENV=production
     VERCEL=1
     ```

2. **Redeploy Backend**:
   ```bash
   cd "E:\My Projects\Nexagen Project\my-backend"
   git add .
   git commit -m "fix: Configure backend for Vercel serverless deployment"
   vercel --prod
   ```

---

## Google OAuth Configuration

### Add Authorized JavaScript Origins

Go to **Google Cloud Console** → **APIs & Services** → **Credentials** → **OAuth 2.0 Client ID**

Add these origins:
- `https://schedule-ease-a4ur.vercel.app` (Production frontend)
- `http://localhost:5173` (Local development)
- `https://localhost:5173` (Local HTTPS development)

### Add Authorized Redirect URIs

Add these redirect URIs:
- `https://schedule-ease-a4ur.vercel.app` (Production)
- `http://localhost:5173` (Local development)
- `https://schedule-ease-zeta.vercel.app` (Backend)

---

## Important Notes

### ⚠️ Socket.IO Limitation on Vercel

**Vercel serverless functions do NOT support persistent WebSocket connections.**

Socket.IO is disabled in production. If you need real-time features, consider:

1. **Pusher** (Recommended): https://pusher.com
2. **Ably**: https://ably.com
3. **Supabase Realtime**: https://supabase.com/realtime
4. **HTTP Polling**: Implement periodic API calls for updates

### 🔒 HTTPS Only

All production traffic must use HTTPS. The frontend now enforces HTTPS for all API calls.

### 📡 CORS Configuration

Backend CORS is configured to allow:
- `https://schedule-ease-a4ur.vercel.app` (Production frontend)
- `https://schedule-ease-zeta.vercel.app` (Backend itself)
- `http://localhost:5173` (Local development)
- `http://localhost:3000` (Alternative local port)

---

## Testing After Deployment

### 1. Test Backend Health
```
GET https://schedule-ease-zeta.vercel.app/api/health
Expected: { "status": "OK" }
```

### 2. Test API Root
```
GET https://schedule-ease-zeta.vercel.app/
Expected: { "message": "Schedule Ease API is running", "status": "OK", ... }
```

### 3. Test Frontend Login
1. Navigate to: `https://schedule-ease-a4ur.vercel.app/login/user`
2. Try logging in with email/password
3. Check browser console for any errors
4. Verify network requests are going to `https://schedule-ease-zeta.vercel.app`

### 4. Verify No Mixed Content Errors
- Open browser DevTools → Console
- Look for "Mixed Content" warnings (there should be NONE)
- All requests should use `https://`

### 5. Test Google Sign-In
- Click "Sign in with Google" button
- Should redirect to Google OAuth
- Should return to frontend successfully
- No origin errors in console

---

## Troubleshooting

### Still Getting 404 on API Calls?
1. Check that `VITE_API_BASE` is set in Vercel frontend environment variables
2. Verify backend is deployed and running: `https://schedule-ease-zeta.vercel.app/api/health`
3. Check Vercel backend logs for errors

### Socket.IO Still Showing 404?
- This is **expected** on Vercel - Socket.IO doesn't work in serverless
- The frontend should gracefully handle this
- Consider implementing HTTP polling as an alternative

### Google Sign-In Still Failing?
1. Verify `VITE_GOOGLE_CLIENT_ID` is set correctly
2. Check Google Cloud Console for authorized origins
3. Make sure the exact domain `https://schedule-ease-a4ur.vercel.app` is added

### Login Still Not Working?
1. Check browser console for specific error messages
2. Verify backend MongoDB connection (check `MONGO_URI` in Vercel)
3. Check backend logs in Vercel dashboard
4. Test backend directly: `POST https://schedule-ease-zeta.vercel.app/api/auth/login`

---

## Architecture Overview

```
Frontend (Vercel)                    Backend (Vercel)
https://schedule-ease-a4ur.vercel.app  →  https://schedule-ease-zeta.vercel.app
- React + Vite                          - Express.js
- Socket.IO client (disabled in prod)   - Socket.IO server (disabled in prod)
- Google OAuth client                   - JWT authentication
                                        - MongoDB database
```

**Communication Flow**:
- Frontend → Backend: HTTPS REST API calls
- Socket.IO: Disabled in production (Vercel limitation)
- Google OAuth: Frontend → Google → Backend validation

---

## Next Steps for Production Readiness

1. ✅ Fix mixed content errors
2. ✅ Configure CORS properly
3. ✅ Set up environment variables
4. ✅ Update vercel.json routing
5. ⚠️ Implement alternative to Socket.IO for real-time features
6. ⚠️ Add rate limiting and security headers
7. ⚠️ Set up monitoring and error tracking (Sentry, etc.)
8. ⚠️ Configure custom domain (optional)
9. ⚠️ Set up automated backups for MongoDB

---

## Contact & Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review browser console errors
3. Test API endpoints directly
4. Verify all environment variables are set correctly
