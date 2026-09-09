import { prisma } from '../../config/database';
import { DashboardPeriodQuery } from './admin.schema';

// Prisma raw returns BigInt for COUNT — helper to convert
function toNumber(val: unknown): number {
  if (typeof val === 'bigint') return Number(val);
  if (typeof val === 'number') return val;
  return parseInt(String(val ?? '0'), 10);
}

export const adminDashboardService = {
  // ── Overview ──────────────────────────────────────────────────────
  async getOverview() {
    const [
      totalUsers, activeUsers, suspendedUsers, bannedUsers,
      studentCount, tutorCount, adminCount,
      totalApplications, pendingApplications, approvedApplications, rejectedApplications,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { status: 'suspended' } }),
      prisma.user.count({ where: { status: 'banned' } }),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.user.count({ where: { role: 'tutor' } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.tutorApplication.count(),
      prisma.tutorApplication.count({ where: { status: 'pending' } }),
      prisma.tutorApplication.count({ where: { status: 'approved' } }),
      prisma.tutorApplication.count({ where: { status: 'rejected' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        banned: bannedUsers,
      },
      tutors: {
        total: tutorCount,
        approved: approvedApplications,
        pending: pendingApplications,
        rejected: rejectedApplications,
      },
      roles: {
        students: studentCount,
        tutors: tutorCount,
        admins: adminCount,
      },
    };
  },

  // ── User growth ───────────────────────────────────────────────────
  async getUserGrowth(query: DashboardPeriodQuery) {
    const periodDays: Record<string, number> = {
      '7d':  7,
      '30d': 30,
      '90d': 90,
      '1y':  365,
    };

    const days = periodDays[query.period] ?? 30;

    // Use raw SQL for date-level aggregation (Prisma doesn't support groupBy DateTime as date)
    const rows = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT
        DATE("created_at" AT TIME ZONE 'UTC') AS date,
        COUNT(*)::bigint AS count
      FROM "users"
      WHERE "created_at" >= NOW() - (${days} || ' days')::INTERVAL
      GROUP BY DATE("created_at" AT TIME ZONE 'UTC')
      ORDER BY date ASC
    `;

    return rows.map((r) => ({
      date:  r.date.toISOString().slice(0, 10),
      count: toNumber(r.count),
    }));
  },

  // ── Tutor application analytics ───────────────────────────────────
  async getTutorApplicationAnalytics() {
    const [pending, underReview, approved, rejected, needsChanges] = await prisma.$transaction([
      prisma.tutorApplication.count({ where: { status: 'pending' } }),
      prisma.tutorApplication.count({ where: { status: 'under_review' } }),
      prisma.tutorApplication.count({ where: { status: 'approved' } }),
      prisma.tutorApplication.count({ where: { status: 'rejected' } }),
      prisma.tutorApplication.count({ where: { status: 'needs_changes' } }),
    ]);

    return { pending, under_review: underReview, approved, rejected, needs_changes: needsChanges };
  },

  // ── Recent activity derived from existing timestamps ──────────────
  async getRecentActivity(limit = 20) {
    // Derive activity from existing models without a separate audit table
    const [recentUsers, recentApps, recentSuspended, recentBanned] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: { id: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.tutorApplication.findMany({
        where: { appliedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: {
          applicationId: true,
          status: true,
          appliedAt: true,
          reviewedAt: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { appliedAt: 'desc' },
        take: limit,
      }),
      prisma.user.findMany({
        where: { status: 'suspended' },
        select: { id: true, name: true, role: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.user.findMany({
        where: { status: 'banned' },
        select: { id: true, name: true, role: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      recentRegistrations: recentUsers,
      recentApplications: recentApps,
      suspendedUsers: recentSuspended,
      bannedUsers: recentBanned,
      note: 'Derived from existing data — no separate audit log table',
    };
  },
};
