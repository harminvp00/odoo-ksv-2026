import prisma from '../config/db';
import { emailService } from './email.service';

export const activityService = {
  logActivity: async (userId: string | null, type: string, description: string, metadata?: any) => {
    try {
      return await prisma.activityLog.create({
        data: {
          userId,
          type,
          description,
          metadata: metadata || undefined
        }
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  },

  createNotification: async (userId: string, type: string, title: string, message: string, sendEmailFlag = true) => {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message
        },
        include: {
          user: true
        }
      });

      if (sendEmailFlag && notification.user?.email) {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 4px;">
            <h3 style="color: #3F51B5; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px; margin-top: 0;">${title}</h3>
            <p>Hello ${notification.user.firstName || 'User'},</p>
            <p style="line-height: 1.5; color: #333;">${message}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #888;">This is an automated notification from VendorBridge.</p>
          </div>
        `;
        // Send actual email alert
        await emailService.sendMail(notification.user.email, title, htmlContent);
      }

      return notification;
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  }
};
