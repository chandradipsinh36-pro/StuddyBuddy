import React from 'react';
import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  message = 'No records match your criteria or none have been created yet.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-6)',
        textAlign: 'center',
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        border: '1px dashed var(--color-border)',
        margin: 'var(--space-4) 0',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'var(--color-gray-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-gray-400)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {icon || <Inbox size={26} />}
      </div>
      <h3
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 700,
          color: 'var(--color-gray-800)',
          marginBottom: 'var(--space-1)',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-500)',
          maxWidth: 380,
          lineHeight: 1.4,
          marginBottom: onAction ? 'var(--space-4)' : 0,
        }}
      >
        {message}
      </p>
      {onAction && actionText && (
        <button onClick={onAction} className="btn btn-secondary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Data',
  message = 'An unexpected error occurred while fetching information from the service.',
  onRetry,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        textAlign: 'center',
        backgroundColor: 'var(--color-danger-light)',
        border: '1px solid var(--color-danger-border)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--color-danger-dark)',
      }}
    >
      <AlertTriangle size={32} style={{ marginBottom: 'var(--space-2)' }} />
      <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-danger-dark)' }}>
        {title}
      </h4>
      <p style={{ fontSize: 'var(--font-size-sm)', maxWidth: 420, margin: 'var(--space-2) 0 var(--space-4)' }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-danger btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
