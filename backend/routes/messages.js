import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Message from '../models/Message.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - allow all file types for documents, restrict only dangerous executables
const fileFilter = (req, file, cb) => {
  // Block potentially dangerous executable files
  const blockedTypes = /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|msi|dll|ocx)$/i;
  const extname = !blockedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Allow all other file types
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('This file type is not allowed for security reasons.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: fileFilter
});

// GET /api/messages/:chatId - Get all messages for a chat
router.get('/:chatId', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // For DM chats with new format (ID_ID), just query directly
    // For old format (single ID), we need to handle both directions
    let query;
    
    if (userId && req.params.chatId.includes('_')) {
      // New format: chatId is already the conversation ID (e.g., A_B)
      query = { chatId: req.params.chatId };
      
      console.log(`🔍 Querying DM conversation: ${req.params.chatId}`);
    } else if (userId) {
      // Old format: Need to check both possible chatIds
      const requestedChatId = req.params.chatId;
      const sortedIds = [userId, requestedChatId].sort();
      const properConvId = `${sortedIds[0]}_${sortedIds[1]}`;
      
      console.log(`🔍 Converting old format to new: ${properConvId}`);
      
      // Try new format first
      query = { chatId: properConvId };
    } else {
      query = { chatId: req.params.chatId };
    }
    
    console.log('📝 Final query:', JSON.stringify(query));
    
    const messages = await Message.find(query)
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });
    
    console.log(`📦 Raw messages from DB: ${messages.length}`);
    
    // Remove duplicates by _id using Map (preserves order)
    const uniqueMessagesMap = new Map();
    messages.forEach(msg => {
      const msgId = msg._id.toString();
      if (!uniqueMessagesMap.has(msgId)) {
        uniqueMessagesMap.set(msgId, msg);
      } else {
        console.log(`⚠️ Duplicate message ID found in DB response: ${msgId}`);
      }
    });
    
    const uniqueMessages = Array.from(uniqueMessagesMap.values());
    
    console.log(`✅ Unique messages after deduplication: ${uniqueMessages.length}`);
    
    res.json({
      success: true,
      messages: uniqueMessages,
      totalFetched: messages.length,
      uniqueCount: uniqueMessages.length
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages - Send a new message
router.post('/', async (req, res) => {
  try {
    const { chatId, senderId, text } = req.body;

    if (!chatId || !senderId || !text) {
      return res.status(400).json({ message: 'Chat ID, sender ID, and text are required' });
    }

    console.log('📨 Message request received:', {
      chatId,
      senderId,
      text: text.substring(0, 30),
      timestamp: new Date().toISOString()
    });

    // Prevent duplicate messages - check if same sender sent same text in last 10 seconds
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const recentMessages = await Message.find({
      chatId,
      sender: senderId,
      text: text.trim(),
      createdAt: { $gte: tenSecondsAgo }
    }).sort({ createdAt: -1 }).limit(10);

    console.log('🔍 Found', recentMessages.length, 'recent messages to check');

    if (recentMessages.length > 0) {
      // Check for exact duplicates within 5 seconds (stricter window)
      const fiveSecondsAgo = Date.now() - 5000;
      const veryRecentDuplicate = recentMessages.find(msg => 
        msg.createdAt.getTime() > fiveSecondsAgo
      );

      if (veryRecentDuplicate) {
        console.log('⚠️ DUPLICATE PREVENTED:', {
          chatId,
          senderId,
          text: text.substring(0, 30),
          existingId: veryRecentDuplicate._id.toString(),
          existingTime: veryRecentDuplicate.createdAt.toISOString(),
          timeDiffMs: Date.now() - veryRecentDuplicate.createdAt.getTime()
        });
        
        // Return the existing message instead of creating a duplicate
        const populatedMessage = await Message.findById(veryRecentDuplicate._id)
          .populate('sender', 'name email role');
        
        return res.json({
          success: true,
          message: populatedMessage,
          isDuplicate: true,
          existingMessage: true
        });
      }
    }

    const message = new Message({
      chatId,
      sender: senderId,
      text: text.trim()
    });

    await message.save();
    
    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role');

    console.log('✅ New message created successfully:', {
      _id: message._id,
      chatId,
      senderId,
      text: text.substring(0, 30),
      createdAt: message.createdAt.toISOString()
    });

    res.json({
      success: true,
      message: populatedMessage,
      isNew: true
    });
  } catch (error) {
    console.error('❌ Create message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages/upload - Upload a file (photo, video, document)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { chatId, senderId } = req.body;

    if (!chatId || !senderId) {
      return res.status(400).json({ message: 'Chat ID and sender ID are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('📤 File upload request:', {
      chatId,
      senderId,
      fileName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Determine attachment type based on mimetype
    let attachmentType = 'document';
    if (req.file.mimetype.startsWith('image/')) {
      attachmentType = 'photo';
    } else if (req.file.mimetype.startsWith('video/')) {
      attachmentType = 'video';
    }

    // Create file URL (relative path for now)
    const fileUrl = `/uploads/${req.file.filename}`;

    // Create message with attachment
    const message = new Message({
      chatId,
      sender: senderId,
      text: '', // No text, just attachment
      attachment: {
        type: attachmentType,
        url: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });

    await message.save();
    
    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role');

    console.log('✅ File uploaded successfully:', {
      _id: message._id,
      type: attachmentType,
      fileName: req.file.originalname
    });

    res.json({
      success: true,
      message: populatedMessage,
      fileUrl: fileUrl
    });
  } catch (error) {
    console.error('❌ File upload error:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/messages/link - Share a link
router.post('/link', async (req, res) => {
  try {
    const { chatId, senderId, url } = req.body;

    if (!chatId || !senderId || !url) {
      return res.status(400).json({ message: 'Chat ID, sender ID, and URL are required' });
    }

    // Validate URL
    let validatedUrl = url.trim();
    if (!/^https?:\/\//i.test(validatedUrl)) {
      validatedUrl = 'https://' + validatedUrl;
    }

    try {
      new URL(validatedUrl);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    console.log('🔗 Link share request:', {
      chatId,
      senderId,
      url: validatedUrl
    });

    // Create message with link attachment
    const message = new Message({
      chatId,
      sender: senderId,
      text: `Check out this link: ${validatedUrl}`,
      attachment: {
        type: 'link',
        url: validatedUrl
      }
    });

    await message.save();
    
    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role');

    console.log('✅ Link shared successfully:', {
      _id: message._id,
      url: validatedUrl
    });

    res.json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    console.error('❌ Link share error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
