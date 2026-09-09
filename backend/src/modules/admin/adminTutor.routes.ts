import { Router } from 'express';
import { adminTutorController } from './adminTutor.controller';
import { validate } from '../../middleware/validate';
import { TutorQuerySchema } from './admin.schema';

const router = Router();

// All routes here already have authenticate + authorize('admin') applied by the parent router

// Management routes (specific paths placed before /:id)
router.patch('/courses/:courseId/status', adminTutorController.updateCourseStatus);
router.delete('/courses/:courseId', adminTutorController.deleteCourse);

router.patch('/resources/:resourceId/status', adminTutorController.updateResourceStatus);
router.delete('/resources/:resourceId', adminTutorController.deleteResource);

router.patch('/bundles/:bundleId/status', adminTutorController.updateBundleStatus);
router.delete('/bundles/:bundleId', adminTutorController.deleteBundle);

router.get('/',    validate(TutorQuerySchema, 'query'), adminTutorController.listTutors);
router.get('/:id',                                      adminTutorController.getTutorById);

export default router;
