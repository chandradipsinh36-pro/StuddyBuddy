import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  ExternalLink,
  Calendar,
  Clock,
  Shield,
  Award,
  BookOpen,
  Quote,
  Download,
  Video,
} from 'lucide-react';
import { adminTutorService } from '../../services/adminTutorService';
import type { TutorApplication, TutorDocument } from '../../types/admin';
import { VideoPlayer } from '../../components/common/VideoPlayer';
import { DocumentViewerModal } from '../../components/common/DocumentViewerModal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Avatar } from '../../components/common/Avatar';
import { ApproveTutorModal } from '../../components/modals/ApproveTutorModal';
import { RejectTutorModal } from '../../components/modals/RejectTutorModal';
import { ROUTES } from '../../constants';

export const TutorApplicationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<TutorApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reviewer notes state in sidebar
  const [adminNotes, setAdminNotes] = useState('');

  // Modals
  const [previewDoc, setPreviewDoc] = useState<TutorDocument | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const fetchApplication = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminTutorService.getApplicationById(Number(id));
      if (data) {
        setApplication(data);
        if (data.admin_note) {
          setAdminNotes(data.admin_note);
        }
      } else {
        setError('Tutor application not found.');
      }
    } catch (err: any) {
      console.error('Failed to load application:', err);
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to load tutor application.';
      setError(msg);
      toast.error('Failed to load tutor application.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-6)' }}>
        <div style={{ height: 200, backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-xl)' }} className="animate-pulse" />
        <div style={{ height: 400, backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-xl)' }} className="animate-pulse" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
        <h3 style={{ color: error ? '#DC2626' : 'inherit', marginBottom: 'var(--space-2)' }}>
          {error || 'Application not found'}
        </h3>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', marginTop: 'var(--space-4)' }}>
          <button onClick={() => navigate(ROUTES.TUTOR_APPLICATIONS)} className="btn btn-secondary btn-sm">
            Back to Applications
          </button>
          <button onClick={fetchApplication} className="btn btn-primary btn-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleApprove = async (appId: number, note: string) => {
    const updated = await adminTutorService.approveApplication(appId, note || adminNotes);
    setApplication(updated);
    toast.success('Tutor application approved successfully.');
  };

  const handleReject = async (appId: number, reason: string) => {
    const updated = await adminTutorService.rejectApplication(appId, reason);
    setApplication(updated);
    toast.success('Tutor application rejected.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Navigation Breadcrumb Back */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          to={ROUTES.TUTOR_APPLICATIONS}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gray-600)',
          }}
        >
          <ChevronLeft size={16} />
          <span>Back to Applications</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
            Application ID: <strong style={{ fontFamily: 'var(--font-family-mono)' }}>#{application.application_id}</strong>
          </span>
          <StatusBadge status={application.status} label={application.status} />
        </div>
      </div>

      {/* Two-Column Responsive Layout (Section 19 & 33) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
      >
        {/* LEFT / MAIN COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', minWidth: 0 }}>
          {/* Candidate Profile Summary Header */}
          <div
            className="admin-card"
            style={{
              padding: 'var(--space-6)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-5)',
              flexWrap: 'wrap',
            }}
          >
            <Avatar name={application.user.name} size="xl" />
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                  {application.user.name}
                </h2>
                <StatusBadge status={application.status} label={application.status} />
              </div>

              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 2 }}>
                {application.user.email}
              </div>

              {/* Experience Highlight Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: 'var(--color-primary-400, #60a5fa)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                  }}
                >
                  <Briefcase size={14} />
                  <span>{application.experience_years} Years Teaching Experience</span>
                </span>
              </div>

              {/* Academic Qualifications & Degrees Section */}
              <div style={{ marginTop: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-gray-500)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={14} color="var(--color-primary-400, #60a5fa)" />
                  <span>Highest Academic Qualifications & Degrees</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {application.institute_name ? (
                    application.institute_name
                      .split(/,\s*(?=[A-Z])/)
                      .map((q) => q.trim())
                      .filter(Boolean)
                      .map((deg, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.45rem 0.85rem',
                            backgroundColor: 'var(--color-bg-subtle, #111827)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 600,
                            color: 'var(--color-primary-300, #93c5fd)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          }}
                        >
                          <GraduationCap size={16} color="#60a5fa" style={{ flexShrink: 0 }} />
                          <span>{deg}</span>
                        </div>
                      ))
                  ) : (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
                      No degree specified
                    </span>
                  )}
                </div>
              </div>

              {/* Bio / Candidate Statement */}
              {application.bio && (
                <div
                  style={{
                    marginTop: 'var(--space-4)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-gray-300, #d1d5db)',
                    lineHeight: 1.6,
                    backgroundColor: 'var(--color-bg-subtle, #111827)',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-gray-400)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Quote size={13} color="var(--color-primary-400, #60a5fa)" />
                    <span>Candidate Statement</span>
                  </div>
                  <p style={{ margin: 0 }}>
                    {application.bio.startsWith('Highest Qualification / Degree:')
                      ? `Candidate holds verified credentials with ${application.experience_years} years of teaching experience.`
                      : application.bio}
                  </p>
                </div>
              )}

              {/* Stated Teaching Subjects & Skills */}
              <div style={{ marginTop: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-gray-500)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={14} color="var(--color-primary-400, #60a5fa)" />
                  <span>Stated Teaching Subjects & Disciplines</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {application.skills.map((skill) => {
                    const proficiency = (skill.proficiency || 'intermediate').toLowerCase();
                    const conf =
                      proficiency === 'expert'
                        ? { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(52, 211, 153, 0.3)' }
                        : proficiency === 'advanced'
                        ? { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(96, 165, 250, 0.3)' }
                        : proficiency === 'intermediate'
                        ? { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' }
                        : { bg: 'rgba(148, 163, 184, 0.15)', text: '#cbd5e1', border: 'rgba(203, 213, 225, 0.3)' };

                    return (
                      <div
                        key={skill.skill_id}
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: 'var(--color-surface, #1e293b)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--font-size-xs)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--color-gray-900, #f8fafc)' }}>{skill.skill_name}</span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            padding: '1px 6px',
                            borderRadius: '9999px',
                            backgroundColor: conf.bg,
                            color: conf.text,
                            border: `1px solid ${conf.border}`,
                          }}
                        >
                          {skill.proficiency}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Trial Video Section */}
          <div className="admin-card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Video size={18} color="var(--color-primary-400, #60a5fa)" />
                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                  Mandatory 5-Minute Trial Video Lecture
                </h3>
                <span className="badge badge-primary">Standard Verification</span>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 2 }}>
                Evaluate teaching methodology, delivery clarity, audio/visual presentation, and subject mastery.
              </p>
            </div>

            <VideoPlayer
              src={application.trial_video_url}
              title={`${application.user.name} — Verification Trial Lecture`}
            />
          </div>

          {/* Submitted Documents Section */}
          <div className="admin-card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                    Supporting Academic & Identity Documents ({application.documents.length})
                  </h3>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                    }}
                  >
                    Verified Credentials
                  </span>
                </div>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 2 }}>
                  Inspect degrees, qualification certificates, and official credentials submitted by the applicant.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {application.documents.map((doc) => (
                <div
                  key={doc.doc_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--color-bg-subtle, #111827)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(37, 99, 235, 0.15)',
                        color: 'var(--color-primary-400, #60a5fa)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(37, 99, 235, 0.3)',
                      }}
                    >
                      <FileText size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-900, #f8fafc)' }}>
                        {doc.file_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 3, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            color: '#818cf8',
                            border: '1px solid rgba(129, 140, 248, 0.3)',
                          }}
                        >
                          {doc.document_type.replace(/_/g, ' ')}
                        </span>
                        {doc.file_size && (
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
                            • {doc.file_size}
                          </span>
                        )}
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>
                          • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '6px 14px' }}
                    >
                      <Eye size={14} />
                      <span>Preview Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (doc.doc_id) {
                            const url = await adminTutorService.getDocumentDownloadUrl(doc.doc_id);
                            window.open(url, '_blank');
                          } else if (doc.download_url) {
                            window.open(doc.download_url, '_blank');
                          } else {
                            window.open(doc.preview_url || doc.document_url, '_blank');
                          }
                        } catch (e) {
                          window.open(doc.preview_url || doc.document_url, '_blank');
                        }
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '6px 12px' }}
                      title="Download document"
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN (Section 19) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Application Metadata Card */}
          <div className="admin-card" style={{ padding: 'var(--space-5)' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, color: 'var(--color-gray-900)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              Application Metadata
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-gray-500)' }}>Current Status:</span>
                <StatusBadge status={application.status} label={application.status} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-gray-500)' }}>Submission Date:</span>
                <strong style={{ color: 'var(--color-gray-800)' }}>
                  {new Date(application.applied_at).toLocaleDateString()}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-gray-500)' }}>Application ID:</span>
                <strong style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-gray-800)' }}>
                  #{application.application_id}
                </strong>
              </div>

              {application.reviewed_by && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--color-gray-500)' }}>Reviewed By:</span>
                  <strong>{application.reviewed_by}</strong>
                </div>
              )}

              {application.reviewed_at && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-gray-500)' }}>Reviewed Date:</span>
                  <strong>{new Date(application.reviewed_at).toLocaleDateString()}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Review Decision Card */}
          <div className="admin-card" style={{ padding: 'var(--space-5)' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, color: 'var(--color-gray-900)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              Admin Verification Decision
            </h4>

            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">Review Notes / Evaluation</label>
              <textarea
                className="form-textarea"
                placeholder="Log your verification assessment, trial video score, or candidate observations..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <button
                onClick={() => setIsApproveOpen(true)}
                disabled={application.status === 'approved'}
                className="btn btn-success"
                style={{ width: '100%', height: 42 }}
              >
                <CheckCircle2 size={18} />
                <span>{application.status === 'approved' ? 'Application Approved' : 'Approve Tutor'}</span>
              </button>

              <button
                onClick={() => setIsRejectOpen(true)}
                disabled={application.status === 'rejected'}
                className="btn btn-danger"
                style={{ width: '100%', height: 42 }}
              >
                <XCircle size={18} />
                <span>{application.status === 'rejected' ? 'Application Rejected' : 'Reject Application'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* Approve Modal */}
      <ApproveTutorModal
        application={application}
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onConfirm={handleApprove}
      />

      {/* Reject Modal */}
      <RejectTutorModal
        application={application}
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleReject}
      />
    </div>
  );
};
