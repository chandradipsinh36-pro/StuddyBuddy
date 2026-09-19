import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Plus, X, Check, Sparkles, Globe, AlertCircle } from 'lucide-react';
import { SUBJECT_CATEGORIES, POPULAR_SUBJECTS } from '../../../constants/academicData';
import { academicSearchService } from '../../../services/academicSearchService';
import styles from './SubjectMultiSelect.module.css';

export interface SubjectMultiSelectProps {
  label?: string;
  selectedSubjects: string[];
  onChange: (subjects: string[]) => void;
  error?: string;
  helper?: string;
  placeholder?: string;
}

export const SubjectMultiSelect: React.FC<SubjectMultiSelectProps> = ({
  label = 'Teaching Subjects *',
  selectedSubjects = [],
  onChange,
  error,
  helper = 'Select from standard disciplines or type any custom subject/specialization',
  placeholder = 'Search or type subject (e.g. Mathematics, Computer Science, AI)...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
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

  // Debounced search with OpenAlex fallback for niche topics
  useEffect(() => {
    const trimmed = inputValue.trim();
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
    }, 400);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleAddSubject = (subject: string) => {
    const trimmed = subject.trim();
    if (!trimmed) return;

    if (!selectedSubjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...selectedSubjects, trimmed]);
    }
    setInputValue('');
    setIsOpen(false);
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
      {/* Header with Label and Counter */}
      <div className={styles.headerRow}>
        <label className={styles.label}>
          <span>{label}</span>
        </label>
        <span className={styles.selectedCounter}>
          {selectedSubjects.length} selected
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
          placeholder={placeholder}
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (inputValue.trim()) {
                handleAddSubject(inputValue.trim());
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        />

        <div className={styles.rightActions}>
          {inputValue.trim() && (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => handleAddSubject(inputValue.trim())}
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          )}
        </div>

        {/* Dropdown with categories and global OpenAlex concepts */}
        {isOpen && (
          <div className={styles.dropdown}>
            {/* Custom entry button */}
            {query && !exactMatchExists && (
              <button
                type="button"
                className={styles.customOption}
                onClick={() => handleAddSubject(inputValue.trim())}
              >
                <Sparkles size={15} />
                <span>Add custom subject: &ldquo;{inputValue.trim()}&rdquo;</span>
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

            {/* OpenAlex Global Academic Disciplines API Results */}
            {globalSubjects.length > 0 && (
              <div className={styles.categoryGroup}>
                <div className={styles.apiResultsHeader}>
                  <Globe size={13} />
                  <span>Global Academic Topics (via OpenAlex)</span>
                </div>
                {globalSubjects.map((s) => {
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
      {selectedSubjects.length > 0 && (
        <div className={styles.selectedTagsContainer}>
          {selectedSubjects.map((s) => (
            <span key={s} className={styles.selectedTag}>
              <span>{s}</span>
              <button
                type="button"
                className={styles.removeTagBtn}
                onClick={() => handleRemoveSubject(s)}
                title={`Remove ${s}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 3. Popular Subjects Pills BELOW Selected Tags */}
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
