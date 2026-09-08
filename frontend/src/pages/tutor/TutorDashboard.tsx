import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Eye, DollarSign, Star, TrendingUp, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { earningsService } from '../../services/earningsService';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Rating } from '../../components/ui/Rating/Rating';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { MOCK_RESOURCES, MOCK_REVIEWS } from '../../mock/data';
import { ROUTES } from '../../constants';
import styles from './TutorDashboard.module.css';

export function TutorDashboard() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    earningsService.getSummary().then(e => { setEarnings(e); setLoading(false); });
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const METRICS = [
    { icon: <DollarSign size={20} />, label: 'Total Earnings', value: earnings ? `₹${earnings.totalEarnings.toLocaleString()}` : '...', color: 'success', link: ROUTES.TUTOR_EARNINGS },
    { icon: <BookOpen size={20} />, label: 'Resources', value: '8', color: 'primary', link: ROUTES.TUTOR_RESOURCES },
    { icon: <Users size={20} />, label: 'Students Reached', value: '1,240', color: 'ai', link: ROUTES.TUTOR_ANALYTICS },
    { icon: <Eye size={20} />, label: 'Total Views', value: '8,420', color: 'warning', link: ROUTES.TUTOR_ANALYTICS },
    { icon: <Star size={20} />, label: 'Avg Rating', value: '4.9', color: 'premium', link: ROUTES.TUTOR_REVIEWS },
    { icon: <TrendingUp size={20} />, label: 'This Month', value: earnings ? `₹${earnings.thisMonthEarnings.toLocaleString()}` : '...', color: 'success', link: ROUTES.TUTOR_EARNINGS },
  ];

  return (
    <div className={styles.page}>
      {/* Welcome */}
      <div className={styles.welcome}>
        <div className={styles.welcomeLeft}>
          <h1 className={styles.greeting}>Welcome back, {firstName}! 👋</h1>
          <p className={styles.subtitle}>Here's an overview of your teaching impact.</p>
        </div>
        <div className={styles.welcomeActions}>
          <Link to={ROUTES.TUTOR_RESOURCE_CREATE}>
            <Button leftIcon={<Plus size={16} />}>Upload Resource</Button>
          </Link>
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
            {MOCK_RESOURCES.slice(0, 3).map(r => (
              <div key={r.id} className={styles.resourceRow}>
                <div className={styles.resourceInfo}>
                  <span className={styles.resourceTitle}>{r.title}</span>
                  <div className={styles.resourceMeta}>
                    <Badge variant={r.status === 'published' ? 'success' : r.status === 'processing' ? 'warning' : 'default'}>{r.status}</Badge>
                    <span className={styles.resourceStat}><Eye size={12} /> {r.viewCount}</span>
                    <span className={styles.resourceStat}><Star size={12} /> {r.averageRating ?? r.rating ?? 4.8}</span>
                    {r.price && <span className={styles.resourcePrice}>₹{r.price}</span>}
                  </div>
                </div>
                <Link to={ROUTES.TUTOR_RESOURCE_EDIT(r.id || r.resourceId || 1)}>
                  <Button size="sm" variant="ghost">Edit</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <h2 className={styles.blockTitle}>Recent Reviews</h2>
            <Link to={ROUTES.TUTOR_REVIEWS} className={styles.seeAll}>View all <ArrowRight size={14} /></Link>
          </div>
          <div className={styles.reviewList}>
            {MOCK_REVIEWS.map(r => (
              <div key={r.id} className={styles.reviewCard}>
                <Avatar name={r.student?.name} src={r.student?.avatarUrl || r.student?.profilePic || undefined} size="sm" />
                <div className={styles.reviewContent}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewName}>{r.student?.name}</span>
                    <Rating value={r.rating} showValue={false} size="sm" />
                  </div>
                  <p className={styles.reviewComment}>{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
