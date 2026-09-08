import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Crown, ArrowRight, Check } from 'lucide-react';
import type { StudyGroup } from '../../types';
import { Badge } from '../ui/Badge/Badge';
import { Button } from '../ui/Button/Button';
import { ROUTES } from '../../constants';
import toast from 'react-hot-toast';
import styles from './GroupCard.module.css';

interface GroupCardProps {
  group: StudyGroup;
  initialJoined?: boolean;
}

export function GroupCard({ group, initialJoined = false }: GroupCardProps) {
  const [joined, setJoined] = useState(initialJoined);

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (joined) {
      setJoined(false);
      toast.success(`Left ${group.name}`);
    } else {
      setJoined(true);
      toast.success(`Joined ${group.name}! Welcome to the group.`);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.bannerWrapper}>
        {group.imageUrl ? (
          <img src={group.imageUrl} alt={group.name} className={styles.bannerImg} loading="lazy" />
        ) : (
          <div className={styles.bannerPlaceholder}>
            <Users size={36} />
          </div>
        )}
        {group.isPremium && (
          <div className={styles.premiumBadge}>
            <Crown size={12} />
            <span>Premium</span>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div>
          <Badge variant="outline">{group.subject}</Badge>
        </div>

        <Link to={ROUTES.STUDY_GROUP_DETAIL(group.id ?? group.groupId ?? 0)} className={styles.title}>
          {group.name}
        </Link>

        <p className={styles.desc}>{group.description}</p>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <Users size={14} />
            <span>{(group.memberCount ?? 1) + (joined && !initialJoined ? 1 : 0)} members</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.onlineIndicator} />
            <span>{group.onlineCount ?? 1} online</span>
          </div>
        </div>

        <div className={styles.actionRow}>
          <Button
            variant={joined ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleJoin}
            leftIcon={joined ? <Check size={14} /> : undefined}
          >
            {joined ? 'Joined' : 'Join Group'}
          </Button>

          <Link to={ROUTES.STUDY_GROUP_DETAIL(group.id ?? group.groupId ?? 0)} style={{ flex: 1 }}>
            <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
              Open Room
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
