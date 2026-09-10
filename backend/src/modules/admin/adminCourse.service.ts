import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/AppError';
import { getPagination } from '../../utils/pagination';

export function formatAdminCourse(course: any) {
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
      // Keep plain text
    }
  }

  return {
    ...course,
    description: overview,
    lessons,
    lessonsCount: lessons.length,
    enrollmentsCount: course._count?.enrollments ?? 0,
    reviewsCount: course._count?.reviews ?? 0,
    resourcesCount: course._count?.resources ?? 0,
  };
}

export const adminCourseService = {
  async listCourses(query: any = {}) {
    const { skip, take, page, limit } = getPagination(query);

    const where: Prisma.CourseWhereInput = {
      ...(query.categoryId && { categoryId: Number(query.categoryId) }),
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
    const orderBy = { [sortField]: sortOrder } as Prisma.CourseOrderByWithRelationInput;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          courseId: true,
          title: true,
          description: true,
          price: true,
          isPublished: true,
          createdAt: true,
          categoryId: true,
          tutorId: true,
          tutor: {
            select: { id: true, name: true, email: true, profilePic: true },
          },
          category: {
            select: { categoryId: true, name: true },
          },
          _count: {
            select: { enrollments: true, reviews: true, resources: true },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return {
      courses: courses.map(formatAdminCourse),
      total,
      page,
      limit,
    };
  },

  async getCourseById(courseId: number) {
    const course = await prisma.course.findUnique({
      where: { courseId },
      include: {
        tutor: {
          select: { id: true, name: true, email: true, profilePic: true, isVerified: true },
        },
        category: true,
        resources: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { enrollments: true, reviews: true, resources: true },
        },
      },
    });

    if (!course) throw new NotFoundError('Course');
    return formatAdminCourse(course);
  },

  async togglePublish(courseId: number) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) throw new NotFoundError('Course');

    const updated = await prisma.course.update({
      where: { courseId },
      data: { isPublished: !course.isPublished },
      include: {
        tutor: {
          select: { id: true, name: true, email: true, profilePic: true },
        },
        category: true,
        _count: {
          select: { enrollments: true, reviews: true, resources: true },
        },
      },
    });

    return formatAdminCourse(updated);
  },

  async updateCourse(courseId: number, data: any) {
    const existing = await prisma.course.findUnique({ where: { courseId } });
    if (!existing) throw new NotFoundError('Course');

    let finalDescription = data.description;
    if (data.lessons !== undefined) {
      let currentOverview = '';
      if (existing.description && existing.description.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(existing.description);
          currentOverview = parsed.overview || '';
        } catch {
          currentOverview = existing.description;
        }
      } else {
        currentOverview = existing.description || '';
      }

      finalDescription = JSON.stringify({
        overview: data.description !== undefined ? data.description : currentOverview,
        lessons: data.lessons || [],
      });
    }

    const updated = await prisma.course.update({
      where: { courseId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(finalDescription !== undefined && { description: finalDescription }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId ? Number(data.categoryId) : null }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
      include: {
        tutor: {
          select: { id: true, name: true, email: true, profilePic: true },
        },
        category: true,
        _count: {
          select: { enrollments: true, reviews: true, resources: true },
        },
      },
    });

    return formatAdminCourse(updated);
  },

  async deleteCourse(courseId: number) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) throw new NotFoundError('Course');

    await prisma.$transaction(async (tx) => {
      // Detach resources linked to course
      await tx.resource.updateMany({
        where: { courseId },
        data: { courseId: null },
      });
      // Delete enrollments
      await tx.enrollment.deleteMany({ where: { courseId } });
      // Delete reviews
      await tx.courseReview.deleteMany({ where: { courseId } });
      // Delete payments for this course
      await tx.payment.deleteMany({ where: { courseId } });
      // Unlink groups
      await tx.group.updateMany({
        where: { courseId },
        data: { courseId: null },
      });
      // Delete course
      await tx.course.delete({ where: { courseId } });
    });

    return { message: 'Course deleted successfully', courseId };
  },
};
