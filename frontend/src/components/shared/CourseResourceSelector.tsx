import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Check,
  FileText,
  Video,
  Presentation,
  FileCheck,
  Headphones,
  Image as ImageIcon,
  X,
  ExternalLink,
  FolderPlus,
  Upload,
} from 'lucide-react';
import { Badge } from '../ui/Badge/Badge';
import { Button } from '../ui/Button/Button';
import { ROUTES } from '../../constants';
import type { Resource } from '../../types';
import styles from './CourseResourceSelector.module.css';

export interface CourseResourceSelectorProps {
  selectedResourceIds: number[];
  onChange: (selectedIds: number[]) => void;
  availableResources: Resource[];
  isLoading?: boolean;
  loading?: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  pdf: { label: 'PDF', icon: <FileText size={16} color="#DC2626" />, badgeClass: styles.badgePdf },
  youtube: { label: 'Video', icon: <Video size={16} color="#7C3AED" />, badgeClass: styles.badgeVideo },
  ppt: { label: 'PPT', icon: <Presentation size={16} color="#EA580C" />, badgeClass: styles.badgePpt },
  test_paper: { label: 'Test Paper', icon: <FileCheck size={16} color="#0F766E" />, badgeClass: styles.badgeTest },
  audio: { label: 'Audio', icon: <Headphones size={16} color="#0284C7" />, badgeClass: styles.badgeAudio },
  image: { label: 'Image', icon: <ImageIcon size={16} color="#16A34A" />, badgeClass: styles.badgeImage },
};

export const CourseResourceSelector: React.FC<CourseResourceSelectorProps> = ({
  selectedResourceIds,
  onChange,
  availableResources,
  isLoading = false,
  loading = false,
}) => {
  const isCurrentlyLoading = isLoading || loading;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  // Format count aggregations
  const formatCounts = useMemo(() => {
    const counts: Record<string, number> = { all: availableResources.length };
    availableResources.forEach((r) => {
      const type = r.type || r.fileType || 'pdf';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [availableResources]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return availableResources.filter((r) => {
      const type = r.type || r.fileType || 'pdf';
      const matchesFormat = selectedFormat === 'all' || type === selectedFormat;
      if (!matchesFormat) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const title = (r.title || r.filename || '').toLowerCase();
      const subject = (r.subject || '').toLowerCase();
      const category = (r.category || '').toLowerCase();
      return title.includes(q) || subject.includes(q) || category.includes(q);
    });
  }, [availableResources, selectedFormat, searchTerm]);

  // Map of selected resources for quick tray display
  const selectedResourcesList = useMemo(() => {
    const map = new Map<number, Resource>();
    availableResources.forEach((r) => {
      const id = r.resourceId || r.id;
      if (id) map.set(id, r);
    });
    return selectedResourceIds
      .map((id) => map.get(id))
      .filter((r): r is Resource => !!r);
  }, [availableResources, selectedResourceIds]);

  const toggleResource = (id: number) => {
    if (selectedResourceIds.includes(id)) {
      onChange(selectedResourceIds.filter((item) => item !== id));
    } else {
      onChange([...selectedResourceIds, id]);
    }
  };

  const selectAllFiltered = () => {
    const newIds = new Set(selectedResourceIds);
    filteredResources.forEach((r) => {
      const id = r.resourceId || r.id;
      if (id) newIds.add(id);
    });
    onChange(Array.from(newIds));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <FolderPlus size={20} />
          </div>
          <div>
            <h3 className={styles.title}>Curriculum Materials & Resources</h3>
            <p className={styles.subtitle}>
              Select learning materials from your library to include in this course curriculum.
            </p>
          </div>
        </div>

        <Badge variant={selectedResourceIds.length > 0 ? 'primary' : 'default'}>
          {selectedResourceIds.length} {selectedResourceIds.length === 1 ? 'Material' : 'Materials'} Selected
        </Badge>
      </div>

      {/* Selected Items Tray */}
      {selectedResourceIds.length > 0 && (
        <div className={styles.selectedTray}>
          <div className={styles.selectedTrayHeader}>
            <span>Included in Course Curriculum ({selectedResourceIds.length}):</span>
            <button
              type="button"
              onClick={clearAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary-700)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear Selection
            </button>
          </div>

          <div className={styles.selectedChipsList}>
            {selectedResourcesList.map((r) => {
              const resId = r.resourceId || r.id || 0;
              const type = r.type || r.fileType || 'pdf';
              const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.pdf;
              return (
                <div key={resId} className={styles.selectedTag} title={r.title || r.filename}>
                  {cfg.icon}
                  <span className={styles.selectedTagText}>{r.title || r.filename}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleResource(resId);
                    }}
                    className={styles.removeTagBtn}
                    aria-label="Remove resource"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filters Toolbar */}
      {availableResources.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.searchRow}>
            <div className={styles.searchInputWrapper}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search your library by title, subject, or discipline..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.quickActions}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={selectAllFiltered}
                disabled={filteredResources.length === 0}
              >
                Select Filtered ({filteredResources.length})
              </Button>
            </div>
          </div>

          {/* Format Chips */}
          <div className={styles.filterChips}>
            <button
              type="button"
              className={`${styles.filterChip} ${selectedFormat === 'all' ? styles.filterChipActive : ''}`}
              onClick={() => setSelectedFormat('all')}
            >
              All Formats ({formatCounts.all || 0})
            </button>

            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
              const count = formatCounts[key] || 0;
              if (count === 0 && selectedFormat !== key) return null;
              return (
                <button
                  key={key}
                  type="button"
                  className={`${styles.filterChip} ${selectedFormat === key ? styles.filterChipActive : ''}`}
                  onClick={() => setSelectedFormat(key)}
                >
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Resource Cards Grid or Empty State */}
      {isCurrentlyLoading ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-gray-500)', fontSize: 'var(--font-size-xs)' }}>
          Loading your teaching materials...
        </div>
      ) : availableResources.length === 0 ? (
        <div className={styles.emptyState}>
          <Upload size={32} color="var(--color-gray-400)" />
          <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-gray-800)' }}>
            No uploaded teaching materials found
          </h4>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', maxWidth: 420 }}>
            You haven't uploaded any resources yet. You can create this course now and attach learning materials anytime later, or upload a resource now.
          </p>
          <Link
            to={ROUTES.TUTOR_RESOURCE_CREATE}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 'var(--space-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>Upload Teaching Material</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className={styles.emptyState}>
          <Search size={28} color="var(--color-gray-400)" />
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)' }}>
            No resources matched your search query <strong>"{searchTerm}"</strong>.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedFormat('all');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredResources.map((r) => {
            const resId = r.resourceId || r.id || 0;
            const isSelected = selectedResourceIds.includes(resId);
            const type = r.type || r.fileType || 'pdf';
            const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.pdf;

            return (
              <div
                key={resId}
                onClick={() => toggleResource(resId)}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggleResource(resId);
                  }
                }}
              >
                <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}>
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>

                <div className={styles.cardContent}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {cfg.icon}
                    <h4 className={styles.cardTitle}>{r.title || r.filename}</h4>
                  </div>

                  <div className={styles.metaRow}>
                    <span className={`${styles.metaBadge} ${cfg.badgeClass}`}>
                      {cfg.label}
                    </span>

                    {r.subject && (
                      <span className={styles.subjectText}>• {r.subject}</span>
                    )}

                    {r.difficulty && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-gray-500)', textTransform: 'capitalize' }}>
                        • {r.difficulty}
                      </span>
                    )}

                    <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 600, color: r.isLocked ? 'var(--color-warning)' : 'var(--color-success)' }}>
                      {r.isLocked ? `₹${r.price || 0}` : 'Free'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
