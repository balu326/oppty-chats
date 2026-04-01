import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from '../models/Message.js';

dotenv.config();

async function checkRecentMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const recent = await Message.find().sort({ createdAt: -1 }).limit(10);
    
    console.log('\n📋 Last 10 messages:\n');
    recent.forEach((m, i) => {
      console.log(`${i + 1}. "${m.text}"`);
      console.log(`   Sender: ${m.sender}`);
      console.log(`   Chat: ${m.chatId}`);
      console.log(`   Time: ${m.createdAt.toISOString()}\n`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRecentMessages();
