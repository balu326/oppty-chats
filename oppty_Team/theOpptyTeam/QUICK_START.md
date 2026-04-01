# 🚀 Quick Start Guide - TheOpptyTeam with MongoDB

## Complete Setup in 5 Minutes

### Step 1: Install Backend Dependencies (Already Done ✅)
```powershell
cd backend
npm install
```

### Step 2: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster (M0 free tier)
4. Create database user
5. Whitelist IP: `0.0.0.0/0` (for testing)
6. Get connection string
7. Update `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/oppty-connect
   ```

### Step 3: Seed the Database
```powershell
npm run seed
```

### Step 4: Start Backend Server
```powershell
npm start
```

Expected output:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

### Step 5: Start Frontend (New Terminal)
```powershell
cd ..
npm run dev
```

### Step 6: Open Browser
Go to: http://localhost:5173

### Login Credentials
- **Email:** employee@oppty.com
- **Password:** 123456

---

## 📋 What's New?

✅ **MongoDB Database** - All data now persisted  
✅ **Secure Authentication** - JWT tokens, bcrypt password hashing  
✅ **API Endpoints** - RESTful backend integration  
✅ **Same Design** - Frontend unchanged, just better backend  

---

## 🔧 Troubleshooting

**MongoDB won't connect?**
- Check `.env` has correct connection string
- Verify MongoDB cluster is running
- Check username/password are correct

**Port 5000 in use?**
- Change `PORT=5001` in `backend/.env`
- Update `VITE_API_URL` in frontend `.env`

---

For detailed setup instructions, see [BACKEND_SETUP.md](BACKEND_SETUP.md)
