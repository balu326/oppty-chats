import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import Group from '../models/Group.js';
import Message from '../models/Message.js';

dotenv.config();

async function verifyDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully\n');

    console.log('='.repeat(60));
    console.log('📊 DATABASE VERIFICATION REPORT');
    console.log('='.repeat(60));

    // 1. Verify Employees
    console.log('\n👥 EMPLOYEES:');
    console.log('-'.repeat(60));
    const employees = await Employee.find().populate('group', 'name');
    console.log(`Total Employees: ${employees.length}`);
    
    const roleCount = {
      superadmin: 0,
      admin: 0,
      employee: 0
    };

    employees.forEach(emp => {
      roleCount[emp.role]++;
      const groupInfo = emp.group ? emp.group.name : 'No Group';
      console.log(`  ✓ ${emp.name.padEnd(20)} | ${emp.email.padEnd(30)} | Role: ${emp.role.padEnd(12)} | Group: ${groupInfo}`);
    });

    console.log('\n📈 Role Distribution:');
    console.log(`  • Super Admin: ${roleCount.superadmin}`);
    console.log(`  • Admin: ${roleCount.admin}`);
    console.log(`  • Employee: ${roleCount.employee}`);

    // 2. Verify Groups
    console.log('\n\n🗂️ GROUPS:');
    console.log('-'.repeat(60));
    const groups = await Group.find().populate('createdBy', 'name email').populate('members', 'name email role');
    console.log(`Total Groups: ${groups.length}`);
    
    if (groups.length > 0) {
      groups.forEach(group => {
        console.log(`  ✓ Group: ${group.name}`);
        console.log(`    Description: ${group.description || 'N/A'}`);
        console.log(`    Created by: ${group.createdBy?.name || 'Unknown'}`);
        console.log(`    Members: ${group.members.length}`);
        group.members.forEach(member => {
          console.log(`      - ${member.name} (${member.role})`);
        });
        console.log('');
      });
    } else {
      console.log('  No groups found');
    }

    // 3. Verify Messages
    console.log('\n💬 MESSAGES:');
    console.log('-'.repeat(60));
    const messages = await Message.find().populate('sender', 'name email role');
    console.log(`Total Messages: ${messages.length}`);
    
    if (messages.length > 0) {
      const chatIds = [...new Set(messages.map(msg => msg.chatId))];
      console.log(`Unique Chat IDs: ${chatIds.length}`);
      
      console.log('\n  Recent Messages (last 10):');
      const recentMessages = messages.slice(-10);
      recentMessages.forEach(msg => {
        console.log(`    [${msg.createdAt.toLocaleString()}] ${msg.sender?.name || 'Unknown'}: ${msg.text.substring(0, 50)}...`);
      });
    } else {
      console.log('  No messages found');
    }

    // 4. Data Integrity Checks
    console.log('\n\n🔍 DATA INTEGRITY CHECKS:');
    console.log('-'.repeat(60));
    
    let issues = 0;
    let warnings = 0;

    // Check 1: Orphaned messages (messages referencing non-existent employees)
    const messageWithInvalidSender = await Message.find({
      sender: { $nin: employees.map(e => e._id) }
    });
    if (messageWithInvalidSender.length > 0) {
      console.log(`❌ Found ${messageWithInvalidSender.length} messages with invalid sender`);
      issues++;
    } else {
      console.log('✅ All messages have valid senders');
    }

    // Check 2: Employees with invalid group references
    const employeesWithInvalidGroup = employees.filter(emp => 
      emp.group && !groups.find(g => g._id.equals(emp.group._id))
    );
    if (employeesWithInvalidGroup.length > 0) {
      console.log(`❌ Found ${employeesWithInvalidGroup.length} employees with invalid group references`);
      issues++;
    } else {
      console.log('✅ All employee group references are valid');
    }

    // Check 3: Groups with invalid member references
    for (const group of groups) {
      const invalidMembers = group.members.filter(member => 
        !employees.find(e => e._id.equals(member._id))
      );
      if (invalidMembers.length > 0) {
        console.log(`❌ Group "${group.name}" has ${invalidMembers.length} invalid member references`);
        issues++;
      }
    }
    if (issues === 0) {
      console.log('✅ All group member references are valid');
    }

    // Check 4: Duplicate emails
    const emailCounts = {};
    employees.forEach(emp => {
      emailCounts[emp.email] = (emailCounts[emp.email] || 0) + 1;
    });
    const duplicates = Object.entries(emailCounts)
      .filter(([email, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log(`❌ Found ${duplicates.length} duplicate email(s)`);
      issues++;
    } else {
      console.log('✅ No duplicate emails found');
    }

    // Check 5: Employees without proper roles
    const employeesWithoutRole = employees.filter(emp => 
      !['employee', 'admin', 'superadmin'].includes(emp.role)
    );
    if (employeesWithoutRole.length > 0) {
      console.log(`❌ Found ${employeesWithoutRole.length} employees with invalid roles`);
      issues++;
    } else {
      console.log('✅ All employees have valid roles');
    }

    // Check 6: Password hash verification
    const employeesWithPlainPassword = employees.filter(emp => 
      emp.password.length < 60 // bcrypt hashes are typically 60+ characters
    );
    if (employeesWithPlainPassword.length > 0) {
      console.log(`⚠️  Warning: ${employeesWithPlainPassword.length} employees may have plain text passwords`);
      warnings++;
    } else {
      console.log('✅ All passwords appear to be hashed');
    }

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📋 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Employees: ${employees.length}`);
    console.log(`Total Groups: ${groups.length}`);
    console.log(`Total Messages: ${messages.length}`);
    console.log(`Issues Found: ${issues}`);
    console.log(`Warnings: ${warnings}`);
    
    if (issues === 0 && warnings === 0) {
      console.log('\n✅ DATABASE IS HEALTHY - All data integrity checks passed!');
    } else if (issues === 0) {
      console.log('\n⚠️  DATABASE HAS MINOR ISSUES - Warnings detected but no critical issues');
    } else {
      console.log('\n❌ DATABASE HAS ISSUES - Please review the errors above');
    }
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying database:', error);
    process.exit(1);
  }
}

verifyDatabase();
