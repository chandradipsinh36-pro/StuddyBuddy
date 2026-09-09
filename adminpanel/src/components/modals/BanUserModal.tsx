import React, { useState } from 'react';
import { ConfirmModal } from '../common/ConfirmModal';
import type { User } from '../../types/admin';

interface BanUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: number, reason: string) => Promise<void>;
}

export const BanUserModal: React.FC<BanUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a specific justification for banning this account.');
      return;
    }
    if (!confirmed) {
      setError('You must confirm that you understand the severity of this action.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onConfirm(user.id, reason.trim());
      setReason('');
      setConfirmed(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to ban user.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title="Ban User Account?"
      description="Permanently revoke access and blacklist account activity."
      variant="danger"
      confirmText="Ban User Account"
      cancelText="Cancel"
      isLoading={isLoading}
      isConfirmDisabled={!reason.trim() || !confirmed}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Warning Callout */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-danger-light)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-danger-dark)',
            fontSize: 'var(--font-size-xs)',
            lineHeight: 1.4,
          }}
        >
          <strong>Warning:</strong> Banning a user is a high-severity action. This immediately terminates active sessions, hides public listings, and prohibits re-registration with this email address.
        </div>

        {/* Affected User */}
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
              {user.email} • Current Status:{' '}
              <strong style={{ textTransform: 'capitalize' }}>{user.status}</strong>
            </div>
          </div>
        </div>

        {/* Reason Textarea */}
        <div className="form-group">
          <label className="form-label">
            Violation Reason & Audit Note <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            className="form-textarea"
            placeholder="Specify reason for banning (e.g., fraud, severe harassment, malicious uploads)..."
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

        {/* Mandatory Confirmation Checkbox */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-gray-700)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ marginTop: 2, accentColor: 'var(--color-danger)' }}
          />
          <span>I understand that this will restrict the user's access according to platform safety regulations.</span>
        </label>
      </div>
    </ConfirmModal>
  );
};
