import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCatId = searchParams.get('categoryId');
  const urlSubject = searchParams.get('subject');
  const urlSearch = searchParams.get('search') || searchParams.get('q') || '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(
    urlCatId ? Number(urlCatId) : null
  );
  const [search, setSearch] = useState(urlSearch);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService.getCategories().then((cats) => {
      setCategories(cats);
      if (!urlCatId && urlSubject) {
        const found = cats.find(c => c.name.toLowerCase() === urlSubject.toLowerCase());
        if (found) {
          const foundId = found.categoryId ?? found.id;
          if (foundId) setSelectedCatId(foundId);
        }
      }
    }).catch(() => {});
  }, [urlCatId, urlSubject]);

  useEffect(() => {
    if (urlCatId) {
      setSelectedCatId(Number(urlCatId));
    } else if (!urlSubject) {
      setSelectedCatId(null);
    }
  }, [urlCatId, urlSubject]);

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

  const handleSelectCategory = (cId: number | null, catName?: string) => {
    setSelectedCatId(cId);
    const newParams = new URLSearchParams(searchParams);
    if (cId === null) {
      newParams.delete('categoryId');
      newParams.delete('subject');
    } else {
      newParams.set('categoryId', String(cId));
      if (catName) {
        newParams.set('subject', catName);
      }
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    const newParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      newParams.set('search', val);
    } else {
      newParams.delete('search');
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

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
            onChange={handleSearchChange}
            placeholder="Search courses by title, topic, or keyword (e.g. Organic Chemistry, Calculus, Python)..."
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className={styles.categoryChips}>
          <button
            className={`${styles.chip} ${selectedCatId === null ? styles.chipActive : ''}`}
            onClick={() => handleSelectCategory(null)}
          >
            All Disciplines
          </button>
          {categories.map((cat) => {
            const cId = cat.categoryId ?? cat.id ?? 0;
            const isActive = selectedCatId === cId;
            return (
              <button
                key={cId}
                className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
                onClick={() => handleSelectCategory(isActive ? null : cId, cat.name)}
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
            onClick: () => {
              setSearch('');
              setSelectedCatId(null);
              setSearchParams({});
            },
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
