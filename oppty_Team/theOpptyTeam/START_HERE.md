# 🎯 START HERE - TheOpptyTeam with MongoDB

## Your Database-Powered HRMS is Ready! ✅

---

## ⚡ Quick Setup (5 Minutes)

### 1️⃣ MongoDB Atlas Setup

**Go to:** https://www.mongodb.com/cloud/atlas

1. Sign up (use Google for fastest setup)
2. Create **FREE** cluster (M0 tier)
3. Click "Database Access" → Add User
   - Username: `oppty-admin`
   - Password: `(choose a strong one)`
4. Click "Network Access" → Add IP
   - Choose: "Allow from Anywhere" (`0.0.0.0/0`)
5. Go back to "Clusters" → Connect → "Connect your application"
6. Copy the connection string

### 2️⃣ Configure Backend

Open this file: `backend/.env`

Replace this line:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/oppty-connect
```

With YOUR connection string (from step 1):
```env
MONGODB_URI=mongodb+srv://oppty-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/oppty-connect?retryWrites=true&w=majority
```

**Also change:**
```env
JWT_SECRET=make-this-a-random-32-character-string-right-now
```

### 3️⃣ Initialize & Start

**Terminal 1 - Backend Server:**
```powershell
cd backend
npm run seed    # First time only - creates employee accounts
npm start       # Run the server
```

✅ You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

✅ You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 4️⃣ Open Browser

**Go to:** http://localhost:5173

**Login with:**
- Email: `employee@oppty.com`
- Password: `123456`

🎉 **You're in!**

---

## 🔑 All Login Accounts

| Email | Password | Use For |
|-------|----------|---------|
| employee@oppty.com | 123456 | Regular employee |
| admin@oppty.com | admin123 | Admin access |
| maya@oppty.com | maya123 | Test user |
| jason@oppty.com | jason123 | Test user |

---

## 📚 Need More Help?

**Detailed Guides:**
- [QUICK_START.md](QUICK_START.md) - 5-minute reference
- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Complete installation guide
- [README_DATABASE.md](README_DATABASE.md) - What was added

---

## 🔧 Common Issues

### ❌ "MongoDB connection failed"
- Check your `.env` has correct username/password
- Verify MongoDB cluster is running (green status in Atlas)
- Make sure you whitelisted IP address

### ❌ "Port already in use"
Change port in `backend/.env`:
```env
PORT=5001
```
Then update frontend `.env`:
```env
VITE_API_URL=http://localhost:5001/api
```

### ❌ "Cannot find module"
Run in backend folder:
```powershell
npm install
```

### ❌ Forgot password OTP not working?
Check the **backend terminal** - OTP is printed there during development!

---

## ✨ What You Got

✅ **MongoDB Database** - All data persists  
✅ **Secure Login** - JWT tokens + bcrypt passwords  
✅ **Password Reset** - OTP-based recovery  
✅ **Same Design** - Nothing changed visually  
✅ **Production Ready** - Real backend architecture  

---

## 🎨 Architecture Overview

```
Browser (React App)
    ↓ HTTP Requests
Backend API (Express)
    ↓ MongoDB Queries
Database (MongoDB Atlas)
    ↓ Returns Data
Backend → Frontend
```

---

## 🚀 Development Commands

**Backend:**
```powershell
cd backend
npm start      # Start server
npm run dev    # Auto-restart mode
npm run seed   # Reset database
```

**Frontend:**
```powershell
npm run dev     # Development server
npm run build   # Production build
```

---

## 📖 Next Steps

1. ✅ Set up MongoDB Atlas
2. ✅ Configure `.env` files
3. ✅ Seed database
4. ✅ Start backend
5. ✅ Start frontend
6. 🎉 **Build amazing features!**

---

## 💡 Pro Tips

- Keep both terminals running (backend + frontend)
- Changes to React code auto-refresh
- Backend changes need restart (or use `npm run dev`)
- Check browser console (F12) for errors
- MongoDB Atlas dashboard shows your data

---

**Questions?** Read the detailed guides or ask me! 

**Happy Coding! 💚🚀**
