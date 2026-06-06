import { z } from 'zod';

export const createQuotationSchema = z.object({
  rfqId: z.string().uuid('Invalid RFQ ID'),
  deliveryDays: z.number().int().min(1, 'Delivery timeline is required and must be at least 1 day'),
  paymentTerms: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SUBMITTED']).default('DRAFT'),
  lineItems: z.array(
    z.object({
      item: z.string().min(1, 'Item name is required'),
      qty: z.number().int().min(1, 'Quantity must be at least 1'),
      unit: z.string().min(1, 'Unit is required'),
      unitPrice: z.number().positive('Unit price must be greater than 0')
    })
  ).min(1, 'At least one line item is required')
});

export const updateQuotationSchema = z.object({
  deliveryDays: z.number().int().min(1).optional(),
  paymentTerms: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SUBMITTED']).optional(),
  lineItems: z.array(
    z.object({
      item: z.string().min(1),
      qty: z.number().int().min(1),
      unit: z.string().min(1),
      unitPrice: z.number().positive()
    })
  ).optional()
});
