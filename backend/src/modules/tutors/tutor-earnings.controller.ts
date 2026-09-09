import { Request, Response, NextFunction } from 'express';
import { tutorEarningsService } from './tutor-earnings.service';
import { sendSuccess } from '../../utils/response';

export const tutorEarningsController = {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await tutorEarningsService.getSummary(req.user!.userId);
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const transactions = await tutorEarningsService.getTransactions(req.user!.userId);
      sendSuccess(res, transactions);
    } catch (err) {
      next(err);
    }
  },

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await tutorEarningsService.getAnalytics(req.user!.userId);
      sendSuccess(res, analytics);
    } catch (err) {
      next(err);
    }
  },
};
