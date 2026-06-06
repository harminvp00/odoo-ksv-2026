import { Request, Response, NextFunction } from 'express';

export const rfqController = {
  createRFQ: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json({ message: 'RFQ created successfully' });
    } catch (err) { next(err); }
  },
  getRFQs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'List RFQs response' });
    } catch (err) { next(err); }
  },
  getRFQDetails: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Get RFQ details' });
    } catch (err) { next(err); }
  }
};
