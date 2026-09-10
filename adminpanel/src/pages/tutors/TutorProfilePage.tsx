import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  Mail,
  GraduationCap,
  Briefcase,
  Star,
  Users,
  CheckCircle2,
  Clock,
  UserMinus,
  UserX,
  UserCheck,
  FileCheck,
  Trash2,
  BookOpen,
  FileText,
  Wallet,
  TrendingUp,
  CreditCard,
  Calendar,
  Lock,
  Package,
  ArrowUpRight,
  Info,
  EyeOff,
  Eye,
  Check,
  X,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { adminTutorService } from '../../services/adminTutorService';
import { adminUserService } from '../../services/adminUserService';
import type {
  TutorProfile,
  SkillProficiency,
  TutorCourseItem,
  TutorResourceItem,
  TutorBundleItem,
} from '../../types/admin';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SuspendUserModal } from '../../components/modals/SuspendUserModal';
import { BanUserModal } from '../../components/modals/BanUserModal';
import { ReactivateUserModal } from '../../components/modals/ReactivateUserModal';
import { DeleteUserModal } from '../../components/modals/DeleteUserModal';
import { ROUTES } from '../../constants';

type ActiveTab = 'overview' | 'courses' | 'resources' | 'bundles' | 'earnings';

export const TutorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isBanOpen, setIsBanOpen] = useState(false);
  const [isReactivateOpen, setIsReactivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchTutor = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await adminTutorService.getTutorById(Number(id));
      setTutor(data);
    } catch {
      toast.error('Failed to load tutor profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTutor();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-6)' }}>
        <div style={{ height: 160, backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-xl)' }} className="animate-pulse" />
        <div style={{ height: 320, backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-xl)' }} className="animate-pulse" />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
        <h3>Tutor profile not found</h3>
        <button onClick={() => navigate(ROUTES.TUTORS)} className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
          Back to Tutors
        </button>
      </div>
    );
  }

  // User moderation actions
  const handleSuspend = async (userId: number, reason: string, duration: string) => {
    await adminUserService.suspendUser(userId, reason, duration);
    toast.success('Tutor account suspended.');
    fetchTutor();
  };

  const handleBan = async (userId: number, reason: string) => {
    await adminUserService.banUser(userId, reason);
    toast.success('Tutor account banned.');
    fetchTutor();
  };

  const handleReactivate = async (userId: number) => {
    await adminUserService.reactivateUser(userId);
    toast.success('Tutor account reactivated.');
    fetchTutor();
  };

  const handleDelete = async (userId: number) => {
    await adminTutorService.deleteTutor(userId);
    toast.success('Tutor account permanently deleted.');
    navigate(ROUTES.TUTORS);
  };

  // ── Course Management Handlers ─────────────────────────────────────
  const handleToggleCourseStatus = async (courseId: number, currentStatus: boolean, title: string) => {
    try {
      setActionLoading(true);
      await adminTutorService.updateCourseStatus(courseId, !currentStatus);
      toast.success(`Course "${title}" ${!currentStatus ? 'published' : 'unpublished'}.`);
      fetchTutor();
    } catch {
      toast.error('Failed to update course status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the course "${title}"? This will remove all associated lessons and enrollments.`)) return;
    try {
      setActionLoading(true);
      await adminTutorService.deleteCourse(courseId);
      toast.success(`Course "${title}" permanently deleted.`);
      fetchTutor();
    } catch {
      toast.error('Failed to delete course.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Resource Management Handlers ───────────────────────────────────
  const handleUpdateResourceStatus = async (resourceId: number, newStatus: string, title: string) => {
    try {
      setActionLoading(true);
      await adminTutorService.updateResourceStatus(resourceId, newStatus);
      toast.success(`Resource "${title}" marked as ${newStatus}.`);
      fetchTutor();
    } catch {
      toast.error('Failed to update resource status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the resource "${name}"?`)) return;
    try {
      setActionLoading(true);
      await adminTutorService.deleteResource(resourceId);
      toast.success(`Resource "${name}" permanently deleted.`);
      fetchTutor();
    } catch {
      toast.error('Failed to delete resource.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Bundle Management Handlers ─────────────────────────────────────
  const handleToggleBundleStatus = async (bundleId: number, currentStatus: boolean, title: string) => {
    try {
      setActionLoading(true);
      await adminTutorService.updateBundleStatus(bundleId, !currentStatus);
      toast.success(`Bundle "${title}" ${!currentStatus ? 'published' : 'unpublished'}.`);
      fetchTutor();
    } catch {
      toast.error('Failed to update bundle status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBundle = async (bundleId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the bundle "${title}"?`)) return;
    try {
      setActionLoading(true);
      await adminTutorService.deleteBundle(bundleId);
      toast.success(`Bundle "${title}" permanently deleted.`);
      fetchTutor();
    } catch {
      toast.error('Failed to delete bundle.');
    } finally {
      setActionLoading(false);
    }
  };

  const getProficiencyBadge = (prof: SkillProficiency) => {
    switch (prof) {
      case 'expert':
        return <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Expert</span>;
      case 'intermediate':
        return <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Intermediate</span>;
      default:
        return <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>Beginner</span>;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val) || 0;
    if (num === 0) return 'Free';
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatCourseDescription = (desc?: string) => {
    if (!desc) return '';
    if (typeof desc === 'string' && desc.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(desc);
        if (parsed && typeof parsed === 'object' && parsed.overview !== undefined) {
          return parsed.overview;
        }
      } catch {
        return desc;
      }
    }
    return desc;
  };

  const getFileTypeBadge = (type: string) => {
    const t = (type || '').toLowerCase();
    let bg = 'var(--color-primary-50)';
    let color = 'var(--color-primary-600)';
    let border = 'var(--color-primary-200)';
    if (t.includes('pdf')) {
      bg = 'var(--color-danger-light)';
      color = 'var(--color-danger-dark)';
      border = 'var(--color-danger-border)';
    } else if (t.includes('mp4') || t.includes('video')) {
      bg = 'var(--color-admin-light)';
      color = 'var(--color-admin-dark)';
      border = 'var(--color-admin-border)';
    } else if (t.includes('zip') || t.includes('rar')) {
      bg = 'var(--color-warning-light)';
      color = 'var(--color-warning-dark)';
      border = 'var(--color-warning-border)';
    }
    return (
      <span
        style={{
          padding: '0.15rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.68rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
        }}
      >
        {type || 'FILE'}
      </span>
    );
  };

  const courses = tutor.courses || [];
  const resources = tutor.resources || [];
  const bundles = tutor.bundles || [];
  const earnings = tutor.earnings;

  const totalEarnedAmount = Number(earnings?.totalEarned ?? earnings?.totalEarnings ?? 0);
  const totalEnrolledStudents = courses.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Back button */}
      <div>
        <Link
          to={ROUTES.TUTORS}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gray-600)',
          }}
        >
          <ChevronLeft size={16} />
          <span>Back to Tutor Management</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div
        className="admin-card"
        style={{
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
            <img
              src={tutor.user.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tutor'}
              alt={tutor.user.name}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--color-primary-100)',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                  {tutor.user.name}
                </h2>
                <StatusBadge status={tutor.is_verified ? 'verified' : 'unverified'} />
                <StatusBadge status={tutor.user.status} label={tutor.user.status} />
                <StatusBadge status={tutor.application_status} label={tutor.application_status} />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  marginTop: 'var(--space-2)',
                  color: 'var(--color-gray-500)',
                  fontSize: 'var(--font-size-sm)',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Mail size={14} /> {tutor.user.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <GraduationCap size={14} /> {tutor.institute_name || 'Independent Tutor'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Briefcase size={14} /> {tutor.experience_years} Years Teaching
                </span>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {tutor.application_id > 0 && (
              <button
                onClick={() => navigate(ROUTES.TUTOR_APPLICATION_REVIEW(tutor.application_id))}
                className="btn btn-secondary"
              >
                <FileCheck size={16} />
                <span>Application Dossier</span>
              </button>
            )}

            {tutor.user.status === 'active' && (
              <button onClick={() => setIsSuspendOpen(true)} className="btn btn-warning">
                <UserMinus size={16} />
                <span>Suspend</span>
              </button>
            )}

            {(tutor.user.status === 'suspended' || tutor.user.status === 'banned') && (
              <button onClick={() => setIsReactivateOpen(true)} className="btn btn-success">
                <UserCheck size={16} />
                <span>Reactivate</span>
              </button>
            )}

            {tutor.user.status !== 'banned' && (
              <button onClick={() => setIsBanOpen(true)} className="btn btn-danger">
                <UserX size={16} />
                <span>Ban Account</span>
              </button>
            )}

            <button
              onClick={() => setIsDeleteOpen(true)}
              className="btn btn-secondary"
              style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              title="Permanently Delete Tutor Account"
            >
              <Trash2 size={16} />
              <span>Delete Tutor</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'var(--space-3)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            style={{
              padding: 'var(--space-3)',
              backgroundColor: activeTab === 'courses' ? 'var(--color-primary-50)' : 'var(--color-bg-subtle)',
              border: `1px solid ${activeTab === 'courses' ? 'var(--color-primary-200)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-lg)',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)', fontWeight: 600 }}>
              <BookOpen size={14} /> Courses
            </div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-gray-900)', marginTop: 2 }}>
              {courses.length}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resources')}
            style={{
              padding: 'var(--space-3)',
              backgroundColor: activeTab === 'resources' ? 'var(--color-primary-50)' : 'var(--color-bg-subtle)',
              border: `1px solid ${activeTab === 'resources' ? 'var(--color-primary-200)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-lg)',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)', fontWeight: 600 }}>
              <FileText size={14} /> Resources
            </div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-gray-900)', marginTop: 2 }}>
              {resources.length}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bundles')}
            style={{
              padding: 'var(--space-3)',
              backgroundColor: activeTab === 'bundles' ? 'var(--color-primary-50)' : 'var(--color-bg-subtle)',
              border: `1px solid ${activeTab === 'bundles' ? 'var(--color-primary-200)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-lg)',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)', fontWeight: 600 }}>
              <Package size={14} /> Bundles
            </div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-gray-900)', marginTop: 2 }}>
              {bundles.length}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('earnings')}
            style={{
              padding: 'var(--space-3)',
              backgroundColor: activeTab === 'earnings' ? 'var(--color-success-light)' : 'var(--color-bg-subtle)',
              border: `1px solid ${activeTab === 'earnings' ? 'var(--color-success-border)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-lg)',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-xs)', color: 'var(--color-success-dark)', fontWeight: 600 }}>
              <TrendingUp size={14} /> Total Earned
            </div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-success-dark)', marginTop: 2 }}>
              ₹{totalEarnedAmount.toLocaleString('en-IN')}
            </div>
          </button>

          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', fontWeight: 600 }}>
              <Users size={14} /> Total Students
            </div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-gray-900)', marginTop: 2 }}>
              {tutor.student_count || totalEnrolledStudents}
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-xs)', color: 'var(--color-warning)', fontWeight: 600 }}>
              <Star size={14} /> Rating Avg
            </div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-gray-900)', marginTop: 2 }}>
              {tutor.average_rating > 0 ? tutor.average_rating.toFixed(1) : '5.0'} ★
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          borderBottom: '2px solid var(--color-border)',
          paddingBottom: 0,
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: activeTab === 'overview' ? 700 : 500,
            color: activeTab === 'overview' ? 'var(--color-primary-600)' : 'var(--color-gray-600)',
            borderBottom: activeTab === 'overview' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            marginBottom: -2,
            transition: 'all var(--transition-fast)',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          <Briefcase size={16} />
          <span>Profile Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: activeTab === 'courses' ? 700 : 500,
            color: activeTab === 'courses' ? 'var(--color-primary-600)' : 'var(--color-gray-600)',
            borderBottom: activeTab === 'courses' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            marginBottom: -2,
            transition: 'all var(--transition-fast)',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          <BookOpen size={16} />
          <span>Courses ({courses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resources')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: activeTab === 'resources' ? 700 : 500,
            color: activeTab === 'resources' ? 'var(--color-primary-600)' : 'var(--color-gray-600)',
            borderBottom: activeTab === 'resources' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            marginBottom: -2,
            transition: 'all var(--transition-fast)',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          <FileText size={16} />
          <span>Resources ({resources.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bundles')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: activeTab === 'bundles' ? 700 : 500,
            color: activeTab === 'bundles' ? 'var(--color-primary-600)' : 'var(--color-gray-600)',
            borderBottom: activeTab === 'bundles' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            marginBottom: -2,
            transition: 'all var(--transition-fast)',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          <Package size={16} />
          <span>Bundles ({bundles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('earnings')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: activeTab === 'earnings' ? 700 : 500,
            color: activeTab === 'earnings' ? 'var(--color-primary-600)' : 'var(--color-gray-600)',
            borderBottom: activeTab === 'earnings' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            marginBottom: -2,
            transition: 'all var(--transition-fast)',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          <Wallet size={16} />
          <span>Earnings & Payouts</span>
        </button>
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          {/* Professional Information */}
          <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
              Professional Background
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Academic Institution
                </span>
                <div style={{ fontWeight: 600, color: 'var(--color-gray-900)', marginTop: 2 }}>
                  {tutor.institute_name || 'Independent / Freelance'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Teaching Experience
                </span>
                <div style={{ fontWeight: 600, color: 'var(--color-gray-900)', marginTop: 2 }}>
                  {tutor.experience_years} Years Professional Tutoring
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Candidate Biography
                </span>
                <div style={{ color: 'var(--color-gray-700)', marginTop: 2, lineHeight: 1.5 }}>
                  {tutor.bio || 'No biography details provided.'}
                </div>
              </div>
            </div>

            {/* Student & Rating Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-3)',
                marginTop: 'var(--space-2)',
              }}
            >
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary-600)', fontSize: 'var(--font-size-xs)' }}>
                  <Users size={14} /> Total Students
                </div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, marginTop: 4 }}>
                  {tutor.student_count || totalEnrolledStudents}
                </div>
              </div>

              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-warning)', fontSize: 'var(--font-size-xs)' }}>
                  <Star size={14} /> Rating Average
                </div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, marginTop: 4 }}>
                  {tutor.average_rating > 0 ? tutor.average_rating.toFixed(1) : '5.0'} ★ ({tutor.review_count})
                </div>
              </div>
            </div>
          </div>

          {/* Tutor Skills */}
          <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                  Teaching Specializations & Skills
                </h3>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 2 }}>
                  Verified competency levels
                </p>
              </div>
              <span className="badge badge-neutral">{tutor.skills.length} Skills</span>
            </div>

            {tutor.skills.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)' }}>
                No specific skills registered.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {tutor.skills.map((skill) => (
                  <div
                    key={skill.skill_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      backgroundColor: 'var(--color-bg-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-900)' }}>
                      {skill.skill_name}
                    </div>
                    {getProficiencyBadge(skill.proficiency)}
                  </div>
                ))}
              </div>
            )}

            {/* Application Review Metadata */}
            <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 'var(--space-2)' }}>
                Application Review Record
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Application Status:</span>
                  <StatusBadge status={tutor.application_status} label={tutor.application_status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Account Status:</span>
                  <StatusBadge status={tutor.user.status} label={tutor.user.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Joined Date:</span>
                  <span>{formatDate(tutor.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: COURSES */}
      {activeTab === 'courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            className="admin-card"
            style={{
              padding: 'var(--space-4) var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                Manage Tutor Courses ({courses.length})
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 2 }}>
                Admin moderation: Publish, unpublish, or delete courses created by {tutor.user.name}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span className="badge badge-success">
                {courses.filter((c) => c.isPublished).length} Published
              </span>
              <span className="badge badge-neutral">
                {courses.filter((c) => !c.isPublished).length} Drafts
              </span>
              <span className="badge badge-primary">
                {totalEnrolledStudents} Enrollments
              </span>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="admin-card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
                <BookOpen size={28} />
              </div>
              <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                No Courses Published
              </h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 4, maxWidth: 420, marginInline: 'auto' }}>
                This tutor has not authored or published any courses yet.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {courses.map((course: TutorCourseItem) => (
                <div
                  key={course.courseId}
                  className="admin-card admin-card-hover"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-5)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-primary-50)',
                          color: 'var(--color-primary-700)',
                          border: '1px solid var(--color-primary-200)',
                        }}
                      >
                        {course.category?.name || 'General'}
                      </span>
                      {course.isPublished ? (
                        <span className="badge badge-success">Published</span>
                      ) : (
                        <span className="badge badge-neutral">Draft</span>
                      )}
                    </div>

                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)', lineHeight: 1.3 }}>
                      {course.title}
                    </h4>

                    {course.description && (
                      <p
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-gray-600)',
                          marginTop: 'var(--space-2)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {formatCourseDescription(course.description)}
                      </p>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 600 }}>
                        Tuition Fee:
                      </span>
                      <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: 'var(--color-primary-600)' }}>
                        {formatCurrency(course.price)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={13} /> {course.enrollmentCount || 0} students
                      </span>
                      {course.lessonsCount !== undefined && course.lessonsCount > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary-700)', fontWeight: 600 }}>
                          <BookOpen size={13} /> {course.lessonsCount} {course.lessonsCount === 1 ? 'lesson' : 'lessons'}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={13} fill="#f59e0b" color="#f59e0b" />
                        {course.ratingAverage ? Number(course.ratingAverage).toFixed(1) : 'New'} ({course.reviewCount || 0})
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-gray-400)' }}>
                        <Calendar size={13} /> {formatDate(course.createdAt)}
                      </span>
                    </div>

                    {/* Admin Actions Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 'var(--space-2)',
                        borderTop: '1px dashed var(--color-border)',
                      }}
                    >
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleToggleCourseStatus(course.courseId, course.isPublished, course.title)}
                        className={`btn btn-sm ${course.isPublished ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      >
                        {course.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{course.isPublished ? 'Unpublish' : 'Publish'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleDeleteCourse(course.courseId, course.title)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger-border)', padding: '0.25rem 0.5rem' }}
                        title="Permanently Delete Course"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: RESOURCES */}
      {activeTab === 'resources' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            className="admin-card"
            style={{
              padding: 'var(--space-4) var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                Manage Tutor Resources ({resources.length})
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 2 }}>
                Approve, reject, preview, or remove study materials uploaded by {tutor.user.name}
              </p>
            </div>
            <span className="badge badge-neutral">
              {resources.length} Total Files
            </span>
          </div>

          {resources.length === 0 ? (
            <div className="admin-card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
                <FileText size={28} />
              </div>
              <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                No Resources Uploaded
              </h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 4, maxWidth: 420, marginInline: 'auto' }}>
                This tutor has not uploaded any learning resources or documents yet.
              </p>
            </div>
          ) : (
            <div
              className="admin-card"
              style={{
                padding: 0,
                overflow: 'hidden',
              }}
            >
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
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Resource Title</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Format</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Category</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Linked Course</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Price</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Uploaded</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 700 }}>Manage Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((resource: TutorResourceItem) => (
                      <tr
                        key={resource.resourceId}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          transition: 'background-color var(--transition-fast)',
                        }}
                      >
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <FileText size={16} style={{ color: 'var(--color-primary-500)', flexShrink: 0 }} />
                            <span>{resource.filename}</span>
                          </div>
                        </td>

                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {getFileTypeBadge(resource.fileType)}
                        </td>

                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                            {resource.categoryName || 'General'}
                          </span>
                        </td>

                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-gray-700)' }}>
                          {resource.courseTitle ? (
                            <span style={{ fontWeight: 500 }}>{resource.courseTitle}</span>
                          ) : (
                            <span style={{ color: 'var(--color-gray-400)', fontSize: 'var(--font-size-xs)' }}>
                              Standalone Material
                            </span>
                          )}
                        </td>

                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {resource.isLocked || Number(resource.price) > 0 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--color-primary-600)' }}>
                              <Lock size={12} /> {formatCurrency(resource.price)}
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                              Free Access
                            </span>
                          )}
                        </td>

                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <StatusBadge status={resource.status as any} label={resource.status} />
                        </td>

                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                          {formatDate(resource.createdAt)}
                        </td>

                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            {resource.fileUrl && (
                              <a
                                href={resource.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.25rem 0.45rem' }}
                                title="Preview / Open File"
                              >
                                <ArrowUpRight size={14} />
                              </a>
                            )}

                            {resource.status !== 'approved' && resource.status !== 'published' && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleUpdateResourceStatus(resource.resourceId, 'published', resource.filename)}
                                className="btn btn-success btn-sm"
                                style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}
                                title="Approve & Publish Resource"
                              >
                                <Check size={12} />
                                <span>Approve</span>
                              </button>
                            )}

                            {resource.status !== 'rejected' && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleUpdateResourceStatus(resource.resourceId, 'rejected', resource.filename)}
                                className="btn btn-warning btn-sm"
                                style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}
                                title="Reject Resource"
                              >
                                <X size={12} />
                                <span>Reject</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleDeleteResource(resource.resourceId, resource.filename)}
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--color-danger)', padding: '0.25rem 0.45rem' }}
                              title="Permanently Delete Resource"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: BUNDLES */}
      {activeTab === 'bundles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            className="admin-card"
            style={{
              padding: 'var(--space-4) var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                Manage Tutor Bundles ({bundles.length})
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 2 }}>
                Admin moderation: Publish, unpublish, or delete resource bundles created by {tutor.user.name}
              </p>
            </div>
            <span className="badge badge-neutral">
              {bundles.length} Created
            </span>
          </div>

          {bundles.length === 0 ? (
            <div className="admin-card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
                <Package size={28} />
              </div>
              <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                No Resource Bundles
              </h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 4, maxWidth: 420, marginInline: 'auto' }}>
                This tutor has not created any resource bundles yet.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {bundles.map((bundle: TutorBundleItem) => (
                <div
                  key={bundle.bundleId}
                  className="admin-card admin-card-hover"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-5)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <span className="badge badge-primary">
                        <Package size={12} /> Bundle #{bundle.bundleId}
                      </span>
                      {bundle.isPublished ? (
                        <span className="badge badge-success">Active / Published</span>
                      ) : (
                        <span className="badge badge-neutral">Draft / Inactive</span>
                      )}
                    </div>

                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                      {bundle.title}
                    </h4>

                    {bundle.description && (
                      <p
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-gray-600)',
                          marginTop: 'var(--space-2)',
                          lineHeight: 1.4,
                        }}
                      >
                        {bundle.description}
                      </p>
                    )}

                    {/* Bundle items list */}
                    <div
                      style={{
                        marginTop: 'var(--space-3)',
                        padding: 'var(--space-3)',
                        backgroundColor: 'var(--color-bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 'var(--space-2)' }}>
                        Included Resources ({bundle.bundleItems?.length || 0}):
                      </div>

                      {(!bundle.bundleItems || bundle.bundleItems.length === 0) ? (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                          No individual resources linked to this bundle.
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                          {bundle.bundleItems.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--color-gray-800)',
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <FileText size={12} color="var(--color-primary-500)" />
                                {item.resource?.filename || `Resource #${item.resource?.resourceId || idx + 1}`}
                              </span>
                              <span style={{ color: 'var(--color-gray-500)', fontSize: '0.7rem', fontWeight: 600 }}>
                                {formatCurrency(item.resource?.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                          Bundle Price:
                        </span>
                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-primary-600)' }}>
                          {formatCurrency(bundle.price)}
                        </div>
                      </div>

                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> {formatDate(bundle.createdAt)}
                      </span>
                    </div>

                    {/* Admin Actions Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 'var(--space-2)',
                        borderTop: '1px dashed var(--color-border)',
                      }}
                    >
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleToggleBundleStatus(bundle.bundleId, bundle.isPublished, bundle.title)}
                        className={`btn btn-sm ${bundle.isPublished ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      >
                        {bundle.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{bundle.isPublished ? 'Unpublish' : 'Publish'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleDeleteBundle(bundle.bundleId, bundle.title)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger-border)', padding: '0.25rem 0.5rem' }}
                        title="Permanently Delete Bundle"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 5: EARNINGS & PAYOUTS */}
      {activeTab === 'earnings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Top KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {/* KPI 1: Net Earnings */}
            <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success-dark)' }}>
                <TrendingUp size={22} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Net Tutor Earned (85%)
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-success-dark)' }}>
                  ₹{totalEarnedAmount.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)', marginTop: 2 }}>
                  Gross sales minus platform fee
                </div>
              </div>
            </div>

            {/* KPI 2: Available Balance */}
            <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-600)' }}>
                <Wallet size={22} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Available Balance
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary-600)' }}>
                  ₹{Number(earnings?.availableBalance ?? earnings?.currentBalance ?? 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)', marginTop: 2 }}>
                  Ready for scheduled payout
                </div>
              </div>
            </div>

            {/* KPI 3: Pending Clearance */}
            <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning-dark)' }}>
                <Clock size={22} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Pending Clearance
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-warning-dark)' }}>
                  ₹{Number(earnings?.pendingPayout ?? earnings?.pendingEarnings ?? 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)', marginTop: 2 }}>
                  Processing payment orders
                </div>
              </div>
            </div>

            {/* KPI 4: This Month's Earnings */}
            <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-admin-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-admin-dark)' }}>
                <CreditCard size={22} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                  This Month
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-admin-dark)' }}>
                  ₹{Number(earnings?.thisMonthEarnings ?? 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)', marginTop: 2 }}>
                  Last month: ₹{Number(earnings?.lastMonthEarnings ?? 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Settlement & Payout Policy Information */}
          <div
            className="admin-card"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              backgroundColor: 'var(--color-primary-50)',
              borderColor: 'var(--color-primary-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Info size={20} color="var(--color-primary-600)" />
              <div>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-900)' }}>
                  Automated Settlement & Commission Schedule
                </span>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-700)', marginTop: 2 }}>
                  StudyBuddy retains a standard 15% platform infrastructure fee. The 85% instructor payout is scheduled for automated disbursement.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-800)', fontWeight: 600 }}>
                Next Settlement Cycle:
              </span>
              <span className="badge badge-success">
                {earnings?.nextPayoutDate ? formatDate(earnings.nextPayoutDate) : 'Weekly Cycle'}
              </span>
            </div>
          </div>

          {/* Transactions Ledger Table */}
          <div
            className="admin-card"
            style={{
              padding: 0,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: 'var(--space-4) var(--space-6)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                  Sales & Payment Ledger
                </h4>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 2 }}>
                  Itemized student purchases of this tutor's courses, resources, and bundles
                </p>
              </div>
              <span className="badge badge-neutral">
                {earnings?.transactions?.length || 0} Transactions
              </span>
            </div>

            {(!earnings?.transactions || earnings.transactions.length === 0) ? (
              <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
                <Wallet size={36} color="var(--color-gray-400)" style={{ margin: '0 auto var(--space-3)' }} />
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-gray-800)' }}>
                  No Financial Transactions Recorded
                </h4>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 4 }}>
                  No payment transactions have taken place for this tutor's courses, resources, or bundles yet.
                </p>
              </div>
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
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Order ID</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Item / Material</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Student / Buyer</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Gross Total</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Platform Fee (15%)</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Tutor Payout (85%)</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 700 }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.transactions.map((tx, idx) => {
                      const gross = Number(tx.grossAmount ?? tx.amount ?? 0);
                      const platformFee = Number(tx.platformFee ?? Math.round(gross * 0.15));
                      const tutorShare = Number(tx.netAmount ?? (gross - platformFee));
                      const orderRef = tx.orderId || `ORD-${(tx.id || tx.paymentId || idx + 1).toString().padStart(6, '0')}`;
                      const title = tx.resourceTitle || tx.course?.title || tx.bundle?.title || tx.resource?.filename || 'Academic Item';
                      const buyer = tx.buyerName || tx.student?.name || 'Student';

                      return (
                        <tr
                          key={tx.id || tx.paymentId || idx}
                          style={{
                            borderBottom: '1px solid var(--color-border)',
                            transition: 'background-color var(--transition-fast)',
                          }}
                        >
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-primary-600)' }}>
                            {orderRef}
                          </td>

                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                            {title}
                          </td>

                          <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-gray-700)' }}>
                            {buyer}
                          </td>

                          <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-gray-800)', fontWeight: 600 }}>
                            ₹{gross.toLocaleString('en-IN')}
                          </td>

                          <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                            -₹{platformFee.toLocaleString('en-IN')}
                          </td>

                          <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-success-dark)', fontWeight: 700 }}>
                            +₹{tutorShare.toLocaleString('en-IN')}
                          </td>

                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <span className={tx.status === 'settled' || tx.status === 'success' ? 'badge badge-success' : 'badge badge-warning'}>
                              {tx.status === 'settled' || tx.status === 'success' ? 'Settled' : 'Pending'}
                            </span>
                          </td>

                          <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', color: 'var(--color-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                            {formatDate(tx.date || tx.createdAt || tx.paidAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Modals */}
      <SuspendUserModal
        user={tutor.user}
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        onConfirm={handleSuspend}
      />

      <BanUserModal
        user={tutor.user}
        isOpen={isBanOpen}
        onClose={() => setIsBanOpen(false)}
        onConfirm={handleBan}
      />

      <ReactivateUserModal
        user={tutor.user}
        isOpen={isReactivateOpen}
        onClose={() => setIsReactivateOpen(false)}
        onConfirm={handleReactivate}
      />

      <DeleteUserModal
        user={tutor.user}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
