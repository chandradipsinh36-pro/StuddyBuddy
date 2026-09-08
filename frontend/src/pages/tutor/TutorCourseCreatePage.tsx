import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
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
