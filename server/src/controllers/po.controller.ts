import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const poController = {
  createPO: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rfqId, quotationId, vendorId } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User session not authenticated' });
      }

      // Check if PO already exists for this quotation
      const existingPO = await prisma.purchaseOrder.findFirst({
        where: { quotationId }
      });
      if (existingPO) {
        return res.status(400).json({ message: 'Purchase Order already exists for this quotation' });
      }

      // Validate RFQ, Quotation, and Vendor
      const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
      if (!rfq) return res.status(404).json({ message: 'RFQ not found' });

      const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
      if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

      const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

      // Generate PO Number
      const currentYear = new Date().getFullYear();
      const count = await prisma.purchaseOrder.count();
      const poNumber = `PO-${currentYear}-${String(count + 1).padStart(4, '0')}`;

      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber,
          rfqId,
          quotationId,
          vendorId,
          status: 'DRAFT',
          createdByUserId: userId
        },
        include: {
          rfq: true,
          quotation: true,
          vendor: true
        }
      });

      res.status(201).json(po);
    } catch (err) {
      next(err);
    }
  },

  getPO: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
          rfq: {
            include: {
              lineItems: true
            }
          },
          quotation: {
            include: {
              lineItems: true
            }
          },
          vendor: {
            select: {
              id: true,
              name: true,
              category: true,
              gstNo: true,
              contactNo: true,
              rating: true
            }
          },
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!po) {
        return res.status(404).json({ message: 'Purchase Order not found' });
      }

      res.json(po);
    } catch (err) {
      next(err);
    }
  },

  updatePOStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // DRAFT | SENT | ACKNOWLEDGED | CLOSED

      const validStatuses = ['DRAFT', 'SENT', 'ACKNOWLEDGED', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid PO status' });
      }

      const po = await prisma.purchaseOrder.findUnique({ where: { id } });
      if (!po) {
        return res.status(404).json({ message: 'Purchase Order not found' });
      }

      const updatedPo = await prisma.purchaseOrder.update({
        where: { id },
        data: { status },
        include: {
          rfq: true,
          quotation: true,
          vendor: true
        }
      });

      res.json(updatedPo);
    } catch (err) {
      next(err);
    }
  }
};
