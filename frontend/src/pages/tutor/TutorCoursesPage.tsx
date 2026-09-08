import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Trash2, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import { courseService } from '../../services/courseService';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { ROUTES } from '../../constants';
import type { Course } from '../../types';
import toast from 'react-hot-toast';
import styles from './TutorCoursesPage.module.css';

export function TutorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const list = await courseService.getMyCourses();
      setCourses(list || []);
    } catch (err) {
      console.error('Failed to load tutor courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleTogglePublish = async (courseId: number, currentPublished: boolean) => {
    try {
      await courseService.publishCourse(courseId, !currentPublished);
      setCourses((prev) =>
        prev.map((c) => (c.courseId === courseId ? { ...c, isPublished: !currentPublished } : c))
      );
      toast.success(!currentPublished ? 'Course published!' : 'Course unpublished.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update publication status.');
    }
  };

  const handleDelete = async (courseId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete course "${title}"?`)) return;

    try {
      await courseService.deleteCourse(courseId);
      setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
      toast.success('Course deleted successfully.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to delete course.');
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-gray-500)' }}>
          Loading your courses...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Curated Courses</h1>
          <p className={styles.subtitle}>
            Create structured courses, upload curriculum lessons, and manage student enrollments.
          </p>
        </div>
        <Link to={ROUTES.TUTOR_COURSE_CREATE}>
          <Button variant="primary" leftIcon={<Plus size={16} />}>
            Create New Course
          </Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses created yet"
          description="Start building your academic presence by creating your first course on StudyBuddy."
          action={{
            label: 'Create Course',
            onClick: () => { window.location.href = ROUTES.TUTOR_COURSE_CREATE; },
          }}
        />
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Course Details</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.courseId}>
                  <td>
                    <div className={styles.courseCell}>
                      <div className={styles.courseIcon}>
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <Link to={`/courses/${c.courseId}`} className={styles.courseTitle}>
                          {c.title}
                        </Link>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                          Created on {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {c.category?.name ? (
                      <Badge variant="outline">{c.category.name}</Badge>
                    ) : (
                      <span style={{ color: 'var(--color-gray-400)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <strong>{c.price === 0 ? 'Free' : `₹${c.price}`}</strong>
                  </td>
                  <td>
                    <button
                      onClick={() => handleTogglePublish(c.courseId, c.isPublished)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: c.isPublished ? 'var(--color-success)' : 'var(--color-gray-500)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      {c.isPublished ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      {c.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td>
                    <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                      {c._count?.enrollments ?? 0}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                      <Link to={`/courses/${c.courseId}`}>
                        <Button variant="ghost" size="sm" rightIcon={<ExternalLink size={14} />}>
                          View Public
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c.courseId, c.title)}
                        style={{ color: 'var(--color-error)' }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
