import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import type { Review } from '../../types';
import { Avatar } from '../ui/Avatar/Avatar';
import { Rating } from '../ui/Rating/Rating';
import styles from './ReviewCard.module.css';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(12);
  const [isHelpful, setIsHelpful] = useState(false);

  const toggleHelpful = () => {
    setIsHelpful(prev => !prev);
    setHelpfulCount(c => isHelpful ? c - 1 : c + 1);
  };

  const formattedDate = new Date(review.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.userRow}>
          <Avatar src={review.student?.avatarUrl || review.student?.profilePic || undefined} name={review.student?.name || 'Student'} size="sm" />
          <div>
            <div className={styles.userName}>{review.student?.name || 'Verified Student'}</div>
            <div className={styles.date}>{formattedDate}</div>
          </div>
        </div>
        <Rating value={review.rating} size="sm" />
      </div>

      <p className={styles.comment}>{review.comment}</p>

      {review.tags && review.tags.length > 0 && (
        <div className={styles.tags}>
          {review.tags.map(tag => (
            <span key={tag} className={styles.tag}>#{tag}</span>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <button
          className={`${styles.helpfulBtn} ${isHelpful ? styles.helpfulBtnActive : ''}`}
          onClick={toggleHelpful}
          aria-label="Mark review as helpful"
        >
          <ThumbsUp size={13} />
          <span>Helpful ({helpfulCount})</span>
        </button>
      </div>
    </div>
  );
}
