import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';
import { ConflictError, AuthenticationError, NotFoundError } from '../../utils/AppError';
import { RegisterInput, LoginInput } from './auth.schema';
import { saveBase64ToFile } from '../../middleware/resourceUpload';

function omitPassword<T extends { passwordHash: string }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _pw, ...rest } = user;
  return rest;
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('An account with this email already exists');

    const passwordHash = await hashPassword(input.password);
    const isTutor = input.role === 'tutor';

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role as 'student' | 'tutor',
        isVerified: !isTutor, // Students are verified by default; tutors require admin approval
        ...(isTutor && {
          tutorProfile: {
            create: {
              instituteName: input.highestQualification || 'Degree / University',
              bio: input.bio || (input.highestQualification ? `Highest Qualification / Degree: ${input.highestQualification}` : 'Educator on StudyBuddy'),
              experienceYears: input.experienceYears ?? 0,
            },
          },
          ...(input.subjects && input.subjects.length > 0 && {
            tutorSkills: {
              create: input.subjects.map((skillName) => ({
                skillName,
                proficiency: 'intermediate',
              })),
            },
          }),
          tutorApplications: {
            create: {
              trialVideoUrl: input.trialVideoUrl || null,
              status: 'pending',
              ...(input.documentUrl && {
                documents: {
                  create: {
                    documentUrl: saveBase64ToFile(input.documentUrl, 'cert'),
                    documentType: 'qualification_certificate',
                  },
                },
              }),
            },
          },
        }),
      },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { user: omitPassword(user), token };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new AuthenticationError('Invalid email or password');

    if (user.status !== 'active') {
      throw new AuthenticationError(`Your account has been ${user.status}`);
    }

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) throw new AuthenticationError('Invalid email or password');

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { user: omitPassword(user), token };
  },

  async getMe(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');
    return omitPassword(user);
  },
};
