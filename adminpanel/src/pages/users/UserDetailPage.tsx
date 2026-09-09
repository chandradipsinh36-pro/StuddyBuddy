import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  Mail,
  Calendar,
  Clock,
  ShieldCheck,
  UserMinus,
  UserX,
  UserCheck,
  BookOpen,
  FolderOpen,
  Users as UsersIcon,
  Star,
  Activity,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { adminUserService } from '../../services/adminUserService';
import type { User } from '../../types/admin';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SuspendUserModal } from '../../components/modals/SuspendUserModal';
import { BanUserModal } from '../../components/modals/BanUserModal';
import { ReactivateUserModal } from '../../components/modals/ReactivateUserModal';
import { DeleteUserModal } from '../../components/modals/DeleteUserModal';
import { ROUTES } from '../../constants';

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isBanOpen, setIsBanOpen] = useState(false);
  const [isReactivateOpen, setIsReactivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchUser = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await adminUserService.getUserById(Number(id));
      setUser(data);
    } catch {
      toast.error('Failed to load user profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-6)' }}>
        <div style={{ height: 160, backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-xl)' }} className="animate-pulse" />
        <div style={{ height: 320, backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-xl)' }} className="animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
        <h3>User not found</h3>
        <button onClick={() => navigate(ROUTES.USERS)} className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
          Back to User Management
        </button>
      </div>
    );
  }

  const handleSuspend = async (userId: number, reason: string, duration: string) => {
    await adminUserService.suspendUser(userId, reason, duration);
    toast.success('User account suspended.');
    fetchUser();
  };

  const handleBan = async (userId: number, reason: string) => {
    await adminUserService.banUser(userId, reason);
    toast.success('User account banned.');
    fetchUser();
  };

  const handleReactivate = async (userId: number) => {
    await adminUserService.reactivateUser(userId);
    toast.success('User account reactivated.');
    fetchUser();
  };

  const handleDelete = async (userId: number) => {
    await adminUserService.deleteUser(userId);
    toast.success('User account deleted permanently.');
    navigate(ROUTES.USERS);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Back button */}
      <div>
        <Link
          to={ROUTES.USERS}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gray-600)',
          }}
        >
          <ChevronLeft size={16} />
          <span>Back to All Users</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
          <img
            src={user.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
            alt={user.name}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--color-primary-100)',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                {user.name}
              </h2>
              <StatusBadge status={user.role} label={user.role} />
              <StatusBadge status={user.status} label={user.status} />
              <StatusBadge status={user.is_verified ? 'verified' : 'unverified'} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-2)', color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={14} /> {user.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} /> Member since {new Date(user.created_at).toLocaleDateString()}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={14} /> Active {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons depending on account status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {user.role !== 'admin' && (
            <>
              {user.status === 'active' && (
                <button onClick={() => setIsSuspendOpen(true)} className="btn btn-warning">
                  <UserMinus size={16} />
                  <span>Suspend User</span>
                </button>
              )}

              {(user.status === 'suspended' || user.status === 'banned') && (
                <button onClick={() => setIsReactivateOpen(true)} className="btn btn-success">
                  <UserCheck size={16} />
                  <span>Reactivate User</span>
                </button>
              )}

              {user.status !== 'banned' && (
                <button onClick={() => setIsBanOpen(true)} className="btn btn-danger">
                  <UserX size={16} />
                  <span>Ban User</span>
                </button>
              )}

              <button onClick={() => setIsDeleteOpen(true)} className="btn btn-danger" style={{ backgroundColor: '#DC2626' }}>
                <Trash2 size={16} />
                <span>Delete User</span>
              </button>
            </>
          )}

          {user.role === 'tutor' && (
            <Link to={ROUTES.TUTOR_PROFILE(user.id)} className="btn btn-secondary">
              <ShieldCheck size={16} />
              <span>Tutor Profile</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Details Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Section A & B: Basic & Account Information */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
            Account Credentials & Metadata
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ color: 'var(--color-gray-500)' }}>Internal User ID</span>
              <strong style={{ color: 'var(--color-gray-900)', fontFamily: 'var(--font-family-mono)' }}>#{user.id}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ color: 'var(--color-gray-500)' }}>Full Name</span>
              <strong style={{ color: 'var(--color-gray-900)' }}>{user.name}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ color: 'var(--color-gray-500)' }}>Registered Email</span>
              <strong style={{ color: 'var(--color-gray-900)' }}>{user.email}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ color: 'var(--color-gray-500)' }}>Role Assignment</span>
              <strong style={{ textTransform: 'capitalize' }}>{user.role}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ color: 'var(--color-gray-500)' }}>Identity Verification</span>
              <span>{user.is_verified ? 'Verified Email & Identity' : 'Pending Verification'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0' }}>
              <span style={{ color: 'var(--color-gray-500)' }}>Password Security</span>
              <span style={{ color: 'var(--color-success-dark)', fontWeight: 600 }}>Encrypted (Bcrypt)</span>
            </div>
          </div>

          {user.suspension_reason && (
            <div
              style={{
                marginTop: 'var(--space-2)',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--color-suspended-light)',
                border: '1px solid var(--color-suspended-border)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-suspended-dark)',
              }}
            >
              <strong>Active Suspension Details:</strong>
              <p style={{ marginTop: 4 }}>{user.suspension_reason}</p>
              {user.suspension_duration && (
                <div style={{ marginTop: 4, fontWeight: 600 }}>
                  Duration: {user.suspension_duration.replace('_', ' ')}
                </div>
              )}
            </div>
          )}

          {user.ban_reason && (
            <div
              style={{
                marginTop: 'var(--space-2)',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--color-danger-light)',
                border: '1px solid var(--color-danger-border)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-danger-dark)',
              }}
            >
              <strong>Permanent Ban Reason:</strong>
              <p style={{ marginTop: 4 }}>{user.ban_reason}</p>
            </div>
          )}
        </div>

        {/* Section C: Activity Summary */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
            Activity Summary
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-primary-600)' }}>
                <BookOpen size={18} />
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>Courses</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginTop: 'var(--space-1)' }}>
                {user.role === 'tutor'
                  ? `${user.counts?.courses ?? 0} Published`
                  : `${user.counts?.enrollments ?? 0} Enrolled`}
              </div>
            </div>

            <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-success)' }}>
                <FolderOpen size={18} />
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>Resources</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginTop: 'var(--space-1)' }}>
                {user.role === 'tutor'
                  ? `${user.counts?.uploadedResources ?? 0} Uploaded`
                  : `${user.counts?.uploadedResources ?? 0} Available`}
              </div>
            </div>

            <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-warning)' }}>
                <UsersIcon size={18} />
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>Study Groups</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginTop: 'var(--space-1)' }}>
                {user.counts?.groupMemberships ?? 0} Joined
              </div>
            </div>

            <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-admin)' }}>
                <Star size={18} />
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>Reviews</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginTop: 'var(--space-1)' }}>
                {user.counts?.courseReviews ?? 0} Submitted
              </div>
            </div>
          </div>

          {/* Section D: Account Timeline */}
          <div style={{ marginTop: 'var(--space-4)' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 'var(--space-3)' }}>
              Account Audit Timeline
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div style={{ marginTop: 2 }}>
                  <CheckCircle2 size={16} color="var(--color-success)" />
                </div>
                <div>
                  <strong style={{ color: 'var(--color-gray-800)' }}>Account Registered</strong>
                  <div style={{ color: 'var(--color-gray-500)' }}>{new Date(user.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div style={{ marginTop: 2 }}>
                  <Activity size={16} color="var(--color-primary-500)" />
                </div>
                <div>
                  <strong style={{ color: 'var(--color-gray-800)' }}>Email Identity Verified</strong>
                  <div style={{ color: 'var(--color-gray-500)' }}>System automatic verification completed</div>
                </div>
              </div>

              {user.status === 'suspended' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div style={{ marginTop: 2 }}>
                    <UserMinus size={16} color="var(--color-suspended)" />
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-suspended-dark)' }}>Account Suspended by Admin</strong>
                    <div style={{ color: 'var(--color-gray-500)' }}>{user.suspension_reason}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SuspendUserModal
        user={user}
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        onConfirm={handleSuspend}
      />

      <BanUserModal
        user={user}
        isOpen={isBanOpen}
        onClose={() => setIsBanOpen(false)}
        onConfirm={handleBan}
      />

      <ReactivateUserModal
        user={user}
        isOpen={isReactivateOpen}
        onClose={() => setIsReactivateOpen(false)}
        onConfirm={handleReactivate}
      />

      <DeleteUserModal
        user={user}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
