import { Star } from 'lucide-react';
import styles from './Rating.module.css';

interface RatingProps {
  value: number;
  max?: number;
  showValue?: boolean;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export function Rating({ value, max = 5, showValue = true, count, size = 'sm', interactive = false, onChange }: RatingProps) {
  return (
    <div className={`${styles.rating} ${styles[size]}`} role={interactive ? 'slider' : undefined}>
      <div className={styles.stars}>
        {Array.from({ length: max }, (_, i) => {
          const filled = i < Math.floor(value);
          const partial = !filled && i < value;
          return (
            <button
              key={i}
              type="button"
              className={`${styles.star} ${filled ? styles.filled : partial ? styles.partial : styles.empty}`}
              onClick={() => interactive && onChange?.(i + 1)}
              disabled={!interactive}
              aria-label={`${i + 1} star${i !== 0 ? 's' : ''}`}
            >
              <Star size={size === 'lg' ? 20 : size === 'md' ? 16 : 14} />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={styles.value}>
          {value.toFixed(1)}
          {count !== undefined && <span className={styles.count}>({count.toLocaleString()})</span>}
        </span>
      )}
    </div>
  );
}
