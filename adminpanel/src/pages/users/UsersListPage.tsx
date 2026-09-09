import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MoreVertical,
  Eye,
  Edit2,
  UserMinus,
  UserX,
  UserCheck,
  KeyRound,
  Download,
  RotateCcw,
  Shield,
  Trash2,
} from 'lucide-react';
import { adminUserService } from '../../services/adminUserService';
import type { User, UserRole, UserStatus } from '../../types/admin';
import { SearchInput } from '../../components/common/SearchInput';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { SuspendUserModal } from '../../components/modals/SuspendUserModal';
import { BanUserModal } from '../../components/modals/BanUserModal';
import { ReactivateUserModal } from '../../components/modals/ReactivateUserModal';
import { DeleteUserModal } from '../../components/modals/DeleteUserModal';
import { BulkActionModal } from '../../components/modals/BulkActionModal';
import { ROUTES } from '../../constants';

export const UsersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters State
  const searchParam = searchParams.get('search') || '';
  const roleParam = (searchParams.get('role') as UserRole) || 'all';
  const statusParam = (searchParams.get('status') as UserStatus) || 'all';
  const verificationParam = (searchParams.get('verified') as any) || 'all';
  const pageParam = Number(searchParams.get('page')) || 1;
  const limitParam = Number(searchParams.get('limit')) || 10;
  const sortParam = (searchParams.get('sort') as any) || 'created_at';
  const orderParam = (searchParams.get('order') as any) || 'desc';

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Row selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Action Menu Dropdown State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Modals
  const [modalUser, setModalUser] = useState<User | null>(null);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isBanOpen, setIsBanOpen] = useState(false);
  const [isReactivateOpen, setIsReactivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'suspend' | 'ban' | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminUserService.getUsers({
        search: searchParam,
        role: roleParam,
        status: statusParam,
        is_verified: verificationParam,
        sort_by: sortParam,
        sort_order: orderParam,
        page: pageParam,
        limit: limitParam,
      });
      setUsers(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      toast.error('Unable to load users.');
    } finally {
      setIsLoading(false);
    }
  }, [searchParam, roleParam, statusParam, verificationParam, sortParam, orderParam, pageParam, limitParam]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle URL param changes
  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Action Handlers
  const handleSuspendConfirm = async (userId: number, reason: string, duration: string) => {
    await adminUserService.suspendUser(userId, reason, duration);
    toast.success('User suspended successfully.');
    fetchUsers();
  };

  const handleBanConfirm = async (userId: number, reason: string) => {
    await adminUserService.banUser(userId, reason);
    toast.success('User account banned.');
    fetchUsers();
  };

  const handleReactivateConfirm = async (userId: number) => {
    await adminUserService.reactivateUser(userId);
    toast.success('User account reactivated successfully.');
    fetchUsers();
  };

  const handleDeleteConfirm = async (userId: number) => {
    await adminUserService.deleteUser(userId);
    toast.success('User account deleted permanently.');
    fetchUsers();
  };

  const handleBulkActionConfirm = async (reason: string, duration?: string) => {
    if (bulkAction === 'suspend') {
      const count = await adminUserService.bulkSuspend(selectedIds, reason, duration || '7_days');
      toast.success(`${count} users suspended successfully.`);
    } else if (bulkAction === 'ban') {
      const count = await adminUserService.bulkBan(selectedIds, reason);
      toast.success(`${count} users banned successfully.`);
    }
    setSelectedIds([]);
    setBulkAction(null);
    fetchUsers();
  };

  const handleExportCSV = () => {
    const selectedUsers = users.filter((u) => selectedIds.includes(u.id));
    const target = selectedUsers.length > 0 ? selectedUsers : users;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Name,Email,Role,Status,Verified,CreatedAt']
        .concat(
          target.map(
            (u) =>
              `${u.id},"${u.name}","${u.email}",${u.role},${u.status},${u.is_verified},"${u.created_at}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `studybuddy_users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${target.length} user records.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Title & Top Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              color: 'var(--color-gray-900)',
              letterSpacing: '-0.02em',
            }}
          >
            User Management
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 2 }}>
            Manage students, tutors, and administrative users across the platform.
          </p>
        </div>

        {/* Global Export Button */}
        <button
          onClick={handleExportCSV}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <Download size={16} />
          <span>Export Users</span>
        </button>
      </div>

      {/* Filters Card */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          {/* Instant Search */}
          <div style={{ flex: '1 1 280px', maxWidth: 380 }}>
            <SearchInput
              value={searchParam}
              onChange={(val) => updateParam('search', val)}
              placeholder="Search by name or email..."
            />
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <FilterDropdown
              label="Role"
              value={roleParam}
              onChange={(val) => updateParam('role', val)}
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'student', label: 'Students' },
                { value: 'tutor', label: 'Tutors' },
                { value: 'admin', label: 'Admins' },
              ]}
            />

            <FilterDropdown
              label="Status"
              value={statusParam}
              onChange={(val) => updateParam('status', val)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'banned', label: 'Banned' },
              ]}
            />

            <FilterDropdown
              label="Verification"
              value={verificationParam}
              onChange={(val) => updateParam('verified', val)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'verified', label: 'Verified' },
                { value: 'unverified', label: 'Unverified' },
              ]}
            />

            <FilterDropdown
              label="Sort"
              value={sortParam}
              onChange={(val) => updateParam('sort', val)}
              options={[
                { value: 'created_at', label: 'Joined Date' },
                { value: 'name', label: 'Name' },
                { value: 'last_activity', label: 'Last Activity' },
              ]}
            />

            <button
              onClick={handleResetFilters}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-gray-500)' }}
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Bulk Action Bar (Visible when users selected) */}
        {selectedIds.length > 0 && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-primary-50)',
              border: '1px solid var(--color-primary-200)',
              borderRadius: 'var(--radius-lg)',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-700)' }}>
                {selectedIds.length} users selected
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button
                onClick={() => setBulkAction('suspend')}
                className="btn btn-warning btn-sm"
              >
                <UserMinus size={14} />
                <span>Suspend Selected</span>
              </button>

              <button
                onClick={() => setBulkAction('ban')}
                className="btn btn-danger btn-sm"
              >
                <UserX size={14} />
                <span>Ban Selected</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="btn btn-secondary btn-sm"
              >
                <Download size={14} />
                <span>Export Selected</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                Deselect All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Data Table */}
      <div
        className="admin-card"
        style={{
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading ? (
          <div style={{ padding: 'var(--space-6)' }}>
            <TableSkeleton rows={8} cols={7} />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No Users Found"
            message="No users match your current filters or search terms."
            actionText="Clear Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-gray-500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: 'var(--space-3) var(--space-4)', width: 44 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === users.length && users.length > 0}
                      onChange={toggleSelectAll}
                      style={{ accentColor: 'var(--color-primary-500)', cursor: 'pointer' }}
                      aria-label="Select all users on this page"
                    />
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>User</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Role</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Verification</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Joined Date</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Last Activity</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 700 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelected = selectedIds.includes(user.id);
                  const isMenuOpen = activeMenuId === user.id;

                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid var(--color-border-subtle)',
                        backgroundColor: isSelected ? 'var(--color-primary-50)' : 'transparent',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(user.id)}
                          style={{ accentColor: 'var(--color-primary-500)', cursor: 'pointer' }}
                          aria-label={`Select user ${user.name}`}
                        />
                      </td>

                      {/* User (Avatar, Name, Email) */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <img
                            src={user.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                            alt={user.name}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid var(--color-border)',
                            }}
                          />
                          <div>
                            <div
                              onClick={() => navigate(ROUTES.USER_DETAIL(user.id))}
                              style={{
                                fontWeight: 700,
                                color: 'var(--color-gray-900)',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary-600)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-gray-900)'; }}
                            >
                              {user.name}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <StatusBadge status={user.role} label={user.role} />
                      </td>

                      {/* Verification */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <StatusBadge
                          status={user.is_verified ? 'verified' : 'unverified'}
                          label={user.is_verified ? 'Verified' : 'Unverified'}
                        />
                      </td>

                      {/* Status */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <StatusBadge status={user.status} label={user.status} />
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-gray-600)', fontSize: 'var(--font-size-xs)' }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>

                      {/* Last Activity */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-gray-600)', fontSize: 'var(--font-size-xs)' }}>
                        {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'Never'}
                      </td>

                      {/* Actions Dropdown */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', position: 'relative' }}>
                        <button
                          onClick={() => setActiveMenuId(isMenuOpen ? null : user.id)}
                          className="btn btn-ghost btn-icon-only"
                          aria-label="User actions menu"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <>
                            {/* Backdrop to close */}
                            <div
                              onClick={() => setActiveMenuId(null)}
                              style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-dropdown)' }}
                            />

                            <div
                              className="admin-card animate-fade-in"
                              style={{
                                position: 'absolute',
                                right: 16,
                                top: 'calc(100% - 4px)',
                                width: 190,
                                padding: 'var(--space-1)',
                                zIndex: 'calc(var(--z-dropdown) + 1)',
                                boxShadow: 'var(--shadow-xl)',
                                textAlign: 'left',
                              }}
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  navigate(ROUTES.USER_DETAIL(user.id));
                                }}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--space-2)',
                                  padding: '0.45rem var(--space-3)',
                                  fontSize: 'var(--font-size-xs)',
                                  color: 'var(--color-gray-700)',
                                  borderRadius: 'var(--radius-md)',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Eye size={14} />
                                <span>View Details</span>
                              </button>

                              {user.role === 'tutor' && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    navigate(ROUTES.TUTOR_PROFILE(user.id));
                                  }}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    padding: '0.45rem var(--space-3)',
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-gray-700)',
                                    borderRadius: 'var(--radius-md)',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                  <Shield size={14} />
                                  <span>Tutor Profile</span>
                                </button>
                              )}

                              {user.role !== 'admin' && (
                                <>
                                  <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

                                  {/* Suspend Action (Active -> Suspend) */}
                                  {user.status === 'active' && (
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setModalUser(user);
                                        setIsSuspendOpen(true);
                                      }}
                                      style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)',
                                        padding: '0.45rem var(--space-3)',
                                        fontSize: 'var(--font-size-xs)',
                                        color: 'var(--color-suspended-dark)',
                                        borderRadius: 'var(--radius-md)',
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-suspended-light)'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                      <UserMinus size={14} />
                                      <span>Suspend User</span>
                                    </button>
                                  )}

                                  {/* Reactivate Action (Suspended/Banned -> Reactivate) */}
                                  {(user.status === 'suspended' || user.status === 'banned') && (
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setModalUser(user);
                                        setIsReactivateOpen(true);
                                      }}
                                      style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)',
                                        padding: '0.45rem var(--space-3)',
                                        fontSize: 'var(--font-size-xs)',
                                        color: 'var(--color-success-dark)',
                                        borderRadius: 'var(--radius-md)',
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-success-light)'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                      <UserCheck size={14} />
                                      <span>Reactivate User</span>
                                    </button>
                                  )}

                                  {/* Ban Action (Active/Suspended -> Ban) */}
                                  {user.status !== 'banned' && (
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setModalUser(user);
                                        setIsBanOpen(true);
                                      }}
                                      style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)',
                                        padding: '0.45rem var(--space-3)',
                                        fontSize: 'var(--font-size-xs)',
                                        color: 'var(--color-danger)',
                                        borderRadius: 'var(--radius-md)',
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-danger-light)'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                      <UserX size={14} />
                                      <span>Ban User</span>
                                    </button>
                                  )}

                                  <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      toast.success(`Password reset link sent to ${user.email}`);
                                    }}
                                    style={{
                                      width: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 'var(--space-2)',
                                      padding: '0.45rem var(--space-3)',
                                      fontSize: 'var(--font-size-xs)',
                                      color: 'var(--color-gray-600)',
                                      borderRadius: 'var(--radius-md)',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                  >
                                    <KeyRound size={14} />
                                    <span>Reset Password</span>
                                  </button>

                                  <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setModalUser(user);
                                      setIsDeleteOpen(true);
                                    }}
                                    style={{
                                      width: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 'var(--space-2)',
                                      padding: '0.45rem var(--space-3)',
                                      fontSize: 'var(--font-size-xs)',
                                      color: 'var(--color-danger)',
                                      fontWeight: 600,
                                      borderRadius: 'var(--radius-md)',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-danger-light)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete User</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        <div style={{ padding: '0 var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
          <Pagination
            currentPage={pageParam}
            totalPages={totalPages}
            totalItems={total}
            limit={limitParam}
            onPageChange={(p) => updateParam('page', String(p))}
            onLimitChange={(l) => updateParam('limit', String(l))}
          />
        </div>
      </div>

      {/* Action Modals */}
      <SuspendUserModal
        user={modalUser}
        isOpen={isSuspendOpen}
        onClose={() => {
          setIsSuspendOpen(false);
          setModalUser(null);
        }}
        onConfirm={handleSuspendConfirm}
      />

      <BanUserModal
        user={modalUser}
        isOpen={isBanOpen}
        onClose={() => {
          setIsBanOpen(false);
          setModalUser(null);
        }}
        onConfirm={handleBanConfirm}
      />

      <ReactivateUserModal
        user={modalUser}
        isOpen={isReactivateOpen}
        onClose={() => {
          setIsReactivateOpen(false);
          setModalUser(null);
        }}
        onConfirm={handleReactivateConfirm}
      />

      <DeleteUserModal
        user={modalUser}
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setModalUser(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      {bulkAction && (
        <BulkActionModal
          isOpen={!!bulkAction}
          onClose={() => setBulkAction(null)}
          actionType={bulkAction}
          selectedCount={selectedIds.length}
          onConfirm={handleBulkActionConfirm}
        />
      )}
    </div>
  );
};
