import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';

export const authController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Login mock response', token: 'mock-jwt-token' });
    } catch (err) { next(err); }
  },
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, phone, role, country, additionalInfo } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email is already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user in the database
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role,
          country,
          additionalInfo
        }
      });

      // Exclude password field from the response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword
      });
    } catch (err) { next(err); }
  },
  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Forgot password reset link sent' });
    } catch (err) { next(err); }
  }
};
