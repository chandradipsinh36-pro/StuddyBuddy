import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { ROUTES } from '../../constants';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

const schema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address (e.g. you@example.com)'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const from = (location.state as any)?.from?.pathname || null;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      const user = JSON.parse(localStorage.getItem('sb_user') || '{}');
      const dest = from || (user.role === 'tutor' ? ROUTES.TUTOR_DASHBOARD : ROUTES.STUDENT_DASHBOARD);
      navigate(dest, { replace: true });
      toast.success('Welcome back!');
    } catch {
      toast.error('Invalid email or password. Please try again.');
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
          <p className={styles.subtitle}>Sign in to continue your learning journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail size={16} />}
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.password?.message}
            autoComplete="current-password"
            {...register('password')}
          />

          <div className={styles.forgotRow}>
            <Link to={ROUTES.FORGOT_PASSWORD} className={styles.forgotLink}>Forgot password?</Link>
          </div>

          <Button type="submit" isLoading={isSubmitting} fullWidth size="lg">
            Sign In
          </Button>
        </form>

        <div className={styles.divider}>
          <span>or try a demo account</span>
        </div>

        <div className={styles.demoButtons}>
          <button
            className={styles.demoBtn}
            onClick={() => { document.querySelector<HTMLInputElement>('[type=email]')!.value = 'student@demo.com'; }}
          >
            🎓 Student Demo
          </button>
          <button className={styles.demoBtn}>
            👨‍🏫 Tutor Demo
          </button>
        </div>

        <p className={styles.footer}>
          Don't have an account?{' '}
          <Link to={ROUTES.REGISTER} className={styles.footerLink}>Create account</Link>
        </p>
      </div>
    </div>
  );
}
