import { Request, Response, NextFunction } from 'express';
import { adminUserService } from './adminUser.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { UserQuery, SuspendUserInput, BanUserInput } from './admin.schema';

export const adminUserController = {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as UserQuery;
      const { users, total, page, limit } = await adminUserService.listUsers(query);
      sendPaginated(res, users, { page, limit, total });
    } catch (err) {
      next(err);
    }
  },

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await adminUserService.getUserById(id);
      sendSuccess(res, data, { message: 'User retrieved successfully' });
    } catch (err) {
      next(err);
    }
  },

  async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const targetId = parseInt(req.params.id, 10);
      const input = req.body as SuspendUserInput;
      const data = await adminUserService.suspendUser(adminId, targetId, input);
      sendSuccess(res, data, { message: 'User suspended successfully' });
    } catch (err) {
      next(err);
    }
  },

  async banUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const targetId = parseInt(req.params.id, 10);
      const input = req.body as BanUserInput;
      const data = await adminUserService.banUser(adminId, targetId, input);
      sendSuccess(res, data, { message: 'User banned successfully' });
    } catch (err) {
      next(err);
    }
  },

  async reactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const targetId = parseInt(req.params.id, 10);
      const data = await adminUserService.reactivateUser(adminId, targetId);
      sendSuccess(res, data, { message: 'User reactivated successfully' });
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const targetId = parseInt(req.params.id, 10);
      const data = await adminUserService.deleteUser(adminId, targetId);
      sendSuccess(res, data, { message: 'User deleted successfully' });
    } catch (err) {
      next(err);
    }
  },
};
