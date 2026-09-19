import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, ChevronDown, X, Check, Sparkles, Globe, AlertCircle } from 'lucide-react';
import { SUBJECT_CATEGORIES } from '../../../constants/academicData';
import { academicSearchService } from '../../../services/academicSearchService';
import styles from './SubjectAutocomplete.module.css';

export interface SubjectAutocompleteProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helper?: string;
  placeholder?: string;
  required?: boolean;
}

export const SubjectAutocomplete: React.FC<SubjectAutocompleteProps> = ({
  label = 'Subject Discipline *',
  value,
  onChange,
  error,
  helper,
  placeholder = 'Search or type subject (e.g. Mathematics, Python, Physics)...',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [globalSubjects, setGlobalSubjects] = useState<string[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live API search for niche disciplines and global topics
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 3) {
      setGlobalSubjects([]);
      setIsSearchingApi(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingApi(true);
      try {
        const results = await academicSearchService.searchSubjectsGlobal(trimmed);
        const localMatches = academicSearchService.searchSubjectsLocal(trimmed);
        const uniqueApiResults = results.filter(
          (r) => !localMatches.some((l) => l.toLowerCase() === r.toLowerCase())
        );
        setGlobalSubjects(uniqueApiResults);
      } catch {
        setGlobalSubjects([]);
      } finally {
        setIsSearchingApi(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = (subjectName: string) => {
    onChange(subjectName.trim());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const query = value.trim().toLowerCase();

  // Filter local categories
  const filteredCategories = SUBJECT_CATEGORIES.map((cat) => {
    const matchingSubjects = cat.subjects.filter(
      (s) =>
        !query ||
        s.toLowerCase().includes(query) ||
        cat.category.toLowerCase().includes(query)
    );
    return {
      ...cat,
      subjects: matchingSubjects,
    };
  }).filter((cat) => cat.subjects.length > 0);

  const exactMatchExists = SUBJECT_CATEGORIES.some((cat) =>
    cat.subjects.some((s) => s.toLowerCase() === query)
  );

  return (
    <div className={`${styles.wrapper} ${isOpen ? styles.wrapperOpen : ''}`} ref={containerRef}>
      {label && (
        <label className={styles.label}>
          <span>{label}</span>
        </label>
      )}

      {/* Input Field with Dropdown anchored directly below it */}
      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
        <span className={styles.leftIcon}>
          <BookOpen size={18} />
        </span>

        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={placeholder}
          value={value}
          required={required}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setIsOpen(false);
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        />

        <div className={styles.rightActions}>
          {value && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              title="Clear input"
            >
              <X size={15} />
            </button>
          )}

          <button
            type="button"
            className={styles.dropdownToggleBtn}
            onClick={() => setIsOpen((prev) => !prev)}
            title="Toggle suggestions"
          >
            <ChevronDown
              size={16}
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>
        </div>

        {/* Suggestion Dropdown - EXACTLY below the input field */}
        {isOpen && (
          <div className={styles.dropdown}>
            {/* Custom entry button */}
            {query && !exactMatchExists && (
              <button
                type="button"
                className={styles.customOption}
                onClick={() => handleSelect(value.trim())}
              >
                <Sparkles size={15} />
                <span>Use &ldquo;{value.trim()}&rdquo; as Subject</span>
              </button>
            )}

            {/* Local categories with programming languages and subjects */}
            {filteredCategories.map((cat) => (
              <div key={cat.category} className={styles.categoryGroup}>
                <div className={styles.categoryTitle}>{cat.category}</div>
                {cat.subjects.map((s) => {
                  const isSelected = value.trim().toLowerCase() === s.toLowerCase();
                  return (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.subjectItem} ${isSelected ? styles.subjectItemActive : ''}`}
                      onClick={() => handleSelect(s)}
                    >
                      <span>{s}</span>
                      {isSelected && <Check size={16} color="var(--color-primary-600)" />}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* OpenAlex Global Academic Disciplines API Results */}
            {globalSubjects.length > 0 && (
              <div className={styles.categoryGroup}>
                <div className={styles.apiResultsHeader}>
                  <Globe size={13} />
                  <span>Global Topics & Tech (via OpenAlex & Wikipedia)</span>
                </div>
                {globalSubjects.map((s) => {
                  const isSelected = value.trim().toLowerCase() === s.toLowerCase();
                  return (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.subjectItem} ${isSelected ? styles.subjectItemActive : ''}`}
                      onClick={() => handleSelect(s)}
                    >
                      <span>{s}</span>
                      {isSelected && <Check size={16} color="var(--color-primary-600)" />}
                    </button>
                  );
                })}
              </div>
            )}

            {isSearchingApi && (
              <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#f0f9ff' }}>
                <span className={styles.spinner} />
                <span>Searching global academic topics, programming languages & tech...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </p>
      ) : helper ? (
        <p className={styles.helper}>{helper}</p>
      ) : null}
    </div>
  );
};
