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
};
