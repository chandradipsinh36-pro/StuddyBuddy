import React from 'react';
import { STATUS_COLORS } from '../../constants';

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'unknown', label, size = 'sm' }) => {
  const norm = (status || '').toLowerCase();

  let badgeClass = 'badge badge-neutral';
  let displayLabel = label || status || 'Unknown';

  if (norm === 'active' || norm === 'approved' || norm === 'verified') {
    badgeClass = 'badge badge-success';
  } else if (norm === 'pending' || norm === 'under_review') {
    badgeClass = 'badge badge-warning';
    if (!label) displayLabel = 'Pending Review';
  } else if (norm === 'suspended') {
    badgeClass = 'badge badge-suspended';
  } else if (norm === 'banned' || norm === 'rejected') {
    badgeClass = 'badge badge-danger';
  } else if (norm === 'admin') {
    badgeClass = 'badge badge-admin';
  } else if (norm === 'tutor') {
    badgeClass = 'badge badge-neutral';
    displayLabel = 'Tutor';
  } else if (norm === 'student') {
    badgeClass = 'badge badge-neutral';
    displayLabel = 'Student';
  }

  return (
    <span
      className={badgeClass}
      style={{
        padding: size === 'sm' ? '0.18rem 0.55rem' : '0.3rem 0.75rem',
        fontSize: size === 'sm' ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
        textTransform: 'capitalize',
      }}
    >
      <span className="badge-dot" />
      <span>{displayLabel}</span>
    </span>
  );
};
