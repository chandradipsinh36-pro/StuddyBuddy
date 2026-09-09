import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  width?: string | number;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  width = 'auto',
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width }}>
      {label && (
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            color: 'var(--color-gray-500)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          {label}:
        </span>
      )}
      <select
        className="form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 38,
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--font-size-sm)',
          cursor: 'pointer',
          paddingRight: 'var(--space-6)',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
