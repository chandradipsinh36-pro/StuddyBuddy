import { Router } from 'express';
import { adminCourseController } from './adminCourse.controller';
import { adminActionLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Routes under /api/admin/courses (authenticated + authorized('admin'))
router.get('/', adminCourseController.listCourses);
router.get('/:id', adminCourseController.getCourseById);
router.patch('/:id/publish', adminActionLimiter, adminCourseController.togglePublish);
router.patch('/:id', adminActionLimiter, adminCourseController.updateCourse);
router.delete('/:id', adminActionLimiter, adminCourseController.deleteCourse);

export default router;
