import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ShieldCheck, Star, FileText, Video, Paperclip, ExternalLink, BookOpen, Lock, Eye, CheckCircle2, Circle } from 'lucide-react';
import { parseVideoUrl } from '../../utils/videoUtils';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar/ProgressBar';
import { PaymentCheckoutModal } from '../../components/shared/PaymentCheckoutModal';
import { DocumentViewerModal } from '../../components/shared/DocumentViewerModal';
import { getCourseProgress, toggleLessonProgress, markLessonAsCompleted } from '../../utils/courseProgress';
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
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Add review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [completedLessonIndices, setCompletedLessonIndices] = useState<number[]>([]);

  useEffect(() => {
    if (user?.id && courseId) {
      const p = getCourseProgress(user.id, courseId);
      setCompletedLessonIndices(p.completedLessons);
    }
  }, [user?.id, courseId]);

  const handleToggleLesson = (idx: number, _lessonTitle?: string) => {
    if (!user?.id) {
      toast.error('Please log in as a student to track your course progress.');
      return;
    }
    const res = toggleLessonProgress(user.id, courseId, idx);
    setCompletedLessonIndices((prev) =>
      res.isCompleted ? [...prev, idx] : prev.filter((i) => i !== idx)
    );
    if (res.isCompleted) {
      toast.success(`Lecture #${idx + 1} marked as completed! 🎉`);
    } else {
      toast('Lecture marked as incomplete.', { icon: 'ℹ️' });
    }
  };

  const loadData = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [c, r] = await Promise.all([
        courseService.getCourse(courseId),
        reviewService.getCourseReviews(courseId).catch(() => []),
      ]);
      setCourse(c);
      setReviews(r);

      // Check if student is already enrolled
      if (c?.isEnrolled || c?.hasAccess) {
        setIsEnrolled(true);
      } else if (user?.role === 'student') {
        try {
          const enrollments = await enrollmentService.getMyEnrollments();
          const found = enrollments.some((e) => (Number(e.courseId) === Number(courseId) || Number((e as any).id) === Number(courseId)) && e.status === 'active');
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
  }, [courseId, user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEnrollOrPay = () => {
    if (!isAuthenticated) {
      toast.error('Please log in as a student to enroll in this course.');
      return;
    }
    if (user?.role !== 'student') {
      toast.error('Only students can enroll in courses.');
      return;
    }
    if (!course) return;
    setCheckoutOpen(true);
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to leave a review.');
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please select a star rating between 1 and 5.');
      return;
    }

    const trimmed = comment.trim();
    if (!trimmed) {
      setReviewError('Review comment is required');
      toast.error('Please share your thoughts in the review comment.');
      return;
    }
    if (trimmed.length < 5) {
      setReviewError('Review comment must be at least 5 characters long');
      toast.error('Please enter at least 5 characters for your review comment.');
      return;
    }
    setReviewError(null);

    setSubmittingReview(true);
    try {
      const created = await reviewService.createCourseReview(courseId, {
        rating,
        comment: trimmed,
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

  const isAuthor = Boolean(user && (user.id === course.tutor?.id || user.id === course.tutorId));
  const isAdmin = (user?.role as string) === 'admin';
  const hasAccess = isAuthor || isAdmin || isEnrolled;

  return (
    <div className={styles.page}>
      <Link to="/courses" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to course catalog
      </Link>

      <div className={styles.layout}>
        {/* Main Details */}
        <div className={styles.mainContent}>
          <div className={styles.headerCard}>
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

          {/* Curriculum / Video Lectures & Resources */}
          <div className={styles.sectionCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Course Curriculum & Video Lectures</h2>
              {hasAccess && (course.lessons?.length || 0) > 0 && (() => {
                const total = course.lessons?.length || 0;
                const completed = completedLessonIndices.length;
                const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-600)' }}>
                      {completed}/{total} completed ({percent}%)
                    </span>
                    {percent === 100 && (
                      <Badge variant="success">✓ Completed</Badge>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Interactive Progress Bar Banner for Enrolled Students */}
            {hasAccess && (course.lessons?.length || 0) > 0 && (() => {
              const total = course.lessons?.length || 0;
              const completed = completedLessonIndices.length;
              const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
              return (
                <div style={{
                  marginBottom: 20,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  padding: '14px 18px',
                  border: '1px solid #E2E8F0',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B' }}>
                      🎓 Your Learning Progress
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: percent === 100 ? '#10B981' : '#2563EB' }}>
                      {percent}%
                    </span>
                  </div>
                  <ProgressBar
                    value={percent}
                    variant={percent === 100 ? 'success' : 'default'}
                  />
                </div>
              );
            })()}

            {/* If structured lessons exist */}
            {course.lessons && course.lessons.length > 0 ? (
              <div className={styles.lessonsList}>
                {course.lessons.map((lesson, idx) => {
                  const videoInfo = parseVideoUrl(lesson.videoUrl);
                  const isLessonUnlocked = hasAccess || Boolean(lesson.isFreePreview);
                  const isCompleted = completedLessonIndices.includes(idx);
                  const lessonResources = (course.resources || []).filter((r) =>
                    (lesson.resourceIds || []).includes(Number(r.resourceId || r.id))
                  );

                  return (
                    <div key={lesson.id || idx} className={styles.lessonCard}>
                      {/* Lesson Header */}
                      <div className={styles.lessonHeader}>
                        <h3 className={styles.lessonTitle}>
                          <span style={{
                            backgroundColor: isCompleted ? '#ECFDF5' : 'var(--color-primary-light, #EFF6FF)',
                            color: isCompleted ? '#065F46' : 'var(--color-primary-dark, #1D4ED8)',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}>
                            {isCompleted ? <CheckCircle2 size={13} color="#10B981" /> : <Video size={13} />} Lecture #{idx + 1}
                          </span>
                          <span>{lesson.title || `Lecture ${idx + 1}`}</span>
                          {lesson.isFreePreview && (
                            <Badge variant="success" style={{ fontSize: '10px' }}>Free Preview</Badge>
                          )}
                        </h3>

                        {isLessonUnlocked ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {hasAccess && (
                              <button
                                type="button"
                                onClick={() => handleToggleLesson(idx, lesson.title)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  backgroundColor: isCompleted ? '#ECFDF5' : '#F1F5F9',
                                  border: isCompleted ? '1.5px solid #10B981' : '1px solid #CBD5E1',
                                  color: isCompleted ? '#065F46' : '#475569',
                                  borderRadius: 8,
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                title={isCompleted ? 'Click to mark as incomplete' : 'Click to mark as completed'}
                              >
                                {isCompleted ? (
                                  <>
                                    <CheckCircle2 size={13} color="#10B981" />
                                    <span>Completed</span>
                                  </>
                                ) : (
                                  <>
                                    <Circle size={13} color="#94A3B8" />
                                    <span>Mark Complete</span>
                                  </>
                                )}
                              </button>
                            )}

                            {lesson.videoUrl ? (
                              <a
                                href={lesson.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 'var(--font-size-xs)',
                                  color: 'var(--color-primary-600)',
                                  textDecoration: 'none',
                                  fontWeight: 500,
                                }}
                              >
                                <span>Open Video</span>
                                <ExternalLink size={12} />
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 'var(--font-size-xs)',
                            color: '#DC2626',
                            fontWeight: 700,
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECACA',
                            padding: '2px 8px',
                            borderRadius: 6,
                          }}>
                            <Lock size={12} /> Locked
                          </span>
                        )}
                      </div>

                      {/* Embedded Video Player OR Locked Overlay */}
                      {isLessonUnlocked ? (
                        videoInfo.type !== 'none' && videoInfo.embedUrl && (
                          <div className={styles.videoWrapper}>
                            {videoInfo.type === 'direct' ? (
                              <video src={videoInfo.embedUrl} controls className={styles.videoFrame} />
                            ) : (
                              <iframe
                                src={videoInfo.embedUrl}
                                title={lesson.title}
                                className={styles.videoFrame}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            )}
                          </div>
                        )
                      ) : (
                        <div className={styles.lockedVideoOverlay}>
                          <div className={styles.lockedVideoContent}>
                            <div className={styles.lockedVideoBadge}>
                              <Lock size={24} />
                            </div>
                            <h4 className={styles.lockedVideoTitle}>
                              Lecture #{idx + 1} Locked — Enrollment Required
                            </h4>
                            <p className={styles.lockedVideoDesc}>
                              This video lecture and its accompanying study notes are protected for enrolled students. Enroll in this course to watch complete video tutorials and download study materials.
                            </p>
                            <Button
                              variant="primary"
                              size="md"
                              onClick={handleEnrollOrPay}
                              style={{ backgroundColor: '#2563EB', fontWeight: 700 }}
                            >
                              {Number(course.price) === 0 ? 'Enroll for Free to Watch' : `Enroll Now • ₹${course.price}`}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Under-Video Attached Study Materials */}
                      <div className={styles.lessonMaterials}>
                        <div className={styles.lessonMaterialsHeader}>
                          <Paperclip size={14} color="var(--color-primary-600)" />
                          <span>Study Materials for this Lecture ({lessonResources.length})</span>
                        </div>

                        {lessonResources.length === 0 ? (
                          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontStyle: 'italic' }}>
                            No dedicated study materials attached to this video lecture.
                          </p>
                        ) : (
                          <div className={styles.materialsSubList}>
                            {lessonResources.map((r, rIdx) => {
                              const resId = r.resourceId || r.id;
                              return hasAccess ? (
                                <button
                                  key={resId || rIdx}
                                  type="button"
                                  className={styles.resourceItem}
                                  style={{ background: 'none', border: '1px solid var(--color-border)', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                                  onClick={() => {
                                    const rawFile = r.fileUrl || r.url;
                                    if (rawFile) {
                                      const url = rawFile.startsWith('http') ? rawFile : `http://localhost:5000${rawFile.startsWith('/') ? '' : '/'}${rawFile}`;
                                      setPdfViewerUrl(url);
                                      if (user?.id && !completedLessonIndices.includes(idx)) {
                                        handleToggleLesson(idx, lesson.title);
                                      }
                                    }
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <FileText size={16} color="var(--color-primary-600)" />
                                    <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
                                      {r.filename || r.title}
                                    </span>
                                  </div>
                                  <Badge variant="outline"><Eye size={10} /> View</Badge>
                                </button>
                              ) : (
                                <div
                                  key={resId || rIdx}
                                  className={styles.resourceItem}
                                  onClick={() => {
                                    toast.error('Please enroll in this course to access this study material.');
                                    handleEnrollOrPay();
                                  }}
                                  style={{ cursor: 'pointer', background: '#FEF2F2', borderColor: '#FECACA' }}
                                  title="Enroll in course to unlock this material"
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <Lock size={16} color="#DC2626" />
                                    <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)', color: '#991B1B' }}>
                                      {r.filename || r.title}
                                    </span>
                                  </div>
                                  <Badge variant="outline" style={{ color: '#DC2626', borderColor: '#FECACA', backgroundColor: '#FFFFFF' }}>
                                    🔒 Locked • Enroll to Access
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* General Course Materials not linked to a specific lesson */}
                {(() => {
                  const allLessonResourceIds = new Set((course.lessons || []).flatMap((l) => l.resourceIds || []));
                  const generalResources = (course.resources || []).filter(
                    (r) => !allLessonResourceIds.has(Number(r.resourceId || r.id))
                  );

                  if (generalResources.length === 0) return null;

                  return (
                    <div className={styles.lessonCard} style={{ background: '#FAF5FF', borderColor: '#E9D5FF' }}>
                      <div className={styles.lessonHeader}>
                        <h3 className={styles.lessonTitle}>
                          <span style={{
                            backgroundColor: '#F3E8FF',
                            color: '#7E22CE',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}>
                            <BookOpen size={13} /> General
                          </span>
                          <span>Course Reference Materials & Syllabus</span>
                        </h3>
                      </div>

                      <div className={styles.materialsSubList}>
                        {generalResources.map((r, rIdx) => {
                          const resId = r.resourceId || r.id;
                          return hasAccess ? (
                            <button
                              key={resId || rIdx}
                              type="button"
                              className={styles.resourceItem}
                              style={{ background: 'none', border: '1px solid var(--color-border)', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                              onClick={() => {
                                const rawFile = r.fileUrl || r.url;
                                if (rawFile) {
                                  const url = rawFile.startsWith('http') ? rawFile : `http://localhost:5000${rawFile.startsWith('/') ? '' : '/'}${rawFile}`;
                                  setPdfViewerUrl(url);
                                }
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <FileText size={16} color="var(--color-primary-600)" />
                                <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
                                  {r.filename || r.title}
                                </span>
                              </div>
                              <Badge variant="outline"><Eye size={10} /> View</Badge>
                            </button>
                          ) : (
                            <div
                              key={resId || rIdx}
                              className={styles.resourceItem}
                              onClick={() => {
                                toast.error('Please enroll in this course to access and download this study material.');
                                handleEnrollOrPay();
                              }}
                              style={{ cursor: 'pointer', background: '#FEF2F2', borderColor: '#FECACA' }}
                              title="Enroll in course to unlock this material"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <Lock size={16} color="#DC2626" />
                                <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)', color: '#991B1B' }}>
                                  {r.filename || r.title}
                                </span>
                              </div>
                              <Badge variant="outline" style={{ color: '#DC2626', borderColor: '#FECACA', backgroundColor: '#FFFFFF' }}>
                                🔒 Locked • Enroll to Access
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : !course.resources || course.resources.length === 0 ? (
              <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                The instructor is currently preparing notes and lecture materials for this curriculum.
              </p>
            ) : (
              <div className={styles.resourceList}>
                {course.resources.map((r, idx) => {
                  const resId = r.resourceId || r.id;
                  return hasAccess ? (
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
                  ) : (
                    <div
                      key={resId || idx}
                      className={styles.resourceItem}
                      onClick={() => {
                        toast.error('Please enroll in this course to access and download this study material.');
                        handleEnrollOrPay();
                      }}
                      style={{ cursor: 'pointer', background: '#FEF2F2', borderColor: '#FECACA' }}
                      title="Enroll in course to unlock this material"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <Lock size={16} color="#DC2626" />
                        <span style={{ fontWeight: 'var(--font-weight-medium)', color: '#991B1B' }}>
                          {r.filename || r.title}
                        </span>
                      </div>
                      <Badge variant="outline" style={{ color: '#DC2626', borderColor: '#FECACA', backgroundColor: '#FFFFFF' }}>
                        🔒 Locked • Enroll to Access
                      </Badge>
                    </div>
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
                  label="Review Comments *"
                  placeholder="Share your experience with this course and the instructor..."
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    if (reviewError) setReviewError(null);
                  }}
                  error={reviewError || undefined}
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
            >
              {Number(course.price) === 0 ? 'Enroll for Free' : `Enroll Now • ₹${course.price}`}
            </Button>
          )}
        </div>
      </div>

      {/* Modern Zero-Error Payment Checkout Modal */}
      {course && (
        <PaymentCheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          item={{
            type: 'course',
            id: course.courseId,
            title: course.title,
            price: Number(course.price || 0),
            tutorName: course.tutor?.name,
            tutorAvatar: course.tutor?.profilePic || undefined,
            description: course.description || undefined,
          }}
          onSuccess={() => {
            setIsEnrolled(true);
            loadData();
          }}
        />
      )}

      {/* View-Only PDF/Course Material Viewer */}
      <DocumentViewerModal
        isOpen={Boolean(pdfViewerUrl)}
        url={pdfViewerUrl}
        title="Course Material — View Only"
        onClose={() => setPdfViewerUrl(null)}
      />
    </div>
  );
}
