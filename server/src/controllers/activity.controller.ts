import { Request, Response, NextFunction } from 'express';

export const activityController = {
  getLogs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Audit activity logs' });
    } catch (err) { next(err); }
  }
};
