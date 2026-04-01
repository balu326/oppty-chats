# ✅ Deployment Checklist for Oppty Chats

## Pre-Deployment Checklist

### Code Preparation
- [ ] Push all code to GitHub
- [ ] Create `.gitignore` with `node_modules/`, `.env`, `dist/`, `uploads/`
- [ ] Update backend CORS configuration in `server.js`
- [ ] Add `backend/uploads/.gitkeep` file
- [ ] Test locally: `npm run dev` (frontend) and `cd backend && npm run dev`

### MongoDB Atlas
- [ ] Create MongoDB Atlas account (if needed)
- [ ] Create FREE M0 cluster
- [ ] Create database user with username/password
- [ ] Whitelist IP: `0.0.0.0/0` (allow all)
- [ ] Get connection string
- [ ] Test connection string locally

### Environment Variables
- [ ] Generate secure JWT_SECRET (use random string generator)
- [ ] Note MongoDB URI
- [ ] Prepare production environment variables list

---

## Render.com Deployment

### Backend Deployment
- [ ] Sign up at Render.com (use GitHub login)
- [ ] Create "New Web Service"
- [ ] Connect GitHub repository
- [ ] Set Root Directory to `backend`
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `node server.js`
- [ ] Select FREE tier
- [ ] Add environment variables:
  - [ ] `PORT=5000`
  - [ ] `NODE_ENV=production`
  - [ ] `MONGODB_URI=<your_connection_string>`
  - [ ] `JWT_SECRET=<secure_random_string>`
  - [ ] `CORS_ORIGIN=*`
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (3-5 min)
- [ ] Copy backend URL (e.g., `https://oppty-backend.onrender.com`)

### Frontend Deployment
- [ ] Create "New Static Site" on Render
- [ ] Connect same GitHub repository
- [ ] Leave Root Directory empty
- [ ] Set Build Command: `npm install && npm run build`
- [ ] Set Publish Directory: `dist`
- [ ] Select FREE tier
- [ ] Add environment variable:
  - [ ] `VITE_API_URL=https://your-backend.onrender.com/api`
- [ ] Click "Create Static Site"
- [ ] Wait for build (2-3 min)
- [ ] Copy frontend URL

### Final Configuration
- [ ] Update backend `CORS_ORIGIN` to frontend URL
- [ ] Wait for redeploy
- [ ] Test the app!

---

## Testing Checklist

### Basic Functionality
- [ ] Open frontend URL in browser
- [ ] Register new account
- [ ] Login with credentials
- [ ] Send text message
- [ ] See message appear in chat

### File Uploads
- [ ] Upload photo (📷)
- [ ] Photo appears in chat as thumbnail
- [ ] Click photo to view full size
- [ ] Upload video (🎥)
- [ ] Video plays in chat
- [ ] Take photo with camera (📸)
- [ ] Share link (🔗)
- [ ] Link appears clickable
- [ ] Upload document (📁 Any File)
- [ ] Document downloadable

### Cross-Browser Testing
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on mobile browser
- [ ] Test on Safari (if available)

### Performance
- [ ] Check page load time
- [ ] Message delivery speed
- [ ] File upload speed
- [ ] No console errors

---

## Cloudinary Setup (Optional but Recommended)

### Account Setup
- [ ] Sign up at Cloudinary.com
- [ ] Verify email
- [ ] Get credentials from dashboard:
  - [ ] Cloud Name
  - [ ] API Key
  - [ ] API Secret

### Code Updates
- [ ] Install dependencies: `npm install cloudinary multer-storage-cloudinary`
- [ ] Update `backend/routes/messages.js` with Cloudinary storage
- [ ] Add Cloudinary env variables to Render:
  - [ ] `CLOUDINARY_CLOUD_NAME`
  - [ ] `CLOUDINARY_API_KEY`
  - [ ] `CLOUDINARY_API_SECRET`
- [ ] Push code to GitHub
- [ ] Wait for auto-deploy

### Test Cloudinary
- [ ] Upload test image
- [ ] Verify image stored on Cloudinary dashboard
- [ ] Check image persists after refresh
- [ ] Test video upload
- [ ] Test document upload

---

## Post-Deployment

### Documentation
- [ ] Save all URLs:
  - Frontend: _________________
  - Backend API: _________________
  - MongoDB Atlas: _________________
  - Cloudinary: _________________
- [ ] Share frontend URL with team
- [ ] Document login credentials (for test accounts)

### Monitoring
- [ ] Bookmark Render dashboard
- [ ] Check logs regularly
- [ ] Monitor free tier hours usage
- [ ] Set up MongoDB Atlas monitoring

### Security
- [ ] Change default JWT_SECRET
- [ ] Restrict CORS_ORIGIN to specific URLs
- [ ] Enable MongoDB Atlas network security
- [ ] Review file upload restrictions

---

## Troubleshooting Common Issues

### If Backend Won't Deploy
- [ ] Check build logs for errors
- [ ] Verify `package.json` has all dependencies
- [ ] Ensure `server.js` exists in backend folder
- [ ] Check PORT environment variable is set

### If Frontend Shows Blank Page
- [ ] Check browser console for errors
- [ ] Verify `VITE_API_URL` is correct
- [ ] Check if backend is running (visit `/health` endpoint)
- [ ] Clear browser cache

### If CORS Errors Appear
- [ ] Verify `CORS_ORIGIN` matches frontend URL exactly
- [ ] Include `/api` in `VITE_API_URL` but not in `CORS_ORIGIN`
- [ ] Redeploy backend after changing CORS
- [ ] Try setting `CORS_ORIGIN=*` temporarily

### If File Uploads Fail
- [ ] Check backend logs for multer errors
- [ ] Verify file size is under 10MB
- [ ] Check file type is allowed
- [ ] Set up Cloudinary for persistent storage

### If Messages Don't Appear
- [ ] Check MongoDB connection
- [ ] Verify messages are being saved to DB
- [ ] Check frontend is fetching from correct API endpoint
- [ ] Look for JavaScript errors in console

---

## Success Criteria

Your deployment is successful when:

- ✅ Frontend loads without errors
- ✅ Can register and login
- ✅ Can send and receive text messages
- ✅ Can upload photos/videos
- ✅ Can share links
- ✅ Can upload documents
- ✅ All features work on mobile
- ✅ No console errors
- ✅ Backend responds within 5 seconds
- ✅ Files persist (if using Cloudinary)

---

## Quick Reference Commands

### Local Development
```bash
# Frontend
npm run dev

# Backend
cd backend
npm run dev
```

### Git & Deployment
```bash
# Commit and push changes
git add .
git commit -m "Description"
git push origin main

# This triggers auto-deploy on Render!
```

### Testing Backend
```bash
# Test if backend is running
curl https://your-backend.onrender.com/health

# Should return: {"status":"OK",...}
```

---

## Important URLs to Remember

After deployment, save these:

```
Frontend App:
https://_________________.onrender.com

Backend API:
https://_________________.onrender.com/api

MongoDB Atlas:
https://cloud.mongodb.com/

Render Dashboard:
https://dashboard.render.com/

Cloudinary (if using):
https://cloudinary.com/
```

---

## Next Steps After Successful Deployment

1. Share app URL with users
2. Gather feedback
3. Monitor performance
4. Plan feature enhancements
5. Consider upgrading hosting if needed
6. Set up regular backups
7. Implement analytics
8. Add error tracking (e.g., Sentry)

---

**🎉 Congratulations! Your Oppty Chats app is live and ready to use!**
