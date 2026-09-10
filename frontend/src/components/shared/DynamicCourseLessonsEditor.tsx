import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Video,
  ExternalLink,
  Paperclip,
  CheckCircle2,
  X,
  FileText,
  Search,
  BookOpen,
} from 'lucide-react';
import { Input } from '../ui/Input/Input';
import { Button } from '../ui/Button/Button';
import { Badge } from '../ui/Badge/Badge';
import { parseVideoUrl } from '../../utils/videoUtils';
import type { CourseLesson, Resource } from '../../types';
import styles from './DynamicCourseLessonsEditor.module.css';

export interface DynamicCourseLessonsEditorProps {
  lessons: CourseLesson[];
  onLessonsChange: (lessons: CourseLesson[]) => void;
  availableResources: Resource[];
  generalResourceIds?: number[];
  onGeneralResourceIdsChange?: (ids: number[]) => void;
  isLoading?: boolean;
}

export const DynamicCourseLessonsEditor: React.FC<DynamicCourseLessonsEditorProps> = ({
  lessons,
  onLessonsChange,
  availableResources,
  generalResourceIds = [],
  onGeneralResourceIdsChange,
  isLoading = false,
}) => {
  // Track which lesson currently has the resource picker drawer expanded
  const [openResourcePickerLessonIndex, setOpenResourcePickerLessonIndex] = useState<number | null>(null);
  const [resourceSearch, setResourceSearch] = useState('');
  const [showGeneralMaterials, setShowGeneralMaterials] = useState(false);

  // Helper to add a new video lesson
  const handleAddLesson = () => {
    const newLesson: CourseLesson = {
      id: `lesson-${Date.now()}-${lessons.length + 1}`,
      title: `Lesson ${lessons.length + 1}: `,
      videoUrl: '',
      resourceIds: [],
    };
    const updated = [...lessons, newLesson];
    onLessonsChange(updated);
    // Auto-open resource picker for the newly added lesson
    setOpenResourcePickerLessonIndex(updated.length - 1);
  };

  // Helper to remove a lesson
  const handleRemoveLesson = (index: number) => {
    const updated = lessons.filter((_, i) => i !== index);
    onLessonsChange(updated);
    if (openResourcePickerLessonIndex === index) {
      setOpenResourcePickerLessonIndex(null);
    } else if (openResourcePickerLessonIndex !== null && openResourcePickerLessonIndex > index) {
      setOpenResourcePickerLessonIndex(openResourcePickerLessonIndex - 1);
    }
  };

  // Helper to reorder lessons
  const handleMoveLesson = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const updated = [...lessons];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onLessonsChange(updated);

    if (openResourcePickerLessonIndex === index) {
      setOpenResourcePickerLessonIndex(targetIndex);
    } else if (openResourcePickerLessonIndex === targetIndex) {
      setOpenResourcePickerLessonIndex(index);
    }
  };

  // Update specific fields of a lesson
  const handleUpdateLesson = (index: number, updates: Partial<CourseLesson>) => {
    const updated = lessons.map((l, i) => (i === index ? { ...l, ...updates } : l));
    onLessonsChange(updated);
  };

  // Toggle a resource for a specific lesson
  const handleToggleLessonResource = (lessonIndex: number, resId: number) => {
    const lesson = lessons[lessonIndex];
    if (!lesson) return;

    const currentIds = lesson.resourceIds || [];
    const exists = currentIds.includes(resId);
    const updatedIds = exists
      ? currentIds.filter((id) => id !== resId)
      : [...currentIds, resId];

    handleUpdateLesson(lessonIndex, { resourceIds: updatedIds });
  };

  // Toggle a general resource
  const handleToggleGeneralResource = (resId: number) => {
    if (!onGeneralResourceIdsChange) return;
    const exists = generalResourceIds.includes(resId);
    const updated = exists
      ? generalResourceIds.filter((id) => id !== resId)
      : [...generalResourceIds, resId];
    onGeneralResourceIdsChange(updated);
  };

  // Filtered resources for the search bar
  const filteredResources = availableResources.filter((r) => {
    const title = (r.filename || r.title || '').toLowerCase();
    const query = resourceSearch.toLowerCase();
    return !query || title.includes(query);
  });

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div>
          <h3 className={styles.headerTitle}>
            <Video size={18} color="var(--color-primary-600, #2563EB)" />
            Course Curriculum & Video Lectures
          </h3>
          <p className={styles.subtitle}>
            Organize your course with dynamic video lectures. Enter each video link (e.g. YouTube) and attach its dedicated study materials below it.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleAddLesson}
          leftIcon={<Plus size={15} />}
        >
          Add Video Lesson
        </Button>
      </div>

      {/* Empty State when no lessons added */}
      {lessons.length === 0 ? (
        <div className={styles.emptyState}>
          <Video size={36} color="var(--color-gray-400)" />
          <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-gray-800)' }}>
            No Video Lessons Added Yet
          </h4>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', maxWidth: 440 }}>
            Start building your course chapters. Each lesson can have its own YouTube video lecture and corresponding notes, worksheets, or test papers.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddLesson}
            leftIcon={<Plus size={15} />}
            style={{ marginTop: 'var(--space-2)' }}
          >
            Add First Video Lesson
          </Button>
        </div>
      ) : (
        <div className={styles.lessonList}>
          {lessons.map((lesson, idx) => {
            const videoInfo = parseVideoUrl(lesson.videoUrl);
            const isYouTube = videoInfo.type === 'youtube' && videoInfo.videoId;
            const isPickerOpen = openResourcePickerLessonIndex === idx;
            const selectedResourcesForLesson = availableResources.filter((r) =>
              (lesson.resourceIds || []).includes(Number(r.resourceId || r.id))
            );

            return (
              <div key={lesson.id || idx} className={styles.lessonCard}>
                {/* Lesson Card Header */}
                <div className={styles.lessonCardHeader}>
                  <div className={styles.lessonBadge}>
                    <Video size={13} />
                    <span>Lecture #{idx + 1}</span>
                  </div>

                  <div className={styles.cardControls}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => handleMoveLesson(idx, 'up')}
                      disabled={idx === 0}
                      title="Move Up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => handleMoveLesson(idx, 'down')}
                      disabled={idx === lessons.length - 1}
                      title="Move Down"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => handleRemoveLesson(idx)}
                      title="Remove Lesson"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Lesson Inputs */}
                <div className={styles.fieldGrid}>
                  {/* YouTube Video Link Input */}
                  <div>
                    <Input
                      label={`Lecture #${idx + 1} Video URL (YouTube, Vimeo, Drive) *`}
                      placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      value={lesson.videoUrl}
                      onChange={(e) => handleUpdateLesson(idx, { videoUrl: e.target.value })}
                      required
                    />

                    {/* Live Video Detection & Preview Box */}
                    {isYouTube && (
                      <div className={styles.videoPreviewBox} style={{ marginTop: 'var(--space-2)' }}>
                        <img
                          src={`https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`}
                          alt="Video Thumbnail"
                          className={styles.videoThumbnail}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#16A34A' }}>
                            <CheckCircle2 size={14} />
                            <span>Valid YouTube Video Detected</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-gray-500)', marginTop: 2 }}>
                            Video ID: <code>{videoInfo.videoId}</code>
                          </div>
                        </div>
                        <a
                          href={lesson.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: 'var(--color-primary-600)',
                            fontSize: 12,
                            textDecoration: 'none',
                          }}
                        >
                          <span>Preview</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Lesson Title Input */}
                  <Input
                    label="Lesson / Lecture Title *"
                    placeholder={`e.g. Lesson ${idx + 1}: Introduction & Key Theorems`}
                    value={lesson.title}
                    onChange={(e) => handleUpdateLesson(idx, { title: e.target.value })}
                    required
                  />
                </div>

                {/* Under-Video Study Materials & Resources */}
                <div className={styles.materialsSection}>
                  <div className={styles.materialsSectionHeader}>
                    <div className={styles.materialsSectionTitle}>
                      <Paperclip size={14} color="var(--color-primary-600)" />
                      <span>Study Materials for this Video Lesson</span>
                      <Badge variant={(lesson.resourceIds || []).length > 0 ? 'primary' : 'default'}>
                        {(lesson.resourceIds || []).length} Attached
                      </Badge>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setOpenResourcePickerLessonIndex(isPickerOpen ? null : idx)
                      }
                    >
                      {isPickerOpen ? 'Done Selecting' : '+ Attach Materials to this Video'}
                    </Button>
                  </div>

                  {/* Tray of currently selected materials for this lesson */}
                  {selectedResourcesForLesson.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {selectedResourcesForLesson.map((r) => {
                        const rId = Number(r.resourceId || r.id);
                        return (
                          <span
                            key={rId}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              backgroundColor: 'var(--color-white)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-full)',
                              padding: '3px 10px',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 500,
                              color: 'var(--color-gray-800)',
                            }}
                          >
                            <FileText size={12} color="var(--color-primary-600)" />
                            <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.filename || r.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleLessonResource(idx, rId)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'inline-flex',
                                color: 'var(--color-gray-400)',
                              }}
                              title="Remove"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Expandable Resource Selector for this lesson */}
                  {isPickerOpen && (
                    <div
                      style={{
                        marginTop: 'var(--space-3)',
                        paddingTop: 'var(--space-3)',
                        borderTop: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-3)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <Search
                            size={14}
                            color="var(--color-gray-400)"
                            style={{ position: 'absolute', left: 10, top: 10 }}
                          />
                          <input
                            type="text"
                            placeholder="Search your library for notes, test papers, or PDFs..."
                            value={resourceSearch}
                            onChange={(e) => setResourceSearch(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '7px 10px 7px 32px',
                              fontSize: 'var(--font-size-xs)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-md)',
                            }}
                          />
                        </div>
                      </div>

                      {isLoading ? (
                        <div style={{ fontSize: 12, color: 'var(--color-gray-500)', textAlign: 'center', padding: 12 }}>
                          Loading materials...
                        </div>
                      ) : availableResources.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--color-gray-500)', textAlign: 'center', padding: '14px 10px' }}>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--color-gray-700)' }}>
                            No uploaded materials found in your library
                          </p>
                          <span style={{ fontSize: 11, color: 'var(--color-gray-500)' }}>
                            Only teaching materials you upload can be attached. Upload study resources from your Resources dashboard to attach them here.
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            maxHeight: 180,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            paddingRight: 4,
                          }}
                        >
                          {filteredResources.map((r) => {
                            const rId = Number(r.resourceId || r.id);
                            const isSelected = (lesson.resourceIds || []).includes(rId);

                            return (
                              <label
                                key={rId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '6px 10px',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: isSelected ? 'var(--color-primary-light, #EFF6FF)' : 'var(--color-white)',
                                  border: isSelected ? '1px solid var(--color-primary-300, #93C5FD)' : '1px solid var(--color-border)',
                                  cursor: 'pointer',
                                  fontSize: 'var(--font-size-xs)',
                                  userSelect: 'none',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleLessonResource(idx, rId)}
                                  />
                                  <span style={{ fontWeight: isSelected ? 600 : 500, color: 'var(--color-gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {r.filename || r.title}
                                  </span>
                                </div>
                                <Badge variant="outline" style={{ fontSize: 10, padding: '1px 6px' }}>
                                  {r.fileType || 'Material'}
                                </Badge>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Another Video Lesson Button */}
          <div className={styles.addLessonBtnRow}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleAddLesson}
              leftIcon={<Plus size={16} />}
            >
              Add Another Video Lesson
            </Button>
          </div>
        </div>
      )}

      {/* Optional: General / Course-Wide Materials Box */}
      {onGeneralResourceIdsChange && availableResources.length > 0 && (
        <div className={styles.generalMaterialsBox}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => setShowGeneralMaterials(!showGeneralMaterials)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={16} color="var(--color-primary-600)" />
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-gray-800)' }}>
                General Course Reference Materials (Optional)
              </span>
              <Badge variant={generalResourceIds.length > 0 ? 'primary' : 'default'}>
                {generalResourceIds.length} Selected
              </Badge>
            </div>

            <Button type="button" variant="ghost" size="sm">
              {showGeneralMaterials ? 'Collapse' : 'Expand'}
            </Button>
          </div>

          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
            Materials that apply to the entire course rather than a single specific video (e.g. Master Syllabus, Textbook, Formula Sheet).
          </p>

          {showGeneralMaterials && (
            <div
              style={{
                maxHeight: 180,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                marginTop: 'var(--space-2)',
              }}
            >
              {availableResources.map((r) => {
                const rId = Number(r.resourceId || r.id);
                const isSelected = generalResourceIds.includes(rId);

                return (
                  <label
                    key={rId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--color-primary-light, #EFF6FF)' : 'var(--color-white)',
                      border: isSelected ? '1px solid var(--color-primary-300, #93C5FD)' : '1px solid var(--color-border)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleGeneralResource(rId)}
                      />
                      <span style={{ fontWeight: isSelected ? 600 : 500 }}>
                        {r.filename || r.title}
                      </span>
                    </div>
                    <Badge variant="outline" style={{ fontSize: 10, padding: '1px 6px' }}>
                      {r.fileType || 'Material'}
                    </Badge>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
