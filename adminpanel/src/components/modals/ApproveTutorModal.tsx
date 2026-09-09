import React, { useState } from 'react';
import { ConfirmModal } from '../common/ConfirmModal';
import type { TutorApplication } from '../../types/admin';

interface ApproveTutorModalProps {
  application: TutorApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (applicationId: number, adminNote: string) => Promise<void>;
}

export const ApproveTutorModal: React.FC<ApproveTutorModalProps> = ({
  application,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [adminNote, setAdminNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!application) return null;

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    try {
      await onConfirm(application.application_id, adminNote.trim());
      setAdminNote('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to approve application.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title="Approve Tutor Application?"
      description="Grant official tutor status and enable public profile and course creation."
      variant="success"
      confirmText="Approve Tutor"
      cancelText="Cancel"
      isLoading={isLoading}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Tutor info */}
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
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)', marginTop: 2 }}>
              Experience: {application.experience_years} years • {application.skills.length} skills listed
            </div>
          </div>
        </div>

        {/* Optional Admin Note */}
        <div className="form-group">
          <label className="form-label">
            Admin Verification Note <span style={{ color: 'var(--color-gray-400)' }}>(Optional)</span>
          </label>
          <textarea
            className="form-textarea"
            placeholder="Add internal feedback (e.g., 'Trial video evaluated, documents verified')..."
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={3}
          />
        </div>

        {error && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}
      </div>
    </ConfirmModal>
  );
};
