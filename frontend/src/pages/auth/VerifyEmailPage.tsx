import { Link } from 'react-router-dom';
import { BookOpen, Mail, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { ROUTES } from '../../constants';
import styles from './Auth.module.css';

export function VerifyEmailPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to={ROUTES.HOME} className={styles.logo}>
            <BookOpen size={28} className={styles.logoIcon} />
            <span>StudyBuddy</span>
          </Link>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={28} color="var(--color-primary-500)" />
          </div>
          <h1 className={styles.title}>Check your email</h1>
          <p className={styles.subtitle}>
            We've sent a verification link to your email address. Click the link to activate your account.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', textAlign: 'center' }}>
          <div style={{ background: 'var(--color-success-light)', border: '1px solid #6EE7B7', borderRadius: 'var(--radius-base)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <CheckCircle size={20} color="var(--color-success)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 'var(--font-size-sm)', color: '#065F46' }}>Verification email sent! Check your spam folder if you don't see it.</p>
          </div>
          <Link to={ROUTES.LOGIN}>
            <Button variant="primary" fullWidth>Back to Sign In</Button>
          </Link>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
            Didn't receive it?{' '}
            <button style={{ color: 'var(--color-primary-500)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Resend email</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to={ROUTES.HOME} className={styles.logo}>
            <BookOpen size={28} className={styles.logoIcon} />
            <span>StudyBuddy</span>
          </Link>
          <h1 className={styles.title}>Reset your password</h1>
          <p className={styles.subtitle}>Enter your email and we'll send you a reset link.</p>
        </div>
        <div className={styles.form}>
          <input
            type="email"
            placeholder="you@example.com"
            style={{ width: '100%', padding: '10px 16px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-base)', fontSize: 'var(--font-size-sm)' }}
          />
          <Button fullWidth size="lg">Send Reset Link</Button>
          <p className={styles.footer}>
            <Link to={ROUTES.LOGIN} className={styles.footerLink}>← Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to={ROUTES.HOME} className={styles.logo}>
            <BookOpen size={28} className={styles.logoIcon} />
            <span>StudyBuddy</span>
          </Link>
          <h1 className={styles.title}>Create new password</h1>
          <p className={styles.subtitle}>Choose a strong password for your account.</p>
        </div>
        <div className={styles.form}>
          <input type="password" placeholder="New password" style={{ width: '100%', padding: '10px 16px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-base)', fontSize: 'var(--font-size-sm)' }} />
          <input type="password" placeholder="Confirm new password" style={{ width: '100%', padding: '10px 16px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-base)', fontSize: 'var(--font-size-sm)' }} />
          <Button fullWidth size="lg">Reset Password</Button>
        </div>
      </div>
    </div>
  );
}
