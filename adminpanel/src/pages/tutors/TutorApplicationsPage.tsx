import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Video,
  FileText,
  ArrowUpRight,
  ChevronLeft,
  GraduationCap,
} from 'lucide-react';
import { adminTutorService } from '../../services/adminTutorService';
import { adminDashboardService } from '../../services/adminDashboardService';
import type { TutorApplication, ApplicationStatus } from '../../types/admin';
import { SearchInput } from '../../components/common/SearchInput';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ROUTES } from '../../constants';

export const TutorApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get('tab') as ApplicationStatus) || 'pending';
  const searchParam = searchParams.get('search') || '';

  const [applications, setApplications] = useState<TutorApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ pending: number; approved: number; rejected: number } | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminTutorService.getApplications(tabParam, searchParam);
      setApplications(data);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      const msg = err?.message || 'Failed to load tutor applications. Please check your connection and try again.';
      setError(msg);
      toast.error('Unable to load applications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    adminDashboardService.getOverview()
      .then(d => setCounts({
        pending: d.tutors.pending,
        approved: d.tutors.approved,
        rejected: d.tutors.rejected,
      }))
      .catch(() => {});
  }, [tabParam]);

  useEffect(() => {
    fetchApplications();
  }, [tabParam, searchParam]);

  const handleTabChange = (tab: ApplicationStatus) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next);
  };

  const handleSearchChange = (q: string) => {
    const next = new URLSearchParams(searchParams);
    if (!q) {
      next.delete('search');
    } else {
      next.set('search', q);
    }
    setSearchParams(next);
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

      {/* Header */}
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
            Tutor Verification Applications
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 2 }}>
            Review candidate qualifications, evaluate 5-minute trial videos, and inspect credentials.
          </p>
        </div>

        <div style={{ width: 280 }}>
          <SearchInput
            value={searchParam}
            onChange={handleSearchChange}
            placeholder="Search applicants..."
          />
        </div>
      </div>

      {/* Tab Controls (Pending, Approved, Rejected) */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          gap: 'var(--space-6)',
        }}
      >
        <button
          onClick={() => handleTabChange('pending')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) 0',
            borderBottom:
              tabParam === 'pending'
                ? '2px solid var(--color-warning)'
                : '2px solid transparent',
            color:
              tabParam === 'pending'
                ? 'var(--color-warning-dark)'
                : 'var(--color-gray-500)',
            fontWeight: tabParam === 'pending' ? 700 : 500,
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
            background: 'none',
          }}
        >
          <Clock size={16} />
          <span>Pending Review</span>
          <span
            className="badge badge-warning"
            style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}
          >
            {counts?.pending ?? (tabParam === 'pending' ? applications.length : 0)}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('approved')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) 0',
            borderBottom:
              tabParam === 'approved'
                ? '2px solid var(--color-success)'
                : '2px solid transparent',
            color:
              tabParam === 'approved'
                ? 'var(--color-success-dark)'
                : 'var(--color-gray-500)',
            fontWeight: tabParam === 'approved' ? 700 : 500,
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
            background: 'none',
          }}
        >
          <CheckCircle2 size={16} />
          <span>Approved Tutors</span>
          <span
            className="badge badge-success"
            style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}
          >
            {counts?.approved ?? (tabParam === 'approved' ? applications.length : 0)}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('rejected')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) 0',
            borderBottom:
              tabParam === 'rejected'
                ? '2px solid var(--color-danger)'
                : '2px solid transparent',
            color:
              tabParam === 'rejected'
                ? 'var(--color-danger-dark)'
                : 'var(--color-gray-500)',
            fontWeight: tabParam === 'rejected' ? 700 : 500,
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
            background: 'none',
          }}
        >
          <XCircle size={16} />
          <span>Rejected Applications</span>
          <span
            className="badge badge-danger"
            style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}
          >
            {counts?.rejected ?? (tabParam === 'rejected' ? applications.length : 0)}
          </span>
        </button>
      </div>

      {/* Applications Grid / Cards */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : error ? (
        <EmptyState
          title="Failed to Load Applications"
          message={error}
          actionText="Retry"
          onAction={fetchApplications}
        />
      ) : applications.length === 0 ? (
        <EmptyState
          title={`No ${tabParam.toUpperCase()} Applications`}
          message={
            tabParam === 'pending'
              ? 'All submitted applications have been evaluated and approved or rejected.'
              : `No applications currently found in the ${tabParam} queue.`
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {applications.map((app) => (
            <div
              key={app.application_id || app.user_id || app.user.id}
              className="admin-card admin-card-hover"
              style={{
                padding: 'var(--space-5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-5)',
              }}
            >
              {/* Tutor summary */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', flex: '1 1 300px' }}>
                <img
                  src={app.user.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tutor'}
                  alt={app.user.name}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--color-border)',
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                      {app.user.name}
                    </h3>
                    <StatusBadge status={app.status} label={app.status} />
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 2 }}>
                    {app.user.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 4, color: 'var(--color-gray-600)', fontSize: 'var(--font-size-xs)' }}>
                    <GraduationCap size={14} color="var(--color-primary-600)" />
                    <span>{app.institute_name}</span>
                    <span>• {app.experience_years} Years Experience</span>
                  </div>
                </div>
              </div>

              {/* Skills and Verification Assets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: '1 1 240px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {app.skills.map((s) => (
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
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)' }}>
                    <Video size={14} /> 5-Min Trial Video
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)' }}>
                    <FileText size={14} /> {app.documents.length} Docs Submitted
                  </span>
                </div>
              </div>

              {/* Date and CTA */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 'var(--space-2)',
                  minWidth: 160,
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-400)' }}>
                  Applied {new Date(app.applied_at).toLocaleDateString()}
                </div>

                <button
                  onClick={() => navigate(ROUTES.TUTOR_APPLICATION_REVIEW(app.application_id))}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                  <span>Review Application</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
