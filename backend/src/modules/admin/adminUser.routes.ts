import { Router } from 'express';
import { adminUserController } from './adminUser.controller';
import { validate } from '../../middleware/validate';
import { adminActionLimiter } from '../../middleware/rateLimiter';
import {
  UserQuerySchema, SuspendUserSchema, BanUserSchema,
} from './admin.schema';

const router = Router();

// All routes here already have authenticate + authorize('admin') applied by the parent router

router.get('/',                          validate(UserQuerySchema, 'query'), adminUserController.listUsers);
router.get('/:id',                       adminUserController.getUserById);
router.patch('/:id/suspend',    adminActionLimiter, validate(SuspendUserSchema), adminUserController.suspendUser);
router.patch('/:id/ban',        adminActionLimiter, validate(BanUserSchema),     adminUserController.banUser);
router.patch('/:id/reactivate', adminActionLimiter,                            adminUserController.reactivateUser);
router.delete('/:id',           adminActionLimiter,                            adminUserController.deleteUser);

export default router;
