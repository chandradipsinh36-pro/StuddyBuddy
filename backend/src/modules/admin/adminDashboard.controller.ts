import { Request, Response, NextFunction } from 'express';
import { adminDashboardService } from './adminDashboard.service';
import { sendSuccess } from '../../utils/response';
import { DashboardPeriodQuery } from './admin.schema';

export const adminDashboardController = {
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminDashboardService.getOverview();
      sendSuccess(res, data, { message: 'Dashboard overview retrieved successfully' });
    } catch (err) {
      next(err);
    }
  },

  async getUserGrowth(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as DashboardPeriodQuery;
      const data = await adminDashboardService.getUserGrowth(query);
      sendSuccess(res, data, { message: 'User growth data retrieved successfully' });
    } catch (err) {
      next(err);
    }
  },

  async getTutorApplicationAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminDashboardService.getTutorApplicationAnalytics();
      sendSuccess(res, data, { message: 'Tutor application analytics retrieved successfully' });
    } catch (err) {
      next(err);
    }
  },

  async getRecentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminDashboardService.getRecentActivity();
      sendSuccess(res, data, { message: 'Recent activity retrieved successfully' });
    } catch (err) {
      next(err);
    }
  },
};
