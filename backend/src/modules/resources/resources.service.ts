import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/database';
import { NotFoundError, AuthorizationError, BadRequestError } from '../../utils/AppError';
import { getPagination } from '../../utils/pagination';
import { getResourcesDirectory } from '../../middleware/resourceUpload';
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
    const user = await prisma.user.findUnique({ where: { id: tutorId } });
    if (!user || user.role !== 'tutor') throw new AuthorizationError('Only tutors can upload resources');
    if (!user.isVerified) {
      throw new BadRequestError('Your tutor application is currently pending admin approval. You can only upload resources or playlists after your application is approved.');
    }

    if (input.courseId) {
      const targetCourse = await prisma.course.findUnique({ where: { courseId: input.courseId } });
      if (!targetCourse || targetCourse.tutorId !== tutorId) {
        throw new AuthorizationError('You can only attach resources to courses you created');
      }
    }

    const resource = await prisma.resource.create({
      data: {
        uploadedBy: tutorId,
        courseId: input.courseId,
        filename: input.filename,
        fileType: input.fileType,
        fileUrl: input.fileUrl,
        isLocked: input.isLocked ?? false,
        price: input.price ?? 0,
        status: (input.status as any) || 'published',
        moderationNotes: input.moderationNotes,
      },
      select: resourceSelect,
    });

    if (input.categoryName && typeof input.categoryName === 'string' && input.categoryName.trim()) {
      try {
        const catName = input.categoryName.trim();
        const category = await prisma.category.upsert({
          where: { name: catName },
          update: {},
          create: { name: catName },
        });
        await prisma.resourceCategory.upsert({
          where: {
            resourceId_categoryId: {
              resourceId: resource.resourceId,
              categoryId: category.categoryId,
            },
          },
          update: {},
          create: {
            resourceId: resource.resourceId,
            categoryId: category.categoryId,
          },
        });
      } catch (err) {
        console.error('Failed to link category to resource:', err);
      }
    }

    return prisma.resource.findUnique({
      where: { resourceId: resource.resourceId },
      select: resourceSelect,
    });
  },

  async updateResource(tutorId: number, resourceId: number, body: any, file?: Express.Multer.File) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.uploadedBy !== tutorId) throw new AuthorizationError();

    let existingMeta: any = {};
    try {
      if (resource.moderationNotes && resource.moderationNotes.startsWith('{')) {
        existingMeta = JSON.parse(resource.moderationNotes);
      }
    } catch {}

    const title = (body.title || body.filename || existingMeta.title || resource.filename || '').trim();
    const description = body.description !== undefined ? body.description : existingMeta.description;
    const subject = body.subject !== undefined ? body.subject : existingMeta.subject;
    const category = body.category !== undefined ? body.category : existingMeta.category;
    const difficulty = body.difficulty !== undefined ? body.difficulty : (existingMeta.difficulty || 'intermediate');

    const validTypes = ['pdf', 'image', 'ppt', 'audio', 'youtube', 'test_paper'];
    const rawType = body.type || body.fileType;
    let fileType = resource.fileType;
    if (rawType && validTypes.includes(rawType)) {
      fileType = rawType;
    }

    let isLocked = resource.isLocked;
    if (body.accessType !== undefined) {
      isLocked = body.accessType === 'premium';
    } else if (body.isLocked !== undefined) {
      isLocked = body.isLocked === 'true' || body.isLocked === true;
    }

    let price: any = resource.price;
    if (!isLocked) {
      price = 0;
    } else if (body.price !== undefined) {
      price = Number(body.price || 0);
    }

    let fileUrl = resource.fileUrl;
    let savedFilename = existingMeta.savedFilename;
    let originalFilename = existingMeta.originalFilename;
    let fileSize = existingMeta.fileSize;

    // If new file is uploaded, automatically delete old resource file from local folder
    if (file) {
      const resourcesDir = getResourcesDirectory();
      const filesToDelete = new Set<string>();

      if (resource.fileUrl) {
        const oldBase = path.basename(resource.fileUrl);
        if (oldBase && oldBase !== file.filename) {
          filesToDelete.add(path.join(resourcesDir, oldBase));
        }
      }
      if (existingMeta.savedFilename && existingMeta.savedFilename !== file.filename) {
        filesToDelete.add(path.join(resourcesDir, existingMeta.savedFilename));
      }

      for (const filePath of filesToDelete) {
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`[Storage] Deleted old resource file: ${filePath}`);
          } catch (e) {
            console.error('Error deleting old resource file:', e);
          }
        }
      }

      fileUrl = `/resources/${file.filename}`;
      savedFilename = file.filename;
      originalFilename = file.originalname;
      fileSize = file.size;

      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') fileType = 'pdf';
      else if (['ppt', 'pptx'].includes(ext || '')) fileType = 'ppt';
      else if (['doc', 'docx'].includes(ext || '')) fileType = 'test_paper';
      else if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext || '')) fileType = 'youtube';
      else if (['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext || '')) fileType = 'audio';
      else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '')) fileType = 'image';
    }

    const newMeta = {
      ...existingMeta,
      title,
      description,
      subject,
      category,
      difficulty,
      savedFilename,
      originalFilename,
      fileSize,
    };

    const updateData: any = {
      filename: title,
      fileType,
      fileUrl,
      isLocked,
      price,
      moderationNotes: JSON.stringify(newMeta),
    };

    await prisma.resource.update({
      where: { resourceId },
      data: updateData,
    });

    if (category && typeof category === 'string' && category.trim()) {
      try {
        const catName = category.trim();
        const cat = await prisma.category.upsert({
          where: { name: catName },
          update: {},
          create: { name: catName },
        });

        await prisma.resourceCategory.deleteMany({ where: { resourceId } });
        await prisma.resourceCategory.create({
          data: { resourceId, categoryId: cat.categoryId },
        });
      } catch (err) {
        console.error('Failed to update category link:', err);
      }
    }

    return prisma.resource.findUnique({
      where: { resourceId },
      select: resourceSelect,
    });
  },

  async deleteResource(tutorId: number, resourceId: number) {
    const resource = await prisma.resource.findUnique({ where: { resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.uploadedBy !== tutorId) throw new AuthorizationError();

    // Automatically delete local file from disk on resource deletion
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
          console.log(`[Storage] Deleted file on resource removal: ${p}`);
        }
      }
    } catch (e) {
      console.error('Error deleting local file on resource deletion:', e);
    }

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
