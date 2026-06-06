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
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      // Return a generic response to prevent user enumeration
      if (!user) {
        return res.json({
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Sign token using a custom secret (global secret + current user password hash)
      // If the password changes, the token is automatically invalidated.
      const secret = env.JWT_SECRET + user.password;
      const resetToken = jwt.sign(
        { id: user.id, email: user.email },
        secret,
        { expiresIn: '15m' }
      );

      const resetLink = `http://localhost:5173/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

      // Send reset password email
      await emailService.sendMail(
        user.email,
        'VendorBridge Password Reset Request',
        `<h3>Password Reset Request</h3>
         <p>Hello ${user.firstName},</p>
         <p>You requested a password reset for your VendorBridge account.</p>
         <p>Please click the link below to reset your password. This link is valid for 15 minutes:</p>
         <p><a href="${resetLink}" target="_blank" style="display:inline-block;padding:10px 20px;background-color:#4F46E5;color:#ffffff;text-decoration:none;border-radius:5px;">Reset Password</a></p>
         <p>If you did not request this change, you can safely ignore this email.</p>`
      );

      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
        resetToken,
        resetLink
      });
    } catch (err) { next(err); }
  },
  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, token, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid email or reset token' });
      }

      // Verify the reset token using the user-specific secret
      try {
        const secret = env.JWT_SECRET + user.password;
        jwt.verify(token, secret);
      } catch (err) {
        return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
      }

      // Hash the new password
      const newHashedPassword = await bcrypt.hash(password, 10);

      // Update password in DB
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHashedPassword }
      });

      // Send confirmation email
      await emailService.sendMail(
        user.email,
        'VendorBridge Password Changed',
        `<h3>Password Reset Successful</h3>
         <p>Hello ${user.firstName},</p>
         <p>Your VendorBridge account password was successfully reset.</p>
         <p>If you did not make this change, please contact support immediately.</p>`
      );

      res.json({
        message: 'Password reset successful'
      });
    } catch (err) { next(err); }
  },
  getMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword
      });
    } catch (err) { next(err); }
  }
};
