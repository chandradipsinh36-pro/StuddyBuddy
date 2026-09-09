import React, { useState } from 'react';
import { ConfirmModal } from '../common/ConfirmModal';
import { SUSPENSION_DURATIONS } from '../../constants';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'suspend' | 'ban';
  selectedCount: number;
  onConfirm: (reason: string, duration?: string) => Promise<void>;
}

export const BulkActionModal: React.FC<BulkActionModalProps> = ({
  isOpen,
  onClose,
  actionType,
  selectedCount,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('7_days');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isSuspend = actionType === 'suspend';
  const title = isSuspend
    ? `Suspend ${selectedCount} Selected Users?`
    : `Ban ${selectedCount} Selected Users?`;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('A reason is required for bulk actions.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onConfirm(reason.trim(), isSuspend ? duration : undefined);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Bulk operation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={title}
      description={`Apply batch ${actionType} status to ${selectedCount} selected accounts.`}
      variant={isSuspend ? 'warning' : 'danger'}
      confirmText={isSuspend ? 'Suspend Selected' : 'Ban Selected'}
      cancelText="Cancel"
      isLoading={isLoading}
      isConfirmDisabled={!reason.trim()}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: isSuspend ? 'var(--color-warning-light)' : 'var(--color-danger-light)',
            border: `1px solid ${isSuspend ? 'var(--color-warning-border)' : 'var(--color-danger-border)'}`,
            borderRadius: 'var(--radius-md)',
            color: isSuspend ? 'var(--color-warning-dark)' : 'var(--color-danger-dark)',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          {isSuspend
            ? `All ${selectedCount} selected users will have their access restricted for the chosen duration.`
            : `All ${selectedCount} selected users will be permanently banned. This action will terminate active sessions.`}
        </div>

        {isSuspend && (
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
        )}

        <div className="form-group">
          <label className="form-label">
            Reason for Bulk {actionType === 'suspend' ? 'Suspension' : 'Ban'}{' '}
            <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            className="form-textarea"
            placeholder="Enter justification for bulk moderation action..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            rows={3}
          />
          {error && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>
              {error}
            </span>
          )}
        </div>
      </div>
    </ConfirmModal>
  );
};
