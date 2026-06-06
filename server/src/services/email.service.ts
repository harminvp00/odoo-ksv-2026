import logger from '../utils/logger';

export const emailService = {
  sendMail: async (to: string, subject: string, htmlContent: string) => {
    logger.info(`Sending email to ${to} with subject "${subject}"`);
    return true;
  }
};
