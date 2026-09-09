import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { getPagination } from '../../utils/pagination';
import { logger } from '../../utils/logger';
import {
  NotFoundError, ConflictError, BadRequestError,
} from '../../utils/AppError';
import { ApplicationQuery, ApproveTutorInput, RejectTutorInput } from './admin.schema';

// Statuses that represent a final/reviewed state
const REVIEWED_STATUSES = ['approved', 'rejected'] as const;

// Sort whitelist
const SORT_MAP: Record<string, string> = {
  applied_at:  'appliedAt',
  reviewed_at: 'reviewedAt',
};

export const adminApplicationService = {
  // ── List applications ─────────────────────────────────────────────
  async listApplications(query: ApplicationQuery) {
    const { skip, take, page, limit } = getPagination(query);

    const sortField = SORT_MAP[query.sortBy] ?? 'appliedAt';
    const orderBy = { [sortField]: query.sortOrder } as Prisma.TutorApplicationOrderByWithRelationInput;

    const where: Prisma.TutorApplicationWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.search && {
        user: {
          OR: [
            { name:  { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const [applications, total] = await prisma.$transaction([
      prisma.tutorApplication.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          applicationId: true,
          status:        true,
          trialVideoUrl: true,
          adminNote:     true,
          reviewedAt:    true,
          appliedAt:     true,
          user: {
            select: {
              id:         true,
              name:       true,
              email:      true,
              profilePic: true,
              tutorProfile: {
                select: { bio: true, instituteName: true, experienceYears: true },
              },
              tutorSkills: {
                select: { skillId: true, skillName: true, proficiency: true },
              },
            },
          },
          reviewer: {
            select: { id: true, name: true, email: true },
          },
          _count: { select: { documents: true } },
        },
      }),
      prisma.tutorApplication.count({ where }),
    ]);

    return { applications, total, page, limit };
  },

  // ── Get application by ID ─────────────────────────────────────────
  async getApplicationById(applicationId: number) {
    const application = await prisma.tutorApplication.findUnique({
      where: { applicationId },
      select: {
        applicationId: true,
        status:        true,
        trialVideoUrl: true,
        adminNote:     true,
        reviewedAt:    true,
        appliedAt:     true,
        user: {
          select: {
            id:         true,
            name:       true,
            email:      true,
            profilePic: true,
            tutorProfile: {
              select: {
                bio: true, instituteName: true, experienceYears: true,
              },
            },
            tutorSkills: {
              select: { skillName: true, proficiency: true },
            },
          },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
        documents: {
          select: {
            docId:        true,
            documentUrl:  true,
            documentType: true,
            uploadedAt:   true,
          },
        },
      },
    });

    if (!application) throw new NotFoundError('Tutor application');
    return application;
  },

  // ── Approve application ───────────────────────────────────────────
  async approveApplication(adminId: number, applicationId: number, input: ApproveTutorInput) {
    // Use a transaction to ensure atomicity (handles concurrent reviews)
    return prisma.$transaction(async (tx) => {
      // Fetch with status check inside the transaction
      const application = await tx.tutorApplication.findUnique({
        where: { applicationId },
        select: {
          applicationId: true,
          status: true,
          userId: true,
          user: {
            select: { id: true, name: true, email: true, status: true, role: true },
          },
        },
      });

      if (!application) throw new NotFoundError('Tutor application');

      // Prevent double-review (concurrency guard)
      if (REVIEWED_STATUSES.includes(application.status as typeof REVIEWED_STATUSES[number])) {
        throw new ConflictError('APPLICATION_ALREADY_REVIEWED');
      }

      const applicant = application.user;

      if (applicant.status === 'banned') {
        throw new BadRequestError('Cannot approve application for a banned user');
      }

      // 1. Update application status
      const updatedApp = await tx.tutorApplication.update({
        where: { applicationId },
        data: {
          status:     'approved',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          adminNote:  input.admin_note ?? null,
        },
      });

      // 2. Ensure user has tutor role
      if (applicant.role !== 'tutor') {
        await tx.user.update({
          where: { id: applicant.id },
          data:  { role: 'tutor' },
        });
      }

      // 3. Mark user as verified (approved tutor)
      await tx.user.update({
        where: { id: applicant.id },
        data:  { isVerified: true },
      });

      // 4. Ensure tutor profile exists
      const profileExists = await tx.tutorProfile.findUnique({
        where: { tutorId: applicant.id },
      });
      if (!profileExists) {
        await tx.tutorProfile.create({
          data: { tutorId: applicant.id },
        });
      }

      logger.info({
        event:         'admin:application:approve',
        adminId,
        applicationId,
        applicantId:   applicant.id,
      });

      return updatedApp;
    });

    return this.getApplicationById(applicationId);
  },

  // ── Reject application ────────────────────────────────────────────
  async rejectApplication(adminId: number, applicationId: number, input: RejectTutorInput) {
    await prisma.$transaction(async (tx) => {
      const application = await tx.tutorApplication.findUnique({
        where: { applicationId },
        select: {
          applicationId: true,
          status: true,
          userId: true,
        },
      });

      if (!application) throw new NotFoundError('Tutor application');

      // Prevent double-review
      if (REVIEWED_STATUSES.includes(application.status as typeof REVIEWED_STATUSES[number])) {
        throw new ConflictError('APPLICATION_ALREADY_REVIEWED');
      }

      await tx.tutorApplication.update({
        where: { applicationId },
        data: {
          status:     'rejected',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          adminNote:  input.admin_note,
        },
      });

      logger.info({
        event:         'admin:application:reject',
        adminId,
        applicationId,
        applicantId:   application.userId,
      });
    });

    return this.getApplicationById(applicationId);
  },
};
