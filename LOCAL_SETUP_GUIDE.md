# 🚀 Quick Local Setup Guide

## ✅ What's Already Configured

Your project uses **MongoDB Atlas** (Cloud MongoDB) - Perfect for trials!
- ✅ No local MongoDB installation needed
- ✅ Free tier works great
- ✅ Production-ready (can migrate to Render later)
- ✅ Already configured in your `.env` files

---

## 📋 Step-by-Step Setup

### Step 1: Install Backend Dependencies

```bash
cd "c:\Users\balajireddy\OneDrive\Desktop\New folder\oppty_chats\backend"
npm install
```

### Step 2: Install Frontend Dependencies

```bash
cd "c:\Users\balajireddy\OneDrive\Desktop\New folder\oppty_chats\frontend"
npm install
```

### Step 3: Start Backend Server

**Option A: Using Terminal**
```bash
cd "c:\Users\balajireddy\OneDrive\Desktop\New folder\oppty_chats\backend"
npm run dev
```

**Option B: Create a Startup Script** (Recommended)

Create a file `start-backend.bat` on your desktop with:
```batch
@echo off
cd /d "c:\Users\balajireddy\OneDrive\Desktop\New folder\oppty_chats\backend"
echo Starting Backend Server...
npm run dev
pause
```

### Step 4: Start Frontend (in new terminal)

**Option A: Using Terminal**
```bash
cd "c:\Users\balajireddy\OneDrive\Desktop\New folder\oppty_chats\frontend"
npm run dev
```

**Option B: Create a Startup Script**

Create a file `start-frontend.bat` on your desktop with:
```batch
@echo off
cd /d "c:\Users\balajireddy\OneDrive\Desktop\New folder\oppty_chats\frontend"
echo Starting Frontend Application...
npm run dev
pause
```

---

## ⚡ Performance Optimization Tips

### To Prevent Lag:

1. **Close unnecessary browser tabs** - Chrome eats RAM!
2. **Use development mode wisely** - It's slower but shows errors better
3. **Clear browser cache** if frontend feels slow
4. **Restart backend** if you notice database lag

### For Best Performance:

#### Backend:
```bash
# Instead of npm run dev (which uses nodemon), use:
npm start
```
This runs without auto-reload, slightly faster.

#### Frontend:
Keep using `npm run dev` - Vite is already very fast.

---

## 🔍 Verify Everything Works

### 1. Check Backend Health

Open browser: `http://localhost:5000/health`

You should see:
```json
{
  "status": "OK",
  "message": "TheOpptyTeam Backend is running",
  "timestamp": "..."
}
```

### 2. Check Frontend

Open browser: `http://localhost:5173`

You should see the login page.

### 3. Test Login

Try logging in with test credentials from your seeded data.

---

## 🛠️ Troubleshooting

### Problem: Backend won't start

**Check:**
1. Node.js installed? Run: `node --version`
2. Port 5000 free? Close other apps using port 5000
3. MongoDB connection working? Check your Atlas connection string

**Fix:**
```bash
# In backend folder
npm install
npm run dev
```

### Problem: Frontend shows blank page

**Check:**
1. Backend running?
2. Console errors? (F12 → Console)
3. Network tab showing API calls?

**Fix:**
```bash
# In frontend folder
npm install
npm run dev
```

### Problem: MongoDB Connection Error

**Your current config:**
```
MONGODB_URI=mongodb+srv://reddybalaji326_db_user:Oppty123@cluster0.cdf0s9c.mongodb.net/oppty-chats
```

**If this fails:**
1. Check MongoDB Atlas dashboard
2. Verify IP whitelist includes your network
3. Check username/password are correct
4. Make sure cluster is not paused

### Problem: API calls failing

**Check frontend .env:**
```
VITE_API_URL=http://localhost:5000/api
```

**Verify in browser console:**
```javascript
console.log(import.meta.env.VITE_API_URL);
// Should show: http://localhost:5000/api
```

---

## 📊 Expected Startup Output

### Backend Terminal:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
📡 API available at http://localhost:5000/api
💚 Health check: http://localhost:5000/health
```

### Frontend Terminal:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Browser Console (when frontend loads):
```
🚀 App Starting...
Environment Mode: development
Base URL: /
⚠️ VITE_API_URL not set - will use fallback
```
(This is normal in dev mode - it will use the fallback to localhost:5000)

---

## 🎯 Quick Commands Reference

### Backend:
```bash
npm run dev      # Start with auto-reload (development)
npm start        # Start without auto-reload (production-like)
npm run seed     # Seed initial data
```

### Frontend:
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 💡 Pro Tips

1. **Always start backend first**, then frontend
2. **Keep both terminals open** to see logs
3. **Use F12 DevTools** → Network tab to debug API calls
4. **For clean restart**: Stop both servers, clear terminal, start fresh

---

## 🔄 If You Want to Switch to Local MongoDB Later

### Install MongoDB locally:
1. Download MongoDB Community Edition
2. Install and start MongoDB service
3. Update backend `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/oppty-chats
   ```

But for now, **MongoDB Atlas is perfect for trials!** ✨

---

## 📞 Quick Checklist

Before running:
- [ ] Node.js installed (v16+)
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] MongoDB Atlas connection working

To start:
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] No errors in terminals
- [ ] Can access health check endpoint

Testing:
- [ ] Login page loads
- [ ] Can attempt login
- [ ] Network requests visible in DevTools
- [ ] No CORS errors

---

**Ready to start?** Run the commands in Steps 1-4 above! 🚀
