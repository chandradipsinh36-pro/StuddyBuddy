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
              <div className={styles.logoBadge}>
                <BookOpen size={20} />
              </div>
              <span className={styles.logoText}>StudyBuddy</span>
            </Link>
            <p className={styles.tagline}>
              Making quality education accessible, safe & trustworthy for everyone across the globe.
            </p>
            <div className={styles.social}>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (formerly Twitter)"
                className={styles.socialLink}
                title="Follow us on X"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className={styles.socialLink}
                title="Connect on LinkedIn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={styles.socialLink}
                title="Follow on Instagram"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className={styles.socialLink}
                title="Subscribe on YouTube"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkHeading}>Learn</h4>
              <Link to={ROUTES.EXPLORE} className={styles.link}>Explore Catalog</Link>
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
              <a href="#" className={styles.link}>Blog & Updates</a>
              <a href="#" className={styles.link}>Careers</a>
              <a href="#" className={styles.link}>Contact</a>
            </div>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkHeading}>Legal & Trust</h4>
              <a href="#" className={styles.link}>Privacy Policy</a>
              <a href="#" className={styles.link}>Terms of Service</a>
              <a href="#" className={styles.link}>Cookie Policy</a>
              <a href="#" className={styles.link}>Security Guidelines</a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <div className={styles.bottomLeft}>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} StudyBuddy Inc. All rights reserved.
            </p>
          </div>
          <div className={styles.bottomLinks}>
            <a href="#" className={styles.bottomLink}>Privacy Policy</a>
            <span className={styles.dot}>•</span>
            <a href="#" className={styles.bottomLink}>Terms of Service</a>
            <span className={styles.dot}>•</span>
            <a href="#" className={styles.bottomLink}>Trust & Safety</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
