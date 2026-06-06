import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export default function roleMiddleware(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(430).json({ message: 'Unauthorized role permissions' });
    }
    next();
  };
}
