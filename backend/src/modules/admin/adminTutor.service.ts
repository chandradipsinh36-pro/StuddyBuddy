import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { getPagination } from '../../utils/pagination';
import { NotFoundError } from '../../utils/AppError';
import { TutorQuery } from './admin.schema';

// Whitelist for sort
const SORT_MAP: Record<string, string> = {
  created_at: 'createdAt',
  name:       'name',
  email:      'email',
};

export const adminTutorService = {
  // ── List tutors ───────────────────────────────────────────────────
  async listTutors(query: TutorQuery) {
    const { skip, take, page, limit } = getPagination(query);

    const sortField = SORT_MAP[query.sortBy] ?? 'createdAt';
    const orderBy = { [sortField]: query.sortOrder } as Prisma.UserOrderByWithRelationInput;

    const where: Prisma.UserWhereInput = {
      role: 'tutor',
      ...(query.status   && { status: query.status }),
      ...(query.verified !== undefined && { isVerified: query.verified === 'true' }),
      ...(query.search   && {
        OR: [
          { name:  { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      // Filter by latest application status
      ...(query.applicationStatus && {
        tutorApplications: {
          some: { status: query.applicationStatus },
        },
      }),
    };

    const [tutors, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id:         true,
          name:       true,
          email:      true,
          profilePic: true,
          status:     true,
          isVerified: true,
          createdAt:  true,
          tutorProfile: {
            select: {
              instituteName: true, experienceYears: true, bio: true,
            },
          },
          tutorSkills: {
            select: { skillName: true, proficiency: true },
          },
          tutorApplications: {
            orderBy: { appliedAt: 'desc' },
            take: 1,
            select: {
              applicationId: true, status: true, appliedAt: true, reviewedAt: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { tutors, total, page, limit };
  },

  // ── Get tutor by ID ───────────────────────────────────────────────
  async getTutorById(tutorId: number) {
    const tutor = await prisma.user.findFirst({
      where: { id: tutorId, role: 'tutor' },
      select: {
        id:         true,
        name:       true,
        email:      true,
        profilePic: true,
        role:       true,
        status:     true,
        isVerified: true,
        createdAt:  true,
        tutorProfile: {
          select: {
            profileId: true, bio: true,
            instituteName: true, experienceYears: true, createdAt: true,
          },
        },
        tutorSkills: {
          select: { skillId: true, skillName: true, proficiency: true },
        },
        tutorApplications: {
          orderBy: { appliedAt: 'desc' },
          select: {
            applicationId: true,
            status:        true,
            trialVideoUrl: true,
            adminNote:     true,
            reviewedBy:    true,
            reviewedAt:    true,
            appliedAt:     true,
            documents: {
              select: {
                docId:        true,
                documentUrl:  true,
                documentType: true,
                uploadedAt:   true,
              },
            },
          },
        },
        _count: {
          select: {
            courses:      true,
            courseReviews: true,
            enrollments:  true,
          },
        },
      },
    });

    if (!tutor) throw new NotFoundError('Tutor');
    return tutor;
  },
};
