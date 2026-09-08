import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/hash';
import { NotFoundError, AuthenticationError } from '../../utils/AppError';
import { UpdateProfileInput, ChangePasswordInput } from './users.schema';

function omitPassword<T extends { passwordHash: string }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _pw, ...rest } = user;
  return rest;
}

export const usersService = {
  async getMe(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');
    return omitPassword(user);
  },

  async updateMe(userId: number, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.profilePic !== undefined && { profilePic: input.profilePic }),
      },
    });
    return omitPassword(user);
  },

  async changePassword(userId: number, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    const valid = await comparePassword(input.currentPassword, user.passwordHash);
    if (!valid) throw new AuthenticationError('Current password is incorrect');

    const newHash = await hashPassword(input.newPassword);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
    return omitPassword(updated);
  },
};
