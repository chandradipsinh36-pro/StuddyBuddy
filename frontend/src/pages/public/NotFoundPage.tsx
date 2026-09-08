import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { ROUTES } from '../../constants';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.errorCode}>404</div>
      <h1 className={styles.title}>Page Not Found</h1>
      <p className={styles.desc}>
        The page you are looking for doesn't exist, was moved, or has an outdated link.
      </p>
      <div className={styles.btnGroup}>
        <Link to={ROUTES.HOME}>
          <Button variant="primary" leftIcon={<Home size={16} />}>
            Back to Home
          </Button>
        </Link>
        <Link to={ROUTES.EXPLORE}>
          <Button variant="secondary" leftIcon={<Search size={16} />}>
            Explore Resources
          </Button>
        </Link>
      </div>
    </div>
  );
}
