import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Flame, Bookmark, Users, TrendingUp, Bot, ArrowRight, Play } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { playlistService } from '../../services/playlistService';
import { resourceService } from '../../services/resourceService';
import { tutorService } from '../../services/tutorService';
import { ResourceCard } from '../../components/shared/ResourceCard';
import { TutorCard } from '../../components/shared/TutorCard';
import { ProgressBar } from '../../components/ui/ProgressBar/ProgressBar';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { SkeletonCard, Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { ROUTES } from '../../constants';
import type { Playlist, Resource, Tutor } from '../../types';
import styles from './StudentDashboard.module.css';

export function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);

  useEffect(() => {
    Promise.allSettled([
      playlistService.getPlaylists().then(setPlaylists),
      resourceService.getResources({ limit: 4 }).then(res => setResources(res.data || [])),
      tutorService.getTutors({ limit: 3 }).then(res => setTutors(res.data || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const metrics = [
    { icon: <BookOpen size={20} />, label: 'Resources Available', value: resources.length.toString(), color: 'primary' },
    { icon: <Flame size={20} />, label: 'Day Streak', value: '1', color: 'warning' },
    { icon: <Bookmark size={20} />, label: 'Saved', value: '0', color: 'success' },
    { icon: <Users size={20} />, label: 'Active Tutors', value: tutors.length.toString(), color: 'ai' },
  ];

  return (
    <div className={styles.page}>
      {/* Welcome */}
      <div className={styles.welcome}>
        <div className={styles.welcomeText}>
          <h1 className={styles.greeting}>{greeting}, {firstName}! 👋</h1>
          <p className={styles.welcomeSubtitle}>Ready to learn something amazing today?</p>
        </div>
        <div className={styles.welcomeActions}>
          <Link to={ROUTES.AI}>
            <Button leftIcon={<Bot size={16} />} variant="secondary">Ask AI</Button>
          </Link>
          <Link to={ROUTES.EXPLORE}>
            <Button rightIcon={<ArrowRight size={16} />}>Explore Resources</Button>
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

      {/* Continue Learning */}
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

      {/* Recommended Resources */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <TrendingUp size={20} className={styles.sectionIcon} /> Recommended for You
          </h2>
          <Link to={ROUTES.RESOURCES} className={styles.seeAll}>Browse all</Link>
        </div>
        <div className={styles.resourceGrid}>
          {loading
            ? Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
            : resources.length > 0
              ? resources.slice(0, 4).map(r => <ResourceCard key={r.id} resource={r} />)
              : <p style={{ color: 'var(--color-gray-500)', gridColumn: '1 / -1' }}>No resources available yet.</p>
          }
        </div>
      </section>

      {/* AI Shortcut */}
      <div className={styles.aiShortcut}>
        <div className={styles.aiShortcutLeft}>
          <div className={styles.aiIcon}><Bot size={24} /></div>
          <div>
            <h3 className={styles.aiTitle}>Need help? Ask the AI</h3>
            <p className={styles.aiDesc}>Get instant answers, step-by-step explanations, and study guidance.</p>
          </div>
        </div>
        <Link to={ROUTES.AI}>
          <Button leftIcon={<Bot size={16} />} variant="primary">Open AI Assistant</Button>
        </Link>
      </div>

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
