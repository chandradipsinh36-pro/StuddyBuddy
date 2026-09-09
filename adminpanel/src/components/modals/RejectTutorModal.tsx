import React, { useState } from 'react';
import { ConfirmModal } from '../common/ConfirmModal';
import type { TutorApplication } from '../../types/admin';

interface RejectTutorModalProps {
  application: TutorApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (applicationId: number, rejectionReason: string) => Promise<void>;
}

export const RejectTutorModal: React.FC<RejectTutorModalProps> = ({
  application,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!application) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a rejection reason explaining what failed verification.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onConfirm(application.application_id, reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reject application.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title="Reject Tutor Application?"
      description="Decline this applicant. Feedback will be logged in the audit record."
      variant="danger"
      confirmText="Reject Application"
      cancelText="Cancel"
      isLoading={isLoading}
      isConfirmDisabled={!reason.trim()}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Candidate summary */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <img
            src={application.user.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tutor'}
            alt={application.user.name}
            style={{ width: 44, height: 44, borderRadius: '50%' }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-900)' }}>
              {application.user.name}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
              {application.user.email} • {application.institute_name}
            </div>
          </div>
        </div>

        {/* Mandatory Reason */}
        <div className="form-group">
          <label className="form-label">
            Reason for Rejection <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            className="form-textarea"
            placeholder="Provide specific feedback (e.g., incomplete credentials, substandard trial video quality, invalid ID)..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            rows={3}
          />
          {error && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', marginTop: 2 }}>
              {error}
            </span>
          )}
        </div>
      </div>
    </ConfirmModal>
  );
};
