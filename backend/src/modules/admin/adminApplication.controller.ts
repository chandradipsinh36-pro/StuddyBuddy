import { Request, Response, NextFunction } from 'express';
import { adminApplicationService } from './adminApplication.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { ApplicationQuery, ApproveTutorInput, RejectTutorInput } from './admin.schema';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/AppError';
import { getCloudinaryDownloadUrl } from '../../utils/cloudinary';

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

  async getDocumentDownloadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const docId = parseInt(req.params.docId, 10);
      const doc = await prisma.tutorApplicationDocument.findUnique({
        where: { docId },
      });
      if (!doc) throw new NotFoundError('Tutor application document');

      let downloadUrl = doc.documentUrl;
      if (doc.documentUrl.includes('res.cloudinary.com')) {
        const signedUrl = getCloudinaryDownloadUrl(doc.documentUrl);
        if (signedUrl) {
          downloadUrl = signedUrl;
        }
      } else if (!doc.documentUrl.startsWith('http') && !doc.documentUrl.startsWith('data:')) {
        downloadUrl = `http://localhost:5000${doc.documentUrl.startsWith('/') ? '' : '/'}${doc.documentUrl}`;
      }

      sendSuccess(res, { downloadUrl }, { message: 'Download URL generated successfully' });
    } catch (err) {
      next(err);
    }
  },

  async downloadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const docId = parseInt(req.params.docId, 10);
      const doc = await prisma.tutorApplicationDocument.findUnique({
        where: { docId },
      });
      if (!doc) throw new NotFoundError('Tutor application document');

      if (doc.documentUrl.includes('res.cloudinary.com')) {
        const signedUrl = getCloudinaryDownloadUrl(doc.documentUrl);
        if (signedUrl) {
          return res.redirect(signedUrl);
        }
      }

      if (doc.documentUrl.startsWith('http')) {
        return res.redirect(doc.documentUrl);
      }

      return res.redirect(`http://localhost:5000${doc.documentUrl.startsWith('/') ? '' : '/'}${doc.documentUrl}`);
    } catch (err) {
      next(err);
    }
  },
};

