import { useState, useEffect, useRef } from 'react';
import {
  Save, Award, Video, Briefcase, CheckCircle2, Clock,
  AlertCircle, FileCheck, Upload, X, Send, Sparkles, ShieldCheck
} from 'lucide-react';
import { tutorService } from '../../services/tutorService';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Button } from '../../components/ui/Button/Button';
import { DegreeSelect, SubjectMultiSelect } from '../../components/ui';
import { isSafeEducationalContent } from '../../utils/contentModeration';
import toast from 'react-hot-toast';
import styles from './TutorProfileEditPage.module.css';

const ALLOWED_CERT_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];

export function TutorProfileEditPage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('1');
  const [trialVideoUrl, setTrialVideoUrl] = useState('');
  const [degrees, setDegrees] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  // Certificate document states
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [existingDoc, setExistingDoc] = useState<{ docId?: number; documentUrl: string; documentType?: string } | null>(null);

  // Application verification states
  const [applicationStatus, setApplicationStatus] = useState<string>('none');
  const [adminNote, setAdminNote] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const isApproved = applicationStatus === 'approved' || isVerified;
  const isPending = applicationStatus === 'pending' || applicationStatus === 'under_review';
  const isRejected = applicationStatus === 'rejected';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const t: any = await tutorService.getMyProfile();
        if (t) {
          setName(t.name || user?.name || '');
          setBio(t.bio || '');
          const expYears = Number(t.experienceYears ?? t.experience ?? 0);
          setExperience(expYears > 2 ? String(expYears) : '');
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

          // Populate degrees from instituteName or existing qualifications (strictly exclude generic placeholders like 'Educator')
          const PLACEHOLDER_INSTITUTES = ['educator', 'independent educator', 'affiliated educational institution'];
          if (t.instituteName && typeof t.instituteName === 'string') {
            const parsedDegrees = t.instituteName
              .split(/,\s*/)
              .map((d: string) => d.trim())
              .filter((d: string) => Boolean(d) && !PLACEHOLDER_INSTITUTES.includes(d.toLowerCase()));
            setDegrees(parsedDegrees);
          } else {
            setDegrees([]);
          }

          // Populate existing certificate document if available
          const appDocs = t.application?.documents;
          if (Array.isArray(appDocs) && appDocs.length > 0) {
            setExistingDoc(appDocs[0]);
          }

          // Populate subjects from skills or tutor profile
          if (Array.isArray(t.skills) && t.skills.length > 0) {
            const skillNames = t.skills.map((s: any) => s.skillName || s.name || String(s)).filter(Boolean);
            setSubjects(skillNames);
          } else if (Array.isArray(t.subjects) && t.subjects.length > 0) {
            setSubjects(t.subjects);
          }
        } else if (user) {
          setName(user.name || '');
        }
      } catch (err) {
        console.error('Error fetching tutor profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isAllowed = (ext ? ALLOWED_CERT_EXTENSIONS.includes(ext) : false) || file.type === 'application/pdf' || file.type.startsWith('image/');

    if (!isAllowed) {
      toast.error('Only PDF and image files (PNG, JPG, JPEG, WebP) are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Certificate file size must be under 15MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setCertificateFile(file);
    if (formErrors.certificate) {
      setFormErrors(fe => ({ ...fe, certificate: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string | undefined> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Display name is required';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    const trimmedBio = bio.trim();
    if (!trimmedBio) {
      errors.bio = 'Instructor biography is required';
    } else if (trimmedBio.length < 15) {
      errors.bio = 'Biography must be at least 15 characters long';
    } else {
      const bioSafety = isSafeEducationalContent(trimmedBio);
      if (!bioSafety.isSafe) {
        errors.bio = bioSafety.reason || 'Biography contains inappropriate or restricted content';
      }
    }

    const expNum = parseInt(experience, 10);
    if (isNaN(expNum) || expNum <= 2) {
      errors.experience = 'Teaching experience must be greater than 2 years (minimum 3 years required for tutor application)';
    } else if (expNum > 60) {
      errors.experience = 'Please enter a valid number of years of experience (max 60)';
    }

    const trimmedVideo = trialVideoUrl.trim();
    if (!trimmedVideo) {
      errors.trialVideoUrl = 'Demo / trial video URL is required for tutor application';
    } else if (!trimmedVideo.startsWith('http://') && !trimmedVideo.startsWith('https://')) {
      errors.trialVideoUrl = 'Video URL must begin with https:// or http:// (e.g. YouTube, Vimeo, Google Drive)';
    }

    if (degrees.length === 0) {
      errors.degrees = 'Please select or enter at least one degree or qualification';
    } else {
      for (const deg of degrees) {
        const degSafety = isSafeEducationalContent(deg);
        if (!degSafety.isSafe) {
          errors.degrees = `Inappropriate content detected in degree: "${deg}"`;
          break;
        }
      }
    }

    if (subjects.length === 0) {
      errors.subjects = 'Please select at least one primary subject you teach';
    } else {
      for (const subj of subjects) {
        const subjSafety = isSafeEducationalContent(subj);
        if (!subjSafety.isSafe) {
          errors.subjects = `Inappropriate content detected in subject: "${subj}"`;
          break;
        }
      }
    }

    // Certificate file check: required if neither a new file nor an existing doc is present
    if (!certificateFile && !existingDoc) {
      errors.certificate = 'Please upload your degree certificate, diploma, or transcripts';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPending) {
      toast.error('You cannot submit an application twice. Your application has already been submitted and is currently under admin review.');
      return;
    }

    if (isApproved) {
      setSaving(true);
      try {
        await tutorService.updateProfile({
          name: name.trim(),
          bio: bio.trim(),
          experience: parseInt(experience, 10) || 1,
          instituteName: degrees.join(', '),
          skills: subjects,
        });
        await refreshUser();
        toast.success('Instructor profile updated successfully!');
      } catch (err: any) {
        toast.error(err?.response?.data?.error?.message || 'Failed to update profile');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!validateForm()) {
      toast.error('Please complete all required application fields correctly.');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('bio', bio.trim());
      fd.append('experience', experience);
      fd.append('trialVideoUrl', trialVideoUrl.trim());

      const qualString = degrees.join(', ');
      fd.append('highestQualification', qualString);
      fd.append('instituteName', qualString);

      subjects.forEach((subj) => {
        fd.append('subjects', subj);
      });

      if (certificateFile) {
        fd.append('documents', certificateFile);
      }

      await tutorService.submitOnboarding(fd);

      setApplicationStatus('pending');
      if (certificateFile) {
        setExistingDoc({
          documentUrl: URL.createObjectURL(certificateFile),
          documentType: certificateFile.name,
        });
      }

      await refreshUser();
      toast.success('Tutor application submitted successfully! Our verification team has been notified.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submission error:', err);
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to submit tutor application. Please try again.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading tutor profile...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isApproved ? 'Instructor Public Profile' : 'Tutor Application & Profile'}
        </h1>
        <p className={styles.subtitle}>
          {isApproved
            ? 'Manage your public educator credentials, degrees, and teaching subjects visible to students.'
            : 'Fill out your qualifications, degree certificate, and demo video, then send your application for platform verification.'}
        </p>
      </div>

      {/* Application Status Banner */}
      {isApproved ? (
        <div className={`${styles.statusBanner} ${styles.statusBannerApproved}`}>
          <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className={styles.statusBannerTitle}>
              Tutor Status: Approved & Verified
            </div>
            <div className={styles.statusBannerDesc}>
              Congratulations! Your tutor application has been approved by the platform administration. Your verified instructor profile and courses are publicly visible to students.
            </div>
          </div>
        </div>
      ) : isRejected ? (
        <div className={`${styles.statusBanner} ${styles.statusBannerRejected}`}>
          <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className={styles.statusBannerTitle}>
              Tutor Application Status: Rejected by Admin
            </div>
            <div className={styles.statusBannerDesc}>
              {adminNote ? `Admin Feedback: "${adminNote}"` : 'Your previous application was not approved.'} You can update your qualifications, certificate document, or trial demo video below and click <strong>Resubmit Tutor Application</strong>.
            </div>
          </div>
        </div>
      ) : isPending ? (
        <div className={`${styles.statusBanner} ${styles.statusBannerPending}`}>
          <Clock size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className={styles.statusBannerTitle}>
              Tutor Application Status: Pending Admin Review
            </div>
            <div className={styles.statusBannerDesc}>
              Your tutor application and credentials have been submitted and are in the verification queue. Our academic team reviews demo videos and degree certificates within 24–48 hours. <strong>Your application is currently locked and cannot be submitted again while under review.</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${styles.statusBanner} ${styles.statusBannerReady}`}>
          <Sparkles size={24} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className={styles.statusBannerTitle}>
              Action Required: Send Application for Becoming Tutor
            </div>
            <div className={styles.statusBannerDesc}>
              You are registered as a tutor! Complete your teaching experience, degrees, upload your qualification certificate, and click <strong>Send Application for Becoming Tutor</strong> below to get verified.
            </div>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <form onSubmit={handleSendApplication} className={styles.form} noValidate>
          {/* Section 1: Basic Information */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <ShieldCheck size={18} color="var(--color-primary-600)" />
                Personal &amp; Professional Info
              </h2>
              <p className={styles.sectionSubtitle}>
                Your public educator identity and professional bio shown to students.
              </p>
            </div>

            <Input
              label="Display Name *"
              value={name}
              placeholder="e.g. Dr. Jane Smith"
              disabled={isPending}
              onChange={(e) => {
                setName(e.target.value);
                if (formErrors.name) setFormErrors(fe => ({ ...fe, name: undefined }));
              }}
              error={formErrors.name}
              required
            />

            <Textarea
              label="Instructor Biography &amp; Teaching Philosophy *"
              placeholder="Describe your background, teaching philosophy, specialization, and student successes..."
              value={bio}
              disabled={isPending}
              onChange={(e) => {
                setBio(e.target.value);
                if (formErrors.bio) setFormErrors(fe => ({ ...fe, bio: undefined }));
              }}
              error={formErrors.bio}
              rows={4}
              required
            />
          </div>

          {/* Section 2: Experience & Demo Video */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Briefcase size={18} color="var(--color-primary-600)" />
                Teaching Experience &amp; Trial Video
              </h2>
              <p className={styles.sectionSubtitle}>
                Share your years of instruction and an accessible demo teaching video link.
              </p>
            </div>

            <div className={styles.row}>
              <Input
                label="Years of Teaching Experience * (Must be > 2 years)"
                type="number"
                min="3"
                max="60"
                value={experience}
                disabled={isPending}
                placeholder="e.g. 3"
                onChange={(e) => {
                  setExperience(e.target.value);
                  if (formErrors.experience) setFormErrors(fe => ({ ...fe, experience: undefined }));
                }}
                error={formErrors.experience}
                leftIcon={<Briefcase size={16} />}
                helper="Teaching experience must be greater than 2 years (minimum 3 years required for tutor application)"
                required
              />

              <Input
                label="Trial / Demo Video URL *"
                type="url"
                value={trialVideoUrl}
                disabled={isPending}
                placeholder="https://www.youtube.com/watch?v=... or Google Drive link"
                onChange={(e) => {
                  setTrialVideoUrl(e.target.value);
                  if (formErrors.trialVideoUrl) setFormErrors(fe => ({ ...fe, trialVideoUrl: undefined }));
                }}
                error={formErrors.trialVideoUrl}
                leftIcon={<Video size={16} />}
                helper="Provide a 2–5 min public demo lesson link for admin verification"
                required
              />
            </div>
          </div>

          {/* Section 3: Degrees & Qualifications */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Award size={18} color="var(--color-primary-600)" />
                Degrees &amp; Qualifications *
              </h2>
              <p className={styles.sectionSubtitle}>
                Select recognized university degrees or type your exact accredited specialization.
              </p>
            </div>

            <DegreeSelect
              label="Degrees &amp; Academic Qualifications *"
              selectedDegrees={degrees}
              disabled={isPending}
              onChange={(newDegrees: string[]) => {
                const clean = newDegrees.filter((d) => isSafeEducationalContent(d).isSafe);
                setDegrees(clean);
                if (clean.length > 0 && formErrors.degrees) {
                  setFormErrors(fe => ({ ...fe, degrees: undefined }));
                }
              }}
              error={formErrors.degrees}
              helper="Search 150+ degree types or type your custom degree with academic prefix (e.g. B.Tech, M.Sc, Ph.D.)"
            />
          </div>

          {/* Section 4: Degree Certificate Document Upload */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FileCheck size={18} color="var(--color-primary-600)" />
                Qualification Certificate Document *
              </h2>
              <p className={styles.sectionSubtitle}>
                Upload official transcripts, degree diploma, or professional credentials for verification.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*,.png,.jpg,.jpeg,.webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {certificateFile ? (
              <div className={styles.filePreviewChip}>
                <div className={styles.fileInfo}>
                  <FileCheck size={18} color="var(--color-success, #16a34a)" />
                  <span>
                    <strong>{certificateFile.name}</strong> ({(certificateFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                {!isPending && (
                  <div className={styles.fileActions}>
                    <button
                      type="button"
                      className={styles.fileRemoveBtn}
                      onClick={() => {
                        setCertificateFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      title="Remove selected certificate"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : existingDoc ? (
              <div className={styles.filePreviewChip}>
                <div className={styles.fileInfo}>
                  <FileCheck size={18} color="var(--color-success, #16a34a)" />
                  <span>
                    <strong>{isPending ? 'Degree Certificate Submitted & Under Review' : 'Verified Certificate Attached'}</strong> &bull; {existingDoc.documentType || 'qualification_certificate'}
                  </span>
                </div>
                {!isPending && (
                  <div className={styles.fileActions}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace Certificate
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`${styles.uploadBox} ${isPending ? styles.disabledUploadBox : ''}`}
                onClick={() => {
                  if (!isPending) fileInputRef.current?.click();
                }}
                role="button"
                tabIndex={0}
              >
                <Upload size={28} color="var(--color-primary-500, #2563eb)" />
                <span className={styles.uploadPrompt}>
                  {isPending
                    ? 'Certificate submission locked while application is under review'
                    : 'Click to upload qualification certificate or diploma'}
                </span>
                <span className={styles.uploadSub}>
                  Supports PDF and Images (PNG, JPG, JPEG, WebP) up to 15MB
                </span>
              </div>
            )}

            {formErrors.certificate && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-error, #ef4444)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={14} /> {formErrors.certificate}
              </p>
            )}
          </div>

          {/* Section 5: Teaching Subjects & Disciplines */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Award size={18} color="var(--color-primary-600)" />
                Teaching Subjects &amp; Disciplines *
              </h2>
              <p className={styles.sectionSubtitle}>
                Select the subjects, programming languages, and disciplines you are qualified to teach.
              </p>
            </div>

            <SubjectMultiSelect
              label="Teaching Subjects &amp; Disciplines *"
              selectedSubjects={subjects}
              disabled={isPending}
              onChange={(newSubjects) => {
                const clean = newSubjects.filter((s) => isSafeEducationalContent(s).isSafe);
                setSubjects(clean);
                if (clean.length > 0 && formErrors.subjects) {
                  setFormErrors(fe => ({ ...fe, subjects: undefined }));
                }
              }}
              error={formErrors.subjects}
              helper="Select from all recognized disciplines or search 65,000+ global topics via OpenAlex"
            />
          </div>

          {/* Action Bar */}
          <div className={styles.actionBar}>
            <div className={styles.actionNote}>
              {isApproved
                ? 'Your profile is approved. Changes to biography and subjects are updated immediately.'
                : isPending
                ? 'Your tutor application has already been submitted and is currently under review. Submitting duplicate applications is disabled.'
                : isRejected
                ? 'Please update your details according to the admin feedback above and resubmit your application.'
                : 'Submitting your application places your credentials in the administrator verification queue for fast-track 24–48h review.'}
            </div>

            <Button
              type="submit"
              variant={isPending ? 'secondary' : 'primary'}
              size="lg"
              disabled={isPending || saving}
              isLoading={saving}
              leftIcon={
                isApproved ? (
                  <Save size={18} />
                ) : isPending ? (
                  <Clock size={18} />
                ) : (
                  <Send size={18} />
                )
              }
              title={isPending ? 'Application already submitted and currently under review' : undefined}
            >
              {isApproved
                ? 'Save Profile Changes'
                : isPending
                ? 'Application Already Submitted (Under Review)'
                : isRejected
                ? 'Resubmit Tutor Application'
                : 'Send Application for Becoming Tutor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
