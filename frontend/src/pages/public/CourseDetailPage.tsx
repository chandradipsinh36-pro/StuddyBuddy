import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ShieldCheck, Star, FileText } from 'lucide-react';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { paymentService } from '../../services/paymentService';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { ROUTES } from '../../constants';
import type { Course, CourseReview } from '../../types';
import toast from 'react-hot-toast';
import styles from './CourseDetailPage.module.css';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  // Add review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [c, r] = await Promise.all([
          courseService.getCourse(courseId),
          reviewService.getCourseReviews(courseId).catch(() => []),
        ]);
        setCourse(c);
        setReviews(r);

        // Check if student is already enrolled
        if (user?.role === 'student') {
          try {
            const enrollments = await enrollmentService.getMyEnrollments();
            const found = enrollments.some((e) => e.courseId === courseId && e.status === 'active');
            setIsEnrolled(found);
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        console.error('Failed to load course:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, user?.role]);

  const handleEnrollOrPay = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in as a student to enroll in this course.');
      return;
    }
    if (user?.role !== 'student') {
      toast.error('Only students can enroll in courses.');
      return;
    }
    if (!course) return;

    setEnrolling(true);
    try {
      if (course.price === 0) {
        await enrollmentService.enroll(courseId);
        setIsEnrolled(true);
        toast.success('Successfully enrolled in course!');
      } else {
        await paymentService.payCourse(courseId, course.price);
        setIsEnrolled(true);
        toast.success('Payment successful! You are now enrolled.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Enrollment failed. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to leave a review.');
      return;
    }

    setSubmittingReview(true);
    try {
      const created = await reviewService.createCourseReview(courseId, {
        rating,
        comment: comment.trim() || undefined,
      });
      setReviews((prev) => [created, ...prev]);
      setComment('');
      toast.success('Thank you for reviewing this course!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
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
        <EmptyState
          title="Course Not Found"
          description="This course may have been removed or unpublished by the instructor."
          action={{
            label: 'Browse Courses',
            onClick: () => { window.location.href = '/courses'; },
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/courses" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to course catalog
      </Link>

      <div className={styles.layout}>
        {/* Main Details */}
        <div className={styles.mainContent}>
          <div className={styles.headerCard}>
            {course.category?.name && (
              <Badge variant="outline">{course.category.name}</Badge>
            )}

            <h1 className={styles.title}>{course.title}</h1>
            <p className={styles.desc}>
              {course.description || 'Comprehensive curriculum designed for deep understanding.'}
            </p>

            <div className={styles.tutorBar}>
              <Avatar
                src={course.tutor?.profilePic || (course.tutor as any)?.avatarUrl || undefined}
                name={course.tutor?.name || 'Educator'}
                size="md"
              />
              <div>
                <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-gray-900)' }}>
                  {course.tutor?.name || 'Instructor'}
                </div>
                {course.tutor?.id && (
                  <Link
                    to={ROUTES.TUTOR_PROFILE(course.tutor.id)}
                    style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)', textDecoration: 'none' }}
                  >
                    View Instructor Profile →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Curriculum / Resources */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Course Curriculum & Study Materials</h2>
            {!course.resources || course.resources.length === 0 ? (
              <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                The instructor is currently preparing notes and lecture materials for this curriculum.
              </p>
            ) : (
              <div className={styles.resourceList}>
                {course.resources.map((r, idx) => {
                  const resId = r.resourceId || r.id;
                  return (
                    <Link
                      key={resId || idx}
                      to={ROUTES.RESOURCE_DETAIL(resId!)}
                      className={styles.resourceItem}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <FileText size={18} color="var(--color-primary-600)" />
                        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          {r.filename || r.title}
                        </span>
                      </div>
                      <Badge variant="outline">{r.fileType || 'Doc'}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Student Feedback & Ratings ({reviews.length})</h2>

            {/* Leave Review Form */}
            {user?.role === 'student' && (
              <form onSubmit={handleAddReview} style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <Star
                        size={20}
                        color={star <= rating ? '#f59e0b' : 'var(--color-gray-300)'}
                        fill={star <= rating ? '#f59e0b' : 'none'}
                      />
                    </button>
                  ))}
                </div>

                <Textarea
                  label="Review Comments"
                  placeholder="Share your experience with this course and the instructor..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />

                <div style={{ marginTop: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="primary" size="sm" type="submit" isLoading={submittingReview}>
                    Post Review
                  </Button>
                </div>
              </form>
            )}

            {reviews.length === 0 ? (
              <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                No reviews yet. Be the first student to review this course!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {reviews.map((rev) => (
                  <div key={rev.reviewId} style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <Avatar name={rev.student?.name || 'Student'} size="xs" />
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                        {rev.student?.name || 'Student'}
                      </span>
                      <div style={{ display: 'flex', marginLeft: 'auto' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            color={i < rev.rating ? '#f59e0b' : 'var(--color-gray-300)'}
                            fill={i < rev.rating ? '#f59e0b' : 'none'}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.comment && (
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-700)', margin: 'var(--space-1) 0 0' }}>
                        {rev.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Enrollment Box */}
        <div className={styles.sidebarCard}>
          <div className={styles.priceDisplay}>
            {course.price === 0 ? (
              <span className={styles.freeLabel}>Free Enrollment</span>
            ) : (
              <>
                <span className={styles.amount}>₹{course.price}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>full course access</span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CheckCircle size={14} color="var(--color-success)" />
              <span>Lifetime access to all lectures & notes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CheckCircle size={14} color="var(--color-success)" />
              <span>Direct discussion in peer study groups</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ShieldCheck size={14} color="var(--color-primary-600)" />
              <span>100% verified educator credential guarantee</span>
            </div>
          </div>

          {isEnrolled ? (
            <Button variant="secondary" size="lg" fullWidth disabled>
              ✓ Enrolled in this Course
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleEnrollOrPay}
              isLoading={enrolling}
            >
              {course.price === 0 ? 'Enroll for Free' : `Enroll Now • ₹${course.price}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
