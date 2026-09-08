import { prisma } from '../../config/database';
import {
  NotFoundError, AuthorizationError, BadRequestError, ConflictError,
} from '../../utils/AppError';
import {
  PayCourseInput, PayResourceInput, PayBundleInput, CreateRefundInput,
} from './payments.schema';

export const paymentsService = {
  // ── Payments ───────────────────────────────────────────────────
  async payCourse(studentId: number, input: PayCourseInput) {
    const course = await prisma.course.findUnique({ where: { courseId: input.courseId } });
    if (!course) throw new NotFoundError('Course');
    if (!course.isPublished) throw new BadRequestError('Course is not available for purchase');

    // Validate amount matches course price
    if (Number(course.price) !== input.amount) {
      throw new BadRequestError(`Amount must equal course price: ${course.price}`);
    }

    // Use transaction: create payment + enrollment
    const [payment, enrollment] = await prisma.$transaction([
      prisma.payment.create({
        data: { studentId, courseId: input.courseId, amount: input.amount, status: 'success' },
      }),
      prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId, courseId: input.courseId } },
        create: { studentId, courseId: input.courseId, priceAtEnrollment: input.amount, status: 'active' },
        update: { status: 'active' },
      }),
    ]);

    return { payment, enrollment };
  },

  async payResource(studentId: number, input: PayResourceInput) {
    const resource = await prisma.resource.findUnique({ where: { resourceId: input.resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.status !== 'published') throw new BadRequestError('Resource is not available');

    if (Number(resource.price) !== input.amount) {
      throw new BadRequestError(`Amount must equal resource price: ${resource.price}`);
    }

    return prisma.payment.create({
      data: { studentId, resourceId: input.resourceId, amount: input.amount, status: 'success' },
    });
  },

  async payBundle(studentId: number, input: PayBundleInput) {
    const bundle = await prisma.bundle.findUnique({ where: { bundleId: input.bundleId } });
    if (!bundle) throw new NotFoundError('Bundle');
    if (!bundle.isPublished) throw new BadRequestError('Bundle is not available for purchase');

    if (Number(bundle.price) !== input.amount) {
      throw new BadRequestError(`Amount must equal bundle price: ${bundle.price}`);
    }

    return prisma.payment.create({
      data: { studentId, bundleId: input.bundleId, amount: input.amount, status: 'success' },
    });
  },

  async listMyPayments(studentId: number) {
    return prisma.payment.findMany({
      where: { studentId },
      orderBy: { paidAt: 'desc' },
      include: {
        course: { select: { courseId: true, title: true } },
        resource: { select: { resourceId: true, filename: true } },
        bundle: { select: { bundleId: true, title: true } },
      },
    });
  },

  async getMyPaymentById(studentId: number, paymentId: number) {
    const payment = await prisma.payment.findUnique({
      where: { paymentId },
      include: {
        course: true, resource: true, bundle: true,
      },
    });
    if (!payment) throw new NotFoundError('Payment');
    if (payment.studentId !== studentId) throw new AuthorizationError();
    return payment;
  },

  // ── Refunds ───────────────────────────────────────────────────
  async createRefund(studentId: number, input: CreateRefundInput) {
    const payment = await prisma.payment.findUnique({ where: { paymentId: input.paymentId } });
    if (!payment) throw new NotFoundError('Payment');
    if (payment.studentId !== studentId) throw new AuthorizationError('You can only request refunds for your own payments');
    if (payment.status !== 'success') throw new BadRequestError('Only successful payments can be refunded');

    // Check no existing pending refund
    const existing = await prisma.refund.findFirst({
      where: { paymentId: input.paymentId, status: 'pending' },
    });
    if (existing) throw new ConflictError('A refund request for this payment is already pending');

    return prisma.refund.create({
      data: { paymentId: input.paymentId, studentId, reason: input.reason },
    });
  },

  async listMyRefunds(studentId: number) {
    return prisma.refund.findMany({
      where: { studentId },
      orderBy: { requestedAt: 'desc' },
      include: { payment: true },
    });
  },

  async getMyRefundById(studentId: number, refundId: number) {
    const refund = await prisma.refund.findUnique({
      where: { refundId },
      include: { payment: true },
    });
    if (!refund) throw new NotFoundError('Refund');
    if (refund.studentId !== studentId) throw new AuthorizationError();
    return refund;
  },
};
