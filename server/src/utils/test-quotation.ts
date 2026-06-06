import app from '../app';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const PORT = 5094;
const OFFICER_EMAIL = 'q.officer@vendorbridge.com';
const VENDOR_USER_EMAIL = 'q.vendor@vendorbridge.com';
const PASSWORD = 'Password123';

async function runTests() {
  console.log('--- Starting Vendor Quotation Submission Screen Integration Tests ---');

  // 1. Clean up old data
  console.log('Cleaning up existing test data...');
  await prisma.quotationLineItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.rFQAssignment.deleteMany({});
  await prisma.rFQLineItem.deleteMany({});
  await prisma.rFQ.deleteMany({
    where: { title: 'Test RFQ for Quotations' }
  });
  await prisma.vendor.deleteMany({
    where: { gstNo: 'GST-QUOTE-TEST-99' }
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
      firstName: 'Quotation Officer',
      lastName: 'Staff',
      role: 'PROCUREMENT_OFFICER'
    }
  });
  console.log(`Created test PROCUREMENT_OFFICER: ${officerUser.email}`);

  const vendorUser = await prisma.user.create({
    data: {
      email: VENDOR_USER_EMAIL,
      password: hashedPassword,
      firstName: 'Quotation Vendor',
      lastName: 'Provider',
      role: 'VENDOR'
    }
  });
  console.log(`Created test VENDOR user: ${vendorUser.email}`);

  const vendorProfile = await prisma.vendor.create({
    data: {
      name: 'IT Vendor Corp',
      category: 'IT Solutions',
      gstNo: 'GST-QUOTE-TEST-99',
      contactNo: '1234512345',
      userId: vendorUser.id
    }
  });
  console.log(`Created test VENDOR profile: ${vendorProfile.name}`);

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

    // 4. Create an RFQ and assign it to the Vendor
    console.log('\nCreating and assigning RFQ...');
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 7);

    const rfq = await prisma.rFQ.create({
      data: {
        title: 'Test RFQ for Quotations',
        category: 'IT Solutions',
        deadline: deadlineDate,
        createdByUserId: officerUser.id,
        status: 'OPEN'
      }
    });

    await prisma.rFQLineItem.create({
      data: {
        rfqId: rfq.id,
        item: 'ThinkPad T14',
        qty: 2,
        unit: 'NOS'
      }
    });

    await prisma.rFQAssignment.create({
      data: {
        rfqId: rfq.id,
        vendorId: vendorProfile.id
      }
    });
    console.log('✓ RFQ created and assigned.');

    // 5. Save a Quotation Draft (Vendor)
    console.log('\nSaving quotation draft...');
    const createRes = await fetch(`${baseUrl}/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vendorToken}`
      },
      body: JSON.stringify({
        rfqId: rfq.id,
        deliveryDays: 5,
        paymentTerms: '20 days net',
        status: 'DRAFT',
        lineItems: [
          { item: 'ThinkPad T14', qty: 2, unit: 'NOS', unitPrice: 1000 }
        ]
      })
    });
    const draft = await createRes.json() as any;

    if (createRes.status !== 201) {
      throw new Error(`Failed to save draft: ${JSON.stringify(draft)}`);
    }

    console.log(`✓ Draft saved. ID: ${draft.id}`);
    
    // Assert draft pricing math
    if (Number(draft.subtotal) !== 2000) throw new Error(`Expected subtotal 2000, got ${draft.subtotal}`);
    if (Number(draft.gstAmount) !== 360) throw new Error(`Expected gstAmount 360, got ${draft.gstAmount}`);
    if (Number(draft.grandTotal) !== 2360) throw new Error(`Expected grandTotal 2360, got ${draft.grandTotal}`);
    if (draft.status !== 'DRAFT') throw new Error('Expected status to be DRAFT');
    console.log('✓ Pricing calculations (subtotal, GST 18%, grand total) verified.');

    // 6. Edit the saved draft
    console.log('\nEditing quotation draft...');
    const editRes = await fetch(`${baseUrl}/quotations/${draft.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vendorToken}`
      },
      body: JSON.stringify({
        deliveryDays: 7,
        paymentTerms: '30 days net',
        lineItems: [
          { item: 'ThinkPad T14', qty: 2, unit: 'NOS', unitPrice: 950 }
        ]
      })
    });
    const edited = await editRes.json() as any;

    if (editRes.status !== 200) {
      throw new Error(`Failed to edit draft: ${JSON.stringify(edited)}`);
    }

    console.log('✓ Draft edited successfully.');
    // Assert edited values
    if (Number(edited.subtotal) !== 1900) throw new Error(`Expected subtotal 1900, got ${edited.subtotal}`);
    if (Number(edited.gstAmount) !== 342) throw new Error(`Expected gstAmount 342, got ${edited.gstAmount}`);
    if (Number(edited.grandTotal) !== 2242) throw new Error(`Expected grandTotal 2242, got ${edited.grandTotal}`);
    if (edited.deliveryDays !== 7) throw new Error('Expected deliveryDays 7');
    if (edited.paymentTerms !== '30 days net') throw new Error('Expected paymentTerms 30 days net');
    console.log('✓ Updated pricing and delivery timelines verified.');

    // 7. Submit the quotation
    console.log('\nSubmitting the quotation draft...');
    const submitRes = await fetch(`${baseUrl}/quotations/${draft.id}/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    const submitted = await submitRes.json() as any;

    if (submitRes.status !== 200 || submitted.status !== 'SUBMITTED') {
      throw new Error(`Failed to submit quotation: ${JSON.stringify(submitted)}`);
    }
    console.log('✓ Quotation successfully submitted.');

    // 8. Verify it cannot be edited once submitted
    console.log('\nAttempting to edit submitted quotation (expect 400 Bad Request)...');
    const badEditRes = await fetch(`${baseUrl}/quotations/${draft.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vendorToken}`
      },
      body: JSON.stringify({ deliveryDays: 10 })
    });
    console.log(`Status returned: ${badEditRes.status}`);
    if (badEditRes.status !== 400) {
      throw new Error(`Expected status 400, got ${badEditRes.status}`);
    }
    console.log('✓ Edit block on submitted quotations verified.');

    // 9. Staff query quotations by RFQ
    console.log('\nQuerying quotations for RFQ as staff...');
    const listRes = await fetch(`${baseUrl}/quotations/rfq/${rfq.id}`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const list = await listRes.json() as any;
    if (listRes.status !== 200 || list.length !== 1) {
      throw new Error(`Failed to retrieve quotations: ${JSON.stringify(list)}`);
    }
    console.log('✓ Staff list retrieval verified.');

    // 10. Staff compare quotations
    console.log('\nComparing quotations as staff...');
    const compareRes = await fetch(`${baseUrl}/quotations/compare/${rfq.id}`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const comparison = await compareRes.json() as any;
    if (compareRes.status !== 200 || comparison.quotations.length !== 1) {
      throw new Error(`Failed to retrieve comparison: ${JSON.stringify(comparison)}`);
    }
    console.log('✓ Staff side-by-side comparison payload verified.');

  } finally {
    // 11. Cleanup
    console.log('\nCleaning up database entries...');
    await prisma.quotationLineItem.deleteMany({});
    await prisma.quotation.deleteMany({});
    await prisma.rFQAssignment.deleteMany({});
    await prisma.rFQLineItem.deleteMany({});
    await prisma.rFQ.deleteMany({
      where: { title: 'Test RFQ for Quotations' }
    });
    await prisma.vendor.deleteMany({
      where: { gstNo: 'GST-QUOTE-TEST-99' }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [OFFICER_EMAIL, VENDOR_USER_EMAIL] } }
    });
    console.log('✓ Database cleaned up.');
  }
}

const server = app.listen(PORT, async () => {
  console.log(`Quotation test server started on port ${PORT}`);
  try {
    await runTests();
    console.log('\n=== ALL VENDOR QUOTATION SUBMISSION TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ VENDOR QUOTATION SUBMISSION TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    server.close();
  }
});
