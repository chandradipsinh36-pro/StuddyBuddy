import { Request, Response, NextFunction } from 'express';
import { tutorApplicationsService } from './tutor-applications.service';
import { sendSuccess } from '../../utils/response';

export const tutorApplicationsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const app = await tutorApplicationsService.createApplication(req.user!.userId, req.body);
      sendSuccess(res, app, { statusCode: 201, message: 'Application submitted' });
    } catch (err) { next(err); }
  },

  async getMine(req: Request, res: Response, next: NextFunction) {
    try {
      const app = await tutorApplicationsService.getMyApplication(req.user!.userId);
      sendSuccess(res, app);
    } catch (err) { next(err); }
  },

  async updateMine(req: Request, res: Response, next: NextFunction) {
    try {
      const app = await tutorApplicationsService.updateMyApplication(req.user!.userId, req.body);
      sendSuccess(res, app, { message: 'Application updated' });
    } catch (err) { next(err); }
  },

  async addDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await tutorApplicationsService.addDocument(req.user!.userId, req.body);
      sendSuccess(res, doc, { statusCode: 201 });
    } catch (err) { next(err); }
  },

  async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const docs = await tutorApplicationsService.listDocuments(req.user!.userId);
      sendSuccess(res, docs);
    } catch (err) { next(err); }
  },

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      await tutorApplicationsService.deleteDocument(req.user!.userId, Number(req.params.docId));
      res.status(204).end();
    } catch (err) { next(err); }
  },
};
