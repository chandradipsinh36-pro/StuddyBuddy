import { Router } from 'express';
import { adminTutorController } from './adminTutor.controller';
import { validate } from '../../middleware/validate';
import { TutorQuerySchema } from './admin.schema';

const router = Router();

// All routes here already have authenticate + authorize('admin') applied by the parent router

router.get('/',    validate(TutorQuerySchema, 'query'), adminTutorController.listTutors);
router.get('/:id',                                      adminTutorController.getTutorById);

export default router;
