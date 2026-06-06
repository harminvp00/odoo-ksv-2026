import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const dashboardController = {
  getDashboardData: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const role = (req as any).user?.role;

      if (!userId || !role) {
        return res.status(401).json({ message: 'User session not authenticated' });
      }

      if (role === 'VENDOR') {
        // Find associated vendor profile
        const vendor = await prisma.vendor.findUnique({
          where: { userId }
        });

        if (!vendor) {
          return res.status(404).json({ message: 'Vendor profile not found for authenticated user' });
        }

        // 1. Active RFQs assigned to the vendor
        const activeRFQs = await prisma.rFQ.findMany({
          where: {
            assignments: { some: { vendorId: vendor.id } },
            status: 'OPEN'
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        });

        // 2. Recent POs received
        const recentPOs = await prisma.purchaseOrder.findMany({
          where: { vendorId: vendor.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            rfq: { select: { title: true } }
          }
        });

        // 3. Recent Invoices submitted
        const recentInvoices = await prisma.invoice.findMany({
          where: { purchaseOrder: { vendorId: vendor.id } },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            purchaseOrder: { select: { poNumber: true } }
          }
        });

        // 4. Counts & Analytics calculations
        const [rfqsCount, quotationsCount, posCount, posListForRevenue] = await Promise.all([
          prisma.rFQAssignment.count({ where: { vendorId: vendor.id } }),
          prisma.quotation.count({ where: { vendorId: vendor.id, status: { not: 'DRAFT' } } }),
          prisma.purchaseOrder.count({ where: { vendorId: vendor.id } }),
          prisma.purchaseOrder.findMany({
            where: { vendorId: vendor.id, status: { in: ['SENT', 'ACKNOWLEDGED', 'CLOSED'] } },
            select: { quotation: { select: { grandTotal: true } } }
          })
        ]);

        const totalRevenue = posListForRevenue.reduce((sum, po) => sum + Number(po.quotation.grandTotal), 0);

        const analytics = [
          { title: 'Assigned RFQs', value: rfqsCount, description: 'Total RFQs assigned to you' },
          { title: 'Quotations Submitted', value: quotationsCount, description: 'Active and submitted quotes' },
          { title: 'POs Received', value: posCount, description: 'Purchase Orders received' },
          { title: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, description: 'Revenue from completed/sent POs' }
        ];

        const quickActions = [
          { label: 'View RFQs', action: 'view_rfqs', primary: true },
          { label: 'Submit Quotation', action: 'submit_quotation', primary: false }
        ];

        return res.json({
          role,
          activeRFQs,
          recentPOs,
          recentInvoices,
          analytics,
          quickActions
        });

      } else {
        // Staff view (ADMIN, PROCUREMENT_OFFICER, MANAGER)
        
        // 1. Pending Approvals
        let pendingApprovals: any[] = [];
        if (role === 'MANAGER') {
          // Managers see approvals assigned to their chain step that are pending
          const pendingChains = await prisma.approvalChain.findMany({
            where: {
              userId,
              status: 'PENDING'
            },
            include: {
              approval: {
                include: {
                  rfq: { select: { title: true } },
                  quotation: {
                    include: { vendor: { select: { name: true } } }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          });
          pendingApprovals = pendingChains.map(chain => chain.approval);
        } else {
          // Admins & Procurement Officers see all pending approvals
          pendingApprovals = await prisma.approval.findMany({
            where: { status: 'PENDING' },
            include: {
              rfq: { select: { title: true } },
              quotation: {
                include: { vendor: { select: { name: true } } }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          });
        }

        // 2. Active RFQs (OPEN or IN_REVIEW)
        const activeRFQs = await prisma.rFQ.findMany({
          where: { status: { in: ['OPEN', 'IN_REVIEW'] } },
          orderBy: { createdAt: 'desc' },
          take: 5
        });

        // 3. Recent POs
        const recentPOs = await prisma.purchaseOrder.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            vendor: { select: { name: true } },
            rfq: { select: { title: true } }
          }
        });

        // 4. Recent Invoices
        const recentInvoices = await prisma.invoice.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            purchaseOrder: {
              include: { vendor: { select: { name: true } } }
            }
          }
        });

        // 5. Counts & Analytics calculations
        const [activeRFQsCount, pendingApprovalsCount, posCount, posSpend] = await Promise.all([
          prisma.rFQ.count({ where: { status: { in: ['OPEN', 'IN_REVIEW'] } } }),
          prisma.approval.count({ where: { status: 'PENDING' } }),
          prisma.purchaseOrder.count(),
          prisma.purchaseOrder.findMany({
            select: { quotation: { select: { grandTotal: true } } }
          })
        ]);

        const totalSpend = posSpend.reduce((sum, po) => sum + Number(po.quotation.grandTotal), 0);

        const analytics = [
          { title: 'Active RFQs', value: activeRFQsCount, description: 'RFQs open or in review' },
          { title: 'Pending Approvals', value: pendingApprovalsCount, description: 'Approvals awaiting decision' },
          { title: 'POs Issued', value: posCount, description: 'Total purchase orders generated' },
          { title: 'Total Spend', value: `$${totalSpend.toFixed(2)}`, description: 'Total value of all POs' }
        ];

        let quickActions = [];
        if (role === 'MANAGER') {
          quickActions = [
            { label: 'Review Approvals', action: 'review_approvals', primary: true },
            { label: 'View Reports', action: 'view_reports', primary: false }
          ];
        } else {
          quickActions = [
            { label: 'Create RFQ', action: 'create_rfq', primary: true },
            { label: 'Review Approvals', action: 'review_approvals', primary: false },
            { label: 'Manage Vendors', action: 'manage_vendors', primary: false }
          ];
        }

        return res.json({
          role,
          pendingApprovals,
          activeRFQs,
          recentPOs,
          recentInvoices,
          analytics,
          quickActions
        });
      }
    } catch (err) {
      next(err);
    }
  }
};
