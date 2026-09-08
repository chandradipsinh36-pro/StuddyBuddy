import { Router } from 'express';
import { enrollmentsService } from './enrollments.service';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { sendSuccess } from '../../utils/response';
import { Request, Response, NextFunction } from 'express';

// Course enrollment
export const courseEnrollRouter = Router({ mergeParams: true });
courseEnrollRouter.post('/', authenticate, authorize('student'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await enrollmentsService.enroll(req.user!.userId, Number(req.params.courseId)), { statusCode: 201 });
  } catch (err) { next(err); }
});

// Student enrollments list
export const studentEnrollmentsRouter = Router();
studentEnrollmentsRouter.use(authenticate, authorize('student'));
studentEnrollmentsRouter.get('/me/enrollments', async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await enrollmentsService.listMyEnrollments(req.user!.userId)); } catch (err) { next(err); }
});
studentEnrollmentsRouter.get('/me/enrollments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await enrollmentsService.getMyEnrollmentById(req.user!.userId, Number(req.params.id))); } catch (err) { next(err); }
});
