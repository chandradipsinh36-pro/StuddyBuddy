import { Router } from 'express';
import { tutorEarningsController } from './tutor-earnings.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const earningsRouter = Router();
earningsRouter.use(authenticate, authorize('tutor'));

earningsRouter.get('/summary', tutorEarningsController.getSummary);
earningsRouter.get('/transactions', tutorEarningsController.getTransactions);

const analyticsRouter = Router();
analyticsRouter.use(authenticate, authorize('tutor'));
analyticsRouter.get('/', tutorEarningsController.getAnalytics);

export { earningsRouter, analyticsRouter };
