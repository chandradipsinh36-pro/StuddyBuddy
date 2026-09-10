import { useState, useEffect } from 'react';
import { Save, Award, Video, Briefcase, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { tutorService } from '../../services/tutorService';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Button } from '../../components/ui/Button/Button';
import { SUBJECTS } from '../../constants';
import toast from 'react-hot-toast';
import styles from './TutorProfileEditPage.module.css';

export function TutorProfileEditPage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('0');
  const [trialVideoUrl, setTrialVideoUrl] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [skills, setSkills] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<string>('none');
  const [adminNote, setAdminNote] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    bio?: string;
    experience?: string;
    trialVideoUrl?: string;
    subjects?: string;
  }>({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const t: any = await tutorService.getMyProfile();
        if (t) {
          setName(t.name || user?.name || '');
          setBio(t.bio || '');
          setExperience(String(t.experienceYears ?? t.experience ?? 0));
          setTrialVideoUrl(
            t.trialVideoUrl ||
            (typeof t.trialVideo === 'object' ? t.trialVideo?.videoUrl : t.trialVideo) ||
            t.application?.trialVideoUrl ||
            ''
          );
          setApplicationStatus(t.applicationStatus || t.application?.status || (t.isVerified ? 'approved' : 'none'));
          setIsVerified(Boolean(t.isVerified));
          if (t.application?.adminNote) {
            setAdminNote(t.application.adminNote);
          }
          if (Array.isArray(t.skills) && t.skills.length > 0) {
            const skillNames = t.skills.map((s: any) => s.skillName || s.name || String(s));
            setSkills(skillNames.join(', '));
            setSubjects(skillNames.filter((s: string) => (SUBJECTS as readonly string[]).includes(s)));
          } else if (t.subjects && t.subjects.length > 0) {
            setSubjects(t.subjects);
          }
        } else if (user) {
          setName(user.name || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const toggleSubject = (s: string) => {
    setSubjects(prev => {
      const next = prev.includes(s)
        ? prev.length > 1 ? prev.filter(x => x !== s) : prev
        : [...prev, s];
      if (next.length > 0 && formErrors.subjects) {
        setFormErrors(fe => ({ ...fe, subjects: undefined }));
      }
      return next;
    });
  };

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    } else if (trimmedName.length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }

    const trimmedBio = bio.trim();
    if (!trimmedBio) {
      errors.bio = 'Instructor biography is required';
    } else if (trimmedBio.length < 20) {
      errors.bio = 'Biography must be at least 20 characters long to provide sufficient detail for students';
    } else if (trimmedBio.length > 3000) {
      errors.bio = 'Biography cannot exceed 3000 characters';
    }

    const expNum = parseInt(experience, 10);
    if (isNaN(expNum) || expNum < 0) {
      errors.experience = 'Experience cannot be negative';
    } else if (expNum > 60) {
      errors.experience = 'Please enter a valid number of years of experience (max 60)';
    }

    if (trialVideoUrl && trialVideoUrl.trim()) {
      const trimmedUrl = trialVideoUrl.trim();
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        errors.trialVideoUrl = 'Video URL must begin with https:// or http://';
      }
    }

    if (subjects.length === 0) {
      errors.subjects = 'Please select at least one primary subject you teach';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const allSkills = Array.from(new Set([
        ...skills.split(',').map(s => s.trim()).filter(Boolean),
        ...subjects,
      ]));

      const updated = await tutorService.updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        experience: parseInt(experience, 10) || 0,
        trialVideoUrl: trialVideoUrl.trim() || undefined,
        skills: allSkills,
        subjects,
      });

      if (updated) {
        setApplicationStatus(updated.applicationStatus || 'pending');
        if (updated.application?.adminNote) {
          setAdminNote(updated.application.adminNote);
        }
      }
      await refreshUser();
      toast.success('Instructor profile updated successfully!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Instructor Public Profile</h1>
        <p className={styles.subtitle}>
          This information is publicly visible to prospective students on your tutor directory page.
        </p>
      </div>

      {/* Application Status Banner */}
      {applicationStatus === 'approved' || isVerified ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: '16px 20px',
          backgroundColor: '#ECFDF5',
          border: '1px solid #10B981',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)',
          color: '#065F46',
        }}>
          <CheckCircle2 size={24} color="#10B981" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>
              Tutor Application Status: Approved & Verified
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 2, color: '#047857' }}>
              Your tutor application has been approved by the platform administration! Your instructor public profile is verified and prospective students can find you on the directory.
            </div>
          </div>
        </div>
      ) : applicationStatus === 'rejected' ? (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)',
          padding: '16px 20px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #EF4444',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)',
          color: '#991B1B',
        }}>
          <AlertCircle size={24} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>
              Tutor Application Status: Rejected by Admin
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 2, color: '#B91C1C' }}>
              {adminNote ? `Admin Feedback: "${adminNote}"` : 'Your previous application was not approved.'} You can update your biography, experience, and demo video below and click <strong>Save Profile Changes</strong> to re-submit for review.
            </div>
          </div>
        </div>
      ) : applicationStatus === 'pending' || applicationStatus === 'under_review' ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: '16px 20px',
          backgroundColor: '#FFFBEB',
          border: '1px solid #F59E0B',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)',
          color: '#92400E',
        }}>
          <Clock size={24} color="#F59E0B" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>
              Tutor Application Status: Pending Admin Review
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 2, color: '#B45309' }}>
              Your tutor application has been submitted and is in the administration verification queue. Our team reviews trial videos and credentials daily.
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: '16px 20px',
          backgroundColor: '#EFF6FF',
          border: '1px solid #3B82F6',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)',
          color: '#1E40AF',
        }}>
          <AlertCircle size={24} color="#3B82F6" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>
              Tutor Application Status: Ready for Submission
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 2, color: '#1D4ED8' }}>
              Complete your profile biography, years of teaching experience, and demo video URL below, then click <strong>Save Profile Changes</strong> to submit your application for review.
            </div>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <form onSubmit={handleSave} className={styles.form} noValidate>
          <Input
            label="Display Name *"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (formErrors.name) setFormErrors(fe => ({ ...fe, name: undefined }));
            }}
            error={formErrors.name}
            required
          />

          <Textarea
            label="Instructor Biography & Teaching Philosophy *"
            placeholder="Share your teaching philosophy, educational background, methodology, and student successes..."
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              if (formErrors.bio) setFormErrors(fe => ({ ...fe, bio: undefined }));
            }}
            error={formErrors.bio}
            rows={4}
            required
          />

          <div className={styles.row}>
            <Input
              label="Years of Teaching Experience"
              type="number"
              min="0"
              max="60"
              value={experience}
              onChange={(e) => {
                setExperience(e.target.value);
                if (formErrors.experience) setFormErrors(fe => ({ ...fe, experience: undefined }));
              }}
              error={formErrors.experience}
              leftIcon={<Briefcase size={16} />}
            />

            <Input
              label="Demo / Trial Video URL"
              type="url"
              value={trialVideoUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={(e) => {
                setTrialVideoUrl(e.target.value);
                if (formErrors.trialVideoUrl) setFormErrors(fe => ({ ...fe, trialVideoUrl: undefined }));
              }}
              error={formErrors.trialVideoUrl}
              leftIcon={<Video size={16} />}
            />
          </div>

          <Input
            label="Core Skills & Topics (Comma separated)"
            placeholder="Calculus, Linear Algebra, Probability, Statistics"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            leftIcon={<Award size={16} />}
          />

          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-700)' }}>
              Primary Subjects Taught * (Click to select)
            </label>
            {formErrors.subjects && (
              <p style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600, marginTop: 4, marginBottom: 6 }}>
                {formErrors.subjects}
              </p>
            )}
            <div className={styles.subjectsGrid}>
              {SUBJECTS.map(subj => {
                const active = subjects.includes(subj);
                return (
                  <button
                    key={subj}
                    type="button"
                    className={`${styles.subjectChip} ${active ? styles.subjectChipActive : ''}`}
                    onClick={() => toggleSubject(subj)}
                  >
                    {active ? '✓ ' : '+ '} {subj}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
            <Button type="submit" variant="primary" isLoading={saving} leftIcon={<Save size={16} />}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
