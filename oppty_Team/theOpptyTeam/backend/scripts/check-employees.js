import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';

dotenv.config();

async function checkEmployees() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const employees = await Employee.find().select('-password -otp');
    
    console.log('📊 TOTAL EMPLOYEES IN DATABASE:', employees.length);
    console.log('\n' + '='.repeat(70));
    
    employees.forEach((emp, index) => {
      console.log(`\n${index + 1}. ${emp.name}`);
      console.log(`   Email: ${emp.email}`);
      console.log(`   Role: ${emp.role}`);
      console.log(`   Group: ${emp.group ? '✅ Has Group Assignment' : '❌ No Group'}`);
      console.log(`   Created: ${new Date(emp.createdAt).toLocaleString()}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📈 ROLE BREAKDOWN:');
    console.log(`   Super Admin: ${employees.filter(e => e.role === 'superadmin').length}`);
    console.log(`   Admin: ${employees.filter(e => e.role === 'admin').length}`);
    console.log(`   Employee: ${employees.filter(e => e.role === 'employee').length}`);
    
    console.log('\n🏢 GROUP ASSIGNMENTS:');
    console.log(`   With Group: ${employees.filter(e => e.group).length}`);
    console.log(`   Without Group: ${employees.filter(e => !e.group).length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEmployees();
