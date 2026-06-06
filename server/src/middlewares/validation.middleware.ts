import { Request, Response, NextFunction } from 'express';
import { Schema } from 'zod';

export default function validationMiddleware(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: 'Request payload validation errors',
        errors: result.error.errors
      });
    }
    next();
  };
}
