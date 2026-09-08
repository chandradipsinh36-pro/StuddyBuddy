import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

// Routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import tutorsRoutes from './modules/tutors/tutors.routes';
import tutorApplicationsRoutes from './modules/tutor-applications/tutor-applications.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import coursesRoutes, { tutorCourseRouter } from './modules/courses/courses.routes';
import resourcesRoutes, { tutorResourceRouter } from './modules/resources/resources.routes';
import bundlesRoutes, { tutorBundleRouter } from './modules/bundles/bundles.routes';
import paymentsRoutes, { refundsRouter } from './modules/payments/payments.routes';
import { courseEnrollRouter, studentEnrollmentsRouter } from './modules/enrollments/enrollments.routes';
import {
  courseReviewRouter, courseReviewDetailRouter,
  tutorReviewRouter, tutorReviewDetailRouter,
} from './modules/reviews/reviews.routes';
import groupsRoutes from './modules/groups/groups.routes';
import { prisma } from './config/database';

export function createApp(): Application {
  const app = express();

  // ── Security ────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ── Body parsing ─────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Logging ──────────────────────────────────────────────────────
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // ── Rate limiting ─────────────────────────────────────────────────
  app.use('/api', generalLimiter);

  // ── Health check ──────────────────────────────────────────────────
  app.get('/api/health', async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ success: true, data: { status: 'ok', database: 'connected' } });
    } catch {
      res.status(503).json({ success: false, data: { status: 'degraded', database: 'disconnected' } });
    }
  });

  // ── API Routes ────────────────────────────────────────────────────
  app.use('/api/auth',              authRoutes);
  app.use('/api/users',             usersRoutes);
  app.use('/api/tutors',            tutorsRoutes);
  app.use('/api/tutor-applications', tutorApplicationsRoutes);
  app.use('/api/categories',        categoriesRoutes);

  // Courses (public + tutor)
  app.use('/api/courses',           coursesRoutes);
  app.use('/api/courses/:courseId/enroll', courseEnrollRouter);
  app.use('/api/courses/:courseId/reviews', courseReviewRouter);
  app.use('/api/tutor/courses',     tutorCourseRouter);
  app.use('/api/course-reviews',    courseReviewDetailRouter);

  // Resources
  app.use('/api/resources',         resourcesRoutes);
  app.use('/api/tutor/resources',   tutorResourceRouter);

  // Bundles
  app.use('/api/bundles',           bundlesRoutes);
  app.use('/api/tutor/bundles',     tutorBundleRouter);

  // Payments & Refunds
  app.use('/api/payments',          paymentsRoutes);
  app.use('/api/refunds',           refundsRouter);

  // Enrollments (student)
  app.use('/api/students',          studentEnrollmentsRouter);

  // Reviews
  app.use('/api/tutors/:tutorId/reviews', tutorReviewRouter);
  app.use('/api/tutor-reviews',     tutorReviewDetailRouter);

  // Groups (chat, payments, reports)
  app.use('/api/groups',            groupsRoutes);

  // ── 404 ──────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  // ── Error handler (must be last) ──────────────────────────────────
  app.use(errorHandler);

  return app;
}
