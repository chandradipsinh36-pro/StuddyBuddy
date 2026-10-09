import { Router } from 'express';
import { tutorsController } from './tutors.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createProfileSchema, updateProfileSchema, createSkillSchema,
  updateSkillSchema, tutorListQuerySchema,
} from './tutors.schema';

import { reviewsService } from '../reviews/reviews.service';
import { sendSuccess } from '../../utils/response';

const router = Router();

// Tutor-only: own profile & data (MUST be defined before /:id)
router.get('/me/profile',   authenticate, authorize('tutor'), tutorsController.getMyProfile);
router.post('/me/profile',  authenticate, authorize('tutor'), validate(createProfileSchema), tutorsController.createMyProfile);
router.patch('/me/profile', authenticate, authorize('tutor'), validate(updateProfileSchema), tutorsController.updateMyProfile);

// Tutor-only: reviews received
router.get('/me/reviews', authenticate, authorize('tutor'), async (req, res, next) => {
  try {
    const reviews = await reviewsService.listTutorReviews(req.user!.userId);
    sendSuccess(res, reviews);
  } catch (err) {
    next(err);
  }
});

// Tutor-only: skills
router.get('/me/skills',              authenticate, authorize('tutor'), tutorsController.listMySkills);
router.post('/me/skills',             authenticate, authorize('tutor'), validate(createSkillSchema), tutorsController.addSkill);
router.patch('/me/skills/:skillId',   authenticate, authorize('tutor'), validate(updateSkillSchema), tutorsController.updateSkill);
router.delete('/me/skills/:skillId',  authenticate, authorize('tutor'), tutorsController.deleteSkill);

// Public
router.get('/', validate(tutorListQuerySchema, 'query'), tutorsController.listTutors);
router.get('/:id', tutorsController.getTutorById);

export default router;
