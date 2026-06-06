/**
 * VendorBridge ERP — Comprehensive Seed Script (with DB reset)
 * -----------------------------------------------
 * Behavior:
 *  - DELETES all transactional data (RFQs, Quotations, POs, Invoices, Approvals, Logs, Notifications)
 *  - KEEPS all existing User accounts (updates phone/country/additionalInfo if missing)
 *  - KEEPS existing Vendor company profiles (updates data)
 *  - Re-creates all transactional demo data
 *  - Adds admin account if not present
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPass(plain: string) {
  return bcrypt.hash(plain, 10);
}

async function main() {
  console.log('🌱  Starting VendorBridge seed...\n');

  // ──────────────────────────────────────────────────────────────
  // 0. CLEAN TRANSACTIONAL DATA (preserve users & vendors)
  // ──────────────────────────────────────────────────────────────
  console.log('🧹  Clearing transactional data...');

  // Delete in dependency order (children first)
  await prisma.notification.deleteMany({});
  await prisma.activityLog.deleteMany({});
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

  console.log('✅  Transactional data cleared\n');

  // ──────────────────────────────────────────────────────────────
  // 1. FETCH EXISTING USERS (respect registered accounts)
  // ──────────────────────────────────────────────────────────────

  // Get all existing users for reference
  const existingUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true, firstName: true, lastName: true }
  });
  console.log(`📋  Found ${existingUsers.length} existing user accounts:`);
  existingUsers.forEach(u => console.log(`     • [${u.role}] ${u.email}`));
  console.log('');

  // ──────────────────────────────────────────────────────────────
  // 2. UPSERT KEY USERS (Admin + ensure officer + manager)
  // ──────────────────────────────────────────────────────────────

  // Admin — always upsert
  const adminEmail = 'admin@vendorbridge.com';
  const admin = await prisma.user.upsert({
    where:  { email: adminEmail },
    update: {
      phone:          '+91-9000000001',
      country:        'India',
      additionalInfo: 'Platform super-admin account'
    },
    create: {
      email:          adminEmail,
      password:       await hashPass('Admin@1234'),
      firstName:      'System',
      lastName:       'Administrator',
      phone:          '+91-9000000001',
      role:           'ADMIN',
      country:        'India',
      additionalInfo: 'Platform super-admin account'
    }
  });
  console.log(`✅  Admin: ${admin.email}  →  Admin@1234`);

  // Find the PROCUREMENT_OFFICER (use first one found, or create default)
  let officer = existingUsers.find(u => u.role === 'PROCUREMENT_OFFICER');
  let officerRecord: any;
  if (officer) {
    officerRecord = await prisma.user.update({
      where: { id: officer.id },
      data: {
        phone:          '+91-9000000002',
        country:        'India',
        additionalInfo: 'Senior Procurement Officer — handles IT & Furniture categories'
      }
    });
    console.log(`✅  Procurement Officer (existing): ${officerRecord.email}  — updated phone/country`);
  } else {
    const officerEmail = 'procurement@vendorbridge.com';
    officerRecord = await prisma.user.upsert({
      where:  { email: officerEmail },
      update: {},
      create: {
        email:          officerEmail,
        password:       await hashPass('Officer@1234'),
        firstName:      'Rahul',
        lastName:       'Mehta',
        phone:          '+91-9000000002',
        role:           'PROCUREMENT_OFFICER',
        country:        'India',
        additionalInfo: 'Senior Procurement Officer'
      }
    });
    console.log(`✅  Procurement Officer (created): ${officerRecord.email}  →  Officer@1234`);
  }

  // Find the MANAGER (use first one found, or create default)
  let managerUser = existingUsers.find(u => u.role === 'MANAGER');
  let managerRecord: any;
  if (managerUser) {
    managerRecord = await prisma.user.update({
      where: { id: managerUser.id },
      data: {
        phone:          '+91-9000000003',
        country:        'India',
        additionalInfo: 'Operations Manager — final approver for all PO workflows'
      }
    });
    console.log(`✅  Manager/Approver (existing): ${managerRecord.email}  — updated phone/country`);
  } else {
    const managerEmail = 'manager@vendorbridge.com';
    managerRecord = await prisma.user.upsert({
      where:  { email: managerEmail },
      update: {},
      create: {
        email:          managerEmail,
        password:       await hashPass('Manager@1234'),
        firstName:      'Priya',
        lastName:       'Sharma',
        phone:          '+91-9000000003',
        role:           'MANAGER',
        country:        'India',
        additionalInfo: 'Operations Manager — final approver for all PO workflows'
      }
    });
    console.log(`✅  Manager (created): ${managerRecord.email}  →  Manager@1234`);
  }

  // ──────────────────────────────────────────────────────────────
  // 3. VENDOR USERS + COMPANY PROFILES
  // ──────────────────────────────────────────────────────────────

  // Find existing vendor users
  const existingVendorUsers = existingUsers.filter(u => u.role === 'VENDOR');
  console.log(`\n📦  Found ${existingVendorUsers.length} existing VENDOR user(s)`);

  // Vendor user configs — we'll upsert all 3 (keeps existing ones)
  const vendorUsersData = [
    {
      email:          'vendor1@techsupply.com',
      password:       'Vendor@1234',
      firstName:      'Amit',
      lastName:       'Patel',
      phone:          '+91-9000000011',
      country:        'India',
      additionalInfo: 'TechSupply Solutions — IT Hardware'
    },
    {
      email:          'vendor2@officehub.com',
      password:       'Vendor@1234',
      firstName:      'Sunita',
      lastName:       'Gupta',
      phone:          '+91-9000000012',
      country:        'India',
      additionalInfo: 'OfficeHub Enterprises — Furniture'
    },
    {
      email:          'vendor3@logipro.com',
      password:       'Vendor@1234',
      firstName:      'Ravi',
      lastName:       'Kumar',
      phone:          '+91-9000000013',
      country:        'India',
      additionalInfo: 'LogiPro Shipping — Logistics'
    }
  ];

  const vendorUsers = [];
  for (const vud of vendorUsersData) {
    const existing = existingUsers.find(u => u.email === vud.email);
    let vu: any;
    if (existing) {
      vu = await prisma.user.update({
        where: { id: existing.id },
        data: { phone: vud.phone, country: vud.country, additionalInfo: vud.additionalInfo }
      });
      console.log(`✅  Vendor user (existing): ${vu.email}  — updated`);
    } else {
      vu = await prisma.user.create({
        data: {
          email:          vud.email,
          password:       await hashPass(vud.password),
          firstName:      vud.firstName,
          lastName:       vud.lastName,
          phone:          vud.phone,
          role:           'VENDOR',
          country:        vud.country,
          additionalInfo: vud.additionalInfo
        }
      });
      console.log(`✅  Vendor user (created): ${vu.email}  →  ${vud.password}`);
    }
    vendorUsers.push(vu);
  }

  // Vendor company profiles
  const vendorCompanies = [
    {
      name:      'TechSupply Solutions Pvt. Ltd.',
      category:  'IT',
      gstNo:     'GSTIN27AAPCT1234A1Z5',
      contactNo: '+91-9000000011',
      status:    'ACTIVE' as const,
      rating:    4.7,
      address:   '12, Cyber Hub, Gurugram, Haryana - 122002',
      userId:    vendorUsers[0].id
    },
    {
      name:      'OfficeHub Enterprises',
      category:  'Furniture',
      gstNo:     'GSTIN29AAFCO5678B2Z6',
      contactNo: '+91-9000000012',
      status:    'ACTIVE' as const,
      rating:    4.2,
      address:   '45, Industrial Area, Pune, Maharashtra - 411018',
      userId:    vendorUsers[1].id
    },
    {
      name:      'LogiPro Shipping & Logistics',
      category:  'Logistics',
      gstNo:     'GSTIN33AADCL9101C3Z7',
      contactNo: '+91-9000000013',
      status:    'ACTIVE' as const,
      rating:    3.9,
      address:   '78, Port Trust Road, Chennai, Tamil Nadu - 600001',
      userId:    vendorUsers[2].id
    }
  ];

  // Also capture any pre-existing vendor accounts from the DB and link them
  // (if the user registered a vendor account but it has no Vendor profile, create one)
  const vendors = [];
  for (const vc of vendorCompanies) {
    const existing = await prisma.vendor.findUnique({ where: { gstNo: vc.gstNo } });
    let vendor: any;
    if (existing) {
      vendor = await prisma.vendor.update({
        where: { gstNo: vc.gstNo },
        data: { name: vc.name, category: vc.category, contactNo: vc.contactNo, status: vc.status, rating: vc.rating, address: vc.address, userId: vc.userId }
      });
    } else {
      vendor = await prisma.vendor.create({ data: vc });
    }
    vendors.push(vendor);
    console.log(`✅  Vendor company: ${vendor.name}`);
  }

  // Link any existing VENDOR role users (who registered themselves) to a vendor profile
  // Only if they don't have one yet — we'll use OfficeHub as the default link for any extra vendors
  const unlinkedVendors = await prisma.user.findMany({
    where: { role: 'VENDOR', vendorProfile: null }
  });
  for (const uv of unlinkedVendors) {
    // Skip if they're already in our vendor user list
    if (vendorUsers.some(v => v.id === uv.id)) continue;
    // Create a placeholder vendor profile so they can log in
    const safeName = `${uv.firstName} ${uv.lastName} Enterprises`;
    const safeGST  = `GSTIN00EXTRA${uv.id.slice(0, 8).toUpperCase()}`;
    try {
      const newVendor = await prisma.vendor.create({
        data: {
          name:      safeName,
          category:  'General',
          gstNo:     safeGST,
          contactNo: uv.phone || '+91-9999999999',
          status:    'PENDING',
          rating:    0,
          address:   'Address not set',
          userId:    uv.id
        }
      });
      vendors.push(newVendor);
      console.log(`✅  Linked pre-existing vendor user ${uv.email} → ${newVendor.name}`);
    } catch {
      console.log(`⚠️   Could not create profile for ${uv.email} (may already exist)`);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // 4. RFQs
  // ──────────────────────────────────────────────────────────────
  console.log('\n📄  Creating RFQs...');

  const rfq1 = await prisma.rFQ.create({
    data: {
      title:           'RFQ-2026-IT-001: Laptop & Workstation Procurement',
      category:        'IT',
      deadline:        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      description:     'Procurement of 50 high-performance laptops and 10 workstations for the engineering department. Requires i7/Ryzen 7 processors, 16GB RAM minimum.',
      status:          'OPEN',
      attachments:     [],
      createdByUserId: officerRecord.id
    }
  });

  const rfq2 = await prisma.rFQ.create({
    data: {
      title:           'RFQ-2026-FURN-002: Office Furniture Renovation',
      category:        'Furniture',
      deadline:        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      description:     'Renovation of 3 conference rooms. Ergonomic chairs, standing desks, whiteboards and projector stands. Minimum 5-year warranty.',
      status:          'IN_REVIEW',
      attachments:     [],
      createdByUserId: officerRecord.id
    }
  });

  const rfq3 = await prisma.rFQ.create({
    data: {
      title:           'RFQ-2026-LOG-003: Annual Logistics & Courier Services',
      category:        'Logistics',
      deadline:        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      description:     'Annual contract for pan-India logistics and last-mile delivery. Must cover 25 cities. SLA: 48h delivery. Insurance required.',
      status:          'CLOSED',
      attachments:     [],
      createdByUserId: admin.id
    }
  });

  const rfq4 = await prisma.rFQ.create({
    data: {
      title:           'RFQ-2026-IT-004: Network Infrastructure Upgrade',
      category:        'IT',
      deadline:        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      description:     'Upgrade of internal network infrastructure: routers, 48-port switches, CAT6 cabling and Wi-Fi access points across 3 floors.',
      status:          'OPEN',
      attachments:     [],
      createdByUserId: officerRecord.id
    }
  });

  console.log('✅  4 RFQs created');

  // ──────────────────────────────────────────────────────────────
  // 5. RFQ LINE ITEMS
  // ──────────────────────────────────────────────────────────────

  await prisma.rFQLineItem.createMany({
    data: [
      { rfqId: rfq1.id, item: 'Laptop (i7, 16GB RAM, 512GB SSD)',  qty: 50, unit: 'NOS' },
      { rfqId: rfq1.id, item: 'Workstation (Ryzen 9, 32GB, 1TB)',  qty: 10, unit: 'NOS' },
      { rfqId: rfq1.id, item: 'Laptop Bag (15.6 inch)',             qty: 50, unit: 'NOS' },
      { rfqId: rfq1.id, item: 'Wireless Mouse & Keyboard Set',      qty: 60, unit: 'NOS' },

      { rfqId: rfq2.id, item: 'Ergonomic Office Chair',             qty: 40, unit: 'NOS' },
      { rfqId: rfq2.id, item: 'Height-Adjustable Standing Desk',    qty: 20, unit: 'NOS' },
      { rfqId: rfq2.id, item: 'Conference Room Whiteboard (6x4ft)', qty:  6, unit: 'NOS' },
      { rfqId: rfq2.id, item: 'Projector Stand (Heavy Duty)',        qty:  3, unit: 'NOS' },

      { rfqId: rfq3.id, item: 'Domestic Courier Services (Annual)', qty:    1, unit: 'CONTRACT' },
      { rfqId: rfq3.id, item: 'Last-Mile Delivery (per shipment)',  qty:  500, unit: 'NOS' },
      { rfqId: rfq3.id, item: 'Packaging Material Supply',          qty: 1000, unit: 'NOS' },

      { rfqId: rfq4.id, item: 'Enterprise Router (Cisco ISR 4321)', qty:  2, unit: 'NOS' },
      { rfqId: rfq4.id, item: '48-Port Managed Switch',             qty:  6, unit: 'NOS' },
      { rfqId: rfq4.id, item: 'Wi-Fi Access Point (802.11ax)',       qty: 24, unit: 'NOS' },
      { rfqId: rfq4.id, item: 'CAT6 Cable (305m Box)',              qty: 10, unit: 'BOX' }
    ]
  });
  console.log('✅  RFQ line items created');

  // ──────────────────────────────────────────────────────────────
  // 6. RFQ ASSIGNMENTS
  // ──────────────────────────────────────────────────────────────

  await prisma.rFQAssignment.createMany({
    data: [
      { rfqId: rfq1.id, vendorId: vendors[0].id },
      { rfqId: rfq1.id, vendorId: vendors[1].id },
      { rfqId: rfq2.id, vendorId: vendors[1].id },
      { rfqId: rfq2.id, vendorId: vendors[0].id },
      { rfqId: rfq3.id, vendorId: vendors[2].id },
      { rfqId: rfq4.id, vendorId: vendors[0].id }
    ],
    skipDuplicates: true
  });
  console.log('✅  RFQ assignments done');

  // ──────────────────────────────────────────────────────────────
  // 7. QUOTATIONS
  // ──────────────────────────────────────────────────────────────
  console.log('\n💬  Creating quotations...');

  async function createQuotation(rfqId: string, vendorId: string, opts: {
    subtotal: number;
    gstPercentage: number;
    deliveryDays: number;
    paymentTerms: string;
    status: any;
    lineItems: { item: string; qty: number; unit: string; unitPrice: number }[];
  }) {
    const gstAmount  = opts.subtotal * (opts.gstPercentage / 100);
    const grandTotal = opts.subtotal + gstAmount;

    return prisma.$transaction(async tx => {
      const q = await tx.quotation.create({
        data: {
          rfqId,
          vendorId,
          subtotal:      opts.subtotal,
          gstPercentage: opts.gstPercentage,
          gstAmount,
          grandTotal,
          deliveryDays:  opts.deliveryDays,
          paymentTerms:  opts.paymentTerms,
          status:        opts.status
        }
      });

      await tx.quotationLineItem.createMany({
        data: opts.lineItems.map(li => ({
          quotationId: q.id,
          item:        li.item,
          qty:         li.qty,
          unit:        li.unit,
          unitPrice:   li.unitPrice,
          totalVal:    li.unitPrice * li.qty
        }))
      });

      return q;
    });
  }

  // RFQ1 — TechSupply (SELECTED) vs OfficeHub (REJECTED)
  const q1v1 = await createQuotation(rfq1.id, vendors[0].id, {
    subtotal:      4200000,
    gstPercentage: 18,
    deliveryDays:  21,
    paymentTerms:  'Net 30 days',
    status:        'SELECTED',
    lineItems: [
      { item: 'Laptop (i7, 16GB RAM, 512GB SSD)',  qty: 50, unit: 'NOS', unitPrice: 72000  },
      { item: 'Workstation (Ryzen 9, 32GB, 1TB)',  qty: 10, unit: 'NOS', unitPrice: 125000 },
      { item: 'Laptop Bag (15.6 inch)',             qty: 50, unit: 'NOS', unitPrice: 800    },
      { item: 'Wireless Mouse & Keyboard Set',      qty: 60, unit: 'NOS', unitPrice: 1500   }
    ]
  });

  const q1v2 = await createQuotation(rfq1.id, vendors[1].id, {
    subtotal:      4450000,
    gstPercentage: 18,
    deliveryDays:  28,
    paymentTerms:  'Net 45 days',
    status:        'REJECTED',
    lineItems: [
      { item: 'Laptop (i7, 16GB RAM, 512GB SSD)',  qty: 50, unit: 'NOS', unitPrice: 75000  },
      { item: 'Workstation (Ryzen 9, 32GB, 1TB)',  qty: 10, unit: 'NOS', unitPrice: 130000 },
      { item: 'Laptop Bag (15.6 inch)',             qty: 50, unit: 'NOS', unitPrice: 900    },
      { item: 'Wireless Mouse & Keyboard Set',      qty: 60, unit: 'NOS', unitPrice: 1200   }
    ]
  });

  // RFQ2 — Both submitted, pending L2 approval
  const q2v2 = await createQuotation(rfq2.id, vendors[1].id, {
    subtotal:      650000,
    gstPercentage: 18,
    deliveryDays:  14,
    paymentTerms:  'Net 20 days',
    status:        'SUBMITTED',
    lineItems: [
      { item: 'Ergonomic Office Chair',             qty: 40, unit: 'NOS', unitPrice: 8500  },
      { item: 'Height-Adjustable Standing Desk',    qty: 20, unit: 'NOS', unitPrice: 15000 },
      { item: 'Conference Room Whiteboard (6x4ft)', qty:  6, unit: 'NOS', unitPrice: 4500  },
      { item: 'Projector Stand (Heavy Duty)',        qty:  3, unit: 'NOS', unitPrice: 3500  }
    ]
  });

  const q2v1 = await createQuotation(rfq2.id, vendors[0].id, {
    subtotal:      680000,
    gstPercentage: 18,
    deliveryDays:  10,
    paymentTerms:  'Net 30 days',
    status:        'SUBMITTED',
    lineItems: [
      { item: 'Ergonomic Office Chair',             qty: 40, unit: 'NOS', unitPrice: 9000  },
      { item: 'Height-Adjustable Standing Desk',    qty: 20, unit: 'NOS', unitPrice: 15500 },
      { item: 'Conference Room Whiteboard (6x4ft)', qty:  6, unit: 'NOS', unitPrice: 4000  },
      { item: 'Projector Stand (Heavy Duty)',        qty:  3, unit: 'NOS', unitPrice: 3000  }
    ]
  });

  // RFQ3 — LogiPro selected (closed RFQ)
  const q3v3 = await createQuotation(rfq3.id, vendors[2].id, {
    subtotal:      1250000,
    gstPercentage: 18,
    deliveryDays:  30,
    paymentTerms:  'Net 60 days',
    status:        'SELECTED',
    lineItems: [
      { item: 'Domestic Courier Services (Annual)', qty:    1, unit: 'CONTRACT', unitPrice: 500000 },
      { item: 'Last-Mile Delivery (per shipment)',  qty:  500, unit: 'NOS',      unitPrice: 1200   },
      { item: 'Packaging Material Supply',          qty: 1000, unit: 'NOS',      unitPrice: 150    }
    ]
  });

  // RFQ4 — TechSupply draft (still composing)
  const q4v1 = await createQuotation(rfq4.id, vendors[0].id, {
    subtotal:      875000,
    gstPercentage: 18,
    deliveryDays:  30,
    paymentTerms:  'Net 30 days',
    status:        'DRAFT',
    lineItems: [
      { item: 'Enterprise Router (Cisco ISR 4321)', qty:  2, unit: 'NOS', unitPrice: 85000 },
      { item: '48-Port Managed Switch',             qty:  6, unit: 'NOS', unitPrice: 45000 },
      { item: 'Wi-Fi Access Point (802.11ax)',       qty: 24, unit: 'NOS', unitPrice: 8000  },
      { item: 'CAT6 Cable (305m Box)',              qty: 10, unit: 'BOX', unitPrice: 4500  }
    ]
  });

  console.log('✅  6 quotations created');

  // ──────────────────────────────────────────────────────────────
  // 8. APPROVALS
  // ──────────────────────────────────────────────────────────────
  console.log('\n📋  Creating approval workflows...');

  // RFQ1: Fully APPROVED
  const approval1 = await prisma.$transaction(async tx => {
    const a = await tx.approval.create({
      data: {
        rfqId:       rfq1.id,
        quotationId: q1v1.id,
        currentStep: 'Completed',
        status:      'APPROVED'
      }
    });
    await tx.approvalChain.create({
      data: {
        approvalId:  a.id,
        userId:      officerRecord.id,
        role:        'PROCUREMENT_OFFICER',
        status:      'APPROVED',
        stepNumber:  1,
        actionDate:  new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        remarks:     'Pricing competitive. Vendor track record is excellent.'
      }
    });
    await tx.approvalChain.create({
      data: {
        approvalId:  a.id,
        userId:      managerRecord.id,
        role:        'MANAGER',
        status:      'APPROVED',
        stepNumber:  2,
        actionDate:  new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        remarks:     'Budget within limit. Approved for PO generation.'
      }
    });
    return a;
  });
  console.log('✅  Approval 1 (RFQ1 — APPROVED)');

  // RFQ2: PENDING at L2 (manager needs to act)
  const approval2 = await prisma.$transaction(async tx => {
    const a = await tx.approval.create({
      data: {
        rfqId:       rfq2.id,
        quotationId: q2v2.id,
        currentStep: 'L2_Approval',
        status:      'PENDING'
      }
    });
    await tx.approvalChain.create({
      data: {
        approvalId:  a.id,
        userId:      officerRecord.id,
        role:        'PROCUREMENT_OFFICER',
        status:      'APPROVED',
        stepNumber:  1,
        actionDate:  new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        remarks:     'Prices within budget. Quality specs met.'
      }
    });
    await tx.approvalChain.create({
      data: {
        approvalId:  a.id,
        userId:      managerRecord.id,
        role:        'MANAGER',
        status:      'PENDING',
        stepNumber:  2
      }
    });
    return a;
  });
  console.log('✅  Approval 2 (RFQ2 — PENDING L2, manager must act)');

  // RFQ3: Fully APPROVED (closed RFQ)
  const approval3 = await prisma.$transaction(async tx => {
    const a = await tx.approval.create({
      data: {
        rfqId:       rfq3.id,
        quotationId: q3v3.id,
        currentStep: 'Completed',
        status:      'APPROVED'
      }
    });
    await tx.approvalChain.create({
      data: {
        approvalId:  a.id,
        userId:      officerRecord.id,
        role:        'PROCUREMENT_OFFICER',
        status:      'APPROVED',
        stepNumber:  1,
        actionDate:  new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        remarks:     'Logistics vendor pre-evaluated. Good SLA history.'
      }
    });
    await tx.approvalChain.create({
      data: {
        approvalId:  a.id,
        userId:      managerRecord.id,
        role:        'MANAGER',
        status:      'APPROVED',
        stepNumber:  2,
        actionDate:  new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        remarks:     'Annual contract approved by management.'
      }
    });
    return a;
  });
  console.log('✅  Approval 3 (RFQ3 — APPROVED)');

  // ──────────────────────────────────────────────────────────────
  // 9. PURCHASE ORDERS
  // ──────────────────────────────────────────────────────────────
  console.log('\n🛒  Creating purchase orders...');

  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber:        'PO-2026-0001',
      rfqId:           rfq1.id,
      quotationId:     q1v1.id,
      vendorId:        vendors[0].id,
      status:          'ACKNOWLEDGED',
      createdByUserId: officerRecord.id,
      poDate:          new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      poNumber:        'PO-2026-0002',
      rfqId:           rfq3.id,
      quotationId:     q3v3.id,
      vendorId:        vendors[2].id,
      status:          'SENT',
      createdByUserId: admin.id,
      poDate:          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('✅  2 purchase orders created');

  // ──────────────────────────────────────────────────────────────
  // 10. INVOICES
  // ──────────────────────────────────────────────────────────────
  console.log('\n🧾  Creating invoices...');

  // Invoice for PO1 — PAID
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber:   'INV-2026-0001',
      purchaseOrderId: po1.id,
      invoiceDate:     new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate:         new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      subtotal:        4200000,
      cgst:            378000,
      sgst:            378000,
      grandTotal:      4956000,
      status:          'PAID'
    }
  });
  await prisma.invoiceLineItem.createMany({
    data: [
      { invoiceId: inv1.id, item: 'Laptop (i7, 16GB RAM, 512GB SSD)',  qty: 50, unit: 'NOS', unitPrice: 72000,  totalVal: 3600000 },
      { invoiceId: inv1.id, item: 'Workstation (Ryzen 9, 32GB, 1TB)',  qty: 10, unit: 'NOS', unitPrice: 125000, totalVal: 1250000 },
      { invoiceId: inv1.id, item: 'Laptop Bag (15.6 inch)',             qty: 50, unit: 'NOS', unitPrice: 800,    totalVal: 40000   },
      { invoiceId: inv1.id, item: 'Wireless Mouse & Keyboard Set',      qty: 60, unit: 'NOS', unitPrice: 1500,   totalVal: 90000   }
    ]
  });
  console.log('✅  Invoice INV-2026-0001 (PAID) - ₹49.56 Lakhs');

  // Invoice for PO2 — PENDING_PAYMENT
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber:   'INV-2026-0002',
      purchaseOrderId: po2.id,
      invoiceDate:     new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      dueDate:         new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal:        1250000,
      cgst:            112500,
      sgst:            112500,
      grandTotal:      1475000,
      status:          'PENDING_PAYMENT'
    }
  });
  await prisma.invoiceLineItem.createMany({
    data: [
      { invoiceId: inv2.id, item: 'Domestic Courier Services (Annual)', qty:    1, unit: 'CONTRACT', unitPrice: 500000, totalVal: 500000 },
      { invoiceId: inv2.id, item: 'Last-Mile Delivery (per shipment)',  qty:  500, unit: 'NOS',      unitPrice: 1200,   totalVal: 600000 },
      { invoiceId: inv2.id, item: 'Packaging Material Supply',          qty: 1000, unit: 'NOS',      unitPrice: 150,    totalVal: 150000 }
    ]
  });
  console.log('✅  Invoice INV-2026-0002 (PENDING_PAYMENT) - ₹14.75 Lakhs');

  // ──────────────────────────────────────────────────────────────
  // 11. ACTIVITY LOGS
  // ──────────────────────────────────────────────────────────────

  await prisma.activityLog.createMany({
    data: [
      { type: 'RFQ',      userId: officerRecord.id, description: `RFQ "${rfq1.title}" created and published` },
      { type: 'RFQ',      userId: officerRecord.id, description: `RFQ "${rfq2.title}" created and published` },
      { type: 'RFQ',      userId: admin.id,         description: `RFQ "${rfq3.title}" created by admin` },
      { type: 'RFQ',      userId: officerRecord.id, description: `RFQ "${rfq4.title}" created and open for bids` },
      { type: 'APPROVAL', userId: officerRecord.id, description: `Approval workflow initiated for RFQ "${rfq1.title}"` },
      { type: 'APPROVAL', userId: officerRecord.id, description: `L1 review approved for RFQ "${rfq1.title}"` },
      { type: 'APPROVAL', userId: managerRecord.id, description: `L2 approval granted — PO auto-generated for RFQ "${rfq1.title}"` },
      { type: 'APPROVAL', userId: officerRecord.id, description: `Approval workflow initiated for RFQ "${rfq2.title}"` },
      { type: 'APPROVAL', userId: officerRecord.id, description: `L1 review approved for RFQ "${rfq2.title}" — pending L2 manager` },
      { type: 'INVOICE',  userId: null,             description: 'Invoice INV-2026-0001 generated against PO-2026-0001' },
      { type: 'INVOICE',  userId: null,             description: 'Invoice INV-2026-0001 status updated to PAID' },
      { type: 'INVOICE',  userId: null,             description: 'Invoice INV-2026-0002 generated against PO-2026-0002' },
      { type: 'VENDOR',   userId: admin.id,         description: 'Vendor "TechSupply Solutions Pvt. Ltd." activated' },
      { type: 'VENDOR',   userId: admin.id,         description: 'Vendor "OfficeHub Enterprises" activated' },
      { type: 'VENDOR',   userId: admin.id,         description: 'Vendor "LogiPro Shipping & Logistics" activated' },
      { type: 'SYSTEM',   userId: null,             description: 'Database seeded with demo data for testing' }
    ]
  });
  console.log('✅  Activity logs created');

  // ──────────────────────────────────────────────────────────────
  // 12. NOTIFICATIONS
  // ──────────────────────────────────────────────────────────────

  await prisma.notification.createMany({
    data: [
      {
        userId:  vendorUsers[0].id,
        type:    'RFQ',
        title:   'New RFQ Assignment',
        message: `You have been assigned to "${rfq1.title}". Please submit your quotation before the deadline.`,
        isRead:  true
      },
      {
        userId:  vendorUsers[1].id,
        type:    'RFQ',
        title:   'New RFQ Assignment',
        message: `You have been assigned to "${rfq2.title}". Please submit your quotation before the deadline.`,
        isRead:  false
      },
      {
        userId:  managerRecord.id,
        type:    'APPROVAL',
        title:   'Approval Action Required',
        message: `An approval workflow is awaiting your decision for RFQ "${rfq2.title}".`,
        isRead:  false
      },
      {
        userId:  officerRecord.id,
        type:    'RFQ',
        title:   'New Quotation Submitted',
        message: `"OfficeHub Enterprises" submitted a quotation for RFQ "${rfq2.title}".`,
        isRead:  false
      },
      {
        userId:  vendorUsers[0].id,
        type:    'APPROVAL',
        title:   'Quotation Selected & Approved',
        message: `Your quotation for "${rfq1.title}" has been selected and fully approved. A Purchase Order PO-2026-0001 has been issued.`,
        isRead:  true
      },
      {
        userId:  vendorUsers[2].id,
        type:    'APPROVAL',
        title:   'Quotation Selected',
        message: `Your quotation for "${rfq3.title}" has been selected. PO-2026-0002 has been issued.`,
        isRead:  false
      },
      {
        userId:  vendorUsers[0].id,
        type:    'INVOICE',
        title:   'Invoice Generated',
        message: 'Invoice INV-2026-0001 has been generated against PO-2026-0001. Total: ₹49,56,000.',
        isRead:  false
      },
      {
        userId:  admin.id,
        type:    'SYSTEM',
        title:   'System Initialized',
        message: 'VendorBridge ERP database has been seeded with demo data for testing.',
        isRead:  false
      }
    ]
  });
  console.log('✅  Notifications created');

  // ──────────────────────────────────────────────────────────────
  // FINAL SUMMARY
  // ──────────────────────────────────────────────────────────────

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉  VendorBridge Seed COMPLETE!\n');
  console.log('  ┌─────────────────────────────────────────────────────────────────┐');
  console.log('  │  ADMIN LOGIN                                                    │');
  console.log('  │  Email    : admin@vendorbridge.com                              │');
  console.log('  │  Password : Admin@1234                                          │');
  console.log('  ├─────────────────────────────────────────────────────────────────┤');
  console.log('  │  PROCUREMENT OFFICER  (existing account — data updated)         │');
  console.log(`  │  Email    : ${officerRecord.email.padEnd(50)}│`);
  console.log('  │  Password : (unchanged — use your original password)            │');
  console.log('  │             Fallback new: Officer@1234                          │');
  console.log('  ├─────────────────────────────────────────────────────────────────┤');
  console.log('  │  MANAGER / APPROVER   (existing account — data updated)         │');
  console.log(`  │  Email    : ${managerRecord.email.padEnd(50)}│`);
  console.log('  │  Password : (unchanged — use your original password)            │');
  console.log('  │             Fallback new: Manager@1234                          │');
  console.log('  ├─────────────────────────────────────────────────────────────────┤');
  console.log('  │  VENDOR 1: vendor1@techsupply.com   / Vendor@1234               │');
  console.log('  │  VENDOR 2: vendor2@officehub.com    / Vendor@1234               │');
  console.log('  │  VENDOR 3: vendor3@logipro.com      / Vendor@1234               │');
  console.log('  ├─────────────────────────────────────────────────────────────────┤');
  console.log('  │  DATA CREATED                                                   │');
  console.log('  │  ✓ 4 RFQs  (OPEN ×2, IN_REVIEW ×1, CLOSED ×1)                  │');
  console.log('  │  ✓ 6 Quotations (SELECTED, REJECTED, SUBMITTED ×2, DRAFT)       │');
  console.log('  │  ✓ 3 Approval workflows (APPROVED ×2, PENDING ×1)               │');
  console.log('  │  ✓ 2 Purchase Orders (ACKNOWLEDGED, SENT)                       │');
  console.log('  │  ✓ 2 Invoices (PAID ₹49.56L, PENDING_PAYMENT ₹14.75L)          │');
  console.log('  │  ✓ 3 Active Vendor companies                                    │');
  console.log('  └─────────────────────────────────────────────────────────────────┘\n');
}

main()
  .catch(e => {
    console.error('\n❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
