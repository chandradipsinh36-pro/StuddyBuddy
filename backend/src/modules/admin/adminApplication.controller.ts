import { Request, Response, NextFunction } from 'express';
import { adminApplicationService } from './adminApplication.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { ApplicationQuery, ApproveTutorInput, RejectTutorInput } from './admin.schema';

export const adminApplicationController = {
  async listApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ApplicationQuery;
      const { applications, total, page, limit } = await adminApplicationService.listApplications(query);
      sendPaginated(res, applications, { page, limit, total });
    } catch (err) {
      next(err);
    }
  },

  async getApplicationById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await adminApplicationService.getApplicationById(id);
      sendSuccess(res, data, { message: 'Application retrieved successfully' });
    } catch (err) {
      next(err);
    }
  },

  async approveApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const id = parseInt(req.params.id, 10);
      const input = req.body as ApproveTutorInput;
      const data = await adminApplicationService.approveApplication(adminId, id, input);
      sendSuccess(res, data, { message: 'Tutor application approved successfully' });
    } catch (err) {
      next(err);
    }
  },

  async rejectApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const id = parseInt(req.params.id, 10);
      const input = req.body as RejectTutorInput;
      const data = await adminApplicationService.rejectApplication(adminId, id, input);
      sendSuccess(res, data, { message: 'Tutor application rejected' });
    } catch (err) {
      next(err);
    }
  },
};
