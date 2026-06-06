import { Request, Response, NextFunction } from 'express';

export const invoiceController = {
  getInvoiceByPO: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Get invoice linked to PO' });
    } catch (err) { next(err); }
  },
  emailInvoice: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Invoice document sent via email' });
    } catch (err) { next(err); }
  },
  downloadPDF: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.setHeader('Content-Type', 'application/pdf');
      res.send(Buffer.from('PDF_STREAM_STUB'));
    } catch (err) { next(err); }
  }
};
