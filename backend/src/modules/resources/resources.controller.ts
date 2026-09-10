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
      sendSuccess(res, await resourcesService.getById(Number(req.params.id), req.user));
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
      const body = req.body || {};
      const file = req.file;

      const title = (body.title || body.filename || file?.originalname || 'Educational Resource').trim();
      const rawType = body.type || body.fileType;
      const validTypes = ['pdf', 'image', 'ppt', 'audio', 'youtube', 'test_paper'];
      let fileType: any = 'pdf';
      if (rawType && validTypes.includes(rawType)) {
        fileType = rawType;
      } else if (file) {
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') fileType = 'pdf';
        else if (['ppt', 'pptx'].includes(ext || '')) fileType = 'ppt';
        else if (['doc', 'docx'].includes(ext || '')) fileType = 'test_paper';
        else if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext || '')) fileType = 'youtube';
        else if (['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext || '')) fileType = 'audio';
        else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '')) fileType = 'image';
      }

      const isLocked = body.accessType === 'premium' || body.isLocked === 'true' || body.isLocked === true;
      const price = isLocked ? Number(body.price || 0) : 0;

      let fileUrl = body.fileUrl;
      if (file) {
        fileUrl = `/resources/${file.filename}`;
      }

      // Metadata object storing all details (title, description, subject, category, difficulty, etc.)
      const metaObj = {
        title,
        description: body.description || '',
        subject: body.subject || '',
        category: body.category || '',
        difficulty: body.difficulty || 'intermediate',
        originalFilename: file?.originalname || title,
        fileSize: file?.size,
        savedFilename: file?.filename,
      };

      const resource = await resourcesService.createResource(req.user!.userId, {
        filename: title,
        fileType,
        fileUrl,
        isLocked,
        price,
        courseId: body.courseId ? Number(body.courseId) : undefined,
        status: 'published',
        moderationNotes: JSON.stringify(metaObj),
        categoryName: body.category,
      });

      sendSuccess(res, resource, { statusCode: 201 });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await resourcesService.updateResource(req.user!.userId, Number(req.params.id), req.body, req.file));
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
