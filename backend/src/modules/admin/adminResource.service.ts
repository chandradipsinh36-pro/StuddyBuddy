import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/AppError';
import { getPagination } from '../../utils/pagination';
import { getResourcesDirectory } from '../../middleware/resourceUpload';

export function formatAdminResource(res: any) {
  if (!res) return res;
  let parsedMeta: any = {};
  if (res.moderationNotes && typeof res.moderationNotes === 'string' && res.moderationNotes.startsWith('{')) {
    try {
      parsedMeta = JSON.parse(res.moderationNotes);
    } catch {}
  }

  const completedPayments = (res.payments || []).filter((p: any) => p.status === 'success');
  const revenue = completedPayments.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);

  return {
    ...res,
    title: parsedMeta.title || res.filename,
    description: parsedMeta.description || '',
    subject: parsedMeta.subject || '',
    categoryName: parsedMeta.category || res.resourceCategories?.[0]?.category?.name || '',
    salesCount: completedPayments.length,
    revenue,
  };
}

export const adminResourceService = {
  async listResources(query: any = {}) {
    const { skip, take, page, limit } = getPagination(query);

    const where: Prisma.ResourceWhereInput = {
      ...(query.status && query.status !== 'all' && { status: query.status }),
      ...(query.fileType && query.fileType !== 'all' && { fileType: query.fileType }),
      ...(query.isLocked !== undefined && query.isLocked !== 'all' && {
        isLocked: query.isLocked === 'true' || query.isLocked === true,
      }),
      ...(query.uploadedBy && { uploadedBy: Number(query.uploadedBy) }),
      ...(query.search && {
        OR: [
          { filename: { contains: query.search, mode: 'insensitive' } },
          { moderationNotes: { contains: query.search, mode: 'insensitive' } },
          { uploader: { name: { contains: query.search, mode: 'insensitive' } } },
          { uploader: { email: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [sortField]: sortOrder } as Prisma.ResourceOrderByWithRelationInput;

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          uploader: {
            select: { id: true, name: true, email: true, profilePic: true },
          },
          course: {
            select: { courseId: true, title: true },
          },
          resourceCategories: {
            include: { category: true },
          },
          bundleItems: {
            include: { bundle: { select: { bundleId: true, title: true } } },
          },
          payments: {
            select: { paymentId: true, status: true, amount: true },
          },
        },
      }),
      prisma.resource.count({ where }),
    ]);

    return {
      resources: resources.map(formatAdminResource),
      total,
      page,
      limit,
    };
  },

  async getResourceById(resourceId: number) {
    const resource = await prisma.resource.findUnique({
      where: { resourceId },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, profilePic: true, isVerified: true },
        },
        course: {
          select: { courseId: true, title: true },
        },
        resourceCategories: {
          include: { category: true },
        },
        bundleItems: {
          include: { bundle: { select: { bundleId: true, title: true } } },
        },
        payments: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!resource) throw new NotFoundError('Resource');
    return formatAdminResource(resource);
  },

  async updateStatus(resourceId: number, status: string, notes?: string) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');

    let meta: any = {};
    try {
      if (resource.moderationNotes?.startsWith('{')) {
        meta = JSON.parse(resource.moderationNotes);
      }
    } catch {}

    if (notes) {
      meta.adminReviewNote = notes;
    }

    const updated = await prisma.resource.update({
      where: { resourceId },
      data: {
        status: status as any,
        moderationNotes: JSON.stringify(meta),
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, profilePic: true },
        },
      },
    });

    return formatAdminResource(updated);
  },

  async toggleLock(resourceId: number) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');

    const updated = await prisma.resource.update({
      where: { resourceId },
      data: { isLocked: !resource.isLocked },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, profilePic: true },
        },
      },
    });

    return formatAdminResource(updated);
  },

  async updateResource(resourceId: number, data: any) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');

    let meta: any = {};
    try {
      if (resource.moderationNotes?.startsWith('{')) {
        meta = JSON.parse(resource.moderationNotes);
      }
    } catch {}

    if (data.title !== undefined) meta.title = data.title;
    if (data.description !== undefined) meta.description = data.description;
    if (data.subject !== undefined) meta.subject = data.subject;
    if (data.category !== undefined) meta.category = data.category;

    const updated = await prisma.resource.update({
      where: { resourceId },
      data: {
        ...(data.title !== undefined && { filename: data.title }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.isLocked !== undefined && { isLocked: data.isLocked }),
        ...(data.status !== undefined && { status: data.status }),
        moderationNotes: JSON.stringify(meta),
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, profilePic: true },
        },
      },
    });

    return formatAdminResource(updated);
  },

  async deleteResource(resourceId: number) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');

    // Clean physical file from disk
    try {
      const resourcesDir = getResourcesDirectory();
      let meta: any = {};
      try {
        if (resource.moderationNotes?.startsWith('{')) meta = JSON.parse(resource.moderationNotes);
      } catch {}

      const filesToDelete = new Set<string>();
      if (resource.fileUrl) {
        filesToDelete.add(path.join(resourcesDir, path.basename(resource.fileUrl)));
      }
      if (meta.savedFilename) {
        filesToDelete.add(path.join(resourcesDir, meta.savedFilename));
      }
      for (const p of filesToDelete) {
        if (fs.existsSync(p)) {
          fs.unlinkSync(p);
          console.log(`[Storage] Deleted file on admin resource removal: ${p}`);
        }
      }
    } catch (e) {
      console.error('Error deleting physical file:', e);
    }

    await prisma.$transaction(async (tx) => {
      await tx.bundleItem.deleteMany({ where: { resourceId } });
      await tx.payment.deleteMany({ where: { resourceId } });
      await tx.resourceCategory.deleteMany({ where: { resourceId } });
      await tx.resourceModerationLog.deleteMany({ where: { resourceId } });
      await tx.resourceExtractedContent.deleteMany({ where: { resourceId } });
      await tx.videoModerationScene.deleteMany({ where: { resourceId } });
      await tx.videoMetadata.deleteMany({ where: { resourceId } });
      await tx.resource.delete({ where: { resourceId } });
    });

    return { message: 'Resource deleted permanently', resourceId };
  },
};
