import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 6,
}) => {
  return (
    <div style={{ width: '100%', padding: 'var(--space-2)' }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            padding: 'var(--space-4) 0',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="animate-pulse"
              style={{
                flex: c === 0 ? '0 0 32px' : 1,
                height: 18,
                backgroundColor: 'var(--color-gray-200)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--space-4)',
        width: '100%',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="admin-card animate-pulse"
          style={{ height: 110, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
        >
          <div style={{ width: '40%', height: 14, backgroundColor: 'var(--color-gray-200)', borderRadius: 'var(--radius-sm)' }} />
          <div style={{ width: '65%', height: 26, backgroundColor: 'var(--color-gray-200)', borderRadius: 'var(--radius-sm)' }} />
          <div style={{ width: '30%', height: 12, backgroundColor: 'var(--color-gray-200)', borderRadius: 'var(--radius-sm)' }} />
        </div>
      ))}
    </div>
  );
};
