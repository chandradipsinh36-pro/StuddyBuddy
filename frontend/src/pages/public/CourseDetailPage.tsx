import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, ShieldCheck, Star, FileText, Video, Paperclip, ExternalLink,
  BookOpen, Lock, Eye, CheckCircle2, Circle, Play, Trophy, Award, Sparkles, RotateCcw, ChevronRight
} from 'lucide-react';
import { parseVideoUrl, getVideoThumbnail, getCourseThumbnail } from '../../utils/videoUtils';
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
import {
  getCourseProgress,
  toggleLessonProgress,
  resetCourseProgress,
  recordLessonEngagement,
  getAllEngagements,
  type LessonEngagement,
} from '../../utils/courseProgress';
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
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [completedLessonIndices, setCompletedLessonIndices] = useState<number[]>([]);
  const [engagements, setEngagements] = useState<Record<number, LessonEngagement>>({});

  useEffect(() => {
    if (user?.id && courseId) {
      const p = getCourseProgress(user.id, courseId);
      setCompletedLessonIndices(p.completedLessons);
      setEngagements(getAllEngagements(user.id, courseId));
    }
  }, [user?.id, courseId]);

  const totalLessons = course?.lessons?.length || 0;
  const completedCount = completedLessonIndices.length;
  const progressPercent = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : (isEnrolled ? 100 : 0);
  const isCourseCompleted = totalLessons > 0 ? completedCount >= totalLessons : isEnrolled;
  const remainingLessons = Math.max(0, totalLessons - completedCount);
  const nextIncompleteIdx = (course?.lessons || []).findIndex((_, idx) => !completedLessonIndices.includes(idx));
  const myReview = user?.id ? reviews.find((r) => r.studentId === user.id || (r.student as any)?.id === user.id) : null;

  const getRatingDescriptor = (r: number) => {
    switch (r) {
      case 1: return '1 - Poor';
      case 2: return '2 - Fair';
      case 3: return '3 - Good';
      case 4: return '4 - Very Good';
      case 5: return '5 - Excellent, Highly Recommended!';
      default: return `${r} Stars`;
    }
  };

  const scrollToReviews = () => {
    const el = document.getElementById('reviews-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToLesson = (idx: number) => {
    const el = document.getElementById(`lesson-card-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleRecordEngagement = (idx: number, type: 'video' | 'material') => {
    if (!user?.id) return;
    recordLessonEngagement(user.id, courseId, idx, type);
    setEngagements((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        videoWatched: type === 'video' ? true : prev[idx]?.videoWatched,
        materialViewed: type === 'material' ? true : prev[idx]?.materialViewed,
        engagedAt: new Date().toISOString(),
      },
    }));
  };

  const handleToggleLesson = (idx: number, _lessonTitle?: string) => {
    if (!user?.id) {
      toast.error('Please log in as a student to track your course progress.');
      return;
    }
    const res = toggleLessonProgress(user.id, courseId, idx);
    if (res.requiresEngagement) {
      toast.error(
        `⚠️ Learning required: Please watch Lecture #${idx + 1} video or review the attached study notes before you can mark it as completed!`,
        { duration: 5000 }
      );
      scrollToLesson(idx);
      return;
    }
    setCompletedLessonIndices((prev) =>
      res.isCompleted ? [...prev, idx] : prev.filter((i) => i !== idx)
    );
    if (res.isCompleted) {
      toast.success(`Lecture #${idx + 1} completed! 🎉`);
    } else {
      toast('Lecture marked as incomplete.', { icon: 'ℹ️' });
    }
  };

  const handleResetProgress = () => {
    if (!user?.id) return;
    const res = resetCourseProgress(user.id, courseId);
    setCompletedLessonIndices(res.completedLessons);
    setEngagements({});
    toast('Course progress and study history have been reset.', { icon: '🔄' });
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
      if ((c as any)?.isEnrolled || (c as any)?.hasAccess) {
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

    if (!isCourseCompleted) {
      toast.error('You must complete 100% of the course lectures before submitting a review.');
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
              {hasAccess && totalLessons > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-600)' }}>
                    {completedCount}/{totalLessons} completed ({progressPercent}%)
                  </span>
                  {isCourseCompleted ? (
                    <Badge variant="success">✓ Course Completed</Badge>
                  ) : (
                    <Badge variant="primary">In Progress</Badge>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Progress Bar Banner for Enrolled Students */}
            {hasAccess && totalLessons > 0 && (
              <div className={styles.progressDashboardCard}>
                <div className={styles.progressHeader}>
                  <div className={styles.progressTitleArea}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                      🎓 Your Learning Progress
                    </span>
                    {isCourseCompleted ? (
                      <span className={styles.graduateBadge}>
                        <Award size={13} /> 100% Completed
                      </span>
                    ) : (
                      <Badge variant="outline" style={{ fontSize: '11px', color: '#2563EB', borderColor: '#BFDBFE' }}>
                        {progressPercent}% Complete
                      </Badge>
                    )}
                  </div>
                  <div className={styles.progressActions}>
                    {isCourseCompleted ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleResetProgress}
                        style={{ fontSize: '0.78rem', height: 30, padding: '0 10px', display: 'inline-flex', gap: 4, color: '#64748B' }}
                        title="Reset your course progress"
                      >
                        <RotateCcw size={12} />
                        <span>Reset Progress</span>
                      </Button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F1F5F9', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
                        <ShieldCheck size={13} color="#2563EB" /> Verified Learning Enforced
                      </span>
                    )}
                  </div>
                </div>

                <ProgressBar
                  value={progressPercent}
                  variant={isCourseCompleted ? 'success' : 'default'}
                />

                <div className={styles.progressStatsRow}>
                  <span>
                    <strong>{completedCount}</strong> of <strong>{totalLessons}</strong> lectures finished
                  </span>
                  <span>
                    {isCourseCompleted ? (
                      <span style={{ color: '#059669', fontWeight: 600 }}>🎉 Course review is now unlocked!</span>
                    ) : (
                      <span style={{ color: '#d97706', fontWeight: 600 }}>
                        {remainingLessons} more lecture{remainingLessons === 1 ? '' : 's'} to unlock course review
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Course Completion Celebration Banner */}
            {hasAccess && isCourseCompleted && totalLessons > 0 && (
              <div className={styles.completionCelebrationCard}>
                <div className={styles.completionLeft}>
                  <div className={styles.trophyCircle}>
                    <Trophy size={26} color="#059669" />
                  </div>
                  <div>
                    <h3 className={styles.completionTitle}>Congratulations! You've Completed the Course! 🎓</h3>
                    <p className={styles.completionDesc}>
                      You've completed all lectures in <strong>{course.title}</strong>. Your feedback is invaluable to fellow students and the instructor. Leave your verified graduate rating below!
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={scrollToReviews}
                  style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 700, gap: 6, display: 'inline-flex', alignItems: 'center' }}
                >
                  <Star size={14} fill="#ffffff" />
                  <span>Rate Course Now</span>
                </Button>
              </div>
            )}

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
                    <div key={lesson.id || idx} className={styles.lessonCard} id={`lesson-card-${idx}`}>
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
                          <div>
                            <div
                              className={styles.videoWrapper}
                              onClick={() => handleRecordEngagement(idx, 'video')}
                            >
                              {videoInfo.type === 'direct' ? (
                                <video
                                  src={videoInfo.embedUrl}
                                  controls
                                  className={styles.videoFrame}
                                  onPlay={() => handleRecordEngagement(idx, 'video')}
                                />
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

                            {/* Video Study Engagement Status Strip */}
                            {hasAccess && (
                              <div className={`${styles.engagementStrip} ${engagements[idx]?.videoWatched ? styles.engagementWatched : styles.engagementPending}`}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                                  {engagements[idx]?.videoWatched ? (
                                    <>
                                      <CheckCircle2 size={14} color="#10B981" />
                                      <span>Lecture video watched & studied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Video size={14} color="#2563EB" />
                                      <span>Watch video lecture or view notes below to unlock completion</span>
                                    </>
                                  )}
                                </span>
                                {!engagements[idx]?.videoWatched && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleRecordEngagement(idx, 'video');
                                      toast.success(`Lecture #${idx + 1} video active! Watch tutorial to learn.`);
                                    }}
                                    style={{
                                      background: '#EFF6FF',
                                      border: '1px solid #BFDBFE',
                                      color: '#1D4ED8',
                                      padding: '3px 10px',
                                      borderRadius: 6,
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    ▶ Start Studying Video
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      ) : (
                        <div className={styles.lockedVideoOverlay}>
                          {(() => {
                            const lessonThumb = getVideoThumbnail(lesson.videoUrl) || getCourseThumbnail(course);
                            return lessonThumb ? (
                              <img
                                src={lessonThumb}
                                alt="Lecture Video Preview"
                                className={styles.lockedVideoBgImg}
                              />
                            ) : null;
                          })()}
                          <div className={styles.lockedVideoBackdrop} />
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
                                    const rawFile = r.fileUrl || (r as any).url;
                                    if (rawFile) {
                                      const url = rawFile.startsWith('http') ? rawFile : `http://localhost:5000${rawFile.startsWith('/') ? '' : '/'}${rawFile}`;
                                      setPdfViewerUrl(url);
                                      if (user?.id) {
                                        handleRecordEngagement(idx, 'material');
                                        toast.success(`Lecture #${idx + 1} study material opened!`, { id: `pdf-${idx}` });
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

                      {/* Lesson Quick Navigation / Verified Completion Bar */}
                      {hasAccess && (() => {
                        const isEngaged = Boolean(engagements[idx]?.videoWatched || engagements[idx]?.materialViewed);
                        return (
                          <div className={styles.lessonActionBar}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', flexWrap: 'wrap' }}>
                              {isCompleted ? (
                                <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <CheckCircle2 size={15} color="#10B981" /> Lecture Completed
                                </span>
                              ) : isEngaged ? (
                                <span style={{ color: '#2563EB', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Eye size={15} color="#2563EB" /> Studied (Ready to mark complete)
                                </span>
                              ) : (
                                <span style={{ color: '#D97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Lock size={13} color="#D97706" /> Watch video or study notes to complete
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleToggleLesson(idx, lesson.title)}
                                className={`${styles.lessonToggleBtn} ${isCompleted ? styles.lessonBtnCompleted : isEngaged ? styles.lessonBtnEngaged : styles.lessonBtnLocked}`}
                              >
                                {isCompleted ? (
                                  'Mark as Incomplete'
                                ) : isEngaged ? (
                                  <>
                                    <CheckCircle2 size={13} color="#10B981" />
                                    <span>✓ Mark Lesson Complete</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock size={12} />
                                    <span>Complete Locked (Study First)</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {idx < totalLessons - 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => scrollToLesson(idx + 1)}
                                style={{ fontSize: '0.78rem', height: 28, padding: '0 8px', gap: 4, display: 'inline-flex', alignItems: 'center' }}
                              >
                                <span>Next Lecture</span>
                                <ChevronRight size={13} />
                              </Button>
                            )}
                          </div>
                        );
                      })()}
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
                                const rawFile = r.fileUrl || (r as any).url;
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
          <div className={styles.sectionCard} id="reviews-section">
            <h2 className={styles.sectionTitle}>Student Feedback & Ratings ({reviews.length})</h2>

            {/* Logical Gated Rating / Review System */}
            {!isAuthenticated ? (
              <div className={styles.authReviewNotice}>
                <div>
                  <div className={styles.authReviewNoticeTitle}>
                    Want to rate or review this course?
                  </div>
                  <div className={styles.authReviewNoticeSub}>
                    Please log in as a student and complete the course to share your feedback.
                  </div>
                </div>
                <Link to={ROUTES.LOGIN}>
                  <Button variant="secondary" size="sm">Sign In</Button>
                </Link>
              </div>
            ) : user?.role !== 'student' ? (
              <div className={styles.authReviewNotice} style={{ fontSize: '0.85rem' }}>
                <span className={styles.authReviewNoticeSub}>
                  Only enrolled students who complete this course can submit student reviews.
                </span>
              </div>
            ) : !isEnrolled ? (
              <div className={styles.lockedReviewCard}>
                <div className={styles.lockedReviewHeader}>
                  <div className={styles.lockedReviewIconWrap}>
                    <Lock size={22} color="#D97706" />
                  </div>
                  <div>
                    <h3 className={styles.lockedReviewTitle}>Enrollment Required to Rate Course</h3>
                    <p className={styles.lockedReviewSubtitle}>
                      You need to be enrolled in this course and complete all lectures before submitting a review.
                    </p>
                  </div>
                </div>
                <div>
                  <Button variant="primary" size="sm" onClick={handleEnrollOrPay}>
                    {Number(course.price) === 0 ? 'Enroll for Free' : `Enroll Now • ₹${course.price}`}
                  </Button>
                </div>
              </div>
            ) : !isCourseCompleted ? (
              <div className={styles.lockedReviewCard}>
                <div className={styles.lockedReviewHeader}>
                  <div className={styles.lockedReviewIconWrap}>
                    <Lock size={22} color="#D97706" />
                  </div>
                  <div>
                    <h3 className={styles.lockedReviewTitle}>
                      Course Rating Locked — 100% Completion Required
                    </h3>
                    <p className={styles.lockedReviewSubtitle}>
                      To ensure honest and comprehensive feedback, course ratings and reviews can only be submitted once you have completed all video lectures in this course.
                    </p>
                  </div>
                </div>

                <div className={styles.lockedReviewProgressBox}>
                  <div className={styles.lockedReviewProgressStats}>
                    <span>Course Progress: {completedCount} of {totalLessons} lectures finished</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <ProgressBar value={progressPercent} variant="default" />
                  <div style={{ fontSize: '0.8rem', color: '#92400E', marginTop: 4 }}>
                    {remainingLessons} more lecture{remainingLessons === 1 ? '' : 's'} remaining to unlock your rating & review form.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {nextIncompleteIdx !== -1 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => scrollToLesson(nextIncompleteIdx)}
                      style={{ backgroundColor: '#D97706', borderColor: '#D97706', gap: 6, display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Play size={13} fill="#ffffff" />
                      <span>Resume Lecture #{nextIncompleteIdx + 1}</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : myReview ? (
              <div className={styles.myReviewCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={styles.myReviewTitle}>Your Review</span>
                    <span className={styles.graduateBadge}>
                      <CheckCircle2 size={13} /> Verified Graduate Review
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={16}
                        color={s <= myReview.rating ? '#F59E0B' : '#CBD5E1'}
                        fill={s <= myReview.rating ? '#F59E0B' : 'none'}
                      />
                    ))}
                  </div>
                </div>
                {myReview.comment && (
                  <p className={styles.myReviewComment}>
                    "{myReview.comment}"
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.unlockedReviewCard}>
                <div className={styles.unlockedHeader}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: '#065F46' }}>
                      Leave Your Graduate Rating & Review
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#047857' }}>
                      You've completed 100% of this course! Share your experience to help future students.
                    </p>
                  </div>
                  <span className={styles.graduateBadge}>
                    <Sparkles size={13} /> Verified Course Graduate
                  </span>
                </div>

                <form onSubmit={handleAddReview}>
                  <div className={styles.starRatingRow}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                      Overall Rating:
                    </span>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                      onMouseLeave={() => setHoverRating(null)}
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const activeVal = hoverRating ?? rating;
                        return (
                          <button
                            type="button"
                            key={star}
                            className={styles.starBtn}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            aria-label={`${star} star rating`}
                          >
                            <Star
                              size={26}
                              color={star <= activeVal ? '#F59E0B' : '#CBD5E1'}
                              fill={star <= activeVal ? '#F59E0B' : 'none'}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className={styles.ratingDescriptor}>
                      {getRatingDescriptor(hoverRating ?? rating)}
                    </span>
                  </div>

                  <Textarea
                    label="Your Graduate Review & Feedback *"
                    placeholder="What did you think of the explanations, exercises, and instructor teaching style? How did this course help you?"
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      if (reviewError) setReviewError(null);
                    }}
                    error={reviewError || undefined}
                    rows={3}
                  />

                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="primary"
                      size="md"
                      type="submit"
                      isLoading={submittingReview}
                      style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 700 }}
                    >
                      Submit Graduate Review
                    </Button>
                  </div>
                </form>
              </div>
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
          {(() => {
            const courseThumbnail = getCourseThumbnail(course);
            if (!courseThumbnail) return null;
            return (
              <div className={styles.sidebarThumbnailWrap}>
                <img
                  src={courseThumbnail}
                  alt={course.title}
                  className={styles.sidebarThumbnailImg}
                />
                <div className={styles.sidebarThumbnailOverlay}>
                  <div className={styles.sidebarPlayBtn}>
                    <Play size={22} fill="#ffffff" color="#ffffff" style={{ marginLeft: 3 }} />
                  </div>
                  <span className={styles.sidebarPreviewTag}>Course Video Preview</span>
                </div>
              </div>
            );
          })()}

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
