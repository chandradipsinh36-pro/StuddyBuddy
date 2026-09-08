import { useState, useEffect } from 'react';
import { reviewService } from '../../services/reviewService';
import { ReviewCard } from '../../components/shared/ReviewCard';
import { Rating } from '../../components/ui/Rating/Rating';
import { Button } from '../../components/ui/Button/Button';
import type { Review } from '../../types';
import styles from './TutorReviewsPage.module.css';

export function TutorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await reviewService.getTutorReceivedReviews();
        setReviews(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const filtered = ratingFilter ? reviews.filter(r => r.rating === ratingFilter) : reviews;

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading student reviews...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Student Reviews & Testimonials</h1>
        <p className={styles.subtitle}>
          Read student feedback and ratings on your verified teaching materials and sessions.
        </p>
      </div>

      <div className={styles.overviewCard}>
        <div className={styles.ratingLarge}>
          <div className={styles.score}>4.9</div>
          <Rating value={4.9} size="md" />
          <div className={styles.scoreSub} style={{ marginTop: 6 }}>
            Based on 248 verified student ratings
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--font-size-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 45 }}>5 stars</span>
              <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '88%', height: '100%', background: '#22c55e' }} />
              </div>
              <span>88%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 45 }}>4 stars</span>
              <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '10%', height: '100%', background: '#3b82f6' }} />
              </div>
              <span>10%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 45 }}>3 stars</span>
              <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '2%', height: '100%', background: '#f59e0b' }} />
              </div>
              <span>2%</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <Button
          variant={ratingFilter === null ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setRatingFilter(null)}
        >
          All Reviews ({reviews.length})
        </Button>
        <Button
          variant={ratingFilter === 5 ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setRatingFilter(5)}
        >
          5 Stars Only
        </Button>
        <Button
          variant={ratingFilter === 4 ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setRatingFilter(4)}
        >
          4 Stars Only
        </Button>
      </div>

      <div className={styles.reviewsList}>
        {filtered.map(r => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </div>
  );
}
