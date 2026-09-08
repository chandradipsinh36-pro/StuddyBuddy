import { prisma } from '../../config/database';
import {
  NotFoundError, AuthorizationError, ConflictError, BadRequestError,
} from '../../utils/AppError';
import {
  CreateApplicationInput, UpdateApplicationInput, AddDocumentInput,
} from './tutor-applications.schema';

// Fields tutor cannot modify once under review/approved
const IMMUTABLE_STATUSES = ['approved', 'rejected'] as const;

export const tutorApplicationsService = {
  async createApplication(userId: number, input: CreateApplicationInput) {
    // User must be a tutor
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'tutor') throw new AuthorizationError('Only tutors can submit applications');

    // No duplicate pending/under_review applications
    const existing = await prisma.tutorApplication.findFirst({
      where: { userId, status: { in: ['pending', 'under_review'] } },
    });
    if (existing) throw new ConflictError('You already have a pending application');

    return prisma.tutorApplication.create({
      data: { userId, trialVideoUrl: input.trialVideoUrl },
      include: { documents: true },
    });
  },

  async getMyApplication(userId: number) {
    const application = await prisma.tutorApplication.findFirst({
      where: { userId },
      orderBy: { appliedAt: 'desc' },
      include: { documents: true },
    });
    if (!application) throw new NotFoundError('Application');
    return application;
  },

  async updateMyApplication(userId: number, input: UpdateApplicationInput) {
    const application = await prisma.tutorApplication.findFirst({
      where: { userId },
      orderBy: { appliedAt: 'desc' },
    });
    if (!application) throw new NotFoundError('Application');

    // Cannot modify once approved/rejected — admin-only fields
    if (IMMUTABLE_STATUSES.includes(application.status as any)) {
      throw new BadRequestError(`Cannot modify a ${application.status} application`);
    }

    return prisma.tutorApplication.update({
      where: { applicationId: application.applicationId },
      data: {
        // Tutor can only update trial video URL
        ...(input.trialVideoUrl !== undefined && { trialVideoUrl: input.trialVideoUrl }),
      },
      include: { documents: true },
    });
  },

  // Documents
  async addDocument(userId: number, input: AddDocumentInput) {
    const application = await prisma.tutorApplication.findFirst({
      where: { userId },
      orderBy: { appliedAt: 'desc' },
    });
    if (!application) throw new NotFoundError('Application');
    if (IMMUTABLE_STATUSES.includes(application.status as any)) {
      throw new BadRequestError(`Cannot add documents to a ${application.status} application`);
    }

    return prisma.tutorApplicationDocument.create({
      data: {
        applicationId: application.applicationId,
        documentUrl: input.documentUrl,
        documentType: input.documentType,
      },
    });
  },

  async listDocuments(userId: number) {
    const application = await prisma.tutorApplication.findFirst({
      where: { userId },
      orderBy: { appliedAt: 'desc' },
    });
    if (!application) throw new NotFoundError('Application');

    return prisma.tutorApplicationDocument.findMany({
      where: { applicationId: application.applicationId },
    });
  },

  async deleteDocument(userId: number, docId: number) {
    const doc = await prisma.tutorApplicationDocument.findUnique({ where: { docId } });
    if (!doc) throw new NotFoundError('Document');

    // Verify ownership
    const application = await prisma.tutorApplication.findUnique({
      where: { applicationId: doc.applicationId },
    });
    if (!application || application.userId !== userId) throw new AuthorizationError();
    if (IMMUTABLE_STATUSES.includes(application.status as any)) {
      throw new BadRequestError(`Cannot delete documents from a ${application.status} application`);
    }

    await prisma.tutorApplicationDocument.delete({ where: { docId } });
  },
};
