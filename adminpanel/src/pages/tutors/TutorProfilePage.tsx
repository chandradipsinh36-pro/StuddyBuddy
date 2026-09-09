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
} from 'lucide-react';
import { adminTutorService } from '../../services/adminTutorService';
import { adminUserService } from '../../services/adminUserService';
import type { TutorProfile, SkillProficiency } from '../../types/admin';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SuspendUserModal } from '../../components/modals/SuspendUserModal';
import { BanUserModal } from '../../components/modals/BanUserModal';
import { ReactivateUserModal } from '../../components/modals/ReactivateUserModal';
import { DeleteUserModal } from '../../components/modals/DeleteUserModal';
import { ROUTES } from '../../constants';

export const TutorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

      {/* Profile Header (Section 22) */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                {tutor.user.name}
              </h2>
              <StatusBadge status={tutor.is_verified ? 'verified' : 'unverified'} />
              <StatusBadge status={tutor.user.status} label={tutor.user.status} />
              <StatusBadge status={tutor.application_status} label={tutor.application_status} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-2)', color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={14} /> {tutor.user.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <GraduationCap size={14} /> {tutor.institute_name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Briefcase size={14} /> {tutor.experience_years} Years Teaching
              </span>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
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

      {/* Profile Details Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Personal & Professional Information */}
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
                {tutor.institute_name}
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
                Candidate Biography & Philosophy
              </span>
              <div style={{ color: 'var(--color-gray-700)', marginTop: 2, lineHeight: 1.5 }}>
                {tutor.bio}
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
                {tutor.student_count}
              </div>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-warning)', fontSize: 'var(--font-size-xs)' }}>
                <Star size={14} /> Rating Average
              </div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, marginTop: 4 }}>
                {tutor.average_rating} ★ ({tutor.review_count})
              </div>
            </div>
          </div>
        </div>

        {/* Tutor Skills UI (Section 23) */}
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

          {/* Application Metadata & History */}
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
                <span>Reviewed By:</span>
                <strong>Admin Chief</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Verification Record:</span>
                <span>Active & In Good Standing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
