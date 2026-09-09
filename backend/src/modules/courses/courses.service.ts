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
    return { courses, total, page, limit };
  },

  async getCourseById(courseId: number) {
    const course = await prisma.course.findFirst({
      where: { courseId, isPublished: true },
      select: { ...courseSelect, resources: { where: { status: 'published' } } },
    });
    if (!course) throw new NotFoundError('Course');
    return course;
  },

  // Tutor CRUD
  async listMyCourses(tutorId: number) {
    return prisma.course.findMany({
      where: { tutorId },
      orderBy: { createdAt: 'desc' },
      select: courseSelect,
    });
  },

  async getMyCoursById(tutorId: number, courseId: number) {
    const course = await prisma.course.findUnique({ where: { courseId }, select: courseSelect });
    if (!course) throw new NotFoundError('Course');
    if (course.tutorId !== tutorId) throw new AuthorizationError();
    return course;
  },

  async createCourse(tutorId: number, input: CreateCourseInput) {
    // Only approved tutors can create (check is_verified)
    const user = await prisma.user.findUnique({ where: { id: tutorId } });
    if (!user || user.role !== 'tutor') throw new AuthorizationError('Only tutors can create courses');
    if (!user.isVerified) {
      throw new BadRequestError('Your tutor application is currently pending admin approval. You can only create courses after your application is approved.');
    }

    return prisma.course.create({
      data: { tutorId, ...input, price: input.price ?? 0 },
      select: courseSelect,
    });
  },

  async updateCourse(tutorId: number, courseId: number, input: UpdateCourseInput) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) throw new NotFoundError('Course');
    if (course.tutorId !== tutorId) throw new AuthorizationError();

    return prisma.course.update({
      where: { courseId },
      data: input,
      select: courseSelect,
    });
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
