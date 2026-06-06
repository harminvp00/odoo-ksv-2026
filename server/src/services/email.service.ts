import nodemailer from 'nodemailer';
import env from '../config/env';
import logger from '../utils/logger';

// Create nodemailer transport
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  // Fallback to Gmail SMTP standard port 587 if host is Gmail and port is configured as 2525
  port: env.SMTP_PORT === 2525 && env.SMTP_HOST.includes('gmail') ? 587 : env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  // Add tls block to bypass cert issues if using local/test SMTP relays
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    logger.error(`SMTP Connection Error: ${error.message}`);
  } else {
    logger.info('SMTP Server is ready to take our messages');
  }
});

export const emailService = {
  sendMail: async (to: string, subject: string, htmlContent: string, attachments?: any[]) => {
    try {
      logger.info(`Sending email to ${to} with subject "${subject}"`);
      
      const info = await transporter.sendMail({
        from: `"VendorBridge" <${env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
        attachments
      });

      logger.info(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (err: any) {
      logger.error(`Failed to send email to ${to}: ${err.message}`);
      throw err;
    }
  }
};
