import React, { useState } from 'react';
import { ConfirmModal } from '../common/ConfirmModal';
import type { User } from '../../types/admin';

interface DeleteUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: number) => Promise<void>;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = async () => {
    if (!confirmed) {
      setError('You must check the confirmation box to proceed with deletion.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onConfirm(user.id);
      setConfirmed(false);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete user.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={() => {
        setConfirmed(false);
        setError('');
        onClose();
      }}
      onConfirm={handleSubmit}
      title="Permanently Delete Account?"
      description="This action is destructive and irreversible."
      variant="danger"
      confirmText="Delete Account Permanently"
      cancelText="Cancel"
      isLoading={isLoading}
      isConfirmDisabled={!confirmed}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* User Card */}
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
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-900)' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
              {user.email} • Role: <strong style={{ textTransform: 'capitalize' }}>{user.role}</strong>
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', marginTop: 2 }}>
              Account ID: #{user.id}
            </div>
          </div>
        </div>

        {/* Severe Warning Alert */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: '#FEF2F2',
            border: '1px solid #F87171',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-xs)',
            color: '#991B1B',
            lineHeight: 1.5,
          }}
        >
          <strong>Warning:</strong> Deleting this account will permanently erase all associated database records:
          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
            <li>Tutor profile, verification applications, and demo videos</li>
            <li>Enrolled courses, lesson progress, and course reviews</li>
            <li>Uploaded resources, bundles, and study group memberships</li>
          </ul>
        </div>

        {/* Confirmation Checkbox */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-gray-700)',
            cursor: 'pointer',
            padding: 'var(--space-2) 0',
          }}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => {
              setConfirmed(e.target.checked);
              if (error) setError('');
            }}
            style={{ marginTop: 2 }}
          />
          <span>
            I understand that deleting <strong>{user.name}</strong> (#{user.id}) is permanent and cannot be undone.
          </span>
        </label>

        {error && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}
      </div>
    </ConfirmModal>
  );
};
