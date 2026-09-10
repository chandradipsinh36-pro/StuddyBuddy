import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { ROUTES } from '../../constants';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link to={ROUTES.HOME} className={styles.logo}>
              <BookOpen size={20} />
              StudyBuddy
            </Link>
            <p className={styles.tagline}>
              Making quality education accessible, safe & trustworthy for everyone.
            </p>
            <div className={styles.social}>
              <a href="#" aria-label="Twitter" className={styles.socialLink}>Twitter</a>
              <a href="#" aria-label="LinkedIn" className={styles.socialLink}>LinkedIn</a>
              <a href="#" aria-label="Instagram" className={styles.socialLink}>Instagram</a>
              <a href="#" aria-label="YouTube" className={styles.socialLink}>YouTube</a>
            </div>
          </div>

          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkHeading}>Learn</h4>
              <Link to={ROUTES.EXPLORE} className={styles.link}>Explore</Link>
              <Link to={ROUTES.COURSES} className={styles.link}>Courses</Link>
              <Link to={ROUTES.BUNDLES} className={styles.link}>Study Bundles</Link>
              <Link to={ROUTES.PLAYLISTS} className={styles.link}>Playlists</Link>
            </div>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkHeading}>Tutors</h4>
              <Link to={ROUTES.TUTORS} className={styles.link}>Find Tutors</Link>
              <Link to={ROUTES.REGISTER} className={styles.link}>Become a Tutor</Link>
              <Link to={ROUTES.TUTOR_DASHBOARD} className={styles.link}>Tutor Dashboard</Link>
            </div>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkHeading}>Company</h4>
              <a href="#" className={styles.link}>About Us</a>
              <a href="#" className={styles.link}>Blog</a>
              <a href="#" className={styles.link}>Careers</a>
              <a href="#" className={styles.link}>Contact</a>
            </div>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkHeading}>Legal</h4>
              <a href="#" className={styles.link}>Privacy Policy</a>
              <a href="#" className={styles.link}>Terms of Service</a>
              <a href="#" className={styles.link}>Cookie Policy</a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>© {new Date().getFullYear()} StudyBuddy. All rights reserved.</p>
          <div className={styles.bottomLinks}>
            <a href="#" className={styles.link}>Privacy</a>
            <a href="#" className={styles.link}>Terms</a>
            <a href="#" className={styles.link}>Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
