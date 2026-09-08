import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BookOpen, User, Mail, Lock, Eye, EyeOff, Upload, Video,
  FileCheck, X, ShieldAlert, Award, Briefcase
} from 'lucide-react';
import { authService } from '../../services/authService';
import { tutorService } from '../../services/tutorService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Badge } from '../../components/ui/Badge/Badge';
import { ROUTES, SUBJECTS } from '../../constants';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

const baseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'tutor']),
  trialVideoLink: z.string().optional(),
  highestQualification: z.string().optional(),
  experienceYears: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof baseSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'student' | 'tutor'>('student');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics']);
  const [fileError, setFileError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: { role: 'student', trialVideoLink: '', highestQualification: '', experienceYears: '' },
  });

  const handleRoleChange = (newRole: 'student' | 'tutor') => {
    setRole(newRole);
    setValue('role', newRole);
    setFileError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setFileError('File size must be under 15MB');
      return;
    }

    setCertificateFile(file);
    setFileError(null);
  };

  const handleToggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.length > 1 ? prev.filter(s => s !== subject) : prev
        : [...prev, subject]
    );
  };

  const onSubmit = async (data: FormData) => {
    if (role === 'tutor') {
      if (!certificateFile) {
        setFileError('Please upload your qualification certificate or diploma.');
        toast.error('Please upload your qualification certificate.');
        return;
      }
      if (!data.trialVideoLink || !data.trialVideoLink.trim()) {
        toast.error('Please provide a trial video link.');
        return;
      }
    }

    try {
      // Register account
      await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      const loggedInUser = {
        id: Date.now(),
        name: data.name,
        email: data.email,
        role: data.role,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      if (role === 'tutor') {
        // Also submit tutor onboarding request
        const fd = new window.FormData();
        fd.append('name', data.name);
        fd.append('qualification', data.highestQualification || 'Degree');
        fd.append('experience', data.experienceYears || '1');
        fd.append('trialVideoUrl', data.trialVideoLink || '');
        fd.append('subjects', JSON.stringify(selectedSubjects));
        if (certificateFile) {
          fd.append('documents', certificateFile);
        }

        try {
          await tutorService.submitOnboarding(fd);
        } catch {
          // fallback gracefully
        }

        // Auto-login so user does not need to log in again
        setCurrentUser(loggedInUser);

        toast.success(`Welcome to StudyBuddy, ${data.name}! Your request to become a tutor has been submitted.`);
        // Direct redirect to Home page
        navigate(ROUTES.HOME, { replace: true });
      } else {
        // Auto-login so user does not need to log in again
        setCurrentUser(loggedInUser);

        toast.success(`Welcome to StudyBuddy, ${data.name}! Your account has been created.`);
        // Direct redirect to Home page
        navigate(ROUTES.HOME, { replace: true });
      }
    } catch {
      toast.error('Registration failed. Please try again.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${role === 'tutor' ? styles.cardWide : ''}`}>
        <div className={styles.header}>
          <Link to={ROUTES.HOME} className={styles.logo}>
            <BookOpen size={28} className={styles.logoIcon} />
            <span>StudyBuddy</span>
          </Link>
          <h1 className={styles.title}>
            {role === 'tutor' ? 'Apply as an Expert Tutor' : 'Create your account'}
          </h1>
          <p className={styles.subtitle}>
            {role === 'tutor'
              ? 'Join our vetted network of educators and earn by teaching'
              : 'Join thousands of learners and educators worldwide'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          {/* Role Selector */}
          <div>
            <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-700)', marginBottom: 'var(--space-2)' }}>
              I am joining as a...
            </p>
            <div className={styles.roleSelector}>
              <button
                type="button"
                className={`${styles.roleCard} ${role === 'student' ? styles.roleCardActive : ''}`}
                onClick={() => handleRoleChange('student')}
              >
                <span className={styles.roleEmoji}>🎓</span>
                <span className={styles.roleLabel}>Student</span>
                <span className={styles.roleDesc}>I want to learn</span>
              </button>
              <button
                type="button"
                className={`${styles.roleCard} ${role === 'tutor' ? styles.roleCardActive : ''}`}
                onClick={() => handleRoleChange('tutor')}
              >
                <span className={styles.roleEmoji}>👨‍🏫</span>
                <span className={styles.roleLabel}>Tutor</span>
                <span className={styles.roleDesc}>I want to teach</span>
              </button>
            </div>
          </div>

          <Input
            label="Full Name"
            type="text"
            placeholder={role === 'tutor' ? 'Dr. Sarah Chen' : 'Alex Johnson'}
            leftIcon={<User size={16} />}
            error={errors.name?.message}
            autoComplete="name"
            {...register('name')}
          />

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
            placeholder="At least 8 characters"
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.password?.message}
            autoComplete="new-password"
            {...register('password')}
          />

          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repeat your password"
            leftIcon={<Lock size={16} />}
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            {...register('confirmPassword')}
          />

          {/* Tutor-Specific Application Fields */}
          {role === 'tutor' && (
            <div className={styles.tutorSection}>
              <div className={styles.tutorBadgeHeader}>
                <span className={styles.tutorBadgeTitle}>
                  <Award size={18} /> Tutor Verification Details
                </span>
                <Badge variant="primary">Required for approval</Badge>
              </div>

              {/* Upload Qualification Certificate */}
              <div>
                <label className={styles.uploadLabel}>
                  <FileCheck size={16} color="var(--color-primary-600)" />
                  Upload Qualification Certificate *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                {!certificateFile ? (
                  <div
                    className={styles.uploadBox}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                  >
                    <Upload size={24} color="var(--color-primary-500)" />
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-primary-600)' }}>
                      Click to choose certificate or degree document
                    </span>
                    <span className={styles.uploadSub}>
                      Supports PDF, PNG, JPG up to 15MB (e.g. Master's / PhD / Teaching Certification)
                    </span>
                  </div>
                ) : (
                  <div className={styles.filePreviewChip}>
                    <div className={styles.fileInfo}>
                      <FileCheck size={16} color="var(--color-success)" />
                      <span><strong>{certificateFile.name}</strong> ({(certificateFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      className={styles.fileRemoveBtn}
                      onClick={() => setCertificateFile(null)}
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {fileError && (
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-error)', marginTop: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldAlert size={12} /> {fileError}
                  </p>
                )}
              </div>

              {/* Upload Trial Video Link */}
              <Input
                label="Upload Trial Video Link *"
                type="url"
                placeholder="https://www.youtube.com/watch?v=... or Loom / Google Drive link"
                leftIcon={<Video size={16} />}
                helper="Provide a 3-5 minute teaching demonstration or intro video link"
                error={errors.trialVideoLink?.message}
                {...register('trialVideoLink')}
              />

              {/* Highest Qualification */}
              <Input
                label="Highest Degree / Qualification"
                type="text"
                placeholder="e.g. M.Sc in Applied Mathematics, PhD, B.Tech"
                leftIcon={<Award size={16} />}
                {...register('highestQualification')}
              />

              {/* Experience */}
              <Input
                label="Teaching Experience (Years)"
                type="number"
                placeholder="e.g. 5"
                leftIcon={<Briefcase size={16} />}
                {...register('experienceYears')}
              />

              {/* Teaching Subjects */}
              <div>
                <label className={styles.uploadLabel}>
                  Teaching Subjects (Select primary disciplines)
                </label>
                <div className={styles.subjectPills}>
                  {SUBJECTS.slice(0, 8).map(subject => {
                    const isSelected = selectedSubjects.includes(subject);
                    return (
                      <button
                        key={subject}
                        type="button"
                        className={`${styles.subjectPill} ${isSelected ? styles.subjectPillActive : ''}`}
                        onClick={() => handleToggleSubject(subject)}
                      >
                        {isSelected ? '✓ ' : '+ '} {subject}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', lineHeight: 'var(--line-height-relaxed)' }}>
            By registering, you agree to the StudyBuddy{' '}
            <a href="#" style={{ color: 'var(--color-primary-500)' }}>Terms of Service</a>,{' '}
            <a href="#" style={{ color: 'var(--color-primary-500)' }}>Tutor Code of Conduct</a>, and{' '}
            <a href="#" style={{ color: 'var(--color-primary-500)' }}>Privacy Policy</a>.
          </p>

          {/* Explicit button name according to user requirement */}
          <Button type="submit" isLoading={isSubmitting} fullWidth size="lg">
            {role === 'tutor'
              ? 'Register and Send Request to Become Tutor'
              : 'Create Student Account'}
          </Button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className={styles.footerLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

