import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from '../models/Message.js';
import Employee from '../models/Employee.js';

dotenv.config();

async function fixDMChatIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const messages = await Message.find().populate('sender', '_id');
    
    console.log('🔧 Fixing DM chat IDs:\n');
    
    let updated = 0;
    let skipped = 0;
    
    for (const msg of messages) {
      // Skip group chats (they have string chatIds like "general", "it-support")
      if (!msg.chatId.match(/^[0-9a-f]{24}$/i)) {
        console.log(`⏭️  Skipping group chat message: "${msg.text.substring(0, 20)}..."`);
        skipped++;
        continue;
      }
      
      const senderId = msg.sender._id.toString();
      const receiverId = msg.chatId;
      
      // Create consistent conversation ID by sorting both participant IDs
      const sortedIds = [senderId, receiverId].sort();
      const properChatId = `${sortedIds[0]}_${sortedIds[1]}`;
      
      if (msg.chatId !== properChatId) {
        msg.chatId = properChatId;
        await msg.save();
        updated++;
        
        console.log(`✅ Updated: "${msg.text.substring(0, 30)}..."`);
        console.log(`   From: ${senderId} → To: ${receiverId}`);
        console.log(`   New chatId: ${properChatId}\n`);
      } else {
        console.log(`✓ Already correct: "${msg.text.substring(0, 20)}..."`);
        skipped++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Updated: ${updated} messages`);
    console.log(`   ⏭️  Skipped: ${skipped} messages`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDMChatIds();
