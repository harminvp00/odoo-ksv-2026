import { Request, Response, NextFunction } from 'express';

export const approvalController = {
  getWorkflow: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Get approval logs workflow' });
    } catch (err) { next(err); }
  },
  actionApproval: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Quotation approval state changed' });
    } catch (err) { next(err); }
  }
};
