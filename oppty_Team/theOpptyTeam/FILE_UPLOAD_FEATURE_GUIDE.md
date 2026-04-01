# 📎 File Upload & Link Sharing Feature Guide

## ✅ What's New

Your Oppty Chats application now supports sending:
- 📷 **Photos** (JPEG, PNG, GIF)
- 🎥 **Videos** (MP4, WebM, AVI, MOV)
- 📄 **Documents** (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT)
- 🔗 **Links** (URLs)
- 📸 **Camera Photos** (Take photos directly)

All attachments are stored in the database and can be retrieved anytime!

---

## 🚀 Setup Instructions

### Step 1: Install Multer (Required for File Uploads)

**Windows:**
```bash
cd backend
npm install multer
```

**Or simply run:**
```bash
install-multer.bat
```

### Step 2: Start the Backend Server

```bash
cd backend
npm run dev
```

The server will automatically create an `uploads` folder when files are uploaded.

### Step 3: Start the Frontend

```bash
npm run dev
```

---

## 📱 How to Use

### Sending a Photo/Video/Document

1. **Click the ➕ (plus) button** next to the chat input
2. **Choose an option:**
   - 📷 Photo - Select from your device
   - 🎥 Video - Select from your device
   - 📸 Take Photo - Use your camera
   - 🔗 Link - Share a URL
   - 📄 Document - Upload a file

3. **Select your file** from the file picker
4. **File uploads automatically** and appears in the chat!

### Sharing a Link

1. **Click the ➕ (plus) button**
2. **Click "🔗 Link"**
3. **Paste or type the URL** in the modal
4. **Click "Send Link"**
5. Link appears in the chat with a preview!

---

## 💾 Database Storage

### Message Schema Updates

All messages now support an `attachment` field with:

```javascript
{
  type: 'photo' | 'video' | 'document' | 'link',
  url: '/uploads/filename.jpg',
  fileName: 'original-filename.jpg',
  fileSize: 1024000,  // in bytes
  mimeType: 'image/jpeg'
}
```

### Database Structure

**Text Messages:**
```javascript
{
  chatId: "chat_123",
  sender: ObjectId("..."),
  text: "Hello!",
  attachment: null,
  createdAt: Date
}
```

**Photo/Video/Document Messages:**
```javascript
{
  chatId: "chat_123",
  sender: ObjectId("..."),
  text: "",  // Empty for pure attachments
  attachment: {
    type: "photo",
    url: "/uploads/file-123456789.jpg",
    fileName: "my-photo.jpg",
    fileSize: 1024000,
    mimeType: "image/jpeg"
  },
  createdAt: Date
}
```

**Link Messages:**
```javascript
{
  chatId: "chat_123",
  sender: ObjectId("..."),
  text: "Check out this link: https://example.com",
  attachment: {
    type: "link",
    url: "https://example.com"
  },
  createdAt: Date
}
```

---

## 📁 File Storage Location

Files are stored in:
```
backend/uploads/
├── file-123456789.jpg
├── video-987654321.mp4
└── document-456789123.pdf
```

The `uploads` folder is created automatically when you upload your first file.

---

## 🔧 API Endpoints

### Upload a File
```
POST /api/messages/upload
Content-Type: multipart/form-data

Body:
- file: [File]
- chatId: string
- senderId: string

Response:
{
  success: true,
  message: { ...message with attachment... },
  fileUrl: "/uploads/file-123456789.jpg"
}
```

### Share a Link
```
POST /api/messages/link
Content-Type: application/json

Body:
{
  chatId: "chat_123",
  senderId: "user_456",
  url: "https://example.com"
}

Response:
{
  success: true,
  message: { ...message with link... }
}
```

---

## ⚙️ Configuration

### File Size Limits
- **Maximum file size:** 10MB
- Configurable in `backend/routes/messages.js`

### Allowed File Types
- **Images:** JPEG, JPG, PNG, GIF
- **Videos:** MP4, WebM, AVI, MOV
- **Documents:** PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT

You can modify allowed types in the `fileFilter` function in `backend/routes/messages.js`.

---

## 🎨 UI Features

### Attachment Menu
- Animated popup menu
- Emoji icons for each option
- Hover effects

### Message Display
- **Photos:** Displayed as thumbnails (max 320x400px)
- **Videos:** Embedded video player with controls
- **Links:** Clickable preview with URL
- **Documents:** Downloadable file links

### Responsive Design
- Works on mobile and desktop
- Touch-friendly buttons
- Adaptive layout

---

## 🐛 Troubleshooting

### "Multer is not defined" Error
**Solution:** Run `npm install multer` in the backend folder

### Files Not Uploading
**Check:**
1. Backend server is running
2. `uploads` folder exists and is writable
3. File size is under 10MB
4. File type is allowed

### Links Not Working
**Check:**
1. URL format is valid (starts with http:// or https://)
2. Backend `/api/messages/link` endpoint is accessible

### Attachments Not Showing
**Check:**
1. Message object has `attachment` field populated
2. Backend serves static files from `/uploads`
3. Frontend can access backend API URL

---

## 📊 Database Commands

### View Messages with Attachments
```javascript
// In MongoDB Compass or Shell
db.messages.find({ "attachment.type": { $exists: true } })
```

### Count Attachments by Type
```javascript
db.messages.aggregate([
  { $match: { "attachment.type": { $exists: true } } },
  { $group: { _id: "$attachment.type", count: { $sum: 1 } } }
])
```

---

## 🔒 Security Notes

1. **File Type Validation:** Only allowed file types are accepted
2. **Size Limits:** Maximum 10MB per file
3. **Authentication:** All uploads require valid JWT token
4. **Path Traversal Prevention:** Filenames are sanitized

---

## 📝 Future Enhancements

- [ ] Image compression before upload
- [ ] Video thumbnails generation
- [ ] File preview before sending
- [ ] Progress bar for large uploads
- [ ] Multiple file selection
- [ ] Voice messages
- [ ] Sticker support

---

## 🎉 Success!

You're all set! Your chat application now has full file upload and link sharing capabilities with database storage.

**Test it out:**
1. Start backend: `npm run dev` (in backend folder)
2. Start frontend: `npm run dev` (in root folder)
3. Open chat and click the ➕ button
4. Upload a photo, video, or share a link!

---

**Questions or Issues?** Check the console logs for detailed error messages.
