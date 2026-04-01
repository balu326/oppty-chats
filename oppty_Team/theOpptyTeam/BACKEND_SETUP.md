# 🚀 Backend Setup Guide - TheOpptyTeam HRMS

Complete guide to set up MongoDB database backend for TheOpptyTeam application.

---

## 📋 Overview

This backend provides:
- ✅ **MongoDB Database** integration with Mongoose ODM
- ✅ **JWT Authentication** for secure login
- ✅ **Password Hashing** with bcryptjs
- ✅ **RESTful API** endpoints for authentication
- ✅ **OTP-based** password reset functionality
- ✅ **CORS** enabled for frontend communication

---

## 🛠️ Installation Steps

### Step 1: Install Backend Dependencies

Open PowerShell in the project root and run:

```powershell
cd backend
npm install
```

**Expected Output:**
```
added XX packages, and audited XX packages in Xs
found 0 vulnerabilities
```

---

### Step 2: Set Up MongoDB

You have two options:

#### Option A: MongoDB Atlas (Cloud - Recommended)

**Why?** Free forever, no installation, automatic backups

1. **Create Free Account**
   - Go to: https://www.mongodb.com/cloud/atlas
   - Click "Try Free"
   - Sign up with Google (fastest) or email

2. **Create Cluster**
   - Click "Create a Deployment"
   - Choose "Free" (M0) plan
   - Select AWS as cloud provider
   - Choose region closest to you
   - Click "Create Cluster"
   - ⏳ Wait 5-10 minutes

3. **Create Database User**
   - Left menu → "Database Access"
   - Click "Add New Database User"
   - Username: `oppty-admin`
   - Password: `YourSecurePassword123!`
   - Click "Add User"

4. **Allow IP Access**
   - Left menu → "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for testing)
   - Confirm: `0.0.0.0/0`

5. **Get Connection String**
   - Go back to "Clusters"
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Example: `mongodb+srv://oppty-admin:YourSecurePassword123!@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

6. **Update `.env` File**
   - Open `backend/.env`
   - Replace the `MONGODB_URI` value with your connection string
   - Update username and password

#### Option B: Local MongoDB (Advanced)

1. Download from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. In `backend/.env`, set:
   ```
   MONGODB_URI=mongodb://localhost:27017/oppty-connect
   ```

---

### Step 3: Configure Environment Variables

Edit `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/oppty-connect?retryWrites=true&w=majority

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

**⚠️ IMPORTANT:** Change `JWT_SECRET` to a random 32+ character string in production!

---

### Step 4: Seed the Database

Initialize the database with employee accounts:

```powershell
npm run seed
```

**Expected Output:**
```
✅ MongoDB connected
🗑️  Cleared existing employees
✅ Seeded 4 employees successfully:
  - Employee One (employee@oppty.com) - Role: employee
  - Admin User (admin@oppty.com) - Role: admin
  - Maya (maya@oppty.com) - Role: employee
  - Jason (jason@oppty.com) - Role: employee

💡 You can now login with these credentials:
   Employee: employee@oppty.com / 123456
   Admin: admin@oppty.com / admin123
   Maya: maya@oppty.com / maya123
   Jason: jason@oppty.com / jason123
```

---

### Step 5: Start the Backend Server

```powershell
npm start
```

**Expected Output:**
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
📡 API available at http://localhost:5000/api
💚 Health check: http://localhost:5000/health
```

---

## 🔌 API Endpoints

### Authentication Routes

#### 1. **POST** `/api/auth/login`
Login with email and password

**Request:**
```json
{
  "email": "employee@oppty.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "employee": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k",
    "email": "employee@oppty.com",
    "name": "Employee One",
    "role": "employee"
  }
}
```

---

#### 2. **POST** `/api/auth/forgot-password`
Send OTP to email

**Request:**
```json
{
  "email": "employee@oppty.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP has been sent successfully to your email"
}
```

**Note:** OTP is logged to console in development. Check server terminal.

---

#### 3. **POST** `/api/auth/verify-otp`
Verify OTP

**Request:**
```json
{
  "email": "employee@oppty.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

---

#### 4. **POST** `/api/auth/reset-password`
Reset password

**Request:**
```json
{
  "email": "employee@oppty.com",
  "newPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

---

### Health Check

#### **GET** `/health`
Check server status

**Response:**
```json
{
  "status": "OK",
  "message": "TheOpptyTeam Backend is running",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## 🧪 Testing the Backend

### Using Browser

1. Open: `http://localhost:5000/health`
2. You should see the health check response

### Using curl (PowerShell)

```powershell
# Test login
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -Body '{"email":"employee@oppty.com","password":"123456"}'
```

---

## 🔐 Default Login Credentials

| Email | Password | Role |
|-------|----------|------|
| employee@oppty.com | 123456 | employee |
| admin@oppty.com | admin123 | admin |
| maya@oppty.com | maya123 | employee |
| jason@oppty.com | jason123 | employee |

---

## 🏃 Running in Development Mode

For auto-restart on file changes:

```powershell
npm run dev
```

---

## 📁 Backend Structure

```
backend/
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   └── Employee.js          # MongoDB employee model
├── routes/
│   └── auth.js              # Authentication routes
├── scripts/
│   └── seed.js              # Database seeding script
├── .env                     # Environment variables
├── package.json             # Dependencies
└── server.js                # Main Express server
```

---

## 🔧 Troubleshooting

### MongoDB Connection Failed

**Error:** `MongooseServerSelectionError`

**Solutions:**
1. Check `MONGODB_URI` in `.env` is correct
2. Verify username and password are correct
3. Check MongoDB cluster is running (Atlas dashboard)
4. Ensure IP address is whitelisted in Atlas

### Port Already in Use

**Error:** `EADDRINUSE :::5000`

**Solution:**
Change port in `.env`:
```env
PORT=5001
```

Then update frontend `.env`:
```env
VITE_API_URL=http://localhost:5001/api
```

### Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:**
```powershell
cd backend
npm install
```

### JWT Token Errors

**Solution:**
Ensure `JWT_SECRET` is set in `.env` and is at least 32 characters.

---

## 🚀 Next Steps

1. ✅ Backend server is running
2. ✅ Database is seeded with employees
3. ✅ Frontend is configured to use API

Now you can:
- Start the frontend: `npm run dev` (in root folder)
- Login with any employee credentials
- Test forgot password flow
- All data is now persisted in MongoDB!

---

## 📝 Notes

- Passwords are automatically hashed before saving
- JWT tokens expire after 7 days
- OTP codes expire after 10 minutes
- In production, configure actual email sending for OTP
- Change all default passwords before deployment

---

## 🔒 Security Checklist for Production

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB IP whitelist (don't use 0.0.0.0/0)
- [ ] Use HTTPS for frontend and backend
- [ ] Remove console.log of OTP
- [ ] Implement actual email sending service
- [ ] Add rate limiting to prevent brute force attacks
- [ ] Regular security audits and updates

---

## 📞 Need Help?

Check these resources:
- MongoDB Atlas documentation: https://docs.atlas.mongodb.com/
- Express.js guide: https://expressjs.com/
- Mongoose documentation: https://mongoosejs.com/
- JWT.io: https://jwt.io/

---

**Happy Coding! 🎉**
