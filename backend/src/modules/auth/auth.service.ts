import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { hashPassword, comparePassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';
import { ConflictError, AuthenticationError, NotFoundError, AppError } from '../../utils/AppError';
import { RegisterInput, LoginInput, GoogleAuthInput } from './auth.schema';
import { saveBase64ToFile } from '../../middleware/resourceUpload';

function omitPassword<T extends { passwordHash: string }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _pw, ...rest } = user;
  return rest;
}

interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

const googleClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

async function resolveGoogleUser(input: GoogleAuthInput): Promise<GoogleUserInfo> {
  // 1. GIS ID token (credential)
  if (input.credential) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: input.credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (payload && payload.email) {
        return {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          picture: payload.picture,
          sub: payload.sub,
        };
      }
    } catch {
      // Fallback: Verify directly with Google tokeninfo endpoint
      try {
        const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(input.credential)}`);
        if (resp.ok) {
          const data = await resp.json() as any;
          if (data && data.email) {
            return {
              email: data.email,
              name: data.name || data.email.split('@')[0],
              picture: data.picture,
              sub: data.sub,
            };
          }
        }
      } catch { /* ignore fallback error and throw below */ }
      throw new AuthenticationError('Invalid Google credential token');
    }
  }

  // 2. Authorization code
  if (input.code) {
    try {
      const { tokens } = await googleClient.getToken(input.code);
      if (tokens.id_token) {
        const ticket = await googleClient.verifyIdToken({
          idToken: tokens.id_token,
          audience: env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          return {
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture,
            sub: payload.sub,
          };
        }
      }
      if (tokens.access_token) {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (userinfoRes.ok) {
          const data = await userinfoRes.json() as any;
          if (data && data.email) {
            return {
              email: data.email,
              name: data.name || data.email.split('@')[0],
              picture: data.picture,
              sub: data.sub,
            };
          }
        }
      }
    } catch (err: any) {
      throw new AuthenticationError(err.message || 'Failed to exchange Google authorization code');
    }
  }

  // 3. Access token
  if (input.accessToken) {
    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${input.accessToken}` },
      });
      if (userinfoRes.ok) {
        const data = await userinfoRes.json() as any;
        if (data && data.email) {
          return {
            email: data.email,
            name: data.name || data.email.split('@')[0],
            picture: data.picture,
            sub: data.sub,
          };
        }
      }
    } catch (err: any) {
      throw new AuthenticationError(err.message || 'Failed to fetch Google user profile');
    }
  }

  throw new AuthenticationError('No valid Google credentials provided');
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('An account with this email already exists');

    const passwordHash = await hashPassword(input.password);
    const isTutor = input.role === 'tutor';
    const uploadedDocUrl = isTutor && input.documentUrl ? await saveBase64ToFile(input.documentUrl, 'cert') : null;

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
          ...((input.trialVideoUrl || uploadedDocUrl) ? {
            tutorApplications: {
              create: {
                trialVideoUrl: input.trialVideoUrl || null,
                status: 'pending',
                ...(uploadedDocUrl && {
                  documents: {
                    create: {
                      documentUrl: uploadedDocUrl,
                      documentType: 'qualification_certificate',
                    },
                  },
                }),
              },
            },
          } : {}),
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

  async googleAuth(input: GoogleAuthInput) {
    const googleUser = await resolveGoogleUser(input);
    const normalizedEmail = googleUser.email.toLowerCase().trim();

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      if (input.mode === 'login') {
        throw new AppError('This account is not registered with Google. Register now.', 404, 'ACCOUNT_NOT_REGISTERED');
      }

      // Register new user via Google
      const randomPassword = crypto.randomBytes(24).toString('hex');
      const passwordHash = await hashPassword(randomPassword);
      const isTutor = input.role === 'tutor';

      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: normalizedEmail,
          passwordHash,
          role: isTutor ? 'tutor' : 'student',
          status: 'active',
          profilePic: googleUser.picture || null,
          isVerified: !isTutor,
          ...(isTutor && {
            tutorProfile: {
              create: {
                instituteName: '',
                bio: `Tutor profile for ${googleUser.name}`,
                experienceYears: 0,
              },
            },
          }),
        },
      });
    } else {
      if (input.mode === 'register') {
        throw new AppError(
          'An account with this email already exists. Please log in instead.',
          409,
          'ACCOUNT_ALREADY_EXISTS'
        );
      }

      if (user.status !== 'active') {
        throw new AuthenticationError(`Your account has been ${user.status}`);
      }

      // If logging in specifically as a tutor, verify user is registered as a tutor
      if (input.mode === 'login' && input.role === 'tutor' && user.role !== 'tutor') {
        throw new AppError('This account is registered as a student, not as a tutor. Register now.', 404, 'ACCOUNT_NOT_REGISTERED');
      }

      // Update full name and profile picture from Google account
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: googleUser.name || user.name,
          profilePic: googleUser.picture || user.profilePic,
        },
      });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { user: omitPassword(user), token };
  },

  async getMe(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');
    return omitPassword(user);
  },
};

