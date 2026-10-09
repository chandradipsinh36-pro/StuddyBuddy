import { Link } from 'react-router-dom';
import { ShieldCheck, Star, Users, BookOpen, Bookmark, GraduationCap } from 'lucide-react';
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
  const rawSkills = (tutor.skills || []).map((s: any) => typeof s === 'string' ? s : s.name || s.skillName || '');
  
  // Combine subjects and skills uniquely to avoid duplicate pills
  const uniqueSkills = Array.from(new Set([...subjects, ...rawSkills])).filter(Boolean);

  const avgRating = tutor.averageRating ?? 5;
  const reviewCount = tutor.reviewCount ?? tutor._count?.tutorReviewsReceived ?? 0;
  const studentCount = tutor.studentCount ?? tutor._count?.enrollments ?? 0;
  const exp = tutor.experience ?? (tutor as any).experienceYears ?? 5;

  const rawBio = tutor.bio || '';
  const isQualificationBio = rawBio.startsWith('Highest Qualification / Degree:');
  const qualificationText = isQualificationBio
    ? rawBio.replace('Highest Qualification / Degree:', '').trim()
    : null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Avatar src={tutor.avatarUrl || tutor.profilePic || undefined} name={tutor.name} size="lg" />
        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h3 className={styles.name} title={tutor.name}>{tutor.name}</h3>
            {tutor.isVerified && (
              <Badge variant="success" className={styles.verifiedBadge}>
                <ShieldCheck size={11} />
                Verified
              </Badge>
            )}
          </div>
          <div className={styles.ratingRow}>
            <Rating value={avgRating} count={reviewCount} size="sm" />
          </div>
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

      {qualificationText ? (
        <div className={styles.qualificationBox}>
          <span className={styles.qualLabel}>
            <GraduationCap size={13} className={styles.qualIcon} />
            Qualification:
          </span>
          <span className={styles.qualText} title={qualificationText}>
            {qualificationText}
          </span>
        </div>
      ) : (
        <p className={styles.bio}>
          {rawBio || 'Experienced educator dedicated to student success and academic excellence.'}
        </p>
      )}

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

      <div className={styles.skillsSection}>
        {uniqueSkills.slice(0, 3).map((skillName, idx) => (
          <span key={idx} className={styles.skillPill} title={skillName}>
            {skillName}
          </span>
        ))}
        {uniqueSkills.length > 3 && (
          <span className={styles.skillMore}>
            +{uniqueSkills.length - 3}
          </span>
        )}
      </div>

      <div className={styles.footer}>
        <Link to={ROUTES.TUTOR_PROFILE(tutor.id)} className={styles.viewLink}>
          <Button variant="secondary" size="sm" fullWidth>
            View Profile
          </Button>
        </Link>
      </div>
    </div>
  );
}
