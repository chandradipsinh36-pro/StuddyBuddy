import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BookOpen, User, Mail, Lock, Eye, EyeOff, Upload, Video,
  FileCheck, X, ShieldAlert, Award, Briefcase, Plus
} from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Badge } from '../../components/ui/Badge/Badge';
import { ROUTES } from '../../constants';
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'student' | 'tutor'>('student');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Teaching subjects list with Add button
  const [subjectInput, setSubjectInput] = useState('');
  const [subjectsList, setSubjectsList] = useState<string[]>(['Mathematics']);

  const handleAddSubject = () => {
    const trimmed = subjectInput.trim();
    if (!trimmed) return;
    if (!subjectsList.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSubjectsList(prev => [...prev, trimmed]);
    }
    setSubjectInput('');
  };

  const handleRemoveSubject = (indexToRemove: number) => {
    setSubjectsList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: { role: 'student', trialVideoLink: '', highestQualification: '', experienceYears: '' },
  });

  const handleRoleChange = (newRole: 'student' | 'tutor') => {
    setRole(newRole);
    setValue('role', newRole);
    setFileError(null);
  };

  const ALLOWED_CERT_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isAllowed = (ext ? ALLOWED_CERT_EXTENSIONS.includes(ext) : false) || file.type === 'application/pdf' || file.type.startsWith('image/');

    if (!isAllowed) {
      setFileError('Only PDF and image files (PNG, JPG, JPEG) are allowed.');
      toast.error('Only PDF and image files are allowed for qualification certificate.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setFileError('File size must be under 15MB');
      return;
    }

    setCertificateFile(file);
    setFileError(null);
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onSubmit = async (data: FormData) => {
    if (role === 'tutor') {
      if (!certificateFile) {
        setFileError('Please upload your qualification certificate or diploma.');
        toast.error('Please upload your qualification certificate.');
        return;
      }
      const ext = certificateFile.name.split('.').pop()?.toLowerCase();
      const isAllowed = (ext ? ALLOWED_CERT_EXTENSIONS.includes(ext) : false) || certificateFile.type === 'application/pdf' || certificateFile.type.startsWith('image/');
      if (!isAllowed) {
        setFileError('Only PDF and image files (PNG, JPG, JPEG) are allowed.');
        toast.error('Only PDF and image files are allowed for qualification certificate.');
        return;
      }
      if (!data.trialVideoLink || !data.trialVideoLink.trim()) {
        toast.error('Please provide a trial video link.');
        return;
      }
    }

    try {
      let documentUrl: string | undefined;
      if (certificateFile) {
        documentUrl = await readFileAsDataUrl(certificateFile);
      }

      if (role === 'tutor') {
        let finalSubjects = [...subjectsList];
        const pendingInput = subjectInput.trim();
        if (pendingInput && !finalSubjects.some(s => s.toLowerCase() === pendingInput.toLowerCase())) {
          finalSubjects.push(pendingInput);
        }
        if (finalSubjects.length === 0) {
          toast.error('Please add at least one teaching subject.');
          return;
        }

        const authUser = await authService.register({
          name: data.name,
          email: data.email,
          password: data.password,
          role: 'tutor',
          trialVideoUrl: data.trialVideoLink?.trim() || undefined,
          highestQualification: data.highestQualification?.trim() || undefined,
          experienceYears: data.experienceYears ? Number(data.experienceYears) : undefined,
          documentUrl,
          subjects: finalSubjects,
        });

        // Store authenticated session
        setCurrentUser(authUser, authUser.token);

        toast.success(`Welcome to StudyBuddy, ${data.name}! Your tutor approval application has been sent to the admin.`);
        // Direct redirect to Tutor Dashboard, NOT login page
        navigate(ROUTES.TUTOR_DASHBOARD, { replace: true });
      } else {
        const authUser = await authService.register({
          name: data.name,
          email: data.email,
          password: data.password,
          role: 'student',
        });

        // Store authenticated session
        setCurrentUser(authUser, authUser.token);

        toast.success(`Welcome to StudyBuddy, ${data.name}! Your account has been created.`);
        // Direct redirect to Student Dashboard, NOT login page
        navigate(ROUTES.STUDENT_DASHBOARD, { replace: true });
      }
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || 'Registration failed. Please try again.';
      toast.error(message);
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
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Repeat your password"
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
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
                  accept=".pdf,image/*,.png,.jpg,.jpeg,.webp"
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
                      Supports PDF and Images (PNG, JPG) up to 15MB
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
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-700)', marginBottom: 'var(--space-1)', display: 'block' }}>
                  Teaching Subjects *
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      type="text"
                      placeholder="Type a subject and click Add (e.g. Mathematics)"
                      leftIcon={<BookOpen size={16} />}
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubject();
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddSubject}
                    style={{ height: 40, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={16} />
                    <span>Add</span>
                  </Button>
                </div>

                {/* Added subject tags */}
                {subjectsList.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    {subjectsList.map((subj, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          backgroundColor: 'var(--color-primary-50)',
                          border: '1px solid var(--color-primary-200)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 600,
                          color: 'var(--color-primary-700)',
                        }}
                      >
                        {subj}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--color-primary-500)',
                          }}
                          title={`Remove ${subj}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--space-1)' }}>
                  Type a subject and click Add to include multiple teaching disciplines.
                </p>
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

