import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from '../models/Message.js';

dotenv.config();

async function removeDuplicateMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔍 Starting comprehensive duplicate message removal...\n');
    
    // Get all messages grouped by chatId
    const allMessages = await Message.find().sort({ createdAt: 1 });
    console.log(`📊 Total messages in database: ${allMessages.length}`);
    
    // Group messages by chatId
    const chatGroups = new Map();
    allMessages.forEach(msg => {
      if (!chatGroups.has(msg.chatId)) {
        chatGroups.set(msg.chatId, []);
      }
      chatGroups.get(msg.chatId).push(msg);
    });
    
    let totalRemoved = 0;
    let chatsProcessed = 0;
    
    // Process each chat
    for (const [chatId, messages] of chatGroups.entries()) {
      console.log(`\n💬 Processing chat: ${chatId} (${messages.length} messages)`);
      
      // Find duplicates by sender, text and timestamp proximity
      const duplicates = [];
      const uniqueMessages = new Map();
      
      messages.forEach((msg) => {
        const senderId = msg.sender.toString();
        const msgText = msg.text.trim();
        
        // Check if we've seen a similar message in the last 5 seconds
        let isDuplicate = false;
        for (const existingMsg of uniqueMessages.values()) {
          const sameSender = existingMsg.sender.toString() === senderId;
          const sameText = existingMsg.text.trim() === msgText;
          const timeDiff = Math.abs(existingMsg.createdAt.getTime() - msg.createdAt.getTime());
          
          if (sameSender && sameText && timeDiff < 5000) {
            isDuplicate = true;
            duplicates.push(msg._id);
            console.log(`  ⚠️  Duplicate found: "${msg.text.substring(0, 30)}..."`);
            console.log(`     Time 1: ${new Date(existingMsg.createdAt).toISOString()}`);
            console.log(`     Time 2: ${new Date(msg.createdAt).toISOString()}`);
            console.log(`     Diff: ${timeDiff}ms\n`);
            break;
          }
        }
        
        if (!isDuplicate) {
          const key = `${senderId}_${msgText}_${Math.floor(msg.createdAt.getTime() / 1000)}`;
          uniqueMessages.set(key, msg);
        }
      });
      
      // Remove duplicates
      if (duplicates.length > 0) {
        const result = await Message.deleteMany({ _id: { $in: duplicates } });
        console.log(`  ✅ Removed ${result.deletedCount} duplicates from this chat`);
        totalRemoved += result.deletedCount;
      }
      
      chatsProcessed++;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Cleanup complete!');
    console.log(`📊 Chats processed: ${chatsProcessed}`);
    console.log(`🗑️  Total duplicates removed: ${totalRemoved}`);
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

removeDuplicateMessages();
