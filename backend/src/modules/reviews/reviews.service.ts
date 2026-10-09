import { prisma } from '../../config/database';
import {
  NotFoundError, AuthorizationError, ConflictError, BadRequestError,
} from '../../utils/AppError';
import {
  CreateCourseReviewInput, UpdateCourseReviewInput,
  CreateTutorReviewInput, UpdateTutorReviewInput,
} from './reviews.schema';

export const reviewsService = {
  // ── Course Reviews ─────────────────────────────────────────────
  async listCourseReviews(courseId: number) {
    return prisma.courseReview.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { id: true, name: true, profilePic: true } } },
    });
  },

  async createCourseReview(studentId: number, courseId: number, input: CreateCourseReviewInput) {
    // Must be enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) throw new BadRequestError('You must be enrolled in this course to write a review');

    const existing = await prisma.courseReview.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) throw new ConflictError('You have already reviewed this course');

    return prisma.courseReview.create({
      data: { studentId, courseId, ...input },
      include: { student: { select: { id: true, name: true, profilePic: true } } },
    });
  },

  async updateCourseReview(studentId: number, reviewId: number, input: UpdateCourseReviewInput) {
    const review = await prisma.courseReview.findUnique({ where: { reviewId } });
    if (!review) throw new NotFoundError('Review');
    if (review.studentId !== studentId) throw new AuthorizationError();

    return prisma.courseReview.update({ where: { reviewId }, data: input });
  },

  async deleteCourseReview(studentId: number, reviewId: number) {
    const review = await prisma.courseReview.findUnique({ where: { reviewId } });
    if (!review) throw new NotFoundError('Review');
    if (review.studentId !== studentId) throw new AuthorizationError();

    await prisma.courseReview.delete({ where: { reviewId } });
  },

  // ── Tutor Reviews ──────────────────────────────────────────────
  async listTutorReviews(tutorId: number) {
    const tutorReviews = await prisma.tutorReview.findMany({
      where: { tutorId },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, profilePic: true } },
      },
    });

    const courseReviews = await prisma.courseReview.findMany({
      where: {
        course: { tutorId },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, profilePic: true } },
        course: { select: { courseId: true, title: true } },
      },
    });

    const formattedTutor = tutorReviews.map((r) => ({
      id: r.reviewId,
      reviewId: r.reviewId,
      studentId: r.studentId,
      tutorId: r.tutorId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      student: r.student,
      type: 'tutor' as const,
    }));

    const formattedCourse = courseReviews.map((r) => ({
      id: r.reviewId,
      reviewId: r.reviewId,
      studentId: r.studentId,
      courseId: r.courseId,
      courseTitle: r.course.title,
      tutorId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      student: r.student,
      type: 'course' as const,
    }));

    const combined = [...formattedTutor, ...formattedCourse];
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return combined;
  },

  async createTutorReview(studentId: number, tutorId: number, input: CreateTutorReviewInput) {
    // Verify tutor exists
    const tutor = await prisma.user.findFirst({ where: { id: tutorId, role: 'tutor' } });
    if (!tutor) throw new NotFoundError('Tutor');

    // Verify student has enrolled in at least one course taught by this tutor
    const tutorCourses = await prisma.course.findMany({
      where: { tutorId },
      select: { courseId: true },
    });
    const courseIds = tutorCourses.map((c) => c.courseId);

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId: { in: courseIds },
        status: 'active',
      },
    });
    if (!enrollment) {
      throw new BadRequestError('You must be enrolled in and have completed a course by this tutor to submit a review');
    }

    const existing = await prisma.tutorReview.findUnique({
      where: { studentId_tutorId: { studentId, tutorId } },
    });
    if (existing) throw new ConflictError('You have already reviewed this tutor');

    return prisma.tutorReview.create({
      data: { studentId, tutorId, ...input },
      include: { student: { select: { id: true, name: true, profilePic: true } } },
    });
  },

  async updateTutorReview(studentId: number, reviewId: number, input: UpdateTutorReviewInput) {
    const review = await prisma.tutorReview.findUnique({ where: { reviewId } });
    if (!review) throw new NotFoundError('Review');
    if (review.studentId !== studentId) throw new AuthorizationError();

    return prisma.tutorReview.update({ where: { reviewId }, data: input });
  },

  async deleteTutorReview(studentId: number, reviewId: number) {
    const review = await prisma.tutorReview.findUnique({ where: { reviewId } });
    if (!review) throw new NotFoundError('Review');
    if (review.studentId !== studentId) throw new AuthorizationError();

    await prisma.tutorReview.delete({ where: { reviewId } });
  },
};
