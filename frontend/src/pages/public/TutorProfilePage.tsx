import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Star, Users, BookOpen, Play, ArrowLeft, Package, BookOpenCheck, Send } from 'lucide-react';
import { tutorService } from '../../services/tutorService';
import { resourceService } from '../../services/resourceService';
import { reviewService } from '../../services/reviewService';
import { ResourceCard } from '../../components/shared/ResourceCard';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Badge } from '../../components/ui/Badge/Badge';
import { Rating } from '../../components/ui/Rating/Rating';
import { Button } from '../../components/ui/Button/Button';
import { Tabs } from '../../components/ui/Tabs/Tabs';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState/ErrorState';
import type { Tutor, Resource } from '../../types';
import { parseVideoUrl } from '../../utils/videoUtils';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
import toast from 'react-hot-toast';

import styles from './TutorProfilePage.module.css';

export function TutorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [tutorCourses, setTutorCourses] = useState<any[]>([]);
  const [tutorBundles, setTutorBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);

  // Rating form & modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const isStudent = user?.role?.toLowerCase() === 'student';
  const myReview = reviews.find(
    (r: any) =>
      (r.studentId && user?.id && Number(r.studentId) === Number(user.id)) ||
      (r.student?.id && user?.id && Number(r.student.id) === Number(user.id))
  );

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const [t, r, rv, courses, bundles] = await Promise.all([
          tutorService.getTutor(+id),
          resourceService.getTutorResources(+id),
          reviewService.getTutorReviews(+id),
          tutorService.getTutorCourses(+id),
          tutorService.getTutorBundles(+id),
        ]);
        setTutor(t);
        setResources(r);
        setReviews(rv);
        setTutorCourses(courses);
        setTutorBundles(bundles);
      } catch {
        setError('Could not load tutor profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmitRating = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAuthenticated || !isStudent) {
      toast.error('Please log in as a student to rate this tutor.');
      return;
    }
    setSubmittingRating(true);
    try {
      if (myReview) {
        const reviewId = myReview.reviewId || myReview.id;
        const updated = await reviewService.updateTutorReview(reviewId, {
          rating: ratingValue,
          comment: ratingComment.trim() || undefined,
        });
        setReviews((prev) =>
          prev.map((r) =>
            (r.reviewId && r.reviewId === reviewId) || (r.id && r.id === reviewId)
              ? { ...r, ...updated, rating: ratingValue, comment: ratingComment.trim() }
              : r
          )
        );
        toast.success('Your rating and review have been updated! ⭐');
      } else {
        const created = await reviewService.createTutorReview(Number(id), {
          rating: ratingValue,
          comment: ratingComment.trim() || undefined,
        });
        setReviews((prev) => [created, ...prev]);
        toast.success('Thank you! Your rating has been submitted. ⭐');
      }
      setShowRatingModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to submit review.');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Skeleton height="300px" />
        <div style={{ marginTop: 24 }}><Skeleton count={3} height="20px" /></div>
      </div>
    </div>
  );

  if (error || !tutor) return <ErrorState message={error || 'Tutor not found'} onRetry={() => navigate(-1)} />;

  const subjects = tutor.subjects && tutor.subjects.length > 0 ? tutor.subjects : ['Computer Science', 'Programming', 'General Education'];
  const rawSkills = tutor.skills && tutor.skills.length > 0 ? tutor.skills : subjects;
  const parsedSkills = rawSkills.map((s: any) => typeof s === 'string' ? s : s.name || s.skillName || '').filter(Boolean);
  const skills = parsedSkills.length > 0 ? parsedSkills : subjects;
  const trialVideoUrl = tutor.trialVideoUrl || (typeof tutor.trialVideo === 'string' ? tutor.trialVideo : tutor.trialVideo?.videoUrl);
  const reviewCount = reviews.length > 0 ? reviews.length : (tutor.reviewCount ?? tutor._count?.tutorReviewsReceived ?? 0);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviews.length
      : tutor.averageRating ?? 5;
  const studentCount = tutor.studentCount ?? tutor._count?.enrollments ?? 0;
  const exp = tutor.experience ?? (tutor as any).experienceYears ?? 5;
  const institute = tutor.instituteName || (tutor as any).highestQualification || 'Accredited Educational Institution';

  const tabs = [
    {
      id: 'about', label: 'About',
      content: (
        <div className={styles.aboutSection}>
          <div className={styles.aboutBlock}>
            <h3>About {tutor.name}</h3>
            <p>{tutor.bio || 'Experienced educator dedicated to student success and academic excellence.'}</p>
          </div>
          <div className={styles.aboutBlock}>
            <h3>Subjects</h3>
            <div className={styles.tags}>
              {subjects.map(s => <Badge key={s} variant="primary">{s}</Badge>)}
            </div>
          </div>
          <div className={styles.aboutBlock}>
            <h3>Skills</h3>
            <div className={styles.tags}>
              {skills.map((skillName, idx) => <span key={idx} className={styles.skill}>{skillName}</span>)}
            </div>
          </div>
          <div className={styles.aboutBlock}>
            <h3>Education & Affiliation</h3>
            <p>{institute}</p>
          </div>
          <div className={styles.aboutBlock}>
            <h3>Experience</h3>
            <p>{exp} years of teaching experience</p>
          </div>
        </div>
      ),
    },
    {
      id: 'resources', label: `Resources (${resources.length})`,
      content: (
        <div className={styles.resourceGrid}>
          {resources.length === 0
            ? <p style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem' }}>No study resources uploaded yet.</p>
            : resources.map(r => <ResourceCard key={r.id || r.resourceId} resource={r} />)}
        </div>
      ),
    },
    {
      id: 'courses', label: `Courses (${tutorCourses.length})`,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tutorCourses.length === 0
            ? <p style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem' }}>No courses uploaded by this tutor yet.</p>
            : tutorCourses.map((c: any) => {
                const cId = c.courseId || c.id;
                return (
                  <Link
                    key={cId}
                    to={ROUTES.COURSE_DETAIL ? ROUTES.COURSE_DETAIL(cId) : `/courses/${cId}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'var(--color-white)', border: '1px solid var(--color-border)',
                      borderRadius: 12, padding: '14px 18px', cursor: 'pointer',
                      transition: 'box-shadow 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <BookOpenCheck size={20} color="#2563eb" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-gray-900)', fontSize: '0.95rem', marginBottom: 2 }}>
                          {c.title || 'Untitled Course'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>
                          {c.description?.slice(0, 80)}{c.description?.length > 80 ? '…' : ''}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <Badge variant={Number(c.price) === 0 ? 'success' : 'outline'}>
                          {Number(c.price) === 0 ? 'Free' : `₹${c.price}`}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      ),
    },
    {
      id: 'bundles', label: `Bundles (${tutorBundles.length})`,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tutorBundles.length === 0
            ? <p style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem' }}>No study bundles uploaded by this tutor yet.</p>
            : tutorBundles.map((b: any) => {
                const bId = b.bundleId || b.id;
                const price = Number(b.price || b.finalPrice || 0);
                return (
                  <Link
                    key={bId}
                    to={`/bundles/${bId}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'var(--color-white)', border: '1px solid var(--color-border)',
                      borderRadius: 12, padding: '14px 18px', cursor: 'pointer',
                      transition: 'box-shadow 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Package size={20} color="#16a34a" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-gray-900)', fontSize: '0.95rem', marginBottom: 2 }}>
                          {b.name || b.title || 'Untitled Bundle'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>
                          {(b.resources?.length || b.bundleItems?.length || 0)} materials included
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <Badge variant={price === 0 ? 'success' : 'outline'}>
                          {price === 0 ? 'Free' : `₹${price}`}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      ),
    },
    {
      id: 'reviews', label: `Reviews (${reviews.length})`,
      content: (
        <div className={styles.reviewList}>
          {/* Rating CTA / Review Status for Students */}
          {isStudent && (
            <div
              style={{
                marginBottom: 24,
                backgroundColor: '#FEF3C7',
                border: '1.5px solid #FCD34D',
                borderRadius: 14,
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: '#92400E', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={18} fill="#F59E0B" color="#F59E0B" />
                  <span>{myReview ? 'You Rated This Tutor' : 'Share Your Feedback'}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#B45309', marginTop: 2 }}>
                  {myReview
                    ? `Your current rating: ${myReview.rating} of 5 stars • Click button to update`
                    : `Have you learned with ${tutor.name}? Rate your experience to help fellow students.`}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (myReview) {
                    setRatingValue(myReview.rating || 5);
                    setRatingComment(myReview.comment || '');
                  }
                  setShowRatingModal(true);
                }}
                style={{
                  backgroundColor: '#D97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 18px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)',
                }}
              >
                <Star size={15} fill="#ffffff" />
                <span>{myReview ? 'Edit Your Rating' : '⭐ Rate This Tutor'}</span>
              </button>
            </div>
          )}

          {reviews.length === 0
            ? <p style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem' }}>No reviews yet. Be the first to review!</p>
            : reviews.map((r: any) => {
                const isMyReview =
                  (r.studentId && user?.id && Number(r.studentId) === Number(user.id)) ||
                  (r.student?.id && user?.id && Number(r.student.id) === Number(user.id));

                return (
                  <div
                    key={r.id || r.reviewId}
                    className={styles.reviewCard}
                    style={isMyReview ? { border: '1.5px solid #FCD34D', backgroundColor: '#FFFDF7' } : undefined}
                  >
                    <div className={styles.reviewHeader}>
                      <Avatar name={r.student?.name} src={r.student?.avatarUrl || r.student?.profilePic || undefined} size="sm" />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className={styles.reviewName}>{r.student?.name || 'Student'}</div>
                          {isMyReview && <Badge variant="warning">Your Review</Badge>}
                        </div>
                        <Rating value={r.rating} showValue={false} size="sm" />
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={styles.reviewDate}>{new Date(r.createdAt || Date.now()).toLocaleDateString()}</span>
                        {isMyReview && (
                          <button
                            type="button"
                            onClick={() => {
                              setRatingValue(r.rating || 5);
                              setRatingComment(r.comment || '');
                              setShowRatingModal(true);
                            }}
                            style={{
                              background: 'none',
                              border: '1px solid #D1D5DB',
                              borderRadius: 6,
                              padding: '2px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#4B5563',
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    <p className={styles.reviewComment}>{r.comment || <span style={{ fontStyle: 'italic', color: '#9CA3AF' }}>No comment written.</span>}</p>
                    {r.tags && r.tags.length > 0 && (
                      <div className={styles.tags}>{r.tags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}</div>
                    )}
                  </div>
                );
              })}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>

        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.profileLeft}>
            <Avatar src={tutor.avatarUrl || tutor.profilePic || undefined} name={tutor.name} size="xl" />
            <div className={styles.profileInfo}>
              <div className={styles.profileNameRow}>
                <h1 className={styles.profileName}>{tutor.name}</h1>
                {tutor.isVerified && (
                  <Badge variant="success">
                    <ShieldCheck size={12} /> Verified Tutor
                  </Badge>
                )}
              </div>
              <div className={styles.profileSubjects}>
                {subjects.map(s => <Badge key={s} variant="primary">{s}</Badge>)}
              </div>
              <div className={styles.profileStats}>
                <div className={styles.profileStat}>
                  <Star size={16} className={styles.statIcon} />
                  <span>{avgRating.toFixed(1)}</span>
                  <span className={styles.statLabel}>({reviewCount} reviews)</span>
                </div>
                <div className={styles.profileStat}>
                  <Users size={16} className={styles.statIcon} />
                  <span>{studentCount.toLocaleString()} students</span>
                </div>
                <div className={styles.profileStat}>
                  <BookOpen size={16} className={styles.statIcon} />
                  <span>{exp} years experience</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions — Rate Tutor for students & Watch Trial Video */}
          <div className={styles.profileActions}>
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error('Please log in as a student to rate this tutor.');
                  navigate('/login');
                  return;
                }
                if (!isStudent) {
                  toast.error('Only students can rate tutors.');
                  return;
                }
                if (myReview) {
                  setRatingValue(myReview.rating || 5);
                  setRatingComment(myReview.comment || '');
                }
                setShowRatingModal(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#FEF3C7',
                border: '1.5px solid #FCD34D',
                color: '#92400E',
                borderRadius: 10,
                padding: '9px 18px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FDE68A')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FEF3C7')}
            >
              <Star size={16} fill="#F59E0B" color="#F59E0B" />
              <span>{myReview ? 'Update Your Rating' : 'Rate This Tutor'}</span>
            </button>

            {trialVideoUrl && (
              <Button
                variant="primary"
                leftIcon={<Play size={16} />}
                onClick={() => setVideoOpen(true)}
              >
                Watch Trial Video
              </Button>
            )}
          </div>
        </div>

        {/* Trial Video Modal */}
        {videoOpen && trialVideoUrl && (() => {
          const videoInfo = parseVideoUrl(trialVideoUrl);
          return (
            <div className={styles.videoOverlay} onClick={() => setVideoOpen(false)}>
              <div className={styles.videoModal} onClick={e => e.stopPropagation()}>
                <button className={styles.videoClose} onClick={() => setVideoOpen(false)}>✕</button>
                {videoInfo.type === 'direct' ? (
                  <video
                    src={videoInfo.embedUrl}
                    controls
                    autoPlay
                    className={styles.videoFrame}
                  />
                ) : (
                  <iframe
                    src={videoInfo.embedUrl}
                    title="Trial Video"
                    className={styles.videoFrame}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          );
        })()}

        <Tabs tabs={tabs} defaultTab="about" />

        {/* Dedicated Student Rating & Review Modal */}
        {showRatingModal && (
          <div
            onClick={() => setShowRatingModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: '26px 30px',
                width: '100%',
                maxWidth: 480,
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar src={tutor.avatarUrl || tutor.profilePic || undefined} name={tutor.name} size="md" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                      {myReview ? 'Update Your Rating' : `Rate ${tutor.name}`}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>Verified Tutor Feedback</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    color: '#6B7280',
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5 }}>
                How would you rate your learning experience with <strong>{tutor.name}</strong>? Your feedback helps other students choose the right tutor.
              </p>

              {/* Interactive Star Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 0', backgroundColor: '#F9FAFB', borderRadius: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeScore = ratingHover || ratingValue;
                    const filled = star <= activeScore;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingValue(star)}
                        onMouseEnter={() => setRatingHover(star)}
                        onMouseLeave={() => setRatingHover(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                          transform: filled ? 'scale(1.2)' : 'scale(1)',
                          transition: 'transform 0.15s ease',
                        }}
                      >
                        <Star
                          size={32}
                          color={filled ? '#F59E0B' : '#D1D5DB'}
                          fill={filled ? '#F59E0B' : 'none'}
                        />
                      </button>
                    );
                  })}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#D97706' }}>
                  {(ratingHover || ratingValue) === 5
                    ? '⭐⭐⭐⭐⭐ 5 - Excellent'
                    : (ratingHover || ratingValue) === 4
                    ? '⭐⭐⭐⭐ 4 - Very Good'
                    : (ratingHover || ratingValue) === 3
                    ? '⭐⭐⭐ 3 - Good'
                    : (ratingHover || ratingValue) === 2
                    ? '⭐⭐ 2 - Fair'
                    : '⭐ 1 - Needs Improvement'}
                </span>
              </div>

              {/* Review Textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>
                  Your Review / Comments (optional)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder={`Share thoughts about ${tutor.name}'s teaching style, clarity, responsiveness, etc...`}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #D1D5DB',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  style={{
                    backgroundColor: '#F3F4F6',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#4B5563',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <Button
                  type="button"
                  variant="primary"
                  isLoading={submittingRating}
                  onClick={handleSubmitRating}
                  style={{ backgroundColor: '#2563EB', fontWeight: 700 }}
                >
                  <Send size={14} />
                  <span>{myReview ? 'Update Rating' : 'Submit Rating'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
