import { Link } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';
import type { Playlist } from '../../types';
import { Avatar } from '../ui/Avatar/Avatar';
import { Badge } from '../ui/Badge/Badge';
import { ProgressBar } from '../ui/ProgressBar/ProgressBar';
import { Button } from '../ui/Button/Button';
import { ROUTES } from '../../constants';
import styles from './PlaylistCard.module.css';

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const difficulty = (playlist.difficulty as string) || 'beginner';
  const difficultyVariant =
    difficulty === 'beginner' ? 'success' :
    difficulty === 'advanced' ? 'error' : 'warning';
  const title = playlist.name || playlist.title || 'Untitled Playlist';
  const cover = playlist.coverUrl || playlist.thumbnailUrl;
  const progressPct = typeof playlist.userProgress === 'number' ? playlist.userProgress : playlist.userProgress?.percentage ?? 0;

  return (
    <div className={styles.card}>
      <div className={styles.coverWrapper}>
        {cover ? (
          <img src={cover} alt={title} className={styles.coverImg} loading="lazy" />
        ) : (
          <div className={styles.coverPlaceholder}>
            <Layers size={36} />
          </div>
        )}
        <div className={styles.countBadge}>
          <Layers size={12} />
          <span>{playlist.resourceCount ?? playlist.resources?.length ?? 0} resources</span>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <Badge variant="outline">{playlist.subject || 'General'}</Badge>
          <Badge variant={difficultyVariant}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
        </div>

        <Link to={ROUTES.PLAYLIST_DETAIL(playlist.id)} className={styles.title}>
          {title}
        </Link>

        <p className={styles.desc}>{playlist.description}</p>

        {playlist.tutor && (
          <div className={styles.tutor}>
            <Avatar src={playlist.tutor.avatarUrl || playlist.tutor.profilePic || undefined} name={playlist.tutor.name} size="xs" />
            <span>by <strong>{playlist.tutor.name}</strong></span>
          </div>
        )}

        {progressPct > 0 && (
          <div className={styles.progressSection}>
            <div className={styles.progressLabel}>
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <ProgressBar value={progressPct} size="sm" variant="default" />
          </div>
        )}

        <div className={styles.footerBtn}>
          <Link to={ROUTES.PLAYLIST_DETAIL(playlist.id)}>
            <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
              {progressPct > 0 ? 'Continue Learning' : 'Start Playlist'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
