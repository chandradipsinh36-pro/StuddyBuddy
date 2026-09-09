import { prisma } from '../../config/database';
import { NotFoundError, AuthorizationError, ConflictError, BadRequestError } from '../../utils/AppError';
import { CreateBundleInput, UpdateBundleInput } from './bundles.schema';

const bundleSelect = {
  bundleId: true, tutorId: true, title: true, description: true,
  price: true, isPublished: true, createdAt: true,
  tutor: { select: { id: true, name: true, profilePic: true } },
  bundleItems: {
    include: {
      resource: {
        select: {
          resourceId: true,
          filename: true,
          fileType: true,
          fileUrl: true,
          price: true,
          isLocked: true,
          moderationNotes: true,
        },
      },
    },
  },
};

export const bundlesService = {
  // Public
  async listBundles() {
    return prisma.bundle.findMany({
      where: { isPublished: true },
      select: bundleSelect,
      orderBy: { createdAt: 'desc' },
    });
  },

  async getBundleById(bundleId: number) {
    const bundle = await prisma.bundle.findFirst({
      where: { bundleId, isPublished: true },
      select: bundleSelect,
    });
    if (!bundle) throw new NotFoundError('Bundle');
    return bundle;
  },

  // Tutor CRUD
  async listMyBundles(tutorId: number) {
    return prisma.bundle.findMany({ where: { tutorId }, select: bundleSelect, orderBy: { createdAt: 'desc' } });
  },

  async getMyBundleById(tutorId: number, bundleId: number) {
    const bundle = await prisma.bundle.findUnique({ where: { bundleId }, select: bundleSelect });
    if (!bundle) throw new NotFoundError('Bundle');
    const user = await prisma.user.findUnique({ where: { id: tutorId } });
    const isAllowed = bundle.tutorId === tutorId || user?.role === 'admin' || process.env.NODE_ENV !== 'production';
    if (!isAllowed) throw new AuthorizationError();
    return bundle;
  },

  async createBundle(tutorId: number, input: CreateBundleInput) {
    const user = await prisma.user.findUnique({ where: { id: tutorId } });
    if (!user || (user.role !== 'tutor' && user.role !== 'admin')) {
      throw new AuthorizationError('Only tutors can create bundles');
    }
    if (!user.isVerified && process.env.NODE_ENV === 'production') {
      throw new BadRequestError('Your tutor application is currently pending admin approval. You can only create bundles after your application is approved.');
    }

    const { resourceIds, ...data } = input;

    // Filter only existing resource IDs to prevent foreign key errors
    let validResourceIds: number[] = [];
    if (resourceIds && resourceIds.length > 0) {
      const existing = await prisma.resource.findMany({
        where: { resourceId: { in: resourceIds } },
        select: { resourceId: true },
      });
      validResourceIds = existing.map(r => r.resourceId);
    }

    return prisma.bundle.create({
      data: {
        tutorId,
        ...data,
        isPublished: true,
        bundleItems: validResourceIds.length > 0 ? {
          create: validResourceIds.map(resourceId => ({ resourceId })),
        } : undefined,
      },
      select: bundleSelect,
    });
  },

  async updateBundle(tutorId: number, bundleId: number, input: UpdateBundleInput) {
    const bundle = await prisma.bundle.findUnique({ where: { bundleId } });
    if (!bundle) throw new NotFoundError('Bundle');
    
    // In development or if user is owner/admin, allow update
    const user = await prisma.user.findUnique({ where: { id: tutorId } });
    const isAllowed = bundle.tutorId === tutorId || user?.role === 'admin' || process.env.NODE_ENV !== 'production';
    if (!isAllowed) throw new AuthorizationError();

    const { resourceIds, ...data } = input;

    if (resourceIds !== undefined) {
      await prisma.bundleItem.deleteMany({ where: { bundleId } });
      if (resourceIds.length > 0) {
        const existing = await prisma.resource.findMany({
          where: { resourceId: { in: resourceIds } },
          select: { resourceId: true },
        });
        const validIds = existing.map(r => r.resourceId);
        if (validIds.length > 0) {
          await prisma.bundleItem.createMany({
            data: validIds.map(resourceId => ({ bundleId, resourceId })),
          });
        }
      }
    }

    return prisma.bundle.update({ where: { bundleId }, data, select: bundleSelect });
  },

  async deleteBundle(tutorId: number, bundleId: number) {
    const bundle = await prisma.bundle.findUnique({ where: { bundleId } });
    if (!bundle) throw new NotFoundError('Bundle');

    const user = await prisma.user.findUnique({ where: { id: tutorId } });
    const isAllowed = bundle.tutorId === tutorId || user?.role === 'admin' || process.env.NODE_ENV !== 'production';
    if (!isAllowed) throw new AuthorizationError();

    await prisma.bundle.delete({ where: { bundleId } });
  },

  async addResource(tutorId: number, bundleId: number, resourceId: number) {
    const bundle = await prisma.bundle.findUnique({ where: { bundleId } });
    if (!bundle) throw new NotFoundError('Bundle');
    if (bundle.tutorId !== tutorId) throw new AuthorizationError();

    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.uploadedBy !== tutorId) throw new AuthorizationError('You can only add your own resources');

    return prisma.bundleItem.create({ data: { bundleId, resourceId } });
  },

  async removeResource(tutorId: number, bundleId: number, resourceId: number) {
    const bundle = await prisma.bundle.findUnique({ where: { bundleId } });
    if (!bundle) throw new NotFoundError('Bundle');
    if (bundle.tutorId !== tutorId) throw new AuthorizationError();

    await prisma.bundleItem.delete({
      where: { bundleId_resourceId: { bundleId, resourceId } },
    });
  },
};
