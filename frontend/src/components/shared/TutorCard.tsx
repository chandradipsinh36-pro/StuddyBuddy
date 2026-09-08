import { Link } from 'react-router-dom';
import { ShieldCheck, Star, Users, BookOpen, Bookmark } from 'lucide-react';
import type { Tutor } from '../../types';
import { Avatar } from '../ui/Avatar/Avatar';
import { Badge } from '../ui/Badge/Badge';
import { Rating } from '../ui/Rating/Rating';
import { Button } from '../ui/Button/Button';
import { ROUTES } from '../../constants';
import styles from './TutorCard.module.css';

interface TutorCardProps {
  tutor: Tutor;
  onSave?: (id: number) => void;
  isSaved?: boolean;
}

export function TutorCard({ tutor, onSave, isSaved }: TutorCardProps) {
  const subjects = tutor.subjects || [];
  const skills = (tutor.skills || []).map((s: any) => typeof s === 'string' ? s : s.name || s.skillName || '');
  const avgRating = tutor.averageRating ?? 5;
  const reviewCount = tutor.reviewCount ?? tutor._count?.tutorReviewsReceived ?? 0;
  const studentCount = tutor.studentCount ?? tutor._count?.enrollments ?? 0;
  const exp = tutor.experience ?? (tutor as any).experienceYears ?? 5;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Avatar src={tutor.avatarUrl || tutor.profilePic || undefined} name={tutor.name} size="lg" />
        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h3 className={styles.name}>{tutor.name}</h3>
            {tutor.isVerified && (
              <Badge variant="success">
                <ShieldCheck size={10} />
                Verified
              </Badge>
            )}
          </div>
          <div className={styles.subjects}>
            {subjects.slice(0, 2).map(s => (
              <Badge key={s} variant="primary">{s}</Badge>
            ))}
            {subjects.length > 2 && (
              <Badge variant="outline">+{subjects.length - 2}</Badge>
            )}
          </div>
          <Rating value={avgRating} count={reviewCount} size="sm" />
        </div>
        {onSave && (
          <button
            className={`${styles.saveBtn} ${isSaved ? styles.saved : ''}`}
            onClick={() => onSave(tutor.id)}
            aria-label={isSaved ? 'Remove from saved' : 'Save tutor'}
          >
            <Bookmark size={18} />
          </button>
        )}
      </div>

      <p className={styles.bio}>{tutor.bio || 'Experienced educator dedicated to student success.'}</p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <Users size={14} className={styles.statIcon} />
          <span>{studentCount.toLocaleString()} students</span>
        </div>
        <div className={styles.stat}>
          <BookOpen size={14} className={styles.statIcon} />
          <span>{exp}y experience</span>
        </div>
        <div className={styles.stat}>
          <Star size={14} className={styles.statIcon} />
          <span>{reviewCount} reviews</span>
        </div>
      </div>

      <div className={styles.skills}>
        {skills.slice(0, 4).map((skillName, idx) => (
          <span key={idx} className={styles.skill}>{skillName}</span>
        ))}
      </div>

      <Link to={ROUTES.TUTOR_PROFILE(tutor.id)} className={styles.viewLink}>
        <Button variant="secondary" size="sm" fullWidth>View Profile</Button>
      </Link>
    </div>
  );
}
