import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen, UserCheck, ArrowRight, ShieldCheck, Mail, Lock, User,
  Eye, EyeOff, UserPlus, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { ROUTES } from '../../constants';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';
import { getErrorMessage } from '../../api/client';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'tutor' ? 'tutor' : 'student';
  const { user, register: registerUser } = useAuth();

  const [role, setRole] = useState<'student' | 'tutor'>(initialRole);

  // Manual Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyExistsError, setAlreadyExistsError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'tutor' || roleParam === 'student') {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleRoleChange = (newRole: 'student' | 'tutor') => {
    setRole(newRole);
    setSearchParams({ role: newRole });
    setErrors({});
    setAlreadyExistsError(null);
  };

  const validateManualForm = () => {
    const errs: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errs.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm password is required';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlreadyExistsError(null);

    if (!validateManualForm()) return;

    try {
      setSubmitting(true);
      const newUser = await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      if (role === 'tutor') {
        toast.success(`Welcome to StudyBuddy, ${newUser.name}! Your educator account has been created.`);
        navigate(ROUTES.HOME, { replace: true });
      } else {
        toast.success(`Welcome to StudyBuddy, ${newUser.name}! Account created successfully.`);
        navigate(ROUTES.HOME, { replace: true });
      }
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Failed to create account. Please try again.');
      toast.error(msg);
      if (msg.toLowerCase().includes('already exist')) {
        setAlreadyExistsError(msg);
        setErrors((prev) => ({ ...prev, email: msg }));
      } else if (msg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: msg }));
      }
    } finally {
      setSubmitting(false);
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
          <h1 className={styles.title}>
            {role === 'tutor' ? 'Join as an Educator' : 'Create your account'}
          </h1>
          <p className={styles.subtitle}>
            {role === 'tutor'
              ? 'Register to start teaching, creating courses, and earning on StudyBuddy'
              : 'Join thousands of students and learners worldwide'}
          </p>
        </div>

        {/* If user is already logged in, show quick navigation */}
        {user ? (
          <div style={{
            background: 'var(--color-primary-50, rgba(37,99,235,0.06))',
            border: '1.5px solid var(--color-primary-200, #bfdbfe)',
            borderRadius: 'var(--radius-xl, 16px)',
            padding: 'var(--space-6)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--color-primary-100, #dbeafe)',
              color: 'var(--color-primary-600, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}>
              <UserCheck size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 4px', color: 'var(--color-gray-900)' }}>
                You are already logged in
              </h2>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', margin: 0 }}>
                Signed in as <strong>{user.name}</strong> ({user.email}) &bull; Role: <strong style={{ textTransform: 'capitalize' }}>{user.role}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              {user.role === 'tutor' ? (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => navigate(ROUTES.TUTOR_PROFILE_EDIT)}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Go to Profile & Send Application
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => navigate(ROUTES.HOME)}
                  >
                    Go to Home Page
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => navigate(ROUTES.HOME)}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Go to Home Page
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => navigate(ROUTES.STUDENT_DASHBOARD)}
                  >
                    Go to Student Dashboard
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.form}>
            {/* Role Selector (Compact Student vs Tutor) */}
            <div>
              <p style={{ fontSize: 'var(--font-size-xs, 12px)', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: 6 }}>
                I AM JOINING AS A
              </p>
              <div className={styles.roleSelector}>
                <button
                  type="button"
                  className={`${styles.roleCard} ${role === 'student' ? styles.roleCardActive : ''}`}
                  onClick={() => handleRoleChange('student')}
                >
                  <span className={styles.roleEmoji}>🎓</span>
                  <div className={styles.roleTextGroup}>
                    <span className={styles.roleLabel}>Student</span>
                    <span className={styles.roleDesc}>I want to learn</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`${styles.roleCard} ${role === 'tutor' ? styles.roleCardActive : ''}`}
                  onClick={() => handleRoleChange('tutor')}
                >
                  <span className={styles.roleEmoji}>👨‍🏫</span>
                  <div className={styles.roleTextGroup}>
                    <span className={styles.roleLabel}>Tutor</span>
                    <span className={styles.roleDesc}>I want to teach</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Direct Registration Form */}
            <form onSubmit={handleManualRegister} className={styles.form} noValidate>
              {role === 'tutor' && (
                <div className={styles.tutorNoteBox}>
                  <ShieldCheck size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    <strong>Educator Registration:</strong> Register now with your name and password. You can add your degree and certificates in your profile to complete your verification.
                  </span>
                </div>
              )}

              {/* Full Name */}
              <Input
                label="Full Name"
                type="text"
                id="register-name"
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={errors.name}
                leftIcon={<User size={16} />}
                autoComplete="name"
                disabled={submitting}
              />

              {/* Email Address */}
              <Input
                label="Email Address"
                type="email"
                id="register-email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={errors.email}
                leftIcon={<Mail size={16} />}
                autoComplete="email"
                disabled={submitting}
              />

              {/* Password */}
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="register-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={errors.password}
                helper={!errors.password ? 'Must be at least 8 characters' : undefined}
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
                autoComplete="new-password"
                disabled={submitting}
              />

              {/* Confirm Password */}
              <div>
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="register-confirm-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  error={errors.confirmPassword}
                  leftIcon={<Lock size={16} />}
                  rightIcon={
                    <button
                      type="button"
                      className={styles.passwordToggleBtn}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  autoComplete="new-password"
                  disabled={submitting}
                />

                {/* Password match feedback */}
                {confirmPassword.length > 0 && !errors.confirmPassword && (
                  password === confirmPassword ? (
                    <div className={`${styles.passwordMatchNote} ${styles.passwordMatchSuccess}`}>
                      <CheckCircle2 size={13} />
                      <span>Passwords match</span>
                    </div>
                  ) : (
                    <div className={`${styles.passwordMatchNote} ${styles.passwordMatchError}`}>
                      <AlertCircle size={13} />
                      <span>Passwords do not match</span>
                    </div>
                  )
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={submitting}
                leftIcon={<UserPlus size={18} />}
              >
                {role === 'tutor' ? 'Create Educator Account' : 'Create Student Account'}
              </Button>

              {/* Second Choice: Google Authentication */}
              <div className={styles.divider}>OR REGISTER WITH GOOGLE</div>

              <GoogleLoginButton
                role={role}
                mode="register"
                text="signup_with"
                className={styles.primaryGoogleBtn}
                onSuccess={(newUser) => {
                  toast.success(`Welcome to StudyBuddy, ${newUser.name}!`);
                  navigate(ROUTES.HOME, { replace: true });
                }}
                onError={(msg, _isUnregistered, isAlreadyExists) => {
                  if (isAlreadyExists) {
                    setAlreadyExistsError(msg);
                  }
                }}
              />

              {/* Already Registered error alert banner */}
              {alreadyExistsError && (
                <div className={styles.unregisteredBox}>
                  <AlertCircle size={20} className={styles.unregisteredIcon} color="#e11d48" />
                  <div className={styles.unregisteredContent}>
                    <div className={styles.unregisteredTitle}>Account Already Exists</div>
                    <p className={styles.unregisteredMessage}>{alreadyExistsError}</p>
                    <Link
                      to={`${ROUTES.LOGIN}?role=${role}`}
                      className={styles.registerNowBtn}
                    >
                      Sign in now →
                    </Link>
                  </div>
                </div>
              )}
            </form>

            <p className={styles.termsNotice} style={{ margin: 'var(--space-2) auto 0' }}>
              By creating an account, you agree to StudyBuddy's{' '}
              <a href="#" className={styles.termsLink}>Terms of Service</a> and{' '}
              <a href="#" className={styles.termsLink}>Privacy Policy</a>.
            </p>
          </div>
        )}

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to={`${ROUTES.LOGIN}?role=${role}`} className={styles.footerLink}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
