# Frontend Deployment Guide

## ✅ Code Status: READY FOR DEPLOYMENT

Your frontend code is already correctly configured to use environment variables! All API calls use the pattern:
```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
```

## 🚀 Deployment Steps

### Step 1: Add Environment Variable to Render (REQUIRED)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Navigate to your **Frontend** service (`oppty-chats-frontend`)
3. Click on **Environment** tab
4. Add a new environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://oppty-backend.onrender.com/api`
5. Click **Save Changes**

### Step 2: Configure SPA Redirect (Fix 404 on Refresh)

To prevent 404 errors when refreshing or directly accessing routes like `/login`:

1. In Render Dashboard, go to your **Frontend** service
2. Click on **Settings** tab
3. Scroll down to **Redirects and Rewrites** section
4. Click **Add Rule**
5. Configure the rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
6. Click **Save**

### Step 3: Trigger New Build with Cache Clear

Since Vite bakes environment variables during build:

1. Go to your **Frontend** service in Render
2. Click **Manual Deploy** dropdown
3. Select **Clear Build Cache & Deploy**
4. Wait for the build to complete (~2-3 minutes)

### Step 4: Verify Deployment

After deployment completes:

1. Visit your frontend URL
2. Try logging in
3. Test direct navigation to `/login` (should not 404)
4. Open browser DevTools → Network tab
5. Verify API calls go to `https://oppty-backend.onrender.com/api/...`

## 🔍 Troubleshooting

### If login still doesn't work:

1. **Check Environment Variable**:
   ```bash
   # In Render Dashboard → Environment
   # Verify VITE_API_URL is set to https://oppty-backend.onrender.com/api
   ```

2. **Verify Backend is Running**:
   - Check your backend service status in Render
   - Ensure it's not in suspended state (free tier sleeps after inactivity)
   - Backend URL should be: `https://oppty-backend.onrender.com`

3. **Check CORS Settings**:
   - Backend should have CORS enabled for your frontend domain
   - Check `backend/server.js` for CORS configuration

4. **Test Backend Connection**:
   ```javascript
   // Open browser console on your frontend
   console.log('API URL:', import.meta.env.VITE_API_URL);
   // Should output: https://oppty-backend.onrender.com/api
   ```

### If you see 404 on refresh:

- The SPA rewrite rule wasn't configured correctly
- Double-check Step 2 above
- Make sure the rule is active in Render Settings

## 📝 Current Configuration

### Files Already Configured:
✅ `src/context/ChatContext.jsx` - Uses `import.meta.env.VITE_API_URL`
✅ `src/pages/auth/EmployeeLogin.jsx` - Uses `import.meta.env.VITE_API_URL`
✅ `src/pages/admin/AdminDashboard.jsx` - Uses `import.meta.env.VITE_API_URL`
✅ `src/pages/admin/SuperAdminDashboard.jsx` - Uses `import.meta.env.VITE_API_URL`
✅ `.env.example` - Updated with production URL
✅ `render.yaml` - Has `VITE_API_URL` environment variable

### What Changed:
- Updated `.env.example` to show the correct production URL uncommented
- Created this deployment guide

## 🎯 Next Steps

1. Complete Steps 1-3 above in Render Dashboard
2. Wait for deployment to finish
3. Test the login functionality
4. Report back if you encounter any issues!

---

**Note**: Your code is already perfect! You just need to configure the environment variable in Render and trigger a rebuild.
