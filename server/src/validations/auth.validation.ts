import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR', 'MANAGER']).default('PROCUREMENT_OFFICER'),
  country: z.string().optional(),
  additionalInfo: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format')
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address format'),
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'New password must be at least 6 characters long')
});
