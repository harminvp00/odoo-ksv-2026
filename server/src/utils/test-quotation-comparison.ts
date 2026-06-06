import app from '../app';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const PORT = 5093;
const OFFICER_EMAIL = 'qc.officer@vendorbridge.com';
const VENDOR1_EMAIL = 'qc.vendor1@vendorbridge.com';
const VENDOR2_EMAIL = 'qc.vendor2@vendorbridge.com';
const PASSWORD = 'Password123';

async function runTests() {
  console.log('--- Starting Quotation Comparison Screen Integration Tests ---');

  // 1. Initial cleanup
  console.log('Cleaning up existing test data...');
  await prisma.quotationLineItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.rFQAssignment.deleteMany({});
  await prisma.rFQLineItem.deleteMany({});
  await prisma.rFQ.deleteMany({
    where: { title: 'Comparison RFQ' }
  });
  await prisma.vendor.deleteMany({
    where: { gstNo: { in: ['GST-COMP-TEST-11', 'GST-COMP-TEST-22'] } }
  });
  await prisma.user.deleteMany({
    where: { email: { in: [OFFICER_EMAIL, VENDOR1_EMAIL, VENDOR2_EMAIL] } }
  });

  // 2. Create test users
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  const officerUser = await prisma.user.create({
    data: {
      email: OFFICER_EMAIL,
      password: hashedPassword,
      firstName: 'Comparison Officer',
      lastName: 'Procurement',
      role: 'PROCUREMENT_OFFICER'
    }
  });
  console.log(`Created test PROCUREMENT_OFFICER: ${officerUser.email}`);

  const vendor1User = await prisma.user.create({
    data: {
      email: VENDOR1_EMAIL,
      password: hashedPassword,
      firstName: 'Alpha',
      lastName: 'Vendor',
      role: 'VENDOR'
    }
  });
  const vendor1Profile = await prisma.vendor.create({
    data: {
      name: 'Alpha Bidders',
      category: 'IT Solutions',
      gstNo: 'GST-COMP-TEST-11',
      contactNo: '1111111111',
      rating: 4.8,
      userId: vendor1User.id
    }
  });
  console.log(`Created Vendor 1 (Alpha Bidders): rating ${vendor1Profile.rating}`);

  const vendor2User = await prisma.user.create({
    data: {
      email: VENDOR2_EMAIL,
      password: hashedPassword,
      firstName: 'Beta',
      lastName: 'Vendor',
      role: 'VENDOR'
    }
  });
  const vendor2Profile = await prisma.vendor.create({
    data: {
      name: 'Beta Bidders',
      category: 'IT Solutions',
      gstNo: 'GST-COMP-TEST-22',
      contactNo: '2222222222',
      rating: 3.5,
      userId: vendor2User.id
    }
  });
  console.log(`Created Vendor 2 (Beta Bidders): rating ${vendor2Profile.rating}`);

  const baseUrl = `http://localhost:${PORT}/api`;

  try {
    // 3. Login to get officer token
    console.log('\nLogging in officer...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: OFFICER_EMAIL, password: PASSWORD })
    });
    const { token: officerToken } = await loginRes.json() as any;
    if (!officerToken) throw new Error('Failed to retrieve officer token.');
    console.log('✓ Token retrieved.');

    // 4. Create RFQ and assign to both vendors
    console.log('\nCreating RFQ and assignments...');
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 7);

    const rfq = await prisma.rFQ.create({
      data: {
        title: 'Comparison RFQ',
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

    await prisma.rFQAssignment.createMany({
      data: [
        { rfqId: rfq.id, vendorId: vendor1Profile.id },
        { rfqId: rfq.id, vendorId: vendor2Profile.id }
      ]
    });
    console.log('✓ RFQ created and assigned to both vendors.');

    // 5. Seed submitted quotations
    console.log('\nSeeding vendor quotations...');
    // Quotation 1: Alpha Bidders - Total 2360 (higher price), delivery 5 days (faster), rating 4.8 (higher)
    const subtotal1 = 2000;
    const gst1 = 360;
    const total1 = 2360;
    const q1 = await prisma.quotation.create({
      data: {
        rfqId: rfq.id,
        vendorId: vendor1Profile.id,
        subtotal: subtotal1,
        gstPercentage: 18.0,
        gstAmount: gst1,
        grandTotal: total1,
        deliveryDays: 5,
        paymentTerms: 'Net 15',
        status: 'SUBMITTED'
      }
    });
    await prisma.quotationLineItem.create({
      data: {
        quotationId: q1.id,
        item: 'ThinkPad T14',
        qty: 2,
        unit: 'NOS',
        unitPrice: 1000,
        totalVal: 2000
      }
    });

    // Quotation 2: Beta Bidders - Total 2124 (lower price), delivery 8 days (slower), rating 3.5 (lower)
    const subtotal2 = 1800;
    const gst2 = 324;
    const total2 = 2124;
    const q2 = await prisma.quotation.create({
      data: {
        rfqId: rfq.id,
        vendorId: vendor2Profile.id,
        subtotal: subtotal2,
        gstPercentage: 18.0,
        gstAmount: gst2,
        grandTotal: total2,
        deliveryDays: 8,
        paymentTerms: 'Net 30',
        status: 'SUBMITTED'
      }
    });
    await prisma.quotationLineItem.create({
      data: {
        quotationId: q2.id,
        item: 'ThinkPad T14',
        qty: 2,
        unit: 'NOS',
        unitPrice: 900,
        totalVal: 1800
      }
    });
    console.log('✓ Quotations seeded.');

    // 6. Fetch comparison report (standard side-by-side)
    console.log('\nFetching side-by-side comparison report...');
    const compareRes = await fetch(`${baseUrl}/quotations/compare/${rfq.id}`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const report = await compareRes.json() as any;

    if (compareRes.status !== 200) {
      throw new Error(`Failed to retrieve comparison: ${JSON.stringify(report)}`);
    }

    console.log('✓ Comparison retrieved.');
    const alphaQuote = report.quotations.find((q: any) => q.vendor.name === 'Alpha Bidders');
    const betaQuote = report.quotations.find((q: any) => q.vendor.name === 'Beta Bidders');

    if (!alphaQuote || !betaQuote) throw new Error('Expected both quotations in comparison report');

    // Assert Highlighting Flags
    if (betaQuote.isLowestPrice !== true) throw new Error('Beta Bidders should have the lowest price highlighted');
    if (alphaQuote.isLowestPrice === true) throw new Error('Alpha Bidders should NOT have the lowest price highlighted');

    if (alphaQuote.isFastestDelivery !== true) throw new Error('Alpha Bidders should have the fastest delivery highlighted');
    if (betaQuote.isFastestDelivery === true) throw new Error('Beta Bidders should NOT have the fastest delivery highlighted');

    if (alphaQuote.isHighestRated !== true) throw new Error('Alpha Bidders should have the highest rating highlighted');
    if (betaQuote.isHighestRated === true) throw new Error('Beta Bidders should NOT have the highest rating highlighted');

    const betaLineItem = betaQuote.lineItems[0];
    if (betaLineItem.isLowestUnitPrice !== true) throw new Error('Beta Bidders line item should have the lowest unit price highlighted');

    console.log('✓ Highlighting flags (lowest price, fastest delivery, highest rated, lowest unit price) verified successfully.');

    // 7. Verify sorting parameters
    console.log('\nTesting sorting by price (asc)...');
    const sortPriceRes = await fetch(`${baseUrl}/quotations/compare/${rfq.id}?sortBy=price&sortOrder=asc`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const priceReport = await sortPriceRes.json() as any;
    if (priceReport.quotations[0].vendor.name !== 'Beta Bidders') {
      throw new Error(`Expected Beta Bidders first, got ${priceReport.quotations[0].vendor.name}`);
    }
    console.log('✓ Sorting by price (asc) verified.');

    console.log('Testing sorting by delivery (asc)...');
    const sortDeliveryRes = await fetch(`${baseUrl}/quotations/compare/${rfq.id}?sortBy=delivery&sortOrder=asc`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const deliveryReport = await sortDeliveryRes.json() as any;
    if (deliveryReport.quotations[0].vendor.name !== 'Alpha Bidders') {
      throw new Error(`Expected Alpha Bidders first, got ${deliveryReport.quotations[0].vendor.name}`);
    }
    console.log('✓ Sorting by delivery (asc) verified.');

    console.log('Testing sorting by rating (desc)...');
    const sortRatingRes = await fetch(`${baseUrl}/quotations/compare/${rfq.id}?sortBy=rating&sortOrder=desc`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const ratingReport = await sortRatingRes.json() as any;
    if (ratingReport.quotations[0].vendor.name !== 'Alpha Bidders') {
      throw new Error(`Expected Alpha Bidders first, got ${ratingReport.quotations[0].vendor.name}`);
    }
    console.log('✓ Sorting by rating (desc) verified.');

  } finally {
    // 8. Cleanup
    console.log('\nCleaning up database entries...');
    await prisma.quotationLineItem.deleteMany({});
    await prisma.quotation.deleteMany({});
    await prisma.rFQAssignment.deleteMany({});
    await prisma.rFQLineItem.deleteMany({});
    await prisma.rFQ.deleteMany({
      where: { title: 'Comparison RFQ' }
    });
    await prisma.vendor.deleteMany({
      where: { gstNo: { in: ['GST-COMP-TEST-11', 'GST-COMP-TEST-22'] } }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [OFFICER_EMAIL, VENDOR1_EMAIL, VENDOR2_EMAIL] } }
    });
    console.log('✓ Database cleaned up.');
  }
}

const server = app.listen(PORT, async () => {
  console.log(`Comparison test server started on port ${PORT}`);
  try {
    await runTests();
    console.log('\n=== ALL QUOTATION COMPARISON TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ QUOTATION COMPARISON TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    server.close();
  }
});
