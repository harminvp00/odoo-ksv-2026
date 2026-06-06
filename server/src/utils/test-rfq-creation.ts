import app from '../app';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const PORT = 5095;
const OFFICER_EMAIL = 'rfq.officer@vendorbridge.com';
const VENDOR_USER_EMAIL = 'rfq.vendor@vendorbridge.com';
const PASSWORD = 'Password123';

async function runTests() {
  console.log('--- Starting RFQ Creation Screen Integration Tests ---');

  // 1. Initial cleanup
  console.log('Cleaning up existing test data...');
  await prisma.rFQAssignment.deleteMany({});
  await prisma.rFQLineItem.deleteMany({});
  await prisma.rFQ.deleteMany({
    where: { title: { in: ['Test RFQ Laptops', 'Unassigned Test RFQ'] } }
  });
  await prisma.vendor.deleteMany({
    where: { gstNo: 'GST-RFQ-TEST-77' }
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
      firstName: 'RFQ Procurement',
      lastName: 'Officer',
      role: 'PROCUREMENT_OFFICER'
    }
  });
  console.log(`Created test PROCUREMENT_OFFICER: ${officerUser.email}`);

  const vendorUser = await prisma.user.create({
    data: {
      email: VENDOR_USER_EMAIL,
      password: hashedPassword,
      firstName: 'RFQ Test',
      lastName: 'Vendor',
      role: 'VENDOR'
    }
  });
  console.log(`Created test VENDOR user: ${vendorUser.email}`);

  const vendorProfile = await prisma.vendor.create({
    data: {
      name: 'IT Vendor Inc',
      category: 'IT Solutions',
      gstNo: 'GST-RFQ-TEST-77',
      contactNo: '9999999999',
      userId: vendorUser.id
    }
  });
  console.log(`Created test VENDOR profile linked to user: ${vendorProfile.name}`);

  const baseUrl = `http://localhost:${PORT}/api`;

  try {
    // 3. Login to get tokens
    console.log('\nLogging in officer...');
    const loginResOfficer = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: OFFICER_EMAIL, password: PASSWORD })
    });
    const { token: officerToken } = await loginResOfficer.json() as any;

    console.log('Logging in vendor...');
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

    // 4. Create RFQ 1 (Officer) assigned to Vendor
    console.log('\nCreating RFQ 1 with Line Items, Attachments, and Vendor Assignment...');
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 14); // 2 weeks in future

    const createRFQRes = await fetch(`${baseUrl}/rfqs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        title: 'Test RFQ Laptops',
        category: 'IT Solutions',
        deadline: deadlineDate.toISOString(),
        description: 'Need 5 laptops for developer team testing',
        attachments: ['specs_v1.pdf', 'pricing_template.xlsx'],
        lineItems: [
          { item: 'ThinkPad T14 Gen 4', qty: 5, unit: 'NOS' }
        ],
        assignedVendorIds: [vendorProfile.id]
      })
    });
    const rfq1 = await createRFQRes.json() as any;

    if (createRFQRes.status !== 201) {
      throw new Error(`Failed to create RFQ: ${JSON.stringify(rfq1)}`);
    }

    console.log(`✓ RFQ 1 created successfully: ${rfq1.title} (ID: ${rfq1.id})`);
    
    // Assert RFQ 1 fields
    if (rfq1.attachments.length !== 2) throw new Error('Expected 2 attachments');
    if (rfq1.lineItems.length !== 1) throw new Error('Expected 1 line item');
    if (rfq1.lineItems[0].qty !== 5) throw new Error('Expected line item qty to be 5');
    if (rfq1.assignments.length !== 1) throw new Error('Expected 1 assignment');
    if (rfq1.assignments[0].vendorId !== vendorProfile.id) throw new Error('Expected assignment vendorId to match');
    console.log('✓ RFQ fields, quantity management, attachments, and assignments verified.');

    // 5. Create RFQ 2 (Officer) NOT assigned to Vendor
    console.log('\nCreating RFQ 2 (Unassigned to Test Vendor)...');
    const createRFQ2Res = await fetch(`${baseUrl}/rfqs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        title: 'Unassigned Test RFQ',
        category: 'Logistics',
        deadline: deadlineDate.toISOString(),
        description: 'Testing scoping logic',
        attachments: [],
        lineItems: [
          { item: 'Delivery Service', qty: 1, unit: 'JOB' }
        ],
        assignedVendorIds: []
      })
    });
    const rfq2 = await createRFQ2Res.json() as any;
    if (createRFQ2Res.status !== 201) throw new Error('Failed to create RFQ 2');
    console.log(`✓ RFQ 2 created successfully: ${rfq2.title} (ID: ${rfq2.id})`);

    // 6. Fetch RFQs as Vendor
    console.log('\nFetching RFQ list as VENDOR...');
    const vendorListRes = await fetch(`${baseUrl}/rfqs`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    const vendorRFQs = await vendorListRes.json() as any;
    
    const hasRFQ1 = vendorRFQs.some((r: any) => r.id === rfq1.id);
    const hasRFQ2 = vendorRFQs.some((r: any) => r.id === rfq2.id);

    if (!hasRFQ1) throw new Error('Vendor should see RFQ 1 (assigned)');
    if (hasRFQ2) throw new Error('Vendor should NOT see RFQ 2 (unassigned)');
    console.log('✓ Role-based scoping of list verified (Vendor only sees assigned RFQs).');

    // 7. Get RFQ Details for RFQ 2 as Vendor (Should fail with 430)
    console.log('\nAttempting to get details for unassigned RFQ 2 as VENDOR (expect 430)...');
    const badDetailRes = await fetch(`${baseUrl}/rfqs/${rfq2.id}`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    console.log(`Status returned: ${badDetailRes.status}`);
    if (badDetailRes.status !== 430) {
      throw new Error(`Expected 430 Forbidden, got ${badDetailRes.status}`);
    }
    console.log('✓ Details access scoping protection verified.');

    // 8. Attempt to create RFQ as Vendor (Should fail with 430)
    console.log('\nAttempting to create RFQ as VENDOR (expect 430)...');
    const badCreateRes = await fetch(`${baseUrl}/rfqs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vendorToken}`
      },
      body: JSON.stringify({
        title: 'Vendor Created RFQ',
        category: 'IT Solutions',
        deadline: deadlineDate.toISOString(),
        lineItems: [{ item: 'Laptops', qty: 10, unit: 'NOS' }]
      })
    });
    console.log(`Status returned: ${badCreateRes.status}`);
    if (badCreateRes.status !== 430) {
      throw new Error(`Expected 430 Forbidden, got ${badCreateRes.status}`);
    }
    console.log('✓ Role restriction on creation verified.');

  } finally {
    // 9. Cleanup
    console.log('\nCleaning up database entries...');
    await prisma.rFQAssignment.deleteMany({});
    await prisma.rFQLineItem.deleteMany({});
    await prisma.rFQ.deleteMany({
      where: { title: { in: ['Test RFQ Laptops', 'Unassigned Test RFQ'] } }
    });
    await prisma.vendor.deleteMany({
      where: { gstNo: 'GST-RFQ-TEST-77' }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [OFFICER_EMAIL, VENDOR_USER_EMAIL] } }
    });
    console.log('✓ Database cleaned up.');
  }
}

const server = app.listen(PORT, async () => {
  console.log(`RFQ test server started on port ${PORT}`);
  try {
    await runTests();
    console.log('\n=== ALL RFQ CREATION SCREEN TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ RFQ CREATION SCREEN TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    server.close();
  }
});
