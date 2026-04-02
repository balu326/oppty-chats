# How to Verify VITE_API_URL is Working

## ✅ Your Code is Already Correct!

All your files are properly configured:
- `src/pages/auth/EmployeeLogin.jsx` - Line 8: Uses `import.meta.env.VITE_API_URL`
- `src/context/ChatContext.jsx` - Lines 5 & 18: Uses `import.meta.env.VITE_API_URL`
- `src/main.jsx` - Added debug logging to check environment variables

## 🔍 Step-by-Step Verification

### Method 1: Check Browser Console (Easiest)

1. **Deploy your frontend** on Render (after setting VITE_API_URL)
2. **Open your website** in browser
3. **Press F12** to open DevTools
4. **Go to Console tab**
5. **Look for these messages**:
   ```
   🚀 App Starting...
   Environment Mode: production
   Base URL: /
   ✅ API URL: https://oppty-backend.onrender.com/api
   ```

   If you see `⚠️ VITE_API_URL not set`, then the environment variable isn't configured in Render.

### Method 2: Check Network Request (Most Accurate)

1. **Open your website**
2. **Press F12** → Go to **Network tab**
3. **Try to login** with any credentials
4. **Find the `login` request** in the network list
5. **Click on it** → Look at **Headers** tab
6. **Check "Request URL"**:
   
   ❌ **WRONG** (means env var not set):
   ```
   https://your-frontend-url.onrender.com/api/auth/login
   ```
   
   ✅ **RIGHT** (env var working correctly):
   ```
   https://oppty-backend.onrender.com/api/auth/login
   ```

### Method 3: Local Test with .env File

1. **Create/Edit `.env`** in frontend folder:
   ```env
   VITE_API_URL=https://oppty-backend.onrender.com/api
   ```

2. **Run locally**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open browser console** - should show:
   ```
   ✅ API URL: https://oppty-backend.onrender.com/api
   ```

## 🛠️ Fixing Issues

### If VITE_API_URL shows as undefined:

#### In Render Dashboard:

1. Go to **Render Dashboard** → Your Frontend Service
2. Click **Environment** tab
3. **Add or Edit** variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://oppty-backend.onrender.com/api`
4. **Save Changes**
5. **Clear Build Cache & Deploy**:
   - Manual Deploy dropdown
   - Select "Clear Build Cache & Deploy"
6. **Wait for build to complete**

### Why Clear Build Cache is CRITICAL:

Vite **"bakes"** environment variables into the bundle **during build**. 

- If you change `VITE_API_URL` after a build, **nothing changes** until you rebuild
- The old bundle still has the old values
- **Clear Build Cache** forces a fresh build with new environment variables

## 📊 Understanding the Fallback

Your code uses this pattern:
```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
```

This means:
- ✅ If `VITE_API_URL` is set → Uses that value
- ⚠️ If `VITE_API_URL` is undefined → Falls back to `http://localhost:5000/api`

**Problem**: In production, if the env var isn't set, it will try to call `localhost:5000` which doesn't exist on Render!

## 🎯 Expected Behavior After Fix

When everything is working:

1. **Console shows**: `✅ API URL: https://oppty-backend.onrender.com/api`
2. **Login request goes to**: `https://oppty-backend.onrender.com/api/auth/login`
3. **Response is**: JSON data (not HTML 404 page)
4. **Login succeeds**: You get redirected to `/chats`

## 🚨 Common Mistakes

❌ **Setting variable without clearing cache**
- Must do "Clear Build Cache & Deploy"

❌ **Using wrong variable name**
- Must be exactly `VITE_API_URL` (case-sensitive)
- Not `API_URL`, `VITE_API`, etc.

❌ **Adding variable after build started**
- Wait for current build to finish
- Then trigger new build with cache clear

❌ **Forgetting the `/api` suffix**
- Value should be: `https://oppty-backend.onrender.com/api`
- Not just: `https://oppty-backend.onrender.com`

## ✨ Quick Checklist

Before deploying:
- [ ] `VITE_API_URL` is set in Render Dashboard
- [ ] Value includes `/api` at the end
- [ ] Ready to do "Clear Build Cache & Deploy"

After deploying:
- [ ] Console shows correct API URL
- [ ] Network requests go to backend URL
- [ ] Login returns JSON (not HTML)
- [ ] No 404 errors in console

---

**Need Help?** Open browser console and share the output of the environment check logs!
