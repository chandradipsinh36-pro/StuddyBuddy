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
} from 'lucide-react';
import { adminTutorService } from '../../services/adminTutorService';
import type { TutorApplication, TutorDocument } from '../../types/admin';
import { VideoPlayer } from '../../components/common/VideoPlayer';
import { DocumentViewerModal } from '../../components/common/DocumentViewerModal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ApproveTutorModal } from '../../components/modals/ApproveTutorModal';
import { RejectTutorModal } from '../../components/modals/RejectTutorModal';
import { ROUTES } from '../../constants';

export const TutorApplicationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<TutorApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Reviewer notes state in sidebar
  const [adminNotes, setAdminNotes] = useState('');

  // Modals
  const [previewDoc, setPreviewDoc] = useState<TutorDocument | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const fetchApplication = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await adminTutorService.getApplicationById(Number(id));
      if (data) {
        setApplication(data);
        if (data.admin_note) {
          setAdminNotes(data.admin_note);
        }
      }
    } catch {
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

  if (!application) {
    return (
      <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
        <h3>Application not found</h3>
        <button onClick={() => navigate(ROUTES.TUTOR_APPLICATIONS)} className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
          Back to Applications
        </button>
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
            <img
              src={application.user.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tutor'}
              alt={application.user.name}
              style={{
                width: 74,
                height: 74,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--color-primary-100)',
                flexShrink: 0,
              }}
            />
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-3)', color: 'var(--color-gray-700)', fontSize: 'var(--font-size-xs)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <GraduationCap size={16} color="var(--color-primary-600)" />
                  <strong>Institute:</strong> {application.institute_name}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Briefcase size={16} color="var(--color-primary-600)" />
                  <strong>Experience:</strong> {application.experience_years} Years
                </span>
              </div>

              {/* Bio */}
              <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-700)', lineHeight: 1.5, backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <strong>Candidate Statement / Bio:</strong>
                <p style={{ marginTop: 2 }}>{application.bio}</p>
              </div>

              {/* Skills Chips */}
              <div style={{ marginTop: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-gray-500)', marginBottom: 'var(--space-2)' }}>
                  Stated Teaching Subjects & Skills
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {application.skills.map((skill) => (
                    <div
                      key={skill.skill_id}
                      style={{
                        padding: '0.25rem 0.6rem',
                        backgroundColor: 'var(--color-white)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--color-gray-800)' }}>{skill.skill_name}</span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                        {skill.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trial Video Section */}
          <div className="admin-card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
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
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                Supporting Academic & Identity Documents ({application.documents.length})
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 2 }}>
                Inspect degrees, government-issued IDs, and professional teaching credentials submitted by applicant.
              </p>
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
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-primary-50)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-primary-600)',
                      }}
                    >
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-900)' }}>
                        {doc.file_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 2 }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                          {doc.document_type}
                        </span>
                        {doc.file_size && (
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                            {doc.file_size}
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
                      onClick={() => setPreviewDoc(doc)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                    >
                      <Eye size={14} />
                      <span>Preview Document</span>
                    </button>
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                    >
                      <ExternalLink size={14} />
                      <span>Open</span>
                    </a>
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
