import { AlertCircle } from 'lucide-react';
import { Button } from '../Button/Button';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message = 'Please try again.', onRetry }: ErrorStateProps) {
  return (
    <div className={styles.wrapper}>
      <AlertCircle size={48} className={styles.icon} />
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {onRetry && <Button onClick={onRetry} variant="secondary">Try Again</Button>}
    </div>
  );
}
