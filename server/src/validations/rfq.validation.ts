import { z } from 'zod';

export const createRFQSchema = z.object({
  title: z.string().min(1, 'RFQ Title is required'),
  category: z.string().min(1, 'Category is required'),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid deadline date format'
  }),
  description: z.string().optional(),
  attachments: z.array(z.string()).default([]),
  lineItems: z.array(
    z.object({
      item: z.string().min(1, 'Item name is required'),
      qty: z.number().int().min(1, 'Quantity must be at least 1'),
      unit: z.string().min(1, 'Unit (e.g. NOS, KG) is required')
    })
  ).min(1, 'At least one line item is required'),
  assignedVendorIds: z.array(z.string().uuid('Invalid vendor ID')).default([])
});
