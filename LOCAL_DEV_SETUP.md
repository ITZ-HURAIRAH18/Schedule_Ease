# 🚀 Local Development Setup Guide

## Problem Summary
- Socket.IO fails on Vercel (serverless - doesn't support persistent WebSockets)
- Frontend was using production URLs for local development
- Socket initialization happened at module level (not in components)

## ✅ Fixed Issues
1. Backend: Fixed syntax error in server.js (missing try block)
2. Frontend: Added `.env.development` file for local env variables
3. Frontend: Moved socket initialization inside components with proper cleanup
4. Frontend: Updated HostDashboard and AdminDashboard socket handling

## 🎯 Running Local Development

### Step 1: Set Up Backend
```bash
cd my-backend
npm install
npm run dev
```
**Expected Output:**
- ✅ Database initialized successfully (or waiting for DB)
- ✅ Development server running on localhost:5001
- ✅ Socket.io instance initialized
- ✅ HTTP fallback server running on http://localhost:5002

**Important:** Make sure `process.env.NODE_ENV` is NOT set to "production" locally!

### Step 2: Set Up Frontend (in new terminal)
```bash
cd frontend
npm install
npm run dev
```
**Expected Output:**
- ✅ Local: https://localhost:5173/
- ✅ Vite ready in ~18 seconds

### Step 3: Test Socket.IO Connection
1. Open https://localhost:5173 in browser
2. Open browser DevTools (F12)
3. Go to Network tab
4. Look for `/socket.io/?EIO=4&transport=...` requests
5. ✅ Should see status 101 (WebSocket upgrade) or 200 (polling)
6. ❌ If 404, socket.io is not initialized on backend

## 🔧 Environment Variables

### **`.env.development`** (Created - for local dev)
```
VITE_API_BASE=
VITE_GOOGLE_CLIENT_ID=77809119535-r5ivv8inbitphbo2rcf5bik2d7grgf5g.apps.googleusercontent.com
```
- Empty `VITE_API_BASE` tells Vite to use relative URLs and proxy to backend
- Frontend proxy will route `/api` and `/socket.io` to localhost:5001

### **`.env.production`** (Existing - for Vercel production)
```
VITE_API_BASE=https://schedule-ease-zeta.vercel.app
```

## 📋 Current Proxy Setup (Vite)
- `/api/*` → `https://127.0.0.1:5001`
- `/socket.io/*` → `https://127.0.0.1:5001` (with WebSocket support)

## ⚠️ Common Issues

### Issue: 404 on `/socket.io` requests
**Cause:** Backend socket.io not initialized (usually because NODE_ENV=production)
**Fix:** Make sure backend runs with `npm run dev` (not `npm run build && npm run start`)

### Issue: Socket connects but users don't see each other
**Cause:** WebRTC signaling failures or peer connection not receiving offer/answer
**Solution:** Check browser console for WebRTC errors, verify STUN/TURN config

### Issue: HTTPS/SSL certificate errors
**Cause:** Backend SSL certs (localhost-key.pem, localhost.pem) missing
**Effect:** Backend falls back to HTTP automatically (check console logs)
**Fix:** If errors persist, add certs or disable https in vite.config.js

## 🌐 Production Deployment

### Current Setup: ❌ BROKEN (Vercel doesn't support socket.io)
- Frontend: Vercel
- Backend: Vercel (serverless)
- Real-time: Socket.IO ❌ NOT SUPPORTED

### Solution: Deploy Backend Elsewhere
**Recommended: Railway.com**
1. Push code to GitHub
2. Connect Railway to your repo
3. Set environment variables in Railway dashboard
4. Get your Railway backend URL (e.g., `api-production-abc.railway.app`)
5. Update `.env.production` in frontend:
   ```
   VITE_API_BASE=https://api-production-abc.railway.app
   ```
6. Redeploy frontend to Vercel

**Alternative: Render.com, Replit, DigitalOcean, AWS**

**Alternative: Use Pusher/Ably instead of Socket.IO**
- Works on serverless (Vercel)
- No need to change deployment
- Requires API keys from Pusher/Ably
