// =====================================================
// StudyBuddy Admin Panel — User Management Service
// Wired to real backend: /api/admin/users/*
// =====================================================

import apiClient from '../api/client';
import type { User, UserFilterParams, PaginatedResult, UserStatus } from '../types/admin';

function mapUser(u: Record<string, unknown>): User {
  const counts = (u._count as Record<string, number>) ?? {};
  return {
    id:          u.id as number,
    name:        u.name as string,
    email:       u.email as string,
    role:        u.role as User['role'],
    status:      u.status as UserStatus,
    profile_pic: (u.profilePic as string) ?? (u.profile_pic as string) ?? undefined,
    is_verified: ((u.isVerified ?? u.is_verified) as boolean) ?? false,
    created_at:  (u.createdAt as string) ?? (u.created_at as string) ?? '',
    last_activity: (u.lastActivity as string) ?? (u.last_activity as string) ?? undefined,
    suspension_reason: (u.suspensionReason as string) ?? (u.suspension_reason as string) ?? undefined,
    suspension_duration: (u.suspensionDuration as string) ?? (u.suspension_duration as string) ?? undefined,
    ban_reason: (u.banReason as string) ?? (u.ban_reason as string) ?? undefined,
    counts: {
      enrollments: counts.enrollments ?? 0,
      courses: counts.courses ?? 0,
      uploadedResources: counts.uploadedResources ?? 0,
      groupMemberships: counts.groupMemberships ?? 0,
      courseReviews: counts.courseReviews ?? 0,
    },
  };
}

export const adminUserService = {
  /**
   * GET /api/admin/users
   */
  async getUsers(params: UserFilterParams = {}): Promise<PaginatedResult<User>> {
    const query = new URLSearchParams();
    if (params.page)       query.set('page',      String(params.page));
    if (params.limit)      query.set('limit',     String(params.limit));
    if (params.search)     query.set('search',    params.search);
    if (params.role && params.role !== 'all')   query.set('role',   params.role);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.is_verified && params.is_verified !== 'all') {
      query.set('verified', params.is_verified === 'verified' ? 'true' : 'false');
    }
    if (params.sort_by)    query.set('sortBy',    params.sort_by === 'created_at' ? 'created_at' : params.sort_by);
    if (params.sort_order) query.set('sortOrder', params.sort_order);

    const { data } = await apiClient.get(`/admin/users?${query.toString()}`);
    const items  = (data.data as Record<string, unknown>[]).map(mapUser);
    const pg     = data.pagination;

    return {
      items,
      total:       pg.total,
      page:        pg.page,
      limit:       pg.limit,
      total_pages: pg.totalPages,
    };
  },

  /**
   * GET /api/admin/users/:id
   */
  async getUserById(id: number): Promise<User | null> {
    try {
      const { data } = await apiClient.get(`/admin/users/${id}`);
      return mapUser(data.data as Record<string, unknown>);
    } catch {
      return null;
    }
  },

  /**
   * PATCH /api/admin/users/:id/suspend
   */
  async suspendUser(id: number, reason: string, duration: string): Promise<User> {
    const { data } = await apiClient.patch(`/admin/users/${id}/suspend`, { reason, duration });
    return mapUser(data.data as Record<string, unknown>);
  },

  /**
   * PATCH /api/admin/users/:id/ban
   */
  async banUser(id: number, reason: string): Promise<User> {
    const { data } = await apiClient.patch(`/admin/users/${id}/ban`, { reason });
    return mapUser(data.data as Record<string, unknown>);
  },

  /**
   * PATCH /api/admin/users/:id/reactivate
   */
  async reactivateUser(id: number): Promise<User> {
    const { data } = await apiClient.patch(`/admin/users/${id}/reactivate`);
    return mapUser(data.data as Record<string, unknown>);
  },

  /**
   * PATCH /api/admin/users/:id/suspend or /ban based on status
   */
  async updateUserStatus(id: number, status: UserStatus): Promise<User> {
    if (status === 'suspended') return this.suspendUser(id, 'Status update', 'indefinite');
    if (status === 'banned')    return this.banUser(id, 'Status update');
    return this.reactivateUser(id);
  },

  /**
   * Bulk suspend — sequential API calls
   */
  async bulkSuspend(ids: number[], reason: string, duration: string): Promise<number> {
    const results = await Promise.allSettled(
      ids.map((id) => apiClient.patch(`/admin/users/${id}/suspend`, { reason, duration }))
    );
    return results.filter((r) => r.status === 'fulfilled').length;
  },

  /**
   * Bulk ban — sequential API calls
   */
  async bulkBan(ids: number[], reason: string): Promise<number> {
    const results = await Promise.allSettled(
      ids.map((id) => apiClient.patch(`/admin/users/${id}/ban`, { reason }))
    );
    return results.filter((r) => r.status === 'fulfilled').length;
  },

  /**
   * DELETE /api/admin/users/:id
   */
  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`);
  },
};
