import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';

dotenv.config();

const seedData = [
  {
    email: "employee@oppty.com",
    password: "123456",
    name: "Employee One",
    role: "employee",
  },
  {
    email: "admin@oppty.com",
    password: "admin123",
    name: "Admin User",
    role: "admin",
  },
  {
    email: "superadmin@oppty.com",
    password: "superadmin123",
    name: "Super Admin",
    role: "superadmin",
  },
  {
    email: "maya@oppty.com",
    password: "maya123",
    name: "Maya",
    role: "employee",
  },
  {
    email: "jason@oppty.com",
    password: "jason123",
    name: "Jason",
    role: "employee",
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Clear existing data
    await Employee.deleteMany({});
    console.log('🗑️  Cleared existing employees');

    // Insert new data one by one to trigger pre-save hook for password hashing
    const employees = [];
    for (const empData of seedData) {
      const employee = new Employee(empData);
      await employee.save();
      employees.push(employee);
    }
    
    console.log(`✅ Seeded ${employees.length} employees successfully:`);
    
    employees.forEach(emp => {
      console.log(`  - ${emp.name} (${emp.email}) - Role: ${emp.role}`);
    });

    console.log('\n💡 You can now login with these credentials:');
    console.log('   Employee: employee@oppty.com / 123456');
    console.log('   Admin: admin@oppty.com / admin123');
    console.log('   Superadmin: superadmin@oppty.com / superadmin123 ⭐');
    console.log('   Maya: maya@oppty.com / maya123');
    console.log('   Jason: jason@oppty.com / jason123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
