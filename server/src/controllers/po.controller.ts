import { Request, Response, NextFunction } from 'express';

export const poController = {
  createPO: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json({ message: 'Purchase Order generated stubs' });
    } catch (err) { next(err); }
  },
  getPO: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Get PO details' });
    } catch (err) { next(err); }
  }
};
