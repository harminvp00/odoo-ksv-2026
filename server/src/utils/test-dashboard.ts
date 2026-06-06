import app from '../app';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const PORT = 5097;
const VENDOR_EMAIL = 'dash.vendor@vendorbridge.com';
const MANAGER_EMAIL = 'dash.manager@vendorbridge.com';
const PASSWORD = 'password123';

async function runTests() {
  console.log('--- Starting Dashboard Integration Tests ---');

  // 1. Initial cleanup to prevent duplicate keys
  console.log('Cleaning up existing test data...');
  
  // Clean up order: Invoices -> POs -> ApprovalChains -> Approvals -> Quotations -> RFQAssignments -> RFQLineItems -> RFQs -> Vendors -> Users
  await prisma.invoiceLineItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.approvalChain.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.quotationLineItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.rFQAssignment.deleteMany({});
  await prisma.rFQLineItem.deleteMany({});
  await prisma.rFQ.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.user.deleteMany({
    where: { email: { in: [VENDOR_EMAIL, MANAGER_EMAIL] } }
  });

  // 2. Create test users
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  const vendorUser = await prisma.user.create({
    data: {
      email: VENDOR_EMAIL,
      password: hashedPassword,
      firstName: 'Dash Vendor',
      lastName: 'User',
      role: 'VENDOR'
    }
  });

  const vendorProfile = await prisma.vendor.create({
    data: {
      name: 'Dash Vendor Inc',
      category: 'IT Solutions',
      gstNo: 'GST-DASH-12345',
      contactNo: '9999999999',
      status: 'ACTIVE',
      userId: vendorUser.id
    }
  });
  console.log(`Created test VENDOR: ${vendorUser.email} (Vendor ID: ${vendorProfile.id})`);

  const managerUser = await prisma.user.create({
    data: {
      email: MANAGER_EMAIL,
      password: hashedPassword,
      firstName: 'Dash Manager',
      lastName: 'User',
      role: 'MANAGER'
    }
  });
  console.log(`Created test MANAGER: ${managerUser.email}`);

  // 3. Create active RFQ created by manager
  const rfq = await prisma.rFQ.create({
    data: {
      title: 'Dashboard Test RFQ',
      category: 'IT Solutions',
      deadline: new Date(Date.now() + 86400000 * 7), // 7 days from now
      status: 'OPEN',
      createdByUserId: managerUser.id
    }
  });
  console.log(`Created test RFQ: ${rfq.title}`);

  // 4. Assign RFQ to vendor
  await prisma.rFQAssignment.create({
    data: {
      rfqId: rfq.id,
      vendorId: vendorProfile.id
    }
  });
  console.log('Assigned RFQ to vendor.');

  // 5. Submit Quotation from vendor
  const quotation = await prisma.quotation.create({
    data: {
      rfqId: rfq.id,
      vendorId: vendorProfile.id,
      subtotal: 1000.00,
      gstPercentage: 18.00,
      gstAmount: 180.00,
      grandTotal: 1180.00,
      deliveryDays: 5,
      status: 'SUBMITTED'
    }
  });
  console.log('Submitted quotation.');

  // 6. Create Approval Chain (pending manager action)
  const approval = await prisma.approval.create({
    data: {
      rfqId: rfq.id,
      quotationId: quotation.id,
      currentStep: 'L2_Approval',
      status: 'PENDING'
    }
  });
  await prisma.approvalChain.create({
    data: {
      approvalId: approval.id,
      userId: managerUser.id,
      role: 'MANAGER',
      status: 'PENDING',
      stepNumber: 1
    }
  });
  console.log('Created pending approval chain step for manager.');

  // 7. Create Purchase Order
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: `PO-DASH-${Date.now().toString().slice(-4)}`,
      rfqId: rfq.id,
      quotationId: quotation.id,
      vendorId: vendorProfile.id,
      status: 'SENT',
      createdByUserId: managerUser.id
    }
  });
  console.log(`Created Purchase Order: ${po.poNumber}`);

  // 8. Create Invoice linked to PO
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-DASH-${Date.now().toString().slice(-4)}`,
      purchaseOrderId: po.id,
      dueDate: new Date(Date.now() + 86400000 * 30),
      subtotal: 1000.00,
      cgst: 90.00,
      sgst: 90.00,
      grandTotal: 1180.00,
      status: 'PENDING_PAYMENT'
    }
  });
  console.log(`Created Invoice: ${invoice.invoiceNumber}`);

  const baseUrl = `http://localhost:${PORT}/api`;

  try {
    // 9. Login users to get tokens
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
      throw new Error('Could not retrieve tokens for testing.');
    }
    console.log('✓ Tokens retrieved.');

    // 10. Fetch dashboard for VENDOR
    console.log('\nFetching dashboard for VENDOR...');
    const vendorDashRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    const vendorDash = await vendorDashRes.json() as any;

    if (vendorDashRes.status !== 200) {
      throw new Error(`Vendor dashboard failed with status ${vendorDashRes.status}: ${JSON.stringify(vendorDash)}`);
    }

    console.log('Vendor Dashboard returned status 200.');
    
    // Assert Vendor lists
    if (vendorDash.role !== 'VENDOR') throw new Error('Role must be VENDOR');
    if (vendorDash.activeRFQs.length === 0) throw new Error('Active RFQs list should not be empty');
    if (vendorDash.recentPOs.length === 0) throw new Error('Recent POs list should not be empty');
    if (vendorDash.recentInvoices.length === 0) throw new Error('Recent Invoices list should not be empty');
    
    // Assert Vendor stats
    const assignedRFQsCard = vendorDash.analytics.find((c: any) => c.title === 'Assigned RFQs');
    const totalRevCard = vendorDash.analytics.find((c: any) => c.title === 'Total Revenue');
    if (!assignedRFQsCard || assignedRFQsCard.value !== 1) throw new Error(`Expected Assigned RFQs count 1, got ${assignedRFQsCard?.value}`);
    if (!totalRevCard || totalRevCard.value !== '$1180.00') throw new Error(`Expected Total Revenue $1180.00, got ${totalRevCard?.value}`);
    
    // Assert Vendor quickActions
    const viewRFQsAction = vendorDash.quickActions.find((a: any) => a.action === 'view_rfqs');
    const submitQuoteAction = vendorDash.quickActions.find((a: any) => a.action === 'submit_quotation');
    if (!viewRFQsAction || viewRFQsAction.label !== 'View RFQs') throw new Error('Expected View RFQs quick action');
    if (!submitQuoteAction || submitQuoteAction.label !== 'Submit Quotation') throw new Error('Expected Submit Quotation quick action');

    console.log('✓ VENDOR dashboard calculations, lists, and quick actions verified successfully.');

    // 11. Fetch dashboard for MANAGER
    console.log('\nFetching dashboard for MANAGER...');
    const managerDashRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    const managerDash = await managerDashRes.json() as any;

    if (managerDashRes.status !== 200) {
      throw new Error(`Manager dashboard failed with status ${managerDashRes.status}: ${JSON.stringify(managerDash)}`);
    }

    console.log('Manager Dashboard returned status 200.');

    // Assert Manager lists
    if (managerDash.role !== 'MANAGER') throw new Error('Role must be MANAGER');
    if (managerDash.pendingApprovals.length === 0) throw new Error('Pending approvals should not be empty');
    if (managerDash.activeRFQs.length === 0) throw new Error('Active RFQs list should not be empty');
    if (managerDash.recentPOs.length === 0) throw new Error('Recent POs list should not be empty');
    
    // Assert Manager stats
    const activeRFQsCard = managerDash.analytics.find((c: any) => c.title === 'Active RFQs');
    const pendingAppCard = managerDash.analytics.find((c: any) => c.title === 'Pending Approvals');
    const totalSpendCard = managerDash.analytics.find((c: any) => c.title === 'Total Spend');
    
    if (!activeRFQsCard || activeRFQsCard.value !== 1) throw new Error(`Expected Active RFQs count 1, got ${activeRFQsCard?.value}`);
    if (!pendingAppCard || pendingAppCard.value !== 1) throw new Error(`Expected Pending Approvals count 1, got ${pendingAppCard?.value}`);
    if (!totalSpendCard || totalSpendCard.value !== '$1180.00') throw new Error(`Expected Total Spend $1180.00, got ${totalSpendCard?.value}`);
    
    // Assert Manager quickActions
    const reviewAppAction = managerDash.quickActions.find((a: any) => a.action === 'review_approvals');
    const viewReportsAction = managerDash.quickActions.find((a: any) => a.action === 'view_reports');
    if (!reviewAppAction || reviewAppAction.label !== 'Review Approvals') throw new Error('Expected Review Approvals quick action');
    if (!viewReportsAction || viewReportsAction.label !== 'View Reports') throw new Error('Expected View Reports quick action');

    console.log('✓ MANAGER dashboard calculations, lists, chain verification, and quick actions verified successfully.');

  } finally {
    // Cleanup order: Invoices -> POs -> ApprovalChains -> Approvals -> Quotations -> RFQAssignments -> RFQs -> Vendors -> Users
    console.log('\nCleaning up seeded test database entries...');
    await prisma.invoice.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.approvalChain.deleteMany({});
    await prisma.approval.deleteMany({});
    await prisma.quotation.deleteMany({});
    await prisma.rFQAssignment.deleteMany({});
    await prisma.rFQ.deleteMany({});
    await prisma.vendor.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { in: [VENDOR_EMAIL, MANAGER_EMAIL] } }
    });
    console.log('✓ Database cleaned up.');
  }
}

const server = app.listen(PORT, async () => {
  console.log(`Dashboard test server started on port ${PORT}`);
  try {
    await runTests();
    console.log('\n=== ALL DASHBOARD HOME SCREEN TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ DASHBOARD TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    server.close();
  }
});
