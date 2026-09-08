import { Request, Response, NextFunction } from 'express';
import { tutorsService } from './tutors.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

export const tutorsController = {
  // Public
  async listTutors(req: Request, res: Response, next: NextFunction) {
    try {
      const { tutors, total, page, limit } = await tutorsService.listTutors(req.query as any);
      sendPaginated(res, tutors, { total, page, limit });
    } catch (err) { next(err); }
  },

  async getTutorById(req: Request, res: Response, next: NextFunction) {
    try {
      const tutor = await tutorsService.getTutorById(Number(req.params.id));
      sendSuccess(res, tutor);
    } catch (err) { next(err); }
  },

  // Own profile (tutor-only)
  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await tutorsService.getMyProfile(req.user!.userId);
      sendSuccess(res, profile);
    } catch (err) { next(err); }
  },

  async createMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await tutorsService.createMyProfile(req.user!.userId, req.body);
      sendSuccess(res, profile, { statusCode: 201 });
    } catch (err) { next(err); }
  },

  async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await tutorsService.updateMyProfile(req.user!.userId, req.body);
      sendSuccess(res, profile, { message: 'Profile updated' });
    } catch (err) { next(err); }
  },

  // Skills
  async listMySkills(req: Request, res: Response, next: NextFunction) {
    try {
      const skills = await tutorsService.listMySkills(req.user!.userId);
      sendSuccess(res, skills);
    } catch (err) { next(err); }
  },

  async addSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const skill = await tutorsService.addSkill(req.user!.userId, req.body);
      sendSuccess(res, skill, { statusCode: 201 });
    } catch (err) { next(err); }
  },

  async updateSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const skill = await tutorsService.updateSkill(req.user!.userId, Number(req.params.skillId), req.body);
      sendSuccess(res, skill, { message: 'Skill updated' });
    } catch (err) { next(err); }
  },

  async deleteSkill(req: Request, res: Response, next: NextFunction) {
    try {
      await tutorsService.deleteSkill(req.user!.userId, Number(req.params.skillId));
      res.status(204).end();
    } catch (err) { next(err); }
  },
};
