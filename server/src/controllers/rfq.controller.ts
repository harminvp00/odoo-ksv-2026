import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { activityService } from '../services/activity.service';

export const rfqController = {
  createRFQ: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, category, deadline, description, attachments, lineItems, assignedVendorIds } = req.body;
      const createdByUserId = (req as any).user?.id;

      if (!createdByUserId) {
        return res.status(401).json({ message: 'User session not authenticated' });
      }

      // Check if all assigned vendors exist
      if (assignedVendorIds && assignedVendorIds.length > 0) {
        const uniqueVendors = await prisma.vendor.findMany({
          where: { id: { in: assignedVendorIds } }
        });
        if (uniqueVendors.length !== assignedVendorIds.length) {
          return res.status(400).json({ message: 'One or more assigned vendors do not exist' });
        }
      }

      // Create RFQ, Line Items, and Assignments in a single transaction
      const rfq = await prisma.$transaction(async (tx) => {
        const createdRFQ = await tx.rFQ.create({
          data: {
            title,
            category,
            deadline: new Date(deadline),
            description,
            attachments,
            createdByUserId,
            status: 'OPEN' // Default to OPEN on creation to trigger workflows
          }
        });

        // Insert Line Items
        if (lineItems && lineItems.length > 0) {
          await tx.rFQLineItem.createMany({
            data: lineItems.map((li: any) => ({
              rfqId: createdRFQ.id,
              item: li.item,
              qty: li.qty,
              unit: li.unit
            }))
          });
        }

        // Insert Assignments
        if (assignedVendorIds && assignedVendorIds.length > 0) {
          await tx.rFQAssignment.createMany({
            data: assignedVendorIds.map((vendorId: string) => ({
              rfqId: createdRFQ.id,
              vendorId
            }))
          });
        }

        // Fetch and return the fully populated RFQ record
        return tx.rFQ.findUnique({
          where: { id: createdRFQ.id },
          include: {
            lineItems: true,
            assignments: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    name: true,
                    contactNo: true
                  }
                }
              }
            }
          }
        });
      });

      if (rfq) {
        // Log Activity
        await activityService.logActivity(createdByUserId, 'RFQ', `RFQ "${rfq.title}" created`, { rfqId: rfq.id });

        // Notify Vendors
        if (assignedVendorIds && assignedVendorIds.length > 0) {
          const vendorsWithUsers = await prisma.vendor.findMany({
            where: { id: { in: assignedVendorIds } },
            include: { user: true }
          });
          for (const v of vendorsWithUsers) {
            if (v.userId) {
              await activityService.createNotification(
                v.userId,
                'RFQ',
                'New RFQ Assignment',
                `You have been assigned to RFQ "${rfq.title}". Please submit your quotation.`,
                true
              );
            }
          }
        }
      }

      res.status(201).json(rfq);
    } catch (err) {
      next(err);
    }
  },

  getRFQs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const role = (req as any).user?.role;

      if (!userId || !role) {
        return res.status(401).json({ message: 'User session not authenticated' });
      }

      const where: any = {};

      // If user is a VENDOR, restrict to only those RFQs they are assigned to
      if (role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({
          where: { userId }
        });
        if (!vendor) {
          return res.status(404).json({ message: 'Vendor profile not found' });
        }
        where.assignments = {
          some: { vendorId: vendor.id }
        };
      }

      const rfqs = await prisma.rFQ.findMany({
        where,
        include: {
          lineItems: true,
          assignments: {
            include: {
              vendor: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(rfqs);
    } catch (err) {
      next(err);
    }
  },

  getRFQDetails: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const role = (req as any).user?.role;

      if (!userId || !role) {
        return res.status(401).json({ message: 'User session not authenticated' });
      }

      const rfq = await prisma.rFQ.findUnique({
        where: { id },
        include: {
          lineItems: true,
          assignments: {
            include: {
              vendor: {
                select: {
                  id: true,
                  name: true,
                  gstNo: true,
                  contactNo: true
                }
              }
            }
          }
        }
      });

      if (!rfq) {
        return res.status(404).json({ message: 'RFQ not found' });
      }

      // If user is a VENDOR, ensure they are assigned to this RFQ
      if (role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({
          where: { userId }
        });
        if (!vendor) {
          return res.status(404).json({ message: 'Vendor profile not found' });
        }
        const isAssigned = rfq.assignments.some(a => a.vendorId === vendor.id);
        if (!isAssigned) {
          return res.status(430).json({ message: 'Forbidden: You are not assigned to this RFQ' });
        }
      }

      res.json(rfq);
    } catch (err) {
      next(err);
    }
  }
};
