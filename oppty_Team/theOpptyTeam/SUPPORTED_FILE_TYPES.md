# 📁 Complete File Type Support Guide

## ✅ All File Types Supported!

Your Oppty Chats application now supports uploading **ANY file type** (with security restrictions for safety).

---

## 🎯 Supported File Categories

### 📷 **Images** (Photo Upload)
- JPEG / JPG
- PNG
- GIF
- BMP
- WebP
- SVG
- TIFF
- ICO
- HEIC
- RAW formats

### 🎥 **Videos** (Video Upload)
- MP4
- WebM
- AVI
- MOV
- WMV
- FLV
- MKV
- M4V

### 📁 **Documents & All Files** (Any File Upload)

#### Office Documents
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)
- Microsoft PowerPoint (.ppt, .pptx)
- OpenDocument formats (.odt, .ods, .odp)

#### Text Files
- Plain Text (.txt)
- Rich Text Format (.rtf)
- Markdown (.md)
- HTML (.html, .htm)
- XML (.xml)
- JSON (.json)
- CSV (.csv)

#### Archives/Compressed Files
- ZIP (.zip)
- RAR (.rar)
- 7Z (.7z)
- TAR (.tar)
- GZIP (.gz)

#### Audio Files
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- FLAC (.flac)
- AAC (.aac)
- WMA (.wma)
- M4A (.m4a)

#### Design & Creative Files
- Adobe Photoshop (.psd)
- Adobe Illustrator (.ai)
- Sketch (.sketch)
- Figma files
- AutoCAD (.dwg, .dxf)

#### Code Files
- JavaScript (.js)
- TypeScript (.ts)
- Python (.py)
- Java (.java)
- C/C++ (.c, .cpp, .h)
- Go (.go)
- Rust (.rs)
- PHP (.php)
- Ruby (.rb)
- Swift (.swift)
- Kotlin (.kt)

#### Database Files
- SQLite (.db, .sqlite)
- SQL dumps (.sql)
- Access (.mdb, .accdb)

#### Fonts
- TrueType (.ttf)
- OpenType (.otf)
- Web Font (.woff, .woff2)

#### Configuration Files
- INI (.ini)
- CFG (.cfg)
- YAML (.yml, .yaml)
- TOML (.toml)
- ENV (.env)

#### And Many More!
✅ Basically **ANY file extension** that's not in the blocked list below

---

## 🔒 Blocked File Types (For Security)

The following executable file types are **BLOCKED** for security reasons:

- ❌ .exe - Executable programs
- ❌ .bat - Batch files
- ❌ .cmd - Command scripts
- ❌ .scr - Screen savers
- ❌ .pif - Program information files
- ❌ .com - Command files
- ❌ .vbs - VBScript files
- ❌ .js - JavaScript files (as executables)
- ❌ .jar - Java archives (executable)
- ❌ .msi - Windows installer packages
- ❌ .dll - Dynamic link libraries
- ❌ .ocx - ActiveX controls

**Reason:** These file types can contain malicious code and pose security risks.

---

## 📊 File Size Limits

| Feature | Maximum Size |
|---------|-------------|
| All uploads | **10 MB** per file |
| Photos | 10 MB |
| Videos | 10 MB |
| Documents | 10 MB |
| Any other file | 10 MB |

---

## 💡 Usage Examples

### Example 1: Sending a ZIP Archive
1. Click ➕ button
2. Select "📁 Any File"
3. Choose your `.zip` file
4. Uploads and appears in chat as downloadable link

### Example 2: Sharing an MP3 Audio
1. Click ➕ button
2. Select "📁 Any File"
3. Choose your `.mp3` file
4. Recipients can download and play it

### Example 3: Sending a PSD File
1. Click ➕ button
2. Select "📁 Any File"
3. Choose your `.psd` (Photoshop) file
4. File is stored and can be downloaded

### Example 4: Uploading a Python Script
1. Click ➕ button
2. Select "📁 Any File"
3. Choose your `.py` file
4. Code file is shared with team

---

## 🎨 How Files Appear in Chat

### Images (Photos)
```
[Image Preview]
filename.jpg
🕐 10:30 AM
```
- Shows thumbnail preview
- Click to view full size

### Videos
```
[Video Player]
filename.mp4
🕐 10:30 AM
```
- Embedded video player
- Play/pause controls

### Links
```
🔗 https://example.com/page
🕐 10:30 AM
```
- Clickable URL preview

### All Other Files (Documents, Archives, Audio, etc.)
```
📁 filename.zip
🕐 10:30 AM
```
- Shows file icon
- Click to download
- Displays original filename

---

## 💾 Storage Details

### Database Storage
Every uploaded file is stored with metadata:

```javascript
{
  chatId: "chat_123",
  sender: ObjectId("..."),
  text: "",
  attachment: {
    type: "document",        // or "photo", "video", "link"
    url: "/uploads/file-123.xyz",
    fileName: "original-name.xyz",
    fileSize: 2048576,       // in bytes
    mimeType: "application/x-something"
  },
  createdAt: Date
}
```

### File System Storage
Files are saved in:
```
backend/uploads/
├── file-123456789.jpg
├── video-987654321.mp4
├── document-456789123.pdf
├── archive-789123456.zip
└── audio-321654987.mp3
```

---

## 🔍 Technical Details

### Frontend Validation
- File picker accepts: `*/*` (all MIME types)
- Max size check: 10MB enforced before upload
- User-friendly error messages

### Backend Validation
- Blocks dangerous executable extensions
- Validates file size (max 10MB)
- Sanitizes filenames
- Generates unique filenames to prevent conflicts

### Security Features
✅ No executable files allowed  
✅ File size limits enforced  
✅ Filename sanitization  
✅ Unique file naming  
✅ MIME type detection  
✅ Authentication required  

---

##  Quick Test

Try uploading these different file types:

1. ✅ Upload a **PDF** → Works!
2. ✅ Upload a **ZIP** → Works!
3. ✅ Upload an **MP3** → Works!
4. ✅ Upload a **PSD** → Works!
5. ✅ Upload a **Python script** → Works!
6. ✅ Upload an **Excel file** → Works!
7. ✅ Upload a **TXT file** → Works!
8. ❌ Try uploading an **EXE** → Blocked (security)

---

## 📈 Statistics

Your attachment system now supports:

- ✅ **100+ file formats** across all categories
- ✅ **Unlimited file types** (except blocked executables)
- ✅ **10MB max size** per file
- ✅ **Secure storage** with metadata
- ✅ **Permanent database** storage
- ✅ **Easy downloads** for recipients

---

## 🎉 Summary

**You can now share ANY type of file!**

Whether it's:
- Office documents
- Design files
- Code files
- Audio files
- Archives
- Databases
- Config files
- Or any other file format...

Just click **➕** → **📁 Any File** and upload! 🚀

All files are:
- ✅ Stored on server
- ✅ Saved in database
- ✅ Accessible anytime
- ✅ Downloadable by recipients
- ✅ Securely handled

**The only limit is 10MB file size and no executable files for security!**
