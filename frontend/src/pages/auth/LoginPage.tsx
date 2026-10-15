import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, AlertCircle, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';
import { getErrorMessage } from '../../api/client';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [unregisteredError, setUnregisteredError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || null;

  const handleSuccessRedirect = (user: any) => {
    const dest = from || (
      user.role === 'tutor'
        ? (!user.isVerified ? ROUTES.TUTOR_PROFILE_EDIT : ROUTES.TUTOR_DASHBOARD)
        : ROUTES.STUDENT_DASHBOARD
    );
    navigate(dest, { replace: true });
  };

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnregisteredError(null);

    if (!validate()) return;

    try {
      setLoading(true);
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.name}!`);
      handleSuccessRedirect(user);
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Invalid email or password');
      toast.error(msg);
      setErrors((prev) => ({ ...prev, password: msg }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to={ROUTES.HOME} className={styles.logo}>
            <BookOpen size={28} className={styles.logoIcon} />
            <span>StudyBuddy</span>
          </Link>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in with your email or Google account</p>
        </div>

        {/* Option 1: Manual Email & Password Login */}
        <form onSubmit={handleManualLogin} className={styles.form} noValidate>
          <Input
            label="Email Address"
            type="email"
            id="login-email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            leftIcon={<Mail size={16} />}
            autoComplete="email"
            disabled={loading}
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="login-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  className={styles.passwordToggleBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="current-password"
              disabled={loading}
            />

            <div className={styles.forgotRow}>
              <Link to={ROUTES.FORGOT_PASSWORD} className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={loading}
            leftIcon={<LogIn size={18} />}
          >
            Sign In with Email
          </Button>
        </form>

        {/* Divider */}
        <div className={styles.divider}>OR CONTINUE WITH GOOGLE</div>

        {/* Option 2: Google Authentication */}
        <div className={styles.googleRegisterContainer}>
          <GoogleLoginButton
            mode="login"
            text="signin_with"
            className={styles.primaryGoogleBtn}
            onSuccess={handleSuccessRedirect}
            onError={(msg, isUnregistered) => {
              if (isUnregistered) {
                setUnregisteredError(msg);
              }
            }}
          />

          <p className={styles.termsNotice}>
            Safe and encrypted authentication powered by Google.
          </p>
        </div>

        {/* Unregistered error message banner */}
        {unregisteredError && (
          <div className={styles.unregisteredBox}>
            <AlertCircle size={20} className={styles.unregisteredIcon} color="#e11d48" />
            <div className={styles.unregisteredContent}>
              <div className={styles.unregisteredTitle}>Account Not Registered</div>
              <p className={styles.unregisteredMessage}>{unregisteredError}</p>
              <Link
                to={ROUTES.REGISTER}
                className={styles.registerNowBtn}
              >
                Register now →
              </Link>
            </div>
          </div>
        )}

        <p className={styles.footer}>
          Don't have an account?{' '}
          <Link to={ROUTES.REGISTER} className={styles.footerLink}>
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}
