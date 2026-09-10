import { Request, Response, NextFunction } from 'express';
import { adminCourseService } from './adminCourse.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

export const adminCourseController = {
  async listCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const { courses, total, page, limit } = await adminCourseService.listCourses(req.query);
      sendPaginated(res, courses, { page, limit, total });
    } catch (err) {
      next(err);
    }
  },

  async getCourseById(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = parseInt(req.params.id, 10);
      const course = await adminCourseService.getCourseById(courseId);
      sendSuccess(res, course, { message: 'Course retrieved successfully' });
    } catch (err) {
      next(err);
    }
  },

  async togglePublish(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = parseInt(req.params.id, 10);
      const course = await adminCourseService.togglePublish(courseId);
      sendSuccess(res, course, { message: `Course ${course.isPublished ? 'published' : 'unpublished'} successfully` });
    } catch (err) {
      next(err);
    }
  },

  async updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = parseInt(req.params.id, 10);
      const course = await adminCourseService.updateCourse(courseId, req.body);
      sendSuccess(res, course, { message: 'Course updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  async deleteCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = parseInt(req.params.id, 10);
      const result = await adminCourseService.deleteCourse(courseId);
      sendSuccess(res, result, { message: 'Course deleted permanently' });
    } catch (err) {
      next(err);
    }
  },
};
