import app from '../app';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const PORT = 5096;
const OFFICER_EMAIL = 'vendor.officer@vendorbridge.com';
const VENDOR_USER_EMAIL = 'vendor.other@vendorbridge.com';
const PASSWORD = 'Password123';

async function runTests() {
  console.log('--- Starting Vendor Management Integration Tests ---');

  // 1. Initial cleanup to prevent duplicate keys
  console.log('Cleaning up existing test data...');
  await prisma.vendor.deleteMany({
    where: { gstNo: { in: ['GST-ALPHA-999', 'GST-BETA-888', 'GST-GAMMA-777'] } }
  });
  await prisma.user.deleteMany({
    where: { email: { in: [OFFICER_EMAIL, VENDOR_USER_EMAIL] } }
  });

  // 2. Create test users
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  const officerUser = await prisma.user.create({
    data: {
      email: OFFICER_EMAIL,
      password: hashedPassword,
      firstName: 'Vendor Procurement',
      lastName: 'Officer',
      role: 'PROCUREMENT_OFFICER'
    }
  });
  console.log(`Created test PROCUREMENT_OFFICER: ${officerUser.email}`);

  const regularVendorUser = await prisma.user.create({
    data: {
      email: VENDOR_USER_EMAIL,
      password: hashedPassword,
      firstName: 'Regular Vendor',
      lastName: 'User',
      role: 'VENDOR'
    }
  });
  console.log(`Created test VENDOR user: ${regularVendorUser.email}`);

  const baseUrl = `http://localhost:${PORT}/api`;

  try {
    // 3. Login to get tokens
    console.log('\nLogging in procurement officer...');
    const loginResOfficer = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: OFFICER_EMAIL, password: PASSWORD })
    });
    const { token: officerToken } = await loginResOfficer.json() as any;

    console.log('Logging in regular vendor...');
    const loginResVendor = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: VENDOR_USER_EMAIL, password: PASSWORD })
    });
    const { token: vendorToken } = await loginResVendor.json() as any;

    if (!officerToken || !vendorToken) {
      throw new Error('Failed to retrieve authentication tokens.');
    }
    console.log('✓ Tokens retrieved.');

    // 4. Register 3 new vendors using Procurement Officer token
    console.log('\nRegistering test vendors...');
    
    // Vendor A
    const resA = await fetch(`${baseUrl}/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        name: 'Alpha Technologies',
        category: 'IT Solutions',
        gstNo: 'GST-ALPHA-999',
        contactNo: '1234567890',
        address: '101 Silicon Valley'
      })
    });
    const vendorA = await resA.json() as any;
    if (resA.status !== 201) throw new Error(`Failed to create Vendor A: ${JSON.stringify(vendorA)}`);
    console.log(`✓ Registered Vendor A: ${vendorA.name}`);

    // Vendor B
    const resB = await fetch(`${baseUrl}/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        name: 'Beta Woodworks',
        category: 'Furniture',
        gstNo: 'GST-BETA-888',
        contactNo: '9876543210',
        address: '202 Timber Lane'
      })
    });
    const vendorB = await resB.json() as any;
    if (resB.status !== 201) throw new Error(`Failed to create Vendor B: ${JSON.stringify(vendorB)}`);
    console.log(`✓ Registered Vendor B: ${vendorB.name}`);

    // Vendor C
    const resC = await fetch(`${baseUrl}/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        name: 'Gamma Corp',
        category: 'IT Solutions',
        gstNo: 'GST-GAMMA-777',
        contactNo: '5556667777',
        address: '303 Industrial Park'
      })
    });
    const vendorC = await resC.json() as any;
    if (resC.status !== 201) throw new Error(`Failed to create Vendor C: ${JSON.stringify(vendorC)}`);
    console.log(`✓ Registered Vendor C: ${vendorC.name}`);

    // 5. Test retrieving all vendors
    console.log('\nRetrieving list of all vendors...');
    const listRes = await fetch(`${baseUrl}/vendors`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const listData = await listRes.json() as any;
    if (listRes.status !== 200) throw new Error(`Get vendors failed: ${JSON.stringify(listData)}`);
    
    // We expect at least the 3 we created
    if (listData.vendors.length < 3) {
      throw new Error(`Expected at least 3 vendors, got ${listData.vendors.length}`);
    }
    console.log(`✓ Retieved ${listData.vendors.length} total vendors.`);

    // 6. Test Search filter (search=Woodworks)
    console.log('\nTesting search filtering ("Woodworks")...');
    const searchRes = await fetch(`${baseUrl}/vendors?search=Woodworks`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const searchData = await searchRes.json() as any;
    const foundB = searchData.vendors.find((v: any) => v.gstNo === 'GST-BETA-888');
    if (!foundB || searchData.vendors.length !== 1) {
      throw new Error(`Expected only Beta Woodworks to return, got ${JSON.stringify(searchData.vendors)}`);
    }
    console.log('✓ Search filter returned Beta Woodworks only.');

    // 7. Test Category filter (category=IT Solutions)
    console.log('\nTesting category filtering ("IT Solutions")...');
    const catRes = await fetch(`${baseUrl}/vendors?category=IT%20Solutions`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const catData = await catRes.json() as any;
    const hasA = catData.vendors.some((v: any) => v.gstNo === 'GST-ALPHA-999');
    const hasC = catData.vendors.some((v: any) => v.gstNo === 'GST-GAMMA-777');
    const hasB = catData.vendors.some((v: any) => v.gstNo === 'GST-BETA-888');
    if (!hasA || !hasC || hasB) {
      throw new Error(`Expected Alpha and Gamma but not Beta, got: ${JSON.stringify(catData.vendors)}`);
    }
    console.log('✓ Category filter successfully filtered to IT Solutions only.');

    // 8. Test Status filter (status=ACTIVE)
    console.log('\nTesting status filtering ("ACTIVE" - expect 0)...');
    const statusRes = await fetch(`${baseUrl}/vendors?status=ACTIVE`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const statusData = await statusRes.json() as any;
    const activeTestVendors = statusData.vendors.filter((v: any) => ['GST-ALPHA-999', 'GST-BETA-888', 'GST-GAMMA-777'].includes(v.gstNo));
    if (activeTestVendors.length > 0) {
      throw new Error(`Expected 0 active test vendors, got: ${activeTestVendors.length}`);
    }
    console.log('✓ Status filter returned 0 active test vendors correctly.');

    // 9. Update Vendor A status to ACTIVE
    console.log('\nUpdating Vendor A status to ACTIVE...');
    const updateRes = await fetch(`${baseUrl}/vendors/${vendorA.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({ status: 'ACTIVE' })
    });
    const updatedVendorA = await updateRes.json() as any;
    if (updateRes.status !== 200 || updatedVendorA.status !== 'ACTIVE') {
      throw new Error(`Failed to update status to ACTIVE: ${JSON.stringify(updatedVendorA)}`);
    }
    console.log('✓ Vendor A status successfully updated to ACTIVE.');

    // 10. Verify Vendor A now appears in status=ACTIVE query
    console.log('Re-testing status filtering ("ACTIVE" - expect 1)...');
    const statusActiveRes = await fetch(`${baseUrl}/vendors?status=ACTIVE`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const statusActiveData = await statusActiveRes.json() as any;
    const activeVendors = statusActiveData.vendors.filter((v: any) => v.gstNo === 'GST-ALPHA-999');
    if (activeVendors.length !== 1) {
      throw new Error(`Expected exactly 1 active vendor (Alpha Technologies), got: ${activeVendors.length}`);
    }
    console.log('✓ Vendor A now correctly appears in ACTIVE status list.');

    // 11. Test unauthorized status update (should fail with 430)
    console.log('\nTesting unauthorized status update (VENDOR attempting to update status - should fail)...');
    const badUpdateRes = await fetch(`${baseUrl}/vendors/${vendorB.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vendorToken}`
      },
      body: JSON.stringify({ status: 'ACTIVE' })
    });
    console.log(`Status returned: ${badUpdateRes.status}`);
    if (badUpdateRes.status !== 430) {
      throw new Error(`Expected 430 Forbidden, got ${badUpdateRes.status}`);
    }
    console.log('✓ Unauthorized role restricted correctly.');

  } finally {
    // 12. Cleanup
    console.log('\nCleaning up seeded test database entries...');
    await prisma.vendor.deleteMany({
      where: { gstNo: { in: ['GST-ALPHA-999', 'GST-BETA-888', 'GST-GAMMA-777'] } }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [OFFICER_EMAIL, VENDOR_USER_EMAIL] } }
    });
    console.log('✓ Database cleaned up.');
  }
}

const server = app.listen(PORT, async () => {
  console.log(`Vendor management test server started on port ${PORT}`);
  try {
    await runTests();
    console.log('\n=== ALL VENDOR MANAGEMENT TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ VENDOR MANAGEMENT TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    server.close();
  }
});
