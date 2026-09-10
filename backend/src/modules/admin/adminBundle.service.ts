import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/AppError';
import { getPagination } from '../../utils/pagination';

export function formatAdminBundle(bundle: any) {
  if (!bundle) return bundle;
  const completedPayments = (bundle.payments || []).filter((p: any) => p.status === 'success');
  const revenue = completedPayments.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);

  return {
    ...bundle,
    resourcesCount: bundle.bundleItems?.length || 0,
    salesCount: completedPayments.length,
    revenue,
  };
}

export const adminBundleService = {
  async listBundles(query: any = {}) {
    const { skip, take, page, limit } = getPagination(query);

    const where: Prisma.BundleWhereInput = {
      ...(query.isPublished !== undefined && query.isPublished !== 'all' && {
        isPublished: query.isPublished === 'true' || query.isPublished === true,
      }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { tutor: { name: { contains: query.search, mode: 'insensitive' } } },
          { tutor: { email: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [sortField]: sortOrder } as Prisma.BundleOrderByWithRelationInput;

    const [bundles, total] = await Promise.all([
      prisma.bundle.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          tutor: {
            select: { id: true, name: true, email: true, profilePic: true },
          },
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
                  status: true,
                },
              },
            },
          },
          payments: {
            select: { paymentId: true, status: true, amount: true },
          },
        },
      }),
      prisma.bundle.count({ where }),
    ]);

    return {
      bundles: bundles.map(formatAdminBundle),
      total,
      page,
      limit,
    };
  },

  async getBundleById(bundleId: number) {
    const bundle = await prisma.bundle.findUnique({
      where: { bundleId },
      include: {
        tutor: {
          select: { id: true, name: true, email: true, profilePic: true, isVerified: true },
        },
        bundleItems: {
          include: {
            resource: true,
          },
        },
        payments: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!bundle) throw new NotFoundError('Bundle');
    return formatAdminBundle(bundle);
  },

  async togglePublish(bundleId: number) {
    const bundle = await prisma.bundle.findUnique({ where: { bundleId } });
    if (!bundle) throw new NotFoundError('Bundle');

    const updated = await prisma.bundle.update({
      where: { bundleId },
      data: { isPublished: !bundle.isPublished },
      include: {
        tutor: {
          select: { id: true, name: true, email: true, profilePic: true },
        },
        bundleItems: {
          include: {
            resource: true,
          },
        },
      },
    });

    return formatAdminBundle(updated);
  },

  async updateBundle(bundleId: number, data: any) {
    const existing = await prisma.bundle.findUnique({ where: { bundleId } });
    if (!existing) throw new NotFoundError('Bundle');

    const updated = await prisma.bundle.update({
      where: { bundleId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.originalPrice !== undefined && { originalPrice: data.originalPrice }),
        ...(data.discountPercent !== undefined && { discountPercent: Number(data.discountPercent) }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
      include: {
        tutor: {
          select: { id: true, name: true, email: true, profilePic: true },
        },
        bundleItems: {
          include: {
            resource: true,
          },
        },
      },
    });

    return formatAdminBundle(updated);
  },

  async deleteBundle(bundleId: number) {
    const bundle = await prisma.bundle.findUnique({ where: { bundleId } });
    if (!bundle) throw new NotFoundError('Bundle');

    await prisma.$transaction(async (tx) => {
      await tx.bundleItem.deleteMany({ where: { bundleId } });
      await tx.payment.deleteMany({ where: { bundleId } });
      await tx.bundle.delete({ where: { bundleId } });
    });

    return { message: 'Bundle deleted successfully', bundleId };
  },
};
