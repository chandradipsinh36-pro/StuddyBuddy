import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Flame, Bookmark, Users, Package, ArrowRight, Play, GraduationCap, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { playlistService } from '../../services/playlistService';
import { bundleService } from '../../services/bundleService';
import { tutorService } from '../../services/tutorService';
import { enrollmentService } from '../../services/enrollmentService';
import { BundleCard } from '../../components/shared/BundleCard';
import { TutorCard } from '../../components/shared/TutorCard';
import { ProgressBar } from '../../components/ui/ProgressBar/ProgressBar';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { SkeletonCard, Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { getCourseProgress } from '../../utils/courseProgress';
import { ROUTES } from '../../constants';
import type { Playlist, Bundle, Tutor } from '../../types';
import styles from './StudentDashboard.module.css';

export function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [progressVersion, setProgressVersion] = useState(0);

  useEffect(() => {
    const handleProgressUpdate = () => setProgressVersion(v => v + 1);
    window.addEventListener('course-progress-updated', handleProgressUpdate);
    return () => window.removeEventListener('course-progress-updated', handleProgressUpdate);
  }, []);

  useEffect(() => {
    Promise.allSettled([
      playlistService.getPlaylists().then(setPlaylists),
      bundleService.getPublicBundles().then(setBundles),
      tutorService.getTutors({ limit: 3 }).then(res => setTutors(res.data || [])),
      enrollmentService.getMyEnrollments().then(setEnrollments).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Only active enrollments with a course
  const activeEnrollments = enrollments.filter(e => e.status === 'active' && (e.course || e.courseId));

  const metrics = [
    { icon: <GraduationCap size={20} />, label: 'Enrolled Courses', value: activeEnrollments.length.toString(), color: 'primary' },
    { icon: <Flame size={20} />, label: 'Day Streak', value: '1', color: 'warning' },
    { icon: <Package size={20} />, label: 'Bundles Available', value: bundles.length.toString(), color: 'success' },
    { icon: <Users size={20} />, label: 'Active Tutors', value: tutors.length.toString(), color: 'primary' },
  ];

  return (
    <div className={styles.page}>
      {/* Welcome Header */}
      <div className={styles.welcome}>
        <div className={styles.welcomeText}>
          <h1 className={styles.greeting}>{greeting}, {firstName}! 👋</h1>
          <p className={styles.welcomeSubtitle}>Ready to learn something amazing today?</p>
        </div>
        <div className={styles.welcomeActions}>
          <Link to={ROUTES.COURSES}>
            <Button leftIcon={<BookOpen size={16} />} variant="secondary">Browse Courses</Button>
          </Link>
          <Link to={ROUTES.BUNDLES}>
            <Button rightIcon={<ArrowRight size={16} />}>Explore Bundles</Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className={styles.metricsGrid}>
        {loading
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={styles.metricCard}>
                <Skeleton height="20px" width="60%" />
                <Skeleton height="32px" width="40%" />
              </div>
            ))
          : metrics.map(m => (
              <div key={m.label} className={`${styles.metricCard} ${styles[`metric_${m.color}`]}`}>
                <div className={styles.metricIcon}>{m.icon}</div>
                <div className={styles.metricValue}>{m.value}</div>
                <div className={styles.metricLabel}>{m.label}</div>
              </div>
            ))
        }
      </div>

      {/* My Enrolled Courses — only show enrolled courses with progress */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <GraduationCap size={20} className={styles.sectionIcon} /> My Courses
          </h2>
          <Link to={ROUTES.COURSES} className={styles.seeAll}>Browse more courses</Link>
        </div>

        {loading ? (
          <div className={styles.playlistGrid}>
            {Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : activeEnrollments.length === 0 ? (
          <div className={styles.emptyEnrollment}>
            <GraduationCap size={40} color="var(--color-gray-300)" />
            <p style={{ color: 'var(--color-gray-500)', margin: '8px 0 0', fontSize: '0.9rem' }}>
              You haven't enrolled in any courses yet.
            </p>
            <Link to={ROUTES.COURSES}>
              <Button size="sm" variant="primary" style={{ marginTop: 12 }}>Browse Courses</Button>
            </Link>
          </div>
        ) : (
          <div className={styles.enrolledGrid}>
            {activeEnrollments.map((enrollment: any) => {
              const course = enrollment.course || {};
              const courseId = Number(enrollment.courseId || course.courseId || course.id);
              const totalLessons = course.lessons?.length || (course.resources?.length ?? 0) || enrollment.totalLessons || 0;
              const progressData = getCourseProgress(user?.id, courseId);
              const completedLessons = Math.min(progressData.completedCount, totalLessons || progressData.completedCount);
              const progress = totalLessons > 0
                ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
                : Number(enrollment.progress ?? enrollment.progressPercent ?? 0);

              return (
                <Link
                  key={enrollment.enrollmentId || enrollment.id}
                  to={ROUTES.COURSE_DETAIL(courseId)}
                  className={styles.enrolledCard}
                >
                  <div className={styles.enrolledCardBanner}>
                    <GraduationCap size={28} />
                  </div>
                  <div className={styles.enrolledCardBody}>
                    <div className={styles.enrolledCardTitle}>
                      {course.title || 'Enrolled Course'}
                    </div>
                    {course.tutor?.name && (
                      <p className={styles.enrolledCardTutor}>by {course.tutor.name}</p>
                    )}
                    <div className={styles.enrolledCardProgress}>
                      <ProgressBar
                        value={progress}
                        showValue
                        variant={progress === 100 ? 'success' : 'default'}
                        label={totalLessons > 0 ? `${completedLessons}/${totalLessons} lessons` : `${progress}% complete`}
                      />
                    </div>
                    <div className={styles.enrolledCardMeta}>
                      {progress === 100 ? (
                        <Badge variant="success">✓ Completed</Badge>
                      ) : progress > 0 ? (
                        <Badge variant="warning"><Clock size={11} /> In Progress</Badge>
                      ) : (
                        <Badge variant="outline">Not Started</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Continue Learning Playlists */}
      {playlists.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Play size={20} className={styles.sectionIcon} /> Continue Learning
            </h2>
            <Link to={ROUTES.PLAYLISTS} className={styles.seeAll}>See all</Link>
          </div>
          <div className={styles.playlistGrid}>
            {loading
              ? Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
              : playlists.map(playlist => {
                  const progress = typeof playlist.userProgress === 'number'
                    ? playlist.userProgress
                    : (playlist.userProgress?.percentage ?? 0);
                  return (
                    <Link key={playlist.id} to={ROUTES.PLAYLIST_DETAIL(playlist.id)} className={styles.playlistCard}>
                      <div className={styles.playlistThumbnail}>
                        {playlist.coverUrl && <img src={playlist.coverUrl} alt={playlist.name || playlist.title} className={styles.playlistImg} />}
                        <div className={styles.playlistOverlay}>
                          <Play size={24} />
                        </div>
                      </div>
                      <div className={styles.playlistBody}>
                        <Badge variant={playlist.difficulty === 'beginner' ? 'success' : playlist.difficulty === 'advanced' ? 'error' : 'warning'}>
                          {playlist.difficulty || 'All Levels'}
                        </Badge>
                        <h3 className={styles.playlistName}>{playlist.name || playlist.title}</h3>
                        <p className={styles.playlistTutor}>by {playlist.tutor?.name}</p>
                        <ProgressBar
                          value={progress}
                          label={`${playlist.resourceCount ?? playlist.resources?.length ?? 0} resources`}
                          showValue
                          variant={progress === 100 ? 'success' : 'default'}
                        />
                      </div>
                    </Link>
                  );
                })
            }
          </div>
        </section>
      )}

      {/* Curated Study Bundles */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Package size={20} className={styles.sectionIcon} /> Curated Study Bundles
          </h2>
          <Link to={ROUTES.BUNDLES} className={styles.seeAll}>Browse all bundles</Link>
        </div>
        <div className={styles.bundlesGrid}>
          {loading
            ? Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
            : bundles.length > 0
              ? bundles.slice(0, 3).map(b => <BundleCard key={b.id || b.bundleId} bundle={b} />)
              : <p style={{ color: 'var(--color-gray-500)', gridColumn: '1 / -1' }}>No study bundles available yet.</p>
          }
        </div>
      </section>

      {/* Recommended Tutors */}
      {tutors.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Top Verified Tutors</h2>
            <Link to={ROUTES.TUTORS} className={styles.seeAll}>See all tutors</Link>
          </div>
          <div className={styles.tutorGrid}>
            {loading
              ? Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
              : tutors.slice(0, 3).map(t => <TutorCard key={t.id} tutor={t} />)
            }
          </div>
        </section>
      )}
    </div>
  );
}
