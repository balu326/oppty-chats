import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from '../models/Message.js';

dotenv.config();

async function createUniqueIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔧 Creating unique compound index on messages collection...\n');
    
    // Create the unique index
    await Message.collection.createIndex(
      { 
        chatId: 1, 
        sender: 1, 
        text: 1, 
        createdAt: 1 
      },
      { 
        unique: true,
        name: 'unique_message_per_chat_sender_text_time'
      }
    );
    
    console.log('✅ Unique index created successfully!');
    console.log('📌 Index name: unique_message_per_chat_sender_text_time');
    console.log('📌 Fields: chatId, sender, text, createdAt');
    console.log('\n💡 This will prevent duplicate messages at the database level.');
    console.log('   Same sender cannot send same text within 1ms in same chat.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating index:', error.message);
    console.error('💭 This might fail if duplicate messages already exist.');
    console.error('💭 Run remove-duplicate-messages.js first, then try again.\n');
    process.exit(1);
  }
}

createUniqueIndex();
