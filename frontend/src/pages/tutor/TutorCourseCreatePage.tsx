import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ShieldAlert, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { courseService } from '../../services/courseService';
import { categoryService } from '../../services/categoryService';
import { resourceService } from '../../services/resourceService';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { DynamicCourseLessonsEditor } from '../../components/shared/DynamicCourseLessonsEditor';
import { ROUTES } from '../../constants';
import type { Category, Resource, CourseLesson } from '../../types';
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
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [generalResourceIds, setGeneralResourceIds] = useState<number[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
    price?: string;
    categoryId?: string;
    lessons?: string;
  }>({});

  useEffect(() => {
    categoryService.getCategories().then((cats) => {
      setCategories(cats || []);
      if (cats && cats.length > 0) {
        setCategoryId(String(cats[0].categoryId));
      }
    }).catch(() => {});

    resourceService.getMyResources({ limit: 100 }).then((res) => {
      const ownResources = (res.data || []).filter((r: Resource) => {
        const uploaderId = Number(r.uploadedBy || (r.uploader as any)?.id || (r as any).tutorId || 0);
        return !user?.id || !uploaderId || uploaderId === user.id;
      });
      setAvailableResources(ownResources);
    }).catch((err) => {
      console.error('Failed to load tutor resources:', err);
      setAvailableResources([]);
    }).finally(() => {
      setLoadingResources(false);
    });
  }, [user?.id]);

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

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = 'Course title is required';
    } else if (trimmedTitle.length < 5) {
      errors.title = 'Course title must be at least 5 characters long';
    } else if (trimmedTitle.length > 150) {
      errors.title = 'Course title cannot exceed 150 characters';
    }

    if (!categoryId) {
      errors.categoryId = 'Please select an academic category';
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      errors.description = 'Course description and syllabus overview is required';
    } else if (trimmedDesc.length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    } else if (trimmedDesc.length > 3000) {
      errors.description = 'Description cannot exceed 3000 characters';
    }

    if (price === '' || price === null || price === undefined) {
      errors.price = 'Price is required (enter 0 for free access)';
    } else {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum)) {
        errors.price = 'Please enter a valid price number';
      } else if (priceNum < 0) {
        errors.price = 'Price cannot be negative';
      } else if (priceNum > 100000) {
        errors.price = 'Price cannot exceed ₹1,00,000';
      }
    }

    // Validate any added lessons
    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      if (!l.title.trim()) {
        errors.lessons = `Please enter a title for Lecture #${i + 1}`;
        break;
      } else if (l.title.trim().length < 3) {
        errors.lessons = `Lecture #${i + 1} title must be at least 3 characters`;
        break;
      }
      if (!l.videoUrl.trim()) {
        errors.lessons = `Please enter a video link for Lecture #${i + 1}`;
        break;
      } else if (!l.videoUrl.trim().startsWith('http://') && !l.videoUrl.trim().startsWith('https://')) {
        errors.lessons = `Lecture #${i + 1} video link must begin with http:// or https://`;
        break;
      }
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please resolve form validation errors before proceeding.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await courseService.createCourse({
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        price: parseFloat(price) || 0,
        resourceIds: generalResourceIds,
        lessons,
      });

      toast.success('Course and video chapters created successfully!');
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
          Set up a structured learning course with dynamic video lectures and attached study materials.
        </p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label="Course Title *"
            placeholder="e.g. Master Class: JEE Advanced Organic Chemistry"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (formErrors.title) setFormErrors(fe => ({ ...fe, title: undefined }));
            }}
            error={formErrors.title}
            required
          />

          {categories.length > 0 && (
            <Select
              label="Academic Discipline / Category *"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                if (formErrors.categoryId) setFormErrors(fe => ({ ...fe, categoryId: undefined }));
              }}
              options={categories.map((c) => ({
                value: String(c.categoryId),
                label: c.name,
              }))}
              error={formErrors.categoryId}
            />
          )}

          <Textarea
            label="Course Description & Syllabus Overview"
            placeholder="Describe what students will learn, prerequisites, and curriculum milestones..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (formErrors.description) setFormErrors(fe => ({ ...fe, description: undefined }));
            }}
            error={formErrors.description}
            rows={3}
          />

          <Input
            label="Enrollment Fee (₹) — Enter 0 for Free Access"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              if (formErrors.price) setFormErrors(fe => ({ ...fe, price: undefined }));
            }}
            error={formErrors.price}
          />

          {formErrors.lessons && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-md)',
              color: '#B91C1C',
              fontSize: '13px',
              fontWeight: 600,
              marginTop: 'var(--space-2)'
            }}>
              <AlertCircle size={16} />
              <span>{formErrors.lessons}</span>
            </div>
          )}

          <div style={{ marginTop: 'var(--space-2)' }}>
            <DynamicCourseLessonsEditor
              lessons={lessons}
              onLessonsChange={(newLessons) => {
                setLessons(newLessons);
                if (formErrors.lessons) setFormErrors(fe => ({ ...fe, lessons: undefined }));
              }}
              availableResources={availableResources}
              generalResourceIds={generalResourceIds}
              onGeneralResourceIdsChange={setGeneralResourceIds}
              isLoading={loadingResources}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
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
