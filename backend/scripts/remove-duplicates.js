import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from '../models/Message.js';

dotenv.config();

async function removeDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const messages = await Message.find().sort({ createdAt: 1 });
    
    console.log('🔍 Finding duplicate messages:\n');
    
    // Group by text and timestamp to find duplicates
    const messageMap = new Map();
    const duplicateIds = [];
    
    messages.forEach(msg => {
      const key = `${msg.chatId}_${msg.text}_${msg.createdAt}`;
      if (messageMap.has(key)) {
        duplicateIds.push(msg._id);
        console.log(`❌ Duplicate found: "${msg.text}" at ${new Date(msg.createdAt).toLocaleString()}`);
        console.log(`   Removing ID: ${msg._id}\n`);
      } else {
        messageMap.set(key, msg._id);
      }
    });
    
    if (duplicateIds.length > 0) {
      console.log(`\n🗑️  Deleting ${duplicateIds.length} duplicate messages...\n`);
      
      await Message.deleteMany({ _id: { $in: duplicateIds } });
      
      console.log('✅ Successfully removed duplicates!\n');
    } else {
      console.log('\n✅ No duplicates found!\n');
    }
    
    const remainingMessages = await Message.countDocuments();
    console.log(`📊 Remaining messages: ${remainingMessages}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

removeDuplicates();
