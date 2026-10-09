import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Eye, IndianRupee, Star, TrendingUp, ArrowRight, Plus, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { earningsService } from '../../services/earningsService';
import { resourceService } from '../../services/resourceService';
import { reviewService } from '../../services/reviewService';
import { applicationService } from '../../services/applicationService';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Rating } from '../../components/ui/Rating/Rating';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
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

  useEffect(() => {
    refreshUser();
    const tutorId = user?.id;
    Promise.allSettled([
      earningsService.getSummary().then(setEarnings).catch(() => null),
      resourceService.getMyResources({ limit: 5 }).then(res => setResources(res.data || [])).catch(() => []),
      reviewService.getTutorReceivedReviews(tutorId).then(setReviews).catch(() => []),
      applicationService.getMyApplication().then(app => setApplicationStatus(app.status)).catch(() => null),
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

  return (
    <div className={styles.page}>
      {/* Verification Status Banner */}
      {!user?.isVerified ? (
        <div className={styles.verificationBannerPending}>
          <ShieldAlert size={26} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <strong className={styles.verificationPendingTitle}>
                Tutor Verification In Progress
              </strong>
              <span className={styles.verificationPendingBadge}>
                {applicationStatus || 'Pending Admin Approval'}
              </span>
            </div>
            <p className={styles.verificationPendingDesc}>
              Your tutor approval application has been sent to the Admin Panel. The admin is verifying your qualification certificate, trial video lecture, degree, and experience. Once approved, you can create courses, playlists, and resource bundles.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.verificationBannerApproved}>
          <CheckCircle2 size={20} color="#16A34A" />
          <span className={styles.verificationApprovedText}>
            Verified Tutor Account • Full permissions enabled to create courses, playlists, and bundles.
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
              resources.slice(0, 3).map(r => (
                <div key={r.id} className={styles.resourceRow}>
                  <div className={styles.resourceInfo}>
                    <span className={styles.resourceTitle}>{r.title}</span>
                    <div className={styles.resourceMeta}>
                      <Badge variant={r.status === 'published' ? 'success' : r.status === 'processing' ? 'warning' : 'default'}>{r.status}</Badge>
                      <span className={styles.resourceStat}><Eye size={12} /> {r.viewCount ?? 0}</span>
                      <span className={styles.resourceStat}><Star size={12} /> {r.averageRating ?? r.rating ?? 5.0}</span>
                      {r.price && <span className={styles.resourcePrice}>₹{r.price}</span>}
                    </div>
                  </div>
                  <Link to={ROUTES.TUTOR_RESOURCE_EDIT(r.id || (r as any).resourceId || 1)}>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </Link>
                </div>
              ))
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
    </div>
  );
}
