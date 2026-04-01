import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import Message from '../models/Message.js';

dotenv.config();

async function analyzeAndFixChatIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('='.repeat(80));
    console.log('📊 CHAT ID ANALYSIS AND FIX REPORT');
    console.log('='.repeat(80));

    // Get all employees
    const employees = await Employee.find();
    const employeeMap = new Map();
    employees.forEach(emp => {
      employeeMap.set(emp._id.toString(), emp);
    });

    console.log(`\n👥 Total Employees: ${employees.length}`);
    
    // Get all messages
    const messages = await Message.find().sort({ createdAt: 1 });
    console.log(`💬 Total Messages: ${messages.length}\n`);

    // Analyze chat IDs
    const chatIdMap = new Map();
    messages.forEach(msg => {
      if (!chatIdMap.has(msg.chatId)) {
        chatIdMap.set(msg.chatId, []);
      }
      chatIdMap.get(msg.chatId).push(msg);
    });

    console.log('📁 UNIQUE CHAT IDS:', chatIdMap.size);
    console.log('-'.repeat(80));

    // Categorize chat IDs
    const employeeChats = [];
    const groupChats = [];
    const otherChats = [];

    for (const [chatId, msgs] of chatIdMap.entries()) {
      // Check if chatId is an employee ID
      const employee = employeeMap.get(chatId);
      if (employee) {
        employeeChats.push({ chatId, employee, messageCount: msgs.length });
      } else if (chatId === 'general' || chatId === 'it-support') {
        groupChats.push({ chatId, messageCount: msgs.length });
      } else {
        otherChats.push({ chatId, messageCount: msgs.length });
      }
    }

    console.log('\n1️⃣ EMPLOYEE DM CHATS:');
    employeeChats.forEach(({ chatId, employee, messageCount }) => {
      console.log(`   ✓ Chat: ${chatId} → ${employee.name} (${employee.email}) - ${messageCount} messages`);
    });

    console.log('\n2️⃣ GROUP CHATS:');
    groupChats.forEach(({ chatId, messageCount }) => {
      console.log(`   ✓ Group: ${chatId} - ${messageCount} messages`);
    });

    console.log('\n3️⃣ OTHER CHATS:');
    if (otherChats.length === 0) {
      console.log('   (none)');
    } else {
      otherChats.forEach(({ chatId, messageCount }) => {
        console.log(`   ⚠️ Unknown: ${chatId} - ${messageCount} messages`);
      });
    }

    // Check for issues
    console.log('\n' + '='.repeat(80));
    console.log('🔍 CHECKING FOR ISSUES...');
    console.log('='.repeat(80));

    let issuesFound = 0;

    // Issue 1: Messages with invalid sender
    console.log('\n❓ Issue 1: Messages with invalid sender references');
    const invalidSenderMessages = messages.filter(msg => !msg.sender);
    if (invalidSenderMessages.length > 0) {
      console.log(`   ❌ Found ${invalidSenderMessages.length} messages with invalid sender`);
      invalidSenderMessages.forEach(msg => {
        console.log(`      - ChatID: ${msg.chatId}, Text: "${msg.text.substring(0, 40)}..."`);
      });
      issuesFound++;
    } else {
      console.log('   ✅ All messages have valid senders');
    }

    // Issue 2: Check if employee chat IDs match actual employee IDs
    console.log('\n❓ Issue 2: Employee chat ID consistency');
    const expectedEmployeeChatIds = employees.map(e => e._id.toString());
    const actualEmployeeChatIds = employeeChats.map(c => c.chatId);
    
    const missingEmployeeChats = expectedEmployeeChatIds.filter(id => !actualEmployeeChatIds.includes(id));
    if (missingEmployeeChats.length > 0) {
      console.log(`   ℹ️ ${missingEmployeeChats.length} employees have no messages yet:`);
      missingEmployeeChats.forEach(id => {
        const emp = employeeMap.get(id);
        console.log(`      - ${emp?.name} (${emp?.email})`);
      });
    } else {
      console.log('   ✅ All employees with messages have matching chat IDs');
    }

    // Issue 3: Duplicate messages (same text, same chat, same time)
    console.log('\n❓ Issue 3: Duplicate messages');
    const duplicateMap = new Map();
    messages.forEach(msg => {
      const key = `${msg.chatId}-${msg.text}-${msg.createdAt.getTime()}`;
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key).push(msg);
    });

    const duplicates = Array.from(duplicateMap.values())
      .filter(msgs => msgs.length > 1);
    
    if (duplicates.length > 0) {
      console.log(`   ⚠️ Found ${duplicates.length} sets of duplicate messages`);
      duplicates.forEach((msgs, idx) => {
        console.log(`      ${idx + 1}. "${msgs[0].text}" in chat ${msgs[0].chatId} (${msgs.length} copies)`);
      });
      issuesFound++;
    } else {
      console.log('   ✅ No duplicate messages found');
    }

    // Issue 4: Check Message schema for receiver field
    console.log('\n❓ Issue 4: Message schema validation');
    const MessageSchema = Message.schema.obj;
    const hasReceiver = 'receiver' in MessageSchema;
    console.log(`   Has 'receiver' field: ${hasReceiver ? '✅ Yes' : '❌ No'}`);
    
    const hasSenderId = 'sender' in MessageSchema;
    console.log(`   Has 'sender' field: ${hasSenderId ? '✅ Yes' : '❌ No'}`);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Messages: ${messages.length}`);
    console.log(`Unique Chat IDs: ${chatIdMap.size}`);
    console.log(`Issues Found: ${issuesFound}`);

    if (issuesFound > 0) {
      console.log('\n⚠️ RECOMMENDATION: Run fix script to resolve issues');
      console.log('   Command: node scripts/fix-chat-id-issues.js\n');
    } else {
      console.log('\n✅ ALL CHECKS PASSED - No fixes needed!\n');
    }

    console.log('='.repeat(80));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeAndFixChatIds();
