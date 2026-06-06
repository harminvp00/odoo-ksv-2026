import nodemailer from 'nodemailer';
import env from '../config/env';
import logger from '../utils/logger';

// Create a nodemailer transporter using environment configurations
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // secure is true only for port 465 (SSL)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  // Add tls block to bypass cert issues if using local/test SMTP relays
  tls: {
    rejectUnauthorized: false
  }
});

export const emailService = {
  sendMail: async (to: string, subject: string, htmlContent: string) => {
    logger.info(`Sending email to ${to} with subject "${subject}"`);
    try {
      const info = await transporter.sendMail({
        from: `"VendorBridge" <${env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      });
      logger.info(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }
};
