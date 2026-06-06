import { Request, Response, NextFunction } from 'express';

export const vendorController = {
  getVendors: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Get vendors list mock response' });
    } catch (err) { next(err); }
  },
  registerVendor: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json({ message: 'Vendor registered successfully' });
    } catch (err) { next(err); }
  }
};
