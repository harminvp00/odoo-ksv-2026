import app from '../app';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const PORT = 5098;
const VENDOR_EMAIL = 'temp.vendor.auth@vendorbridge.com';
const MANAGER_EMAIL = 'temp.manager.auth@vendorbridge.com';
const PASSWORD = 'password123';

async function runTests() {
  console.log('--- Starting Session & Role-Based Auth Integration Tests ---');

  // 1. Cleanup existing test users if any
  await prisma.user.deleteMany({
    where: { email: { in: [VENDOR_EMAIL, MANAGER_EMAIL] } }
  });

  // 2. Create test users
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);
  
  const vendorUser = await prisma.user.create({
    data: {
      email: VENDOR_EMAIL,
      password: hashedPassword,
      firstName: 'Vendor',
      lastName: 'User',
      role: 'VENDOR'
    }
  });
  console.log(`Created test vendor: ${vendorUser.email}`);

  const managerUser = await prisma.user.create({
    data: {
      email: MANAGER_EMAIL,
      password: hashedPassword,
      firstName: 'Manager',
      lastName: 'User',
      role: 'MANAGER'
    }
  });
  console.log(`Created test manager: ${managerUser.email}`);

  const baseUrl = `http://localhost:${PORT}/api`;

  try {
    // 3. Login users to get tokens
    console.log('\nLogging in vendor...');
    const loginResVendor = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: VENDOR_EMAIL, password: PASSWORD })
    });
    const { token: vendorToken } = await loginResVendor.json() as any;

    console.log('Logging in manager...');
    const loginResManager = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: MANAGER_EMAIL, password: PASSWORD })
    });
    const { token: managerToken } = await loginResManager.json() as any;

    if (!vendorToken || !managerToken) {
      throw new Error('Could not retrieve auth tokens for testing.');
    }
    console.log('✓ Retrieved both tokens successfully.');

    // 4. Test Session Endpoint (GET /auth/me)
    console.log('\nTesting /auth/me session endpoint...');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    const meData = await meRes.json() as any;
    if (meRes.status !== 200) {
      throw new Error(`Session /me endpoint failed: ${JSON.stringify(meData)}`);
    }
    if (meData.user.email !== VENDOR_EMAIL || 'password' in meData.user) {
      throw new Error(`Session endpoint returned incorrect user data or password was not excluded: ${JSON.stringify(meData)}`);
    }
    console.log('✓ Session endpoint returned correct profile details (password excluded).');

    // 5. Test Role Authorization: VENDOR tries to create RFQ (should fail with 430)
    console.log('\nTesting role-based restriction: VENDOR calling POST /rfqs (should fail)...');
    const rfqRes = await fetch(`${baseUrl}/rfqs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vendorToken}` 
      },
      body: JSON.stringify({ title: 'Test RFQ' })
    });
    console.log(`Status returned: ${rfqRes.status}`);
    if (rfqRes.status !== 430) {
      throw new Error(`Expected 430 Unauthorized role permissions, got ${rfqRes.status}`);
    }
    console.log('✓ VENDOR restricted from creating RFQ.');

    // 6. Test Role Authorization: VENDOR submits quotation (should succeed)
    console.log('\nTesting role-based permission: VENDOR calling POST /quotations (should succeed)...');
    const quoteRes = await fetch(`${baseUrl}/quotations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vendorToken}` 
      },
      body: JSON.stringify({ rfqId: '123' })
    });
    console.log(`Status returned: ${quoteRes.status}`);
    if (quoteRes.status !== 201 && quoteRes.status !== 200) {
      throw new Error(`Expected 200 or 201, got ${quoteRes.status}`);
    }
    console.log('✓ VENDOR allowed to submit quotations.');

    // 7. Test Role Authorization: MANAGER submits quotation (should fail with 430)
    console.log('\nTesting role-based restriction: MANAGER calling POST /quotations (should fail)...');
    const managerQuoteRes = await fetch(`${baseUrl}/quotations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}` 
      },
      body: JSON.stringify({ rfqId: '123' })
    });
    console.log(`Status returned: ${managerQuoteRes.status}`);
    if (managerQuoteRes.status !== 430) {
      throw new Error(`Expected 430 Unauthorized role permissions, got ${managerQuoteRes.status}`);
    }
    console.log('✓ MANAGER restricted from submitting quotations.');

    // 8. Test Role Authorization: MANAGER views insights reports (should succeed)
    console.log('\nTesting role-based permission: MANAGER calling GET /reports/insights (should succeed)...');
    const insightsRes = await fetch(`${baseUrl}/reports/insights`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    console.log(`Status returned: ${insightsRes.status}`);
    if (insightsRes.status !== 200) {
      throw new Error(`Expected 200, got ${insightsRes.status}`);
    }
    console.log('✓ MANAGER allowed to access reports insights.');

    // 9. Test Role Authorization: VENDOR views insights reports (should fail with 430)
    console.log('\nTesting role-based restriction: VENDOR calling GET /reports/insights (should fail)...');
    const vendorInsightsRes = await fetch(`${baseUrl}/reports/insights`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    console.log(`Status returned: ${vendorInsightsRes.status}`);
    if (vendorInsightsRes.status !== 430) {
      throw new Error(`Expected 430 Unauthorized role permissions, got ${vendorInsightsRes.status}`);
    }
    console.log('✓ VENDOR restricted from accessing reports insights.');

    // 10. Test Payload Validations (Zod Schemas)
    console.log('\nTesting validation: registering with invalid email format (should fail with 400)...');
    const registerValRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email-format',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User'
      })
    });
    console.log(`Status returned: ${registerValRes.status}`);
    if (registerValRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${registerValRes.status}`);
    }
    const registerValData = await registerValRes.json() as any;
    console.log('✓ Validation error messages received:', JSON.stringify(registerValData.errors));

    console.log('\nTesting validation: registering with password too short (should fail with 400)...');
    const registerShortPassRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'valid.email@vendorbridge.com',
        password: '123', // less than 6 chars
        firstName: 'Test',
        lastName: 'User'
      })
    });
    console.log(`Status returned: ${registerShortPassRes.status}`);
    if (registerShortPassRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${registerShortPassRes.status}`);
    }
    console.log('✓ Password too short rejected correctly.');

  } finally {
    // Cleanup: Delete the test users
    console.log('\nCleaning up test users...');
    await prisma.user.deleteMany({
      where: { email: { in: [VENDOR_EMAIL, MANAGER_EMAIL] } }
    });
    console.log('✓ Cleaned up.');
  }
}

const server = app.listen(PORT, async () => {
  console.log(`Test server started on port ${PORT}`);
  try {
    await runTests();
    console.log('\n=== ALL SESSION & ROLE AUTH TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    server.close();
  }
});
