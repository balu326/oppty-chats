# 🚀 Render Deployment Instructions - Frontend API Configuration

## ✅ Current Status

Your frontend code is **already production-ready**! All API calls use:

```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
```

This means your code will automatically use the correct backend URL based on environment variables.

---

## 🔧 Step-by-Step Deployment Guide

### Step 1: Deploy Your Backend First ⭐

Before deploying frontend, make sure your backend is live:

1. Go to https://dashboard.render.com
2. Create a new **Web Service** from your repo
3. Configure:
   - **Name:** `oppty-chats-backend`
   - **Root Directory:** `./`
   - **Build Command:** `npm install`
   - **Start Command:** `node backend/server.js`
4. Add Environment Variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   PORT=10000
   CORS_ORIGIN=*
   ```
5. Deploy and wait for it to be live
6. Copy your backend URL: `https://oppty-chats-backend.onrender.com`

---

### Step 2: Deploy Frontend with Correct API URL

1. Go to https://dashboard.render.com
2. Create a new **Static Site** from your repo
3. Configure:
   - **Name:** `oppty-chats-frontend`
   - **Root Directory:** `./frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. **CRITICAL:** Add Environment Variable:
   ```
   Key: VITE_API_URL
   Value: https://oppty-chats-backend.onrender.com/api
   ```
5. Deploy

---

### Step 3: Verify Connection

After both services are deployed:

1. Visit your frontend URL: `https://oppty-chats-frontend.onrender.com`
2. Try to login
3. Check browser console (F12) for any errors
4. Check backend logs in Render dashboard

---

## 🔍 Why This Happens

The error you saw:
```
localhost:5000/api/auth/login - ERR_CONNECTION_REFUSED
```

This happens because:

1. **During local development:** Vite reads `.env` file → uses `http://localhost:5000/api`
2. **During Render build:** Vite needs environment variable from Render dashboard
3. **Without the variable:** Code falls back to localhost (which doesn't exist on Render)

---

## 🎯 How Environment Variables Work in Vite

### Local Development:
```
frontend/.env → VITE_API_URL=http://localhost:5000/api
                ↓
Code: import.meta.env.VITE_API_URL
                ↓
Result: http://localhost:5000/api
```

### Production (Render):
```
Render Dashboard → VITE_API_URL=https://oppty-backend.onrender.com/api
                   ↓
Build Process bakes this into dist/
                   ↓
Code: import.meta.env.VITE_API_URL
                   ↓
Result: https://oppty-backend.onrender.com/api
```

---

## ⚠️ Common Mistakes

### ❌ Wrong:
- Adding `.env` file to Git (it's ignored by .gitignore)
- Using `REACT_APP_` prefix instead of `VITE_`
- Forgetting `/api` at the end of the URL
- Deploying frontend before backend is ready

### ✅ Correct:
- Keep `.env` local, use `.env.example` as template
- Always use `VITE_` prefix for Vite projects
- Full URL: `https://oppty-backend.onrender.com/api`
- Deploy backend first, get URL, then deploy frontend

---

## 🐛 Troubleshooting

### Issue 1: Still Getting localhost Errors After Deploy

**Cause:** Environment variable not set in Render dashboard

**Fix:**
1. Go to Render Dashboard → Frontend Service → Environment
2. Add `VITE_API_URL` with value `https://oppty-backend.onrender.com/api`
3. Trigger manual deploy

### Issue 2: 404 Errors on API Calls

**Cause:** Wrong API path or backend not deployed

**Fix:**
1. Check backend is live at `https://oppty-backend.onrender.com/health`
2. Verify URL includes `/api`: `...onrender.com/api`
3. Check routes in backend server.js

### Issue 3: CORS Errors

**Cause:** Backend not allowing frontend domain

**Fix:**
Backend should have:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
```

---

## 📝 Quick Reference

### Local Development (.env file):
```env
VITE_API_URL=http://localhost:5000/api
```

### Production (Render Dashboard):
```
Key: VITE_API_URL
Value: https://oppty-backend.onrender.com/api
```

### Code Usage (Already Implemented):
```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
```

---

## ✅ Checklist Before Going Live

- [ ] Backend deployed and accessible at `https://oppty-backend.onrender.com`
- [ ] MongoDB connection working
- [ ] Backend health check returns 200 OK
- [ ] Frontend environment variable set in Render dashboard
- [ ] Frontend rebuilt with correct URL
- [ ] Test login functionality
- [ ] Test chat features
- [ ] No console errors

---

## 🔗 Useful Links

- **Render Dashboard:** https://dashboard.render.com
- **Backend Health Check:** https://oppty-backend.onrender.com/health
- **Frontend URL:** https://oppty-chats-frontend.onrender.com
- **Vite Env Vars Docs:** https://vitejs.dev/guide/env-and-mode.html

---

**🎉 Your app is ready to deploy! Just follow the steps above.**
