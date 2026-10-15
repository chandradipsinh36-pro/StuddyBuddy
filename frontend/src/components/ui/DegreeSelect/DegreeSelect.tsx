import React, { useState, useRef, useEffect } from 'react';
import { Award, ChevronDown, X, Check, Sparkles, AlertCircle, Globe, Plus } from 'lucide-react';
import { DEGREE_CATEGORIES, POPULAR_DEGREES } from '../../../constants/academicData';
import { academicSearchService, type DegreeOption } from '../../../services/academicSearchService';
import { isSafeEducationalContent } from '../../../utils/contentModeration';
import styles from './DegreeSelect.module.css';

export interface DegreeSelectProps {
  label?: string;
  selectedDegrees?: string[];
  value?: string;
  onChange: (degrees: any) => void;
  error?: string;
  helper?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export const DegreeSelect: React.FC<DegreeSelectProps> = ({
  label = 'Degrees & Qualifications *',
  selectedDegrees: propDegrees,
  value = '',
  onChange,
  error,
  helper,
  placeholder = 'Search or type degree (e.g. MCA, MBA, Ph.D., B.Tech)...',
  required = false,
  disabled = false,
}) => {
  // Normalize selected degrees array from propDegrees or comma-separated value (filtering any placeholder strings)
  const rawDegrees = propDegrees || (value ? value.split(', ').map(s => s.trim()).filter(Boolean) : []);
  const selectedDegrees = rawDegrees.filter(
    (d) => !['educator', 'independent educator', 'affiliated educational institution'].includes(d.toLowerCase())
  );

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiDegrees, setApiDegrees] = useState<DegreeOption[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced live API search for global & specialized degrees (e.g. B.Sc. in Cosmetology and Perfumery)
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length < 3) {
      setApiDegrees([]);
      setIsSearchingApi(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingApi(true);
      try {
        const results = await academicSearchService.searchDegreesGlobal(trimmed);
        setApiDegrees(results);
      } catch {
        setApiDegrees([]);
      } finally {
        setIsSearchingApi(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Active sanitation: immediately purge any inappropriate/adult degree if it appears in selectedDegrees
  useEffect(() => {
    if (!selectedDegrees || selectedDegrees.length === 0) return;
    const unsafeItems = selectedDegrees.filter((d) => !isSafeEducationalContent(d).isSafe);
    if (unsafeItems.length > 0) {
      const cleanDegrees = selectedDegrees.filter((d) => isSafeEducationalContent(d).isSafe);
      onChange(propDegrees !== undefined ? cleanDegrees : cleanDegrees.join(', '));
      setValidationError(`Removed restricted or adult qualification: "${unsafeItems.join(', ')}". 18+ content is strictly prohibited.`);
    }
  }, [selectedDegrees, propDegrees, onChange]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddDegree = (degreeText: string) => {
    const trimmed = degreeText.trim();
    if (!trimmed) return;

    // Content Moderation check
    const safety = isSafeEducationalContent(trimmed);
    if (!safety.isSafe) {
      setValidationError(safety.reason || 'Inappropriate, adult, or vulgar content is strictly prohibited.');
      return;
    }

    if (!selectedDegrees.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...selectedDegrees, trimmed];
      // Support both array or comma-separated string depending on how parent uses it
      onChange(propDegrees !== undefined ? updated : updated.join(', '));
    }
    setValidationError(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleAddCustomDegree = (degreeText: string) => {
    const trimmed = degreeText.trim();
    if (!trimmed) return;

    // Safety check FIRST
    const safety = isSafeEducationalContent(trimmed);
    if (!safety.isSafe) {
      setValidationError(safety.reason || 'Inappropriate, adult, or vulgar content is strictly prohibited.');
      return;
    }

    const res = academicSearchService.verifyDegreeRealWorld(trimmed);
    if (!res.isValid) {
      setValidationError(res.error || 'Please enter a recognized academic degree or diploma.');
      return;
    }

    setValidationError(null);
    handleAddDegree(trimmed);
  };

  const handleRemoveDegree = (degreeToRemove: string) => {
    const updated = selectedDegrees.filter((d) => d.toLowerCase() !== degreeToRemove.toLowerCase());
    onChange(propDegrees !== undefined ? updated : updated.join(', '));
  };

  const handleTogglePopular = (deg: string) => {
    const isSelected = selectedDegrees.some(
      (d) => d.toLowerCase() === deg.toLowerCase() || d.toLowerCase().startsWith(deg.toLowerCase() + ' ')
    );
    if (isSelected) {
      handleRemoveDegree(deg);
    } else {
      handleAddDegree(deg);
    }
  };

  // Filter categories and degrees based on search term
  const query = searchTerm.trim().toLowerCase();

  const filteredCategories = DEGREE_CATEGORIES.map((cat) => {
    const matchingDegrees = cat.degrees
      .filter((d) => isSafeEducationalContent(d.code).isSafe && isSafeEducationalContent(d.name).isSafe)
      .filter(
        (d) =>
          !query ||
          d.code.toLowerCase().includes(query) ||
          d.name.toLowerCase().includes(query) ||
          cat.category.toLowerCase().includes(query)
      );
    return {
      ...cat,
      degrees: matchingDegrees,
    };
  }).filter((cat) => cat.degrees.length > 0);

  const exactMatchExists = DEGREE_CATEGORIES.some((cat) =>
    cat.degrees.some((d) => d.code.toLowerCase() === query || d.name.toLowerCase() === query)
  );

  return (
    <div className={`${styles.wrapper} ${disabled ? styles.disabledWrapper : ''} ${isOpen && !disabled ? styles.wrapperOpen : ''}`} ref={containerRef}>
      {/* Header with Label and Counter */}
      <div className={styles.headerRow}>
        <label className={styles.label}>
          <span>{label}</span>
        </label>
        <span className={styles.selectedCounter}>
          {selectedDegrees.filter((d) => isSafeEducationalContent(d).isSafe).length} selected
        </span>
      </div>

      {/* 1. Search Input Field FIRST (At Top) */}
      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
        <span className={styles.leftIcon}>
          <Award size={18} />
        </span>

        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={disabled ? 'Locked while application is under review' : placeholder}
          value={searchTerm}
          disabled={disabled}
          required={required && selectedDegrees.length === 0}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onChange={(e) => {
            if (disabled) return;
            const val = e.target.value;
            setSearchTerm(val);
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
              if (searchTerm.trim()) {
                handleAddCustomDegree(searchTerm.trim());
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        />

        <div className={styles.rightActions}>
          {searchTerm.trim() && !disabled && (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => handleAddCustomDegree(searchTerm.trim())}
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          )}
          <button
            type="button"
            className={styles.actionBtn}
            disabled={disabled}
            onClick={() => {
              if (!disabled) setIsOpen((prev) => !prev);
            }}
            title="Toggle dropdown"
          >
            <ChevronDown
              size={16}
              style={{
                transform: isOpen && !disabled ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>
        </div>

        {/* Autocomplete Dropdown - Positioned directly below input field */}
        {isOpen && !disabled && (
          <div className={styles.dropdown}>
            {/* Live API Degree Search Results (Strictly filtered for safe educational content) */}
            {apiDegrees.filter((d) => isSafeEducationalContent(d.code).isSafe).length > 0 && (
              <div className={styles.categoryGroup}>
                <div className={styles.apiCategoryTitle}>
                  <Globe size={13} />
                  <span>Verified Academic Degrees & Programs (via Live Academic API)</span>
                </div>
                {apiDegrees
                  .filter((d) => isSafeEducationalContent(d.code).isSafe)
                  .map((d) => {
                  const isSelected = selectedDegrees.some(
                    (sel) => sel.toLowerCase() === d.code.toLowerCase() || sel.toLowerCase() === d.name.toLowerCase()
                  );
                  return (
                    <button
                      key={d.code}
                      type="button"
                      className={`${styles.degreeItem} ${isSelected ? styles.degreeItemActive : ''}`}
                      onClick={() => handleAddDegree(d.code)}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={styles.degreeCode}>{d.code}</span>
                          <span className={styles.degreeBadge}>{d.level}</span>
                        </div>
                        {d.description && (
                          <span style={{ fontSize: '11px', color: 'var(--color-gray-500)', marginTop: '2px' }}>
                            {d.description}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check size={16} color="var(--color-primary-600)" style={{ marginLeft: 8 }} />}
                    </button>
                  );
                })}
              </div>
            )}

            {isSearchingApi && (
              <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#f0f9ff' }}>
                <span className={styles.spinner} />
                <span>Searching global academic degrees & specializations...</span>
              </div>
            )}

            {/* Option to use custom input if user typed something not exact and content is safe */}
            {query && !exactMatchExists && isSafeEducationalContent(query).isSafe && !apiDegrees.some(d => d.code.toLowerCase() === query) && (
              <button
                type="button"
                className={styles.customOption}
                onClick={() => handleAddCustomDegree(searchTerm.trim())}
              >
                <Sparkles size={15} />
                <span>Add custom qualification: &ldquo;{searchTerm.trim()}&rdquo;</span>
              </button>
            )}

            {filteredCategories.length === 0 && apiDegrees.length === 0 && !isSearchingApi ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '13px' }}>
                No standard degree matches &ldquo;{searchTerm}&rdquo;. Click &ldquo;Add custom qualification&rdquo; above or press Enter to add it.
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div key={cat.category} className={styles.categoryGroup}>
                  <div className={styles.categoryTitle}>{cat.category}</div>
                  {cat.degrees.map((d) => {
                    const isSelected = selectedDegrees.some(
                      (sel) => sel.toLowerCase() === d.name.toLowerCase() || sel.toLowerCase() === d.code.toLowerCase()
                    );
                    return (
                      <button
                        key={d.code}
                        type="button"
                        className={`${styles.degreeItem} ${isSelected ? styles.degreeItemActive : ''}`}
                        onClick={() => handleAddDegree(`${d.code} - ${d.name}`)}
                      >
                        <span className={styles.degreeCode}>{d.code}</span>
                        <span className={styles.degreeName}>{d.name}</span>
                        <span className={styles.degreeBadge}>{d.level}</span>
                        {isSelected && <Check size={16} color="var(--color-primary-600)" style={{ marginLeft: 8 }} />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 2. Selected Tags BELOW Input Field */}
      {selectedDegrees.filter((d) => isSafeEducationalContent(d).isSafe).length > 0 && (
        <div className={styles.selectedTagsContainer}>
          {selectedDegrees
            .filter((d) => isSafeEducationalContent(d).isSafe)
            .map((deg) => (
            <span key={deg} className={styles.selectedTag}>
              <Award size={13} className={styles.tagIcon} />
              <span>{deg}</span>
              {!disabled && (
                <button
                  type="button"
                  className={styles.removeTagBtn}
                  onClick={() => handleRemoveDegree(deg)}
                  title={`Remove ${deg}`}
                >
                  <X size={13} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* 3. Popular Degree Pills BELOW Selected Tags */}
      {!disabled && (
        <div className={styles.popularContainer}>
          <span className={styles.popularLabel}>Popular:</span>
          <div className={styles.popularPillsGrid}>
            {POPULAR_DEGREES.map((deg) => {
              const isSelected = selectedDegrees.some(
                (d) => d.toLowerCase() === deg.toLowerCase() || d.toLowerCase().startsWith(deg.toLowerCase() + ' ')
              );
              return (
                <button
                  key={deg}
                  type="button"
                  className={`${styles.popularChip} ${isSelected ? styles.popularChipActive : ''}`}
                  onClick={() => handleTogglePopular(deg)}
                >
                  {isSelected ? '✓ ' : '+ '} {deg}
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
