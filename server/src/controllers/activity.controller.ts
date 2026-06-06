import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const activityController = {
  getLogs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, limit = '50', offset = '0' } = req.query;

      const whereClause: any = {};
      if (type) {
        whereClause.type = type as string;
      }

      const logs = await prisma.activityLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      });

      const total = await prisma.activityLog.count({ where: whereClause });

      res.json({ logs, total });
    } catch (err) {
      next(err);
    }
  },

  getNotifications: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User session not authenticated' });
      }

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      res.json(notifications);
    } catch (err) {
      next(err);
    }
  },

  markAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User session not authenticated' });
      }

      const notification = await prisma.notification.findUnique({
        where: { id }
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({ message: 'Access denied: not your notification' });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  markAllAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User session not authenticated' });
      }

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });

      res.json({ message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }
};
