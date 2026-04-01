import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from '../models/Message.js';

dotenv.config();

async function checkSenderIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const messages = await Message.find().lean(); // Don't populate, just get raw data
    
    console.log('📊 RAW MESSAGE DATA (without populate):\n');
    
    messages.forEach((msg, idx) => {
      console.log(`${idx + 1}. Message ID: ${msg._id}`);
      console.log(`   chatId: ${msg.chatId}`);
      console.log(`   sender (ObjectId): ${msg.sender}`);
      console.log(`   sender (_id str): ${msg.sender._id || msg.sender}`);
      console.log(`   text: "${msg.text}"`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSenderIds();
