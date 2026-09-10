import { prisma } from '../../config/database';
import { NotFoundError, AuthorizationError, BadRequestError } from '../../utils/AppError';
import { getPagination } from '../../utils/pagination';
import { CreateCourseInput, UpdateCourseInput, CourseQuery } from './courses.schema';

const courseSelect = {
  courseId: true, title: true, description: true, price: true,
  isPublished: true, createdAt: true, categoryId: true, tutorId: true,
  tutor: { select: { id: true, name: true, profilePic: true, isVerified: true } },
  category: { select: { categoryId: true, name: true } },
  _count: { select: { enrollments: true, reviews: true, resources: true } },
};

export function formatCoursePayload(course: any) {
  if (!course) return course;
  let overview = course.description || '';
  let lessons: any[] = [];

  if (course.description && typeof course.description === 'string' && course.description.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(course.description);
      if (parsed && typeof parsed === 'object') {
        if (parsed.lessons && Array.isArray(parsed.lessons)) {
          lessons = parsed.lessons;
        }
        if (parsed.overview !== undefined) {
          overview = parsed.overview;
        }
      }
    } catch {
      // Keep plain text overview
    }
  }

  return {
    ...course,
    description: overview,
    lessons,
  };
}

export const coursesService = {
  // Public
  async listCourses(query: CourseQuery) {
    const { skip, take, page, limit } = getPagination(query);
    const where = {
      isPublished: true,
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.tutorId && { tutorId: query.tutorId }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' as const } },
          { description: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined && { gte: query.minPrice }),
              ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
            },
          }
        : {}),
    };

    const [courses, total] = await prisma.$transaction([
      prisma.course.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: courseSelect }),
      prisma.course.count({ where }),
    ]);
    return { courses: courses.map(formatCoursePayload), total, page, limit };
  },

  async getCourseById(courseId: number, user?: { userId: number; role: string }) {
    const course = await prisma.course.findFirst({
      where: { courseId, isPublished: true },
      select: {
        ...courseSelect,
        resources: {
          where: { status: 'published' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!course) throw new NotFoundError('Course');

    const formatted = formatCoursePayload(course);

    const isAuthor = user?.userId === course.tutorId;
    const isAdmin = user?.role === 'admin';

    let isEnrolled = false;
    if (user?.userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: user.userId,
            courseId,
          },
        },
      });
      isEnrolled = enrollment?.status === 'active';
    }

    const hasAccess = isAuthor || isAdmin || isEnrolled;

    // If user has not enrolled in the course, protect video lectures and study materials
    if (!hasAccess) {
      if (formatted.lessons && Array.isArray(formatted.lessons)) {
        formatted.lessons = formatted.lessons.map((lesson: any) => {
          if (lesson.isFreePreview) {
            return lesson;
          }
          const sanitizedMaterials = Array.isArray(lesson.materials)
            ? lesson.materials.map((m: any) => ({ ...m, fileUrl: '', isLocked: true }))
            : lesson.materials;

          return {
            ...lesson,
            videoUrl: '',
            isLocked: true,
            ...(lesson.materials ? { materials: sanitizedMaterials } : {}),
          };
        });
      }

      if (formatted.resources && Array.isArray(formatted.resources)) {
        formatted.resources = formatted.resources.map((r: any) => ({
          ...r,
          fileUrl: '',
          isLocked: true,
        }));
      }
    } else {
      // User has full access: ensure all lessons, materials, and resources are explicitly unlocked
      if (formatted.lessons && Array.isArray(formatted.lessons)) {
        formatted.lessons = formatted.lessons.map((lesson: any) => ({
          ...lesson,
          isLocked: false,
          ...(lesson.materials && Array.isArray(lesson.materials) ? {
            materials: lesson.materials.map((m: any) => ({ ...m, isLocked: false })),
          } : {}),
        }));
      }

      if (formatted.resources && Array.isArray(formatted.resources)) {
        formatted.resources = formatted.resources.map((r: any) => ({
          ...r,
          isLocked: false,
        }));
      }
    }

    return {
      ...formatted,
      isEnrolled,
      hasAccess,
    };
  },

  // Tutor CRUD
  async listMyCourses(tutorId: number) {
    const courses = await prisma.course.findMany({
      where: { tutorId },
      orderBy: { createdAt: 'desc' },
      select: {
        ...courseSelect,
        resources: {
          orderBy: { createdAt: 'asc' },
          select: {
            resourceId: true,
            filename: true,
            fileType: true,
            fileUrl: true,
            isLocked: true,
            price: true,
            status: true,
            moderationNotes: true,
            createdAt: true,
          },
        },
      },
    });
    return courses.map(formatCoursePayload);
  },

  async getMyCoursById(tutorId: number, courseId: number) {
    const course = await prisma.course.findUnique({
      where: { courseId },
      select: {
        ...courseSelect,
        resources: {
          orderBy: { createdAt: 'asc' },
          select: {
            resourceId: true,
            filename: true,
            fileType: true,
            fileUrl: true,
            isLocked: true,
            price: true,
            status: true,
            moderationNotes: true,
            createdAt: true,
          },
        },
      },
    });
    if (!course) throw new NotFoundError('Course');
    if (course.tutorId !== tutorId) throw new AuthorizationError();
    return formatCoursePayload(course);
  },

  async createCourse(tutorId: number, input: CreateCourseInput) {
    // Only approved tutors can create (check is_verified)
    const user = await prisma.user.findUnique({ where: { id: tutorId } });
    if (!user || user.role !== 'tutor') throw new AuthorizationError('Only tutors can create courses');
    if (!user.isVerified) {
      throw new BadRequestError('Your tutor application is currently pending admin approval. You can only create courses after your application is approved.');
    }

    const { resourceIds, lessons, ...courseData } = input;

    // Collect all resource IDs across lessons + standalone resourceIds
    const rawLessonResourceIds = (lessons || []).flatMap((l: any) => l.resourceIds || []);
    const rawCombinedResourceIds = Array.from(new Set([
      ...(resourceIds || []),
      ...rawLessonResourceIds,
    ]));

    // Strictly enforce tutor resource isolation: only allow resources uploaded by this tutor
    let allowedResourceIds = new Set<number>();
    if (rawCombinedResourceIds.length > 0) {
      const tutorResources = await prisma.resource.findMany({
        where: {
          resourceId: { in: rawCombinedResourceIds },
          uploadedBy: tutorId,
        },
        select: { resourceId: true },
      });
      allowedResourceIds = new Set(tutorResources.map(r => r.resourceId));
    }

    // Sanitize lessons so any resource not belonging to this tutor is stripped
    const sanitizedLessons = lessons && Array.isArray(lessons)
      ? lessons.map((l: any) => ({
          ...l,
          resourceIds: Array.isArray(l.resourceIds)
            ? l.resourceIds.filter((id: number) => allowedResourceIds.has(Number(id)))
            : [],
        }))
      : lessons;

    // Compile description with sanitized lessons
    let finalDescription = courseData.description;
    if (sanitizedLessons && Array.isArray(sanitizedLessons)) {
      finalDescription = JSON.stringify({
        overview: courseData.description || '',
        lessons: sanitizedLessons,
      });
    }

    const course = await prisma.course.create({
      data: {
        tutorId,
        ...courseData,
        description: finalDescription,
        price: courseData.price ?? 0,
      },
      select: {
        ...courseSelect,
        resources: {
          orderBy: { createdAt: 'asc' },
          select: {
            resourceId: true,
            filename: true,
            fileType: true,
            fileUrl: true,
            isLocked: true,
            price: true,
            status: true,
            moderationNotes: true,
            createdAt: true,
          },
        },
      },
    });

    if (allowedResourceIds.size > 0) {
      await prisma.resource.updateMany({
        where: {
          resourceId: { in: Array.from(allowedResourceIds) },
          uploadedBy: tutorId,
        },
        data: {
          courseId: course.courseId,
        },
      });

      const updated = await prisma.course.findUnique({
        where: { courseId: course.courseId },
        select: {
          ...courseSelect,
          resources: {
            orderBy: { createdAt: 'asc' },
            select: {
              resourceId: true,
              filename: true,
              fileType: true,
              fileUrl: true,
              isLocked: true,
              price: true,
              status: true,
              moderationNotes: true,
              createdAt: true,
            },
          },
        },
      });
      return formatCoursePayload(updated);
    }

    return formatCoursePayload(course);
  },

  async updateCourse(tutorId: number, courseId: number, input: UpdateCourseInput) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) throw new NotFoundError('Course');
    if (course.tutorId !== tutorId) throw new AuthorizationError();

    const { resourceIds, lessons, ...courseData } = input;

    // Strictly enforce tutor resource isolation for updates as well
    const rawLessonResourceIds = (lessons || []).flatMap((l: any) => l.resourceIds || []);
    const rawCombinedResourceIds = (resourceIds !== undefined || lessons !== undefined)
      ? Array.from(new Set([...(resourceIds || []), ...rawLessonResourceIds]))
      : [];

    let allowedResourceIds = new Set<number>();
    if (rawCombinedResourceIds.length > 0) {
      const tutorResources = await prisma.resource.findMany({
        where: {
          resourceId: { in: rawCombinedResourceIds },
          uploadedBy: tutorId,
        },
        select: { resourceId: true },
      });
      allowedResourceIds = new Set(tutorResources.map(r => r.resourceId));
    }

    // Sanitize lessons so any resource not belonging to this tutor is stripped
    const sanitizedLessons = lessons !== undefined && Array.isArray(lessons)
      ? lessons.map((l: any) => ({
          ...l,
          resourceIds: Array.isArray(l.resourceIds)
            ? l.resourceIds.filter((id: number) => allowedResourceIds.has(Number(id)))
            : [],
        }))
      : lessons;

    let finalDescription = courseData.description;
    if (sanitizedLessons !== undefined) {
      let currentOverview = '';
      if (course.description && course.description.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(course.description);
          currentOverview = parsed.overview || '';
        } catch {
          currentOverview = course.description;
        }
      } else {
        currentOverview = course.description || '';
      }

      finalDescription = JSON.stringify({
        overview: courseData.description !== undefined ? courseData.description : currentOverview,
        lessons: sanitizedLessons || [],
      });
    }

    await prisma.course.update({
      where: { courseId },
      data: {
        ...courseData,
        ...(finalDescription !== undefined && { description: finalDescription }),
      },
    });

    if (resourceIds !== undefined || lessons !== undefined) {
      // Detach resources that are no longer in allowedResourceIds
      await prisma.resource.updateMany({
        where: {
          courseId,
          uploadedBy: tutorId,
          resourceId: { notIn: Array.from(allowedResourceIds) },
        },
        data: {
          courseId: null,
        },
      });

      // Attach newly selected resources
      if (allowedResourceIds.size > 0) {
        await prisma.resource.updateMany({
          where: {
            resourceId: { in: Array.from(allowedResourceIds) },
            uploadedBy: tutorId,
          },
          data: {
            courseId,
          },
        });
      }
    }

    const updated = await prisma.course.findUnique({
      where: { courseId },
      select: {
        ...courseSelect,
        resources: {
          orderBy: { createdAt: 'asc' },
          select: {
            resourceId: true,
            filename: true,
            fileType: true,
            fileUrl: true,
            isLocked: true,
            price: true,
            status: true,
            moderationNotes: true,
            createdAt: true,
          },
        },
      },
    });

    return formatCoursePayload(updated);
  },

  async publishCourse(tutorId: number, courseId: number, isPublished: boolean) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) throw new NotFoundError('Course');
    if (course.tutorId !== tutorId) throw new AuthorizationError();

    // Check tutor has an approved application or is verified
    const user = await prisma.user.findUnique({ where: { id: tutorId } });
    if (isPublished && !user?.isVerified) {
      const approvedApp = await prisma.tutorApplication.findFirst({
        where: { userId: tutorId, status: 'approved' },
      });
      if (!approvedApp) {
        throw new BadRequestError('Your tutor application must be approved before publishing courses');
      }
    }

    return prisma.course.update({
      where: { courseId },
      data: { isPublished },
      select: courseSelect,
    });
  },

  async deleteCourse(tutorId: number, courseId: number) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) throw new NotFoundError('Course');
    if (course.tutorId !== tutorId) throw new AuthorizationError();

    // Prevent delete if enrollments exist
    const enrollmentCount = await prisma.enrollment.count({ where: { courseId } });
    if (enrollmentCount > 0) throw new BadRequestError('Cannot delete a course with active enrollments');

    await prisma.course.delete({ where: { courseId } });
  },
};
