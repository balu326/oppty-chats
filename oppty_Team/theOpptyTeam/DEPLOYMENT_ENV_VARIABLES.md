# 🚀 Deployment Environment Variables for Render

## Backend Service - Environment Variables

Copy these to your Render backend service:

```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://reddybalaji326_db_user:Oppty123@cluster0.cdf0s9c.mongodb.net/oppty-chats?retryWrites=true&w=majority
JWT_SECRET=oppty_chats_production_secret_key_abc123xyz789_CHANGE_THIS
CORS_ORIGIN=https://oppty-frontend.onrender.com
FRONTEND_URL=https://oppty-frontend.onrender.com
```

⚠️ **IMPORTANT:** Change `JWT_SECRET` to your own random string before deploying!

---

## Frontend Service - Environment Variables

Copy this to your Render frontend service:

```
VITE_API_URL=https://your-backend-name.onrender.com/api
```

Replace `your-backend-name` with your actual backend service name!

---

## How to Add on Render:

### For Backend:
1. Go to Render Dashboard
2. Click your backend service
3. Click "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable one by one
6. Click "Save Changes"

### For Frontend:
1. Go to Render Dashboard
2. Click your frontend service
3. Click "Environment" tab
4. Click "Add Environment Variable"
5. Add `VITE_API_URL`
6. Click "Save Changes"

---

## 🔒 Security Notes:

- ✅ Never commit `.env` files to Git
- ✅ Change JWT_SECRET for production
- ✅ Use strong passwords
- ✅ Keep database credentials private
- ✅ Set CORS_ORIGIN to your actual frontend URL (not *)

---

## 📊 Your Database Info:

| Component | Value |
|-----------|-------|
| Database Name | `oppty-chats` |
| Cluster | `cluster0.cdf0s9c` |
| Username | `reddybalaji326_db_user` |
| Password | `Oppty123` ⚠️ Change in production! |
| Connection | MongoDB Atlas (Cloud) |

---

## ✅ Pre-Deployment Checklist:

- [ ] Update JWT_SECRET to random secure string
- [ ] Test local connection with new database
- [ ] Verify database has correct collections
- [ ] Add all environment variables to Render
- [ ] Set CORS_ORIGIN to your frontend URL
- [ ] Redeploy backend after adding variables
- [ ] Test frontend can connect to backend

---

##  Quick Deploy Commands:

```bash
# Test locally first
cd backend
npm run dev

# In another terminal
cd theOpptyTeam
npm run dev
```

If everything works locally → Ready for deployment! 🚀
