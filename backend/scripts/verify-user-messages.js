import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import Message from '../models/Message.js';

dotenv.config();

async function verifyUserMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const employees = await Employee.find();
    const employeeMap = new Map();
    employees.forEach(emp => {
      employeeMap.set(emp._id.toString(), emp);
    });
    
    console.log('👥 EMPLOYEES IN DATABASE:');
    employees.forEach(emp => {
      console.log(`   ${emp.name.padEnd(20)} - ID: ${emp._id}`);
    });
    
    const messages = await Message.find().sort({ createdAt: 1 });
    
    console.log('\n💬 MESSAGES BY CHAT:\n');
    
    // Group by chatId
    const chatGroups = new Map();
    messages.forEach(msg => {
      if (!chatGroups.has(msg.chatId)) {
        chatGroups.set(msg.chatId, []);
      }
      chatGroups.get(msg.chatId).push(msg);
    });
    
    for (const [chatId, msgs] of chatGroups.entries()) {
      const owner = employeeMap.get(chatId);
      console.log('='.repeat(70));
      console.log(`📱 Chat ID: ${chatId}`);
      console.log(`   Owner: ${owner ? owner.name : 'GROUP/UNKNOWN'}`);
      console.log(`   Messages: ${msgs.length}\n`);
      
      msgs.forEach((msg, idx) => {
        const sender = msg.sender;
        console.log(`   ${idx + 1}. [${new Date(msg.createdAt).toLocaleTimeString()}]`);
        console.log(`      From: ${sender ? sender.name : '❌ UNKNOWN SENDER'}`);
        console.log(`      Text: "${msg.text}"`);
      });
      console.log('');
    }
    
    console.log('='.repeat(70));
    console.log('\n🔍 VERIFICATION FOR SPECIFIC USERS:\n');
    
    // Check Balaji's perspective
    const balaji = employees.find(e => e.email === 'ba@oppty.in');
    if (balaji) {
      console.log(`\n👤 BALAJI'S VIEW (ID: ${balaji._id}):`);
      const balajiMessages = messages.filter(m => m.chatId === balaji._id.toString());
      console.log(`   Messages TO Balaji: ${balajiMessages.length}`);
      balajiMessages.forEach(msg => {
        const sender = msg.sender;
        console.log(`      - From: ${sender ? sender.name : 'Unknown'}: "${msg.text}"`);
      });
      
      const balajiSentMessages = messages.filter(m => m.sender && m.sender._id.toString() === balaji._id.toString());
      console.log(`   Messages SENT by Balaji: ${balajiSentMessages.length}`);
      balajiSentMessages.forEach(msg => {
        console.log(`      - To ChatID: ${msg.chatId}: "${msg.text}"`);
      });
    }
    
    // Check Super Admin's perspective
    const superAdmin = employees.find(e => e.role === 'superadmin');
    if (superAdmin) {
      console.log(`\n👑 SUPER ADMIN'S VIEW (ID: ${superAdmin._id}):`);
      const superAdminMessages = messages.filter(m => m.chatId === superAdmin._id.toString());
      console.log(`   Messages TO Super Admin: ${superAdminMessages.length}`);
      superAdminMessages.forEach(msg => {
        const sender = msg.sender;
        console.log(`      - From: ${sender ? sender.name : 'Unknown'}: "${msg.text}"`);
      });
      
      const superAdminSentMessages = messages.filter(m => m.sender && m.sender._id.toString() === superAdmin._id.toString());
      console.log(`   Messages SENT by Super Admin: ${superAdminSentMessages.length}`);
      superAdminSentMessages.forEach(msg => {
        console.log(`      - To ChatID: ${msg.chatId}: "${msg.text}"`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyUserMessages();
