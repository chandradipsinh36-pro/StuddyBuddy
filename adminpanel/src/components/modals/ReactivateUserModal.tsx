import React, { useState } from 'react';
import { ConfirmModal } from '../common/ConfirmModal';
import type { User } from '../../types/admin';

interface ReactivateUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: number) => Promise<void>;
}

export const ReactivateUserModal: React.FC<ReactivateUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    try {
      await onConfirm(user.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate user.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title="Reactivate User?"
      description="Restore full platform access and remove existing restriction status."
      variant="success"
      confirmText="Reactivate Account"
      cancelText="Cancel"
      isLoading={isLoading}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
              <strong style={{ textTransform: 'capitalize', color: 'var(--color-suspended-dark)' }}>
                {user.status}
              </strong>
            </div>
          </div>
        </div>

        {user.suspension_reason && (
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-gray-600)',
              backgroundColor: 'var(--color-gray-50)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            <strong>Prior restriction reason:</strong> {user.suspension_reason}
          </div>
        )}

        {error && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}

        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', lineHeight: 1.4 }}>
          Reactivating this account will grant immediate access to learning materials, discussions, and tutor booking.
        </p>
      </div>
    </ConfirmModal>
  );
};
