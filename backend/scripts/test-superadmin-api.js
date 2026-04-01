import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('🧪 Testing Super Admin API Endpoints\n');
    console.log('='.repeat(60));
    
    // Test 1: Login as Super Admin
    console.log('\n1️⃣  Logging in as Super Admin...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@oppty.com',
        password: 'superadmin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('   Login Status:', loginData.success ? '✅ SUCCESS' : '❌ FAILED');
    
    if (!loginData.success) {
      console.log('   Error:', loginData.message);
      process.exit(1);
    }
    
    console.log('   Token:', loginData.token.substring(0, 50) + '...');
    console.log('   Employee:', loginData.employee.name, `(${loginData.employee.role})`);
    
    // Test 2: Get Employees (without auth - as current code does)
    console.log('\n2️⃣  Fetching employees WITHOUT authentication...');
    const employeesResponseNoAuth = await fetch(`${API_URL}/auth/employees`);
    const employeesDataNoAuth = await employeesResponseNoAuth.json();
    console.log('   Status:', employeesDataNoAuth.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('   Employees Count:', employeesDataNoAuth.employees?.length || 0);
    
    if (employeesDataNoAuth.employees) {
      console.log('   Employees Received:');
      employeesDataNoAuth.employees.forEach(emp => {
        console.log(`      - ${emp.name} (${emp.email}) - Role: ${emp.role}`);
      });
    }
    
    // Test 3: Get Employees (with auth header)
    console.log('\n3️⃣  Fetching employees WITH authentication...');
    const employeesResponseAuth = await fetch(`${API_URL}/auth/employees`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'employee-id': loginData.employee.id
      }
    });
    const employeesDataAuth = await employeesResponseAuth.json();
    console.log('   Status:', employeesDataAuth.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('   Employees Count:', employeesDataAuth.employees?.length || 0);
    
    if (employeesDataAuth.employees) {
      console.log('   Employees Received:');
      employeesDataAuth.employees.forEach(emp => {
        console.log(`      - ${emp.name} (${emp.email}) - Role: ${emp.role}`);
      });
    }
    
    // Test 4: Get All Messages (Super Admin only)
    console.log('\n4️⃣  Fetching all messages (Super Admin endpoint)...');
    const messagesResponse = await fetch(`${API_URL}/auth/all-messages`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'employee-id': loginData.employee.id
      }
    });
    const messagesData = await messagesResponse.json();
    console.log('   Status:', messagesData.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('   Messages Count:', messagesData.messages?.length || 0);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Login: Working');
    console.log(`✅ Get Employees (No Auth): ${employeesDataNoAuth.employees?.length || 0} employees`);
    console.log(`✅ Get Employees (With Auth): ${employeesDataAuth.employees?.length || 0} employees`);
    console.log(`✅ Get All Messages: ${messagesData.messages?.length || 0} messages`);
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test Error:', error);
    process.exit(1);
  }
}

testAPI();
