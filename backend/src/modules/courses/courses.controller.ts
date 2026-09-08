import { Request, Response, NextFunction } from 'express';
import { coursesService } from './courses.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

export const coursesController = {
  // Public
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { courses, total, page, limit } = await coursesService.listCourses(req.query as any);
      sendPaginated(res, courses, { total, page, limit });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await coursesService.getCourseById(Number(req.params.id)));
    } catch (err) { next(err); }
  },

  // Tutor
  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await coursesService.listMyCourses(req.user!.userId));
    } catch (err) { next(err); }
  },

  async getMineById(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await coursesService.getMyCoursById(req.user!.userId, Number(req.params.id)));
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await coursesService.createCourse(req.user!.userId, req.body), { statusCode: 201 });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await coursesService.updateCourse(req.user!.userId, Number(req.params.id), req.body));
    } catch (err) { next(err); }
  },

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const isPublished = req.body.isPublished !== false; // default true
      sendSuccess(res, await coursesService.publishCourse(req.user!.userId, Number(req.params.id), isPublished));
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await coursesService.deleteCourse(req.user!.userId, Number(req.params.id));
      res.status(204).end();
    } catch (err) { next(err); }
  },
};
