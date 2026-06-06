import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export default function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error(`Server Exception: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    message: 'An unexpected database or application exception occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}
