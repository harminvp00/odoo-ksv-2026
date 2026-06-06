import { z } from 'zod';

export const registerVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  category: z.string().min(1, 'Category is required'),
  gstNo: z.string().min(1, 'GST number is required'),
  contactNo: z.string().min(1, 'Contact number is required'),
  address: z.string().optional(),
  userId: z.string().uuid('Invalid user ID').optional().nullable()
});

export const updateVendorStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'BLOCKED'])
});
