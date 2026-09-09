import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ROWS_PER_PAGE_OPTIONS } from '../../constants';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        padding: 'var(--space-4) 0',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-gray-500)',
      }}
    >
      {/* Left: Summary and Rows per Page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <span>
          Showing <strong style={{ color: 'var(--color-gray-800)' }}>{startItem}</strong> to{' '}
          <strong style={{ color: 'var(--color-gray-800)' }}>{endItem}</strong> of{' '}
          <strong style={{ color: 'var(--color-gray-800)' }}>{totalItems}</strong> entries
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span>Rows per page:</span>
          <select
            className="form-select"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            style={{
              padding: '0.2rem 0.5rem',
              height: 28,
              fontSize: 'var(--font-size-xs)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {ROWS_PER_PAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Page Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.3rem 0.5rem', height: 32 }}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        {getPageNumbers().map((p, idx) =>
          typeof p === 'number' ? (
            <button
              key={idx}
              onClick={() => onPageChange(p)}
              style={{
                minWidth: 32,
                height: 32,
                padding: '0 0.4rem',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: p === currentPage ? 700 : 500,
                backgroundColor:
                  p === currentPage ? 'var(--color-primary-500)' : 'transparent',
                color: p === currentPage ? 'var(--color-white)' : 'var(--color-gray-700)',
                border:
                  p === currentPage ? 'none' : '1px solid var(--color-border)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {p}
            </button>
          ) : (
            <span key={idx} style={{ padding: '0 0.3rem', color: 'var(--color-gray-400)' }}>
              ...
            </span>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.3rem 0.5rem', height: 32 }}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
