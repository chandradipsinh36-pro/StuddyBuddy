import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  count?: number;
}

export function Skeleton({ width = '100%', height = '16px', borderRadius, className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`${styles.skeleton} ${className}`}
          style={{ width, height, borderRadius }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <Skeleton height="180px" borderRadius="12px 12px 0 0" />
      <div className={styles.body}>
        <Skeleton height="14px" width="60%" />
        <Skeleton height="20px" />
        <Skeleton height="14px" width="80%" />
        <div className={styles.row}>
          <Skeleton height="14px" width="40%" />
          <Skeleton height="14px" width="30%" />
        </div>
      </div>
    </div>
  );
}
