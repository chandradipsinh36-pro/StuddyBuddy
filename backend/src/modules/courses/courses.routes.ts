import { Router } from 'express';
import { coursesController } from './courses.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createCourseSchema, updateCourseSchema, courseQuerySchema } from './courses.schema';

const router = Router();

// Public
router.get('/', validate(courseQuerySchema, 'query'), coursesController.list);
router.get('/:id', coursesController.getById);

export default router;

// Tutor routes — mounted separately at /tutor/courses
export const tutorCourseRouter = Router();
tutorCourseRouter.use(authenticate, authorize('tutor'));
tutorCourseRouter.get('/',            coursesController.listMine);
tutorCourseRouter.post('/',           validate(createCourseSchema), coursesController.create);
tutorCourseRouter.get('/:id',         coursesController.getMineById);
tutorCourseRouter.patch('/:id',       validate(updateCourseSchema), coursesController.update);
tutorCourseRouter.patch('/:id/publish', coursesController.publish);
tutorCourseRouter.delete('/:id',      coursesController.remove);
