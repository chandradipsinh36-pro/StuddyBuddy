import { Request, Response, NextFunction } from 'express';
import { adminTutorService } from './adminTutor.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { TutorQuery } from './admin.schema';

export const adminTutorController = {
  async listTutors(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as TutorQuery;
      const { tutors, total, page, limit } = await adminTutorService.listTutors(query);
      sendPaginated(res, tutors, { page, limit, total });
    } catch (err) {
      next(err);
    }
  },

  async getTutorById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await adminTutorService.getTutorById(id);
      sendSuccess(res, data, { message: 'Tutor retrieved successfully' });
    } catch (err) {
      next(err);
    }
  },

  async updateCourseStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const { isPublished } = req.body;
      const updated = await adminTutorService.updateCourseStatus(courseId, Boolean(isPublished));
      sendSuccess(res, updated, { message: 'Course status updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  async deleteCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      await adminTutorService.deleteCourse(courseId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },

  async updateResourceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const resourceId = parseInt(req.params.resourceId, 10);
      const { status } = req.body;
      const updated = await adminTutorService.updateResourceStatus(resourceId, status);
      sendSuccess(res, updated, { message: 'Resource status updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  async deleteResource(req: Request, res: Response, next: NextFunction) {
    try {
      const resourceId = parseInt(req.params.resourceId, 10);
      await adminTutorService.deleteResource(resourceId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },

  async updateBundleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const bundleId = parseInt(req.params.bundleId, 10);
      const { isPublished } = req.body;
      const updated = await adminTutorService.updateBundleStatus(bundleId, Boolean(isPublished));
      sendSuccess(res, updated, { message: 'Bundle status updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  async deleteBundle(req: Request, res: Response, next: NextFunction) {
    try {
      const bundleId = parseInt(req.params.bundleId, 10);
      await adminTutorService.deleteBundle(bundleId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
