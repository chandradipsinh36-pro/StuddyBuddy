import { prisma } from '../../config/database';
import {
  NotFoundError, AuthorizationError, ConflictError, BadRequestError,
} from '../../utils/AppError';
import { getPagination } from '../../utils/pagination';
import {
  CreateProfileInput, UpdateProfileInput, CreateSkillInput, UpdateSkillInput, TutorListQuery,
} from './tutors.schema';

export const tutorsService = {
  // ── Public ──────────────────────────────────────────
  async listTutors(query: TutorListQuery) {
    const { skip, take, page, limit } = getPagination(query);

    const where = {
      role: 'tutor' as const,
      status: 'active' as const,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { tutorProfile: { bio: { contains: query.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
      ...(query.skill
        ? { tutorSkills: { some: { skillName: { contains: query.skill, mode: 'insensitive' as const } } } }
        : {}),
    };

    const [tutors, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true, name: true, email: true, profilePic: true, isVerified: true, createdAt: true,
          tutorProfile: true,
          tutorSkills: true,
          _count: { select: { tutorReviewsReceived: true, courses: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { tutors, total, page, limit };
  },

  async getTutorById(tutorId: number) {
    const tutor = await prisma.user.findFirst({
      where: { id: tutorId, role: 'tutor' },
      select: {
        id: true, name: true, email: true, profilePic: true, isVerified: true, createdAt: true,
        tutorProfile: true,
        tutorSkills: true,
        courses: { where: { isPublished: true }, take: 10 },
        _count: { select: { tutorReviewsReceived: true, enrollments: true } },
        tutorReviewsReceived: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { student: { select: { id: true, name: true, profilePic: true } } },
        },
      },
    });
    if (!tutor) throw new NotFoundError('Tutor');
    return tutor;
  },

  // ── Own profile ──────────────────────────────────────
  async getMyProfile(tutorId: number) {
    const profile = await prisma.tutorProfile.findUnique({ where: { tutorId } });
    return profile;
  },

  async createMyProfile(tutorId: number, input: CreateProfileInput) {
    const existing = await prisma.tutorProfile.findUnique({ where: { tutorId } });
    if (existing) throw new ConflictError('Tutor profile already exists. Use PATCH to update.');

    // Verify user is actually a tutor
    const user = await prisma.user.findUnique({ where: { id: tutorId } });
    if (!user || user.role !== 'tutor') throw new AuthorizationError('Only tutors can create a tutor profile');

    return prisma.tutorProfile.create({
      data: { tutorId, ...input },
    });
  },

  async updateMyProfile(tutorId: number, input: UpdateProfileInput) {
    const profile = await prisma.tutorProfile.findUnique({ where: { tutorId } });
    if (!profile) throw new NotFoundError('Tutor profile');

    return prisma.tutorProfile.update({
      where: { tutorId },
      data: input,
    });
  },

  // ── Skills ───────────────────────────────────────────
  async listMySkills(tutorId: number) {
    return prisma.tutorSkill.findMany({ where: { tutorId } });
  },

  async addSkill(tutorId: number, input: CreateSkillInput) {
    return prisma.tutorSkill.create({ data: { tutorId, ...input } });
  },

  async updateSkill(tutorId: number, skillId: number, input: UpdateSkillInput) {
    const skill = await prisma.tutorSkill.findUnique({ where: { skillId } });
    if (!skill) throw new NotFoundError('Skill');
    if (skill.tutorId !== tutorId) throw new AuthorizationError();

    return prisma.tutorSkill.update({ where: { skillId }, data: input });
  },

  async deleteSkill(tutorId: number, skillId: number) {
    const skill = await prisma.tutorSkill.findUnique({ where: { skillId } });
    if (!skill) throw new NotFoundError('Skill');
    if (skill.tutorId !== tutorId) throw new AuthorizationError();

    await prisma.tutorSkill.delete({ where: { skillId } });
  },
};
