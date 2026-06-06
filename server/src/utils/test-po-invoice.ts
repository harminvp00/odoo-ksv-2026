import app from '../app';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const PORT = 5091;
const OFFICER_EMAIL = 'po.officer@vendorbridge.com';
const VENDOR_USER_EMAIL = 'po.vendor@vendorbridge.com';
const TARGET_TEST_EMAIL = 'vekariyaharmin96@gmail.com';
const PASSWORD = 'Password123';

async function runTests() {
  console.log('--- Starting Purchase Order & Invoice Screen Integration Tests ---');

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
    where: { title: 'Test RFQ for PO and Invoice' }
  });
  await prisma.vendor.deleteMany({
    where: { gstNo: 'GST-PO-TEST-99' }
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
      firstName: 'PO Officer',
      lastName: 'Staff',
      role: 'PROCUREMENT_OFFICER'
    }
  });
  console.log(`Created test PROCUREMENT_OFFICER: ${officerUser.email}`);

  const vendorUser = await prisma.user.create({
    data: {
      email: VENDOR_USER_EMAIL,
      password: hashedPassword,
      firstName: 'PO Vendor',
      lastName: 'Seller',
      role: 'VENDOR'
    }
  });
  const vendorProfile = await prisma.vendor.create({
    data: {
      name: 'PO Vendor Corp',
      category: 'Office Furniture',
      gstNo: 'GST-PO-TEST-99',
      contactNo: '9888888888',
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

    console.log('✓ Tokens retrieved.');

    // 4. Create RFQ and Quotation
    console.log('\nCreating RFQ and Quotation...');
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 7);

    const rfq = await prisma.rFQ.create({
      data: {
        title: 'Test RFQ for PO and Invoice',
        category: 'Office Furniture',
        deadline: deadlineDate,
        createdByUserId: officerUser.id,
        status: 'OPEN'
      }
    });

    await prisma.rFQLineItem.create({
      data: {
        rfqId: rfq.id,
        item: 'Ergonomic Chair',
        qty: 5,
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
        subtotal: 10000,
        gstPercentage: 18.0,
        gstAmount: 1800,
        grandTotal: 11800,
        deliveryDays: 7,
        paymentTerms: '30 days',
        status: 'SUBMITTED'
      }
    });

    await prisma.quotationLineItem.create({
      data: {
        quotationId: quotation.id,
        item: 'Ergonomic Chair',
        qty: 5,
        unit: 'NOS',
        unitPrice: 2000,
        totalVal: 10000
      }
    });
    console.log('✓ RFQ, Quotation, and Line Items created.');

    // 5. Create Purchase Order (PO)
    console.log('\nCreating Purchase Order (PO)...');
    const poRes = await fetch(`${baseUrl}/pos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        rfqId: rfq.id,
        quotationId: quotation.id,
        vendorId: vendorProfile.id
      })
    });
    const po = await poRes.json() as any;

    if (poRes.status !== 201) {
      throw new Error(`Failed to generate PO: ${JSON.stringify(po)}`);
    }

    console.log(`✓ PO created: ${po.poNumber}`);
    if (po.status !== 'DRAFT') throw new Error(`Expected PO status DRAFT, got ${po.status}`);
    if (!po.poNumber.startsWith('PO-2026-')) throw new Error(`Expected PO-2026- prefix, got ${po.poNumber}`);

    // 6. Update PO status
    console.log('\nUpdating PO status...');
    const poStatusRes = await fetch(`${baseUrl}/pos/${po.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({ status: 'SENT' })
    });
    const updatedPo = await poStatusRes.json() as any;
    if (poStatusRes.status !== 200) throw new Error('Failed to update PO status');
    if (updatedPo.status !== 'SENT') throw new Error(`Expected PO status SENT, got ${updatedPo.status}`);
    console.log('✓ PO status transitioned successfully.');

    // 7. Fetch PO details
    console.log('\nFetching PO details...');
    const getPoRes = await fetch(`${baseUrl}/pos/${po.id}`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const poDetails = await getPoRes.json() as any;
    if (getPoRes.status !== 200) throw new Error('Failed to fetch PO details');
    if (poDetails.quotation.lineItems.length !== 1) throw new Error('Expected 1 quotation line item');
    console.log('✓ PO details retrieved correctly.');

    // 8. Generate Invoice from PO
    console.log('\nGenerating Invoice from PO...');
    const invRes = await fetch(`${baseUrl}/invoices/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({ purchaseOrderId: po.id })
    });
    const invoice = await invRes.json() as any;

    if (invRes.status !== 201) {
      throw new Error(`Failed to generate invoice: ${JSON.stringify(invoice)}`);
    }

    console.log(`✓ Invoice generated: ${invoice.invoiceNumber}`);
    if (invoice.status !== 'PENDING_PAYMENT') throw new Error(`Expected status PENDING_PAYMENT, got ${invoice.status}`);
    
    // 9. Tax calculations and Total calculations verification
    console.log('\nVerifying Tax and Total calculations...');
    const sub = parseFloat(invoice.subtotal);
    const cgst = parseFloat(invoice.cgst);
    const sgst = parseFloat(invoice.sgst);
    const grand = parseFloat(invoice.grandTotal);

    console.log(`Calculated values: Subtotal: ${sub}, CGST: ${cgst}, SGST: ${sgst}, Grand Total: ${grand}`);
    if (sub !== 10000) throw new Error(`Expected subtotal 10000, got ${sub}`);
    if (cgst !== 900) throw new Error(`Expected CGST 900 (9%), got ${cgst}`);
    if (sgst !== 900) throw new Error(`Expected SGST 900 (9%), got ${sgst}`);
    if (grand !== 11800) throw new Error(`Expected grandTotal 11800, got ${grand}`);
    console.log('✓ Tax and Grand Total calculations verified.');

    // 10. Update Invoice status
    console.log('\nUpdating Invoice status...');
    const invStatusRes = await fetch(`${baseUrl}/invoices/${invoice.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({ status: 'PAID' })
    });
    const updatedInvoice = await invStatusRes.json() as any;
    if (invStatusRes.status !== 200) throw new Error('Failed to update invoice status');
    if (updatedInvoice.status !== 'PAID') throw new Error(`Expected status PAID, got ${updatedInvoice.status}`);
    console.log('✓ Invoice status updated successfully.');

    // 11. Download invoice PDF
    console.log('\nTesting Invoice PDF download...');
    const pdfRes = await fetch(`${baseUrl}/invoices/${invoice.id}/pdf`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    if (pdfRes.status !== 200) throw new Error('Failed to download PDF');
    const contentType = pdfRes.headers.get('Content-Type');
    if (contentType !== 'application/pdf') throw new Error(`Expected Content-Type application/pdf, got ${contentType}`);
    const pdfBuffer = await pdfRes.arrayBuffer();
    console.log(`✓ Invoice PDF received successfully (Size: ${pdfBuffer.byteLength} bytes).`);

    // 12. Send Invoice via Email
    console.log(`\nTesting Email sending to ${TARGET_TEST_EMAIL}...`);
    const emailRes = await fetch(`${baseUrl}/invoices/${invoice.id}/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerToken}`
      },
      body: JSON.stringify({ email: TARGET_TEST_EMAIL })
    });
    const emailReport = await emailRes.json() as any;

    if (emailRes.status !== 200) {
      throw new Error(`Failed to send email: ${JSON.stringify(emailReport)}`);
    }
    console.log(`✓ Email report: ${emailReport.message}`);
    console.log(`✓ Email verified and successfully sent to: ${emailReport.recipient}`);

  } finally {
    // 13. Cleanup
    console.log('\nCleaning up database entries...');
    await prisma.invoiceLineItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.quotationLineItem.deleteMany({});
    await prisma.quotation.deleteMany({});
    await prisma.rFQAssignment.deleteMany({});
    await prisma.rFQLineItem.deleteMany({});
    await prisma.rFQ.deleteMany({
      where: { title: 'Test RFQ for PO and Invoice' }
    });
    await prisma.vendor.deleteMany({
      where: { gstNo: 'GST-PO-TEST-99' }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [OFFICER_EMAIL, VENDOR_USER_EMAIL] } }
    });
    console.log('✓ Database cleaned up.');
  }
}

const server = app.listen(PORT, async () => {
  console.log(`PO/Invoice test server started on port ${PORT}`);
  try {
    await runTests();
    console.log('\n=== ALL PO & INVOICE TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ PO & INVOICE TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    server.close();
  }
});
