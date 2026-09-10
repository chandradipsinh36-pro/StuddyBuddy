import { Request, Response, NextFunction } from 'express';
import { adminResourceService } from './adminResource.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

export const adminResourceController = {
  async listResources(req: Request, res: Response, next: NextFunction) {
    try {
      const { resources, total, page, limit } = await adminResourceService.listResources(req.query);
      sendPaginated(res, resources, { page, limit, total });
    } catch (err) {
      next(err);
    }
  },

  async getResourceById(req: Request, res: Response, next: NextFunction) {
    try {
      const resourceId = parseInt(req.params.id, 10);
      const resource = await adminResourceService.getResourceById(resourceId);
      sendSuccess(res, resource, { message: 'Resource retrieved successfully' });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const resourceId = parseInt(req.params.id, 10);
      const { status, notes } = req.body;
      const resource = await adminResourceService.updateStatus(resourceId, status, notes);
      sendSuccess(res, resource, { message: `Resource status updated to ${status}` });
    } catch (err) {
      next(err);
    }
  },

  async toggleLock(req: Request, res: Response, next: NextFunction) {
    try {
      const resourceId = parseInt(req.params.id, 10);
      const resource = await adminResourceService.toggleLock(resourceId);
      sendSuccess(res, resource, { message: `Resource is now ${resource.isLocked ? 'locked (premium)' : 'unlocked (free)'}` });
    } catch (err) {
      next(err);
    }
  },

  async updateResource(req: Request, res: Response, next: NextFunction) {
    try {
      const resourceId = parseInt(req.params.id, 10);
      const resource = await adminResourceService.updateResource(resourceId, req.body);
      sendSuccess(res, resource, { message: 'Resource updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  async deleteResource(req: Request, res: Response, next: NextFunction) {
    try {
      const resourceId = parseInt(req.params.id, 10);
      const result = await adminResourceService.deleteResource(resourceId);
      sendSuccess(res, result, { message: 'Resource deleted permanently' });
    } catch (err) {
      next(err);
    }
  },
};
