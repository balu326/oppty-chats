# 🚀 Quick Deploy to Render - Step by Step

## ⏱️ Total Time: 15 minutes

---

## Step 1: Prepare Your Code (2 min)

### A. Update Backend CORS

Open `backend/server.js` and update the CORS configuration:

```javascript
// Replace line 19 with this:
app.use(cors({
  origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

### B. Create Production .env Template

Create a file `backend/.env.production`:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=YOUR_MONGODB_ATLAS_URI_HERE
JWT_SECRET=CHANGE_THIS_TO_RANDOM_SECURE_STRING_abc123xyz789
FRONTEND_URL=https://your-app-name.onrender.com
CORS_ORIGIN=*
```

**⚠️ IMPORTANT:** Change `JWT_SECRET` to a random string!

### C. Add .gitkeep for Uploads Folder

```bash
cd backend
touch uploads/.gitkeep
# Or on Windows PowerShell:
New-Item -Path "uploads\.gitkeep" -ItemType File
```

### D. Push to GitHub

```bash
cd theOpptyTeam
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

If you don't have Git repo yet:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
# Then create repo on GitHub and follow their instructions
```

---

## Step 2: Set Up MongoDB Atlas (3 min)

### If You Already Have MongoDB Atlas:
Skip to Step 3!

### If You Need MongoDB Atlas:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up (FREE)
3. Create Cluster:
   - Click "Build a Database"
   - Choose **FREE** tier (M0)
   - Select region closest to you (e.g., AWS - Singapore)
   - Click "Create"
4. Create Database User:
   - Username: `oppty-admin`
   - Password: (create strong password, save it!)
   - Click "Create User"
5. Network Access:
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"
6. Get Connection String:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your user password
   - Replace `<dbname>` with `oppty-chats`

Example:
```
mongodb+srv://oppty-admin:MyPassword123@cluster0.abc123.mongodb.net/oppty-chats?retryWrites=true&w=majority
```

---

## Step 3: Deploy Backend on Render (5 min)

### A. Sign Up

1. Go to [Render.com](https://render.com)
2. Click "Sign Up"
3. Use **GitHub login** (recommended) or email

### B. Create Web Service

1. After login, click **"New +"** → **"Web Service"**
2. Click **"Connect a repository"**
3. Find and select your `oppty-chats` repository
4. Configure the service:

```yaml
Name: oppty-backend
Region: Singapore (closest to India)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: node server.js
```

### C. Choose Free Plan

- Scroll down to "Instance Type"
- Select **"Free"**
- Click **"Advanced"** (show more options)
- Leave everything as default

### D. Add Environment Variables

Click **"Environment"** tab, then add these variables one by one:

| Key | Value |
|-----|-------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `your_mongodb_atlas_connection_string` |
| `JWT_SECRET` | `random_secure_string_here_xyz789abc` |
| `CORS_ORIGIN` | `*` |

**Example values:**
```
MONGODB_URI=mongodb+srv://oppty-admin:Password123@cluster0.abc123.mongodb.net/oppty-chats
JWT_SECRET=my_super_secret_key_abc123_change_this
```

### E. Click "Create Web Service"

- Deployment starts automatically
- Wait 3-5 minutes for build
- When you see **"Deployed"** with green checkmark, you're done!

### F. Copy Backend URL

- Click on your service
- Copy the URL at top (e.g., `https://oppty-backend-xyz.onrender.com`)
- Save this for next step!

---

## Step 4: Deploy Frontend on Render (3 min)

### A. Create Static Site

1. Go back to Render Dashboard
2. Click **"New +"** → **"Static Site"**
3. Select same `oppty-chats` repository
4. Configure:

```yaml
Name: oppty-frontend
Branch: main
Root Directory: (leave empty - root level)
Build Command: npm install && npm run build
Publish Directory: dist
```

### B. Choose Free Plan

- Select **"Free"** tier
- Click **"Advanced"** (show more)

### C. Add Environment Variable

Click **"Environment"** tab, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-backend-url.onrender.com/api` |

**Example:**
```
VITE_API_URL=https://oppty-backend-xyz.onrender.com/api
```

### D. Click "Create Static Site"

- Build starts automatically
- Wait 2-3 minutes
- When you see **"Live"** with green checkmark, done!

### E. Copy Frontend URL

- Copy the URL (e.g., `https://oppty-frontend-abc.onrender.com`)
- This is your live app URL!

---

## Step 5: Update Backend CORS (2 min)

### A. Go Back to Backend Service

1. In Render dashboard, click your **backend** service
2. Click **"Environment"** tab

### B. Update CORS_ORIGIN

Find `CORS_ORIGIN` variable and update it:

```
CORS_ORIGIN=https://oppty-frontend-abc.onrender.com
```

(Use your actual frontend URL)

### C. Save & Redeploy

- Click **"Save Changes"**
- Automatic redeploy starts
- Wait 1-2 minutes

---

## Step 6: Test Your App! (1 min)

### Open Your Frontend URL

1. Open the frontend URL in browser
2. Register a new account
3. Send a test message
4. Try uploading a photo
5. Share a link

**🎉 Congratulations! Your app is LIVE!**

---

## 🔧 Optional: Set Up Cloudinary (For Permanent File Storage)

**Why?** Render's file uploads are temporary. For permanent storage:

### A. Create Cloudinary Account

1. Go to [Cloudinary.com](https://cloudinary.com)
2. Sign up (FREE)
3. Get credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### B. Install Dependencies

In your code, update `backend/package.json`:

```json
"dependencies": {
  "cloudinary": "^1.41.0",
  "multer-storage-cloudinary": "^4.6.0"
}
```

Push to GitHub.

### C. Follow Cloudinary Setup in FREE_HOSTING_GUIDE.md

---

## ⚠️ Troubleshooting

### Issue: Backend shows "Cannot find module 'multer'"

**Solution:** Make sure `multer` is in `backend/package.json`:

```bash
cd backend
npm install multer
git add .
git commit -m "Add multer"
git push
```

### Issue: CORS Error in Browser Console

**Solution:** 
1. Check `CORS_ORIGIN` matches frontend URL exactly
2. Include `/api` in `VITE_API_URL` but not in `CORS_ORIGIN`
3. Redeploy backend after changing env variable

### Issue: "Backend Sleeping"

**Solution:** Render free tier sleeps after 15 min inactivity. Options:
1. Accept it (wakes up in ~30 seconds)
2. Use UptimeRobot.com to ping every 10 min
3. Switch to Railway.app (no sleep)

### Issue: Files Not Persisting

**Solution:** This is normal on Render! Set up Cloudinary (see above) or use Railway/Railway combo.

---

## 📊 Your Live URLs

After deployment, you'll have:

```
Frontend: https://oppty-frontend-xxxxx.onrender.com
Backend API: https://oppty-backend-xxxxx.onrender.com/api
```

Share the frontend URL with your team!

---

## 🎯 Next Steps

1. ✅ Test all features (messages, uploads, links)
2. ✅ Set up Cloudinary for permanent file storage
3. ✅ Share URL with your team
4. ✅ Monitor usage in Render dashboard
5. ✅ Consider upgrading to paid plan if needed

---

## 💡 Pro Tips

- **Keep GitHub in sync**: Any push to `main` branch auto-deploys
- **Check logs**: Render dashboard shows real-time logs
- **Monitor hours**: Free tier = 750 hours/month total
- **Database backups**: Enable MongoDB Atlas backups

---

## 🆘 Need Help?

1. Check Render dashboard logs
2. Verify all environment variables
3. Test backend API directly (add `/health` to backend URL)
4. Check browser console for errors

---

**You're all set! Happy chatting! 💬**
