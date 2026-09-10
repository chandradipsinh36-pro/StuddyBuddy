import { Router } from 'express';
import { adminBundleController } from './adminBundle.controller';
import { adminActionLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Routes under /api/admin/bundles (authenticated + authorized('admin'))
router.get('/', adminBundleController.listBundles);
router.get('/:id', adminBundleController.getBundleById);
router.patch('/:id/publish', adminActionLimiter, adminBundleController.togglePublish);
router.patch('/:id', adminActionLimiter, adminBundleController.updateBundle);
router.delete('/:id', adminActionLimiter, adminBundleController.deleteBundle);

export default router;
