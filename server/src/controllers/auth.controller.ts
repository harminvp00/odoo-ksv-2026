import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import env from '../config/env';
import { emailService } from '../services/email.service';

export const authController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Verify password
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Sign JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      // Send login alert email
      const localTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      await emailService.sendMail(
        user.email,
        'VendorBridge Login Notification',
        `<h3>New Login Alert</h3>
         <p>Hello ${user.firstName},</p>
         <p>A new login was detected on your VendorBridge account on <strong>${localTime} IST</strong>.</p>
         <p>If this was not you, please reset your password immediately.</p>`
      );

      // Exclude password from the user object
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        token,
        user: userWithoutPassword
      });
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

      // Send welcome email
      await emailService.sendMail(
        user.email,
        'Welcome to VendorBridge ERP',
        `<h3>Welcome to VendorBridge ERP, ${user.firstName}!</h3>
         <p>Your account has been successfully registered with the role of <strong>${user.role}</strong>.</p>
         <p>You can now log in and manage your procurement workflows.</p>`
      );

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
