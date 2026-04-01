import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import Message from '../models/Message.js';

dotenv.config();

async function fixOrphanedMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    console.log('🔍 Identifying orphaned messages...\n');
    
    // Get all employees
    const employees = await Employee.find();
    const employeeIds = employees.map(e => e._id.toString());
    
    // Find all messages
    const messages = await Message.find();
    
    // Identify orphaned messages
    const orphanedMessages = messages.filter(msg => 
      !msg.sender || !employeeIds.includes(msg.sender._id.toString())
    );
    
    console.log(`Found ${orphanedMessages.length} orphaned messages\n`);
    
    if (orphanedMessages.length === 0) {
      console.log('✅ No orphaned messages found!');
      process.exit(0);
    }
    
    // Show orphaned messages
    console.log('Orphaned Messages:');
    orphanedMessages.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. "${msg.text}" - ChatID: ${msg.chatId}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('💡 These messages appear to be sent to Balaji (chatId matches Balaji\'s ID)');
    console.log('   Most likely sent by Super Admin based on the context.\n');
    
    // Ask user what to do
    console.log('OPTIONS:');
    console.log('  1. Delete all orphaned messages');
    console.log('  2. Assign them to Super Admin (superadmin@oppty.com)');
    console.log('  3. Assign them to a specific employee');
    console.log('  4. Cancel (do nothing)\n');
    
    // For automated fix, we'll assign to super admin
    const superAdmin = employees.find(e => e.role === 'superadmin');
    
    if (!superAdmin) {
      console.log('❌ No super admin found! Cannot assign messages.');
      console.log('Deleting orphaned messages instead...');
      
      await Message.deleteMany({ 
        _id: { $in: orphanedMessages.map(m => m._id) } 
      });
      console.log('✅ Deleted orphaned messages');
    } else {
      console.log(`\n📝 Assigning messages to: ${superAdmin.name} (${superAdmin.email})`);
      
      // Update messages with correct sender
      const updatePromises = orphanedMessages.map(msg => 
        Message.findByIdAndUpdate(msg._id, { sender: superAdmin._id })
      );
      
      await Promise.all(updatePromises);
      console.log(`✅ Successfully updated ${orphanedMessages.length} messages!`);
      
      // Verify the fix
      const updatedMessages = await Message.find({
        _id: { $in: orphanedMessages.map(m => m._id) }
      }).populate('sender', 'name email');
      
      console.log('\nUpdated Messages:');
      updatedMessages.forEach(msg => {
        console.log(`  ✓ "${msg.text}" - Sender: ${msg.sender.name}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Fix completed!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixOrphanedMessages();
