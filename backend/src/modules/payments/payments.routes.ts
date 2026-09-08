import { Router } from 'express';
import { paymentsService } from './payments.service';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  payCourseSchema, payResourceSchema, payBundleSchema, createRefundSchema,
} from './payments.schema';
import { sendSuccess } from '../../utils/response';
import { Request, Response, NextFunction } from 'express';

const h = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// Payments router
const router = Router();
router.use(authenticate, authorize('student'));

router.post('/course',   validate(payCourseSchema),   h(async (req, res) => sendSuccess(res, await paymentsService.payCourse(req.user!.userId, req.body), { statusCode: 201 })));
router.post('/resource', validate(payResourceSchema),  h(async (req, res) => sendSuccess(res, await paymentsService.payResource(req.user!.userId, req.body), { statusCode: 201 })));
router.post('/bundle',   validate(payBundleSchema),    h(async (req, res) => sendSuccess(res, await paymentsService.payBundle(req.user!.userId, req.body), { statusCode: 201 })));
router.get('/me',        h(async (req, res) => sendSuccess(res, await paymentsService.listMyPayments(req.user!.userId))));
router.get('/me/:id',    h(async (req, res) => sendSuccess(res, await paymentsService.getMyPaymentById(req.user!.userId, Number(req.params.id)))));

export default router;

// Refunds router
export const refundsRouter = Router();
refundsRouter.use(authenticate, authorize('student'));

refundsRouter.post('/',       validate(createRefundSchema), h(async (req, res) => sendSuccess(res, await paymentsService.createRefund(req.user!.userId, req.body), { statusCode: 201 })));
refundsRouter.get('/me',      h(async (req, res) => sendSuccess(res, await paymentsService.listMyRefunds(req.user!.userId))));
refundsRouter.get('/me/:id',  h(async (req, res) => sendSuccess(res, await paymentsService.getMyRefundById(req.user!.userId, Number(req.params.id)))));
