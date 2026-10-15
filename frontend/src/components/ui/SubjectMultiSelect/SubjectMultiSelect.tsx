import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Plus, X, Check, Sparkles, Globe, AlertCircle } from 'lucide-react';
import { SUBJECT_CATEGORIES, POPULAR_SUBJECTS } from '../../../constants/academicData';
import { academicSearchService } from '../../../services/academicSearchService';
import { isSafeEducationalContent } from '../../../utils/contentModeration';
import styles from './SubjectMultiSelect.module.css';

export interface SubjectMultiSelectProps {
  label?: string;
  selectedSubjects: string[];
  onChange: (subjects: string[]) => void;
  error?: string;
  helper?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const SubjectMultiSelect: React.FC<SubjectMultiSelectProps> = ({
  label = 'Teaching Subjects *',
  selectedSubjects = [],
  onChange,
  error,
  helper = 'Select from standard disciplines or type any custom subject/specialization',
  placeholder = 'Search or type subject (e.g. Mathematics, Computer Science, AI)...',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [globalSubjects, setGlobalSubjects] = useState<string[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidatingCustom, setIsValidatingCustom] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Active sanitation: immediately purge any inappropriate/adult subject if it appears in selectedSubjects
  useEffect(() => {
    if (!selectedSubjects || selectedSubjects.length === 0) return;
    const unsafeItems = selectedSubjects.filter((s) => !isSafeEducationalContent(s).isSafe);
    if (unsafeItems.length > 0) {
      const cleanSubjects = selectedSubjects.filter((s) => isSafeEducationalContent(s).isSafe);
      onChange(cleanSubjects);
      setValidationError(`Removed restricted or adult content: "${unsafeItems.join(', ')}". 18+ content is strictly prohibited.`);
    }
  }, [selectedSubjects, onChange]);

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

  // Debounced search with OpenAlex fallback for niche topics
  useEffect(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || trimmed.length < 3 || !isSafeEducationalContent(trimmed).isSafe) {
      setGlobalSubjects([]);
      setIsSearchingApi(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingApi(true);
      try {
        const results = await academicSearchService.searchSubjectsGlobal(trimmed);
        const localMatches = academicSearchService.searchSubjectsLocal(trimmed);
        const uniqueApiResults = results
          .filter((r) => isSafeEducationalContent(r).isSafe)
          .filter((r) => !localMatches.some((l) => l.toLowerCase() === r.toLowerCase()));
        setGlobalSubjects(uniqueApiResults);
      } catch {
        setGlobalSubjects([]);
      } finally {
        setIsSearchingApi(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleAddSubject = (subject: string) => {
    const trimmed = subject.trim();
    if (!trimmed) return;

    // Content Moderation check
    const safety = isSafeEducationalContent(trimmed);
    if (!safety.isSafe) {
      setValidationError(safety.reason || 'Inappropriate, adult, or vulgar content is strictly prohibited.');
      return;
    }

    if (!selectedSubjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...selectedSubjects, trimmed]);
    }
    setValidationError(null);
    setInputValue('');
    setIsOpen(false);
  };

  const handleAddCustomSubject = async (subject: string) => {
    const trimmed = subject.trim();
    if (!trimmed) return;

    // Content Moderation check FIRST
    const safety = isSafeEducationalContent(trimmed);
    if (!safety.isSafe) {
      setValidationError(safety.reason || 'Inappropriate, adult, or vulgar content is strictly prohibited.');
      return;
    }

    setIsValidatingCustom(true);
    setValidationError(null);
    try {
      const res = await academicSearchService.verifySubjectRealWorld(trimmed);
      if (!res.isValid) {
        setValidationError(res.error || 'Please enter a recognized academic discipline or programming subject.');
        setIsValidatingCustom(false);
        return;
      }

      setValidationError(null);
      handleAddSubject(trimmed);
    } finally {
      setIsValidatingCustom(false);
    }
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    onChange(selectedSubjects.filter((s) => s.toLowerCase() !== subjectToRemove.toLowerCase()));
  };

  const handleTogglePopular = (subject: string) => {
    if (selectedSubjects.some((s) => s.toLowerCase() === subject.toLowerCase())) {
      handleRemoveSubject(subject);
    } else {
      handleAddSubject(subject);
    }
  };

  const query = inputValue.trim().toLowerCase();

  // Filter local categories
  const filteredCategories = SUBJECT_CATEGORIES.map((cat) => {
    const matchingSubjects = cat.subjects
      .filter((s) => isSafeEducationalContent(s).isSafe)
      .filter(
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
    <div className={`${styles.wrapper} ${disabled ? styles.disabledWrapper : ''} ${isOpen && !disabled ? styles.wrapperOpen : ''}`} ref={containerRef}>
      {/* Header with Label and Counter */}
      <div className={styles.headerRow}>
        <label className={styles.label}>
          <span>{label}</span>
        </label>
        <span className={styles.selectedCounter}>
          {selectedSubjects.filter((s) => isSafeEducationalContent(s).isSafe).length} selected
        </span>
      </div>

      {/* 1. Search Input Field FIRST (At Top) */}
      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
        <span className={styles.leftIcon}>
          <BookOpen size={18} />
        </span>

        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={disabled ? 'Locked while application is under review' : placeholder}
          value={inputValue}
          disabled={disabled}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onChange={(e) => {
            if (disabled) return;
            const val = e.target.value;
            setInputValue(val);
            const safety = isSafeEducationalContent(val);
            if (!safety.isSafe) {
              setValidationError(safety.reason || 'Inappropriate, adult, or vulgar content is strictly prohibited.');
            } else {
              setValidationError(null);
            }
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter') {
              e.preventDefault();
              if (inputValue.trim()) {
                handleAddCustomSubject(inputValue.trim());
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        />

        <div className={styles.rightActions}>
          {inputValue.trim() && !disabled && (
            <button
              type="button"
              className={styles.addBtn}
              disabled={isValidatingCustom || disabled}
              onClick={() => handleAddCustomSubject(inputValue.trim())}
            >
              <Plus size={14} />
              <span>{isValidatingCustom ? 'Verifying...' : 'Add'}</span>
            </button>
          )}
        </div>

        {/* Dropdown with categories and global OpenAlex concepts */}
        {isOpen && !disabled && (
          <div className={styles.dropdown}>
            {/* Custom entry button - ONLY if content is safe */}
            {query && !exactMatchExists && isSafeEducationalContent(query).isSafe && (
              <button
                type="button"
                className={styles.customOption}
                disabled={isValidatingCustom}
                onClick={() => handleAddCustomSubject(inputValue.trim())}
              >
                <Sparkles size={15} />
                <span>
                  {isValidatingCustom
                    ? 'Verifying against global academic registries...'
                    : `Add custom subject: "${inputValue.trim()}"`}
                </span>
              </button>
            )}

            {/* Local Categories */}
            {filteredCategories.map((cat) => (
              <div key={cat.category} className={styles.categoryGroup}>
                <div className={styles.categoryTitle}>{cat.category}</div>
                {cat.subjects.map((s) => {
                  const isSelected = selectedSubjects.some(
                    (sel) => sel.toLowerCase() === s.toLowerCase()
                  );
                  return (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.subjectItem} ${isSelected ? styles.subjectItemActive : ''}`}
                      onClick={() => handleAddSubject(s)}
                    >
                      <span>{s}</span>
                      {isSelected ? (
                        <Check size={16} color="var(--color-primary-600)" />
                      ) : (
                        <Plus size={14} color="var(--color-gray-400)" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* OpenAlex Global Academic Disciplines API Results (Strictly filtered for safe educational content) */}
            {globalSubjects.filter((s) => isSafeEducationalContent(s).isSafe).length > 0 && (
              <div className={styles.categoryGroup}>
                <div className={styles.apiResultsHeader}>
                  <Globe size={13} />
                  <span>Global Academic Topics (via OpenAlex)</span>
                </div>
                {globalSubjects
                  .filter((s) => isSafeEducationalContent(s).isSafe)
                  .map((s) => {
                  const isSelected = selectedSubjects.some(
                    (sel) => sel.toLowerCase() === s.toLowerCase()
                  );
                  return (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.subjectItem} ${isSelected ? styles.subjectItemActive : ''}`}
                      onClick={() => handleAddSubject(s)}
                    >
                      <span>{s}</span>
                      {isSelected ? (
                        <Check size={16} color="var(--color-primary-600)" />
                      ) : (
                        <Plus size={14} color="var(--color-gray-400)" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {isSearchingApi && (
              <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--color-gray-500)' }}>
                Searching 65,000+ global academic topics...
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Selected Tags BELOW Input Field */}
      {selectedSubjects.filter((s) => isSafeEducationalContent(s).isSafe).length > 0 && (
        <div className={styles.selectedTagsContainer}>
          {selectedSubjects
            .filter((s) => isSafeEducationalContent(s).isSafe)
            .map((s) => (
            <span key={s} className={styles.selectedTag}>
              <span>{s}</span>
              {!disabled && (
                <button
                  type="button"
                  className={styles.removeTagBtn}
                  onClick={() => handleRemoveSubject(s)}
                  title={`Remove ${s}`}
                >
                  <X size={14} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* 3. Popular Subjects Pills BELOW Selected Tags */}
      {!disabled && (
        <div className={styles.popularContainer}>
          <span className={styles.popularLabel}>Popular:</span>
          <div className={styles.popularPillsGrid}>
            {POPULAR_SUBJECTS.map((subj) => {
              const isSelected = selectedSubjects.some(
                (s) => s.toLowerCase() === subj.toLowerCase()
              );
              return (
                <button
                  key={subj}
                  type="button"
                  className={`${styles.popularChip} ${isSelected ? styles.popularChipActive : ''}`}
                  onClick={() => handleTogglePopular(subj)}
                >
                  {isSelected ? '✓ ' : '+ '} {subj}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {validationError || error ? (
        <p className={styles.error} role="alert">
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          <span>{validationError || error}</span>
        </p>
      ) : helper ? (
        <p className={styles.helper}>{helper}</p>
      ) : null}
    </div>
  );
};
