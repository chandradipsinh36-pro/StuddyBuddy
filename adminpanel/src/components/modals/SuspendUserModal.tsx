import React, { useState } from 'react';
import { ConfirmModal } from '../common/ConfirmModal';
import { SUSPENSION_DURATIONS } from '../../constants';
import type { User } from '../../types/admin';

interface SuspendUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: number, reason: string, duration: string) => Promise<void>;
}

export const SuspendUserModal: React.FC<SuspendUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('7_days');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for suspension.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onConfirm(user.id, reason.trim(), duration);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to suspend user.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title="Suspend User?"
      description="Temporarily disable account access according to platform rules."
      variant="warning"
      confirmText="Suspend User"
      cancelText="Cancel"
      isLoading={isLoading}
      isConfirmDisabled={!reason.trim()}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Affected User Summary Card */}
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
            src={user.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
            alt={user.name}
            style={{ width: 40, height: 40, borderRadius: '50%' }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-900)' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
              {user.email} • Role: <strong style={{ textTransform: 'capitalize' }}>{user.role}</strong>
            </div>
          </div>
        </div>

        {/* Duration Selector */}
        <div className="form-group">
          <label className="form-label">Suspension Duration</label>
          <select
            className="form-select"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            {SUSPENSION_DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reason Textarea */}
        <div className="form-group">
          <label className="form-label">
            Reason for Suspension <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            className="form-textarea"
            placeholder="Explain why this user account is being suspended..."
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

        {/* Informational callout */}
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-warning-light)',
            border: '1px solid var(--color-warning-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-warning-dark)',
            lineHeight: 1.4,
          }}
        >
          Suspended users cannot log in, join study groups, upload resources, or contact tutors until their suspension expires or is lifted by an admin.
        </div>
      </div>
    </ConfirmModal>
  );
};
