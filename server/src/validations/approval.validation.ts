import { z } from 'zod';

export const initiateApprovalSchema = z.object({
  rfqId: z.string().uuid({ message: 'rfqId must be a valid UUID' }),
  quotationId: z.string().uuid({ message: 'quotationId must be a valid UUID' }),
  approverIds: z.array(z.string().uuid({ message: 'approverId must be a valid UUID' })).optional()
});

export const actionApprovalSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'], { message: 'action must be either APPROVE or REJECT' }),
  remarks: z.string().max(500, { message: 'remarks cannot exceed 500 characters' }).optional()
});
