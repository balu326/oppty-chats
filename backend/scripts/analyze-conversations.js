import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from '../models/Message.js';
import Employee from '../models/Employee.js';

dotenv.config();

async function fixChatIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const messages = await Message.find().populate('sender', '_id name email role');
    
    console.log('🔍 Analyzing messages:\n');
    
    // Group messages by actual conversation pairs
    const conversationMap = new Map();
    
    messages.forEach(msg => {
      if (!msg.sender || !msg.sender._id) {
        console.log(`⚠️  Message without sender: ${msg._id}`);
        return;
      }
      
      // Create a unique conversation ID by sorting both IDs
      // This ensures A->B and B->A have the SAME conversation ID
      const participant1 = msg.sender._id.toString();
      const participant2 = msg.chatId;
      
      // Sort to ensure consistent conversation ID
      const sortedIds = [participant1, participant2].sort();
      const properChatId = `${sortedIds[0]}_${sortedIds[1]}`;
      
      if (!conversationMap.has(properChatId)) {
        conversationMap.set(properChatId, []);
      }
      conversationMap.get(properChatId).push(msg);
      
      console.log(`Message: "${msg.text.substring(0, 20)}..."`);
      console.log(`  From: ${msg.sender.name} (${participant1})`);
      console.log(`  To ChatID: ${participant2}`);
      console.log(`  Should be Conversation: ${properChatId}\n`);
    });
    
    console.log('\n📊 Conversation Summary:');
    for (const [convId, msgs] of conversationMap.entries()) {
      console.log(`\n💬 ${convId}: ${msgs.length} messages`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixChatIds();
