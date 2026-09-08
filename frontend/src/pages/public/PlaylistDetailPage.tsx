import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, ExternalLink, Play } from 'lucide-react';
import { playlistService } from '../../services/playlistService';
import { ProgressBar } from '../../components/ui/ProgressBar/ProgressBar';
import { Badge } from '../../components/ui/Badge/Badge';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Button } from '../../components/ui/Button/Button';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import { ROUTES } from '../../constants';
import type { Playlist } from '../../types';
import toast from 'react-hot-toast';
import styles from './PlaylistDetailPage.module.css';

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchPlaylist = async () => {
      setLoading(true);
      try {
        if (!id) return;
        const res = await playlistService.getPlaylist(Number(id));
        setPlaylist(res);

        // Pre-populate completed items
        const initialMap: Record<number, boolean> = {};
        const resourcesList = res.resources || [];
        const userProg = typeof res.userProgress === 'number' ? res.userProgress : (res.userProgress as any)?.percentage ?? 0;
        resourcesList.forEach((r, idx) => {
          const rid = (r as any).resourceId || (r as any).id || idx;
          if (idx === 0 && userProg > 0) {
            initialMap[rid] = true;
          } else {
            initialMap[rid] = !!r.completed;
          }
        });
        setCompletedMap(initialMap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylist();
  }, [id]);

  const toggleComplete = (resourceId: number) => {
    setCompletedMap(prev => {
      const nextVal = !prev[resourceId];
      if (nextVal) {
        toast.success('Progress marked as completed! Keep going.');
      }
      return { ...prev, [resourceId]: nextVal };
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'var(--space-8)' }}>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Playlist not found"
          description="The requested learning playlist could not be loaded or may have been unpublished."
        />
      </div>
    );
  }

  const resourcesList = playlist.resources || [];
  const completedCount = resourcesList.filter((r, idx) => completedMap[(r as any).resourceId || (r as any).id || idx]).length;
  const progressPercent = Math.round((completedCount / (resourcesList.length || 1)) * 100);
  const difficulty = (playlist.difficulty as string) || 'beginner';

  return (
    <div className={styles.page}>
      <Link to={ROUTES.PLAYLISTS} className={styles.backLink}>
        <ArrowLeft size={16} /> Back to all playlists
      </Link>

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.headerCard}>
            <div className={styles.titleRow}>
              <div className={styles.badges}>
                <Badge variant="outline">{playlist.subject || 'General'}</Badge>
                <Badge variant={difficulty === 'advanced' ? 'error' : 'success'}>
                  {difficulty.toUpperCase()}
                </Badge>
              </div>
              <h1 className={styles.title}>{playlist.name || (playlist as any).title}</h1>
              <p className={styles.description}>{playlist.description}</p>
            </div>

            <div className={styles.progressBox}>
              <div className={styles.progressMeta}>
                <span>Your Learning Progress</span>
                <strong>{completedCount} of {resourcesList.length} completed ({progressPercent}%)</strong>
              </div>
              <ProgressBar value={progressPercent} size="md" variant="default" />
            </div>
          </div>

          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-4)' }}>
            Course Modules & Resources ({resourcesList.length})
          </h2>

          <div className={styles.resourceList}>
            {resourcesList.map((item: any, idx) => {
              const rid = item.resourceId || item.id || idx;
              const isDone = !!completedMap[rid];
              const rTitle = item.resource?.title || item.title || item.filename || 'Resource';
              const rType = item.resource?.type || item.resource?.fileType || item.type || item.fileType || 'pdf';
              const rAccess = item.resource?.accessType || item.accessType || 'free';
              const rPrice = item.resource?.price ?? item.price ?? 0;

              return (
                <div
                  key={rid}
                  className={`${styles.resourceItem} ${isDone ? styles.resourceItemCompleted : ''}`}
                >
                  <div
                    className={`${styles.stepNum} ${isDone ? styles.stepNumCompleted : ''}`}
                    onClick={() => toggleComplete(rid)}
                    style={{ cursor: 'pointer' }}
                    title="Toggle completed"
                  >
                    {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>

                  <div className={styles.resourceBody}>
                    <div className={styles.resourceTitle}>{rTitle}</div>
                    <div className={styles.resourceMeta}>
                      <Badge variant="outline">{String(rType).toUpperCase()}</Badge>
                      <span>{rAccess === 'free' ? 'Free Resource' : `₹${rPrice}`}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComplete(rid)}
                      leftIcon={isDone ? <CheckCircle2 size={14} color="var(--color-success)" /> : <Circle size={14} />}
                    >
                      {isDone ? 'Completed' : 'Mark Done'}
                    </Button>
                    <Link to={ROUTES.RESOURCE_DETAIL(rid)}>
                      <Button variant="secondary" size="sm" rightIcon={<ExternalLink size={14} />}>
                        Open
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
              Instructor
            </h3>
            {playlist.tutor && (
              <>
                <div className={styles.tutorHeader}>
                  <Avatar src={(playlist.tutor as any).avatarUrl || (playlist.tutor as any).profilePic || undefined} name={playlist.tutor.name} size="md" />
                  <div>
                    <div className={styles.tutorName}>{playlist.tutor.name}</div>
                    <Badge variant="success">Verified Educator</Badge>
                  </div>
                </div>
                <Link to={ROUTES.TUTOR_PROFILE(playlist.tutor.id)}>
                  <Button variant="secondary" size="sm" fullWidth>
                    View Instructor Profile
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className={styles.sidebarCard}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
              Ready to learn?
            </h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
              All modules in this playlist are curated in pedagogical order for maximum concept retention.
            </p>
            {resourcesList[0] && (
              <Link to={ROUTES.RESOURCE_DETAIL((resourcesList[0] as any).resourceId || (resourcesList[0] as any).id || 0)}>
                <Button variant="primary" size="md" fullWidth leftIcon={<Play size={16} />}>
                  Start First Resource
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
