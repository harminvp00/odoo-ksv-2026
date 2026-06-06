import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { activityService } from '../services/activity.service';

export const quotationController = {
  submitQuotation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rfqId, deliveryDays, paymentTerms, status = 'DRAFT', lineItems } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User session not authenticated' });
      }

      // 1. Find the associated Vendor profile
      const vendor = await prisma.vendor.findUnique({
        where: { userId }
      });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor profile not found for authenticated user' });
      }

      // 2. Verify vendor is assigned to the RFQ
      const assignment = await prisma.rFQAssignment.findUnique({
        where: {
          rfqId_vendorId: { rfqId, vendorId: vendor.id }
        }
      });
      if (!assignment) {
        return res.status(430).json({ message: 'Forbidden: You are not assigned to respond to this RFQ' });
      }

      // 3. Verify vendor hasn't already created a quotation for this RFQ
      const existingQuotation = await prisma.quotation.findFirst({
        where: {
          rfqId,
          vendorId: vendor.id
        }
      });
      if (existingQuotation) {
        return res.status(400).json({ message: 'A quotation has already been created for this RFQ. Please edit the existing quotation.' });
      }

      // 4. Calculate prices
      const subtotal = lineItems.reduce((sum: number, li: any) => sum + (Number(li.unitPrice) * Number(li.qty)), 0);
      const gstPercentage = 18.0;
      const gstAmount = subtotal * (gstPercentage / 100);
      const grandTotal = subtotal + gstAmount;

      // 5. Create quotation inside transaction
      const quotation = await prisma.$transaction(async (tx) => {
        const createdQuotation = await tx.quotation.create({
          data: {
            rfqId,
            vendorId: vendor.id,
            subtotal,
            gstPercentage,
            gstAmount,
            grandTotal,
            deliveryDays,
            paymentTerms,
            status
          }
        });

        // Insert Line Items
        await tx.quotationLineItem.createMany({
          data: lineItems.map((li: any) => ({
            quotationId: createdQuotation.id,
            item: li.item,
            qty: li.qty,
            unit: li.unit,
            unitPrice: li.unitPrice,
            totalVal: Number(li.unitPrice) * Number(li.qty)
          }))
        });

        return tx.quotation.findUnique({
          where: { id: createdQuotation.id },
          include: { lineItems: true }
        });
      });

      if (quotation && status === 'SUBMITTED') {
        const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
        if (rfq) {
          // Log Activity
          await activityService.logActivity(
            userId,
            'RFQ',
            `Quotation submitted for RFQ "${rfq.title}"`,
            { quotationId: quotation.id, rfqId }
          );

          // Notify RFQ Creator (Procurement Officer)
          await activityService.createNotification(
            rfq.createdByUserId,
            'RFQ',
            'New Quotation Submitted',
            `Vendor "${vendor.name}" has submitted a quotation for RFQ "${rfq.title}".`,
            true
          );
        }
      }

      res.status(201).json(quotation);
    } catch (err) {
      next(err);
    }
  },

  updateQuotation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { deliveryDays, paymentTerms, status, lineItems } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User session not authenticated' });
      }

      // 1. Get vendor profile
      const vendor = await prisma.vendor.findUnique({
        where: { userId }
      });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor profile not found' });
      }

      // 2. Fetch the quotation and verify ownership
      const existingQuotation = await prisma.quotation.findUnique({
        where: { id },
        include: { lineItems: true }
      });
      if (!existingQuotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      if (existingQuotation.vendorId !== vendor.id) {
        return res.status(430).json({ message: 'Forbidden: You do not own this quotation' });
      }

      // 3. Ensure it is in DRAFT status
      if (existingQuotation.status !== 'DRAFT') {
        return res.status(400).json({ message: 'Cannot edit a quotation that has already been submitted' });
      }

      // 4. Update and calculate new values inside transaction
      const updatedQuotation = await prisma.$transaction(async (tx) => {
        let subtotal = Number(existingQuotation.subtotal);
        let gstPercentage = Number(existingQuotation.gstPercentage);
        let gstAmount = Number(existingQuotation.gstAmount);
        let grandTotal = Number(existingQuotation.grandTotal);

        if (lineItems && lineItems.length > 0) {
          // Delete old line items
          await tx.quotationLineItem.deleteMany({
            where: { quotationId: id }
          });

          // Insert new line items
          await tx.quotationLineItem.createMany({
            data: lineItems.map((li: any) => ({
              quotationId: id,
              item: li.item,
              qty: li.qty,
              unit: li.unit,
              unitPrice: li.unitPrice,
              totalVal: Number(li.unitPrice) * Number(li.qty)
            }))
          });

          // Calculate new totals
          subtotal = lineItems.reduce((sum: number, li: any) => sum + (Number(li.unitPrice) * Number(li.qty)), 0);
          gstAmount = subtotal * (gstPercentage / 100);
          grandTotal = subtotal + gstAmount;
        }

        return tx.quotation.update({
          where: { id },
          data: {
            deliveryDays: deliveryDays !== undefined ? deliveryDays : existingQuotation.deliveryDays,
            paymentTerms: paymentTerms !== undefined ? paymentTerms : existingQuotation.paymentTerms,
            status: status !== undefined ? status : existingQuotation.status,
            subtotal,
            gstAmount,
            grandTotal
          },
          include: { lineItems: true }
        });
      });

      res.json(updatedQuotation);
    } catch (err) {
      next(err);
    }
  },

  submitDraftQuotation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User session not authenticated' });
      }

      // 1. Get vendor profile
      const vendor = await prisma.vendor.findUnique({
        where: { userId }
      });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor profile not found' });
      }

      // 2. Fetch quotation and verify ownership
      const existingQuotation = await prisma.quotation.findUnique({
        where: { id }
      });
      if (!existingQuotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      if (existingQuotation.vendorId !== vendor.id) {
        return res.status(430).json({ message: 'Forbidden: You do not own this quotation' });
      }

      // 3. Ensure it is currently a DRAFT
      if (existingQuotation.status !== 'DRAFT') {
        return res.status(400).json({ message: 'Quotation is already submitted or processed' });
      }

      // 4. Update status to SUBMITTED
      const updatedQuotation = await prisma.quotation.update({
        where: { id },
        data: { status: 'SUBMITTED' }
      });

      res.json(updatedQuotation);
    } catch (err) {
      next(err);
    }
  },

  getQuotationsByRFQ: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rfqId } = req.params;

      const quotations = await prisma.quotation.findMany({
        where: { rfqId },
        include: {
          lineItems: true,
          vendor: {
            select: {
              id: true,
              name: true,
              rating: true,
              contactNo: true
            }
          }
        },
        orderBy: { grandTotal: 'asc' } // Show cheapest first
      });

      res.json(quotations);
    } catch (err) {
      next(err);
    }
  },

  compareQuotations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rfqId } = req.params;
      const { sortBy, sortOrder = 'asc', status } = req.query;

      // 1. Determine allowed status filter
      let statusFilter: any = { in: ['SUBMITTED', 'SELECTED'] };
      if (status && typeof status === 'string') {
        statusFilter = status;
      }

      const [rfq, quotations] = await Promise.all([
        prisma.rFQ.findUnique({
          where: { id: rfqId },
          include: { lineItems: true }
        }),
        prisma.quotation.findMany({
          where: { rfqId, status: statusFilter },
          include: {
            lineItems: true,
            vendor: {
              select: {
                id: true,
                name: true,
                rating: true
              }
            }
          }
        })
      ]);

      if (!rfq) {
        return res.status(404).json({ message: 'RFQ not found' });
      }

      // 2. Perform highlighting calculations if there are any quotations
      let minGrandTotal = Infinity;
      let minDeliveryDays = Infinity;
      let maxRating = -Infinity;
      const lowestUnitPricePerItem: Record<string, number> = {};

      if (quotations.length > 0) {
        minGrandTotal = Math.min(...quotations.map(q => Number(q.grandTotal)));
        minDeliveryDays = Math.min(...quotations.map(q => q.deliveryDays));
        maxRating = Math.max(...quotations.map(q => q.vendor?.rating || 0));

        for (const q of quotations) {
          for (const li of q.lineItems) {
            const price = Number(li.unitPrice);
            if (lowestUnitPricePerItem[li.item] === undefined || price < lowestUnitPricePerItem[li.item]) {
              lowestUnitPricePerItem[li.item] = price;
            }
          }
        }
      }

      // 3. Map quotations, injecting highlighting flags
      let mappedQuotations = quotations.map(q => {
        const grandTotalVal = Number(q.grandTotal);
        const ratingVal = q.vendor?.rating || 0;

        return {
          quotationId: q.id,
          vendor: q.vendor,
          subtotal: q.subtotal,
          gstPercentage: q.gstPercentage,
          gstAmount: q.gstAmount,
          grandTotal: q.grandTotal,
          deliveryDays: q.deliveryDays,
          paymentTerms: q.paymentTerms,
          status: q.status,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
          isLowestPrice: grandTotalVal === minGrandTotal,
          isFastestDelivery: q.deliveryDays === minDeliveryDays,
          isHighestRated: ratingVal === maxRating && maxRating > 0,
          lineItems: q.lineItems.map(li => {
            const unitPriceVal = Number(li.unitPrice);
            return {
              id: li.id,
              item: li.item,
              qty: li.qty,
              unit: li.unit,
              unitPrice: li.unitPrice,
              totalVal: li.totalVal,
              isLowestUnitPrice: unitPriceVal === lowestUnitPricePerItem[li.item]
            };
          })
        };
      });

      // 4. Sorting logic
      if (sortBy && typeof sortBy === 'string') {
        const orderMultiplier = sortOrder === 'desc' ? -1 : 1;

        mappedQuotations.sort((a, b) => {
          if (sortBy === 'price') {
            return (Number(a.grandTotal) - Number(b.grandTotal)) * orderMultiplier;
          }
          if (sortBy === 'delivery') {
            return (a.deliveryDays - b.deliveryDays) * orderMultiplier;
          }
          if (sortBy === 'rating') {
            const ratingA = a.vendor?.rating || 0;
            const ratingB = b.vendor?.rating || 0;
            return (ratingA - ratingB) * orderMultiplier;
          }
          return 0;
        });
      }

      const comparisonReport = {
        rfq: {
          id: rfq.id,
          title: rfq.title,
          category: rfq.category,
          deadline: rfq.deadline,
          lineItems: rfq.lineItems.map(item => ({
            id: item.id,
            item: item.item,
            qty: item.qty,
            unit: item.unit
          }))
        },
        quotations: mappedQuotations
      };

      res.json(comparisonReport);
    } catch (err) {
      next(err);
    }
  }
};
