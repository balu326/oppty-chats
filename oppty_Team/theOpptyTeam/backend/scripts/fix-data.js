import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import Group from '../models/Group.js';
import Message from '../models/Message.js';

dotenv.config();

async function fixDatabaseIssues() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully\n');

    console.log('='.repeat(60));
    console.log('🔧 DATABASE FIX AND UPDATE UTILITY');
    console.log('='.repeat(60));

    // Get all current employees
    const employees = await Employee.find();
    console.log(`\n📊 Current Employees: ${employees.length}`);

    // Fix 1: Remove orphaned messages (messages with invalid sender references)
    console.log('\n🔍 Checking for orphaned messages...');
    const employeeIds = employees.map(e => e._id);
    const orphanedMessages = await Message.find({
      sender: { $nin: employeeIds }
    });
    
    if (orphanedMessages.length > 0) {
      console.log(`   Found ${orphanedMessages.length} orphaned messages`);
      console.log('   Deleting orphaned messages...');
      await Message.deleteMany({ sender: { $nin: employeeIds } });
      console.log('   ✅ Orphaned messages removed');
    } else {
      console.log('   ✅ No orphaned messages found');
    }

    // Fix 2: Create sample groups and assign employees
    console.log('\n🗂️ Setting up groups...');
    const existingGroups = await Group.find();
    
    if (existingGroups.length === 0) {
      console.log('   Creating sample groups...');
      
      // Find admin and superadmin
      const adminUser = employees.find(e => e.role === 'admin');
      const superAdminUser = employees.find(e => e.role === 'superadmin');
      const regularEmployees = employees.filter(e => e.role === 'employee');

      // Create IT Support Group
      const itGroup = new Group({
        name: 'IT Support',
        description: 'Technical support team',
        createdBy: adminUser?._id || employees[0]._id,
        members: [regularEmployees[0]?._id, regularEmployees[1]?._id].filter(Boolean)
      });
      await itGroup.save();
      console.log('   ✓ Created "IT Support" group');

      // Create Management Group
      const mgmtGroup = new Group({
        name: 'Management',
        description: 'Administrative and management team',
        createdBy: superAdminUser?._id || employees[0]._id,
        members: [adminUser?._id, superAdminUser?._id].filter(Boolean)
      });
      await mgmtGroup.save();
      console.log('   ✓ Created "Management" group');

      // Update employees with group assignments
      await Employee.updateMany(
        { email: { $in: ['employee@oppty.com', 'maya@oppty.com'] } },
        { group: itGroup._id }
      );
      console.log('   ✓ Assigned IT Support group to employees');

      await Employee.updateMany(
        { email: { $in: ['admin@oppty.com', 'superadmin@oppty.com'] } },
        { group: mgmtGroup._id }
      );
      console.log('   ✓ Assigned Management group to admin and superadmin');

    } else {
      console.log('   ℹ️ Groups already exist, skipping creation');
    }

    // Fix 3: Create sample messages with valid references
    console.log('\n💬 Creating sample messages...');
    const existingMessages = await Message.find();
    
    if (existingMessages.length === 0 || orphanedMessages.length > 0) {
      const sampleMessages = [
        {
          chatId: 'general',
          sender: employees.find(e => e.role === 'superadmin')?._id || employees[0]._id,
          text: 'Welcome to Oppty Chats! This is the general channel.'
        },
        {
          chatId: 'general',
          sender: employees.find(e => e.role === 'admin')?._id || employees[1]._id,
          text: 'Great to be here! Looking forward to collaborating.'
        },
        {
          chatId: 'it-support',
          sender: employees.find(e => e.name === 'Employee One')?._id || employees[0]._id,
          text: 'Hey team, how can I help with the technical issues?'
        },
        {
          chatId: 'it-support',
          sender: employees.find(e => e.name === 'Maya')?._id || employees[3]._id,
          text: 'I\'m working on the frontend bugs right now.'
        }
      ];

      const validMessages = sampleMessages.filter(msg => msg.sender);
      
      if (validMessages.length > 0) {
        await Message.insertMany(validMessages);
        console.log(`   ✓ Created ${validMessages.length} sample messages`);
      }
    } else {
      console.log('   ℹ️ Messages already exist, skipping creation');
    }

    // Final verification
    console.log('\n' + '='.repeat(60));
    console.log('📋 FINAL VERIFICATION');
    console.log('='.repeat(60));
    
    const finalEmployees = await Employee.find().populate('group', 'name');
    const finalGroups = await Group.find().populate('members', 'name email role');
    const finalMessages = await Message.find().populate('sender', 'name email role');

    console.log('\n👥 Employees with Group Assignments:');
    finalEmployees.forEach(emp => {
      const groupName = emp.group ? emp.group.name : 'No Group';
      console.log(`   ✓ ${emp.name.padEnd(20)} | Role: ${emp.role.padEnd(12)} | Group: ${groupName}`);
    });

    console.log(`\n🗂️ Total Groups: ${finalGroups.length}`);
    finalGroups.forEach(group => {
      console.log(`   ✓ ${group.name} (${group.members.length} members)`);
    });

    console.log(`\n💬 Total Messages: ${finalMessages.length}`);
    const validSenderMessages = finalMessages.filter(msg => msg.sender);
    console.log(`   ✓ Messages with valid senders: ${validSenderMessages.length}`);
    
    if (finalMessages.length !== validSenderMessages.length) {
      console.log(`   ⚠️  Messages with invalid senders: ${finalMessages.length - validSenderMessages.length}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE FIX COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log(`   • Removed ${orphanedMessages.length} orphaned messages`);
    console.log(`   • Created ${finalGroups.length} groups`);
    console.log(`   • All employees now have proper group assignments`);
    console.log(`   • All messages have valid sender references`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    process.exit(1);
  }
}

fixDatabaseIssues();
