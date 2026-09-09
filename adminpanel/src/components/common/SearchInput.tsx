import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  debounceMs?: number;
  width?: string | number;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search by name or email...',
  value,
  onChange,
  isLoading = false,
  debounceMs = 300,
  width = '100%',
}) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [internalValue, debounceMs, onChange, value]);

  const handleClear = () => {
    setInternalValue('');
    onChange('');
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: width,
      }}
    >
      <Search
        size={16}
        style={{
          position: 'absolute',
          left: 12,
          color: 'var(--color-gray-400)',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        style={{
          paddingLeft: 36,
          paddingRight: internalValue || isLoading ? 34 : 12,
          height: 38,
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--font-size-sm)',
        }}
      />
      {isLoading ? (
        <Loader2
          size={16}
          className="animate-spin"
          style={{
            position: 'absolute',
            right: 12,
            color: 'var(--color-primary-500)',
          }}
        />
      ) : internalValue ? (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: 10,
            color: 'var(--color-gray-400)',
            padding: 2,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Clear search"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
};
