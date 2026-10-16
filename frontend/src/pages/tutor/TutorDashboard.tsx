import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Users, Eye, IndianRupee, Star, TrendingUp, ArrowRight,
  Plus, CheckCircle2, Sparkles, Send, Clock, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { earningsService } from '../../services/earningsService';
import { resourceService } from '../../services/resourceService';
import { reviewService } from '../../services/reviewService';
import { tutorService } from '../../services/tutorService';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Rating } from '../../components/ui/Rating/Rating';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { DocumentViewerModal } from '../../components/shared/DocumentViewerModal';
import { Modal } from '../../components/ui/Modal/Modal';
import { StudentVideoPlayer } from '../../components/shared/StudentVideoPlayer';
import { ROUTES } from '../../constants';
import type { Resource } from '../../types';
import toast from 'react-hot-toast';
import styles from './TutorDashboard.module.css';

export function TutorDashboard() {
  const { user, refreshUser } = useAuth();
  const [earnings, setEarnings] = useState<any>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string } | null>(null);

  const handleQuickPreview = (r: Resource) => {
    const rawFile = (r as any).fileUrl || (r as any).url;
    const title = r.title || (r as any).filename || 'Teaching Resource';
    const type = (r.type || (r as any).fileType || '').toLowerCase();

    if (type === 'youtube' || (r as any).youtubeUrl) {
      const vidUrl = (r as any).youtubeUrl || rawFile;
      if (vidUrl) {
        setPreviewVideo({ url: vidUrl, title });
        return;
      }
    }

    if (rawFile) {
      const viewUrl = rawFile.startsWith('http') ? rawFile : `http://localhost:5000${rawFile.startsWith('/') ? '' : '/'}${rawFile}`;
      setPreviewDocTitle(title);
      setPreviewDocUrl(viewUrl);
    } else {
      toast.error('No attached previewable document found.');
    }
  };

  useEffect(() => {
    refreshUser();
    const tutorId = user?.id;
    Promise.allSettled([
      earningsService.getSummary().then(setEarnings).catch(() => null),
      resourceService.getMyResources({ limit: 5 }).then(res => setResources(res.data || [])).catch(() => []),
      reviewService.getTutorReceivedReviews(tutorId).then(setReviews).catch(() => []),
      tutorService.getMyProfile().then(p => setApplicationStatus(p?.applicationStatus || 'none')).catch(() => setApplicationStatus('none')),
    ]).finally(() => setLoading(false));
  }, [user?.id, refreshUser]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  const METRICS = [
    { icon: <IndianRupee size={20} />, label: 'Total Earnings', value: earnings ? `₹${earnings.totalEarnings?.toLocaleString() ?? 0}` : '₹0', color: 'success', link: ROUTES.TUTOR_EARNINGS },
    { icon: <BookOpen size={20} />, label: 'Resources', value: resources.length.toString(), color: 'primary', link: ROUTES.TUTOR_RESOURCES },
    { icon: <Users size={20} />, label: 'Students Reached', value: '0', color: 'ai', link: ROUTES.TUTOR_ANALYTICS },
    { icon: <Eye size={20} />, label: 'Total Views', value: '0', color: 'warning', link: ROUTES.TUTOR_ANALYTICS },
    { icon: <Star size={20} />, label: 'Avg Rating', value: avgRating, color: 'premium', link: ROUTES.TUTOR_REVIEWS },
    { icon: <TrendingUp size={20} />, label: 'This Month', value: earnings ? `₹${earnings.thisMonthEarnings?.toLocaleString() ?? 0}` : '₹0', color: 'success', link: ROUTES.TUTOR_EARNINGS },
  ];

  const isApproved = user?.isVerified || applicationStatus === 'approved';
  const isPending = applicationStatus === 'pending' || applicationStatus === 'under_review';
  const isRejected = applicationStatus === 'rejected';
  const isUnapplied = !isApproved && !isPending && !isRejected;

  return (
    <div className={styles.page}>
      {/* 1. Unapplied Tutor Banner (Registered but application not yet sent) */}
      {isUnapplied && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1.5px solid #3b82f6',
          borderRadius: 'var(--radius-xl, 16px)',
          padding: '20px 24px',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', flex: 1, minWidth: 280 }}>
            <Sparkles size={28} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ color: '#1e40af', fontSize: 'var(--font-size-base)', fontWeight: 700 }}>
                  Action Required: Complete &amp; Send Your Tutor Application
                </strong>
                <span style={{
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                }}>
                  Application Not Sent
                </span>
              </div>
              <p style={{ color: '#1e3a8a', fontSize: 'var(--font-size-sm)', margin: '6px 0 0', lineHeight: 1.5 }}>
                Welcome to StudyBuddy! Your educator account is registered. You haven&apos;t submitted your tutor verification application yet. Add your qualifications, degree certificate, and demo video in your Profile to request admin verification and start teaching.
              </p>
            </div>
          </div>
          <Link to={ROUTES.TUTOR_PROFILE_EDIT}>
            <Button variant="primary" size="lg" leftIcon={<Send size={16} />}>
              Complete &amp; Send Application
            </Button>
          </Link>
        </div>
      )}

      {/* 2. Pending Admin Review Banner */}
      {isPending && (
        <div className={styles.verificationBannerPending}>
          <Clock size={26} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <strong className={styles.verificationPendingTitle}>
                Tutor Verification In Progress
              </strong>
              <span className={styles.verificationPendingBadge}>
                Pending Admin Review
              </span>
            </div>
            <p className={styles.verificationPendingDesc}>
              Your tutor application and credentials have been submitted and are in the review queue. Platform admins are reviewing your qualification certificate, degree, and demo video lecture. Once approved, you can create courses, playlists, and resource bundles.
            </p>
          </div>
          <Link to={ROUTES.TUTOR_PROFILE_EDIT}>
            <Button variant="secondary" size="sm">View Profile</Button>
          </Link>
        </div>
      )}

      {/* 3. Rejected Banner */}
      {isRejected && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1.5px solid #ef4444',
          borderRadius: 'var(--radius-xl, 16px)',
          padding: '18px 22px',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', flex: 1, minWidth: 280 }}>
            <AlertCircle size={26} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: '#991b1b', fontSize: 'var(--font-size-base)', fontWeight: 700 }}>
                Tutor Application Requires Changes
              </strong>
              <p style={{ color: '#b91c1c', fontSize: 'var(--font-size-sm)', margin: '4px 0 0', lineHeight: 1.5 }}>
                Your previous application was reviewed and requires updates. Please check the admin feedback in your profile to update your details and resubmit.
              </p>
            </div>
          </div>
          <Link to={ROUTES.TUTOR_PROFILE_EDIT}>
            <Button variant="danger" size="md" leftIcon={<Send size={16} />}>
              Review &amp; Resubmit
            </Button>
          </Link>
        </div>
      )}

      {/* 4. Approved Banner */}
      {isApproved && (
        <div className={styles.verificationBannerApproved}>
          <CheckCircle2 size={20} color="#16a34a" />
          <span className={styles.verificationApprovedText}>
            Verified Tutor Account &bull; Full permissions enabled to create courses, playlists, and bundles.
          </span>
        </div>
      )}

      {/* Welcome */}
      <div className={styles.welcome}>
        <div className={styles.welcomeLeft}>
          <h1 className={styles.greeting}>Welcome back, {firstName}! 👋</h1>
          <p className={styles.subtitle}>Here's an overview of your teaching impact.</p>
        </div>
        <div className={styles.welcomeActions}>
          {user?.isVerified ? (
            <Link to={ROUTES.TUTOR_RESOURCE_CREATE}>
              <Button leftIcon={<Plus size={16} />}>Upload Resource</Button>
            </Link>
          ) : (
            <Button
              variant="secondary"
              leftIcon={<Plus size={16} />}
              onClick={() => toast('Your account is awaiting admin approval. Creating courses, resources, and bundles will be enabled once approved.', { icon: '⏳' })}
            >
              Upload Resource (Approval Required)
            </Button>
          )}
          <Link to={ROUTES.TUTOR_ANALYTICS}>
            <Button variant="secondary" leftIcon={<TrendingUp size={16} />}>Analytics</Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className={styles.metricsGrid}>
        {loading
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={styles.metricCard}>
                <Skeleton height="16px" width="60%" /><Skeleton height="32px" width="50%" />
              </div>
            ))
          : METRICS.map(m => (
              <Link key={m.label} to={m.link} className={`${styles.metricCard} ${styles[`metric_${m.color}`]}`}>
                <div className={styles.metricIcon}>{m.icon}</div>
                <div className={styles.metricValue}>{m.value}</div>
                <div className={styles.metricLabel}>{m.label}</div>
              </Link>
            ))
        }
      </div>

      <div className={styles.grid}>
        {/* Recent Resources */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <h2 className={styles.blockTitle}>My Resources</h2>
            <Link to={ROUTES.TUTOR_RESOURCES} className={styles.seeAll}>View all <ArrowRight size={14} /></Link>
          </div>
          <div className={styles.resourceList}>
            {resources.length > 0 ? (
              resources.slice(0, 3).map(r => {
                const resId = r.id || (r as any).resourceId || 1;
                return (
                  <div key={r.id} className={styles.resourceRow}>
                    <div className={styles.resourceInfo}>
                      <button
                        type="button"
                        onClick={() => handleQuickPreview(r)}
                        className={styles.resourceTitle}
                        style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                        title="Open resource viewer window"
                      >
                        {r.title}
                      </button>
                      <div className={styles.resourceMeta}>
                        <Badge variant={r.status === 'published' ? 'success' : r.status === 'processing' ? 'warning' : 'default'}>{r.status}</Badge>
                        <span className={styles.resourceStat}><Eye size={12} /> {r.viewCount ?? 0}</span>
                        <span className={styles.resourceStat}><Star size={12} /> {r.averageRating ?? r.rating ?? 5.0}</span>
                        {r.price && <span className={styles.resourcePrice}>₹{r.price}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Open resource viewer window"
                        onClick={() => handleQuickPreview(r)}
                      >
                        View
                      </Button>
                      <Link to={ROUTES.TUTOR_RESOURCE_EDIT(resId)}>
                        <Button size="sm" variant="ghost" title="Edit resource">Edit</Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--color-gray-500)', padding: '16px 0' }}>No resources published yet.</p>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <h2 className={styles.blockTitle}>Recent Reviews</h2>
            <Link to={ROUTES.TUTOR_REVIEWS} className={styles.seeAll}>View all <ArrowRight size={14} /></Link>
          </div>
          <div className={styles.reviewList}>
            {reviews.length > 0 ? (
              reviews.slice(0, 5).map(r => (
                <div key={r.id || r.reviewId} className={styles.reviewCard}>
                  <Avatar name={r.student?.name} src={r.student?.avatarUrl || r.student?.profilePic || undefined} size="sm" />
                  <div className={styles.reviewContent}>
                    <div className={styles.reviewHeader}>
                      <span className={styles.reviewName}>{r.student?.name || 'Verified Student'}</span>
                      <Rating value={r.rating || 5} showValue={false} size="sm" />
                    </div>
                    {r.courseTitle && (
                      <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', margin: '2px 0 4px' }}>
                        📚 Course: {r.courseTitle}
                      </span>
                    )}
                    <p className={styles.reviewComment}>{r.comment}</p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--color-gray-500)', padding: '16px 0' }}>No reviews received yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* In-page Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(previewDocUrl)}
        url={previewDocUrl}
        title={previewDocTitle}
        onClose={() => setPreviewDocUrl(null)}
      />

      {/* In-page Video Preview Modal */}
      {previewVideo && (
        <Modal
          isOpen={Boolean(previewVideo)}
          onClose={() => setPreviewVideo(null)}
          title={previewVideo.title}
          size="lg"
        >
          <div style={{ padding: 'var(--space-2)' }}>
            <StudentVideoPlayer
              videoUrl={previewVideo.url}
              title={previewVideo.title}
              autoPlay={true}
              isStudentSide={false}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
