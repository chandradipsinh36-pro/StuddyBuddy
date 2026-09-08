import { prisma } from '../../config/database';
import { NotFoundError, AuthorizationError } from '../../utils/AppError';
import { getPagination } from '../../utils/pagination';
import {
  CreateResourceInput, UpdateResourceInput, ResourceQuery,
  AddModerationLogInput, AddExtractedContentInput, AddVideoMetadataInput,
} from './resources.schema';

const resourceSelect = {
  resourceId: true, courseId: true, uploadedBy: true, filename: true,
  fileType: true, fileUrl: true, isLocked: true, price: true,
  status: true, moderationNotes: true, createdAt: true,
  uploader: { select: { id: true, name: true, profilePic: true } },
  course: { select: { courseId: true, title: true } },
  resourceCategories: {
    include: { category: { select: { categoryId: true, name: true } } },
  },
};

export const resourcesService = {
  // Public listing
  async listResources(query: ResourceQuery) {
    const { skip, take, page, limit } = getPagination(query);
    const where = {
      status: 'published' as const,
      ...(query.courseId && { courseId: query.courseId }),
      ...(query.uploadedBy && { uploadedBy: query.uploadedBy }),
      ...(query.fileType && { fileType: query.fileType }),
      ...(query.isLocked !== undefined && { isLocked: query.isLocked }),
      ...(query.categoryId && {
        resourceCategories: { some: { categoryId: query.categoryId } },
      }),
      ...(query.search && {
        filename: { contains: query.search, mode: 'insensitive' as const },
      }),
    };

    const [resources, total] = await prisma.$transaction([
      prisma.resource.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: resourceSelect }),
      prisma.resource.count({ where }),
    ]);
    return { resources, total, page, limit };
  },

  async getById(resourceId: number) {
    const resource = await prisma.resource.findFirst({
      where: { resourceId, status: 'published' },
      select: { ...resourceSelect, videoMetadata: true },
    });
    if (!resource) throw new NotFoundError('Resource');
    return resource;
  },

  // Tutor CRUD
  async listMyResources(tutorId: number, query: ResourceQuery) {
    const { skip, take, page, limit } = getPagination(query);
    const [resources, total] = await prisma.$transaction([
      prisma.resource.findMany({
        where: { uploadedBy: tutorId },
        skip, take,
        orderBy: { createdAt: 'desc' },
        select: resourceSelect,
      }),
      prisma.resource.count({ where: { uploadedBy: tutorId } }),
    ]);
    return { resources, total, page, limit };
  },

  async getMyResourceById(tutorId: number, resourceId: number) {
    const resource = await prisma.resource.findUnique({
      where: { resourceId },
      select: {
        ...resourceSelect,
        videoMetadata: true,
        moderationLogs: true,
        extractedContent: true,
      },
    });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.uploadedBy !== tutorId) throw new AuthorizationError();
    return resource;
  },

  async createResource(tutorId: number, input: CreateResourceInput) {
    return prisma.resource.create({
      data: {
        uploadedBy: tutorId,
        courseId: input.courseId,
        filename: input.filename,
        fileType: input.fileType,
        fileUrl: input.fileUrl,
        isLocked: input.isLocked ?? false,
        price: input.price ?? 0,
        status: 'draft',
      },
      select: resourceSelect,
    });
  },

  async updateResource(tutorId: number, resourceId: number, input: UpdateResourceInput) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.uploadedBy !== tutorId) throw new AuthorizationError();

    return prisma.resource.update({
      where: { resourceId },
      data: input,
      select: resourceSelect,
    });
  },

  async deleteResource(tutorId: number, resourceId: number) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.uploadedBy !== tutorId) throw new AuthorizationError();

    await prisma.resource.delete({ where: { resourceId } });
  },

  // Resource categories (many-to-many)
  async addCategory(tutorId: number, resourceId: number, categoryId: number) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.uploadedBy !== tutorId) throw new AuthorizationError();

    return prisma.resourceCategory.create({
      data: { resourceId, categoryId },
    });
  },

  async removeCategory(tutorId: number, resourceId: number, categoryId: number) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.uploadedBy !== tutorId) throw new AuthorizationError();

    await prisma.resourceCategory.delete({
      where: { resourceId_categoryId: { resourceId, categoryId } },
    });
  },

  // ── Moderation storage (NO AI) ────────────────────────────────
  async addModerationLog(tutorId: number, resourceId: number, input: AddModerationLogInput) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.uploadedBy !== tutorId) throw new AuthorizationError();

    return prisma.resourceModerationLog.create({ data: { resourceId, ...input } });
  },

  async getModerationLogs(tutorId: number, resourceId: number) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.uploadedBy !== tutorId) throw new AuthorizationError();

    return prisma.resourceModerationLog.findMany({
      where: { resourceId },
      orderBy: { checkedAt: 'desc' },
    });
  },

  // ── Extracted content storage (NO AI) ────────────────────────
  async addExtractedContent(tutorId: number, resourceId: number, input: AddExtractedContentInput) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.uploadedBy !== tutorId) throw new AuthorizationError();

    return prisma.resourceExtractedContent.create({ data: { resourceId, ...input } });
  },

  // ── Video metadata storage (NO AI) ────────────────────────────
  async upsertVideoMetadata(tutorId: number, resourceId: number, input: AddVideoMetadataInput) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.uploadedBy !== tutorId) throw new AuthorizationError();

    return prisma.videoMetadata.upsert({
      where: { resourceId },
      create: { resourceId, ...input },
      update: input,
    });
  },

  async getVideoMetadata(resourceId: number) {
    return prisma.videoMetadata.findUnique({ where: { resourceId } });
  },
};
