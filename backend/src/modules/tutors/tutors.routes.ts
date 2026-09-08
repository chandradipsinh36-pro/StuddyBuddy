import { Router } from 'express';
import { tutorsController } from './tutors.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createProfileSchema, updateProfileSchema, createSkillSchema,
  updateSkillSchema, tutorListQuerySchema,
} from './tutors.schema';

const router = Router();

// Public
router.get('/', validate(tutorListQuerySchema, 'query'), tutorsController.listTutors);
router.get('/:id', tutorsController.getTutorById);

// Tutor-only: own profile
router.get('/me/profile',   authenticate, authorize('tutor'), tutorsController.getMyProfile);
router.post('/me/profile',  authenticate, authorize('tutor'), validate(createProfileSchema), tutorsController.createMyProfile);
router.patch('/me/profile', authenticate, authorize('tutor'), validate(updateProfileSchema), tutorsController.updateMyProfile);

// Tutor-only: skills
router.get('/me/skills',              authenticate, authorize('tutor'), tutorsController.listMySkills);
router.post('/me/skills',             authenticate, authorize('tutor'), validate(createSkillSchema), tutorsController.addSkill);
router.patch('/me/skills/:skillId',   authenticate, authorize('tutor'), validate(updateSkillSchema), tutorsController.updateSkill);
router.delete('/me/skills/:skillId',  authenticate, authorize('tutor'), tutorsController.deleteSkill);

export default router;
