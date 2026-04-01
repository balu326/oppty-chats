import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import Message from '../models/Message.js';

dotenv.config();

async function checkMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const messages = await Message.find()
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });
    
    console.log('📊 TOTAL MESSAGES:', messages.length);
    console.log('\n' + '='.repeat(80));
    
    messages.forEach((msg, index) => {
      console.log(`\n${index + 1}. Message ID: ${msg._id}`);
      console.log(`   Chat ID: ${msg.chatId}`);
      console.log(`   Sender: ${msg.sender ? msg.sender.name : '❌ UNKNOWN (Invalid sender ID)'}`);
      console.log(`   Text: "${msg.text}"`);
      console.log(`   Time: ${new Date(msg.createdAt).toLocaleString()}`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Get all employees
    const employees = await Employee.find();
    console.log('\n👥 EMPLOYEES:');
    employees.forEach(emp => {
      console.log(`   ${emp.name} (${emp.email}) - ID: ${emp._id}`);
    });
    
    // Check for orphaned messages
    const employeeIds = employees.map(e => e._id.toString());
    const orphanedMessages = messages.filter(msg => !msg.sender || !employeeIds.includes(msg.sender._id.toString()));
    
    if (orphanedMessages.length > 0) {
      console.log('\n⚠️ ORPHANED MESSAGES FOUND:', orphanedMessages.length);
      orphanedMessages.forEach(msg => {
        console.log(`   - Message "${msg.text.substring(0, 30)}..." has invalid sender: ${msg.sender}`);
      });
      
      console.log('\n💡 SOLUTION NEEDED:');
      console.log('   These messages were sent when the sender was deleted or has invalid reference.');
      console.log('   We need to either:');
      console.log('   1. Delete these orphaned messages, OR');
      console.log('   2. Update them with a valid sender if we know who sent it');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMessages();
