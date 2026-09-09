import { Router } from 'express';
import { adminDashboardController } from './adminDashboard.controller';
import { validate } from '../../middleware/validate';
import { DashboardPeriodSchema } from './admin.schema';

const router = Router();

// All routes here already have authenticate + authorize('admin') applied by the parent router

router.get('/overview',              adminDashboardController.getOverview);
router.get('/user-growth',           validate(DashboardPeriodSchema, 'query'), adminDashboardController.getUserGrowth);
router.get('/tutor-applications',    adminDashboardController.getTutorApplicationAnalytics);
router.get('/recent-activity',       adminDashboardController.getRecentActivity);

export default router;
