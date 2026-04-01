import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from '../models/Message.js';

dotenv.config();

async function findDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const messages = await Message.find().sort({ createdAt: 1 });
    
    console.log('🔍 Checking for duplicate messages:\n');
    
    // Group by text and timestamp
    const messageMap = new Map();
    const duplicates = [];
    
    messages.forEach(msg => {
      const key = `${msg.chatId}_${msg.text}_${msg.createdAt}`;
      if (messageMap.has(key)) {
        duplicates.push({
          id: msg._id,
          chatId: msg.chatId,
          text: msg.text,
          createdAt: msg.createdAt,
          duplicateOf: messageMap.get(key)
        });
      } else {
        messageMap.set(key, msg._id);
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`❌ Found ${duplicates.length} duplicate messages:\n`);
      duplicates.forEach((dup, idx) => {
        console.log(`${idx + 1}. "${dup.text}" at ${new Date(dup.createdAt).toLocaleString()}`);
        console.log(`   ID: ${dup.id}`);
        console.log(`   Duplicate of: ${dup.duplicateOf}\n`);
      });
    } else {
      console.log('✅ No duplicate messages found in database!\n');
    }
    
    console.log(`Total messages: ${messages.length}`);
    console.log(`Unique messages: ${messageMap.size}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findDuplicates();
