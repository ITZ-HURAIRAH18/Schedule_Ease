# ScheduleEase Frontend

Modern video scheduling platform built with React, Vite, and Tailwind CSS.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Configuration

### Development (`.env.local`)

Create a `.env.local` file in the `frontend/` directory:

```env
# Backend API URL (local development)
VITE_API_BASE=http://localhost:5001

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

### Production (`.env.production`)

The `.env.production` file is already configured with the correct backend URL:

```env
VITE_API_BASE=https://schedule-ease-zeta.vercel.app
VITE_GOOGLE_CLIENT_ID=your-production-google-client-id
```

**Important**: You must set `VITE_GOOGLE_CLIENT_ID` for Google Sign-In to work. See [Google OAuth Setup](#google-oauth-setup) below.

## Google OAuth Setup

### The Problem
If you see "The given origin is not allowed for the given client ID", you need to add your frontend URL to Google Cloud Console.

### Steps to Fix

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Select your OAuth 2.0 Client ID**
3. **Add Authorized JavaScript Origins**:
   - For production: `https://schedule-ease-a4ur.vercel.app`
   - For local development: `http://localhost:5173` and `https://localhost:5173`
4. **Save** and wait a few minutes for changes to propagate

### Get Your Google Client ID

1. Go to https://console.cloud.google.com/apis/credentials
2. Create or select an OAuth 2.0 Client ID (Web application type)
3. Copy the Client ID (looks like: `123456789-abc123.apps.googleusercontent.com`)
4. Add it to your environment:
   ```env
   VITE_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
   ```

## Deployment to Vercel

### Frontend Deployment

1. **Set Environment Variables in Vercel**:
   - Go to your Vercel project → Settings → Environment Variables
   - Add:
     - `VITE_API_BASE` = `https://schedule-ease-zeta.vercel.app`
     - `VITE_GOOGLE_CLIENT_ID` = your Google OAuth client ID

2. **Deploy**:
   ```bash
   vercel --prod
   ```

### Backend URL Configuration

The frontend is configured to communicate with the backend at:
- **Production**: `https://schedule-ease-zeta.vercel.app`
- **Development**: `http://localhost:5001` (via Vite proxy)

All API calls and Socket.IO connections use HTTPS in production.

## Architecture

### API Communication

- **Development**: Vite dev server proxies `/api` and `/socket.io` requests to `http://localhost:5001`
- **Production**: Direct HTTPS requests to `https://schedule-ease-zeta.vercel.app`

### Socket.IO Configuration

Socket.IO connects to the backend namespace:
- **Meeting namespace**: `https://schedule-ease-zeta.vercel.app/meeting`
- **Admin/Host dashboards**: `https://schedule-ease-zeta.vercel.app`

### Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS
- **Socket.IO Client 4.8** - Real-time communication
- **Simple Peer** - WebRTC signaling
- **Axios** - HTTP client
- **React Router 7** - Client-side routing
- **Google OAuth** - Authentication

## Troubleshooting

### Mixed Content Errors

**Problem**: Frontend makes HTTP requests to wrong URL.

**Solution**: The frontend now uses `VITE_API_BASE` environment variable or falls back to `https://schedule-ease-zeta.vercel.app` in production. All requests use HTTPS.

### Socket.IO 404 Errors

**Problem**: Socket.IO tries to connect to frontend URL instead of backend.

**Solution**: All Socket.IO connections now use `getSocketUrl()` which returns the correct backend URL in production.

### Google Sign-In "Origin Not Allowed"

**Problem**: "The given origin is not allowed for the given client ID"

**Solution**: Add `https://schedule-ease-a4ur.vercel.app` to Authorized JavaScript Origins in Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID.

### Camera/Microphone Not Working

**Requirements**:
- HTTPS is required for camera/microphone access (except on localhost)
- User must grant browser permission for camera and microphone
- Modern browser required (Chrome 53+, Firefox 36+, Edge 79+)

## Development

### Project Structure

```
frontend/
├── src/
│   ├── api/           # API client configuration
│   ├── components/    # Reusable components (MeetingRoom, etc.)
│   ├── context/       # React context providers (Auth)
│   ├── pages/         # Page components (admin, host, etc.)
│   ├── routes/        # Route configuration
│   ├── utils/         # Utility functions (apiConfig)
│   └── main.jsx       # Entry point (Google OAuth setup)
├── .env.production    # Production environment variables
├── .env.example       # Template for environment variables
└── vite.config.js     # Vite configuration (dev proxy)
```

### Adding New API Endpoints

All API calls go through `axiosInstance` which automatically:
- Uses the correct base URL (from `getApiBaseUrl()`)
- Adds authentication token to requests

```javascript
import axiosInstance from '../api/axiosInstance';

// API call - automatically uses correct backend URL
const response = await axiosInstance.get('/your-endpoint');
```

### Adding New Socket.IO Connections

Use `getSocketUrl()` to get the correct backend URL:

```javascript
import { io } from 'socket.io-client';
import { getSocketUrl } from '../utils/apiConfig';

const socket = io(getSocketUrl(), {
  secure: window.location.protocol === 'https:',
});
```
