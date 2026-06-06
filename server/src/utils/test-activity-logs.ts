import app from '../app';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const PORT = 5090;
const OFFICER_EMAIL = 'act.officer@vendorbridge.com';
const VENDOR_USER_EMAIL = 'act.vendor@vendorbridge.com';
const MANAGER_EMAIL = 'act.manager@vendorbridge.com';
const PASSWORD = 'Password123';

async function runTests() {
  console.log('--- Starting Activity Logs & Notifications Integration Tests ---');

  // 1. Initial cleanup
  console.log('Cleaning up existing test data...');
  await prisma.notification.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.approvalChain.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.quotationLineItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.rFQAssignment.deleteMany({});
  await prisma.rFQLineItem.deleteMany({});
  await prisma.rFQ.deleteMany({
    where: { title: 'Activity Test RFQ' }
  });
  await prisma.vendor.deleteMany({
    where: { gstNo: 'GST-ACT-TEST-99' }
  });
  await prisma.user.deleteMany({
    where: { email: { in: [OFFICER_EMAIL, VENDOR_USER_EMAIL, MANAGER_EMAIL] } }
  });

  // 2. Create test users
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  const officerUser = await prisma.user.create({
    data: {
      email: OFFICER_EMAIL,
      password: hashedPassword,
      firstName: 'Activity Officer',
      lastName: 'Staff',
      role: 'PROCUREMENT_OFFICER'
    }
  });
  console.log(`Created test PROCUREMENT_OFFICER: ${officerUser.email}`);

  const managerUser = await prisma.user.create({
    data: {
      email: MANAGER_EMAIL,
      password: hashedPassword,
      firstName: 'Activity Manager',
      lastName: 'Boss',
      role: 'MANAGER'
    }
  });
  console.log(`Created test MANAGER: ${managerUser.email}`);

  const vendorUser = await prisma.user.create({
    data: {
      email: VENDOR_USER_EMAIL,
      password: hashedPassword,
      firstName: 'Activity Vendor',
      lastName: 'Seller',
      role: 'VENDOR'
    }
  });
  const vendorProfile = await prisma.vendor.create({
    data: {
      name: 'Activity Vendor Corp',
      category: 'Office Furniture',
      gstNo: 'GST-ACT-TEST-99',
      contactNo: '9777777777',
      userId: vendorUser.id
    }
  });
  console.log(`Created test VENDOR: ${vendorProfile.name}`);

  const baseUrl = `http://localhost:${PORT}/api`;

  try {
    // 3. Login to get tokens
    console.log('\nLogging in users...');
    const log1 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: OFFICER_EMAIL, password: PASSWORD })
    });
    const { token: officerToken } = await log1.json() as any;

    const log2 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: VENDOR_USER_EMAIL, password: PASSWORD })
    });
    const { token: vendorToken } = await log2.json() as any;

    console.log('✓ Tokens retrieved.');

    // 4. Create RFQ (Should trigger RFQ creation ActivityLog and Vendor Notification)
    console.log('\nCreating RFQ (expecting log + vendor notification)...');
    const rfqRes = await fetch(`${baseUrl}/rfqs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        title: 'Activity Test RFQ',
        category: 'Office Furniture',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Testing audit logs',
        lineItems: [{ item: 'Ergonomic Desk', qty: 2, unit: 'NOS' }],
        assignedVendorIds: [vendorProfile.id]
      })
    });
    const rfq = await rfqRes.json() as any;
    if (rfqRes.status !== 201) throw new Error(`Failed to create RFQ: ${JSON.stringify(rfq)}`);
    console.log('✓ RFQ created.');

    // 5. Verify Vendor Notifications
    console.log('\nChecking Vendor notifications...');
    const vendorNotifRes = await fetch(`${baseUrl}/activity/notifications`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    const vendorNotifs = await vendorNotifRes.json() as any[];
    if (vendorNotifRes.status !== 200) throw new Error('Failed to fetch vendor notifications');
    
    const rfqAssNotif = vendorNotifs.find(n => n.type === 'RFQ');
    if (!rfqAssNotif) throw new Error('Vendor did not receive RFQ assignment notification');
    if (rfqAssNotif.isRead !== false) throw new Error('Expected notification isRead to be false');
    console.log(`✓ Vendor notification received: "${rfqAssNotif.title}" - "${rfqAssNotif.message}"`);

    // 6. Mark Notification as Read
    console.log('\nMarking notification as read...');
    const readRes = await fetch(`${baseUrl}/activity/notifications/${rfqAssNotif.id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    const updatedNotif = await readRes.json() as any;
    if (readRes.status !== 200) throw new Error('Failed to mark notification as read');
    if (updatedNotif.isRead !== true) throw new Error('Expected isRead to be updated to true');
    console.log('✓ Notification read update verified.');

    // 7. Submit Quotation (Should trigger Quotation submit ActivityLog and Officer Notification)
    console.log('\nSubmitting Quotation (expecting log + officer notification)...');
    const quoteRes = await fetch(`${baseUrl}/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vendorToken}`
      },
      body: JSON.stringify({
        rfqId: rfq.id,
        deliveryDays: 5,
        paymentTerms: 'COD',
        status: 'SUBMITTED',
        lineItems: [{ item: 'Ergonomic Desk', qty: 2, unit: 'NOS', unitPrice: 3000 }]
      })
    });
    const quotation = await quoteRes.json() as any;
    if (quoteRes.status !== 201) throw new Error(`Failed to submit quotation: ${JSON.stringify(quotation)}`);
    console.log('✓ Quotation submitted.');

    // 8. Verify Officer Notifications
    console.log('\nChecking Officer notifications...');
    const officerNotifRes = await fetch(`${baseUrl}/activity/notifications`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const officerNotifs = await officerNotifRes.json() as any[];
    if (officerNotifRes.status !== 200) throw new Error('Failed to fetch officer notifications');
    
    const quoteSubNotif = officerNotifs.find(n => n.title === 'New Quotation Submitted');
    if (!quoteSubNotif) throw new Error('Officer did not receive quotation submit notification');
    console.log(`✓ Officer notification received: "${quoteSubNotif.title}" - "${quoteSubNotif.message}"`);

    // 9. Mark all notifications as read
    console.log('\nTesting read-all notifications...');
    const readAllRes = await fetch(`${baseUrl}/activity/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    if (readAllRes.status !== 200) throw new Error('Failed to mark all as read');
    
    const officerNotifRes2 = await fetch(`${baseUrl}/activity/notifications`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const officerNotifs2 = await officerNotifRes2.json() as any[];
    const unread = officerNotifs2.filter(n => !n.isRead);
    if (unread.length !== 0) throw new Error('Expected 0 unread notifications after read-all');
    console.log('✓ Read-all notifications verified.');

    // 10. Initiate Approval Workflow (Should log Approval Initiation and notify Officer step 1)
    console.log('\nInitiating Approval Workflow...');
    const initRes = await fetch(`${baseUrl}/approvals/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        rfqId: rfq.id,
        quotationId: quotation.id,
        approverIds: [officerUser.id, managerUser.id]
      })
    });
    const approval = await initRes.json() as any;
    if (initRes.status !== 201) throw new Error(`Failed to initiate approval: ${JSON.stringify(approval)}`);
    console.log('✓ Approval initiated.');

    // 11. Fetch Audit Activity Logs (Should contain RFQ, Quotation, and Approval logs)
    console.log('\nFetching System Audit Logs (chronological order)...');
    const logsRes = await fetch(`${baseUrl}/activity`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const logsData = await logsRes.json() as any;
    if (logsRes.status !== 200) throw new Error('Failed to fetch activity logs');
    
    console.log(`Retrieved ${logsData.logs.length} audit log entries.`);
    if (logsData.logs.length < 3) throw new Error('Expected at least 3 activity logs in system');
    
    // Verify reverse chronological ordering (newest first)
    const times = logsData.logs.map((l: any) => new Date(l.createdAt).getTime());
    for (let i = 0; i < times.length - 1; i++) {
      if (times[i] < times[i + 1]) {
        throw new Error('Activity logs are not sorted in reverse chronological order (newest first)');
      }
    }
    console.log('✓ Chronological reverse sorting of activity logs verified.');

    // Print first few logs for confirmation
    logsData.logs.slice(0, 3).forEach((l: any) => {
      console.log(`  - [${l.type}] ${l.description} (at ${l.createdAt})`);
    });

  } finally {
    // 12. Cleanup
    console.log('\nCleaning up database entries...');
    await prisma.notification.deleteMany({});
    await prisma.activityLog.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.approvalChain.deleteMany({});
    await prisma.approval.deleteMany({});
    await prisma.quotationLineItem.deleteMany({});
    await prisma.quotation.deleteMany({});
    await prisma.rFQAssignment.deleteMany({});
    await prisma.rFQLineItem.deleteMany({});
    await prisma.rFQ.deleteMany({
      where: { title: 'Activity Test RFQ' }
    });
    await prisma.vendor.deleteMany({
      where: { gstNo: 'GST-ACT-TEST-99' }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [OFFICER_EMAIL, VENDOR_USER_EMAIL, MANAGER_EMAIL] } }
    });
    console.log('✓ Database cleaned up.');
  }
}

const server = app.listen(PORT, async () => {
  console.log(`Activity/Notification test server started on port ${PORT}`);
  try {
    await runTests();
    console.log('\n=== ALL ACTIVITY LOG & NOTIFICATION TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ACTIVITY LOG & NOTIFICATION TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    server.close();
  }
});
