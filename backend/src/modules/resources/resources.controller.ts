import { Request, Response, NextFunction } from 'express';
import { resourcesService } from './resources.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

export const resourcesController = {
  // Public
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { resources, total, page, limit } = await resourcesService.listResources(req.query as any);
      sendPaginated(res, resources, { total, page, limit });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await resourcesService.getById(Number(req.params.id)));
    } catch (err) { next(err); }
  },

  // Tutor
  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const { resources, total, page, limit } = await resourcesService.listMyResources(req.user!.userId, req.query as any);
      sendPaginated(res, resources, { total, page, limit });
    } catch (err) { next(err); }
  },

  async getMineById(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await resourcesService.getMyResourceById(req.user!.userId, Number(req.params.id)));
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await resourcesService.createResource(req.user!.userId, req.body), { statusCode: 201 });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await resourcesService.updateResource(req.user!.userId, Number(req.params.id), req.body));
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await resourcesService.deleteResource(req.user!.userId, Number(req.params.id));
      res.status(204).end();
    } catch (err) { next(err); }
  },

  // Categories
  async addCategory(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await resourcesService.addCategory(req.user!.userId, Number(req.params.id), Number(req.params.categoryId)), { statusCode: 201 });
    } catch (err) { next(err); }
  },

  async removeCategory(req: Request, res: Response, next: NextFunction) {
    try {
      await resourcesService.removeCategory(req.user!.userId, Number(req.params.id), Number(req.params.categoryId));
      res.status(204).end();
    } catch (err) { next(err); }
  },

  // Moderation log storage
  async addModerationLog(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await resourcesService.addModerationLog(req.user!.userId, Number(req.params.id), req.body), { statusCode: 201 });
    } catch (err) { next(err); }
  },

  async getModerationLogs(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await resourcesService.getModerationLogs(req.user!.userId, Number(req.params.id)));
    } catch (err) { next(err); }
  },

  // Video metadata
  async upsertVideoMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await resourcesService.upsertVideoMetadata(req.user!.userId, Number(req.params.id), req.body));
    } catch (err) { next(err); }
  },

  // Extracted content
  async addExtractedContent(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await resourcesService.addExtractedContent(req.user!.userId, Number(req.params.id), req.body), { statusCode: 201 });
    } catch (err) { next(err); }
  },
};
