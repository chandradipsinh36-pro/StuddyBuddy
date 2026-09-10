import { prisma } from '../../config/database';
import {
  NotFoundError, AuthorizationError, BadRequestError, ConflictError,
} from '../../utils/AppError';
import {
  PayCourseInput, PayResourceInput, PayBundleInput, CreateRefundInput, ValidateCouponInput,
} from './payments.schema';

export const paymentsService = {
  // ── Coupon Validation Helper ────────────────────────────────────
  calculateCouponDiscount(code: string, originalAmount: number) {
    const cleanCode = (code || '').toUpperCase().trim();
    let discount = 0;
    let message = 'Coupon applied successfully!';

    if (cleanCode === 'WELCOME20') {
      discount = Math.round(originalAmount * 0.20);
      message = '20% Welcome Discount applied!';
    } else if (cleanCode === 'STUDYBUDDY') {
      discount = Math.min(originalAmount, 100);
      message = '₹100 StudyBuddy Voucher applied!';
    } else if (cleanCode === 'EXAM50') {
      discount = Math.round(originalAmount * 0.50);
      message = '50% Exam Prep Discount applied!';
    } else if (cleanCode === 'FREE100' || cleanCode === 'LEARNFREE') {
      discount = originalAmount;
      message = '100% Full Access Voucher applied!';
    } else {
      throw new BadRequestError(`Invalid coupon code: "${code}". Try WELCOME20, STUDYBUDDY, or FREE100.`);
    }

    const finalAmount = Math.max(0, originalAmount - discount);
    return {
      valid: true,
      couponCode: cleanCode,
      originalAmount,
      discount,
      finalAmount,
      message,
    };
  },

  async validateCoupon(input: ValidateCouponInput) {
    return this.calculateCouponDiscount(input.couponCode, input.amount);
  },

  // ── Course Payment & Enrollment ──────────────────────────────────
  async payCourse(studentId: number, input: PayCourseInput) {
    // 1. Verify student role
    const user = await prisma.user.findUnique({ where: { id: studentId } });
    if (!user || user.role !== 'student') {
      throw new AuthorizationError('Only students can enroll in courses');
    }

    // 2. Verify course
    const course = await prisma.course.findUnique({ where: { courseId: input.courseId } });
    if (!course) throw new NotFoundError('Course');
    if (!course.isPublished) throw new BadRequestError('This course is not currently available for enrollment');

    // 3. Prevent duplicate active enrollment
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: input.courseId } },
    });
    if (existingEnrollment && existingEnrollment.status === 'active') {
      throw new ConflictError('You are already enrolled in this course');
    }

    // 4. Calculate & validate price
    let expectedPrice = Number(course.price);
    if (input.couponCode) {
      const cRes = this.calculateCouponDiscount(input.couponCode, expectedPrice);
      expectedPrice = cRes.finalAmount;
    }

    // Tolerance check (within ₹1 for rounding)
    if (input.amount !== undefined && Math.abs(expectedPrice - input.amount) > 1.0) {
      throw new BadRequestError(`Amount must match course price: ₹${expectedPrice}`);
    }

    const finalAmount = input.amount !== undefined ? input.amount : expectedPrice;
    const paymentMethod = input.paymentMethod || (finalAmount === 0 ? 'free' : 'upi');
    const transactionRef = input.transactionRef || `TXN-SB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Atomic transaction: create payment record + upsert enrollment
    const [payment, enrollment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          studentId,
          courseId: input.courseId,
          amount: finalAmount,
          status: 'success',
          paymentMethod,
          transactionRef,
        } as any,
      }),
      prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId, courseId: input.courseId } },
        create: {
          studentId,
          courseId: input.courseId,
          priceAtEnrollment: finalAmount,
          status: 'active',
        },
        update: {
          status: 'active',
          priceAtEnrollment: finalAmount,
        },
      }),
    ]);

    return {
      payment,
      enrollment,
      courseTitle: course.title,
      transactionRef,
      paymentMethod,
      amount: finalAmount,
    };
  },

  // ── Resource Payment ─────────────────────────────────────────────
  async payResource(studentId: number, input: PayResourceInput) {
    const resource = await prisma.resource.findUnique({ where: { resourceId: input.resourceId } });
    if (!resource) throw new NotFoundError('Resource');
    if (resource.status !== 'published') throw new BadRequestError('Resource is not available');

    const expectedPrice = Number(resource.price);
    if (Math.abs(expectedPrice - input.amount) > 1.0) {
      throw new BadRequestError(`Amount must match resource price: ₹${resource.price}`);
    }

    const paymentMethod = input.paymentMethod || (input.amount === 0 ? 'free' : 'card');
    const transactionRef = input.transactionRef || `TXN-RES-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return prisma.payment.create({
      data: {
        studentId,
        resourceId: input.resourceId,
        amount: input.amount,
        status: 'success',
        paymentMethod,
        transactionRef,
      } as any,
    });
  },

  // ── Bundle Payment ───────────────────────────────────────────────
  async payBundle(studentId: number, input: PayBundleInput) {
    // 1. Verify student role
    const user = await prisma.user.findUnique({ where: { id: studentId } });
    if (!user || user.role !== 'student') {
      throw new AuthorizationError('Only students can purchase study bundles');
    }

    // 2. Verify bundle
    const bundle = await prisma.bundle.findUnique({
      where: { bundleId: input.bundleId },
      include: {
        bundleItems: {
          include: { resource: true },
        },
      },
    });
    if (!bundle) throw new NotFoundError('Bundle');
    if (!bundle.isPublished) throw new BadRequestError('This bundle is not currently available for purchase');

    // 3. Prevent duplicate purchase
    const existingPayment = await prisma.payment.findFirst({
      where: {
        studentId,
        bundleId: input.bundleId,
        status: 'success',
      },
    });
    if (existingPayment) {
      throw new ConflictError('You have already purchased this study bundle');
    }

    // 4. Calculate & validate price
    let expectedPrice = Number(bundle.price);
    if (input.couponCode) {
      const cRes = this.calculateCouponDiscount(input.couponCode, expectedPrice);
      expectedPrice = cRes.finalAmount;
    }

    if (input.amount !== undefined && Math.abs(expectedPrice - input.amount) > 1.0) {
      throw new BadRequestError(`Amount must match bundle price: ₹${expectedPrice}`);
    }

    const finalAmount = input.amount !== undefined ? input.amount : expectedPrice;
    const paymentMethod = input.paymentMethod || (finalAmount === 0 ? 'free' : 'upi');
    const transactionRef = input.transactionRef || `TXN-SB-BND-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await prisma.payment.create({
      data: {
        studentId,
        bundleId: input.bundleId,
        amount: finalAmount,
        status: 'success',
        paymentMethod,
        transactionRef,
      } as any,
      include: {
        bundle: {
          include: {
            tutor: { select: { id: true, name: true, profilePic: true } },
            bundleItems: { include: { resource: true } },
          },
        },
      },
    });

    return {
      payment,
      bundleTitle: bundle.title,
      transactionRef,
      paymentMethod,
      amount: finalAmount,
      itemsUnlocked: bundle.bundleItems?.length || 0,
    };
  },

  // ── List Student Payments ─────────────────────────────────────────
  async listMyPayments(studentId: number) {
    return prisma.payment.findMany({
      where: { studentId },
      orderBy: { paidAt: 'desc' },
      include: {
        course: { select: { courseId: true, title: true } },
        resource: { select: { resourceId: true, filename: true } },
        bundle: {
          select: {
            bundleId: true,
            title: true,
            bundleItems: {
              include: { resource: { select: { resourceId: true, filename: true, fileType: true, fileUrl: true } } },
            },
          },
        },
      },
    });
  },

  // ── List Student Purchased Bundles ────────────────────────────────
  async listMyPurchasedBundles(studentId: number) {
    const payments = await prisma.payment.findMany({
      where: {
        studentId,
        bundleId: { not: null },
        status: 'success',
      },
      orderBy: { paidAt: 'desc' },
      include: {
        bundle: {
          include: {
            tutor: { select: { id: true, name: true, profilePic: true } },
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
                  },
                },
              },
            },
          },
        },
      },
    });

    // Deduplicate by bundleId
    const map = new Map<number, any>();
    for (const p of payments) {
      if (p.bundle && !map.has(p.bundle.bundleId)) {
        map.set(p.bundle.bundleId, {
          ...p.bundle,
          purchasedAt: p.paidAt,
          paidAmount: Number(p.amount),
          paymentId: p.paymentId,
          transactionRef: (p as any).transactionRef,
          paymentMethod: (p as any).paymentMethod,
        });
      }
    }

    return Array.from(map.values());
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

  // ── Refunds ───────────────────────────────────────────────────────
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

