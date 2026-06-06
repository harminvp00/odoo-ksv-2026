import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const reportController = {
  getInsights: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Procurement Statistics
      const totalRFQs = await prisma.rFQ.count();
      const openRFQs = await prisma.rFQ.count({ where: { status: 'OPEN' } });
      const closedRFQs = await prisma.rFQ.count({ where: { status: 'CLOSED' } });
      const totalPOs = await prisma.purchaseOrder.count();
      const totalInvoices = await prisma.invoice.count();

      // 2. Spending Summaries
      const selectedQuotationsAgg = await prisma.quotation.aggregate({
        where: { status: 'SELECTED' },
        _sum: { grandTotal: true }
      });
      const totalCommittedSpend = Number(selectedQuotationsAgg._sum.grandTotal || 0);

      const paidInvoicesAgg = await prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { grandTotal: true }
      });
      const totalPaidSpend = Number(paidInvoicesAgg._sum.grandTotal || 0);

      const pendingInvoicesAgg = await prisma.invoice.aggregate({
        where: { status: 'PENDING_PAYMENT' },
        _sum: { grandTotal: true }
      });
      const totalPendingSpend = Number(pendingInvoicesAgg._sum.grandTotal || 0);

      // 3. Monthly Procurement Trends (Current Year)
      const currentYear = new Date().getFullYear();
      const pos = await prisma.purchaseOrder.findMany({
        where: {
          createdAt: {
            gte: new Date(`${currentYear}-01-01`),
            lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
          }
        },
        include: {
          quotation: true
        }
      });

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyTrends = months.map((m, index) => {
        const monthPOs = pos.filter(po => new Date(po.createdAt).getMonth() === index);
        const spend = monthPOs.reduce((sum, po) => sum + Number(po.quotation.grandTotal), 0);
        return {
          month: m,
          poCount: monthPOs.length,
          totalSpend: spend
        };
      });

      // 4. Vendor Performance Analytics
      const vendors = await prisma.vendor.findMany({
        include: {
          quotations: true,
          purchaseOrders: {
            include: {
              invoices: true
            }
          }
        }
      });

      const vendorPerformance = vendors.map(vendor => {
        const totalSubmitted = vendor.quotations.length;
        const totalSelected = vendor.quotations.filter(q => q.status === 'SELECTED').length;
        const conversionRate = totalSubmitted > 0 ? (totalSelected / totalSubmitted) * 100 : 0;

        let totalPaidVolume = 0;
        vendor.purchaseOrders.forEach(po => {
          po.invoices.forEach(inv => {
            if (inv.status === 'PAID') {
              totalPaidVolume += Number(inv.grandTotal);
            }
          });
        });

        return {
          vendorId: vendor.id,
          vendorName: vendor.name,
          rating: vendor.rating,
          category: vendor.category,
          submittedQuotes: totalSubmitted,
          selectedQuotes: totalSelected,
          conversionRate: Math.round(conversionRate * 10) / 10,
          totalPaidVolume
        };
      });

      res.json({
        statistics: {
          totalRFQs,
          openRFQs,
          closedRFQs,
          totalPOs,
          totalInvoices
        },
        spendingSummary: {
          committedSpend: totalCommittedSpend,
          paidSpend: totalPaidSpend,
          pendingSpend: totalPendingSpend
        },
        monthlyTrends,
        vendorPerformance
      });
    } catch (err) {
      next(err);
    }
  },

  exportReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type = 'vendor-performance', format = 'csv' } = req.query;

      if (type !== 'vendor-performance' && type !== 'spending-summary' && type !== 'monthly-trends') {
        return res.status(400).json({ message: 'Invalid report type' });
      }

      if (format !== 'csv' && format !== 'json') {
        return res.status(400).json({ message: 'Invalid format. Supported: csv, json' });
      }

      let data: any[] = [];
      let csvHeader = '';
      let csvRows = '';

      if (type === 'vendor-performance') {
        const vendors = await prisma.vendor.findMany({
          include: {
            quotations: true,
            purchaseOrders: {
              include: { invoices: true }
            }
          }
        });

        data = vendors.map(v => {
          const totalSubmitted = v.quotations.length;
          const totalSelected = v.quotations.filter(q => q.status === 'SELECTED').length;
          const conversionRate = totalSubmitted > 0 ? (totalSelected / totalSubmitted) * 100 : 0;
          let totalPaidVolume = 0;
          v.purchaseOrders.forEach(po => {
            po.invoices.forEach(inv => {
              if (inv.status === 'PAID') totalPaidVolume += Number(inv.grandTotal);
            });
          });

          return {
            vendorId: v.id,
            vendorName: v.name,
            rating: v.rating,
            category: v.category,
            submittedQuotes: totalSubmitted,
            selectedQuotes: totalSelected,
            conversionRate: Math.round(conversionRate * 10) / 10,
            totalPaidVolume
          };
        });

        csvHeader = 'Vendor ID,Vendor Name,Rating,Category,Submitted Quotations,Selected Quotations,Conversion Rate (%),Total Paid (INR)\n';
        csvRows = data.map(item => 
          `"${item.vendorId}","${item.vendorName.replace(/"/g, '""')}",${item.rating},"${item.category}",${item.submittedQuotes},${item.selectedQuotes},${item.conversionRate},${item.totalPaidVolume}`
        ).join('\n');

      } else if (type === 'spending-summary') {
        const selectedQuotationsAgg = await prisma.quotation.aggregate({
          where: { status: 'SELECTED' },
          _sum: { grandTotal: true }
        });
        const paidInvoicesAgg = await prisma.invoice.aggregate({
          where: { status: 'PAID' },
          _sum: { grandTotal: true }
        });
        const pendingInvoicesAgg = await prisma.invoice.aggregate({
          where: { status: 'PENDING_PAYMENT' },
          _sum: { grandTotal: true }
        });

        data = [{
          committedSpend: Number(selectedQuotationsAgg._sum.grandTotal || 0),
          paidSpend: Number(paidInvoicesAgg._sum.grandTotal || 0),
          pendingSpend: Number(pendingInvoicesAgg._sum.grandTotal || 0)
        }];

        csvHeader = 'Committed Spend (INR),Paid Spend (INR),Pending Spend (INR)\n';
        csvRows = `"${data[0].committedSpend}","${data[0].paidSpend}","${data[0].pendingSpend}"`;

      } else if (type === 'monthly-trends') {
        const currentYear = new Date().getFullYear();
        const pos = await prisma.purchaseOrder.findMany({
          where: {
            createdAt: {
              gte: new Date(`${currentYear}-01-01`),
              lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
            }
          },
          include: { quotation: true }
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        data = months.map((m, index) => {
          const monthPOs = pos.filter(po => new Date(po.createdAt).getMonth() === index);
          const spend = monthPOs.reduce((sum, po) => sum + Number(po.quotation.grandTotal), 0);
          return {
            month: m,
            poCount: monthPOs.length,
            totalSpend: spend
          };
        });

        csvHeader = 'Month,Purchase Orders Count,Total Spend (INR)\n';
        csvRows = data.map(item => `"${item.month}",${item.poCount},${item.totalSpend}`).join('\n');
      }

      if (format === 'json') {
        return res.json(data);
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
      res.send(csvHeader + csvRows);
    } catch (err) {
      next(err);
    }
  }
};
