import { Router } from 'express';
import { bundlesService } from './bundles.service';
import { authenticate, authenticateOptional } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createBundleSchema, updateBundleSchema } from './bundles.schema';
import { sendSuccess } from '../../utils/response';
import { Request, Response, NextFunction } from 'express';

const h = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// Public
const router = Router();
router.get('/', authenticateOptional, h(async (req, res) => sendSuccess(res, await bundlesService.listBundles(req.user?.userId, req.user?.role))));
router.get('/:id', authenticateOptional, h(async (req, res) => sendSuccess(res, await bundlesService.getBundleById(Number(req.params.id), req.user?.userId, req.user?.role))));
export default router;

// Tutor
export const tutorBundleRouter = Router();
tutorBundleRouter.use(authenticate, authorize('tutor'));
tutorBundleRouter.get('/', h(async (req, res) => sendSuccess(res, await bundlesService.listMyBundles(req.user!.userId))));
tutorBundleRouter.post('/', validate(createBundleSchema), h(async (req, res) => sendSuccess(res, await bundlesService.createBundle(req.user!.userId, req.body), { statusCode: 201 })));
tutorBundleRouter.get('/:id', h(async (req, res) => sendSuccess(res, await bundlesService.getMyBundleById(req.user!.userId, Number(req.params.id)))));
tutorBundleRouter.patch('/:id', validate(updateBundleSchema), h(async (req, res) => sendSuccess(res, await bundlesService.updateBundle(req.user!.userId, Number(req.params.id), req.body))));
tutorBundleRouter.delete('/:id', h(async (req, res, next) => { await bundlesService.deleteBundle(req.user!.userId, Number(req.params.id)); res.status(204).end(); }));
tutorBundleRouter.post('/:id/resources/:resourceId', h(async (req, res) => sendSuccess(res, await bundlesService.addResource(req.user!.userId, Number(req.params.id), Number(req.params.resourceId)), { statusCode: 201 })));
tutorBundleRouter.delete('/:id/resources/:resourceId', h(async (req, res) => { await bundlesService.removeResource(req.user!.userId, Number(req.params.id), Number(req.params.resourceId)); res.status(204).end(); }));
