import { Request, Response, NextFunction } from 'express';

export const authController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Login mock response', token: 'mock-jwt-token' });
    } catch (err) { next(err); }
  },
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json({ message: 'Register mock response' });
    } catch (err) { next(err); }
  },
  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Forgot password reset link sent' });
    } catch (err) { next(err); }
  }
};
