import { prisma } from '../../config/database';
import { NotFoundError, ConflictError, AuthorizationError, BadRequestError } from '../../utils/AppError';
import { formatCoursePayload } from '../courses/courses.service';

export const enrollmentsService = {
  async enroll(studentId: number, courseId: number) {
    // Verify student role
    const user = await prisma.user.findUnique({ where: { id: studentId } });
    if (!user || user.role !== 'student') throw new AuthorizationError('Only students can enroll');

    // Verify course exists and is published
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) throw new NotFoundError('Course');
    if (!course.isPublished) throw new BadRequestError('Course is not available for enrollment');

    // No duplicate active enrollment
    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing && existing.status === 'active') {
      throw new ConflictError('You are already enrolled in this course');
    }

    // Use transaction: create enrollment + payment record if priced
    const [enrollment] = await prisma.$transaction([
      prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId, courseId } },
        create: { studentId, courseId, priceAtEnrollment: course.price, status: 'active' },
        update: { status: 'active', priceAtEnrollment: course.price },
      }),
    ]);

    return enrollment;
  },

  async listMyEnrollments(studentId: number) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            courseId: true, title: true, description: true, price: true,
            tutor: { select: { id: true, name: true, profilePic: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
    return enrollments.map((e) => ({
      ...e,
      course: e.course ? formatCoursePayload(e.course) : e.course,
    }));
  },

  async getMyEnrollmentById(studentId: number, enrollmentId: number) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { enrollmentId },
      include: { course: { include: { resources: { where: { status: 'published' } } } } },
    });
    if (!enrollment) throw new NotFoundError('Enrollment');
    if (enrollment.studentId !== studentId) throw new AuthorizationError();
    return {
      ...enrollment,
      course: enrollment.course ? formatCoursePayload(enrollment.course) : enrollment.course,
    };
  },
};
