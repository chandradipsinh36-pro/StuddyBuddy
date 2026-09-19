import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Play, Video } from 'lucide-react';
import { getCourseThumbnail } from '../../utils/videoUtils';
import { courseService } from '../../services/courseService';
import { categoryService } from '../../services/categoryService';
import { SearchBar } from '../../components/ui/SearchBar/SearchBar';
import { Button } from '../../components/ui/Button/Button';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import type { Course, Category } from '../../types';
import styles from './CoursesListPage.module.css';

export function CoursesListPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const res = await courseService.getCourses({
          search: search || undefined,
          categoryId: selectedCatId || undefined,
        });
        const list = Array.isArray(res) ? res : res?.data || [];
        setCourses(list);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [search, selectedCatId]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Explore Academic Courses</h1>
        <p className={styles.subtitle}>
          Structured comprehensive courses created and curated by top educators and subject matter experts.
        </p>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchWrap}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search courses by title, topic, or keyword (e.g. Organic Chemistry, Calculus, Python)..."
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className={styles.categoryChips}>
          <button
            className={`${styles.chip} ${selectedCatId === null ? styles.chipActive : ''}`}
            onClick={() => setSelectedCatId(null)}
          >
            All Disciplines
          </button>
          {categories.map((cat) => {
            const cId = cat.categoryId ?? cat.id ?? 0;
            return (
              <button
                key={cId}
                className={`${styles.chip} ${selectedCatId === cId ? styles.chipActive : ''}`}
                onClick={() => setSelectedCatId(selectedCatId === cId ? null : cId)}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="We couldn't find any courses matching your filters. Try clearing your search query."
          action={{
            label: 'Clear Filters',
            onClick: () => { setSearch(''); setSelectedCatId(null); },
          }}
        />
      ) : (
        <div className={styles.grid}>
          {courses.map((c) => {
            const courseId = c.courseId || (c as any).id;
            const thumbnail = getCourseThumbnail(c) || c.thumbnailUrl;
            const lessonCount = c.lessons?.length || 0;

            return (
              <div key={courseId} className={styles.courseCard}>
                <Link to={`/courses/${courseId}`} className={styles.banner}>
                  {thumbnail ? (
                    <div className={styles.thumbnailContainer}>
                      <img
                        src={thumbnail}
                        alt={c.title}
                        className={styles.thumbnailImg}
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className={styles.thumbnailOverlay}>
                        <div className={styles.playButtonCircle}>
                          <Play size={18} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                        </div>
                      </div>
                      {lessonCount > 0 && (
                        <div className={styles.lessonPill}>
                          <Video size={12} />
                          <span>{lessonCount} {lessonCount === 1 ? 'Lecture' : 'Lectures'}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.placeholderBanner}>
                      <BookOpen size={44} />
                      {lessonCount > 0 && (
                        <div className={styles.lessonPill}>
                          <Video size={12} />
                          <span>{lessonCount} {lessonCount === 1 ? 'Lecture' : 'Lectures'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </Link>

                <div className={styles.cardBody}>
                  <Link to={`/courses/${courseId}`} className={styles.cardTitle}>
                    {c.title}
                  </Link>

                  <p className={styles.cardDesc}>
                    {c.description || 'Structured academic lessons designed to help you excel.'}
                  </p>

                  <div className={styles.cardMeta}>
                    <div className={styles.tutorInfo}>
                      <Avatar
                        src={c.tutor?.profilePic || (c.tutor as any)?.avatarUrl || undefined}
                        name={c.tutor?.name || 'Educator'}
                        size="xs"
                      />
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-700)', fontWeight: 'var(--font-weight-medium)' }}>
                        {c.tutor?.name || 'StudyBuddy Educator'}
                      </span>
                    </div>

                    <div className={styles.priceTag}>
                      {c.price === 0 ? (
                        <span className={styles.freeTag}>Free</span>
                      ) : (
                        `₹${c.price}`
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <Link to={`/courses/${courseId}`} style={{ textDecoration: 'none' }}>
                      <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
                        View Curriculum & Enroll
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
