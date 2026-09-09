import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, ExternalLink, AlertCircle } from 'lucide-react';
import { courseService } from '../../services/courseService';
import { categoryService } from '../../services/categoryService';
import { resourceService } from '../../services/resourceService';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { DynamicCourseLessonsEditor } from '../../components/shared/DynamicCourseLessonsEditor';
import { ROUTES } from '../../constants';
import type { Category, Resource, Course, CourseLesson } from '../../types';
import toast from 'react-hot-toast';
import styles from './TutorCourseCreatePage.module.css';

export function TutorCourseEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [price, setPrice] = useState('0');
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [generalResourceIds, setGeneralResourceIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const courseIdNum = Number(id);

    const loadData = async () => {
      try {
        setLoading(true);

        const [courseData, cats, myResourcesRes] = await Promise.all([
          courseService.getMyCourse(courseIdNum),
          categoryService.getCategories().catch(() => [] as Category[]),
          resourceService.getMyResources({ limit: 100 }).catch(() => ({ data: [] as Resource[], pagination: { page: 1, limit: 100, total: 0, totalPages: 1 } })),
        ]);

        if (!courseData) {
          toast.error('Course not found.');
          navigate(ROUTES.TUTOR_COURSES);
          return;
        }

        setCourse(courseData);
        setTitle(courseData.title || '');
        setDescription(courseData.description || '');
        setPrice(String(courseData.price ?? 0));
        setCategories(cats || []);

        if (courseData.categoryId) {
          setCategoryId(String(courseData.categoryId));
        } else if (cats && cats.length > 0) {
          setCategoryId(String(cats[0].categoryId));
        }

        // Load lessons if present
        const existingLessons: CourseLesson[] = (courseData.lessons || []) as CourseLesson[];
        setLessons(existingLessons);

        // Calculate resources belonging to lessons vs general course resources
        const lessonResourceIds = new Set(existingLessons.flatMap((l) => l.resourceIds || []));
        const existingResources: Resource[] = (courseData.resources || []) as Resource[];
        const generalIds = existingResources
          .map((r: any) => Number(r.resourceId || r.id))
          .filter((rId) => !lessonResourceIds.has(rId));
        setGeneralResourceIds(generalIds);

        // Merge my resources and existing attached resources to guarantee all are visible
        const fetchedResources = myResourcesRes.data || [];
        const map = new Map<number, Resource>();
        fetchedResources.forEach((r) => map.set(Number(r.resourceId || r.id), r));
        existingResources.forEach((r) => {
          const rId = Number(r.resourceId || r.id);
          if (!map.has(rId)) {
            map.set(rId, r);
          }
        });

        setAvailableResources(Array.from(map.values()));
      } catch (err: any) {
        console.error('Failed to load course details:', err);
        toast.error(err?.response?.data?.error?.message || 'Failed to load course details.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!title.trim()) {
      toast.error('Please enter a course title.');
      return;
    }

    // Validate any added lessons
    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      if (!l.videoUrl.trim()) {
        toast.error(`Please enter the video URL for Lecture #${i + 1}`);
        return;
      }
      if (!l.title.trim()) {
        toast.error(`Please enter a title for Lecture #${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await courseService.updateCourse(Number(id), {
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        price: parseFloat(price) || 0,
        resourceIds: generalResourceIds,
        lessons,
      });

      toast.success('Course and video chapters updated successfully!');
      navigate(ROUTES.TUTOR_COURSES);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update course.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-gray-500)' }}>
          Loading course details...
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.page}>
        <Link to={ROUTES.TUTOR_COURSES} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to My Courses
        </Link>
        <div style={{
          background: 'var(--color-white)',
          padding: 'var(--space-10)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
          border: '1px solid var(--color-border)',
        }}>
          <AlertCircle size={40} color="var(--color-error)" style={{ margin: '0 auto var(--space-3)' }} />
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Course not found</h2>
          <p style={{ color: 'var(--color-gray-600)', marginTop: 'var(--space-2)' }}>
            The requested course could not be located or you don't have permission to edit it.
          </p>
          <div style={{ marginTop: 'var(--space-6)' }}>
            <Link to={ROUTES.TUTOR_COURSES}>
              <Button>Return to Courses</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <Link to={ROUTES.TUTOR_COURSES} className={styles.backLink} style={{ margin: 0 }}>
          <ArrowLeft size={16} /> Back to My Courses
        </Link>
        <Link to={`/courses/${id}`}>
          <Button variant="ghost" size="sm" rightIcon={<ExternalLink size={14} />}>
            View Public Page
          </Button>
        </Link>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>Edit Academic Course</h1>
        <p className={styles.subtitle}>
          Modify course overview, adjust pricing, and attach or remove study resources.
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

          <div style={{ marginTop: 'var(--space-2)' }}>
            <DynamicCourseLessonsEditor
              lessons={lessons}
              onLessonsChange={setLessons}
              availableResources={availableResources}
              generalResourceIds={generalResourceIds}
              onGeneralResourceIdsChange={setGeneralResourceIds}
              isLoading={false}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button variant="ghost" type="button" onClick={() => navigate(ROUTES.TUTOR_COURSES)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting} leftIcon={<Save size={16} />}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
