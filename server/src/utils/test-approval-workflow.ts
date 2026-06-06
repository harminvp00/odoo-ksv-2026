import app from '../app';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const PORT = 5092;
const OFFICER_EMAIL = 'aw.officer@vendorbridge.com';
const MANAGER_EMAIL = 'aw.manager@vendorbridge.com';
const VENDOR_USER_EMAIL = 'aw.vendor@vendorbridge.com';
const PASSWORD = 'Password123';

async function runTests() {
  console.log('--- Starting Approval Workflow Screen Integration Tests ---');

  // 1. Initial cleanup
  console.log('Cleaning up existing test data...');
  await prisma.purchaseOrder.deleteMany({});
  await prisma.approvalChain.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.quotationLineItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.rFQAssignment.deleteMany({});
  await prisma.rFQLineItem.deleteMany({});
  await prisma.rFQ.deleteMany({
    where: { title: 'Test RFQ for Approvals' }
  });
  await prisma.vendor.deleteMany({
    where: { gstNo: 'GST-AW-TEST-99' }
  });
  await prisma.user.deleteMany({
    where: { email: { in: [OFFICER_EMAIL, MANAGER_EMAIL, VENDOR_USER_EMAIL] } }
  });

  // 2. Create test users
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  const officerUser = await prisma.user.create({
    data: {
      email: OFFICER_EMAIL,
      password: hashedPassword,
      firstName: 'Approval Officer',
      lastName: 'Staff',
      role: 'PROCUREMENT_OFFICER'
    }
  });
  console.log(`Created test PROCUREMENT_OFFICER: ${officerUser.email}`);

  const managerUser = await prisma.user.create({
    data: {
      email: MANAGER_EMAIL,
      password: hashedPassword,
      firstName: 'Approval Manager',
      lastName: 'Boss',
      role: 'MANAGER'
    }
  });
  console.log(`Created test MANAGER: ${managerUser.email}`);

  const vendorUser = await prisma.user.create({
    data: {
      email: VENDOR_USER_EMAIL,
      password: hashedPassword,
      firstName: 'Approval Vendor',
      lastName: 'Seller',
      role: 'VENDOR'
    }
  });
  const vendorProfile = await prisma.vendor.create({
    data: {
      name: 'AW Vendor Corp',
      category: 'IT Solutions',
      gstNo: 'GST-AW-TEST-99',
      contactNo: '9999999999',
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
      body: JSON.stringify({ email: MANAGER_EMAIL, password: PASSWORD })
    });
    const { token: managerToken } = await log2.json() as any;

    const log3 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: VENDOR_USER_EMAIL, password: PASSWORD })
    });
    const { token: vendorToken } = await log3.json() as any;

    console.log('✓ All tokens retrieved.');

    // 4. Create RFQ and Quotation
    console.log('\nCreating RFQ and Quotation...');
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 7);

    const rfq = await prisma.rFQ.create({
      data: {
        title: 'Test RFQ for Approvals',
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

    const quotation = await prisma.quotation.create({
      data: {
        rfqId: rfq.id,
        vendorId: vendorProfile.id,
        subtotal: 2000,
        gstPercentage: 18.0,
        gstAmount: 360,
        grandTotal: 2360,
        deliveryDays: 5,
        paymentTerms: '20 days net',
        status: 'SUBMITTED'
      }
    });
    console.log('✓ RFQ and Quotation created.');

    // 5. Initiate Approval workflow
    console.log('\nInitiating approval workflow...');
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

    if (initRes.status !== 201) {
      throw new Error(`Failed to initiate approval: ${JSON.stringify(approval)}`);
    }

    console.log(`✓ Approval workflow initiated. ID: ${approval.id}`);
    if (approval.currentStep !== 'L1_Review') throw new Error(`Expected L1_Review, got ${approval.currentStep}`);
    if (approval.status !== 'PENDING') throw new Error('Expected status to be PENDING');
    if (approval.chain.length !== 2) throw new Error('Expected chain to contain exactly 2 steps');
    console.log('✓ Initial step (L1_Review) and PENDING status verified.');

    // 6. Fetch timeline details
    console.log('\nFetching approval timeline details...');
    const getRes = await fetch(`${baseUrl}/approvals/${approval.id}`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const timeline = await getRes.json() as any;
    if (getRes.status !== 200) throw new Error('Failed to get timeline details');
    if (timeline.chain[0].stepNumber !== 1 || timeline.chain[1].stepNumber !== 2) {
      throw new Error('Timeline steps ordered incorrectly');
    }
    console.log('✓ Timeline steps retrieved and ordered correctly.');

    // 7. Approve step 1 as Officer
    console.log('\nApproving step 1 (L1_Review) as Officer...');
    const action1Res = await fetch(`${baseUrl}/approvals/${approval.id}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        action: 'APPROVE',
        remarks: 'Looks good to me'
      })
    });
    const updatedApproval = await action1Res.json() as any;

    if (action1Res.status !== 200) {
      throw new Error(`Failed to approve step 1: ${JSON.stringify(updatedApproval)}`);
    }

    console.log('✓ Step 1 approved.');
    if (updatedApproval.currentStep !== 'L2_Approval') throw new Error(`Expected currentStep L2_Approval, got ${updatedApproval.currentStep}`);
    if (updatedApproval.chain[0].status !== 'APPROVED') throw new Error('Expected step 1 status to be APPROVED');
    if (updatedApproval.chain[0].remarks !== 'Looks good to me') throw new Error('Expected step 1 remarks to match');
    console.log('✓ Step 1 remarks and workflow state transition verified.');

    // 8. Attempt to approve step 2 as Officer (should fail - forbidden)
    console.log('\nAttempting to approve step 2 as Officer (expect 403 Forbidden)...');
    const badActionRes = await fetch(`${baseUrl}/approvals/${approval.id}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        action: 'APPROVE',
        remarks: 'Officer trying to approve Manager step'
      })
    });
    console.log(`Status returned: ${badActionRes.status}`);
    if (badActionRes.status !== 403) {
      throw new Error(`Expected status 403, got ${badActionRes.status}`);
    }
    console.log('✓ Role boundary protection verified.');

    // 9. Approve step 2 as Manager
    console.log('\nApproving step 2 (L2_Approval) as Manager (Final step)...');
    const action2Res = await fetch(`${baseUrl}/approvals/${approval.id}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        action: 'APPROVE',
        remarks: 'Approved by management'
      })
    });
    const finalApproval = await action2Res.json() as any;

    if (action2Res.status !== 200) {
      throw new Error(`Failed to approve step 2: ${JSON.stringify(finalApproval)}`);
    }

    console.log('✓ Step 2 approved.');
    if (finalApproval.status !== 'APPROVED') throw new Error(`Expected overall status APPROVED, got ${finalApproval.status}`);
    if (finalApproval.currentStep !== 'Completed') throw new Error(`Expected currentStep Completed, got ${finalApproval.currentStep}`);

    // Verify DB Side effects
    const dbQuotation = await prisma.quotation.findUnique({ where: { id: quotation.id } });
    if (dbQuotation?.status !== 'SELECTED') {
      throw new Error(`Expected Quotation status SELECTED, got ${dbQuotation?.status}`);
    }
    console.log('✓ Quotation status updated to SELECTED in database.');

    const dbRfq = await prisma.rFQ.findUnique({ where: { id: rfq.id } });
    if (dbRfq?.status !== 'CLOSED') {
      throw new Error(`Expected RFQ status CLOSED, got ${dbRfq?.status}`);
    }
    console.log('✓ RFQ status updated to CLOSED in database.');

    const po = await prisma.purchaseOrder.findFirst({
      where: { quotationId: quotation.id }
    });
    if (!po) throw new Error('Expected auto-generated Purchase Order not found');
    if (po.status !== 'DRAFT') throw new Error(`Expected PO status DRAFT, got ${po.status}`);
    if (!po.poNumber.startsWith('PO-2026-')) {
      throw new Error(`Expected PO number starting with PO-2026-, got ${po.poNumber}`);
    }
    console.log(`✓ Auto-generated PO verified: Number: ${po.poNumber}, Status: ${po.status}`);

  } finally {
    // 10. Cleanup
    console.log('\nCleaning up database entries...');
    await prisma.purchaseOrder.deleteMany({});
    await prisma.approvalChain.deleteMany({});
    await prisma.approval.deleteMany({});
    await prisma.quotationLineItem.deleteMany({});
    await prisma.quotation.deleteMany({});
    await prisma.rFQAssignment.deleteMany({});
    await prisma.rFQLineItem.deleteMany({});
    await prisma.rFQ.deleteMany({
      where: { title: 'Test RFQ for Approvals' }
    });
    await prisma.vendor.deleteMany({
      where: { gstNo: 'GST-AW-TEST-99' }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [OFFICER_EMAIL, MANAGER_EMAIL, VENDOR_USER_EMAIL] } }
    });
    console.log('✓ Database cleaned up.');
  }
}

const server = app.listen(PORT, async () => {
  console.log(`Approval test server started on port ${PORT}`);
  try {
    await runTests();
    console.log('\n=== ALL APPROVAL WORKFLOW TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ APPROVAL WORKFLOW TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    server.close();
  }
});
