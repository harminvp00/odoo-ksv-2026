import app from '../app';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const PORT = 5099;
const TEST_EMAIL = 'temp.test.auth@vendorbridge.com';
const ORIGINAL_PASSWORD = 'password123';
const NEW_PASSWORD = 'newSecurePassword456';

async function runTests() {
  console.log('--- Starting Auth Password Reset Flow Integration Tests ---');

  // 1. Cleanup existing test user if any
  await prisma.user.deleteMany({
    where: { email: TEST_EMAIL }
  });

  // 2. Create a test user
  const hashedPassword = await bcrypt.hash(ORIGINAL_PASSWORD, 10);
  const testUser = await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'PROCUREMENT_OFFICER'
    }
  });
  console.log(`Created test user: ${testUser.email}`);

  const baseUrl = `http://localhost:${PORT}/api`;

  try {
    // 3. Test Login with original password (should succeed)
    console.log('\nTesting login with original password...');
    const loginRes1 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: ORIGINAL_PASSWORD })
    });
    const loginData1 = await loginRes1.json();
    if (loginRes1.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginData1)}`);
    }
    console.log('✓ Login succeeded with original password.');

    // 4. Test Forgot Password
    console.log('\nTesting forgot-password API...');
    const forgotRes = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL })
    });
    const forgotData = await forgotRes.json() as any;
    if (forgotRes.status !== 200) {
      throw new Error(`Forgot password API failed: ${JSON.stringify(forgotData)}`);
    }
    console.log('✓ Forgot password API response:', forgotData);
    const { resetToken, resetLink } = forgotData;
    if (!resetToken || !resetLink) {
      throw new Error('Forgot password response did not include resetToken or resetLink.');
    }
    console.log(`✓ Token retrieved: ${resetToken.substring(0, 20)}...`);

    // 5. Test Reset Password
    console.log('\nTesting reset-password API...');
    const resetRes = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        token: resetToken,
        password: NEW_PASSWORD
      })
    });
    const resetData = await resetRes.json() as any;
    if (resetRes.status !== 200) {
      throw new Error(`Reset password API failed: ${JSON.stringify(resetData)}`);
    }
    console.log('✓ Reset password succeeded:', resetData.message);

    // 6. Verify Login with old password fails
    console.log('\nVerifying login with old password fails...');
    const loginResOld = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: ORIGINAL_PASSWORD })
    });
    if (loginResOld.status === 200) {
      throw new Error('Security vulnerability: Login succeeded with the old password after reset!');
    }
    console.log('✓ Login with old password rejected successfully.');

    // 7. Verify Login with new password succeeds
    console.log('\nVerifying login with new password succeeds...');
    const loginResNew = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: NEW_PASSWORD })
    });
    const loginDataNew = await loginResNew.json();
    if (loginResNew.status !== 200) {
      throw new Error(`Login failed with new password: ${JSON.stringify(loginDataNew)}`);
    }
    console.log('✓ Login with new password succeeded.');

    // 8. Verify reset token invalidation (reusing the same token should fail)
    console.log('\nVerifying reset token is invalidated after use...');
    const resetResReuse = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        token: resetToken,
        password: 'anotherNewPassword789'
      })
    });
    if (resetResReuse.status === 200) {
      throw new Error('Security vulnerability: Reset token could be reused!');
    }
    console.log('✓ Reusing reset token was rejected successfully.');

  } finally {
    // Cleanup: Delete the test user
    console.log('\nCleaning up test user...');
    await prisma.user.deleteMany({
      where: { email: TEST_EMAIL }
    });
    console.log('✓ Cleaned up.');
  }
}

const server = app.listen(PORT, async () => {
  console.log(`Test server started on port ${PORT}`);
  try {
    await runTests();
    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    server.close();
  }
});
