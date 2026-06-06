import { Request, Response, NextFunction } from 'express';

export const quotationController = {
  submitQuotation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json({ message: 'Quotation submitted successfully' });
    } catch (err) { next(err); }
  },
  getQuotationsByRFQ: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Get RFQ quotations list' });
    } catch (err) { next(err); }
  },
  compareQuotations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Quotations compared stubs' });
    } catch (err) { next(err); }
  }
};
