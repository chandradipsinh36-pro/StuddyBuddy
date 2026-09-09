import { Router } from 'express';
import { adminApplicationController } from './adminApplication.controller';
import { validate } from '../../middleware/validate';
import { adminActionLimiter } from '../../middleware/rateLimiter';
import {
  ApplicationQuerySchema, ApproveTutorSchema, RejectTutorSchema,
} from './admin.schema';

const router = Router();

// All routes here already have authenticate + authorize('admin') applied by the parent router

router.get('/',        validate(ApplicationQuerySchema, 'query'), adminApplicationController.listApplications);
router.get('/:id',                                                adminApplicationController.getApplicationById);
router.patch('/:id/approve', adminActionLimiter, validate(ApproveTutorSchema), adminApplicationController.approveApplication);
router.patch('/:id/reject',  adminActionLimiter, validate(RejectTutorSchema),  adminApplicationController.rejectApplication);

export default router;
