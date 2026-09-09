/**
 * Admin Backend Tests
 *
 * Tests cover:
 * - Authorization (unauthenticated, student, tutor blocked; admin allowed)
 * - User management (list, search, filter, pagination, get, suspend, ban, reactivate)
 * - Tutor management (list, search, filter, get)
 * - Tutor applications (list, get, approve, reject, double-review prevention)
 * - Security checks (no passwordHash in responses, self-ban prevented, etc.)
 * - Dashboard APIs
 */

import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { signToken } from '../src/utils/jwt';
import bcrypt from 'bcryptjs';

const app = createApp();

// ── Shared test state ──────────────────────────────────────────────
const ts = Date.now();
const studentEmail  = `test_student_${ts}@admin.test`;
const tutorEmail    = `test_tutor_${ts}@admin.test`;
const adminEmail    = `test_admin_${ts}@admin.test`;
const applicantEmail = `test_applicant_${ts}@admin.test`;

let studentToken = '';
let tutorToken   = '';
let adminToken   = '';

let studentId    = 0;
let tutorId      = 0;
let adminId      = 0;
let applicantId  = 0;
let applicationId = 0;

// ── Setup / Teardown ───────────────────────────────────────────────
beforeAll(async () => {
  const hash = await bcrypt.hash('Password123!', 12);

  // Create student
  const student = await prisma.user.create({
    data: { name: 'Test Student', email: studentEmail, passwordHash: hash, role: 'student', isVerified: true },
  });
  studentId    = student.id;
  studentToken = signToken({ userId: student.id, email: student.email, role: student.role });

  // Create tutor
  const tutor = await prisma.user.create({
    data: { name: 'Test Tutor', email: tutorEmail, passwordHash: hash, role: 'tutor', isVerified: true },
  });
  tutorId    = tutor.id;
  tutorToken = signToken({ userId: tutor.id, email: tutor.email, role: tutor.role });

  // Create admin
  const admin = await prisma.user.create({
    data: { name: 'Test Admin', email: adminEmail, passwordHash: hash, role: 'admin', isVerified: true },
  });
  adminId    = admin.id;
  adminToken = signToken({ userId: admin.id, email: admin.email, role: admin.role });

  // Create an applicant with a tutor role and a pending application
  const applicant = await prisma.user.create({
    data: { name: 'Test Applicant', email: applicantEmail, passwordHash: hash, role: 'tutor', isVerified: false },
  });
  applicantId = applicant.id;

  const app2 = await prisma.tutorApplication.create({
    data: {
      userId:        applicant.id,
      trialVideoUrl: 'https://youtube.com/watch?v=testVideo',
      status:        'pending',
    },
  });
  applicationId = app2.applicationId;
});

afterAll(async () => {
  // Cleanup test data
  await prisma.tutorApplication.deleteMany({ where: { userId: { in: [applicantId] } } });
  await prisma.user.deleteMany({
    where: {
      email: { in: [studentEmail, tutorEmail, adminEmail, applicantEmail] },
    },
  });
  await prisma.$disconnect();
});

// ==================================================================
// AUTHORIZATION
// ==================================================================

describe('Admin API Authorization', () => {
  it('should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('should reject student token with 403', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('should reject tutor token with 403', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${tutorToken}`);
    expect(res.status).toBe(403);
  });

  it('should allow admin token', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ==================================================================
// USER MANAGEMENT
// ==================================================================

describe('Admin User Management', () => {
  describe('GET /api/admin/users', () => {
    it('should return paginated users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(20);
      expect(typeof res.body.pagination.total).toBe('number');
      expect(typeof res.body.pagination.totalPages).toBe('number');
    });

    it('should never return passwordHash', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const users = res.body.data as Record<string, unknown>[];
      users.forEach((u) => {
        expect(u.passwordHash).toBeUndefined();
        expect(u.password_hash).toBeUndefined();
      });
    });

    it('should search by name', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=Test+Student')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const hasMatch = (res.body.data as Record<string, unknown>[]).some(
        (u) => (u.email as string) === studentEmail
      );
      expect(hasMatch).toBe(true);
    });

    it('should filter by role=student', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=student')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const users = res.body.data as Record<string, unknown>[];
      users.forEach((u) => expect(u.role).toBe('student'));
    });

    it('should filter by status=active', async () => {
      const res = await request(app)
        .get('/api/admin/users?status=active')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const users = res.body.data as Record<string, unknown>[];
      users.forEach((u) => expect(u.status).toBe('active'));
    });

    it('should reject limit > 100 with 422 validation error', async () => {
      const res = await request(app)
        .get('/api/admin/users?limit=500')
        .set('Authorization', `Bearer ${adminToken}`);
      // Zod schema enforces max(100) — values over 100 are rejected, not silently clamped
      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return user details', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(studentId);
      expect(res.body.data.email).toBe(studentEmail);
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/admin/users/99999999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/admin/users/:id/suspend', () => {
    it('should suspend an active user', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${studentId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test suspension', duration: 'indefinite' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('suspended');
    });

    it('should return 409 if user already suspended', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${studentId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test suspension', duration: 'indefinite' });
      expect(res.status).toBe(409);
    });

    it('should prevent admin from suspending themselves', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Self suspend', duration: 'indefinite' });
      expect(res.status).toBe(400);
    });

    it('should require a reason', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${tutorId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ duration: 'indefinite' }); // missing reason
      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /api/admin/users/:id/reactivate', () => {
    it('should reactivate a suspended user', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${studentId}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
    });

    it('should return 409 if user already active', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${studentId}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /api/admin/users/:id/ban', () => {
    it('should ban a user', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${studentId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Severe violation' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('banned');
    });

    it('should return 409 if already banned', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${studentId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Again' });
      expect(res.status).toBe(409);
    });

    it('should prevent admin from banning themselves', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Self ban' });
      expect(res.status).toBe(400);
    });

    it('should require a reason', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${tutorId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({}); // missing reason
      expect(res.status).toBe(422);
    });

    // Restore student status for subsequent tests
    afterAll(async () => {
      await prisma.user.update({
        where: { id: studentId },
        data: { status: 'active' },
      });
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete a user cleanly', async () => {
      const tempUser = await prisma.user.create({
        data: {
          name: 'Temp To Delete',
          email: `temp_del_${Date.now()}@example.com`,
          passwordHash: 'dummy',
          role: 'student',
        },
      });

      const res = await request(app)
        .delete(`/api/admin/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const inDb = await prisma.user.findUnique({ where: { id: tempUser.id } });
      expect(inDb).toBeNull();
    });

    it('should prevent admin from deleting their own account', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .delete('/api/admin/users/99999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});

// ==================================================================
// TUTOR MANAGEMENT
// ==================================================================

describe('Admin Tutor Management', () => {
  describe('GET /api/admin/tutors', () => {
    it('should return paginated tutor list', async () => {
      const res = await request(app)
        .get('/api/admin/tutors')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should never return passwordHash', async () => {
      const res = await request(app)
        .get('/api/admin/tutors')
        .set('Authorization', `Bearer ${adminToken}`);
      const tutors = res.body.data as Record<string, unknown>[];
      tutors.forEach((t) => {
        expect(t.passwordHash).toBeUndefined();
        expect(t.password_hash).toBeUndefined();
      });
    });

    it('should search tutors by name', async () => {
      const res = await request(app)
        .get(`/api/admin/tutors?search=Test+Tutor`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const match = (res.body.data as Record<string, unknown>[]).some(
        (t) => (t.email as string) === tutorEmail
      );
      expect(match).toBe(true);
    });

    it('should filter by applicationStatus=pending', async () => {
      const res = await request(app)
        .get('/api/admin/tutors?applicationStatus=pending')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/tutors/:id', () => {
    it('should return tutor details with profile, skills, and applications', async () => {
      const res = await request(app)
        .get(`/api/admin/tutors/${tutorId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(tutorId);
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('should return 404 for non-existent tutor', async () => {
      const res = await request(app)
        .get('/api/admin/tutors/99999999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 404 if user is not a tutor', async () => {
      const res = await request(app)
        .get(`/api/admin/tutors/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});

// ==================================================================
// TUTOR APPLICATIONS
// ==================================================================

describe('Admin Tutor Applications', () => {
  describe('GET /api/admin/tutor-applications', () => {
    it('should return paginated applications', async () => {
      const res = await request(app)
        .get('/api/admin/tutor-applications')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter by status=pending', async () => {
      const res = await request(app)
        .get('/api/admin/tutor-applications?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/tutor-applications/:id', () => {
    it('should return application details including trial video URL', async () => {
      const res = await request(app)
        .get(`/api/admin/tutor-applications/${applicationId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.applicationId).toBe(applicationId);
      expect(res.body.data.trialVideoUrl).toBe('https://youtube.com/watch?v=testVideo');
      expect(res.body.data.documents).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return 404 for non-existent application', async () => {
      const res = await request(app)
        .get('/api/admin/tutor-applications/99999999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/admin/tutor-applications/:id/reject', () => {
    it('should require admin_note for rejection', async () => {
      const res = await request(app)
        .patch(`/api/admin/tutor-applications/${applicationId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({}); // missing admin_note
      expect(res.status).toBe(422);
    });

    it('should reject the application with admin_note', async () => {
      // Create a fresh application for rejection test
      const freshApplicant = await prisma.user.create({
        data: {
          name: `RejApplicant_${ts}`,
          email: `reject_${ts}@admin.test`,
          passwordHash: await bcrypt.hash('Password123!', 12),
          role: 'tutor',
          isVerified: false,
        },
      });
      const freshApp = await prisma.tutorApplication.create({
        data: { userId: freshApplicant.id, trialVideoUrl: 'https://test.com', status: 'pending' },
      });

      const res = await request(app)
        .patch(`/api/admin/tutor-applications/${freshApp.applicationId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ admin_note: 'Video quality insufficient' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rejected');

      // Verify reviewedBy is from JWT, not body
      const updated = await prisma.tutorApplication.findUnique({
        where: { applicationId: freshApp.applicationId },
      });
      expect(updated?.reviewedBy).toBe(adminId);
      expect(updated?.reviewedAt).not.toBeNull();

      // Cleanup
      await prisma.tutorApplication.delete({ where: { applicationId: freshApp.applicationId } });
      await prisma.user.delete({ where: { id: freshApplicant.id } });
    });
  });

  describe('PATCH /api/admin/tutor-applications/:id/approve', () => {
    it('should approve a pending application and set tutor state', async () => {
      const res = await request(app)
        .patch(`/api/admin/tutor-applications/${applicationId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ admin_note: 'Excellent teaching demo' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');

      // Verify DB state
      const updatedApp = await prisma.tutorApplication.findUnique({
        where: { applicationId },
      });
      expect(updatedApp?.reviewedBy).toBe(adminId);
      expect(updatedApp?.reviewedAt).not.toBeNull();
      expect(updatedApp?.adminNote).toBe('Excellent teaching demo');

      const updatedUser = await prisma.user.findUnique({ where: { id: applicantId } });
      expect(updatedUser?.isVerified).toBe(true);
      expect(updatedUser?.role).toBe('tutor');
    });

    it('should return 409 when trying to approve an already-reviewed application', async () => {
      const res = await request(app)
        .patch(`/api/admin/tutor-applications/${applicationId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ admin_note: 'Trying again' });
      expect(res.status).toBe(409);
    });

    it('should return 409 when trying to reject an already-approved application', async () => {
      const res = await request(app)
        .patch(`/api/admin/tutor-applications/${applicationId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ admin_note: 'Reject after approve' });
      expect(res.status).toBe(409);
    });
  });
});

// ==================================================================
// DASHBOARD
// ==================================================================

describe('Admin Dashboard', () => {
  it('GET /api/admin/dashboard/overview — should return counts', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.users).toBeDefined();
    expect(res.body.data.tutors).toBeDefined();
    expect(res.body.data.roles).toBeDefined();
    expect(typeof res.body.data.users.total).toBe('number');
  });

  it('GET /api/admin/dashboard/user-growth — default 30d', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/user-growth')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/admin/dashboard/tutor-applications — returns counts', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/tutor-applications')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.pending).toBe('number');
    expect(typeof res.body.data.approved).toBe('number');
    expect(typeof res.body.data.rejected).toBe('number');
  });

  it('GET /api/admin/dashboard/recent-activity — returns structured data', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/recent-activity')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.recentRegistrations).toBeDefined();
  });

  it('should reject unauthenticated dashboard request with 401', async () => {
    const res = await request(app).get('/api/admin/dashboard/overview');
    expect(res.status).toBe(401);
  });
});
