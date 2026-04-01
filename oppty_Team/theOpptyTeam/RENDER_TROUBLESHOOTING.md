# 🚨 Render Deployment - Troubleshooting Guide

## ⚠️ Common Errors & Instant Fixes

---

## ❌ ERROR 1: "Internal Server Error"

### 🔍 Most Common Causes:

### 1️⃣ PORT Configuration Issue

**Problem:** Render can't find the port

**✅ Fix:** Already correct in your code!
```javascript
const PORT = process.env.PORT || 5000;
```

This is GOOD - Render will provide PORT automatically.

---

### 2️⃣ MongoDB Connection Error

**Problem:** `process.env.MONGODB_URI` is undefined

**✅ Fix:** Make sure you added it in Render Dashboard

**Steps:**
1. Go to Render Dashboard
2. Click your backend service
3. Click **"Environment"** tab
4. Add this variable:
   ```
   Key: MONGODB_URI
   Value: mongodb+srv://reddybalaji326_db_user:Oppty123@cluster0.cdf0s9c.mongodb.net/oppty-chats?retryWrites=true&w=majority
   ```
5. Click **"Save Changes"**
6. Redeploy

---

### 3️⃣ Missing dotenv

**Problem:** Environment variables not loading

**✅ Fix:** Already correct!
```javascript
import dotenv from 'dotenv';
dotenv.config();
```

Line 4-5 in server.js ✅

---

### 4️⃣ Module Not Found

**Problem:** Missing dependencies

**✅ Fix:**
```bash
# Make sure all dependencies are installed
cd backend
npm install
```

**Check package.json has:**
- express
- mongoose
- cors
- dotenv
- multer
- jsonwebtoken
- bcryptjs

---

## ❌ ERROR 2: "Cannot find module"

### Quick Fix:

**Step 1:** Check all imports in server.js:
```javascript
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';
import path from 'path';
import { connectDB } from './db.js';
```

**Step 2:** Install missing packages:
```bash
npm install express mongoose cors dotenv express-async-errors path multer jsonwebtoken bcryptjs
```

---

## ❌ ERROR 3: CORS Issues

### Symptoms:
- Frontend can't connect to backend
- Browser shows CORS error

### ✅ Fix:

Update CORS configuration in `server.js`:

```javascript
// Change line 21 from:
app.use(cors());

// To:
const allowedOrigins = ['http://localhost:5173', 'https://your-frontend.onrender.com'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

---

## ❌ ERROR 4: Database Connection Timeout

### Symptoms:
- Logs show: "MongoNetworkError"
- "connection timed out"

### ✅ Fix:

**Step 1:** Check MongoDB Atlas Network Access
1. Go to https://cloud.mongodb.com
2. Click "Network Access" (left sidebar)
3. Click "Add IP Address"
4. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
5. Click Confirm

**Step 2:** Wait 2 minutes for changes to apply

**Step 3:** Restart backend on Render

---

## 📋 Pre-Deployment Checklist

### ✅ Backend Ready?

- [ ] All dependencies installed (`npm install`)
- [ ] `.env` file NOT committed to Git (should be in .gitignore)
- [ ] `package.json` has start script: `"start": "node server.js"`
- [ ] PORT uses environment variable
- [ ] MongoDB URI will be added to Render

### ✅ Render Configuration?

- [ ] Service type: **Web Service**
- [ ] Build command: `npm install`
- [ ] Start command: `npm start` or `node server.js`
- [ ] Node version specified in package.json
- [ ] Environment variables added:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `PORT` (optional, Render provides it)
  - `NODE_ENV=production`
  - `FRONTEND_URL` (your frontend URL)

---

## 🔧 How to Check Render Logs

### Step-by-Step:

1. **Go to Render Dashboard**
   - https://dashboard.render.com

2. **Click your backend service**
   - oppty-backend (or whatever you named it)

3. **Click "Logs" tab**

4. **Look for these patterns:**

   ✅ **Good signs:**
   ```
   ✅ MongoDB connected successfully
   🚀 Server running on port <port_number>
   ```

   ❌ **Bad signs:**
   ```
   Error: Cannot find module
   TypeError: Cannot read properties of undefined
   MongoNetworkError
   listen EADDRINUSE
   ```

5. **Copy the error message** and search in this guide!

---

## 🎯 Quick Deploy Commands

### Test Locally First:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Should see:
# ✅ MongoDB connected successfully
# 🚀 Server running on port 5000
```

### Then Deploy:

1. Push to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. Render will auto-deploy

3. Check logs for errors

---

## 💡 Pro Tips

### 1. Always test locally first
If it doesn't work locally → Won't work on Render

### 2. Use health check endpoint
```
https://your-backend.onrender.com/health
```

Should return:
```json
{
  "status": "OK",
  "message": "TheOpptyTeam Backend is running"
}
```

### 3. Keep Render awake
Free tier sleeps after 15 min inactivity

**Solution:** Use UptimeRobot (free)
- Ping your backend every 5 minutes
- Keeps it always awake

### 4. Check environment variables twice
Most common mistake: Forgetting to add MONGODB_URI in Render!

---

## 🆘 Emergency Rollback

If deployment fails:

1. Go to Render Dashboard
2. Click backend service
3. Click "Manual Deploy"
4. Select previous working commit
5. Click "Deploy"

---

## 📊 Expected vs Actual

### ✅ What SHOULD happen:

```
Building...
Installing dependencies...
Build successful
Starting server...
✅ MongoDB connected successfully
🚀 Server running on port 1234 (Render assigns random port)
```

### ❌ What might go wrong:

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module 'express'` | Dependencies not installed | Run `npm install` before deploy |
| `MONGODB_URI undefined` | Env var missing | Add in Render dashboard |
| `listen EADDRINUSE` | PORT already used | Remove hardcoded PORT |
| `CORS error` | Frontend blocked | Update CORS origins |
| `connection timeout` | MongoDB firewall | Allow 0.0.0.0/0 in Atlas |

---

## 🎉 Success Indicators

You know it's working when:

1. ✅ Health check returns 200 OK
2. ✅ `/messages` endpoint returns array
3. ✅ Can send POST request to `/send-message`
4. ✅ No errors in logs
5. ✅ MongoDB shows data in Atlas

---

## 🔗 Useful Links

- Render Docs: https://render.com/docs
- MongoDB Atlas: https://cloud.mongodb.com
- Node.js on Render: https://render.com/docs/node-version
- CORS Tester: https://cors-anywhere.herokuapp.com/corsdemo

---

## 🚀 Next Steps After Fix

Once backend is stable:

1. ✅ Test all endpoints
2. ✅ Deploy frontend
3. ✅ Connect frontend to backend URL
4. ✅ Test full chat flow
5. ✅ Share with users!

---

**Remember:** The "PR Previews" message is just info, not an error! Ignore it.

Focus on fixing the "Internal Server Error" by checking logs and following this guide.
