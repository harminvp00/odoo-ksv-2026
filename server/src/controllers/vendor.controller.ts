import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const vendorController = {
  getVendors: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, category, status, limit = '10', page = '1' } = req.query;
      const parsedLimit = parseInt(limit as string, 10);
      const parsedPage = parseInt(page as string, 10);
      const skip = (parsedPage - 1) * parsedLimit;

      const where: any = {};
      
      if (category) {
        where.category = category as string;
      }
      
      if (status) {
        where.status = status as string;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { gstNo: { contains: search as string, mode: 'insensitive' } },
          { category: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [vendors, total] = await Promise.all([
        prisma.vendor.findMany({
          where,
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: parsedLimit,
          skip
        }),
        prisma.vendor.count({ where })
      ]);

      res.json({
        vendors,
        total,
        limit: parsedLimit,
        page: parsedPage
      });
    } catch (err) {
      next(err);
    }
  },

  registerVendor: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, category, gstNo, contactNo, address, userId } = req.body;

      // Check for duplicate GST No
      const existingGST = await prisma.vendor.findUnique({
        where: { gstNo }
      });

      if (existingGST) {
        return res.status(400).json({ message: 'Vendor with this GST number is already registered' });
      }

      // Check if user exists if userId is provided
      if (userId) {
        const userExists = await prisma.user.findUnique({
          where: { id: userId }
        });
        if (!userExists) {
          return res.status(400).json({ message: 'Linked user account does not exist' });
        }
      }

      const vendor = await prisma.vendor.create({
        data: {
          name,
          category,
          gstNo,
          contactNo,
          address,
          userId: userId || null
        }
      });

      res.status(201).json(vendor);
    } catch (err) {
      next(err);
    }
  },

  updateVendorStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const existingVendor = await prisma.vendor.findUnique({
        where: { id }
      });

      if (!existingVendor) {
        return res.status(404).json({ message: 'Vendor record not found' });
      }

      const updatedVendor = await prisma.vendor.update({
        where: { id },
        data: { status }
      });

      res.json(updatedVendor);
    } catch (err) {
      next(err);
    }
  }
};
