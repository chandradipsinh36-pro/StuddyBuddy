import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { getPagination } from '../../utils/pagination';
import { NotFoundError } from '../../utils/AppError';
import { TutorQuery } from './admin.schema';
import { tutorEarningsService } from '../tutors/tutor-earnings.service';
import { formatCoursePayload } from '../courses/courses.service';

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

    // Fetch tutor courses
    const courses = await prisma.course.findMany({
      where: { tutorId },
      include: {
        category: { select: { categoryId: true, name: true } },
        _count: { select: { enrollments: true, reviews: true, resources: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch tutor resources
    const resources = await prisma.resource.findMany({
      where: { uploadedBy: tutorId },
      include: {
        resourceCategories: { include: { category: { select: { categoryId: true, name: true } } } },
        course: { select: { courseId: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch tutor bundles
    const bundles = await prisma.bundle.findMany({
      where: { tutorId },
      include: {
        bundleItems: {
          include: {
            resource: {
              select: { resourceId: true, filename: true, fileType: true, price: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch tutor earnings summary and transactions
    let earnings: any = null;
    try {
      const summary = await tutorEarningsService.getSummary(tutorId);
      const transactions = await tutorEarningsService.getTransactions(tutorId);
      earnings = {
        ...summary,
        transactions,
      };
    } catch (e) {
      console.warn('Could not compute tutor earnings for admin:', e);
    }

    return {
      ...tutor,
      courses: courses.map(formatCoursePayload),
      resources,
      bundles,
      earnings,
    };
  },

  // ── Course Management ──────────────────────────────────────────────
  async updateCourseStatus(courseId: number, isPublished: boolean) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) throw new NotFoundError('Course');
    return prisma.course.update({
      where: { courseId },
      data: { isPublished },
    });
  },

  async deleteCourse(courseId: number) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) throw new NotFoundError('Course');
    return prisma.course.delete({ where: { courseId } });
  },

  // ── Resource Management ────────────────────────────────────────────
  async updateResourceStatus(resourceId: number, status: string) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    return prisma.resource.update({
      where: { resourceId },
      data: { status: status as any },
    });
  },

  async deleteResource(resourceId: number) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    return prisma.resource.delete({ where: { resourceId } });
  },

  // ── Bundle Management ──────────────────────────────────────────────
  async updateBundleStatus(bundleId: number, isPublished: boolean) {
    const bundle = await prisma.bundle.findUnique({ where: { bundleId } });
    if (!bundle) throw new NotFoundError('Bundle');
    return prisma.bundle.update({
      where: { bundleId },
      data: { isPublished },
    });
  },

  async deleteBundle(bundleId: number) {
    const bundle = await prisma.bundle.findUnique({ where: { bundleId } });
    if (!bundle) throw new NotFoundError('Bundle');
    return prisma.bundle.delete({ where: { bundleId } });
  },
};
