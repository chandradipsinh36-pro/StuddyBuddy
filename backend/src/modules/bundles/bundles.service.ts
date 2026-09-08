import { prisma } from '../../config/database';
import { NotFoundError, AuthorizationError, ConflictError } from '../../utils/AppError';
import { CreateBundleInput, UpdateBundleInput } from './bundles.schema';

const bundleSelect = {
  bundleId: true, tutorId: true, title: true, description: true,
  price: true, isPublished: true, createdAt: true,
  tutor: { select: { id: true, name: true, profilePic: true } },
  bundleItems: {
    include: { resource: { select: { resourceId: true, filename: true, fileType: true } } },
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
    if (bundle.tutorId !== tutorId) throw new AuthorizationError();
    return bundle;
  },

  async createBundle(tutorId: number, input: CreateBundleInput) {
    return prisma.bundle.create({ data: { tutorId, ...input }, select: bundleSelect });
  },

  async updateBundle(tutorId: number, bundleId: number, input: UpdateBundleInput) {
    const bundle = await prisma.bundle.findUnique({ where: { bundleId } });
    if (!bundle) throw new NotFoundError('Bundle');
    if (bundle.tutorId !== tutorId) throw new AuthorizationError();
    return prisma.bundle.update({ where: { bundleId }, data: input, select: bundleSelect });
  },

  async deleteBundle(tutorId: number, bundleId: number) {
    const bundle = await prisma.bundle.findUnique({ where: { bundleId } });
    if (!bundle) throw new NotFoundError('Bundle');
    if (bundle.tutorId !== tutorId) throw new AuthorizationError();
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
