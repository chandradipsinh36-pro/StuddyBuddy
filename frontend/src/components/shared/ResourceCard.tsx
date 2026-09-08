import { Link } from 'react-router-dom';
import { Lock, Bookmark, Eye, ShoppingCart, FileText, Video, Image, Headphones, Presentation } from 'lucide-react';
import type { Resource } from '../../types';
import { Avatar } from '../ui/Avatar/Avatar';
import { Badge } from '../ui/Badge/Badge';
import { Rating } from '../ui/Rating/Rating';
import { ROUTES } from '../../constants';
import styles from './ResourceCard.module.css';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf:        <FileText size={14} />,
  image:      <Image size={14} />,
  ppt:        <Presentation size={14} />,
  audio:      <Headphones size={14} />,
  youtube:    <Video size={14} />,
  test_paper: <FileText size={14} />,
};

const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF', image: 'Image', ppt: 'Slides', audio: 'Audio',
  youtube: 'Video', test_paper: 'Test Paper',
};

interface ResourceCardProps {
  resource: Resource;
  onSave?: (id: number) => void;
  isSaved?: boolean;
}

export function ResourceCard({ resource, onSave, isSaved }: ResourceCardProps) {
  const resId = resource.id || resource.resourceId || 0;
  const resType = (resource.type || resource.fileType || 'pdf') as string;
  const difficulty = (resource.difficulty as string) || 'beginner';
  const title = resource.title || resource.filename || 'Untitled Resource';
  const tutor = resource.tutor;
  const rating = resource.averageRating ?? resource.rating ?? 5;
  const reviewCount = resource.reviewCount ?? 0;
  const viewCount = resource.viewCount ?? 0;
  const purchaseCount = resource.purchaseCount ?? 0;

  return (
    <div className={styles.card}>
      <div className={styles.thumbnail}>
        {resource.thumbnailUrl
          ? <img src={resource.thumbnailUrl} alt={title} className={styles.thumbnailImg} loading="lazy" />
          : <div className={styles.thumbnailPlaceholder}>{TYPE_ICONS[resType] || <FileText size={14} />}</div>
        }
        <div className={styles.typeTag}>
          {TYPE_ICONS[resType] || <FileText size={14} />}
          {TYPE_LABELS[resType] || resType.toUpperCase()}
        </div>
        {resource.accessType === 'premium' && (
          <div className={styles.premiumBadge}>
            <Lock size={10} />
            Premium
          </div>
        )}
        {onSave && (
          <button
            className={`${styles.saveBtn} ${isSaved ? styles.saved : ''}`}
            onClick={(e) => { e.preventDefault(); onSave(resId); }}
            aria-label={isSaved ? 'Unsave resource' : 'Save resource'}
          >
            <Bookmark size={16} />
          </button>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <Badge variant="outline">{resource.subject || 'General'}</Badge>
          <Badge variant={difficulty === 'beginner' ? 'success' : difficulty === 'advanced' ? 'error' : 'warning'}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
        </div>

        <Link to={ROUTES.RESOURCE_DETAIL(resId)} className={styles.title}>
          {title}
        </Link>

        {tutor && (
          <Link to={ROUTES.TUTOR_PROFILE(tutor.id)} className={styles.tutor}>
            <Avatar src={tutor.avatarUrl || (tutor as any).profilePic || undefined} name={tutor.name} size="xs" />
            <span>{tutor.name}</span>
            {(tutor as any).isVerified && <Badge variant="success" className={styles.verifiedBadge}>✓</Badge>}
          </Link>
        )}

        <Rating value={rating} count={reviewCount} size="sm" />

        <div className={styles.footer}>
          <div className={styles.stats}>
            <span className={styles.stat}><Eye size={12} /> {viewCount.toLocaleString()}</span>
            <span className={styles.stat}><ShoppingCart size={12} /> {purchaseCount.toLocaleString()}</span>
          </div>
          {resource.accessType === 'premium' && resource.price
            ? <span className={styles.price}>₹{resource.price}</span>
            : <span className={styles.free}>Free</span>
          }
        </div>
      </div>
    </div>
  );
}
