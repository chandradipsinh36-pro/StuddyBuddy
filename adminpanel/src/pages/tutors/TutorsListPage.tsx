import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  MoreVertical,
  Eye,
  FileCheck,
  UserMinus,
  UserCheck,
  UserX,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { adminTutorService } from '../../services/adminTutorService';
import { adminUserService } from '../../services/adminUserService';
import { adminDashboardService } from '../../services/adminDashboardService';
import type { TutorProfile, ApplicationStatus, UserStatus } from '../../types/admin';
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
import { ROUTES } from '../../constants';

export const TutorsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParam = searchParams.get('search') || '';
  const appStatusParam = (searchParams.get('app_status') as ApplicationStatus) || 'all';
  const accStatusParam = (searchParams.get('status') as UserStatus) || 'all';
  const verParam = (searchParams.get('verified') as any) || 'all';
  const pageParam = Number(searchParams.get('page')) || 1;
  const limitParam = Number(searchParams.get('limit')) || 10;

  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Modals for suspension/ban/reactivate/delete
  const [modalUser, setModalUser] = useState<any>(null);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isBanOpen, setIsBanOpen] = useState(false);
  const [isReactivateOpen, setIsReactivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [overview, setOverview] = useState<{
    tutors: { total: number; approved: number; pending: number; rejected: number };
  } | null>(null);

  useEffect(() => {
    adminDashboardService.getOverview().then(setOverview).catch(() => {});
  }, []);

  const fetchTutors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminTutorService.getTutors({
        search: searchParam,
        application_status: appStatusParam,
        account_status: accStatusParam,
        is_verified: verParam,
        page: pageParam,
        limit: limitParam,
      });
      setTutors(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      toast.error('Unable to load tutors.');
    } finally {
      setIsLoading(false);
    }
  }, [searchParam, appStatusParam, accStatusParam, verParam, pageParam, limitParam]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

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

  const handleSuspend = async (userId: number, reason: string, duration: string) => {
    await adminUserService.suspendUser(userId, reason, duration);
    toast.success('Tutor account suspended.');
    fetchTutors();
  };

  const handleBan = async (userId: number, reason: string) => {
    await adminUserService.banUser(userId, reason);
    toast.success('Tutor account banned.');
    fetchTutors();
  };

  const handleReactivate = async (userId: number) => {
    await adminUserService.reactivateUser(userId);
    toast.success('Tutor account reactivated.');
    fetchTutors();
  };

  const handleDeleteConfirm = async (userId: number) => {
    await adminTutorService.deleteTutor(userId);
    toast.success('Tutor account deleted permanently.');
    fetchTutors();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
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
            Tutor Management
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 2 }}>
            Manage approved tutors, inspect teaching specializations, and audit tutor status.
          </p>
        </div>

        <Link to={ROUTES.TUTOR_APPLICATIONS} className="btn btn-primary btn-sm">
          <Clock size={16} />
          <span>Review Pending Applications{overview?.tutors.pending ? ` (${overview.tutors.pending})` : ''}</span>
        </Link>
      </div>

      {/* Summary KPI Cards Row (Section 17) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-600)' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Total Tutors</div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
              {overview?.tutors.total ?? total}
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Pending Applications</div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-warning-dark)' }}>
              {overview?.tutors.pending ?? 0}
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Approved Tutors</div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-success-dark)' }}>
              {overview?.tutors.approved ?? 0}
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)' }}>
            <XCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Rejected</div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-danger-dark)' }}>
              {overview?.tutors.rejected ?? 0}
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-600)' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Verified Tutors</div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-primary-600)' }}>
              {overview?.tutors.approved ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ flex: '1 1 280px', maxWidth: 360 }}>
          <SearchInput
            value={searchParam}
            onChange={(val) => updateParam('search', val)}
            placeholder="Search tutor name, email, institute..."
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <FilterDropdown
            label="Application"
            value={appStatusParam}
            onChange={(val) => updateParam('app_status', val)}
            options={[
              { value: 'all', label: 'All Applications' },
              { value: 'approved', label: 'Approved' },
              { value: 'pending', label: 'Pending' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />

          <FilterDropdown
            label="Account Status"
            value={accStatusParam}
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
            value={verParam}
            onChange={(val) => updateParam('verified', val)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'verified', label: 'Verified' },
              { value: 'unverified', label: 'Unverified' },
            ]}
          />

          <button
            onClick={handleResetFilters}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-gray-500)' }}
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Tutors Table */}
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
            <TableSkeleton rows={6} cols={7} />
          </div>
        ) : tutors.length === 0 ? (
          <EmptyState
            title="No Tutors Found"
            message="No tutors match your search criteria or filters."
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
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Tutor</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Institute</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Skills</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Experience</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Application</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Account</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Joined Date</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 700 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tutors.map((tutor) => {
                  const isMenuOpen = activeMenuId === tutor.tutor_id;

                  return (
                    <tr
                      key={tutor.tutor_id || tutor.user.id || tutor.profile_id}
                      style={{
                        borderBottom: '1px solid var(--color-border-subtle)',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* Tutor Cell */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <img
                            src={tutor.user.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tutor'}
                            alt={tutor.user.name}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid var(--color-border)',
                            }}
                          />
                          <div>
                            <div
                              onClick={() => navigate(ROUTES.TUTOR_PROFILE(tutor.tutor_id))}
                              style={{
                                fontWeight: 700,
                                color: 'var(--color-gray-900)',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary-600)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-gray-900)'; }}
                            >
                              {tutor.user.name}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                              {tutor.user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Institute */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-gray-700)', fontSize: 'var(--font-size-xs)' }}>
                        {tutor.institute_name}
                      </td>

                      {/* Skills */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                          {tutor.skills.slice(0, 2).map((s) => (
                            <span
                              key={s.skill_id}
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                backgroundColor: 'var(--color-gray-100)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--color-gray-700)',
                              }}
                            >
                              {s.skill_name}
                            </span>
                          ))}
                          {tutor.skills.length > 2 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)', alignSelf: 'center' }}>
                              +{tutor.skills.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Experience */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                        {tutor.experience_years} years
                      </td>

                      {/* Application Status */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <StatusBadge status={tutor.application_status} label={tutor.application_status} />
                      </td>

                      {/* Account Status */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <StatusBadge status={tutor.user.status} label={tutor.user.status} />
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                        {new Date(tutor.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions Menu */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', position: 'relative' }}>
                        <button
                          onClick={() => setActiveMenuId(isMenuOpen ? null : tutor.tutor_id)}
                          className="btn btn-ghost btn-icon-only"
                          aria-label="Tutor actions menu"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <>
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
                                  navigate(ROUTES.TUTOR_PROFILE(tutor.tutor_id));
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
                                <span>View Profile</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  navigate(ROUTES.TUTOR_APPLICATION_REVIEW(tutor.application_id));
                                }}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--space-2)',
                                  padding: '0.45rem var(--space-3)',
                                  fontSize: 'var(--font-size-xs)',
                                  color: 'var(--color-primary-600)',
                                  borderRadius: 'var(--radius-md)',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary-50)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <FileCheck size={14} />
                                <span>Review Application</span>
                              </button>

                              <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

                              {tutor.user.status === 'active' && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setModalUser(tutor.user);
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
                                  <span>Suspend Tutor</span>
                                </button>
                              )}

                              {(tutor.user.status === 'suspended' || tutor.user.status === 'banned') && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setModalUser(tutor.user);
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
                                  <span>Reactivate Account</span>
                                </button>
                              )}

                              {tutor.user.status !== 'banned' && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setModalUser(tutor.user);
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
                                  <span>Ban Tutor</span>
                                </button>
                              )}

                              <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setModalUser(tutor.user);
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
                                <span>Delete Tutor</span>
                              </button>
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

      {/* Modals */}
      <SuspendUserModal
        user={modalUser}
        isOpen={isSuspendOpen}
        onClose={() => {
          setIsSuspendOpen(false);
          setModalUser(null);
        }}
        onConfirm={handleSuspend}
      />

      <BanUserModal
        user={modalUser}
        isOpen={isBanOpen}
        onClose={() => {
          setIsBanOpen(false);
          setModalUser(null);
        }}
        onConfirm={handleBan}
      />

      <ReactivateUserModal
        user={modalUser}
        isOpen={isReactivateOpen}
        onClose={() => {
          setIsReactivateOpen(false);
          setModalUser(null);
        }}
        onConfirm={handleReactivate}
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
    </div>
  );
};
