import { Request, Response, NextFunction } from 'express';
import { adminBundleService } from './adminBundle.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

export const adminBundleController = {
  async listBundles(req: Request, res: Response, next: NextFunction) {
    try {
      const { bundles, total, page, limit } = await adminBundleService.listBundles(req.query);
      sendPaginated(res, bundles, { page, limit, total });
    } catch (err) {
      next(err);
    }
  },

  async getBundleById(req: Request, res: Response, next: NextFunction) {
    try {
      const bundleId = parseInt(req.params.id, 10);
      const bundle = await adminBundleService.getBundleById(bundleId);
      sendSuccess(res, bundle, { message: 'Bundle retrieved successfully' });
    } catch (err) {
      next(err);
    }
  },

  async togglePublish(req: Request, res: Response, next: NextFunction) {
    try {
      const bundleId = parseInt(req.params.id, 10);
      const bundle = await adminBundleService.togglePublish(bundleId);
      sendSuccess(res, bundle, { message: `Bundle ${bundle.isPublished ? 'published' : 'unpublished'} successfully` });
    } catch (err) {
      next(err);
    }
  },

  async updateBundle(req: Request, res: Response, next: NextFunction) {
    try {
      const bundleId = parseInt(req.params.id, 10);
      const bundle = await adminBundleService.updateBundle(bundleId, req.body);
      sendSuccess(res, bundle, { message: 'Bundle updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  async deleteBundle(req: Request, res: Response, next: NextFunction) {
    try {
      const bundleId = parseInt(req.params.id, 10);
      const result = await adminBundleService.deleteBundle(bundleId);
      sendSuccess(res, result, { message: 'Bundle deleted permanently' });
    } catch (err) {
      next(err);
    }
  },
};
