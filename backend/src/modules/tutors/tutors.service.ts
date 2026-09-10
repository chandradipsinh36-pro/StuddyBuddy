import { prisma } from '../../config/database';
import {
  NotFoundError, AuthorizationError, ConflictError, BadRequestError,
} from '../../utils/AppError';
import { getPagination } from '../../utils/pagination';
import {
  CreateProfileInput, UpdateProfileInput, CreateSkillInput, UpdateSkillInput, TutorListQuery,
} from './tutors.schema';
import { formatCoursePayload } from '../courses/courses.service';

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

    const formattedTutors = tutors.map(t => {
      const p = t.tutorProfile;
      const skills = t.tutorSkills || [];
      let subjects = skills.map(s => s.skillName).filter(Boolean);
      if (subjects.length === 0) {
        subjects = ['Computer Science', 'Programming', 'General Education'];
      }
      const finalSkills = skills.length > 0 ? skills : subjects.map((s, idx) => ({ skillId: idx + 1, skillName: s, proficiency: 'intermediate' }));
      const expYears = p?.experienceYears && p.experienceYears > 0 ? p.experienceYears : 5;

      return {
        ...t,
        bio: p?.bio || 'Experienced educator dedicated to student success and academic excellence.',
        instituteName: p?.instituteName || 'Affiliated Educational Institution',
        experienceYears: expYears,
        experience: expYears,
        skills: finalSkills,
        subjects,
      };
    });

    return { tutors: formattedTutors, total, page, limit };
  },

  async getTutorById(tutorId: number) {
    const tutor = await prisma.user.findFirst({
      where: { id: tutorId, role: 'tutor' },
      select: {
        id: true, name: true, email: true, profilePic: true, isVerified: true, createdAt: true,
        tutorProfile: true,
        tutorSkills: true,
        tutorApplications: {
          orderBy: { appliedAt: 'desc' },
          take: 1,
          select: { trialVideoUrl: true, status: true },
        },
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

    const profile = tutor.tutorProfile;
    const skills = tutor.tutorSkills || [];
    let skillNames = skills.map(s => s.skillName).filter(Boolean);

    // If no explicit skills, fallback to standard subject areas
    if (skillNames.length === 0) {
      skillNames = ['Computer Science', 'Software Development', 'General Education'];
    }

    const finalSkills = skills.length > 0 ? skills : skillNames.map((s, idx) => ({ skillId: idx + 1, skillName: s, proficiency: 'intermediate' }));
    const latestApp = tutor.tutorApplications?.[0];
    const expYears = profile?.experienceYears && profile.experienceYears > 0 ? profile.experienceYears : 5;

    return {
      ...tutor,
      bio: profile?.bio || 'Experienced educator dedicated to student success and academic excellence.',
      instituteName: profile?.instituteName || 'Affiliated Educational Institution',
      experienceYears: expYears,
      experience: expYears,
      skills: finalSkills,
      subjects: skillNames,
      trialVideoUrl: latestApp?.trialVideoUrl ?? '',
      courses: tutor.courses.map(formatCoursePayload),
    };
  },

  // ── Own profile ──────────────────────────────────────
  async getMyProfile(tutorId: number) {
    const user = await prisma.user.findUnique({
      where: { id: tutorId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profilePic: true,
        isVerified: true,
        createdAt: true,
        tutorProfile: true,
        tutorSkills: {
          select: { skillId: true, skillName: true, proficiency: true },
        },
        tutorApplications: {
          orderBy: { appliedAt: 'desc' },
          take: 1,
          select: {
            applicationId: true,
            status: true,
            trialVideoUrl: true,
            adminNote: true,
            reviewedAt: true,
            appliedAt: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundError('User');

    let profile = user.tutorProfile;
    // Auto-create empty profile if it doesn't exist yet so it's always ready
    if (!profile) {
      profile = await prisma.tutorProfile.create({
        data: { tutorId: user.id, bio: '', instituteName: '', experienceYears: 0 },
      });
    }

    const latestApp = user.tutorApplications[0] ?? null;

    return {
      profileId:         profile.profileId,
      tutorId:           user.id,
      name:              user.name,
      email:             user.email,
      role:              user.role,
      status:            user.status,
      profilePic:        user.profilePic,
      isVerified:        user.isVerified,
      bio:               profile.bio ?? '',
      instituteName:     profile.instituteName ?? '',
      experienceYears:   profile.experienceYears ?? 0,
      trialVideoUrl:     latestApp?.trialVideoUrl ?? '',
      applicationStatus: latestApp ? latestApp.status : (user.isVerified ? 'approved' : 'none'),
      application:       latestApp,
      skills:            user.tutorSkills,
      createdAt:         profile.createdAt,
    };
  },

  async createMyProfile(tutorId: number, input: CreateProfileInput) {
    return this.updateMyProfile(tutorId, input);
  },

  async updateMyProfile(tutorId: number, input: any) {
    const { name, bio, instituteName, experienceYears, trialVideoUrl, skills } = input;

    // 1. Upsert tutorProfile
    await prisma.tutorProfile.upsert({
      where: { tutorId },
      create: {
        tutorId,
        bio: bio ?? '',
        instituteName: instituteName ?? '',
        experienceYears: experienceYears !== undefined ? Number(experienceYears) : 0,
      },
      update: {
        ...(bio !== undefined ? { bio } : {}),
        ...(instituteName !== undefined ? { instituteName } : {}),
        ...(experienceYears !== undefined ? { experienceYears: Number(experienceYears) } : {}),
      },
    });

    // 2. If name provided, update user name
    if (name && typeof name === 'string' && name.trim()) {
      await prisma.user.update({
        where: { id: tutorId },
        data: { name: name.trim() },
      });
    }

    // 3. If trialVideoUrl provided, update or create tutorApplication
    if (trialVideoUrl !== undefined) {
      const existingApp = await prisma.tutorApplication.findFirst({
        where: { userId: tutorId },
        orderBy: { appliedAt: 'desc' },
      });
      if (existingApp) {
        await prisma.tutorApplication.update({
          where: { applicationId: existingApp.applicationId },
          data: { trialVideoUrl },
        });
      } else if (trialVideoUrl) {
        await prisma.tutorApplication.create({
          data: {
            userId: tutorId,
            trialVideoUrl,
            status: 'pending',
          },
        });
      }
    }

    // 4. If skills provided, sync skills
    if (skills !== undefined) {
      const skillList = Array.isArray(skills)
        ? skills
        : typeof skills === 'string'
        ? skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      if (skillList.length > 0) {
        await prisma.tutorSkill.deleteMany({ where: { tutorId } });
        await prisma.tutorSkill.createMany({
          data: skillList.map((skillName: string) => ({
            tutorId,
            skillName,
            proficiency: 'intermediate',
          })),
        });
      }
    }

    return this.getMyProfile(tutorId);
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
