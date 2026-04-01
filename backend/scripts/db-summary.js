import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import Group from '../models/Group.js';
import Message from '../models/Message.js';

dotenv.config();

async function showDatabaseSummary() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const employees = await Employee.find().populate('group', 'name');
    const groups = await Group.find();
    const messages = await Message.find();

    console.log('\n' + '='.repeat(50));
    console.log('📊 OPPTY CHATS - DATABASE SUMMARY');
    console.log('='.repeat(50));
    console.log(`👥 Employees:  ${employees.length.toString().padStart(3)} (${employees.filter(e => e.role === 'superadmin').length} SuperAdmin, ${employees.filter(e => e.role === 'admin').length} Admin, ${employees.filter(e => e.role === 'employee').length} Employee)`);
    console.log(`🗂️ Groups:     ${groups.length.toString().padStart(3)}`);
    console.log(`💬 Messages:   ${messages.length.toString().padStart(3)}`);
    console.log('='.repeat(50));
    console.log('✅ Database Status: HEALTHY\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

showDatabaseSummary();
