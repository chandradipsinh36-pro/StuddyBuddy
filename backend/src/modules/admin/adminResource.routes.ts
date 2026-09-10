import { Router } from 'express';
import { adminResourceController } from './adminResource.controller';
import { adminActionLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Routes under /api/admin/resources (authenticated + authorized('admin'))
router.get('/', adminResourceController.listResources);
router.get('/:id', adminResourceController.getResourceById);
router.patch('/:id/status', adminActionLimiter, adminResourceController.updateStatus);
router.patch('/:id/lock', adminActionLimiter, adminResourceController.toggleLock);
router.patch('/:id', adminActionLimiter, adminResourceController.updateResource);
router.delete('/:id', adminActionLimiter, adminResourceController.deleteResource);

export default router;
