import { Request, Response, NextFunction } from 'express';

export const reportController = {
  getInsights: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Dashboard report metrics insights' });
    } catch (err) { next(err); }
  }
};
