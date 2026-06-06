import app from '../app';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const PORT = 5089;
const OFFICER_EMAIL = 'rep.officer@vendorbridge.com';
const VENDOR_USER_EMAIL = 'rep.vendor@vendorbridge.com';
const PASSWORD = 'Password123';

async function runTests() {
  console.log('--- Starting Reports & Analytics Screen Integration Tests ---');

  // 1. Initial cleanup
  console.log('Cleaning up existing test data...');
  await prisma.invoiceLineItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.quotationLineItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.rFQAssignment.deleteMany({});
  await prisma.rFQLineItem.deleteMany({});
  await prisma.rFQ.deleteMany({
    where: { title: 'Report Mock RFQ' }
  });
  await prisma.vendor.deleteMany({
    where: { gstNo: 'GST-REP-TEST-12' }
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
      firstName: 'Report Officer',
      lastName: 'Staff',
      role: 'PROCUREMENT_OFFICER'
    }
  });
  console.log(`Created test PROCUREMENT_OFFICER: ${officerUser.email}`);

  const vendorUser = await prisma.user.create({
    data: {
      email: VENDOR_USER_EMAIL,
      password: hashedPassword,
      firstName: 'Report Vendor',
      lastName: 'Seller',
      role: 'VENDOR'
    }
  });
  const vendorProfile = await prisma.vendor.create({
    data: {
      name: 'Report Vendor Corp',
      category: 'Office IT Equipment',
      gstNo: 'GST-REP-TEST-12',
      contactNo: '9888888888',
      userId: vendorUser.id,
      rating: 4.8
    }
  });
  console.log(`Created test VENDOR: ${vendorProfile.name}`);

  const baseUrl = `http://localhost:${PORT}/api`;

  try {
    // 3. Login to get token
    console.log('\nLogging in officer...');
    const logRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: OFFICER_EMAIL, password: PASSWORD })
    });
    const { token: officerToken } = await logRes.json() as any;
    console.log('✓ Token retrieved.');

    // 4. Seed Mock Data for Report Metrics
    console.log('\nSeeding mock RFQ, Quotation, PO, and Invoice records...');
    const rfq = await prisma.rFQ.create({
      data: {
        title: 'Report Mock RFQ',
        category: 'Office IT Equipment',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'CLOSED',
        createdByUserId: officerUser.id
      }
    });

    const quotation = await prisma.quotation.create({
      data: {
        rfqId: rfq.id,
        vendorId: vendorProfile.id,
        subtotal: 12000,
        gstPercentage: 18,
        gstAmount: 2160,
        grandTotal: 14160,
        deliveryDays: 3,
        status: 'SELECTED'
      }
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: 'PO-REP-MOCK-001',
        rfqId: rfq.id,
        quotationId: quotation.id,
        vendorId: vendorProfile.id,
        createdByUserId: officerUser.id,
        status: 'DRAFT'
      }
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-REP-MOCK-001',
        purchaseOrderId: po.id,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: 12000,
        cgst: 1080,
        sgst: 1080,
        grandTotal: 14160,
        status: 'PAID'
      }
    });
    console.log('✓ Seeded: 1 RFQ (CLOSED), 1 Selected Quotation (14,160 INR), 1 PO, 1 Paid Invoice (14,160 INR).');

    // 5. Test GET /insights
    console.log('\nTesting GET /api/reports/insights...');
    const insightsRes = await fetch(`${baseUrl}/reports/insights`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const insights = await insightsRes.json() as any;
    if (insightsRes.status !== 200) throw new Error(`Insights returned non-200: ${JSON.stringify(insights)}`);

    // Verify statistics
    if (insights.statistics.totalRFQs < 1) throw new Error('Expected statistics.totalRFQs to be at least 1');
    if (insights.statistics.totalPOs < 1) throw new Error('Expected statistics.totalPOs to be at least 1');
    if (insights.statistics.totalInvoices < 1) throw new Error('Expected statistics.totalInvoices to be at least 1');
    console.log('✓ General Statistics verified.');

    // Verify spending summary
    if (insights.spendingSummary.committedSpend !== 14160) throw new Error(`Expected committedSpend to be 14160, got ${insights.spendingSummary.committedSpend}`);
    if (insights.spendingSummary.paidSpend !== 14160) throw new Error(`Expected paidSpend to be 14160, got ${insights.spendingSummary.paidSpend}`);
    console.log('✓ Spending Summaries verified.');

    // Verify monthly trends
    const currentMonthIndex = new Date().getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthName = months[currentMonthIndex];
    const trendForThisMonth = insights.monthlyTrends.find((t: any) => t.month === currentMonthName);
    if (!trendForThisMonth || trendForThisMonth.totalSpend !== 14160) {
      throw new Error(`Expected current month spend to be 14160, got: ${JSON.stringify(trendForThisMonth)}`);
    }
    console.log(`✓ Monthly Trends verified: spend for ${currentMonthName} is ${trendForThisMonth.totalSpend} INR.`);

    // Verify vendor performance
    const vp = insights.vendorPerformance.find((v: any) => v.vendorId === vendorProfile.id);
    if (!vp) throw new Error('Vendor profile not found in performance analytics');
    if (vp.rating !== 4.8) throw new Error(`Expected vendor rating 4.8, got ${vp.rating}`);
    if (vp.submittedQuotes !== 1) throw new Error(`Expected 1 submitted quotation, got ${vp.submittedQuotes}`);
    if (vp.selectedQuotes !== 1) throw new Error(`Expected 1 selected quotation, got ${vp.selectedQuotes}`);
    if (vp.conversionRate !== 100) throw new Error(`Expected conversion rate 100, got ${vp.conversionRate}`);
    if (vp.totalPaidVolume !== 14160) throw new Error(`Expected total paid volume 14160, got ${vp.totalPaidVolume}`);
    console.log(`✓ Vendor Performance Analytics verified: conversion rate ${vp.conversionRate}%, paid volume ${vp.totalPaidVolume} INR.`);

    // 6. Test Export to CSV
    console.log('\nTesting GET /api/reports/export (CSV, vendor-performance)...');
    const csvRes = await fetch(`${baseUrl}/reports/export?type=vendor-performance&format=csv`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const csvText = await csvRes.text();
    const contentType = csvRes.headers.get('content-type');
    const contentDisposition = csvRes.headers.get('content-disposition');

    if (csvRes.status !== 200) throw new Error('CSV Export failed');
    if (!contentType || !contentType.includes('text/csv')) throw new Error(`Expected CSV Content-Type, got: ${contentType}`);
    if (!contentDisposition || !contentDisposition.includes('attachment')) throw new Error(`Expected attachment header, got: ${contentDisposition}`);
    
    // Check CSV contents
    if (!csvText.includes('Vendor ID,Vendor Name,Rating,Category')) throw new Error('CSV headers mismatch');
    if (!csvText.includes('Report Vendor Corp')) throw new Error('CSV contents missing seed vendor details');
    console.log('✓ CSV Export headers and contents verified successfully.');

    // 7. Test Export to JSON
    console.log('\nTesting GET /api/reports/export (JSON, spending-summary)...');
    const jsonRes = await fetch(`${baseUrl}/reports/export?type=spending-summary&format=json`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const jsonBody = await jsonRes.json() as any[];
    if (jsonRes.status !== 200) throw new Error('JSON Export failed');
    if (jsonBody[0].committedSpend !== 14160) throw new Error(`Expected JSON spend 14160, got ${jsonBody[0].committedSpend}`);
    console.log('✓ JSON Export content verified successfully.');

  } finally {
    // 8. Cleanup
    console.log('\nCleaning up database entries...');
    await prisma.invoiceLineItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.quotationLineItem.deleteMany({});
    await prisma.quotation.deleteMany({});
    await prisma.rFQAssignment.deleteMany({});
    await prisma.rFQLineItem.deleteMany({});
    await prisma.rFQ.deleteMany({
      where: { title: 'Report Mock RFQ' }
    });
    await prisma.vendor.deleteMany({
      where: { gstNo: 'GST-REP-TEST-12' }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [OFFICER_EMAIL, VENDOR_USER_EMAIL] } }
    });
    console.log('✓ Database cleaned up.');
  }
}

const server = app.listen(PORT, async () => {
  console.log(`Reports/Analytics test server started on port ${PORT}`);
  try {
    await runTests();
    console.log('\n=== ALL REPORTS & ANALYTICS TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ REPORTS & ANALYTICS TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    server.close();
  }
});
