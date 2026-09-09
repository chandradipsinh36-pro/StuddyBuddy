import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import dashboardRoutes     from './adminDashboard.routes';
import userRoutes          from './adminUser.routes';
import tutorRoutes         from './adminTutor.routes';
import applicationRoutes   from './adminApplication.routes';

const router = Router();

// ── Admin-only guard applied to ALL admin routes ───────────────────
// authenticate: validates JWT and populates req.user
// authorize('admin'): rejects any role that is not 'admin'
router.use(authenticate, authorize('admin'));

// ── Sub-routers ────────────────────────────────────────────────────
router.use('/dashboard',           dashboardRoutes);
router.use('/users',               userRoutes);
router.use('/tutors',              tutorRoutes);
router.use('/tutor-applications',  applicationRoutes);

export default router;
