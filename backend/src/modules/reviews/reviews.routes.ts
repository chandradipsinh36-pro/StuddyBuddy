import { Router } from 'express';
import { reviewsService } from './reviews.service';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createCourseReviewSchema, updateCourseReviewSchema,
  createTutorReviewSchema, updateTutorReviewSchema,
} from './reviews.schema';
import { reviewLimiter } from '../../middleware/rateLimiter';
import { sendSuccess } from '../../utils/response';
import { Request, Response, NextFunction } from 'express';

const h = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// Course reviews — nested under /courses/:courseId/reviews
export const courseReviewRouter = Router({ mergeParams: true });
courseReviewRouter.get('/', h(async (req, res) => sendSuccess(res, await reviewsService.listCourseReviews(Number(req.params.courseId)))));
courseReviewRouter.post('/', authenticate, authorize('student'), reviewLimiter, validate(createCourseReviewSchema), h(async (req, res) => sendSuccess(res, await reviewsService.createCourseReview(req.user!.userId, Number(req.params.courseId), req.body), { statusCode: 201 })));

// Course review update/delete — at /course-reviews/:reviewId
export const courseReviewDetailRouter = Router();
courseReviewDetailRouter.patch('/:reviewId', authenticate, validate(updateCourseReviewSchema), h(async (req, res) => sendSuccess(res, await reviewsService.updateCourseReview(req.user!.userId, Number(req.params.reviewId), req.body))));
courseReviewDetailRouter.delete('/:reviewId', authenticate, h(async (req, res) => { await reviewsService.deleteCourseReview(req.user!.userId, Number(req.params.reviewId)); res.status(204).end(); }));

// Tutor reviews — nested under /tutors/:tutorId/reviews
export const tutorReviewRouter = Router({ mergeParams: true });
tutorReviewRouter.get('/', h(async (req, res) => sendSuccess(res, await reviewsService.listTutorReviews(Number(req.params.tutorId)))));
tutorReviewRouter.post('/', authenticate, authorize('student'), reviewLimiter, validate(createTutorReviewSchema), h(async (req, res) => sendSuccess(res, await reviewsService.createTutorReview(req.user!.userId, Number(req.params.tutorId), req.body), { statusCode: 201 })));

// Tutor review update/delete — at /tutor-reviews/:reviewId
export const tutorReviewDetailRouter = Router();
tutorReviewDetailRouter.patch('/:reviewId', authenticate, validate(updateTutorReviewSchema), h(async (req, res) => sendSuccess(res, await reviewsService.updateTutorReview(req.user!.userId, Number(req.params.reviewId), req.body))));
tutorReviewDetailRouter.delete('/:reviewId', authenticate, h(async (req, res) => { await reviewsService.deleteTutorReview(req.user!.userId, Number(req.params.reviewId)); res.status(204).end(); }));
