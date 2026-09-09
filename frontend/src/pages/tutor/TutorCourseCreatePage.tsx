import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { courseService } from '../../services/courseService';
import { categoryService } from '../../services/categoryService';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { ROUTES } from '../../constants';
import type { Category } from '../../types';
import toast from 'react-hot-toast';
import styles from './TutorCourseCreatePage.module.css';

export function TutorCourseCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [price, setPrice] = useState('0');
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    categoryService.getCategories().then((cats) => {
      setCategories(cats || []);
      if (cats && cats.length > 0) {
        setCategoryId(String(cats[0].categoryId));
      }
    }).catch(() => {});
  }, []);

  if (!user?.isVerified) {
    return (
      <div className={styles.page}>
        <Link to={ROUTES.TUTOR_DASHBOARD} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-10)',
          textAlign: 'center',
          maxWidth: 600,
          margin: 'var(--space-8) auto',
        }}>
          <ShieldAlert size={48} color="#D97706" style={{ margin: '0 auto var(--space-4)' }} />
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
            Admin Approval Required
          </h2>
          <p style={{ color: 'var(--color-gray-600)', marginTop: 'var(--space-2)', lineHeight: 1.6 }}>
            Your tutor approval application is currently under review by our admin team. Once the administrator verifies your qualification certificate, trial video lecture, and degree details, course creation will be automatically enabled for your account.
          </p>
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link to={ROUTES.TUTOR_DASHBOARD}>
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a course title.');
      return;
    }

    setSubmitting(true);
    try {
      await courseService.createCourse({
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        price: parseFloat(price) || 0,
      });

      toast.success('Course created successfully! You can now upload curriculum resources.');
      navigate(ROUTES.TUTOR_COURSES);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link to={ROUTES.TUTOR_COURSES} className={styles.backLink}>
        <ArrowLeft size={16} /> Back to My Courses
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>Create Academic Course</h1>
        <p className={styles.subtitle}>
          Set up a structured learning course for your students.
        </p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Course Title *"
            placeholder="e.g. Master Class: JEE Advanced Organic Chemistry"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {categories.length > 0 && (
            <Select
              label="Academic Discipline / Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={categories.map((c) => ({
                value: String(c.categoryId),
                label: c.name,
              }))}
            />
          )}

          <Textarea
            label="Course Description & Syllabus Overview"
            placeholder="Describe what students will learn, prerequisites, and curriculum milestones..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />

          <Input
            label="Enrollment Fee (₹) — Enter 0 for Free Access"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button variant="ghost" type="button" onClick={() => navigate(ROUTES.TUTOR_COURSES)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting} leftIcon={<BookOpen size={16} />}>
              Create Course
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
